import type { CSSProperties, ReactNode } from 'react';

interface HoloBadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  style?: CSSProperties;
}

const COLORS: Record<string, { bg: string; fg: string; border: string }> = {
  default: { bg: 'rgba(78, 154, 62, 0.15)', fg: 'var(--color-accent-bright)', border: 'var(--color-accent)' },
  success: { bg: 'rgba(78, 154, 62, 0.15)', fg: 'var(--color-success)', border: 'var(--color-success)' },
  warning: { bg: 'rgba(255, 140, 0, 0.15)', fg: 'var(--color-warning)', border: 'var(--color-warning)' },
  danger: { bg: 'rgba(255, 68, 68, 0.15)', fg: 'var(--color-danger)', border: 'var(--color-danger)' },
  info: { bg: 'rgba(78, 154, 208, 0.15)', fg: 'var(--color-info)', border: 'var(--color-info)' },
};

export default function HoloBadge({ children, variant = 'default', style }: HoloBadgeProps) {
  const c = COLORS[variant];
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      fontSize: 10,
      fontFamily: 'var(--font-display)',
      letterSpacing: 1,
      textTransform: 'uppercase',
      borderRadius: 2,
      border: `1px solid ${c.border}`,
      background: c.bg,
      color: c.fg,
      ...style,
    }}>
      {children}
    </span>
  );
}
