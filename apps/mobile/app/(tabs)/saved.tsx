/**
 * VAMO Mobile — Aba "Favoritos"
 * Busca os roteiros favoritados na API real pelo ID salvo em AsyncStorage.
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Animated,
    Image,
    Platform,
    StatusBar,
    Dimensions,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../src/theme/theme';
import { Icon } from '../../src/components/common/Icons';
import { useFavorites } from '../../src/hooks/useFavorites';
import { haptics } from '../../src/services/haptics';
import { ApiError, getItineraryByIdStrict } from '../../src/services/api';
import { formatMoney, getRouteRatingDisplay } from '@vamo/shared/itinerary';
import { confirm } from '../../src/utils/confirm';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// ─── Tipo mínimo que usamos para exibir o card ─────────────
interface FavItem {
    id: string;
    title: string;
    destination: string;
    country: string;
    price: number;
    currency?: string;
    duration: number;
    rating: number;
    reviewCount: number;
    images: string[];
    creator?: { name: string };
}

type FavoriteFetchResult =
    | { status: 'available'; item: FavItem }
    | { status: 'unavailable' };

// ─── Busca um roteiro pelo id ───────────────────────────────
async function fetchItinerary(id: string): Promise<FavoriteFetchResult> {
    try {
        const data = await getItineraryByIdStrict(id);
        return { status: 'available', item: { ...data, rating: data.rating ?? 0 } };
    } catch (error) {
        // 404 = roteiro removido/despublicado (estado esperado do card);
        // rede/5xx continuam estourando para o loadError da tela.
        if (error instanceof ApiError && error.status === 404) return { status: 'unavailable' };
        throw error;
    }
}

// ─── Main screen ───────────────────────────────────────────
export default function SavedScreen() {
    const router = useRouter();
    const { favorites, removeFavorite, isLoading: favsLoading } = useFavorites();

    const [items, setItems] = useState<FavItem[]>([]);
    const [unavailableCount, setUnavailableCount] = useState(0);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Header entrance animation
    const headerAnim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.timing(headerAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }, []);

    // Carrega dados reais dos roteiros favoritados
    const loadItems = useCallback(async (isRefresh = false) => {
        if (!isRefresh) setLoading(true);
        setLoadError(null);
        if (favorites.length === 0) {
            setItems([]);
            setUnavailableCount(0);
            setLoading(false);
            setRefreshing(false);
            return;
        }
        try {
            // Busca em paralelo todos os IDs
            const results = await Promise.all(favorites.map(fetchItinerary));
            const loadedItems = results
                .filter((r): r is { status: 'available'; item: FavItem } => r.status === 'available')
                .map((r) => r.item);
            setItems(loadedItems);
            setUnavailableCount(favorites.length - loadedItems.length);
        } catch {
            setItems([]);
            setUnavailableCount(0);
            setLoadError('Não foi possível carregar seus favoritos agora.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [favorites]);

    // Re-busca sempre que favorites mudar (add/remove) ou na montagem
    useEffect(() => {
        if (!favsLoading) loadItems();
    }, [favorites, favsLoading]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadItems(true);
    }, [loadItems]);

    const handleRemove = async (item: FavItem) => {
        haptics.medium();
        const ok = await confirm({
            title: 'Remover dos favoritos?',
            message: `"${item.title}" será removido da sua lista.`,
            confirmText: 'Remover',
            cancelText: 'Cancelar',
            action: 'removeFavorite',
        });
        if (!ok) return;
        haptics.light();
        removeFavorite(item.id);
    };

    const isEmpty = !loading && favorites.length === 0;
    const onlyUnavailable = !loading && favorites.length > 0 && items.length === 0;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* ══════════ HEADER ══════════ */}
            <LinearGradient
                colors={theme.colors.gradients.aurora as unknown as [string, string, string]}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <Animated.View style={[
                    styles.headerContent,
                    {
                        opacity: headerAnim,
                        transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) }],
                    },
                ]}>
                    <View style={styles.headerRow}>
                        <View>
                            <Text style={styles.headerLabel}>SUA COLEÇÃO</Text>
                            <Text style={styles.headerTitle}>Favoritos</Text>
                        </View>
                        <View style={styles.headerIconCircle}>
                            <Ionicons name="heart" size={22} color={theme.colors.primary} />
                        </View>
                    </View>

                    <View style={styles.headerCountBadge}>
                        <Ionicons name="bookmark" size={13} color="rgba(255,255,255,0.85)" />
                        <Text style={styles.headerCountText}>
                            {/* Mantemos paridade com o "Salvos" do perfil: total da lista, não só os disponíveis.
                                Os indisponíveis aparecem como banner separado no corpo da tela. */}
                            {loading ? '...' : `${favorites.length} roteiro${favorites.length !== 1 ? 's' : ''} salvos`}
                        </Text>
                    </View>
                </Animated.View>
            </LinearGradient>

            {/* ══════════ CONTENT ══════════ */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text style={styles.loadingText}>Carregando favoritos...</Text>
                </View>
            ) : isEmpty ? (
                <EmptyState onExplore={() => router.push('/(tabs)/index' as any)} />
            ) : loadError ? (
                <LoadErrorState
                    message={loadError}
                    onExplore={() => router.push('/(tabs)/index' as any)}
                    onRefresh={onRefresh}
                />
            ) : onlyUnavailable ? (
                <UnavailableState
                    onExplore={() => router.push('/(tabs)/index' as any)}
                    onRefresh={onRefresh}
                />
            ) : (
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={theme.colors.primary}
                        />
                    }
                >
                    {unavailableCount > 0 && (
                        <View style={styles.unavailableBanner}>
                            <Ionicons name="information-circle-outline" size={17} color={theme.colors.primary} />
                            <Text style={styles.unavailableBannerText}>
                                {unavailableCount} roteiro{unavailableCount !== 1 ? 's' : ''} salvo{unavailableCount !== 1 ? 's' : ''} não {unavailableCount !== 1 ? 'estão' : 'está'} disponível agora.
                            </Text>
                        </View>
                    )}
                    {items.map((item, index) => (
                        <SavedCard
                            key={item.id}
                            item={item}
                            index={index}
                            onPress={() => router.push(`/(tabs)/itinerary/${item.id}` as any)}
                            onRemove={() => handleRemove(item)}
                        />
                    ))}
                    <View style={{ height: 40 }} />
                </ScrollView>
            )}
        </View>
    );
}

