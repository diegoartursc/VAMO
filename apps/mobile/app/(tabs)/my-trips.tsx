import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Image,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../src/theme/theme';
import { getMyTrips } from '../../src/services/api';
import { Icon } from '../../src/components/common/Icons';
import { CreatorAvatar } from '../../src/components/common/CreatorAvatar';
import { useAuth } from '../../src/contexts/AuthContext';

const PLACEHOLDER_IMAGE =
    'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=900&auto=format&fit=crop';

interface PurchasedItineraryItem {
    id: string;
    title: string;
    destination: string;
    country: string;
    image: string;
    purchaseDate: string;
    creatorName: string;
    creatorAvatar: string;
    price: number;
    currency: string;
    duration?: number;
}

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return 'Data indisponível';
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

function normalizePurchasedItineraries(value: unknown): PurchasedItineraryItem[] {
    if (!Array.isArray(value)) return [];

    const seen = new Set<string>();
    return value.flatMap((item: any) => {
        const id = typeof item?.id === 'string' ? item.id.trim() : '';
        if (!id || seen.has(id)) return [];
        seen.add(id);

        return [{
            id,
            title: item?.title || 'Roteiro digital',
            destination: item?.destination || 'Destino a confirmar',
            country: item?.country || '',
            image: typeof item?.image === 'string' && item.image.trim() ? item.image : PLACEHOLDER_IMAGE,
            purchaseDate: item?.purchaseDate || new Date().toISOString(),
            creatorName: item?.creatorName || 'Criador VAMO',
            creatorAvatar: item?.creatorAvatar || '',
            price: Number.isFinite(Number(item?.price)) ? Number(item.price) : 0,
            currency: item?.currency || 'AUD',
            duration: Number.isFinite(Number(item?.duration)) ? Number(item.duration) : undefined,
        }];
    });
}

// ─── Login Prompt ─────────────────────────────────────────
function LoginPrompt() {
    const router = useRouter();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(24)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
            Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 55, friction: 10 }),
        ]).start();
    }, []);

    return (
        <Animated.View style={[styles.emptyState, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <LinearGradient
                colors={[theme.colors.primary + '18', theme.colors.primary + '08']}
                style={styles.emptyIconCircle}
            >
                <Icon name="book-open" size={40} color={theme.colors.primary} />
            </LinearGradient>

            <Text style={styles.emptyTitle}>Seus roteiros te esperam</Text>
            <Text style={styles.emptySubtitle}>
                Faça login para ver todos os roteiros que você adquiriu e acessar o conteúdo completo.
            </Text>

            <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => router.push('/login')}
                activeOpacity={0.85}
            >
                <LinearGradient
                    colors={theme.colors.gradients.action as unknown as [string, string]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.emptyButtonGradient}
                >
                    <Icon name="circle-user" size={16} color="#fff" />
                    <Text style={styles.emptyButtonText}>Entrar na conta</Text>
                </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/register')} style={{ marginBottom: 32 }}>
                <Text style={{ fontSize: 14, color: theme.colors.primary, fontWeight: '600', textAlign: 'center' }}>
                    Criar conta grátis →
                </Text>
            </TouchableOpacity>

            <View style={styles.emptyHints}>
                {[
                    { icon: 'verified', label: 'Roteiros verificados' },
                    { icon: 'shield-check', label: 'Compra segura' },
                    { icon: 'star', label: 'Avaliações reais' },
                ].map((hint) => (
                    <View key={hint.label} style={styles.emptyHint}>
                        <Icon name={hint.icon as any} size={14} color={theme.colors.primary} />
                        <Text style={styles.emptyHintText}>{hint.label}</Text>
                    </View>
                ))}
            </View>
        </Animated.View>
    );
}

const { width } = Dimensions.get('window');

// ─── Skeleton Loader ────────────────────────────────────

function SkeletonCard() {
    const shimmer = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
                Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.75] });

    return (
        <Animated.View style={[styles.skeletonCard, { opacity }]}>
            <View style={styles.skeletonImage} />
            <View style={styles.skeletonBody}>
                <View style={styles.skeletonBadge} />
                <View style={styles.skeletonTitle} />
                <View style={styles.skeletonTitleShort} />
                <View style={styles.skeletonFooter}>
                    <View style={styles.skeletonFooterLeft} />
                    <View style={styles.skeletonFooterRight} />
                </View>
            </View>
        </Animated.View>
    );
}

