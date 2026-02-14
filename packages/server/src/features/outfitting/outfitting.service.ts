/**
 * Ship transfer & outfitting service.
 * Manages stored ships, transfer costs, and module availability lookups.
 */

import { gameStateManager } from '../../core/game-state.js';
import { eventBus } from '../../core/event-bus.js';
import { resolveShipName, resolveModuleName } from '@vayu/shared';

interface StoredModule {
  slot: string;
  name: string;
  displayName: string;
  engineered: boolean;
  hot: boolean;
  system: string;
  marketId: number;
}

class OutfittingService {
  private storedModules: StoredModule[] = [];

  constructor() {
    eventBus.onJournalEvent('StoredModules', (evt) => {
      const raw = evt as any;
      const items = raw.Items as Array<any> || [];
      this.storedModules = items.map((item) => ({
        slot: item.Slot || '',
        name: item.Name || '',
        displayName: resolveModuleName(item.Name || ''),
        engineered: !!(item.Engineering),
        hot: item.Hot || false,
        system: item.StarSystem || 'Unknown',
        marketId: item.MarketID || 0,
      }));
    });
  }

  getCurrentLoadout(): object {
    const { ship } = gameStateManager.getState();
    return {
      ship: ship.ship,
      displayName: resolveShipName(ship.ship),
      name: ship.shipName,
      modules: ship.modules.map((m) => ({
        slot: m.slot,
        item: m.item,
        displayName: resolveModuleName(m.item),
        on: m.on,
        priority: m.priority,
        health: m.health,
        value: m.value,
        engineered: !!m.engineering,
        engineeringDetails: m.engineering ? {
          engineer: m.engineering.engineer,
          blueprint: m.engineering.blueprintName,
          level: m.engineering.level,
          experimentalEffect: m.engineering.experimentalEffectLocalised,
        } : null,
      })),
      hullValue: ship.hullValue,
      modulesValue: ship.modulesValue,
      rebuy: ship.rebuy,
    };
  }

  getStoredModules(): StoredModule[] {
    return this.storedModules;
  }

  getOutfittingSummary(): object {
    const loadout = this.getCurrentLoadout() as any;
    const engineeredCount = loadout.modules.filter((m: any) => m.engineered).length;
    return {
      currentLoadout: loadout,
      storedModules: this.storedModules,
      stats: {
        totalModules: loadout.modules.length,
        engineeredModules: engineeredCount,
        storedModuleCount: this.storedModules.length,
      },
    };
  }
}

export const outfittingService = new OutfittingService();
