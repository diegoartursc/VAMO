import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../../theme/theme';
import { Icon, IconName } from '../common/Icons';
import { CoverCarousel } from '../common/CoverCarousel';
import { VerifiedBadge } from '../creator/VerifiedBadge';
import { ITINERARY_INCLUSIONS } from '../../data/itineraryInclusions';

export interface ItineraryCardProps {
    itinerary: any;
    onPress: () => void;
    width?: number;
}

export const ItineraryCard: React.FC<ItineraryCardProps> = ({ itinerary, onPress, width }) => {
    return (
        <TouchableOpacity
            style={[styles.itineraryCard, width ? { width } : {}]}
            onPress={onPress}
            activeOpacity={0.9}
        >
            <CoverCarousel
                images={itinerary.images}
                height={180}
            />

            {/* Badge overlay */}
            <View style={styles.cardBadge}>
                <VerifiedBadge level={itinerary.creator?.verificationLevel || 1} size="small" />
            </View>

            <View style={styles.itineraryContent}>
                {/* Bloco 1: Autoridade (linha única compacta) */}
                <View style={styles.authorRow}>
                    <Icon name="circle-user" size={28} color={theme.colors.text.secondary} />
                    <Text style={styles.authorName}>{itinerary.creator?.name}</Text>
                    <VerifiedBadge level={itinerary.creator?.verificationLevel || 1} size="small" showLabel={false} />
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: 'auto' }}>
                        <Icon name="star" size={12} color="#F59E0B" strokeWidth={2} />
                        <Text style={styles.authorStats}>
                            {itinerary.creator?.rating} • {itinerary.creator?.salesCount?.toLocaleString('pt-BR')} vendas
                        </Text>
                    </View>
                </View>

                {/* Bloco 2: Título + Proposta */}
                <Text style={styles.itineraryTitle} numberOfLines={2}>
                    {itinerary.title}
                </Text>

                <Text style={styles.itineraryDescription} numberOfLines={1}>
                    {itinerary.description}
                </Text>

                {/* Bloco 3: Features em chips compactos */}
                <View style={styles.chipsContainer}>
                    {ITINERARY_INCLUSIONS.map((item) => (
                        <View key={item.id} style={styles.chip}>
                            <Icon name={item.icon as IconName} size={14} color={item.iconColor} />
                            <Text style={styles.chipText}>{item.title}</Text>
                        </View>
                    ))}
                </View>

                {/* Bloco 4: Preço + CTA */}
                <View style={styles.itineraryFooter}>
                    <View>
                        <Text style={styles.price}>R$ {itinerary.price?.toFixed(2).replace('.', ',')}</Text>
                        <Text style={styles.priceLabel}>Roteiro completo</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.buyButton}
                        onPress={onPress}
                    >
                        <Text style={styles.buyButtonText}>Quero esse roteiro</Text>
                        <Icon name="chevron-right" size={16} color="#FFFFFF" strokeWidth={2.5} />
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    itineraryCard: {
        backgroundColor: theme.colors.background,
        borderRadius: theme.borderRadius.lg,
        overflow: 'hidden',
        ...theme.shadows.medium,
        marginBottom: 16,
    },
    cardBadge: {
        position: 'absolute',
        top: theme.spacing.sm,
        right: theme.spacing.sm,
    },
    itineraryContent: {
        padding: 12,
    },
    authorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
        flexWrap: 'wrap',
    },
    authorName: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    authorStats: {
        fontSize: 12,
        color: theme.colors.text.secondary,
        marginLeft: 'auto',
    },
    itineraryTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: 4,
        lineHeight: 22,
    },
    itineraryDescription: {
        fontSize: 13,
        color: theme.colors.text.secondary,
        lineHeight: 18,
        marginBottom: 8,
    },
    chipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 10,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: theme.colors.surfaceLight || '#F8F9FA',
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: theme.colors.borderLight || '#E5E7EB',
    },
    chipText: {
        fontSize: 12,
        fontWeight: '500',
        color: theme.colors.text.primary,
    },
    itineraryFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 2,
    },
    priceLabel: {
        fontSize: 11,
        color: theme.colors.text.secondary,
        marginTop: 2,
    },
    price: {
        fontSize: 24,
        fontWeight: '700',
        color: theme.colors.success,
        lineHeight: 28,
    },
    buyButton: {
        backgroundColor: theme.colors.success,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: theme.borderRadius.full,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    buyButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text.inverse,
    },
});