// ─── Itinerary Card ─────────────────────────────────────

function ItineraryCard({ itin, index }: { itin: PurchasedItineraryItem; index: number }) {
    const router = useRouter();
    const slideAnim = useRef(new Animated.Value(30)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const [imageFailed, setImageFailed] = useState(false);

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                delay: index * 80,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                delay: index * 80,
                useNativeDriver: true,
                tension: 60,
                friction: 9,
            }),
        ]).start();
    }, []);

    const onPressIn = () =>
        Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, tension: 100, friction: 6 }).start();
    const onPressOut = () =>
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 100, friction: 6 }).start();

    const priceFormatted = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: itin.currency ?? 'AUD',
    }).format(itin.price);
    const destinationLabel = [itin.destination, itin.country].filter(Boolean).join(', ') || 'Destino a confirmar';
    const durationLabel = itin.duration && itin.duration > 0
        ? `${itin.duration} ${itin.duration === 1 ? 'dia' : 'dias'}`
        : null;

    return (
        <Animated.View
            style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
            }}
        >
            <TouchableOpacity
                activeOpacity={1}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                onPress={() => router.push(`/purchased-itinerary/${itin.id}`)}
                style={styles.card}
            >
                {/* Hero Image */}
                <View style={styles.cardImageContainer}>
                    <Image
                        source={{ uri: imageFailed ? PLACEHOLDER_IMAGE : itin.image }}
                        style={styles.cardImage}
                        onError={() => setImageFailed(true)}
                    />
                    <LinearGradient
                        colors={['transparent', 'rgba(26,50,99,0.82)']}
                        style={styles.cardImageOverlay}
                    />

                    {/* Top row badges */}
                    <View style={styles.cardTopRow}>
                        <View style={styles.destinationBadge}>
                            <Icon name="location" size={11} color="#fff" />
                            <Text style={styles.destinationText} numberOfLines={1}>
                                {destinationLabel}
                            </Text>
                        </View>
                        <View style={styles.priceBadge}>
                            <Text style={styles.priceText}>{priceFormatted}</Text>
                        </View>
                    </View>

                    {/* Title over image */}
                    <View style={styles.cardImageBottom}>
                        <Text style={styles.cardTitle} numberOfLines={2}>
                            {itin.title}
                        </Text>
                    </View>
                </View>

                {/* Card Footer */}
                <View style={styles.cardFooter}>
                    <View style={styles.creatorRow}>
                        <CreatorAvatar avatar={itin.creatorAvatar} name={itin.creatorName} size={32} style={styles.creatorAvatar} />
                        <Text style={styles.creatorName} numberOfLines={1}>
                            {itin.creatorName}
                        </Text>
                    </View>

                    <View style={styles.footerRight}>
                        {durationLabel ? (
                            <>
                                <Icon name="clock" size={12} color={theme.colors.text.tertiary} />
                                <Text style={styles.purchaseDate}>{durationLabel}</Text>
                            </>
                        ) : null}
                        <Icon name="calendar" size={12} color={theme.colors.text.tertiary} />
                        <Text style={styles.purchaseDate}>
                            {formatDate(itin.purchaseDate)}
                        </Text>
                        <View style={styles.arrowCircle}>
                            <Icon name="chevron-right" size={14} color={theme.colors.primary} />
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
    const router = useRouter();
    return (
        <View style={styles.emptyState}>
            <LinearGradient
                colors={[theme.colors.error + '18', theme.colors.error + '08']}
                style={styles.emptyIconCircle}
            >
                <Icon name="refresh" size={38} color={theme.colors.error} />
            </LinearGradient>

            <Text style={styles.emptyTitle}>Não foi possível carregar</Text>
            <Text style={styles.emptySubtitle}>{message}</Text>

            <TouchableOpacity
                style={styles.emptyButton}
                onPress={onRetry}
                activeOpacity={0.85}
            >
                <LinearGradient
                    colors={theme.colors.gradients.action as unknown as [string, string]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.emptyButtonGradient}
                >
                    <Icon name="refresh" size={16} color="#fff" />
                    <Text style={styles.emptyButtonText}>Tentar novamente</Text>
                </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/(tabs)/index')} style={{ marginBottom: 32 }}>
                <Text style={{ fontSize: 14, color: theme.colors.primary, fontWeight: '600', textAlign: 'center' }}>
                    Explorar roteiros
                </Text>
            </TouchableOpacity>
        </View>
    );
}

