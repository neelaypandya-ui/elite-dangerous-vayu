import { useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import HoloPanel from '../components/common/HoloPanel';
import HoloProgress from '../components/common/HoloProgress';

export default function Analytics() {
  const { data, loading, fetch: load } = useApi<any>('/analytics');
  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, [load]);

  const session = data?.session;

  return (
    <div className="page">
      <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-accent-bright)', letterSpacing: 3, marginBottom: 20 }}>ANALYTICS</h1>
      {loading && <p style={{ color: 'var(--color-text-muted)' }}>Loading...</p>}
      {data && (
        <>
          <div className="grid-4" style={{ gap: 16, marginBottom: 20 }}>
            {[
              ['Duration', session?.duration || '0:00', 'var(--color-accent-bright)'],
              ['Credits Earned', `${((session?.creditsEarned || 0) / 1e6).toFixed(1)}M`, '#4488cc'],
              ['Jumps', session?.jumps || 0, 'var(--color-accent-bright)'],
              ['Distance', `${(session?.distance || 0).toFixed(1)} LY`, '#ffaa00'],
            ].map(([l, v, c]) => (
              <HoloPanel key={l as string}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontFamily: 'var(--font-display)', color: c as string }}>{v}</div>
                  <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>{l as string}</div>
                </div>
              </HoloPanel>
            ))}
          </div>
          <div className="grid-2" style={{ gap: 16, marginBottom: 20 }}>
            <HoloPanel title="Earnings Breakdown">
              {session?.earnings ? Object.entries(session.earnings).map(([k, v]) => (
                <div key={k} style={{ marginBottom: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 2 }}>
                    <span style={{ color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>{k}</span>
                    <span>{(v as number).toLocaleString()} CR</span>
                  </div>
                  <HoloProgress value={v as number} max={Math.max(...Object.values(session.earnings).map(Number), 1)} />
                </div>
              )) : <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>No earnings data</p>}
            </HoloPanel>
            <HoloPanel title="Activity Log">
              {data.snapshots?.length > 0 ? data.snapshots.slice(-10).reverse().map((s: any, i: number) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--color-border)', fontSize: 12 }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>{new Date(s.timestamp).toLocaleTimeString()}</span>
                  <span>{s.system || 'Unknown'}</span>
                  <span style={{ color: 'var(--color-accent-bright)' }}>{(s.credits || 0).toLocaleString()} CR</span>
                </div>
              )) : <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>No snapshots yet</p>}
            </HoloPanel>
          </div>
        </>
      )}
    </div>
  );
}
