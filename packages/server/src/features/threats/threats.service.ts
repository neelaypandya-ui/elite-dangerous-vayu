/**
 * Proximity & threat intel service.
 * Flags dangerous systems, ganking hotspots, and interdiction history.
 */

import { gameStateManager } from '../../core/game-state.js';
import { eventBus } from '../../core/event-bus.js';
import { wsManager } from '../../websocket.js';
import * as fs from 'fs';
import * as path from 'path';

interface ThreatSystem {
  system: string;
  threatLevel: 'low' | 'medium' | 'high' | 'extreme';
  reason: string;
  lastReported: string;
}

interface InterdictionRecord {
  timestamp: string;
  system: string;
  isPlayer: boolean;
  interdictor: string;
  submitted: boolean;
  survived: boolean;
}

class ThreatsService {
  private knownThreats: ThreatSystem[] = [];
  private interdictions: InterdictionRecord[] = [];

  constructor() {
    this.loadThreatDatabase();

    eventBus.onJournalEvent('Interdicted', (evt) => {
      const raw = evt as any;
      const state = gameStateManager.getState();
      const record: InterdictionRecord = {
        timestamp: evt.timestamp,
        system: state.location.system,
        isPlayer: raw.IsPlayer || false,
        interdictor: raw.Interdictor || 'Unknown',
        submitted: raw.Submitted || false,
        survived: true,
      };
      this.interdictions.push(record);
      if (this.interdictions.length > 100) this.interdictions.shift();
      wsManager.broadcast('threat:interdiction', record);
    });

    eventBus.onJournalEvent('FSDJump', () => {
      this.checkSystemThreats();
    });
  }

  private loadThreatDatabase(): void {
    try {
      const dataPath = path.resolve('data/threat-systems.json');
      if (fs.existsSync(dataPath)) {
        const raw = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
        if (Array.isArray(raw)) {
          this.knownThreats = raw.map((t: any) => ({
            system: t.system || '',
            threatLevel: t.threatLevel || 'medium',
            reason: t.reason || '',
            lastReported: t.lastReported || '',
          }));
        }
      }
    } catch {
      console.warn('[Threats] Failed to load threat database');
    }
  }

  private checkSystemThreats(): void {
    const state = gameStateManager.getState();
    const system = state.location.system;
    const threat = this.knownThreats.find((t) => t.system.toLowerCase() === system.toLowerCase());

    if (threat) {
      wsManager.broadcast('threat:system_alert', {
        system,
        threatLevel: threat.threatLevel,
        reason: threat.reason,
      });
    }

    // Also warn for anarchy systems with cargo
    if (state.location.systemSecurity === 'Anarchy' && state.ship.cargoCount > 0) {
      wsManager.broadcast('threat:anarchy_warning', {
        system,
        cargoCount: state.ship.cargoCount,
        message: `Anarchy system with ${state.ship.cargoCount}t cargo — increased piracy risk`,
      });
    }
  }

  getCurrentSystemThreat(): ThreatSystem | null {
    const system = gameStateManager.getState().location.system;
    return this.knownThreats.find((t) => t.system.toLowerCase() === system.toLowerCase()) ?? null;
  }

  getKnownThreats(): ThreatSystem[] { return this.knownThreats; }
  getInterdictions(limit = 20): InterdictionRecord[] { return this.interdictions.slice(-limit).reverse(); }

  getThreatSummary(): object {
    const state = gameStateManager.getState();
    return {
      currentSystem: {
        system: state.location.system,
        security: state.location.systemSecurity,
        government: state.location.systemGovernment,
        allegiance: state.location.systemAllegiance,
        threat: this.getCurrentSystemThreat(),
        hasCargoRisk: state.location.systemSecurity === 'Anarchy' && state.ship.cargoCount > 0,
      },
      recentInterdictions: this.getInterdictions(5),
      totalInterdictions: this.interdictions.length,
      knownThreatSystems: this.knownThreats.length,
    };
  }
}

export const threatsService = new ThreatsService();