// ─── SavedCard ──────────────────────────────────────────────
function SavedCard({
    item,
    index,
    onPress,
    onRemove,
}: {
    item: FavItem;
    index: number;
    onPress: () => void;
    onRemove: () => void;
}) {
    const cardAnim = useRef(new Animated.Value(0)).current;
    const pressScale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.timing(cardAnim, {
            toValue: 1,
            duration: 480,
            delay: index * 90,
            useNativeDriver: true,
        }).start();
    }, []);

    const handlePressIn = () =>
        Animated.spring(pressScale, { toValue: 0.97, useNativeDriver: true, speed: 20 }).start();
    const handlePressOut = () =>
        Animated.spring(pressScale, { toValue: 1, useNativeDriver: true, speed: 20 }).start();

    const [imageFailed, setImageFailed] = useState(false);
    const imageUri = !imageFailed ? item.images?.[0] ?? null : null;
    const price = Number(item.price) || 0;
    const duration = Number(item.duration) || 0;
    const ratingDisplay = getRouteRatingDisplay({
        averageRating: (item as any).averageRating ?? item.rating,
        reviewCount: item.reviewCount,
    });
    const priceFormatted = price > 0
        ? (price % 1 === 0 ? String(price) : price.toFixed(2).replace('.', ','))
        : 'Grátis';
    const destinationLabel = [item.destination, item.country].filter(Boolean).join(', ') || 'Destino a confirmar';

    return (
        <Animated.View style={[
            styles.cardWrapper,
            {
                opacity: cardAnim,
                transform: [
                    { translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [28, 0] }) },
                    { scale: pressScale },
                ],
            },
        ]}>
            <TouchableOpacity
                activeOpacity={1}
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
            >
                <View style={styles.card}>
                    {/* Hero image */}
                    {imageUri ? (
                        <Image
                            source={{ uri: imageUri }}
                            style={styles.cardImage}
                            resizeMode="cover"
                            onError={() => setImageFailed(true)}
                        />
                    ) : (
                        <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
                            <Ionicons name="map-outline" size={40} color="rgba(255,255,255,0.4)" />
                        </View>
                    )}

                    {/* Dark gradient overlay */}
                    <LinearGradient
                        colors={['transparent', 'rgba(20,30,55,0.72)', 'rgba(20,30,55,0.95)']}
                        style={styles.cardGradient}
                        locations={[0.25, 0.65, 1]}
                    />

                    {/* Price — top left */}
                    <View style={styles.priceBadge}>
                        <Text style={styles.priceBadgeText}>{price > 0 ? formatMoney(price) : priceFormatted}</Text>
                    </View>

                    {/* Heart remove — top right */}
                    <TouchableOpacity
                        style={styles.heartBtn}
                        onPress={(event) => {
                            event.stopPropagation?.();
                            onRemove();
                        }}
                        activeOpacity={0.8}
                        accessibilityLabel={`Remover ${item.title} dos favoritos`}
                    >
                        <Ionicons name="heart" size={18} color="#FF5A6E" />
                    </TouchableOpacity>

                    {/* Bottom overlay */}
                    <View style={styles.cardBottom}>
                        <View style={styles.durationChip}>
                            <Ionicons name="calendar-outline" size={11} color="rgba(255,255,255,0.9)" />
                            <Text style={styles.durationText}>{duration} dias</Text>
                        </View>

                        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>

                        <View style={styles.destRow}>
                            <Icon name="location" size={12} color="rgba(255,255,255,0.75)" />
                            <Text style={styles.destText} numberOfLines={1}>{destinationLabel}</Text>
                        </View>

                        <View style={styles.metaRow}>
                            {item.creator?.name ? (
                                <View style={styles.creatorPill}>
                                    <Text style={styles.creatorName} numberOfLines={1}>
                                        {item.creator.name}
                                    </Text>
                                </View>
                            ) : null}

                            <View style={styles.ratingPill}>
                                <Ionicons
                                    name="star"
                                    size={12}
                                    color={ratingDisplay.type === 'rating' ? '#FFC107' : theme.colors.text.tertiary}
                                />
                                <Text style={styles.ratingText}>{ratingDisplay.label}</Text>
                                {ratingDisplay.type === 'rating' && (
                                    <Text style={styles.ratingCount}>({ratingDisplay.reviewCount})</Text>
                                )}
                            </View>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
}

