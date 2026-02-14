/**
 * Odyssey on-foot manager service.
 * Tracks suits, weapons, backpack, and component farming.
 */

import { gameStateManager } from '../../core/game-state.js';
import * as fs from 'fs';
import * as path from 'path';
import type { OdysseyState, SuitLoadout } from '@vayu/shared';
import { SUIT_DISPLAY_NAMES } from '@vayu/shared';

interface ComponentFarmGuide {
  component: string;
  category: string;
  sources: Array<{ settlementType: string; method: string; likelihood: string }>;
}

class OdysseyService {
  private farmGuide: ComponentFarmGuide[] = [];

  constructor() {
    this.loadFarmGuide();
  }

  private loadFarmGuide(): void {
    try {
      const dataPath = path.resolve('data/odyssey-components.json');
      if (fs.existsSync(dataPath)) {
        const raw = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
        if (Array.isArray(raw)) this.farmGuide = raw;
      }
    } catch {
      console.warn('[Odyssey] Failed to load component farm guide');
    }
  }

  getOdysseyState(): OdysseyState {
    return gameStateManager.getState().odyssey;
  }

  getSuits(): object[] {
    const state = this.getOdysseyState();
    return state.suits.map((s) => ({
      ...s,
      displayName: SUIT_DISPLAY_NAMES[s.type as keyof typeof SUIT_DISPLAY_NAMES] || s.name,
    }));
  }

  getLoadouts(): SuitLoadout[] {
    return this.getOdysseyState().loadouts;
  }

  getBackpack(): object {
    const state = this.getOdysseyState();
    const grouped: Record<string, Array<{ name: string; count: number }>> = {};
    for (const item of state.backpack) {
      if (!grouped[item.type]) grouped[item.type] = [];
      grouped[item.type].push({ name: item.nameLocalised || item.name, count: item.count });
    }
    return { items: state.backpack, grouped, totalItems: state.backpack.reduce((s, i) => s + i.count, 0) };
  }

  getMaterials(): object {
    const state = this.getOdysseyState();
    const grouped: Record<string, Array<{ name: string; count: number }>> = {};
    for (const mat of state.materials) {
      if (!grouped[mat.category]) grouped[mat.category] = [];
      grouped[mat.category].push({ name: mat.nameLocalised || mat.name, count: mat.count });
    }
    return { materials: state.materials, grouped };
  }

  getActiveScans(): object {
    const state = this.getOdysseyState();
    return {
      scans: state.activeScans,
      speciesAnalysed: state.speciesAnalysed,
      inProgress: state.activeScans.filter((s) => !s.complete),
      completed: state.activeScans.filter((s) => s.complete),
    };
  }

  getFarmGuide(componentName?: string): ComponentFarmGuide[] {
    if (!componentName) return this.farmGuide;
    const lower = componentName.toLowerCase();
    return this.farmGuide.filter((g) => g.component.toLowerCase().includes(lower));
  }

  getOdysseySummary(): object {
    const state = this.getOdysseyState();
    return {
      onFoot: state.onFoot,
      currentLoadout: state.currentLoadout,
      suits: this.getSuits(),
      loadouts: state.loadouts.length,
      backpackItems: state.backpack.reduce((s, i) => s + i.count, 0),
      materialsCount: state.materials.length,
      speciesAnalysed: state.speciesAnalysed,
      activeScans: state.activeScans.filter((s) => !s.complete).length,
    };
  }
}

export const odysseyService = new OdysseyService();
