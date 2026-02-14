/**
 * Pip management advisor service.
 * Reads pip allocations from Status.json and provides context-based recommendations.
 */

import { gameStateManager } from '../../core/game-state.js';
import { eventBus } from '../../core/event-bus.js';
import { wsManager } from '../../websocket.js';

interface PipState {
  sys: number;
  eng: number;
  wep: number;
}

interface PipRecommendation {
  context: string;
  recommended: PipState;
  reason: string;
}

const RECOMMENDATIONS: Record<string, PipRecommendation> = {
  combat: { context: 'combat', recommended: { sys: 4, eng: 0, wep: 8 }, reason: 'Maximize weapon damage and shield regen' },
  fleeing: { context: 'fleeing', recommended: { sys: 4, eng: 8, wep: 0 }, reason: 'Maximum speed for escape' },
  scooping: { context: 'scooping', recommended: { sys: 8, eng: 4, wep: 0 }, reason: 'Shield protection from heat' },
  docking: { context: 'docking', recommended: { sys: 4, eng: 4, wep: 4 }, reason: 'Balanced for maneuvering' },
  mining: { context: 'mining', recommended: { sys: 4, eng: 4, wep: 4 }, reason: 'Balanced for mining operations' },
  exploring: { context: 'exploring', recommended: { sys: 4, eng: 8, wep: 0 }, reason: 'Speed for efficient travel' },
  trading: { context: 'trading', recommended: { sys: 8, eng: 4, wep: 0 }, reason: 'Shield protection for valuable cargo' },
};

class PipsService {
  private currentPips: PipState = { sys: 4, eng: 4, wep: 4 };
  private pipHistory: Array<{ timestamp: string; pips: PipState; context: string }> = [];

  constructor() {
    eventBus.onStatusUpdate((status) => {
      const pips = status.pips;
      if (pips && Array.isArray(pips) && pips.length === 3) {
        const newPips = { sys: pips[0], eng: pips[1], wep: pips[2] };
        if (newPips.sys !== this.currentPips.sys || newPips.eng !== this.currentPips.eng || newPips.wep !== this.currentPips.wep) {
          this.currentPips = newPips;
          const context = this.detectContext();
          this.pipHistory.push({ timestamp: new Date().toISOString(), pips: newPips, context });
          if (this.pipHistory.length > 200) this.pipHistory.shift();
          wsManager.broadcast('pips:update', { pips: newPips, context, recommendation: this.getRecommendation() });
        }
      }
    });
  }

  getCurrentPips(): PipState { return { ...this.currentPips }; }

  detectContext(): string {
    const state = gameStateManager.getState();
    if (state.location.docked) return 'docking';
    if (state.ship.fuel.main < state.ship.fuel.mainCapacity * 0.5) return 'scooping';
    // Could analyze recent events for combat detection
    return 'exploring';
  }

  getRecommendation(): PipRecommendation {
    const context = this.detectContext();
    return RECOMMENDATIONS[context] || RECOMMENDATIONS['docking'];
  }

  getPipHistory(limit = 50): Array<{ timestamp: string; pips: PipState; context: string }> {
    return this.pipHistory.slice(-limit).reverse();
  }

  getPipStats(): object {
    return {
      current: this.currentPips,
      context: this.detectContext(),
      recommendation: this.getRecommendation(),
      historyCount: this.pipHistory.length,
    };
  }
}

export const pipsService = new PipsService();
