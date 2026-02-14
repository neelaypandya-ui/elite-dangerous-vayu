import { useEffect, useState } from 'react';
import { useApi, apiFetch } from '../hooks/useApi';
import HoloPanel from '../components/common/HoloPanel';
import HoloButton from '../components/common/HoloButton';

export default function Screenshots() {
  const { data, loading, fetch: load } = useApi<any>('/screenshots');
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<any>(null);
  useEffect(() => { load(); }, [load]);

  const scan = async () => { await apiFetch('/screenshots/scan', { method: 'POST' }); await load(); };

  const filtered = (data?.screenshots || []).filter((s: any) =>
    !filter || s.system?.toLowerCase().includes(filter.toLowerCase()) || s.ship?.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="page">
      <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-accent-bright)', letterSpacing: 3, marginBottom: 20 }}>SCREENSHOTS</h1>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by system or ship..."
          style={{ flex: 1, background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', color: '#fff', padding: '6px 10px', fontSize: 13, fontFamily: 'var(--font-mono)' }}
        />
        <HoloButton onClick={scan}>Scan Directory</HoloButton>
      </div>
      {loading && <p style={{ color: 'var(--color-text-muted)' }}>Loading...</p>}
      {selected ? (
        <HoloPanel title={selected.filename}>
          <div style={{ marginBottom: 12 }}>
            <HoloButton onClick={() => setSelected(null)}>&larr; Back to Gallery</HoloButton>
          </div>
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <img src={`/api/screenshots/file/${encodeURIComponent(selected.filename)}`} alt={selected.filename} style={{ maxWidth: '100%', maxHeight: '70vh', border: '1px solid var(--color-border)' }} />
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.8 }}>
            {selected.system && <div>System: <span style={{ color: '#fff' }}>{selected.system}</span></div>}
            {selected.ship && <div>Ship: <span style={{ color: '#fff' }}>{selected.ship}</span></div>}
            {selected.timestamp && <div>Taken: <span style={{ color: '#fff' }}>{new Date(selected.timestamp).toLocaleString()}</span></div>}
          </div>
        </HoloPanel>
      ) : (
        <HoloPanel title={`Gallery (${filtered.length} images)`}>
          {filtered.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              {filtered.map((s: any, i: number) => (
                <div key={i} onClick={() => setSelected(s)} style={{ cursor: 'pointer', border: '1px solid var(--color-border)', padding: 4, background: 'var(--color-bg-tertiary)' }}>
                  <div style={{ height: 120, background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'var(--color-text-muted)', marginBottom: 4, overflow: 'hidden' }}>
                    <img src={`/api/screenshots/thumb/${encodeURIComponent(s.filename)}`} alt={s.filename} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'cover' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.system || s.filename}</div>
                  <div style={{ fontSize: 9, color: 'var(--color-text-muted)' }}>{s.timestamp ? new Date(s.timestamp).toLocaleDateString() : ''}</div>
                </div>
              ))}
            </div>
          ) : <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>No screenshots found. Click "Scan Directory" to index your screenshots.</p>}
        </HoloPanel>
      )}
    </div>
  );
}
