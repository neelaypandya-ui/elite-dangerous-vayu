import { useEffect, useState, useCallback } from 'react';
import { useApi, apiFetch } from '../hooks/useApi';
import { useGameState } from '../hooks/useGameState';
import HoloPanel from '../components/common/HoloPanel';
import HoloProgress from '../components/common/HoloProgress';
import HoloBadge from '../components/common/HoloBadge';
import HoloTable from '../components/common/HoloTable';
import HoloButton from '../components/common/HoloButton';

type MaterialGrade = 1 | 2 | 3 | 4 | 5;

interface Material {
  name: string;
  nameLocalised: string | null;
  category: string;
  grade: MaterialGrade;
  count: number;
  maximum: number;
}

interface EngineerState {
  name: string;
  id: number;
  progress: 'Known' | 'Invited' | 'Acquainted' | 'Unlocked';
  rank: number | null;
  rankProgress: number;
}

interface CategoryStats {
  category: string;
  count: number;
  held: number;
  capacity: number;
  fillPercent: number;
}

type ActiveCategory = 'all' | 'Raw' | 'Manufactured' | 'Encoded';

const GRADE_LABELS: Record<MaterialGrade, string> = {
  1: 'Very Common',
  2: 'Common',
  3: 'Standard',
  4: 'Rare',
  5: 'Very Rare',
};

const PROGRESS_VARIANT: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  Known: 'info',
  Invited: 'warning',
  Acquainted: 'warning',
  Unlocked: 'success',
};

