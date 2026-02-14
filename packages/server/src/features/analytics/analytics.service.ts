/**
 * Session analytics service.
 * Aggregates session statistics and historical data for charting.
 */

import { gameStateManager } from '../../core/game-state.js';
import { eventBus } from '../../core/event-bus.js';

interface SessionSnapshot {
  timestamp: string;
  jumps: number;
  distance: number;
  creditsEarned: number;
  creditsSpent: number;
  bodiesScanned: number;
  bountiesCollected: number;
  missionsCompleted: number;
  deaths: number;
  miningRefined: number;
  tradeProfit: number;
  explorationEarnings: number;
  elapsedMinutes: number;
}

class AnalyticsService {
  private snapshots: SessionSnapshot[] = [];
  private snapshotInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Take a snapshot every 5 minutes
    this.snapshotInterval = setInterval(() => this.takeSnapshot(), 5 * 60 * 1000);

    eventBus.onJournalEvent('LoadGame', () => {
      // New session — start fresh snapshots
      this.takeSnapshot();
    });
  }

  private takeSnapshot(): void {
    const state = gameStateManager.getState();
    if (!state.initialized) return;

    const { session } = state;
    this.snapshots.push({
      timestamp: new Date().toISOString(),
      jumps: session.jumps,
      distance: session.totalDistance,
      creditsEarned: session.creditsEarned,
      creditsSpent: session.creditsSpent,
      bodiesScanned: session.bodiesScanned,
      bountiesCollected: session.bountiesCollected,
      missionsCompleted: session.missionsCompleted,
      deaths: session.deaths,
      miningRefined: session.miningRefined,
      tradeProfit: session.tradeProfit,
      explorationEarnings: session.explorationEarnings,
      elapsedMinutes: Math.floor(session.elapsedSeconds / 60),
    });

    if (this.snapshots.length > 500) this.snapshots.shift();
  }

  getCurrentSession(): object {
    const state = gameStateManager.getState();
    return {
      ...state.session,
      commander: {
        name: state.commander.name,
        credits: state.commander.credits,
      },
      ship: {
        type: state.ship.ship,
        name: state.ship.shipName,
      },
      location: {
        system: state.location.system,
        station: state.location.station,
      },
    };
  }

  getSnapshots(): SessionSnapshot[] {
    return [...this.snapshots];
  }

  getSessionSummary(): object {
    const state = gameStateManager.getState();
    const { session } = state;
    const elapsed = session.elapsedSeconds;
    const perHour = elapsed > 0 ? (3600 / elapsed) : 0;

    return {
      session,
      rates: {
        creditsPerHour: Math.round(session.netProfit * perHour),
        jumpsPerHour: Math.round(session.jumps * perHour * 10) / 10,
        scansPerHour: Math.round(session.bodiesScanned * perHour * 10) / 10,
      },
      chartData: this.snapshots,
    };
  }

  stop(): void {
    if (this.snapshotInterval) {
      clearInterval(this.snapshotInterval);
      this.snapshotInterval = null;
    }
  }
}

export const analyticsService = new AnalyticsService();
