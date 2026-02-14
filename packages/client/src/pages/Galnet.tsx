import { useEffect, useState } from 'react';
import { useApi, apiFetch } from '../hooks/useApi';
import HoloPanel from '../components/common/HoloPanel';
import HoloButton from '../components/common/HoloButton';

export default function Galnet() {
  const { data, loading, fetch: load } = useApi<any>('/galnet');
  const [selected, setSelected] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  useEffect(() => { load(); }, [load]);

  const refresh = async () => { setRefreshing(true); try { await apiFetch('/galnet/refresh', { method: 'POST' }); await load(); } finally { setRefreshing(false); } };

  return (
    <div className="page">
      <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-accent-bright)', letterSpacing: 3, marginBottom: 20 }}>GALNET NEWS</h1>
      <div style={{ marginBottom: 16 }}>
        <HoloButton onClick={refresh} disabled={refreshing}>{refreshing ? 'Refreshing...' : 'Refresh Feed'}</HoloButton>
      </div>
      {loading && <p style={{ color: 'var(--color-text-muted)' }}>Loading...</p>}
      {selected ? (
        <HoloPanel title={selected.title}>
          <div style={{ marginBottom: 12 }}>
            <HoloButton onClick={() => setSelected(null)}>&larr; Back to Feed</HoloButton>
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 12 }}>{new Date(selected.publishDate).toLocaleDateString()}</div>
          <div style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--color-text-muted)', whiteSpace: 'pre-wrap' }}>{selected.body || selected.content}</div>
        </HoloPanel>
      ) : (
        <HoloPanel title="Latest Articles">
          {data?.articles?.length > 0 ? data.articles.map((a: any) => (
            <div
              key={a.id || a.title}
              onClick={() => setSelected(a)}
              style={{ padding: '12px 0', borderBottom: '1px solid var(--color-border)', cursor: 'pointer' }}
            >
              <div style={{ fontSize: 14, color: 'var(--color-accent-bright)', marginBottom: 4 }}>{a.title}</div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{new Date(a.publishDate).toLocaleDateString()}</div>
              {a.summary && <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>{a.summary}</div>}
            </div>
          )) : <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>No articles available. Try refreshing the feed.</p>}
        </HoloPanel>
      )}
    </div>
  );
}
