import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    Pressable,
    ActivityIndicator,
    Platform,
    Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { safeBack } from '../../src/utils/navigation';
import { Ionicons } from '@expo/vector-icons';
import { getItineraryById, createCheckoutSession } from '../../src/services/api';
import { theme } from '../../src/theme/theme';
import { useAuth } from '../../src/contexts/AuthContext';
import { useCart } from '../../src/hooks/useCart';
import { formatMoney } from '@vamo/shared/itinerary';
import { features } from '../../src/config/features';

type PaymentMethod = 'apple' | 'pix' | 'card';

const getParam = (value: string | string[] | undefined): string => {
    if (Array.isArray(value)) return value[0] || '';
    return value || '';
};

const formatPrice = (value: number) => (
    value > 0 ? formatMoney(value) : 'Grátis'
);

const hasValidContactData = ({
    fullName,
    email,
    countryCode,
    phone,
}: {
    fullName: string;
    email: string;
    countryCode: string;
    phone: string;
}) => (
    fullName.trim().split(/\s+/).length >= 2
    && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim().toLowerCase())
    && countryCode.replace(/\D/g, '').length >= 1
    && phone.replace(/\D/g, '').length >= 8
);

export default function ItineraryPaymentScreen() {
    const router = useRouter();
    const { accessToken, isAuthenticated, isLoading: authLoading } = useAuth();
    const { removeFromCart } = useCart();
    const params = useLocalSearchParams();
    const itineraryId = getParam(params.itineraryId as string | string[] | undefined);
    const receivedPrice = getParam(params.price as string | string[] | undefined);
    const fullName = getParam(params.fullName as string | string[] | undefined);
    const email = getParam(params.email as string | string[] | undefined);
    const countryCode = getParam(params.countryCode as string | string[] | undefined);
    const phone = getParam(params.phone as string | string[] | undefined);
    const source = getParam(params.source as string | string[] | undefined);

    const [itinerary, setItinerary] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    useEffect(() => {
        if (authLoading) return;
        if (!isAuthenticated) {
            router.replace({
                pathname: '/login' as any,
                params: {
                    next: '/checkout/itinerary-payment',
                    ...(itineraryId ? { itineraryId } : {}),
                    ...(receivedPrice ? { price: receivedPrice } : {}),
                    ...(fullName ? { fullName } : {}),
                    ...(email ? { email } : {}),
                    ...(countryCode ? { countryCode } : {}),
                    ...(phone ? { phone } : {}),
                    ...(source ? { source } : {}),
                },
            });
        }
    }, [authLoading, isAuthenticated, itineraryId, receivedPrice, fullName, email, countryCode, phone, source, router]);

    useEffect(() => {
        let mounted = true;

        const loadItinerary = async () => {
            if (!itineraryId) {
                setLoadError('Roteiro inválido.');
                setLoading(false);
                return;
            }

            setLoading(true);
            setLoadError(null);
            try {
                const data = await getItineraryById(itineraryId);
                if (!mounted) return;
                if (!data) {
                    setItinerary(null);
                    setLoadError('Roteiro não encontrado ou indisponível.');
                    return;
                }
                setItinerary(data);
            } catch (error) {
                console.error('Error loading payment itinerary:', error);
                if (!mounted) return;
                setItinerary(null);
                setLoadError('Não foi possível carregar o pagamento.');
            } finally {
                if (mounted) setLoading(false);
            }
        };

        loadItinerary();
        return () => { mounted = false; };
    }, [itineraryId]);

    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
    const [summaryExpanded, setSummaryExpanded] = useState(true);

    const [processing, setProcessing] = useState(false);
    const [paymentError, setPaymentError] = useState<string | null>(null);
    const routePrice = Number(receivedPrice);
    const itineraryPrice = Number(itinerary?.price);
    const paymentAmount = Number.isFinite(itineraryPrice) && itineraryPrice >= 0
        ? itineraryPrice
        : Number.isFinite(routePrice) && routePrice >= 0
        ? routePrice
        : 0;
    const destinationLabel = [itinerary?.destination, itinerary?.country].filter(Boolean).join(', ') || 'Destino a confirmar';
    const duration = Number(itinerary?.duration) || 0;
    const rating = Number(itinerary?.rating) || 0;
    const reviewCount = Number(itinerary?.reviewCount) || 0;
    const hasContactData = hasValidContactData({ fullName, email, countryCode, phone });

    const handleConfirmPayment = async () => {
        if (processing) return;
        if (!itineraryId || !itinerary) {
            setPaymentError('Não foi possível identificar o roteiro desta compra.');
            return;
        }
        if (!hasContactData) {
            setPaymentError('Revise seus dados de contato antes de confirmar o pagamento.');
            return;
        }
        setProcessing(true);
        setPaymentError(null);
        try {
            console.log('[checkout] criando sessão Stripe', { itineraryId, paymentMethod });
            const result = await createCheckoutSession(
                itineraryId,
                { source, paymentMethod },
                accessToken,
            );

            // Grátis ou já comprado: backend liberou direto, sem cobrança.
            if (result.alreadyPurchased || result.freePurchase) {
                if (source === 'cart') {
                    await removeFromCart(itineraryId);
                }
                router.replace({
                    pathname: `/itinerary/${itineraryId}` as any,
                    params: { showSuccess: 'true' },
                });
                return;
            }

            if (!result.url) {
                throw new Error('Não foi possível iniciar o pagamento. Tente novamente.');
            }

            // Redireciona para o checkout hospedado do Stripe. Ao concluir,
            // o Stripe volta para /checkout/itinerary-confirm, que confirma o
            // pagamento no backend e libera o roteiro.
            console.log('[checkout] redirecionando para Stripe', result.sessionId);
            if (Platform.OS === 'web') {
                window.location.assign(result.url);
                // Mantém o spinner ativo enquanto o navegador troca de página.
                return;
            }
            await Linking.openURL(result.url);
            setProcessing(false);
        } catch (err: any) {
            const msg = err?.message || 'Não foi possível concluir a compra agora. Tente novamente.';
            console.warn('[checkout] erro:', msg);
            setPaymentError(msg);
            setProcessing(false);
        }
    };

    const selectPaymentMethod = (method: PaymentMethod) => {
        if (processing) return;
        setPaymentMethod(method);
        setPaymentError(null);
    };

    if (authLoading || loading) {
        return (
            <View style={styles.stateContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.stateTitle}>Carregando pagamento...</Text>
                <Text style={styles.stateText}>Buscando o roteiro e preparando o resumo da compra.</Text>
            </View>
        );
    }

    if (!itinerary) {
        return (
            <View style={styles.stateContainer}>
                <Ionicons name="alert-circle-outline" size={42} color={theme.colors.text.tertiary} />
                <Text style={styles.stateTitle}>{loadError || 'Pagamento indisponível'}</Text>
                <Text style={styles.stateText}>
                    Não foi possível continuar sem um roteiro válido.
                </Text>
                <TouchableOpacity style={styles.stateButton} onPress={() => router.replace('/(tabs)/itineraries' as any)}>
                    <Text style={styles.stateButtonText}>Explorar roteiros</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => safeBack(router, '/(tabs)/cart')} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color={theme.colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Pagamento</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                    <View style={styles.progressStep}>
                        <View style={[styles.stepCircle, styles.stepCircleCompleted]}>
                            <Ionicons name="checkmark" size={16} color={theme.colors.primary} />
                        </View>
                        <Text style={[styles.stepLabel, styles.stepLabelCompleted]}>Contato</Text>
                    </View>
                    <View style={[styles.progressConnector, styles.progressConnectorActive]} />
                    <View style={styles.progressStep}>
                        <View style={[styles.stepCircle, styles.stepCircleActive]}>
                            <Text style={styles.stepNumber}>2</Text>
                        </View>
                        <Text style={[styles.stepLabel, styles.stepLabelActive]}>Pagamento</Text>
                    </View>
                </View>

                {/* Payment Method */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Forma de pagamento</Text>

                    <View style={styles.securityBadge}>
                        <Ionicons name="lock-closed" size={16} color={theme.colors.primary} />
                        <Text style={styles.securityText}>
                            Pagamento seguro processado pela Stripe. Você será redirecionado para concluir a compra.
                        </Text>
                    </View>

                    <Pressable
                        style={[styles.paymentOption, paymentMethod === 'card' && styles.paymentOptionSelected]}
                        onPress={() => selectPaymentMethod('card')}
                        disabled={processing}
                    >
                        <View style={[styles.radio, paymentMethod === 'card' && styles.radioSelected]}>
                            {paymentMethod === 'card' && <View style={styles.radioDot} />}
                        </View>
                        <Text style={styles.paymentOptionText}>Cartão de débito ou crédito</Text>
                        <Ionicons name="card" size={20} color={theme.colors.text.tertiary} style={{ marginLeft: 'auto' }} />
                    </Pressable>

                    <Pressable
                        style={[styles.paymentOption, paymentMethod === 'apple' && styles.paymentOptionSelected]}
                        onPress={() => selectPaymentMethod('apple')}
                        disabled={processing}
                    >
                        <View style={[styles.radio, paymentMethod === 'apple' && styles.radioSelected]}>
                            {paymentMethod === 'apple' && <View style={styles.radioDot} />}
                        </View>
                        <Text style={styles.paymentOptionText}>Apple Pay</Text>
                        <Ionicons name="logo-apple" size={24} color={theme.colors.text.primary} style={{ marginLeft: 'auto' }} />
                    </Pressable>
                </View>

                {/* Review Details */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Revise os detalhes</Text>

                    {/* Contact Info */}
                    <View style={styles.reviewCard}>
                        <View style={styles.reviewCardHeader}>
                            <View>
                                <Text style={styles.reviewText}>{fullName}</Text>
                                <Text style={styles.reviewSubtext}>{email}</Text>
                                <Text style={styles.reviewSubtext}>{countryCode} {phone}</Text>
                            </View>
                            <TouchableOpacity onPress={() => safeBack(router, '/(tabs)/cart')}>
                                <Text style={styles.editButton}>✏️ Editar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Purchase Summary */}
                    <Pressable
                        style={styles.reviewCard}
                        onPress={() => setSummaryExpanded(!summaryExpanded)}
                    >
                        <View style={styles.reviewCardHeader}>
                            <View>
                                <Text style={styles.reviewTitle}>Resumo da compra</Text>
                                <Text style={styles.reviewSubtext}>1 roteiro digital</Text>
                            </View>
                            <Ionicons
                                name={summaryExpanded ? 'chevron-up' : 'chevron-down'}
                                size={20}
                                color={theme.colors.text.tertiary}
                            />
                        </View>

                        {summaryExpanded && (
                            <View style={styles.summaryExpandedContent}>
                                <Text style={styles.itineraryTitle}>{itinerary.title}</Text>
                                <View style={styles.rating}>
                                    <Ionicons name="star" size={14} color="#F59E0B" />
                                    <Text style={styles.ratingText}>{rating.toFixed(1)} ({reviewCount})</Text>
                                </View>

                                <View style={styles.detailsGrid}>
                                    <View style={styles.detailRow}>
                                        <Ionicons name="location" size={16} color={theme.colors.text.secondary} />
                                        <Text style={styles.detailText}>
                                            {destinationLabel}
                                        </Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Ionicons name="calendar" size={16} color={theme.colors.text.secondary} />
                                        <Text style={styles.detailText}>
                                            {duration > 0 ? `${duration} dias de viagem` : 'Duração a confirmar'}
                                        </Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
                                        <Text style={[styles.detailText, { color: theme.colors.success }]}>
                                            Liberação em Meus Roteiros após confirmação
                                        </Text>
                                    </View>
                                </View>

                                <Text style={styles.totalInSummary}>
                                    {formatPrice(paymentAmount)}
                                </Text>
                            </View>
                        )}
                    </Pressable>
                </View>

                {/* Reforço discreto: experiência interativa pós-compra */}
                {features.interactivePurchasedRouteEnabled && (
                    <View style={styles.postPurchaseHint}>
                        <Ionicons name="map-outline" size={18} color={theme.colors.primary} />
                        <Text style={styles.postPurchaseHintText}>
                            Depois da compra, o roteiro fica disponível em Meus Roteiros com sua
                            central de viagem: documentos, checklist e versão personalizada.
                        </Text>
                    </View>
                )}

                <View style={{ height: 220 }} />
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                <View style={styles.totalSection}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalPrice}>{formatPrice(paymentAmount)}</Text>
                    <Text style={styles.taxIncluded}>Todos os impostos e taxas inclusos</Text>
                </View>

                {!hasContactData && (
                    <View style={styles.errorBox}>
                        <Ionicons name="alert-circle" size={16} color={theme.colors.error} />
                        <Text style={styles.errorBoxText}>
                            Dados de contato incompletos. Volte para revisar antes de pagar.
                        </Text>
                    </View>
                )}

                <Text style={styles.terms}>
                    Ao prosseguir, você confirma estar de acordo com os{' '}
                    <Text style={styles.link}>Termos e condições</Text>.
                </Text>

                {paymentError && (
                    <View style={styles.errorBox}>
                        <Ionicons name="alert-circle" size={16} color={theme.colors.error} />
                        <Text style={styles.errorBoxText}>{paymentError}</Text>
                    </View>
                )}

                {paymentMethod === 'apple' && (
                    <TouchableOpacity
                        style={[styles.applePayButton, processing && { opacity: 0.6 }]}
                        onPress={handleConfirmPayment}
                        disabled={processing}
                        activeOpacity={0.85}
                    >
                        {processing ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="logo-apple" size={24} color="#fff" />
                                <Text style={styles.applePayText}>Pagar com Apple Pay</Text>
                            </>
                        )}
                    </TouchableOpacity>
                )}

                {paymentMethod !== 'apple' && (
                    <TouchableOpacity
                        style={[styles.confirmButton, processing && { opacity: 0.6 }]}
                        onPress={handleConfirmPayment}
                        disabled={processing}
                        activeOpacity={0.85}
                    >
                        {processing ? (
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                <ActivityIndicator color="#fff" />
                                <Text style={styles.confirmButtonText}>Processando...</Text>
                            </View>
                        ) : (
                            <Text style={styles.confirmButtonText}>
                                {paymentAmount > 0 ? `Pagar ${formatPrice(paymentAmount)}` : 'Resgatar grátis'}
                            </Text>
                        )}
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    backButton: { width: 40 },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    scrollView: { flex: 1 },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 24,
        paddingHorizontal: 60,
    },
    progressStep: { alignItems: 'center' },
    stepCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: theme.colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
        borderWidth: 2,
        borderColor: theme.colors.border,
    },
    stepCircleCompleted: {
        backgroundColor: theme.colors.background,
        borderColor: theme.colors.primary,
    },
    stepCircleActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    stepNumber: { color: '#fff', fontSize: 14, fontWeight: '600' },
    stepLabel: { fontSize: 13, color: theme.colors.text.secondary },
    stepLabelCompleted: { color: theme.colors.primary, fontWeight: '500' },
    stepLabelActive: { color: theme.colors.text.primary, fontWeight: '600' },
    progressConnector: {
        flex: 1,
        height: 2,
        backgroundColor: theme.colors.border,
        marginHorizontal: 12,
        marginBottom: 28,
    },
    progressConnectorActive: { backgroundColor: theme.colors.primary },
    section: {
        paddingHorizontal: 16,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: 16,
    },
    securityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 16,
    },
    securityText: { color: theme.colors.primary, fontSize: 14 },
    paymentOption: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 16,
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 2,
        borderColor: theme.colors.border,
    },
    paymentOptionSelected: { borderColor: theme.colors.primary },
    radio: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: theme.colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioSelected: { borderColor: theme.colors.primary },
    radioDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: theme.colors.primary,
    },
    paymentOptionText: { fontSize: 16, color: theme.colors.text.primary, fontWeight: '500' },
    pixBadge: { fontSize: 24 },
    reviewCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    reviewCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    reviewTitle: { fontSize: 16, fontWeight: '600', color: theme.colors.text.primary },
    reviewText: { fontSize: 15, color: theme.colors.text.primary, fontWeight: '500' },
    reviewSubtext: { fontSize: 14, color: theme.colors.text.secondary, marginTop: 4 },
    editButton: { fontSize: 14, color: theme.colors.primary },
    postPurchaseHint: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        backgroundColor: 'rgba(40, 201, 191, 0.08)',
        borderRadius: 12,
        padding: 14,
        marginTop: 16,
        borderLeftWidth: 3,
        borderLeftColor: theme.colors.primary,
    },
    postPurchaseHintText: {
        flex: 1,
        fontSize: 12.5,
        color: theme.colors.text.primary,
        lineHeight: 17,
    },
    summaryExpandedContent: { marginTop: 16, gap: 12 },
    itineraryTitle: { fontSize: 16, fontWeight: '600', color: theme.colors.text.primary },
    rating: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    ratingText: { fontSize: 13, color: theme.colors.text.secondary, fontWeight: '600' },
    detailsGrid: { gap: 8 },
    detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    detailText: { fontSize: 14, color: theme.colors.text.secondary },
    totalInSummary: { fontSize: 18, fontWeight: '700', color: theme.colors.text.primary, marginTop: 8 },
    footer: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 24,
        backgroundColor: theme.colors.surface,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },
    totalSection: { marginBottom: 12 },
    totalLabel: { fontSize: 14, color: theme.colors.text.secondary },
    totalPrice: { fontSize: 26, fontWeight: '700', color: theme.colors.text.primary, marginTop: 4 },
    taxIncluded: { fontSize: 13, color: theme.colors.primary, marginTop: 4 },
    terms: { fontSize: 12, color: theme.colors.text.secondary, lineHeight: 16, marginBottom: 16 },
    link: { color: theme.colors.primary },
    applePayButton: {
        backgroundColor: '#000',
        paddingVertical: 14,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    applePayText: { color: '#fff', fontSize: 18, fontWeight: '600' },
    confirmButton: {
        backgroundColor: theme.colors.primary,
        paddingVertical: 16,
        borderRadius: 10,
    },
    confirmButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '700',
        textAlign: 'center',
    },
    errorText: { color: theme.colors.text.primary, fontSize: 16, textAlign: 'center', marginTop: 40 },
    stateContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 28,
        backgroundColor: theme.colors.background,
    },
    stateTitle: {
        marginTop: 14,
        fontSize: 18,
        fontWeight: '800',
        color: theme.colors.text.primary,
        textAlign: 'center',
    },
    stateText: {
        marginTop: 8,
        fontSize: 14,
        lineHeight: 20,
        color: theme.colors.text.secondary,
        textAlign: 'center',
    },
    stateButton: {
        marginTop: 22,
        minHeight: 44,
        paddingHorizontal: 18,
        borderRadius: 999,
        backgroundColor: theme.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stateButtonText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#fff',
    },
    errorBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 10,
        marginBottom: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.colors.error + '55',
        backgroundColor: theme.colors.error + '10',
    },
    errorBoxText: { flex: 1, fontSize: 12, color: theme.colors.error, lineHeight: 16 },
});
