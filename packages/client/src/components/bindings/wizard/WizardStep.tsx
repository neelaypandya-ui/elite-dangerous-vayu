/**
 * @vayu/client -- Wizard Step
 *
 * Single action step in the binding setup wizard. Reuses the same
 * listen → confirm → save flow as BindingEditor, but embedded inline
 * instead of a modal. On save success it calls onComplete to advance.
 */

import { useState, useEffect, useCallback } from 'react';
import { useGamepad } from '../../../hooks/useGamepad';
import { apiFetch } from '../../../hooks/useApi';
import type { GamepadInput } from '../../../utils/gamepad-mapping';
import type { WizardAction } from '@vayu/shared';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StepResult {
  action: string;
  status: 'bound' | 'skipped' | 'cleared';
  /** The input that was bound (null if skipped/cleared). */
  input: GamepadInput | null;
}

interface WizardStepProps {
  /** The action to configure. */
  wizardAction: WizardAction;
  /** Phase title for context. */
  phaseTitle: string;
  /** Whether to clear existing binding before saving. */
  clearBeforeBind: boolean;
  /** Look up conflicts: returns action name or null. */
  findActionRaw: (device: string, key: string) => string | null;
  /** Previous result for this action (if going back). */
  previousResult?: StepResult | null;
  /** Called with the result when this step completes. */
  onComplete: (result: StepResult) => void;
  /** Called to skip this action. */
  onSkip: () => void;
  /** Called to go back to the previous step. */
  onBack: () => void;
  /** Whether the back button should be shown. */
  canGoBack: boolean;
}

