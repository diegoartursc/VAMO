import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';

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
}

export default function PremiumReviewsSection({
    reviews,
    averageRating,
    totalReviews,
    categoryRatings,
    communityPhotos,
}: ReviewsSectionProps) {
    const [showAllReviews, setShowAllReviews] = useState(false);
    const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 3);

    const renderStars = (rating: number) => {
        return (
            <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <Text key={star} style={styles.star}>
                        {star <= rating ? '★' : '☆'}
                    </Text>
                ))}
            </View>
        );
    };

    const renderRatingBar = (label: string, rating: number) => {
        return (
            <View style={styles.ratingBarRow}>
                <Text style={styles.ratingLabel}>{label}</Text>
                <View style={styles.barContainer}>
                    <View style={[styles.barFill, { width: `${(rating / 5) * 100}%` }]} />
                </View>
                <Text style={styles.ratingValue}>{rating}/5</Text>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {/* Aggregate Rating Header */}
            <View style={styles.aggregateSection}>
                <Text style={styles.aggregateTitle}>Avaliações de clientes</Text>
                <View style={styles.ratingDisplay}>
                    {renderStars(5)}
                    <Text style={styles.ratingNumber}>{averageRating}/5</Text>
                </View>
                <Text style={styles.ratingSubtext}>
                    com base em {totalReviews} avaliações
                </Text>
            </View>

            {/* Category Ratings */}
            {categoryRatings && (
                <View style={styles.categorySection}>
                    {categoryRatings.guide && renderRatingBar('Guia', categoryRatings.guide)}
                    {categoryRatings.transport && renderRatingBar('Transporte', categoryRatings.transport)}
                    {categoryRatings.value && renderRatingBar('Custo-benefício', categoryRatings.value)}
                </View>
            )}

            {/* Community Photos */}
            {communityPhotos && communityPhotos.length > 0 && (
                <View style={styles.photosSection}>
                    <Text style={styles.photosTitle}>Fotos da comunidade</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosScroll}>
                        {communityPhotos.map((photo, index) => (
                            <View key={index} style={styles.photoWrapper}>
                                <Image source={{ uri: photo }} style={styles.communityPhoto} />
                                {index === communityPhotos.length - 1 && communityPhotos.length > 3 && (
                                    <View style={styles.photoOverlay}>
                                        <Text style={styles.photoOverlayText}>
                                            +{communityPhotos.length - 3}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        ))}
                    </ScrollView>
                </View>
            )}

            {/* Individual Reviews */}
            <View style={styles.reviewsList}>
                {displayedReviews.map((review) => (
                    <View key={review.id} style={styles.reviewCard}>
                        {renderStars(review.rating)}

                        <View style={styles.reviewHeader}>
                            <View style={[styles.avatar, { backgroundColor: review.user.avatar }]}>
                                <Text style={styles.avatarText}>{review.user.initial}</Text>
                            </View>
                            <View style={styles.userInfo}>
                                <Text style={styles.userName}>
                                    {review.user.name} {review.user.location && `– ${review.user.location}`}
                                </Text>
                                <View style={styles.metaRow}>
                                    <Text style={styles.reviewDate}>{review.date}</Text>
                                    {review.verified && (
                                        <>
                                            <Text style={styles.separator}>•</Text>
                                            <Text style={styles.verifiedBadge}>Reserva verificada</Text>
                                        </>
                                    )}
                                </View>
                            </View>
                            <TouchableOpacity style={styles.menuButton}>
                                <Ionicons name="ellipsis-horizontal" size={20} color={theme.colors.text.tertiary} />
                            </TouchableOpacity>
                        </View>

                        {review.photos && review.photos.length > 0 && (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.reviewPhotos}>
                                {review.photos.map((photo, index) => (
                                    <Image key={index} source={{ uri: photo }} style={styles.reviewPhoto} />
                                ))}
                            </ScrollView>
                        )}

                        <Text style={styles.reviewText}>{review.text}</Text>

                        {review.response && (
                            <View style={styles.responseContainer}>
                                <Text style={styles.responseTitle}>Resposta do fornecedor</Text>
                                <Text style={styles.responseDate}>{review.response.date}</Text>
                                <Text style={styles.responseText}>{review.response.text}</Text>
                            </View>
                        )}

                        <TouchableOpacity style={styles.translateButton}>
                            <Text style={styles.translateText}>Traduzir</Text>
                        </TouchableOpacity>
                    </View>
                ))}
            </View>

            {reviews.length > 3 && (
                <TouchableOpacity
                    style={styles.showMoreButton}
                    onPress={() => setShowAllReviews(!showAllReviews)}
                >
                    <Text style={styles.showMoreText}>
                        {showAllReviews ? 'Mostrar menos' : `Ver todas as ${reviews.length} avaliações`}
                    </Text>
                    <Ionicons
                        name={showAllReviews ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color={theme.colors.primary}
                    />
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingVertical: 24,
    },
    // Aggregate Rating
    aggregateSection: {
        alignItems: 'center',
        paddingBottom: 24,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        marginBottom: 24,
    },
    aggregateTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: 16,
    },
    ratingDisplay: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 8,
    },
    starsRow: {
        flexDirection: 'row',
        gap: 4,
    },
    star: {
        fontSize: 24,
        color: '#FFD700',
    },
    ratingNumber: {
        fontSize: 32,
        fontWeight: '700',
        color: theme.colors.text.primary,
    },
    ratingSubtext: {
        fontSize: 14,
        color: theme.colors.text.secondary,
    },
    // Category Ratings
    categorySection: {
        gap: 12,
        marginBottom: 24,
    },
    ratingBarRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    ratingLabel: {
        fontSize: 15,
        color: theme.colors.text.primary,
        width: 130,
    },
    barContainer: {
        flex: 1,
        height: 8,
        backgroundColor: theme.colors.surfaceLight,
        borderRadius: 4,
        overflow: 'hidden',
    },
    barFill: {
        height: '100%',
        backgroundColor: theme.colors.primary,
        borderRadius: 4,
    },
    ratingValue: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text.primary,
        width: 40,
        textAlign: 'right',
    },
    // Community Photos
    photosSection: {
        marginBottom: 24,
    },
    photosTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: 12,
    },
    photosScroll: {
        marginHorizontal: -20,
        paddingHorizontal: 20,
    },
    photoWrapper: {
        position: 'relative',
        marginRight: 8,
    },
    communityPhoto: {
        width: 140,
        height: 180,
        borderRadius: 12,
    },
    photoOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    photoOverlayText: {
        fontSize: 24,
        fontWeight: '700',
        color: '#fff',
    },
    // Individual Reviews
    reviewsList: {
        gap: 24,
    },
    reviewCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        padding: 16,
    },
    reviewHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginTop: 12,
        marginBottom: 12,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
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
        fontSize: 15,
        fontWeight: '600',
        color: theme.colors.text.primary,
        marginBottom: 4,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    reviewDate: {
        fontSize: 13,
        color: theme.colors.text.secondary,
    },
    separator: {
        fontSize: 13,
        color: theme.colors.text.tertiary,
    },
    verifiedBadge: {
        fontSize: 13,
        color: theme.colors.verified,
        fontWeight: '500',
    },
    menuButton: {
        padding: 4,
    },
    reviewPhotos: {
        marginBottom: 12,
        marginHorizontal: -16,
        paddingHorizontal: 16,
    },
    reviewPhoto: {
        width: 80,
        height: 80,
        borderRadius: 8,
        marginRight: 8,
    },
    reviewText: {
        fontSize: 15,
        color: theme.colors.text.primary,
        lineHeight: 22,
        marginBottom: 12,
    },
    responseContainer: {
        backgroundColor: theme.colors.background,
        padding: 12,
        borderLeftWidth: 3,
        borderLeftColor: theme.colors.primary,
        borderRadius: 8,
        marginBottom: 12,
    },
    responseTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.text.primary,
        marginBottom: 4,
    },
    responseDate: {
        fontSize: 12,
        color: theme.colors.text.secondary,
        marginBottom: 8,
    },
    responseText: {
        fontSize: 14,
        color: theme.colors.text.secondary,
        lineHeight: 20,
    },
    translateButton: {
        alignSelf: 'flex-start',
    },
    translateText: {
        fontSize: 14,
        color: theme.colors.primary,
        fontWeight: '500',
    },
    showMoreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        marginTop: 16,
    },
    showMoreText: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.colors.primary,
    },
});
