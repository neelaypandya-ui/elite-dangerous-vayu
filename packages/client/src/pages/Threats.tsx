import { useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { useWebSocket } from '../hooks/useWebSocket';
import { useGameState } from '../hooks/useGameState';
import HoloPanel from '../components/common/HoloPanel';
import HoloBadge from '../components/common/HoloBadge';
import HoloTable from '../components/common/HoloTable';
import HoloProgress from '../components/common/HoloProgress';

const threatColor = (level: string) =>
  level === 'extreme' ? '#ff2222' : level === 'high' ? '#ff4444' : level === 'medium' ? '#ffaa00' : '#4488cc';

const threatVariant = (level: string) =>
  level === 'extreme' || level === 'high' ? 'danger' as const : level === 'medium' ? 'warning' as const : 'info' as const;

interface ThreatSystem {
  system: string;
  threatLevel: 'low' | 'medium' | 'high' | 'extreme';
  reason: string;
  lastReported: string;
}

interface InterdictionRecord {
  timestamp: string;
  system: string;
  isPlayer: boolean;
  interdictor: string;
  submitted: boolean;
  survived: boolean;
}

export default function Threats() {
  const { data, loading, fetch: load } = useApi<any>('/threats');
  const { data: knownData, fetch: loadKnown } = useApi<ThreatSystem[]>('/threats/known');
  const { data: interdictionData, fetch: loadInterdictions } = useApi<InterdictionRecord[]>('/threats/interdictions?limit=20');
  const gameState = useGameState();
  const { subscribe } = useWebSocket();

  useEffect(() => {
    load(); loadKnown(); loadInterdictions();
    const t = setInterval(() => { load(); loadInterdictions(); }, 10000);
    return () => clearInterval(t);
  }, [load, loadKnown, loadInterdictions]);

  // Subscribe to real-time threat events
  useEffect(() => {
    const unsubs = [
      subscribe('threat:interdiction', () => { loadInterdictions(); load(); }),
      subscribe('threat:system_alert', () => load()),
      subscribe('threat:anarchy_warning', () => load()),
    ];
    return () => unsubs.forEach(u => u());
  }, [subscribe, load, loadInterdictions]);

  const summary = data;
  const currentSystem = summary?.currentSystem;
  const known: ThreatSystem[] = knownData || [];
  const interdictions: InterdictionRecord[] = interdictionData || [];

  // Compute interdiction stats
  const totalInterdictions = summary?.totalInterdictions || interdictions.length;
  const submittedCount = interdictions.filter(d => d.submitted).length;
  const evadedCount = interdictions.filter(d => !d.submitted).length;
  const playerInterdictions = interdictions.filter(d => d.isPlayer).length;

  return (
    <div className="page">
      <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-accent-bright)', letterSpacing: 3, marginBottom: 8, fontSize: 28 }}>THREAT INTEL</h1>
      <p style={{ color: 'var(--color-text-muted)', fontSize: 15, marginBottom: 24 }}>
        Real-time threat assessment, known dangerous systems, and interdiction history. Stay alert in hostile space, Commander.
      </p>
      {loading && !data && <p style={{ color: 'var(--color-text-muted)', fontSize: 15 }}>Scanning threat databases...</p>}

      {/* Current System Threat Assessment */}
      {currentSystem && (
        <HoloPanel title="Current System Threat Assessment" accent={currentSystem.threat ? threatColor(currentSystem.threat.threatLevel) : undefined}>
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)', fontStyle: 'italic', padding: '4px 0 12px', borderBottom: '1px solid var(--color-border)', marginBottom: 12 }}>
            Analysis of your current system based on security level, government type, and known threat intelligence.
          </div>
          <div className="grid-2" style={{ gap: 20 }}>
            <div style={{ fontSize: 14, lineHeight: 2 }}>
              <div style={{ fontSize: 20, fontFamily: 'var(--font-display)', color: 'var(--color-accent-bright)', marginBottom: 8 }}>
                {currentSystem.system || gameState?.location?.system || 'Unknown'}
              </div>
              <div><span style={{ color: 'var(--color-text-muted)' }}>Security:</span> {currentSystem.security || 'Unknown'}</div>
              <div><span style={{ color: 'var(--color-text-muted)' }}>Government:</span> {currentSystem.government || 'Unknown'}</div>
              <div><span style={{ color: 'var(--color-text-muted)' }}>Allegiance:</span> {currentSystem.allegiance || 'Unknown'}</div>
              {currentSystem.threat && (
                <div style={{ marginTop: 8 }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Threat Level: </span>
                  <HoloBadge variant={threatVariant(currentSystem.threat.threatLevel)}>
                    {currentSystem.threat.threatLevel}
                  </HoloBadge>
                </div>
              )}
            </div>
            <div>
              {/* Warnings */}
              {currentSystem.security === 'Anarchy' && (
                <div style={{
                  background: 'rgba(255,68,68,0.1)', border: '1px solid #ff4444',
                  padding: 12, borderRadius: 4, marginBottom: 10, fontSize: 13,
                }}>
                  <div style={{ color: '#ff4444', fontFamily: 'var(--font-display)', fontSize: 12, letterSpacing: 1, marginBottom: 4 }}>ANARCHY SYSTEM</div>
                  <div style={{ color: 'var(--color-text-muted)' }}>No security response. Pirates and gankers operate freely.</div>
                </div>
              )}
              {currentSystem.hasCargoRisk && (
                <div style={{
                  background: 'rgba(255,170,0,0.1)', border: '1px solid #ffaa00',
                  padding: 12, borderRadius: 4, marginBottom: 10, fontSize: 13,
                }}>
                  <div style={{ color: '#ffaa00', fontFamily: 'var(--font-display)', fontSize: 12, letterSpacing: 1, marginBottom: 4 }}>CARGO RISK</div>
                  <div style={{ color: 'var(--color-text-muted)' }}>Carrying cargo in an anarchy system. Increased piracy risk.</div>
                </div>
              )}
              {currentSystem.threat?.reason && (
                <div style={{
                  background: 'rgba(255,68,68,0.1)', border: `1px solid ${threatColor(currentSystem.threat.threatLevel)}`,
                  padding: 12, borderRadius: 4, fontSize: 13,
                }}>
                  <div style={{ color: threatColor(currentSystem.threat.threatLevel), fontFamily: 'var(--font-display)', fontSize: 12, letterSpacing: 1, marginBottom: 4 }}>THREAT INTEL</div>
                  <div style={{ color: 'var(--color-text-muted)' }}>{currentSystem.threat.reason}</div>
                </div>
              )}
              {!currentSystem.threat && currentSystem.security !== 'Anarchy' && !currentSystem.hasCargoRisk && (
                <div style={{
                  background: 'rgba(78,154,62,0.1)', border: '1px solid var(--color-accent)',
                  padding: 12, borderRadius: 4, fontSize: 13,
                }}>
                  <div style={{ color: 'var(--color-accent-bright)', fontFamily: 'var(--font-display)', fontSize: 12, letterSpacing: 1, marginBottom: 4 }}>CLEAR</div>
                  <div style={{ color: 'var(--color-text-muted)' }}>No active threats detected in this system.</div>
                </div>
              )}
            </div>
          </div>
        </HoloPanel>
      )}

      {/* Interdiction Statistics */}
      <div className="grid-4" style={{ gap: 16, marginTop: 20, marginBottom: 20 }}>
        {[
          ['Total Interdictions', totalInterdictions, '#ff4444'],
          ['Submitted', submittedCount, '#ffaa00'],
          ['Evaded', evadedCount, 'var(--color-accent-bright)'],
          ['Player (CMDR)', playerInterdictions, '#4488cc'],
        ].map(([l, v, c]) => (
          <HoloPanel key={l as string}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontFamily: 'var(--font-display)', color: c as string }}>{v}</div>
              <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>{l as string}</div>
            </div>
          </HoloPanel>
        ))}
      </div>

      <div className="grid-2" style={{ gap: 20 }}>
        {/* Known Threat Systems */}
        <HoloPanel title="Known Threat Systems">
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)', fontStyle: 'italic', padding: '4px 0 12px', borderBottom: '1px solid var(--color-border)', marginBottom: 10 }}>
            Systems flagged in the threat database. Data sourced from journal events and community reports.
          </div>
          {known.length > 0 ? (
            <HoloTable
              columns={[
                { key: 'system', header: 'System' },
                { key: 'threatLevel', header: 'Threat', width: '90px', render: (row: ThreatSystem) => (
                  <HoloBadge variant={threatVariant(row.threatLevel)}>{row.threatLevel}</HoloBadge>
                )},
                { key: 'reason', header: 'Reason' },
                { key: 'lastReported', header: 'Reported', width: '100px', render: (row: ThreatSystem) => (
                  row.lastReported ? new Date(row.lastReported).toLocaleDateString() : 'N/A'
                )},
              ]}
              data={known}
              rowKey={(row, i) => `${row.system}-${i}`}
              emptyMessage="No known threats"
            />
          ) : <p style={{ color: 'var(--color-text-muted)', fontSize: 13, textAlign: 'center', padding: 16 }}>No threat systems in database. Fly cautiously.</p>}
        </HoloPanel>

        {/* Interdiction History */}
        <HoloPanel title="Interdiction History">
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)', fontStyle: 'italic', padding: '4px 0 12px', borderBottom: '1px solid var(--color-border)', marginBottom: 10 }}>
            Log of all interdictions experienced this session. Tracks whether you submitted or evaded.
          </div>
          {interdictions.length > 0 ? interdictions.map((d, i) => (
            <div key={i} style={{
              padding: '10px 0', borderBottom: '1px solid var(--color-border)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14 }}>{d.system}</span>
                  {d.isPlayer && <HoloBadge variant="danger">CMDR</HoloBadge>}
                </div>
                <HoloBadge variant={d.submitted ? 'warning' : 'success'}>
                  {d.submitted ? 'Submitted' : 'Evaded'}
                </HoloBadge>
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Interdictor: {d.interdictor || 'Unknown'}</span>
                <span>{d.timestamp ? new Date(d.timestamp).toLocaleString() : ''}</span>
              </div>
            </div>
          )) : <p style={{ color: 'var(--color-text-muted)', fontSize: 13, textAlign: 'center', padding: 16 }}>No interdictions recorded. Clear skies.</p>}

          {/* Evasion rate bar */}
          {interdictions.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <HoloProgress
                value={evadedCount}
                max={interdictions.length}
                label="EVASION RATE"
                color="var(--color-accent)"
              />
            </div>
          )}
        </HoloPanel>
      </div>
    </div>
  );
}
