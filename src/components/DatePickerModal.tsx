import React, { useState } from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AvailableDate } from '../types';

interface DatePickerModalProps {
    visible: boolean;
    onClose: () => void;
    onSelectDate?: (date: Date, adults: number, children: number, pricePerPerson: number) => void;
    packageTitle?: string;
    agencyName?: string;
    agencyPhone?: string;
    availableDates?: AvailableDate[];
}

export default function DatePickerModal({
    visible,
    onClose,
    onSelectDate,
    packageTitle,
    agencyName,
    agencyPhone,
    availableDates = [],
}: DatePickerModalProps) {
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedPrice, setSelectedPrice] = useState<number | null>(null);
    const [viewMode, setViewMode] = useState<'travelers' | 'dates' | 'confirmation' | 'success'>('travelers');
    const [adultsCount, setAdultsCount] = useState(1);
    const [childrenCount, setChildrenCount] = useState(0);

    const handleDateSelect = (dateItem: AvailableDate) => {
        const date = new Date(dateItem.date + 'T12:00:00');
        setSelectedDate(date);
        setSelectedPrice(dateItem.price);
        setViewMode('confirmation');
    };

    // Calculate total for a given per-person price
    const calculateTotalForPrice = (unitPrice: number) => {
        return (adultsCount * unitPrice) + (childrenCount * unitPrice * 0.5);
    };

    // Calculate total for the selected price
    const calculateTotal = () => {
        if (!selectedPrice) return 0;
        return calculateTotalForPrice(selectedPrice);
    };

    const handleConfirm = () => {
        if (selectedDate && onSelectDate && selectedPrice) {
            onSelectDate(selectedDate, adultsCount, childrenCount, selectedPrice);
        }
        setViewMode('success');
    };

    const handleClose = () => {
        onClose();
        setTimeout(() => {
            setViewMode('travelers');
            setSelectedDate(null);
            setSelectedPrice(null);
            setAdultsCount(1);
            setChildrenCount(0);
        }, 300);
    };

    const formatDateShort = (isoDate: string) => {
        const date = new Date(isoDate + 'T12:00:00');
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    const formatDateLong = (isoDate: string) => {
        const date = new Date(isoDate + 'T12:00:00');
        return date.toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
        });
    };

    const formatPrice = (price: number) => {
        return price.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        });
    };

    const lowestPrice = availableDates.length > 0
        ? Math.min(...availableDates.map(d => d.price))
        : 0;

    const totalTravelers = adultsCount + childrenCount;

    // ─── Step 1: Travelers ─────────────────────────────────
    const renderTravelers = () => (
        <View style={styles.fullContainer}>
            <View style={styles.header}>
                <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                    <Ionicons name="close" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Quem vai viajar?</Text>
            </View>

            {packageTitle && (
                <Text style={styles.packageName}>{packageTitle}</Text>
            )}

            <View style={styles.travelersContent}>
                {/* Adults */}
                <View style={styles.summaryCard}>
                    <View style={styles.counterRow}>
                        <View style={styles.counterLabelContainer}>
                            <Text style={styles.counterLabel}>Adultos</Text>
                            <Text style={styles.counterSublabel}>Idade 13+</Text>
                        </View>
                        <View style={styles.travelerCounter}>
                            <TouchableOpacity
                                style={[styles.counterButton, adultsCount <= 1 && styles.counterButtonDisabled]}
                                onPress={() => setAdultsCount(Math.max(1, adultsCount - 1))}
                                disabled={adultsCount <= 1}
                            >
                                <Text style={[styles.counterButtonText, adultsCount <= 1 && styles.counterButtonTextDisabled]}>−</Text>
                            </TouchableOpacity>
                            <Text style={styles.travelerCount}>{adultsCount}</Text>
                            <TouchableOpacity
                                style={styles.counterButton}
                                onPress={() => setAdultsCount(adultsCount + 1)}
                            >
                                <Text style={styles.counterButtonText}>+</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.counterDivider} />

                    {/* Children */}
                    <View style={styles.counterRow}>
                        <View style={styles.counterLabelContainer}>
                            <Text style={styles.counterLabel}>Crianças</Text>
                            <Text style={styles.counterSublabel}>Até 12 anos · 50% do valor</Text>
                        </View>
                        <View style={styles.travelerCounter}>
                            <TouchableOpacity
                                style={[styles.counterButton, childrenCount <= 0 && styles.counterButtonDisabled]}
                                onPress={() => setChildrenCount(Math.max(0, childrenCount - 1))}
                                disabled={childrenCount <= 0}
                            >
                                <Text style={[styles.counterButtonText, childrenCount <= 0 && styles.counterButtonTextDisabled]}>−</Text>
                            </TouchableOpacity>
                            <Text style={styles.travelerCount}>{childrenCount}</Text>
                            <TouchableOpacity
                                style={styles.counterButton}
                                onPress={() => setChildrenCount(childrenCount + 1)}
                            >
                                <Text style={styles.counterButtonText}>+</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Summary info */}
                <View style={styles.travelersSummary}>
                    <Ionicons name="people" size={20} color="#14b8a6" />
                    <Text style={styles.travelersSummaryText}>
                        {totalTravelers} {totalTravelers === 1 ? 'viajante' : 'viajantes'}
                        {childrenCount > 0 && ` (${adultsCount} adulto${adultsCount > 1 ? 's' : ''}, ${childrenCount} criança${childrenCount > 1 ? 's' : ''})`}
                    </Text>
                </View>
            </View>

            {/* Continue button pinned to bottom */}
            <View style={styles.bottomAction}>
                <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={() => setViewMode('dates')}
                >
                    <Text style={styles.confirmButtonText}>Ver datas disponíveis</Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                </TouchableOpacity>
            </View>
        </View>
    );

    // ─── Step 2: Dates ─────────────────────────────────────
    const renderDates = () => {
        // Find the lowest total price
        const lowestTotal = availableDates.length > 0
            ? Math.min(...availableDates.map(d => calculateTotalForPrice(d.price)))
            : 0;

        return (
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => setViewMode('travelers')} style={styles.closeButton}>
                        <Ionicons name="arrow-back" size={28} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Selecionar datas</Text>
                </View>

                {/* Traveler badge */}
                <View style={styles.travelerBadgeRow}>
                    <View style={styles.travelerBadge}>
                        <Ionicons name="people" size={14} color="#14b8a6" />
                        <Text style={styles.travelerBadgeText}>
                            {adultsCount} adulto{adultsCount > 1 ? 's' : ''}
                            {childrenCount > 0 && ` + ${childrenCount} criança${childrenCount > 1 ? 's' : ''}`}
                        </Text>
                    </View>
                    <TouchableOpacity onPress={() => setViewMode('travelers')}>
                        <Text style={styles.editLink}>Alterar</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.sectionSubtitle}>
                    {availableDates.length} {availableDates.length === 1 ? 'data disponível' : 'datas disponíveis'}
                </Text>

                <View style={styles.dateCardsContainer}>
                    {availableDates.map((dateItem, index) => {
                        const isSelected = selectedDate?.toISOString().split('T')[0] === dateItem.date;
                        const totalForDate = calculateTotalForPrice(dateItem.price);
                        const isLowestTotal = totalForDate === lowestTotal;

                        return (
                            <Pressable
                                key={index}
                                style={[
                                    styles.dateCard,
                                    isSelected && styles.dateCardSelected,
                                ]}
                                onPress={() => handleDateSelect(dateItem)}
                            >
                                {isLowestTotal && (
                                    <View style={styles.bestPriceBadge}>
                                        <Ionicons name="pricetag" size={12} color="#fff" />
                                        <Text style={styles.bestPriceBadgeText}>Melhor preço</Text>
                                    </View>
                                )}

                                <View style={styles.dateCardContent}>
                                    <View style={styles.dateCardLeft}>
                                        <View style={[styles.calendarIconContainer, isSelected && styles.calendarIconSelected]}>
                                            <Ionicons name="calendar-outline" size={22} color={isSelected ? '#fff' : '#14b8a6'} />
                                        </View>
                                        <View style={styles.dateTextContainer}>
                                            <Text style={styles.dateTextPrimary}>
                                                {formatDateShort(dateItem.date)}
                                            </Text>
                                            <Text style={styles.dateTextSecondary}>
                                                {formatDateLong(dateItem.date)}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.dateCardRight}>
                                        <Text style={[styles.priceText, isSelected && styles.priceTextSelected]}>
                                            {formatPrice(totalForDate)}
                                        </Text>
                                        <Text style={styles.priceLabel}>
                                            {totalTravelers} {totalTravelers === 1 ? 'viajante' : 'viajantes'}
                                        </Text>
                                        {dateItem.spotsLeft && (
                                            <View style={styles.spotsLeftBadge}>
                                                <Text style={styles.spotsLeftText}>
                                                    {dateItem.spotsLeft} {dateItem.spotsLeft === 1 ? 'vaga' : 'vagas'}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            </Pressable>
                        );
                    })}
                </View>

                {availableDates.length === 0 && (
                    <View style={styles.emptyState}>
                        <Ionicons name="calendar-outline" size={48} color="#555" />
                        <Text style={styles.emptyStateText}>Nenhuma data disponível no momento</Text>
                        <Text style={styles.emptyStateSubtext}>
                            Entre em contato com a agência para mais informações.
                        </Text>
                    </View>
                )}

                <View style={styles.bottomPadding} />
            </ScrollView>
        );
    };

    // ─── Step 3: Confirmation ──────────────────────────────
    const renderConfirmation = () => (
        <View style={styles.fullContainer}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => setViewMode('dates')}
                    style={styles.closeButton}
                >
                    <Ionicons name="arrow-back" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Confirmar reserva</Text>
            </View>

            <ScrollView style={styles.confirmationContent}>
                {/* Date Card */}
                <View style={styles.confirmDateCard}>
                    <Ionicons name="calendar-outline" size={48} color="#14b8a6" />
                    <Text style={styles.selectedDateText}>
                        {selectedDate?.toLocaleDateString('pt-BR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            weekday: 'long'
                        })}
                    </Text>
                </View>

                {/* Package Summary */}
                {packageTitle && (
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>Pacote</Text>
                        <Text style={styles.summaryValue}>{packageTitle}</Text>
                    </View>
                )}

                {/* Price Breakdown */}
                {selectedPrice && (
                    <View style={styles.priceBreakdownCard}>
                        <Text style={styles.priceBreakdownTitle}>Resumo do valor</Text>

                        <View style={styles.priceRow}>
                            <Text style={styles.priceRowLabel}>
                                {adultsCount} Adulto{adultsCount > 1 ? 's' : ''} × {formatPrice(selectedPrice)}
                            </Text>
                            <Text style={styles.priceRowValue}>
                                {formatPrice(adultsCount * selectedPrice)}
                            </Text>
                        </View>

                        {childrenCount > 0 && (
                            <View style={styles.priceRow}>
                                <Text style={styles.priceRowLabel}>
                                    {childrenCount} Criança{childrenCount > 1 ? 's' : ''} × {formatPrice(selectedPrice * 0.5)}
                                </Text>
                                <Text style={styles.priceRowValue}>
                                    {formatPrice(childrenCount * selectedPrice * 0.5)}
                                </Text>
                            </View>
                        )}

                        <View style={styles.totalDivider} />

                        <View style={styles.priceRow}>
                            <Text style={styles.totalLabel}>Total</Text>
                            <Text style={styles.totalValue}>
                                {formatPrice(calculateTotal())}
                            </Text>
                        </View>
                    </View>
                )}

                {/* Important Info */}
                <View style={styles.infoBox}>
                    <Ionicons name="information-circle" size={20} color="#14b8a6" />
                    <Text style={styles.infoText}>
                        Após confirmar, você receberá um email com os detalhes da solicitação.
                        A agência entrará em contato em até 24h para finalizar a reserva.
                    </Text>
                </View>

                <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
                    <Text style={styles.confirmButtonText}>
                        Confirmar · {formatPrice(calculateTotal())}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setViewMode('dates')}
                >
                    <Text style={styles.cancelButtonText}>Escolher Outra Data</Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );

    // ─── Step 4: Success ───────────────────────────────────
    const renderSuccess = () => (
        <View style={styles.fullContainer}>
            <ScrollView style={styles.successContent}>
                <View style={styles.successIconContainer}>
                    <Ionicons name="checkmark-circle" size={80} color="#14b8a6" />
                </View>

                <Text style={styles.successTitle}>Solicitação Enviada!</Text>
                <Text style={styles.successSubtitle}>
                    Sua solicitação de reserva foi enviada com sucesso
                </Text>

                <View style={styles.successSummaryCard}>
                    <View style={styles.summaryRow}>
                        <Ionicons name="calendar" size={20} color="#14b8a6" />
                        <View style={styles.summaryRowContent}>
                            <Text style={styles.summaryRowLabel}>Data</Text>
                            <Text style={styles.summaryRowValue}>
                                {selectedDate?.toLocaleDateString('pt-BR', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric'
                                })}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.summaryDivider} />

                    <View style={styles.summaryRow}>
                        <Ionicons name="people" size={20} color="#14b8a6" />
                        <View style={styles.summaryRowContent}>
                            <Text style={styles.summaryRowLabel}>Viajantes</Text>
                            <Text style={styles.summaryRowValue}>
                                {adultsCount} Adulto{adultsCount > 1 ? 's' : ''}
                                {childrenCount > 0 && `, ${childrenCount} Criança${childrenCount > 1 ? 's' : ''}`}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.summaryDivider} />

                    <View style={styles.summaryRow}>
                        <Ionicons name="card" size={20} color="#14b8a6" />
                        <View style={styles.summaryRowContent}>
                            <Text style={styles.summaryRowLabel}>Total</Text>
                            <Text style={styles.summaryRowValue}>
                                {formatPrice(calculateTotal())}
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={styles.nextStepsCard}>
                    <Text style={styles.nextStepsTitle}>Próximos passos</Text>
                    <View style={styles.stepItem}>
                        <View style={styles.stepNumber}>
                            <Text style={styles.stepNumberText}>1</Text>
                        </View>
                        <Text style={styles.stepText}>
                            Você receberá um email de confirmação
                        </Text>
                    </View>
                    <View style={styles.stepItem}>
                        <View style={styles.stepNumber}>
                            <Text style={styles.stepNumberText}>2</Text>
                        </View>
                        <Text style={styles.stepText}>
                            {agencyName || 'A agência'} entrará em contato em até 24h
                        </Text>
                    </View>
                    <View style={styles.stepItem}>
                        <View style={styles.stepNumber}>
                            <Text style={styles.stepNumberText}>3</Text>
                        </View>
                        <Text style={styles.stepText}>
                            Finalize os detalhes e confirme o pagamento
                        </Text>
                    </View>
                </View>


                <TouchableOpacity
                    style={styles.doneButton}
                    onPress={handleClose}
                >
                    <Text style={styles.doneButtonText}>Concluir</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={handleClose}
        >
            <View style={styles.container}>
                {viewMode === 'travelers' && renderTravelers()}
                {viewMode === 'dates' && renderDates()}
                {viewMode === 'confirmation' && renderConfirmation()}
                {viewMode === 'success' && renderSuccess()}
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a1a',
    },
    fullContainer: {
        flex: 1,
        backgroundColor: '#1a1a1a',
    },
    scrollView: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 15,
        backgroundColor: '#1a1a1a',
    },
    closeButton: {
        marginRight: 15,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#fff',
    },
    packageName: {
        fontSize: 14,
        color: '#999',
        paddingHorizontal: 20,
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontSize: 13,
        color: '#14b8a6',
        fontWeight: '600',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    // ── Travelers screen ──
    travelersContent: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    travelersSummary: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: 'rgba(20, 184, 166, 0.08)',
        borderRadius: 12,
        padding: 16,
        marginTop: 20,
        borderWidth: 1,
        borderColor: 'rgba(20, 184, 166, 0.2)',
    },
    travelersSummaryText: {
        fontSize: 15,
        color: '#14b8a6',
        fontWeight: '600',
    },
    bottomAction: {
        paddingHorizontal: 20,
        paddingBottom: 40,
        paddingTop: 16,
    },
    // ── Traveler badge on dates screen ──
    travelerBadgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    travelerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(20, 184, 166, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(20, 184, 166, 0.25)',
    },
    travelerBadgeText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#14b8a6',
    },
    editLink: {
        fontSize: 14,
        fontWeight: '600',
        color: '#14b8a6',
        textDecorationLine: 'underline',
    },
    // ── Date Cards ──
    dateCardsContainer: {
        paddingHorizontal: 20,
        gap: 12,
    },
    dateCard: {
        backgroundColor: '#2a2a2a',
        borderRadius: 14,
        padding: 16,
        borderWidth: 1.5,
        borderColor: '#3a3a3a',
        position: 'relative',
    },
    dateCardSelected: {
        borderColor: '#14b8a6',
        backgroundColor: 'rgba(20, 184, 166, 0.08)',
    },
    bestPriceBadge: {
        position: 'absolute',
        top: -1,
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#14b8a6',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderBottomLeftRadius: 8,
        borderBottomRightRadius: 8,
    },
    bestPriceBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#fff',
    },
    dateCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    dateCardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    calendarIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(20, 184, 166, 0.12)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    calendarIconSelected: {
        backgroundColor: '#14b8a6',
    },
    dateTextContainer: {
        flex: 1,
    },
    dateTextPrimary: {
        fontSize: 17,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 3,
    },
    dateTextSecondary: {
        fontSize: 13,
        color: '#999',
        textTransform: 'capitalize',
    },
    dateCardRight: {
        alignItems: 'flex-end',
        paddingLeft: 12,
    },
    priceText: {
        fontSize: 17,
        fontWeight: '700',
        color: '#14b8a6',
    },
    priceTextSelected: {
        color: '#14b8a6',
    },
    priceLabel: {
        fontSize: 11,
        color: '#888',
        marginTop: 2,
    },
    spotsLeftBadge: {
        marginTop: 6,
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    spotsLeftText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#ef4444',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        paddingHorizontal: 40,
    },
    emptyStateText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#999',
        marginTop: 16,
        textAlign: 'center',
    },
    emptyStateSubtext: {
        fontSize: 14,
        color: '#666',
        marginTop: 8,
        textAlign: 'center',
    },
    bottomPadding: {
        height: 40,
    },
    // ── Confirmation ──
    confirmationContent: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    confirmDateCard: {
        backgroundColor: '#2a2a2a',
        borderRadius: 16,
        padding: 30,
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#3a3a3a',
    },
    selectedDateText: {
        fontSize: 20,
        fontWeight: '600',
        color: '#fff',
        marginTop: 15,
        textAlign: 'center',
    },
    summaryCard: {
        backgroundColor: '#2a2a2a',
        borderRadius: 12,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#3a3a3a',
    },
    summaryLabel: {
        fontSize: 13,
        color: '#888',
        marginBottom: 8,
        fontWeight: '500',
    },
    summaryValue: {
        fontSize: 16,
        color: '#fff',
        fontWeight: '600',
    },
    counterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    counterLabelContainer: {
        flex: 1,
    },
    counterLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 2,
    },
    counterSublabel: {
        fontSize: 13,
        color: '#888',
    },
    counterDivider: {
        height: 1,
        backgroundColor: '#3a3a3a',
        marginVertical: 16,
    },
    travelerCounter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    counterButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#14b8a6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    counterButtonDisabled: {
        backgroundColor: '#3a3a3a',
    },
    counterButtonText: {
        fontSize: 22,
        color: '#fff',
        fontWeight: '600',
    },
    counterButtonTextDisabled: {
        color: '#666',
    },
    travelerCount: {
        fontSize: 22,
        color: '#fff',
        fontWeight: '700',
        minWidth: 30,
        textAlign: 'center',
    },
    priceBreakdownCard: {
        backgroundColor: '#2a2a2a',
        borderRadius: 12,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#3a3a3a',
    },
    priceBreakdownTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#888',
        marginBottom: 16,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    priceRowLabel: {
        fontSize: 14,
        color: '#ccc',
    },
    priceRowValue: {
        fontSize: 14,
        color: '#ccc',
        fontWeight: '500',
    },
    totalDivider: {
        height: 1,
        backgroundColor: '#3a3a3a',
        marginVertical: 10,
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
    },
    totalValue: {
        fontSize: 20,
        fontWeight: '700',
        color: '#14b8a6',
    },
    confirmButton: {
        backgroundColor: '#14b8a6',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 15,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    confirmButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    cancelButton: {
        backgroundColor: 'transparent',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#3a3a3a',
    },
    cancelButtonText: {
        color: '#888',
        fontSize: 16,
        fontWeight: '600',
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: 'rgba(20, 184, 166, 0.1)',
        borderRadius: 12,
        padding: 15,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(20, 184, 166, 0.3)',
        gap: 12,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        color: '#ccc',
        lineHeight: 18,
    },
    // ── Success ──
    successContent: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 60,
    },
    successIconContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    successTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 10,
    },
    successSubtitle: {
        fontSize: 15,
        color: '#999',
        textAlign: 'center',
        marginBottom: 40,
    },
    successSummaryCard: {
        backgroundColor: '#2a2a2a',
        borderRadius: 16,
        padding: 20,
        marginBottom: 30,
        borderWidth: 1,
        borderColor: '#3a3a3a',
    },
    summaryRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 15,
    },
    summaryRowContent: {
        flex: 1,
    },
    summaryRowLabel: {
        fontSize: 13,
        color: '#888',
        marginBottom: 5,
    },
    summaryRowValue: {
        fontSize: 16,
        color: '#fff',
        fontWeight: '600',
    },
    summaryDivider: {
        height: 1,
        backgroundColor: '#3a3a3a',
        marginVertical: 15,
    },
    nextStepsCard: {
        backgroundColor: 'rgba(20, 184, 166, 0.05)',
        borderRadius: 16,
        padding: 20,
        marginBottom: 30,
        borderWidth: 1,
        borderColor: 'rgba(20, 184, 166, 0.2)',
    },
    nextStepsTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 20,
    },
    stepItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 15,
        gap: 12,
    },
    stepNumber: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#14b8a6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepNumberText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#fff',
    },
    stepText: {
        flex: 1,
        fontSize: 14,
        color: '#ccc',
        lineHeight: 20,
        paddingTop: 4,
    },
    contactAgencyButton: {
        backgroundColor: '#25D366',
        paddingVertical: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 15,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 10,
        shadowColor: '#25D366',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    contactAgencyButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '700',
    },
    doneButton: {
        backgroundColor: 'transparent',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#3a3a3a',
        marginBottom: 40,
    },
    doneButtonText: {
        color: '#888',
        fontSize: 16,
        fontWeight: '600',
    },
});
