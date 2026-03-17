import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    TextInput,
    Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getPackageById } from '../../src/services/api';
import { theme } from '../../src/theme/theme';

// Mock user data for auto-fill
const USER = {
    name: 'Usuário VAMO',
    email: 'usuario@email.com',
    phone: '(11) 99999-9999',
};

export default function CheckoutContactScreen() {
    const router = useRouter();
    const { packageId, date, time, adults, children, optionId, totalPrice } = useLocalSearchParams<{
        packageId: string;
        date: string;
        time: string;
        adults: string;
        children: string;
        optionId: string;
        totalPrice: string;
    }>();

    const [packageData, setPackageData] = useState<any>(null);

    useEffect(() => {
        getPackageById(packageId!).then(setPackageData).catch(console.error);
    }, [packageId]);
    const selectedDate = new Date(date!);
    const [timeRemaining, setTimeRemaining] = useState(20 * 60); // 20 minutes

    // Form states
    const [fullName, setFullName] = useState(USER.name);
    const [email, setEmail] = useState(USER.email);
    const [countryCode, setCountryCode] = useState('+55');
    const [phone, setPhone] = useState(USER.phone);
    const [summaryExpanded, setSummaryExpanded] = useState(false);

    // Timer countdown
    useEffect(() => {
        const interval = setInterval(() => {
            setTimeRemaining((prev) => {
                if (prev <= 0) {
                    clearInterval(interval);
                    alert('Tempo esgotado! Sua reserva expirou.');
                    router.back();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('pt-BR', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const handleContinue = () => {
        if (!fullName || !email || !phone) {
            alert('Por favor, preencha todos os campos obrigatórios');
            return;
        }

        // Navega para payment
        router.push({
            pathname: `/checkout/payment` as any,
            params: {
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
            },
        });
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
                    <Ionicons name="chevron-back" size={24} color={theme.colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Pedido</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                    <View style={styles.progressStep}>
                        <View style={[styles.stepCircle, styles.stepCircleActive]}>
                            <Ionicons name="checkmark" size={16} color="#fff" />
                        </View>
                        <Text style={[styles.stepLabel, styles.stepLabelActive]}>Contato</Text>
                    </View>
                    <View style={styles.progressConnector} />
                    <View style={styles.progressStep}>
                        <View style={styles.stepCircle}>
                            <Text style={styles.stepNumber}>2</Text>
                        </View>
                        <Text style={styles.stepLabel}>Pagamento</Text>
                    </View>
                </View>

                {/* Timer Badge */}
                <View style={styles.timerBadge}>
                    <Ionicons name="time" size={16} color="#fff" />
                    <Text style={styles.timerText}>Reservado por {formatTime(timeRemaining)} minutos</Text>
                </View>

                {/* Contact Form */}
                <View style={styles.formSection}>
                    <Text style={styles.formTitle}>Insira seus dados pessoais</Text>
                    <View style={styles.securityBadge}>
                        <Ionicons name="lock-closed" size={16} color="#14b8a6" />
                        <Text style={styles.securityText}>Reserva rápida e segura</Text>
                    </View>

                    <Text style={styles.requiredLabel}>*Preenchimento obrigatório</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Nome completo*</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ana Paula de Araujo Beckenkamp"
                            placeholderTextColor="#666"
                            value={fullName}
                            onChangeText={setFullName}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Endereço de e-mail*</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="anapaula_beckencamp@hotmail.com"
                            placeholderTextColor="#666"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Código do país*</Text>
                        <View style={styles.pickerContainer}>
                            <Text style={styles.pickerValue}>Brasil (+55)</Text>
                            <Ionicons name="chevron-down" size={20} color="#999" />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Telefone celular*</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="5548998385188"
                            placeholderTextColor="#666"
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                        />
                    </View>

                    <Text style={styles.disclaimer}>
                        Entraremos em contato apenas em caso de mudanças ou atualizações importantes em sua reserva
                    </Text>
                </View>

                {/* Booking Summary */}
                <Pressable
                    style={styles.summaryContainer}
                    onPress={() => setSummaryExpanded(!summaryExpanded)}
                >
                    <View style={styles.summaryHeader}>
                        <Text style={styles.summaryTitle}>Resumo da solicitação de reserva</Text>
                        <View style={styles.summaryHeaderRight}>
                            <Text style={styles.summaryCountText}>1 atividade</Text>
                            <Ionicons
                                name={summaryExpanded ? 'chevron-up' : 'chevron-down'}
                                size={20}
                                color={theme.colors.text.primary}
                            />
                        </View>
                    </View>

                    {summaryExpanded && (
                        <View style={styles.summaryDetails}>
                            <Text style={styles.packageTitle}>{packageData.title}</Text>
                            <View style={styles.detailRow}>
                                <Ionicons name="calendar-outline" size={16} color="#999" />
                                <Text style={styles.detailText}>
                                    {formatDate(selectedDate)} • {time}
                                </Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Ionicons name="people-outline" size={16} color="#999" />
                                <Text style={styles.detailText}>
                                    {adults} Adultos{parseInt(children!) > 0 && `, ${children} Crianças`}
                                </Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Ionicons name="checkmark-circle" size={16} color="#14b8a6" />
                                <Text style={[styles.detailText, { color: '#14b8a6' }]}>
                                    Cancelamento gratuito
                                </Text>
                            </View>
                        </View>
                    )}
                </Pressable>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                <View>
                    <Text style={styles.footerPrice}>R$ {parseFloat(totalPrice!).toLocaleString('pt-BR')}</Text>
                    <Text style={styles.footerLabel}>Total</Text>
                </View>
                <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
                    <Text style={styles.continueButtonText}>Ir para pagamento</Text>
                </TouchableOpacity>
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
    stepCircleActive: { backgroundColor: theme.colors.primary },
    stepNumber: { color: theme.colors.text.inverse, fontSize: 14, fontWeight: '700' },
    stepLabel: { fontSize: 13, color: theme.colors.text.tertiary },
    stepLabelActive: { color: theme.colors.text.primary, fontWeight: '700' },
    progressConnector: {
        flex: 1,
        height: 2,
        backgroundColor: theme.colors.border,
        marginHorizontal: 12,
        marginBottom: 28,
    },
    timerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.error,
        paddingHorizontal: 16,
        paddingVertical: 10,
        marginHorizontal: 16,
        borderRadius: 12,
        gap: 8,
        marginBottom: 24,
        ...theme.shadows.small,
    },
    timerText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
    formSection: {
        paddingHorizontal: 16,
        marginBottom: 24,
    },
    formTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: theme.colors.text.primary,
        marginBottom: 12,
        letterSpacing: -0.5,
    },
    securityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 16,
    },
    securityText: {
        color: theme.colors.success,
        fontSize: 14,
        fontWeight: '600',
    },
    requiredLabel: {
        fontSize: 13,
        color: theme.colors.text.tertiary,
        marginBottom: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        color: theme.colors.text.secondary,
        marginBottom: 8,
        fontWeight: '500',
    },
    input: {
        backgroundColor: theme.colors.surfaceLight,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: theme.colors.text.primary,
        borderWidth: 1.5,
        borderColor: theme.colors.border,
    },
    pickerContainer: {
        backgroundColor: theme.colors.surfaceLight,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1.5,
        borderColor: theme.colors.border,
    },
    pickerValue: {
        fontSize: 16,
        color: theme.colors.text.primary,
    },
    disclaimer: {
        fontSize: 13,
        color: theme.colors.text.tertiary,
        lineHeight: 18,
        marginTop: 8,
    },
    summaryContainer: {
        backgroundColor: theme.colors.surface,
        marginHorizontal: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.colors.border,
        overflow: 'hidden',
        ...theme.shadows.small,
    },
    summaryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    summaryTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.text.primary,
    },
    summaryHeaderRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    summaryCountText: {
        fontSize: 14,
        color: theme.colors.text.secondary,
    },
    summaryDetails: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        gap: 12,
    },
    packageTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: 8,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    detailText: {
        fontSize: 14,
        color: theme.colors.text.secondary,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: theme.colors.surface,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        ...theme.shadows.large,
    },
    footerPrice: {
        fontSize: 20,
        fontWeight: '800',
        color: theme.colors.text.primary,
    },
    footerLabel: {
        fontSize: 13,
        color: theme.colors.text.tertiary,
        marginTop: 2,
    },
    continueButton: {
        backgroundColor: theme.colors.primary,
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 12,
        ...theme.shadows.button,
    },
    continueButtonText: {
        color: theme.colors.text.onPrimary,
        fontSize: 16,
        fontWeight: '700',
    },
    errorText: { color: theme.colors.text.secondary, fontSize: 16, textAlign: 'center', marginTop: 40 },
});
