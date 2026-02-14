import { useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import HoloPanel from '../components/common/HoloPanel';
import HoloProgress from '../components/common/HoloProgress';

export default function Odyssey() {
  const { data, loading, fetch: load } = useApi<any>('/odyssey');
  useEffect(() => { load(); }, [load]);

  return (
    <div className="page">
      <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-accent-bright)', letterSpacing: 3, marginBottom: 20 }}>ODYSSEY</h1>
      {loading && <p style={{ color: 'var(--color-text-muted)' }}>Loading...</p>}
      {data && (
        <>
          <div className="grid-2" style={{ gap: 16, marginBottom: 20 }}>
            <HoloPanel title="Suits">
              {data.suits?.length > 0 ? data.suits.map((s: any, i: number) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
                  <div>
                    <div style={{ fontSize: 13 }}>{s.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Class {s.class || 1}</div>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--color-accent-bright)', fontFamily: 'var(--font-mono)' }}>Grade {s.grade || 1}</span>
                </div>
              )) : <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>No suit data</p>}
            </HoloPanel>
            <HoloPanel title="Loadouts">
              {data.loadouts?.length > 0 ? data.loadouts.map((l: any, i: number) => (
                <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: 13, color: 'var(--color-accent-bright)', marginBottom: 4 }}>{l.name || `Loadout ${i + 1}`}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                    {l.suit && <span>Suit: {l.suit} </span>}
                    {l.primaryWeapon && <span>\u2022 Primary: {l.primaryWeapon} </span>}
                    {l.secondaryWeapon && <span>\u2022 Secondary: {l.secondaryWeapon}</span>}
                  </div>
                </div>
              )) : <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>No loadouts configured</p>}
            </HoloPanel>
          </div>
          <div className="grid-2" style={{ gap: 16, marginBottom: 20 }}>
            <HoloPanel title="Backpack">
              {data.backpack && Object.keys(data.backpack).length > 0 ? Object.entries(data.backpack).map(([cat, items]) => (
                <div key={cat} style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 11, color: 'var(--color-accent-bright)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{cat}</div>
                  {(items as any[]).map((item: any, i: number) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 12, color: 'var(--color-text-muted)' }}>
                      <span>{item.name}</span><span>{item.count}</span>
                    </div>
                  ))}
                </div>
              )) : <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>Backpack empty</p>}
            </HoloPanel>
            <HoloPanel title="On-Foot Materials">
              {data.materials?.length > 0 ? data.materials.map((m: any, i: number) => (
                <div key={i} style={{ marginBottom: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 2 }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>{m.name}</span>
                    <span>{m.count}/{m.max || 50}</span>
                  </div>
                  <HoloProgress value={m.count} max={m.max || 50} />
                </div>
              )) : <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>No materials data</p>}
            </HoloPanel>
          </div>
          <HoloPanel title="Exobiology Scans">
            {data.scans?.length > 0 ? data.scans.map((s: any, i: number) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)', fontSize: 13 }}>
                <div>
                  <div>{s.species}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{s.system} \u2022 {s.body}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: 'var(--color-accent-bright)' }}>{(s.value || 0).toLocaleString()} CR</div>
                  <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{s.scans || 0}/3 samples</div>
                </div>
              </div>
            )) : <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>No exobiology scans</p>}
          </HoloPanel>
        </>
      )}
    </div>
  );
}
