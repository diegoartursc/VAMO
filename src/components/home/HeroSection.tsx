import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
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
            {/* Immersive Background Image */}
            <Image source={{ uri: image }} style={styles.backgroundImage} resizeMode="cover" />

            {/* Deep Overlay for text readability at bottom */}
            <LinearGradient
                colors={theme.colors.gradients.heroOverlay}
                style={styles.overlay}
                locations={[0, 0.5, 1]}
            />

            {/* Floating Glass Search Bar (Visual Rep) */}
            <View style={styles.searchContainer}>
                <BlurView intensity={30} tint="light" style={styles.glassSearch}>
                    <Ionicons name="search" size={20} color="#fff" style={{ opacity: 0.8 }} />
                    <Text style={styles.searchTextPlaceholder}>Where to next?</Text>
                    <View style={styles.filterIcon}>
                        <Ionicons name="options-outline" size={20} color="#fff" />
                    </View>
                </BlurView>
            </View>

            {/* Content at Bottom */}
            <View style={styles.content}>
                {badge && (
                    <View style={styles.badgeContainer}>
                        <BlurView intensity={20} style={styles.badgeGlass}>
                            <Text style={styles.badgeIcon}>✨</Text>
                            <Text style={styles.badgeText}>{badge}</Text>
                        </BlurView>
                    </View>
                )}

                <Text style={styles.title}>{title}</Text>

                {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: width,
        height: 520, // Taller, more immersive
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
        zIndex: 1,
    },
    searchContainer: {
        position: 'absolute',
        top: 60, // Safe area inset approx
        left: 20,
        right: 20,
        zIndex: 5,
        ...theme.shadows.medium,
    },
    glassSearch: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 24,
        gap: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    searchTextPlaceholder: {
        flex: 1,
        color: 'rgba(255,255,255,0.7)',
        fontSize: 16,
    },
    filterIcon: {
        padding: 4,
    },
    content: {
        position: 'absolute',
        bottom: 40,
        left: 20,
        right: 20,
        zIndex: 2,
    },
    badgeContainer: {
        marginBottom: 16,
        alignSelf: 'flex-start',
    },
    badgeGlass: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
        backgroundColor: 'rgba(40, 201, 191, 0.2)', // Tinted teal
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
        letterSpacing: 1,
    },
    title: {
        fontSize: theme.typography.sizes.heroXL, // Massive text
        fontWeight: theme.typography.weights.heavy,
        color: theme.colors.text.onPrimary,
        marginBottom: 12,
        lineHeight: 42,
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 4 },
        textShadowRadius: 8,
    },
    subtitle: {
        fontSize: 18,
        color: 'rgba(255,255,255,0.9)',
        marginBottom: 8,
        lineHeight: 26,
        fontWeight: '500',
    },
});
