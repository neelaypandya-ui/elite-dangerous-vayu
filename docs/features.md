# VAYU Feature Catalog

## Phase 1 — Foundation

### Journal Watcher & Event Parser
Monitors the Elite Dangerous journal directory using chokidar, parsing new journal entries in real-time. Supports all 140+ journal event types defined in `@vayu/shared`. Events are emitted through a typed EventBus for consumption by all feature modules.

### Game State Aggregator
Maintains a unified `GameState` singleton by processing all journal events. Tracks commander info, ship status, location, materials, missions, session stats, carrier state, and Odyssey data.

### Bindings Parser
Parses the 1,776-line NEELAYODYSSEY.4.1.binds XML file into structured binding data using fast-xml-parser. Supports ThrustMasterWarthogThrottle and VKB GamePad devices.

### "Where Was I?" Briefing
Generates a narrative session briefing by analyzing recent journal entries — what happened last session, current location, active missions, and notable events. Available at `/briefing`.

### HOTAS Binding Visualizer
SVG renderings of the Warthog Throttle and VKB NXT EVO with annotated button/axis mappings pulled from the parsed bindings data. Available at `/bindings`.

### Dashboard Shell & Elite Aesthetic
The React application shell featuring a sidebar navigation, top status bar, and Elite Dangerous-themed holographic UI components (HoloPanel, HoloButton, HoloProgress, HoloTable, HoloBadge). Uses Orbitron and Share Tech Mono fonts with a forest green (#4E9A3E) accent color.

## Phase 2 — COVAS Voice Assistant

### Speech-to-Text (Whisper)
Captures audio via push-to-talk and transcribes using OpenAI's Whisper CLI. Configurable model size and language.

### Claude LLM Integration
Processes transcribed text through Claude API with full game state context injected into the system prompt. Falls back to a local response when the API is unavailable.

### Text-to-Speech (Piper/ElevenLabs)
Converts LLM responses to speech using Piper (local, free) or ElevenLabs (cloud, premium). Configurable voice selection.

### Push-to-Talk Manager
Maps a HOTAS button to PTT activation. Manages recording state transitions.

### Command Executor
Routes parsed intents (check_fuel, check_location, plot_route, etc.) to game state queries and feature service calls.

## Phase 3 — Companion Tools

### Live Dashboard (`/dashboard`)
Real-time ship status, commander info, location, and session statistics. Polls every 10 seconds.

### Trade Route Optimizer (`/trade`)
Tracks cargo transactions (buy/sell events), calculates profit margins, and displays current cargo state.

### Engineering Manager (`/engineering`)
Displays material inventory across all three categories (raw, manufactured, encoded) with storage capacity bars. Shows engineer unlock progress.

### Mission Control (`/missions`)
Active/completed/failed mission tracking with expiry warnings. Groups missions by destination system.

### Navigation Tools (`/navigation`)
Current system info, jump history, session distance stats, and EDSM system lookups.

## Phase 4 — Dynamic Optimization

### Graphics Profile Manager (`/graphics`)
Manages HUD color matrix profiles (Default Orange, VAYU Green, Midnight Blue, Imperial White). Writes directly to GraphicsConfigurationOverride.xml.

### Audio Profile Manager (`/audio`)
Context-based audio profiles (Default, Combat, Exploration, Streaming) with volume sliders for master, game, voice, music, and TTS channels.

### Alert System (`/alerts`)
Configurable alert rules (low fuel, low hull, interdiction, heat warning, under attack, shield down) that fire based on journal events. Alerts broadcast via WebSocket.

### Pre-Flight Checklist (`/preflight`)
Verifies ship readiness before departure: fuel level, hull integrity, cargo capacity, active missions, module health, rebuy cost, and docking status.

## Phase 5 — Extended Features

### Powerplay Tracker (`/powerplay`)
Tracks pledged power, merit count, rank progression, and recent merit-earning activities.

### Fleet Manager (`/ships`)
Complete fleet inventory showing current ship details, stored ships with locations, transfer times, and total fleet value.

### Community Integration (`/community`)
EDSM system lookup with coordinates, security, economy, and population data. Commander profile display with rank information.

### GalNet News (`/galnet`)
Fetches and displays GalNet articles with a read-more detail view. Manual refresh supported.

### Session Analytics (`/analytics`)
Session duration, credits earned, jumps, and distance tracked with periodic snapshots. Earnings breakdown by category.

## Phase 6 — Screenshot Manager (`/screenshots`)
Monitors Elite's screenshot directory, tags images with journal metadata (system, ship, timestamp), and provides a filterable gallery view with lightbox.

## Phase 7 — Fleet Carrier Console (`/carrier`)
Carrier status display with callsign, location, docking access, finances, tritium fuel gauge, service list, and jump history. Includes upkeep cost warnings.

## Phase 8 — Mining Optimizer (`/mining`)
Real-time mining session tracking with prospector counts, collection stats, yield breakdown by mineral, and profit-per-hour calculation.

## Phase 9 — Power Distribution (`/pips`)
Live SYS/ENG/WEP pip display with segmented bar visualization. Context detection (combat, scooping, fleeing) with recommended pip configurations.

## Phase 10 — Threat Intel (`/threats`)
Current system threat assessment, known ganking hotspot database, anarchy system warnings, and interdiction history tracking.

## Phase 11 — Odyssey Manager (`/odyssey`)
On-foot inventory management: suits, loadouts, backpack contents, materials with storage bars, and exobiology scan tracking.

## Phase 12 — Ship Outfitting (`/outfitting`)
Current ship loadout viewer showing hardpoints, core internals, and optional internals with engineering modification details.

## Phase 13 — Elite Trivia (`/trivia`)
Interactive quiz with multiple-choice questions from a 200+ question database. Tracks answer accuracy, streaks, and category performance.

## Phase 14 — Personal Logbook (`/logbook`)
Text-based log entry system with auto-tagging (system, ship, timestamp). Searchable history with CRUD operations.

## Phase 15 — Journal Archiver (`/archiver`)
Backup manager for journal files with compression, configurable retention policy, and backup history tracking.

## Phase 17 — Music Player (`/music`)
YouTube search, queue management (add, remove, reorder), playback controls (play, pause, skip, volume, seek), and repeat/shuffle modes.

## Feature Status

| Feature | Server | Client | Status |
|---------|--------|--------|--------|
| Dashboard | Done | Done | Ready |
| Briefing | Done | Done | Ready |
| Bindings | Done | Done | Ready |
| COVAS | Done | Done | Ready |
| Trade | Done | Done | Ready |
| Engineering | Done | Done | Ready |
| Missions | Done | Done | Ready |
| Navigation | Done | Done | Ready |
| Graphics | Done | Done | Ready |
| Audio | Done | Done | Ready |
| Alerts | Done | Done | Ready |
| Preflight | Done | Done | Ready |
| Powerplay | Done | Done | Ready |
| Ships | Done | Done | Ready |
| Community | Done | Done | Ready |
| GalNet | Done | Done | Ready |
| Analytics | Done | Done | Ready |
| Screenshots | Done | Done | Ready |
| Carrier | Done | Done | Ready |
| Mining | Done | Done | Ready |
| Pips | Done | Done | Ready |
| Threats | Done | Done | Ready |
| Odyssey | Done | Done | Ready |
| Outfitting | Done | Done | Ready |
| Trivia | Done | Done | Ready |
| Logbook | Done | Done | Ready |
| Archiver | Done | Done | Ready |
| Music | Done | Done | Ready |
