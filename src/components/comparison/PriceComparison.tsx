import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../theme/theme';

interface PriceBreakdown {
    flight: number;
    hotel: number;
    tours: number;
    transfer: number;
    extras?: number;
}

interface PriceComparisonProps {
    agencyName: string;
    agencyPrice: PriceBreakdown;
    creatorName: string;
    creatorPrice: PriceBreakdown;
    itineraryPrice: number; // Preço do roteiro em si
}

export function PriceComparison({
    agencyName,
    agencyPrice,
    creatorName,
    creatorPrice,
    itineraryPrice,
}: PriceComparisonProps) {
    const agencyTotal = Object.values(agencyPrice).reduce((a, b) => a + (b || 0), 0);
    const creatorTotal = Object.values(creatorPrice).reduce((a, b) => a + (b || 0), 0) + itineraryPrice;
    const savings = agencyTotal - creatorTotal;
    const savingsPercent = Math.round((savings / agencyTotal) * 100);

    const formatPrice = (value: number) =>
        value === 0 ? 'GRÁTIS' : `R$ ${value.toLocaleString('pt-BR')}`;

    const items = [
        { icon: '✈️', label: 'Voo', agency: agencyPrice.flight, creator: creatorPrice.flight },
        { icon: '🏨', label: 'Hospedagem', agency: agencyPrice.hotel, creator: creatorPrice.hotel },
        { icon: '🎫', label: 'Passeios', agency: agencyPrice.tours, creator: creatorPrice.tours },
        { icon: '🚗', label: 'Transfer', agency: agencyPrice.transfer, creator: creatorPrice.transfer },
    ];

    return (
        <View style={styles.container}>
            <Text style={styles.title}>💰 Compare e Economize</Text>

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerCol} />
                <View style={styles.headerCol}>
                    <Text style={styles.headerIcon}>💼</Text>
                    <Text style={styles.headerLabel}>{agencyName}</Text>
                </View>
                <View style={styles.headerCol}>
                    <Text style={styles.headerIcon}>🎒</Text>
                    <Text style={styles.headerLabel}>{creatorName}</Text>
                </View>
            </View>

            {/* Price rows */}
            {items.map((item, index) => (
                <View key={index} style={styles.row}>
                    <View style={styles.labelCol}>
                        <Text style={styles.itemIcon}>{item.icon}</Text>
                        <Text style={styles.itemLabel}>{item.label}</Text>
                    </View>
                    <View style={styles.priceCol}>
                        <Text style={styles.agencyPrice}>{formatPrice(item.agency)}</Text>
                    </View>
                    <View style={styles.priceCol}>
                        <Text style={[
                            styles.creatorPrice,
                            item.creator < item.agency && styles.savingsPrice
                        ]}>
                            {formatPrice(item.creator)}
                        </Text>
                    </View>
                </View>
            ))}

            {/* Roteiro price */}
            <View style={styles.row}>
                <View style={styles.labelCol}>
                    <Text style={styles.itemIcon}>📋</Text>
                    <Text style={styles.itemLabel}>Roteiro</Text>
                </View>
                <View style={styles.priceCol}>
                    <Text style={styles.agencyPrice}>Incluído</Text>
                </View>
                <View style={styles.priceCol}>
                    <Text style={styles.creatorPrice}>{formatPrice(itineraryPrice)}</Text>
                </View>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Totals */}
            <View style={styles.totalRow}>
                <View style={styles.labelCol}>
                    <Text style={styles.totalLabel}>TOTAL</Text>
                </View>
                <View style={styles.priceCol}>
                    <Text style={styles.agencyTotal}>{formatPrice(agencyTotal)}</Text>
                </View>
                <View style={styles.priceCol}>
                    <Text style={styles.creatorTotal}>{formatPrice(creatorTotal)}</Text>
                </View>
            </View>

            {/* Savings banner */}
            <View style={styles.savingsBanner}>
                <Text style={styles.savingsIcon}>🎉</Text>
                <View style={styles.savingsContent}>
                    <Text style={styles.savingsTitle}>VOCÊ ECONOMIZA</Text>
                    <Text style={styles.savingsAmount}>
                        R$ {savings.toLocaleString('pt-BR')} ({savingsPercent}%)
                    </Text>
                </View>
            </View>

            <Text style={styles.disclaimer}>
                * Valores estimados com base em pesquisas recentes. Preços podem variar.
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: theme.colors.background,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.md,
        ...theme.shadows.medium,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.md,
        textAlign: 'center',
    },
    header: {
        flexDirection: 'row',
        marginBottom: theme.spacing.sm,
        paddingBottom: theme.spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
    },
    headerCol: {
        flex: 1,
        alignItems: 'center',
    },
    headerIcon: {
        fontSize: 20,
        marginBottom: 4,
    },
    headerLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.text.secondary,
        textAlign: 'center',
    },
    row: {
        flexDirection: 'row',
        paddingVertical: theme.spacing.sm,
        alignItems: 'center',
    },
    labelCol: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    itemIcon: {
        fontSize: 16,
    },
    itemLabel: {
        fontSize: 14,
        color: theme.colors.text.primary,
    },
    priceCol: {
        flex: 1,
        alignItems: 'center',
    },
    agencyPrice: {
        fontSize: 14,
        color: theme.colors.text.secondary,
    },
    creatorPrice: {
        fontSize: 14,
        color: theme.colors.text.primary,
        fontWeight: '500',
    },
    savingsPrice: {
        color: theme.colors.success,
        fontWeight: '600',
    },
    divider: {
        height: 2,
        backgroundColor: theme.colors.border,
        marginVertical: theme.spacing.sm,
    },
    totalRow: {
        flexDirection: 'row',
        paddingVertical: theme.spacing.sm,
        alignItems: 'center',
    },
    totalLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.colors.text.primary,
    },
    agencyTotal: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.text.secondary,
        textDecorationLine: 'line-through',
    },
    creatorTotal: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.primary,
    },
    savingsBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E8F5E9',
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        marginTop: theme.spacing.md,
        gap: theme.spacing.sm,
    },
    savingsIcon: {
        fontSize: 28,
    },
    savingsContent: {
        flex: 1,
    },
    savingsTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.success,
    },
    savingsAmount: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.colors.success,
    },
    disclaimer: {
        fontSize: 11,
        color: theme.colors.text.disabled,
        textAlign: 'center',
        marginTop: theme.spacing.sm,
        fontStyle: 'italic',
    },
});
