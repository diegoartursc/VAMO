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
    const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);

    // Mock de opções de disponibilidade
    const availabilityOptions = [
        {
            id: 'option-1',
            title: 'Guia em português',
            duration: '6 horas',
            guideLanguage: 'Inglês',
            timeSlots: ['17:00', '17:30', '18:00', '18:30'],
            cancellationPolicy: 'Cancele até 17:00 de 11 de março para obter reembolso integral',
            reserveNowPayLater: true,
            pricePerAdult: 450,
            pricePerChild: 225,
        },
        {
            id: 'option-2',
            title: 'Tour privativo',
            duration: '4 horas',
            guideLanguage: 'Português',
            timeSlots: ['10:00', '15:00'],
            cancellationPolicy: 'Não reembolsável',
            reserveNowPayLater: false,
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
        if (!selectedTimeSlot) {
            alert('Por favor, selecione um horário');
            return;
        }

        // Navega para checkout
        router.push({
            pathname: `/checkout/contact` as any,
            params: {
                packageId: id,
                date: selectedDate.toISOString(),
                time: selectedTimeSlot,
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
                                    {/* Info */}
                                    <View style={styles.infoRow}>
                                        <Ionicons name="time-outline" size={18} color="#999" />
                                        <Text style={styles.infoText}>{option.duration}</Text>
                                    </View>

                                    <View style={styles.infoRow}>
                                        <Ionicons name="person-outline" size={18} color="#999" />
                                        <Text style={styles.infoText}>Guia: {option.guideLanguage}</Text>
                                    </View>

                                    {/* Time Slots */}
                                    <Text style={styles.sectionLabel}>Selecione um horário de início</Text>
                                    <Text style={styles.sectionSubtext}>{formatDate(selectedDate)}</Text>

                                    <View style={styles.timeSlotsGrid}>
                                        {option.timeSlots.map((time) => (
                                            <Pressable
                                                key={time}
                                                style={[
                                                    styles.timeSlot,
                                                    selectedTimeSlot === time && styles.timeSlotSelected,
                                                ]}
                                                onPress={() => setSelectedTimeSlot(time)}
                                            >
                                                <Text
                                                    style={[
                                                        styles.timeSlotText,
                                                        selectedTimeSlot === time && styles.timeSlotTextSelected,
                                                    ]}
                                                >
                                                    {time}
                                                </Text>
                                            </Pressable>
                                        ))}
                                    </View>

                                    {/* Policies */}
                                    <View style={styles.policyRow}>
                                        <Ionicons name="checkmark-circle" size={18} color="#14b8a6" />
                                        <Text style={styles.policyText}>{option.cancellationPolicy}</Text>
                                    </View>

                                    {option.reserveNowPayLater && (
                                        <View style={styles.policyRow}>
                                            <Ionicons name="card-outline" size={18} color="#14b8a6" />
                                            <Text style={styles.policyText}>
                                                Você pode reservar agora e pagar depois.
                                            </Text>
                                        </View>
                                    )}

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
    summaryCard: {
        backgroundColor: '#2a2a2a',
        marginHorizontal: 16,
        marginTop: 16,
        marginBottom: 20,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#3a3a3a',
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
        color: '#999',
        marginBottom: 4,
    },
    summaryValue: {
        fontSize: 15,
        color: '#fff',
        fontWeight: '500',
    },
    summaryDivider: {
        height: 1,
        backgroundColor: '#3a3a3a',
    },
    optionsTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
        marginHorizontal: 16,
        marginBottom: 16,
    },
    optionCard: {
        backgroundColor: '#2a2a2a',
        marginHorizontal: 16,
        marginBottom: 12,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#14b8a6',
        overflow: 'hidden',
    },
    optionHeader: {
        padding: 16,
    },
    optionHeaderExpanded: {
        borderBottomWidth: 1,
        borderBottomColor: '#3a3a3a',
    },
    optionHeaderContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    optionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
    },
    optionBody: {
        padding: 16,
        paddingTop: 20,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    infoText: {
        fontSize: 15,
        color: '#ccc',
    },
    sectionLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
        marginTop: 20,
        marginBottom: 8,
    },
    sectionSubtext: {
        fontSize: 14,
        color: '#999',
        marginBottom: 16,
    },
    timeSlotsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 20,
    },
    timeSlot: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#3a3a3a',
        backgroundColor: '#1a1a1a',
    },
    timeSlotSelected: {
        backgroundColor: '#fff',
        borderColor: '#14b8a6',
    },
    timeSlotText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    timeSlotTextSelected: {
        color: '#1a1a1a',
    },
    policyRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        marginBottom: 12,
    },
    policyText: {
        flex: 1,
        fontSize: 14,
        color: '#ccc',
        lineHeight: 20,
    },
    pricingCard: {
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        padding: 16,
        marginTop: 20,
        marginBottom: 20,
    },
    totalPrice: {
        fontSize: 28,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 8,
    },
    priceBreakdown: {
        fontSize: 14,
        color: '#999',
        marginBottom: 4,
    },
    taxIncluded: {
        fontSize: 13,
        color: '#14b8a6',
        marginTop: 8,
    },
    bookButton: {
        backgroundColor: '#14b8a6',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    bookButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '700',
    },
    errorText: {
        color: '#fff',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 40,
    },
});
