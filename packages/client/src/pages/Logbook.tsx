import { useEffect, useState } from 'react';
import { useApi, apiFetch } from '../hooks/useApi';
import HoloPanel from '../components/common/HoloPanel';
import HoloButton from '../components/common/HoloButton';

export default function Logbook() {
  const { data, loading, fetch: load } = useApi<any>('/logbook');
  const [newEntry, setNewEntry] = useState('');
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!newEntry.trim()) return;
    setSaving(true);
    try {
      await apiFetch('/logbook', { method: 'POST', body: JSON.stringify({ content: newEntry }) });
      setNewEntry('');
      await load();
    } finally { setSaving(false); }
  };

  const deleteEntry = async (id: string) => {
    await apiFetch(`/logbook/${id}`, { method: 'DELETE' });
    await load();
  };

  const entries = (data?.entries || []).filter((e: any) =>
    !search || e.content?.toLowerCase().includes(search.toLowerCase()) || e.system?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page">
      <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-accent-bright)', letterSpacing: 3, marginBottom: 20 }}>LOGBOOK</h1>
      <HoloPanel title="New Entry">
        <textarea
          value={newEntry}
          onChange={(e) => setNewEntry(e.target.value)}
          placeholder="Record your thoughts, Commander..."
          rows={4}
          style={{ width: '100%', background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', color: '#fff', padding: '8px 10px', fontSize: 13, fontFamily: 'var(--font-mono)', resize: 'vertical', boxSizing: 'border-box' }}
        />
        <div style={{ marginTop: 8, textAlign: 'right' }}>
          <HoloButton onClick={save} disabled={saving || !newEntry.trim()}>{saving ? 'Saving...' : 'Save Entry'}</HoloButton>
        </div>
      </HoloPanel>
      <div style={{ marginTop: 16, marginBottom: 16 }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search entries..."
          style={{ width: '100%', background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', color: '#fff', padding: '6px 10px', fontSize: 13, fontFamily: 'var(--font-mono)', boxSizing: 'border-box' }}
        />
      </div>
      {loading && <p style={{ color: 'var(--color-text-muted)' }}>Loading...</p>}
      <HoloPanel title={`Entries (${entries.length})`}>
        {entries.length > 0 ? entries.map((e: any) => (
          <div key={e.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                {e.timestamp ? new Date(e.timestamp).toLocaleString() : ''}
                {e.system && <span> \u2022 {e.system}</span>}
                {e.ship && <span> \u2022 {e.ship}</span>}
              </div>
              <button onClick={() => deleteEntry(e.id)} style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', fontSize: 11 }}>Delete</button>
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{e.content}</div>
          </div>
        )) : <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>No log entries yet</p>}
      </HoloPanel>
    </div>
  );
}
