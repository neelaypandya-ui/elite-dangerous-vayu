/**
 * Powerplay & BGS tracking service.
 */

import { gameStateManager } from '../../core/game-state.js';
import { eventBus } from '../../core/event-bus.js';

interface PowerplayActivity {
  timestamp: string;
  type: string;
  system: string;
  amount: number;
  details: string;
}

class PowerplayService {
  private activities: PowerplayActivity[] = [];

  constructor() {
    eventBus.onJournalEvent('PowerplayCollect', (evt) => {
      const raw = evt as any;
      this.addActivity('collect', raw.Power || '', raw.Count || 0, `Collected ${raw.Count} merits`, evt.timestamp);
    });

    eventBus.onJournalEvent('PowerplayDeliver', (evt) => {
      const raw = evt as any;
      this.addActivity('deliver', raw.Power || '', raw.Count || 0, `Delivered ${raw.Count} merits`, evt.timestamp);
    });

    eventBus.onJournalEvent('PowerplayVote', (evt) => {
      const raw = evt as any;
      this.addActivity('vote', raw.Power || '', raw.Votes || 0, `Voted with ${raw.Votes} merits`, evt.timestamp);
    });
  }

  private addActivity(type: string, system: string, amount: number, details: string, timestamp: string): void {
    this.activities.push({ timestamp, type, system, amount, details });
    if (this.activities.length > 200) this.activities.shift();
  }

  getPowerplayState(): object {
    const { commander } = gameStateManager.getState();
    return {
      power: commander.power,
      merits: commander.powerplayMerits,
      rank: commander.powerplayRank,
      timePledged: commander.timePledged,
      recentActivities: this.activities.slice(-20).reverse(),
    };
  }

  getActivities(limit = 50): PowerplayActivity[] {
    return this.activities.slice(-limit).reverse();
  }
}

export const powerplayService = new PowerplayService();
