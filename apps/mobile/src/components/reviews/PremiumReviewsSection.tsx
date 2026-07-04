import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { theme } from '../../theme/theme';
import { Icon } from '../common/Icons';
import { CreatorAvatar } from '../common/CreatorAvatar';
import { resolveAvatarUrl } from '../../utils/avatar';
import { useMediaLightbox } from '../common/MediaLightbox';

interface Review {
    id: string;
    user: {
        name: string;
        initial: string;
        avatar: string;
        location?: string;
    };
    rating: number;
    date: string;
    text: string;
    verified?: boolean;
    photos?: string[];
    response?: {
        text: string;
        date: string;
    };
}

interface ReviewsSectionProps {
    reviews: Review[];
    averageRating: number;
    totalReviews: number;
    categoryRatings?: {
        guide?: number;
        transport?: number;
        value?: number;
    };
    communityPhotos?: string[];
    topRatedSummary?: string;
}

export default function PremiumReviewsSection({
    reviews,
    averageRating,
    totalReviews,
    categoryRatings,
    communityPhotos,
    topRatedSummary,
}: ReviewsSectionProps) {
    const [showAllReviews, setShowAllReviews] = useState(false);
    const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 3);

    // Lightbox compartilhado pra fotos da comunidade e por review. `open`
    // aceita lista + index + título — o usuário sempre cai na foto tocada.
    const lightbox = useMediaLightbox();

    // Fotos da comunidade já vêm flat; mapeia pra shape do lightbox.
    const communityItems = useMemo(
        () => (communityPhotos ?? []).map(url => ({ url, type: 'image' as const })),
        [communityPhotos],
    );

    /**
     * Renderiza 5 estrelas. Bug histórico: a versão anterior passava
     * `color` (que vira o STROKE da estrela no Icon) e `strokeWidth=0` para
     * estrelas preenchidas — mas NÃO passava `fill`. Como o Icon default
     * `fill='none'`, as estrelas "cheias" ficavam invisíveis (zero stroke
     * + nada de preenchimento = nada renderizado). Por isso o card do
     * Diego mostrava só o nome e a data, sem estrelas amarelas.
     * Fix: passar `fill='#F59E0B'` quando estrela <= rating.
     */
    const renderStars = (rating: number, size = 16) => (
        <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => {
                const filled = star <= rating;
                return (
                    <Icon
                        key={star}
                        name="star"
                        size={size}
                        color={filled ? '#F59E0B' : '#E2E8F0'}
                        fill={filled ? '#F59E0B' : 'transparent'}
                        strokeWidth={filled ? 0 : 1.5}
                    />
                );
            })}
        </View>
    );

    const renderRatingBar = (label: string, rating: number) => (
        <View key={label} style={styles.ratingBarRow}>
            <Text style={styles.ratingLabel}>{label}</Text>
            <View style={styles.barContainer}>
                <View style={[styles.barFill, { width: `${(rating / 5) * 100}%` as any }]} />
            </View>
            <Text style={styles.ratingValue}>{rating.toFixed(1)}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* ── Aggregate Rating ── */}
            <View style={styles.aggregateSection}>
                <Text style={styles.aggregateTitle}>Avaliações</Text>
                <View style={styles.ratingDisplay}>
                    <Icon name="star" size={38} color="#F59E0B" fill="#F59E0B" />
                    <Text style={styles.ratingNumber}>{averageRating.toFixed(1)}</Text>
                    <View style={styles.ratingMeta}>
                        <Text style={styles.ratingCount}>
                            {totalReviews} {totalReviews === 1 ? 'avaliação' : 'avaliações'}
                        </Text>
                        <Text style={styles.ratingTrust}>100% autênticas</Text>
                    </View>
                </View>
            </View>

            {/* ── Top-Rated Summary ── */}
            {topRatedSummary && (
                <View style={styles.summarySection}>
                    <View style={styles.summaryIconWrap}>
                        <Icon name="heart" size={14} color={theme.colors.primary} strokeWidth={2} />
                    </View>
                    <Text style={styles.summaryText}>{topRatedSummary}</Text>
                </View>
            )}

            {/* ── Category Ratings ── */}
            {categoryRatings && (
                <View style={styles.categorySection}>
                    {categoryRatings.guide && renderRatingBar('Guia', categoryRatings.guide)}
                    {categoryRatings.transport && renderRatingBar('Transporte', categoryRatings.transport)}
                    {categoryRatings.value && renderRatingBar('Custo-benefício', categoryRatings.value)}
                </View>
            )}

            {/* ── Community Photos ── */}
            {communityPhotos && communityPhotos.length > 0 && (
                <View style={styles.photosSection}>
                    <Text style={styles.photosTitle}>Fotos da comunidade</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                        {communityPhotos.map((photo, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.photoWrapper}
                                activeOpacity={0.85}
                                accessibilityLabel={`Foto ${index + 1} da comunidade`}
                                onPress={() => lightbox.open(communityItems, index, 'Fotos da comunidade')}
                            >
                                <Image source={{ uri: photo }} style={styles.communityPhoto} />
                                {index === communityPhotos.length - 1 && communityPhotos.length > 3 && (
                                    <View style={styles.photoOverlay}>
                                        <Text style={styles.photoOverlayText}>+{communityPhotos.length - 3}</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}

            {/* ── Individual Reviews ── */}
            <View style={styles.reviewsList}>
                {displayedReviews.map((review) => (
                    <View key={review.id} style={styles.reviewCard}>
                        {/* Stars + header row */}
                        <View style={styles.reviewHeader}>
                            {resolveAvatarUrl(review.user.avatar) ? (
                                <CreatorAvatar avatar={review.user.avatar} name={review.user.name} size={40} style={styles.avatar} />
                            ) : (
                                // Sem foto real: mantém o design de inicial sobre cor
                                // (review.user.avatar guarda uma COR, não URL, nos dados legados).
                                <View style={[styles.avatar, { backgroundColor: review.user.avatar }]}>
                                    <Text style={styles.avatarText}>{review.user.initial}</Text>
                                </View>
                            )}
                            <View style={styles.userInfo}>
                                <Text style={styles.userName}>
                                    {review.user.name}{review.user.location ? ` · ${review.user.location}` : ''}
                                </Text>
                                <View style={styles.metaRow}>
                                    {renderStars(review.rating, 13)}
                                    <Text style={styles.reviewRatingNumber}>
                                        {Number(review.rating || 0).toFixed(1)}
                                    </Text>
                                    <Text style={styles.reviewDate}>{review.date}</Text>
                                </View>
                            </View>
                            <TouchableOpacity style={styles.menuButton}>
                                <Icon name="more-horizontal" size={18} color={theme.colors.text.tertiary} />
                            </TouchableOpacity>
                        </View>

                        {/* Verified badge */}
                        {review.verified && (
                            <View style={styles.verifiedRow}>
                                <Icon name="verified" size={13} color={theme.colors.verified} />
                                <Text style={styles.verifiedBadge}>Compra verificada</Text>
                            </View>
                        )}

                        {/* Review text */}
                        <Text style={styles.reviewText}>{review.text}</Text>

                        {/* Photos — clicáveis: cada uma abre o lightbox na
                            galeria desta review específica, no índice tocado. */}
                        {review.photos && review.photos.length > 0 && (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.reviewPhotos} contentContainerStyle={{ gap: 8 }}>
                                {review.photos.map((photo, index) => {
                                    const items = review.photos!.map(url => ({ url, type: 'image' as const }));
                                    return (
                                        <TouchableOpacity
                                            key={index}
                                            activeOpacity={0.85}
                                            accessibilityLabel={`Foto ${index + 1} da avaliação de ${review.user.name}`}
                                            onPress={() => lightbox.open(items, index, `Avaliação · ${review.user.name}`)}
                                        >
                                            <Image source={{ uri: photo }} style={styles.reviewPhoto} />
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        )}

                        {/* Creator response */}
                        {review.response && (
                            <View style={styles.responseContainer}>
                                <View style={styles.responseHeader}>
                                    <Icon name="circle-user" size={14} color={theme.colors.primary} />
                                    <Text style={styles.responseTitle}>Resposta do criador</Text>
                                    <Text style={styles.responseDate}>{review.response.date}</Text>
                                </View>
                                <Text style={styles.responseText}>{review.response.text}</Text>
                            </View>
                        )}
                    </View>
                ))}
            </View>

            {reviews.length > 3 && (
                <TouchableOpacity
                    style={styles.showMoreButton}
                    onPress={() => setShowAllReviews(!showAllReviews)}
                    activeOpacity={0.8}
                >
                    <Text style={styles.showMoreText}>
                        {showAllReviews ? 'Mostrar menos' : `Ver todas as ${reviews.length} avaliações`}
                    </Text>
                    <Icon
                        name={showAllReviews ? 'chevron-left' : 'chevron-right'}
                        size={16}
                        color={theme.colors.primary}
                        strokeWidth={2.5}
                    />
                </TouchableOpacity>
            )}

            {/* Lightbox compartilhado — renderiza apenas quando uma foto é tocada. */}
            {lightbox.element}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingVertical: 8,
    },

    // ── Aggregate Rating ──
    aggregateSection: {
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
        marginBottom: 20,
    },
    aggregateTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: theme.colors.text.primary,
        marginBottom: 14,
        letterSpacing: -0.3,
    },
    ratingDisplay: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: theme.colors.surfaceLight,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    ratingNumber: {
        fontSize: 44,
        fontWeight: '800',
        color: theme.colors.text.primary,
        letterSpacing: -1.5,
        lineHeight: 48,
    },
    ratingMeta: {
        marginLeft: 4,
        justifyContent: 'center',
    },
    ratingCount: {
        fontSize: 15,
        fontWeight: '700',
        color: theme.colors.text.primary,
    },
    ratingTrust: {
        fontSize: 13,
        color: theme.colors.text.tertiary,
        marginTop: 2,
    },
    starsRow: {
        flexDirection: 'row',
        gap: 3,
        marginBottom: 4,
    },

    // ── Summary ──
    summarySection: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 12,
        backgroundColor: theme.colors.primary + '0D',
        borderRadius: 12,
        marginBottom: 20,
        gap: 10,
        borderWidth: 1,
        borderColor: theme.colors.primary + '1A',
    },
    summaryIconWrap: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: theme.colors.primary + '18',
        alignItems: 'center',
        justifyContent: 'center',
    },
    summaryText: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text.primary,
        lineHeight: 20,
    },

    // ── Category Rating Bars ──
    categorySection: {
        gap: 14,
        marginBottom: 24,
        backgroundColor: theme.colors.surfaceLight,
        borderRadius: 14,
        padding: 16,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    ratingBarRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    ratingLabel: {
        fontSize: 14,
        color: theme.colors.text.secondary,
        width: 120,
        fontWeight: '500',
    },
    barContainer: {
        flex: 1,
        height: 6,
        backgroundColor: theme.colors.border,
        borderRadius: 3,
        overflow: 'hidden',
    },
    barFill: {
        height: '100%',
        backgroundColor: theme.colors.primary,
        borderRadius: 3,
    },
    ratingValue: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.colors.text.primary,
        width: 36,
        textAlign: 'right',
    },

    // ── Community Photos ──
    photosSection: {
        marginBottom: 24,
    },
    photosTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: 12,
    },
    photoWrapper: {
        position: 'relative',
    },
    communityPhoto: {
        width: 130,
        height: 170,
        borderRadius: 12,
    },
    photoOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.45)',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    photoOverlayText: {
        fontSize: 22,
        fontWeight: '700',
        color: '#fff',
    },

    // ── Review Cards ──
    reviewsList: {
        gap: 16,
    },
    reviewCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        ...theme.shadows.small,
    },
    reviewHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        marginBottom: 10,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    avatarText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: 4,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    reviewRatingNumber: {
        fontSize: 12.5,
        fontWeight: '700',
        color: '#B45309',
    },
    reviewDate: {
        fontSize: 12,
        color: theme.colors.text.tertiary,
    },
    menuButton: {
        padding: 4,
    },
    verifiedRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginBottom: 10,
    },
    verifiedBadge: {
        fontSize: 12,
        color: theme.colors.verified,
        fontWeight: '600',
    },
    reviewText: {
        fontSize: 14,
        color: theme.colors.text.primary,
        lineHeight: 21,
        marginBottom: 12,
    },
    reviewPhotos: {
        marginBottom: 12,
    },
    reviewPhoto: {
        width: 80,
        height: 80,
        borderRadius: 10,
    },

    // ── Creator Response ──
    responseContainer: {
        backgroundColor: theme.colors.surfaceLight,
        padding: 12,
        borderLeftWidth: 3,
        borderLeftColor: theme.colors.primary,
        borderRadius: 10,
        marginTop: 4,
    },
    responseHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 6,
    },
    responseTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: theme.colors.text.primary,
        flex: 1,
    },
    responseDate: {
        fontSize: 11,
        color: theme.colors.text.tertiary,
    },
    responseText: {
        fontSize: 13,
        color: theme.colors.text.secondary,
        lineHeight: 19,
    },

    // ── Show More ──
    showMoreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 14,
        marginTop: 8,
        borderWidth: 1.5,
        borderColor: theme.colors.primary,
        borderRadius: 12,
    },
    showMoreText: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.colors.primary,
    },
});
