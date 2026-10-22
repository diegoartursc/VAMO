/**
 * VAMO Mobile — "Reviews" recebidas pelo roteirista.
 * Mini-dashboard: resumo (média, total, melhor avaliado, roteiros avaliados),
 * distribuição de estrelas, lista de avaliações com nota/comentário/fotos.
 * Dados reais via GET /api/itineraries/dashboard/reviews (auth por token).
 */
import React, { useState, useCallback, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
    StatusBar, ActivityIndicator, RefreshControl, useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { safeBack } from '../src/utils/navigation';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../src/theme/theme';
import { useAuth } from '../src/contexts/AuthContext';
import { useMediaLightbox } from '../src/components/common/MediaLightbox';
import { CreatorAvatar } from '../src/components/common/CreatorAvatar';
import { getCreatorReviewsDashboard, describeDashboardError } from '../src/services/api';
import { CreatorSubHeader } from '../src/features/creator/dashboard/CreatorDashboardHeader';
import { CreatorMetricCard, CreatorMetric } from '../src/features/creator/dashboard/CreatorMetricCard';
import { CreatorEmptyState } from '../src/features/creator/dashboard/CreatorEmptyState';
import {
    CreatorReviewsDashboard, CreatorReview, DASHBOARD_MAX_WIDTH, WIDE_BREAKPOINT,
} from '../src/features/creator/dashboard/types';

function formatDate(iso: string): string {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
}

function Stars({ rating, size = 13 }: { rating: number; size?: number }) {
    return (
        <View style={{ flexDirection: 'row', gap: 1 }}>
            {[1, 2, 3, 4, 5].map(i => (
                <Ionicons key={i} name={i <= Math.round(rating) ? 'star' : 'star-outline'} size={size} color="#F59E0B" />
            ))}
        </View>
    );
}

function DistributionBar({ star, count, total }: { star: number; count: number; total: number }) {
    const pct = total > 0 ? (count / total) * 100 : 0;
    return (
        <View style={s.distRow}>
            <Text style={s.distStar}>{star}★</Text>
            <View style={s.distTrack}>
                <View style={[s.distFill, { width: `${pct}%` }]} />
            </View>
            <Text style={s.distCount}>{count}</Text>
        </View>
    );
}

function ReviewCard({ review, onOpenPhoto }: { review: CreatorReview; onOpenPhoto: (photos: string[], i: number) => void }) {
    const name = review.user.name || 'Traveler';
    return (
        <View style={s.reviewCard}>
            <View style={s.reviewHead}>
                <CreatorAvatar avatar={review.user.avatar} name={name} size={40} style={s.reviewAvatarImg} />
                <View style={{ flex: 1 }}>
                    <Text style={s.reviewName}>{name}</Text>
                    <View style={s.reviewSub}>
                        <Stars rating={review.rating} />
                        <Text style={s.dot}>·</Text>
                        <Text style={s.reviewDate}>{formatDate(review.date)}</Text>
                    </View>
                </View>
            </View>
            <Text style={s.reviewItinerary} numberOfLines={1}>
                <Ionicons name="map-outline" size={12} color={theme.colors.text.tertiary} /> {review.itineraryTitle}
            </Text>
            {!!review.comment && <Text style={s.reviewComment}>{review.comment}</Text>}
            {review.photos.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingTop: 4 }}>
                    {review.photos.map((p, i) => (
                        <TouchableOpacity key={i} onPress={() => onOpenPhoto(review.photos, i)} activeOpacity={0.85}>
                            <Image source={{ uri: p }} style={s.reviewPhoto} />
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}
            {review.response && (
                <View style={s.responseBox}>
                    <Text style={s.responseLabel}>Your answer</Text>
                    <Text style={s.responseText}>{review.response.text}</Text>
                </View>
            )}
        </View>
    );
}

export default function CreatorReviewsScreen() {
    const router = useRouter();
    const { accessToken, isAuthenticated, isLoading: authLoading } = useAuth();
    const { width } = useWindowDimensions();
    const isWide = width >= WIDE_BREAKPOINT;
    const lightbox = useMediaLightbox();
    const openLightbox = lightbox.open;

    const [data, setData] = useState<CreatorReviewsDashboard | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async (isRefresh = false) => {
        if (authLoading) return;
        if (!isAuthenticated || !accessToken) { setLoading(false); setRefreshing(false); return; }
        if (!isRefresh) setLoading(true);
        setError(null);
        try {
            setData(await getCreatorReviewsDashboard(accessToken));
        } catch (e: any) {
            setError(describeDashboardError(e));
        } finally {
            setLoading(false); setRefreshing(false);
        }
    }, [accessToken, authLoading, isAuthenticated]);

    useEffect(() => { fetchData(); }, [fetchData]);
    const onRefresh = useCallback(() => { setRefreshing(true); fetchData(true); }, [fetchData]);

    const onOpenPhoto = useCallback((photos: string[], i: number) => {
        openLightbox(photos.map(url => ({ type: 'image' as const, url })), i);
    }, [openLightbox]);

    if (authLoading || loading) {
        return (
            <View style={s.loading}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={s.loadingText}>Loading reviews...</Text>
            </View>
        );
    }

    const header = (
        <CreatorSubHeader
            title="Reviews"
            subtitle="See ratings, comments and performance by itinerary."
            onBack={() => safeBack(router, '/created-itineraries')}
        />
    );

    if (!isAuthenticated) {
        return (
            <View style={s.container}>
                {header}
                <View style={s.center}>
                    <CreatorEmptyState icon="lock-closed-outline" title="Sign-in required" text="Sign in to see your reviews." ctaLabel="Sign in" onCta={() => router.push({ pathname: '/login' as any, params: { next: '/creator-reviews' } })} />
                </View>
            </View>
        );
    }
    if (error) {
        return (
            <View style={s.container}>
                {header}
                <View style={s.center}>
                    <CreatorEmptyState icon="cloud-offline-outline" title="Couldn't load" text={error} ctaLabel="Try again" ctaIcon="refresh-outline" onCta={() => fetchData()} />
                </View>
            </View>
        );
    }

    const d = data!;
    const hasReviews = d.totalReviews > 0;

    const metrics: CreatorMetric[] = [
        { key: 'avg', icon: 'star-outline', tone: theme.colors.warning, value: hasReviews ? d.averageRating.toFixed(1) : '—', label: 'Average', hint: 'Overall rating', empty: !hasReviews, emptyHint: 'No rating yet' },
        { key: 'total', icon: 'chatbubble-ellipses-outline', tone: theme.colors.secondary, value: String(d.totalReviews), label: 'Reviews', hint: 'Total received', empty: !hasReviews, emptyHint: 'None yet' },
        { key: 'rated', icon: 'albums-outline', tone: theme.colors.primary, value: String(d.ratedItinerariesCount), label: 'Reviewed itineraries', hint: 'With at least 1 rating', empty: d.ratedItinerariesCount === 0, emptyHint: '—' },
        { key: 'top', icon: 'ribbon-outline', tone: theme.colors.success, value: d.topItinerary ? d.topItinerary.averageRating.toFixed(1) : '—', label: 'Top rated', hint: d.topItinerary ? d.topItinerary.title : 'No standout yet', empty: !d.topItinerary, emptyHint: 'No standout yet', onPress: d.topItinerary ? () => router.push(`/creator-itinerary/${d.topItinerary!.itineraryId}`) : undefined },
    ];

    return (
        <View style={s.container}>
            <StatusBar barStyle="dark-content" />
            {header}
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={s.scroll}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
            >
                <View style={s.maxWidth}>
                    {!hasReviews ? (
                        <CreatorEmptyState
                            icon="star-outline"
                            title="No reviews yet"
                            text="When your itineraries are reviewed, the comments and ratings will show up here."
                            ctaLabel="View published itineraries"
                            ctaIcon="albums-outline"
                            onCta={() => router.push('/created-itineraries')}
                        />
                    ) : (
                        <>
                            <Text style={s.sectionLabel}>Summary</Text>
                            <View style={s.metricsGrid}>
                                {metrics.map(m => (
                                    <CreatorMetricCard key={m.key} metric={m} style={isWide ? s.metricWide : s.metricNarrow} />
                                ))}
                            </View>

                            <Text style={s.sectionLabel}>Star distribution</Text>
                            <View style={s.distCard}>
                                {[5, 4, 3, 2, 1].map(star => (
                                    <DistributionBar key={star} star={star} count={d.ratingDistribution[String(star) as '5'] ?? 0} total={d.totalReviews} />
                                ))}
                            </View>

                            <Text style={s.sectionLabel}>Reviews received</Text>
                            {d.recentReviews.map(r => (
                                <ReviewCard key={r.id} review={r} onOpenPhoto={onOpenPhoto} />
                            ))}
                        </>
                    )}
                    <View style={{ height: 40 }} />
                </View>
            </ScrollView>
            {lightbox.element}
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    loading: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, backgroundColor: theme.colors.background },
    loadingText: { fontSize: 14, color: theme.colors.text.secondary },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scroll: { paddingHorizontal: 16, paddingTop: 6 },
    maxWidth: { width: '100%', maxWidth: DASHBOARD_MAX_WIDTH, alignSelf: 'center' },

    sectionLabel: { fontSize: 12, fontWeight: '800', color: theme.colors.text.tertiary, textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 18, marginBottom: 10 },

    metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    metricWide: { flexGrow: 1, flexBasis: '22%', minWidth: 190 },
    metricNarrow: { flexGrow: 1, flexBasis: '46%', minWidth: 150 },

    distCard: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, padding: 14, gap: 9 },
    distRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    distStar: { fontSize: 12, fontWeight: '700', color: theme.colors.text.secondary, width: 24 },
    distTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: theme.colors.surfaceLight, overflow: 'hidden' },
    distFill: { height: '100%', borderRadius: 4, backgroundColor: '#F59E0B' },
    distCount: { fontSize: 12, fontWeight: '700', color: theme.colors.text.tertiary, width: 28, textAlign: 'right' },

    reviewCard: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, padding: 14, marginBottom: 10, gap: 8 },
    reviewHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    reviewAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: theme.colors.primary + '15', alignItems: 'center', justifyContent: 'center' },
    reviewAvatarImg: { width: 38, height: 38, borderRadius: 19, backgroundColor: theme.colors.surfaceLight },
    reviewAvatarText: { fontSize: 15, fontWeight: '800', color: theme.colors.primary },
    reviewName: { fontSize: 14, fontWeight: '700', color: theme.colors.text.primary },
    reviewSub: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
    reviewDate: { fontSize: 12, color: theme.colors.text.tertiary },
    dot: { fontSize: 12, color: theme.colors.text.tertiary },
    reviewItinerary: { fontSize: 12, color: theme.colors.text.tertiary },
    reviewComment: { fontSize: 13.5, color: theme.colors.text.secondary, lineHeight: 20 },
    reviewPhoto: { width: 72, height: 72, borderRadius: 10, backgroundColor: theme.colors.surfaceLight },
    responseBox: { backgroundColor: theme.colors.surfaceLight, borderRadius: 10, padding: 10, marginTop: 2 },
    responseLabel: { fontSize: 11, fontWeight: '800', color: theme.colors.primary, marginBottom: 3 },
    responseText: { fontSize: 13, color: theme.colors.text.secondary, lineHeight: 18 },
});
