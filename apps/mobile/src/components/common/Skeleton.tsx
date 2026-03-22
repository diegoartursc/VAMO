import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { theme } from '../../theme/theme';

interface SkeletonProps {
    width?: number | string;
    height?: number;
    borderRadius?: number;
    style?: object;
}

/**
 * Animated skeleton loading component
 */
export const Skeleton: React.FC<SkeletonProps> = ({
    width = '100%',
    height = 20,
    borderRadius = 8,
    style,
}) => {
    const animatedValue = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(animatedValue, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(animatedValue, {
                    toValue: 0,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        );
        animation.start();
        return () => animation.stop();
    }, []);

    const opacity = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.7],
    });

    return (
        <Animated.View
            style={[
                styles.skeleton,
                { width, height, borderRadius, opacity },
                style,
            ]}
        />
    );
};

/**
 * Skeleton for package cards in lists
 */
export const SkeletonPackageCard: React.FC = () => (
    <View style={styles.cardContainer}>
        <Skeleton height={180} borderRadius={12} />
        <View style={styles.cardContent}>
            <Skeleton width="70%" height={16} style={{ marginBottom: 8 }} />
            <Skeleton width="50%" height={14} style={{ marginBottom: 12 }} />
            <View style={styles.row}>
                <Skeleton width={60} height={14} />
                <Skeleton width={80} height={20} />
            </View>
        </View>
    </View>
);

/**
 * Skeleton for experience cards (horizontal scroll)
 */
export const SkeletonExperienceCard: React.FC = () => (
    <View style={styles.experienceCard}>
        <Skeleton height={180} borderRadius={12} />
        <Skeleton width="80%" height={16} style={{ marginTop: 12 }} />
        <Skeleton width="50%" height={14} style={{ marginTop: 8 }} />
        <View style={[styles.row, { marginTop: 12 }]}>
            <Skeleton width={50} height={14} />
            <Skeleton width={70} height={18} />
        </View>
    </View>
);

/**
 * Skeleton for a full list section
 */
export const SkeletonSection: React.FC<{ title?: boolean; count?: number }> = ({
    title = true,
    count = 3,
}) => (
    <View style={styles.section}>
        {title && (
            <>
                <Skeleton width="60%" height={24} style={{ marginBottom: 8 }} />
                <Skeleton width="80%" height={16} style={{ marginBottom: 16 }} />
            </>
        )}
        <View style={styles.grid}>
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonPackageCard key={i} />
            ))}
        </View>
    </View>
);

/**
 * Skeleton for detail page header
 */
export const SkeletonDetailHeader: React.FC = () => (
    <View>
        <Skeleton height={300} borderRadius={0} />
        <View style={styles.detailContent}>
            <Skeleton width={120} height={32} borderRadius={16} style={{ marginBottom: 16 }} />
            <Skeleton width="90%" height={24} style={{ marginBottom: 8 }} />
            <Skeleton width="60%" height={18} style={{ marginBottom: 16 }} />
            <View style={styles.row}>
                <Skeleton width={80} height={16} />
                <Skeleton width={100} height={16} />
            </View>
        </View>
    </View>
);

const styles = StyleSheet.create({
    skeleton: {
        backgroundColor: theme.colors.surfaceLight,
    },
    cardContainer: {
        width: '48%',
        marginBottom: 16,
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        overflow: 'hidden',
    },
    cardContent: {
        padding: 12,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    experienceCard: {
        width: 300,
        marginRight: 16,
    },
    section: {
        paddingHorizontal: 16,
        marginBottom: 24,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    detailContent: {
        padding: 16,
    },
});

export default Skeleton;
