import { useEffect, useState } from 'react';
import { useApi, apiFetch } from '../hooks/useApi';
import { useWebSocket } from '../hooks/useWebSocket';
import HoloPanel from '../components/common/HoloPanel';
import HoloButton from '../components/common/HoloButton';
import HoloBadge from '../components/common/HoloBadge';
import HoloTable from '../components/common/HoloTable';

const severityVariant = (s: string) =>
  s === 'critical' ? 'danger' as const : s === 'warning' ? 'warning' as const : 'info' as const;

const severityColor: Record<string, string> = { info: '#4488cc', warning: '#ffaa00', critical: '#ff4444' };

interface AlertRule {
  id: string;
  name: string;
  enabled: boolean;
  condition: string;
  threshold?: number;
  tts?: boolean;
}

interface AlertEvent {
  id: string;
  ruleId: string;
  ruleName: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: string;
  acknowledged: boolean;
}

export default function Alerts() {
  const { data, loading, fetch: load } = useApi<any>('/alerts');
  const [history, setHistory] = useState<AlertEvent[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const { subscribe } = useWebSocket();

  useEffect(() => { load(); const t = setInterval(load, 5000); return () => clearInterval(t); }, [load]);

  // Load full alert history
  useEffect(() => {
    setLoadingHistory(true);
    apiFetch<AlertEvent[]>('/alerts/history?limit=50').then(h => {
      setHistory(Array.isArray(h) ? h : []);
    }).catch(() => {}).finally(() => setLoadingHistory(false));
  }, []);

  // Subscribe to real-time alert events
  useEffect(() => {
    const unsub = subscribe('alert:fired', (env) => {
      const alert = env.payload as AlertEvent;
      setHistory(prev => [alert, ...prev].slice(0, 100));
    });
    return unsub;
  }, [subscribe]);

  const rules: AlertRule[] = data?.rules || [];
  const recent: AlertEvent[] = data?.recent || [];

  const toggleRule = async (id: string, enabled: boolean) => {
    await apiFetch(`/alerts/rules/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ enabled }),
    });
    await load();
  };

  const updateThreshold = async (id: string, threshold: number) => {
    await apiFetch(`/alerts/rules/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ threshold }),
    });
    await load();
  };

  const acknowledgeAlert = async (alertId: string) => {
    await apiFetch(`/alerts/acknowledge/${alertId}`, { method: 'POST' });
    setHistory(prev => prev.map(a => a.id === alertId ? { ...a, acknowledged: true } : a));
    await load();
  };

  const clearHistory = async () => {
    await apiFetch('/alerts/clear', { method: 'POST' });
    setHistory([]);
    await load();
  };

  const unacknowledgedCount = recent.filter(a => !a.acknowledged).length;

  return (
    <div className="page">
      <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-accent-bright)', letterSpacing: 3, marginBottom: 8, fontSize: 28 }}>ALERTS</h1>
      <p style={{ color: 'var(--color-text-muted)', fontSize: 15, marginBottom: 24 }}>
        Configurable alert rules that monitor your game state in real time. Alerts fire for low fuel, hull damage, interdictions, and more.
      </p>
      {loading && !data && <p style={{ color: 'var(--color-text-muted)', fontSize: 15 }}>Loading...</p>}

      {/* Summary stats */}
      {data && (
        <div className="grid-4" style={{ gap: 16, marginBottom: 20 }}>
          {[
            ['Active Rules', rules.filter(r => r.enabled).length, 'var(--color-accent-bright)'],
            ['Total Rules', rules.length, '#4488cc'],
            ['Unacknowledged', unacknowledgedCount, unacknowledgedCount > 0 ? '#ff4444' : '#4488cc'],
            ['Total Fired', recent.length, '#ffaa00'],
          ].map(([l, v, c]) => (
            <HoloPanel key={l as string}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontFamily: 'var(--font-display)', color: c as string }}>{v}</div>
                <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>{l as string}</div>
              </div>
            </HoloPanel>
          ))}
        </div>
      )}

      <div className="grid-2" style={{ gap: 20 }}>
        {/* Alert Rules Configuration */}
        <HoloPanel title="Alert Rules">
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)', fontStyle: 'italic', padding: '4px 0 12px', borderBottom: '1px solid var(--color-border)', marginBottom: 10 }}>
            Toggle rules on/off and adjust thresholds. Changes take effect immediately.
          </div>
          {rules.length > 0 ? rules.map((r) => (
            <div key={r.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 0', borderBottom: '1px solid var(--color-border)',
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, color: r.enabled ? '#fff' : 'var(--color-text-muted)', marginBottom: 4 }}>
                  {r.name}
                  {r.tts && <span style={{ fontSize: 10, color: 'var(--color-accent)', marginLeft: 8 }}>TTS</span>}
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                  Condition: {r.condition.replace(/_/g, ' ')}
                  {r.threshold != null && (
                    <span>
                      {' '}| Threshold:{' '}
                      <input
                        type="number"
                        value={r.threshold}
                        onChange={(e) => updateThreshold(r.id, parseInt(e.target.value) || 0)}
                        style={{
                          width: 50, background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)',
                          color: '#fff', padding: '2px 4px', fontSize: 11, fontFamily: 'var(--font-mono)',
                        }}
                      />
                      {r.condition === 'mission_expiring' ? 'h' : '%'}
                    </span>
                  )}
                </div>
              </div>
              <HoloButton
                variant={r.enabled ? 'primary' : 'secondary'}
                onClick={() => toggleRule(r.id, !r.enabled)}
                style={{ minWidth: 60 }}
              >
                {r.enabled ? 'ON' : 'OFF'}
              </HoloButton>
            </div>
          )) : <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>No alert rules configured</p>}
        </HoloPanel>

        {/* Recent Alerts (live feed) */}
        <HoloPanel title="Recent Alerts">
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)', fontStyle: 'italic', padding: '4px 0 12px', borderBottom: '1px solid var(--color-border)', marginBottom: 10 }}>
            Live feed of triggered alerts. Critical alerts flash in red. Click to acknowledge.
          </div>
          {recent.length > 0 ? (
            <>
              {recent.map((a) => (
                <div key={a.id} style={{
                  padding: '10px 0', borderBottom: '1px solid var(--color-border)',
                  opacity: a.acknowledged ? 0.5 : 1,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <HoloBadge variant={severityVariant(a.severity)}>{a.severity}</HoloBadge>
                      <span style={{ color: severityColor[a.severity] || '#fff', fontSize: 14 }}>{a.ruleName}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: 'var(--color-text-muted)', fontSize: 11 }}>
                        {new Date(a.timestamp).toLocaleTimeString()}
                      </span>
                      {!a.acknowledged && (
                        <HoloButton variant="secondary" onClick={() => acknowledgeAlert(a.id)} style={{ padding: '2px 8px', fontSize: 10 }}>
                          ACK
                        </HoloButton>
                      )}
                    </div>
                  </div>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: 12, paddingLeft: 4 }}>{a.message}</div>
                </div>
              ))}
              <div style={{ marginTop: 12 }}>
                <HoloButton variant="danger" onClick={clearHistory}>Clear All Alerts</HoloButton>
              </div>
            </>
          ) : <p style={{ color: 'var(--color-text-muted)', fontSize: 13, textAlign: 'center', padding: 20 }}>No alerts fired yet. Fly safe, Commander.</p>}
        </HoloPanel>
      </div>

      {/* Full Alert History Table */}
      <div style={{ marginTop: 20 }}>
        <HoloPanel title="Alert History">
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)', fontStyle: 'italic', padding: '4px 0 12px', borderBottom: '1px solid var(--color-border)', marginBottom: 10 }}>
            Comprehensive log of all alerts triggered this session. Most recent alerts appear first.
          </div>
          {loadingHistory && <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>Loading history...</p>}
          <HoloTable
            columns={[
              { key: 'severity', header: 'Severity', width: '90px', render: (row: AlertEvent) => <HoloBadge variant={severityVariant(row.severity)}>{row.severity}</HoloBadge> },
              { key: 'ruleName', header: 'Rule' },
              { key: 'message', header: 'Message' },
              { key: 'timestamp', header: 'Time', width: '100px', render: (row: AlertEvent) => new Date(row.timestamp).toLocaleTimeString() },
              { key: 'acknowledged', header: 'Status', width: '80px', align: 'center', render: (row: AlertEvent) => (
                row.acknowledged
                  ? <span style={{ color: 'var(--color-text-muted)', fontSize: 11 }}>ACK</span>
                  : <HoloButton variant="secondary" onClick={() => acknowledgeAlert(row.id)} style={{ padding: '2px 6px', fontSize: 9 }}>ACK</HoloButton>
              )},
            ]}
            data={history}
            rowKey={(row) => row.id}
            emptyMessage="No alerts recorded"
          />
        </HoloPanel>
      </div>
    </div>
  );
}
