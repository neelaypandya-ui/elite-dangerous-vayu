/**
 * @vayu/client -- Wizard Summary Screen
 *
 * Final screen shown after completing all wizard phases. Displays stats
 * (bound vs skipped), per-phase results with collapsible detail, and
 * a "Return to Bindings" button.
 */

import { useState } from 'react';
import type { WizardPhase } from '@vayu/shared';
import type { StepResult } from './WizardStep';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WizardSummaryProps {
  phases: WizardPhase[];
  results: Map<string, StepResult>;
  onFinish: () => void;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const ss = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    flex: 1,
    padding: 'var(--space-xl)',
    maxWidth: 640,
    margin: '0 auto',
    width: '100%',
    overflowY: 'auto' as const,
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.5rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.12em',
    color: 'var(--color-accent-bright)',
    textShadow: '0 0 30px rgba(78, 154, 62, 0.3)',
    marginBottom: 'var(--space-md)',
    textAlign: 'center' as const,
  },
  stats: {
    display: 'flex',
    gap: 'var(--space-xl)',
    marginBottom: 'var(--space-xl)',
  },
  statBox: {
    textAlign: 'center' as const,
  },
  statNumber: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.8rem',
    letterSpacing: '0.05em',
  },
  statLabel: {
    fontFamily: 'var(--font-body)',
    fontSize: '0.7rem',
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
  },
  phasesContainer: {
    width: '100%',
    marginBottom: 'var(--space-xl)',
  },
  phaseHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px var(--space-md)',
    background: 'rgba(78, 154, 62, 0.05)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
    marginBottom: 2,
    transition: 'background 0.15s',
  },
  phaseTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '0.7rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    color: 'var(--color-text-primary)',
  },
  phaseStat: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.7rem',
    color: 'var(--color-text-muted)',
  },
  actionList: {
    padding: '0 var(--space-md)',
    marginBottom: 'var(--space-sm)',
  },
  actionRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    padding: '4px 0',
    borderBottom: '1px solid rgba(30, 58, 46, 0.3)',
  },
  actionName: {
    fontFamily: 'var(--font-body)',
    fontSize: '0.72rem',
    color: 'var(--color-text-primary)',
  },
  actionResult: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.68rem',
  },
  btn: {
    padding: '10px 28px',
    fontFamily: 'var(--font-display)',
    fontSize: '0.75rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
    transition: 'all 0.15s',
    borderColor: 'var(--color-accent-bright)',
    color: 'var(--color-accent-bright)',
    background: 'var(--color-accent-dim)',
    border: '1px solid var(--color-accent-bright)',
  },
} as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function WizardSummary({ phases, results, onFinish }: WizardSummaryProps) {
  const [expandedPhase, setExpandedPhase] = useState<number | null>(null);

  // Compute stats
  let boundCount = 0;
  let skippedCount = 0;
  for (const result of results.values()) {
    if (result.status === 'bound') boundCount++;
    else skippedCount++;
  }

  const togglePhase = (idx: number) => {
    setExpandedPhase((prev) => (prev === idx ? null : idx));
  };

  return (
    <div style={ss.container}>
      <div style={ss.title}>Setup Complete</div>

      {/* Stats */}
      <div style={ss.stats}>
        <div style={ss.statBox}>
          <div style={{ ...ss.statNumber, color: 'var(--color-accent-bright)' }}>
            {boundCount}
          </div>
          <div style={ss.statLabel}>Bound</div>
        </div>
        <div style={ss.statBox}>
          <div style={{ ...ss.statNumber, color: 'var(--color-text-muted)' }}>
            {skippedCount}
          </div>
          <div style={ss.statLabel}>Skipped</div>
        </div>
      </div>

      {/* Per-phase results */}
      <div style={ss.phasesContainer}>
        {phases.map((phase, pi) => {
          const phBound = phase.actions.filter(
            (a) => results.get(a.action)?.status === 'bound',
          ).length;
          const isExpanded = expandedPhase === pi;

          return (
            <div key={pi}>
              <div
                style={{
                  ...ss.phaseHeader,
                  background: isExpanded ? 'rgba(78, 154, 62, 0.1)' : 'rgba(78, 154, 62, 0.05)',
                }}
                onClick={() => togglePhase(pi)}
              >
                <div style={ss.phaseTitle}>
                  {isExpanded ? '\u25BC' : '\u25B6'} {phase.title}
                </div>
                <div style={ss.phaseStat}>
                  {phBound}/{phase.actions.length} bound
                </div>
              </div>

              {isExpanded && (
                <div style={ss.actionList}>
                  {phase.actions.map((wa) => {
                    const result = results.get(wa.action);
                    let statusText: string;
                    let statusColor: string;

                    if (!result || result.status !== 'bound') {
                      statusText = 'Skipped';
                      statusColor = 'var(--color-text-muted)';
                    } else {
                      statusText = result.input
                        ? `${result.input.eliteKey} (${result.input.device})`
                        : 'Bound';
                      statusColor = 'var(--color-accent)';
                    }

                    return (
                      <div key={wa.action} style={ss.actionRow}>
                        <div style={ss.actionName}>{wa.label}</div>
                        <div style={{ ...ss.actionResult, color: statusColor }}>
                          {statusText}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Return button */}
      <button style={ss.btn} onClick={onFinish}>
        Return to Bindings
      </button>
    </div>
  );
}
