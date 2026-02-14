/**
 * @vayu/client -- Wizard Intro Screen
 *
 * Welcome screen for the binding setup wizard. Shows connected devices,
 * a clear-all option, phase overview with action counts, and Begin/Cancel.
 */

import { useGamepad } from '../../../hooks/useGamepad';
import type { WizardPhase } from '@vayu/shared';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WizardIntroProps {
  phases: WizardPhase[];
  totalActions: number;
  clearBeforeBind: boolean;
  onToggleClear: () => void;
  onBegin: () => void;
  onCancel: () => void;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const is = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    padding: 'var(--space-xl)',
    maxWidth: 640,
    margin: '0 auto',
    width: '100%',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.6rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.12em',
    color: 'var(--color-accent-bright)',
    textShadow: '0 0 30px rgba(78, 154, 62, 0.3)',
    marginBottom: 'var(--space-sm)',
    textAlign: 'center' as const,
  },
  subtitle: {
    fontFamily: 'var(--font-body)',
    fontSize: '0.85rem',
    color: 'var(--color-text-secondary)',
    textAlign: 'center' as const,
    lineHeight: '1.6',
    marginBottom: 'var(--space-lg)',
    maxWidth: 500,
  },
  devicesSection: {
    width: '100%',
    marginBottom: 'var(--space-lg)',
  },
  devicesLabel: {
    fontFamily: 'var(--font-display)',
    fontSize: '0.6rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
    color: 'var(--color-text-muted)',
    marginBottom: 'var(--space-sm)',
  },
  deviceRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-sm)',
    padding: '4px 0',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.75rem',
    color: 'var(--color-text-primary)',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
  },
  noDevices: {
    fontFamily: 'var(--font-body)',
    fontSize: '0.75rem',
    color: 'var(--color-text-muted)',
    fontStyle: 'italic',
  },
  clearOption: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-sm)',
    marginBottom: 'var(--space-lg)',
    cursor: 'pointer',
  },
  checkbox: {
    width: 16,
    height: 16,
    accentColor: 'var(--color-accent)',
    cursor: 'pointer',
  },
  clearLabel: {
    fontFamily: 'var(--font-body)',
    fontSize: '0.75rem',
    color: 'var(--color-text-secondary)',
    cursor: 'pointer',
  },
  phasesSection: {
    width: '100%',
    marginBottom: 'var(--space-xl)',
  },
  phasesLabel: {
    fontFamily: 'var(--font-display)',
    fontSize: '0.6rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
    color: 'var(--color-text-muted)',
    marginBottom: 'var(--space-sm)',
  },
  phaseRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    padding: '5px 0',
    borderBottom: '1px solid rgba(30, 58, 46, 0.4)',
  },
  phaseName: {
    fontFamily: 'var(--font-body)',
    fontSize: '0.75rem',
    color: 'var(--color-text-primary)',
  },
  phaseCount: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.7rem',
    color: 'var(--color-text-muted)',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    padding: '8px 0 0',
    fontFamily: 'var(--font-display)',
    fontSize: '0.7rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    color: 'var(--color-accent)',
  },
  buttons: {
    display: 'flex',
    gap: 'var(--space-md)',
  },
  btn: {
    padding: '10px 24px',
    fontFamily: 'var(--font-display)',
    fontSize: '0.75rem',
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
} as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function WizardIntro({
  phases,
  totalActions,
  clearBeforeBind,
  onToggleClear,
  onBegin,
  onCancel,
}: WizardIntroProps) {
  const { devices } = useGamepad();

  return (
    <div style={is.container}>
      {/* Title */}
      <div style={is.title}>Binding Setup Wizard</div>
      <div style={is.subtitle}>
        Walk through every important action one-by-one. For each action, you'll
        see what it does in-game, then bind a key, button, or axis to it. You
        can skip any action and come back later.
      </div>

      {/* Connected devices */}
      <div style={is.devicesSection}>
        <div style={is.devicesLabel}>Connected Devices</div>
        {devices.length === 0 ? (
          <div style={is.noDevices}>
            No gamepad/HOTAS detected. Connect a device to begin binding.
          </div>
        ) : (
          devices.map((d) => (
            <div key={d.index} style={is.deviceRow}>
              <div style={{ ...is.dot, background: 'var(--color-accent-bright)' }} />
              {d.label}
              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.65rem' }}>
                ({d.buttonCount} btns, {d.axisCount} axes)
              </span>
            </div>
          ))
        )}
      </div>

      {/* Clear option */}
      <label style={is.clearOption}>
        <input
          type="checkbox"
          checked={clearBeforeBind}
          onChange={onToggleClear}
          style={is.checkbox}
        />
        <span style={is.clearLabel}>
          Clear existing binding for each action before rebinding
        </span>
      </label>

      {/* Phase overview */}
      <div style={is.phasesSection}>
        <div style={is.phasesLabel}>Phases</div>
        {phases.map((phase, i) => (
          <div key={i} style={is.phaseRow}>
            <div style={is.phaseName}>
              {i + 1}. {phase.title}
            </div>
            <div style={is.phaseCount}>
              {phase.actions.length} actions
            </div>
          </div>
        ))}
        <div style={is.totalRow}>
          <div>Total</div>
          <div>{totalActions} actions</div>
        </div>
      </div>

      {/* Buttons */}
      <div style={is.buttons}>
        <button style={is.btn} onClick={onCancel}>Cancel</button>
        <button style={{ ...is.btn, ...is.btnPrimary }} onClick={onBegin}>
          Begin Setup
        </button>
      </div>
    </div>
  );
}
