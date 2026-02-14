/**
 * @vayu/client — Briefing Page
 *
 * The "Where Was I?" session briefing dashboard. Fetches a comprehensive
 * recap from the server and displays it with the Elite Dangerous cockpit
 * aesthetic: dark backgrounds, forest-green accents, Orbitron headings,
 * Share Tech Mono body text, subtle glow effects and scanline animations.
 *
 * Sections:
 *   1. Narrative card   — prominent "welcome back" paragraph
 *   2. Commander info   — name, credits, ranks
 *   3. Current location — system, station, docked status
 *   4. Ship status      — type, fuel, hull, cargo
 *   5. Active missions  — list with expiry warnings
 *   6. Recent highlights — timeline of notable events
 */

import { useEffect, useState, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Types (mirrors server BriefingData)
// ---------------------------------------------------------------------------

interface BriefingData {
  lastSession: {
    date: string;
    duration: string;
    system: string;
    station: string | null;
    ship: string;
    shipName: string | null;
  };
  commander: {
    name: string;
    credits: number;
    combatRank: string;
    tradeRank: string;
    explorationRank: string;
  };
  currentLocation: {
    system: string;
    body: string | null;
    station: string | null;
    docked: boolean;
    coordinates: [number, number, number] | null;
  };
  activeMissions: {
    name: string;
    destination: string;
    reward: number;
    expiry: string | null;
  }[];
  recentHighlights: {
    event: string;
    summary: string;
    timestamp: string;
  }[];
  shipStatus: {
    type: string;
    name: string | null;
    fuelLevel: number;
    fuelCapacity: number;
    hullHealth: number;
    cargoUsed: number;
    cargoCapacity: number;
  };
  sessionsSinceLastPlay: number;
  daysSinceLastPlay: number;
  narrative: string;
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

function formatCredits(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toFixed(2)}B CR`;
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(2)}M CR`;
  if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(1)}K CR`;
  return `${sign}${abs} CR`;
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const day = d.getDate();
  let hours = d.getHours();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  const mins = d.getMinutes().toString().padStart(2, '0');
  return `${month} ${day} ${hours}:${mins} ${ampm}`;
}

function timeAgo(iso: string): string {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  if (diffMs < 60000) return 'just now';
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function isExpiringSoon(expiry: string | null): boolean {
  if (!expiry) return false;
  return new Date(expiry).getTime() - Date.now() < 24 * 60 * 60 * 1000;
}

// ---------------------------------------------------------------------------
// Inline styles (uses CSS custom properties from globals.css)
// ---------------------------------------------------------------------------

const styles = {
  page: {
    height: '100%',
    width: '100%',
    padding: 'var(--space-xl)',
    overflowY: 'auto' as const,
    overflowX: 'hidden' as const,
  },

  header: {
    marginBottom: 'var(--space-lg)',
  },

  title: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.75rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    color: 'var(--color-accent-bright)',
    textShadow: '0 0 20px rgba(78, 154, 62, 0.3)',
    margin: 0,
  },

  subtitle: {
    fontFamily: 'var(--font-body)',
    color: 'var(--color-text-muted)',
    fontSize: '0.85rem',
    marginTop: 'var(--space-xs)',
  },

  // Narrative card
  narrativeCard: {
    background: 'linear-gradient(135deg, var(--color-bg-panel) 0%, rgba(30, 58, 46, 0.15) 100%)',
    border: '1px solid var(--color-border-bright)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-lg)',
    marginBottom: 'var(--space-xl)',
    position: 'relative' as const,
    overflow: 'hidden',
  },

  narrativeGlow: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    height: '2px',
    background: 'linear-gradient(90deg, transparent, var(--color-accent-bright), transparent)',
  },

  narrativeText: {
    fontFamily: 'var(--font-body)',
    fontSize: '1rem',
    lineHeight: 1.8,
    color: 'var(--color-text-primary)',
    letterSpacing: '0.02em',
  },

  narrativeLabel: {
    fontFamily: 'var(--font-display)',
    fontSize: '0.7rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.15em',
    color: 'var(--color-accent)',
    marginBottom: 'var(--space-sm)',
  },

  // Grid layout
  gridContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: 'var(--space-md)',
    marginBottom: 'var(--space-xl)',
  },

  // Panel
  panel: {
    background: 'var(--color-bg-panel)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    padding: 'var(--space-md)',
  },

  panelHeader: {
    fontFamily: 'var(--font-display)',
    fontSize: '0.8rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.12em',
    color: 'var(--color-accent)',
    paddingBottom: 'var(--space-sm)',
    marginBottom: 'var(--space-md)',
    borderBottom: '1px solid var(--color-border)',
  },

  // Data row
  dataRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 'var(--space-xs) 0',
  },

  dataLabel: {
    fontFamily: 'var(--font-body)',
    fontSize: '0.85rem',
    color: 'var(--color-text-secondary)',
  },

  dataValue: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.85rem',
    color: 'var(--color-text-primary)',
    textAlign: 'right' as const,
  },

  dataValueAccent: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.85rem',
    color: 'var(--color-accent-bright)',
    textAlign: 'right' as const,
  },

  // Progress bar
  progressBarOuter: {
    height: '6px',
    background: 'var(--color-bg-secondary)',
    borderRadius: '3px',
    overflow: 'hidden',
    marginTop: 'var(--space-xs)',
    width: '100%',
  },

  // Mission list
  missionItem: {
    padding: 'var(--space-sm) 0',
    borderBottom: '1px solid rgba(30, 58, 46, 0.3)',
  },

  missionName: {
    fontFamily: 'var(--font-body)',
    fontSize: '0.85rem',
    color: 'var(--color-text-primary)',
    marginBottom: '2px',
  },

  missionMeta: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.75rem',
    color: 'var(--color-text-muted)',
    display: 'flex',
    gap: 'var(--space-md)',
    flexWrap: 'wrap' as const,
  },

  // Timeline
  timelineItem: {
    display: 'flex',
    gap: 'var(--space-md)',
    padding: 'var(--space-sm) 0',
    borderBottom: '1px solid rgba(30, 58, 46, 0.2)',
  },

  timelineDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: 'var(--color-accent)',
    marginTop: '6px',
    flexShrink: 0,
    boxShadow: '0 0 6px rgba(78, 154, 62, 0.4)',
  },

  timelineContent: {
    flex: 1,
    minWidth: 0,
  },

  timelineSummary: {
    fontFamily: 'var(--font-body)',
    fontSize: '0.85rem',
    color: 'var(--color-text-primary)',
  },

  timelineTime: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.7rem',
    color: 'var(--color-text-muted)',
    marginTop: '2px',
  },

  // Badge
  badge: {
    display: 'inline-block',
    padding: '2px 8px',
    fontFamily: 'var(--font-display)',
    fontSize: '0.6rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid',
  },

  badgeSuccess: {
    borderColor: 'var(--color-success)',
    color: 'var(--color-success)',
  },

  badgeWarning: {
    borderColor: 'var(--color-warning)',
    color: 'var(--color-warning)',
  },

  badgeDanger: {
    borderColor: 'var(--color-danger)',
    color: 'var(--color-danger)',
  },

  // Loading / Error states
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: 'var(--space-md)',
  },

  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid var(--color-border)',
    borderTop: '3px solid var(--color-accent-bright)',
    borderRadius: '50%',
    animation: 'spin 1.2s linear infinite',
  },

  loadingText: {
    fontFamily: 'var(--font-display)',
    fontSize: '0.85rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
    color: 'var(--color-text-secondary)',
  },

  errorContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: 'var(--space-md)',
  },

  errorText: {
    fontFamily: 'var(--font-body)',
    fontSize: '1rem',
    color: 'var(--color-danger)',
    textAlign: 'center' as const,
  },

  retryBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--space-sm)',
    padding: 'var(--space-sm) var(--space-md)',
    fontFamily: 'var(--font-display)',
    fontSize: '0.75rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    border: '1px solid var(--color-accent)',
    borderRadius: 'var(--radius-sm)',
    background: 'transparent',
    color: 'var(--color-accent-bright)',
    cursor: 'pointer',
  },
} as const;

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ProgressBar({ value, max, color }: { value: number; max: number; color?: string }) {
  const percent = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const barColor = color || (percent > 50 ? 'var(--color-accent)' : percent > 25 ? 'var(--color-warning)' : 'var(--color-danger)');

  return (
    <div style={styles.progressBarOuter}>
      <div
        style={{
          height: '100%',
          width: `${percent}%`,
          background: barColor,
          borderRadius: '3px',
          transition: 'width 0.6s ease',
          boxShadow: `0 0 6px ${barColor}`,
        }}
      />
    </div>
  );
}

function DataRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={styles.dataRow}>
      <span style={styles.dataLabel}>{label}</span>
      <span style={accent ? styles.dataValueAccent : styles.dataValue}>{value}</span>
    </div>
  );
}

function Badge({ text, variant }: { text: string; variant: 'success' | 'warning' | 'danger' }) {
  const variantStyle = variant === 'success'
    ? styles.badgeSuccess
    : variant === 'warning'
      ? styles.badgeWarning
      : styles.badgeDanger;
  return (
    <span style={{ ...styles.badge, ...variantStyle }}>{text}</span>
  );
}

// ---------------------------------------------------------------------------
// Section components
// ---------------------------------------------------------------------------

function NarrativeSection({ narrative, daysSince }: { narrative: string; daysSince: number }) {
  return (
    <div style={styles.narrativeCard} className="animate-fade-in-scale">
      <div style={styles.narrativeGlow} />
      <div style={styles.narrativeLabel}>
        {daysSince > 0 ? `Session Briefing -- ${daysSince} day${daysSince !== 1 ? 's' : ''} since last session` : 'Session Briefing'}
      </div>
      <div style={styles.narrativeText}>{narrative}</div>
    </div>
  );
}

function CommanderPanel({ commander }: { commander: BriefingData['commander'] }) {
  return (
    <div style={styles.panel} className="animate-slide-up">
      <div style={styles.panelHeader}>Commander</div>
      <DataRow label="Name" value={commander.name} accent />
      <DataRow label="Credits" value={formatCredits(commander.credits)} />
      <DataRow label="Combat" value={commander.combatRank} />
      <DataRow label="Trade" value={commander.tradeRank} />
      <DataRow label="Exploration" value={commander.explorationRank} />
    </div>
  );
}

function LocationPanel({ location }: { location: BriefingData['currentLocation'] }) {
  return (
    <div style={styles.panel} className="animate-slide-up">
      <div style={styles.panelHeader}>Location</div>
      <DataRow label="System" value={location.system} accent />
      {location.body && <DataRow label="Body" value={location.body} />}
      {location.station && <DataRow label="Station" value={location.station} />}
      <DataRow
        label="Status"
        value={location.docked ? 'Docked' : 'In Flight'}
      />
      {location.docked ? (
        <Badge text="Docked" variant="success" />
      ) : null}
      {location.coordinates && (
        <div style={{ ...styles.dataLabel, marginTop: 'var(--space-sm)', fontSize: '0.75rem' }}>
          [{location.coordinates[0].toFixed(1)}, {location.coordinates[1].toFixed(1)}, {location.coordinates[2].toFixed(1)}]
        </div>
      )}
    </div>
  );
}

function ShipPanel({ ship }: { ship: BriefingData['shipStatus'] }) {
  const fuelPercent = ship.fuelCapacity > 0 ? (ship.fuelLevel / ship.fuelCapacity) * 100 : 0;
  const hullPercent = ship.hullHealth * 100;

  return (
    <div style={styles.panel} className="animate-slide-up">
      <div style={styles.panelHeader}>Ship Status</div>
      <DataRow label="Type" value={ship.type} accent />
      {ship.name && <DataRow label="Name" value={ship.name} />}
      <DataRow label="Fuel" value={`${fuelPercent.toFixed(0)}%`} />
      <ProgressBar value={ship.fuelLevel} max={ship.fuelCapacity} />
      <div style={{ height: 'var(--space-sm)' }} />
      <DataRow label="Hull" value={`${hullPercent.toFixed(0)}%`} />
      <ProgressBar value={ship.hullHealth} max={1} />
      <div style={{ height: 'var(--space-sm)' }} />
      <DataRow label="Cargo" value={`${ship.cargoUsed} / ${ship.cargoCapacity}t`} />
      {fuelPercent < 25 && <Badge text="Low Fuel" variant="danger" />}
      {hullPercent < 50 && <Badge text="Hull Damage" variant="danger" />}
    </div>
  );
}

function LastSessionPanel({ session }: { session: BriefingData['lastSession'] }) {
  return (
    <div style={styles.panel} className="animate-slide-up">
      <div style={styles.panelHeader}>Last Session</div>
      <DataRow label="Date" value={formatTimestamp(session.date)} />
      <DataRow label="Duration" value={session.duration} />
      <DataRow label="System" value={session.system} accent />
      {session.station && <DataRow label="Station" value={session.station} />}
      <DataRow label="Ship" value={session.ship} />
      {session.shipName && <DataRow label="Ship Name" value={session.shipName} />}
    </div>
  );
}

function MissionsPanel({ missions }: { missions: BriefingData['activeMissions'] }) {
  if (missions.length === 0) {
    return (
      <div style={styles.panel} className="animate-slide-up">
        <div style={styles.panelHeader}>Active Missions</div>
        <div style={{ ...styles.dataLabel, textAlign: 'center', padding: 'var(--space-md)' }}>
          No active missions
        </div>
      </div>
    );
  }

  return (
    <div style={styles.panel} className="animate-slide-up">
      <div style={styles.panelHeader}>Active Missions ({missions.length})</div>
      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
        {missions.map((m, i) => (
          <div key={i} style={styles.missionItem}>
            <div style={styles.missionName}>
              {m.name}
              {isExpiringSoon(m.expiry) && (
                <span style={{ marginLeft: 'var(--space-sm)' }}>
                  <Badge text="Expiring" variant="warning" />
                </span>
              )}
            </div>
            <div style={styles.missionMeta}>
              <span>{m.destination}</span>
              {m.reward > 0 && <span>{formatCredits(m.reward)}</span>}
              {m.expiry && <span>{timeAgo(m.expiry).replace(' ago', ' left')}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HighlightsPanel({ highlights }: { highlights: BriefingData['recentHighlights'] }) {
  if (highlights.length === 0) {
    return (
      <div style={styles.panel} className="animate-slide-up">
        <div style={styles.panelHeader}>Recent Highlights</div>
        <div style={{ ...styles.dataLabel, textAlign: 'center', padding: 'var(--space-md)' }}>
          No recent highlights
        </div>
      </div>
    );
  }

  return (
    <div style={styles.panel} className="animate-slide-up">
      <div style={styles.panelHeader}>Recent Highlights</div>
      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {highlights.map((h, i) => (
          <div key={i} style={styles.timelineItem}>
            <div
              style={{
                ...styles.timelineDot,
                background: getEventColor(h.event),
                boxShadow: `0 0 6px ${getEventColor(h.event)}`,
              }}
            />
            <div style={styles.timelineContent}>
              <div style={styles.timelineSummary}>{h.summary}</div>
              <div style={styles.timelineTime}>
                {formatTimestamp(h.timestamp)} -- {timeAgo(h.timestamp)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Map event types to colours for the timeline dots.
 */
function getEventColor(event: string): string {
  switch (event) {
    case 'Died':
    case 'Resurrect':
      return 'var(--color-danger)';
    case 'Promotion':
    case 'MissionCompleted':
    case 'CommunityGoal':
      return 'var(--color-accent-bright)';
    case 'Bounty':
      return 'var(--color-warning)';
    case 'Scan':
    case 'SAAScanComplete':
    case 'MultiSellExplorationData':
    case 'SellExplorationData':
    case 'FSSAllBodiesFound':
    case 'CodexEntry':
      return 'var(--color-info)';
    case 'Docked':
    case 'FSDJump':
      return 'var(--color-accent)';
    case 'EngineerCraft':
      return '#b080ff';
    case 'MarketSell':
      return '#ffcc00';
    default:
      return 'var(--color-accent)';
  }
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function Briefing() {
  const [briefing, setBriefing] = useState<BriefingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBriefing = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/dashboard/briefing');
      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || 'Unknown error');
      }
      setBriefing(json.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load briefing';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBriefing();
  }, [fetchBriefing]);

  // Loading state
  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <div style={styles.loadingText}>Generating Briefing...</div>
      </div>
    );
  }

  // Error state
  if (error || !briefing) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorText}>
          {error || 'Failed to load briefing data'}
        </div>
        <button style={styles.retryBtn} onClick={fetchBriefing}>
          Retry
        </button>
      </div>
    );
  }

  // Success state
  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Briefing</h1>
        <div style={styles.subtitle}>
          Session intelligence report -- {briefing.sessionsSinceLastPlay} session{briefing.sessionsSinceLastPlay !== 1 ? 's' : ''} in the last 30 days
        </div>
      </div>

      {/* Narrative */}
      <NarrativeSection
        narrative={briefing.narrative}
        daysSince={briefing.daysSinceLastPlay}
      />

      {/* Info grid: Commander, Location, Ship, Last Session */}
      <div style={styles.gridContainer}>
        <CommanderPanel commander={briefing.commander} />
        <LocationPanel location={briefing.currentLocation} />
        <ShipPanel ship={briefing.shipStatus} />
        <LastSessionPanel session={briefing.lastSession} />
      </div>

      {/* Missions and Highlights in a two-column layout */}
      <div style={{ ...styles.gridContainer, gridTemplateColumns: '1fr 1fr' }}>
        <MissionsPanel missions={briefing.activeMissions} />
        <HighlightsPanel highlights={briefing.recentHighlights} />
      </div>
    </div>
  );
}
