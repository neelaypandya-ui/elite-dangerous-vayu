/**
 * @vayu/client -- Wizard Progress Bar
 *
 * Segmented progress bar for the binding wizard. Shows 8 phase segments
 * proportionally sized by action count. Current segment is highlighted.
 * Displays "Phase N of 8: Title — Action X of Y" plus overall percentage.
 */

import type { WizardPhase } from '@vayu/shared';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WizardProgressProps {
  /** All wizard phases. */
  phases: WizardPhase[];
  /** Zero-based index of the current phase. */
  currentPhaseIndex: number;
  /** Zero-based index of the current action within the phase. */
  currentActionIndex: number;
  /** Total actions across all phases. */
  totalActions: number;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const ps = {
  container: {
    marginBottom: 'var(--space-lg)',
  },
  info: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 'var(--space-sm)',
  },
  phaseLabel: {
    fontFamily: 'var(--font-display)',
    fontSize: '0.65rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    color: 'var(--color-accent)',
  },
  percentage: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.7rem',
    color: 'var(--color-text-muted)',
  },
  bar: {
    display: 'flex',
    gap: 2,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  stepLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.65rem',
    color: 'var(--color-text-muted)',
    marginTop: 'var(--space-xs)',
  },
} as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function WizardProgress({
  phases,
  currentPhaseIndex,
  currentActionIndex,
  totalActions,
}: WizardProgressProps) {
  // Count completed actions across all prior phases + current index
  let completedActions = 0;
  for (let i = 0; i < currentPhaseIndex; i++) {
    completedActions += phases[i].actions.length;
  }
  completedActions += currentActionIndex;

  const pct = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;
  const currentPhase = phases[currentPhaseIndex];

  return (
    <div style={ps.container}>
      {/* Phase label + percentage */}
      <div style={ps.info}>
        <div style={ps.phaseLabel}>
          Phase {currentPhaseIndex + 1} of {phases.length}: {currentPhase.title}
        </div>
        <div style={ps.percentage}>{pct}%</div>
      </div>

      {/* Segmented bar */}
      <div style={ps.bar}>
        {phases.map((phase, i) => {
          const fraction = phase.actions.length / totalActions;
          let bg: string;
          if (i < currentPhaseIndex) {
            bg = 'var(--color-accent)';
          } else if (i === currentPhaseIndex) {
            // Partially filled for current phase
            const inPhase = currentActionIndex / phase.actions.length;
            bg = `linear-gradient(to right, var(--color-accent) ${inPhase * 100}%, var(--color-border) ${inPhase * 100}%)`;
          } else {
            bg = 'var(--color-border)';
          }

          return (
            <div
              key={i}
              style={{
                flex: `${fraction} 0 0%`,
                background: bg,
                borderRadius: 3,
                transition: 'background 0.3s',
              }}
            />
          );
        })}
      </div>

      {/* Step label */}
      <div style={ps.stepLabel}>
        Action {currentActionIndex + 1} of {currentPhase.actions.length}
      </div>
    </div>
  );
}
