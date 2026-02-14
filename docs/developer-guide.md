# VAYU Developer Guide

## Monorepo Structure

VAYU uses npm workspaces with three packages:

```
packages/
├── shared/     @vayu/shared   — Types, constants, utilities (dependency of both server and client)
├── server/     @vayu/server   — Express + WebSocket backend
└── client/     @vayu/client   — React 18 + Vite frontend
```

### Build Order

1. `@vayu/shared` must build first (types are consumed by server and client)
2. Server and client can build in parallel after shared

```bash
npm run build:shared         # Build types first
npm run dev                  # Starts both server and client concurrently
```

## Adding a New Feature Module

Every feature follows the **router + service + page** pattern:

### 1. Create Server Service

```
packages/server/src/features/myfeature/
├── myfeature.service.ts    # Business logic singleton
├── myfeature.router.ts     # Express router
└── index.ts                # Barrel export
```

**Service pattern:**
```typescript
import { eventBus } from '../../core/event-bus.js';
import { gameStateManager } from '../../core/game-state.js';

class MyFeatureService {
  private data: any[] = [];

  initialize(): void {
    // Subscribe to journal events
    eventBus.onJournalEvent('SomeEvent', (event) => {
      this.handleEvent(event);
    });
  }

  private handleEvent(event: any): void {
    // Process event, update internal state
  }

  getOverview(): object {
    const state = gameStateManager.getState();
    return {
      // Compose response from internal state + game state
    };
  }
}

export const myFeatureService = new MyFeatureService();
```

**Router pattern:**
```typescript
import { Router, type Request, type Response } from 'express';
import { myFeatureService } from './myfeature.service.js';

export const myFeatureRouter = Router();

myFeatureRouter.get('/', (_req: Request, res: Response) => {
  try {
    const data = myFeatureService.getOverview();
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
```

**Barrel export:**
```typescript
export { myFeatureRouter } from './myfeature.router.js';
export { myFeatureService } from './myfeature.service.js';
```

### 2. Mount the Route

In `packages/server/src/routes/index.ts`:
```typescript
import { myFeatureRouter } from '../features/myfeature/index.js';
apiRouter.use('/myfeature', myFeatureRouter);
```

### 3. Create Client Page

```typescript
// packages/client/src/pages/MyFeature.tsx
import { useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import HoloPanel from '../components/common/HoloPanel';

export default function MyFeature() {
  const { data, loading, fetch: load } = useApi<any>('/myfeature');
  useEffect(() => { load(); }, [load]);

  return (
    <div className="page">
      <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-accent-bright)', letterSpacing: 3, marginBottom: 20 }}>
        MY FEATURE
      </h1>
      {loading && <p style={{ color: 'var(--color-text-muted)' }}>Loading...</p>}
      {data && (
        <HoloPanel title="Feature Data">
          {/* Render data */}
        </HoloPanel>
      )}
    </div>
  );
}
```

### 4. Add Route to App.tsx

```typescript
import MyFeature from './pages/MyFeature';
// Inside <Route element={<Shell />}>:
<Route path="/myfeature" element={<MyFeature />} />
```

### 5. Add Sidebar Link

In `components/layout/Sidebar.tsx`, add to the navigation items array.

## TypeScript Conventions

- Shared types live in `packages/shared/src/types/`
- All journal event interfaces are in `journal-events.ts`
- Import shared types: `import { GameState } from '@vayu/shared'`
- Server files use `.js` extensions in imports (TypeScript ESM)
- Service classes are singletons exported as `const` instances

## Event Bus Patterns

```typescript
import { eventBus } from '../../core/event-bus.js';

// Subscribe to specific journal events (strongly typed)
eventBus.onJournalEvent('FSDJump', (event) => {
  console.log(event.StarSystem);  // TypeScript knows the shape
});

// Subscribe to status updates
eventBus.onStatusUpdate((status) => {
  console.log(status.Pips);
});

// Emit custom events
eventBus.emit('custom:event', payload);
```

## WebSocket Messages

```typescript
import { wsManager } from '../../websocket.js';

// Broadcast to all connected clients
wsManager.broadcast('myfeature:update', {
  // payload data
});
```

Client-side:
```typescript
import { useWebSocket } from '../hooks/useWebSocket';

function MyComponent() {
  useWebSocket('myfeature:update', (payload) => {
    // Handle real-time update
  });
}
```

## Database Migrations

SQLite migrations are in `packages/server/src/database/migrations/`. Create a new numbered SQL file:

```sql
-- 003_my_feature.sql
CREATE TABLE IF NOT EXISTS my_feature_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  data TEXT NOT NULL,
  timestamp TEXT NOT NULL DEFAULT (datetime('now'))
);
```

## UI Components

| Component | Props | Description |
|-----------|-------|-------------|
| `HoloPanel` | `title?, children, style?` | Bordered panel with optional title bar |
| `HoloButton` | `onClick, disabled?, children, style?` | Themed button |
| `HoloProgress` | `value, max, label?` | Progress bar |
| `HoloTable` | `columns, data, onRow?` | Data table |
| `HoloBadge` | `children, color?` | Status badge |
| `ScanLineOverlay` | *(none)* | CRT scanline effect overlay |

## CSS Variables

```css
--color-accent-bright: #4E9A3E;      /* Primary green */
--color-bg-primary: #0a0e14;          /* Darkest background */
--color-bg-secondary: #111822;         /* Panel background */
--color-bg-tertiary: #1a2332;          /* Input/card background */
--color-border: rgba(78, 154, 62, 0.3); /* Border color */
--color-text-muted: #7a8a9a;          /* Secondary text */
--font-display: 'Orbitron', sans-serif; /* Headings */
--font-mono: 'Share Tech Mono', monospace; /* Code/data */
```

## Common Patterns

### Polling for real-time data
```typescript
useEffect(() => {
  load();
  const t = setInterval(load, 10000); // 10s
  return () => clearInterval(t);
}, [load]);
```

### POST actions with loading state
```typescript
const [applying, setApplying] = useState(false);
const apply = async (name: string) => {
  setApplying(true);
  try {
    await apiFetch('/feature/apply', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
    await load(); // Refresh data
  } finally {
    setApplying(false);
  }
};
```

### API response envelope
```typescript
// Server always returns:
res.json({ success: true, data: result });
// or
res.status(500).json({ success: false, error: err.message });
```
