import { useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import HoloPanel from '../components/common/HoloPanel';

const threatColor = (level: string) => level === 'high' ? '#ff4444' : level === 'medium' ? '#ffaa00' : '#4488cc';

export default function Threats() {
  const { data, loading, fetch: load } = useApi<any>('/threats');
  useEffect(() => { load(); const t = setInterval(load, 10000); return () => clearInterval(t); }, [load]);

  return (
    <div className="page">
      <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-accent-bright)', letterSpacing: 3, marginBottom: 20 }}>THREAT INTEL</h1>
      {loading && <p style={{ color: 'var(--color-text-muted)' }}>Loading...</p>}
      {data && (
        <>
          <HoloPanel title="Current System Threat Assessment">
            {data.current ? (
              <div style={{ padding: 8, fontSize: 13, lineHeight: 1.8 }}>
                <div style={{ fontSize: 18, fontFamily: 'var(--font-display)', color: threatColor(data.current.threatLevel), marginBottom: 8 }}>
                  {data.current.system} — {(data.current.threatLevel || 'unknown').toUpperCase()}
                </div>
                <div><span style={{ color: 'var(--color-text-muted)' }}>Security:</span> {data.current.security || 'Unknown'}</div>
                {data.current.isAnarchy && <div style={{ color: '#ff4444' }}>WARNING: Anarchy system — no security response</div>}
                {data.current.hasPermitLock && <div style={{ color: '#ffaa00' }}>Near permit-locked boundary</div>}
                {data.current.warnings?.map((w: string, i: number) => (
                  <div key={i} style={{ color: '#ffaa00', fontSize: 12 }}>{w}</div>
                ))}
              </div>
            ) : <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>No system data available</p>}
          </HoloPanel>
          <div className="grid-2" style={{ gap: 16, marginTop: 16 }}>
            <HoloPanel title="Known Hotspots">
              {data.known?.length > 0 ? data.known.map((s: any, i: number) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)', fontSize: 13 }}>
                  <span>{s.system}</span>
                  <span style={{ color: threatColor(s.threatLevel), fontSize: 11, textTransform: 'uppercase' }}>{s.threatLevel}</span>
                </div>
              )) : <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>No known hotspots</p>}
            </HoloPanel>
            <HoloPanel title="Interdiction History">
              {data.interdictions?.length > 0 ? data.interdictions.map((d: any, i: number) => (
                <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid var(--color-border)', fontSize: 13 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{d.system}</span>
                    <span style={{ color: d.submitted ? '#ffaa00' : '#ff4444', fontSize: 11 }}>{d.submitted ? 'Submitted' : 'Evaded'}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{d.interdictor || 'Unknown'} \u2022 {d.timestamp ? new Date(d.timestamp).toLocaleString() : ''}</div>
                </div>
              )) : <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>No interdictions recorded</p>}
            </HoloPanel>
          </div>
        </>
      )}
    </div>
  );
}
