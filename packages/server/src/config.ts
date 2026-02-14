/**
 * @vayu/server — Configuration
 *
 * Loads all server configuration from environment variables with sensible
 * defaults. Import `config` anywhere in the server to access settings.
 *
 * Uses dotenv to load `.env` from the project root at import time.
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env from monorepo root (3 levels up from packages/server/src/)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

import {
  DEFAULT_JOURNAL_DIR,
  DEFAULT_BINDINGS_FILE,
  DEFAULT_GRAPHICS_OVERRIDE,
  DEFAULT_SCREENSHOTS_DIR,
} from '@vayu/shared';

// ---------------------------------------------------------------------------
// Configuration object
// ---------------------------------------------------------------------------

export const config = {
  /** HTTP / WebSocket server settings. */
  server: {
    /** Port the Express + WebSocket server listens on. */
    port: parseInt(process.env.SERVER_PORT || '3001', 10),
    /** Port the client dev server runs on (used for CORS origin). */
    clientPort: parseInt(process.env.CLIENT_PORT || '3000', 10),
  },

  /** Filesystem paths for game data and application storage. */
  paths: {
    /** Directory where Elite Dangerous writes journal files. */
    journalDir: process.env.JOURNAL_DIR || DEFAULT_JOURNAL_DIR,
    /** Path to the custom key bindings file. */
    bindingsFile: process.env.BINDINGS_FILE || DEFAULT_BINDINGS_FILE,
    /** Path to the graphics configuration override XML. */
    graphicsOverride: process.env.GRAPHICS_OVERRIDE || DEFAULT_GRAPHICS_OVERRIDE,
    /** Directory where Elite Dangerous saves screenshots. */
    screenshotsDir: process.env.SCREENSHOTS_DIR || DEFAULT_SCREENSHOTS_DIR,
    /** Path to the SQLite database file. */
    databasePath: process.env.DATABASE_PATH || './data/vayu.db',
  },

  /** External API keys and identifiers. */
  api: {
    /** Anthropic API key for Claude-based NLU/generation. */
    anthropicKey: process.env.ANTHROPIC_API_KEY || '',
    /** ElevenLabs API key for TTS. */
    elevenLabsKey: process.env.ELEVENLABS_API_KEY || '',
    /** ElevenLabs voice ID for TTS. */
    elevenLabsVoiceId: process.env.ELEVENLABS_VOICE_ID || '',
    /** EDSM API key for star system lookups. */
    edsmApiKey: process.env.EDSM_API_KEY || '',
    /** EDSM commander name. */
    edsmCommanderName: process.env.EDSM_COMMANDER_NAME || 'ABHYUTHANAM',
    /** Inara API key for commander/market lookups. */
    inaraApiKey: process.env.INARA_API_KEY || '',
    /** Inara commander name. */
    inaraCommanderName: process.env.INARA_COMMANDER_NAME || 'ABHYUTHANAM',
  },

  /** Whisper STT engine settings. */
  whisper: {
    /** Whisper model variant (tiny, base, small, medium, large). */
    model: process.env.WHISPER_MODEL || 'base',
    /** Language code for Whisper. */
    language: process.env.WHISPER_LANGUAGE || 'en',
  },

  /** Audio device settings. */
  audio: {
    /** Input device name or ID for microphone capture. */
    inputDevice: process.env.AUDIO_INPUT_DEVICE || '',
    /** Output device name or ID for TTS playback. */
    outputDevice: process.env.AUDIO_OUTPUT_DEVICE || '',
  },

  /** Journal backup settings. */
  backup: {
    /** Directory to store journal backups. */
    dir: process.env.JOURNAL_BACKUP_DIR || '',
    /** Number of days to retain journal backups. */
    retentionDays: parseInt(process.env.JOURNAL_RETENTION_DAYS || '90', 10),
  },
} as const;

/** Type alias for the full config shape. */
export type VayuConfig = typeof config;
