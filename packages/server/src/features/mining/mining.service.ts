/**
 * Mining optimizer service.
 * Tracks prospector results, yields, profit per hour, and crack calculations.
 */

import { gameStateManager } from '../../core/game-state.js';
import { eventBus } from '../../core/event-bus.js';
import type { MiningSession, ProspectorResult, MiningYield } from '@vayu/shared';

class MiningService {
  private sessions: MiningSession[] = [];
  private currentSession: MiningSession | null = null;

  constructor() {
    eventBus.onJournalEvent('ProspectedAsteroid', (evt) => {
      this.ensureSession();
      if (!this.currentSession) return;
      const raw = evt as any;
      const result: ProspectorResult = {
        timestamp: evt.timestamp,
        materials: (raw.Materials || []).map((m: any) => ({
          name: m.Name || '',
          nameLocalised: m.Name_Localised || null,
          proportion: m.Proportion || 0,
        })),
        content: raw.Content || 'Low',
        contentLocalised: raw.Content_Localised || null,
        remaining: raw.Remaining ?? 100,
        motherlodeMaterial: raw.MotherlodeMaterial || null,
        motherlodeMaterialLocalised: raw.MotherlodeMaterial_Localised || null,
      };
      this.currentSession.prospectorResults.push(result);
      this.currentSession.asteroidsProspected++;
      this.currentSession.prospectorsLaunched++;
    });

    eventBus.onJournalEvent('AsteroidCracked', (evt) => {
      this.ensureSession();
      if (!this.currentSession) return;
      const raw = evt as any;
      this.currentSession.asteroidsCracked++;
      this.currentSession.cracks.push({
        timestamp: evt.timestamp,
        body: raw.Body || '',
        motherlodeMaterial: null,
        prospectorResult: null,
      });
      if (this.currentSession.miningType === 'laser') this.currentSession.miningType = 'deepcore';
      else if (this.currentSession.miningType !== 'deepcore') this.currentSession.miningType = 'mixed';
    });

    eventBus.onJournalEvent('MiningRefined', (evt) => {
      this.ensureSession();
      if (!this.currentSession) return;
      const raw = evt as any;
      const name = raw.Type_Localised || raw.Type || 'Unknown';
      const existing = this.currentSession.yields.find((y) => y.name === name);
      if (existing) {
        existing.count++;
      } else {
        this.currentSession.yields.push({
          name,
          nameLocalised: raw.Type_Localised || null,
          count: 1,
          estimatedValuePerUnit: null,
          estimatedTotalValue: null,
        });
      }
      this.currentSession.totalRefined++;
    });

    eventBus.onJournalEvent('Docked', () => this.endSession());
    eventBus.onJournalEvent('FSDJump', () => this.endSession());
  }

  private ensureSession(): void {
    if (this.currentSession) return;
    const state = gameStateManager.getState();
    this.currentSession = {
      startTime: new Date().toISOString(),
      endTime: null,
      system: state.location.system,
      body: state.location.body || '',
      ring: null,
      miningType: 'laser',
      asteroidsProspected: 0,
      asteroidsCracked: 0,
      prospectorResults: [],
      cracks: [],
      yields: [],
      totalRefined: 0,
      totalEstimatedValue: 0,
      collectorsLaunched: 0,
      prospectorsLaunched: 0,
      cargoCollected: 0,
    };
  }

  private endSession(): void {
    if (!this.currentSession || this.currentSession.totalRefined === 0) {
      this.currentSession = null;
      return;
    }
    this.currentSession.endTime = new Date().toISOString();
    this.sessions.push(this.currentSession);
    if (this.sessions.length > 50) this.sessions.shift();
    this.currentSession = null;
  }

  getCurrentSession(): MiningSession | null { return this.currentSession; }
  getSessions(): MiningSession[] { return [...this.sessions]; }

  getProfitPerHour(): number | null {
    if (!this.currentSession) return null;
    const elapsed = (Date.now() - new Date(this.currentSession.startTime).getTime()) / 1000;
    if (elapsed < 60) return null;
    const perHour = 3600 / elapsed;
    return Math.round(this.currentSession.totalEstimatedValue * perHour);
  }

  getMiningSummary(): object {
    return {
      currentSession: this.currentSession,
      profitPerHour: this.getProfitPerHour(),
      totalSessions: this.sessions.length,
      lifetimeRefined: this.sessions.reduce((s, m) => s + m.totalRefined, 0) + (this.currentSession?.totalRefined ?? 0),
    };
  }
}

export const miningService = new MiningService();
