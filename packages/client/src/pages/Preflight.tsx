import { useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import HoloPanel from '../components/common/HoloPanel';
import HoloButton from '../components/common/HoloButton';
import HoloBadge from '../components/common/HoloBadge';
import HoloProgress from '../components/common/HoloProgress';

const statusColor = (s: string) =>
  s === 'pass' ? '#4E9A3E' : s === 'warn' ? '#ffaa00' : s === 'fail' ? '#ff4444' : 'var(--color-text-muted)';

const statusIcon = (s: string) =>
  s === 'pass' ? '\u2713' : s === 'warn' ? '\u26A0' : s === 'fail' ? '\u2717' : '\u2139';

const statusVariant = (s: string) =>
  s === 'pass' ? 'success' as const : s === 'warn' ? 'warning' as const : s === 'fail' ? 'danger' as const : 'info' as const;

const categoryLabel: Record<string, string> = {
  fuel: 'FUEL SYSTEMS',
  ship: 'SHIP SYSTEMS',
  cargo: 'CARGO BAY',
  missions: 'MISSION BOARD',
  modules: 'MODULE INTEGRITY',
};

interface PreflightCheck {
  id: string;
  label: string;
  category: string;
  status: 'pass' | 'warn' | 'fail' | 'info';
  message: string;
}

export default function Preflight() {
  const { data, loading, fetch: load } = useApi<any>('/preflight');
  useEffect(() => { load(); }, [load]);

  const checks: PreflightCheck[] = data?.checks || [];
  const summary = data?.summary || { total: 0, pass: 0, warn: 0, fail: 0, info: 0, readyToLaunch: false };

  // Group checks by category
  const categories = checks.reduce<Record<string, PreflightCheck[]>>((acc, check) => {
    if (!acc[check.category]) acc[check.category] = [];
    acc[check.category].push(check);
    return acc;
  }, {});

  const overallColor = summary.fail > 0 ? '#ff4444' : summary.warn > 0 ? '#ffaa00' : '#4E9A3E';
  const overallStatus = summary.fail > 0 ? 'SYSTEMS CRITICAL' : summary.warn > 0 ? 'WARNINGS DETECTED' : 'ALL SYSTEMS NOMINAL';

  return (
    <div className="page">
      <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-accent-bright)', letterSpacing: 3, marginBottom: 8, fontSize: 28 }}>PRE-FLIGHT CHECK</h1>
      <p style={{ color: 'var(--color-text-muted)', fontSize: 15, marginBottom: 24 }}>
        Automated diagnostics of all ship systems before departure. Verifies fuel, hull integrity, module health, cargo, missions, and rebuy coverage.
      </p>
      {loading && !data && <p style={{ color: 'var(--color-text-muted)', fontSize: 15 }}>Running diagnostics...</p>}

      {data && (
        <>
          {/* Overall Status Banner */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: `${overallColor}11`, border: `1px solid ${overallColor}`,
            borderRadius: 4, padding: '16px 24px', marginBottom: 24,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                fontSize: 42, fontFamily: 'var(--font-display)', color: overallColor,
              }}>
                {summary.pass}/{summary.total}
              </div>
              <div>
                <div style={{
                  fontSize: 18, fontFamily: 'var(--font-display)', color: overallColor,
                  letterSpacing: 2, marginBottom: 4,
                }}>
                  {overallStatus}
                </div>
                <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                  {summary.readyToLaunch
                    ? 'All critical systems operational. You are cleared for departure.'
                    : summary.fail > 0
                      ? `${summary.fail} critical issue${summary.fail !== 1 ? 's' : ''} detected. Resolve before launch.`
                      : `${summary.warn} warning${summary.warn !== 1 ? 's' : ''} detected. Review before launch.`}
                </div>
              </div>
            </div>
            <HoloButton onClick={load} style={{ marginLeft: 16 }}>Re-Run Checks</HoloButton>
          </div>

          {/* Summary Counters */}
          <div className="grid-4" style={{ gap: 16, marginBottom: 24 }}>
            {[
              ['Pass', summary.pass, '#4E9A3E'],
              ['Warnings', summary.warn, '#ffaa00'],
              ['Failures', summary.fail, '#ff4444'],
              ['Info', summary.info, '#4488cc'],
            ].map(([l, v, c]) => (
              <HoloPanel key={l as string}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontFamily: 'var(--font-display)', color: c as string }}>{v}</div>
                  <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>{l as string}</div>
                </div>
              </HoloPanel>
            ))}
          </div>

          {/* Overall health bar */}
          <div style={{ marginBottom: 24 }}>
            <HoloProgress
              value={summary.pass}
              max={summary.total}
              label="OVERALL READINESS"
              color={overallColor}
              height={12}
            />
          </div>

          {/* Checks grouped by category */}
          <div className="grid-2" style={{ gap: 20 }}>
            {Object.entries(categories).map(([category, catChecks]) => {
              const catFails = catChecks.filter(c => c.status === 'fail').length;
              const catWarns = catChecks.filter(c => c.status === 'warn').length;
              const catColor = catFails > 0 ? '#ff4444' : catWarns > 0 ? '#ffaa00' : '#4E9A3E';

              return (
                <HoloPanel key={category} title={categoryLabel[category] || category.toUpperCase()} accent={catColor}>
                  {catChecks.map((check) => (
                    <div key={check.id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '12px 0', borderBottom: '1px solid var(--color-border)',
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                          <span style={{
                            color: statusColor(check.status), fontFamily: 'var(--font-mono)',
                            fontSize: 18, minWidth: 24, textAlign: 'center',
                          }}>
                            {statusIcon(check.status)}
                          </span>
                          <span style={{ fontSize: 14, color: check.status === 'fail' ? '#ff4444' : '#fff' }}>
                            {check.label}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--color-text-muted)', paddingLeft: 34 }}>
                          {check.message}
                        </div>
                      </div>
                      <HoloBadge variant={statusVariant(check.status)}>
                        {check.status}
                      </HoloBadge>
                    </div>
                  ))}
                </HoloPanel>
              );
            })}
          </div>

          {/* Full Checklist (flat view) */}
          <div style={{ marginTop: 24 }}>
            <HoloPanel title="Complete Checklist">
              <div style={{ fontSize: 13, color: 'var(--color-text-muted)', fontStyle: 'italic', padding: '4px 0 12px', borderBottom: '1px solid var(--color-border)', marginBottom: 10 }}>
                Flat view of all pre-flight checks. Failures and warnings are listed first.
              </div>
              {[...checks].sort((a, b) => {
                const order: Record<string, number> = { fail: 0, warn: 1, info: 2, pass: 3 };
                return (order[a.status] ?? 4) - (order[b.status] ?? 4);
              }).map((c) => (
                <div key={c.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 0', borderBottom: '1px solid var(--color-border)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{
                      color: statusColor(c.status), fontFamily: 'var(--font-mono)', fontSize: 16,
                      minWidth: 20, textAlign: 'center',
                    }}>
                      {statusIcon(c.status)}
                    </span>
                    <div>
                      <div style={{ fontSize: 13 }}>{c.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{c.message}</div>
                    </div>
                  </div>
                  <span style={{
                    fontSize: 10, fontFamily: 'var(--font-display)', letterSpacing: 1,
                    color: 'var(--color-text-muted)', textTransform: 'uppercase',
                  }}>
                    {c.category}
                  </span>
                </div>
              ))}
            </HoloPanel>
          </div>
        </>
      )}
    </div>
  );
}
