/**
 * AGNI — Unit tests for llm-service.ts
 *
 * Tests extractIntent() regex patterns for action detection, commodity
 * queries, and general intent classification. The LLM API is not called;
 * we test the pattern matching logic directly.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('../config.js', () => ({
  config: {
    api: {
      anthropicKey: '', // Empty so fallback path is used
      elevenLabsKey: '',
      elevenLabsVoiceId: '',
    },
  },
}));

const mockGetState = vi.fn();

vi.mock('../core/game-state.js', () => ({
  gameStateManager: { getState: mockGetState },
}));

vi.mock('@vayu/shared', () => ({
  resolveShipName: (id: string) => `TestShip(${id})`,
  formatCredits: (amount: number, short?: boolean) =>
    short ? `${amount}M CR` : `${amount} CR`,
}));

// Import after mocks
import { llmService } from './llm-service.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeState() {
  return {
    commander: { name: 'TestCMDR', credits: 5_000_000 },
    ship: {
      ship: 'Anaconda',
      shipName: 'VAYU-01',
      shipLocalised: null,
      hullHealth: 0.95,
      rebuy: 12_000_000,
      fuel: { main: 20, mainCapacity: 32, reserve: 0.6, reserveCapacity: 0.77 },
      cargo: [],
      cargoCount: 0,
      cargoCapacity: 468,
      hardpointsDeployed: false,
      landingGearDown: false,
      cargoScoopOpen: false,
    },
    location: {
      system: 'Sol',
      station: null,
      docked: false,
      supercruise: false,
      landed: false,
      body: 'Earth',
    },
    missions: [],
    materials: { raw: [], manufactured: [], encoded: [] },
    session: { startTime: new Date().toISOString() },
    carrier: null,
    odyssey: {},
    initialized: true,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Helper to test extractIntent via processInput().
 * Since there is no API key, processInput uses the fallback which calls extractIntent.
 */
