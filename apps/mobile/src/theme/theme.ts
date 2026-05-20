// VAMO 2.0 Theme - Authority & Trust
// Deep Navy Institutional + Teal Actions

export const theme = {
  colors: {
    // Institutional Anchor (Deep Navy)
    secondary: '#1A3263',      // Headers, Text, Institutional Backgrounds
    secondaryLight: '#2A4273',
    secondaryDark: '#102040',

    // Action & Highlights (Bright Teal)
    primary: '#28C9BF',        // CTAs, Badges, Links
    primaryLight: '#4DE6DC',
    primaryDark: '#1FA89F',

    // Backgrounds - Pure & Clean
    background: '#FFFFFF',     // Pure White
    surface: '#FFFFFF',        // Cards
    surfaceLight: '#F8F9FA',   // Section Backgrounds
    surfaceHighlight: '#F0F2F5', // Hover/Pressed states

    // Text
    text: {
      primary: '#1A3263',      // Deep Navy for headings
      secondary: '#64748B',    // Slate 500 for body
      tertiary: '#94A3B8',     // Slate 400 for captions
      inverse: '#FFFFFF',      // White text on Navy/Teal
      disabled: '#CBD5E1',
      onPrimary: '#FFFFFF',    // White on teal
    },

    // Borders
    border: '#E2E8F0',         // Slate 200
    borderLight: '#F1F5F9',    // Slate 100

    // Semantic
    success: '#10B981',        // Green - distinct from Teal
    error: '#EF4444',          // Red
    warning: '#F59E0B',        // Amber
    info: '#3B82F6',           // Blue
    verified: '#28C9BF',       // Teal for verificatio
    accent: '#FF5A4D',         // Coral (Legacy/Accent)

    // Gradientes & Overlays
    gradients: {
      institutional: ['#1A3263', '#162A55'],           // Navy deep — headers, perfil
      action: ['#28C9BF', '#22ABA2'],                  // Teal CTA gradient
      overlay: ['transparent', 'rgba(26, 50, 99, 0.8)'], // Image overlay (dark)
      primary: ['#28C9BF', '#1FA89F'],                 // Teal
      warm: ['#28C9BF', '#1A3263'],                    // Teal → Navy (hero)
      aurora: ['#1A3263', '#1E4D8C', '#28C9BF'],       // Aurora: Navy → Mid Blue → Teal
      card: ['transparent', 'rgba(0,0,0,0.5)'],        // Card image bottom overlay
      hero: ['rgba(26,50,99,0.7)', 'rgba(26,50,99,0.4)', 'rgba(40,201,191,0.15)'], // Hero 3-stop
    },

    // Backdrop / Glass tokens
    glass: {
      light: 'rgba(255,255,255,0.12)',
      dark: 'rgba(0,0,0,0.35)',
      primary: 'rgba(40,201,191,0.12)',
    }
  },

  typography: {
    fontFamily: {
      regular: 'System',
      medium: 'System',
      bold: 'System',
      heavy: 'System',
    },
    // Authority Scale - Fixed Hierarchy
    sizes: {
      heroXL: 32,    // Massive Hero
      hero: 28,      // Page Titles
      title: 24,     // Section Headers
      heading: 20,   // Card Titles
      subheading: 18,// Subsections
      body: 16,      // Standard Text
      caption: 14,   // Secondary Info
      small: 12,     // Badges/Metadata
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
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.6,
      balanced: 1.4,
    },
    letterSpacing: {
      tight: -0.5,
      normal: 0,
      wide: 0.3,
    }
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
    section: 40, // Consistent section spacing
    cardGap: 24, // Wider gap for cleaner look
  },

  borderRadius: {
    xs: 4,
    sm: 6,
    md: 12,
    lg: 16,     // Standard Card Radius
    xl: 24,
    xxl: 32,
    full: 9999,
  },

  // Premium Soft Shadows
  shadows: {
    none: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    xs: {
      shadowColor: '#64748B',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    small: {
      shadowColor: '#64748B',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    medium: { // Card Default
      shadowColor: '#1A3263',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08, // Increased slightly for visibility on white
      shadowRadius: 12,
      elevation: 4,
    },
    large: { // Floating Elements
      shadowColor: '#1A3263',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
      elevation: 8,
    },
    button: { // Teal Glow
      shadowColor: '#28C9BF',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 6,
    },
    elevated: {
      shadowColor: '#1A3263',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.15,
      shadowRadius: 20,
      elevation: 10,
    },
    glow: {
      shadowColor: '#28C9BF',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 20,
      elevation: 0,
    },
    neon: {
      shadowColor: '#28C9BF',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 10,
      elevation: 0,
    }
  },
} as const;

export type Theme = typeof theme;
