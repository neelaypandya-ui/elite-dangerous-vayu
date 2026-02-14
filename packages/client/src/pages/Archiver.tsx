import { useEffect, useState } from 'react';
import { useApi, apiFetch } from '../hooks/useApi';
import HoloPanel from '../components/common/HoloPanel';
import HoloButton from '../components/common/HoloButton';

export default function Archiver() {
  const { data, loading, fetch: load } = useApi<any>('/archiver');
  const [backing, setBacking] = useState(false);
  useEffect(() => { load(); }, [load]);

  const backup = async () => { setBacking(true); try { await apiFetch('/archiver/backup', { method: 'POST' }); await load(); } finally { setBacking(false); } };

  return (
    <div className="page">
      <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-accent-bright)', letterSpacing: 3, marginBottom: 20 }}>JOURNAL ARCHIVER</h1>
      {loading && <p style={{ color: 'var(--color-text-muted)' }}>Loading...</p>}
      {data && (
        <>
          <div className="grid-2" style={{ gap: 16, marginBottom: 20 }}>
            <HoloPanel title="Archive Status">
              <div style={{ padding: 8, fontSize: 13, lineHeight: 1.8 }}>
                <div><span style={{ color: 'var(--color-text-muted)' }}>Journal Files:</span> {data.totalFiles || 0}</div>
                <div><span style={{ color: 'var(--color-text-muted)' }}>Total Size:</span> {data.totalSize ? `${(data.totalSize / 1e6).toFixed(1)} MB` : '0 MB'}</div>
                <div><span style={{ color: 'var(--color-text-muted)' }}>Last Backup:</span> {data.lastBackup ? new Date(data.lastBackup).toLocaleString() : 'Never'}</div>
                <div><span style={{ color: 'var(--color-text-muted)' }}>Archive Size:</span> {data.archiveSize ? `${(data.archiveSize / 1e6).toFixed(1)} MB` : '0 MB'}</div>
              </div>
              <div style={{ padding: '0 8px 8px' }}>
                <HoloButton onClick={backup} disabled={backing}>{backing ? 'Backing up...' : 'Backup Now'}</HoloButton>
              </div>
            </HoloPanel>
            <HoloPanel title="Configuration">
              <div style={{ padding: 8, fontSize: 13, lineHeight: 1.8, color: 'var(--color-text-muted)' }}>
                <div>Source: <span style={{ color: '#fff' }}>{data.sourcePath || 'Default journal directory'}</span></div>
                <div>Backup To: <span style={{ color: '#fff' }}>{data.backupPath || 'Not configured'}</span></div>
                <div>Compression: <span style={{ color: '#fff' }}>{data.compression ? 'Enabled' : 'Disabled'}</span></div>
                <div>Retention: <span style={{ color: '#fff' }}>{data.retentionDays ? `${data.retentionDays} days` : 'Unlimited'}</span></div>
              </div>
            </HoloPanel>
          </div>
          <HoloPanel title="Backup History">
            {data.history?.length > 0 ? data.history.map((h: any, i: number) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)', fontSize: 13 }}>
                <div>
                  <div>{new Date(h.timestamp).toLocaleString()}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{h.filesCount || 0} files</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: h.success ? '#4E9A3E' : '#ff4444' }}>{h.success ? 'Success' : 'Failed'}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{h.size ? `${(h.size / 1e6).toFixed(1)} MB` : ''}</div>
                </div>
              </div>
            )) : <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>No backups yet</p>}
          </HoloPanel>
        </>
      )}
    </div>
  );
}
