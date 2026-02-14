/**
 * AGNI — Unit tests for action-macros.ts
 *
 * Tests macro definitions, precondition logic, step execution,
 * and the ActionEngine public API.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks — must be set up before importing the module under test
// ---------------------------------------------------------------------------

const { mockGetState, mockSendAction, mockApplyQualityPreset } = vi.hoisted(() => ({
  mockGetState: vi.fn(),
  mockSendAction: vi.fn(),
  mockApplyQualityPreset: vi.fn(),
}));

vi.mock('../core/game-state.js', () => ({
  gameStateManager: { getState: mockGetState },
}));

vi.mock('./keypress-service.js', () => ({
  keypressService: { sendAction: mockSendAction },
}));

vi.mock('../features/graphics/graphics.service.js', () => ({
  graphicsService: { applyQualityPreset: mockApplyQualityPreset },
}));

// Now import the module under test
import { actionEngine, type MacroResult } from './action-macros.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal GameState stub with overridable ship flags. */
function makeState(overrides: {
  hardpointsDeployed?: boolean;
  landingGearDown?: boolean;
  cargoScoopOpen?: boolean;
} = {}) {
  return {
    ship: {
      hardpointsDeployed: overrides.hardpointsDeployed ?? false,
      landingGearDown: overrides.landingGearDown ?? false,
      cargoScoopOpen: overrides.cargoScoopOpen ?? false,
    },
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ActionEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSendAction.mockResolvedValue(true);
  });

  // -----------------------------------------------------------------------
  // getMacroNames / getResponseTemplate
  // -----------------------------------------------------------------------

  describe('getMacroNames()', () => {
    it('should return all registered macro names', () => {
      const names = actionEngine.getMacroNames();
      expect(names).toContain('flee');
      expect(names).toContain('combat_ready');
      expect(names).toContain('retract_weapons');
      expect(names).toContain('deploy_landing_gear');
      expect(names).toContain('retract_landing_gear');
      expect(names).toContain('open_cargo_scoop');
      expect(names).toContain('close_cargo_scoop');
      expect(names).toContain('dock_prepare');
      expect(names).toContain('supercruise');
    });

    it('should return exactly 23 macros', () => {
      expect(actionEngine.getMacroNames()).toHaveLength(23);
    });
  });

  describe('getResponseTemplate()', () => {
    it('should return the template for a known macro', () => {
      const template = actionEngine.getResponseTemplate('flee');
      expect(template).toContain('Retracting hardpoints');
      expect(template).toContain('frame shift drive');
    });

    it('should return empty string for an unknown macro', () => {
      expect(actionEngine.getResponseTemplate('nonexistent')).toBe('');
    });

    it('should return a non-empty template for every registered macro', () => {
      for (const name of actionEngine.getMacroNames()) {
        expect(actionEngine.getResponseTemplate(name).length).toBeGreaterThan(0);
      }
    });
  });

  // -----------------------------------------------------------------------
  // executeMacro — unknown macro
  // -----------------------------------------------------------------------

  describe('executeMacro() with unknown macro', () => {
    it('should return failure with an error message', async () => {
      mockGetState.mockReturnValue(makeState());
      const result = await actionEngine.executeMacro('does_not_exist');

      expect(result.success).toBe(false);
      expect(result.stepsExecuted).toEqual([]);
      expect(result.stepsSkipped).toEqual([]);
      expect(result.error).toContain('Unknown macro');
      expect(result.error).toContain('does_not_exist');
    });

    it('should not call sendAction for unknown macros', async () => {
      mockGetState.mockReturnValue(makeState());
      await actionEngine.executeMacro('bogus');
      expect(mockSendAction).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // executeMacro — combat_ready
  // -----------------------------------------------------------------------

  describe('executeMacro("combat_ready")', () => {
    it('should deploy hardpoints when they are currently retracted', async () => {
      mockGetState.mockReturnValue(makeState({ hardpointsDeployed: false }));
      const result = await actionEngine.executeMacro('combat_ready');

      expect(result.success).toBe(true);
      expect(result.stepsExecuted).toContain('DeployHardpointToggle');
      expect(result.stepsSkipped).toHaveLength(0);
      expect(mockSendAction).toHaveBeenCalledWith('DeployHardpointToggle');
    });

    it('should skip hardpoint toggle when hardpoints are already deployed but still run side effect', async () => {
      mockGetState.mockReturnValue(makeState({ hardpointsDeployed: true }));
      const result = await actionEngine.executeMacro('combat_ready');

      expect(result.success).toBe(true); // side effect step still executed
      expect(result.stepsExecuted).toContain('sideEffect');
      expect(result.stepsSkipped).toContain('DeployHardpointToggle');
      expect(mockSendAction).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // executeMacro — retract_weapons
  // -----------------------------------------------------------------------

  describe('executeMacro("retract_weapons")', () => {
    it('should retract when hardpoints are deployed', async () => {
      mockGetState.mockReturnValue(makeState({ hardpointsDeployed: true }));
      const result = await actionEngine.executeMacro('retract_weapons');

      expect(result.success).toBe(true);
      expect(result.stepsExecuted).toContain('DeployHardpointToggle');
    });

    it('should skip toggle when hardpoints are already retracted but still run side effect', async () => {
      mockGetState.mockReturnValue(makeState({ hardpointsDeployed: false }));
      const result = await actionEngine.executeMacro('retract_weapons');

      expect(result.success).toBe(true); // side effect step still executed
      expect(result.stepsSkipped).toContain('DeployHardpointToggle');
      expect(result.stepsExecuted).toContain('sideEffect');
    });
  });

  // -----------------------------------------------------------------------
  // executeMacro — deploy_landing_gear / retract_landing_gear
  // -----------------------------------------------------------------------

  describe('executeMacro("deploy_landing_gear")', () => {
    it('should deploy gear when not already down', async () => {
      mockGetState.mockReturnValue(makeState({ landingGearDown: false }));
      const result = await actionEngine.executeMacro('deploy_landing_gear');

      expect(result.success).toBe(true);
      expect(result.stepsExecuted).toContain('LandingGearToggle');
    });

    it('should skip when gear is already down', async () => {
      mockGetState.mockReturnValue(makeState({ landingGearDown: true }));
      const result = await actionEngine.executeMacro('deploy_landing_gear');

      expect(result.success).toBe(false);
      expect(result.stepsSkipped).toContain('LandingGearToggle');
    });
  });

  describe('executeMacro("retract_landing_gear")', () => {
    it('should retract gear when it is down', async () => {
      mockGetState.mockReturnValue(makeState({ landingGearDown: true }));
      const result = await actionEngine.executeMacro('retract_landing_gear');

      expect(result.success).toBe(true);
      expect(result.stepsExecuted).toContain('LandingGearToggle');
    });

    it('should skip when gear is already up', async () => {
      mockGetState.mockReturnValue(makeState({ landingGearDown: false }));
      const result = await actionEngine.executeMacro('retract_landing_gear');

      expect(result.success).toBe(false);
      expect(result.stepsSkipped).toContain('LandingGearToggle');
    });
  });

  // -----------------------------------------------------------------------
  // executeMacro — cargo scoop
  // -----------------------------------------------------------------------

  describe('executeMacro("open_cargo_scoop")', () => {
    it('should open scoop when closed', async () => {
      mockGetState.mockReturnValue(makeState({ cargoScoopOpen: false }));
      const result = await actionEngine.executeMacro('open_cargo_scoop');

      expect(result.success).toBe(true);
      expect(result.stepsExecuted).toContain('ToggleCargoScoop');
    });

    it('should skip when scoop is already open', async () => {
      mockGetState.mockReturnValue(makeState({ cargoScoopOpen: true }));
      const result = await actionEngine.executeMacro('open_cargo_scoop');

      expect(result.success).toBe(false);
      expect(result.stepsSkipped).toContain('ToggleCargoScoop');
    });
  });

  describe('executeMacro("close_cargo_scoop")', () => {
    it('should close scoop when open', async () => {
      mockGetState.mockReturnValue(makeState({ cargoScoopOpen: true }));
      const result = await actionEngine.executeMacro('close_cargo_scoop');

      expect(result.success).toBe(true);
      expect(result.stepsExecuted).toContain('ToggleCargoScoop');
    });

    it('should skip when scoop is already closed', async () => {
      mockGetState.mockReturnValue(makeState({ cargoScoopOpen: false }));
      const result = await actionEngine.executeMacro('close_cargo_scoop');

      expect(result.success).toBe(false);
      expect(result.stepsSkipped).toContain('ToggleCargoScoop');
    });
  });

  // -----------------------------------------------------------------------
  // executeMacro — flee (multi-step with delays)
  // -----------------------------------------------------------------------

  describe('executeMacro("flee")', () => {
    it('should execute all three steps when hardpoints are deployed', async () => {
      mockGetState.mockReturnValue(makeState({ hardpointsDeployed: true }));
      const result = await actionEngine.executeMacro('flee');

      expect(result.success).toBe(true);
      expect(result.stepsExecuted).toEqual([
        'DeployHardpointToggle',
        'TargetNextRouteSystem',
        'HyperSuperCombination',
      ]);
      expect(result.stepsSkipped).toHaveLength(0);
    });

    it('should skip hardpoint retract but still execute remaining steps', async () => {
      mockGetState.mockReturnValue(makeState({ hardpointsDeployed: false }));
      const result = await actionEngine.executeMacro('flee');

      expect(result.success).toBe(true);
      expect(result.stepsSkipped).toEqual(['DeployHardpointToggle']);
      expect(result.stepsExecuted).toEqual([
        'TargetNextRouteSystem',
        'HyperSuperCombination',
      ]);
    });
  });

  // -----------------------------------------------------------------------
  // executeMacro — dock_prepare (multi-step)
  // -----------------------------------------------------------------------

  describe('executeMacro("dock_prepare")', () => {
    it('should retract hardpoints and deploy gear when both conditions require action', async () => {
      mockGetState.mockReturnValue(
        makeState({ hardpointsDeployed: true, landingGearDown: false }),
      );
      const result = await actionEngine.executeMacro('dock_prepare');

      expect(result.success).toBe(true);
      expect(result.stepsExecuted).toEqual([
        'DeployHardpointToggle',
        'LandingGearToggle',
      ]);
      expect(result.stepsSkipped).toHaveLength(0);
    });

    it('should skip retract and only deploy gear when hardpoints already retracted', async () => {
      mockGetState.mockReturnValue(
        makeState({ hardpointsDeployed: false, landingGearDown: false }),
      );
      const result = await actionEngine.executeMacro('dock_prepare');

      expect(result.success).toBe(true);
      expect(result.stepsSkipped).toEqual(['DeployHardpointToggle']);
      expect(result.stepsExecuted).toEqual(['LandingGearToggle']);
    });

    it('should skip gear and only retract hardpoints when gear already down', async () => {
      mockGetState.mockReturnValue(
        makeState({ hardpointsDeployed: true, landingGearDown: true }),
      );
      const result = await actionEngine.executeMacro('dock_prepare');

      expect(result.success).toBe(true);
      expect(result.stepsSkipped).toEqual(['LandingGearToggle']);
      expect(result.stepsExecuted).toEqual(['DeployHardpointToggle']);
    });

    it('should skip both steps when already in docking state', async () => {
      mockGetState.mockReturnValue(
        makeState({ hardpointsDeployed: false, landingGearDown: true }),
      );
      const result = await actionEngine.executeMacro('dock_prepare');

      expect(result.success).toBe(false);
      expect(result.stepsSkipped).toEqual([
        'DeployHardpointToggle',
        'LandingGearToggle',
      ]);
      expect(result.stepsExecuted).toHaveLength(0);
    });
  });

  // -----------------------------------------------------------------------
  // executeMacro — supercruise (multi-step)
  // -----------------------------------------------------------------------

  describe('executeMacro("supercruise")', () => {
    it('should retract hardpoints then engage supercruise', async () => {
      mockGetState.mockReturnValue(makeState({ hardpointsDeployed: true }));
      const result = await actionEngine.executeMacro('supercruise');

      expect(result.success).toBe(true);
      expect(result.stepsExecuted).toEqual([
        'DeployHardpointToggle',
        'Supercruise',
      ]);
    });

    it('should skip retract and still engage supercruise', async () => {
      mockGetState.mockReturnValue(makeState({ hardpointsDeployed: false }));
      const result = await actionEngine.executeMacro('supercruise');

      expect(result.success).toBe(true);
      expect(result.stepsSkipped).toEqual(['DeployHardpointToggle']);
      expect(result.stepsExecuted).toEqual(['Supercruise']);
    });
  });

  // -----------------------------------------------------------------------
  // sendAction failure handling
  // -----------------------------------------------------------------------

  describe('step failure handling', () => {
    it('should mark steps as skipped when sendAction returns false but still run side effects', async () => {
      mockGetState.mockReturnValue(makeState({ hardpointsDeployed: false }));
      mockSendAction.mockResolvedValue(false); // binding not resolved

      const result = await actionEngine.executeMacro('combat_ready');

      // condition was met (hardpoints not deployed) so it tried to send
      // but sendAction failed, so it lands in skipped; side effect still runs
      expect(result.success).toBe(true); // side effect step executed
      expect(result.stepsSkipped).toContain('DeployHardpointToggle');
      expect(result.stepsExecuted).toContain('sideEffect');
    });

    it('should report partial success when some steps succeed and others fail', async () => {
      mockGetState.mockReturnValue(makeState({ hardpointsDeployed: false }));
      // TargetNextRouteSystem succeeds, HyperSuperCombination fails
      mockSendAction
        .mockResolvedValueOnce(true)   // TargetNextRouteSystem
        .mockResolvedValueOnce(false);  // HyperSuperCombination

      const result = await actionEngine.executeMacro('flee');

      expect(result.success).toBe(true); // at least one step executed
      expect(result.stepsExecuted).toContain('TargetNextRouteSystem');
      expect(result.stepsSkipped).toContain('HyperSuperCombination');
    });
  });
});
