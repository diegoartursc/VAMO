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
import { getPackageById } from '../../src/data/mockPackages';

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

    const packageData = getPackageById(packageId!);
    const selectedDate = new Date(date!);
    const [timeRemaining, setTimeRemaining] = useState(20 * 60); // 20 minutes

    // Form states
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [countryCode, setCountryCode] = useState('+55');
    const [phone, setPhone] = useState('');
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
                                color="#fff"
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
    backButton: {
        width: 40,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
    },
    scrollView: {
        flex: 1,
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 24,
        paddingHorizontal: 60,
    },
    progressStep: {
        alignItems: 'center',
    },
    stepCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#3a3a3a',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    stepCircleActive: {
        backgroundColor: '#14b8a6',
    },
    stepNumber: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    stepLabel: {
        fontSize: 13,
        color: '#999',
    },
    stepLabelActive: {
        color: '#fff',
        fontWeight: '600',
    },
    progressConnector: {
        flex: 1,
        height: 2,
        backgroundColor: '#3a3a3a',
        marginHorizontal: 12,
        marginBottom: 28,
    },
    timerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#dc2626',
        paddingHorizontal: 16,
        paddingVertical: 10,
        marginHorizontal: 16,
        borderRadius: 8,
        gap: 8,
        marginBottom: 24,
    },
    timerText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    formSection: {
        paddingHorizontal: 16,
        marginBottom: 24,
    },
    formTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 12,
    },
    securityBADGE: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 16,
    },
    securityText: {
        color: '#14b8a6',
        fontSize: 14,
        fontWeight: '500',
    },
    requiredLabel: {
        fontSize: 13,
        color: '#999',
        marginBottom: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        color: '#999',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#2a2a2a',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: '#fff',
        borderWidth: 1,
        borderColor: '#3a3a3a',
    },
    pickerContainer: {
        backgroundColor: '#2a2a2a',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#3a3a3a',
    },
    pickerValue: {
        fontSize: 16,
        color: '#fff',
    },
    disclaimer: {
        fontSize: 13,
        color: '#999',
        lineHeight: 18,
        marginTop: 8,
    },
    summaryContainer: {
        backgroundColor: '#2a2a2a',
        marginHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#3a3a3a',
        overflow: 'hidden',
    },
    summaryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    summaryTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    summaryHeaderRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    summaryCountText: {
        fontSize: 14,
        color: '#999',
    },
    summaryDetails: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        gap: 12,
    },
    packageTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 8,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    detailText: {
        fontSize: 14,
        color: '#ccc',
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: '#2a2a2a',
        borderTopWidth: 1,
        borderTopColor: '#3a3a3a',
    },
    footerPrice: {
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
    },
    footerLabel: {
        fontSize: 13,
        color: '#999',
        marginTop: 2,
    },
    continueButton: {
        backgroundColor: '#14b8a6',
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 10,
    },
    continueButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    errorText: {
        color: '#fff',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 40,
    },
    securityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 16,
    },
});
