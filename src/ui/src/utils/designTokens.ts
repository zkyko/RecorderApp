/**
 * Design Tokens - Centralized design system constants
 * Based on UI-update.md specifications
 */

// Spacing Scale (8px base unit)
export const SPACING = {
  xs: '8px',
  sm: '16px',
  md: '24px',
  lg: '32px',
  xl: '48px',
} as const;

// Colors from UI-update.md
export const COLORS = {
  primary: '#4C6EF5',
  success: '#2B8A3E',
  error: '#C92A2A',
  warning: '#E67700',
  info: '#1C7ED6',
  danger: '#FA5252',
  muted: '#4A4A4A',
  background: '#1A1B1E',
  surface: '#25262B',
} as const;

// Typography Scale
export const TYPOGRAPHY = {
  h1: {
    fontSize: '32px',
    fontWeight: 600,
    lineHeight: 1.2,
  },
  h2: {
    fontSize: '24px',
    fontWeight: 600,
    lineHeight: 1.2,
  },
  h3: {
    fontSize: '18px',
    fontWeight: 600,
    lineHeight: 1.2,
  },
  body: {
    fontSize: '14px',
    fontWeight: 400,
    lineHeight: 1.5,
  },
  small: {
    fontSize: '12px',
    fontWeight: 400,
    lineHeight: 1.5,
  },
} as const;

// Border Radius
export const BORDER_RADIUS = {
  sm: '4px',
  md: '8px',
  lg: '12px',
  full: '9999px',
} as const;

// Shadows
export const SHADOWS = {
  sm: '0 1px 3px rgba(0,0,0,0.12)',
  md: '0 4px 6px rgba(0,0,0,0.16)',
  lg: '0 10px 20px rgba(0,0,0,0.20)',
} as const;

// Card Standardization
export const CARD = {
  padding: SPACING.md, // 24px
  gap: SPACING.sm, // 16px
} as const;

// Button Standardization
export const BUTTON = {
  minHeight: '36px',
  paddingX: '12px',
  paddingY: '8px',
} as const;

// Container
export const CONTAINER = {
  maxWidth: '1200px',
  gutter: SPACING.md, // 24px
} as const;
