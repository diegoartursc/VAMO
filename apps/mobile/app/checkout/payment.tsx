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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getPackageById } from '../../src/services/api';
import { theme } from '../../src/theme/theme';
import { formatMoney } from '@vamo/shared/itinerary';

export default function CheckoutPaymentScreen() {
    const router = useRouter();
    const {
        packageId,
        date,
        time,
        adults,
        children,
        optionId,
        totalPrice,
        fullName,
        email,
        countryCode,
        phone,
        originCity,
        checkedBags,
    } = useLocalSearchParams();

    const [packageData, setPackageData] = useState<any>(null);

    useEffect(() => {
        getPackageById(packageId as string).then(setPackageData).catch(console.error);
    }, [packageId]);
    const selectedDate = new Date(date as string);

    const [paymentTiming, setPaymentTiming] = useState<'now' | 'later'>('now');
    const [paymentMethod, setPaymentMethod] = useState<'apple' | 'pix' | 'card' | 'paypal'>('apple');
    const [summaryExpanded, setSummaryExpanded] = useState(true);
    const [promoCode, setPromoCode] = useState('');

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('pt-BR', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const handleConfirmPayment = () => {
        // Navigate to awaiting quote screen
        router.push({
            pathname: '/booking-awaiting-quote',
            params: {
                packageId: packageId as string,
                bookingId: `VAMO-${Date.now().toString(36).toUpperCase()}`,
                fullName: fullName as string,
                email: email as string,
                totalPrice: totalPrice as string,
                date: date as string,
                adults: adults as string,
                children: children as string,
                paymentMethod: paymentMethod as string,
                originCity: originCity as string,
                checkedBags: checkedBags as string,
            },
        } as any);
    };

    if (!packageData) {
        return (
            <View style={[styles.container, styles.loadingContainer]}>
                <Ionicons name="airplane" size={48} color={theme.colors.primary} />
                <Text style={styles.loadingText}>Preparando seu pedido...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Pedido</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                    <View style={styles.progressStep}>
                        <View style={[styles.stepCircle, styles.stepCircleCompleted]}>
                            <Ionicons name="checkmark" size={16} color="#14b8a6" />
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


                {/* Payment Timing */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quando você prefere pagar?</Text>

                    <Pressable
                        style={[styles.option, paymentTiming === 'now' && styles.optionSelected]}
                        onPress={() => setPaymentTiming('now')}
                    >
                        <View style={[styles.radio, paymentTiming === 'now' && styles.radioSelected]}>
                            {paymentTiming === 'now' && <View style={styles.radioDot} />}
                        </View>
                        <Text style={styles.optionText}>Pagar agora</Text>
                    </Pressable>

                    <Pressable
                        style={[styles.option, paymentTiming === 'later' && styles.optionSelected]}
                        onPress={() => setPaymentTiming('later')}
                    >
                        <View style={[styles.radio, paymentTiming === 'later' && styles.radioSelected]}>
                            {paymentTiming === 'later' && <View style={styles.radioDot} />}
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.optionText}>Pagar depois</Text>
                            <Text style={styles.optionSubtext}>
                                Efetuaremos a cobrança em seu cartão em{' '}
                                {(() => {
                                    const d = new Date();
                                    d.setDate(d.getDate() + 3);
                                    return d.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' });
                                })()}
                            </Text>
                        </View>
                    </Pressable>
                </View>

                {/* Payment Method */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Forma de pagamento</Text>

                    <View style={styles.securityBadge}>
                        <Ionicons name="lock-closed" size={16} color="#14b8a6" />
                        <Text style={styles.securityText}>Todos os pagamentos são criptografados e seguros</Text>
                    </View>

                    <Pressable
                        style={[styles.paymentOption, paymentMethod === 'apple' && styles.paymentOptionSelected]}
                        onPress={() => setPaymentMethod('apple')}
                    >
                        <View style={[styles.radio, paymentMethod === 'apple' && styles.radioSelected]}>
                            {paymentMethod === 'apple' && <View style={styles.radioDot} />}
                        </View>
                        <Text style={styles.paymentOptionText}>Apple Pay</Text>
                        <Ionicons name="logo-apple" size={24} color="#fff" style={{ marginLeft: 'auto' }} />
                    </Pressable>

                    <Pressable
                        style={[styles.paymentOption, paymentMethod === 'card' && styles.paymentOptionSelected]}
                        onPress={() => setPaymentMethod('card')}
                    >
                        <View style={[styles.radio, paymentMethod === 'card' && styles.radioSelected]}>
                            {paymentMethod === 'card' && <View style={styles.radioDot} />}
                        </View>
                        <Text style={styles.paymentOptionText}>Cartão de débito ou crédito</Text>
                        <Ionicons name="card" size={20} color="#999" style={{ marginLeft: 'auto' }} />
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

                    {/* Booking Summary */}
                    <Pressable
                        style={styles.reviewCard}
                        onPress={() => setSummaryExpanded(!summaryExpanded)}
                    >
                        <View style={styles.reviewCardHeader}>
                            <View>
                                <Text style={styles.reviewTitle}>Resumo da solicitação de reserva</Text>
                                <Text style={styles.reviewSubtext}>1 atividade</Text>
                            </View>
                            <Ionicons
                                name={summaryExpanded ? 'chevron-up' : 'chevron-down'}
                                size={20}
                                color="#999"
                            />
                        </View>

                        {summaryExpanded && (
                            <View style={styles.summaryExpandedContent}>
                                <Text style={styles.packageTitle}>{packageData.title}</Text>
                                <View style={styles.rating}>
                                    <Text>⭐ {packageData.rating} ({packageData.reviewCount})</Text>
                                    <Text style={styles.badge}>💗 Melhores avaliações</Text>
                                </View>

                                <View style={styles.detailsGrid}>
                                    <View style={styles.detailRow}>
                                        <Ionicons name="calendar" size={16} color="#999" />
                                        <Text style={styles.detailText}>
                                            {formatDate(selectedDate)} • {time}
                                        </Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Ionicons name="people" size={16} color="#999" />
                                        <Text style={styles.detailText}>
                                            {adults} Adultos{parseInt(children as string) > 0 && `, ${children} Crianças`}
                                        </Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Ionicons name="checkmark-circle" size={16} color="#14b8a6" />
                                        <Text style={[styles.detailText, { color: '#14b8a6' }]}>
                                            Cancelamento gratuito
                                        </Text>
                                    </View>
                                    
                                    {checkedBags ? (
                                        <View style={styles.detailRow}>
                                            <Ionicons name="bag" size={16} color="#999" />
                                            <Text style={styles.detailText}>
                                                {checkedBags === '0' ? 'Sem bagagem despachada (só de mão)' : `${checkedBags} bagagem(ns) despachada(s) de 23kg`}
                                            </Text>
                                        </View>
                                    ) : null}
                                </View>

                                <Text style={styles.totalInSummary}>
                                    {formatMoney(parseFloat(totalPrice as string))}
                                </Text>
                            </View>
                        )}
                    </Pressable>
                </View>

                {/* Promo Code */}
                <TouchableOpacity
                    style={styles.promoButton}
                    onPress={() => {
                        Alert.alert(
                            '🏷️ Código Promocional',
                            'Entre em contato com a agência para obter códigos promocionais ou vales-presente.\n\nEsta funcionalidade será disponibilizada em breve!',
                            [{ text: 'Entendi' }]
                        );
                    }}
                >
                    <Ionicons name="pricetag" size={18} color="#14b8a6" />
                    <Text style={styles.promoButtonText}>Inserir código promocional ou vale-presente</Text>
                    <Ionicons name="chevron-forward" size={18} color="#999" />
                </TouchableOpacity>

                <View style={{ height: 220 }} />
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                <View style={styles.totalSection}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalPrice}>{formatMoney(parseFloat(totalPrice as string))}</Text>
                    <Text style={styles.taxIncluded}>Todos os impostos e taxas inclusos</Text>
                </View>

                <View style={styles.policyRow}>
                    <Ionicons name="checkmark-circle" size={18} color="#14b8a6" />
                    <Text style={styles.policyText}>Cancelamento gratuito</Text>
                </View>

                <Text style={styles.terms}>
                    Ao prosseguir, você confirma estar de acordo com os{' '}
                    <Text style={styles.link}>Termos e condições</Text>.
                </Text>

                {paymentMethod === 'apple' && (
                    <TouchableOpacity style={styles.applePayButton} onPress={handleConfirmPayment}>
                        <Ionicons name="logo-apple" size={24} color="#fff" />
                        <Text style={styles.applePayText}>Pay</Text>
                    </TouchableOpacity>
                )}

                {paymentMethod !== 'apple' && (
                    <Pressable
                        style={({ pressed }) => [
                            styles.confirmButton,
                            pressed && { opacity: 0.8 }
                        ]}
                        onPress={handleConfirmPayment}
                    >
                        <Text style={styles.confirmButtonText}>
                            Confirmar pagamento
                        </Text>
                    </Pressable>
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
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
    },
    loadingText: {
        fontSize: 16,
        color: theme.colors.text.secondary,
        fontWeight: '500',
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
        fontWeight: '700',
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
        backgroundColor: theme.colors.surfaceLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    stepCircleCompleted: {
        backgroundColor: theme.colors.background,
        borderWidth: 2,
        borderColor: theme.colors.primary,
    },
    stepCircleActive: { backgroundColor: theme.colors.primary },
    stepNumber: { color: theme.colors.text.inverse, fontSize: 14, fontWeight: '700' },
    stepLabel: { fontSize: 13, color: theme.colors.text.tertiary },
    stepLabelCompleted: { color: theme.colors.primary, fontWeight: '600' },
    stepLabelActive: { color: theme.colors.text.primary, fontWeight: '700' },
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
        fontSize: 18,
        fontWeight: '800',
        color: theme.colors.text.primary,
        marginBottom: 16,
        letterSpacing: -0.5,
    },
    securityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 16,
    },
    securityText: { color: '#14b8a6', fontSize: 14 },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 16,
        backgroundColor: theme.colors.surfaceLight,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1.5,
        borderColor: theme.colors.border,
    },
    optionSelected: { borderColor: theme.colors.primary, backgroundColor: `${theme.colors.primary}05` },
    radio: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#666',
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
    optionText: { fontSize: 16, color: theme.colors.text.primary, fontWeight: '600' },
    optionSubtext: { fontSize: 14, color: theme.colors.text.secondary, marginTop: 4 },
    paymentOption: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 16,
        backgroundColor: theme.colors.surfaceLight,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1.5,
        borderColor: theme.colors.border,
    },
    paymentOptionSelected: { borderColor: theme.colors.primary, backgroundColor: `${theme.colors.primary}05` },
    paymentOptionText: { fontSize: 16, color: theme.colors.text.primary, fontWeight: '600' },
    pixBadge: { fontSize: 24 },
    reviewCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: theme.colors.border,
        ...theme.shadows.small,
    },
    reviewCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    reviewTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.text.primary },
    reviewText: { fontSize: 15, color: theme.colors.text.primary, fontWeight: '600' },
    reviewSubtext: { fontSize: 14, color: theme.colors.text.secondary, marginTop: 4 },
    editButton: { fontSize: 14, color: theme.colors.primary, fontWeight: '600' },
    summaryExpandedContent: { marginTop: 16, gap: 12 },
    packageTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.text.primary },
    rating: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    badge: { fontSize: 13, color: theme.colors.text.tertiary },
    detailsGrid: { gap: 8 },
    detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    detailText: { fontSize: 14, color: theme.colors.text.secondary },
    totalInSummary: { fontSize: 18, fontWeight: '800', color: theme.colors.text.primary, marginTop: 8 },
    promoButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 16,
        marginHorizontal: 16,
        backgroundColor: theme.colors.surfaceLight,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    promoButtonText: { flex: 1, fontSize: 15, color: theme.colors.text.primary, fontWeight: '500' },
    footer: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 24,
        backgroundColor: theme.colors.surface,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        ...theme.shadows.large,
    },
    totalSection: { marginBottom: 12 },
    totalLabel: { fontSize: 14, color: theme.colors.text.tertiary },
    totalPrice: { fontSize: 26, fontWeight: '800', color: theme.colors.text.primary, marginTop: 4 },
    taxIncluded: { fontSize: 13, color: theme.colors.success, fontWeight: '600', marginTop: 4 },
    policyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    policyText: { fontSize: 14, color: theme.colors.text.secondary },
    terms: { fontSize: 12, color: theme.colors.text.tertiary, lineHeight: 16, marginBottom: 16 },
    link: { color: theme.colors.primary, fontWeight: '600' },
    applePayButton: {
        backgroundColor: '#000',
        paddingVertical: 14,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    applePayText: { color: '#fff', fontSize: 18, fontWeight: '700' },
    confirmButton: {
        backgroundColor: theme.colors.primary,
        paddingVertical: 16,
        borderRadius: 14,
        ...theme.shadows.button,
    },
    confirmButtonText: {
        color: theme.colors.text.onPrimary,
        fontSize: 17,
        fontWeight: '800',
        textAlign: 'center',
    },
    errorText: { color: theme.colors.text.secondary, fontSize: 16, textAlign: 'center', marginTop: 40 },
});
