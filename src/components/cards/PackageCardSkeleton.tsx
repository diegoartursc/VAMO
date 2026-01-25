import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from '../common/Skeleton';
import { theme } from '../../theme/theme';

export function PackageCardSkeleton() {
    return (
        <View style={styles.card}>
            {/* Image skeleton */}
            <Skeleton width="100%" height={200} borderRadius={0} />

            <View style={styles.content}>
                {/* Header skeleton - agency and rating */}
                <View style={styles.header}>
                    <Skeleton width={80} height={24} borderRadius={12} />
                    <Skeleton width={60} height={24} borderRadius={12} />
                </View>

                {/* Title skeleton */}
                <Skeleton
                    width="90%"
                    height={20}
                    borderRadius={4}
                    style={{ marginTop: 12 }}
                />
                <Skeleton
                    width="70%"
                    height={20}
                    borderRadius={4}
                    style={{ marginTop: 8 }}
                />

                {/* Destination and duration */}
                <Skeleton
                    width="60%"
                    height={16}
                    borderRadius={4}
                    style={{ marginTop: 12 }}
                />
                <Skeleton
                    width="40%"
                    height={16}
                    borderRadius={4}
                    style={{ marginTop: 8 }}
                />

                {/* Inclusions badges */}
                <View style={styles.badges}>
                    <Skeleton width={60} height={24} borderRadius={12} />
                    <Skeleton width={70} height={24} borderRadius={12} />
                    <Skeleton width={55} height={24} borderRadius={12} />
                </View>

                {/* Footer - price and button */}
                <View style={styles.footer}>
                    <View>
                        <Skeleton width={70} height={14} borderRadius={4} />
                        <Skeleton
                            width={100}
                            height={24}
                            borderRadius={4}
                            style={{ marginTop: 6 }}
                        />
                    </View>
                    <Skeleton width={100} height={36} borderRadius={18} />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: theme.colors.background,
        borderRadius: theme.borderRadius.md,
        marginBottom: theme.spacing.md,
        ...theme.shadows.medium,
        overflow: 'hidden',
    },
    content: {
        padding: theme.spacing.md,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    badges: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 12,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginTop: 16,
    },
});
