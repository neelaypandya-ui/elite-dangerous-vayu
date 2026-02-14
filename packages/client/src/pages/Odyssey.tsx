import { useEffect, useState, useCallback } from 'react';
import { useApi, apiFetch } from '../hooks/useApi';
import HoloPanel from '../components/common/HoloPanel';
import HoloProgress from '../components/common/HoloProgress';
import HoloBadge from '../components/common/HoloBadge';
import HoloTable from '../components/common/HoloTable';
import HoloButton from '../components/common/HoloButton';

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

export default function Odyssey() {
  // Summary endpoint for quick stats
  const { data: summary, fetch: loadSummary } = useApi<any>('/odyssey');
  // Individual detail endpoints
  const { data: suits, fetch: loadSuits } = useApi<any>('/odyssey/suits');
  const { data: loadouts, fetch: loadLoadouts } = useApi<any>('/odyssey/loadouts');
  const { data: backpackData, fetch: loadBackpack } = useApi<any>('/odyssey/backpack');
  const { data: materialsData, fetch: loadMaterials } = useApi<any>('/odyssey/materials');
  const { data: scansData, fetch: loadScans } = useApi<any>('/odyssey/scans');

  // Farm guide search
  const [farmSearch, setFarmSearch] = useState('');
  const [farmResults, setFarmResults] = useState<any[]>([]);
  const [farmLoading, setFarmLoading] = useState(false);

  const loadAll = useCallback(() => {
    loadSummary();
    loadSuits();
    loadLoadouts();
    loadBackpack();
    loadMaterials();
    loadScans();
  }, [loadSummary, loadSuits, loadLoadouts, loadBackpack, loadMaterials, loadScans]);

  useEffect(() => { loadAll(); const t = setInterval(loadAll, 5000); return () => clearInterval(t); }, [loadAll]);

  const searchFarmGuide = useCallback(async () => {
    if (!farmSearch.trim()) {
      setFarmResults([]);
      return;
    }
    setFarmLoading(true);
    try {
      const results = await apiFetch<any[]>(`/odyssey/farm-guide?component=${encodeURIComponent(farmSearch.trim())}`);
      setFarmResults(results || []);
    } catch {
      setFarmResults([]);
    } finally {
      setFarmLoading(false);
    }
  }, [farmSearch]);

  const suitList: any[] = suits || [];
  const loadoutList: any[] = loadouts || [];
  const backpack = backpackData || { items: [], grouped: {}, totalItems: 0 };
  const materials = materialsData || { materials: [], grouped: {} };
  const scans = scansData || { scans: [], inProgress: [], completed: [], speciesAnalysed: 0 };

  const isOnFoot = summary?.onFoot || false;
  const currentLoadout = summary?.currentLoadout;

  return (
    <div className="page">
      <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-accent-bright)', letterSpacing: 3, marginBottom: 8, fontSize: 28 }}>ODYSSEY</h1>
      <p style={{ color: 'var(--color-text-muted)', fontSize: 15, marginBottom: 24 }}>
        On-foot operations tracker. Manage your suits, loadouts, backpack inventory, micro-resources, and exobiology scans.
      </p>

      {/* Status Overview */}
      <div className="grid-3" style={{ gap: 16, marginBottom: 20 }}>
        <HoloPanel title="On-Foot Status">
          <div style={{ textAlign: 'center', padding: 12 }}>
            <div style={{ marginBottom: 8 }}>
              <HoloBadge variant={isOnFoot ? 'success' : 'default'}>{isOnFoot ? 'On Foot' : 'In Ship'}</HoloBadge>
            </div>
            {currentLoadout && (
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 8 }}>
                <div style={{ color: 'var(--color-accent-bright)', fontSize: 14, marginBottom: 2 }}>{currentLoadout.loadoutName || 'Active Loadout'}</div>
                <div>{currentLoadout.suit?.nameLocalised || currentLoadout.suit?.name || 'Unknown Suit'}</div>
              </div>
            )}
          </div>
        </HoloPanel>
        <HoloPanel title="Inventory Summary">
          <div style={{ textAlign: 'center', padding: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-around' }}>
              <div>
                <div style={{ fontSize: 24, fontFamily: 'var(--font-display)', color: 'var(--color-accent-bright)' }}>{backpack.totalItems}</div>
                <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Backpack</div>
              </div>
              <div>
                <div style={{ fontSize: 24, fontFamily: 'var(--font-display)', color: '#4488cc' }}>{materials.materials?.length || 0}</div>
                <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Materials</div>
              </div>
            </div>
          </div>
        </HoloPanel>
        <HoloPanel title="Exobiology">
          <div style={{ textAlign: 'center', padding: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-around' }}>
              <div>
                <div style={{ fontSize: 24, fontFamily: 'var(--font-display)', color: 'var(--color-accent-bright)' }}>{scans.speciesAnalysed || 0}</div>
                <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Analysed</div>
              </div>
              <div>
                <div style={{ fontSize: 24, fontFamily: 'var(--font-display)', color: '#ffaa00' }}>{scans.inProgress?.length || 0}</div>
                <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>In Progress</div>
              </div>
            </div>
          </div>
        </HoloPanel>
      </div>

      {/* Suits & Loadouts */}
      <div className="grid-2" style={{ gap: 16, marginBottom: 20 }}>
        <HoloPanel title="Suits">
          <InfoTag>All owned suits with their class and installed modifications. Data from SuitLoadout journal events.</InfoTag>
          {suitList.length > 0 ? (
            <HoloTable
              columns={[
                {
                  key: 'name',
                  header: 'Suit',
                  render: (s: any) => (
                    <div>
                      <div style={{ fontSize: 13, color: '#fff' }}>{s.displayName || s.nameLocalised || s.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{s.type}</div>
                    </div>
                  ),
                },
                {
                  key: 'class',
                  header: 'Class',
                  align: 'center' as const,
                  width: '60px',
                  render: (s: any) => (
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-accent-bright)', fontSize: 14 }}>{s.class || 1}</span>
                  ),
                },
                {
                  key: 'mods',
                  header: 'Modifications',
                  render: (s: any) => (
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {s.mods && s.mods.length > 0 ? s.mods.map((m: string, i: number) => (
                        <HoloBadge key={i} variant="info">{m}</HoloBadge>
                      )) : <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>None</span>}
                    </div>
                  ),
                },
              ]}
              data={suitList}
              rowKey={(s: any, i: number) => `${s.suitId || i}`}
              emptyMessage="No suits found"
            />
          ) : (
            <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>No suit data. Odyssey content loads when you have on-foot activity in your journal.</p>
          )}
        </HoloPanel>

        <HoloPanel title="Loadouts">
          <InfoTag>Configured suit loadouts with equipped weapons. Each loadout pairs a suit with primary and secondary weapons.</InfoTag>
          {loadoutList.length > 0 ? loadoutList.map((l: any, i: number) => (
            <div key={l.loadoutId || i} style={{ padding: '10px 0', borderBottom: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ fontSize: 14, color: 'var(--color-accent-bright)', fontFamily: 'var(--font-display)' }}>
                  {l.loadoutName || `Loadout ${i + 1}`}
                </div>
                {l.suit && (
                  <HoloBadge variant="default">Class {l.suit.class || 1}</HoloBadge>
                )}
              </div>
              {l.suit && (
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4 }}>
                  {l.suit.nameLocalised || l.suit.name}
                </div>
              )}
              {l.weapons && l.weapons.length > 0 && (
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                  {l.weapons.map((w: any, wi: number) => (
                    <div key={wi} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                      <span>{w.nameLocalised || w.name}</span>
                      <span style={{ color: '#4488cc', fontFamily: 'var(--font-mono)' }}>C{w.class || 1}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )) : (
            <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>No loadouts configured</p>
          )}
        </HoloPanel>
      </div>

      {/* Backpack & Materials */}
      <div className="grid-2" style={{ gap: 16, marginBottom: 20 }}>
        <HoloPanel title="Backpack">
          <InfoTag>Items currently carried on foot. Grouped by type: items, components, consumables, and data.</InfoTag>
          {backpack.grouped && Object.keys(backpack.grouped).length > 0 ? (
            <>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 8 }}>
                Total items: <span style={{ color: 'var(--color-accent-bright)' }}>{backpack.totalItems}</span>
              </div>
              {Object.entries(backpack.grouped).map(([category, items]) => (
                <div key={category} style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: 'var(--color-accent-bright)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, fontFamily: 'var(--font-display)' }}>
                    {category}
                  </div>
                  {(items as any[]).map((item: any, i: number) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: 12 }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>{item.name}</span>
                      <span style={{ fontFamily: 'var(--font-mono)' }}>{item.count}</span>
                    </div>
                  ))}
                </div>
              ))}
            </>
          ) : (
            <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>Backpack empty</p>
          )}
        </HoloPanel>

        <HoloPanel title="On-Foot Materials">
          <InfoTag>Odyssey micro-resources stored in your locker. Grouped by category: components, data, items, and consumables.</InfoTag>
          {materials.grouped && Object.keys(materials.grouped).length > 0 ? (
            <>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 8 }}>
                Unique materials: <span style={{ color: 'var(--color-accent-bright)' }}>{materials.materials?.length || 0}</span>
              </div>
              {Object.entries(materials.grouped).map(([category, items]) => (
                <div key={category} style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: 'var(--color-accent-bright)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, fontFamily: 'var(--font-display)' }}>
                    {category} ({(items as any[]).length})
                  </div>
                  {(items as any[]).map((mat: any, i: number) => (
                    <div key={i} style={{ marginBottom: 6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 2 }}>
                        <span style={{ color: 'var(--color-text-muted)' }}>{mat.name}</span>
                        <span style={{ fontFamily: 'var(--font-mono)' }}>{mat.count}</span>
                      </div>
                      <HoloProgress value={mat.count} max={50} showPercent={false} height={4} />
                    </div>
                  ))}
                </div>
              ))}
            </>
          ) : (
            <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>No on-foot materials collected</p>
          )}
        </HoloPanel>
      </div>

      {/* Exobiology Scans */}
      <div className="grid-2" style={{ gap: 16, marginBottom: 20 }}>
        <HoloPanel title="Active Scans">
          <InfoTag>Exobiology scans currently in progress. Each species requires three samples (Log, Sample, Analyse) to complete.</InfoTag>
          {scans.inProgress && scans.inProgress.length > 0 ? scans.inProgress.map((s: any, i: number) => {
            const scanStage = s.scanType === 'Log' ? 1 : s.scanType === 'Sample' ? 2 : 3;
            return (
              <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <div>
                    <div style={{ fontSize: 13, color: '#fff' }}>{s.speciesLocalised || s.species}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{s.genusLocalised || s.genus}</div>
                  </div>
                  <HoloBadge variant="warning">{scanStage}/3</HoloBadge>
                </div>
                {s.variantLocalised && (
                  <div style={{ fontSize: 11, color: '#4488cc', marginBottom: 4 }}>{s.variantLocalised}</div>
                )}
                <HoloProgress value={scanStage} max={3} showPercent={false} height={6} color="#ffaa00" />
              </div>
            );
          }) : (
            <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>No active exobiology scans. Use the Genetic Sampler to scan biological organisms on planet surfaces.</p>
          )}
        </HoloPanel>

        <HoloPanel title="Completed Analyses">
          <InfoTag>Species with all three samples collected and analysis complete. These can be sold at Vista Genomics.</InfoTag>
          {scans.completed && scans.completed.length > 0 ? (
            <>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 8 }}>
                Total species analysed: <span style={{ color: 'var(--color-accent-bright)', fontFamily: 'var(--font-display)' }}>{scans.speciesAnalysed || scans.completed.length}</span>
              </div>
              {scans.completed.map((s: any, i: number) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
                  <div>
                    <div style={{ fontSize: 13, color: '#fff' }}>{s.speciesLocalised || s.species}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                      {s.genusLocalised || s.genus}
                      {s.variantLocalised ? ` - ${s.variantLocalised}` : ''}
                    </div>
                  </div>
                  <HoloBadge variant="success">Complete</HoloBadge>
                </div>
              ))}
            </>
          ) : (
            <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>No completed analyses yet</p>
          )}
        </HoloPanel>
      </div>

      {/* Farm Guide */}
      <HoloPanel title="Component Farm Guide">
        <InfoTag>Search for Odyssey components to find where and how to acquire them. Data includes settlement types, methods, and drop likelihood.</InfoTag>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input
            type="text"
            value={farmSearch}
            onChange={(e) => setFarmSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchFarmGuide()}
            placeholder="Search components (e.g. graphene, push, epoxy...)"
            style={{
              flex: 1,
              padding: '8px 12px',
              background: 'var(--color-bg-tertiary)',
              border: '1px solid var(--color-border)',
              borderRadius: 2,
              color: '#fff',
              fontSize: 13,
              fontFamily: 'var(--font-mono)',
              outline: 'none',
            }}
          />
          <HoloButton onClick={searchFarmGuide} disabled={farmLoading}>
            {farmLoading ? 'Searching...' : 'Search'}
          </HoloButton>
        </div>
        {farmResults.length > 0 ? (
          <HoloTable
            columns={[
              {
                key: 'component',
                header: 'Component',
                render: (r: any) => (
                  <div>
                    <div style={{ fontSize: 13, color: '#fff' }}>{r.component}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{r.category}</div>
                  </div>
                ),
              },
              {
                key: 'sources',
                header: 'Sources',
                render: (r: any) => (
                  <div>
                    {r.sources?.map((src: any, si: number) => (
                      <div key={si} style={{ fontSize: 12, padding: '2px 0', borderBottom: si < r.sources.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                        <span style={{ color: 'var(--color-accent-bright)' }}>{src.settlementType}</span>
                        <span style={{ color: 'var(--color-text-muted)' }}> - {src.method}</span>
                        <span style={{ marginLeft: 8 }}>
                          <HoloBadge variant={src.likelihood === 'High' ? 'success' : src.likelihood === 'Medium' ? 'warning' : 'default'}>
                            {src.likelihood}
                          </HoloBadge>
                        </span>
                      </div>
                    ))}
                  </div>
                ),
              },
            ]}
            data={farmResults}
            rowKey={(r: any, i: number) => `${r.component}-${i}`}
            emptyMessage="No results found"
          />
        ) : farmSearch && !farmLoading ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>No matching components found. Try a different search term.</p>
        ) : null}
      </HoloPanel>
    </div>
  );
}