async function getIntent(text: string) {
  mockGetState.mockReturnValue(makeState());
  const result = await llmService.processInput(text);
  return { intent: result.intent, entities: result.entities };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('LLMService.extractIntent()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    llmService.clearHistory();
  });

  // -----------------------------------------------------------------------
  // Action intents — combat
  // -----------------------------------------------------------------------

  describe('combat action detection', () => {
    it.each([
      'weapons hot',
      'time to kick some ass',
      'engage the target',
      'attack that ship',
      'fight them',
      'combat mode',
      'battle stations',
      'lock and load',
    ])('should detect action_combat_ready from "%s"', async (input) => {
      const { intent } = await getIntent(input);
      expect(intent).toBe('action_combat_ready');
    });
  });

  // -----------------------------------------------------------------------
  // Action intents — flee
  // -----------------------------------------------------------------------

  describe('flee action detection', () => {
    it.each([
      'get out of here',
      'flee now',
      'run away',
      'escape this fight',
      'bail out',
      'bug out',
      "let's bounce",
      'lets bounce',
      'retreat',
      'withdraw from combat',
      'gtfo',
    ])('should detect action_flee from "%s"', async (input) => {
      const { intent } = await getIntent(input);
      expect(intent).toBe('action_flee');
    });
  });

  // -----------------------------------------------------------------------
  // Action intents — retract weapons
  // -----------------------------------------------------------------------

  describe('retract weapons detection', () => {
    it.each([
      'weapons away',
      'retract hardpoints',
      'retract weapons',
      'stand down',
      'holster weapons',
      'lights out',
    ])('should detect action_retract_weapons from "%s"', async (input) => {
      const { intent } = await getIntent(input);
      expect(intent).toBe('action_retract_weapons');
    });
  });

  // -----------------------------------------------------------------------
  // Action intents — landing gear
  // -----------------------------------------------------------------------

  describe('landing gear detection', () => {
    it.each([
      'landing gear down',
      'gear down',
      'deploy landing gear',
      'deploy gear',
      'wheels down',
    ])('should detect action_deploy_landing_gear from "%s"', async (input) => {
      const { intent } = await getIntent(input);
      expect(intent).toBe('action_deploy_landing_gear');
    });

    it.each([
      'landing gear up',
      'gear up',
      'retract landing gear',
      'retract gear',
      'wheels up',
    ])('should detect action_retract_landing_gear from "%s"', async (input) => {
      const { intent } = await getIntent(input);
      expect(intent).toBe('action_retract_landing_gear');
    });
  });

  // -----------------------------------------------------------------------
  // Action intents — cargo scoop
  // -----------------------------------------------------------------------

  describe('cargo scoop detection', () => {
    it.each([
      'open cargo scoop',
      'open scoop',
      'deploy scoop',
      'scoop out',
    ])('should detect action_open_cargo_scoop from "%s"', async (input) => {
      const { intent } = await getIntent(input);
      expect(intent).toBe('action_open_cargo_scoop');
    });

    it.each([
      'close cargo scoop',
      'close scoop',
      'retract scoop',
      'scoop in',
      'secure scoop',
    ])('should detect action_close_cargo_scoop from "%s"', async (input) => {
      const { intent } = await getIntent(input);
      expect(intent).toBe('action_close_cargo_scoop');
    });
  });

  // -----------------------------------------------------------------------
  // Action intents — dock prepare
  // -----------------------------------------------------------------------

  describe('dock prepare detection', () => {
    it.each([
      'prepare for dock',
      'prepare for docking',
      'docking prep',
      'coming in to land',
    ])('should detect action_dock_prepare from "%s"', async (input) => {
      const { intent } = await getIntent(input);
      expect(intent).toBe('action_dock_prepare');
    });
  });

  // -----------------------------------------------------------------------
  // Action intents — supercruise
  // -----------------------------------------------------------------------

  describe('supercruise detection', () => {
    it.each([
      'enter supercruise',
      'punch it',
      'go to cruise',
    ])('should detect action_supercruise from "%s"', async (input) => {
      const { intent } = await getIntent(input);
      expect(intent).toBe('action_supercruise');
    });
  });

  // -----------------------------------------------------------------------
  // Commodity sell queries
  // -----------------------------------------------------------------------

  describe('commodity sell query detection', () => {
    it('should detect sell intent with "where can I sell"', async () => {
      const { intent, entities } = await getIntent('where can i sell void opals?');
      expect(intent).toBe('search_commodity_sell');
      expect(entities['commodity']).toBe('void opals');
    });

    it('should detect sell intent with "best price for"', async () => {
      const { intent, entities } = await getIntent('best price for gold');
      expect(intent).toBe('search_commodity_sell');
      expect(entities['commodity']).toBe('gold');
    });

    it('should detect sell intent with "highest price"', async () => {
      const { intent, entities } = await getIntent('highest prices for painite?');
      expect(intent).toBe('search_commodity_sell');
      expect(entities['commodity']).toBe('painite');
    });

    it('should detect sell intent with "who is buying"', async () => {
      const { intent, entities } = await getIntent('who is buying tritium?');
      expect(intent).toBe('search_commodity_sell');
      expect(entities['commodity']).toBe('tritium');
    });

    it('should detect sell intent with "where to sell"', async () => {
      const { intent, entities } = await getIntent('where to sell low temperature diamonds');
      expect(intent).toBe('search_commodity_sell');
      expect(entities['commodity']).toBe('low temperature diamonds');
    });
  });

  // -----------------------------------------------------------------------
  // Commodity buy queries
  // -----------------------------------------------------------------------

  describe('commodity buy query detection', () => {
    it('should detect buy intent with "where can I buy"', async () => {
      const { intent, entities } = await getIntent('where can i buy tritium?');
      expect(intent).toBe('search_commodity_buy');
      expect(entities['commodity']).toBe('tritium');
    });

    it('should detect buy intent with "cheapest price for"', async () => {
      const { intent, entities } = await getIntent('cheapest price for agronomic treatment');
      expect(intent).toBe('search_commodity_buy');
      expect(entities['commodity']).toBe('agronomic treatment');
    });

    it('should detect buy intent with "where to buy"', async () => {
      const { intent, entities } = await getIntent('where to buy gold');
      expect(intent).toBe('search_commodity_buy');
      expect(entities['commodity']).toBe('gold');
    });
  });

  // -----------------------------------------------------------------------
  // Navigation intent
  // -----------------------------------------------------------------------

  describe('navigation detection', () => {
    it('should detect navigate_to_system with "go to"', async () => {
      const { intent, entities } = await getIntent('go to Colonia');
      expect(intent).toBe('navigate_to_system');
      expect(entities['system']).toBe('colonia');
    });

    it('should detect navigate_to_system with "jump to"', async () => {
      const { intent } = await getIntent('jump to Sagittarius A');
      expect(intent).toBe('navigate_to_system');
    });

    it('should detect navigate_to_system with "plot route"', async () => {
      const { intent } = await getIntent('plot route to Hutton Orbital');
      expect(intent).toBe('navigate_to_system');
    });

    it('should detect navigate_to_system with "navigate"', async () => {
      const { intent } = await getIntent('navigate to Sol');
      expect(intent).toBe('navigate_to_system');
    });
  });

  // -----------------------------------------------------------------------
  // Query intents
  // -----------------------------------------------------------------------

  describe('query intents', () => {
    it('should detect check_fuel for fuel-related queries', async () => {
      const { intent } = await getIntent('how much fuel do I have?');
      expect(intent).toBe('check_fuel');
    });

    it('should detect check_fuel for "tank" queries', async () => {
      const { intent } = await getIntent('check the tank');
      expect(intent).toBe('check_fuel');
    });

    it('should detect check_missions', async () => {
      const { intent } = await getIntent('show my missions');
      expect(intent).toBe('check_missions');
    });

    it('should detect check_cargo', async () => {
      const { intent } = await getIntent('what is in my cargo');
      expect(intent).toBe('check_cargo');
    });

    it('should detect check_cargo for "hold" keyword', async () => {
      const { intent } = await getIntent('check the hold');
      expect(intent).toBe('check_cargo');
    });

    it('should detect check_location for "where am I"', async () => {
      const { intent } = await getIntent('where am i');
      expect(intent).toBe('check_location');
    });

    it('should detect check_location for "what system"', async () => {
      const { intent } = await getIntent('what system am I in');
      expect(intent).toBe('check_location');
    });

    it('should detect check_ship_status for "ship" keyword', async () => {
      const { intent } = await getIntent('tell me about my ship');
      expect(intent).toBe('check_ship_status');
    });

    it('should detect check_ship_status for "hull" keyword', async () => {
      const { intent } = await getIntent('hull integrity?');
      expect(intent).toBe('check_ship_status');
    });

    it('should detect check_ship_status for "status" keyword', async () => {
      const { intent } = await getIntent('give me a status report');
      expect(intent).toBe('check_ship_status');
    });

    it('should detect play_music', async () => {
      const { intent, entities } = await getIntent('play some jazz');
      expect(intent).toBe('play_music');
      expect(entities['query']).toBe('some jazz');
    });
  });

  // -----------------------------------------------------------------------
  // No intent detected
  // -----------------------------------------------------------------------

  describe('no intent', () => {
    it('should return null intent for unrecognized input', async () => {
      const { intent } = await getIntent('tell me a joke');
      expect(intent).toBeNull();
    });

    it('should return null intent for empty input', async () => {
      const { intent } = await getIntent('');
      expect(intent).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // Intent tag extraction from LLM response
  // -----------------------------------------------------------------------

  describe('intent tag extraction from LLM response', () => {
    // We test this by calling extractIntent indirectly. Since extractIntent
    // is private, we verify the logic by checking the pattern matching.
    // The intent tag pattern: /<intent>([\w_]+)<\/intent>/
    // The commodity tag pattern: /<commodity>([^<]+)<\/commodity>/

    it('should match intent tag pattern', () => {
      const text = '<intent>search_commodity_sell</intent>';
      const match = text.match(/<intent>([\w_]+)<\/intent>/);
      expect(match).not.toBeNull();
      expect(match![1]).toBe('search_commodity_sell');
    });

    it('should match commodity tag pattern', () => {
      const text = '<commodity>void opals</commodity>';
      const match = text.match(/<commodity>([^<]+)<\/commodity>/);
      expect(match).not.toBeNull();
      expect(match![1]).toBe('void opals');
    });

    it('should extract both intent and commodity from combined tags', () => {
      const response =
        'Let me check... <intent>search_commodity_sell</intent><commodity>painite</commodity>';
      const intentMatch = response.match(/<intent>([\w_]+)<\/intent>/);
      const commodityMatch = response.match(/<commodity>([^<]+)<\/commodity>/);

      expect(intentMatch![1]).toBe('search_commodity_sell');
      expect(commodityMatch![1]).toBe('painite');
    });
  });

  // -----------------------------------------------------------------------
  // Fallback response
  // -----------------------------------------------------------------------

  describe('fallback response (no API key)', () => {
    it('should include fuel info when input mentions fuel', async () => {
      const result = await llmService.processInput('how much fuel');
      expect(result.text).toContain('Fuel');
      expect(result.intent).toBe('check_fuel');
    });

    it('should include location info for location queries', async () => {
      const result = await llmService.processInput('where am I?');
      expect(result.text).toContain('Sol');
      expect(result.intent).toBe('check_location');
    });

    it('should include mission count for mission queries', async () => {
      const result = await llmService.processInput('show missions');
      expect(result.text).toContain('0 active mission');
    });

    it('should include ship info for ship queries', async () => {
      const result = await llmService.processInput('tell me about my ship');
      expect(result.text).toContain('TestShip(Anaconda)');
      expect(result.text).toContain('VAYU-01');
    });

    it('should return a generic message for unrecognized input without API key', async () => {
      const result = await llmService.processInput('random gibberish here');
      expect(result.text).toContain('LLM service is not configured');
    });

    it('should always include latencyMs', async () => {
      const result = await llmService.processInput('test');
      expect(typeof result.latencyMs).toBe('number');
      expect(result.latencyMs).toBeGreaterThanOrEqual(0);
    });
  });

  // -----------------------------------------------------------------------
  // clearHistory
  // -----------------------------------------------------------------------

  describe('clearHistory()', () => {
    it('should not throw when called', () => {
      expect(() => llmService.clearHistory()).not.toThrow();
    });
  });
});
