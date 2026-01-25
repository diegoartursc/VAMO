import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme/theme';

const { width } = Dimensions.get('window');

interface HeroSectionProps {
    image: string;
    title: string;
    subtitle?: string;
    badge?: string;
    ctaText?: string;
    onCtaPress?: () => void;
}

export function HeroSection({
    image,
    title,
    subtitle,
    badge,
    ctaText,
    onCtaPress,
}: HeroSectionProps) {
    return (
        <View style={styles.container}>
            {/* Background Image */}
            <Image source={{ uri: image }} style={styles.backgroundImage} resizeMode="cover" />

            {/* Gradient Overlay for readability */}
            <LinearGradient
                colors={['transparent', 'rgba(0, 0, 0, 0.4)', 'rgba(0, 0, 0, 0.8)']}
                style={styles.overlay}
                locations={[0, 0.5, 1]}
            />

            {/* Content */}
            <View style={styles.content}>
                {badge && (
                    <View style={styles.badgeContainer}>
                        <View style={styles.badge}>
                            <Text style={styles.badgeIcon}>⭕</Text>
                            <Text style={styles.badgeText}>{badge}</Text>
                        </View>
                    </View>
                )}

                <Text style={styles.title}>{title}</Text>

                {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

                {ctaText && onCtaPress && (
                    <TouchableOpacity
                        style={styles.ctaButton}
                        onPress={onCtaPress}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.ctaText}>{ctaText}</Text>
                        <Text style={styles.ctaArrow}>›</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: width,
        height: 420,
        position: 'relative',
        backgroundColor: theme.colors.background,
    },
    backgroundImage: {
        width: '100%',
        height: '100%',
        position: 'absolute',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
    },
    content: {
        position: 'absolute',
        bottom: 32,
        left: 20,
        right: 20,
    },
    badgeContainer: {
        marginBottom: 12,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: theme.colors.accent,
    },
    badgeIcon: {
        fontSize: 14,
        color: theme.colors.text.onPrimary,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: theme.colors.text.onPrimary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    title: {
        fontSize: theme.typography.sizes.hero,
        fontWeight: theme.typography.weights.heavy,
        color: theme.colors.text.onPrimary,
        marginBottom: 8,
        lineHeight: 38,
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    subtitle: {
        fontSize: theme.typography.sizes.body,
        color: theme.colors.text.secondary,
        marginBottom: 20,
        lineHeight: 22,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    ctaButton: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 24,
        backgroundColor: theme.colors.glass.background,
        borderWidth: 1,
        borderColor: theme.colors.glass.border,
    },
    ctaText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text.onPrimary,
        marginRight: 4,
    },
    ctaArrow: {
        fontSize: 20,
        color: theme.colors.text.onPrimary,
        fontWeight: '300',
    },
});
