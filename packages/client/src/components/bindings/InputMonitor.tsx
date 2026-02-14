/**
 * @vayu/client -- Input Monitor Panel
 *
 * Live input visualization panel displayed on the Bindings page.
 * Shows connected gamepad devices, active button presses with their
 * bound actions, and real-time axis gauge bars.
 */

import { useEffect, useRef, useState } from 'react';
import type { ConnectedDevice, InputStates } from '../../hooks/useGamepad';
import type { GamepadInput } from '../../utils/gamepad-mapping';
import { axisIndexToEliteKey, axisLabel } from '../../utils/gamepad-mapping';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface InputMonitorProps {
  /** Connected gamepad devices. */
  devices: ConnectedDevice[];
  /** Active button presses (reactive). */
  activeButtons: GamepadInput[];
  /** Ref to current input states (axes, buttons -- updated every frame). */
  inputStatesRef: React.RefObject<InputStates>;
  /** Look up what action is bound to a device+key combo. */
  findAction: (device: string, key: string) => string;
  /** Whether to show raw indices alongside Elite names. */
  discoveryMode?: boolean;
  /** Toggle discovery mode. */
  onToggleDiscovery?: () => void;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const ms = {
  container: {
    background: 'var(--color-bg-panel)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    padding: 'var(--space-md)',
    marginBottom: 'var(--space-lg)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 'var(--space-md)',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: '0.8rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.12em',
    color: 'var(--color-accent)',
    paddingBottom: 'var(--space-sm)',
    borderBottom: '1px solid var(--color-border)',
    flex: 1,
  },
  toggleBtn: {
    padding: '3px 8px',
    fontFamily: 'var(--font-display)',
    fontSize: '0.6rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)',
    background: 'transparent',
    color: 'var(--color-text-secondary)',
    cursor: 'pointer',
    marginLeft: 'var(--space-md)',
  },
  devicesRow: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 'var(--space-sm)',
    marginBottom: 'var(--space-md)',
  },
  deviceChip: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 10px',
    background: 'rgba(10, 14, 20, 0.85)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.72rem',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    flexShrink: 0,
  },
  section: {
    marginBottom: 'var(--space-md)',
  },
  sectionLabel: {
    fontSize: '0.55rem',
    fontFamily: "'Orbitron', sans-serif",
    color: 'rgba(78,154,62,0.5)',
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    marginBottom: 6,
  },
  pillsContainer: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 6,
    minHeight: 28,
  },
  pill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '3px 10px',
    borderRadius: 12,
    fontFamily: 'var(--font-mono)',
    fontSize: '0.7rem',
    animation: 'pulse 0.6s ease-in-out infinite alternate',
  },
  pillKey: {
    color: '#fff',
    fontWeight: 600,
  },
  pillAction: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: '0.6rem',
  },
  axisRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  axisName: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.65rem',
    color: 'var(--color-text-secondary)',
    width: 80,
    flexShrink: 0,
    textAlign: 'right' as const,
  },
  axisBar: {
    flex: 1,
    height: 12,
    background: 'rgba(30, 58, 46, 0.3)',
    borderRadius: 3,
    position: 'relative' as const,
    overflow: 'hidden',
  },
  axisCenter: {
    position: 'absolute' as const,
    left: '50%',
    top: 0,
    bottom: 0,
    width: 1,
    background: 'rgba(78, 154, 62, 0.3)',
  },
  axisFill: {
    position: 'absolute' as const,
    top: 1,
    bottom: 1,
    borderRadius: 2,
    transition: 'left 0.05s, width 0.05s',
  },
  axisValue: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.6rem',
    color: 'var(--color-text-muted)',
    width: 45,
    textAlign: 'right' as const,
  },
  axisAction: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.58rem',
    color: 'var(--color-text-muted)',
    width: 120,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  noDevices: {
    fontFamily: 'var(--font-body)',
    fontSize: '0.8rem',
    color: 'var(--color-text-muted)',
    textAlign: 'center' as const,
    padding: 'var(--space-md)',
  },
} as const;

// ---------------------------------------------------------------------------
// Axis Gauges (animated via rAF, not React state)
// ---------------------------------------------------------------------------

