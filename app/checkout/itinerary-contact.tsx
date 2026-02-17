import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getItineraryById } from '../../src/services/api';
import { theme } from '../../src/theme/theme';

export default function ItineraryContactScreen() {
    const router = useRouter();
    const { itineraryId, price } = useLocalSearchParams<{
        itineraryId: string;
        price: string;
    }>();

    const [itinerary, setItinerary] = useState<any>(null);

    useEffect(() => {
        getItineraryById(itineraryId!).then(setItinerary).catch(console.error);
    }, [itineraryId]);

    // Form states
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [countryCode, setCountryCode] = useState('+55');
    const [phone, setPhone] = useState('');

    const handleContinue = () => {
        if (!fullName || !email || !phone) {
            alert('Por favor, preencha todos os campos obrigatórios');
            return;
        }

        // Navigate to payment
        router.push({
            pathname: `/checkout/itinerary-payment` as any,
            params: {
                itineraryId,
                price,
                fullName,
                email,
                countryCode,
                phone,
            },
        });
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
                <Text style={styles.headerTitle}>Compra de Roteiro</Text>
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

                {/* Digital Product Badge */}
                <View style={styles.digitalBadge}>
                    <Ionicons name="download-outline" size={20} color={theme.colors.primary} />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.digitalBadgeTitle}>Produto Digital</Text>
                        <Text style={styles.digitalBadgeDesc}>Acesso imediato após a compra</Text>
                    </View>
                </View>

                {/* Contact Form */}
                <View style={styles.formSection}>
                    <Text style={styles.formTitle}>Insira seus dados pessoais</Text>
                    <View style={styles.securityBadge}>
                        <Ionicons name="lock-closed" size={16} color={theme.colors.primary} />
                        <Text style={styles.securityText}>Compra rápida e segura</Text>
                    </View>

                    <Text style={styles.requiredLabel}>*Preenchimento obrigatório</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Nome completo*</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Seu nome completo"
                            placeholderTextColor={theme.colors.text.tertiary}
                            value={fullName}
                            onChangeText={setFullName}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Endereço de e-mail*</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="seu@email.com"
                            placeholderTextColor={theme.colors.text.tertiary}
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                        <Text style={styles.inputHint}>
                            O roteiro será enviado para este e-mail
                        </Text>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Código do país*</Text>
                        <View style={styles.pickerContainer}>
                            <Text style={styles.pickerValue}>Brasil (+55)</Text>
                            <Ionicons name="chevron-down" size={20} color={theme.colors.text.tertiary} />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Telefone celular*</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="(00) 00000-0000"
                            placeholderTextColor={theme.colors.text.tertiary}
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                        />
                    </View>

                    <Text style={styles.disclaimer}>
                        Entraremos em contato apenas em caso de problemas com o envio do roteiro
                    </Text>
                </View>

                {/* Purchase Summary */}
                <View style={styles.summaryContainer}>
                    <View style={styles.summaryHeader}>
                        <Text style={styles.summaryTitle}>Resumo da compra</Text>
                    </View>

                    <View style={styles.summaryDetails}>
                        <Text style={styles.itineraryTitle}>{itinerary.title}</Text>
                        <View style={styles.detailRow}>
                            <Ionicons name="location-outline" size={16} color={theme.colors.text.secondary} />
                            <Text style={styles.detailText}>
                                {itinerary.destination}, {itinerary.country}
                            </Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Ionicons name="calendar-outline" size={16} color={theme.colors.text.secondary} />
                            <Text style={styles.detailText}>
                                {itinerary.duration} dias de viagem
                            </Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
                            <Text style={[styles.detailText, { color: theme.colors.success }]}>
                                Acesso imediato após compra
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                <View>
                    <Text style={styles.footerPrice}>R$ {parseFloat(price!).toFixed(2).replace('.', ',')}</Text>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    backButton: {
        width: 40,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.text.primary,
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
        backgroundColor: theme.colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
        borderWidth: 2,
        borderColor: theme.colors.border,
    },
    stepCircleActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    stepNumber: {
        color: theme.colors.text.secondary,
        fontSize: 14,
        fontWeight: '600',
    },
    stepLabel: {
        fontSize: 13,
        color: theme.colors.text.secondary,
    },
    stepLabelActive: {
        color: theme.colors.text.primary,
        fontWeight: '600',
    },
    progressConnector: {
        flex: 1,
        height: 2,
        backgroundColor: theme.colors.border,
        marginHorizontal: 12,
        marginBottom: 28,
    },
    digitalBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: theme.colors.primaryLight,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginHorizontal: 16,
        borderRadius: 12,
        marginBottom: 24,
        borderLeftWidth: 3,
        borderLeftColor: theme.colors.primary,
    },
    digitalBadgeTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text.primary,
        marginBottom: 2,
    },
    digitalBadgeDesc: {
        fontSize: 12,
        color: theme.colors.text.secondary,
    },
    formSection: {
        paddingHorizontal: 16,
        marginBottom: 24,
    },
    formTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: 12,
    },
    securityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 16,
    },
    securityText: {
        color: theme.colors.primary,
        fontSize: 14,
        fontWeight: '500',
    },
    requiredLabel: {
        fontSize: 13,
        color: theme.colors.text.secondary,
        marginBottom: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        color: theme.colors.text.secondary,
        marginBottom: 8,
    },
    input: {
        backgroundColor: theme.colors.surface,
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: theme.colors.text.primary,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    inputHint: {
        fontSize: 12,
        color: theme.colors.text.tertiary,
        marginTop: 6,
    },
    pickerContainer: {
        backgroundColor: theme.colors.surface,
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    pickerValue: {
        fontSize: 16,
        color: theme.colors.text.primary,
    },
    disclaimer: {
        fontSize: 13,
        color: theme.colors.text.secondary,
        lineHeight: 18,
        marginTop: 8,
    },
    summaryContainer: {
        backgroundColor: theme.colors.surface,
        marginHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.border,
        overflow: 'hidden',
    },
    summaryHeader: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    summaryTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    summaryDetails: {
        padding: 16,
        gap: 12,
    },
    itineraryTitle: {
        fontSize: 15,
        fontWeight: '600',
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
    },
    footerPrice: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.colors.text.primary,
    },
    footerLabel: {
        fontSize: 13,
        color: theme.colors.text.secondary,
        marginTop: 2,
    },
    continueButton: {
        backgroundColor: theme.colors.primary,
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
        color: theme.colors.text.primary,
        fontSize: 16,
        textAlign: 'center',
        marginTop: 40,
    },
});
