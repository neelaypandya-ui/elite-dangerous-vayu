import { useEffect, useState } from 'react';
import { useApi, apiFetch } from '../hooks/useApi';
import HoloPanel from '../components/common/HoloPanel';
import HoloButton from '../components/common/HoloButton';

export default function Community() {
  const { data, loading, fetch: load } = useApi<any>('/community');
  const [systemSearch, setSystemSearch] = useState('');
  const [systemResult, setSystemResult] = useState<any>(null);
  const [searching, setSearching] = useState(false);
  useEffect(() => { load(); }, [load]);

  const searchSystem = async () => {
    if (!systemSearch.trim()) return;
    setSearching(true);
    try {
      const res = await apiFetch(`/community/edsm/system/${encodeURIComponent(systemSearch)}`);
      setSystemResult(res);
    } catch { setSystemResult(null); }
    finally { setSearching(false); }
  };

  return (
    <div className="page">
      <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-accent-bright)', letterSpacing: 3, marginBottom: 20 }}>COMMUNITY</h1>
      {loading && <p style={{ color: 'var(--color-text-muted)' }}>Loading...</p>}
      <div className="grid-2" style={{ gap: 16, marginBottom: 20 }}>
        <HoloPanel title="EDSM System Lookup">
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input
              value={systemSearch}
              onChange={(e) => setSystemSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchSystem()}
              placeholder="Enter system name..."
              style={{ flex: 1, background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', color: '#fff', padding: '6px 10px', fontSize: 13, fontFamily: 'var(--font-mono)' }}
            />
            <HoloButton onClick={searchSystem} disabled={searching}>Search</HoloButton>
          </div>
          {systemResult && (
            <div style={{ fontSize: 13, lineHeight: 1.8 }}>
              <div style={{ fontSize: 16, color: 'var(--color-accent-bright)', fontFamily: 'var(--font-display)', marginBottom: 4 }}>{systemResult.name}</div>
              {systemResult.coords && <div style={{ color: 'var(--color-text-muted)' }}>Coords: {systemResult.coords.x?.toFixed(1)}, {systemResult.coords.y?.toFixed(1)}, {systemResult.coords.z?.toFixed(1)}</div>}
              {systemResult.information?.security && <div><span style={{ color: 'var(--color-text-muted)' }}>Security:</span> {systemResult.information.security}</div>}
              {systemResult.information?.economy && <div><span style={{ color: 'var(--color-text-muted)' }}>Economy:</span> {systemResult.information.economy}</div>}
              {systemResult.information?.population != null && <div><span style={{ color: 'var(--color-text-muted)' }}>Population:</span> {Number(systemResult.information.population).toLocaleString()}</div>}
            </div>
          )}
        </HoloPanel>
        <HoloPanel title="Commander Profile">
          {data?.commander ? (
            <div style={{ fontSize: 13, lineHeight: 1.8 }}>
              <div style={{ fontSize: 16, color: 'var(--color-accent-bright)', fontFamily: 'var(--font-display)', marginBottom: 4 }}>{data.commander.name}</div>
              {data.commander.ranks && Object.entries(data.commander.ranks).map(([k, v]) => (
                <div key={k}><span style={{ color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>{k}:</span> {v as string}</div>
              ))}
            </div>
          ) : <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>Connect EDSM/Inara API keys in settings for commander profile</p>}
        </HoloPanel>
      </div>
    </div>
  );
}
