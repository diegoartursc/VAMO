import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { Icon } from '../common/Icons';
import { CoverCarousel } from '../common/CoverCarousel';
import { VerifiedBadge } from '../creator/VerifiedBadge';
import { getModuleBadges, getCategoryChips } from '../../utils/itineraryCardBadges';
import { getCoverImages, getCoverFocalPoint } from '../../utils/itineraryMedia';
import { useFavorites } from '../../hooks/useFavorites';
import { useCart } from '../../hooks/useCart';
import { calculateBudgetSummary, formatMoney } from '@vamo/shared/itinerary';

const MAX_CATEGORY_CHIPS = 3;
const MAX_MODULE_CHIPS = 3;

export interface ItineraryCardProps {
    itinerary: any;
    onPress: () => void;
    width?: number;
}

export const ItineraryCard: React.FC<ItineraryCardProps> = ({ itinerary, onPress, width }) => {
    const allCategoryChips = getCategoryChips(itinerary);
    const allModuleBadges = getModuleBadges(itinerary);

    const categoryChips = allCategoryChips.slice(0, MAX_CATEGORY_CHIPS);
    const extraCategories = allCategoryChips.length - categoryChips.length;

    const moduleChips = allModuleBadges.slice(0, MAX_MODULE_CHIPS);
    const extraModules = allModuleBadges.length - moduleChips.length;
    const { isFavorite, toggleFavorite } = useFavorites();
    const { isInCart, addToCart } = useCart();
    const [cartAdded, setCartAdded] = useState(false);

    const itineraryId = typeof itinerary?.id === 'string' ? itinerary.id : '';
    const fav = itineraryId ? isFavorite(itineraryId) : false;
    const inCart = itineraryId ? isInCart(itineraryId) : false;
    const itineraryPrice = Number(itinerary.price);
    const priceLabel = Number.isFinite(itineraryPrice) && itineraryPrice > 0
        ? formatMoney(itineraryPrice, 'AUD')
        : 'Grátis';
    const creatorName = itinerary.creator?.name || 'Criador VAMO';
    const creatorRating = Number(itinerary.creator?.rating);
    const creatorRatingLabel = Number.isFinite(creatorRating) && creatorRating > 0
        ? creatorRating.toFixed(1)
        : 'Novo';
    const salesCount = Number(itinerary.creator?.salesCount);
    const salesLabel = Number.isFinite(salesCount) && salesCount > 0
        ? `${salesCount.toLocaleString('pt-BR')} vendas`
        : 'Roteirista';
    const title = itinerary.title || 'Roteiro digital';
    const description = itinerary.description || 'Planejamento digital com dicas práticas para sua viagem.';
    const destination = itinerary.destination || itinerary.city || 'Destino a confirmar';

    // Badge de confiança do orçamento (só aparece se há sinal positivo —
    // evita poluir cards de roteiros antigos sem dados de custo).
    const budget = calculateBudgetSummary({
        accommodations: itinerary.accommodations,
        attractions: itinerary.attractions,
        transports: itinerary.transports,
        restaurants: itinerary.restaurants,
        extraSpendingItems: itinerary.extraSpendingItems,
        flightCost: itinerary.flightInfo?.cost,
        flightSpending: itinerary.flightInfo?.spending,
    });
    const budgetBadge =
        budget.confidenceLevel === 'verified' ? { label: 'Custos analisados pela VAMO', tone: 'success' as const }
      : budget.confidenceLevel === 'high'     ? { label: 'Custos parcialmente comprovados', tone: 'success' as const }
      : budget.confidenceLevel === 'medium'   ? { label: 'Com custos estimados', tone: 'info' as const }
      : null;

    const handleFav = async (e: any) => {
        e.stopPropagation?.();
        if (!itineraryId) return;
        await toggleFavorite(itineraryId);
    };

    const handleCart = async (e: any) => {
        e.stopPropagation?.();
        if (!itineraryId) return;
        if (!inCart) {
            await addToCart(itineraryId);
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
                {/* aspectRatio 4:3 → capa mais alta e proporcional.
                    coverMode='containWithBlurredBg' → o usuário vê a foto
                    quase inteira (contain), e as sobras são preenchidas
                    com o próprio fundo blurred — sem barra preta/branca,
                    sem corte agressivo do destino. */}
                <CoverCarousel
                    images={getCoverImages(itinerary)}
                    aspectRatio={4 / 3}
                    focalPoint={getCoverFocalPoint(itinerary)}
                    coverMode="containWithBlurredBg"
                    dotsBottom={44}
                />

                {/* Gradiente inferior na imagem para leitura */}
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.45)']}
                    style={styles.imageGradient}
                    pointerEvents="none"
                />

                {/* Preço flutuante sobre imagem */}
                <View style={styles.priceBadge}>
                    <Text style={styles.priceBadgeText}>
                        {priceLabel}
                    </Text>
                </View>

                {/* Botão favoritar */}
                <TouchableOpacity
                    style={styles.favButton}
                    onPress={handleFav}
                    activeOpacity={0.8}
                    accessibilityLabel={fav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
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
                        level={itinerary.creator?.verificationLevel || 'basic'}
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
                                {creatorName}
                            </Text>
                            <View style={styles.ratingRow}>
                                <Icon name="star" size={11} color="#F59E0B" strokeWidth={2.5} />
                                <Text style={styles.ratingText}>
                                    {creatorRatingLabel}
                                </Text>
                                <Text style={styles.ratingDivider}>·</Text>
                                <Text style={styles.salesText}>
                                    {salesLabel}
                                </Text>
                            </View>
                        </View>
                    </View>
                    <VerifiedBadge
                        level={itinerary.creator?.verificationLevel || 'basic'}
                        size="small"
                        showLabel={false}
                    />
                </View>

                {/* Título */}
                <Text style={styles.title} numberOfLines={2}>
                    {title}
                </Text>

                {/* Descrição */}
                <Text style={styles.description} numberOfLines={2}>
                    {description}
                </Text>

                {/* Categorias temáticas — chips navy com ícone Lucide profissional */}
                {categoryChips.length > 0 && (
                    <View style={styles.chipsRow}>
                        {categoryChips.map((cat) => (
                            <View key={cat.key} style={styles.categoryChip}>
                                <Icon name={cat.icon} size={12} color={theme.colors.text.primary} />
                                <Text style={styles.categoryChipText}>{cat.label}</Text>
                            </View>
                        ))}
                        {extraCategories > 0 && (
                            <View style={styles.overflowChip}>
                                <Text style={styles.overflowChipText}>+{extraCategories}</Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Módulos incluídos — chips teal */}
                {moduleChips.length > 0 && (
                    <View style={[styles.chipsRow, categoryChips.length > 0 && styles.chipsRowTop]}>
                        {moduleChips.map((mod) => (
                            <View key={mod.key} style={styles.chip}>
                                <Icon name={mod.icon} size={12} color={theme.colors.primary} />
                                <Text style={styles.chipText}>{mod.label}</Text>
                            </View>
                        ))}
                        {extraModules > 0 && (
                            <View style={[styles.chip, styles.overflowModuleChip]}>
                                <Text style={styles.chipText}>+{extraModules}</Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Badge de confiança do orçamento (discreto, só se há sinal positivo) */}
                {budgetBadge && (
                    <View style={styles.budgetBadgeRow}>
                        <Ionicons
                            name={budgetBadge.tone === 'success' ? 'shield-checkmark-outline' : 'wallet-outline'}
                            size={11}
                            color={budgetBadge.tone === 'success' ? theme.colors.verified : theme.colors.info}
                        />
                        <Text style={[
                            styles.budgetBadgeText,
                            { color: budgetBadge.tone === 'success' ? theme.colors.verified : theme.colors.info },
                        ]}>
                            {budgetBadge.label}
                        </Text>
                    </View>
                )}

                {/* Footer: localização (linha 1, full width) + ações (linha 2) */}
                <View style={styles.footer}>
                    <View style={styles.destinationRow}>
                        <Icon name="location" size={14} color={theme.colors.text.tertiary} />
                        <Text style={styles.destinationText} numberOfLines={1}>
                            {destination}{itinerary.country ? `, ${itinerary.country}` : ''}
                        </Text>
                    </View>
                    <View style={styles.footerActions}>
                        {/* Botão carrinho (secundário, ~44x44) */}
                        <TouchableOpacity
                            style={[styles.cartButton, inCart && styles.cartButtonActive]}
                            onPress={handleCart}
                            activeOpacity={0.8}
                            accessibilityLabel={inCart ? 'No carrinho' : 'Adicionar ao carrinho'}
                            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        >
                            <Icon
                                name={inCart ? 'verified' : 'shopping-cart'}
                                size={18}
                                color={inCart ? theme.colors.primary : theme.colors.text.secondary}
                            />
                        </TouchableOpacity>
                        {/* CTA "Ver roteiro" (primário, ocupa o restante) */}
                        <TouchableOpacity
                            style={styles.ctaButton}
                            onPress={onPress}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.ctaText}>Ver roteiro</Text>
                            <Icon name="chevron-right" size={15} color="#FFF" strokeWidth={2.5} />
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
        height: 110,
    },
    priceBadge: {
        position: 'absolute',
        bottom: 14,
        left: 16,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 11,
        paddingVertical: 5,
        borderRadius: 20,
    },
    priceBadgeText: {
        fontSize: 15,
        fontWeight: '800',
        color: '#FFF',
        letterSpacing: -0.3,
    },
    budgetBadgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 6,
    },
    budgetBadgeText: {
        fontSize: 11,
        fontWeight: '600',
    },
    favButton: {
        position: 'absolute',
        top: 14,
        left: 14,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(0,0,0,0.4)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    verifiedBadge: {
        position: 'absolute',
        top: 14,
        right: 14,
    },
    durationBadge: {
        position: 'absolute',
        bottom: 14,
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 9,
        paddingVertical: 5,
        borderRadius: 20,
    },
    durationText: {
        fontSize: 12,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.95)',
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
        fontSize: 18,
        fontWeight: '800',
        color: theme.colors.text.primary,
        lineHeight: 25,
        letterSpacing: -0.3,
        marginBottom: 8,
    },
    description: {
        fontSize: 13,
        color: theme.colors.text.secondary,
        lineHeight: 19,
        marginBottom: 12,
    },

    // Chips — pill arredondado, compacto, com ícone Lucide 12px alinhado.
    chipsRow: {
        flexDirection: 'row',
        gap: 6,
        marginBottom: 10,
        flexWrap: 'wrap',
    },
    chipsRowTop: {
        marginTop: -2,
    },
    // Module chips (teal claro)
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: theme.colors.primary + '10',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: theme.colors.primary + '22',
    },
    chipText: {
        fontSize: 11,
        fontWeight: '600',
        color: theme.colors.primary,
        lineHeight: 14,
    },
    // Category chips (navy claro)
    categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: '#1A3263' + '0D',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: '#1A3263' + '1F',
    },
    categoryChipText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#1A3263',
        lineHeight: 14,
    },
    // Overflow "+X" chip
    overflowChip: {
        backgroundColor: '#1A3263' + '0D',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: '#1A3263' + '1F',
    },
    overflowChipText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#1A3263',
        lineHeight: 14,
    },
    overflowModuleChip: {
        opacity: 0.7,
    },

    // Footer em 2 linhas: localização (linha 1, full width) + ações (linha 2)
    footer: {
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: theme.colors.borderLight,
        gap: 10,
    },
    destinationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        // Sem flex:1 nem botões na mesma linha — localização tem o espaço todo.
    },
    destinationText: {
        flex: 1,
        fontSize: 12,
        color: theme.colors.text.tertiary,
        fontWeight: '500',
    },
    footerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    // Cart secundário: 44x44, borda teal, fundo branco (Opção A do spec)
    cartButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 1.5,
        borderColor: theme.colors.primary + '40',
        backgroundColor: theme.colors.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cartButtonActive: {
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.primary + '14',
    },
    // CTA primário ocupa o restante da linha
    ctaButton: {
        flex: 1,
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: theme.borderRadius.full,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        minHeight: 44,
        ...theme.shadows.button,
    },
    ctaText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFF',
        letterSpacing: -0.1,
    },
});
