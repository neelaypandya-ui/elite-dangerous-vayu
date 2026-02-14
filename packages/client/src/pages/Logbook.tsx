import { useEffect, useState } from 'react';
import { useApi, apiFetch } from '../hooks/useApi';
import HoloPanel from '../components/common/HoloPanel';
import HoloButton from '../components/common/HoloButton';
import HoloBadge from '../components/common/HoloBadge';

interface LogEntry {
  id: string;
  content: string;
  timestamp: string;
  system: string;
  body: string | null;
  station: string | null;
  ship: string;
  shipName: string;
  tags: string[];
  source: 'text' | 'voice';
}

interface LogStats {
  totalEntries: number;
  voiceEntries: number;
  textEntries: number;
  systemsCovered: number;
}

export default function Logbook() {
  const { data, loading, fetch: load } = useApi<any>('/logbook');
  const [newEntry, setNewEntry] = useState('');
  const [newTags, setNewTags] = useState('');
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<LogEntry[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [searching, setSearching] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editTags, setEditTags] = useState('');
  const [filterSystem, setFilterSystem] = useState('');

  useEffect(() => { load(); }, [load]);

  const entries: LogEntry[] = data?.entries || [];
  const stats: LogStats = data?.stats || { totalEntries: 0, voiceEntries: 0, textEntries: 0, systemsCovered: 0 };

  const save = async () => {
    if (!newEntry.trim()) return;
    setSaving(true);
    try {
      const tags = newTags.trim() ? newTags.split(',').map(t => t.trim()).filter(Boolean) : [];
      await apiFetch('/logbook', { method: 'POST', body: JSON.stringify({ content: newEntry, source: 'text', tags }) });
      setNewEntry('');
      setNewTags('');
      await load();
    } finally { setSaving(false); }
  };

  const deleteEntry = async (id: string) => {
    await apiFetch(`/logbook/${id}`, { method: 'DELETE' });
    if (searchResults) {
      setSearchResults(searchResults.filter(e => e.id !== id));
    }
    await load();
  };

  const startEdit = (entry: LogEntry) => {
    setEditingId(entry.id);
    setEditContent(entry.content);
    setEditTags(entry.tags.join(', '));
  };

  const saveEdit = async () => {
    if (!editingId || !editContent.trim()) return;
    const tags = editTags.trim() ? editTags.split(',').map(t => t.trim()).filter(Boolean) : [];
    await apiFetch(`/logbook/${editingId}`, { method: 'PUT', body: JSON.stringify({ content: editContent, tags }) });
    setEditingId(null);
    setEditContent('');
    setEditTags('');
    await load();
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent('');
    setEditTags('');
  };

  const doSearch = async () => {
    if (!search.trim()) {
      setSearchResults(null);
      return;
    }
    setSearching(true);
    try {
      const results = await apiFetch<LogEntry[]>(`/logbook/search?q=${encodeURIComponent(search)}`);
      setSearchResults(Array.isArray(results) ? results : []);
    } catch {
      setSearchResults([]);
    } finally { setSearching(false); }
  };

  const filterBySystem = async (system: string) => {
    setFilterSystem(system);
    if (!system) {
      setSearchResults(null);
      return;
    }
    setSearching(true);
    try {
      const results = await apiFetch<LogEntry[]>(`/logbook/system/${encodeURIComponent(system)}`);
      setSearchResults(Array.isArray(results) ? results : []);
    } catch {
      setSearchResults([]);
    } finally { setSearching(false); }
  };

  const clearFilter = () => {
    setSearch('');
    setFilterSystem('');
    setSearchResults(null);
  };

  const displayEntries = searchResults !== null ? searchResults : entries;

  // Collect unique systems for filter
  const uniqueSystems = [...new Set(entries.map(e => e.system).filter(Boolean))].sort();

  return (
    <div className="page">
      <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-accent-bright)', letterSpacing: 3, marginBottom: 8, fontSize: 28 }}>LOGBOOK</h1>
      <p style={{ color: 'var(--color-text-muted)', fontSize: 15, marginBottom: 24 }}>
        Personal commander's log. Record observations, notes, and discoveries. Entries are automatically tagged with your current system, ship, and location.
      </p>

      {/* Stats Banner */}
      <div className="grid-4" style={{ gap: 16, marginBottom: 20 }}>
        {[
          ['Total Entries', stats.totalEntries, 'var(--color-accent-bright)'],
          ['Text Entries', stats.textEntries, '#4488cc'],
          ['Voice Entries', stats.voiceEntries, '#ffaa00'],
          ['Systems Covered', stats.systemsCovered, '#4E9A3E'],
        ].map(([l, v, c]) => (
          <HoloPanel key={l as string}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontFamily: 'var(--font-display)', color: c as string }}>{v}</div>
              <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>{l as string}</div>
            </div>
          </HoloPanel>
        ))}
      </div>

      <div className="grid-2" style={{ gap: 20, marginBottom: 20 }}>
        {/* New Entry */}
        <HoloPanel title="New Entry">
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)', fontStyle: 'italic', padding: '4px 0 12px', borderBottom: '1px solid var(--color-border)', marginBottom: 10 }}>
            Write a new log entry. Your current system, station, and ship will be recorded automatically.
          </div>
          <textarea
            value={newEntry}
            onChange={(e) => setNewEntry(e.target.value)}
            placeholder="Record your thoughts, Commander..."
            rows={5}
            style={{
              width: '100%', background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)',
              color: '#fff', padding: '10px 12px', fontSize: 13, fontFamily: 'var(--font-mono)',
              resize: 'vertical', boxSizing: 'border-box', borderRadius: 2,
            }}
          />
          <div style={{ marginTop: 8 }}>
            <input
              value={newTags}
              onChange={(e) => setNewTags(e.target.value)}
              placeholder="Tags (comma separated, optional)"
              style={{
                width: '100%', background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)',
                color: '#fff', padding: '6px 10px', fontSize: 12, fontFamily: 'var(--font-mono)',
                boxSizing: 'border-box', borderRadius: 2,
              }}
            />
          </div>
          <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--color-text-muted)', alignSelf: 'center' }}>
              {newEntry.length} chars
            </span>
            <HoloButton onClick={save} disabled={saving || !newEntry.trim()}>
              {saving ? 'Saving...' : 'Save Entry'}
            </HoloButton>
          </div>
        </HoloPanel>

        {/* Search & Filter */}
        <HoloPanel title="Search & Filter">
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)', fontStyle: 'italic', padding: '4px 0 12px', borderBottom: '1px solid var(--color-border)', marginBottom: 10 }}>
            Search entries by content, system name, or tags. Filter by system to see all entries from a specific location.
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && doSearch()}
              placeholder="Search entries..."
              style={{
                flex: 1, background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)',
                color: '#fff', padding: '6px 10px', fontSize: 13, fontFamily: 'var(--font-mono)', borderRadius: 2,
              }}
            />
            <HoloButton onClick={doSearch} disabled={searching}>
              {searching ? '...' : 'Search'}
            </HoloButton>
          </div>

          {/* System filter */}
          {uniqueSystems.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-display)', letterSpacing: 1, marginBottom: 6 }}>
                FILTER BY SYSTEM
              </div>
              <select
                value={filterSystem}
                onChange={(e) => filterBySystem(e.target.value)}
                style={{
                  width: '100%', padding: '6px 8px', fontSize: 12,
                  background: 'var(--color-bg-tertiary)', color: '#fff',
                  border: '1px solid var(--color-border)', borderRadius: 2,
                  fontFamily: 'var(--font-mono)',
                }}
              >
                <option value="">All Systems</option>
                {uniqueSystems.map(sys => (
                  <option key={sys} value={sys}>{sys}</option>
                ))}
              </select>
            </div>
          )}

          {/* Active filter indicator */}
          {(searchResults !== null) && (
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '8px 12px', background: 'rgba(78,154,62,0.1)', border: '1px solid var(--color-accent)',
              borderRadius: 4,
            }}>
              <span style={{ fontSize: 12, color: 'var(--color-accent-bright)' }}>
                {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
                {filterSystem && ` in ${filterSystem}`}
                {search && ` for "${search}"`}
              </span>
              <HoloButton variant="secondary" onClick={clearFilter} style={{ padding: '2px 10px', fontSize: 10 }}>
                Clear
              </HoloButton>
            </div>
          )}
        </HoloPanel>
      </div>

      {/* Entries List */}
      {loading && !data && <p style={{ color: 'var(--color-text-muted)' }}>Loading...</p>}
      <HoloPanel title={`Entries (${displayEntries.length})`}>
        <div style={{ fontSize: 13, color: 'var(--color-text-muted)', fontStyle: 'italic', padding: '4px 0 12px', borderBottom: '1px solid var(--color-border)', marginBottom: 10 }}>
          {searchResults !== null ? 'Filtered results shown below.' : 'Most recent entries first. Click Edit to modify, Delete to remove.'}
        </div>
        {displayEntries.length > 0 ? displayEntries.map((e) => (
          <div key={e.id} style={{ padding: '14px 0', borderBottom: '1px solid var(--color-border)' }}>
            {editingId === e.id ? (
              /* Edit mode */
              <div>
                <textarea
                  value={editContent}
                  onChange={(ev) => setEditContent(ev.target.value)}
                  rows={4}
                  style={{
                    width: '100%', background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-accent)',
                    color: '#fff', padding: '8px 10px', fontSize: 13, fontFamily: 'var(--font-mono)',
                    resize: 'vertical', boxSizing: 'border-box', borderRadius: 2,
                  }}
                />
                <input
                  value={editTags}
                  onChange={(ev) => setEditTags(ev.target.value)}
                  placeholder="Tags (comma separated)"
                  style={{
                    width: '100%', background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)',
                    color: '#fff', padding: '4px 8px', fontSize: 11, fontFamily: 'var(--font-mono)',
                    boxSizing: 'border-box', borderRadius: 2, marginTop: 6,
                  }}
                />
                <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
                  <HoloButton variant="secondary" onClick={cancelEdit}>Cancel</HoloButton>
                  <HoloButton onClick={saveEdit} disabled={!editContent.trim()}>Save</HoloButton>
                </div>
              </div>
            ) : (
              /* View mode */
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span>{e.timestamp ? new Date(e.timestamp).toLocaleString() : ''}</span>
                    {e.system && (
                      <span
                        onClick={() => filterBySystem(e.system)}
                        style={{ color: 'var(--color-accent-bright)', cursor: 'pointer', textDecoration: 'underline' }}
                        title={`Filter by ${e.system}`}
                      >
                        {e.system}
                      </span>
                    )}
                    {e.station && <span>{e.station}</span>}
                    {e.ship && <span style={{ color: 'var(--color-text-muted)' }}>{e.shipName || e.ship}</span>}
                    <HoloBadge variant={e.source === 'voice' ? 'warning' : 'info'}>{e.source}</HoloBadge>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => startEdit(e)}
                      style={{ background: 'none', border: 'none', color: 'var(--color-accent-bright)', cursor: 'pointer', fontSize: 11, fontFamily: 'var(--font-display)', letterSpacing: 1 }}
                    >
                      EDIT
                    </button>
                    <button
                      onClick={() => deleteEntry(e.id)}
                      style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', fontSize: 11, fontFamily: 'var(--font-display)', letterSpacing: 1 }}
                    >
                      DELETE
                    </button>
                  </div>
                </div>
                <div style={{ fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap', color: '#ddd' }}>
                  {e.content}
                </div>
                {e.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                    {e.tags.map((tag, ti) => (
                      <span
                        key={ti}
                        onClick={() => { setSearch(tag); doSearch(); }}
                        style={{
                          fontSize: 10, padding: '2px 6px', borderRadius: 2,
                          background: 'rgba(78,154,62,0.1)', border: '1px solid var(--color-border)',
                          color: 'var(--color-text-muted)', cursor: 'pointer',
                          fontFamily: 'var(--font-display)', letterSpacing: 1,
                        }}
                        title={`Search for ${tag}`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )) : (
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13, textAlign: 'center', padding: 24 }}>
            {searchResults !== null ? 'No entries match your search.' : 'No log entries yet. Start recording your journey, Commander.'}
          </p>
        )}
      </HoloPanel>
    </div>
  );
}
