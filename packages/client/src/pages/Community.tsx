import { useEffect, useState, useCallback } from 'react';
import { useApi, apiFetch } from '../hooks/useApi';
import { useGameState } from '../hooks/useGameState';
import HoloPanel from '../components/common/HoloPanel';
import HoloButton from '../components/common/HoloButton';
import HoloBadge from '../components/common/HoloBadge';
import HoloTable from '../components/common/HoloTable';

interface CommunityData {
  links: {
    edsm: { configured: boolean; commanderName: string | null; url: string | null };
    inara: { configured: boolean; commanderName: string | null; url: string | null };
  };
  profile: {
    source: string;
    name: string;
    url: string;
    credits: number;
    combatRank: string;
    tradeRank: string;
    explorationRank: string;
  };
}

interface EDSMSystem {
  name: string;
  id: number;
  coords?: { x: number; y: number; z: number };
  information?: {
    security?: string;
    economy?: string;
    population?: number;
    allegiance?: string;
    government?: string;
    faction?: string;
    factionState?: string;
  };
}

interface TrafficReport {
  id?: number;
  name?: string;
  traffic?: { total: number; week: number; day: number };
  breakdown?: Record<string, number>;
}

interface CommanderPosition {
  msgnum?: number;
  msg?: string;
  system?: string;
  firstDiscover?: boolean;
  date?: string;
  coordinates?: { x: number; y: number; z: number };
}

