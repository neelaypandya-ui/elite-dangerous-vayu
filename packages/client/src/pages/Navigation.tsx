import { useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import HoloPanel from '../components/common/HoloPanel';

export default function Navigation() {
  const { data, loading, fetch: load } = useApi<any>('/navigation');
  useEffect(() => { load(); const t = setInterval(load, 10000); return () => clearInterval(t); }, [load]);

  return (
    <div className="page">
      <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-accent-bright)', letterSpacing: 3, marginBottom: 20 }}>NAVIGATION</h1>
      {loading && <p style={{ color: 'var(--color-text-muted)' }}>Loading...</p>}
      {data && (
        <>
          <div className="grid-2" style={{ gap: 16, marginBottom: 20 }}>
            <HoloPanel title="Current Location">
              <div style={{ fontSize: 13, lineHeight: 1.8 }}>
                <div style={{ fontSize: 18, color: 'var(--color-accent-bright)', fontFamily: 'var(--font-display)' }}>{data.currentLocation?.system}</div>
                {data.currentLocation?.station && <div><span style={{ color: 'var(--color-text-muted)' }}>Station:</span> {data.currentLocation.station}</div>}
                <div><span style={{ color: 'var(--color-text-muted)' }}>Security:</span> {data.currentLocation?.security || 'Unknown'}</div>
                <div><span style={{ color: 'var(--color-text-muted)' }}>Economy:</span> {data.currentLocation?.economy || 'None'}</div>
              </div>
            </HoloPanel>
            <HoloPanel title="Session Stats">
              <div className="grid-2" style={{ gap: 12 }}>
                {[['Jumps', data.sessionStats?.jumps], ['Distance', `${(data.sessionStats?.distance || 0).toFixed(1)} LY`], ['Fuel Used', `${(data.sessionStats?.fuelUsed || 0).toFixed(1)}t`], ['Systems', data.sessionStats?.systemsVisited]].map(([l, v]) => (
                  <div key={l as string} style={{ textAlign: 'center', padding: 8, background: 'var(--color-bg-tertiary)', borderRadius: 4 }}><div style={{ fontSize: 16, color: 'var(--color-accent-bright)', fontFamily: 'var(--font-display)' }}>{v}</div><div style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>{l}</div></div>
                ))}
              </div>
            </HoloPanel>
          </div>
          <HoloPanel title="Jump History">
            {data.recentJumps?.length > 0 ? data.recentJumps.map((j: any, i: number) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--color-border)', fontSize: 13 }}>
                <span>{j.system}</span><span style={{ color: 'var(--color-text-muted)' }}>{j.distance?.toFixed(2)} LY</span>
              </div>
            )) : <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>No jumps</p>}
          </HoloPanel>
        </>
      )}
    </div>
  );
}
