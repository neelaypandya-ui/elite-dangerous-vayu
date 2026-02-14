import { useGameStateStore } from '../../stores/gameStateStore';
import { useCovasStore } from '../../stores/covasStore';
import { useUIStore } from '../../stores/uiStore';

export default function TopBar() {
  const commander = useGameStateStore((s) => s.commander);
  const location = useGameStateStore((s) => s.location);
  const ship = useGameStateStore((s) => s.ship);
  const session = useGameStateStore((s) => s.session);
  const connected = useGameStateStore((s) => s.initialized);
  const covasEnabled = useCovasStore((s) => s.enabled);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  const formatCredits = (n: number) => {
    if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
    if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
    if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
    return n.toString();
  };

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <header style={{
      height: 44,
      background: 'var(--color-bg-secondary)',
      borderBottom: '1px solid var(--color-border)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 16px',
      gap: 24,
      fontFamily: 'var(--font-body)',
      fontSize: 13,
    }}>
      <button onClick={toggleSidebar} style={{
        background: 'none', border: 'none', color: 'var(--color-text-secondary)',
        cursor: 'pointer', fontSize: 18, padding: '0 4px', fontFamily: 'monospace',
      }}>
        &#9776;
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{
          width: 8, height: 8, borderRadius: '50%',
          background: connected ? 'var(--color-success)' : 'var(--color-danger)',
          display: 'inline-block',
        }} />
        <span style={{ color: 'var(--color-text-muted)' }}>
          {connected ? 'LIVE' : 'OFFLINE'}
        </span>
      </div>

      {commander.name && (
        <span style={{ color: 'var(--color-accent-bright)', fontFamily: 'var(--font-display)', fontSize: 12, letterSpacing: 1 }}>
          CMDR {commander.name}
        </span>
      )}

      {location.system && (
        <Chip label="SYS" value={location.system} />
      )}

      {location.station && (
        <Chip label="STN" value={location.station} />
      )}

      {ship.displayName && (
        <Chip label="SHIP" value={ship.name || ship.displayName} />
      )}

      <div style={{ flex: 1 }} />

      {commander.credits > 0 && (
        <Chip label="CR" value={formatCredits(commander.credits)} color="var(--color-warning)" />
      )}

      {session.elapsedSeconds > 0 && (
        <Chip label="SESSION" value={formatTime(session.elapsedSeconds)} />
      )}

      <span style={{
        fontSize: 10,
        color: covasEnabled ? 'var(--color-accent-bright)' : 'var(--color-text-muted)',
        fontFamily: 'var(--font-display)',
        letterSpacing: 1,
      }}>
        COVAS {covasEnabled ? 'ON' : 'OFF'}
      </span>
    </header>
  );
}

function Chip({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{ color: 'var(--color-text-muted)', fontSize: 10, fontFamily: 'var(--font-display)', letterSpacing: 1 }}>
        {label}
      </span>
      <span style={{ color: color || 'var(--color-text-primary)', fontSize: 13 }}>
        {value}
      </span>
    </span>
  );
}
