import { useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { useGameState } from '../hooks/useGameState';
import HoloPanel from '../components/common/HoloPanel';
import HoloProgress from '../components/common/HoloProgress';
import HoloBadge from '../components/common/HoloBadge';
import HoloTable from '../components/common/HoloTable';

function InfoTag({ children }: { children: string }) {
  return (
    <div style={{
      fontSize: 13, color: 'var(--color-text-muted)', fontStyle: 'italic',
      padding: '6px 0 10px', borderBottom: '1px solid var(--color-border)', marginBottom: 10,
    }}>
      {children}
    </div>
  );
}

export default function Ships() {
  const { data, loading, fetch: load } = useApi<any>('/ships');
  const gameState = useGameState();

  useEffect(() => { load(); const t = setInterval(load, 5000); return () => clearInterval(t); }, [load]);

  if (!data && loading) {
    return (
      <div className="page">
        <p style={{ color: 'var(--color-text-muted)', fontSize: 16 }}>Loading fleet data...</p>
      </div>
    );
  }

  const current = data?.currentShip;
  const stored: any[] = data?.storedShips || [];
  const fleetSize = data?.fleetSize || 0;
  const totalFleetValue = data?.totalFleetValue || 0;

  // Use gameState ship for real-time hull/fuel updates when available
  const liveShip = gameState?.ship;
  const hullHealth = liveShip?.hullHealth ?? current?.hullHealth;
  const fuel = liveShip?.fuel ?? current?.fuel;

  return (
    <div className="page">
      <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-accent-bright)', letterSpacing: 3, marginBottom: 8, fontSize: 28 }}>FLEET</h1>
      <p style={{ color: 'var(--color-text-muted)', fontSize: 15, marginBottom: 24 }}>
        Your fleet of ships across the galaxy. Tracks your active vessel and all stored ships with their locations, values, and transfer status.
      </p>

      {/* Fleet Overview Stats */}
      <div className="grid-3" style={{ gap: 16, marginBottom: 20 }}>
        <HoloPanel title="Fleet Size">
          <div style={{ textAlign: 'center', padding: 12 }}>
            <div style={{ fontSize: 36, fontFamily: 'var(--font-display)', color: 'var(--color-accent-bright)' }}>{fleetSize}</div>
            <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }}>Total Ships</div>
          </div>
        </HoloPanel>
        <HoloPanel title="Total Fleet Value">
          <div style={{ textAlign: 'center', padding: 12 }}>
            <div style={{ fontSize: 22, fontFamily: 'var(--font-display)', color: 'var(--color-accent-bright)' }}>{totalFleetValue.toLocaleString()}</div>
            <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }}>Credits</div>
          </div>
        </HoloPanel>
        <HoloPanel title="Stored Ships">
          <div style={{ textAlign: 'center', padding: 12 }}>
            <div style={{ fontSize: 36, fontFamily: 'var(--font-display)', color: '#4488cc' }}>{stored.length}</div>
            <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }}>At Various Stations</div>
          </div>
        </HoloPanel>
      </div>

      {/* Current Ship Detail */}
      <div className="grid-2" style={{ gap: 16, marginBottom: 20 }}>
        <HoloPanel title="Active Ship">
          <InfoTag>Your currently boarded vessel. Hull, fuel, and cargo update in real-time from journal events.</InfoTag>
          {current ? (
            <div style={{ padding: 4 }}>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 22, fontFamily: 'var(--font-display)', color: 'var(--color-accent-bright)', marginBottom: 4 }}>
                  {current.name || current.displayName}
                </div>
                {current.name && (
                  <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{current.displayName}</div>
                )}
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
                  {current.ident || 'No Ident'}
                </div>
              </div>

              <div style={{ fontSize: 13, lineHeight: 2 }}>
                <div>
                  <span style={{ color: 'var(--color-text-muted)' }}>Ship ID:</span>{' '}
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{current.shipId ?? 'N/A'}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--color-text-muted)' }}>Hull Value:</span>{' '}
                  <span>{(current.hullValue || 0).toLocaleString()} CR</span>
                </div>
                <div>
                  <span style={{ color: 'var(--color-text-muted)' }}>Modules Value:</span>{' '}
                  <span>{(current.modulesValue || 0).toLocaleString()} CR</span>
                </div>
                <div>
                  <span style={{ color: 'var(--color-text-muted)' }}>Total Value:</span>{' '}
                  <span style={{ color: 'var(--color-accent-bright)', fontSize: 15 }}>
                    {((current.hullValue || 0) + (current.modulesValue || 0)).toLocaleString()} CR
                  </span>
                </div>
                <div>
                  <span style={{ color: 'var(--color-text-muted)' }}>Rebuy Cost:</span>{' '}
                  <span style={{ color: '#ffaa00' }}>{(current.rebuy || 0).toLocaleString()} CR</span>
                </div>
                <div>
                  <span style={{ color: 'var(--color-text-muted)' }}>Modules Installed:</span>{' '}
                  <span>{current.modules || 0}</span>
                </div>
              </div>
            </div>
          ) : (
            <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>No ship data available. Board a ship to populate.</p>
          )}
        </HoloPanel>

        <HoloPanel title="Ship Health & Resources">
          <InfoTag>Real-time hull integrity, fuel reserves, and cargo utilisation for your active vessel.</InfoTag>
          {current ? (
            <div style={{ padding: 4 }}>
              {/* Hull Health */}
              <div style={{ marginBottom: 16 }}>
                <HoloProgress
                  value={hullHealth != null ? hullHealth * 100 : 100}
                  max={100}
                  label="Hull Integrity"
                  color={hullHealth != null && hullHealth < 0.5 ? 'var(--color-danger)' : hullHealth != null && hullHealth < 0.8 ? 'var(--color-warning)' : 'var(--color-accent)'}
                  height={10}
                />
              </div>

              {/* Fuel */}
              <div style={{ marginBottom: 16 }}>
                {fuel ? (
                  <HoloProgress
                    value={typeof fuel === 'object' ? (fuel.main || 0) : (fuel || 0)}
                    max={typeof fuel === 'object' ? (fuel.mainCapacity || 32) : 32}
                    label="Fuel Level"
                    height={10}
                  />
                ) : (
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Fuel data unavailable</div>
                )}
              </div>

              {/* Cargo */}
              <div style={{ marginBottom: 16 }}>
                <HoloProgress
                  value={current.cargo || 0}
                  max={current.cargoCapacity || 1}
                  label="Cargo Hold"
                  height={10}
                />
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>
                  {current.cargo || 0} / {current.cargoCapacity || 0} tonnes
                </div>
              </div>

              {/* Quick stats row */}
              <div style={{ display: 'flex', gap: 16, marginTop: 20 }}>
                {[
                  { label: 'Hull', value: hullHealth != null ? `${(hullHealth * 100).toFixed(0)}%` : '?' },
                  { label: 'Fuel', value: fuel ? `${(typeof fuel === 'object' ? fuel.main : fuel)?.toFixed(1) || '?'}t` : '?' },
                  { label: 'Cargo', value: `${current.cargo || 0}t` },
                ].map((stat) => (
                  <div key={stat.label} style={{ textAlign: 'center', flex: 1, padding: 8, background: 'var(--color-bg-tertiary)', borderRadius: 4 }}>
                    <div style={{ fontSize: 18, fontFamily: 'var(--font-display)', color: 'var(--color-accent-bright)' }}>{stat.value}</div>
                    <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>No ship data available.</p>
          )}
        </HoloPanel>
      </div>

      {/* Stored Ships Table */}
      <HoloPanel title="Stored Ships">
        <InfoTag>All ships stored at stations across the galaxy. Lists location, value, and current transfer status. Updated when you visit a station with a shipyard.</InfoTag>
        <HoloTable
          columns={[
            {
              key: 'name',
              header: 'Ship',
              render: (s: any) => (
                <div>
                  <div style={{ fontSize: 13, color: '#fff' }}>{s.name || s.displayName}</div>
                  {s.name && <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{s.displayName}</div>}
                </div>
              ),
            },
            {
              key: 'location',
              header: 'Location',
              render: (s: any) => (
                <div>
                  <div style={{ fontSize: 12 }}>{s.system || 'Unknown'}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{s.station || ''}</div>
                </div>
              ),
            },
            {
              key: 'value',
              header: 'Value',
              align: 'right' as const,
              render: (s: any) => (
                <span style={{ color: 'var(--color-accent-bright)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                  {(s.value || 0).toLocaleString()} CR
                </span>
              ),
            },
            {
              key: 'status',
              header: 'Status',
              align: 'center' as const,
              render: (s: any) => (
                <div style={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap' }}>
                  {s.hot && <HoloBadge variant="danger">Hot</HoloBadge>}
                  {s.inTransit && <HoloBadge variant="warning">In Transit</HoloBadge>}
                  {!s.hot && !s.inTransit && <HoloBadge variant="success">Ready</HoloBadge>}
                </div>
              ),
            },
          ]}
          data={stored}
          rowKey={(s: any, i: number) => `${s.shipId || i}`}
          emptyMessage="No stored ships. Visit a station with a shipyard to see your stored fleet."
        />
      </HoloPanel>
    </div>
  );
}
