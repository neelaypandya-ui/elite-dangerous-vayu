import { useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import HoloPanel from '../components/common/HoloPanel';

const pipColors: Record<string, string> = { SYS: '#4488cc', ENG: '#ffaa00', WEP: '#ff4444' };

function PipBar({ label, value, max = 8 }: { label: string; value: number; max?: number }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
        <span style={{ color: pipColors[label] || '#fff', fontFamily: 'var(--font-display)', letterSpacing: 1 }}>{label}</span>
        <span style={{ color: 'var(--color-text-muted)' }}>{value}/{max}</span>
      </div>
      <div style={{ display: 'flex', gap: 3 }}>
        {Array.from({ length: max }, (_, i) => (
          <div key={i} style={{ flex: 1, height: 16, background: i < value ? (pipColors[label] || '#fff') : 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', transition: 'background 0.3s' }} />
        ))}
      </div>
    </div>
  );
}

export default function Pips() {
  const { data, loading, fetch: load } = useApi<any>('/pips');
  useEffect(() => { load(); const t = setInterval(load, 2000); return () => clearInterval(t); }, [load]);

  const current = data?.current;
  const rec = data?.recommendation;

  return (
    <div className="page">
      <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-accent-bright)', letterSpacing: 3, marginBottom: 20 }}>POWER DISTRIBUTION</h1>
      {loading && <p style={{ color: 'var(--color-text-muted)' }}>Loading...</p>}
      {data && (
        <div className="grid-2" style={{ gap: 16 }}>
          <HoloPanel title="Current Allocation">
            {current ? (
              <div style={{ padding: 8 }}>
                <PipBar label="SYS" value={current.sys || 0} />
                <PipBar label="ENG" value={current.eng || 0} />
                <PipBar label="WEP" value={current.wep || 0} />
                {current.context && (
                  <div style={{ marginTop: 12, fontSize: 12, color: 'var(--color-text-muted)' }}>
                    Detected context: <span style={{ color: 'var(--color-accent-bright)' }}>{current.context}</span>
                  </div>
                )}
              </div>
            ) : <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>No pip data — check Status.json</p>}
          </HoloPanel>
          <HoloPanel title="Recommended">
            {rec ? (
              <div style={{ padding: 8 }}>
                <PipBar label="SYS" value={rec.sys || 0} />
                <PipBar label="ENG" value={rec.eng || 0} />
                <PipBar label="WEP" value={rec.wep || 0} />
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--color-text-muted)' }}>{rec.reason || 'Based on current activity'}</div>
              </div>
            ) : <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>No recommendation available</p>}
          </HoloPanel>
          <HoloPanel title="Pip History" style={{}}>
            {data.history?.length > 0 ? data.history.slice(-10).reverse().map((h: any, i: number) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--color-border)', fontSize: 12 }}>
                <span style={{ color: 'var(--color-text-muted)' }}>{new Date(h.timestamp).toLocaleTimeString()}</span>
                <span>
                  <span style={{ color: pipColors.SYS }}>{h.sys}</span>{' / '}
                  <span style={{ color: pipColors.ENG }}>{h.eng}</span>{' / '}
                  <span style={{ color: pipColors.WEP }}>{h.wep}</span>
                </span>
                <span style={{ color: 'var(--color-text-muted)', fontSize: 10 }}>{h.context || ''}</span>
              </div>
            )) : <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>No history</p>}
          </HoloPanel>
        </div>
      )}
    </div>
  );
}
