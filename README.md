# VAYU — Elite Dangerous Cockpit Voice Assistant

A comprehensive companion application for Elite Dangerous featuring a voice assistant (COVAS), real-time dashboard, trade optimizer, engineering tracker, fleet carrier console, and 25+ feature modules — all wrapped in an Elite-themed holographic UI.

## Architecture

```
vayu/
├── packages/
│   ├── shared/          @vayu/shared — TypeScript types, constants, utilities
│   ├── server/          @vayu/server — Express + WebSocket backend (port 3001)
│   └── client/          @vayu/client — React 18 + Vite frontend (port 3000)
├── data/                Static JSON databases
└── docs/                Documentation
```

## Prerequisites

- Node.js 20+
- npm 9+
- Elite Dangerous (for journal data)
- Optional: Whisper (STT), Piper or ElevenLabs (TTS), Anthropic API key (COVAS LLM)

## Quick Start

```bash
# 1. Clone/navigate to the vayu directory
cd "G:\SteamLibrary\steamapps\common\Elite Dangerous\Vayu"

# 2. Copy environment config
cp .env.example .env
# Edit .env with your API keys and paths

# 3. Install dependencies
npm install

# 4. Build shared types
npm run build:shared

# 5. Start development servers
npm run dev
```

The client opens at `http://localhost:3000` and the API runs on `http://localhost:3001`.

## Features

- **COVAS Voice Assistant** — STT + Claude LLM + TTS voice interaction pipeline
- **Live Dashboard** — Real-time ship status, location, and session stats
- **"Where Was I?" Briefing** — Session summary with narrative recap
- **HOTAS Binding Visualizer** — SVG rendering of Warthog + VKB NXT EVO mappings
- **Trade Optimizer** — Cargo tracking and route analysis
- **Engineering Manager** — Material inventory with storage bars and engineer progress
- **Mission Control** — Active missions, expiry tracking, destination grouping
- **Navigation Tools** — Jump history, system info, EDSM lookups
- **Graphics Profiles** — HUD color matrix manager with one-click apply
- **Audio Profiles** — Equalizer APO integration for context-based audio
- **Alert System** — Configurable rules for low fuel, hull damage, interdiction
- **Pre-Flight Checklist** — Ship readiness verification before departure
- **Powerplay Tracker** — Merit tracking and activity logging
- **Fleet Manager** — Ship inventory with values and transfer times
- **Community Integration** — EDSM/Inara system lookup and commander profile
- **GalNet News** — In-app news feed reader
- **Session Analytics** — Earnings breakdown, distance, and activity snapshots
- **Screenshot Gallery** — Auto-tagged image browser with metadata
- **Fleet Carrier Console** — Tritium fuel, upkeep, jump scheduling
- **Mining Optimizer** — Session tracking with yield analysis and profit/hour
- **Power Distribution** — Pip allocation advisor with context detection
- **Threat Intel** — Dangerous system database and interdiction history
- **Odyssey Manager** — Suits, loadouts, backpack, exobiology scans
- **Ship Outfitting** — Module viewer with engineering details
- **Elite Trivia** — Knowledge quiz with scoring
- **Personal Logbook** — Text entries auto-tagged with location metadata
- **Journal Archiver** — Backup and compression of journal files
- **Music Player** — YouTube search, queue management, playback controls

## Documentation

See the `docs/` directory for detailed documentation:

- [Features Catalog](docs/features.md)
- [Configuration Reference](docs/configuration.md)
- [API Reference](docs/api-reference.md)
- [HOTAS Reference](docs/hotas-reference.md)
- [Developer Guide](docs/developer-guide.md)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Zustand, React Router, Recharts, Lucide |
| Backend | Express, WebSocket (ws), better-sqlite3, chokidar |
| Voice | Whisper (STT), Claude API (LLM), Piper/ElevenLabs (TTS) |
| Data | fast-xml-parser, Elite journal files, EDSM/Inara APIs |
| Build | TypeScript 5, npm workspaces |

## License

Private project for CMDR ABHYUTHANAM.
