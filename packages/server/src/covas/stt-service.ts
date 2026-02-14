/**
 * Speech-to-Text service using Whisper (local or API).
 * Converts voice input to text for the COVAS pipeline.
 */

import { config } from '../config.js';

export interface STTResult {
  text: string;
  language: string;
  confidence: number;
  durationMs: number;
}

export interface STTService {
  transcribe(audioBuffer: Buffer, format?: string): Promise<STTResult>;
  isAvailable(): boolean;
}

class WhisperSTTService implements STTService {
  private available = false;

  constructor() {
    // Whisper availability will be checked on first use
    this.checkAvailability();
  }

  private async checkAvailability(): Promise<void> {
    try {
      // Check if whisper CLI is available (whisper.cpp or openai-whisper)
      const { execSync } = await import('child_process');
      execSync('whisper --help', { stdio: 'ignore' });
      this.available = true;
    } catch {
      console.log('[stt] Whisper CLI not found — STT will use fallback');
      this.available = false;
    }
  }

  isAvailable(): boolean {
    return this.available;
  }

  async transcribe(audioBuffer: Buffer, format = 'wav'): Promise<STTResult> {
    const start = Date.now();

    if (!this.available) {
      throw new Error('Whisper is not available. Install whisper CLI or use API mode.');
    }

    const fs = await import('fs');
    const path = await import('path');
    const os = await import('os');
    const { execSync } = await import('child_process');

    // Map MIME-derived formats to file extensions Whisper/ffmpeg understand
    const extMap: Record<string, string> = { webm: 'webm', ogg: 'ogg', wav: 'wav', mp3: 'mp3', mp4: 'mp4' };
    const ext = extMap[format] || 'wav';

    // Write audio to temp file (use consistent timestamp for input and output names)
    const tmpDir = os.tmpdir();
    const stamp = Date.now();
    const baseName = `vayu-stt-${stamp}`;
    const tmpFile = path.join(tmpDir, `${baseName}.${ext}`);
    // Whisper writes output using the input file's base name
    const outFile = path.join(tmpDir, `${baseName}.txt`);
    fs.writeFileSync(tmpFile, audioBuffer);

    try {
      const model = config.whisper.model;
      const lang = config.whisper.language;
      execSync(
        `whisper "${tmpFile}" --model ${model} --language ${lang} --output_format txt --output_dir "${tmpDir}"`,
        { timeout: 30000, stdio: 'pipe' }
      );

      const text = fs.existsSync(outFile) ? fs.readFileSync(outFile, 'utf-8').trim() : '';

      return {
        text,
        language: lang,
        confidence: text.length > 0 ? 0.85 : 0,
        durationMs: Date.now() - start,
      };
    } finally {
      // Cleanup temp files
      try { fs.unlinkSync(tmpFile); } catch { /* ignore */ }
      try { fs.unlinkSync(outFile); } catch { /* ignore */ }
    }
  }
}

/**
 * Fallback STT that accepts pre-transcribed text (for testing / text input mode).
 */
class TextInputSTT implements STTService {
  isAvailable(): boolean { return true; }

  async transcribe(audioBuffer: Buffer): Promise<STTResult> {
    // Treat the buffer as plain UTF-8 text (for text-mode commands)
    return {
      text: audioBuffer.toString('utf-8').trim(),
      language: 'en',
      confidence: 1.0,
      durationMs: 0,
    };
  }
}

export const sttService: STTService = new WhisperSTTService();
export const textInputSTT: STTService = new TextInputSTT();