function AxisGauges({ device, inputStatesRef, findAction, discoveryMode }: {
  device: ConnectedDevice;
  inputStatesRef: React.RefObject<InputStates>;
  findAction: (device: string, key: string) => string;
  discoveryMode: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let rafId: number;

    const update = () => {
      const container = containerRef.current;
      if (!container) {
        rafId = requestAnimationFrame(update);
        return;
      }

      const axes = inputStatesRef.current?.axes.get(device.index);
      if (!axes) {
        rafId = requestAnimationFrame(update);
        return;
      }

      const fills = container.querySelectorAll<HTMLElement>('[data-axis-fill]');
      const values = container.querySelectorAll<HTMLElement>('[data-axis-value]');

      for (let i = 0; i < axes.length && i < fills.length; i++) {
        const value = axes[i];
        const fill = fills[i];
        const valueEl = values[i];

        // Calculate fill position (center = 50%)
        if (value >= 0) {
          fill.style.left = '50%';
          fill.style.width = `${Math.abs(value) * 50}%`;
          fill.style.background = '#4e9a3e';
        } else {
          fill.style.left = `${50 - Math.abs(value) * 50}%`;
          fill.style.width = `${Math.abs(value) * 50}%`;
          fill.style.background = '#4e9ad0';
        }

        if (valueEl) {
          valueEl.textContent = value.toFixed(2);
        }
      }

      rafId = requestAnimationFrame(update);
    };

    rafId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(rafId);
  }, [device.index, inputStatesRef]);

  const axisCount = device.axisCount;
  const axisElements = [];

  for (let i = 0; i < axisCount; i++) {
    const eliteKey = axisIndexToEliteKey(i, device.mapping);
    const label = axisLabel(i, device.mapping);
    const boundAction = findAction(device.eliteDevice, eliteKey);

    axisElements.push(
      <div key={i} style={ms.axisRow}>
        <div style={ms.axisName}>
          {discoveryMode ? `[${i}] ` : ''}{label}
        </div>
        <div style={ms.axisBar}>
          <div style={ms.axisCenter} />
          <div data-axis-fill style={ms.axisFill} />
        </div>
        <div data-axis-value style={ms.axisValue}>0.00</div>
        <div style={ms.axisAction}>
          {boundAction !== '--' ? boundAction : ''}
        </div>
      </div>,
    );
  }

  return <div ref={containerRef}>{axisElements}</div>;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function InputMonitor({
  devices,
  activeButtons,
  inputStatesRef,
  findAction,
  discoveryMode = false,
  onToggleDiscovery,
}: InputMonitorProps) {
  const deviceColors: Record<string, string> = {
    ThrustMasterWarthogThrottle: '#ff8c00',
    GamePad: '#4e9ad0',
  };

  return (
    <div style={ms.container}>
      <div style={ms.header}>
        <div style={ms.title}>
          Input Monitor
        </div>
        {onToggleDiscovery && (
          <button
            style={{
              ...ms.toggleBtn,
              ...(discoveryMode
                ? { borderColor: 'var(--color-accent-bright)', color: 'var(--color-accent-bright)' }
                : {}),
            }}
            onClick={onToggleDiscovery}
          >
            {discoveryMode ? 'Discovery ON' : 'Discovery'}
          </button>
        )}
      </div>

      {/* Connected Devices */}
      {devices.length === 0 ? (
        <div style={ms.noDevices}>
          No gamepad devices detected. Connect a HOTAS device and press a button.
        </div>
      ) : (
        <>
          <div style={ms.devicesRow}>
            {devices.map((dev) => {
              const color = deviceColors[dev.eliteDevice] ?? '#6fcf5c';
              return (
                <div key={dev.index} style={{
                  ...ms.deviceChip,
                  borderColor: `${color}40`,
                }}>
                  <div style={{
                    ...ms.statusDot,
                    background: color,
                    boxShadow: `0 0 6px ${color}80`,
                  }} />
                  <span style={{ color }}>{dev.label}</span>
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '0.6rem' }}>
                    {dev.buttonCount}b / {dev.axisCount}a
                  </span>
                </div>
              );
            })}
          </div>

          {/* Active Inputs */}
          <div style={ms.section}>
            <div style={ms.sectionLabel}>Active Inputs</div>
            <div style={ms.pillsContainer}>
              {activeButtons.length === 0 && (
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.65rem',
                  color: 'var(--color-text-muted)',
                  padding: '3px 8px',
                }}>
                  Press a button on your device...
                </span>
              )}
              {activeButtons.map((input) => {
                const color = deviceColors[input.device] ?? '#6fcf5c';
                const boundAction = findAction(input.device, input.eliteKey);
                return (
                  <div
                    key={`${input.device}-${input.index}`}
                    style={{
                      ...ms.pill,
                      background: `${color}30`,
                      border: `1px solid ${color}60`,
                    }}
                  >
                    <span style={ms.pillKey}>
                      {discoveryMode ? `[${input.index}] ` : ''}
                      {input.eliteKey}
                    </span>
                    {boundAction !== '--' && (
                      <span style={ms.pillAction}>{boundAction}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Axis Gauges */}
          {devices.map((dev) => (
            <div key={dev.index} style={ms.section}>
              <div style={ms.sectionLabel}>{dev.label} Axes</div>
              <AxisGauges
                device={dev}
                inputStatesRef={inputStatesRef}
                findAction={findAction}
                discoveryMode={discoveryMode}
              />
            </div>
          ))}
        </>
      )}

      {/* Pulse animation */}
      <style>{`
        @keyframes pulse {
          from { opacity: 0.8; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
