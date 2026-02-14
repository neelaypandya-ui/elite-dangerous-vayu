/**
 * @vayu/client -- Binding Editor Modal
 *
 * Click-to-rebind modal for editing Elite Dangerous key bindings.
 * Flow:
 *   1. User clicks a binding value -> modal opens
 *   2. Listening state: "Press a button or move an axis..."
 *   3. useGamepad in listenMode detects first input
 *   4. Confirming state: shows detected input, conflict warning if applicable
 *   5. Confirm / Try Again / Clear / Cancel
 *   6. Saving state: spinner while PUT request completes
 *   7. On success: close modal, refresh bindings data
 */

import { useState, useEffect, useCallback } from 'react';
import { useGamepad } from '../../hooks/useGamepad';
import type { GamepadInput } from '../../utils/gamepad-mapping';
import { apiFetch } from '../../hooks/useApi';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BindingEditorProps {
  /** The action being edited (e.g. "YawLeftButton"). */
  action: string;
  /** Which slot to edit. */
  slot: 'primary' | 'secondary' | 'axis';
  /** Human-readable action label. */
  actionLabel: string;
  /** Current binding description (for display). */
  currentBinding: string;
  /** Look up what action is bound to a device+key combo (for conflict detection). */
  findActionRaw: (device: string, key: string) => string | null;
  /** Called when the modal should close. */
  onClose: () => void;
  /** Called after a successful save to refresh bindings data. */
  onSaved: () => void;
}