// ─── Empty State ─────────────────────────────────────────

function EmptyState() {
    const router = useRouter();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(24)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
            Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 55, friction: 10 }),
        ]).start();
    }, []);

    return (
        <Animated.View style={[styles.emptyState, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <LinearGradient
                colors={[theme.colors.primary + '18', theme.colors.primary + '08']}
                style={styles.emptyIconCircle}
            >
                <Icon name="book-open" size={40} color={theme.colors.primary} />
            </LinearGradient>

            <Text style={styles.emptyTitle}>Nenhum roteiro ainda</Text>
            <Text style={styles.emptySubtitle}>
                Adquira roteiros de viajantes experientes e acesse todos os detalhes da sua aventura aqui.
            </Text>

            <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => router.push('/(tabs)/index')}
                activeOpacity={0.85}
            >
                <LinearGradient
                    colors={theme.colors.gradients.action as unknown as [string, string]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.emptyButtonGradient}
                >
                    <Icon name="compass" size={16} color="#fff" />
                    <Text style={styles.emptyButtonText}>Explorar roteiros</Text>
                </LinearGradient>
            </TouchableOpacity>

            <View style={styles.emptyHints}>
                {[
                    { icon: 'verified', label: 'Roteiros verificados' },
                    { icon: 'shield-check', label: 'Compra segura' },
                    { icon: 'star', label: 'Avaliações reais' },
                ].map((hint) => (
                    <View key={hint.label} style={styles.emptyHint}>
                        <Icon name={hint.icon as any} size={14} color={theme.colors.primary} />
                        <Text style={styles.emptyHintText}>{hint.label}</Text>
                    </View>
                ))}
            </View>
        </Animated.View>
    );
}

// ─── Main Screen ─────────────────────────────────────────

export default function MyTripsScreen() {
    const { accessToken, isAuthenticated, isLoading: authLoading } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [itineraries, setItineraries] = useState<PurchasedItineraryItem[]>([]);
    const headerAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(headerAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    }, []);

    const loadPurchasedItineraries = useCallback((isRefresh = false) => {
        if (authLoading) return;
        if (!isAuthenticated) {
            setItineraries([]);
            setLoadError(null);
            setLoading(false);
            setRefreshing(false);
            return;
        }
        let mounted = true;
        if (!isRefresh) setLoading(true);
        setLoadError(null);
        getMyTrips(accessToken)
            .then((result) => {
                if (mounted) {
                    setItineraries(normalizePurchasedItineraries(result.purchasedItineraries));
                    setLoading(false);
                    setRefreshing(false);
                }
            })
            .catch((error) => {
                if (!mounted) return;
                console.warn('Error loading purchased itineraries:', error);
                setItineraries([]);
                setLoadError('Suas compras não foram carregadas. Verifique a conexão e tente novamente.');
                setLoading(false);
                setRefreshing(false);
            });
        return () => { mounted = false; };
    }, [accessToken, isAuthenticated, authLoading]);

    useEffect(() => {
        const cleanup = loadPurchasedItineraries(false);
        return cleanup;
    }, [loadPurchasedItineraries]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadPurchasedItineraries(true);
    }, [loadPurchasedItineraries]);

    const showLoading = authLoading || loading;

    return (
        <View style={styles.container}>
            {/* ── Header ── */}
            <Animated.View style={{ opacity: headerAnim }}>
                <LinearGradient
                    colors={theme.colors.gradients.aurora as unknown as [string, string, string]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.header}
                >
                    <View style={styles.headerTop}>
                        <View>
                            <Text style={styles.headerLabel}>BIBLIOTECA DIGITAL</Text>
                            <Text style={styles.headerTitle}>Meus Roteiros</Text>
                        </View>
                        <View style={styles.headerIconCircle}>
                            <Icon name="book-open" size={22} color="#fff" />
                        </View>
                    </View>

                </LinearGradient>
            </Animated.View>

            {/* ── Content ── */}
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={theme.colors.primary}
                    />
                }
            >
                {showLoading ? (
                    <>
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                    </>
                ) : !isAuthenticated ? (
                    <LoginPrompt />
                ) : loadError ? (
                    <ErrorState message={loadError} onRetry={() => loadPurchasedItineraries(false)} />
                ) : itineraries.length === 0 ? (
                    <EmptyState />
                ) : (
                    <>
                        <Text style={styles.sectionLabel}>
                            {itineraries.length} {itineraries.length === 1 ? 'roteiro adquirido' : 'roteiros adquiridos'}
                        </Text>
                        {itineraries.map((itin, index) => (
                            <ItineraryCard key={itin.id} itin={itin} index={index} />
                        ))}
                    </>
                )}
                <View style={{ height: 48 }} />
            </ScrollView>
        </View>
    );
}

