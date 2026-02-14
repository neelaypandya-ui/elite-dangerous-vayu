/**
 * Command executor — routes COVAS intents to feature services.
 */

import { gameStateManager } from '../core/game-state.js';
import { resolveShipName, formatCredits } from '@vayu/shared';
import { tradeService } from '../features/trade/trade.service.js';
import { actionEngine } from './action-macros.js';

export interface CommandResult {
  success: boolean;
  response: string;
  data?: unknown;
}

type CommandHandler = (entities: Record<string, string | number | boolean>) => Promise<CommandResult>;

const handlers: Record<string, CommandHandler> = {
  check_fuel: async () => {
    const state = gameStateManager.getState();
    const { main, mainCapacity } = state.ship.fuel;
    const pct = mainCapacity > 0 ? ((main / mainCapacity) * 100).toFixed(0) : '0';
    return {
      success: true,
      response: `Fuel at ${pct}%. ${main.toFixed(1)} tons of ${mainCapacity} remaining.`,
      data: { fuelLevel: main, fuelCapacity: mainCapacity, fuelPercent: Number(pct) },
    };
  },

  check_location: async () => {
    const { location } = gameStateManager.getState();
    let response = `Current system: ${location.system}.`;
    if (location.docked && location.station) response += ` Docked at ${location.station}.`;
    else if (location.supercruise) response += ' In supercruise.';
    else if (location.landed) response += ` Landed on ${location.body}.`;
    return { success: true, response };
  },

  check_missions: async () => {
    const { missions } = gameStateManager.getState();
    if (missions.length === 0) return { success: true, response: 'No active missions.' };
    const summaries = missions.slice(0, 5).map((m) => {
      const name = m.nameLocalised || m.name.replace(/^Mission_/i, '').replace(/_/g, ' ');
      return `${name} — ${m.destinationSystem || 'unknown'}`;
    });
    return {
      success: true,
      response: `${missions.length} active mission${missions.length !== 1 ? 's' : ''}:\n${summaries.join('\n')}`,
      data: { count: missions.length },
    };
  },

  check_cargo: async () => {
    const { ship } = gameStateManager.getState();
    if (ship.cargo.length === 0) return { success: true, response: 'Cargo hold is empty.' };
    const items = ship.cargo.slice(0, 5).map((c) => `${c.nameLocalised || c.name}: ${c.count}t`);
    return {
      success: true,
      response: `Cargo: ${ship.cargoCount}/${ship.cargoCapacity}t.\n${items.join('\n')}`,
    };
  },

  check_ship_status: async () => {
    const { ship } = gameStateManager.getState();
    const hullPct = (ship.hullHealth * 100).toFixed(0);
    const fuelPct = ship.fuel.mainCapacity > 0
      ? ((ship.fuel.main / ship.fuel.mainCapacity) * 100).toFixed(0)
      : '0';
    return {
      success: true,
      response: `${resolveShipName(ship.ship)} "${ship.shipName}" — Hull ${hullPct}%, Fuel ${fuelPct}%, Cargo ${ship.cargoCount}/${ship.cargoCapacity}t. Rebuy: ${formatCredits(ship.rebuy, true)}.`,
    };
  },

  navigate_to_system: async (entities) => {
    const system = entities['system'] as string;
    if (!system) return { success: false, response: 'No destination specified.' };
    return {
      success: true,
      response: `Route to ${system} noted. Use the Galaxy Map to plot the jump, Commander.`,
      data: { targetSystem: system },
    };
  },

  play_music: async (entities) => {
    const query = entities['query'] as string;
    if (!query) return { success: false, response: 'What would you like me to play?' };
    return {
      success: true,
      response: `Searching for "${query}"...`,
      data: { query },
    };
  },

  search_commodity_sell: async (entities) => {
    const commodity = entities['commodity'] as string;
    if (!commodity) return { success: false, response: 'Which commodity are you looking to sell?' };

    try {
      const result = await tradeService.findBestSellPrice(commodity, 5);
      if (result.results.length === 0) {
        const resolved = await tradeService.resolveCommodity(commodity);
        if (!resolved) {
          return { success: false, response: `I couldn't find a commodity matching "${commodity}". Try the full name.` };
        }
        return { success: true, response: `No stations currently buying ${result.commodity} with demand. Market data may be stale.` };
      }

      const state = gameStateManager.getState();
      const lines = result.results.slice(0, 5).map((r, i) => {
        const dist = r.distanceLy.toFixed(1);
        const price = r.sellPrice.toLocaleString();
        const pad = r.landingPadSize === 'L' ? 'Large' : r.landingPadSize === 'M' ? 'Medium' : r.landingPadSize;
        return `${i + 1}. ${r.stationName} (${r.systemName}) — ${price} CR, ${dist} ly, ${pad} pad, demand ${r.demand.toLocaleString()}`;
      });

      const response = `Best sell prices for ${result.commodity} near ${state.location.system}:\n${lines.join('\n')}`;
      return { success: true, response, data: result };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, response: `Commodity search failed: ${msg}` };
    }
  },

  // ---------------------------------------------------------------------------
  // Ship action macros — return empty response to preserve LLM personality text
  // ---------------------------------------------------------------------------

  action_combat_ready: async () => {
    const result = await actionEngine.executeMacro('combat_ready');
    return { success: result.success, response: '', data: { macro: 'combat_ready', ...result } };
  },

  action_retract_weapons: async () => {
    const result = await actionEngine.executeMacro('retract_weapons');
    return { success: result.success, response: '', data: { macro: 'retract_weapons', ...result } };
  },

  action_flee: async () => {
    const result = await actionEngine.executeMacro('flee');
    return { success: result.success, response: '', data: { macro: 'flee', ...result } };
  },

  action_deploy_landing_gear: async () => {
    const result = await actionEngine.executeMacro('deploy_landing_gear');
    return { success: result.success, response: '', data: { macro: 'deploy_landing_gear', ...result } };
  },

  action_retract_landing_gear: async () => {
    const result = await actionEngine.executeMacro('retract_landing_gear');
    return { success: result.success, response: '', data: { macro: 'retract_landing_gear', ...result } };
  },

  action_open_cargo_scoop: async () => {
    const result = await actionEngine.executeMacro('open_cargo_scoop');
    return { success: result.success, response: '', data: { macro: 'open_cargo_scoop', ...result } };
  },

  action_close_cargo_scoop: async () => {
    const result = await actionEngine.executeMacro('close_cargo_scoop');
    return { success: result.success, response: '', data: { macro: 'close_cargo_scoop', ...result } };
  },

  action_dock_prepare: async () => {
    const result = await actionEngine.executeMacro('dock_prepare');
    return { success: result.success, response: '', data: { macro: 'dock_prepare', ...result } };
  },

  action_supercruise: async () => {
    const result = await actionEngine.executeMacro('supercruise');
    return { success: result.success, response: '', data: { macro: 'supercruise', ...result } };
  },

  action_silent_running: async () => {
    const result = await actionEngine.executeMacro('silent_running');
    return { success: result.success, response: '', data: { macro: 'silent_running', ...result } };
  },

  action_silent_running_off: async () => {
    const result = await actionEngine.executeMacro('silent_running_off');
    return { success: result.success, response: '', data: { macro: 'silent_running_off', ...result } };
  },

  action_evasive: async () => {
    const result = await actionEngine.executeMacro('evasive');
    return { success: result.success, response: '', data: { macro: 'evasive', ...result } };
  },

  action_night_vision: async () => {
    const result = await actionEngine.executeMacro('night_vision');
    return { success: result.success, response: '', data: { macro: 'night_vision', ...result } };
  },

  action_lights_toggle: async () => {
    const result = await actionEngine.executeMacro('lights_toggle');
    return { success: result.success, response: '', data: { macro: 'lights_toggle', ...result } };
  },

  action_scan_mode: async () => {
    const result = await actionEngine.executeMacro('scan_mode');
    return { success: result.success, response: '', data: { macro: 'scan_mode', ...result } };
  },

  action_galaxy_map: async () => {
    const result = await actionEngine.executeMacro('galaxy_map');
    return { success: result.success, response: '', data: { macro: 'galaxy_map', ...result } };
  },

  action_system_map: async () => {
    const result = await actionEngine.executeMacro('system_map');
    return { success: result.success, response: '', data: { macro: 'system_map', ...result } };
  },

  action_photo_camera: async () => {
    const result = await actionEngine.executeMacro('photo_camera');
    return { success: result.success, response: '', data: { macro: 'photo_camera', ...result } };
  },

  action_boost: async () => {
    const result = await actionEngine.executeMacro('boost');
    return { success: result.success, response: '', data: { macro: 'boost', ...result } };
  },

  action_chaff: async () => {
    const result = await actionEngine.executeMacro('chaff');
    return { success: result.success, response: '', data: { macro: 'chaff', ...result } };
  },

  action_heatsink: async () => {
    const result = await actionEngine.executeMacro('heatsink');
    return { success: result.success, response: '', data: { macro: 'heatsink', ...result } };
  },

  action_shield_cell: async () => {
    const result = await actionEngine.executeMacro('shield_cell');
    return { success: result.success, response: '', data: { macro: 'shield_cell', ...result } };
  },

  search_commodity_buy: async (entities) => {
    const commodity = entities['commodity'] as string;
    if (!commodity) return { success: false, response: 'Which commodity are you looking to buy?' };

    try {
      const result = await tradeService.findBestBuyPrice(commodity, 5);
      if (result.results.length === 0) {
        const resolved = await tradeService.resolveCommodity(commodity);
        if (!resolved) {
          return { success: false, response: `I couldn't find a commodity matching "${commodity}". Try the full name.` };
        }
        return { success: true, response: `No stations currently selling ${result.commodity} with stock. Market data may be stale.` };
      }

      const state = gameStateManager.getState();
      const lines = result.results.slice(0, 5).map((r, i) => {
        const dist = r.distanceLy.toFixed(1);
        const price = r.buyPrice.toLocaleString();
        const pad = r.landingPadSize === 'L' ? 'Large' : r.landingPadSize === 'M' ? 'Medium' : r.landingPadSize;
        return `${i + 1}. ${r.stationName} (${r.systemName}) — ${price} CR, ${dist} ly, ${pad} pad, supply ${r.supply.toLocaleString()}`;
      });

      const response = `Cheapest buy prices for ${result.commodity} near ${state.location.system}:\n${lines.join('\n')}`;
      return { success: true, response, data: result };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, response: `Commodity search failed: ${msg}` };
    }
  },
};

class CommandExecutor {
  async execute(intent: string, entities: Record<string, string | number | boolean>): Promise<CommandResult> {
    const handler = handlers[intent];
    if (!handler) {
      return { success: false, response: `Unknown command: ${intent}` };
    }

    try {
      return await handler(entities);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error(`[COVAS/Cmd] Error executing ${intent}:`, msg);
      return { success: false, response: `Command failed: ${msg}` };
    }
  }

  getAvailableCommands(): string[] {
    return Object.keys(handlers);
  }
}

export const commandExecutor = new CommandExecutor();
