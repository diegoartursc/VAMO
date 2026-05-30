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
import { getPackageById } from '../../src/services/api';
import { theme } from '../../src/theme/theme';
import { formatMoney } from '@vamo/shared/itinerary';
import DatePickerModal from '../../src/components/DatePickerModal';
import ParticipantsModal from '../../src/components/ParticipantsModal';

export default function AvailabilityScreen() {
    const { id, date, adults, children, price, originCity, checkedBags: checkedBagsParam } = useLocalSearchParams<{
        id: string;
        date: string;
        adults: string;
        children: string;
        price: string;
        originCity: string;
        checkedBags: string;
    }>();

    const router = useRouter();
    const [packageData, setPackageData] = useState<any>(null);

    useEffect(() => {
        getPackageById(id!).then(setPackageData).catch(console.error);
    }, [id]);
    const selectedDate = new Date(date!);
    const adultsCount = parseInt(adults!) || 1;
    const childrenCount = parseInt(children!) || 0;
    const pricePerPerson = parseFloat(price!) || 0;
    const pricePerChild = pricePerPerson * 0.5;
    const checkedBags = parseInt(checkedBagsParam!) || 0;

    const [expandedOption, setExpandedOption] = useState<string | null>('option-1');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showParticipants, setShowParticipants] = useState(false);

    // Calculate total based on the selected per-person price
    const calculateTotal = (adultMultiplier: number) => {
        const adultPrice = pricePerPerson * adultMultiplier;
        const childPrice = adultPrice * 0.5;
        return (adultPrice * adultsCount) + (childPrice * childrenCount);
    };

    // Options derive prices from the selected per-person price
    const availabilityOptions = [
        {
            id: 'option-1',
            title: 'Tour coletivo',
            description: 'Tour em grupo com guia compartilhado.',
            durationDays: packageData?.duration || 7,
            guideLanguage: 'Português',
            priceMultiplier: 1,
            pricePerAdult: pricePerPerson,
            pricePerChild: pricePerChild,
        },
        {
            id: 'option-2',
            title: 'Tour privativo',
            description: 'Experiência exclusiva com guia dedicado apenas para o seu grupo.',
            isExclusive: true,
            durationDays: packageData?.duration || 7,
            guideLanguage: 'Português',
            priceMultiplier: 2.5,
            pricePerAdult: pricePerPerson * 2.5,
            pricePerChild: pricePerChild * 2.5,
        },
    ];

    const getOptionTotal = (option: typeof availabilityOptions[0]) => {
        return (option.pricePerAdult * adultsCount) + (option.pricePerChild * childrenCount);
    };

    const formatPrice = (value: number) => formatMoney(value);

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    const handleBookNow = (option: typeof availabilityOptions[0]) => {
        router.push({
            pathname: `/checkout/contact` as any,
            params: {
                packageId: id,
                date: selectedDate.toISOString(),
                adults: adultsCount,
                children: childrenCount,
                optionId: option.id,
                totalPrice: getOptionTotal(option),
                pricePerPerson: option.pricePerAdult,
                originCity: originCity || '',
                checkedBags: checkedBags.toString(),
            },
        });
    };

    const handleParticipantsChange = (newAdults: number, newChildren: number) => {
        setShowParticipants(false);
        router.replace({
            pathname: `/availability/${id}` as any,
            params: {
                date: selectedDate.toISOString(),
                adults: newAdults.toString(),
                children: newChildren.toString(),
                price: pricePerPerson.toString(),
            },
        });
    };

    if (!packageData) {
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
                    <Ionicons name="chevron-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Disponibilidade</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Summary Card */}
                <View style={styles.summaryCard}>
                    <TouchableOpacity
                        style={styles.summaryRow}
                        onPress={() => setShowDatePicker(true)}
                    >
                        <Ionicons name="calendar-outline" size={20} color="#fff" />
                        <View style={styles.summaryRowContent}>
                            <Text style={styles.summaryLabel}>Data</Text>
                            <Text style={styles.summaryValue}>{formatDate(selectedDate)}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#999" />
                    </TouchableOpacity>

                    <View style={styles.summaryDivider} />

                    <TouchableOpacity
                        style={styles.summaryRow}
                        onPress={() => setShowParticipants(true)}
                    >
                        <Ionicons name="people-outline" size={20} color="#fff" />
                        <View style={styles.summaryRowContent}>
                            <Text style={styles.summaryLabel}>Participantes</Text>
                            <Text style={styles.summaryValue}>
                                Adultos × {adultsCount}{childrenCount > 0 && `, Crianças × ${childrenCount}`}
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#999" />
                    </TouchableOpacity>

                    <View style={styles.summaryDivider} />

                    {/* Origin City */}
                    {originCity ? (
                        <>
                            <View style={styles.summaryRow}>
                                <Ionicons name="airplane-outline" size={20} color="#fff" />
                                <View style={styles.summaryRowContent}>
                                    <Text style={styles.summaryLabel}>Cidade de origem</Text>
                                    <Text style={styles.summaryValue}>
                                        Saindo de {originCity}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.summaryDivider} />
                        </>
                    ) : null}

                    {/* Checked Bags */}
                    {checkedBags > 0 ? (
                        <>
                            <View style={styles.summaryDivider} />
                            <View style={styles.summaryRow}>
                                <Ionicons name="bag-outline" size={20} color="#fff" />
                                <View style={styles.summaryRowContent}>
                                    <Text style={styles.summaryLabel}>Bagagens despachadas</Text>
                                    <Text style={styles.summaryValue}>
                                        {checkedBags} mala{checkedBags > 1 ? 's' : ''} de 23kg
                                    </Text>
                                </View>
                            </View>
                        </>
                    ) : null}

                    {/* Price summary row */}
                    <View style={styles.summaryRow}>
                        <Ionicons name="pricetag-outline" size={20} color="#fff" />
                        <View style={styles.summaryRowContent}>
                            <Text style={styles.summaryLabel}>Valor base selecionado</Text>
                            <Text style={styles.summaryValue}>
                                {formatPrice(pricePerPerson)} /pessoa
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Options Title */}
                <Text style={styles.optionsTitle}>
                    Escolha entre {availabilityOptions.length} opções disponíveis
                </Text>

                {/* Availability Options */}
                {availabilityOptions.map((option) => {
                    const isExpanded = expandedOption === option.id;
                    const total = getOptionTotal(option);

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
                                                Sua solicitação está sujeita à verificação de disponibilidade. Caso a viagem inclua voos, uma cotação final será enviada para aprovação antes de qualquer pagamento.
                                            </Text>
                                        </View>

                                        <View style={styles.policyRow}>
                                            <Ionicons name="checkmark-circle" size={18} color={theme.colors.primary} />
                                            <Text style={styles.policyText}>
                                                Cancelamento gratuito em até 7 dias após a confirmação do pagamento.
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
                                        <Text style={styles.totalPrice}>{formatPrice(total)}</Text>
                                        <Text style={styles.priceBreakdown}>
                                            {adultsCount} Adulto{adultsCount > 1 ? 's' : ''} × {formatPrice(option.pricePerAdult)}
                                        </Text>
                                        {childrenCount > 0 && (
                                            <Text style={styles.priceBreakdown}>
                                                {childrenCount} Criança{childrenCount > 1 ? 's' : ''} × {formatPrice(option.pricePerChild)}
                                            </Text>
                                        )}
                                        <Text style={styles.taxIncluded}>Todos os impostos e taxas inclusos</Text>
                                    </View>

                                    {/* Book Button */}
                                    <TouchableOpacity
                                        style={styles.bookButton}
                                        onPress={() => handleBookNow(option)}
                                    >
                                        <Text style={styles.bookButtonText}>Continuar</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    );
                })}

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Modals */}
            <DatePickerModal
                visible={showDatePicker}
                onClose={() => setShowDatePicker(false)}
                onSelectDate={(newDate: Date, newAdults: number, newChildren: number, newPrice: number) => {
                    setShowDatePicker(false);
                    router.replace({
                        pathname: `/availability/${id}` as any,
                        params: {
                            date: newDate.toISOString(),
                            adults: newAdults.toString(),
                            children: newChildren.toString(),
                            price: newPrice.toString(),
                        },
                    });
                }}
                packageTitle={packageData.title}
                availableDates={packageData.availableDates}
            />

            <ParticipantsModal
                visible={showParticipants}
                onClose={() => setShowParticipants(false)}
                onApply={handleParticipantsChange}
                initialAdults={adultsCount}
                initialChildren={childrenCount}
            />
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
