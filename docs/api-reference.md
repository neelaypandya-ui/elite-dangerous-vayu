# VAYU API Reference

> **VEDA** -- Validated Endpoint Documentation Archive
>
> Auto-generated from source: `packages/server/src/routes/index.ts` and all feature routers.
> Covers every REST endpoint and WebSocket event in the VAYU server.

Base URL: `http://localhost:3001/api`

All responses use the standard envelope format:

```json
{ "success": true, "data": { ... } }
```

```json
{ "success": false, "error": "message", "detail": "optional details" }
```

---

## REST Endpoints

---

### Status

#### `GET /api/status`

Server health check. Always available, requires no game state.

**Response**:

```json
{
  "status": "ok",
  "version": "1.0.0",
  "features": [
    "dashboard", "bindings", "covas", "trade", "engineering", "missions",
    "navigation", "graphics", "audio", "alerts", "preflight", "powerplay",
    "ships", "community", "galnet", "analytics", "screenshots", "carrier",
    "mining", "pips", "threats", "odyssey", "outfitting", "trivia",
    "logbook", "archiver", "music", "chakra"
  ]
}
```

---

### Dashboard

#### `GET /api/dashboard/briefing`

Generate the "Where Was I?" session briefing. Reads recent journal files (up to 7 days) and live game state to build a comprehensive session recap with a natural-language narrative.

**Response**:

```json
{
  "success": true,
  "data": {
    "lastSession": {
      "date": "2025-01-15T20:30:00.000Z",
      "duration": "2h 15m",
      "system": "Sol",
      "station": "Abraham Lincoln",
      "ship": "Python",
      "shipName": "Stellar Wanderer"
    },
    "commander": {
      "name": "Jameson",
      "credits": 500000000,
      "combatRank": "Dangerous",
      "tradeRank": "Tycoon",
      "explorationRank": "Pioneer"
    },
    "currentLocation": {
      "system": "Sol",
      "body": "Earth",
      "station": "Abraham Lincoln",
      "docked": true,
      "coordinates": [0, 0, 0]
    },
    "activeMissions": [
      {
        "name": "Deliver 40 units of Gold",
        "destination": "Hutton Orbital, Alpha Centauri",
        "reward": 500000,
        "expiry": "2025-01-17T12:00:00.000Z"
      }
    ],
    "recentHighlights": [
      {
        "event": "FSDJump",
        "summary": "Jumped to Sol (4.4 LY)",
        "timestamp": "2025-01-15T22:00:00.000Z"
      }
    ],
    "shipStatus": {
      "type": "Python",
      "name": "Stellar Wanderer",
      "fuelLevel": 28.5,
      "fuelCapacity": 32.0,
      "hullHealth": 0.95,
      "cargoUsed": 40,
      "cargoCapacity": 292
    },
    "sessionsSinceLastPlay": 3,
    "daysSinceLastPlay": 2,
    "narrative": "Welcome back, CMDR Jameson. It's been 2 days since your last session. You are currently docked at Abraham Lincoln in Sol. You are flying your Python 'Stellar Wanderer'. You have 1 active mission. Credit balance: 500M CR. Combat rank: Dangerous."
  }
}
```

#### `GET /api/dashboard/state`

Return the current live game state summary. Lightweight endpoint that reads from the in-memory GameStateManager without touching disk.

**Response**:

```json
{
  "success": true,
  "data": {
    "initialized": true,
    "lastUpdated": "2025-01-15T22:30:00.000Z",
    "commander": {
      "name": "Jameson",
      "fid": "F123456",
      "credits": 500000000,
      "ranks": { "combat": { "rank": 6 }, "trade": { "rank": 8 }, "explore": { "rank": 7 } },
      "gameMode": "Open"
    },
    "ship": {
      "type": "python",
      "name": "Stellar Wanderer",
      "ident": "SW-01A",
      "fuel": { "main": 28.5, "reserve": 0.83, "mainCapacity": 32.0 },
      "hullHealth": 0.95,
      "cargoCount": 40,
      "cargoCapacity": 292
    },
    "location": {
      "system": "Sol",
      "body": "Earth",
      "station": "Abraham Lincoln",
      "docked": true,
      "supercruise": false,
      "landed": false,
      "onFoot": false
    },
    "session": { "jumps": 12, "totalDistance": 150.5, "fuelUsed": 35.2 },
    "activeMissions": 1,
    "hasCarrier": false,
    "eventsProcessed": 4523
  }
}
```

---

### Key Bindings

All bindings endpoints require a valid `.binds` file configured via `BINDINGS_FILE`. A middleware automatically loads/validates the bindings file before every request.

#### `GET /api/bindings`

Return the full parsed binding set with summary statistics.

**Response**:

```json
{
  "success": true,
  "data": {
    "presetName": "Custom",
    "totalActions": 450,
    "boundActions": 312,
    "unboundActions": 138,
    "devices": ["Keyboard", "060A044F"],
    "categories": ["Ship", "SRV", "Camera", "OnFoot"],
    "bindings": { "...": "..." }
  }
}
```

#### `GET /api/bindings/device/:deviceName`

Return all bindings that reference a specific input device.

**Path Parameters**:
- `deviceName` -- Device identifier (case-insensitive). Examples: `Keyboard`, `060A044F`.

**Response**:

```json
{
  "success": true,
  "data": {
    "device": "Keyboard",
    "count": 125,
    "bindings": [ { "action": "YawLeftButton", "primary": { "device": "Keyboard", "key": "Key_A" }, "secondary": null, "axis": null, "category": "Ship" } ]
  }
}
```

#### `GET /api/bindings/category/:category`

Return all bindings for a specific category.

**Path Parameters**:
- `category` -- Binding category string (e.g. `Ship`, `SRV`, `Camera`, `OnFoot`).

**Response**:

```json
{
  "success": true,
  "data": {
    "category": "Ship",
    "count": 200,
    "bindings": [ ]
  }
}
```

#### `GET /api/bindings/conflicts`

Return all binding conflicts (same device + key mapped to multiple actions).

**Response**:

```json
{
  "success": true,
  "data": {
    "count": 3,
    "conflicts": [
      { "key": "Key_A", "device": "Keyboard", "actions": ["YawLeftButton", "BuggyYawLeftButton"] }
    ]
  }
}
```

#### `GET /api/bindings/unbound`

Return all action names that have no binding assigned.

**Response**:

```json
{
  "success": true,
  "data": {
    "count": 138,
    "actions": ["NightVisionToggle", "HumanoidClearAuthorityLevel"]
  }
}
```

#### `GET /api/bindings/search`

Search bindings by action name substring.

**Query Parameters**:
- `q` (string, required) -- Search term. Case-insensitive.

**Response**:

```json
{
  "success": true,
  "data": {
    "query": "yaw",
    "count": 4,
    "bindings": [ ]
  }
}
```

#### `POST /api/bindings/reload`

Force-reload bindings from the `.binds` file on disk. Useful after the user edits their bindings externally.

**Request Body**: None.

**Response**: Same shape as `GET /api/bindings`.

#### `PUT /api/bindings/:action`

Update a binding for a specific action. Writes the change to the `.binds` XML file and reloads the cache. Broadcasts a `bindings:updated` WebSocket event on success.

**Path Parameters**:
- `action` -- Action name (e.g. `YawLeftButton`).

**Request Body**:

