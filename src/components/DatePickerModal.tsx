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

interface DatePickerModalProps {
    visible: boolean;
    onClose: () => void;
    onSelectDate?: (date: Date, travelers: number) => void;
    packageTitle?: string;
    agencyName?: string;
    agencyPhone?: string;
}

const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export default function DatePickerModal({
    visible,
    onClose,
    onSelectDate,
    packageTitle,
    agencyName,
    agencyPhone
}: DatePickerModalProps) {
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [viewMode, setViewMode] = useState<'calendar' | 'confirmation' | 'success'>('calendar');
    const [travelerCount, setTravelerCount] = useState(1);

    // Generate next 3 months
    const generateMonths = () => {
        const months = [];
        const today = new Date();

        for (let i = 0; i < 3; i++) {
            const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
            months.push(date);
        }
        return months;
    };

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days = [];

        // Previous month's trailing days
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push({ day: '', disabled: true, date: null });
        }

        // Current month's days
        const today = new Date();
        for (let day = 1; day <= daysInMonth; day++) {
            const currentDate = new Date(year, month, day);
            const isPast = currentDate < new Date(today.getFullYear(), today.getMonth(), today.getDate());

            days.push({
                day: day.toString(),
                disabled: isPast,
                date: currentDate,
            });
        }

        return days;
    };

    const handleDateSelect = (date: Date | null) => {
        if (!date) return;
        setSelectedDate(date);
        setViewMode('confirmation');
    };

    const handleConfirm = () => {
        if (selectedDate && onSelectDate) {
            onSelectDate(selectedDate, travelerCount);
        }
        setViewMode('success');
    };

    const handleClose = () => {
        onClose();
        // Reset state after modal closes
        setTimeout(() => {
            setViewMode('calendar');
            setSelectedDate(null);
            setTravelerCount(1);
        }, 300);
    };

    const renderCalendar = () => (
        <ScrollView style={styles.scrollView}>
            <View style={styles.header}>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <Ionicons name="close" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Selecionar datas</Text>
            </View>

            <View style={styles.toggleContainer}>
                <TouchableOpacity style={styles.toggleButton}>
                    <Text style={styles.toggleButtonText}>Amanhã</Text>
                </TouchableOpacity>
            </View>

            {generateMonths().map((monthDate, index) => (
                <View key={index} style={styles.monthContainer}>
                    <Text style={styles.monthTitle}>
                        {MONTHS[monthDate.getMonth()]} {monthDate.getFullYear()}
                    </Text>

                    <View style={styles.weekDaysRow}>
                        {DAYS_OF_WEEK.map((day) => (
                            <Text key={day} style={styles.weekDayText}>
                                {day}
                            </Text>
                        ))}
                    </View>

                    <View style={styles.daysGrid}>
                        {getDaysInMonth(monthDate).map((item, idx) => (
                            <Pressable
                                key={idx}
                                style={[
                                    styles.dayCell,
                                    item.disabled && styles.dayCellDisabled,
                                    selectedDate?.getTime() === item.date?.getTime() && styles.dayCellSelected,
                                ]}
                                disabled={item.disabled || !item.date}
                                onPress={() => handleDateSelect(item.date)}
                            >
                                <Text
                                    style={[
                                        styles.dayText,
                                        item.disabled && styles.dayTextDisabled,
                                        selectedDate?.getTime() === item.date?.getTime() && styles.dayTextSelected,
                                    ]}
                                >
                                    {item.day}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                </View>
            ))}

            <View style={styles.bottomPadding} />
        </ScrollView>
    );

    const renderConfirmation = () => (
        <View style={styles.confirmationContainer}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => setViewMode('calendar')}
                    style={styles.closeButton}
                >
                    <Ionicons name="arrow-back" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Confirmar reserva</Text>
            </View>

            <ScrollView style={styles.confirmationContent}>
                {/* Date Card */}
                <View style={styles.dateCard}>
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

                {/* Travelers Count */}
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>Número de viajantes</Text>
                    <View style={styles.travelerCounter}>
                        <TouchableOpacity
                            style={styles.counterButton}
                            onPress={() => setTravelerCount(Math.max(1, travelerCount - 1))}
                        >
                            <Text style={styles.counterButtonText}>−</Text>
                        </TouchableOpacity>
                        <Text style={styles.travelerCount}>{travelerCount}</Text>
                        <TouchableOpacity
                            style={styles.counterButton}
                            onPress={() => setTravelerCount(travelerCount + 1)}
                        >
                            <Text style={styles.counterButtonText}>+</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Important Info */}
                <View style={styles.infoBox}>
                    <Ionicons name="information-circle" size={20} color="#14b8a6" />
                    <Text style={styles.infoText}>
                        Após confirmar, você receberá um email com os detalhes da solicitação.
                        A agência entrará em contato em até 24h para finalizar a reserva.
                    </Text>
                </View>

                <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
                    <Text style={styles.confirmButtonText}>Confirmar Solicitação</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setViewMode('calendar')}
                >
                    <Text style={styles.cancelButtonText}>Escolher Outra Data</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );

    const renderSuccess = () => (
        <View style={styles.successContainer}>
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
                                {travelerCount} {travelerCount === 1 ? 'pessoa' : 'pessoas'}
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

                {agencyName && agencyPhone && (
                    <TouchableOpacity
                        style={styles.contactAgencyButton}
                        onPress={() => {
                            const message = `Olá! Acabei de solicitar uma reserva para ${packageTitle} para ${travelerCount} pessoa(s).`;
                            const whatsappUrl = `https://wa.me/${agencyPhone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
                            require('react-native').Linking.openURL(whatsappUrl);
                        }}
                    >
                        <Ionicons name="logo-whatsapp" size={24} color="#fff" />
                        <Text style={styles.contactAgencyButtonText}>
                            Falar com {agencyName}
                        </Text>
                    </TouchableOpacity>
                )}

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
                {viewMode === 'calendar' && renderCalendar()}
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
    toggleContainer: {
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    toggleButton: {
        backgroundColor: '#2a2a2a',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: '#3a3a3a',
    },
    toggleButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '500',
    },
    monthContainer: {
        paddingHorizontal: 20,
        marginBottom: 30,
    },
    monthTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 15,
    },
    weekDaysRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    weekDayText: {
        width: '14%',
        textAlign: 'center',
        fontSize: 12,
        color: '#888',
        fontWeight: '600',
    },
    daysGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    dayCell: {
        width: '14.28%',
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    dayCellDisabled: {
        opacity: 0.3,
    },
    dayCellSelected: {
        backgroundColor: '#14b8a6',
        borderRadius: 8,
    },
    dayText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: '400',
    },
    dayTextDisabled: {
        color: '#555',
    },
    dayTextSelected: {
        color: '#fff',
        fontWeight: '700',
    },
    bottomPadding: {
        height: 40,
    },
    confirmationContainer: {
        flex: 1,
        backgroundColor: '#1a1a1a',
    },
    confirmationContent: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 40,
    },
    dateCard: {
        backgroundColor: '#2a2a2a',
        borderRadius: 16,
        padding: 30,
        alignItems: 'center',
        marginBottom: 30,
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
    packageTitleText: {
        fontSize: 14,
        color: '#888',
        marginTop: 8,
        textAlign: 'center',
    },
    confirmButton: {
        backgroundColor: '#14b8a6',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 15,
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
    summaryCard: {
        backgroundColor: '#2a2a2a',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
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
    travelerCounter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        marginTop: 10,
    },
    counterButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#14b8a6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    counterButtonText: {
        fontSize: 24,
        color: '#fff',
        fontWeight: '600',
    },
    travelerCount: {
        fontSize: 24,
        color: '#fff',
        fontWeight: '700',
        minWidth: 40,
        textAlign: 'center',
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: 'rgba(20, 184, 166, 0.1)',
        borderRadius: 12,
        padding: 15,
        marginBottom: 30,
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
    // Success Screen Styles
    successContainer: {
        flex: 1,
        backgroundColor: '#1a1a1a',
    },
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