type EditorState = 'listening' | 'confirming' | 'saving' | 'error';

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const es = {
  overlay: {
    position: 'fixed' as const,
    inset: 0,
    background: 'rgba(0, 0, 0, 0.75)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(4px)',
  },
  modal: {
    background: 'var(--color-bg-primary)',
    border: '1px solid var(--color-border-bright)',
    borderRadius: 'var(--radius-md)',
    padding: 'var(--space-xl)',
    width: '100%',
    maxWidth: 480,
    boxShadow: '0 0 40px rgba(78, 154, 62, 0.15)',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: '1rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
    color: 'var(--color-accent-bright)',
    marginBottom: 'var(--space-xs)',
  },
  subtitle: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.75rem',
    color: 'var(--color-text-muted)',
    marginBottom: 'var(--space-lg)',
  },
  slotBadge: {
    display: 'inline-block',
    padding: '1px 6px',
    fontFamily: 'var(--font-display)',
    fontSize: '0.55rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--color-accent)',
    color: 'var(--color-accent)',
    marginLeft: 8,
  },
  listeningBox: {
    textAlign: 'center' as const,
    padding: 'var(--space-xl) var(--space-md)',
    border: '1px dashed var(--color-border)',
    borderRadius: 'var(--radius-md)',
    marginBottom: 'var(--space-lg)',
  },
  listeningText: {
    fontFamily: 'var(--font-display)',
    fontSize: '0.85rem',
    color: 'var(--color-text-primary)',
    letterSpacing: '0.06em',
    animation: 'pulse 1.2s ease-in-out infinite',
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
  conflictBox: {
    padding: 'var(--space-sm) var(--space-md)',
    background: 'rgba(255, 168, 0, 0.08)',
    border: '1px solid rgba(255, 168, 0, 0.3)',
    borderRadius: 'var(--radius-sm)',
    marginBottom: 'var(--space-md)',
  },
  conflictText: {
    fontFamily: 'var(--font-body)',
    fontSize: '0.72rem',
    color: 'var(--color-warning)',
  },
  buttons: {
    display: 'flex',
    gap: 'var(--space-sm)',
    justifyContent: 'flex-end',
    flexWrap: 'wrap' as const,
  },
  btn: {
    padding: '6px 14px',
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
  btnDanger: {
    borderColor: 'var(--color-danger)',
    color: 'var(--color-danger)',
  },
  errorText: {
    fontFamily: 'var(--font-body)',
    fontSize: '0.8rem',
    color: 'var(--color-danger)',
    marginBottom: 'var(--space-md)',
    textAlign: 'center' as const,
  },
  notice: {
    fontFamily: 'var(--font-body)',
    fontSize: '0.65rem',
    color: 'var(--color-text-muted)',
    textAlign: 'center' as const,
    marginTop: 'var(--space-md)',
    fontStyle: 'italic',
  },
  spinner: {
    width: 24,
    height: 24,
    border: '2px solid var(--color-border)',
    borderTop: '2px solid var(--color-accent-bright)',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto',
    marginBottom: 'var(--space-md)',
  },
} as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BindingEditor({
  action,
  slot,
  actionLabel,
  currentBinding,
  findActionRaw,
  onClose,
  onSaved,
}: BindingEditorProps) {
  const [state, setState] = useState<EditorState>('listening');
  const [detectedInput, setDetectedInput] = useState<GamepadInput | null>(null);
  const [conflict, setConflict] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Listen mode gamepad hook - only active during listening state
  const { devices } = useGamepad({
    listenMode: state === 'listening',
    onAnyInput: useCallback((input: GamepadInput) => {
      setDetectedInput(input);

      // Check for conflicts
      const existingAction = findActionRaw(input.device, input.eliteKey);
      if (existingAction && existingAction !== action) {
        setConflict(existingAction);
      } else {
        setConflict(null);
      }

      setState('confirming');
    }, [findActionRaw, action]),
  });

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // -------------------------------------------------------------------
  // Save binding
  // -------------------------------------------------------------------

  const saveBinding = useCallback(async (clear = false) => {
    setState('saving');
    setErrorMessage(null);

    try {
      const body: Record<string, unknown> = { slot };

      if (clear) {
        body.clear = true;
      } else if (detectedInput) {
        body.device = detectedInput.device;
        if (slot === 'axis') {
          body.axis = detectedInput.eliteKey;
        } else {
          body.key = detectedInput.eliteKey;
        }
      }

      await apiFetch(`/bindings/${encodeURIComponent(action)}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });

      onSaved();
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save binding';
      setErrorMessage(message);
      setState('error');
    }
  }, [action, slot, detectedInput, onSaved, onClose]);

  const tryAgain = useCallback(() => {
    setDetectedInput(null);
    setConflict(null);
    setState('listening');
  }, []);

  // -------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------

  return (
    <div style={es.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={es.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={es.title}>
          Edit Binding
          <span style={es.slotBadge}>{slot}</span>
        </div>
        <div style={es.subtitle}>
          {actionLabel}
          {currentBinding && currentBinding !== '--' && (
            <> &mdash; currently: {currentBinding}</>
          )}
        </div>

        {/* Listening State */}
        {state === 'listening' && (
          <>
            <div style={es.listeningBox}>
              <div style={es.listeningText}>
                {slot === 'axis'
                  ? 'Move an axis on your device...'
                  : 'Press a button on your device...'}
              </div>
              <div style={es.listeningHint}>
                {devices.length === 0
                  ? 'No gamepad detected. Connect a device and try again.'
                  : `Listening on ${devices.map((d) => d.label).join(', ')}`}
              </div>
            </div>
            <div style={es.buttons}>
              <button style={{ ...es.btn, ...es.btnDanger }} onClick={() => saveBinding(true)}>
                Clear Binding
              </button>
              <button style={es.btn} onClick={onClose}>
                Cancel
              </button>
            </div>
          </>
        )}

        {/* Confirming State */}
        {state === 'confirming' && detectedInput && (
          <>
            <div style={es.detectedBox}>
              <div style={es.detectedLabel}>Detected Input</div>
              <div style={es.detectedValue}>
                {detectedInput.eliteKey}
              </div>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.7rem',
                color: 'var(--color-text-muted)',
                marginTop: 4,
              }}>
                {detectedInput.label} on {detectedInput.device}
              </div>
            </div>

            {conflict && (
              <div style={es.conflictBox}>
                <div style={es.conflictText}>
                  This input is already bound to: {conflict}
                </div>
              </div>
            )}

            <div style={es.buttons}>
              <button style={es.btn} onClick={tryAgain}>
                Try Again
              </button>
              <button style={{ ...es.btn, ...es.btnDanger }} onClick={() => saveBinding(true)}>
                Clear
              </button>
              <button style={es.btn} onClick={onClose}>
                Cancel
              </button>
              <button style={{ ...es.btn, ...es.btnPrimary }} onClick={() => saveBinding()}>
                Confirm
              </button>
            </div>
          </>
        )}

        {/* Saving State */}
        {state === 'saving' && (
          <div style={{ textAlign: 'center', padding: 'var(--space-lg)' }}>
            <div style={es.spinner} />
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

        {/* Error State */}
        {state === 'error' && (
          <>
            <div style={es.errorText}>
              {errorMessage || 'An error occurred while saving.'}
            </div>
            <div style={es.buttons}>
              <button style={es.btn} onClick={tryAgain}>
                Try Again
              </button>
              <button style={es.btn} onClick={onClose}>
                Cancel
              </button>
            </div>
          </>
        )}

        {/* Notice */}
        <div style={es.notice}>
          Changes take effect next time you launch Elite Dangerous
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
