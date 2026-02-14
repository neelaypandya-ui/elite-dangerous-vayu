/**
 * @vayu/client -- Binding Wizard
 *
 * Full-screen overlay that walks the user through binding ~80 actions
 * across 8 phases. Uses a useReducer state machine to manage the flow:
 *   Intro → Step (repeats) → Summary
 *
 * Each binding is saved immediately via PUT /api/bindings/:action.
 * Back navigation is supported — results are stored in a Map keyed
 * by action name.
 */

import { useReducer, useCallback, useEffect } from 'react';
import { WIZARD_PHASES, WIZARD_TOTAL_ACTIONS } from '@vayu/shared';
import { WizardIntro } from './WizardIntro';
import { WizardStep, type StepResult } from './WizardStep';
import { WizardProgress } from './WizardProgress';
import { WizardSummary } from './WizardSummary';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BindingWizardProps {
  /** Close the wizard overlay. */
  onClose: () => void;
  /** Called when the wizard finishes — triggers data refresh. */
  onComplete: () => void;
  /** Conflict detection: returns action name or null. */
  findActionRaw: (device: string, key: string) => string | null;
}

type Screen = 'intro' | 'step' | 'summary';

interface WizardState {
  screen: Screen;
  currentPhaseIndex: number;
  currentActionIndex: number;
  clearBeforeBind: boolean;
  results: Map<string, StepResult>;
}

type WizardReducerAction =
  | { type: 'START' }
  | { type: 'TOGGLE_CLEAR' }
  | { type: 'COMPLETE_STEP'; result: StepResult }
  | { type: 'SKIP_STEP' }
  | { type: 'GO_BACK' }
  | { type: 'FINISH' }
  | { type: 'RESET' };

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

function advance(state: WizardState): WizardState {
  const currentPhase = WIZARD_PHASES[state.currentPhaseIndex];
  const nextActionIndex = state.currentActionIndex + 1;

  if (nextActionIndex < currentPhase.actions.length) {
    // Next action in same phase
    return { ...state, currentActionIndex: nextActionIndex };
  }

  // Try next phase
  const nextPhaseIndex = state.currentPhaseIndex + 1;
  if (nextPhaseIndex < WIZARD_PHASES.length) {
    return { ...state, currentPhaseIndex: nextPhaseIndex, currentActionIndex: 0 };
  }

  // All phases done
  return { ...state, screen: 'summary' };
}

function goBack(state: WizardState): WizardState {
  if (state.currentActionIndex > 0) {
    return { ...state, currentActionIndex: state.currentActionIndex - 1 };
  }

  // Go to previous phase's last action
  if (state.currentPhaseIndex > 0) {
    const prevPhaseIndex = state.currentPhaseIndex - 1;
    const prevPhase = WIZARD_PHASES[prevPhaseIndex];
    return {
      ...state,
      currentPhaseIndex: prevPhaseIndex,
      currentActionIndex: prevPhase.actions.length - 1,
    };
  }

  // Already at the very start — go back to intro
  return { ...state, screen: 'intro' };
}

function wizardReducer(state: WizardState, action: WizardReducerAction): WizardState {
  switch (action.type) {
    case 'START':
      return { ...state, screen: 'step', currentPhaseIndex: 0, currentActionIndex: 0 };

    case 'TOGGLE_CLEAR':
      return { ...state, clearBeforeBind: !state.clearBeforeBind };

    case 'COMPLETE_STEP': {
      const newResults = new Map(state.results);
      newResults.set(action.result.action, action.result);
      return advance({ ...state, results: newResults });
    }

    case 'SKIP_STEP': {
      const currentPhase = WIZARD_PHASES[state.currentPhaseIndex];
      const wa = currentPhase.actions[state.currentActionIndex];
      const newResults = new Map(state.results);
      newResults.set(wa.action, { action: wa.action, status: 'skipped', input: null });
      return advance({ ...state, results: newResults });
    }

    case 'GO_BACK':
      return goBack(state);

    case 'FINISH':
      return { ...state, screen: 'summary' };

    case 'RESET':
      return initialState();

    default:
      return state;
  }
}

