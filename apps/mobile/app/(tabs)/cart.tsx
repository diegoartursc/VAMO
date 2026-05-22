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
    Alert,
    ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../src/theme/theme';
import { useCart } from '../../src/hooks/useCart';
import { haptics } from '../../src/services/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight ?? 24);
const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3333/api';

// ─── Tipo mínimo usado pelo card do carrinho ─────────────────────
interface CartItemData {
    id: string;
    title: string;
    destination: string;
    country: string;
    price: number;
    duration: number;
    images: string[];          // URLs já normalizadas
    creator: { name: string; avatar: string };
}

const PLACEHOLDER_IMG =
    'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=900&auto=format&fit=crop';

/** Busca um roteiro real da API e normaliza pro shape do card. */
async function fetchItinerary(id: string): Promise<CartItemData | null> {
    try {
        const res = await fetch(`${API_BASE}/itineraries/${id}`);
        if (!res.ok) return null;
        const d = await res.json();
        // Imagens podem vir como [{ url }] ou como string[]
        const imgs: string[] = Array.isArray(d.images)
            ? d.images.map((x: any) => (typeof x === 'string' ? x : x?.url)).filter(Boolean)
            : [];
        return {
            id: d.id,
            title: d.title || 'Roteiro',
            destination: d.destination || '',
            country: d.country || '',
            price: Number(d.price) || 0,
            duration: Number(d.duration) || 0,
            images: imgs.length ? imgs : [PLACEHOLDER_IMG],
            creator: {
                name: d.creator?.traveler?.name || d.creator?.name || 'Criador VAMO',
                avatar: d.creator?.traveler?.avatar || '👤',
            },
        };
    } catch {
        return null;
    }
}

// ─── Helpers ────────────────────────────────────────────────────
const formatPrice = (price: number) =>
    price % 1 === 0
        ? `R$ ${price}`
        : `R$ ${price.toFixed(2).replace('.', ',')}`;

