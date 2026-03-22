import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../theme/theme';
import { Package } from '../../types';

interface TrustBadgesProps {
    package: Package;
    compact?: boolean;
}

export default function TrustBadges({ package: pkg, compact = false }: TrustBadgesProps) {
    const badges = [];

    if (pkg.hasFreeCancellation) {
        badges.push({ icon: '🔄', text: 'Cancelamento grátis' });
    }

    if (pkg.isAllInclusive) {
        badges.push({ icon: '✓', text: 'Tudo incluído' });
    }

    if (pkg.recentPurchases && pkg.recentPurchases > 20) {
        badges.push({ icon: '🔥', text: `${pkg.recentPurchases} vendidos` });
    }

    if (pkg.priceComparison === 'below' && pkg.priceDiscount) {
        badges.push({
            icon: '💰',
            text: `${pkg.priceDiscount}% abaixo da média`
        });
    }

    if (badges.length === 0) return null;

    // Show max 2 badges in compact mode
    const displayBadges = compact ? badges.slice(0, 2) : badges;

    return (
        <View style={[styles.container, compact && styles.containerCompact]}>
            {displayBadges.map((badge, index) => (
                <View key={index} style={styles.badge}>
                    <Text style={styles.badgeIcon}>{badge.icon}</Text>
                    <Text style={styles.badgeText}>{badge.text}</Text>
                </View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: 8,
    },
    containerCompact: {
        gap: 4,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surfaceLight,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: theme.borderRadius.sm,
        gap: 4,
    },
    badgeIcon: {
        fontSize: 12,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '500',
        color: theme.colors.text.primary,
    },
});
