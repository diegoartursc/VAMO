import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getPackageById } from '../../src/data/mockPackages';
import { theme } from '../../src/theme/theme';

export default function AvailabilityScreen() {
    const { id, date, adults, children } = useLocalSearchParams<{
        id: string;
        date: string;
        adults: string;
        children: string;
    }>();

    const router = useRouter();
    const packageData = getPackageById(id!);
    const selectedDate = new Date(date!);
    const adultsCount = parseInt(adults!) || 1;
    const childrenCount = parseInt(children!) || 0;

    const [expandedOption, setExpandedOption] = useState<string | null>('option-1');

    // Opções de disponibilidade adaptadas para pacotes de viagem
    const availabilityOptions = [
        {
            id: 'option-1',
            title: 'Tour coletivo',
            description: 'Tour em grupo com guia compartilhado.',
            durationDays: packageData?.duration || 7,
            guideLanguage: 'Português',
            pricePerAdult: 450,
            pricePerChild: 225,
        },
        {
            id: 'option-2',
            title: 'Tour privativo',
            description: 'Experiência exclusiva com guia dedicado apenas para o seu grupo.',
            isExclusive: true,
            durationDays: packageData?.duration || 7,
            guideLanguage: 'Português',
            pricePerAdult: 1200,
            pricePerChild: 600,
        },
    ];

    const calculateTotal = (option: typeof availabilityOptions[0]) => {
        return (option.pricePerAdult * adultsCount) + (option.pricePerChild * childrenCount);
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    const handleBookNow = (option: typeof availabilityOptions[0]) => {
        // Navega para checkout (cadastro do cartão)
        router.push({
            pathname: `/checkout/contact` as any,
            params: {
                packageId: id,
                date: selectedDate.toISOString(),
                adults: adultsCount,
                children: childrenCount,
                optionId: option.id,
                totalPrice: calculateTotal(option),
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
                <Text style={styles.headerTitle}>Disponibilidade</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Sticky Summary Card */}
                <View style={styles.summaryCard}>
                    <TouchableOpacity style={styles.summaryRow}>
                        <Ionicons name="calendar-outline" size={20} color="#fff" />
                        <View style={styles.summaryRowContent}>
                            <Text style={styles.summaryLabel}>Data</Text>
                            <Text style={styles.summaryValue}>{formatDate(selectedDate)}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#999" />
                    </TouchableOpacity>

                    <View style={styles.summaryDivider} />

                    <TouchableOpacity style={styles.summaryRow}>
                        <Ionicons name="people-outline" size={20} color="#fff" />
                        <View style={styles.summaryRowContent}>
                            <Text style={styles.summaryLabel}>Participantes</Text>
                            <Text style={styles.summaryValue}>
                                Adultos × {adultsCount}{childrenCount > 0 && `, Crianças × ${childrenCount}`}
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#999" />
                    </TouchableOpacity>
                </View>

                {/* Options Title */}
                <Text style={styles.optionsTitle}>
                    Escolha entre {availabilityOptions.length} opções disponíveis
                </Text>

                {/* Availability Options */}
                {availabilityOptions.map((option) => {
                    const isExpanded = expandedOption === option.id;
                    const total = calculateTotal(option);

                    return (
                        <View key={option.id} style={styles.optionCard}>
                            <Pressable
                                style={[styles.optionHeader, isExpanded && styles.optionHeaderExpanded]}
                                onPress={() => setExpandedOption(isExpanded ? null : option.id)}
                            >
                                <View style={styles.optionHeaderContent}>
                                    <Text style={styles.optionTitle}>{option.title}</Text>
                                    <Ionicons
                                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                                        size={24}
                                        color="#14b8a6"
                                    />
                                </View>
                            </Pressable>

                            {isExpanded && (
                                <View style={styles.optionBody}>
                                    {/* Exclusive Banner */}
                                    {option.isExclusive && (
                                        <View style={styles.exclusiveBanner}>
                                            <Ionicons name="star" size={16} color="#D4A017" />
                                            <Text style={styles.exclusiveBannerText}>
                                                Experiência exclusiva — guia dedicado apenas para o seu grupo
                                            </Text>
                                        </View>
                                    )}

                                    {/* Info */}
                                    <View style={styles.infoRow}>
                                        <Ionicons name="calendar-outline" size={18} color="#999" />
                                        <Text style={styles.infoText}>{option.durationDays} dias de viagem</Text>
                                    </View>

                                    <View style={styles.infoRow}>
                                        <Ionicons name="person-outline" size={18} color="#999" />
                                        <Text style={styles.infoText}>Guia: {option.guideLanguage}</Text>
                                    </View>

                                    {/* Policies */}
                                    <View style={styles.policiesSection}>
                                        <View style={styles.policyRow}>
                                            <Ionicons name="card-outline" size={18} color={theme.colors.primary} />
                                            <Text style={styles.policyText}>
                                                Cadastre seu cartão agora. A cobrança só será realizada após a confirmação da agência (no mesmo dia).
                                            </Text>
                                        </View>

                                        <View style={styles.policyRow}>
                                            <Ionicons name="checkmark-circle" size={18} color={theme.colors.primary} />
                                            <Text style={styles.policyText}>
                                                Cancelamento gratuito em até 7 dias após a compra.
                                            </Text>
                                        </View>

                                        <View style={styles.policyRow}>
                                            <Ionicons name="alert-circle-outline" size={18} color={theme.colors.text.tertiary} />
                                            <Text style={styles.policyTextMuted}>
                                                Após 7 dias, o cancelamento estará sujeito a taxas.
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Pricing */}
                                    <View style={styles.pricingCard}>
                                        <Text style={styles.totalPrice}>R$ {total.toLocaleString('pt-BR')}</Text>
                                        <Text style={styles.priceBreakdown}>
                                            {adultsCount} Adulto{adultsCount > 1 && 's'} × R$ {option.pricePerAdult}
                                        </Text>
                                        {childrenCount > 0 && (
                                            <Text style={styles.priceBreakdown}>
                                                {childrenCount} Criança{childrenCount > 1 && 's'} × R$ {option.pricePerChild}
                                            </Text>
                                        )}
                                        <Text style={styles.taxIncluded}>Todos os impostos e taxas inclusos</Text>
                                    </View>

                                    {/* Book Button */}
                                    <TouchableOpacity
                                        style={styles.bookButton}
                                        onPress={() => handleBookNow(option)}
                                    >
                                        <Text style={styles.bookButtonText}>Reservar agora</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    );
                })}

                <View style={{ height: 40 }} />
            </ScrollView>
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
    summaryCard: {
        backgroundColor: theme.colors.surface,
        marginHorizontal: 16,
        marginTop: 16,
        marginBottom: 20,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.border,
        overflow: 'hidden',
    },
    summaryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 12,
    },
    summaryRowContent: {
        flex: 1,
    },
    summaryLabel: {
        fontSize: 13,
        color: theme.colors.text.tertiary,
        marginBottom: 4,
    },
    summaryValue: {
        fontSize: 15,
        color: theme.colors.text.primary,
        fontWeight: '500',
    },
    summaryDivider: {
        height: 1,
        backgroundColor: theme.colors.border,
    },
    optionsTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginHorizontal: 16,
        marginBottom: 16,
    },
    optionCard: {
        backgroundColor: theme.colors.surface,
        marginHorizontal: 16,
        marginBottom: 12,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: theme.colors.primary,
        overflow: 'hidden',
    },
    optionHeader: {
        padding: 16,
    },
    optionHeaderExpanded: {
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    optionHeaderContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    optionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    optionBody: {
        padding: 16,
        paddingTop: 20,
    },
    exclusiveBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(212, 160, 23, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(212, 160, 23, 0.25)',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginBottom: 16,
    },
    exclusiveBannerText: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        color: '#B8860B',
        lineHeight: 20,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    infoText: {
        fontSize: 15,
        color: theme.colors.text.secondary,
    },
    optionDescription: {
        fontSize: 14,
        color: theme.colors.text.tertiary,
        lineHeight: 20,
        marginTop: 4,
        marginBottom: 4,
    },
    policiesSection: {
        marginTop: 16,
        marginBottom: 4,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },
    policyRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        marginBottom: 14,
    },
    policyText: {
        flex: 1,
        fontSize: 14,
        color: theme.colors.text.secondary,
        lineHeight: 20,
    },
    policyTextMuted: {
        flex: 1,
        fontSize: 13,
        color: theme.colors.text.tertiary,
        lineHeight: 20,
        fontStyle: 'italic',
    },
    pricingCard: {
        backgroundColor: theme.colors.background,
        borderRadius: 12,
        padding: 16,
        marginTop: 20,
        marginBottom: 20,
    },
    totalPrice: {
        fontSize: 28,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: 8,
    },
    priceBreakdown: {
        fontSize: 14,
        color: theme.colors.text.tertiary,
        marginBottom: 4,
    },
    taxIncluded: {
        fontSize: 13,
        color: theme.colors.primary,
        marginTop: 8,
    },
    bookButton: {
        backgroundColor: theme.colors.primary,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    bookButtonText: {
        color: theme.colors.text.inverse,
        fontSize: 17,
        fontWeight: '700',
    },
    errorText: {
        color: theme.colors.text.primary,
        fontSize: 16,
        textAlign: 'center',
        marginTop: 40,
    },
});
