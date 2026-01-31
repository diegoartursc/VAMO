import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { theme } from '../../theme/theme';

interface DateRangePickerProps {
    startDate?: Date;
    endDate?: Date;
    onStartDateChange: (date: Date) => void;
    onEndDateChange: (date: Date) => void;
    minimumDate?: Date;
}

export function DateRangePicker({
    startDate,
    endDate,
    onStartDateChange,
    onEndDateChange,
    minimumDate = new Date(),
}: DateRangePickerProps) {
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);

    const formatDate = (date?: Date) => {
        if (!date) return 'Selecionar';
        return new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        }).format(date);
    };

    const handleStartDateChange = (event: any, selectedDate?: Date) => {
        setShowStartPicker(Platform.OS === 'ios');
        if (selectedDate) {
            onStartDateChange(selectedDate);
            // Se a data de fim for anterior à nova data de início, ajustar
            if (endDate && selectedDate > endDate) {
                onEndDateChange(selectedDate);
            }
        }
    };

    const handleEndDateChange = (event: any, selectedDate?: Date) => {
        setShowEndPicker(Platform.OS === 'ios');
        if (selectedDate) {
            onEndDateChange(selectedDate);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label}>Período da Viagem</Text>

            <View style={styles.dateRow}>
                {/* Data de Ida */}
                <View style={styles.dateInputContainer}>
                    <Text style={styles.dateLabel}>Ida</Text>
                    <TouchableOpacity
                        style={styles.dateButton}
                        onPress={() => setShowStartPicker(true)}
                    >
                        <Text style={styles.dateIcon}>📅</Text>
                        <Text style={[
                            styles.dateText,
                            !startDate && styles.placeholderText
                        ]}>
                            {formatDate(startDate)}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Data de Volta */}
                <View style={styles.dateInputContainer}>
                    <Text style={styles.dateLabel}>Volta</Text>
                    <TouchableOpacity
                        style={styles.dateButton}
                        onPress={() => setShowEndPicker(true)}
                    >
                        <Text style={styles.dateIcon}>📅</Text>
                        <Text style={[
                            styles.dateText,
                            !endDate && styles.placeholderText
                        ]}>
                            {formatDate(endDate)}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* DatePicker para Data de Ida */}
            {showStartPicker && (
                <DateTimePicker
                    value={startDate || minimumDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleStartDateChange}
                    minimumDate={minimumDate}
                />
            )}

            {/* DatePicker para Data de Volta */}
            {showEndPicker && (
                <DateTimePicker
                    value={endDate || startDate || minimumDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleEndDateChange}
                    minimumDate={startDate || minimumDate}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: theme.spacing.lg,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.md,
    },
    dateRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: theme.spacing.md,
    },
    dateInputContainer: {
        flex: 1,
    },
    dateLabel: {
        fontSize: 14,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.xs,
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 12,
        padding: theme.spacing.md,
        height: 56,
    },
    dateIcon: {
        fontSize: 20,
        marginRight: theme.spacing.sm,
    },
    dateText: {
        fontSize: 16,
        color: theme.colors.text.primary,
        flex: 1,
    },
    placeholderText: {
        color: theme.colors.text.secondary,
    },
});
