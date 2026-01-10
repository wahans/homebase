/**
 * Vectors Design System
 *
 * A cohesive design system for the Vectors app.
 * Import this file to access colors, typography, spacing, and other design tokens.
 */

// =============================================================================
// COLORS
// =============================================================================

export const colors = {
  // Primary brand colors
  primary: {
    50: '#F5F3FF',
    100: '#EDE9FE',
    200: '#DDD6FE',
    300: '#C4B5FD',
    400: '#A78BFA',
    500: '#8B5CF6',  // Main primary
    600: '#7C3AED',
    700: '#6D28D9',
    800: '#5B21B6',
    900: '#4C1D95',
  },

  // Assignment colors
  assignment: {
    me: '#7C3AED',      // Purple - ownership, personal responsibility
    you: '#EC4899',     // Pink - partner, care
    us: '#10B981',      // Green - together, growth
  },

  // Priority colors
  priority: {
    high: '#EF4444',    // Red
    medium: '#F59E0B',  // Amber
    low: '#3B82F6',     // Blue
    none: '#9CA3AF',    // Gray
  },

  // Semantic colors
  semantic: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },

  // Neutral palette
  neutral: {
    0: '#FFFFFF',
    50: '#FAFAFA',
    100: '#F4F4F5',
    200: '#E4E4E7',
    300: '#D4D4D8',
    400: '#A1A1AA',
    500: '#71717A',
    600: '#52525B',
    700: '#3F3F46',
    800: '#27272A',
    900: '#18181B',
    950: '#09090B',
  },

  // Background colors
  background: {
    primary: '#FFFFFF',
    secondary: '#FAFAFA',
    tertiary: '#F4F4F5',
    elevated: '#FFFFFF',
  },

  // Text colors
  text: {
    primary: '#18181B',
    secondary: '#52525B',
    tertiary: '#71717A',
    disabled: '#A1A1AA',
    inverse: '#FFFFFF',
  },

  // Border colors
  border: {
    light: '#E4E4E7',
    default: '#D4D4D8',
    dark: '#A1A1AA',
  },

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
};

// =============================================================================
// TYPOGRAPHY
// =============================================================================

export const typography = {
  // Font families (system fonts for performance)
  fontFamily: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
  },

  // Font sizes
  fontSize: {
    xs: 11,
    sm: 13,
    base: 15,
    lg: 17,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },

  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },

  // Font weights
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },

  // Pre-defined text styles
  styles: {
    // Headings
    h1: {
      fontSize: 30,
      fontWeight: '700',
      lineHeight: 36,
      color: '#18181B',
    },
    h2: {
      fontSize: 24,
      fontWeight: '700',
      lineHeight: 30,
      color: '#18181B',
    },
    h3: {
      fontSize: 20,
      fontWeight: '600',
      lineHeight: 26,
      color: '#18181B',
    },
    h4: {
      fontSize: 17,
      fontWeight: '600',
      lineHeight: 24,
      color: '#18181B',
    },

    // Body text
    bodyLarge: {
      fontSize: 17,
      fontWeight: '400',
      lineHeight: 26,
      color: '#18181B',
    },
    body: {
      fontSize: 15,
      fontWeight: '400',
      lineHeight: 22,
      color: '#18181B',
    },
    bodySmall: {
      fontSize: 13,
      fontWeight: '400',
      lineHeight: 18,
      color: '#52525B',
    },

    // Labels
    label: {
      fontSize: 13,
      fontWeight: '500',
      lineHeight: 18,
      color: '#52525B',
    },
    labelSmall: {
      fontSize: 11,
      fontWeight: '500',
      lineHeight: 14,
      color: '#71717A',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },

    // Caption
    caption: {
      fontSize: 12,
      fontWeight: '400',
      lineHeight: 16,
      color: '#71717A',
    },
  },
};

// =============================================================================
// SPACING
// =============================================================================

export const spacing = {
  0: 0,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
};

// =============================================================================
// BORDER RADIUS
// =============================================================================

export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 9999,
};

// =============================================================================
// SHADOWS
// =============================================================================

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
};

// =============================================================================
// ANIMATION
// =============================================================================

export const animation = {
  // Durations (ms)
  duration: {
    instant: 100,
    fast: 200,
    normal: 300,
    slow: 500,
  },

  // Spring configs for react-native-reanimated
  spring: {
    gentle: {
      damping: 20,
      stiffness: 150,
    },
    bouncy: {
      damping: 10,
      stiffness: 180,
    },
    stiff: {
      damping: 30,
      stiffness: 300,
    },
  },
};

// =============================================================================
// LAYOUT
// =============================================================================

export const layout = {
  // Screen padding
  screenPadding: 16,

  // Card styles
  card: {
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },

  // Input styles
  input: {
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 10,
  },

  // Button styles
  button: {
    height: 48,
    paddingHorizontal: 20,
    borderRadius: 10,
  },

  // Badge styles
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
};

// =============================================================================
// HAPTICS
// =============================================================================

export const haptics = {
  light: 'light',
  medium: 'medium',
  heavy: 'heavy',
  success: 'success',
  warning: 'warning',
  error: 'error',
  selection: 'selection',
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get assignment color by type
 */
export const getAssignmentColor = (assignment) => {
  return colors.assignment[assignment] || colors.neutral[400];
};

/**
 * Get priority color by level
 */
export const getPriorityColor = (priority) => {
  return colors.priority[priority] || colors.priority.none;
};

/**
 * Create a semi-transparent version of a color
 */
export const withOpacity = (color, opacity) => {
  // Handle hex colors
  if (color.startsWith('#')) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  return color;
};

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  animation,
  layout,
  haptics,
  getAssignmentColor,
  getPriorityColor,
  withOpacity,
};

export default theme;
