import { useEffect, useState, useCallback } from 'react';
import { useApi, apiFetch } from '../hooks/useApi';
import { useGameState } from '../hooks/useGameState';
import HoloPanel from '../components/common/HoloPanel';
import HoloProgress from '../components/common/HoloProgress';
import HoloBadge from '../components/common/HoloBadge';
import HoloTable from '../components/common/HoloTable';
import HoloButton from '../components/common/HoloButton';

interface CarrierService {
  role: string;
  activated: boolean;
  enabled: boolean;
  crewName: string | null;
}

interface CarrierJumpRecord {
  timestamp: string;
  fromSystem: string;
  toSystem: string;
  body: string;
  distance: number;
  fuelUsed: number;
}

interface CarrierTradeOrder {
  commodity: string;
  commodityLocalised: string | null;
  purchaseOrder: number;
  saleOrder: number;
  blackMarket: boolean;
}

interface SpaceUsage {
  totalCapacity: number;
  crew: number;
  cargo: number;
  cargoSpaceReserved: number;
  shipPacks: number;
  modulePacks: number;
  freeSpace: number;
}

interface CarrierFinance {
  carrierBalance: number;
  reserveBalance: number;
  availableBalance: number;
  reservePercent: number;
  taxRates: {
    rearm: number;
    refuel: number;
    repair: number;
    pioneerSupplies: number;
    shipyard: number;
    outfitting: number;
  };
}

interface FuelCalcResult {
  distance: number;
  currentFuel: number;
  fuelCapacity: number;
  jumpRangeCurr: number;
  jumpRangeMax: number;
  estimatedFuelPerJump: number;
  jumpsNeeded: number;
  totalFuelRequired: number;
  hasSufficientFuel: boolean;
  fuelDeficit: number;
}

interface UpkeepInfo {
  warning: boolean;
  message: string;
  balance: number;
  weeklyUpkeep: number;
}

interface CarrierData {
  carrierId: number;
  callsign: string;
  name: string;
  dockingAccess: string;
  allowNotorious: boolean;
  fuelLevel: number;
  jumpRangeCurr: number;
  jumpRangeMax: number;
  pendingDecommission: boolean;
  spaceUsage: SpaceUsage;
  finance: CarrierFinance;
  services: CarrierService[];
  shipPacks: Array<{ theme: string; tier: number }>;
  modulePacks: Array<{ theme: string; tier: number }>;
  tradeOrders: CarrierTradeOrder[];
  jumpHistory: CarrierJumpRecord[];
  currentSystem: string | null;
  currentBody: string | null;
  upkeep: UpkeepInfo;
  totalJumps: number;
  totalDistance: number;
}

const DOCKING_LABELS: Record<string, string> = {
  all: 'Open to All',
  squadronfriends: 'Squadron & Friends',
  friends: 'Friends Only',
  none: 'Locked',
};

const SERVICE_DISPLAY: Record<string, string> = {
  BlackMarket: 'Black Market',
  Exploration: 'Universal Cartographics',
  FuelRat: 'Tritium Depot',
  VoucherRedemption: 'Redemption Office',
  Refuel: 'Refuel',
  Repair: 'Repair',
  Rearm: 'Rearm',
  Commodities: 'Commodities Market',
  Shipyard: 'Shipyard',
  Outfitting: 'Outfitting',
  PioneerSupplies: 'Pioneer Supplies',
  VistaGenomics: 'Vista Genomics',
  Bartender: 'Bartender',
  SearchAndRescue: 'Search & Rescue',
};

