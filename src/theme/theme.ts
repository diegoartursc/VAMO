// VAMO Brand Theme - Harmonized with Logo Gradient
// Light Mode with Teal → Blue Gradient

export const theme = {
  colors: {
    // Brand Colors extracted from Logo
    primary: '#28C9BF',        // Teal Principal (do logo)
    primaryLight: '#4DE6DC',   // Teal Claro
    primaryDark: '#1FA89F',    // Teal Escuro

    secondary: '#1A3263',      // Azul Profundo (base do gradiente)
    secondaryLight: '#2A4273',
    secondaryDark: '#102040',

    // Backgrounds
    background: '#FFFFFF',
    surface: '#F8F9FA',
    surfaceLight: '#FAFBFC',
    glassSurface: 'rgba(255, 255, 255, 0.15)',

    // Gradient definitions
    gradientTop: '#28C9BF',    // Topo do degradê
    gradientBottom: '#1A3263', // Base do degradê

    // Text
    text: {
      primary: '#1A3263',      // Azul Profundo para leitura
      secondary: '#5A6B8C',    // Azul acinzentado
      tertiary: '#98989D',     // Muted labels
      disabled: '#A0AAC0',
      inverse: '#FFFFFF',      // Branco sobre o gradiente
      onPrimary: '#FFFFFF',    // White on teal
    },

    // Borders
    border: '#E0E4EB',
    borderLight: '#F0F2F5',

    // Overlays
    overlay: {
      light: 'rgba(0, 0, 0, 0.4)',
      medium: 'rgba(0, 0, 0, 0.6)',
      heavy: 'rgba(0, 0, 0, 0.8)',
    },

    // Glass effect
    glass: {
      background: 'rgba(255, 255, 255, 0.1)',
      border: 'rgba(255, 255, 255, 0.2)',
    },

    // Semantic
    success: '#28C9BF',
    error: '#FF5252',
    warning: '#FFB74D',
    info: '#4FC3F7',
    verified: '#28C9BF',
    accent: '#FF5A4D',        // Coral accent

    // State colors
    state: {
      hover: 'rgba(40, 201, 191, 0.1)',    // Teal with 10% opacity
      pressed: 'rgba(40, 201, 191, 0.2)',   // Teal with 20% opacity
    },

    // Gradient definitions
    gradients: {
      primary: ['#28C9BF', '#1A3263'],
      cardOverlay: ['rgba(255,255,255,0.95)', 'rgba(248,249,250,1)'],
      shimmer: ['rgba(255,255,255,0)', 'rgba(255,255,255,0.8)', 'rgba(255,255,255,0)'],
      featured: ['rgba(40, 201, 191, 0.08)', 'rgba(26, 50, 99, 0.08)'],
      premium: ['rgba(255, 90, 77, 0.06)', 'rgba(40, 201, 191, 0.06)'],
    },
  },

  typography: {
    fontFamily: {
      regular: 'System',
      medium: 'System',
      bold: 'System',
      heavy: 'System',
    },

    sizes: {
      hero: 28,
      title: 24,
      heading: 20,
      subheading: 18,
      body: 16,
      caption: 14,
      small: 12,
      tiny: 10,
    },

    weights: {
      regular: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
      heavy: '800' as const,
    },

    lineHeights: {
      tight: 1.1,      // Titles - compact, impactful
      normal: 1.5,     // Body - readability
      relaxed: 1.75,   // Large body text
      balanced: 1.3,   // Captions - balanced
    },

    letterSpacing: {
      tight: -0.5,     // Titles - closer letters
      normal: 0,       // Body - standard
      wide: 0.3,       // Labels/captions - breathing room
    },
  },

  spacing: {
    xxs: 4,
    xs: 8,
    sm: 12,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    xxxl: 64,
    // New tokens for better consistency
    section: 40,      // Section spacing
    cardGap: 16,      // Gap between cards
  },

  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    full: 9999,
  },

  shadows: {
    none: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    xs: {
      shadowColor: '#1A3263',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    small: {
      shadowColor: '#1A3263',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    medium: {
      shadowColor: '#1A3263',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 4,
    },
    large: {
      shadowColor: '#1A3263',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
    },
    button: {
      shadowColor: '#28C9BF',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 6,
    },
    elevated: {
      shadowColor: '#1A3263',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.18,
      shadowRadius: 16,
      elevation: 12,
    },
    glow: {
      shadowColor: '#28C9BF',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 0,
    },
  },
} as const;

export type Theme = typeof theme;
