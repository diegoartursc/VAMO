/**
 * Linha de prova social do card de criador — no máximo 3 indicadores,
 * derivados só de dado real. Métrica sem dado (0, null, ausente) nunca é
 * renderizada como "0" ou espaço vazio: simplesmente não entra na linha.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Icon, IconName } from '../common/Icons';
import { theme } from '../../theme/theme';
import type { RecommendedCreator } from '../../services/api';

interface CreatorTrustMetricsProps {
    stats: RecommendedCreator['stats'];
    size?: 'small' | 'medium';
}

interface MetricItem {
    icon: IconName;
    label: string;
}

export function CreatorTrustMetrics({ stats, size = 'medium' }: CreatorTrustMetricsProps) {
    const items: MetricItem[] = [];

    if (stats.averageRating != null && stats.reviewCount > 0) {
        items.push({
            icon: 'star',
            label: `${stats.averageRating.toFixed(1).replace('.', ',')} · ${stats.reviewCount} ${stats.reviewCount === 1 ? 'avaliação' : 'avaliações'}`,
        });
    }
    if (stats.totalSales > 0) {
        items.push({
            icon: 'shopping-cart',
            label: stats.totalSales >= 100 ? 'Mais de 100 vendas' : `${stats.totalSales} ${stats.totalSales === 1 ? 'venda' : 'vendas'}`,
        });
    }
    if (stats.activeItineraries > 0) {
        items.push({
            icon: 'map',
            label: `${stats.activeItineraries} ${stats.activeItineraries === 1 ? 'roteiro' : 'roteiros'}`,
        });
    }

    const shown = items.slice(0, 3);
    if (shown.length === 0) return null;

    const iconSize = size === 'small' ? 11 : 13;
    const fontSize = size === 'small' ? 11 : 12;

    return (
        <View style={styles.row} accessibilityRole="text">
            {shown.map((item, index) => (
                <View key={item.label} style={styles.item}>
                    {index > 0 && <View style={styles.dot} />}
                    <Icon name={item.icon} size={iconSize} color={theme.colors.text.secondary} strokeWidth={2} />
                    <Text style={[styles.label, { fontSize }]} numberOfLines={1}>{item.label}</Text>
                </View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        rowGap: 4,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    dot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: theme.colors.border,
        marginHorizontal: 6,
    },
    label: {
        fontWeight: '600',
        color: theme.colors.text.secondary,
    },
});
