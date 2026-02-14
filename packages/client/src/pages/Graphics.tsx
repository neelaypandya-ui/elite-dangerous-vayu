import { useEffect, useState } from 'react';
import { useApi, apiFetch } from '../hooks/useApi';
import HoloPanel from '../components/common/HoloPanel';
import HoloButton from '../components/common/HoloButton';

export default function Graphics() {
  const { data, loading, fetch: load } = useApi<any>('/graphics');
  const [applying, setApplying] = useState(false);
  useEffect(() => { load(); }, [load]);

  const apply = async (name: string) => { setApplying(true); try { await apiFetch('/graphics/apply', { method: 'POST', body: JSON.stringify({ profileName: name }) }); await load(); } finally { setApplying(false); } };

  return (
    <div className="page">
      <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-accent-bright)', letterSpacing: 3, marginBottom: 20 }}>GRAPHICS</h1>
      {loading && <p style={{ color: 'var(--color-text-muted)' }}>Loading...</p>}
      {data && (
        <>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13, marginBottom: 16 }}>Active: <strong style={{ color: 'var(--color-accent-bright)' }}>{data.activeProfile}</strong></p>
          <div className="grid-2" style={{ gap: 16 }}>
            {data.profiles?.map((p: any) => (
              <HoloPanel key={p.name} title={p.name}>
                <p style={{ color: 'var(--color-text-muted)', fontSize: 13, marginBottom: 10 }}>{p.description}</p>
                <div style={{ fontSize: 11, marginBottom: 10, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>R: [{p.hudMatrix.matrixRed.join(', ')}]<br/>G: [{p.hudMatrix.matrixGreen.join(', ')}]<br/>B: [{p.hudMatrix.matrixBlue.join(', ')}]</div>
                <HoloButton onClick={() => apply(p.name)} disabled={applying || data.activeProfile === p.name}>{data.activeProfile === p.name ? 'Active' : 'Apply'}</HoloButton>
              </HoloPanel>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