// ════════════════════════════════════════════════════════════════
//  SCREEN
// ════════════════════════════════════════════════════════════════
export default function CartScreen() {
    const router = useRouter();
    const { cartItems, removeFromCart, clearCart } = useCart();

    // Entrance animation
    const headerAnim = useRef(new Animated.Value(0)).current;
    const bodyAnim   = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.stagger(120, [
            Animated.timing(headerAnim, { toValue: 1, duration: 550, useNativeDriver: true }),
            Animated.timing(bodyAnim,   { toValue: 1, duration: 450, useNativeDriver: true }),
        ]).start();
    }, []);

    // Carrega dados reais dos roteiros do carrinho via API
    const [items, setItems]   = useState<CartItemData[]>([]);
    const [loading, setLoading] = useState(true);

    const loadItems = useCallback(async () => {
        if (cartItems.length === 0) { setItems([]); setLoading(false); return; }
        setLoading(true);
        const results = await Promise.all(cartItems.map(fetchItinerary));
        setItems(results.filter((r): r is CartItemData => r !== null));
        setLoading(false);
    }, [cartItems]);

    useEffect(() => { loadItems(); }, [loadItems]);

    const isEmpty = !loading && items.length === 0;
    const subtotal = items.reduce((sum, it) => sum + it.price, 0);

    const handleRemove = (item: CartItemData) => {
        haptics.medium();
        Alert.alert(
            'Remover do carrinho?',
            `"${item.title}" será removido.`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Remover',
                    style: 'destructive',
                    onPress: () => { haptics.light(); removeFromCart(item.id); },
                },
            ]
        );
    };

    const handleClearAll = () => {
        haptics.medium();
        Alert.alert(
            'Limpar carrinho?',
            'Todos os roteiros serão removidos.',
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Limpar', style: 'destructive', onPress: () => { haptics.light(); clearCart(); } },
            ]
        );
    };

    /**
     * Checkout do carrinho. MVP: o backend só aceita compra de UM roteiro
     * por requisição (POST /itineraries/:id/purchase). Por isso, mandamos
     * o primeiro item para o fluxo de checkout existente.
     * Se houver múltiplos itens, avisamos o usuário antes.
     * TODO (futuro): implementar checkout multi-item no backend (orders +
     * order_items) e navegar para um summary screen aqui.
     */
    const handleCheckout = () => {
        if (items.length === 0) return;
        haptics.bookingConfirmed();
        const proceed = (it: CartItemData) => {
            router.push({
                pathname: '/checkout/itinerary-contact' as any,
                params: { itineraryId: it.id, price: it.price.toString() },
            });
        };
        if (items.length === 1) { proceed(items[0]); return; }
        Alert.alert(
            'Compra individual',
            `Você tem ${items.length} roteiros no carrinho. Por ora, compras são feitas um a um. Deseja começar pelo primeiro ("${items[0].title}")?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Comprar primeiro', onPress: () => proceed(items[0]) },
            ],
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent />

            {/* ══════════ AURORA HEADER ══════════ */}
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
                        transform: [{
                            translateY: headerAnim.interpolate({
                                inputRange: [0, 1], outputRange: [-18, 0],
                            }),
                        }],
                    },
                ]}>
                    {/* Top row */}
                    <View style={styles.headerRow}>
                        <View>
                            <Text style={styles.headerLabel}>MINHA COMPRA</Text>
                            <Text style={styles.headerTitle}>Carrinho</Text>
                        </View>
                        {/* Icon circle */}
                        <View style={styles.headerIconCircle}>
                            <Ionicons name="bag" size={22} color={theme.colors.primary} />
                        </View>
                    </View>

                    {/* Count badge + clear */}
                    <View style={styles.headerMeta}>
                        <View style={styles.headerCountBadge}>
                            <Ionicons name="receipt-outline" size={12} color="rgba(255,255,255,0.85)" />
                            <Text style={styles.headerCountText}>
                                {items.length} roteiro{items.length !== 1 ? 's' : ''} selecionado{items.length !== 1 ? 's' : ''}
                            </Text>
                        </View>
                        {items.length > 0 && (
                            <TouchableOpacity onPress={handleClearAll} activeOpacity={0.7}>
                                <Text style={styles.clearAllText}>Limpar tudo</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </Animated.View>
            </LinearGradient>

            {/* ══════════ BODY ══════════ */}
            {loading ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator color={theme.colors.primary} />
                </View>
            ) : isEmpty ? (
                <EmptyState onExplore={() => router.push('/(tabs)/index' as any)} />
            ) : (
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                >
                    <Animated.View style={{ opacity: bodyAnim }}>

                        {/* Cart items */}
                        {items.map((item, index) => (
                            <CartItemCard
                                key={item.id}
                                item={item}
                                index={index}
                                onPress={() => router.push(`/(tabs)/itinerary/${item.id}` as any)}
                                onRemove={() => handleRemove(item)}
                            />
                        ))}

                        {/* Order summary */}
                        <OrderSummary items={items} subtotal={subtotal} />

                        {/* Spacer for bottom sheet */}
                        <View style={{ height: 140 }} />
                    </Animated.View>
                </ScrollView>
            )}

            {/* ══════════ STICKY CHECKOUT BAR ══════════ */}
            {!isEmpty && (
                <CheckoutBar subtotal={subtotal} onPress={handleCheckout} />
            )}
        </View>
    );
}

// ════════════════════════════════════════════════════════════════
//  CART ITEM CARD (horizontal)
// ════════════════════════════════════════════════════════════════
function CartItemCard({
    item,
    index,
    onPress,
    onRemove,
}: {
    item: CartItemData;
    index: number;
    onPress: () => void;
    onRemove: () => void;
}) {
    const cardAnim  = useRef(new Animated.Value(0)).current;
    const pressScale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.timing(cardAnim, {
            toValue: 1, duration: 460, delay: index * 80, useNativeDriver: true,
        }).start();
    }, []);

    const onPressIn  = () => Animated.spring(pressScale, { toValue: 0.975, useNativeDriver: true, speed: 22 }).start();
    const onPressOut = () => Animated.spring(pressScale, { toValue: 1,     useNativeDriver: true, speed: 22 }).start();

    const durationLabel =
        item.duration <= 3 ? 'fim de semana' :
        item.duration <= 7 ? `${item.duration} dias` :
        `${item.duration} dias`;

    return (
        <Animated.View style={[
            styles.cardWrapper,
            {
                opacity: cardAnim,
                transform: [
                    { translateX: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] }) },
                    { scale: pressScale },
                ],
            },
        ]}>
            <TouchableOpacity
                activeOpacity={1}
                onPress={onPress}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
            >
                <View style={styles.card}>
                    {/* Thumbnail */}
                    <View style={styles.thumbWrapper}>
                        <Image
                            source={{ uri: item.images[0] }}
                            style={styles.thumbImage}
                            resizeMode="cover"
                        />
                        <LinearGradient
                            colors={['transparent', 'rgba(26,50,99,0.45)']}
                            style={StyleSheet.absoluteFill}
                        />
                    </View>

                    {/* Content */}
                    <View style={styles.cardBody}>
                        <View style={styles.cardTopRow}>
                            {/* Title */}
                            <Text style={styles.cardTitle} numberOfLines={2}>
                                {item.title}
                            </Text>
                            {/* Remove button */}
                            <TouchableOpacity
                                style={styles.removeBtn}
                                onPress={onRemove}
                                hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="close" size={14} color={theme.colors.text.tertiary} />
                            </TouchableOpacity>
                        </View>

                        {/* Meta row */}
                        <View style={styles.metaRow}>
                            <Ionicons name="location-outline" size={11} color={theme.colors.text.tertiary} />
                            <Text style={styles.metaText}>{item.destination}, {item.country}</Text>
                            <View style={styles.metaDot} />
                            <Ionicons name="time-outline" size={11} color={theme.colors.text.tertiary} />
                            <Text style={styles.metaText}>{durationLabel}</Text>
                        </View>

                        {/* Creator pill */}
                        <View style={styles.creatorPill}>
                            <Text style={styles.creatorAvatar}>{item.creator.avatar}</Text>
                            <Text style={styles.creatorName} numberOfLines={1}>{item.creator.name}</Text>
                        </View>

                        {/* Price row */}
                        <View style={styles.priceRow}>
                            <Text style={styles.priceLabel}>Acesso vitalício</Text>
                            <Text style={styles.priceValue}>{formatPrice(item.price)}</Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
}

// ════════════════════════════════════════════════════════════════
//  ORDER SUMMARY
// ════════════════════════════════════════════════════════════════
function OrderSummary({ items, subtotal }: { items: CartItemData[]; subtotal: number }) {
    return (
        <View style={styles.summaryCard}>
            {/* Header */}
            <View style={styles.summaryHeader}>
                <Ionicons name="receipt" size={16} color={theme.colors.primary} />
                <Text style={styles.summaryTitle}>Resumo do Pedido</Text>
            </View>

            {/* Item lines */}
            {items.map((item, i) => (
                <View key={item.id} style={[styles.summaryRow, i === 0 && { marginTop: 4 }]}>
                    <Text style={styles.summaryRowLabel} numberOfLines={1}>
                        {item.destination}
                    </Text>
                    <Text style={styles.summaryRowValue}>{formatPrice(item.price)}</Text>
                </View>
            ))}

            {/* Divider */}
            <View style={styles.summaryDivider} />

            {/* Total */}
            <View style={styles.summaryTotalRow}>
                <Text style={styles.summaryTotalLabel}>Total</Text>
                <View>
                    <Text style={styles.summaryTotalValue}>{formatPrice(subtotal)}</Text>
                    <Text style={styles.summaryTotalNote}>{items.length} roteiro{items.length !== 1 ? 's' : ''}</Text>
                </View>
            </View>

            {/* Trust note */}
            <View style={styles.trustRow}>
                <Ionicons name="shield-checkmark-outline" size={12} color={theme.colors.primary} />
                <Text style={styles.trustText}>Pagamento seguro · Acesso imediato após confirmação</Text>
            </View>
        </View>
    );
}

// ════════════════════════════════════════════════════════════════
//  CHECKOUT BAR (sticky bottom)
// ════════════════════════════════════════════════════════════════
function CheckoutBar({ subtotal, onPress }: { subtotal: number; onPress: () => void }) {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const onIn  = () => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, speed: 20 }).start();
    const onOut = () => Animated.spring(scaleAnim, { toValue: 1,    useNativeDriver: true, speed: 20 }).start();

    return (
        <View style={styles.checkoutBar}>
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={onPress}
                    onPressIn={onIn}
                    onPressOut={onOut}
                >
                    <LinearGradient
                        colors={['#28C9BF', '#1A3263']}
                        style={styles.checkoutBtn}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <Ionicons name="lock-closed" size={16} color="#fff" />
                        <Text style={styles.checkoutBtnText}>Finalizar Compra</Text>
                        <View style={styles.checkoutPricePill}>
                            <Text style={styles.checkoutPriceText}>{formatPrice(subtotal)}</Text>
                        </View>
                    </LinearGradient>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
}

// ════════════════════════════════════════════════════════════════
//  EMPTY STATE
// ════════════════════════════════════════════════════════════════
function EmptyState({ onExplore }: { onExplore: () => void }) {
    const fadeAnim  = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(32)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Entrance
        Animated.parallel([
            Animated.timing(fadeAnim,  { toValue: 1,  duration: 600, delay: 150, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0,  duration: 500, delay: 150, useNativeDriver: true }),
        ]).start();

        // Icon pulse loop
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.12, duration: 900, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1,    duration: 900, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    return (
        <Animated.View style={[
            styles.emptyState,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}>
            {/* Pulsing bag */}
            <Animated.View style={[styles.emptyIconWrap, { transform: [{ scale: pulseAnim }] }]}>
                <LinearGradient
                    colors={['rgba(40,201,191,0.15)', 'rgba(40,201,191,0.04)']}
                    style={styles.emptyIconBg}
                />
                <Ionicons name="bag-outline" size={52} color={theme.colors.primary} />
            </Animated.View>

            <Text style={styles.emptyTitle}>Carrinho vazio</Text>
            <Text style={styles.emptyText}>
                Encontre roteiros incríveis feitos por quem viajou de verdade e adicione ao carrinho.
            </Text>

            {/* Micro trust row */}
            <View style={styles.emptyTrustRow}>
                {['Acesso vitalício', 'Download offline', 'Suporte incluso'].map((label, i) => (
                    <View key={i} style={styles.emptyTrustItem}>
                        <Ionicons name="checkmark-circle" size={13} color={theme.colors.primary} />
                        <Text style={styles.emptyTrustText}>{label}</Text>
                    </View>
                ))}
            </View>

            {/* CTA */}
            <TouchableOpacity onPress={onExplore} activeOpacity={0.88} style={styles.emptyCtaWrapper}>
                <LinearGradient
                    colors={['#28C9BF', '#1A3263']}
                    style={styles.emptyCta}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                >
                    <Ionicons name="search" size={16} color="#fff" />
                    <Text style={styles.emptyCtaText}>Explorar Roteiros</Text>
                </LinearGradient>
            </TouchableOpacity>
        </Animated.View>
    );
}

// ════════════════════════════════════════════════════════════════
//  STYLES
// ════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.surfaceLight,
    },

    // ── Header ──────────────────────────────────────
    header: {
        paddingTop: STATUSBAR_HEIGHT + 14,
        paddingBottom: 22,
        paddingHorizontal: theme.spacing.lg,
    },
    headerContent: {},
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    headerLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.55)',
        letterSpacing: 1.8,
        marginBottom: 4,
    },
    headerTitle: {
        fontSize: 30,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: -0.5,
    },
    headerIconCircle: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: 'rgba(255,255,255,0.14)',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.22)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerCountBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: 'rgba(255,255,255,0.13)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.18)',
    },
    headerCountText: {
        fontSize: 12,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.88)',
    },
    clearAllText: {
        fontSize: 12,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.6)',
        textDecorationLine: 'underline',
    },

    // ── List ────────────────────────────────────────
    listContent: {
        paddingTop: 16,
        paddingHorizontal: 16,
    },

    // ── Cart Item Card ───────────────────────────────
    cardWrapper: {
        marginBottom: 14,
    },
    card: {
        flexDirection: 'row',
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.lg,
        overflow: 'hidden',
        ...theme.shadows.medium,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    thumbWrapper: {
        width: 100,
        height: 118,
        position: 'relative',
    },
    thumbImage: {
        width: 100,
        height: 118,
    },
    cardBody: {
        flex: 1,
        paddingHorizontal: 12,
        paddingTop: 11,
        paddingBottom: 11,
        justifyContent: 'space-between',
    },
    cardTopRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 6,
    },
    cardTitle: {
        flex: 1,
        fontSize: 13.5,
        fontWeight: '700',
        color: theme.colors.text.primary,
        lineHeight: 18,
    },
    removeBtn: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: theme.colors.surfaceHighlight,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 1,
        flexShrink: 0,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        marginTop: 4,
    },
    metaText: {
        fontSize: 11,
        color: theme.colors.text.tertiary,
        fontWeight: '500',
    },
    metaDot: {
        width: 2.5,
        height: 2.5,
        borderRadius: 1.25,
        backgroundColor: theme.colors.text.tertiary,
        marginHorizontal: 2,
    },
    creatorPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: theme.colors.surfaceLight,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 20,
        alignSelf: 'flex-start',
        marginTop: 6,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    creatorAvatar: {
        fontSize: 11,
    },
    creatorName: {
        fontSize: 11,
        fontWeight: '600',
        color: theme.colors.secondary,
        maxWidth: 100,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: theme.colors.borderLight,
    },
    priceLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: theme.colors.text.tertiary,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
    },
    priceValue: {
        fontSize: 16,
        fontWeight: '800',
        color: theme.colors.primary,
        letterSpacing: -0.3,
    },

    // ── Order Summary ────────────────────────────────
    summaryCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.xl,
        padding: 20,
        marginTop: 4,
        marginBottom: 0,
        ...theme.shadows.medium,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    summaryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 14,
    },
    summaryTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: theme.colors.text.primary,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    summaryRowLabel: {
        fontSize: 13,
        color: theme.colors.text.secondary,
        flex: 1,
        marginRight: 12,
    },
    summaryRowValue: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    summaryDivider: {
        height: 1,
        backgroundColor: theme.colors.border,
        marginVertical: 12,
    },
    summaryTotalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 14,
    },
    summaryTotalLabel: {
        fontSize: 16,
        fontWeight: '800',
        color: theme.colors.secondary,
    },
    summaryTotalValue: {
        fontSize: 24,
        fontWeight: '800',
        color: theme.colors.primary,
        letterSpacing: -0.5,
        textAlign: 'right',
    },
    summaryTotalNote: {
        fontSize: 11,
        color: theme.colors.text.tertiary,
        textAlign: 'right',
        marginTop: 1,
    },
    trustRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(40,201,191,0.06)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(40,201,191,0.15)',
    },
    trustText: {
        fontSize: 11,
        fontWeight: '500',
        color: theme.colors.primary,
        flex: 1,
    },

    // ── Checkout Bar ─────────────────────────────────
    checkoutBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 16,
        paddingBottom: Platform.OS === 'ios' ? 32 : 18,
        paddingTop: 12,
        backgroundColor: 'rgba(255,255,255,0.94)',
        borderTopWidth: 1,
        borderTopColor: theme.colors.borderLight,
    },
    checkoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 16,
        borderRadius: theme.borderRadius.lg,
        ...theme.shadows.button,
    },
    checkoutBtnText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: -0.2,
        flex: 1,
    },
    checkoutPricePill: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    checkoutPriceText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#fff',
    },

    // ── Empty State ──────────────────────────────────
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 36,
        paddingBottom: 60,
    },
    emptyIconWrap: {
        width: 110,
        height: 110,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 28,
        position: 'relative',
    },
    emptyIconBg: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 55,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: theme.colors.text.primary,
        marginBottom: 10,
        letterSpacing: -0.3,
    },
    emptyText: {
        fontSize: 14,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        lineHeight: 21,
        marginBottom: 24,
    },
    emptyTrustRow: {
        flexDirection: 'column',
        gap: 8,
        marginBottom: 32,
        alignSelf: 'stretch',
        paddingHorizontal: 8,
    },
    emptyTrustItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    emptyTrustText: {
        fontSize: 13,
        fontWeight: '500',
        color: theme.colors.text.secondary,
    },
    emptyCtaWrapper: {
        alignSelf: 'stretch',
        borderRadius: theme.borderRadius.lg,
        overflow: 'hidden',
        ...theme.shadows.button,
    },
    emptyCta: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 15,
        paddingHorizontal: 28,
    },
    emptyCtaText: {
        fontSize: 15,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: -0.2,
    },
});
