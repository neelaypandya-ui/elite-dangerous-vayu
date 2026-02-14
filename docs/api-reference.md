# VAYU API Reference

Base URL: `http://localhost:3001/api`

All responses use the envelope format:
```json
{ "success": true, "data": { ... } }
{ "success": false, "error": "message" }
```

## Status

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/status` | Server health check with feature list |

## Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard` | Full dashboard overview with briefing |
| GET | `/dashboard/state` | Current game state snapshot |
| GET | `/dashboard/briefing` | "Where Was I?" narrative briefing |

## Bindings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/bindings` | All parsed key bindings |
| GET | `/bindings/categories` | Bindings grouped by category |
| GET | `/bindings/devices` | Available device list |

## COVAS

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/covas/state` | Current COVAS state (enabled, speaking, listening, messages) |
| POST | `/covas/text` | Send text message to COVAS. Body: `{ text: string }` |
| POST | `/covas/audio` | Send audio blob for STT + LLM processing |
| POST | `/covas/enable` | Toggle COVAS. Body: `{ enabled: boolean }` |
| POST | `/covas/ptt` | PTT state change. Body: `{ active: boolean }` |
| POST | `/covas/clear` | Clear conversation history |

## Trade

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/trade` | Trade overview with current cargo and session |
| GET | `/trade/sessions` | All trade sessions |
| GET | `/trade/current` | Current trade session details |
| GET | `/trade/search` | Search for trade routes (query params) |

## Engineering

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/engineering` | Full engineering overview |
| GET | `/engineering/materials` | All materials by category |
| GET | `/engineering/materials/:category` | Materials in specific category (raw/manufactured/encoded) |
| GET | `/engineering/materials/search` | Search materials by name |
| GET | `/engineering/materials/near-cap` | Materials near storage capacity |
| GET | `/engineering/engineers` | Engineer progress list |

## Missions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/missions` | Mission overview with counts |
| GET | `/missions/active` | Active missions list |
| GET | `/missions/completed` | Completed missions list |
| GET | `/missions/expiring` | Missions expiring soon |
| GET | `/missions/by-destination` | Missions grouped by destination |

## Navigation

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/navigation` | Navigation overview |
| GET | `/navigation/location` | Current location |
| GET | `/navigation/history` | Jump history |
| GET | `/navigation/visited` | Visited systems list |
| GET | `/navigation/lookup/:systemName` | EDSM system lookup |

## Graphics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/graphics` | All profiles with active indicator |
| GET | `/graphics/current` | Current active profile |
| POST | `/graphics/apply` | Apply a profile. Body: `{ profileName: string }` |
| POST | `/graphics/profiles` | Create/update custom profile |

## Audio

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/audio` | All audio profiles with active indicator |
| POST | `/audio/apply` | Apply a profile. Body: `{ profileName: string }` |
| POST | `/audio/profiles` | Create/update custom profile |
| DELETE | `/audio/profiles/:name` | Delete a custom profile |

## Alerts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/alerts` | Alert rules and recent alerts |
| GET | `/alerts/rules` | All alert rules |
| PUT | `/alerts/rules/:id` | Update alert rule (enable/disable) |
| GET | `/alerts/history` | Alert history |
| POST | `/alerts/acknowledge/:id` | Acknowledge an alert |
| POST | `/alerts/clear` | Clear alert history |

## Preflight

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/preflight` | Full pre-flight checklist |
| GET | `/preflight/checklist` | Checklist items only |

## Powerplay

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/powerplay` | Powerplay overview (power, merits, rank) |
| GET | `/powerplay/activities` | Recent merit activities |

## Ships

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/ships` | Fleet overview (current + stored + value) |
| GET | `/ships/current` | Current ship details |
| GET | `/ships/stored` | Stored ships list |

## Community

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/community` | Community integration status |
| GET | `/community/edsm/system/:name` | EDSM system lookup |
| GET | `/community/edsm/traffic/:name` | EDSM system traffic report |
| GET | `/community/edsm/commander` | EDSM commander position |

## GalNet

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/galnet` | Latest GalNet articles |
| GET | `/galnet/:id` | Single article detail |
| POST | `/galnet/refresh` | Force refresh article feed |

## Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/analytics` | Session analytics overview |
| GET | `/analytics/session` | Current session stats |
| GET | `/analytics/snapshots` | Periodic data snapshots |

