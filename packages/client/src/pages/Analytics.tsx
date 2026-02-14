import { useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { useGameState } from '../hooks/useGameState';
import HoloPanel from '../components/common/HoloPanel';
import HoloProgress from '../components/common/HoloProgress';
import HoloTable from '../components/common/HoloTable';

function formatElapsed(seconds: number): string {
  if (!seconds) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

interface SessionSnapshot {
  timestamp: string;
  jumps: number;
  distance: number;
  creditsEarned: number;
  creditsSpent: number;
  bodiesScanned: number;
  bountiesCollected: number;
  missionsCompleted: number;
  deaths: number;
  miningRefined: number;
  tradeProfit: number;
  explorationEarnings: number;
  elapsedMinutes: number;
}

export default function Analytics() {
  const { data, loading, fetch: load } = useApi<any>('/analytics');
  const { data: snapshots, fetch: loadSnapshots } = useApi<SessionSnapshot[]>('/analytics/snapshots');
  const gameState = useGameState();

  useEffect(() => {
    load(); loadSnapshots();
    const t = setInterval(() => { load(); loadSnapshots(); }, 30000);
    return () => clearInterval(t);
  }, [load, loadSnapshots]);

  const session = data?.session;
  const rates = data?.rates;
  const chartData: SessionSnapshot[] = snapshots || data?.chartData || [];

  // Build earnings breakdown from session data
  const earnings: Record<string, number> = {};
  if (session) {
    if (session.tradeProfit) earnings['Trade'] = session.tradeProfit;
    if (session.explorationEarnings) earnings['Exploration'] = session.explorationEarnings;
    if (session.bountyEarnings) earnings['Bounties'] = session.bountyEarnings;
    // Approximate other earnings
    const accounted = (session.tradeProfit || 0) + (session.explorationEarnings || 0) + (session.bountyEarnings || 0);
    const other = (session.creditsEarned || 0) - accounted;
    if (other > 0) earnings['Other'] = other;
  }
  const maxEarning = Math.max(...Object.values(earnings), 1);

  // Most recent 15 snapshots for the activity timeline
  const recentSnapshots = [...chartData].reverse().slice(0, 15);

  return (
    <div className="page">
      <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-accent-bright)', letterSpacing: 3, marginBottom: 8, fontSize: 28 }}>ANALYTICS</h1>
      <p style={{ color: 'var(--color-text-muted)', fontSize: 15, marginBottom: 24 }}>
        Session performance analytics with earnings breakdown, per-hour rates, and historical snapshots taken every 5 minutes.
      </p>
      {loading && !data && <p style={{ color: 'var(--color-text-muted)', fontSize: 15 }}>Loading analytics...</p>}

      {data && (
        <>
          {/* Top-level session stats */}
          <div className="grid-4" style={{ gap: 16, marginBottom: 20 }}>
            {[
              ['Duration', formatElapsed(session?.elapsedSeconds || 0), 'var(--color-accent-bright)'],
              ['Net Profit', `${((session?.netProfit || 0) / 1e6).toFixed(1)}M`, session?.netProfit >= 0 ? '#4E9A3E' : '#ff4444'],
              ['Jumps', session?.jumps || 0, '#4488cc'],
              ['Distance', `${(session?.totalDistance || 0).toFixed(1)} LY`, '#ffaa00'],
            ].map(([l, v, c]) => (
              <HoloPanel key={l as string}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontFamily: 'var(--font-display)', color: c as string }}>{v}</div>
                  <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>{l as string}</div>
                </div>
              </HoloPanel>
            ))}
          </div>

          {/* Per-Hour Rates */}
          {rates && (
            <div className="grid-3" style={{ gap: 16, marginBottom: 20 }}>
              {[
                ['Credits/Hour', rates.creditsPerHour != null ? `${(rates.creditsPerHour / 1e6).toFixed(1)}M` : '--', rates.creditsPerHour >= 0 ? '#4E9A3E' : '#ff4444'],
                ['Jumps/Hour', rates.jumpsPerHour ?? '--', '#4488cc'],
                ['Scans/Hour', rates.scansPerHour ?? '--', '#ffaa00'],
              ].map(([l, v, c]) => (
                <HoloPanel key={l as string}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontFamily: 'var(--font-display)', color: c as string }}>{v}</div>
                    <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>{l as string}</div>
                  </div>
                </HoloPanel>
              ))}
            </div>
          )}

          <div className="grid-2" style={{ gap: 20, marginBottom: 20 }}>
            {/* Earnings Breakdown */}
            <HoloPanel title="Earnings Breakdown">
              <div style={{ fontSize: 13, color: 'var(--color-text-muted)', fontStyle: 'italic', padding: '4px 0 12px', borderBottom: '1px solid var(--color-border)', marginBottom: 10 }}>
                How your credits were earned this session, broken down by activity type.
              </div>
              {Object.keys(earnings).length > 0 ? Object.entries(earnings)
                .sort(([, a], [, b]) => b - a)
                .map(([k, v]) => (
                <div key={k} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>{k}</span>
                    <span style={{ color: 'var(--color-accent-bright)' }}>{v.toLocaleString()} CR</span>
                  </div>
                  <HoloProgress value={v} max={maxEarning} showPercent={false} color="var(--color-accent)" />
                </div>
              )) : <p style={{ color: 'var(--color-text-muted)', fontSize: 13, textAlign: 'center', padding: 16 }}>No earnings recorded yet.</p>}

              {/* Total summary */}
              {session && (
                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 10, marginTop: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Total Earned</span>
                    <span style={{ color: '#4E9A3E', fontFamily: 'var(--font-display)' }}>{(session.creditsEarned || 0).toLocaleString()} CR</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginTop: 4 }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Total Spent</span>
                    <span style={{ color: '#ff4444', fontFamily: 'var(--font-display)' }}>{(session.creditsSpent || 0).toLocaleString()} CR</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, marginTop: 8, borderTop: '1px solid var(--color-border)', paddingTop: 8 }}>
                    <span style={{ fontFamily: 'var(--font-display)', letterSpacing: 1 }}>NET PROFIT</span>
                    <span style={{ color: session.netProfit >= 0 ? '#4E9A3E' : '#ff4444', fontFamily: 'var(--font-display)', fontSize: 18 }}>
                      {(session.netProfit || 0).toLocaleString()} CR
                    </span>
                  </div>
                </div>
              )}
            </HoloPanel>

            {/* Detailed Session Stats */}
            <HoloPanel title="Session Statistics">
              <div style={{ fontSize: 13, color: 'var(--color-text-muted)', fontStyle: 'italic', padding: '4px 0 12px', borderBottom: '1px solid var(--color-border)', marginBottom: 10 }}>
                Detailed activity counters for the current play session.
              </div>
              {session ? (
                <div className="grid-3" style={{ gap: 12 }}>
                  {[
                    ['Jumps', session.jumps || 0],
                    ['Distance', `${(session.totalDistance || 0).toFixed(1)} LY`],
                    ['Bodies Scanned', session.bodiesScanned || 0],
                    ['Systems Visited', session.systemsVisited || 0],
                    ['Missions Done', session.missionsCompleted || 0],
                    ['Missions Failed', session.missionsFailed || 0],
                    ['Bounties', session.bountiesCollected || 0],
                    ['Bounty Earnings', `${((session.bountyEarnings || 0) / 1e6).toFixed(1)}M`],
                    ['Mining Refined', `${session.miningRefined || 0}t`],
                    ['Cargo Traded', `${session.cargoTraded || 0}t`],
                    ['Materials', session.materialsCollected || 0],
                    ['Deaths', session.deaths || 0],
                    ['Fuel Used', `${(session.fuelUsed || 0).toFixed(1)}t`],
                    ['Fuel Scooped', `${(session.fuelScooped || 0).toFixed(1)}t`],
                    ['Fuel Scoops', session.fuelScoops || 0],
                  ].map(([label, value]) => (
                    <div key={label as string} style={{ textAlign: 'center', padding: '6px 4px' }}>
                      <div style={{ fontSize: 18, fontFamily: 'var(--font-display)', color: 'var(--color-accent-bright)' }}>{value}</div>
                      <div style={{ fontSize: 10, color: 'var(--color-text-muted)', letterSpacing: 1, textTransform: 'uppercase', marginTop: 2 }}>{label}</div>
                    </div>
                  ))}
                </div>
              ) : <p style={{ color: 'var(--color-text-muted)', fontSize: 13, textAlign: 'center', padding: 16 }}>No session data available.</p>}
            </HoloPanel>
          </div>

          {/* Activity Timeline (Snapshots) */}
          <HoloPanel title="Activity Timeline">
            <div style={{ fontSize: 13, color: 'var(--color-text-muted)', fontStyle: 'italic', padding: '4px 0 12px', borderBottom: '1px solid var(--color-border)', marginBottom: 10 }}>
              Snapshots taken every 5 minutes showing cumulative session progress. Use this to track your earnings trajectory.
            </div>
            {recentSnapshots.length > 0 ? (
              <HoloTable
                columns={[
                  { key: 'timestamp', header: 'Time', width: '90px', render: (row: SessionSnapshot) => new Date(row.timestamp).toLocaleTimeString() },
                  { key: 'elapsedMinutes', header: 'Elapsed', width: '70px', render: (row: SessionSnapshot) => `${row.elapsedMinutes}m` },
                  { key: 'jumps', header: 'Jumps', width: '60px', align: 'right' },
                  { key: 'distance', header: 'Distance', width: '80px', align: 'right', render: (row: SessionSnapshot) => `${row.distance.toFixed(1)} LY` },
                  { key: 'creditsEarned', header: 'Earned', width: '100px', align: 'right', render: (row: SessionSnapshot) => (
                    <span style={{ color: 'var(--color-accent-bright)' }}>{row.creditsEarned.toLocaleString()}</span>
                  )},
                  { key: 'bodiesScanned', header: 'Scans', width: '60px', align: 'right' },
                  { key: 'missionsCompleted', header: 'Missions', width: '70px', align: 'right' },
                ]}
                data={recentSnapshots}
                rowKey={(row, i) => `${row.timestamp}-${i}`}
                emptyMessage="No snapshots yet"
              />
            ) : <p style={{ color: 'var(--color-text-muted)', fontSize: 13, textAlign: 'center', padding: 16 }}>No snapshots yet. Data is captured every 5 minutes while playing.</p>}

            {/* Credit progression as bars */}
            {chartData.length >= 2 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 11, fontFamily: 'var(--font-display)', letterSpacing: 1, color: 'var(--color-text-muted)', marginBottom: 8 }}>CREDIT PROGRESSION</div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 80 }}>
                  {chartData.slice(-30).map((snap, i) => {
                    const maxCredits = Math.max(...chartData.slice(-30).map(s => s.creditsEarned), 1);
                    const height = Math.max(2, (snap.creditsEarned / maxCredits) * 70);
                    return (
                      <div
                        key={i}
                        title={`${new Date(snap.timestamp).toLocaleTimeString()} - ${snap.creditsEarned.toLocaleString()} CR`}
                        style={{
                          flex: 1,
                          height,
                          background: 'var(--color-accent)',
                          borderRadius: '2px 2px 0 0',
                          opacity: 0.6 + (i / chartData.slice(-30).length) * 0.4,
                          transition: 'height 0.3s ease',
                        }}
                      />
                    );
                  })}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--color-text-muted)', marginTop: 4 }}>
                  <span>{chartData.length >= 2 ? new Date(chartData[Math.max(0, chartData.length - 30)].timestamp).toLocaleTimeString() : ''}</span>
                  <span>{new Date(chartData[chartData.length - 1].timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            )}
          </HoloPanel>
        </>
      )}
    </div>
  );
}
