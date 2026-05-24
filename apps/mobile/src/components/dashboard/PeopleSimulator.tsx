/**
 * PeopleSimulator — stepper de quantidade de pessoas + simulação do
 * custo total do grupo a partir do `totalInformed` (per-person).
 *
 * IMPORTANTE: Os valores informados pelo criador são SEMPRE por pessoa.
 * Este componente apenas multiplica o total por pessoa pela quantidade
 * — não altera o preço de compra do roteiro nem o detalhamento por
 * item (que continua exibindo "por pessoa").
 *
 * Usado em:
 *   - Detalhes do Roteiro (estado local)
 *   - Roteiro pós-compra (estado persistido via AsyncStorage)
 *   - Prévia da criação (estado local)
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatMoney } from '@vamo/shared/itinerary';
import { theme } from '../../theme/theme';

export interface PeopleSimulatorProps {
    /** Total informado por pessoa (na moeda dominante do roteiro). */
    totalPerPerson: number;
    /** Moeda do total informado. */
    currency: string;
    /** Valor atual do stepper. */
    value: number;
    /** Callback ao alterar a quantidade. */
    onChange: (n: number) => void;
    /** Mínimo permitido (default 1). */
    min?: number;
    /** Máximo permitido (default 20). */
    max?: number;
    /** Esconde o componente se totalPerPerson <= 0 (default true). */
    hideWhenEmpty?: boolean;
}

export default function PeopleSimulator({
    totalPerPerson,
    currency,
    value,
    onChange,
    min = 1,
    max = 20,
    hideWhenEmpty = true,
}: PeopleSimulatorProps) {
    if (hideWhenEmpty && totalPerPerson <= 0) return null;

    const safeValue = Math.max(min, Math.min(max, value || min));
    const totalForGroup = totalPerPerson * safeValue;
    const peopleLabel = safeValue === 1 ? '1 pessoa' : `${safeValue} pessoas`;

    const dec = () => onChange(Math.max(min, safeValue - 1));
    const inc = () => onChange(Math.min(max, safeValue + 1));

    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <Ionicons name="people-outline" size={16} color={theme.colors.primary} />
                <Text style={styles.title}>Simule para mais pessoas</Text>
            </View>
            <Text style={styles.helper}>
                Os valores informados pelo criador são por pessoa. Ajuste para estimar o total do grupo.
            </Text>

            {/* Stepper */}
            <View style={styles.stepperRow}>
                <Text style={styles.stepperLabel}>Quantidade de pessoas</Text>
                <View style={styles.stepper}>
                    <TouchableOpacity
                        style={[styles.stepperBtn, safeValue <= min && styles.stepperBtnDisabled]}
                        onPress={dec}
                        disabled={safeValue <= min}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="remove" size={18} color={safeValue <= min ? theme.colors.text.tertiary : theme.colors.primary} />
                    </TouchableOpacity>
                    <Text style={styles.stepperValue}>{safeValue}</Text>
                    <TouchableOpacity
                        style={[styles.stepperBtn, safeValue >= max && styles.stepperBtnDisabled]}
                        onPress={inc}
                        disabled={safeValue >= max}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="add" size={18} color={safeValue >= max ? theme.colors.text.tertiary : theme.colors.primary} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Resumo: por pessoa + para o grupo */}
            <View style={styles.summaryRow}>
                <View style={styles.summaryCell}>
                    <Text style={styles.summaryLabel}>Por pessoa</Text>
                    <Text style={styles.summaryValue}>
                        {formatMoney(totalPerPerson, currency)}
                    </Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryCell}>
                    <Text style={styles.summaryLabel}>Para {peopleLabel}</Text>
                    <Text style={[styles.summaryValue, styles.summaryValueGroup]}>
                        {formatMoney(totalForGroup, currency)}
                    </Text>
                </View>
            </View>

            <Text style={styles.disclaimer}>
                Estimativa baseada apenas nos itens com valor informado. Valores podem variar conforme data, temporada, câmbio e disponibilidade.
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        marginTop: 10,
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: theme.colors.primary + '33',
        backgroundColor: theme.colors.primary + '08',
        gap: 10,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    title: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.colors.text.primary,
    },
    helper: {
        fontSize: 12,
        color: theme.colors.text.secondary,
        lineHeight: 17,
    },
    stepperRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 2,
    },
    stepperLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.text.primary,
        flex: 1,
    },
    stepper: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#fff',
        borderRadius: 999,
        borderWidth: 1,
        borderColor: theme.colors.border,
        paddingHorizontal: 4,
    },
    stepperBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepperBtnDisabled: {
        opacity: 0.5,
    },
    stepperValue: {
        minWidth: 28,
        textAlign: 'center',
        fontSize: 15,
        fontWeight: '700',
        color: theme.colors.text.primary,
    },
    summaryRow: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    summaryCell: {
        flex: 1,
        gap: 2,
    },
    summaryDivider: {
        width: StyleSheet.hairlineWidth,
        backgroundColor: theme.colors.border,
        marginHorizontal: 10,
    },
    summaryLabel: {
        fontSize: 11,
        color: theme.colors.text.tertiary,
        fontWeight: '600',
    },
    summaryValue: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.text.primary,
    },
    summaryValueGroup: {
        color: theme.colors.primary,
    },
    disclaimer: {
        fontSize: 10,
        color: theme.colors.text.tertiary,
        fontStyle: 'italic',
        lineHeight: 14,
    },
});
