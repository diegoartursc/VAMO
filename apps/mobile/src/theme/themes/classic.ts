export const classicTheme = {
    colors: {
        primary: '#2563EB',
        secondary: '#64748B',
        background: '#FFFFFF',
        surface: '#F8FAFC',
        surfaceLight: '#F1F5F9',
        text: {
            primary: '#1E293B',
            secondary: '#475569',
            tertiary: '#94A3B8',
            inverse: '#FFFFFF',
            onPrimary: '#FFFFFF',
        },
        border: '#E2E8F0',
        borderLight: '#F1F5F9',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        gradients: {
            institutional: ['#2563EB', '#1D4ED8'],
            heroOverlay: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.8)'],
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
            heavy: '800' as const,
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
        md: 8,
        lg: 16,
        full: 9999,
    },
    shadows: {
        small: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
        },
        medium: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 4,
        }
    }
};
