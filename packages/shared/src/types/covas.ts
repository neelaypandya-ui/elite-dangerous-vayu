/**
 * @vayu/shared — COVAS (Cockpit Voice Assistant System) Types
 *
 * Types for the voice assistant pipeline: speech recognition, text-to-speech,
 * command processing, and pipeline orchestration.
 */

// ---------------------------------------------------------------------------
// Pipeline Stages
// ---------------------------------------------------------------------------

/** Pipeline processing stages for a voice interaction. */
export enum CovasPipelineStage {
  /** Listening for wake word or voice activity. */
  Idle = 'idle',
  /** Capturing audio input. */
  Listening = 'listening',
  /** Converting speech to text. */
  Transcribing = 'transcribing',
  /** Understanding the transcribed command. */
  Processing = 'processing',
  /** Generating a response. */
  Generating = 'generating',
  /** Converting response text to speech. */
  Synthesizing = 'synthesizing',
  /** Playing audio output. */
  Speaking = 'speaking',
  /** An error occurred in the pipeline. */
  Error = 'error',
}

// ---------------------------------------------------------------------------
// STT (Speech-to-Text)
// ---------------------------------------------------------------------------

/** Supported STT provider engines. */
export type STTProvider = 'whisper' | 'azure' | 'google' | 'deepgram' | 'local';

/** Configuration for the STT engine. */
export interface STTConfig {
  /** Which STT provider to use. */
  provider: STTProvider;
  /** Model name / variant (e.g. "whisper-1", "base.en"). */
  model: string;
  /** Language code (e.g. "en", "en-US"). */
  language: string;
  /** Minimum confidence threshold to accept a transcription. */
  confidenceThreshold: number;
  /** Maximum recording duration in milliseconds. */
  maxDurationMs: number;
  /** Silence detection timeout in milliseconds. */
  silenceTimeoutMs: number;
  /** Whether to use Voice Activity Detection. */
  useVAD: boolean;
  /** VAD sensitivity (0.0 = least sensitive, 1.0 = most sensitive). */
  vadSensitivity: number;
  /** Audio sample rate in Hz. */
  sampleRate: number;
  /** Number of audio channels. */
  channels: number;
}

/** Result of a speech-to-text transcription. */
export interface STTResult {
  /** Transcribed text. */
  text: string;
  /** Confidence score (0.0-1.0). */
  confidence: number;
  /** Language detected. */
  language: string;
  /** Duration of the audio in milliseconds. */
  durationMs: number;
  /** Whether the transcription is final (not interim). */
  isFinal: boolean;
  /** Alternative transcriptions. */
  alternatives: Array<{
    text: string;
    confidence: number;
  }>;
  /** Word-level timestamps (if available). */
  words?: Array<{
    word: string;
    start: number;
    end: number;
    confidence: number;
  }>;
  /** STT provider used. */
  provider: STTProvider;
  /** Processing latency in milliseconds. */
  latencyMs: number;
}

// ---------------------------------------------------------------------------
// TTS (Text-to-Speech)
// ---------------------------------------------------------------------------

/** Supported TTS provider engines. */
export type TTSProvider = 'elevenlabs' | 'azure' | 'google' | 'piper' | 'local';

/** Configuration for the TTS engine. */
export interface TTSConfig {
  /** Which TTS provider to use. */
  provider: TTSProvider;
  /** Voice identifier. */
  voiceId: string;
  /** Voice name (human-readable). */
  voiceName: string;
  /** Language code. */
  language: string;
  /** Speaking rate multiplier (1.0 = normal). */
  speakingRate: number;
  /** Pitch adjustment (-20 to +20 semitones). */
  pitch: number;
  /** Volume gain in dB (-96 to +16). */
  volumeGainDb: number;
  /** Output sample rate in Hz. */
  sampleRate: number;
  /** Audio encoding format. */
  audioEncoding: 'pcm' | 'mp3' | 'opus' | 'ogg';
  /** Whether to enable SSML processing. */
  enableSSML: boolean;
  /** Stability (provider-specific, 0.0-1.0). */
  stability: number;
  /** Similarity boost (provider-specific, 0.0-1.0). */
  similarityBoost: number;
}