export default function Community() {
  const { data, loading, fetch: load } = useApi<CommunityData>('/community');
  const gameState = useGameState();

  // System search state
  const [systemSearch, setSystemSearch] = useState('');
  const [systemResult, setSystemResult] = useState<EDSMSystem | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);

  // Traffic report state
  const [trafficData, setTrafficData] = useState<TrafficReport | null>(null);
  const [trafficLoading, setTrafficLoading] = useState(false);

  // Commander position state
  const [cmdrPosition, setCmdrPosition] = useState<CommanderPosition | null>(null);
  const [cmdrPosLoading, setCmdrPosLoading] = useState(false);

  const loadData = useCallback(() => { load(); }, [load]);

  useEffect(() => {
    loadData();
    const t = setInterval(loadData, 30000);
    return () => clearInterval(t);
  }, [loadData]);

  // Fetch EDSM commander position on mount if configured
  useEffect(() => {
    if (data?.links?.edsm?.configured) {
      setCmdrPosLoading(true);
      apiFetch<CommanderPosition>('/community/edsm/commander')
        .then((pos) => setCmdrPosition(pos))
        .catch(() => setCmdrPosition(null))
        .finally(() => setCmdrPosLoading(false));
    }
  }, [data?.links?.edsm?.configured]);

  const searchSystem = async () => {
    if (!systemSearch.trim()) return;
    setSearching(true);
    setSearchError(null);
    setSystemResult(null);
    setTrafficData(null);
    try {
      const res = await apiFetch<EDSMSystem>(`/community/edsm/system/${encodeURIComponent(systemSearch)}`);
      setSystemResult(res);
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'System not found');
      setSystemResult(null);
    } finally {
      setSearching(false);
    }
  };

  const fetchTraffic = async (systemName: string) => {
    setTrafficLoading(true);
    try {
      const res = await apiFetch<TrafficReport>(`/community/edsm/traffic/${encodeURIComponent(systemName)}`);
      setTrafficData(res);
    } catch {
      setTrafficData(null);
    } finally {
      setTrafficLoading(false);
    }
  };

  const profile = data?.profile;
  const links = data?.links;
  const currentSystem = gameState?.location?.system;

  // Quick-search current system
  const searchCurrentSystem = () => {
    if (currentSystem) {
      setSystemSearch(currentSystem);
      setSearching(true);
      setSearchError(null);
      setSystemResult(null);
      setTrafficData(null);
      apiFetch<EDSMSystem>(`/community/edsm/system/${encodeURIComponent(currentSystem)}`)
        .then((res) => setSystemResult(res))
        .catch(() => setSearchError('System not found on EDSM'))
        .finally(() => setSearching(false));
    }
  };

  if (!data && loading) {
    return (
      <div className="page">
        <p style={{ color: 'var(--color-text-muted)', fontSize: 16 }}>Loading community data...</p>
      </div>
    );
  }

  const rankRows = profile ? [
    { rank: 'Combat', value: profile.combatRank },
    { rank: 'Trade', value: profile.tradeRank },
    { rank: 'Exploration', value: profile.explorationRank },
  ] : [];

  return (
    <div className="page">
      <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-accent-bright)', letterSpacing: 3, marginBottom: 8 }}>COMMUNITY</h1>
      <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginBottom: 24 }}>
        External integrations with EDSM and Inara. Look up system data, view traffic reports, and check your commander profile.
      </p>

      {/* Row 1: Commander Profile + Integration Status */}
      <div className="grid-2" style={{ gap: 16, marginBottom: 20 }}>
        <HoloPanel title="Commander Profile">
          {profile ? (
            <div>
              <div style={{ fontSize: 20, fontFamily: 'var(--font-display)', color: 'var(--color-accent-bright)', marginBottom: 12 }}>
                {profile.name || 'Unknown Commander'}
              </div>
              <div style={{ fontSize: 14, lineHeight: 2, marginBottom: 16 }}>
                <div>
                  <span style={{ color: 'var(--color-text-muted)' }}>Credits:</span>{' '}
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 15 }}>{(profile.credits || 0).toLocaleString()} CR</span>
                </div>
                <div>
                  <span style={{ color: 'var(--color-text-muted)' }}>Data Source:</span>{' '}
                  <HoloBadge variant="info">{profile.source}</HoloBadge>
                </div>
              </div>
              <HoloTable
                columns={[
                  { key: 'rank', header: 'Discipline', width: '40%' },
                  { key: 'value', header: 'Rank', render: (r) => (
                    <span style={{ color: 'var(--color-accent-bright)', fontFamily: 'var(--font-display)' }}>{r.value}</span>
                  )},
                ]}
                data={rankRows}
                rowKey={(r) => r.rank}
              />
            </div>
          ) : (
            <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>
              No commander data available. Launch Elite Dangerous to populate your profile.
            </p>
          )}
        </HoloPanel>

        <HoloPanel title="Integration Status">
          <div style={{ fontSize: 13, lineHeight: 2.2 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
              <div>
                <span style={{ fontFamily: 'var(--font-display)', letterSpacing: 1 }}>EDSM</span>
                {links?.edsm?.commanderName && (
                  <span style={{ color: 'var(--color-text-muted)', fontSize: 12, marginLeft: 8 }}>({links.edsm.commanderName})</span>
                )}
              </div>
              <HoloBadge variant={links?.edsm?.configured ? 'success' : 'warning'}>
                {links?.edsm?.configured ? 'Connected' : 'Not Configured'}
              </HoloBadge>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
              <div>
                <span style={{ fontFamily: 'var(--font-display)', letterSpacing: 1 }}>INARA</span>
                {links?.inara?.commanderName && (
                  <span style={{ color: 'var(--color-text-muted)', fontSize: 12, marginLeft: 8 }}>({links.inara.commanderName})</span>
                )}
              </div>
              <HoloBadge variant={links?.inara?.configured ? 'success' : 'warning'}>
                {links?.inara?.configured ? 'Connected' : 'Not Configured'}
              </HoloBadge>
            </div>

            {/* External Links */}
            <div style={{ marginTop: 12 }}>
              {links?.edsm?.url && (
                <div style={{ marginBottom: 6 }}>
                  <a href={links.edsm.url} target="_blank" rel="noopener noreferrer"
                    style={{ color: 'var(--color-accent-bright)', fontSize: 12, textDecoration: 'none' }}>
                    View EDSM Profile &rarr;
                  </a>
                </div>
              )}
              {links?.inara?.url && (
                <div>
                  <a href={links.inara.url} target="_blank" rel="noopener noreferrer"
                    style={{ color: 'var(--color-accent-bright)', fontSize: 12, textDecoration: 'none' }}>
                    View Inara Profile &rarr;
                  </a>
                </div>
              )}
              {!links?.edsm?.url && !links?.inara?.url && (
                <p style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>
                  Configure EDSM/Inara API keys in settings to enable external profile links.
                </p>
              )}
            </div>
          </div>

          {/* EDSM Commander Position */}
          {links?.edsm?.configured && (
            <div style={{ marginTop: 16, padding: '10px 0', borderTop: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: 10, fontFamily: 'var(--font-display)', color: 'var(--color-text-muted)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>
                EDSM Last Known Position
              </div>
              {cmdrPosLoading ? (
                <span style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>Loading...</span>
              ) : cmdrPosition?.system ? (
                <div style={{ fontSize: 13, lineHeight: 1.8 }}>
                  <div>
                    <span style={{ color: 'var(--color-accent-bright)', fontFamily: 'var(--font-display)', fontSize: 15 }}>{cmdrPosition.system}</span>
                    {cmdrPosition.firstDiscover && <HoloBadge variant="success" style={{ marginLeft: 8 }}>First Discoverer</HoloBadge>}
                  </div>
                  {cmdrPosition.coordinates && (
                    <div style={{ color: 'var(--color-text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                      [{cmdrPosition.coordinates.x?.toFixed(2)}, {cmdrPosition.coordinates.y?.toFixed(2)}, {cmdrPosition.coordinates.z?.toFixed(2)}]
                    </div>
                  )}
                  {cmdrPosition.date && (
                    <div style={{ color: 'var(--color-text-muted)', fontSize: 11 }}>
                      Reported: {new Date(cmdrPosition.date).toLocaleString()}
                    </div>
                  )}
                </div>
              ) : (
                <span style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>Position not available</span>
              )}
            </div>
          )}
        </HoloPanel>
      </div>

      {/* Row 2: EDSM System Lookup */}
      <div style={{ marginBottom: 20 }}>
        <HoloPanel title="EDSM System Lookup">
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
            <input
              value={systemSearch}
              onChange={(e) => setSystemSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchSystem()}
              placeholder="Enter system name..."
              style={{
                flex: 1,
                background: 'var(--color-bg-tertiary)',
                border: '1px solid var(--color-border)',
                color: '#fff',
                padding: '8px 12px',
                fontSize: 13,
                fontFamily: 'var(--font-mono)',
              }}
            />
            <HoloButton onClick={searchSystem} disabled={searching}>
              {searching ? 'Searching...' : 'Search'}
            </HoloButton>
            {currentSystem && (
              <HoloButton onClick={searchCurrentSystem}>
                Current System
              </HoloButton>
            )}
          </div>

          {searchError && (
            <div style={{ color: '#ff4444', fontSize: 13, padding: '8px 0' }}>
              {searchError}
            </div>
          )}

          {systemResult && (
            <div className="grid-2" style={{ gap: 16 }}>
              {/* System Info */}
              <div>
                <div style={{ fontSize: 18, fontFamily: 'var(--font-display)', color: 'var(--color-accent-bright)', marginBottom: 8 }}>
                  {systemResult.name}
                </div>
                {systemResult.coords && (
                  <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', marginBottom: 12 }}>
                    Coordinates: [{systemResult.coords.x?.toFixed(2)}, {systemResult.coords.y?.toFixed(2)}, {systemResult.coords.z?.toFixed(2)}]
                  </div>
                )}
                <div style={{ fontSize: 13, lineHeight: 2 }}>
                  {systemResult.information?.allegiance && (
                    <div><span style={{ color: 'var(--color-text-muted)' }}>Allegiance:</span> {systemResult.information.allegiance}</div>
                  )}
                  {systemResult.information?.government && (
                    <div><span style={{ color: 'var(--color-text-muted)' }}>Government:</span> {systemResult.information.government}</div>
                  )}
                  {systemResult.information?.economy && (
                    <div><span style={{ color: 'var(--color-text-muted)' }}>Economy:</span> {systemResult.information.economy}</div>
                  )}
                  {systemResult.information?.security && (
                    <div><span style={{ color: 'var(--color-text-muted)' }}>Security:</span> {systemResult.information.security}</div>
                  )}
                  {systemResult.information?.population != null && (
                    <div><span style={{ color: 'var(--color-text-muted)' }}>Population:</span> {Number(systemResult.information.population).toLocaleString()}</div>
                  )}
                  {systemResult.information?.faction && (
                    <div><span style={{ color: 'var(--color-text-muted)' }}>Controlling Faction:</span> {systemResult.information.faction}</div>
                  )}
                  {systemResult.information?.factionState && (
                    <div><span style={{ color: 'var(--color-text-muted)' }}>Faction State:</span> {systemResult.information.factionState}</div>
                  )}
                </div>
                <div style={{ marginTop: 12 }}>
                  <HoloButton onClick={() => fetchTraffic(systemResult.name)} disabled={trafficLoading}>
                    {trafficLoading ? 'Loading...' : 'View Traffic Report'}
                  </HoloButton>
                </div>
              </div>

              {/* Traffic Report */}
              <div>
                {trafficData ? (
                  <div>
                    <div style={{ fontSize: 10, fontFamily: 'var(--font-display)', color: 'var(--color-text-muted)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12 }}>
                      Traffic Report
                    </div>
                    {trafficData.traffic && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
                        {[
                          { label: 'Total', value: trafficData.traffic.total },
                          { label: 'This Week', value: trafficData.traffic.week },
                          { label: 'Today', value: trafficData.traffic.day },
                        ].map((stat) => (
                          <div key={stat.label} style={{ textAlign: 'center', padding: 10, background: 'var(--color-bg-tertiary)', borderRadius: 2 }}>
                            <div style={{ fontSize: 22, fontFamily: 'var(--font-display)', color: 'var(--color-accent-bright)' }}>
                              {(stat.value || 0).toLocaleString()}
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--color-text-muted)', letterSpacing: 1, textTransform: 'uppercase', marginTop: 4 }}>
                              {stat.label}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {trafficData.breakdown && Object.keys(trafficData.breakdown).length > 0 && (
                      <div>
                        <div style={{ fontSize: 10, fontFamily: 'var(--font-display)', color: 'var(--color-text-muted)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>
                          Ship Breakdown
                        </div>
                        {Object.entries(trafficData.breakdown)
                          .sort(([, a], [, b]) => (b as number) - (a as number))
                          .slice(0, 10)
                          .map(([ship, count]) => (
                            <div key={ship} style={{
                              display: 'flex', justifyContent: 'space-between',
                              padding: '4px 0', borderBottom: '1px solid var(--color-border)',
                              fontSize: 12,
                            }}>
                              <span>{ship}</span>
                              <span style={{ color: 'var(--color-accent-bright)', fontFamily: 'var(--font-mono)' }}>{(count as number).toLocaleString()}</span>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ color: 'var(--color-text-muted)', fontSize: 13, padding: 20, textAlign: 'center' }}>
                    Click "View Traffic Report" to load traffic data for this system.
                  </div>
                )}
              </div>
            </div>
          )}

          {!systemResult && !searchError && !searching && (
            <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>
              Search for any system in the galaxy to view its EDSM data, coordinates, government, economy, and traffic report.
            </p>
          )}
        </HoloPanel>
      </div>
    </div>
  );
}
