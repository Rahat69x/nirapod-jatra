/**
 * Nirapod Jatra (নিরাপদ যাত্রা) — JavaScript Design Tokens
 * Mode: Operate & Experience
 */

const tokens = {
  colors: {
    primary: {
      50: '#ecfdf5',
      100: '#d1fae5',
      500: '#10b981',
      600: '#059669',
      700: '#047857',
      800: '#065f46',
      900: '#064e3b',
      950: '#022c22'
    },
    accent: {
      50: '#fffbeb',
      100: '#fef3c7',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309'
    },
    danger: {
      50: '#fef2f2',
      100: '#fee2e2',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      900: '#7f1d1d'
    },
    neutral: {
      0: '#ffffff',
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
      950: '#020617'
    }
  },
  typography: {
    fontFamily: {
      bangla: "'Hind Siliguri', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      latin: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
    },
    fontSize: {
      display: 'clamp(1.75rem, 3.5vw, 2.25rem)',
      h1: '1.5rem',
      h2: '1.25rem',
      h3: '1.0625rem',
      body: '0.9375rem',
      small: '0.8125rem',
      caption: '0.6875rem'
    },
    lineHeight: {
      tight: 1.2,
      snug: 1.35,
      normal: 1.5,
      relaxed: 1.625
    }
  },
  spacing: {
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    8: '32px',
    10: '40px',
    12: '48px'
  },
  rounded: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    '2xl': '24px',
    full: '9999px'
  },
  shadows: {
    xs: '0 1px 2px 0 rgba(15, 23, 42, 0.05)',
    sm: '0 1px 3px 0 rgba(15, 23, 42, 0.08), 0 1px 2px -1px rgba(15, 23, 42, 0.08)',
    md: '0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.08)',
    lg: '0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.08)',
    xl: '0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.1)'
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = tokens;
}
