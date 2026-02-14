import { useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { useGameState } from '../hooks/useGameState';
import HoloPanel from '../components/common/HoloPanel';

function InfoTag({ children }: { children: string }) {
  return (
    <div style={{
      fontSize: 13, color: 'var(--color-text-muted)', fontStyle: 'italic',
      padding: '6px 0 10px', borderBottom: '1px solid var(--color-border)', marginBottom: 10,
    }}>
      {children}
    </div>
  );
}

export default function Dashboard() {
  const { data, loading, fetch: load } = useApi<any>('/dashboard/state');
  const gameState = useGameState();

  useEffect(() => { load(); const t = setInterval(load, 10000); return () => clearInterval(t); }, [load]);

  const state = data || gameState;
  if (!state && loading) return <div className="page"><p style={{ color: 'var(--color-text-muted)', fontSize: 16 }}>Loading dashboard...</p></div>;

  const cmdr = state?.commander;
  const ship = state?.ship;
  const loc = state?.location;
  const session = state?.session;

  return (
    <div className="page">
      <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-accent-bright)', letterSpacing: 3, marginBottom: 8, fontSize: 28 }}>DASHBOARD</h1>
      <p style={{ color: 'var(--color-text-muted)', fontSize: 15, marginBottom: 24 }}>
        Real-time overview of your Elite Dangerous session. Data refreshes every 10 seconds from your journal files.
      </p>

      <div className="grid-3" style={{ gap: 20 }}>
        <HoloPanel title="Commander">
          <InfoTag>Your pilot identity, credit balance, and current game mode. Pulled from the most recent LoadGame and Commander journal events.</InfoTag>
          {cmdr ? (
            <div style={{ fontSize: 15, lineHeight: 2 }}>
              <div><span style={{ color: 'var(--color-text-muted)' }}>CMDR</span> <strong style={{ color: 'var(--color-accent-bright)', fontSize: 18 }}>{cmdr.name}</strong></div>
              <div><span style={{ color: 'var(--color-text-muted)' }}>Credits:</span> <span style={{ fontSize: 17 }}>{(cmdr.credits || 0).toLocaleString()} CR</span></div>
              <div><span style={{ color: 'var(--color-text-muted)' }}>Mode:</span> {cmdr.gameMode}</div>
            </div>
          ) : <p style={{ color: 'var(--color-text-muted)', fontSize: 15 }}>No commander data — launch Elite Dangerous to populate.</p>}
        </HoloPanel>

        <HoloPanel title="Ship Status">
          <InfoTag>Current ship name, hull integrity, fuel level, and cargo capacity. Updates when you dock, refuel, or take damage.</InfoTag>
          {ship ? (
            <div style={{ fontSize: 15, lineHeight: 2 }}>
              <div><strong style={{ color: 'var(--color-accent-bright)', fontSize: 18 }}>{ship.shipName || ship.ship}</strong></div>
              <div><span style={{ color: 'var(--color-text-muted)' }}>Hull:</span> {ship.hullHealth != null ? `${(ship.hullHealth * 100).toFixed(0)}%` : '?'}</div>
              <div><span style={{ color: 'var(--color-text-muted)' }}>Fuel:</span> {ship.fuel ? `${ship.fuel.main?.toFixed(1)} / ${ship.fuel.mainCapacity}t` : '?'}</div>
              <div><span style={{ color: 'var(--color-text-muted)' }}>Cargo:</span> {ship.cargoCount ?? 0} / {ship.cargoCapacity ?? 0}t</div>
            </div>
          ) : <p style={{ color: 'var(--color-text-muted)', fontSize: 15 }}>No ship data — board your ship to populate.</p>}
        </HoloPanel>

        <HoloPanel title="Location">
          <InfoTag>Your current star system, station (if docked), flight status, and security level. Tracks FSDJump and Docked events.</InfoTag>
          {loc ? (
            <div style={{ fontSize: 15, lineHeight: 2 }}>
              <div><strong style={{ color: 'var(--color-accent-bright)', fontSize: 18 }}>{loc.system}</strong></div>
              {loc.station && <div><span style={{ color: 'var(--color-text-muted)' }}>Station:</span> {loc.station}</div>}
              <div><span style={{ color: 'var(--color-text-muted)' }}>Status:</span> {loc.docked ? 'Docked' : loc.supercruise ? 'Supercruise' : loc.landed ? 'Landed' : 'In Space'}</div>
              <div><span style={{ color: 'var(--color-text-muted)' }}>Security:</span> {loc.systemSecurity || 'Unknown'}</div>
            </div>
          ) : <p style={{ color: 'var(--color-text-muted)', fontSize: 15 }}>No location data — enter a system to populate.</p>}
        </HoloPanel>
      </div>

      {session && (
        <div style={{ marginTop: 24 }}>
          <HoloPanel title="Session Statistics">
            <InfoTag>Cumulative stats for your current play session. Resets each time Elite Dangerous starts a new journal file. Tracks jumps, distance, scans, missions, bounties, and credit flow.</InfoTag>
            <div className="grid-4" style={{ gap: 16 }}>
              {[
                ['Jumps', session.jumps, 'Total FSD jumps this session'],
                ['Distance', `${(session.totalDistance || 0).toFixed(1)} LY`, 'Light-years traveled'],
                ['Bodies Scanned', session.bodiesScanned, 'Planets and stars scanned'],
                ['Missions', session.missionsCompleted, 'Missions completed'],
                ['Bounties', session.bountiesCollected, 'Bounty vouchers redeemed'],
                ['Credits Earned', (session.creditsEarned || 0).toLocaleString(), 'Total income this session'],
                ['Credits Spent', (session.creditsSpent || 0).toLocaleString(), 'Total expenditure'],
                ['Deaths', session.deaths, 'Ship destructions'],
              ].map(([label, value, tooltip]) => (
                <div key={label as string} style={{ textAlign: 'center', padding: 8 }} title={tooltip as string}>
                  <div style={{ fontSize: 24, fontFamily: 'var(--font-display)', color: 'var(--color-accent-bright)' }}>{value}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)', letterSpacing: 1, textTransform: 'uppercase', marginTop: 4 }}>{label}</div>
                </div>
              ))}
            </div>
          </HoloPanel>
        </div>
      )}
    </div>
  );
}
