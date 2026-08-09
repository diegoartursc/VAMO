import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { Icon } from '../common/Icons';
import { CoverCarousel } from '../common/CoverCarousel';
import { VerifiedBadge } from '../creator/VerifiedBadge';
import { VERIFICATION_CONFIGS, VerificationLevel } from '../../types/creator';
import { CreatorAvatar } from '../common/CreatorAvatar';
import { getModuleBadges, getCategoryChips } from '../../utils/itineraryCardBadges';
import { getCoverImages, getCoverFocalPoint } from '../../utils/itineraryMedia';
import { ItinerarySummaryPanel } from './ItinerarySummaryPanel';
import { formatItineraryDestination } from '../../utils/itineraryCardSummary';
import { useFavorites } from '../../hooks/useFavorites';
import { useCart } from '../../hooks/useCart';
import { evaluateItineraryAvailability } from '../../utils/availability';
import { calculateBudgetSummary, formatMoney, getRouteRatingDisplay } from '@vamo/shared/itinerary';

/** Padding horizontal do bloco de conteúdo — precisa bater com `styles.content`. */
const CONTENT_PADDING_HORIZONTAL = 14;

/**
 * Margem horizontal típica das listas que renderizam o card em largura total
 * (telas de listagem e perfil do criador). Usada só quando o consumidor não
 * informa `width` — é uma estimativa conservadora: errar para menos apenas
 * mostra um item a menos, nunca estoura a largura.
 */
const FULL_WIDTH_LIST_INSET = 40;

export interface ItineraryCardProps {
    itinerary: any;
    onPress: () => void;
    /** Largura fixa (carrosséis). Sem ela, o card ocupa a largura do container. */
    width?: number;
}

