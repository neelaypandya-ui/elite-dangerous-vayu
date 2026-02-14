/**
 * VAYU Theme Constants
 *
 * TypeScript-accessible version of the CSS custom properties.
 * Use these in inline styles, styled-components, or any JS-based styling.
 */

export const theme = {
  colors: {
    bgPrimary: '#0a0e14',
    bgSecondary: '#111923',
    bgTertiary: '#1a2332',
    bgPanel: '#0d1117',

    border: '#1e3a2e',
    borderBright: '#4e9a3e',

    textPrimary: '#e0e0e0',
    textSecondary: '#8899aa',
    textMuted: '#556677',

    accent: '#4e9a3e',
    accentBright: '#6fcf5c',
    accentDim: '#2d5a28',

    warning: '#ff8c00',
    danger: '#ff4444',
    info: '#4e9ad0',
    success: '#4e9a3e',
  },

  fonts: {
    display: "'Orbitron', sans-serif",
    body: "'Share Tech Mono', monospace",
    mono: "'Share Tech Mono', monospace",
  },

  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
    '3xl': '64px',
  },

  borderRadius: {
    sm: '2px',
    md: '4px',
    lg: '8px',
  },

  transition: {
    fast: '120ms ease',
    normal: '240ms ease',
    slow: '480ms ease',
  },

  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
} as const;

/** Type representing the theme object */
export type Theme = typeof theme;