/** Result of a text-to-speech synthesis. */
export interface TTSResult {
  /** Raw audio data as a base64-encoded string or buffer reference. */
  audioData: string;
  /** Audio format. */
  audioFormat: 'pcm' | 'mp3' | 'opus' | 'ogg';
  /** Sample rate. */
  sampleRate: number;
  /** Duration of the synthesised audio in milliseconds. */
  durationMs: number;
  /** Number of characters consumed. */
  characterCount: number;
  /** TTS provider used. */
  provider: TTSProvider;
  /** Processing latency in milliseconds. */
  latencyMs: number;
}

// ---------------------------------------------------------------------------
// COVAS Commands
// ---------------------------------------------------------------------------

/** Recognized COVAS command intent category. */
export type CovasCommandCategory =
  | 'navigation'
  | 'combat'
  | 'trade'
  | 'exploration'
  | 'ship_management'
  | 'mining'
  | 'carrier'
  | 'information'
  | 'settings'
  | 'social'
  | 'system'
  | 'unknown';

/** A parsed COVAS command from user voice/text input. */
export interface CovasCommand {
  /** Raw text input that produced this command. */
  rawInput: string;
  /** Identified intent (e.g. "navigate_to_system", "check_fuel"). */
  intent: string;
  /** Confidence of the intent classification (0.0-1.0). */
  confidence: number;
  /** Command category. */
  category: CovasCommandCategory;
  /** Extracted entities / parameters. */
  entities: Record<string, string | number | boolean>;
  /** Whether the command requires confirmation before execution. */
  requiresConfirmation: boolean;
  /** Slot values that are still missing and need to be filled. */
  missingSlots: string[];
  /** The original STT result (if from voice). */
  sttResult: STTResult | null;
}

// ---------------------------------------------------------------------------
// COVAS Messages
// ---------------------------------------------------------------------------

/** Types of messages in the COVAS conversation. */
export type CovasMessageRole = 'user' | 'assistant' | 'system' | 'event';

/** A single message in the COVAS conversation history. */
export interface CovasMessage {
  /** Unique message ID. */
  id: string;
  /** Message role. */
  role: CovasMessageRole;
  /** Text content. */
  content: string;
  /** Timestamp. */
  timestamp: string;
  /** Associated command (if this message triggered a command). */
  command: CovasCommand | null;
  /** Whether this message was spoken (voice) vs typed. */
  spoken: boolean;
  /** Audio reference for playback (null if text-only). */
  audioRef: string | null;
  /** Pipeline latency breakdown in ms. */
  latency: {
    stt: number | null;
    processing: number | null;
    generation: number | null;
    tts: number | null;
    total: number;
  };
}

// ---------------------------------------------------------------------------
// COVAS State
// ---------------------------------------------------------------------------

/** Overall COVAS system state. */
export interface CovasState {
  /** Whether COVAS is enabled. */
  enabled: boolean;
  /** Current pipeline stage. */
  pipelineStage: CovasPipelineStage;
  /** Whether voice input is active. */
  voiceInputActive: boolean;
  /** Whether voice output is active. */
  voiceOutputActive: boolean;
  /** Current STT configuration. */
  sttConfig: STTConfig;
  /** Current TTS configuration. */
  ttsConfig: TTSConfig;
  /** Wake word (null if push-to-talk). */
  wakeWord: string | null;
  /** Whether push-to-talk mode is enabled. */
  pushToTalk: boolean;
  /** Conversation history. */
  conversationHistory: CovasMessage[];
  /** Maximum conversation history length. */
  maxHistoryLength: number;
  /** Last error message (null if no error). */
  lastError: string | null;
  /** Cumulative metrics for this session. */
  metrics: {
    totalInteractions: number;
    averageLatencyMs: number;
    sttErrors: number;
    ttsErrors: number;
    commandSuccessRate: number;
  };
}
