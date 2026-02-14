/**
 * @vayu/server — CHAKRA Service
 *
 * Bridges raw journal events from the event bus to WebSocket clients,
 * maintains a circular buffer of recent events for initial page loads,
 * and detects the current activity context from event patterns.
 *
 * Event flow:
 *   EventBus (journal:*) → ChakraService → wsManager.broadcast('journal:event')
 */

import { eventBus } from '../../core/event-bus.js';
import { wsManager } from '../../websocket.js';
import type { AnyJournalEvent } from '@vayu/shared';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ActivityContext {
  /** Short label for the current activity. */
  activity: string;
  /** Optional detail (station name, body, system, etc.). */
  detail: string | null;
  /** Timestamp of the event that set this activity. */
  since: string;
}

export interface ChakraState {
  recentEvents: AnyJournalEvent[];
  activity: ActivityContext;
  eventCount: number;
}

// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------

const LOG_PREFIX = '[CHAKRA]';

function log(message: string, ...args: unknown[]): void {
  console.log(`${LOG_PREFIX} ${message}`, ...args);
}

// ---------------------------------------------------------------------------
// ChakraService
// ---------------------------------------------------------------------------

const MAX_RECENT_EVENTS = 200;

class ChakraService {
  private recentEvents: AnyJournalEvent[] = [];
  private currentActivity: ActivityContext = {
    activity: 'Idle',
    detail: null,
    since: new Date().toISOString(),
  };
  private eventCount = 0;

  constructor() {
    this.registerEventBridge();
    log('Initialized — bridging journal events to WebSocket');
  }

  // -------------------------------------------------------------------------
  // Event Bridge
  // -------------------------------------------------------------------------

  private registerEventBridge(): void {
    eventBus.onAnyJournalEvent((event: AnyJournalEvent) => {
      // Buffer the event
      this.recentEvents.push(event);
      if (this.recentEvents.length > MAX_RECENT_EVENTS) {
        this.recentEvents.shift();
      }
      this.eventCount++;

      // Detect activity context
      this.updateActivity(event);

      // Bridge to WebSocket — the missing link for live event feeds
      wsManager.broadcast('journal:event', event);
    });
  }

  // -------------------------------------------------------------------------
  // Activity Detection
  // -------------------------------------------------------------------------

  private updateActivity(event: AnyJournalEvent): void {
    const raw = event as unknown as Record<string, unknown>;
    let activity: string | null = null;
    let detail: string | null = null;

    switch (event.event) {
      case 'FSDJump':
        activity = 'Hyperspace Jump';
        detail = raw['StarSystem'] as string ?? null;
        break;

      case 'StartJump': {
        const jumpType = raw['JumpType'] as string | undefined;
        if (jumpType === 'Hyperspace') {
          activity = 'Charging FSD';
          const starSystem = raw['StarSystem'] as string | undefined;
          const starClass = raw['StarClass'] as string | undefined;
          detail = starSystem
            ? `${starSystem}${starClass ? ` (${starClass})` : ''}`
            : null;
        } else {
          activity = 'Entering Supercruise';
        }
        break;
      }

      case 'SupercruiseEntry':
        activity = 'Supercruise';
        detail = raw['StarSystem'] as string ?? null;
        break;

      case 'SupercruiseExit':
        activity = 'Normal Space';
        detail = raw['Body'] as string ?? null;
        break;

      case 'Docked':
        activity = 'Docked';
        detail = raw['StationName'] as string ?? null;
        break;

      case 'Undocked':
        activity = 'Departing';
        detail = raw['StationName'] as string ?? null;
        break;

      case 'Touchdown':
        activity = 'Landed';
        detail = raw['Body'] as string ?? null;
        break;

      case 'Liftoff':
        activity = 'Liftoff';
        detail = raw['Body'] as string ?? null;
        break;

      case 'LaunchSRV':
        activity = 'SRV Deployed';
        break;

      case 'DockSRV':
        activity = 'SRV Recovered';
        break;

      case 'ShieldState': {
        const shieldsUp = raw['ShieldsUp'] as boolean | undefined;
        if (shieldsUp === false) {
          activity = 'Under Attack!';
        }
        break;
      }

      case 'HullDamage':
        activity = 'Taking Damage!';
        detail = `${((raw['Health'] as number ?? 1) * 100).toFixed(0)}% hull`;
        break;

      case 'FSSDiscoveryScan':
        activity = 'Scanning System';
        detail = raw['SystemName'] as string ?? null;
        break;

      case 'SAASignalsFound':
        activity = 'Mapping';
        detail = raw['BodyName'] as string ?? null;
        break;

      case 'Scan':
        activity = 'Scanning';
        detail = raw['BodyName'] as string ?? null;
        break;

      case 'MarketBuy':
      case 'MarketSell':
        activity = 'Trading';
        break;

      case 'Died':
        activity = 'Ship Destroyed';
        detail = (raw['KillerName_Localised'] as string) || (raw['KillerName'] as string) || null;
        break;

      case 'Music': {
        const track = raw['MusicTrack'] as string | undefined;
        if (track === 'Combat_Dogfight' || track === 'Combat_SRV' || track === 'Combat_Unknown') {
          activity = 'Combat';
        } else if (track === 'Supercruise') {
          activity = 'Supercruise';
        } else if (track === 'Exploration') {
          activity = 'Exploring';
        }
        break;
      }

      case 'Resurrect':
        activity = 'Respawning';
        break;

      case 'LoadGame':
        activity = 'Session Started';
        detail = raw['Commander'] as string ?? null;
        break;
    }

    if (activity) {
      this.currentActivity = {
        activity,
        detail,
        since: event.timestamp,
      };
    }
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  getState(): ChakraState {
    return {
      recentEvents: [...this.recentEvents],
      activity: { ...this.currentActivity },
      eventCount: this.eventCount,
    };
  }

  getActivity(): ActivityContext {
    return { ...this.currentActivity };
  }
}

// ---------------------------------------------------------------------------
// Singleton Export
// ---------------------------------------------------------------------------

export const chakraService = new ChakraService();
