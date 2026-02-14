import { useEffect, useState } from 'react';
import { useApi, apiFetch } from '../hooks/useApi';
import HoloPanel from '../components/common/HoloPanel';
import HoloButton from '../components/common/HoloButton';

const SETTING_LABELS: Record<string, string> = {
  shadows: 'Shadows',
  ambientOcclusion: 'AO',
  bloom: 'Bloom',
  fx: 'FX',
  materials: 'Materials',
  environment: 'Env',
  galaxyMap: 'Galaxy Map',
};

const badgeStyle = (value: string): React.CSSProperties => {
  const colors: Record<string, string> = {
    Off: 'var(--color-danger, #ff4444)',
    Low: 'var(--color-warning, #ffaa00)',
    Medium: 'var(--color-accent, #00aaff)',
    High: 'var(--color-success, #44ff44)',
    Ultra: 'var(--color-accent-bright, #ff44ff)',
  };
  return {
    display: 'inline-block',
    padding: '2px 6px',
    margin: '2px',
    fontSize: 10,
    fontFamily: 'var(--font-mono)',
    borderRadius: 3,
    border: `1px solid ${colors[value] || 'var(--color-border)'}`,
    color: colors[value] || 'var(--color-text-muted)',
    opacity: 0.9,
  };
};

export default function Graphics() {
  const { data, loading, fetch: load } = useApi<any>('/graphics');
  const [applying, setApplying] = useState(false);

  useEffect(() => { load(); }, [load]);

  const applyHud = async (name: string) => {
    setApplying(true);
    try {
      await apiFetch('/graphics/apply', { method: 'POST', body: JSON.stringify({ profileName: name }) });
      await load();
    } finally { setApplying(false); }
  };

  const applyQuality = async (name: string) => {
    setApplying(true);
    try {
      await apiFetch('/graphics/apply-quality', { method: 'POST', body: JSON.stringify({ presetName: name }) });
      await load();
    } finally { setApplying(false); }
  };

  return (
    <div className="page">
      <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-accent-bright)', letterSpacing: 3, marginBottom: 20 }}>GRAPHICS</h1>
      {loading && <p style={{ color: 'var(--color-text-muted)' }}>Loading...</p>}
      {data && (
        <>
          {/* Performance Modes */}
          <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-accent)', letterSpacing: 2, fontSize: 16, marginBottom: 8 }}>PERFORMANCE MODES</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 12, marginBottom: 12 }}>
            Quality settings take effect on next game restart. Can also be triggered via COVAS voice commands.
          </p>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13, marginBottom: 16 }}>
            Active: <strong style={{ color: 'var(--color-accent-bright)' }}>{data.activeQualityPreset}</strong>
          </p>
          <div className="grid-3" style={{ gap: 16, marginBottom: 32 }}>
            {data.qualityPresets?.map((preset: any) => (
              <HoloPanel key={preset.name} title={preset.name}>
                <p style={{ color: 'var(--color-text-muted)', fontSize: 13, marginBottom: 10 }}>{preset.description}</p>
                <div style={{ marginBottom: 10 }}>
                  {Object.entries(preset.settings).map(([key, value]) => (
                    <span key={key} style={badgeStyle(value as string)}>
                      {SETTING_LABELS[key] || key}: {value as string}
                    </span>
                  ))}
                </div>
                <HoloButton onClick={() => applyQuality(preset.name)} disabled={applying || data.activeQualityPreset === preset.name}>
                  {data.activeQualityPreset === preset.name ? 'Active' : 'Apply'}
                </HoloButton>
              </HoloPanel>
            ))}
          </div>

          {/* HUD Color Profiles */}
          <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-accent)', letterSpacing: 2, fontSize: 16, marginBottom: 8 }}>HUD COLOR PROFILES</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13, marginBottom: 16 }}>
            Active: <strong style={{ color: 'var(--color-accent-bright)' }}>{data.activeProfile}</strong>
          </p>
          <div className="grid-2" style={{ gap: 16 }}>
            {data.profiles?.map((p: any) => (
              <HoloPanel key={p.name} title={p.name}>
                <p style={{ color: 'var(--color-text-muted)', fontSize: 13, marginBottom: 10 }}>{p.description}</p>
                <div style={{ fontSize: 11, marginBottom: 10, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>
                  R: [{p.hudMatrix.matrixRed.join(', ')}]<br/>
                  G: [{p.hudMatrix.matrixGreen.join(', ')}]<br/>
                  B: [{p.hudMatrix.matrixBlue.join(', ')}]
                </div>
                <HoloButton onClick={() => applyHud(p.name)} disabled={applying || data.activeProfile === p.name}>
                  {data.activeProfile === p.name ? 'Active' : 'Apply'}
                </HoloButton>
              </HoloPanel>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