function LoadErrorState({
    message,
    onExplore,
    onRefresh,
}: {
    message: string;
    onExplore: () => void;
    onRefresh: () => void;
}) {
    return (
        <View style={styles.emptyState}>
            <LinearGradient
                colors={theme.colors.gradients.action as unknown as [string, string]}
                style={styles.emptyIconCircle}
            >
                <Ionicons name="cloud-offline-outline" size={40} color="#fff" />
            </LinearGradient>
            <Text style={styles.emptyTitle}>Erro ao carregar favoritos</Text>
            <Text style={styles.emptySubtitle}>{message}</Text>
            <View style={styles.emptyActionsRow}>
                <TouchableOpacity style={styles.secondaryCTA} onPress={onRefresh} activeOpacity={0.85}>
                    <Ionicons name="refresh" size={17} color={theme.colors.primary} />
                    <Text style={styles.secondaryCTAText}>Tentar novamente</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onExplore} activeOpacity={0.85}>
                    <LinearGradient
                        colors={theme.colors.gradients.aurora as unknown as [string, string, string]}
                        style={styles.exploreCTA}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <Icon name="compass" size={18} color="#fff" />
                        <Text style={styles.exploreCTAText}>Explorar roteiros</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );
}

function UnavailableState({
    onExplore,
    onRefresh,
}: {
    onExplore: () => void;
    onRefresh: () => void;
}) {
    return (
        <View style={styles.emptyState}>
            <LinearGradient
                colors={theme.colors.gradients.action as unknown as [string, string]}
                style={styles.emptyIconCircle}
            >
                <Ionicons name="cloud-offline-outline" size={40} color="#fff" />
            </LinearGradient>
            <Text style={styles.emptyTitle}>Seus favoritos não estão disponíveis agora</Text>
            <Text style={styles.emptySubtitle}>
                Eles podem ter sido pausados, removidos da vitrine ou não carregaram por falha de conexão.
            </Text>
            <View style={styles.emptyActionsRow}>
                <TouchableOpacity style={styles.secondaryCTA} onPress={onRefresh} activeOpacity={0.85}>
                    <Ionicons name="refresh" size={17} color={theme.colors.primary} />
                    <Text style={styles.secondaryCTAText}>Tentar novamente</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onExplore} activeOpacity={0.85}>
                    <LinearGradient
                        colors={theme.colors.gradients.aurora as unknown as [string, string, string]}
                        style={styles.exploreCTA}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <Icon name="compass" size={18} color="#fff" />
                        <Text style={styles.exploreCTAText}>Explorar roteiros</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );
}

