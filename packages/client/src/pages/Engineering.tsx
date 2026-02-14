import { useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import HoloPanel from '../components/common/HoloPanel';
import HoloProgress from '../components/common/HoloProgress';

export default function Engineering() {
  const { data, loading, fetch: load } = useApi<any>('/engineering');
  useEffect(() => { load(); }, [load]);

  return (
    <div className="page">
      <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-accent-bright)', letterSpacing: 3, marginBottom: 20 }}>ENGINEERING</h1>
      {loading && <p style={{ color: 'var(--color-text-muted)' }}>Loading...</p>}
      {data && (
        <>
          <div className="grid-3" style={{ gap: 16, marginBottom: 20 }}>
            {['raw', 'manufactured', 'encoded'].map((cat) => {
              const s = data[cat]; if (!s) return null;
              return (
                <HoloPanel key={cat} title={s.category}>
                  <div style={{ fontSize: 13, lineHeight: 1.8 }}>
                    <div><span style={{ color: 'var(--color-text-muted)' }}>Materials:</span> {s.count}</div>
                    <div><span style={{ color: 'var(--color-text-muted)' }}>Storage:</span> {s.held}/{s.capacity}</div>
                    <HoloProgress value={s.fillPercent} max={100} label={`${s.fillPercent}%`} />
                  </div>
                </HoloPanel>
              );
            })}
          </div>
          {data.engineers?.length > 0 && (
            <HoloPanel title="Engineers">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                {data.engineers.map((e: any) => (
                  <div key={e.id} style={{ padding: 10, background: 'var(--color-bg-tertiary)', borderRadius: 4, fontSize: 13 }}>
                    <div style={{ color: 'var(--color-accent-bright)', fontFamily: 'var(--font-display)', fontSize: 12 }}>{e.name}</div>
                    <div style={{ color: 'var(--color-text-muted)' }}>{e.progress}{e.rank ? ` — G${e.rank}` : ''}</div>
                  </div>
                ))}
              </div>
            </HoloPanel>
          )}
        </>
      )}
    </div>
  );
}