export default function Engineering() {
  const { data: stats, loading, fetch: loadStats } = useApi<any>('/engineering');
  const gameState = useGameState();

  const [activeCategory, setActiveCategory] = useState<ActiveCategory>('all');
  const [materials, setMaterials] = useState<Material[]>([]);
  const [materialsLoading, setMaterialsLoading] = useState(false);
  const [nearCap, setNearCap] = useState<Material[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Material[] | null>(null);

  const loadMaterials = useCallback(async () => {
    setMaterialsLoading(true);
    try {
      if (activeCategory === 'all') {
        const data = await apiFetch<{ raw: Material[]; manufactured: Material[]; encoded: Material[] }>('/engineering/materials');
        setMaterials([...data.raw, ...data.manufactured, ...data.encoded]);
      } else {
        const data = await apiFetch<Material[]>(`/engineering/materials/${activeCategory}`);
        setMaterials(data);
      }
    } catch {
      setMaterials([]);
    } finally {
      setMaterialsLoading(false);
    }
  }, [activeCategory]);

  const loadNearCap = useCallback(async () => {
    try {
      const data = await apiFetch<Material[]>('/engineering/materials/near-cap');
      setNearCap(data);
    } catch {
      setNearCap([]);
    }
  }, []);

  useEffect(() => {
    loadStats();
    loadNearCap();
    const t = setInterval(() => { loadStats(); loadNearCap(); }, 5000);
    return () => clearInterval(t);
  }, [loadStats, loadNearCap]);

  useEffect(() => {
    loadMaterials();
  }, [loadMaterials]);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    try {
      const data = await apiFetch<Material[]>(`/engineering/materials/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchResults(data);
    } catch {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const displayMaterials = searchResults !== null ? searchResults : materials;
  const engineers: EngineerState[] = stats?.engineers || [];

  const unlocked = engineers.filter(e => e.progress === 'Unlocked').length;
  const invited = engineers.filter(e => e.progress === 'Invited').length;
  const known = engineers.filter(e => e.progress === 'Known').length;

  if (!stats && loading) {
    return (
      <div className="page">
        <p style={{ color: 'var(--color-text-muted)', fontSize: 16 }}>Loading engineering data...</p>
      </div>
    );
  }

  const materialColumns = [
    {
      key: 'nameLocalised',
      header: 'Material',
      render: (m: Material) => (
        <span style={{ color: m.count >= m.maximum ? 'var(--color-warning)' : 'var(--color-text-primary)' }}>
          {m.nameLocalised || m.name}
        </span>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (m: Material) => (
        <span style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>{m.category}</span>
      ),
    },
    {
      key: 'grade',
      header: 'Grade',
      render: (m: Material) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
          G{m.grade} <span style={{ color: 'var(--color-text-muted)' }}>({GRADE_LABELS[m.grade]})</span>
        </span>
      ),
    },
    {
      key: 'count',
      header: 'Stock',
      align: 'right' as const,
      render: (m: Material) => {
        const pct = m.maximum > 0 ? (m.count / m.maximum) * 100 : 0;
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
            <span style={{
              fontFamily: 'var(--font-mono)',
              color: pct >= 90 ? 'var(--color-warning)' : pct === 0 ? 'var(--color-text-muted)' : 'var(--color-accent-bright)',
            }}>
              {m.count}/{m.maximum}
            </span>
          </div>
        );
      },
    },
    {
      key: 'fill',
      header: 'Fill',
      width: '120px',
      align: 'center' as const,
      render: (m: Material) => (
        <HoloProgress
          value={m.count}
          max={m.maximum || 1}
          showPercent={false}
          height={6}
          style={{ minWidth: 80 }}
        />
      ),
    },
  ];

  return (
    <div className="page">
      <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-accent-bright)', letterSpacing: 3, marginBottom: 8, fontSize: 28 }}>ENGINEERING</h1>
      <p style={{ color: 'var(--color-text-muted)', fontSize: 15, marginBottom: 24 }}>
        Material inventory, engineer progress, and storage overview. Data updates in real-time from journal events.
      </p>

      {/* Category Summary */}
      <div className="grid-3" style={{ gap: 16, marginBottom: 20 }}>
        {['raw', 'manufactured', 'encoded'].map((cat) => {
          const s: CategoryStats | undefined = stats?.[cat];
          if (!s) return null;
          return (
            <HoloPanel key={cat} title={s.category}>
              <div style={{ fontSize: 14, lineHeight: 2 }}>
                <div>
                  <span style={{ color: 'var(--color-text-muted)' }}>Materials:</span>{' '}
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{s.count}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--color-text-muted)' }}>Storage:</span>{' '}
                  <span style={{ fontFamily: 'var(--font-mono)' }}>
                    {s.held.toLocaleString()} / {s.capacity.toLocaleString()}
                  </span>
                </div>
                <HoloProgress value={s.fillPercent} max={100} label={`${s.fillPercent}% full`} />
              </div>
            </HoloPanel>
          );
        })}
      </div>

      {/* Near-Cap Warning */}
      {nearCap.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <HoloPanel title="Materials Near Capacity" accent="var(--color-warning)">
            <p style={{ color: 'var(--color-text-muted)', fontSize: 12, marginBottom: 12 }}>
              These materials are at 90% capacity or above. Consider trading down at a material trader to avoid waste.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {nearCap.map((m) => (
                <div key={m.name} style={{
                  padding: '6px 12px',
                  background: 'rgba(255, 140, 0, 0.08)',
                  border: '1px solid var(--color-warning)',
                  borderRadius: 3,
                  fontSize: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}>
                  <span style={{ color: 'var(--color-warning)' }}>{m.nameLocalised || m.name}</span>
                  <span style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {m.count}/{m.maximum}
                  </span>
                </div>
              ))}
            </div>
          </HoloPanel>
        </div>
      )}

      {/* Engineers */}
      {engineers.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <HoloPanel title="Engineers">
            <div style={{
              display: 'flex', gap: 12, marginBottom: 14,
              fontSize: 12, color: 'var(--color-text-muted)',
            }}>
              <span>Unlocked: <strong style={{ color: 'var(--color-accent-bright)' }}>{unlocked}</strong></span>
              <span>Invited: <strong style={{ color: 'var(--color-warning)' }}>{invited}</strong></span>
              <span>Known: <strong style={{ color: 'var(--color-text-secondary)' }}>{known}</strong></span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
              {engineers.map((e) => (
                <div key={e.id} style={{
                  padding: 12,
                  background: 'var(--color-bg-tertiary)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 4,
                  fontSize: 13,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{
                      color: 'var(--color-accent-bright)',
                      fontFamily: 'var(--font-display)',
                      fontSize: 13,
                      letterSpacing: 1,
                    }}>
                      {e.name}
                    </span>
                    <HoloBadge variant={PROGRESS_VARIANT[e.progress] || 'default'}>
                      {e.progress}
                    </HoloBadge>
                  </div>
                  {e.rank != null && (
                    <div style={{ marginTop: 4 }}>
                      <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4 }}>
                        Grade {e.rank}
                      </div>
                      <HoloProgress
                        value={e.rankProgress}
                        max={100}
                        label={`Rank progress`}
                        height={5}
                        color="var(--color-accent)"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </HoloPanel>
        </div>
      )}

      {/* Material Inventory */}
      <HoloPanel title="Material Inventory">
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 16,
        }}>
          {/* Category filter buttons */}
          <div style={{ display: 'flex', gap: 6 }}>
            {(['all', 'Raw', 'Manufactured', 'Encoded'] as ActiveCategory[]).map((cat) => (
              <HoloButton
                key={cat}
                variant={activeCategory === cat ? 'primary' : 'secondary'}
                onClick={() => { setActiveCategory(cat); setSearchResults(null); setSearchQuery(''); }}
                style={{ fontSize: 10, padding: '4px 12px' }}
              >
                {cat === 'all' ? 'All' : cat}
              </HoloButton>
            ))}
          </div>

          {/* Search input */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Search materials..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (!e.target.value.trim()) setSearchResults(null);
              }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
              style={{
                padding: '5px 10px',
                fontSize: 12,
                fontFamily: 'var(--font-mono)',
                background: 'var(--color-bg-tertiary)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
                borderRadius: 2,
                width: 180,
              }}
            />
            <HoloButton
              variant="secondary"
              onClick={handleSearch}
              style={{ fontSize: 10, padding: '4px 10px' }}
            >
              Search
            </HoloButton>
          </div>
        </div>

        {searchResults !== null && (
          <div style={{ marginBottom: 10, fontSize: 12, color: 'var(--color-text-muted)' }}>
            Showing {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{searchQuery}"
            <span
              onClick={() => { setSearchResults(null); setSearchQuery(''); }}
              style={{ color: 'var(--color-accent-bright)', cursor: 'pointer', marginLeft: 8 }}
            >
              Clear
            </span>
          </div>
        )}

        {materialsLoading ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13, padding: 12 }}>Loading materials...</p>
        ) : (
          <HoloTable<Material>
            columns={materialColumns}
            data={displayMaterials}
            rowKey={(m, i) => `${m.name}-${i}`}
            emptyMessage={searchResults !== null ? 'No materials match your search' : 'No materials in inventory'}
          />
        )}
      </HoloPanel>
    </div>
  );
}
