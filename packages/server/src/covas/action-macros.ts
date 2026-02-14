/**
 * Action macros — multi-step ship control sequences with precondition checks.
 *
 * Each macro is a named sequence of binding actions that checks the current
 * game state before sending keypresses, preventing toggle-based bindings from
 * doing the opposite of what was intended (e.g., deploying hardpoints when
 * the user asked to retract them).
 */

import { gameStateManager } from '../core/game-state.js';
import { keypressService } from './keypress-service.js';
import { graphicsService } from '../features/graphics/graphics.service.js';
import type { GameState } from '@vayu/shared';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ActionStep {
  /** Elite Dangerous binding action name (e.g., "DeployHardpointToggle"). Empty string for side-effect-only steps. */
  action: string;
  /** Only execute this step if the condition returns true. */
  condition?: (state: GameState) => boolean;
  /** Milliseconds to wait after this step before the next. */
  delayAfterMs?: number;
  /** Optional async function to run after the keypress (or instead if action is empty). */
  sideEffect?: () => Promise<void>;
}

interface ActionMacro {
  /** Macro identifier used in intent names (e.g., "flee"). */
  name: string;
  /** Human-readable description for logging. */
  description: string;
  /** Ordered steps to execute. */
  steps: ActionStep[];
  /** Fallback response if the LLM doesn't provide one. */
  responseTemplate: string;
}

export interface MacroResult {
  success: boolean;
  stepsExecuted: string[];
  stepsSkipped: string[];
  error?: string;
}

// ---------------------------------------------------------------------------
// Macro Definitions
// ---------------------------------------------------------------------------

