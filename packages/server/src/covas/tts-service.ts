/**
 * Text-to-Speech service supporting ElevenLabs API and local Piper fallback.
 */

import { config } from '../config.js';

export interface TTSResult {
  audioData: Buffer;
  format: 'mp3' | 'pcm' | 'wav';
  durationMs: number;
  provider: string;
}

export interface TTSService {
  synthesize(text: string): Promise<TTSResult>;
  isAvailable(): boolean;
}

class ElevenLabsTTS implements TTSService {
  isAvailable(): boolean {
    return !!(config.api.elevenLabsKey && config.api.elevenLabsVoiceId);
  }

  async synthesize(text: string): Promise<TTSResult> {
    const start = Date.now();
    const voiceId = config.api.elevenLabsVoiceId;

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': config.api.elevenLabsKey,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_turbo_v2_5',
          voice_settings: {
            stability: 0.6,
            similarity_boost: 0.8,
            style: 0.15,
            use_speaker_boost: true,
          },
        }),
      },
    );

    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText} — ${errBody}`);
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer());

    return {
      audioData: audioBuffer,
      format: 'mp3',
      durationMs: Date.now() - start,
      provider: 'elevenlabs',
    };
  }
}

class PiperTTS implements TTSService {
  private available = false;

  constructor() {
    this.checkAvailability();
  }

  private async checkAvailability(): Promise<void> {
    try {
      const { execSync } = await import('child_process');
      execSync('piper --help', { stdio: 'ignore' });
      this.available = true;
    } catch {
      this.available = false;
    }
  }

  isAvailable(): boolean {
    return this.available;
  }

  async synthesize(text: string): Promise<TTSResult> {
    const start = Date.now();
    const { execSync } = await import('child_process');
    const fs = await import('fs');
    const path = await import('path');
    const os = await import('os');

    const tmpFile = path.join(os.tmpdir(), `vayu-tts-${Date.now()}.wav`);

    try {
      execSync(`echo "${text.replace(/"/g, '\\"')}" | piper --output_file "${tmpFile}"`, {
        timeout: 15000,
        stdio: 'pipe',
      });

      const audioData = fs.readFileSync(tmpFile);
      return {
        audioData,
        format: 'wav',
        durationMs: Date.now() - start,
        provider: 'piper',
      };
    } finally {
      try { (await import('fs')).unlinkSync(tmpFile); } catch { /* ignore */ }
    }
  }
}

class FallbackTTS implements TTSService {
  isAvailable(): boolean { return true; }

  async synthesize(text: string): Promise<TTSResult> {
    // Return empty audio — the client will display text instead
    return {
      audioData: Buffer.alloc(0),
      format: 'pcm',
      durationMs: 0,
      provider: 'none',
    };
  }
}

// ---------------------------------------------------------------------------
// Pronunciation normalization for Elite Dangerous terminology
// ---------------------------------------------------------------------------

const PRONUNCIATION_MAP: Array<[RegExp, string]> = [
  // Titles & abbreviations
  [/\bCMDR\b/g, 'Commander'],
  [/\bo7\b/g, 'o-seven'],
  [/\bCR\b/g, 'credits'],
  [/\bLY\b/g, 'light years'],
  [/\bly\b/g, 'light years'],

  // Ship abbreviations
  [/\bFSD\b/g, 'frame shift drive'],
  [/\bSRV\b/g, 'S R V'],
  [/\bSLF\b/g, 'ship launched fighter'],
  [/\bASP\b/g, 'Asp'],
  [/\bDBX\b/g, 'Diamondback Explorer'],

  // Game terms
  [/\bSC\b/g, 'supercruise'],
  [/\bFSS\b/g, 'F S S'],
  [/\bDSS\b/g, 'D S S'],
  [/\bAFMU\b/g, 'A F M U'],
  [/\bEDSM\b/g, 'E D S M'],
  [/\bCQC\b/g, 'C Q C'],
  [/\bNPC\b/g, 'N P C'],
  [/\bBGS\b/g, 'B G S'],
  [/\bPP\b/g, 'powerplay'],
  [/\bAX\b/g, 'anti-xeno'],
  [/\bCG\b/g, 'community goal'],

  // Units
  [/(\d+)\s*t\b/g, '$1 tons'],
  [/(\d+)\s*MJ\b/g, '$1 megajoules'],
  [/(\d+)\s*km\/s/g, '$1 kilometers per second'],
  [/(\d+)\s*ls\b/g, '$1 light seconds'],
];

function normalizePronunciation(text: string): string {
  let result = text;
  for (const [pattern, replacement] of PRONUNCIATION_MAP) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

// ---------------------------------------------------------------------------

const elevenLabs = new ElevenLabsTTS();
const piper = new PiperTTS();
const fallback = new FallbackTTS();

export function getTTSService(): TTSService {
  if (elevenLabs.isAvailable()) return elevenLabs;
  if (piper.isAvailable()) return piper;
  return fallback;
}

export const ttsService = {
  async synthesize(text: string): Promise<TTSResult> {
    return getTTSService().synthesize(normalizePronunciation(text));
  },
  isAvailable(): boolean {
    return elevenLabs.isAvailable() || piper.isAvailable();
  },
};
