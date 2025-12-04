/**
 * Design System Theme
 * Tea App inspired pastel color palette with solid, vivid colors
 */

export const colors = {
  // Background Colors
  cream: '#FFF8E1',
  
  // Primary Pastel Colors
  lavender: '#E0CCFF',
  lavenderLight: '#F0E4FF',
  mintGreen: '#A0FFB0',
  mintLight: '#C5FFD0',
  pink: '#FFD4D4',
  pinkLight: '#FFE5E5',
  purple: '#D4B5FF',
  skyBlue: '#C5E4FF',
  peach: '#FFCFB3',
  
  // Text Colors
  textPrimary: '#2A2A2A',
  textSecondary: '#5A5A5A',
  textMuted: '#8A8A8A',
  
  // Utility
  white: '#FFFFFF',
  black: '#000000',
} as const;

export const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  xxl: '3rem',
} as const;

export const borderRadius = {
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  xxl: '24px',
} as const;

export const borders = {
  thin: `2px solid ${colors.textPrimary}`,
  thick: `3px solid ${colors.textPrimary}`,
} as const;

export const shadows = {
  sm: '0 2px 4px rgba(0, 0, 0, 0.1)',
  md: '0 4px 8px rgba(0, 0, 0, 0.1)',
  lg: '0 8px 16px rgba(0, 0, 0, 0.15)',
} as const;

export const typography = {
  fontFamily: {
    primary: "'DM Sans', 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
    fallback: "system-ui, -apple-system, sans-serif",
  },
  fontWeights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
    '5xl': '3rem',     // 48px
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

// Maintain backwards compatibility
export const fontWeights = typography.fontWeights;

export const transitions = {
  fast: 'all 0.2s ease',
  normal: 'all 0.3s ease',
} as const;

/**
 * Component-specific color mappings
 * These define which colors to use for specific UI elements
 */
export const componentColors = {
  navbar: {
    background: colors.lavenderLight,
    text: colors.textPrimary,
  },
  buttons: {
    primary: {
      background: colors.mintGreen,
      hover: colors.mintLight,
      text: colors.textPrimary,
    },
    secondary: {
      background: colors.pink,
      hover: '#FFC4C4',
      text: colors.textPrimary,
    },
    tertiary: {
      background: colors.skyBlue,
      hover: '#B5D9FF',
      text: colors.textPrimary,
    },
    purple: {
      background: colors.lavender,
      hover: colors.purple,
      text: colors.textPrimary,
    },
  },
  cards: {
    primary: colors.lavender,
    secondary: colors.white,
    accent: colors.pinkLight,
  },
  inputs: {
    background: colors.white,
    focusBackground: colors.lavenderLight,
    border: colors.textPrimary,
  },
  page: {
    background: colors.cream,
  },
} as const;

/**
 * Helper function to get CSS variable name
 */
export const cssVar = (value: string): string => {
  const varMap: Record<string, string> = {
    [colors.cream]: 'var(--cream-bg)',
    [colors.lavender]: 'var(--lavender)',
    [colors.lavenderLight]: 'var(--lavender-light)',
    [colors.mintGreen]: 'var(--mint-green)',
    [colors.mintLight]: 'var(--mint-light)',
    [colors.pink]: 'var(--pink)',
    [colors.pinkLight]: 'var(--pink-light)',
    [colors.purple]: 'var(--purple)',
    [colors.skyBlue]: 'var(--sky-blue)',
    [colors.peach]: 'var(--peach)',
    [colors.textPrimary]: 'var(--text-primary)',
    [colors.textSecondary]: 'var(--text-secondary)',
    [colors.textMuted]: 'var(--text-muted)',
  };
  return varMap[value] || value;
};

export default {
  colors,
  spacing,
  borderRadius,
  borders,
  shadows,
  typography,
  fontWeights, // backwards compatibility
  transitions,
  componentColors,
  cssVar,
};

