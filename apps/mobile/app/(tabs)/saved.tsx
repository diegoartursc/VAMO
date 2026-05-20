import React, { useRef, useEffect } from 'react';
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
    Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../src/theme/theme';
import { Icon } from '../../src/components/common/Icons';
import { useFavorites } from '../../src/hooks/useFavorites';
import { mockItineraries, Itinerary } from '../../src/data/mockItineraries';
import { haptics } from '../../src/services/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Seed IDs shown when no real favorites exist (demo) ────
const DEMO_IDS = ['1', '2', '3', '4'];

export default function SavedScreen() {
    const router = useRouter();
    const { favorites, removeFavorite } = useFavorites();

    // Header entrance animation
    const headerAnim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.timing(headerAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }, []);

    // Resolve saved itineraries: real favorites OR demo items
    const resolvedIds = favorites.length > 0 ? favorites : DEMO_IDS;
    const allItems = mockItineraries.filter(it => resolvedIds.includes(it.id));

    const isEmpty = allItems.length === 0;

    const handleRemove = (item: Itinerary) => {
        haptics.medium();
        Alert.alert(
            'Remover dos favoritos?',
            `"${item.title}" será removido da sua lista.`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Remover',
                    style: 'destructive',
                    onPress: () => {
                        haptics.light();
                        removeFavorite(item.id);
                    },
                },
            ]
        );
    };

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
                            {allItems.length} roteiro{allItems.length !== 1 ? 's' : ''} salvos
                        </Text>
                    </View>
                </Animated.View>

            </LinearGradient>

            {/* ══════════ CONTENT ══════════ */}
            {isEmpty ? (
                <EmptyState onExplore={() => router.push('/(tabs)/index' as any)} />
            ) : (
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                >
                    {allItems.map((item, index) => (
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
    item: Itinerary;
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

    const handlePressIn = () => {
        Animated.spring(pressScale, { toValue: 0.97, useNativeDriver: true, speed: 20 }).start();
    };
    const handlePressOut = () => {
        Animated.spring(pressScale, { toValue: 1, useNativeDriver: true, speed: 20 }).start();
    };

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
                    <Image
                        source={{ uri: item.images[0] }}
                        style={styles.cardImage}
                        resizeMode="cover"
                    />

                    {/* Dark gradient overlay — bottom half */}
                    <LinearGradient
                        colors={['transparent', 'rgba(20,30,55,0.72)', 'rgba(20,30,55,0.95)']}
                        style={styles.cardGradient}
                        locations={[0.25, 0.65, 1]}
                    />

                    {/* ── Top badges ── */}
                    {/* Price — top left */}
                    <View style={styles.priceBadge}>
                        <Text style={styles.priceBadgeText}>
                            R$ {item.price % 1 === 0 ? item.price : item.price.toFixed(2).replace('.', ',')}
                        </Text>
                    </View>

                    {/* Heart remove — top right */}
                    <TouchableOpacity style={styles.heartBtn} onPress={onRemove} activeOpacity={0.8}>
                        <Ionicons name="heart" size={18} color="#FF5A6E" />
                    </TouchableOpacity>

                    {/* ── Bottom overlay ── */}
                    <View style={styles.cardBottom}>
                        {/* Duration chip */}
                        <View style={styles.durationChip}>
                            <Ionicons name="calendar-outline" size={11} color="rgba(255,255,255,0.9)" />
                            <Text style={styles.durationText}>{item.duration} dias</Text>
                        </View>

                        {/* Title */}
                        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>

                        {/* Destination */}
                        <View style={styles.destRow}>
                            <Icon name="location" size={12} color="rgba(255,255,255,0.75)" />
                            <Text style={styles.destText}>{item.destination}, {item.country}</Text>
                        </View>

                        {/* Meta row */}
                        <View style={styles.metaRow}>
                            {/* Creator pill */}
                            <View style={styles.creatorPill}>
                                <Text style={styles.creatorAvatar}>{item.creator.avatar}</Text>
                                <Text style={styles.creatorName} numberOfLines={1}>{item.creator.name}</Text>
                            </View>

                            {/* Rating */}
                            <View style={styles.ratingPill}>
                                <Ionicons name="star" size={12} color="#FFC107" />
                                <Text style={styles.ratingText}>{item.rating}</Text>
                                <Text style={styles.ratingCount}>({item.reviewCount})</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        </Animated.View>
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
            {/* Icon */}
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
                <Ionicons name="heart-outline" size={13} color={theme.colors.primary} />
                {' '}e eles aparecerão aqui.
            </Text>

            {/* Trust badges */}
            <View style={styles.emptyBadgesRow}>
                {['Acesso rápido', 'Offline em breve', 'Compartilhar'].map((b, i) => (
                    <View key={i} style={styles.emptyBadge}>
                        <Text style={styles.emptyBadgeText}>{b}</Text>
                    </View>
                ))}
            </View>

            {/* CTA */}
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
    creatorAvatar: { fontSize: 14 },
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
});