type StepState = 'listening' | 'confirming' | 'saving' | 'error' | 'unavailable';

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const ws = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    padding: 'var(--space-xl)',
    maxWidth: 600,
    margin: '0 auto',
    width: '100%',
  },
  actionLabel: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.5rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
    color: 'var(--color-accent-bright)',
    textAlign: 'center' as const,
    marginBottom: 'var(--space-sm)',
    textShadow: '0 0 20px rgba(78, 154, 62, 0.3)',
  },
  description: {
    fontFamily: 'var(--font-body)',
    fontSize: '0.85rem',
    color: 'var(--color-text-secondary)',
    textAlign: 'center' as const,
    marginBottom: 'var(--space-lg)',
    lineHeight: '1.5',
  },
  slotBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    fontFamily: 'var(--font-display)',
    fontSize: '0.55rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--color-accent)',
    color: 'var(--color-accent)',
    marginBottom: 'var(--space-lg)',
  },
  listeningBox: {
    textAlign: 'center' as const,
    padding: 'var(--space-xl) var(--space-lg)',
    border: '1px dashed var(--color-border)',
    borderRadius: 'var(--radius-md)',
    marginBottom: 'var(--space-lg)',
    width: '100%',
  },
  listeningText: {
    fontFamily: 'var(--font-display)',
    fontSize: '0.85rem',
    color: 'var(--color-text-primary)',
    letterSpacing: '0.06em',
    animation: 'wizardPulse 1.2s ease-in-out infinite',
  },
  listeningHint: {
    fontFamily: 'var(--font-body)',
    fontSize: '0.72rem',
    color: 'var(--color-text-muted)',
    marginTop: 'var(--space-sm)',
  },
  detectedBox: {
    padding: 'var(--space-md)',
    background: 'rgba(78, 154, 62, 0.08)',
    border: '1px solid rgba(78, 154, 62, 0.3)',
    borderRadius: 'var(--radius-md)',
    marginBottom: 'var(--space-md)',
    width: '100%',
  },
  detectedLabel: {
    fontFamily: 'var(--font-display)',
    fontSize: '0.6rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
    color: 'var(--color-text-muted)',
    marginBottom: 4,
  },
  detectedValue: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.95rem',
    color: 'var(--color-accent-bright)',
  },
  detectedDevice: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.7rem',
    color: 'var(--color-text-muted)',
    marginTop: 4,
  },
  conflictBox: {
    padding: 'var(--space-sm) var(--space-md)',
    background: 'rgba(255, 168, 0, 0.08)',
    border: '1px solid rgba(255, 168, 0, 0.3)',
    borderRadius: 'var(--radius-sm)',
    marginBottom: 'var(--space-md)',
    width: '100%',
  },
  conflictText: {
    fontFamily: 'var(--font-body)',
    fontSize: '0.72rem',
    color: 'var(--color-warning)',
  },
  buttons: {
    display: 'flex',
    gap: 'var(--space-sm)',
    justifyContent: 'center',
    flexWrap: 'wrap' as const,
  },
  btn: {
    padding: '8px 18px',
    fontFamily: 'var(--font-display)',
    fontSize: '0.7rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)',
    background: 'transparent',
    color: 'var(--color-text-primary)',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  btnPrimary: {
    borderColor: 'var(--color-accent-bright)',
    color: 'var(--color-accent-bright)',
    background: 'var(--color-accent-dim)',
  },
  btnSkip: {
    borderColor: 'var(--color-text-muted)',
    color: 'var(--color-text-muted)',
  },
  errorText: {
    fontFamily: 'var(--font-body)',
    fontSize: '0.8rem',
    color: 'var(--color-danger)',
    marginBottom: 'var(--space-md)',
    textAlign: 'center' as const,
  },
  unavailableBox: {
    textAlign: 'center' as const,
    padding: 'var(--space-lg)',
    border: '1px dashed var(--color-warning)',
    borderRadius: 'var(--radius-md)',
    marginBottom: 'var(--space-lg)',
    width: '100%',
  },
  unavailableText: {
    fontFamily: 'var(--font-body)',
    fontSize: '0.8rem',
    color: 'var(--color-warning)',
  },
  spinner: {
    width: 24,
    height: 24,
    border: '2px solid var(--color-border)',
    borderTop: '2px solid var(--color-accent-bright)',
    borderRadius: '50%',
    animation: 'wizardSpin 1s linear infinite',
    margin: '0 auto var(--space-md)',
  },
  previousLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.7rem',
    color: 'var(--color-text-muted)',
    marginBottom: 'var(--space-md)',
    textAlign: 'center' as const,
  },
} as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function WizardStep({
  wizardAction,
  phaseTitle,
  clearBeforeBind,
  findActionRaw,
  previousResult,
  onComplete,
  onSkip,
  onBack,
  canGoBack,
}: WizardStepProps) {
  const [state, setState] = useState<StepState>('listening');
  const [detectedInput, setDetectedInput] = useState<GamepadInput | null>(null);
  const [conflict, setConflict] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reset state when the action changes
  useEffect(() => {
    setState('listening');
    setDetectedInput(null);
    setConflict(null);
    setErrorMessage(null);
  }, [wizardAction.action]);

  // Gamepad listen mode
  const { devices } = useGamepad({
    listenMode: state === 'listening',
    onAnyInput: useCallback((input: GamepadInput) => {
      setDetectedInput(input);

      const existingAction = findActionRaw(input.device, input.eliteKey);
      if (existingAction && existingAction !== wizardAction.action) {
        setConflict(existingAction);
      } else {
        setConflict(null);
      }

      setState('confirming');
    }, [findActionRaw, wizardAction.action]),
  });

  // -------------------------------------------------------------------
  // Save
  // -------------------------------------------------------------------

  const saveBinding = useCallback(async () => {
    if (!detectedInput) return;
    setState('saving');
    setErrorMessage(null);

    try {
      // If clearBeforeBind, send a clear first
      if (clearBeforeBind) {
        await apiFetch(`/bindings/${encodeURIComponent(wizardAction.action)}`, {
          method: 'PUT',
          body: JSON.stringify({ slot: wizardAction.slot, clear: true }),
        });
      }

      // Now bind the new input
      const body: Record<string, unknown> = {
        slot: wizardAction.slot,
        device: detectedInput.device,
      };

      if (wizardAction.slot === 'axis') {
        body.axis = detectedInput.eliteKey;
      } else {
        body.key = detectedInput.eliteKey;
      }

      await apiFetch(`/bindings/${encodeURIComponent(wizardAction.action)}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });

      onComplete({
        action: wizardAction.action,
        status: 'bound',
        input: detectedInput,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save binding';
      setErrorMessage(message);
      setState('error');
    }
  }, [wizardAction, detectedInput, clearBeforeBind, onComplete]);

  const tryAgain = useCallback(() => {
    setDetectedInput(null);
    setConflict(null);
    setState('listening');
  }, []);

  const handleSkip = useCallback(() => {
    onSkip();
  }, [onSkip]);

  // -------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------

  return (
    <div style={ws.container}>
      {/* Action label */}
      <div style={ws.actionLabel}>{wizardAction.label}</div>
      <div style={ws.description}>{wizardAction.description}</div>
      <div style={ws.slotBadge}>
        {wizardAction.slot === 'axis' ? 'AXIS' : 'BUTTON'}
      </div>

      {/* Previous result notice */}
      {previousResult && (
        <div style={ws.previousLabel}>
          Previously: {previousResult.status === 'bound' && previousResult.input
            ? `${previousResult.input.eliteKey} on ${previousResult.input.device}`
            : previousResult.status}
        </div>
      )}

      {/* Listening */}
      {state === 'listening' && (
        <>
          <div style={ws.listeningBox}>
            <div style={ws.listeningText}>
              {wizardAction.slot === 'axis'
                ? 'Move an axis on your device...'
                : 'Press a button on your device...'}
            </div>
            <div style={ws.listeningHint}>
              {devices.length === 0
                ? 'No gamepad detected. Connect a device and try again.'
                : `Listening on ${devices.map((d) => d.label).join(', ')}`}
            </div>
          </div>
          <div style={ws.buttons}>
            {canGoBack && (
              <button style={ws.btn} onClick={onBack}>Back</button>
            )}
            <button style={{ ...ws.btn, ...ws.btnSkip }} onClick={handleSkip}>Skip</button>
          </div>
        </>
      )}

      {/* Confirming */}
      {state === 'confirming' && detectedInput && (
        <>
          <div style={ws.detectedBox}>
            <div style={ws.detectedLabel}>Detected Input</div>
            <div style={ws.detectedValue}>{detectedInput.eliteKey}</div>
            <div style={ws.detectedDevice}>
              {detectedInput.label} on {detectedInput.device}
            </div>
          </div>

          {conflict && (
            <div style={ws.conflictBox}>
              <div style={ws.conflictText}>
                This input is already bound to: {conflict}
              </div>
            </div>
          )}

          <div style={ws.buttons}>
            {canGoBack && (
              <button style={ws.btn} onClick={onBack}>Back</button>
            )}
            <button style={ws.btn} onClick={tryAgain}>Try Again</button>
            <button style={{ ...ws.btn, ...ws.btnSkip }} onClick={handleSkip}>Skip</button>
            <button style={{ ...ws.btn, ...ws.btnPrimary }} onClick={saveBinding}>Confirm</button>
          </div>
        </>
      )}

      {/* Saving */}
      {state === 'saving' && (
        <div style={{ textAlign: 'center', padding: 'var(--space-lg)' }}>
          <div style={ws.spinner} />
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: '0.75rem',
            color: 'var(--color-text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}>
            Saving...
          </div>
        </div>
      )}

      {/* Error */}
      {state === 'error' && (
        <>
          <div style={ws.errorText}>
            {errorMessage || 'An error occurred while saving.'}
          </div>
          <div style={ws.buttons}>
            {canGoBack && (
              <button style={ws.btn} onClick={onBack}>Back</button>
            )}
            <button style={ws.btn} onClick={tryAgain}>Try Again</button>
            <button style={{ ...ws.btn, ...ws.btnSkip }} onClick={handleSkip}>Skip</button>
          </div>
        </>
      )}

      {/* Unavailable */}
      {state === 'unavailable' && (
        <>
          <div style={ws.unavailableBox}>
            <div style={ws.unavailableText}>
              This action is not available in your binding profile. You may skip it.
            </div>
          </div>
          <div style={ws.buttons}>
            {canGoBack && (
              <button style={ws.btn} onClick={onBack}>Back</button>
            )}
            <button style={{ ...ws.btn, ...ws.btnSkip }} onClick={handleSkip}>Skip</button>
          </div>
        </>
      )}

      {/* Animations */}
      <style>{`
        @keyframes wizardPulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes wizardSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
