import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme/theme';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 40; // Account for padding

export function ShimmerCard() {
    const translateX = useSharedValue(-CARD_WIDTH);

    useEffect(() => {
        translateX.value = withRepeat(
            withTiming(CARD_WIDTH, {
                duration: 1500,
                easing: Easing.linear,
            }),
            -1,
            false
        );
    }, []);

    const shimmerStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));

    return (
        <View style={styles.container}>
            {/* Image placeholder */}
            <View style={styles.imagePlaceholder} />

            {/* Content placeholder */}
            <View style={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.agencyBadge} />
                    <View style={styles.rating} />
                </View>

                {/* Title */}
                <View style={styles.titleLarge} />
                <View style={styles.titleSmall} />

                {/* Meta */}
                <View style={styles.meta} />
                <View style={styles.meta} />

                {/* Tags */}
                <View style={styles.tags}>
                    <View style={styles.tag} />
                    <View style={styles.tag} />
                    <View style={styles.tag} />
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <View style={styles.price} />
                    <View style={styles.button} />
                </View>
            </View>

            {/* Shimmer overlay */}
            <Animated.View style={[styles.shimmerContainer, shimmerStyle]}>
                <LinearGradient
                    colors={theme.colors.gradients.shimmer as any}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.shimmer}
                />
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: theme.colors.background,
        borderRadius: theme.borderRadius.lg,
        marginBottom: theme.spacing.cardGap,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    imagePlaceholder: {
        width: '100%',
        height: 140,
        backgroundColor: '#F0F2F5',
    },
    content: {
        padding: 14,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    agencyBadge: {
        width: 80,
        height: 20,
        backgroundColor: '#F0F2F5',
        borderRadius: 4,
    },
    rating: {
        width: 50,
        height: 20,
        backgroundColor: '#F0F2F5',
        borderRadius: 4,
    },
    titleLarge: {
        width: '90%',
        height: 16,
        backgroundColor: '#F0F2F5',
        borderRadius: 4,
        marginBottom: 6,
    },
    titleSmall: {
        width: '60%',
        height: 16,
        backgroundColor: '#F0F2F5',
        borderRadius: 4,
        marginBottom: 12,
    },
    meta: {
        width: '70%',
        height: 14,
        backgroundColor: '#F0F2F5',
        borderRadius: 4,
        marginBottom: 6,
    },
    tags: {
        flexDirection: 'row',
        gap: 6,
        marginVertical: 12,
    },
    tag: {
        width: 60,
        height: 24,
        backgroundColor: '#F0F2F5',
        borderRadius: 4,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    price: {
        width: 100,
        height: 24,
        backgroundColor: '#F0F2F5',
        borderRadius: 4,
    },
    button: {
        width: 100,
        height: 36,
        backgroundColor: '#F0F2F5',
        borderRadius: 20,
    },
    shimmerContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    shimmer: {
        width: CARD_WIDTH,
        height: '100%',
    },
});
