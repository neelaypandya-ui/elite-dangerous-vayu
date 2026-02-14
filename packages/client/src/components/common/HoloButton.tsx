import type { CSSProperties, ReactNode, ButtonHTMLAttributes } from 'react';

interface HoloButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  children: ReactNode;
}

const VARIANTS: Record<string, CSSProperties> = {
  primary: { borderColor: 'var(--color-accent)', color: 'var(--color-accent-bright)', background: 'rgba(78, 154, 62, 0.15)' },
  secondary: { borderColor: 'var(--color-border-bright)', color: 'var(--color-text-secondary)', background: 'rgba(255,255,255,0.03)' },
  danger: { borderColor: 'var(--color-danger)', color: 'var(--color-danger)', background: 'rgba(255, 68, 68, 0.1)' },
};

export default function HoloButton({ variant = 'primary', children, style, ...props }: HoloButtonProps) {
  const v = VARIANTS[variant];
  return (
    <button
      {...props}
      style={{
        padding: '6px 16px',
        border: '1px solid',
        borderRadius: 2,
        fontFamily: 'var(--font-display)',
        fontSize: 11,
        letterSpacing: 1,
        cursor: 'pointer',
        textTransform: 'uppercase',
        transition: 'all 0.15s',
        ...v,
        ...style,
      }}
    >
      {children}
    </button>
  );
}
