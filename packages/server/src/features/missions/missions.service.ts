/**
 * Mission control center service.
 * Tracks active missions, completion history, and mission statistics.
 */

import { gameStateManager } from '../../core/game-state.js';
import { eventBus } from '../../core/event-bus.js';
import type { MissionState } from '@vayu/shared';

interface CompletedMission {
  missionId: number;
  name: string;
  faction: string;
  reward: number;
  completedAt: string;
}

class MissionsService {
  private completedMissions: CompletedMission[] = [];
  private failedCount = 0;
  private abandonedCount = 0;

  constructor() {
    eventBus.onJournalEvent('MissionCompleted', (evt) => {
      const raw = evt as any;
      this.completedMissions.push({
        missionId: raw.MissionID || 0,
        name: raw.LocalisedName || raw.Name || 'Unknown',
        faction: raw.Faction || 'Unknown',
        reward: raw.Reward || 0,
        completedAt: evt.timestamp,
      });
      if (this.completedMissions.length > 200) this.completedMissions.shift();
    });

    eventBus.onJournalEvent('MissionFailed', () => { this.failedCount++; });
    eventBus.onJournalEvent('MissionAbandoned', () => { this.abandonedCount++; });
  }

  getActiveMissions(): MissionState[] {
    return gameStateManager.getState().missions;
  }

  getCompletedMissions(): CompletedMission[] {
    return [...this.completedMissions];
  }

  getExpiringMissions(withinHours = 24): MissionState[] {
    const now = Date.now();
    const threshold = withinHours * 60 * 60 * 1000;
    return this.getActiveMissions().filter((m) => {
      if (!m.expiry) return false;
      return new Date(m.expiry).getTime() - now < threshold;
    });
  }

  getMissionStats(): object {
    const active = this.getActiveMissions();
    const totalReward = active.reduce((s, m) => s + m.reward, 0);
    const completedReward = this.completedMissions.reduce((s, m) => s + m.reward, 0);
    return {
      active: active.length,
      completed: this.completedMissions.length,
      failed: this.failedCount,
      abandoned: this.abandonedCount,
      activeTotalReward: totalReward,
      completedTotalReward: completedReward,
      expiringSoon: this.getExpiringMissions().length,
      missions: active,
    };
  }

  getMissionsByDestination(): Record<string, MissionState[]> {
    const grouped: Record<string, MissionState[]> = {};
    for (const m of this.getActiveMissions()) {
      const dest = m.destinationSystem || 'Unknown';
      if (!grouped[dest]) grouped[dest] = [];
      grouped[dest].push(m);
    }
    return grouped;
  }
}

export const missionsService = new MissionsService();
