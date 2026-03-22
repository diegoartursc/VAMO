export const glassTheme = {
    colors: {
        primary: '#28C9BF', // Teal futuristic
        secondary: '#94A3B8',
        background: '#0F172A',
        surface: 'rgba(30, 41, 59, 0.7)',
        surfaceLight: 'rgba(255, 255, 255, 0.1)',
        text: {
            primary: '#FFFFFF',
            secondary: 'rgba(255, 255, 255, 0.7)',
            tertiary: 'rgba(255, 255, 255, 0.5)',
            inverse: '#0F172A',
            onPrimary: '#0F172A',
        },
        border: 'rgba(255, 255, 255, 0.15)',
        borderLight: 'rgba(255, 255, 255, 0.08)',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        gradients: {
            institutional: ['#28C9BF', '#14B8A6'],
            heroOverlay: ['rgba(15, 23, 42, 0)', 'rgba(15, 23, 42, 0.5)', '#0F172A'],
        }
    },
    typography: {
        sizes: {
            heroXL: 32,
            xs: 12,
            sm: 14,
            md: 16,
            lg: 18,
            xl: 20,
            '2xl': 24,
            '3xl': 30,
        },
        weights: {
            heavy: '900' as const,
            regular: '400' as const,
            medium: '500' as const,
            semibold: '600' as const,
            bold: '700' as const,
        },
        lineHeights: {
            tight: 1.25,
            snug: 1.375,
            normal: 1.5,
            relaxed: 1.625,
            loose: 2,
        },
        fonts: {
            regular: 'Outfit-Regular',
            medium: 'Outfit-Medium',
            bold: 'Outfit-Bold',
        }
    },
    spacing: {
        sm: 8,
        md: 16,
        lg: 24,
    },
    borderRadius: {
        sm: 4,
        md: 12,
        lg: 24,
        full: 9999,
    },
    shadows: {
        small: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 10,
            elevation: 5,
        },
        medium: {
            shadowColor: '#28C9BF',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.2,
            shadowRadius: 20,
            elevation: 0,
        }
    }
};
