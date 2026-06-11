import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Platform,
    StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../src/theme/theme';
import { Icon } from '../src/components/common/Icons';
import { ErrorState } from '../src/components/common/ErrorState';
import { getMyReviews } from '../src/services/api';
import { useAuth } from '../src/contexts/AuthContext';

type MyReview = Awaited<ReturnType<typeof getMyReviews>>['reviews'][number];

export default function MyReviewsScreen() {
    const router = useRouter();
    const { accessToken } = useAuth();
    const [reviews, setReviews] = useState<MyReview[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    const load = useCallback(() => {
        setLoading(true);
        setLoadError(null);
        getMyReviews(accessToken)
            .then((data) => setReviews(data.reviews))
            .catch((err: unknown) => {
                setReviews([]);
                setLoadError(err instanceof Error
                    ? err.message
                    : 'Não foi possível carregar suas avaliações.');
            })
            .finally(() => setLoading(false));
    }, [accessToken]);

    useEffect(() => { load(); }, [load]);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Icon name="chevron-left" size={24} color={theme.colors.text.primary} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>Minhas Avaliações</Text>
                    <Text style={styles.headerSubtitle}>
                        {reviews.length} avaliação{reviews.length !== 1 ? 'ões' : ''} publicada{reviews.length !== 1 ? 's' : ''}
                    </Text>
                </View>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={styles.emptyState}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text style={styles.emptyText}>Carregando suas avaliações...</Text>
                </View>
            ) : loadError ? (
                <ErrorState message={loadError} onRetry={load} />
            ) : reviews.length === 0 ? (
                <View style={styles.emptyState}>
                    <Icon name="star" size={48} color={theme.colors.text.tertiary} />
                    <Text style={styles.emptyTitle}>Nenhuma avaliação ainda</Text>
                    <Text style={styles.emptyText}>
                        Após comprar e vivenciar um roteiro, você poderá avaliá-lo aqui.
                    </Text>
                </View>
            ) : (
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {reviews.map((review) => (
                        <ReviewCard key={review.id} review={review} />
                    ))}
                    <View style={{ height: 40 }} />
                </ScrollView>
            )}
        </View>
    );
}

function ReviewCard({ review }: { review: MyReview }) {
    const router = useRouter();
    const itinerary = review.itinerary;

    const renderStars = (rating: number) => (
        <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => {
                const filled = star <= rating;
                // `fill` é obrigatório aqui: o Icon default é fill='none', então
                // estrela "cheia" sem fill + strokeWidth=0 renderiza vazia.
                // (Mesmo fix já aplicado em PremiumReviewsSection.)
                return (
                    <Icon
                        key={star}
                        name="star"
                        size={14}
                        color={filled ? '#FFD700' : theme.colors.borderLight}
                        fill={filled ? '#FFD700' : 'transparent'}
                        strokeWidth={filled ? 0 : 1.5}
                    />
                );
            })}
        </View>
    );

    return (
        <TouchableOpacity
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => {
                if (itinerary) {
                    router.push(`/itinerary/${itinerary.id}`);
                }
            }}
        >
            {/* Itinerary info */}
            {itinerary && (
                <View style={styles.cardItinerary}>
                    {itinerary.image ? (
                        <Image source={{ uri: itinerary.image }} style={styles.cardItineraryImage} resizeMode="cover" />
                    ) : (
                        <View style={styles.cardItineraryImage} />
                    )}
                    <View style={styles.cardItineraryInfo}>
                        <Text style={styles.cardItineraryTitle} numberOfLines={1}>
                            {itinerary.title}
                        </Text>
                        <Text style={styles.cardItineraryDest}>
                            📍 {itinerary.destination}, {itinerary.country}
                        </Text>
                    </View>
                    <Icon name="chevron-right" size={18} color={theme.colors.text.tertiary} />
                </View>
            )}

            {/* Review content */}
            <View style={styles.cardReview}>
                <View style={styles.cardReviewHeader}>
                    {renderStars(review.rating)}
                    <Text style={styles.cardDate}>{review.date}</Text>
                </View>
                <Text style={styles.cardText} numberOfLines={4}>{review.comment}</Text>

                {/* Photos */}
                {review.photos && review.photos.length > 0 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cardPhotos}>
                        {review.photos.map((photo, i) => (
                            <Image key={i} source={{ uri: photo }} style={styles.cardPhoto} resizeMode="cover" />
                        ))}
                    </ScrollView>
                )}

                {/* Verified badge */}
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
        paddingTop: Platform.OS === 'ios' ? 56 : (StatusBar.currentHeight ?? 24) + 8,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: theme.colors.text.primary,
    },
    headerSubtitle: {
        fontSize: 12,
        color: theme.colors.text.secondary,
        marginTop: 2,
    },
    scrollContent: {
        padding: 20,
    },

    // Empty
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginTop: 16,
    },
    emptyText: {
        fontSize: 14,
        color: theme.colors.text.secondary,
        marginTop: 8,
        textAlign: 'center',
        lineHeight: 20,
    },

    // Review card
    card: {
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        marginBottom: 16,
        overflow: 'hidden',
    },
    cardItinerary: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        gap: 10,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
        backgroundColor: theme.colors.surfaceLight,
    },
    cardItineraryImage: {
        width: 44,
        height: 44,
        borderRadius: 8,
        backgroundColor: theme.colors.borderLight,
    },
    cardItineraryInfo: {
        flex: 1,
    },
    cardItineraryTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    cardItineraryDest: {
        fontSize: 11,
        color: theme.colors.text.secondary,
        marginTop: 2,
    },

    cardReview: {
        padding: 16,
    },
    cardReviewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    starsRow: {
        flexDirection: 'row',
        gap: 3,
    },
    cardDate: {
        fontSize: 12,
        color: theme.colors.text.tertiary,
    },
    cardText: {
        fontSize: 14,
        color: theme.colors.text.primary,
        lineHeight: 20,
        marginBottom: 10,
    },
    cardPhotos: {
        marginBottom: 10,
    },
    cardPhoto: {
        width: 70,
        height: 70,
        borderRadius: 8,
        marginRight: 8,
    },
    verifiedRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 4,
    },
    verifiedText: {
        fontSize: 12,
        color: theme.colors.verified || theme.colors.primary,
        fontWeight: '500',
    },
    responseBox: {
        backgroundColor: theme.colors.background,
        borderLeftWidth: 3,
        borderLeftColor: theme.colors.primary,
        borderRadius: 8,
        padding: 12,
        marginTop: 12,
    },
    responseTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.text.primary,
        marginBottom: 4,
    },
    responseText: {
        fontSize: 13,
        color: theme.colors.text.secondary,
        lineHeight: 18,
    },
});