const macros: Record<string, ActionMacro> = {
  flee: {
    name: 'flee',
    description: 'Retract hardpoints, target next system in route, charge FSD',
    steps: [
      {
        action: 'DeployHardpointToggle',
        condition: (s) => s.ship.hardpointsDeployed,
        delayAfterMs: 300,
      },
      {
        action: 'TargetNextRouteSystem',
        delayAfterMs: 200,
      },
      {
        action: 'HyperSuperCombination',
      },
    ],
    responseTemplate: 'Retracting hardpoints, targeting next system, charging frame shift drive. Hold on, Commander.',
  },

  combat_ready: {
    name: 'combat_ready',
    description: 'Deploy hardpoints for combat and switch to combat graphics',
    steps: [
      {
        action: 'DeployHardpointToggle',
        condition: (s) => !s.ship.hardpointsDeployed,
      },
      {
        action: '',
        sideEffect: async () => { graphicsService.applyQualityPreset('Combat'); },
      },
    ],
    responseTemplate: 'Hardpoints deployed. Weapons hot, Commander. Combat graphics engaged.',
  },

  retract_weapons: {
    name: 'retract_weapons',
    description: 'Retract hardpoints and switch to cruise graphics',
    steps: [
      {
        action: 'DeployHardpointToggle',
        condition: (s) => s.ship.hardpointsDeployed,
      },
      {
        action: '',
        sideEffect: async () => { graphicsService.applyQualityPreset('Cruise'); },
      },
    ],
    responseTemplate: 'Hardpoints retracted. Cruise graphics restored.',
  },

  deploy_landing_gear: {
    name: 'deploy_landing_gear',
    description: 'Deploy landing gear',
    steps: [
      {
        action: 'LandingGearToggle',
        condition: (s) => !s.ship.landingGearDown,
      },
    ],
    responseTemplate: 'Landing gear deployed.',
  },

  retract_landing_gear: {
    name: 'retract_landing_gear',
    description: 'Retract landing gear',
    steps: [
      {
        action: 'LandingGearToggle',
        condition: (s) => s.ship.landingGearDown,
      },
    ],
    responseTemplate: 'Landing gear retracted.',
  },

  open_cargo_scoop: {
    name: 'open_cargo_scoop',
    description: 'Open cargo scoop',
    steps: [
      {
        action: 'ToggleCargoScoop',
        condition: (s) => !s.ship.cargoScoopOpen,
      },
    ],
    responseTemplate: 'Cargo scoop deployed.',
  },

  close_cargo_scoop: {
    name: 'close_cargo_scoop',
    description: 'Close cargo scoop',
    steps: [
      {
        action: 'ToggleCargoScoop',
        condition: (s) => s.ship.cargoScoopOpen,
      },
    ],
    responseTemplate: 'Cargo scoop secured.',
  },

  dock_prepare: {
    name: 'dock_prepare',
    description: 'Retract hardpoints and deploy landing gear for docking',
    steps: [
      {
        action: 'DeployHardpointToggle',
        condition: (s) => s.ship.hardpointsDeployed,
        delayAfterMs: 300,
      },
      {
        action: 'LandingGearToggle',
        condition: (s) => !s.ship.landingGearDown,
      },
    ],
    responseTemplate: 'Preparing for docking approach. Landing gear deployed.',
  },

  supercruise: {
    name: 'supercruise',
    description: 'Retract hardpoints and engage supercruise',
    steps: [
      {
        action: 'DeployHardpointToggle',
        condition: (s) => s.ship.hardpointsDeployed,
        delayAfterMs: 300,
      },
      {
        action: 'Supercruise',
      },
    ],
    responseTemplate: 'Engaging supercruise.',
  },

  silent_running: {
    name: 'silent_running',
    description: 'Activate silent running',
    steps: [
      {
        action: 'ToggleButtonUpInput',
        condition: (s) => !s.ship.silentRunning,
      },
    ],
    responseTemplate: 'Silent running activated. Heat signature minimised.',
  },

  silent_running_off: {
    name: 'silent_running_off',
    description: 'Deactivate silent running',
    steps: [
      {
        action: 'ToggleButtonUpInput',
        condition: (s) => s.ship.silentRunning,
      },
    ],
    responseTemplate: 'Silent running deactivated. Resuming normal operations.',
  },

  evasive: {
    name: 'evasive',
    description: 'Deploy chaff, boost engines, and divert power to systems',
    steps: [
      {
        action: 'FireChaffLauncher',
      },
      {
        action: 'IncreaseSystemsPower',
        delayAfterMs: 50,
      },
      {
        action: 'IncreaseSystemsPower',
        delayAfterMs: 50,
      },
      {
        action: 'IncreaseSystemsPower',
        delayAfterMs: 50,
      },
      {
        action: 'IncreaseSystemsPower',
        delayAfterMs: 100,
      },
      {
        action: 'UseBoostJuice',
      },
    ],
    responseTemplate: 'Evasive manoeuvres! Chaff deployed, pips to systems, boosting.',
  },

  night_vision: {
    name: 'night_vision',
    description: 'Toggle night vision',
    steps: [
      {
        action: 'NightVisionToggle',
      },
    ],
    responseTemplate: 'Night vision toggled.',
  },

  lights_toggle: {
    name: 'lights_toggle',
    description: 'Toggle ship lights',
    steps: [
      {
        action: 'ShipSpotLightToggle',
      },
    ],
    responseTemplate: 'Ship lights toggled.',
  },

  scan_mode: {
    name: 'scan_mode',
    description: 'Enter Full Spectrum Scanner mode',
    steps: [
      {
        action: 'ExplorationFSSEnter',
      },
    ],
    responseTemplate: 'Entering Full Spectrum Scanner.',
  },

  galaxy_map: {
    name: 'galaxy_map',
    description: 'Open the galaxy map',
    steps: [
      {
        action: 'GalaxyMapOpen',
      },
    ],
    responseTemplate: 'Opening galaxy map.',
  },

  system_map: {
    name: 'system_map',
    description: 'Open the system map',
    steps: [
      {
        action: 'SystemMapOpen',
      },
    ],
    responseTemplate: 'Opening system map.',
  },

  photo_camera: {
    name: 'photo_camera',
    description: 'Toggle the external camera suite',
    steps: [
      {
        action: 'PhotoCameraToggle',
      },
    ],
    responseTemplate: 'Camera suite activated. Strike a pose, Commander.',
  },

  boost: {
    name: 'boost',
    description: 'Engage engine boost',
    steps: [
      {
        action: 'UseBoostJuice',
      },
    ],
    responseTemplate: 'Boosting!',
  },

  chaff: {
    name: 'chaff',
    description: 'Deploy chaff launcher',
    steps: [
      {
        action: 'FireChaffLauncher',
      },
    ],
    responseTemplate: 'Chaff deployed.',
  },

  heatsink: {
    name: 'heatsink',
    description: 'Deploy heat sink',
    steps: [
      {
        action: 'DeployHeatSink',
      },
    ],
    responseTemplate: 'Heat sink deployed.',
  },

  shield_cell: {
    name: 'shield_cell',
    description: 'Fire shield cell bank',
    steps: [
      {
        action: 'UseShieldCell',
      },
    ],
    responseTemplate: 'Shield cell bank activated.',
  },

  exploration_mode: {
    name: 'exploration_mode',
    description: 'Switch to exploration graphics preset (max quality)',
    steps: [
      {
        action: '',
        condition: (s) => !s.ship.hardpointsDeployed,
        sideEffect: async () => { graphicsService.applyQualityPreset('Exploration'); },
      },
    ],
    responseTemplate: 'Exploration mode engaged. Maximum visual quality enabled.',
  },
};

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class ActionEngine {
  /**
   * Execute a named macro, checking preconditions for each step.
   */
  async executeMacro(macroName: string): Promise<MacroResult> {
    const macro = macros[macroName];
    if (!macro) {
      return { success: false, stepsExecuted: [], stepsSkipped: [], error: `Unknown macro: ${macroName}` };
    }

    console.log(`[Action] Executing macro "${macro.name}" — ${macro.description}`);
    const state = gameStateManager.getState();
    const executed: string[] = [];
    const skipped: string[] = [];

    for (const step of macro.steps) {
      // Check precondition
      if (step.condition && !step.condition(state)) {
        console.log(`[Action]   Skip "${step.action}" — condition not met`);
        skipped.push(step.action);
        continue;
      }

      // Send the keypress (skip if action is empty — side-effect-only step)
      if (step.action) {
        const sent = await keypressService.sendAction(step.action);
        if (sent) {
          executed.push(step.action);
          console.log(`[Action]   Sent "${step.action}"`);
        } else {
          console.warn(`[Action]   Failed to send "${step.action}" — binding not resolved`);
          skipped.push(step.action);
        }
      }

      // Run side effect if present
      if (step.sideEffect) {
        try {
          await step.sideEffect();
          if (!step.action) executed.push('sideEffect');
          console.log(`[Action]   Side effect executed`);
        } catch (err) {
          console.warn(`[Action]   Side effect failed:`, err);
        }
      }

      // Delay between steps
      if (step.delayAfterMs) {
        await sleep(step.delayAfterMs);
      }
    }

    return { success: executed.length > 0, stepsExecuted: executed, stepsSkipped: skipped };
  }

  /** Get the fallback response template for a macro. */
  getResponseTemplate(macroName: string): string {
    return macros[macroName]?.responseTemplate ?? '';
  }

  /** List all available macro names. */
  getMacroNames(): string[] {
    return Object.keys(macros);
  }
}

export const actionEngine = new ActionEngine();