```json
{
  "slot": "primary | secondary | axis",
  "clear": false,
  "device": "Keyboard",
  "key": "Key_A",
  "modifiers": [{ "device": "Keyboard", "key": "Key_LShift" }],
  "axis": "Joy_XAxis",
  "inverted": false,
  "deadzone": 0.0
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `slot` | `"primary" \| "secondary" \| "axis"` | Yes | Which binding slot to update |
| `clear` | `boolean` | No | Set `true` to unbind (remove the binding) |
| `device` | `string` | Conditional | Required unless `clear: true` |
| `key` | `string` | Conditional | Required for primary/secondary slots |
| `modifiers` | `Array<{device, key}>` | No | Modifier keys |
| `axis` | `string` | No | Axis name (for axis slot) |
| `inverted` | `boolean` | No | Invert axis |
| `deadzone` | `number` | No | Axis deadzone |

**Response**: The updated `BindingEntry` object.

---

### COVAS (Voice Assistant)

#### `POST /api/covas/text`

Send a text command through the full COVAS pipeline (LLM processing, intent extraction, command execution, TTS synthesis).

**Request Body**:

```json
{ "text": "What system am I in?" }
```

**Response**:

```json
{
  "success": true,
  "data": {
    "inputText": "What system am I in?",
    "responseText": "You are currently in the Sol system.",
    "intent": "query_location",
    "commandResult": { "success": true, "response": "You are currently in the Sol system." },
    "audioBase64": "UklGRi...",
    "latency": {
      "stt": null,
      "llm": 250,
      "command": 5,
      "tts": 180,
      "total": 435
    }
  }
}
```

#### `POST /api/covas/audio`

Send raw audio for speech-to-text transcription, then full pipeline processing. Expects `Content-Type: application/octet-stream` with raw audio bytes.

**Headers**:
- `Content-Type: application/octet-stream` (required)
- `X-Audio-Format` (optional) -- Audio format hint. Defaults to `webm`. Alternatives: `wav`, `mp3`, `ogg`.

**Query Parameters**:
- `format` (string, optional) -- Alternative to `X-Audio-Format` header.

**Request Body**: Raw audio bytes (Buffer).

**Response**: Same shape as `POST /api/covas/text` but `latency.stt` will be populated.

#### `GET /api/covas/state`

Get the current COVAS pipeline state.

**Response**:

```json
{
  "success": true,
  "data": {
    "stage": "Idle",
    "enabled": true,
    "ptt": { "active": false, "held": false },
    "availableCommands": ["query_location", "set_pips", "find_trade", "..."],
    "ttsProvider": "piper"
  }
}
```

The `ttsProvider` field is one of: `"piper"`, `"elevenlabs"`, or `"none"`.

#### `POST /api/covas/enable`

Enable or disable the COVAS pipeline. Broadcasts `covas:state` via WebSocket.

**Request Body**:

```json
{ "enabled": true }
```

**Response**:

```json
{ "success": true, "data": { "enabled": true } }
```

#### `POST /api/covas/ptt`

Control push-to-talk state.

**Request Body**:

```json
{ "action": "start | stop | toggle" }
```

If `action` is omitted or unrecognized, defaults to toggle.

**Response**:

```json
{ "success": true, "data": { "ptt": { "active": true, "held": true } } }
```

#### `POST /api/covas/clear`

Clear the COVAS conversation history (LLM context).

**Request Body**: None.

**Response**:

```json
{ "success": true }
```

---

### Trade Analysis

#### `GET /api/trade`

Trade overview including current cargo, session count, and aggregate profit.

**Response**:

```json
{
  "success": true,
  "data": {
    "currentSystem": "Sol",
    "currentStation": "Abraham Lincoln",
    "cargo": [ { "name": "Gold", "count": 40 } ],
    "cargoUsed": 40,
    "cargoCapacity": 292,
    "sessionCount": 5,
    "totalProfit": 12500000,
    "currentSession": null
  }
}
```

#### `GET /api/trade/sessions`

All recorded trade sessions (up to 100 retained).

**Response**:

```json
{
  "success": true,
  "data": [
    {
      "id": "trade-1705351200000",
      "startTime": "2025-01-15T20:00:00.000Z",
      "endTime": "2025-01-15T20:30:00.000Z",
      "startSystem": "Sol",
      "startStation": "Abraham Lincoln",
      "transactions": [
        { "type": "buy", "commodity": "Gold", "count": 40, "price": 10000, "total": 400000, "profit": 0, "timestamp": "..." },
        { "type": "sell", "commodity": "Gold", "count": 40, "price": 15000, "total": 600000, "profit": 200000, "timestamp": "..." }
      ],
      "totalProfit": 200000,
      "totalRevenue": 600000,
      "totalCost": 400000,
      "cargoTonsMoved": 80
    }
  ]
}
```

#### `GET /api/trade/current`

Current active trade session (null if no session is active).

**Response**: A single `TradeSession` object or `null`.

#### `GET /api/trade/search`

Search for commodity sell prices near the commander's current system via the Spansh API.

**Query Parameters**:
- `commodity` (string, required) -- Commodity name to search for. Results are cached for 15 minutes.

**Response**:

```json
{
  "success": true,
  "data": {
    "commodity": "Gold",
    "prices": [
      {
        "name": "Gold",
        "buyPrice": 9000,
        "sellPrice": 15000,
        "demand": 5000,
        "supply": 200,
        "station": "Jameson Memorial",
        "system": "Shinrarta Dezhra",
        "distanceLy": 50.5,
        "landingPadSize": "L",
        "updatedAt": "2025-01-15T18:00:00.000Z"
      }
    ]
  }
}
```

---

### Engineering & Materials

#### `GET /api/engineering`

Engineering overview with material statistics and engineer progress.

**Response**:

```json
{
  "success": true,
  "data": {
    "raw": { "category": "Raw", "count": 40, "held": 800, "capacity": 1200, "fillPercent": 67 },
    "manufactured": { "category": "Manufactured", "count": 35, "held": 600, "capacity": 1000, "fillPercent": 60 },
    "encoded": { "category": "Encoded", "count": 30, "held": 500, "capacity": 900, "fillPercent": 56 },
    "engineers": [
      { "name": "Felicity Farseer", "id": 300100, "progress": "Unlocked", "rank": 5, "rankProgress": 0 }
    ]
  }
}
```

#### `GET /api/engineering/materials`

All materials grouped by category.

**Response**:

```json
{
  "success": true,
  "data": {
    "raw": [ { "name": "iron", "nameLocalised": "Iron", "count": 250, "maximum": 300, "grade": 1, "category": "Raw" } ],
    "manufactured": [ ],
    "encoded": [ ]
  }
}
```

#### `GET /api/engineering/materials/:category`

Materials filtered to a specific category.

**Path Parameters**:
- `category` -- One of: `Raw`, `Manufactured`, `Encoded` (case-sensitive).

**Response**: Array of `Material` objects.

#### `GET /api/engineering/materials/search`

Search materials by name substring.

**Query Parameters**:
- `q` (string) -- Search term (case-insensitive).

**Response**: Array of matching `Material` objects.

#### `GET /api/engineering/materials/near-cap`

Materials at 90% or more of their storage capacity.

**Response**: Array of `Material` objects that are near cap.

#### `GET /api/engineering/engineers`

All known engineers with unlock status and rank.

**Response**:

```json
{
  "success": true,
  "data": [
    { "name": "Felicity Farseer", "id": 300100, "progress": "Unlocked", "rank": 5, "rankProgress": 0 },
    { "name": "The Dweller", "id": 300180, "progress": "Known", "rank": null, "rankProgress": 0 }
  ]
}
```

---

### Mission Control

#### `GET /api/missions`

Mission overview with counts and statistics.

**Response**:

```json
{
  "success": true,
  "data": {
    "active": 5,
    "completed": 42,
    "failed": 2,
    "abandoned": 1,
    "activeTotalReward": 5000000,
    "completedTotalReward": 85000000,
    "expiringSoon": 1,
    "missions": [ ]
  }
}
```

#### `GET /api/missions/active`

All currently active missions from live game state.

**Response**: Array of `MissionState` objects.

#### `GET /api/missions/completed`

Completed mission history (up to 200 retained).

**Response**:

```json
{
  "success": true,
  "data": [
    { "missionId": 123456, "name": "Deliver 40 Gold", "faction": "Federation", "reward": 500000, "completedAt": "2025-01-15T22:00:00.000Z" }
  ]
}
```

#### `GET /api/missions/expiring`

Missions expiring within a time window.

**Query Parameters**:
- `hours` (number, optional) -- Time window in hours. Default: `24`.

**Response**: Array of `MissionState` objects that expire within the window.

#### `GET /api/missions/by-destination`

Active missions grouped by destination system.

**Response**:

```json
{
  "success": true,
  "data": {
    "Alpha Centauri": [ { "name": "Deliver Gold", "destinationSystem": "Alpha Centauri", "..." : "..." } ],
    "Sol": [ ]
  }
}
```

---

### Navigation & Exploration

#### `GET /api/navigation`

Navigation overview with location, jump stats, and recent jumps.

**Response**:

```json
{
  "success": true,
  "data": {
    "currentLocation": { "system": "Sol", "body": "Earth", "station": "Abraham Lincoln", "docked": true, "supercruise": false, "landed": false, "onFoot": false, "coordinates": { "x": 0, "y": 0, "z": 0 }, "allegiance": "Federation", "economy": "High Tech", "government": "Democracy", "security": "High" },
    "totalJumps": 150,
    "totalDistance": 3500.5,
    "uniqueSystems": 120,
    "recentJumps": [ ],
    "sessionStats": { "jumps": 12, "distance": 150.5, "fuelUsed": 35.2, "systemsVisited": 10 }
  }
}
```

#### `GET /api/navigation/location`

Current location details from live game state.

**Response**:

```json
{
  "success": true,
  "data": {
    "system": "Sol",
    "body": "Earth",
    "station": "Abraham Lincoln",
    "docked": true,
    "supercruise": false,
    "landed": false,
    "onFoot": false,
    "coordinates": { "x": 0, "y": 0, "z": 0 },
    "allegiance": "Federation",
    "economy": "High Tech",
    "government": "Democracy",
    "security": "High"
  }
}
```

#### `GET /api/navigation/history`

Jump history sorted newest-first.

**Query Parameters**:
- `limit` (number, optional) -- Max entries to return. Default: `50`. Max retained: 500.

**Response**:

```json
{
  "success": true,
  "data": [
    { "timestamp": "...", "system": "Sol", "coordinates": { "x": 0, "y": 0, "z": 0 }, "distance": 4.4, "fuelUsed": 0.8, "starClass": "G" }
  ]
}
```

#### `GET /api/navigation/visited`

List of all unique system names visited during this server session.

**Response**: Array of system name strings.

#### `GET /api/navigation/lookup/:systemName`

Look up a system via EDSM. Results are cached for 10 minutes.

**Path Parameters**:
- `systemName` -- System name (URL-encoded if contains spaces).

**Response**:

```json
{
  "success": true,
  "data": {
    "name": "Sol",
    "coordinates": { "x": 0, "y": 0, "z": 0 },
    "allegiance": "Federation",
    "economy": "High Tech",
    "government": "Democracy",
    "security": "High",
    "population": 22780871430,
    "bodyCount": 30
  }
}
```

Returns `404` if the system is not found on EDSM.

---

### Graphics Profile Manager

#### `GET /api/graphics`

List all HUD color profiles and the currently active one.

**Response**:

```json
{
  "success": true,
  "data": {
    "profiles": [
      { "name": "Default Orange", "description": "Stock Elite Dangerous HUD", "hudMatrix": { "matrixRed": [1,0,0], "matrixGreen": [0,1,0], "matrixBlue": [0,0,1] }, "fov": null },
      { "name": "VAYU Green", "description": "Forest green theme matching VAYU dashboard", "hudMatrix": { "..." : "..." }, "fov": null },
      { "name": "Midnight Blue", "description": "Deep blue tactical display", "hudMatrix": { "..." : "..." }, "fov": null },
      { "name": "Imperial White", "description": "Clean white and gold imperial aesthetic", "hudMatrix": { "..." : "..." }, "fov": null }
    ],
    "activeProfile": "Default Orange",
    "overridePath": "C:\\Users\\...\\GraphicsConfigurationOverride.xml"
  }
}
```

#### `GET /api/graphics/current`

Read the current `GraphicsConfigurationOverride.xml` content.

**Response**:

```json
{
  "success": true,
  "data": {
    "xml": "<?xml version=\"1.0\" ...?>...",
    "activeProfile": "Default Orange"
  }
}
```

#### `POST /api/graphics/apply`

Apply a named graphics profile. Writes to `GraphicsConfigurationOverride.xml`.

**Request Body**:

```json
{ "profileName": "VAYU Green" }
```

**Response**:

```json
{ "success": true, "data": { "applied": "VAYU Green" } }
```

#### `POST /api/graphics/profiles`

Create or update a custom graphics profile.

**Request Body**:

```json
{
  "name": "My Custom HUD",
  "description": "Personal color scheme",
  "hudMatrix": {
    "matrixRed": [0.5, 0.3, 0.2],
    "matrixGreen": [0.1, 0.8, 0.1],
    "matrixBlue": [0.2, 0.1, 0.9]
  },
  "fov": 60
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | Yes | Profile name |
| `description` | `string` | No | Human-readable description |
| `hudMatrix` | `object` | Yes | RGB color matrix with `matrixRed`, `matrixGreen`, `matrixBlue` (each `[number, number, number]`) |
| `fov` | `number \| null` | No | Field of view override |

**Response**: Updated profiles array.

---

### Audio Profile Manager

#### `GET /api/audio`

List all audio profiles and the active one.

**Response**:

```json
{
  "success": true,
  "data": {
    "profiles": [
      { "name": "Default", "description": "Balanced audio levels", "masterVolume": 80, "gameVolume": 70, "voiceVolume": 90, "musicVolume": 50, "ttsVolume": 85 },
      { "name": "Combat", "description": "Loud game audio, reduced music", "masterVolume": 90, "gameVolume": 90, "voiceVolume": 100, "musicVolume": 20, "ttsVolume": 95 },
      { "name": "Exploration", "description": "Relaxed levels with ambient music", "masterVolume": 70, "gameVolume": 50, "voiceVolume": 80, "musicVolume": 80, "ttsVolume": 75 },
      { "name": "Streaming", "description": "Balanced for capture", "masterVolume": 75, "gameVolume": 65, "voiceVolume": 85, "musicVolume": 40, "ttsVolume": 80 }
    ],
    "activeProfile": "Default"
  }
}
```

#### `POST /api/audio/apply`

Apply a named audio profile.

**Request Body**:

```json
{ "profileName": "Combat" }
```

**Response**:

```json
{ "success": true, "data": { "applied": "Combat" } }
```

Returns `404` if the profile is not found.

#### `POST /api/audio/profiles`

Create or update an audio profile.

**Request Body**:

```json
{
  "name": "Night Mode",
  "description": "Quiet for late-night play",
  "masterVolume": 50,
  "gameVolume": 40,
  "voiceVolume": 70,
  "musicVolume": 30,
  "ttsVolume": 60
}
```

| Field | Type | Required | Default |
|-------|------|----------|---------|
| `name` | `string` | Yes | -- |
| `description` | `string` | No | `""` |
| `masterVolume` | `number` | No | `80` |
| `gameVolume` | `number` | No | `70` |
| `voiceVolume` | `number` | No | `90` |
| `musicVolume` | `number` | No | `50` |
| `ttsVolume` | `number` | No | `85` |

**Response**: Updated profiles array.

#### `DELETE /api/audio/profiles/:name`

Delete a custom audio profile. The `"Default"` profile cannot be deleted.

**Path Parameters**:
- `name` -- Profile name.

**Response**:

```json
{ "success": true }
```

Returns `400` if the profile cannot be deleted (e.g. the Default profile).

---

### Alert System

#### `GET /api/alerts`

Alert overview with all rules and recent alert history.

**Response**:

```json
{
  "success": true,
  "data": {
    "rules": [
      { "id": "low_fuel", "name": "Low Fuel", "enabled": true, "condition": "low_fuel", "threshold": 25, "tts": true },
      { "id": "low_hull", "name": "Low Hull", "enabled": true, "condition": "low_hull", "threshold": 50, "tts": true },
      { "id": "mission_expiring", "name": "Mission Expiring", "enabled": true, "condition": "mission_expiring", "threshold": 24, "tts": false },
      { "id": "interdiction", "name": "Interdiction", "enabled": true, "condition": "interdiction", "tts": true },
      { "id": "heat_warning", "name": "Heat Warning", "enabled": true, "condition": "heat_warning", "tts": false },
      { "id": "under_attack", "name": "Under Attack", "enabled": true, "condition": "under_attack", "tts": true },
      { "id": "shield_down", "name": "Shield Down", "enabled": true, "condition": "shield_down", "tts": true }
    ],
    "recent": [ ]
  }
}
```

#### `GET /api/alerts/rules`

All alert rules.

**Response**: Array of `AlertRule` objects.

#### `PUT /api/alerts/rules/:id`

Update an alert rule (enable/disable, change threshold, etc.).

**Path Parameters**:
- `id` -- Rule ID (e.g. `low_fuel`, `low_hull`).

**Request Body**: Partial `AlertRule` fields to merge.

```json
{ "enabled": false, "threshold": 15 }
```

**Response**: Updated rules array. Returns `404` if rule not found.

#### `GET /api/alerts/history`

Alert history sorted newest-first.

**Query Parameters**:
- `limit` (number, optional) -- Max entries. Default: `50`.

**Response**:

```json
{
  "success": true,
  "data": [
    {
      "id": "alert-1",
      "ruleId": "low_fuel",
      "ruleName": "Low Fuel",
      "message": "Low fuel: 18% remaining",
      "severity": "warning",
      "timestamp": "2025-01-15T22:00:00.000Z",
      "acknowledged": false
    }
  ]
}
```

#### `POST /api/alerts/acknowledge/:id`

Acknowledge a specific alert.

**Path Parameters**:
- `id` -- Alert event ID (e.g. `alert-1`).

**Response**:

```json
{ "success": true }
```

Returns `404` if alert not found.

#### `POST /api/alerts/clear`

Clear all alert history.

**Request Body**: None.

**Response**:

```json
{ "success": true }
```

---

### Pre-flight Checklist

#### `GET /api/preflight`

Full pre-flight checklist with summary. Evaluates fuel, hull, cargo, missions, modules, rebuy cost, and docking status.

**Response**:

```json
{
  "success": true,
  "data": {
    "checks": [
      { "id": "fuel_level", "label": "Fuel Level", "category": "fuel", "status": "pass", "message": "85% -- 27.2t / 32.0t" },
      { "id": "hull_integrity", "label": "Hull Integrity", "category": "ship", "status": "pass", "message": "95%" },
      { "id": "cargo_space", "label": "Cargo Space", "category": "cargo", "status": "pass", "message": "40/292t used" },
      { "id": "missions", "label": "Active Missions", "category": "missions", "status": "info", "message": "1 active" },
      { "id": "module_health", "label": "Module Health", "category": "modules", "status": "pass", "message": "All modules healthy" },
      { "id": "rebuy_cost", "label": "Rebuy Available", "category": "ship", "status": "pass", "message": "Rebuy: 5.2M CR" },
      { "id": "docking_status", "label": "Docking Status", "category": "ship", "status": "info", "message": "Docked at Abraham Lincoln" }
    ],
    "summary": {
      "total": 7,
      "pass": 4,
      "warn": 0,
      "fail": 0,
      "info": 2,
      "readyToLaunch": true
    }
  }
}
```

Check statuses: `pass`, `warn`, `fail`, `info`.

#### `GET /api/preflight/checklist`

Run the checklist and return individual check items (same items array as the `checks` field above, without the summary wrapper).

**Response**: Array of `PreflightCheck` objects.

---

### Powerplay & BGS

#### `GET /api/powerplay`

Powerplay overview with pledged power, merits, rank, and recent activities.

**Response**:

```json
{
  "success": true,
  "data": {
    "power": "Aisling Duval",
    "merits": 1500,
    "rank": 3,
    "timePledged": 120,
    "recentActivities": [
      { "timestamp": "...", "type": "deliver", "system": "Cubeo", "amount": 500, "details": "Delivered 500 merits" }
    ]
  }
}
```

#### `GET /api/powerplay/activities`

Powerplay merit activity history.

**Query Parameters**:
- `limit` (number, optional) -- Max entries. Default: `50`. Max retained: 200.

**Response**: Array of `PowerplayActivity` objects.

---

### Ships / Fleet Management

#### `GET /api/ships`

Fleet overview with current ship, stored ships, and total fleet value.

**Response**:

```json
{
  "success": true,
  "data": {
    "currentShip": {
      "type": "python",
      "displayName": "Python",
      "name": "Stellar Wanderer",
      "ident": "SW-01A",
      "shipId": 5,
      "hullValue": 56978180,
      "modulesValue": 120000000,
      "rebuy": 8848909,
      "hullHealth": 0.95,
      "fuel": { "main": 28.5, "reserve": 0.83, "mainCapacity": 32.0 },
      "cargo": 40,
      "cargoCapacity": 292,
      "modules": 18
    },
    "storedShips": [
      { "shipId": 3, "shipType": "asp", "displayName": "Asp Explorer", "name": "Pathfinder", "system": "Sol", "station": "Abraham Lincoln", "value": 32000000, "hot": false, "inTransit": false }
    ],
    "fleetSize": 2,
    "totalFleetValue": 208978180
  }
}
```

#### `GET /api/ships/current`

Details about the currently active ship.

**Response**: A single `CurrentShip` object (same as `currentShip` above).

#### `GET /api/ships/stored`

All stored ships across the galaxy.

**Response**: Array of `StoredShip` objects.

---

### Community Integrations (EDSM, Inara)

#### `GET /api/community`

Community integration status, configured links, and local commander profile.

**Response**:

```json
{
  "success": true,
  "data": {
    "links": {
      "edsm": { "configured": true, "commanderName": "Jameson", "url": "https://www.edsm.net/en/user/profile/id/0/cmdr/Jameson" },
      "inara": { "configured": false, "commanderName": null, "url": null }
    },
    "profile": {
      "source": "local",
      "name": "Jameson",
      "url": "",
      "credits": 500000000,
      "combatRank": "Dangerous",
      "tradeRank": "Tycoon",
      "explorationRank": "Pioneer"
    }
  }
}
```

#### `GET /api/community/edsm/system/:name`

Look up a system on EDSM with coordinates and information.

**Path Parameters**:
- `name` -- System name (URL-encoded).

**Response**: EDSM system info object. Returns `404` if not found on EDSM.

#### `GET /api/community/edsm/traffic/:name`

Get the EDSM traffic report for a system.

**Path Parameters**:
- `name` -- System name (URL-encoded).

**Response**: EDSM traffic report object.

#### `GET /api/community/edsm/commander`

Get the commander's position from EDSM. Requires `EDSM_API_KEY` and `EDSM_COMMANDER_NAME` configuration.

**Response**: EDSM commander position object. Returns `null` if not configured.

---

### GalNet News

#### `GET /api/galnet`

Fetch the latest GalNet news articles from Frontier's CMS API. Articles are cached and refreshed every 30 minutes.

**Query Parameters**:
- `limit` (number, optional) -- Max articles. Default: `20`.

**Response**:

```json
{
  "success": true,
  "data": [
    {
      "id": "abc123-...",
      "title": "Thargoid War Intensifies",
      "body": "<p>The conflict between humanity and the Thargoids...</p>",
      "date": "2025-01-15T12:00:00.000Z",
      "image": null
    }
  ]
}
```

#### `GET /api/galnet/:id`

Fetch a single GalNet article by ID.

**Path Parameters**:
- `id` -- Article ID.

**Response**: Single `GalnetArticle` object. Returns `404` if not found.

#### `POST /api/galnet/refresh`

Force a fresh fetch of GalNet articles, bypassing the 30-minute cache.

**Request Body**: None.

**Response**:

```json
{ "success": true, "data": { "count": 20 } }
```

---

### Session Analytics

#### `GET /api/analytics`

Session analytics overview with hourly rates and chart data.

**Response**:

```json
{
  "success": true,
  "data": {
    "session": {
      "jumps": 12,
      "totalDistance": 150.5,
      "fuelUsed": 35.2,
      "creditsEarned": 5000000,
      "creditsSpent": 500000,
      "netProfit": 4500000,
      "bodiesScanned": 25,
      "bountiesCollected": 3,
      "missionsCompleted": 2,
      "deaths": 0,
      "miningRefined": 0,
      "tradeProfit": 200000,
      "explorationEarnings": 1500000,
      "elapsedSeconds": 7200
    },
    "rates": {
      "creditsPerHour": 2250000,
      "jumpsPerHour": 6.0,
      "scansPerHour": 12.5
    },
    "chartData": [ ]
  }
}
```

#### `GET /api/analytics/session`

Current session stats with commander, ship, and location context.

**Response**:

```json
{
  "success": true,
  "data": {
    "jumps": 12,
    "totalDistance": 150.5,
    "commander": { "name": "Jameson", "credits": 500000000 },
    "ship": { "type": "python", "name": "Stellar Wanderer" },
    "location": { "system": "Sol", "station": "Abraham Lincoln" }
  }
}
```

#### `GET /api/analytics/snapshots`

Periodic session snapshots taken every 5 minutes (up to 500 retained). Useful for charting session progress over time.

**Response**:

```json
{
  "success": true,
  "data": [
    {
      "timestamp": "2025-01-15T22:00:00.000Z",
      "jumps": 10,
      "distance": 120.0,
      "creditsEarned": 3000000,
      "creditsSpent": 200000,
      "bodiesScanned": 20,
      "bountiesCollected": 2,
      "missionsCompleted": 1,
      "deaths": 0,
      "miningRefined": 0,
      "tradeProfit": 150000,
      "explorationEarnings": 1000000,
      "elapsedMinutes": 60
    }
  ]
}
```

---

### Screenshots

#### `GET /api/screenshots`

All indexed screenshots with metadata and stats.

**Query Parameters**:
- `limit` (number, optional) -- Max entries. Default: `50`.
- `offset` (number, optional) -- Pagination offset. Default: `0`.

**Response**:

```json
{
  "success": true,
  "data": {
    "screenshots": [
      { "filename": "Screenshot_0001.bmp", "path": "C:\\...\\Screenshot_0001.bmp", "timestamp": "...", "system": "Sol", "body": "Earth", "ship": "Python", "event": "Screenshot", "size": 5242880 }
    ],
    "stats": {
      "total": 150,
      "directory": "C:\\...\\Pictures\\Frontier Developments\\Elite Dangerous",
      "recentCount": 10
    }
  }
}
```

#### `GET /api/screenshots/search`

Search screenshots by system name, filename, or ship name.

**Query Parameters**:
- `q` (string, required) -- Search term (case-insensitive).

**Response**: Array of `ScreenshotMeta` objects.

#### `GET /api/screenshots/system/:name`

Get all screenshots taken in a specific system.

**Path Parameters**:
- `name` -- System name (case-insensitive match).

**Response**: Array of `ScreenshotMeta` objects.

#### `POST /api/screenshots/scan`

Rescan the screenshots directory for new files.

**Request Body**: None.

**Response**:

```json
{ "success": true, "data": { "scanned": 150 } }
```

---

### Fleet Carrier

#### `GET /api/carrier`

Carrier overview including state, upkeep, and aggregate jump stats. Returns `null` if no carrier data is available.

**Response**:

```json
{
  "success": true,
  "data": {
    "callsign": "V8Y-42G",
    "name": "VAYU Station",
    "fuelLevel": 800,
    "jumpRangeCurr": 500,
    "services": [ ],
    "finance": { "carrierBalance": 5000000000 },
    "jumpHistory": [ ],
    "upkeep": { "warning": false, "message": "Carrier funded for ~192 weeks.", "balance": 5000000000, "weeklyUpkeep": 8750000 },
    "totalJumps": 15,
    "totalDistance": 5200.0
  }
}
```

#### `GET /api/carrier/state`

Raw carrier state from the game state manager. Returns `null` if no carrier.

**Response**: `CarrierState` object or `null`.

#### `GET /api/carrier/fuel-calc`

Calculate tritium fuel requirements for a given distance.

**Query Parameters**:
- `distance` (number, required) -- Distance in light-years. Must be positive.

**Response**:

```json
{
  "success": true,
  "data": {
    "distance": 2000,
    "currentFuel": 800,
    "fuelCapacity": 1000,
    "jumpRangeCurr": 500,
    "jumpRangeMax": 500,
    "estimatedFuelPerJump": 110,
    "jumpsNeeded": 4,
    "totalFuelRequired": 440,
    "hasSufficientFuel": true,
    "fuelDeficit": 0
  }
}
```

Returns `400` if distance is not valid. Returns `404` if no carrier data.

#### `GET /api/carrier/upkeep`

Upkeep cost breakdown and funding warning.

**Response**:

```json
{
  "success": true,
  "data": {
    "warning": false,
    "message": "Carrier funded for ~192 weeks.",
    "balance": 5000000000,
    "weeklyUpkeep": 8750000
  }
}
```

The `warning` flag is `true` when less than 4 weeks of funding remain.

#### `GET /api/carrier/jumps`

Carrier jump history.

**Response**: Array of carrier jump records.

---

### Mining

#### `GET /api/mining`

Mining overview with current session, profit rate, and lifetime stats.

**Response**:

```json
{
  "success": true,
  "data": {
    "currentSession": null,
    "profitPerHour": null,
    "totalSessions": 5,
    "lifetimeRefined": 350
  }
}
```

#### `GET /api/mining/current`

Current active mining session. Returns `null` if not mining.

**Response**:

```json
{
  "success": true,
  "data": {
    "startTime": "2025-01-15T22:00:00.000Z",
    "endTime": null,
    "system": "HIP 21991",
    "body": "1 A Ring",
    "ring": null,
    "miningType": "laser",
    "asteroidsProspected": 15,
    "asteroidsCracked": 0,
    "prospectorResults": [ ],
    "cracks": [ ],
    "yields": [ { "name": "Painite", "nameLocalised": null, "count": 25, "estimatedValuePerUnit": null, "estimatedTotalValue": null } ],
    "totalRefined": 25,
    "totalEstimatedValue": 0,
    "collectorsLaunched": 0,
    "prospectorsLaunched": 15,
    "cargoCollected": 0
  }
}
```

#### `GET /api/mining/sessions`

All previous mining sessions (up to 50 retained).

**Response**: Array of `MiningSession` objects.

#### `GET /api/mining/profit`

Estimated profit per hour for the current mining session.

**Response**:

```json
{ "success": true, "data": { "profitPerHour": 15000000 } }
```

Returns `null` if no active session or session is too new (< 60 seconds).

---

### Pip Management

#### `GET /api/pips`

Pip overview with current allocation, context, and recommendation.

**Response**:

```json
{
  "success": true,
  "data": {
    "current": { "sys": 4, "eng": 4, "wep": 4 },
    "context": "exploring",
    "recommendation": { "context": "exploring", "recommended": { "sys": 4, "eng": 8, "wep": 0 }, "reason": "Speed for efficient travel" },
    "historyCount": 42
  }
}
```

#### `GET /api/pips/current`

Current pip allocation (sys/eng/wep, each 0-8 in half-pip increments summing to 12).

**Response**:

```json
{ "success": true, "data": { "sys": 4, "eng": 4, "wep": 4 } }
```

#### `GET /api/pips/recommendation`

Context-aware pip recommendation based on current game state.

Contexts: `combat`, `fleeing`, `scooping`, `docking`, `mining`, `exploring`, `trading`.

**Response**:

```json
{
  "success": true,
  "data": {
    "context": "exploring",
    "recommended": { "sys": 4, "eng": 8, "wep": 0 },
    "reason": "Speed for efficient travel"
  }
}
```

#### `GET /api/pips/history`

Pip change history sorted newest-first.

**Query Parameters**:
- `limit` (number, optional) -- Max entries. Default: `50`. Max retained: 200.

**Response**:

```json
{
  "success": true,
  "data": [
    { "timestamp": "2025-01-15T22:30:00.000Z", "pips": { "sys": 8, "eng": 4, "wep": 0 }, "context": "trading" }
  ]
}
```

---

### Threats & Intel

#### `GET /api/threats`

Threat overview for the current system with security info, known threats, and recent interdictions.

**Response**:

```json
{
  "success": true,
  "data": {
    "currentSystem": {
      "system": "Deciat",
      "security": "Low",
      "government": "Feudal",
      "allegiance": "Independent",
      "threat": { "system": "Deciat", "threatLevel": "high", "reason": "Known ganking hotspot", "lastReported": "..." },
      "hasCargoRisk": true
    },
    "recentInterdictions": [ ],
    "totalInterdictions": 3,
    "knownThreatSystems": 15
  }
}
```

#### `GET /api/threats/current`

Threat assessment for the current system only. Returns `null` if no threat data for the current system.

**Response**:

```json
{
  "success": true,
  "data": { "system": "Deciat", "threatLevel": "high", "reason": "Known ganking hotspot", "lastReported": "..." }
}
```

#### `GET /api/threats/known`

All known dangerous systems from the threat database.

**Response**: Array of `ThreatSystem` objects. Threat levels: `low`, `medium`, `high`, `extreme`.

#### `GET /api/threats/interdictions`

Interdiction history sorted newest-first.

**Query Parameters**:
- `limit` (number, optional) -- Max entries. Default: `20`. Max retained: 100.

**Response**:

```json
{
  "success": true,
  "data": [
    { "timestamp": "...", "system": "Deciat", "isPlayer": true, "interdictor": "CMDR BadGuy", "submitted": false, "survived": true }
  ]
}
```

---

### Odyssey (On-Foot)

#### `GET /api/odyssey`

Odyssey overview with on-foot status, suits, loadouts, backpack, and exobiology.

**Response**:

```json
{
  "success": true,
  "data": {
    "onFoot": false,
    "currentLoadout": null,
    "suits": [ ],
    "loadouts": 0,
    "backpackItems": 0,
    "materialsCount": 15,
    "speciesAnalysed": 42,
    "activeScans": 0
  }
}
```

#### `GET /api/odyssey/suits`

Suit inventory with display names resolved.

**Response**: Array of suit objects with `displayName` field.

#### `GET /api/odyssey/loadouts`

All suit loadout configurations.

**Response**: Array of `SuitLoadout` objects.

#### `GET /api/odyssey/backpack`

Current backpack contents grouped by item type.

**Response**:

```json
{
  "success": true,
  "data": {
    "items": [ { "name": "energycell", "nameLocalised": "Energy Cell", "type": "Component", "count": 5 } ],
    "grouped": { "Component": [ { "name": "Energy Cell", "count": 5 } ] },
    "totalItems": 5
  }
}
```

#### `GET /api/odyssey/materials`

On-foot materials (Odyssey-specific, separate from ship materials).

**Response**:

```json
{
  "success": true,
  "data": {
    "materials": [ { "name": "graphene", "nameLocalised": "Graphene", "category": "Chemical", "count": 10 } ],
    "grouped": { "Chemical": [ { "name": "Graphene", "count": 10 } ] }
  }
}
```

#### `GET /api/odyssey/scans`

Active exobiology scans.

**Response**:

```json
{
  "success": true,
  "data": {
    "scans": [ ],
    "speciesAnalysed": 42,
    "inProgress": [ ],
    "completed": [ ]
  }
}
```

#### `GET /api/odyssey/farm-guide`

Component farming guide (loaded from `data/odyssey-components.json`).

**Query Parameters**:
- `component` (string, optional) -- Filter by component name substring (case-insensitive). If omitted, returns the full guide.

**Response**:

```json
{
  "success": true,
  "data": [
    {
      "component": "Graphene",
      "category": "Chemical",
      "sources": [
        { "settlementType": "Industrial", "method": "Loot containers", "likelihood": "High" }
      ]
    }
  ]
}
```

---

### Ship Outfitting

#### `GET /api/outfitting`

Outfitting overview with current loadout, stored modules, and stats.

**Response**:

```json
{
  "success": true,
  "data": {
    "currentLoadout": {
      "ship": "python",
      "displayName": "Python",
      "name": "Stellar Wanderer",
      "modules": [
        {
          "slot": "MainEngines",
          "item": "int_engine_size6_class5",
          "displayName": "6A Thrusters",
          "on": true,
          "priority": 0,
          "health": 1.0,
          "value": 15000000,
          "engineered": true,
          "engineeringDetails": {
            "engineer": "Professor Palin",
            "blueprint": "Engine_Dirty",
            "level": 5,
            "experimentalEffect": "Drag Drives"
          }
        }
      ],
      "hullValue": 56978180,
      "modulesValue": 120000000,
      "rebuy": 8848909
    },
    "storedModules": [ ],
    "stats": {
      "totalModules": 18,
      "engineeredModules": 8,
      "storedModuleCount": 5
    }
  }
}
```

#### `GET /api/outfitting/loadout`

Current ship loadout with full module details.

**Response**: The `currentLoadout` object as described above.

#### `GET /api/outfitting/stored-modules`

All stored modules across the galaxy.

**Response**:

```json
{
  "success": true,
  "data": [
    { "slot": "MediumHardpoint1", "name": "hpt_multicannon_fixed_medium", "displayName": "2F Multi-Cannon", "engineered": false, "hot": false, "system": "Sol", "marketId": 128000000 }
  ]
}
```

---

### Trivia & Training

#### `GET /api/trivia`

Trivia stats overview including question bank size, categories, session history, and accuracy.

**Response**:

```json
{
  "success": true,
  "data": {
    "questionBank": 250,
    "categories": ["lore", "ships", "exploration", "combat", "engineering"],
    "sessionsPlayed": 10,
    "totalCorrect": 72,
    "totalQuestions": 100,
    "accuracy": 72,
    "currentQuiz": null
  }
}
```

#### `GET /api/trivia/random`

Get a single random trivia question. The `correctIndex` is stripped from the response to prevent cheating.

**Query Parameters**:
- `category` (string, optional) -- Filter by category.

**Response**:

```json
{
  "success": true,
  "data": {
    "id": 42,
    "question": "What is the maximum jump range of a stock Sidewinder?",
    "answers": ["7.56 LY", "8.0 LY", "6.5 LY", "9.2 LY"],
    "category": "ships",
    "difficulty": "easy",
    "explanation": "The stock Sidewinder has a jump range of 7.56 LY."
  }
}
```

Returns `404` if no questions available.

#### `POST /api/trivia/start`

Start a new quiz session with configurable parameters.

**Request Body**:

```json
{
  "count": 10,
  "category": "lore",
  "difficulty": "medium"
}
```

| Field | Type | Required | Default |
|-------|------|----------|---------|
| `count` | `number` | No | `10` |
| `category` | `string` | No | All categories |
| `difficulty` | `string` | No | All difficulties |

**Response**: Quiz session object with questions (correctIndex stripped).

#### `POST /api/trivia/answer`

Submit an answer for the current quiz.

**Request Body**:

```json
{
  "questionId": 42,
  "selectedIndex": 0,
  "timeMs": 5000
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "correct": true,
    "correctIndex": 0,
    "explanation": "The stock Sidewinder has a jump range of 7.56 LY."
  }
}
```

Returns `400` if no active quiz or invalid question.

#### `POST /api/trivia/end`

End the current quiz session and record the result.

**Request Body**: None.

**Response**: Full quiz session object including score. Returns `400` if no active quiz.

#### `GET /api/trivia/history`

All completed quiz sessions.

**Response**: Array of `QuizSession` objects (up to 50 retained).

---

### Personal Logbook

#### `GET /api/logbook`

List log entries with pagination and stats.

**Query Parameters**:
- `limit` (number, optional) -- Max entries. Default: `50`.
- `offset` (number, optional) -- Pagination offset. Default: `0`.

**Response**:

```json
{
  "success": true,
  "data": {
    "entries": [
      {
        "id": "log-1-1705351200000",
        "content": "Arrived in Sol. The cradle of humanity.",
        "timestamp": "2025-01-15T22:00:00.000Z",
        "system": "Sol",
        "body": "Earth",
        "station": "Abraham Lincoln",
        "ship": "Python",
        "shipName": "Stellar Wanderer",
        "tags": ["Sol", "exploration"],
        "source": "text"
      }
    ],
    "stats": {
      "totalEntries": 25,
      "voiceEntries": 5,
      "textEntries": 20,
      "systemsCovered": 10
    }
  }
}
```

#### `POST /api/logbook`

Create a new log entry. Automatically tagged with the current system, body, station, and ship.

**Request Body**:

```json
{
  "content": "Beautiful views of the rings from the surface.",
  "source": "text",
  "tags": ["scenic", "rings"]
}
```

| Field | Type | Required | Default |
|-------|------|----------|---------|
| `content` | `string` | Yes | -- |
| `source` | `"text" \| "voice"` | No | `"text"` |
| `tags` | `string[]` | No | `[]` |

**Response**: The created `LogEntry` object.

#### `GET /api/logbook/search`

Search log entries by content, system name, or tag.

**Query Parameters**:
- `q` (string, required) -- Search term (case-insensitive).

**Response**: Array of matching `LogEntry` objects.

#### `GET /api/logbook/system/:name`

Get all log entries from a specific system.

**Path Parameters**:
- `name` -- System name (case-insensitive match).

**Response**: Array of `LogEntry` objects.

#### `GET /api/logbook/:id`

Get a single log entry by ID.

**Path Parameters**:
- `id` -- Entry ID.

**Response**: Single `LogEntry` object. Returns `404` if not found.

#### `PUT /api/logbook/:id`

Update an existing log entry.

**Path Parameters**:
- `id` -- Entry ID.

**Request Body**:

```json
{
  "content": "Updated entry text.",
  "tags": ["updated", "Sol"]
}
```

**Response**: Updated `LogEntry` object. Returns `404` if not found.

#### `DELETE /api/logbook/:id`

Delete a log entry.

**Path Parameters**:
- `id` -- Entry ID.

**Response**:

```json
{ "success": true }
```

Returns `404` if not found.

---

### Journal Archiver

#### `GET /api/archiver`

Archive status including backup directory, retention, total backups, and size.

**Response**:

```json
{
  "success": true,
  "data": {
    "backupDir": "C:\\...\\vayu-backups",
    "retentionDays": 90,
    "totalBackups": 45,
    "totalSizeMB": 125.3,
    "lastScan": "2025-01-15T22:00:00.000Z",
    "recentBackups": [
      { "sourceFile": "Journal.2025-01-15T200000.01.log", "backupPath": "C:\\...\\vayu-backups\\Journal.2025-01-15T200000.01.log", "timestamp": "...", "sizeBytes": 524288 }
    ]
  }
}
```

#### `GET /api/archiver/scan`

Scan the journal directory and report how many files need backup.

**Response**:

```json
{ "success": true, "data": { "total": 120, "needsBackup": 3 } }
```

#### `POST /api/archiver/backup`

Run a backup now -- copies all un-backed-up journal files to the backup directory.

**Request Body**: None.

**Response**:

```json
{ "success": true, "data": { "backed": 3, "errors": [] } }
```

#### `GET /api/archiver/history`

List of all backup records from this server session.

**Response**: Array of `BackupRecord` objects sorted newest-first.

---

### Music Player

#### `GET /api/music`

Full player state including current track, queue, playback status, and volume.

**Response**:

```json
{
  "success": true,
  "data": {
    "playing": true,
    "currentTrack": { "id": "dQw4w9WgXcQ", "title": "Elite Dangerous OST", "artist": "Erasmus Talbot", "duration": "3:42", "thumbnail": "https://...", "url": "https://www.youtube.com/watch?v=..." },
    "position": 0,
    "volume": 80,
    "repeat": "none",
    "shuffle": false,
    "queue": [ ],
    "queueLength": 0,
    "historyLength": 5
  }
}
```

#### `GET /api/music/search`

Search YouTube for music tracks via yt-dlp. Returns up to 5 results.

**Query Parameters**:
- `q` (string, required) -- Search query.

**Response**:

```json
{
  "success": true,
  "data": [
    { "id": "abc123", "title": "Elite Dangerous Main Theme", "artist": "Erasmus Talbot", "duration": "5:22", "thumbnail": "https://...", "url": "https://www.youtube.com/watch?v=abc123" }
  ]
}
```

Returns `400` if `q` is missing.

#### `GET /api/music/stream/:id`

Proxy audio stream for a YouTube video. Resolves the direct audio URL via yt-dlp and proxies the CDN response to avoid CORS issues. Designed to be used as an `<audio>` element `src`.

**Path Parameters**:
- `id` -- YouTube video ID (alphanumeric, hyphens, underscores only).

**Response**: Raw audio stream with appropriate `Content-Type` and `Content-Length` headers.

Returns `400` for invalid video IDs, `502` if upstream audio fetch fails, `500` for other errors.

#### `POST /api/music/queue`

Add a track to the playback queue. If no track is currently playing, starts playback automatically.

**Request Body**:

```json
{
  "track": {
    "id": "abc123",
    "title": "Elite Dangerous Main Theme",
    "artist": "Erasmus Talbot",
    "duration": "5:22",
    "thumbnail": "https://...",
    "url": "https://www.youtube.com/watch?v=abc123"
  }
}
```

**Response**: Updated player state.

#### `DELETE /api/music/queue/:index`

Remove a track from the queue by index.

**Path Parameters**:
- `index` -- Zero-based queue index.

**Response**: Updated player state. Returns `400` for invalid index.

#### `POST /api/music/queue/clear`

Clear the entire playback queue.

**Request Body**: None.

**Response**: Updated player state.

#### `POST /api/music/play`

Resume playback. If nothing is playing and the queue is non-empty, starts the next track.

**Request Body**: None.

**Response**: Updated player state.

#### `POST /api/music/pause`

Pause playback.

**Request Body**: None.

**Response**: Updated player state.

#### `POST /api/music/next`

Skip to the next track in the queue. Moves the current track to history.

**Request Body**: None.

**Response**: Updated player state.

#### `POST /api/music/previous`

Go to the previous track from history.

**Request Body**: None.

**Response**: Updated player state.

#### `POST /api/music/volume`

Set the playback volume.

**Request Body**:

```json
{ "volume": 80 }
```

Volume is clamped to `0-100`.

**Response**: Updated player state.

#### `POST /api/music/repeat`

Set the repeat mode.

**Request Body**:

```json
{ "mode": "none | one | all" }
```

**Response**: Updated player state.

#### `POST /api/music/shuffle`

Enable or disable shuffle mode.

**Request Body**:

```json
{ "enabled": true }
```

**Response**: Updated player state.

#### `GET /api/music/queue`

Get the current playback queue.

**Response**: Array of `MusicTrack` objects.

#### `GET /api/music/history`

Get the play history sorted newest-first (up to 100 retained).

**Response**: Array of `MusicTrack` objects.

---

### CHAKRA (Real-Time Telemetry)

CHAKRA provides the initial state load via REST. After that, all real-time data flows through WebSocket events (`journal:event`, `status:flags`).

#### `GET /api/chakra/state`

Get the current CHAKRA state including recent events buffer and activity context.

**Response**:

```json
{
  "success": true,
  "data": {
    "recentEvents": [
      { "event": "FSDJump", "timestamp": "2025-01-15T22:30:00.000Z", "StarSystem": "Sol", "..." : "..." }
    ],
    "activity": {
      "activity": "Supercruise",
      "detail": "Sol",
      "since": "2025-01-15T22:28:00.000Z"
    },
    "eventCount": 4523
  }
}
```

The `recentEvents` buffer holds up to 200 events. The `activity` field is auto-detected from event patterns and reflects the current in-game activity (e.g. Supercruise, Docked, Combat, Scanning, Landed, etc.).

---

## WebSocket Events

Connect to `ws://localhost:3001` for real-time updates.

### Message Envelope

All WebSocket messages use a typed envelope format:

```json
{
  "type": "namespace:event",
  "payload": { },
  "timestamp": "2025-01-15T22:30:00.000Z",
  "sequence": 42,
  "correlationId": "optional-request-id"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `type` | `string` | Event type discriminant (see below) |
| `payload` | `object` | Event-specific data |
| `timestamp` | `string` | ISO 8601 creation time |
| `sequence` | `number` | Monotonically increasing counter |
| `correlationId` | `string?` | Optional request/response pairing ID |

### Client Subscription

Clients can subscribe to specific event types. If no subscriptions are set, the client receives all events.

**Subscribe** (Client -> Server):

```json
{ "type": "client:subscribe", "payload": { "events": ["journal:event", "status:flags"] } }
```

**Unsubscribe** (Client -> Server):

```json
{ "type": "client:unsubscribe", "payload": { "events": ["journal:event"] } }
```

---

### Connection Lifecycle

#### `connection:open`

**Direction**: Server -> Client (on connect)

Sent immediately when a client connects.

**Payload**:

```json
{
  "serverVersion": "1.0.0",
  "clientId": "vayu-lqf8g2-a3b4c5",
  "availableSubscriptions": []
}
```

#### `connection:pong`

**Direction**: Server -> Client

Response to a `client:ping` message.

**Payload**:

```json
{ "timestamp": "2025-01-15T22:30:00.000Z" }
```

#### `connection:error`

**Direction**: Server -> Client

Sent when the server cannot parse a client message.

**Payload**:

```json
{ "message": "Invalid message format", "code": "PARSE_ERROR" }
```

---

### Client Messages

#### `client:ping`

**Direction**: Client -> Server

Application-level ping. Server responds with `connection:pong`.

#### `client:subscribe`

**Direction**: Client -> Server

Subscribe to specific event types. Only matching events will be delivered.

**Payload**: `{ "events": ["journal:event", "status:flags", ...] }`

#### `client:unsubscribe`

**Direction**: Client -> Server

Unsubscribe from event types.

**Payload**: `{ "events": ["journal:event"] }`

#### `client:command`

**Direction**: Client -> Server

Send a command to the server (for future COVAS integration).

**Payload**: `{ "command": "set_pips", "args": { "sys": 4, "eng": 8, "wep": 0 } }`

---

### Game State Events

#### `state:commander`

**Direction**: Server -> Client

Broadcast when commander data changes (credits, ranks, reputation).

**Payload**: Full `CommanderState` object from the game state.

#### `state:ship`

**Direction**: Server -> Client

Broadcast when ship data changes (loadout, fuel, hull damage, shield state). May include an extra `_shieldsUp` boolean field on ShieldState events.

**Payload**: Full `ShipState` object from the game state.

#### `state:location`

**Direction**: Server -> Client

Broadcast when location changes (system, body, station, docked/supercruise state).

**Payload**: Full `LocationState` object from the game state.

#### `state:materials`

**Direction**: Server -> Client

Broadcast when material inventory changes.

**Payload**: Full materials object `{ raw: Material[], manufactured: Material[], encoded: Material[] }`.

#### `state:missions`

**Direction**: Server -> Client

Broadcast when mission list changes (accepted, completed, failed, abandoned).

**Payload**: Array of `MissionState` objects.

#### `state:carrier`

**Direction**: Server -> Client

Broadcast when fleet carrier state changes.

**Payload**: `CarrierState` object or `null`.

#### `state:odyssey`

**Direction**: Server -> Client

Broadcast when Odyssey state changes (suits, loadouts, backpack, materials).

**Payload**: Full `OdysseyState` object.

#### `state:session`

**Direction**: Server -> Client

Broadcast when session statistics update.

**Payload**: `SessionState` object.

#### `state:full`

**Direction**: Server -> Client

Full game state snapshot. Sent on demand or after major state resets.

**Payload**: Complete `GameState` object.

#### `state:patch`

**Direction**: Server -> Client

Incremental state update using JSON Patch (RFC 6902) operations.

**Payload**:

```json
{
  "operations": [
    { "op": "replace", "path": "/commander/credits", "value": 500000000 }
  ]
}
```

---

### Journal Events

#### `journal:event`

**Direction**: Server -> Client

Every journal event from the game is forwarded in real-time via this event type. This is the primary live data feed used by the CHAKRA telemetry view.

**Payload**: Raw journal event object as parsed from the journal file.

```json
{
  "event": "FSDJump",
  "timestamp": "2025-01-15T22:30:00.000Z",
  "StarSystem": "Sol",
  "StarPos": [0, 0, 0],
  "JumpDist": 4.4,
  "FuelUsed": 0.8,
  "..."
}
```

#### `journal:batch`

**Direction**: Server -> Client

Batch of journal events, used during initial backlog replay.

**Payload**:

```json
{
  "events": [ { "event": "...", "..." : "..." } ],
  "isBacklog": true
}
```

#### `journal:backlog`

**Direction**: Server -> Client

Signals that a backlog replay is starting or completing.

---

### Status Flags

#### `status:flags`

**Direction**: Server -> Client

Broadcast when `Status.json` changes (polled periodically). Contains the full status flag bitfields and derived values.

**Payload**:

```json
{
  "flags": 16842765,
  "flags2": 0,
  "pips": [4, 4, 4],
  "fireGroup": 0,
  "guiFocus": 0,
  "fuelMain": 28.5,
  "fuelReservoir": 0.83,
  "cargo": 40,
  "legalState": "Clean",
  "latitude": null,
  "longitude": null,
  "altitude": null,
  "heading": null,
  "bodyName": null,
  "planetRadius": null,
  "destination": null
}
```

#### `status:pips`

**Direction**: Server -> Client

Pip allocation changes (subset of `status:flags`).

#### `status:firegroup`

**Direction**: Server -> Client

Active fire group changed.

#### `status:guifocus`

**Direction**: Server -> Client

GUI focus changed (galaxy map, system map, etc.).

#### `status:fuel`

**Direction**: Server -> Client

Fuel level changed.

#### `status:cargo`

**Direction**: Server -> Client

Cargo mass changed.

---

### COVAS Events

#### `covas:state`

**Direction**: Server -> Client

Broadcast when the COVAS pipeline state changes (enabled/disabled, stage transitions).

**Payload**:

```json
{
  "stage": "Idle | Transcribing | Processing | Generating | Synthesizing",
  "enabled": true,
  "pttActive": false
}
```

#### `covas:response`

**Direction**: Server -> Client

Broadcast when a COVAS pipeline completes processing a command (text or voice).

**Payload**: Full `PipelineResult` object:

```json
{
  "inputText": "What system am I in?",
  "responseText": "You are in Sol.",
  "intent": "query_location",
  "commandResult": { "success": true, "response": "You are in Sol." },
  "audioBase64": "UklGRi...",
  "latency": { "stt": null, "llm": 250, "command": 5, "tts": 180, "total": 435 }
}
```

#### `covas:listening`

**Direction**: Server -> Client

COVAS is actively listening for voice input.

#### `covas:transcription`

**Direction**: Server -> Client

Speech-to-text transcription result.

#### `covas:command`

**Direction**: Server -> Client

A command was extracted and is being executed.

#### `covas:audio`

**Direction**: Server -> Client

TTS audio data is available.

#### `covas:error`

**Direction**: Server -> Client

An error occurred in the COVAS pipeline.

---

### Alert Events

#### `alert:fired`

**Direction**: Server -> Client

Broadcast when an alert rule triggers.

**Payload**:

```json
{
  "id": "alert-1",
  "ruleId": "low_fuel",
  "ruleName": "Low Fuel",
  "message": "Low fuel: 18% remaining",
  "severity": "warning",
  "timestamp": "2025-01-15T22:00:00.000Z",
  "acknowledged": false
}
```

Severities: `info`, `warning`, `critical`.

#### `alert:acknowledged`

**Direction**: Server -> Client

An alert has been acknowledged.

---

### Bindings Events

#### `bindings:updated`

**Direction**: Server -> Client

Broadcast when a key binding is modified via `PUT /api/bindings/:action`.

**Payload**:

```json
{
  "action": "YawLeftButton",
  "slot": "primary",
  "entry": { "action": "YawLeftButton", "primary": { "device": "Keyboard", "key": "Key_A" }, "..." : "..." }
}
```

---

### Pip Events

#### `pips:update`

**Direction**: Server -> Client

Broadcast when pip allocation changes (from `Status.json` polling).

**Payload**:

```json
{
  "pips": { "sys": 4, "eng": 8, "wep": 0 },
  "context": "exploring",
  "recommendation": { "context": "exploring", "recommended": { "sys": 4, "eng": 8, "wep": 0 }, "reason": "Speed for efficient travel" }
}
```

---

### Threat Events

#### `threat:interdiction`

**Direction**: Server -> Client

Broadcast when the commander is interdicted.

**Payload**:

```json
{
  "timestamp": "2025-01-15T22:30:00.000Z",
  "system": "Deciat",
  "isPlayer": true,
  "interdictor": "CMDR BadGuy",
  "submitted": false,
  "survived": true
}
```

#### `threat:system_alert`

**Direction**: Server -> Client

Broadcast when jumping into a known dangerous system.

**Payload**:

```json
{
  "system": "Deciat",
  "threatLevel": "high",
  "reason": "Known ganking hotspot"
}
```

#### `threat:anarchy_warning`

**Direction**: Server -> Client

Broadcast when entering an Anarchy system while carrying cargo.

**Payload**:

```json
{
  "system": "LHS 3447",
  "cargoCount": 40,
  "message": "Anarchy system with 40t cargo -- increased piracy risk"
}
```

---

### Market Events

#### `market:update`

**Direction**: Server -> Client

Market data has been updated.

#### `market:snapshot`

**Direction**: Server -> Client

Full market snapshot captured.

---

### Navigation Events

#### `nav:route`

**Direction**: Server -> Client

A new route has been plotted.

#### `nav:routeClear`

**Direction**: Server -> Client

The plotted route has been cleared.

#### `nav:fsdTarget`

**Direction**: Server -> Client

FSD target system has changed.

---

### Mining Events

#### `mining:update`

**Direction**: Server -> Client

Mining session data has been updated.

#### `mining:prospector`

**Direction**: Server -> Client

A prospector limpet returned results.

---

### Music Events

#### `music:state`

**Direction**: Server -> Client

Music player state has changed.

#### `music:track`

**Direction**: Server -> Client

Current track has changed.

---

### Server Events

#### `server:info`

**Direction**: Server -> Client

Server information broadcast.

**Payload**:

```json
{
  "version": "1.0.0",
  "uptimeSeconds": 3600,
  "connectedClients": 2,
  "journalWatcherActive": true,
  "covasEnabled": true,
  "gameRunning": true
}
```

#### `server:config`

**Direction**: Server -> Client

Server configuration has changed.

#### `server:error`

**Direction**: Server -> Client

A server-level error occurred.
