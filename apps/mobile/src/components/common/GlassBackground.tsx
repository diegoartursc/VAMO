import React from 'react';
import { View, StyleSheet, ImageBackground, Dimensions, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme/theme';
import { ACTIVE_VARIANT } from '../../config/variant';

const { width, height } = Dimensions.get('window');

interface GlassBackgroundProps {
    children: React.ReactNode;
    screen?: string;
}

export function GlassBackground({ children, screen }: GlassBackgroundProps) {
    const isGlass = ACTIVE_VARIANT === 'glass';

    if (!isGlass) {
        return (
            <View style={styles.classicContainer}>
                {children}
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Background Base */}
            <LinearGradient
                colors={['#0F172A', '#1E293B', '#0F172A']}
                style={StyleSheet.absoluteFill}
            />

            {/* Decorative Nebula/Gradients */}
            <View style={[styles.nebula, { top: -100, left: -100, backgroundColor: 'rgba(40, 201, 191, 0.15)' }]} />
            <View style={[styles.nebula, { bottom: -150, right: -150, backgroundColor: 'rgba(99, 102, 241, 0.15)' }]} />

            {/* Glass Overlay for the whole screen if needed */}
            <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill}>
                <View style={styles.content}>
                    {children}
                </View>
            </BlurView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F172A',
    },
    classicContainer: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    content: {
        flex: 1,
    },
    nebula: {
        position: 'absolute',
        width: 400,
        height: 400,
        borderRadius: 200,
        opacity: 0.6,
        filter: Platform.OS === 'web' ? 'blur(80px)' : undefined, // blur is a bit different on native
    }
});
