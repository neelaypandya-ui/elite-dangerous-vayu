# VAYU Configuration Reference

## Environment Variables

Copy `.env.example` to `.env` and configure the values below.

### Paths

| Variable | Default | Description |
|----------|---------|-------------|
| `JOURNAL_DIR` | `C:\Users\neela\Saved Games\Frontier Developments\Elite Dangerous` | Elite Dangerous journal file directory |
| `BINDINGS_FILE` | `...\Options\Bindings\NEELAYODYSSEY.4.1.binds` | HOTAS key bindings XML file |
| `GRAPHICS_OVERRIDE` | `...\Options\Graphics\GraphicsConfigurationOverride.xml` | Graphics override XML (written by Graphics profile manager) |
| `SCREENSHOTS_DIR` | `C:\Users\neela\Pictures\Frontier Developments\Elite Dangerous` | Screenshot directory to monitor |

### Server

| Variable | Default | Description |
|----------|---------|-------------|
| `SERVER_PORT` | `3001` | Express API server port |
| `CLIENT_PORT` | `3000` | Vite dev server port |

### Claude API (COVAS LLM)

| Variable | Default | Description |
|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | *(empty)* | Anthropic API key for Claude integration. Required for COVAS voice assistant LLM responses. |

### ElevenLabs TTS

| Variable | Default | Description |
|----------|---------|-------------|
| `ELEVENLABS_API_KEY` | *(empty)* | ElevenLabs API key for premium TTS |
| `ELEVENLABS_VOICE_ID` | *(empty)* | Voice ID for ElevenLabs synthesis |

### Whisper STT

| Variable | Default | Description |
|----------|---------|-------------|
| `WHISPER_MODEL` | `base` | Whisper model size: `tiny`, `base`, `small`, `medium`, `large` |
| `WHISPER_LANGUAGE` | `en` | Language code for speech recognition |

### External APIs

| Variable | Default | Description |
|----------|---------|-------------|
| `EDSM_API_KEY` | *(empty)* | EDSM API key (from edsm.net profile) |
| `EDSM_COMMANDER_NAME` | `ABHYUTHANAM` | Commander name for EDSM lookups |
| `INARA_API_KEY` | *(empty)* | Inara API key (from inara.cz) |
| `INARA_COMMANDER_NAME` | `ABHYUTHANAM` | Commander name for Inara lookups |

### Database

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_PATH` | `./data/vayu.db` | SQLite database file path |

### Audio

| Variable | Default | Description |
|----------|---------|-------------|
| `AUDIO_INPUT_DEVICE` | *(auto)* | Audio input device for PTT recording |
| `AUDIO_OUTPUT_DEVICE` | *(auto)* | Audio output device for TTS playback |

### Backup

| Variable | Default | Description |
|----------|---------|-------------|
| `JOURNAL_BACKUP_DIR` | *(empty)* | Directory for journal backups |
| `JOURNAL_RETENTION_DAYS` | `90` | Days to retain backed-up journals |

## Config Object

The server loads all environment variables into a typed `config` object at `packages/server/src/config.ts`:

```typescript
config.server.port          // 3001
config.server.clientPort    // 3000
config.paths.journalDir     // Journal directory
config.paths.bindingsFile   // Bindings XML path
config.paths.graphicsOverride // Graphics override XML
config.paths.screenshotsDir // Screenshots directory
config.paths.databasePath   // SQLite DB path
config.api.anthropicKey     // Claude API key
config.api.elevenLabsKey    // ElevenLabs key
config.api.elevenLabsVoiceId // Voice ID
config.api.edsmApiKey       // EDSM key
config.api.edsmCommanderName // CMDR name
config.api.inaraApiKey      // Inara key
config.api.inaraCommanderName // CMDR name
config.whisper.model        // Whisper model
config.whisper.language     // Language
config.audio.inputDevice    // Mic device
config.audio.outputDevice   // Speaker device
config.backup.dir           // Backup directory
config.backup.retentionDays // Retention policy
```

## Optional Dependencies

Some features require external tools:

| Tool | Required For | Install |
|------|-------------|---------|
| Whisper CLI | COVAS STT | `pip install openai-whisper` |
| Piper | Local TTS | Download from GitHub releases |
| yt-dlp | Music player | `pip install yt-dlp` |
| ffmpeg | Music player audio | Download from ffmpeg.org |
| Equalizer APO | Audio profiles | Install from sourceforge |