// ─── EmptyState ─────────────────────────────────────────────
function EmptyState({ onExplore }: { onExplore: () => void }) {
    const anim = useRef(new Animated.Value(0)).current;
    const heartPulse = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.timing(anim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
        Animated.loop(
            Animated.sequence([
                Animated.timing(heartPulse, { toValue: 1.12, duration: 900, useNativeDriver: true }),
                Animated.timing(heartPulse, { toValue: 1,    duration: 900, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    return (
        <Animated.View style={[
            styles.emptyState,
            {
                opacity: anim,
                transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [32, 0] }) }],
            },
        ]}>
            <Animated.View style={{ transform: [{ scale: heartPulse }] }}>
                <LinearGradient
                    colors={theme.colors.gradients.action as unknown as [string, string]}
                    style={styles.emptyIconCircle}
                >
                    <Ionicons name="heart-outline" size={40} color="#fff" />
                </LinearGradient>
            </Animated.View>

            <Text style={styles.emptyTitle}>Nenhum favorito ainda</Text>
            <Text style={styles.emptySubtitle}>
                Salve roteiros que te interessam tocando no{' '}
                <Ionicons name="heart-outline" size={13} color={theme.colors.primary} />{' '}
                e eles aparecerão aqui.
            </Text>

            <View style={styles.emptyBadgesRow}>
                {['Acesso rápido', 'Offline em breve', 'Compartilhar'].map((b, i) => (
                    <View key={i} style={styles.emptyBadge}>
                        <Text style={styles.emptyBadgeText}>{b}</Text>
                    </View>
                ))}
            </View>

            <TouchableOpacity onPress={onExplore} activeOpacity={0.85}>
                <LinearGradient
                    colors={theme.colors.gradients.aurora as unknown as [string, string, string]}
                    style={styles.exploreCTA}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                >
                    <Icon name="compass" size={18} color="#fff" />
                    <Text style={styles.exploreCTAText}>Explorar roteiros</Text>
                </LinearGradient>
            </TouchableOpacity>
        </Animated.View>
    );
}

// ─── STYLES ─────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.surfaceLight,
    },

    // ── Loading ──
    loadingContainer: {
        flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16,
    },
    loadingText: {
        fontSize: 14, color: theme.colors.text.secondary,
    },

    // ── Header ──
    header: {
        paddingTop: Platform.OS === 'ios' ? 58 : (StatusBar.currentHeight ?? 24) + 16,
        paddingBottom: 0,
    },
    headerContent: {
        paddingHorizontal: 24,
        paddingBottom: 16,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    headerLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: 'rgba(255,255,255,0.55)',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    headerTitle: {
        fontSize: 30,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: -0.5,
    },
    headerIconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerCountBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.18)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    headerCountText: {
        fontSize: 12,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.85)',
    },

    // ── List ──
    listContent: {
        padding: 16,
        paddingTop: 20,
    },
    unavailableBanner: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        padding: 12,
        borderRadius: 12,
        marginBottom: 14,
        backgroundColor: theme.colors.primary + '10',
        borderWidth: 1,
        borderColor: theme.colors.primary + '22',
    },
    unavailableBannerText: {
        flex: 1,
        fontSize: 12,
        lineHeight: 17,
        color: theme.colors.text.secondary,
        fontWeight: '600',
    },

    // ── Card ──
    cardWrapper: {
        marginBottom: 18,
        borderRadius: 22,
        ...theme.shadows.large,
    },
    card: {
        borderRadius: 22,
        overflow: 'hidden',
        backgroundColor: theme.colors.secondary,
    },
    cardImage: {
        width: '100%',
        height: 220,
    },
    cardImagePlaceholder: {
        backgroundColor: theme.colors.secondary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardGradient: {
        ...StyleSheet.absoluteFillObject,
        top: '30%',
    },

    // Top badges
    priceBadge: {
        position: 'absolute',
        top: 14,
        left: 14,
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        ...theme.shadows.button,
    },
    priceBadgeText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#fff',
    },
    heartBtn: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Bottom overlay
    cardBottom: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        paddingBottom: 18,
    },
    durationChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginBottom: 8,
    },
    durationText: {
        fontSize: 11,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.9)',
    },
    cardTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: '#fff',
        lineHeight: 23,
        marginBottom: 6,
        letterSpacing: -0.2,
    },
    destRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 10,
    },
    destText: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.7)',
        fontWeight: '500',
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    creatorPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        maxWidth: SCREEN_WIDTH * 0.45,
    },
    creatorName: {
        fontSize: 12,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.9)',
        flexShrink: 1,
    },
    ratingPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
    },
    ratingText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#fff',
    },
    ratingCount: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.6)',
    },

    // ── Empty state ──
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 36,
    },
    emptyIconCircle: {
        width: 88,
        height: 88,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        ...theme.shadows.button,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: theme.colors.text.primary,
        marginBottom: 10,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 14,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        lineHeight: 21,
        marginBottom: 20,
    },
    emptyBadgesRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 28,
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    emptyBadge: {
        backgroundColor: theme.colors.primary + '12',
        borderWidth: 1,
        borderColor: theme.colors.primary + '25',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    emptyBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.primary,
    },
    exploreCTA: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 28,
        paddingVertical: 16,
        borderRadius: 100,
        ...theme.shadows.button,
    },
    exploreCTAText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
    emptyActionsRow: {
        alignItems: 'center',
        gap: 12,
    },
    secondaryCTA: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderRadius: 999,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: theme.colors.primary + '25',
    },
    secondaryCTAText: {
        fontSize: 14,
        fontWeight: '800',
        color: theme.colors.primary,
    },
});
