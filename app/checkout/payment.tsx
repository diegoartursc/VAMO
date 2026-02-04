import React, { useState } from 'react';
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
import { getPackageById } from '../../src/data/mockPackages';

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
    } = useLocalSearchParams();

    const packageData = getPackageById(packageId as string);
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
        Alert.alert(
            'Processando pagamento...',
            `Método: ${paymentMethod.toUpperCase()}`,
            [{
                text: 'OK', onPress: () => {
                    // Navega para confirmação
                    router.push({
                        pathname: `/booking-confirmed` as any,
                        params: {
                            packageId,
                            bookingId: `BK${Date.now()}`,
                            fullName,
                            email,
                        },
                    });
                }
            }]
        );
    };

    if (!packageData) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>Pacote não encontrado</Text>
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
                                Efetuaremos a cobrança em seu cartão em seg., mar. 9
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
                                </View>

                                <Text style={styles.totalInSummary}>
                                    R$ {parseFloat(totalPrice as string).toLocaleString('pt-BR')}
                                </Text>
                            </View>
                        )}
                    </Pressable>
                </View>

                {/* Promo Code */}
                <TouchableOpacity style={styles.promoButton}>
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
                    <Text style={styles.totalPrice}>R$ {parseFloat(totalPrice as string).toLocaleString('pt-BR')}</Text>
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
                    <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmPayment}>
                        <Text style={styles.confirmButtonText}>Confirmar pagamento</Text>
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a1a',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#3a3a3a',
    },
    backButton: { width: 40 },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
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
        backgroundColor: '#3a3a3a',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    stepCircleCompleted: {
        backgroundColor: '#1a1a1a',
        borderWidth: 2,
        borderColor: '#14b8a6',
    },
    stepCircleActive: { backgroundColor: '#14b8a6' },
    stepNumber: { color: '#fff', fontSize: 14, fontWeight: '600' },
    stepLabel: { fontSize: 13, color: '#999' },
    stepLabelCompleted: { color: '#14b8a6', fontWeight: '500' },
    stepLabelActive: { color: '#fff', fontWeight: '600' },
    progressConnector: {
        flex: 1,
        height: 2,
        backgroundColor: '#3a3a3a',
        marginHorizontal: 12,
        marginBottom: 28,
    },
    progressConnectorActive: { backgroundColor: '#14b8a6' },
    section: {
        paddingHorizontal: 16,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 16,
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
        backgroundColor: '#2a2a2a',
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 2,
        borderColor: '#3a3a3a',
    },
    optionSelected: { borderColor: '#14b8a6' },
    radio: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#666',
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioSelected: { borderColor: '#14b8a6' },
    radioDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#14b8a6',
    },
    optionText: { fontSize: 16, color: '#fff', fontWeight: '500' },
    optionSubtext: { fontSize: 14, color: '#999', marginTop: 4 },
    paymentOption: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 16,
        backgroundColor: '#2a2a2a',
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 2,
        borderColor: '#3a3a3a',
    },
    paymentOptionSelected: { borderColor: '#14b8a6' },
    paymentOptionText: { fontSize: 16, color: '#fff', fontWeight: '500' },
    pixBadge: { fontSize: 24 },
    reviewCard: {
        backgroundColor: '#2a2a2a',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#3a3a3a',
    },
    reviewCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    reviewTitle: { fontSize: 16, fontWeight: '600', color: '#fff' },
    reviewText: { fontSize: 15, color: '#fff', fontWeight: '500' },
    reviewSubtext: { fontSize: 14, color: '#999', marginTop: 4 },
    editButton: { fontSize: 14, color: '#14b8a6' },
    summaryExpandedContent: { marginTop: 16, gap: 12 },
    packageTitle: { fontSize: 16, fontWeight: '600', color: '#fff' },
    rating: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    badge: { fontSize: 13, color: '#999' },
    detailsGrid: { gap: 8 },
    detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    detailText: { fontSize: 14, color: '#ccc' },
    totalInSummary: { fontSize: 18, fontWeight: '700', color: '#fff', marginTop: 8 },
    promoButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 16,
        marginHorizontal: 16,
        backgroundColor: '#2a2a2a',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#3a3a3a',
    },
    promoButtonText: { flex: 1, fontSize: 15, color: '#fff' },
    footer: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 24,
        backgroundColor: '#2a2a2a',
        borderTopWidth: 1,
        borderTopColor: '#3a3a3a',
    },
    totalSection: { marginBottom: 12 },
    totalLabel: { fontSize: 14, color: '#999' },
    totalPrice: { fontSize: 26, fontWeight: '700', color: '#fff', marginTop: 4 },
    taxIncluded: { fontSize: 13, color: '#14b8a6', marginTop: 4 },
    policyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    policyText: { fontSize: 14, color: '#ccc' },
    terms: { fontSize: 12, color: '#999', lineHeight: 16, marginBottom: 16 },
    link: { color: '#14b8a6' },
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
        backgroundColor: '#14b8a6',
        paddingVertical: 16,
        borderRadius: 10,
    },
    confirmButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '700',
        textAlign: 'center',
    },
    errorText: { color: '#fff', fontSize: 16, textAlign: 'center', marginTop: 40 },
});
