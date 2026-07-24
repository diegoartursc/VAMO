import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
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
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../src/theme/theme';
import { CreatorAvatar } from '../../src/components/common/CreatorAvatar';
import { useCart, CartItemMeta } from '../../src/hooks/useCart';
import { haptics } from '../../src/services/haptics';
import { confirm } from '../../src/utils/confirm';
import { notify } from '../../src/utils/notify';
import { formatMoney } from '@vamo/shared/itinerary';
import { getCoverImages } from '../../src/utils/itineraryMedia';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight ?? 24);
// ─── Tipo mínimo usado pelo card do carrinho ─────────────────────
// Derivado do CartItemMeta hidratado pelo CartProvider — uma única fonte de
// verdade pra disponibilidade. Mantemos esse shape porque os subcomponentes
// (CartItemCard, OrderSummary) já consomem essas chaves.
interface CartItemData {
    id: string;
    title: string;
    destination: string;
    country: string;
    price: number;
    duration: number;
    images: string[];          // URLs já normalizadas
    creator: { name: string; avatar: string };
    lifetimeAccess?: boolean;
    /** true só quando o provider hidratou e classificou como 'available'. */
    available: boolean;
    /** Estado da hidratação. 'checking_error' = falha de rede/5xx transiente
     *  (o item continua no carrinho, só não pôde ser confirmado agora).
     *  Indisponibilidade CONFIRMADA (404, pausado/arquivado, já comprado)
     *  nunca chega aqui — o provider remove o id automaticamente. */
    status: 'loading' | 'available' | 'checking_error';
}

const PLACEHOLDER_IMG =
    'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=900&auto=format&fit=crop';

/** Converte CartItemMeta (provider) → CartItemData (UI). */
function metaToItem(meta: CartItemMeta): CartItemData {
    const it = meta.itinerary;
    const imgs: string[] = Array.isArray(it?.images)
        ? it.images.map((x: any) => (typeof x === 'string' ? x : x?.url)).filter(Boolean)
        : [];
    return {
        id: meta.id,
        title: it?.title || 'Roteiro',
        destination: it?.destination || '',
        country: it?.country || '',
        price: Number(it?.price) || 0,
        duration: Number(it?.duration) || 0,
        images: imgs.length ? imgs : [PLACEHOLDER_IMG],
        creator: {
            name: it?.creator?.traveler?.name || it?.creator?.name || 'Criador VAMO',
            avatar: it?.creator?.traveler?.avatar || '👤',
        },
        lifetimeAccess: Boolean(it?.lifetimeAccess),
        available: meta.status === 'available',
        status: meta.status,
    };
}

// ─── Helpers ────────────────────────────────────────────────────
const formatPrice = (price: number) =>
    price > 0 ? formatMoney(price) : 'Grátis';

