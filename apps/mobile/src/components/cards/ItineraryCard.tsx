import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { Icon, IconName } from '../common/Icons';
import { CoverCarousel } from '../common/CoverCarousel';
import { VerifiedBadge } from '../creator/VerifiedBadge';
import { ITINERARY_INCLUSIONS } from '../../data/itineraryInclusions';
import { useFavorites } from '../../hooks/useFavorites';
import { useCart } from '../../hooks/useCart';

export interface ItineraryCardProps {
    itinerary: any;
    onPress: () => void;
    width?: number;
}

export const ItineraryCard: React.FC<ItineraryCardProps> = ({ itinerary, onPress, width }) => {
    // Mostrar no máximo 3 chips para não poluir
    const chips = ITINERARY_INCLUSIONS.slice(0, 3);
    const { isFavorite, toggleFavorite } = useFavorites();
    const { isInCart, addToCart } = useCart();
    const [cartAdded, setCartAdded] = useState(false);

    const fav = isFavorite(itinerary.id);
    const inCart = isInCart(itinerary.id);

    const handleFav = async (e: any) => {
        e.stopPropagation?.();
        await toggleFavorite(itinerary.id);
    };

    const handleCart = async (e: any) => {
        e.stopPropagation?.();
        if (!inCart) {
            await addToCart(itinerary.id);
            setCartAdded(true);
            setTimeout(() => setCartAdded(false), 2000);
        }
    };

    return (
        <TouchableOpacity
            style={[styles.card, width ? { width } : {}]}
            onPress={onPress}
            activeOpacity={0.92}
        >
            {/* ── Imagem com overlay ── */}
            <View style={styles.imageWrapper}>
                <CoverCarousel images={itinerary.images} height={200} />

                {/* Gradiente inferior na imagem para leitura */}
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.45)']}
                    style={styles.imageGradient}
                    pointerEvents="none"
                />

                {/* Preço flutuante sobre imagem */}
                <View style={styles.priceBadge}>
                    <Text style={styles.priceBadgeText}>
                        R$ {itinerary.price?.toFixed(2).replace('.', ',')}
                    </Text>
                </View>

                {/* Botão favoritar */}
                <TouchableOpacity
                    style={styles.favButton}
                    onPress={handleFav}
                    activeOpacity={0.8}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <Ionicons
                        name={fav ? 'heart' : 'heart-outline'}
                        size={20}
                        color={fav ? '#EF4444' : '#fff'}
                    />
                </TouchableOpacity>

                {/* Badge de verificação */}
                <View style={styles.verifiedBadge}>
                    <VerifiedBadge
                        level={itinerary.creator?.verificationLevel || 1}
                        size="small"
                    />
                </View>

                {/* Duração sobre imagem */}
                {itinerary.duration && (
                    <View style={styles.durationBadge}>
                        <Icon name="calendar" size={12} color="rgba(255,255,255,0.9)" />
                        <Text style={styles.durationText}>{itinerary.duration} dias</Text>
                    </View>
                )}
            </View>

            {/* ── Conteúdo ── */}
            <View style={styles.content}>

                {/* Linha do criador */}
                <View style={styles.creatorRow}>
                    <View style={styles.creatorLeft}>
                        <View style={styles.creatorAvatar}>
                            <Icon name="circle-user" size={20} color={theme.colors.primary} />
                        </View>
                        <View>
                            <Text style={styles.creatorName} numberOfLines={1}>
                                {itinerary.creator?.name}
                            </Text>
                            <View style={styles.ratingRow}>
                                <Icon name="star" size={11} color="#F59E0B" strokeWidth={2.5} />
                                <Text style={styles.ratingText}>
                                    {itinerary.creator?.rating?.toFixed(1)}
                                </Text>
                                <Text style={styles.ratingDivider}>·</Text>
                                <Text style={styles.salesText}>
                                    {itinerary.creator?.salesCount?.toLocaleString('pt-BR')} vendas
                                </Text>
                            </View>
                        </View>
                    </View>
                    <VerifiedBadge
                        level={itinerary.creator?.verificationLevel || 1}
                        size="small"
                        showLabel={false}
                    />
                </View>

                {/* Título */}
                <Text style={styles.title} numberOfLines={2}>
                    {itinerary.title}
                </Text>

                {/* Descrição */}
                <Text style={styles.description} numberOfLines={2}>
                    {itinerary.description}
                </Text>

                {/* Chips de inclusões */}
                <View style={styles.chipsRow}>
                    {chips.map((item) => (
                        <View key={item.id} style={styles.chip}>
                            <Icon name={item.icon as IconName} size={13} color={theme.colors.primary} />
                            <Text style={styles.chipText}>{item.title}</Text>
                        </View>
                    ))}
                </View>

                {/* Footer: destino + botões */}
                <View style={styles.footer}>
                    <View style={styles.destinationRow}>
                        <Icon name="location" size={13} color={theme.colors.text.tertiary} />
                        <Text style={styles.destinationText} numberOfLines={1}>
                            {itinerary.destination}{itinerary.country ? `, ${itinerary.country}` : ''}
                        </Text>
                    </View>
                    <View style={styles.footerActions}>
                        {/* Botão carrinho */}
                        <TouchableOpacity
                            style={[styles.cartButton, inCart && styles.cartButtonActive]}
                            onPress={handleCart}
                            activeOpacity={0.8}
                        >
                            <Ionicons
                                name={inCart ? 'checkmark' : 'cart-outline'}
                                size={15}
                                color={inCart ? theme.colors.primary : theme.colors.text.secondary}
                            />
                        </TouchableOpacity>
                        {/* Botão ver roteiro */}
                        <TouchableOpacity
                            style={styles.ctaButton}
                            onPress={onPress}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.ctaText}>Ver roteiro</Text>
                            <Icon name="chevron-right" size={14} color="#FFF" strokeWidth={2.5} />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: theme.colors.background,
        borderRadius: theme.borderRadius.xl,
        overflow: 'hidden',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        ...theme.shadows.medium,
    },

    // ── Imagem ──
    imageWrapper: {
        position: 'relative',
    },
    imageGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 80,
    },
    priceBadge: {
        position: 'absolute',
        bottom: 12,
        left: 14,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        backdropFilter: 'blur(4px)',
    },
    priceBadgeText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#FFF',
        letterSpacing: -0.3,
    },
    favButton: {
        position: 'absolute',
        top: 12,
        left: 12,
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: 'rgba(0,0,0,0.4)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    verifiedBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
    },
    durationBadge: {
        position: 'absolute',
        bottom: 12,
        right: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 20,
    },
    durationText: {
        fontSize: 11,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.9)',
    },

    // ── Conteúdo ──
    content: {
        padding: 16,
    },

    // Criador
    creatorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    creatorLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    creatorAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: theme.colors.primary + '15',
        alignItems: 'center',
        justifyContent: 'center',
    },
    creatorName: {
        fontSize: 13,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: 2,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    ratingText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#F59E0B',
    },
    ratingDivider: {
        fontSize: 11,
        color: theme.colors.text.tertiary,
    },
    salesText: {
        fontSize: 11,
        color: theme.colors.text.tertiary,
    },

    // Título
    title: {
        fontSize: 17,
        fontWeight: '800',
        color: theme.colors.text.primary,
        lineHeight: 23,
        letterSpacing: -0.3,
        marginBottom: 6,
    },
    description: {
        fontSize: 13,
        color: theme.colors.text.secondary,
        lineHeight: 19,
        marginBottom: 12,
    },

    // Chips
    chipsRow: {
        flexDirection: 'row',
        gap: 6,
        marginBottom: 14,
        flexWrap: 'wrap',
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: theme.colors.primary + '10',
        paddingHorizontal: 9,
        paddingVertical: 5,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.colors.primary + '20',
    },
    chipText: {
        fontSize: 11,
        fontWeight: '600',
        color: theme.colors.primary,
    },

    // Footer
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: theme.colors.borderLight,
    },
    destinationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        flex: 1,
    },
    destinationText: {
        fontSize: 12,
        color: theme.colors.text.tertiary,
        fontWeight: '500',
    },
    footerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    cartButton: {
        width: 34,
        height: 34,
        borderRadius: 17,
        borderWidth: 1.5,
        borderColor: theme.colors.borderLight,
        backgroundColor: theme.colors.surfaceLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cartButtonActive: {
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.primary + '12',
    },
    ctaButton: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 16,
        paddingVertical: 9,
        borderRadius: theme.borderRadius.full,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        ...theme.shadows.button,
    },
    ctaText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#FFF',
    },
});