## Screenshots

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/screenshots` | All indexed screenshots |
| GET | `/screenshots/search` | Filter screenshots (query params) |
| GET | `/screenshots/system/:name` | Screenshots from specific system |
| POST | `/screenshots/scan` | Rescan screenshot directory |

## Fleet Carrier

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/carrier` | Carrier overview |
| GET | `/carrier/state` | Carrier state details |
| GET | `/carrier/fuel-calc` | Tritium fuel calculator |
| GET | `/carrier/upkeep` | Upkeep cost breakdown |
| GET | `/carrier/jumps` | Jump history |

## Mining

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/mining` | Mining overview |
| GET | `/mining/current` | Current mining session |
| GET | `/mining/sessions` | Previous sessions |
| GET | `/mining/profit` | Profit calculations |

## Pips

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/pips` | Pip overview (current, recommendation, history) |
| GET | `/pips/current` | Current pip allocation |
| GET | `/pips/recommendation` | Recommended allocation |
| GET | `/pips/history` | Pip change history |

## Threats

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/threats` | Threat overview |
| GET | `/threats/current` | Current system threat assessment |
| GET | `/threats/known` | Known dangerous systems |
| GET | `/threats/interdictions` | Interdiction history |

## Odyssey

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/odyssey` | Full Odyssey overview |
| GET | `/odyssey/suits` | Suit inventory |
| GET | `/odyssey/loadouts` | Loadout configurations |
| GET | `/odyssey/backpack` | Backpack contents |
| GET | `/odyssey/materials` | On-foot materials |
| GET | `/odyssey/scans` | Exobiology scans |
| GET | `/odyssey/farm-guide` | Component farming guide |

## Outfitting

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/outfitting` | Ship outfitting overview |
| GET | `/outfitting/loadout` | Current ship loadout |
| GET | `/outfitting/stored-modules` | Stored modules list |

## Trivia

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/trivia` | Trivia stats overview |
| GET | `/trivia/random` | Random question |
| POST | `/trivia/start` | Start a quiz session |
| POST | `/trivia/answer` | Submit answer. Body: `{ questionId, answerIndex }` |
| POST | `/trivia/end` | End quiz session |
| GET | `/trivia/history` | Quiz history |

## Logbook

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/logbook` | All log entries |
| POST | `/logbook` | Create entry. Body: `{ content: string }` |
| GET | `/logbook/search` | Search entries (query params) |
| GET | `/logbook/system/:name` | Entries from system |
| GET | `/logbook/:id` | Single entry |
| PUT | `/logbook/:id` | Update entry. Body: `{ content: string }` |
| DELETE | `/logbook/:id` | Delete entry |

## Archiver

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/archiver` | Archive status and config |
| GET | `/archiver/scan` | Scan journal directory |
| POST | `/archiver/backup` | Run backup now |
| GET | `/archiver/history` | Backup history |

## Music

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/music` | Player state (now playing, queue, volume) |
| GET | `/music/search?q=` | Search YouTube for tracks |
| POST | `/music/queue` | Add to queue. Body: `{ url, title, artist }` |
| DELETE | `/music/queue/:index` | Remove from queue |
| POST | `/music/queue/clear` | Clear queue |
| POST | `/music/play` | Resume playback |
| POST | `/music/pause` | Pause playback |
| POST | `/music/next` | Skip to next track |
| POST | `/music/previous` | Previous track |
| POST | `/music/volume` | Set volume. Body: `{ volume: number }` |
| POST | `/music/repeat` | Toggle repeat |
| POST | `/music/shuffle` | Toggle shuffle |
| GET | `/music/queue` | Current queue |
| GET | `/music/history` | Play history |

## WebSocket

Connect to `ws://localhost:3001` for real-time updates.

### Message Envelope

```json
{
  "type": "namespace:event",
  "payload": { ... },
  "timestamp": "2024-01-01T00:00:00.000Z",
  "sequence": 1
}
```

### Event Types

| Type | Description |
|------|-------------|
| `game:state` | Full game state update |
| `game:event` | Journal event forwarded |
| `game:status` | Status.json change |
| `alert:fired` | Alert rule triggered |
| `covas:state` | COVAS state change |
| `covas:message` | COVAS conversation message |
| `music:state` | Music player state change |
| `mining:update` | Mining session data change |
| `pips:update` | Pip allocation change |
