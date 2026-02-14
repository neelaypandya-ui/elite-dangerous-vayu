import { useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import HoloPanel from '../components/common/HoloPanel';

export default function Ships() {
  const { data, loading, fetch: load } = useApi<any>('/ships');
  useEffect(() => { load(); }, [load]);

  return (
    <div className="page">
      <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-accent-bright)', letterSpacing: 3, marginBottom: 20 }}>FLEET</h1>
      {loading && <p style={{ color: 'var(--color-text-muted)' }}>Loading...</p>}
      {data && (
        <>
          <div className="grid-2" style={{ gap: 16, marginBottom: 20 }}>
            <HoloPanel title="Current Ship">
              {data.currentShip ? (
                <div style={{ padding: 8 }}>
                  <div style={{ fontSize: 20, fontFamily: 'var(--font-display)', color: 'var(--color-accent-bright)', marginBottom: 8 }}>{data.currentShip.name || data.currentShip.type}</div>
                  {data.currentShip.name && <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 8 }}>{data.currentShip.type}</div>}
                  <div style={{ fontSize: 12, lineHeight: 1.8, color: 'var(--color-text-muted)' }}>
                    <div>Ident: <span style={{ color: '#fff' }}>{data.currentShip.ident || 'N/A'}</span></div>
                    <div>Hull: <span style={{ color: '#fff' }}>{(data.currentShip.hullValue || 0).toLocaleString()} CR</span></div>
                    <div>Modules: <span style={{ color: '#fff' }}>{(data.currentShip.modulesValue || 0).toLocaleString()} CR</span></div>
                    <div>Rebuy: <span style={{ color: '#ffaa00' }}>{(data.currentShip.rebuy || 0).toLocaleString()} CR</span></div>
                  </div>
                </div>
              ) : <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>No ship data</p>}
            </HoloPanel>
            <HoloPanel title="Fleet Summary">
              <div style={{ textAlign: 'center', padding: 16 }}>
                <div style={{ fontSize: 28, fontFamily: 'var(--font-display)', color: 'var(--color-accent-bright)' }}>{data.storedShips?.length || 0}</div>
                <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Stored Ships</div>
                <div style={{ fontSize: 16, fontFamily: 'var(--font-display)', color: '#4488cc' }}>{(data.fleetValue || 0).toLocaleString()} CR</div>
                <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Total Fleet Value</div>
              </div>
            </HoloPanel>
          </div>
          <HoloPanel title="Stored Ships">
            {data.storedShips?.length > 0 ? data.storedShips.map((s: any, i: number) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--color-border)' }}>
                <div>
                  <div style={{ fontSize: 13 }}>{s.name || s.type}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{s.type}{s.starSystem ? ` \u2022 ${s.starSystem}` : ''}</div>
                </div>
                <div style={{ textAlign: 'right', fontSize: 12 }}>
                  <div style={{ color: 'var(--color-accent-bright)' }}>{(s.value || 0).toLocaleString()} CR</div>
                  {s.transferTime && <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{Math.ceil(s.transferTime / 60)} min transfer</div>}
                </div>
              </div>
            )) : <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>No stored ships</p>}
          </HoloPanel>
        </>
      )}
    </div>
  );
}
