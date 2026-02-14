import { useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import HoloPanel from '../components/common/HoloPanel';

const sColors: Record<string, string> = { info: '#4488cc', warning: '#ffaa00', critical: '#ff4444' };

export default function Alerts() {
  const { data, loading, fetch: load } = useApi<any>('/alerts');
  useEffect(() => { load(); const t = setInterval(load, 5000); return () => clearInterval(t); }, [load]);

  return (
    <div className="page">
      <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-accent-bright)', letterSpacing: 3, marginBottom: 20 }}>ALERTS</h1>
      {loading && <p style={{ color: 'var(--color-text-muted)' }}>Loading...</p>}
      {data && (
        <div className="grid-2" style={{ gap: 16 }}>
          <HoloPanel title="Alert Rules">
            {data.rules?.map((r: any) => (
              <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)', fontSize: 13 }}>
                <span style={{ color: r.enabled ? 'var(--color-accent-bright)' : 'var(--color-text-muted)' }}>{r.name}</span>
                <span style={{ fontSize: 11, color: r.enabled ? 'var(--color-accent-bright)' : 'var(--color-text-muted)' }}>{r.enabled ? 'ON' : 'OFF'}</span>
              </div>
            ))}
          </HoloPanel>
          <HoloPanel title="Recent Alerts">
            {data.recent?.length > 0 ? data.recent.map((a: any) => (
              <div key={a.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--color-border)', fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: sColors[a.severity] || '#fff' }}>{a.ruleName}</span><span style={{ color: 'var(--color-text-muted)', fontSize: 11 }}>{new Date(a.timestamp).toLocaleTimeString()}</span></div>
                <div style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>{a.message}</div>
              </div>
            )) : <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>No recent alerts</p>}
          </HoloPanel>
        </div>
      )}
    </div>
  );
}
