import { useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import HoloPanel from '../components/common/HoloPanel';
import HoloProgress from '../components/common/HoloProgress';

export default function Mining() {
  const { data, loading, fetch: load } = useApi<any>('/mining');
  useEffect(() => { load(); const t = setInterval(load, 10000); return () => clearInterval(t); }, [load]);

  const current = data?.current;

  return (
    <div className="page">
      <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-accent-bright)', letterSpacing: 3, marginBottom: 20 }}>MINING</h1>
      {loading && <p style={{ color: 'var(--color-text-muted)' }}>Loading...</p>}
      {data && (
        <>
          <div className="grid-4" style={{ gap: 16, marginBottom: 20 }}>
            {[
              ['Prospected', current?.prospected || 0, 'var(--color-accent-bright)'],
              ['Collected', current?.collected || 0, '#4488cc'],
              ['Refined', current?.refined || 0, '#ffaa00'],
              ['Profit/hr', `${((data.profit?.perHour || 0) / 1e6).toFixed(1)}M`, '#4E9A3E'],
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
            <HoloPanel title="Current Session">
              {current ? (
                <div style={{ fontSize: 13, lineHeight: 1.8 }}>
                  <div><span style={{ color: 'var(--color-text-muted)' }}>Mining Type:</span> {current.type || 'Unknown'}</div>
                  <div><span style={{ color: 'var(--color-text-muted)' }}>Location:</span> {current.system || 'Unknown'}</div>
                  <div><span style={{ color: 'var(--color-text-muted)' }}>Duration:</span> {current.duration || '0:00'}</div>
                  <div><span style={{ color: 'var(--color-text-muted)' }}>Total Value:</span> <span style={{ color: 'var(--color-accent-bright)' }}>{(current.totalValue || 0).toLocaleString()} CR</span></div>
                </div>
              ) : <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>No active mining session</p>}
            </HoloPanel>
            <HoloPanel title="Yield Breakdown">
              {current?.yields && Object.keys(current.yields).length > 0 ? Object.entries(current.yields).map(([mineral, amount]) => (
                <div key={mineral} style={{ marginBottom: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 2 }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>{mineral}</span>
                    <span>{amount as number}t</span>
                  </div>
                  <HoloProgress value={amount as number} max={Math.max(...Object.values(current.yields).map(Number), 1)} />
                </div>
              )) : <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>No yield data yet</p>}
            </HoloPanel>
          </div>
          <HoloPanel title="Recent Sessions">
            {data.sessions?.length > 0 ? data.sessions.map((s: any, i: number) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)', fontSize: 13 }}>
                <div>
                  <div>{s.system || 'Unknown'}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{s.type} \u2022 {s.duration || '?'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: 'var(--color-accent-bright)' }}>{(s.profit || 0).toLocaleString()} CR</div>
                  <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{s.collected || 0} fragments</div>
                </div>
              </div>
            )) : <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>No previous sessions</p>}
          </HoloPanel>
        </>
      )}
    </div>
  );
}
