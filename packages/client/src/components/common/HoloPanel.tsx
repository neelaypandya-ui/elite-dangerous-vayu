import type { CSSProperties, ReactNode } from 'react';

interface HoloPanelProps {
  title?: string;
  children: ReactNode;
  style?: CSSProperties;
  accent?: string;
}

export default function HoloPanel({ title, children, style, accent }: HoloPanelProps) {
  const accentColor = accent || 'var(--color-accent)';
  return (
    <div style={{
      background: 'var(--color-bg-panel)',
      border: '1px solid var(--color-border)',
      borderRadius: 4,
      overflow: 'hidden',
      ...style,
    }}>
      {title && (
        <div style={{
          padding: '10px 16px',
          borderBottom: '1px solid var(--color-border)',
          fontFamily: 'var(--font-display)',
          fontSize: 13,
          letterSpacing: 2,
          color: accentColor,
          textTransform: 'uppercase',
          background: 'rgba(78, 154, 62, 0.05)',
        }}>
          {title}
        </div>
      )}
      <div style={{ padding: 16 }}>
        {children}
      </div>
    </div>
  );
}
