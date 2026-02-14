/**
 * COVAS pipeline orchestrator — STT → LLM → Command → TTS
 */

import { sttService, textInputSTT } from './stt-service.js';
import { llmService } from './llm-service.js';
import { ttsService } from './tts-service.js';
import { commandExecutor } from './command-executor.js';
import { pttManager } from './ptt-manager.js';
import { wsManager } from '../websocket.js';
import { CovasPipelineStage } from '@vayu/shared';

export interface PipelineResult {
  inputText: string;
  responseText: string;
  intent: string | null;
  commandResult: { success: boolean; response: string; data?: unknown } | null;
  audioBase64: string | null;
  latency: {
    stt: number | null;
    llm: number;
    command: number | null;
    tts: number | null;
    total: number;
  };
}

class CovasPipeline {
  private stage: CovasPipelineStage = CovasPipelineStage.Idle;
  private enabled = true;

  getStage(): CovasPipelineStage {
    return this.stage;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.broadcastState();
  }

  private setStage(stage: CovasPipelineStage): void {
    this.stage = stage;
    this.broadcastState();
  }

  private broadcastState(): void {
    wsManager.broadcast('covas:state', {
      stage: this.stage,
      enabled: this.enabled,
      pttActive: pttManager.getState().active,
    });
  }

  /** Process voice audio through the full pipeline. */
  async processAudio(audioBuffer: Buffer, format = 'wav'): Promise<PipelineResult> {
    const totalStart = Date.now();

    // STT
    this.setStage(CovasPipelineStage.Transcribing);
    const sttStart = Date.now();
    const sttResult = await sttService.transcribe(audioBuffer, format);
    const sttLatency = Date.now() - sttStart;

    if (!sttResult.text.trim()) {
      this.setStage(CovasPipelineStage.Idle);
      return {
        inputText: '',
        responseText: 'I didn\'t catch that. Could you repeat?',
        intent: null,
        commandResult: null,
        audioBase64: null,
        latency: { stt: sttLatency, llm: 0, command: null, tts: null, total: Date.now() - totalStart },
      };
    }

    return this.processText(sttResult.text, sttLatency, totalStart);
  }

  /** Process text input (typed command). */
  async processTextInput(text: string): Promise<PipelineResult> {
    return this.processText(text, null, Date.now());
  }

  private async processText(text: string, sttLatency: number | null, totalStart: number): Promise<PipelineResult> {
    // LLM
    this.setStage(CovasPipelineStage.Processing);
    const llmStart = Date.now();
    const llmResult = await llmService.processInput(text);
    const llmLatency = Date.now() - llmStart;

    // Command execution
    let commandResult: { success: boolean; response: string; data?: unknown } | null = null;
    let commandLatency: number | null = null;
    // Strip intent/commodity tags from LLM response before displaying/speaking
    let responseText = llmResult.text
      .replace(/<intent>[^<]*<\/intent>/g, '')
      .replace(/<commodity>[^<]*<\/commodity>/g, '')
      .trim();

    if (llmResult.intent) {
      this.setStage(CovasPipelineStage.Generating);
      const cmdStart = Date.now();
      commandResult = await commandExecutor.execute(llmResult.intent, llmResult.entities);
      commandLatency = Date.now() - cmdStart;
      if (commandResult.success && commandResult.response) {
        responseText = commandResult.response;
      }
    }

    // TTS
    let audioBase64: string | null = null;
    let ttsLatency: number | null = null;

    if (ttsService.isAvailable()) {
      this.setStage(CovasPipelineStage.Synthesizing);
      const ttsStart = Date.now();
      try {
        const ttsResult = await ttsService.synthesize(responseText);
        if (ttsResult.audioData.length > 0) {
          audioBase64 = ttsResult.audioData.toString('base64');
        }
        ttsLatency = Date.now() - ttsStart;
      } catch (err) {
        console.error('[COVAS/TTS] Synthesis failed:', err);
      }
    }

    this.setStage(CovasPipelineStage.Idle);

    const result: PipelineResult = {
      inputText: text,
      responseText,
      intent: llmResult.intent,
      commandResult,
      audioBase64,
      latency: {
        stt: sttLatency,
        llm: llmLatency,
        command: commandLatency,
        tts: ttsLatency,
        total: Date.now() - totalStart,
      },
    };

    // Broadcast to all connected clients
    wsManager.broadcast('covas:response', result);

    return result;
  }

  clearConversation(): void {
    llmService.clearHistory();
  }
}

export const covasPipeline = new CovasPipeline();
