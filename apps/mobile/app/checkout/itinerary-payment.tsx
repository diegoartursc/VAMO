import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    Pressable,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getItineraryById, purchaseItinerary } from '../../src/services/api';
import { theme } from '../../src/theme/theme';
import { useState as useStateModal } from 'react';
import { useAuth } from '../../src/contexts/AuthContext';

export default function ItineraryPaymentScreen() {
    const router = useRouter();
    const { accessToken } = useAuth();
    const {
        itineraryId,
        price,
        fullName,
        email,
        countryCode,
        phone,
    } = useLocalSearchParams();

    const [itinerary, setItinerary] = useState<any>(null);

    useEffect(() => {
        getItineraryById(itineraryId as string).then(setItinerary).catch(console.error);
    }, [itineraryId]);

    const [paymentMethod, setPaymentMethod] = useState<'apple' | 'pix' | 'card'>('pix');
    const [summaryExpanded, setSummaryExpanded] = useState(true);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const [processing, setProcessing] = useState(false);
    const [paymentError, setPaymentError] = useState<string | null>(null);

    const handleConfirmPayment = async () => {
        if (processing) return;
        setProcessing(true);
        setPaymentError(null);
        try {
            console.log('[purchase] iniciando', { itineraryId, paymentMethod });
            // Record the purchase. Sends JWT so the sale is attributed to the
            // authenticated traveler (não cai no dev-fallback do backend).
            const result = await purchaseItinerary(itineraryId as string, paymentMethod, accessToken);
            console.log('[purchase] sucesso', result);

            // Redireciona direto para a tela do roteiro com `showSuccess=true`.
            // O PurchaseSuccessModal já existente na tela de detalhes captura
            // o param e mostra a confirmação ("Compra Realizada"). Evita
            // Alert.alert, que tem limitações no Expo web e pode parecer
            // travado pro usuário. Funciona pros dois casos: nova compra OU
            // compra já existente (o usuário tem acesso ao roteiro em ambos).
            router.replace({
                pathname: `/itinerary/${itineraryId}` as any,
                params: { showSuccess: 'true' },
            });
        } catch (err: any) {
            const msg = err?.message || 'Não foi possível concluir a compra agora. Tente novamente.';
            console.warn('[purchase] erro:', msg);
            setPaymentError(msg);
        } finally {
            setProcessing(false);
        }
    };

    if (!itinerary) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>Carregando...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
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
                        <Text style={styles.securityText}>Todos os pagamentos são criptografados e seguros</Text>
                    </View>

                    <Pressable
                        style={[styles.paymentOption, paymentMethod === 'pix' && styles.paymentOptionSelected]}
                        onPress={() => setPaymentMethod('pix')}
                    >
                        <View style={[styles.radio, paymentMethod === 'pix' && styles.radioSelected]}>
                            {paymentMethod === 'pix' && <View style={styles.radioDot} />}
                        </View>
                        <Text style={styles.paymentOptionText}>PIX</Text>
                        <Text style={[styles.pixBadge, { marginLeft: 'auto' }]}>🔷</Text>
                    </Pressable>

                    <Pressable
                        style={[styles.paymentOption, paymentMethod === 'card' && styles.paymentOptionSelected]}
                        onPress={() => setPaymentMethod('card')}
                    >
                        <View style={[styles.radio, paymentMethod === 'card' && styles.radioSelected]}>
                            {paymentMethod === 'card' && <View style={styles.radioDot} />}
                        </View>
                        <Text style={styles.paymentOptionText}>Cartão de débito ou crédito</Text>
                        <Ionicons name="card" size={20} color={theme.colors.text.tertiary} style={{ marginLeft: 'auto' }} />
                    </Pressable>

                    <Pressable
                        style={[styles.paymentOption, paymentMethod === 'apple' && styles.paymentOptionSelected]}
                        onPress={() => setPaymentMethod('apple')}
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
                            <TouchableOpacity onPress={() => router.back()}>
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
                                    <Text>⭐ {itinerary.rating} ({itinerary.reviewCount})</Text>
                                </View>

                                <View style={styles.detailsGrid}>
                                    <View style={styles.detailRow}>
                                        <Ionicons name="location" size={16} color={theme.colors.text.secondary} />
                                        <Text style={styles.detailText}>
                                            {itinerary.destination}, {itinerary.country}
                                        </Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Ionicons name="calendar" size={16} color={theme.colors.text.secondary} />
                                        <Text style={styles.detailText}>
                                            {itinerary.duration} dias de viagem
                                        </Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Ionicons name="download" size={16} color={theme.colors.success} />
                                        <Text style={[styles.detailText, { color: theme.colors.success }]}>
                                            Acesso imediato após compra
                                        </Text>
                                    </View>
                                </View>

                                <Text style={styles.totalInSummary}>
                                    R$ {parseFloat(price as string).toFixed(2).replace('.', ',')}
                                </Text>
                            </View>
                        )}
                    </Pressable>
                </View>

                <View style={{ height: 220 }} />
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                <View style={styles.totalSection}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalPrice}>R$ {parseFloat(price as string).toFixed(2).replace('.', ',')}</Text>
                    <Text style={styles.taxIncluded}>Todos os impostos e taxas inclusos</Text>
                </View>

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
                                <Text style={styles.applePayText}>Pay</Text>
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
                            <Text style={styles.confirmButtonText}>Confirmar pagamento</Text>
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
    summaryExpandedContent: { marginTop: 16, gap: 12 },
    itineraryTitle: { fontSize: 16, fontWeight: '600', color: theme.colors.text.primary },
    rating: { flexDirection: 'row', gap: 8, alignItems: 'center' },
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
