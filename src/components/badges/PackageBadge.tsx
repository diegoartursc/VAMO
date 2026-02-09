import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import { theme } from '../../theme/theme';

export type BadgeType =
    | 'bestseller'
    | 'flash'
    | 'luxury'
    | 'value'
    | 'verified'
    | 'new'
    | 'featured';

interface BadgeConfig {
    icon: string;
    label: string;
    gradient: string[];
    textColor: string;
    hasPulse?: boolean;
}

const BADGE_CONFIGS: Record<BadgeType, BadgeConfig> = {
    bestseller: {
        icon: '🔥',
        label: 'Mais Vendido',
        gradient: ['#FFD700', '#FFA500'],
        textColor: '#FFFFFF',
    },
    flash: {
        icon: '⚡',
        label: 'Oferta Relâmpago',
        gradient: ['#FF6B6B', '#FF5A4D'],
        textColor: '#FFFFFF',
        hasPulse: true,
    },
    luxury: {
        icon: '💎',
        label: 'Luxo Premium',
        gradient: ['#9B59B6', '#8E44AD'],
        textColor: '#FFFFFF',
    },
    value: {
        icon: '🌟',
        label: 'Melhor Custo-Benefício',
        gradient: ['#2ECC71', '#27AE60'],
        textColor: '#FFFFFF',
    },
    verified: {
        icon: '✅',
        label: 'Verificado',
        gradient: ['#28C9BF', '#1FA89F'],
        textColor: '#FFFFFF',
    },
    new: {
        icon: '🆕',
        label: 'Novidade',
        gradient: ['#9B59B6', '#8E44AD'],
        textColor: '#FFFFFF',
        hasPulse: true,
    },
    featured: {
        icon: '⭐',
        label: 'Destaque',
        gradient: ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)'],
        textColor: theme.colors.text.primary,
    },
};

interface PackageBadgeProps {
    type: BadgeType;
    compact?: boolean;
}

export function PackageBadge({ type, compact = false }: PackageBadgeProps) {
    const config = BADGE_CONFIGS[type];
    const scale = useSharedValue(1);

    // Guard against unknown badge types
    if (!config) return null;

    useEffect(() => {
        if (config.hasPulse) {
            scale.value = withRepeat(
                withSequence(
                    withTiming(1.05, { duration: 600 }),
                    withTiming(1, { duration: 600 })
                ),
                -1,
                false
            );
        }
    }, [config.hasPulse]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <Animated.View style={[styles.container, animatedStyle]}>
            <LinearGradient
                colors={config.gradient as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.badge}
            >
                <Text style={styles.icon}>{config.icon}</Text>
                {!compact && (
                    <Text style={[styles.label, { color: config.textColor }]}>
                        {config.label}
                    </Text>
                )}
            </LinearGradient>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 14,
        ...theme.shadows.small,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 14,
        gap: 4,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    icon: {
        fontSize: 12,
    },
    label: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
});
