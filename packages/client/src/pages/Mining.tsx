import { useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import HoloPanel from '../components/common/HoloPanel';
import HoloProgress from '../components/common/HoloProgress';
import HoloBadge from '../components/common/HoloBadge';
import HoloTable from '../components/common/HoloTable';

function formatDuration(startTime: string, endTime?: string | null): string {
  const start = new Date(startTime).getTime();
  const end = endTime ? new Date(endTime).getTime() : Date.now();
  const elapsed = Math.max(0, end - start);
  const hours = Math.floor(elapsed / 3600000);
  const minutes = Math.floor((elapsed % 3600000) / 60000);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

const miningTypeLabel: Record<string, string> = {
  laser: 'Laser Mining',
  deepcore: 'Deep Core',
  subsurface: 'Subsurface',
  mixed: 'Mixed',
};

const contentColor = (content: string) => {
  if (content.includes('High')) return '#4E9A3E';
  if (content.includes('Medium')) return '#ffaa00';
  return 'var(--color-text-muted)';
};

interface MiningYield {
  name: string;
  nameLocalised: string | null;
  count: number;
  estimatedValuePerUnit: number | null;
  estimatedTotalValue: number | null;
}

interface ProspectorResult {
  timestamp: string;
  materials: { name: string; nameLocalised: string | null; proportion: number }[];
  content: string;
  contentLocalised: string | null;
  remaining: number;
  motherlodeMaterial: string | null;
  motherlodeMaterialLocalised: string | null;
}

interface MiningSession {
  startTime: string;
  endTime: string | null;
  system: string;
  body: string;
  miningType: string;
  asteroidsProspected: number;
  asteroidsCracked: number;
  yields: MiningYield[];
  totalRefined: number;
  totalEstimatedValue: number;
  prospectorResults: ProspectorResult[];
  prospectorsLaunched: number;
  collectorsLaunched: number;
  cargoCollected: number;
}

export default function Mining() {
  const { data, loading, fetch: load } = useApi<any>('/mining');
  const { data: sessionsData, fetch: loadSessions } = useApi<MiningSession[]>('/mining/sessions');

  useEffect(() => {
    load(); loadSessions();
    const t = setInterval(() => { load(); loadSessions(); }, 10000);
    return () => clearInterval(t);
  }, [load, loadSessions]);

  const current: MiningSession | null = data?.currentSession;
  const profitPerHour: number | null = data?.profitPerHour;
  const lifetimeRefined: number = data?.lifetimeRefined || 0;
  const totalSessions: number = data?.totalSessions || 0;
  const sessions: MiningSession[] = sessionsData || [];

  // Compute yields sorted by count for current session
  const sortedYields = [...(current?.yields || [])].sort((a, b) => b.count - a.count);
  const maxYield = sortedYields.length > 0 ? sortedYields[0].count : 1;

  // Recent prospector results (last 10)
  const recentProspects = [...(current?.prospectorResults || [])].reverse().slice(0, 10);

  return (
    <div className="page">
      <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-accent-bright)', letterSpacing: 3, marginBottom: 8, fontSize: 28 }}>MINING</h1>
      <p style={{ color: 'var(--color-text-muted)', fontSize: 15, marginBottom: 24 }}>
        Real-time mining session tracker. Monitors prospector results, refined yields, and profit per hour. Data resets when you dock or jump systems.
      </p>
      {loading && !data && <p style={{ color: 'var(--color-text-muted)', fontSize: 15 }}>Loading...</p>}

      {data && (
        <>
          {/* Top-level stats */}
          <div className="grid-4" style={{ gap: 16, marginBottom: 20 }}>
            {[
              ['Prospected', current?.asteroidsProspected || 0, 'var(--color-accent-bright)'],
              ['Refined', current?.totalRefined || 0, '#4488cc'],
              ['Cracked', current?.asteroidsCracked || 0, '#ffaa00'],
              ['Profit/hr', profitPerHour != null ? `${(profitPerHour / 1e6).toFixed(1)}M` : '--', '#4E9A3E'],
            ].map(([l, v, c]) => (
              <HoloPanel key={l as string}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontFamily: 'var(--font-display)', color: c as string }}>{v}</div>
                  <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>{l as string}</div>
                </div>
              </HoloPanel>
            ))}
          </div>

          <div className="grid-2" style={{ gap: 20, marginBottom: 20 }}>
            {/* Current Session Details */}
            <HoloPanel title="Current Session">
              <div style={{ fontSize: 13, color: 'var(--color-text-muted)', fontStyle: 'italic', padding: '4px 0 12px', borderBottom: '1px solid var(--color-border)', marginBottom: 10 }}>
                Active mining session data. A new session begins when prospecting starts and ends when you dock or jump.
              </div>
              {current ? (
                <div style={{ fontSize: 14, lineHeight: 2 }}>
                  <div>
                    <span style={{ color: 'var(--color-text-muted)' }}>Mining Type: </span>
                    <HoloBadge>{miningTypeLabel[current.miningType] || current.miningType}</HoloBadge>
                  </div>
                  <div><span style={{ color: 'var(--color-text-muted)' }}>System:</span> <span style={{ color: 'var(--color-accent-bright)' }}>{current.system || 'Unknown'}</span></div>
                  <div><span style={{ color: 'var(--color-text-muted)' }}>Body:</span> {current.body || 'Unknown'}</div>
                  <div><span style={{ color: 'var(--color-text-muted)' }}>Duration:</span> {formatDuration(current.startTime)}</div>
                  <div><span style={{ color: 'var(--color-text-muted)' }}>Total Value:</span> <span style={{ color: 'var(--color-accent-bright)', fontSize: 16 }}>{(current.totalEstimatedValue || 0).toLocaleString()} CR</span></div>
                  <div style={{ marginTop: 8, borderTop: '1px solid var(--color-border)', paddingTop: 8 }}>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                      Prospectors: {current.prospectorsLaunched} launched | Collectors: {current.collectorsLaunched} launched | Cargo: {current.cargoCollected} fragments
                    </div>
                  </div>
                </div>
              ) : <p style={{ color: 'var(--color-text-muted)', fontSize: 13, textAlign: 'center', padding: 20 }}>No active mining session. Launch a prospector limpet to begin tracking.</p>}
            </HoloPanel>

            {/* Yield Breakdown */}
            <HoloPanel title="Yield Breakdown">
              <div style={{ fontSize: 13, color: 'var(--color-text-muted)', fontStyle: 'italic', padding: '4px 0 12px', borderBottom: '1px solid var(--color-border)', marginBottom: 10 }}>
                Minerals refined this session. Bars show relative proportion of each material.
              </div>
              {sortedYields.length > 0 ? sortedYields.map((y) => (
                <div key={y.name} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span>{y.nameLocalised || y.name}</span>
                    <span style={{ color: 'var(--color-accent-bright)' }}>
                      {y.count}t
                      {y.estimatedTotalValue != null && (
                        <span style={{ color: 'var(--color-text-muted)', fontSize: 11, marginLeft: 8 }}>
                          ({y.estimatedTotalValue.toLocaleString()} CR)
                        </span>
                      )}
                    </span>
                  </div>
                  <HoloProgress value={y.count} max={maxYield} showPercent={false} color="var(--color-accent)" />
                </div>
              )) : <p style={{ color: 'var(--color-text-muted)', fontSize: 13, textAlign: 'center', padding: 20 }}>No refined materials yet. Keep mining, Commander.</p>}
            </HoloPanel>
          </div>

          {/* Recent Prospector Results */}
          {recentProspects.length > 0 && (
            <HoloPanel title="Recent Prospector Scans" style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, color: 'var(--color-text-muted)', fontStyle: 'italic', padding: '4px 0 12px', borderBottom: '1px solid var(--color-border)', marginBottom: 10 }}>
                Last 10 prospector limpet results. Shows asteroid content level, remaining percentage, and material composition.
              </div>
              {recentProspects.map((p, i) => (
                <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid var(--color-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: contentColor(p.content), fontFamily: 'var(--font-display)', fontSize: 12, letterSpacing: 1 }}>
                        {p.contentLocalised || p.content}
                      </span>
                      {p.motherlodeMaterial && (
                        <HoloBadge variant="warning">
                          CORE: {p.motherlodeMaterialLocalised || p.motherlodeMaterial}
                        </HoloBadge>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                        {p.remaining.toFixed(0)}% remaining
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                        {new Date(p.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                  {p.materials.length > 0 && (
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      {p.materials.map((m, mi) => (
                        <div key={mi} style={{ fontSize: 12 }}>
                          <span style={{ color: 'var(--color-text-muted)' }}>{m.nameLocalised || m.name}:</span>{' '}
                          <span style={{ color: 'var(--color-accent-bright)' }}>{(m.proportion * 100).toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </HoloPanel>
          )}

          {/* Lifetime Stats + Previous Sessions */}
          <div className="grid-2" style={{ gap: 20 }}>
            <HoloPanel title="Lifetime Statistics">
              <div style={{ fontSize: 14, lineHeight: 2.2, padding: 8 }}>
                <div>
                  <span style={{ color: 'var(--color-text-muted)' }}>Total Sessions:</span>{' '}
                  <span style={{ fontFamily: 'var(--font-display)', color: 'var(--color-accent-bright)' }}>{totalSessions}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--color-text-muted)' }}>Lifetime Refined:</span>{' '}
                  <span style={{ fontFamily: 'var(--font-display)', color: '#4488cc' }}>{lifetimeRefined}t</span>
                </div>
              </div>
            </HoloPanel>

            <HoloPanel title="Previous Sessions">
              <div style={{ fontSize: 13, color: 'var(--color-text-muted)', fontStyle: 'italic', padding: '4px 0 12px', borderBottom: '1px solid var(--color-border)', marginBottom: 10 }}>
                Completed mining sessions. Sessions end when you dock at a station or jump to another system.
              </div>
              {sessions.length > 0 ? (
                <HoloTable
                  columns={[
                    { key: 'system', header: 'System' },
                    { key: 'miningType', header: 'Type', width: '80px', render: (row: MiningSession) => (
                      <span style={{ fontSize: 11 }}>{miningTypeLabel[row.miningType] || row.miningType}</span>
                    )},
                    { key: 'totalRefined', header: 'Refined', width: '70px', align: 'right', render: (row: MiningSession) => `${row.totalRefined}t` },
                    { key: 'duration', header: 'Duration', width: '70px', render: (row: MiningSession) => formatDuration(row.startTime, row.endTime) },
                    { key: 'totalEstimatedValue', header: 'Value', width: '100px', align: 'right', render: (row: MiningSession) => (
                      <span style={{ color: 'var(--color-accent-bright)' }}>{(row.totalEstimatedValue || 0).toLocaleString()} CR</span>
                    )},
                  ]}
                  data={[...sessions].reverse()}
                  rowKey={(row, i) => `${row.startTime}-${i}`}
                  emptyMessage="No previous sessions"
                />
              ) : <p style={{ color: 'var(--color-text-muted)', fontSize: 13, textAlign: 'center', padding: 16 }}>No completed sessions yet.</p>}
            </HoloPanel>
          </div>
        </>
      )}
    </div>
  );
}
