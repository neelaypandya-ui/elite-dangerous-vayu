import { useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import HoloPanel from '../components/common/HoloPanel';

export default function Missions() {
  const { data, loading, fetch: load } = useApi<any>('/missions');
  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t); }, [load]);

  return (
    <div className="page">
      <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-accent-bright)', letterSpacing: 3, marginBottom: 20 }}>MISSIONS</h1>
      {loading && <p style={{ color: 'var(--color-text-muted)' }}>Loading...</p>}
      {data && (
        <>
          <div className="grid-4" style={{ gap: 16, marginBottom: 20 }}>
            {[['Active', data.active, 'var(--color-accent-bright)'], ['Completed', data.completed, '#4488cc'], ['Failed', data.failed, '#ff4444'], ['Expiring', data.expiringSoon, '#ffaa00']].map(([l, v, c]) => (
              <HoloPanel key={l as string}><div style={{ textAlign: 'center' }}><div style={{ fontSize: 28, fontFamily: 'var(--font-display)', color: c as string }}>{v as number}</div><div style={{ fontSize: 10, color: 'var(--color-text-muted)', letterSpacing: 1, textTransform: 'uppercase' }}>{l as string}</div></div></HoloPanel>
            ))}
          </div>
          <HoloPanel title="Active Missions">
            {data.missions?.length > 0 ? data.missions.map((m: any) => (
              <div key={m.missionId} style={{ padding: '10px 0', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <div><div>{m.nameLocalised || m.name}</div><div style={{ color: 'var(--color-text-muted)', fontSize: 11 }}>{m.faction} {m.destinationSystem ? `→ ${m.destinationSystem}` : ''}</div></div>
                <div style={{ textAlign: 'right' }}><div style={{ color: 'var(--color-accent-bright)' }}>{(m.reward || 0).toLocaleString()} CR</div></div>
              </div>
            )) : <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>No active missions</p>}
          </HoloPanel>
        </>
      )}
    </div>
  );
}