// ─── Styles ──────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.surface,
    },

    // Header
    header: {
        paddingTop: 56,
        paddingBottom: 20,
        paddingHorizontal: 24,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    headerLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.6)',
        letterSpacing: 1.2,
        marginBottom: 4,
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: -0.5,
    },
    headerIconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },


    // Scroll
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.text.tertiary,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 14,
    },

    // Card
    card: {
        backgroundColor: theme.colors.background,
        borderRadius: 20,
        marginBottom: 16,
        overflow: 'hidden',
        ...theme.shadows.medium,
    },
    cardImageContainer: {
        position: 'relative',
        height: 190,
    },
    cardImage: {
        width: '100%',
        height: '100%',
    },
    cardImageOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    cardTopRow: {
        position: 'absolute',
        top: 12,
        left: 12,
        right: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    destinationBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: 'rgba(0,0,0,0.45)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 100,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    destinationText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#fff',
        letterSpacing: 0.2,
    },
    priceBadge: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 100,
    },
    priceText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#fff',
    },
    cardImageBottom: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 14,
        paddingBottom: 14,
        paddingTop: 32,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
        lineHeight: 22,
    },

    // Footer
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    creatorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    creatorAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: theme.colors.primary + '18',
        alignItems: 'center',
        justifyContent: 'center',
    },
    creatorName: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.text.primary,
        flex: 1,
    },
    footerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    purchaseDate: {
        fontSize: 11,
        color: theme.colors.text.tertiary,
        marginRight: 6,
    },
    arrowCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: theme.colors.primary + '15',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Skeleton
    skeletonCard: {
        backgroundColor: theme.colors.background,
        borderRadius: 20,
        marginBottom: 16,
        overflow: 'hidden',
    },
    skeletonImage: {
        width: '100%',
        height: 190,
        backgroundColor: theme.colors.surfaceLight,
    },
    skeletonBody: {
        padding: 14,
        gap: 8,
    },
    skeletonBadge: {
        width: 100,
        height: 20,
        borderRadius: 100,
        backgroundColor: theme.colors.surfaceLight,
    },
    skeletonTitle: {
        width: '90%',
        height: 16,
        borderRadius: 8,
        backgroundColor: theme.colors.surfaceLight,
    },
    skeletonTitleShort: {
        width: '60%',
        height: 16,
        borderRadius: 8,
        backgroundColor: theme.colors.surfaceLight,
    },
    skeletonFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 4,
    },
    skeletonFooterLeft: {
        width: 100,
        height: 12,
        borderRadius: 6,
        backgroundColor: theme.colors.surfaceLight,
    },
    skeletonFooterRight: {
        width: 80,
        height: 12,
        borderRadius: 6,
        backgroundColor: theme.colors.surfaceLight,
    },

    // Empty state
    emptyState: {
        alignItems: 'center',
        paddingTop: 48,
        paddingBottom: 32,
        paddingHorizontal: 32,
    },
    emptyIconCircle: {
        width: 88,
        height: 88,
        borderRadius: 44,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: theme.colors.text.primary,
        marginBottom: 10,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 14,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 28,
    },
    emptyButton: {
        borderRadius: 100,
        overflow: 'hidden',
        ...theme.shadows.button,
        marginBottom: 32,
    },
    emptyButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 28,
        paddingVertical: 14,
    },
    emptyButtonText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#fff',
    },
    emptyHints: {
        flexDirection: 'row',
        gap: 16,
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    emptyHint: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    emptyHintText: {
        fontSize: 12,
        color: theme.colors.text.tertiary,
        fontWeight: '500',
    },
});
