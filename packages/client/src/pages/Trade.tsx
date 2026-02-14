import { useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import HoloPanel from '../components/common/HoloPanel';

export default function Trade() {
  const { data, loading, fetch: load } = useApi<any>('/trade');
  useEffect(() => { load(); }, [load]);

  return (
    <div className="page">
      <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-accent-bright)', letterSpacing: 3, marginBottom: 20 }}>TRADE</h1>
      {loading && <p style={{ color: 'var(--color-text-muted)' }}>Loading...</p>}
      {data && (
        <div className="grid-2" style={{ gap: 16 }}>
          <HoloPanel title="Trade Overview">
            <div style={{ fontSize: 13, lineHeight: 1.8 }}>
              <div><span style={{ color: 'var(--color-text-muted)' }}>System:</span> {data.currentSystem}</div>
              <div><span style={{ color: 'var(--color-text-muted)' }}>Station:</span> {data.currentStation || 'Not docked'}</div>
              <div><span style={{ color: 'var(--color-text-muted)' }}>Cargo:</span> {data.cargoUsed}/{data.cargoCapacity}t</div>
              <div><span style={{ color: 'var(--color-text-muted)' }}>Sessions:</span> {data.sessionCount}</div>
              <div><span style={{ color: 'var(--color-text-muted)' }}>Total Profit:</span> <span style={{ color: data.totalProfit >= 0 ? 'var(--color-accent-bright)' : '#ff4444' }}>{(data.totalProfit || 0).toLocaleString()} CR</span></div>
            </div>
          </HoloPanel>
          <HoloPanel title="Current Cargo">
            {data.cargo?.length > 0 ? (
              <div style={{ fontSize: 13 }}>
                {data.cargo.map((c: any, i: number) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--color-border)' }}>
                    <span>{c.nameLocalised || c.name}</span>
                    <span style={{ color: 'var(--color-accent-bright)' }}>{c.count}t</span>
                  </div>
                ))}
              </div>
            ) : <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>Cargo hold empty</p>}
          </HoloPanel>
        </div>
      )}
    </div>
  );
}
