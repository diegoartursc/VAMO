import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Modal,
    ScrollView,
    Pressable,
} from 'react-native';
import { theme } from '../../theme/theme';

interface DatePickerModalProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (startDate: Date, endDate: Date, label: string) => void;
}

interface QuickOption {
    id: string;
    label: string;
    icon: string;
    getRange: () => { start: Date; end: Date };
}

const getNextWeekend = (): { start: Date; end: Date } => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7;
    const start = new Date(today);
    start.setDate(today.getDate() + daysUntilSaturday);
    const end = new Date(start);
    end.setDate(start.getDate() + 1);
    return { start, end };
};

const getNextWeek = (): { start: Date; end: Date } => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() + 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { start, end };
};

const getNextMonth = (): { start: Date; end: Date } => {
    const today = new Date();
    const start = new Date(today);
    start.setMonth(today.getMonth() + 1);
    start.setDate(1);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { start, end };
};

const getNextHoliday = (): { start: Date; end: Date } => {
    const today = new Date();
    const holidays: Date[] = [
        new Date(today.getFullYear(), 1, 20), // Carnaval
        new Date(today.getFullYear(), 3, 21), // Tiradentes
        new Date(today.getFullYear(), 4, 1),  // Dia do Trabalhador
        new Date(today.getFullYear(), 8, 7),  // Independência
        new Date(today.getFullYear(), 9, 12), // N. Sra. Aparecida
        new Date(today.getFullYear(), 10, 2), // Finados
        new Date(today.getFullYear(), 10, 15), // Proclamação República
        new Date(today.getFullYear(), 11, 25), // Natal
        new Date(today.getFullYear() + 1, 0, 1), // Ano Novo
    ];

    const nextHoliday = holidays.find(h => h > today) || holidays[0];
    const start = new Date(nextHoliday);
    start.setDate(nextHoliday.getDate() - 1);
    const end = new Date(nextHoliday);
    end.setDate(nextHoliday.getDate() + 2);
    return { start, end };
};

const QUICK_OPTIONS: QuickOption[] = [
    {
        id: 'weekend',
        label: 'Próximo fim de semana',
        icon: '🌴',
        getRange: getNextWeekend,
    },
    {
        id: 'next-week',
        label: 'Próxima semana',
        icon: '📅',
        getRange: getNextWeek,
    },
    {
        id: 'next-month',
        label: 'Próximo mês',
        icon: '🗓️',
        getRange: getNextMonth,
    },
    {
        id: 'holiday',
        label: 'Próximo feriado',
        icon: '🎉',
        getRange: getNextHoliday,
    },
    {
        id: 'flexible',
        label: 'Tenho datas flexíveis (±3 dias)',
        icon: '🔄',
        getRange: () => {
            const today = new Date();
            const start = new Date(today);
            start.setDate(today.getDate() + 14);
            const end = new Date(start);
            end.setDate(start.getDate() + 7);
            return { start, end };
        },
    },
];

const formatDate = (date: Date): string => {
    const options: Intl.DateTimeFormatOptions = {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
    };
    return date.toLocaleDateString('pt-BR', options);
};

export function DatePickerModal({ visible, onClose, onSelect }: DatePickerModalProps) {
    const handleSelectOption = (option: QuickOption) => {
        const { start, end } = option.getRange();
        const label = `${formatDate(start)} - ${formatDate(end)}`;
        onSelect(start, end, label);
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <Pressable style={styles.overlay} onPress={onClose}>
                <Pressable style={styles.modal} onPress={() => { }}>
                    <View style={styles.handle} />

                    <Text style={styles.title}>Quando você quer viajar?</Text>
                    <Text style={styles.subtitle}>
                        Escolha uma opção rápida ou selecione datas específicas
                    </Text>

                    <ScrollView style={styles.optionsList}>
                        {QUICK_OPTIONS.map((option) => (
                            <TouchableOpacity
                                key={option.id}
                                style={styles.optionItem}
                                onPress={() => handleSelectOption(option)}
                            >
                                <Text style={styles.optionIcon}>{option.icon}</Text>
                                <View style={styles.optionContent}>
                                    <Text style={styles.optionLabel}>{option.label}</Text>
                                    <Text style={styles.optionDates}>
                                        {formatDate(option.getRange().start)} - {formatDate(option.getRange().end)}
                                    </Text>
                                </View>
                                <Text style={styles.optionArrow}>→</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <View style={styles.divider}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>ou</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    <TouchableOpacity style={styles.customButton}>
                        <Text style={styles.customButtonIcon}>📆</Text>
                        <Text style={styles.customButtonText}>Escolher datas específicas</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Text style={styles.closeButtonText}>Cancelar</Text>
                    </TouchableOpacity>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modal: {
        backgroundColor: theme.colors.background,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: theme.spacing.lg,
        paddingBottom: 40,
        maxHeight: '80%',
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: theme.colors.border,
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: theme.spacing.md,
        marginBottom: theme.spacing.lg,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.xs,
    },
    subtitle: {
        fontSize: 14,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.lg,
    },
    optionsList: {
        maxHeight: 300,
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
        gap: theme.spacing.md,
    },
    optionIcon: {
        fontSize: 28,
        width: 40,
        textAlign: 'center',
    },
    optionContent: {
        flex: 1,
    },
    optionLabel: {
        fontSize: 15,
        fontWeight: '500',
        color: theme.colors.text.primary,
        marginBottom: 2,
    },
    optionDates: {
        fontSize: 13,
        color: theme.colors.text.secondary,
    },
    optionArrow: {
        fontSize: 18,
        color: theme.colors.primary,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: theme.spacing.lg,
        gap: theme.spacing.md,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: theme.colors.borderLight,
    },
    dividerText: {
        fontSize: 13,
        color: theme.colors.text.secondary,
    },
    customButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.surface,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        gap: theme.spacing.sm,
    },
    customButtonIcon: {
        fontSize: 18,
    },
    customButtonText: {
        fontSize: 15,
        fontWeight: '500',
        color: theme.colors.text.primary,
    },
    closeButton: {
        alignItems: 'center',
        paddingVertical: theme.spacing.md,
        marginTop: theme.spacing.md,
    },
    closeButtonText: {
        fontSize: 15,
        color: theme.colors.text.secondary,
    },
});
