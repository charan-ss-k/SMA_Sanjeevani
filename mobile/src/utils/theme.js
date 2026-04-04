/**
 * Color Theme
 * Consistent color palette for the app
 */

export const colors = {
  // Primary (frontend-aligned green)
  primary: '#166534',
  primaryLight: '#15803D',
  primaryDark: '#14532D',

  // Secondary (frontend-aligned green)
  secondary: '#16A34A',
  secondaryLight: '#4ADE80',
  secondaryDark: '#15803D',

  // Status
  success: '#059669',
  warning: '#D97706',
  error: '#EF4444',
  info: '#3B82F6',

  // Neutral
  white: '#FFFFFF',
  black: '#000000',
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },

  // Special surfaces
  background: '#F0FDF4',
  backgroundSoft: '#FEFCE8',
  surface: '#FFFFFF',
  surfaceAlt: '#F8FAFC',
  border: '#E5E7EB',
  borderStrong: '#D1D5DB',
  text: '#1F2937',
  textSecondary: '#6B7280',
  textLight: '#9CA3AF',
  accent: '#F59E0B',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const typography = {
  h1: {
    fontSize: 34,
    fontWeight: 'bold',
    lineHeight: 42,
  },
  h2: {
    fontSize: 30,
    fontWeight: 'bold',
    lineHeight: 38,
  },
  h3: {
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 32,
  },
  h4: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },
  labelSmall: {
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14,
  },
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export default {
  colors,
  spacing,
  typography,
  borderRadius,
};
