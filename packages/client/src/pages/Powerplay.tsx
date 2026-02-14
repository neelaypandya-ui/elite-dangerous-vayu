import { useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import HoloPanel from '../components/common/HoloPanel';

export default function Powerplay() {
  const { data, loading, fetch: load } = useApi<any>('/powerplay');
  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, [load]);

  return (
    <div className="page">
      <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-accent-bright)', letterSpacing: 3, marginBottom: 20 }}>POWERPLAY</h1>
      {loading && <p style={{ color: 'var(--color-text-muted)' }}>Loading...</p>}
      {data && (
        <>
          <div className="grid-2" style={{ gap: 16, marginBottom: 20 }}>
            <HoloPanel title="Pledged Power">
              {data.pledgedPower ? (
                <div style={{ textAlign: 'center', padding: 16 }}>
                  <div style={{ fontSize: 22, fontFamily: 'var(--font-display)', color: 'var(--color-accent-bright)', marginBottom: 8 }}>{data.pledgedPower}</div>
                  <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Rank: <strong style={{ color: 'var(--color-accent-bright)' }}>{data.rank || 'Unknown'}</strong></div>
                  {data.timePledged && <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>Pledged: {data.timePledged}</div>}
                </div>
              ) : (
                <p style={{ color: 'var(--color-text-muted)', fontSize: 13, textAlign: 'center', padding: 16 }}>Not pledged to any power</p>
              )}
            </HoloPanel>
            <HoloPanel title="Merits">
              <div style={{ textAlign: 'center', padding: 16 }}>
                <div style={{ fontSize: 28, fontFamily: 'var(--font-display)', color: 'var(--color-accent-bright)' }}>{(data.merits || 0).toLocaleString()}</div>
                <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Total Merits</div>
              </div>
            </HoloPanel>
          </div>
          <HoloPanel title="Recent Activities">
            {data.activities?.length > 0 ? data.activities.map((a: any, i: number) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)', fontSize: 13 }}>
                <span>{a.type}</span>
                <span style={{ color: 'var(--color-accent-bright)' }}>+{a.merits} merits</span>
              </div>
            )) : <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>No recent activities</p>}
          </HoloPanel>
        </>
      )}
    </div>
  );
}