export default function Carrier() {
  const { data, loading, fetch: load } = useApi<CarrierData>('/carrier');
  const gameState = useGameState();

  const [fuelCalcDistance, setFuelCalcDistance] = useState('');
  const [fuelCalcResult, setFuelCalcResult] = useState<FuelCalcResult | null>(null);
  const [fuelCalcLoading, setFuelCalcLoading] = useState(false);

  useEffect(() => { load(); const t = setInterval(load, 5000); return () => clearInterval(t); }, [load]);

  const handleFuelCalc = useCallback(async () => {
    const dist = parseFloat(fuelCalcDistance);
    if (isNaN(dist) || dist <= 0) return;
    setFuelCalcLoading(true);
    try {
      const result = await apiFetch<FuelCalcResult>(`/carrier/fuel-calc?distance=${dist}`);
      setFuelCalcResult(result);
    } catch {
      setFuelCalcResult(null);
    } finally {
      setFuelCalcLoading(false);
    }
  }, [fuelCalcDistance]);

  if (!data && loading) {
    return (
      <div className="page">
        <p style={{ color: 'var(--color-text-muted)', fontSize: 16 }}>Loading carrier data...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="page">
        <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-accent-bright)', letterSpacing: 3, marginBottom: 20 }}>FLEET CARRIER</h1>
        <HoloPanel title="No Carrier Data">
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
            No fleet carrier data available. Purchase a fleet carrier from a station with a carrier vendor,
            or ensure your journal files contain carrier events.
          </p>
        </HoloPanel>
      </div>
    );
  }

  const activeServices = data.services.filter(s => s.activated);
  const inactiveServices = data.services.filter(s => !s.activated);
  const space = data.spaceUsage;
  const finance = data.finance;
  const usedSpace = space.totalCapacity - space.freeSpace;

  const jumpColumns = [
    {
      key: 'timestamp',
      header: 'Date',
      render: (j: CarrierJumpRecord) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text-muted)' }}>
          {new Date(j.timestamp).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'fromSystem',
      header: 'From',
      render: (j: CarrierJumpRecord) => <span>{j.fromSystem}</span>,
    },
    {
      key: 'toSystem',
      header: 'To',
      render: (j: CarrierJumpRecord) => (
        <span style={{ color: 'var(--color-accent-bright)' }}>{j.toSystem}</span>
      ),
    },
    {
      key: 'distance',
      header: 'Distance',
      align: 'right' as const,
      render: (j: CarrierJumpRecord) => (
        <span style={{ fontFamily: 'var(--font-mono)' }}>{j.distance.toFixed(1)} LY</span>
      ),
    },
    {
      key: 'fuelUsed',
      header: 'Fuel Used',
      align: 'right' as const,
      render: (j: CarrierJumpRecord) => (
        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>{j.fuelUsed}t</span>
      ),
    },
  ];

  const tradeColumns = [
    {
      key: 'commodity',
      header: 'Commodity',
      render: (o: CarrierTradeOrder) => (
        <span>
          {o.commodityLocalised || o.commodity}
          {o.blackMarket && <HoloBadge variant="danger" style={{ marginLeft: 6 }}>BM</HoloBadge>}
        </span>
      ),
    },
    {
      key: 'purchaseOrder',
      header: 'Buy Price',
      align: 'right' as const,
      render: (o: CarrierTradeOrder) => (
        <span style={{ fontFamily: 'var(--font-mono)', color: o.purchaseOrder > 0 ? 'var(--color-accent-bright)' : 'var(--color-text-muted)' }}>
          {o.purchaseOrder > 0 ? `${o.purchaseOrder.toLocaleString()} CR` : '--'}
        </span>
      ),
    },
    {
      key: 'saleOrder',
      header: 'Sell Price',
      align: 'right' as const,
      render: (o: CarrierTradeOrder) => (
        <span style={{ fontFamily: 'var(--font-mono)', color: o.saleOrder > 0 ? 'var(--color-accent-bright)' : 'var(--color-text-muted)' }}>
          {o.saleOrder > 0 ? `${o.saleOrder.toLocaleString()} CR` : '--'}
        </span>
      ),
    },
  ];

  return (
    <div className="page">
      <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-accent-bright)', letterSpacing: 3, marginBottom: 8, fontSize: 28 }}>FLEET CARRIER</h1>
      <p style={{ color: 'var(--color-text-muted)', fontSize: 15, marginBottom: 24 }}>
        Fleet carrier management console. Monitors fuel, finances, services, and jump history. Refreshes every 5 seconds.
      </p>

      {/* Decommission Warning */}
      {data.pendingDecommission && (
        <div style={{
          padding: '10px 16px',
          marginBottom: 16,
          background: 'rgba(255, 68, 68, 0.1)',
          border: '1px solid var(--color-danger)',
          borderRadius: 4,
          fontSize: 13,
          color: 'var(--color-danger)',
          fontFamily: 'var(--font-display)',
          letterSpacing: 1,
        }}>
          WARNING: Carrier decommission is pending. Cancel via in-game carrier management if unintended.
        </div>
      )}

      {/* Carrier Identity & Location */}
      <div className="grid-2" style={{ gap: 16, marginBottom: 20 }}>
        <HoloPanel title="Carrier Status">
          <div style={{ fontSize: 14, lineHeight: 2 }}>
            <div style={{
              fontSize: 22,
              fontFamily: 'var(--font-display)',
              color: 'var(--color-accent-bright)',
              marginBottom: 6,
              letterSpacing: 2,
            }}>
              {data.name || 'Fleet Carrier'}
            </div>
            <div>
              <span style={{ color: 'var(--color-text-muted)' }}>Callsign:</span>{' '}
              <span style={{ fontFamily: 'var(--font-mono)', letterSpacing: 1 }}>{data.callsign}</span>
            </div>
            <div>
              <span style={{ color: 'var(--color-text-muted)' }}>System:</span>{' '}
              <strong>{data.currentSystem || 'Unknown'}</strong>
            </div>
            {data.currentBody && (
              <div>
                <span style={{ color: 'var(--color-text-muted)' }}>Body:</span> {data.currentBody}
              </div>
            )}
            <div>
              <span style={{ color: 'var(--color-text-muted)' }}>Docking:</span>{' '}
              <HoloBadge variant={data.dockingAccess === 'all' ? 'success' : data.dockingAccess === 'none' ? 'danger' : 'warning'}>
                {DOCKING_LABELS[data.dockingAccess] || data.dockingAccess}
              </HoloBadge>
              {data.allowNotorious && (
                <HoloBadge variant="warning" style={{ marginLeft: 6 }}>Notorious OK</HoloBadge>
              )}
            </div>
          </div>
        </HoloPanel>

        <HoloPanel title="Finances">
          <div style={{ fontSize: 14, lineHeight: 2 }}>
            <div>
              <span style={{ color: 'var(--color-text-muted)' }}>Carrier Balance:</span>{' '}
              <span style={{ color: 'var(--color-accent-bright)', fontFamily: 'var(--font-mono)', fontSize: 16 }}>
                {finance.carrierBalance.toLocaleString()} CR
              </span>
            </div>
            <div>
              <span style={{ color: 'var(--color-text-muted)' }}>Available:</span>{' '}
              <span style={{ fontFamily: 'var(--font-mono)' }}>{finance.availableBalance.toLocaleString()} CR</span>
            </div>
            <div>
              <span style={{ color: 'var(--color-text-muted)' }}>Reserve:</span>{' '}
              <span style={{ fontFamily: 'var(--font-mono)' }}>
                {finance.reserveBalance.toLocaleString()} CR ({finance.reservePercent}%)
              </span>
            </div>
            <div>
              <span style={{ color: 'var(--color-text-muted)' }}>Weekly Upkeep:</span>{' '}
              <span style={{
                fontFamily: 'var(--font-mono)',
                color: data.upkeep.warning ? '#ff4444' : 'var(--color-text-primary)',
              }}>
                {data.upkeep.weeklyUpkeep.toLocaleString()} CR
              </span>
            </div>
            <div style={{
              fontSize: 12,
              color: data.upkeep.warning ? '#ff4444' : 'var(--color-text-muted)',
              marginTop: 4,
              fontStyle: 'italic',
            }}>
              {data.upkeep.message}
            </div>
          </div>
        </HoloPanel>
      </div>

      {/* Fuel & Space */}
      <div className="grid-2" style={{ gap: 16, marginBottom: 20 }}>
        <HoloPanel title="Tritium Fuel">
          <div style={{ marginBottom: 12 }}>
            <HoloProgress
              value={data.fuelLevel}
              max={1000}
              label={`${data.fuelLevel} / 1000t`}
              height={10}
            />
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.8, color: 'var(--color-text-muted)' }}>
            <div>
              <span>Jump Range:</span>{' '}
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-accent-bright)' }}>
                {data.jumpRangeCurr.toFixed(1)} LY
              </span>
              <span style={{ color: 'var(--color-text-muted)' }}> / {data.jumpRangeMax} LY max</span>
            </div>
            <div>
              <span>Total Jumps:</span>{' '}
              <span style={{ fontFamily: 'var(--font-mono)' }}>{data.totalJumps}</span>
            </div>
            <div>
              <span>Total Distance:</span>{' '}
              <span style={{ fontFamily: 'var(--font-mono)' }}>{data.totalDistance.toFixed(1)} LY</span>
            </div>
          </div>

          {/* Fuel Calculator */}
          <div style={{
            marginTop: 14,
            paddingTop: 12,
            borderTop: '1px solid var(--color-border)',
          }}>
            <div style={{
              fontSize: 11,
              fontFamily: 'var(--font-display)',
              color: 'var(--color-text-muted)',
              letterSpacing: 1,
              textTransform: 'uppercase',
              marginBottom: 8,
            }}>
              Fuel Calculator
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 8 }}>
              <input
                type="number"
                placeholder="Distance in LY"
                value={fuelCalcDistance}
                onChange={(e) => setFuelCalcDistance(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleFuelCalc(); }}
                style={{
                  padding: '5px 10px',
                  fontSize: 12,
                  fontFamily: 'var(--font-mono)',
                  background: 'var(--color-bg-tertiary)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-primary)',
                  borderRadius: 2,
                  width: 130,
                }}
              />
              <HoloButton
                variant="secondary"
                onClick={handleFuelCalc}
                disabled={fuelCalcLoading}
                style={{ fontSize: 10, padding: '4px 10px' }}
              >
                {fuelCalcLoading ? '...' : 'Calculate'}
              </HoloButton>
            </div>
            {fuelCalcResult && (
              <div style={{ fontSize: 12, lineHeight: 1.8 }}>
                <div>
                  <span style={{ color: 'var(--color-text-muted)' }}>Jumps needed:</span>{' '}
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{fuelCalcResult.jumpsNeeded}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--color-text-muted)' }}>Fuel per jump:</span>{' '}
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{fuelCalcResult.estimatedFuelPerJump}t</span>
                </div>
                <div>
                  <span style={{ color: 'var(--color-text-muted)' }}>Total fuel:</span>{' '}
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    color: fuelCalcResult.hasSufficientFuel ? 'var(--color-accent-bright)' : '#ff4444',
                  }}>
                    {fuelCalcResult.totalFuelRequired}t
                  </span>
                </div>
                {!fuelCalcResult.hasSufficientFuel && (
                  <div style={{ color: '#ff4444', marginTop: 4 }}>
                    Deficit: {fuelCalcResult.fuelDeficit}t -- insufficient fuel for this journey.
                  </div>
                )}
                {fuelCalcResult.hasSufficientFuel && (
                  <div style={{ color: 'var(--color-accent-bright)', marginTop: 4 }}>
                    Sufficient fuel available.
                  </div>
                )}
              </div>
            )}
          </div>
        </HoloPanel>

        <HoloPanel title="Cargo Space">
          <div style={{ marginBottom: 12 }}>
            <HoloProgress
              value={usedSpace}
              max={space.totalCapacity || 1}
              label={`${usedSpace.toLocaleString()} / ${space.totalCapacity.toLocaleString()}t used`}
              height={10}
            />
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.8 }}>
            {[
              ['Cargo', space.cargo],
              ['Reserved', space.cargoSpaceReserved],
              ['Crew', space.crew],
              ['Ship Packs', space.shipPacks],
              ['Module Packs', space.modulePacks],
              ['Free', space.freeSpace],
            ].map(([label, val]) => (
              <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>{label}:</span>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  color: label === 'Free'
                    ? 'var(--color-accent-bright)'
                    : 'var(--color-text-primary)',
                }}>
                  {(val as number).toLocaleString()}t
                </span>
              </div>
            ))}
          </div>

          {/* Tax Rates */}
          <div style={{
            marginTop: 14,
            paddingTop: 12,
            borderTop: '1px solid var(--color-border)',
          }}>
            <div style={{
              fontSize: 11,
              fontFamily: 'var(--font-display)',
              color: 'var(--color-text-muted)',
              letterSpacing: 1,
              textTransform: 'uppercase',
              marginBottom: 8,
            }}>
              Tariff Rates
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px', fontSize: 12 }}>
              {Object.entries(finance.taxRates).map(([key, rate]) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>{key}:</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{rate}%</span>
                </div>
              ))}
            </div>
          </div>
        </HoloPanel>
      </div>

      {/* Services */}
      <div style={{ marginBottom: 20 }}>
        <HoloPanel title="Services">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
            {activeServices.map((s) => (
              <div key={s.role} style={{
                padding: '8px 12px',
                background: 'var(--color-bg-tertiary)',
                border: `1px solid ${s.enabled ? 'var(--color-accent)' : 'var(--color-warning)'}`,
                borderRadius: 4,
                fontSize: 12,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <span style={{ color: s.enabled ? 'var(--color-accent-bright)' : 'var(--color-warning)' }}>
                  {SERVICE_DISPLAY[s.role] || s.role}
                </span>
                <HoloBadge variant={s.enabled ? 'success' : 'warning'}>
                  {s.enabled ? 'Active' : 'Suspended'}
                </HoloBadge>
              </div>
            ))}
          </div>
          {inactiveServices.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 6 }}>Not Installed:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {inactiveServices.map((s) => (
                  <span key={s.role} style={{
                    fontSize: 11,
                    padding: '3px 8px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 2,
                    color: 'var(--color-text-muted)',
                  }}>
                    {SERVICE_DISPLAY[s.role] || s.role}
                  </span>
                ))}
              </div>
            </div>
          )}
        </HoloPanel>
      </div>

      {/* Trade Orders */}
      {data.tradeOrders.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <HoloPanel title="Trade Orders">
            <HoloTable<CarrierTradeOrder>
              columns={tradeColumns}
              data={data.tradeOrders}
              rowKey={(o, i) => `${o.commodity}-${i}`}
              emptyMessage="No active trade orders"
            />
          </HoloPanel>
        </div>
      )}

      {/* Packs */}
      {(data.shipPacks.length > 0 || data.modulePacks.length > 0) && (
        <div className="grid-2" style={{ gap: 16, marginBottom: 20 }}>
          {data.shipPacks.length > 0 && (
            <HoloPanel title="Ship Packs">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {data.shipPacks.map((p, i) => (
                  <div key={i} style={{
                    padding: '6px 10px',
                    background: 'var(--color-bg-tertiary)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 3,
                    fontSize: 12,
                  }}>
                    <span style={{ color: 'var(--color-accent-bright)' }}>{p.theme}</span>
                    <span style={{ color: 'var(--color-text-muted)', marginLeft: 6 }}>Tier {p.tier}</span>
                  </div>
                ))}
              </div>
            </HoloPanel>
          )}
          {data.modulePacks.length > 0 && (
            <HoloPanel title="Module Packs">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {data.modulePacks.map((p, i) => (
                  <div key={i} style={{
                    padding: '6px 10px',
                    background: 'var(--color-bg-tertiary)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 3,
                    fontSize: 12,
                  }}>
                    <span style={{ color: 'var(--color-accent-bright)' }}>{p.theme}</span>
                    <span style={{ color: 'var(--color-text-muted)', marginLeft: 6 }}>Tier {p.tier}</span>
                  </div>
                ))}
              </div>
            </HoloPanel>
          )}
        </div>
      )}

      {/* Jump History */}
      <HoloPanel title="Jump History">
        <HoloTable<CarrierJumpRecord>
          columns={jumpColumns}
          data={data.jumpHistory}
          rowKey={(j, i) => `${j.timestamp}-${i}`}
          emptyMessage="No jump history recorded"
        />
      </HoloPanel>
    </div>
  );
}
