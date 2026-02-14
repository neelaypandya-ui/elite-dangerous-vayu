import type { CSSProperties } from 'react';

interface HoloProgressProps {
  value: number;
  max?: number;       // If provided, value is scaled to 0-100 using max
  label?: string;
  showPercent?: boolean;
  color?: string;
  height?: number;
  style?: CSSProperties;
}

export default function HoloProgress({ value, max, label, showPercent = true, color, height = 8, style }: HoloProgressProps) {
  const pct = Math.max(0, Math.min(100, max ? (value / max) * 100 : value));
  const barColor = color || (pct > 50 ? 'var(--color-accent)' : pct > 25 ? 'var(--color-warning)' : 'var(--color-danger)');

  return (
    <div style={{ ...style }}>
      {(label || showPercent) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 11 }}>
          {label && <span style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-display)', letterSpacing: 1, fontSize: 10 }}>{label}</span>}
          {showPercent && <span style={{ color: 'var(--color-text-secondary)' }}>{Math.round(pct)}%</span>}
        </div>
      )}
      <div style={{ height, background: 'var(--color-bg-tertiary)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: barColor,
          borderRadius: 2,
          transition: 'width 0.4s ease',
          boxShadow: `0 0 6px ${barColor}`,
        }} />
      </div>
    </div>
  );
}
