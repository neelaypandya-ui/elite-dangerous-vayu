import { useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import HoloPanel from '../components/common/HoloPanel';

const slotColor = (s: string) => s?.includes('Huge') ? '#ff4444' : s?.includes('Large') ? '#ffaa00' : s?.includes('Medium') ? '#4488cc' : 'var(--color-text-muted)';

export default function Outfitting() {
  const { data, loading, fetch: load } = useApi<any>('/outfitting');
  useEffect(() => { load(); }, [load]);

  const loadout = data?.loadout;

  return (
    <div className="page">
      <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-accent-bright)', letterSpacing: 3, marginBottom: 20 }}>OUTFITTING</h1>
      {loading && <p style={{ color: 'var(--color-text-muted)' }}>Loading...</p>}
      {data && !loadout && <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>No loadout data. Dock at a station to sync.</p>}
      {loadout && (
        <>
          <HoloPanel title={loadout.shipName || loadout.ship || 'Current Ship'}>
            <div style={{ fontSize: 13, marginBottom: 8 }}>
              {loadout.ship && <span style={{ color: 'var(--color-text-muted)' }}>{loadout.ship}</span>}
              {loadout.shipIdent && <span style={{ color: 'var(--color-text-muted)', marginLeft: 8 }}>[{loadout.shipIdent}]</span>}
              {loadout.hullValue != null && <span style={{ float: 'right', color: 'var(--color-accent-bright)' }}>Hull: {loadout.hullValue.toLocaleString()} CR</span>}
            </div>
          </HoloPanel>
          <div className="grid-2" style={{ gap: 16, marginTop: 16 }}>
            <HoloPanel title="Hardpoints">
              {loadout.hardpoints?.length > 0 ? loadout.hardpoints.map((m: any, i: number) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--color-border)', fontSize: 13 }}>
                  <div>
                    <div style={{ color: slotColor(m.slot) }}>{m.item || 'Empty'}</div>
                    <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{m.slot}</div>
                  </div>
                  {m.engineering && <span style={{ fontSize: 10, color: '#ffaa00' }}>G{m.engineering.level} {m.engineering.blueprint}</span>}
                </div>
              )) : <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>No hardpoints</p>}
            </HoloPanel>
            <HoloPanel title="Core Internals">
              {loadout.coreInternals?.length > 0 ? loadout.coreInternals.map((m: any, i: number) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--color-border)', fontSize: 13 }}>
                  <div>
                    <div>{m.item || 'Empty'}</div>
                    <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{m.slot}</div>
                  </div>
                  {m.engineering && <span style={{ fontSize: 10, color: '#ffaa00' }}>G{m.engineering.level}</span>}
                </div>
              )) : <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>No core data</p>}
            </HoloPanel>
          </div>
          <HoloPanel title="Optional Internals" style={{ marginTop: 16 }}>
            {loadout.optionalInternals?.length > 0 ? loadout.optionalInternals.map((m: any, i: number) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--color-border)', fontSize: 13 }}>
                <div>
                  <div>{m.item || 'Empty'}</div>
                  <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{m.slot}</div>
                </div>
                {m.engineering && <span style={{ fontSize: 10, color: '#ffaa00' }}>G{m.engineering.level} {m.engineering.blueprint}</span>}
              </div>
            )) : <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>No optional internals</p>}
          </HoloPanel>
        </>
      )}
    </div>
  );
}
