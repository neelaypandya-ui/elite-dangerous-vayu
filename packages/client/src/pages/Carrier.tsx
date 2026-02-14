import { useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import HoloPanel from '../components/common/HoloPanel';
import HoloProgress from '../components/common/HoloProgress';

export default function Carrier() {
  const { data, loading, fetch: load } = useApi<any>('/carrier');
  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, [load]);

  const state = data?.state;

  return (
    <div className="page">
      <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-accent-bright)', letterSpacing: 3, marginBottom: 20 }}>FLEET CARRIER</h1>
      {loading && <p style={{ color: 'var(--color-text-muted)' }}>Loading...</p>}
      {data && !state && <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>No fleet carrier data available</p>}
      {state && (
        <>
          <div className="grid-2" style={{ gap: 16, marginBottom: 20 }}>
            <HoloPanel title="Carrier Status">
              <div style={{ padding: 8, fontSize: 13, lineHeight: 1.8 }}>
                <div style={{ fontSize: 20, fontFamily: 'var(--font-display)', color: 'var(--color-accent-bright)', marginBottom: 8 }}>{state.name || 'Fleet Carrier'}</div>
                <div><span style={{ color: 'var(--color-text-muted)' }}>Callsign:</span> {state.callsign || 'N/A'}</div>
                <div><span style={{ color: 'var(--color-text-muted)' }}>Location:</span> {state.currentSystem || 'Unknown'}</div>
                <div><span style={{ color: 'var(--color-text-muted)' }}>Docking:</span> {state.dockingAccess || 'All'}</div>
              </div>
            </HoloPanel>
            <HoloPanel title="Finances">
              <div style={{ padding: 8, fontSize: 13, lineHeight: 1.8 }}>
                <div><span style={{ color: 'var(--color-text-muted)' }}>Balance:</span> <span style={{ color: 'var(--color-accent-bright)' }}>{(state.balance || 0).toLocaleString()} CR</span></div>
                <div><span style={{ color: 'var(--color-text-muted)' }}>Weekly Upkeep:</span> <span style={{ color: (data.upkeep?.warning ? '#ffaa00' : '#fff') }}>{(data.upkeep?.weeklyTotal || 0).toLocaleString()} CR</span></div>
                {data.upkeep?.weeksRemaining != null && (
                  <div><span style={{ color: 'var(--color-text-muted)' }}>Weeks of Fuel:</span> <span style={{ color: data.upkeep.weeksRemaining < 4 ? '#ff4444' : '#fff' }}>{data.upkeep.weeksRemaining}</span></div>
                )}
              </div>
            </HoloPanel>
          </div>
          <div className="grid-2" style={{ gap: 16, marginBottom: 20 }}>
            <HoloPanel title="Tritium Fuel">
              <div style={{ padding: 8 }}>
                <HoloProgress value={state.fuelLevel || 0} max={state.fuelCapacity || 1000} label={`${state.fuelLevel || 0} / ${state.fuelCapacity || 1000}t`} />
                {data.fuelCalc && (
                  <div style={{ marginTop: 8, fontSize: 12, color: 'var(--color-text-muted)' }}>
                    Est. jumps remaining: <span style={{ color: 'var(--color-accent-bright)' }}>{data.fuelCalc.jumpsRemaining || 0}</span>
                  </div>
                )}
              </div>
            </HoloPanel>
            <HoloPanel title="Services">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: 8 }}>
                {(state.services || ['Refuel', 'Repair', 'Shipyard', 'Outfitting', 'Commodities']).map((s: string) => (
                  <span key={s} style={{ fontSize: 11, padding: '4px 8px', background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', color: 'var(--color-accent-bright)' }}>{s}</span>
                ))}
              </div>
            </HoloPanel>
          </div>
          <HoloPanel title="Jump History">
            {data.jumps?.length > 0 ? data.jumps.map((j: any, i: number) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)', fontSize: 13 }}>
                <span>{j.system}</span>
                <span style={{ color: 'var(--color-text-muted)', fontSize: 11 }}>{j.timestamp ? new Date(j.timestamp).toLocaleString() : ''}</span>
              </div>
            )) : <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>No jump history</p>}
          </HoloPanel>
        </>
      )}
    </div>
  );
}