function initialState(): WizardState {
  return {
    screen: 'intro',
    currentPhaseIndex: 0,
    currentActionIndex: 0,
    clearBeforeBind: false,
    results: new Map(),
  };
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const bws = {
  overlay: {
    position: 'fixed' as const,
    inset: 0,
    background: 'var(--color-bg-primary)',
    zIndex: 2000,
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 'var(--space-md) var(--space-xl)',
    borderBottom: '1px solid var(--color-border)',
    flexShrink: 0,
  },
  topTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '0.8rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
    color: 'var(--color-accent)',
  },
  closeBtn: {
    padding: '4px 12px',
    fontFamily: 'var(--font-display)',
    fontSize: '0.6rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)',
    background: 'transparent',
    color: 'var(--color-text-muted)',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  body: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'auto',
  },
  progressWrapper: {
    padding: 'var(--space-md) var(--space-xl) 0',
    flexShrink: 0,
  },
} as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BindingWizard({ onClose, onComplete, findActionRaw }: BindingWizardProps) {
  const [state, dispatch] = useReducer(wizardReducer, undefined, initialState);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Callbacks
  const handleBegin = useCallback(() => dispatch({ type: 'START' }), []);
  const handleToggleClear = useCallback(() => dispatch({ type: 'TOGGLE_CLEAR' }), []);
  const handleCompleteStep = useCallback((result: StepResult) => {
    dispatch({ type: 'COMPLETE_STEP', result });
  }, []);
  const handleSkip = useCallback(() => dispatch({ type: 'SKIP_STEP' }), []);
  const handleBack = useCallback(() => dispatch({ type: 'GO_BACK' }), []);
  const handleFinish = useCallback(() => {
    onComplete();
  }, [onComplete]);

  // Current action info (for step screen)
  const currentPhase = WIZARD_PHASES[state.currentPhaseIndex];
  const currentAction = currentPhase?.actions[state.currentActionIndex];
  const isFirstStep = state.currentPhaseIndex === 0 && state.currentActionIndex === 0;

  return (
    <div style={bws.overlay}>
      {/* Top bar */}
      <div style={bws.topBar}>
        <div style={bws.topTitle}>Binding Setup Wizard</div>
        <button style={bws.closeBtn} onClick={onClose}>
          Exit Wizard
        </button>
      </div>

      {/* Progress bar (only on step screen) */}
      {state.screen === 'step' && (
        <div style={bws.progressWrapper}>
          <WizardProgress
            phases={WIZARD_PHASES}
            currentPhaseIndex={state.currentPhaseIndex}
            currentActionIndex={state.currentActionIndex}
            totalActions={WIZARD_TOTAL_ACTIONS}
          />
        </div>
      )}

      {/* Body */}
      <div style={bws.body}>
        {state.screen === 'intro' && (
          <WizardIntro
            phases={WIZARD_PHASES}
            totalActions={WIZARD_TOTAL_ACTIONS}
            clearBeforeBind={state.clearBeforeBind}
            onToggleClear={handleToggleClear}
            onBegin={handleBegin}
            onCancel={onClose}
          />
        )}

        {state.screen === 'step' && currentAction && (
          <WizardStep
            key={currentAction.action}
            wizardAction={currentAction}
            phaseTitle={currentPhase.title}
            clearBeforeBind={state.clearBeforeBind}
            findActionRaw={findActionRaw}
            previousResult={state.results.get(currentAction.action) ?? null}
            onComplete={handleCompleteStep}
            onSkip={handleSkip}
            onBack={handleBack}
            canGoBack={!isFirstStep}
          />
        )}

        {state.screen === 'summary' && (
          <WizardSummary
            phases={WIZARD_PHASES}
            results={state.results}
            onFinish={handleFinish}
          />
        )}
      </div>
    </div>
  );
}