export const ItineraryCard: React.FC<ItineraryCardProps> = ({ itinerary, onPress, width }) => {
    // Largura real do card: a prop tem precedência (carrossel sabe exatamente);
    // sem ela, parte da janela menos a margem típica da lista. `onLayout` seria
    // o ideal, mas não dispara de forma confiável neste setup RN Web — ver
    // relatório. O painel ainda tem overflow hidden + ellipsis como rede.
    const { width: windowWidth } = useWindowDimensions();
    const cardWidth = width ?? Math.max(0, windowWidth - FULL_WIDTH_LIST_INSET);
    const contentWidth = Math.max(0, cardWidth - CONTENT_PADDING_HORIZONTAL * 2);
    // Fonte única dos dados reais — o card não decide o que é categoria válida
    // nem qual módulo está preenchido (ver utils/itineraryCardBadges).
    const categoryChips = getCategoryChips(itinerary);
    const moduleBadges = getModuleBadges(itinerary);
    const { isFavorite, toggleFavorite } = useFavorites();
    const { isInCart, addToCart, isOwned } = useCart();
    const [cartAdded, setCartAdded] = useState(false);

    const itineraryId = typeof itinerary?.id === 'string' ? itinerary.id : '';
    const fav = itineraryId ? isFavorite(itineraryId) : false;
    const inCart = itineraryId ? isInCart(itineraryId) : false;
    const owned = itineraryId ? isOwned(itineraryId) : false;
    const itineraryPrice = Number(itinerary.price);
    const priceLabel = Number.isFinite(itineraryPrice) && itineraryPrice > 0
        ? formatMoney(itineraryPrice, 'AUD')
        : 'Grátis';
    const creatorName = itinerary.creator?.name || 'Criador VAMO';
    // O selo agora existe em UM lugar só (linha do criador). Como ele é
    // icon-only, o texto do nível vai no rótulo acessível — a informação de
    // confiança não se perde para quem usa leitor de tela.
    const verificationLevel = (itinerary.creator?.verificationLevel || 'basic') as VerificationLevel;
    const verificationLabel = (VERIFICATION_CONFIGS[verificationLevel] ?? VERIFICATION_CONFIGS.basic).label;
    // Nota exibida no card é a do ROTEIRO (averageRating + reviewCount), NÃO
    // a do criador — herdar `creator.rating` mostrava 5.0 em roteiros novos
    // só porque o criador tinha reputação. Sem reviews reais → 'Novo'.
    const ratingDisplay = getRouteRatingDisplay({
        averageRating: itinerary.averageRating ?? itinerary.rating,
        reviewCount: itinerary.reviewCount ?? itinerary.reviewsCount ?? itinerary.totalReviews,
    });
    // Vendas REAIS por roteiro (Itinerary._count.sales) — backend expõe esse
    // valor no top-level. creator.salesCount vem do campo agregado
    // Creator.totalSales que historicamente não é incrementado a cada venda,
    // então só usamos como fallback se o top-level estiver ausente.
    const salesCount = Number(itinerary.salesCount ?? itinerary.creator?.salesCount);
    const salesLabel = Number.isFinite(salesCount) && salesCount > 0
        ? `${salesCount.toLocaleString('pt-BR')} vendas`
        : 'Roteirista';
    const title = itinerary.title || 'Roteiro digital';
    // Sem descrição real o card NÃO renderiza a linha (nem texto genérico de
    // enchimento, nem espaço reservado).
    const description = typeof itinerary.description === 'string' ? itinerary.description.trim() : '';
    // "Tóquio, Kyoto e Osaka · Japão" — null quando não há dado nenhum.
    const destinationLabel = formatItineraryDestination(itinerary);

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
        if (inCart) return;
        // Mesmo gate do detalhe + cart screen: roteiro tem que estar comprável
        // e usuário não pode já ser dono. Listings já pré-filtram o status, mas
        // mantemos o check pra defender contra cache desatualizado.
        if (owned) return;
        const avail = evaluateItineraryAvailability(itinerary);
        if (!avail.ok) return;
        await addToCart(itineraryId);
        setCartAdded(true);
        setTimeout(() => setCartAdded(false), 2000);
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
                    showCounter={false}
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

                {/* Verificação do criador NÃO fica aqui: ela vive na linha do
                    criador, junto ao nome. Antes aparecia nos dois lugares. */}

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

                {/* 1. Criador — única ocorrência do selo de verificação */}
                <View style={styles.creatorRow}>
                    <CreatorAvatar creator={itinerary.creator} size={32} />
                    <View style={styles.creatorInfo}>
                        <Text style={styles.creatorName} numberOfLines={1}>
                            {creatorName}
                        </Text>
                        <View style={styles.ratingRow}>
                            <Icon
                                name="star"
                                size={11}
                                color={ratingDisplay.type === 'rating' ? '#F59E0B' : theme.colors.text.tertiary}
                                strokeWidth={2.5}
                            />
                            <Text
                                style={[
                                    styles.ratingText,
                                    ratingDisplay.type === 'new' && styles.ratingTextMuted,
                                ]}
                            >
                                {ratingDisplay.label}
                            </Text>
                            <Text style={styles.ratingDivider}>·</Text>
                            <Text style={styles.salesText} numberOfLines={1}>
                                {salesLabel}
                            </Text>
                        </View>
                    </View>
                    <View accessible accessibilityLabel={`Roteirista ${verificationLabel}`}>
                        <VerifiedBadge level={verificationLevel} size="small" showLabel={false} />
                    </View>
                </View>

                {/* 2. Título */}
                <Text style={styles.title} numberOfLines={2}>
                    {title}
                </Text>

                {/* 3. Destino — contexto principal, logo abaixo do título */}
                {destinationLabel && (
                    <View style={styles.destinationRow}>
                        <Icon name="location" size={13} color={theme.colors.text.tertiary} />
                        <Text style={styles.destinationText} numberOfLines={1}>
                            {destinationLabel}
                        </Text>
                    </View>
                )}

                {/* 4. Descrição — uma linha; o detalhe mostra a completa */}
                {!!description && (
                    <Text style={styles.description} numberOfLines={1} ellipsizeMode="tail">
                        {description}
                    </Text>
                )}

                {/* 5. Resumo: Estilo (tema) + Inclui (o que é entregue) */}
                {(categoryChips.length > 0 || moduleBadges.length > 0) && (
                    <View style={styles.summaryWrapper}>
                        <ItinerarySummaryPanel
                            categories={categoryChips}
                            modules={moduleBadges}
                            availableWidth={contentWidth}
                        />
                    </View>
                )}

                {/* 6. Confiança dos custos — uma linha, só com sinal real */}
                {budgetBadge && (
                    <View style={styles.budgetBadgeRow}>
                        <Ionicons
                            name={budgetBadge.tone === 'success' ? 'shield-checkmark-outline' : 'wallet-outline'}
                            size={11}
                            color={budgetBadge.tone === 'success' ? theme.colors.verified : theme.colors.info}
                        />
                        <Text
                            style={[
                                styles.budgetBadgeText,
                                { color: budgetBadge.tone === 'success' ? theme.colors.verified : theme.colors.info },
                            ]}
                            numberOfLines={1}
                        >
                            {budgetBadge.label}
                        </Text>
                    </View>
                )}

                {/* 7. Ações — o destino saiu daqui e subiu para junto do título */}
                <View style={styles.footerActions}>
                    <TouchableOpacity
                        style={[styles.cartButton, inCart && styles.cartButtonActive]}
                        onPress={handleCart}
                        activeOpacity={0.8}
                        accessibilityRole="button"
                        accessibilityState={{ selected: inCart, disabled: inCart || owned }}
                        accessibilityLabel={inCart ? 'Já está no carrinho' : 'Adicionar ao carrinho'}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                        <Icon
                            name={inCart ? 'verified' : 'shopping-cart'}
                            size={18}
                            color={inCart ? theme.colors.primary : theme.colors.text.secondary}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.ctaButton}
                        onPress={onPress}
                        activeOpacity={0.85}
                        accessibilityRole="button"
                        accessibilityLabel={`Ver roteiro ${title}`}
                    >
                        <Text style={styles.ctaText}>Ver roteiro</Text>
                        <Icon name="chevron-right" size={15} color="#FFF" strokeWidth={2.5} />
                    </TouchableOpacity>
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
    // Escala vertical: cada bloco declara a própria distância para o ANTERIOR
    // (marginTop). Assim uma seção ausente não deixa espaço reservado — e não
    // há marginBottom acumulando entre irmãos.
    content: {
        padding: 14,
    },

    // 1. Criador
    creatorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    creatorInfo: {
        flex: 1,
        minWidth: 0,
    },
    creatorName: {
        fontSize: 13,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: 1,
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
    ratingTextMuted: {
        color: theme.colors.text.tertiary,
        fontWeight: '600',
    },
    ratingDivider: {
        fontSize: 11,
        color: theme.colors.text.tertiary,
    },
    salesText: {
        flexShrink: 1,
        fontSize: 11,
        color: theme.colors.text.tertiary,
    },

    // 2. Título
    title: {
        fontSize: 17,
        fontWeight: '800',
        color: theme.colors.text.primary,
        lineHeight: 23,
        letterSpacing: -0.3,
    },

    // 3. Destino (logo abaixo do título)
    destinationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginTop: 4,
    },
    destinationText: {
        flex: 1,
        fontSize: 12,
        color: theme.colors.text.tertiary,
        fontWeight: '500',
    },

    // 4. Descrição (uma linha)
    description: {
        fontSize: 13,
        color: theme.colors.text.secondary,
        lineHeight: 18,
        marginTop: 6,
    },

    // 5. Painel de resumo (Estilo / Inclui)
    summaryWrapper: {
        marginTop: 10,
    },

    // 6. Confiança dos custos
    budgetBadgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 6,
    },
    budgetBadgeText: {
        flexShrink: 1,
        fontSize: 11,
        fontWeight: '600',
    },

    // 7. Ações
    footerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: theme.colors.borderLight,
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