// ════════════════════════════════════════════════════════════════
//  SCREEN
// ════════════════════════════════════════════════════════════════
export default function CartScreen() {
    const router = useRouter();
    const {
        cartItems,
        itemsMeta,
        removeFromCart,
        clearCart,
        reloadAvailability,
        isLoading,
        isResolving,
    } = useCart();

    // Entrance animation
    const headerAnim = useRef(new Animated.Value(0)).current;
    const bodyAnim   = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.stagger(120, [
            Animated.timing(headerAnim, { toValue: 1, duration: 550, useNativeDriver: true }),
            Animated.timing(bodyAnim,   { toValue: 1, duration: 450, useNativeDriver: true }),
        ]).start();
    }, []);

    // Derivado do provider — preserva a ordem do storage e respeita a
    // hidratação. Nada de fetch em paralelo aqui: a tela e o badge da tab
    // consomem A MESMA fonte (CartProvider).
    const items: CartItemData[] = useMemo(
        () => cartItems
            .map((id) => itemsMeta[id])
            .filter(Boolean)
            .map(metaToItem),
        [cartItems, itemsMeta],
    );

    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try { await reloadAvailability(); } finally { setRefreshing(false); }
    }, [reloadAvailability]);

    // Revalida disponibilidade sempre que a aba do carrinho ganha foco —
    // cobre o caso de o usuário ter pausado/comprado algo em outra tela e
    // voltado pro carrinho sem dar pull-to-refresh manualmente.
    useFocusEffect(useCallback(() => { reloadAvailability(); }, [reloadAvailability]));

    // Estado de loading combinado: storage hidratando OU resolução pendente
    // de itens já no carrinho (cartItems já presente mas itemsMeta vazio).
    const loading =
        isLoading ||
        (cartItems.length > 0 && items.length < cartItems.length) ||
        (cartItems.length > 0 && isResolving && items.every((it) => it.status === 'loading'));

    const availableItems = items.filter((it) => it.status === 'available');
    const checkingErrorItems = items.filter((it) => it.status === 'checking_error');
    const checkingErrorCount = checkingErrorItems.length;
    const isEmpty = !loading && cartItems.length === 0;
    const subtotal = availableItems.reduce((sum, it) => sum + it.price, 0);
    // MVP: backend só aceita 1 compra por requisição. O CTA mostra o total
    // de disponíveis e a quantidade real; ao tocar, abrimos checkout do
    // primeiro com aviso quando há fila.
    const checkoutAmount = subtotal;
    const checkoutCount = availableItems.length;

    const handleRemove = async (item: CartItemData) => {
        haptics.medium();
        const ok = await confirm({
            title: 'Remover do carrinho?',
            message: `"${item.title}" será removido.`,
            confirmText: 'Remover',
            action: 'removeFromCart',
        });
        if (ok) { haptics.light(); removeFromCart(item.id); }
    };

    const handleClearAll = async () => {
        haptics.medium();
        const ok = await confirm({
            title: 'Limpar carrinho?',
            message: 'Todos os roteiros serão removidos.',
            confirmText: 'Limpar tudo',
            action: 'clearCart',
        });
        if (ok) { haptics.light(); clearCart(); }
    };

    /**
     * Checkout do carrinho. MVP: o backend só aceita compra de UM roteiro
     * por requisição (POST /itineraries/:id/purchase). Por isso, mandamos
     * o primeiro item para o fluxo de checkout existente.
     * Se houver múltiplos itens, avisamos o usuário antes.
     * Sempre revalida disponibilidade ANTES de seguir pro checkout — o item
     * pode ter sido pausado/comprado em outro lugar entre a última hidratação
     * e o toque no botão.
     * TODO (futuro): implementar checkout multi-item no backend (orders +
     * order_items) e navegar para um summary screen aqui.
     */
    const handleCheckout = async () => {
        if (availableItems.length === 0) return;
        await reloadAvailability();
        const stillAvailable = cartItems
            .map((id) => itemsMeta[id])
            .filter((m): m is CartItemMeta => !!m && m.status === 'available')
            .map(metaToItem);
        if (stillAvailable.length === 0) {
            haptics.warning();
            notify({
                title: 'Roteiro não está mais disponível',
                message: 'Esse roteiro deixou de estar disponível para compra e foi removido do seu carrinho.',
                variant: 'warning',
            });
            return;
        }
        haptics.bookingConfirmed();
        const proceed = (it: CartItemData) => {
            router.push({
                pathname: '/checkout/itinerary-contact' as any,
                params: { itineraryId: it.id, price: it.price.toString(), source: 'cart' },
            });
        };
        if (stillAvailable.length === 1) { proceed(stillAvailable[0]); return; }
        const ok = await confirm({
            title: 'Checkout individual',
            icon: 'cart-outline',
            message: `Você tem ${stillAvailable.length} roteiros disponíveis, mas o checkout atual libera uma compra por vez. Vamos começar por "${stillAvailable[0].title}" no valor de ${formatPrice(stillAvailable[0].price)}. Os demais continuam no carrinho.`,
            confirmText: 'Comprar primeiro',
        });
        if (ok) proceed(stillAvailable[0]);
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
                                {loading
                                    ? '...'
                                    : `${items.length} ${items.length === 1 ? 'roteiro' : 'roteiros'}`}
                            </Text>
                        </View>
                        {cartItems.length > 0 && (
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
                    <Text style={styles.loadingText}>Carregando carrinho...</Text>
                </View>
            ) : isEmpty ? (
                <EmptyState onExplore={() => router.push('/(tabs)/index' as any)} />
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
                    <Animated.View style={{ opacity: bodyAnim }}>
                        {/* checking_error é uma falha de CONEXÃO transiente — nunca
                            afirmamos que o roteiro sumiu, só que não conseguimos
                            confirmar agora. Item permanece na lista abaixo. */}
                        {checkingErrorCount > 0 && (
                            <View style={styles.unavailableBanner}>
                                <Ionicons name="cloud-offline-outline" size={17} color={theme.colors.primary} />
                                <Text style={styles.unavailableBannerText}>
                                    {checkingErrorCount === 1
                                        ? 'Não foi possível confirmar 1 roteiro agora. Verifique sua conexão.'
                                        : `Não foi possível confirmar ${checkingErrorCount} roteiros agora. Verifique sua conexão.`}
                                </Text>
                            </View>
                        )}

                        {/* Cart items */}
                        {items.map((item, index) => (
                            <CartItemCard
                                key={item.id}
                                item={item}
                                index={index}
                                onPress={() => {
                                    if (item.status === 'available') {
                                        router.push(`/(tabs)/itinerary/${item.id}` as any);
                                    }
                                }}
                                onRemove={() => handleRemove(item)}
                            />
                        ))}

                        {/* Order summary */}
                        <OrderSummary items={availableItems} subtotal={subtotal} />

                        {/* Spacer for bottom sheet */}
                        <View style={{ height: 140 }} />
                    </Animated.View>
                </ScrollView>
            )}

            {/* ══════════ STICKY CHECKOUT BAR ══════════ */}
            {!loading && items.length > 0 && (
                <CheckoutBar
                    amount={checkoutAmount}
                    itemCount={checkoutCount}
                    onPress={handleCheckout}
                />
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
    const isInteractive = item.status === 'available';
    const cardAnim  = useRef(new Animated.Value(0)).current;
    const pressScale = useRef(new Animated.Value(1)).current;
    const [imageFailed, setImageFailed] = useState(false);

    useEffect(() => {
        Animated.timing(cardAnim, {
            toValue: 1, duration: 460, delay: index * 80, useNativeDriver: true,
        }).start();
    }, []);

    const onPressIn  = () => Animated.spring(pressScale, { toValue: 0.975, useNativeDriver: true, speed: 22 }).start();
    const onPressOut = () => Animated.spring(pressScale, { toValue: 1,     useNativeDriver: true, speed: 22 }).start();

    // Sempre numérico quando o dado existe — evita misturar "fim de semana"
    // com "7 dias" no mesmo carrinho. Só caímos no texto solto quando o
    // criador não preencheu duração.
    const durationLabel =
        item.duration <= 0
            ? 'duração a confirmar'
            : `${item.duration} ${item.duration === 1 ? 'dia' : 'dias'}`;
    const destinationLabel = [item.destination, item.country].filter(Boolean).join(', ') || 'Destino a confirmar';

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
                activeOpacity={isInteractive ? 1 : 0.95}
                onPress={onPress}
                onPressIn={isInteractive ? onPressIn : undefined}
                onPressOut={isInteractive ? onPressOut : undefined}
                disabled={!isInteractive}
            >
                <View style={[styles.card, !item.available && styles.cardDisabled]}>
                    {/* Thumbnail */}
                    <View style={styles.thumbWrapper}>
                        {(imageFailed || !getCoverImages(item)[0]) ? (
                            <View style={[styles.thumbImage, styles.thumbFallback]}>
                                <Ionicons name="map-outline" size={28} color="rgba(255,255,255,0.55)" />
                            </View>
                        ) : (
                            <Image
                                source={{ uri: getCoverImages(item)[0] }}
                                style={styles.thumbImage}
                                resizeMode="cover"
                                onError={() => setImageFailed(true)}
                            />
                        )}
                        <LinearGradient
                            colors={['transparent', 'rgba(26,50,99,0.45)']}
                            style={StyleSheet.absoluteFill}
                        />
                        {item.status === 'checking_error' && (
                            <View style={styles.unavailableBadge}>
                                <Ionicons name="cloud-offline-outline" size={11} color="#fff" />
                                <Text style={styles.unavailableBadgeText}>Verificando…</Text>
                            </View>
                        )}
                    </View>

                    {/* Content */}
                    <View style={styles.cardBody}>
                        <View style={styles.cardTopRow}>
                            {/* Title - padding direito reserva espaço pro botão X absoluto */}
                            <Text style={styles.cardTitle} numberOfLines={2}>
                                {item.title}
                            </Text>
                        </View>

                        {/* Meta row (oculta quando placeholder de indisponível) */}
                        {(item.destination || item.duration > 0) && (
                            <View style={styles.metaRow}>
                                <Ionicons name="location-outline" size={11} color={theme.colors.text.tertiary} />
                                <Text style={styles.metaText} numberOfLines={1}>{destinationLabel}</Text>
                                <View style={styles.metaDot} />
                                <Ionicons name="time-outline" size={11} color={theme.colors.text.tertiary} />
                                <Text style={styles.metaText}>{durationLabel}</Text>
                            </View>
                        )}

                        {/* Creator pill */}
                        {item.creator.name && item.creator.name !== '—' && (
                            <View style={styles.creatorPill}>
                                <CreatorAvatar avatar={item.creator.avatar} name={item.creator.name} size={20} />
                                <Text style={styles.creatorName} numberOfLines={1}>{item.creator.name}</Text>
                            </View>
                        )}

                        {/* Price row OR aviso de conexão (checking_error é transiente,
                            nunca "indisponível"/"já comprado" — esses casos somem
                            do carrinho automaticamente, ver useCart) */}
                        {item.available ? (
                            <View style={styles.priceRow}>
                                <Text style={styles.priceLabel}>
                                    {item.lifetimeAccess ? 'Acesso permanente' : 'Roteiro digital'}
                                </Text>
                                <Text style={styles.priceValue}>{formatPrice(item.price)}</Text>
                            </View>
                        ) : (
                            <View style={styles.unavailableReasonRow}>
                                <Ionicons name="alert-circle-outline" size={13} color={theme.colors.text.tertiary} />
                                <Text style={styles.unavailableReasonText} numberOfLines={2}>
                                    Não foi possível confirmar agora. Verifique sua conexão.
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>

            {/* Botão X fora do TouchableOpacity pai para nunca ser bloqueado por disabled */}
            <TouchableOpacity
                style={styles.removeBtn}
                onPress={onRemove}
                hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                activeOpacity={0.7}
                accessibilityLabel={`Remover ${item.title} do carrinho`}
            >
                <Ionicons name="close" size={14} color={theme.colors.text.tertiary} />
            </TouchableOpacity>
        </Animated.View>
    );
}

// ════════════════════════════════════════════════════════════════
//  ORDER SUMMARY
// ════════════════════════════════════════════════════════════════
function OrderSummary({ items, subtotal }: { items: CartItemData[]; subtotal: number }) {
    if (items.length === 0) {
        // Sem itens disponíveis — explicamos em vez de mostrar um resumo vazio.
        return (
            <View style={styles.summaryCard}>
                <View style={styles.summaryHeader}>
                    <Ionicons name="receipt" size={16} color={theme.colors.primary} />
                    <Text style={styles.summaryTitle}>Resumo do Pedido</Text>
                </View>
                <Text style={styles.summaryEmptyText}>
                    Nenhum roteiro disponível para compra agora. Remova os indisponíveis ou tente novamente mais tarde.
                </Text>
            </View>
        );
    }
    return (
        <View style={styles.summaryCard}>
            {/* Header */}
            <View style={styles.summaryHeader}>
                <Ionicons name="receipt" size={16} color={theme.colors.primary} />
                <Text style={styles.summaryTitle}>Resumo do Pedido</Text>
            </View>

            {/* Item lines — usa o título do roteiro, mantém o destino como subtexto */}
            {items.map((item, i) => {
                const destinationLabel = [item.destination, item.country].filter(Boolean).join(', ');
                return (
                    <View key={item.id} style={[styles.summaryRow, i === 0 && { marginTop: 4 }]}>
                        <View style={{ flex: 1, paddingRight: 8 }}>
                            <Text style={styles.summaryRowLabel} numberOfLines={2}>
                                {item.title}
                            </Text>
                            {destinationLabel ? (
                                <Text style={styles.summaryRowSub} numberOfLines={1}>{destinationLabel}</Text>
                            ) : null}
                        </View>
                        <Text style={styles.summaryRowValue}>{formatPrice(item.price)}</Text>
                    </View>
                );
            })}

            {/* Divider */}
            <View style={styles.summaryDivider} />

            {/* Total */}
            <View style={styles.summaryTotalRow}>
                <Text style={styles.summaryTotalLabel}>Total</Text>
                <View>
                    <Text style={styles.summaryTotalValue}>{formatPrice(subtotal)}</Text>
                    <Text style={styles.summaryTotalNote}>
                        {items.length} {items.length === 1 ? 'roteiro disponível' : 'roteiros disponíveis'}
                    </Text>
                </View>
            </View>

            {/* Trust note */}
            <View style={styles.trustRow}>
                <Ionicons name="shield-checkmark-outline" size={12} color={theme.colors.primary} />
                <Text style={styles.trustText}>
                    {items.length > 1
                        ? 'Checkout individual · compre um roteiro por vez'
                        : 'Pagamento seguro · acesso imediato após confirmação'}
                </Text>
            </View>
        </View>
    );
}

// ════════════════════════════════════════════════════════════════
//  CHECKOUT BAR (sticky bottom)
// ════════════════════════════════════════════════════════════════
function CheckoutBar({
    amount,
    itemCount,
    onPress,
}: {
    amount: number;
    itemCount: number;
    onPress: () => void;
}) {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const onIn  = () => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, speed: 20 }).start();
    const onOut = () => Animated.spring(scaleAnim, { toValue: 1,    useNativeDriver: true, speed: 20 }).start();

    const disabled = itemCount === 0;
    const buttonLabel = disabled
        ? 'Nenhum roteiro disponível'
        : itemCount === 1
        ? 'Comprar 1 roteiro'
        : `Comprar ${itemCount} roteiros`;

    return (
        <View style={styles.checkoutBar}>
            <Animated.View style={[styles.checkoutBarInner, { transform: [{ scale: scaleAnim }] }]}>
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={disabled ? undefined : onPress}
                    onPressIn={disabled ? undefined : onIn}
                    onPressOut={disabled ? undefined : onOut}
                    disabled={disabled}
                    accessibilityState={{ disabled }}
                >
                    <LinearGradient
                        colors={disabled ? ['#94A3B8', '#64748B'] : ['#28C9BF', '#1A3263']}
                        style={[styles.checkoutBtn, disabled && { opacity: 0.85 }]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        {/* Esquerda: ícone + label */}
                        <View style={styles.checkoutBtnLeft}>
                            <Ionicons name="lock-closed" size={18} color="#fff" />
                            <Text style={styles.checkoutBtnText} numberOfLines={1}>
                                {buttonLabel}
                            </Text>
                        </View>
                        {/* Direita: pill de preço com padding generoso */}
                        <View style={styles.checkoutPricePill}>
                            <Text style={styles.checkoutPriceText}>
                                {disabled ? formatMoney(0) : formatPrice(amount)}
                            </Text>
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
                {['Salvo na conta', 'Exporta em PDF', 'Compra segura'].map((label, i) => (
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
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: theme.colors.text.secondary,
    },

    // ── List ────────────────────────────────────────
    listContent: {
        paddingTop: 16,
        paddingHorizontal: 16,
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
    cardDisabled: {
        opacity: 0.6,
        backgroundColor: theme.colors.surfaceLight,
    },
    unavailableBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 999,
        backgroundColor: 'rgba(15, 23, 42, 0.78)',
    },
    unavailableBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#fff',
        textTransform: 'uppercase',
        letterSpacing: 0.4,
    },
    unavailableReasonRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 8,
    },
    unavailableReasonText: {
        flex: 1,
        fontSize: 12,
        fontStyle: 'italic',
        color: theme.colors.text.secondary,
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
    thumbFallback: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.secondary,
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
        paddingRight: 28,
    },
    cardTitle: {
        flex: 1,
        fontSize: 13.5,
        fontWeight: '700',
        color: theme.colors.text.primary,
        lineHeight: 18,
    },
    removeBtn: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: theme.colors.surfaceHighlight,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
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
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    summaryRowSub: {
        fontSize: 11,
        color: theme.colors.text.tertiary,
        marginTop: 2,
    },
    summaryRowValue: {
        fontSize: 13,
        fontWeight: '700',
        color: theme.colors.text.primary,
    },
    summaryEmptyText: {
        fontSize: 13,
        color: theme.colors.text.secondary,
        marginTop: 6,
        lineHeight: 18,
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
        // Barra de fundo full-width; conteúdo centralizado com padding lateral.
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: Platform.OS === 'ios' ? 34 : 20,
        paddingTop: 14,
        backgroundColor: 'rgba(255,255,255,0.96)',
        borderTopWidth: 1,
        borderTopColor: theme.colors.borderLight,
    },
    // Wrapper ocupa 100% das margens definidas acima.
    // No web/tablet limitamos a 600px para não esticar demais.
    checkoutBarInner: {
        width: '100%',
        maxWidth: 600,
    },
    checkoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: 24,
        paddingRight: 14,
        paddingVertical: 0,
        minHeight: 68,
        borderRadius: 22,
        ...theme.shadows.button,
    },
    // Grupo esquerdo: ícone + texto
    checkoutBtnLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
        marginRight: 12,
    },
    checkoutBtnText: {
        fontSize: 18,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: -0.3,
        flexShrink: 1,
    },
    checkoutPricePill: {
        backgroundColor: 'rgba(255,255,255,0.22)',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 999,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.35)',
        minWidth: 96,
        alignItems: 'center',
    },
    checkoutPriceText: {
        fontSize: 17,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: -0.2,
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
    secondaryCta: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        alignSelf: 'stretch',
        paddingVertical: 13,
        paddingHorizontal: 20,
        borderRadius: theme.borderRadius.lg,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: theme.colors.primary + '25',
        marginBottom: 12,
    },
    secondaryCtaText: {
        fontSize: 14,
        fontWeight: '800',
        color: theme.colors.primary,
    },
});
