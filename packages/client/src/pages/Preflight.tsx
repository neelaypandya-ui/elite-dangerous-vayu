import { useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import HoloPanel from '../components/common/HoloPanel';

const statusColor = (s: string) => s === 'ok' ? '#4E9A3E' : s === 'warning' ? '#ffaa00' : s === 'critical' ? '#ff4444' : 'var(--color-text-muted)';
const statusIcon = (s: string) => s === 'ok' ? '\u2713' : s === 'warning' ? '\u26A0' : s === 'critical' ? '\u2717' : '?';

export default function Preflight() {
  const { data, loading, fetch: load } = useApi<any>('/preflight');
  useEffect(() => { load(); }, [load]);

  const checks = data?.checklist || [];
  const passed = checks.filter((c: any) => c.status === 'ok').length;
  const total = checks.length;

  return (
    <div className="page">
      <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-accent-bright)', letterSpacing: 3, marginBottom: 20 }}>PRE-FLIGHT CHECK</h1>
      {loading && <p style={{ color: 'var(--color-text-muted)' }}>Running diagnostics...</p>}
      {data && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <div style={{ fontSize: 36, fontFamily: 'var(--font-display)', color: passed === total ? '#4E9A3E' : '#ffaa00' }}>{passed}/{total}</div>
            <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
              {passed === total ? 'All systems nominal. Ready for launch.' : 'Some checks require attention before departure.'}
            </div>
          </div>
          <HoloPanel title="System Checklist">
            {checks.map((c: any) => (
              <div key={c.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--color-border)' }}>
                <div>
                  <div style={{ fontSize: 13 }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{c.details}</div>
                </div>
                <span style={{ color: statusColor(c.status), fontFamily: 'var(--font-mono)', fontSize: 16, minWidth: 24, textAlign: 'center' }}>{statusIcon(c.status)}</span>
              </div>
            ))}
          </HoloPanel>
        </>
      )}
    </div>
  );
}
