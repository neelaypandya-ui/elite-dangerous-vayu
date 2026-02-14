/**
 * AGNI — Unit tests for command-executor.ts
 *
 * Tests handler routing, action handlers returning empty responses,
 * and the CommandExecutor public API.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockGetState = vi.fn();
const mockExecuteMacro = vi.fn();
const mockFindBestSellPrice = vi.fn();
const mockFindBestBuyPrice = vi.fn();
const mockResolveCommodity = vi.fn();

vi.mock('../core/game-state.js', () => ({
  gameStateManager: { getState: mockGetState },
}));

vi.mock('@vayu/shared', () => ({
  resolveShipName: (id: string) => `TestShip(${id})`,
  formatCredits: (amount: number, short?: boolean) =>
    short ? `${(amount / 1_000_000).toFixed(2)}M CR` : `${amount.toLocaleString()} CR`,
}));

vi.mock('../features/trade/trade.service.js', () => ({
  tradeService: {
    findBestSellPrice: (...args: any[]) => mockFindBestSellPrice(...args),
    findBestBuyPrice: (...args: any[]) => mockFindBestBuyPrice(...args),
    resolveCommodity: (...args: any[]) => mockResolveCommodity(...args),
  },
}));

vi.mock('./action-macros.js', () => ({
  actionEngine: {
    executeMacro: (...args: any[]) => mockExecuteMacro(...args),
  },
}));

// Import after mocks
import { commandExecutor } from './command-executor.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeGameState(overrides: any = {}) {
  return {
    commander: {
      name: 'TestCMDR',
      credits: 5_000_000,
      ...overrides.commander,
    },
    ship: {
      ship: 'Anaconda',
      shipName: 'VAYU-01',
      hullHealth: 0.95,
      rebuy: 12_000_000,
      fuel: { main: 20, mainCapacity: 32, reserve: 0.6, reserveCapacity: 0.77 },
      cargo: overrides.cargo ?? [],
      cargoCount: overrides.cargoCount ?? 0,
      cargoCapacity: overrides.cargoCapacity ?? 468,
      hardpointsDeployed: false,
      landingGearDown: false,
      cargoScoopOpen: false,
      ...overrides.ship,
    },
    location: {
      system: 'Sol',
      station: null,
      docked: false,
      supercruise: false,
      landed: false,
      body: 'Earth',
      ...overrides.location,
    },
    missions: overrides.missions ?? [],
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CommandExecutor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -----------------------------------------------------------------------
  // getAvailableCommands
  // -----------------------------------------------------------------------

  describe('getAvailableCommands()', () => {
    it('should return a list of all registered command names', () => {
      const commands = commandExecutor.getAvailableCommands();
      expect(commands).toContain('check_fuel');
      expect(commands).toContain('check_location');
      expect(commands).toContain('check_missions');
      expect(commands).toContain('check_cargo');
      expect(commands).toContain('check_ship_status');
      expect(commands).toContain('navigate_to_system');
      expect(commands).toContain('play_music');
      expect(commands).toContain('search_commodity_sell');
      expect(commands).toContain('search_commodity_buy');
    });

    it('should include all action macro commands', () => {
      const commands = commandExecutor.getAvailableCommands();
      expect(commands).toContain('action_combat_ready');
      expect(commands).toContain('action_retract_weapons');
      expect(commands).toContain('action_flee');
      expect(commands).toContain('action_deploy_landing_gear');
      expect(commands).toContain('action_retract_landing_gear');
      expect(commands).toContain('action_open_cargo_scoop');
      expect(commands).toContain('action_close_cargo_scoop');
      expect(commands).toContain('action_dock_prepare');
      expect(commands).toContain('action_supercruise');
    });
  });

  // -----------------------------------------------------------------------
  // Unknown command
  // -----------------------------------------------------------------------

  describe('execute() with unknown command', () => {
    it('should return failure for an unknown intent', async () => {
      const result = await commandExecutor.execute('nonexistent_command', {});
      expect(result.success).toBe(false);
      expect(result.response).toContain('Unknown command');
      expect(result.response).toContain('nonexistent_command');
    });
  });

  // -----------------------------------------------------------------------
  // check_fuel
  // -----------------------------------------------------------------------

  describe('check_fuel', () => {
    it('should report fuel level and percentage', async () => {
      mockGetState.mockReturnValue(makeGameState());
      const result = await commandExecutor.execute('check_fuel', {});

      expect(result.success).toBe(true);
      expect(result.response).toContain('Fuel');
      expect(result.response).toContain('20.0');
      expect(result.response).toContain('32');
      expect(result.data).toHaveProperty('fuelLevel', 20);
      expect(result.data).toHaveProperty('fuelCapacity', 32);
    });

    it('should handle zero capacity gracefully', async () => {
      mockGetState.mockReturnValue(
        makeGameState({
          ship: { fuel: { main: 0, mainCapacity: 0, reserve: 0, reserveCapacity: 0 } },
        }),
      );
      const result = await commandExecutor.execute('check_fuel', {});
      expect(result.success).toBe(true);
      expect(result.response).toContain('0%');
    });
  });

  // -----------------------------------------------------------------------
  // check_location
  // -----------------------------------------------------------------------

  describe('check_location', () => {
    it('should report current system', async () => {
      mockGetState.mockReturnValue(makeGameState());
      const result = await commandExecutor.execute('check_location', {});

      expect(result.success).toBe(true);
      expect(result.response).toContain('Sol');
    });

    it('should include station name when docked', async () => {
      mockGetState.mockReturnValue(
        makeGameState({ location: { docked: true, station: 'Abraham Lincoln' } }),
      );
      const result = await commandExecutor.execute('check_location', {});

      expect(result.response).toContain('Docked at Abraham Lincoln');
    });

    it('should note supercruise status', async () => {
      mockGetState.mockReturnValue(
        makeGameState({ location: { supercruise: true } }),
      );
      const result = await commandExecutor.execute('check_location', {});

      expect(result.response).toContain('supercruise');
    });

    it('should note when landed on a body', async () => {
      mockGetState.mockReturnValue(
        makeGameState({ location: { landed: true, body: 'Mercury' } }),
      );
      const result = await commandExecutor.execute('check_location', {});

      expect(result.response).toContain('Landed on Mercury');
    });
  });

  // -----------------------------------------------------------------------
  // check_missions
  // -----------------------------------------------------------------------

  describe('check_missions', () => {
    it('should report no active missions', async () => {
      mockGetState.mockReturnValue(makeGameState({ missions: [] }));
      const result = await commandExecutor.execute('check_missions', {});

      expect(result.success).toBe(true);
      expect(result.response).toBe('No active missions.');
    });

    it('should list active missions with correct count', async () => {
      mockGetState.mockReturnValue(
        makeGameState({
          missions: [
            {
              missionId: 1,
              name: 'Mission_Delivery_stuff',
              nameLocalised: null,
              destinationSystem: 'Alpha Centauri',
            },
            {
              missionId: 2,
              name: 'Mission_Assassinate_target',
              nameLocalised: 'Assassinate a Pirate Lord',
              destinationSystem: 'Barnards Star',
            },
          ],
        }),
      );
      const result = await commandExecutor.execute('check_missions', {});

      expect(result.success).toBe(true);
      expect(result.response).toContain('2 active missions');
      expect(result.response).toContain('Alpha Centauri');
      // Localised name should be used when available
      expect(result.response).toContain('Assassinate a Pirate Lord');
    });

    it('should use singular form for 1 mission', async () => {
      mockGetState.mockReturnValue(
        makeGameState({
          missions: [
            { missionId: 1, name: 'Mission_Test', nameLocalised: 'Test', destinationSystem: 'Sol' },
          ],
        }),
      );
      const result = await commandExecutor.execute('check_missions', {});
      // Should say "1 active mission" not "1 active missions"
      expect(result.response).toMatch(/1 active mission(?!s)/);
    });
  });

  // -----------------------------------------------------------------------
  // check_cargo
  // -----------------------------------------------------------------------

  describe('check_cargo', () => {
    it('should report empty cargo hold', async () => {
      mockGetState.mockReturnValue(makeGameState());
      const result = await commandExecutor.execute('check_cargo', {});

      expect(result.success).toBe(true);
      expect(result.response).toBe('Cargo hold is empty.');
    });

    it('should list cargo items with counts', async () => {
      mockGetState.mockReturnValue(
        makeGameState({
          ship: {
            cargo: [
              { name: 'Gold', nameLocalised: 'Gold', count: 50, stolen: 0, missionId: null },
              { name: 'Silver', nameLocalised: null, count: 30, stolen: 0, missionId: null },
            ],
            cargoCount: 80,
            cargoCapacity: 468,
          },
        }),
      );
      const result = await commandExecutor.execute('check_cargo', {});

      expect(result.success).toBe(true);
      expect(result.response).toContain('80/468t');
      expect(result.response).toContain('Gold: 50t');
    });
  });

  // -----------------------------------------------------------------------
  // check_ship_status
  // -----------------------------------------------------------------------

  describe('check_ship_status', () => {
    it('should report ship name, hull health, fuel, and rebuy', async () => {
      mockGetState.mockReturnValue(makeGameState());
      const result = await commandExecutor.execute('check_ship_status', {});

      expect(result.success).toBe(true);
      expect(result.response).toContain('TestShip(Anaconda)');
      expect(result.response).toContain('VAYU-01');
      expect(result.response).toContain('Hull 95%');
      expect(result.response).toContain('Cargo 0/468t');
    });
  });

  // -----------------------------------------------------------------------
  // navigate_to_system
  // -----------------------------------------------------------------------

  describe('navigate_to_system', () => {
    it('should acknowledge navigation with a target system', async () => {
      const result = await commandExecutor.execute('navigate_to_system', {
        system: 'Colonia',
      });

      expect(result.success).toBe(true);
      expect(result.response).toContain('Colonia');
      expect(result.data).toHaveProperty('targetSystem', 'Colonia');
    });

    it('should fail when no system is specified', async () => {
      const result = await commandExecutor.execute('navigate_to_system', {});

      expect(result.success).toBe(false);
      expect(result.response).toContain('No destination');
    });
  });

  // -----------------------------------------------------------------------
  // play_music
  // -----------------------------------------------------------------------

  describe('play_music', () => {
    it('should acknowledge music query', async () => {
      const result = await commandExecutor.execute('play_music', {
        query: 'Elite Dangerous soundtrack',
      });

      expect(result.success).toBe(true);
      expect(result.response).toContain('Elite Dangerous soundtrack');
    });

    it('should fail when no query is specified', async () => {
      const result = await commandExecutor.execute('play_music', {});

      expect(result.success).toBe(false);
      expect(result.response).toContain('What would you like me to play');
    });
  });

  // -----------------------------------------------------------------------
  // Action macro handlers — all return empty response
  // -----------------------------------------------------------------------

  describe('action macro handlers', () => {
    const actionMacros = [
      ['action_combat_ready', 'combat_ready'],
      ['action_retract_weapons', 'retract_weapons'],
      ['action_flee', 'flee'],
      ['action_deploy_landing_gear', 'deploy_landing_gear'],
      ['action_retract_landing_gear', 'retract_landing_gear'],
      ['action_open_cargo_scoop', 'open_cargo_scoop'],
      ['action_close_cargo_scoop', 'close_cargo_scoop'],
      ['action_dock_prepare', 'dock_prepare'],
      ['action_supercruise', 'supercruise'],
    ] as const;

    it.each(actionMacros)(
      '%s should call executeMacro with "%s" and return empty response',
      async (intent, macroName) => {
        mockExecuteMacro.mockResolvedValue({
          success: true,
          stepsExecuted: ['SomeAction'],
          stepsSkipped: [],
        });

        const result = await commandExecutor.execute(intent, {});

        expect(mockExecuteMacro).toHaveBeenCalledWith(macroName);
        expect(result.success).toBe(true);
        expect(result.response).toBe('');
        expect(result.data).toHaveProperty('macro', macroName);
      },
    );

    it('should propagate macro failure', async () => {
      mockExecuteMacro.mockResolvedValue({
        success: false,
        stepsExecuted: [],
        stepsSkipped: ['SomeAction'],
      });

      const result = await commandExecutor.execute('action_combat_ready', {});
      expect(result.success).toBe(false);
      expect(result.response).toBe('');
    });
  });

  // -----------------------------------------------------------------------
  // search_commodity_sell
  // -----------------------------------------------------------------------

  describe('search_commodity_sell', () => {
    it('should fail when no commodity is specified', async () => {
      const result = await commandExecutor.execute('search_commodity_sell', {});
      expect(result.success).toBe(false);
      expect(result.response).toContain('Which commodity');
    });

    it('should return results when stations are found', async () => {
      mockGetState.mockReturnValue(makeGameState());
      mockFindBestSellPrice.mockResolvedValue({
        commodity: 'Void Opals',
        results: [
          {
            stationName: 'Jameson Memorial',
            systemName: 'Shinrarta Dezhra',
            sellPrice: 1_600_000,
            distanceLy: 5.2,
            landingPadSize: 'L',
            demand: 500,
          },
        ],
      });

      const result = await commandExecutor.execute('search_commodity_sell', {
        commodity: 'void opals',
      });

      expect(result.success).toBe(true);
      expect(result.response).toContain('Void Opals');
      expect(result.response).toContain('Jameson Memorial');
      expect(result.response).toContain('Large');
    });

    it('should handle no results with unresolvable commodity', async () => {
      mockFindBestSellPrice.mockResolvedValue({
        commodity: 'Unknown Stuff',
        results: [],
      });
      mockResolveCommodity.mockResolvedValue(null);

      const result = await commandExecutor.execute('search_commodity_sell', {
        commodity: 'unknown stuff',
      });

      expect(result.success).toBe(false);
      expect(result.response).toContain("couldn't find");
    });

    it('should handle search errors gracefully', async () => {
      mockFindBestSellPrice.mockRejectedValue(new Error('Database offline'));

      const result = await commandExecutor.execute('search_commodity_sell', {
        commodity: 'gold',
      });

      expect(result.success).toBe(false);
      expect(result.response).toContain('Commodity search failed');
      expect(result.response).toContain('Database offline');
    });
  });

  // -----------------------------------------------------------------------
  // search_commodity_buy
  // -----------------------------------------------------------------------

  describe('search_commodity_buy', () => {
    it('should fail when no commodity is specified', async () => {
      const result = await commandExecutor.execute('search_commodity_buy', {});
      expect(result.success).toBe(false);
      expect(result.response).toContain('Which commodity');
    });

    it('should return buy results when stations are found', async () => {
      mockGetState.mockReturnValue(makeGameState());
      mockFindBestBuyPrice.mockResolvedValue({
        commodity: 'Tritium',
        results: [
          {
            stationName: 'Refinery Station',
            systemName: 'HIP 12345',
            buyPrice: 5_000,
            distanceLy: 12.3,
            landingPadSize: 'M',
            supply: 10_000,
          },
        ],
      });

      const result = await commandExecutor.execute('search_commodity_buy', {
        commodity: 'tritium',
      });

      expect(result.success).toBe(true);
      expect(result.response).toContain('Tritium');
      expect(result.response).toContain('Refinery Station');
      expect(result.response).toContain('Medium');
    });
  });

  // -----------------------------------------------------------------------
  // Error handling in execute()
  // -----------------------------------------------------------------------

  describe('execute() error handling', () => {
    it('should catch thrown errors from handlers and return failure', async () => {
      mockGetState.mockImplementation(() => {
        throw new Error('State corrupted');
      });

      const result = await commandExecutor.execute('check_fuel', {});
      expect(result.success).toBe(false);
      expect(result.response).toContain('Command failed');
      expect(result.response).toContain('State corrupted');
    });
  });
});
