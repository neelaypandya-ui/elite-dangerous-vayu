import { useEffect, useState } from 'react';
import { useApi, apiFetch } from '../hooks/useApi';
import HoloPanel from '../components/common/HoloPanel';
import HoloButton from '../components/common/HoloButton';
import HoloProgress from '../components/common/HoloProgress';

export default function Audio() {
  const { data, loading, fetch: load } = useApi<any>('/audio');
  const [applying, setApplying] = useState(false);
  useEffect(() => { load(); }, [load]);

  const apply = async (name: string) => { setApplying(true); try { await apiFetch('/audio/apply', { method: 'POST', body: JSON.stringify({ profileName: name }) }); await load(); } finally { setApplying(false); } };

  return (
    <div className="page">
      <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-accent-bright)', letterSpacing: 3, marginBottom: 20 }}>AUDIO</h1>
      {loading && <p style={{ color: 'var(--color-text-muted)' }}>Loading...</p>}
      {data && (
        <>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13, marginBottom: 16 }}>Active: <strong style={{ color: 'var(--color-accent-bright)' }}>{data.activeProfile}</strong></p>
          <div className="grid-2" style={{ gap: 16 }}>
            {data.profiles?.map((p: any) => (
              <HoloPanel key={p.name} title={p.name}>
                <p style={{ color: 'var(--color-text-muted)', fontSize: 13, marginBottom: 8 }}>{p.description}</p>
                {['masterVolume', 'gameVolume', 'voiceVolume', 'musicVolume', 'ttsVolume'].map((k) => (
                  <div key={k} style={{ marginBottom: 4 }}><div style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>{k.replace('Volume', '')}</div><HoloProgress value={p[k]} max={100} label={`${p[k]}%`} /></div>
                ))}
                <HoloButton onClick={() => apply(p.name)} disabled={applying || data.activeProfile === p.name} style={{ marginTop: 8 }}>{data.activeProfile === p.name ? 'Active' : 'Apply'}</HoloButton>
              </HoloPanel>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
