/**
 * ExperienceSummaryCard — bloco compacto "Resumo da experiência".
 *
 * Substitui os dois cards separados (Estilo grande + caixa de Categorias) por
 * uma seção enxuta: uma linha de estilo e uma fileira de chips de categoria
 * discretos. Menos teal, mais hierarquia. "Ideal para" NÃO vem aqui — vive no
 * bloco próprio mais abaixo, para não duplicar.
 *
 * Sem regra de negócio: recebe os dados já resolvidos pela tela
 * (getExperienceStyle / getCategoryChips).
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { Icon, IconName } from '../common/Icons';

export interface ExperienceCategoryChip {
    key: string;
    label: string;
    icon: IconName;
}

export interface ExperienceSummaryCardProps {
    styleLabel?: string | null;
    styleBlurb?: string | null;
    categories: ExperienceCategoryChip[];
    /** Abre o BudgetStyleGuideSheet já existente na tela. */
    onOpenStyleGuide: () => void;
}

export function ExperienceSummaryCard({
    styleLabel,
    styleBlurb,
    categories,
    onOpenStyleGuide,
}: ExperienceSummaryCardProps) {
    const hasStyle = !!styleLabel;
    const hasCategories = categories.length > 0;
    if (!hasStyle && !hasCategories) return null;

    return (
        <View style={styles.card}>
            <Text style={styles.title}>Resumo da experiência</Text>

            {hasStyle && (
                <View style={styles.row}>
                    <Text style={styles.rowLabel}>Estilo</Text>
                    <View style={styles.styleValueWrap}>
                        <Text style={styles.styleValue}>{styleLabel}</Text>
                        {!!styleBlurb && <Text style={styles.styleBlurb}>{styleBlurb}</Text>}
                        <TouchableOpacity
                            onPress={onOpenStyleGuide}
                            hitSlop={6}
                            style={styles.styleLink}
                            accessibilityLabel="Entenda o estilo"
                        >
                            <Ionicons name="help-circle-outline" size={13} color={theme.colors.primary} />
                            <Text style={styles.styleLinkText}>Entenda o estilo</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {hasStyle && hasCategories && <View style={styles.divider} />}

            {hasCategories && (
                <View style={styles.row}>
                    <Text style={styles.rowLabel}>Categorias</Text>
                    <View style={styles.chipsWrap}>
                        {categories.map((chip) => (
                            <View key={chip.key} style={styles.chip}>
                                <Icon name={chip.icon} size={12} color={theme.colors.text.secondary} />
                                <Text style={styles.chipText}>{chip.label}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            )}
        </View>
    );
}

export default ExperienceSummaryCard;

const styles = StyleSheet.create({
    card: {
        backgroundColor: theme.colors.surfaceLight,
        borderRadius: 16,
        padding: 18,
        marginBottom: 16,
    },
    title: {
        fontSize: 17,
        fontWeight: '800',
        color: theme.colors.text.primary,
        marginBottom: 14,
    },
    row: {
        flexDirection: 'row',
        gap: 12,
    },
    rowLabel: {
        width: 74,
        fontSize: 13,
        fontWeight: '700',
        color: theme.colors.text.tertiary,
        paddingTop: 2,
    },
    styleValueWrap: {
        flex: 1,
    },
    styleValue: {
        fontSize: 15,
        fontWeight: '700',
        color: theme.colors.text.primary,
    },
    styleBlurb: {
        fontSize: 12.5,
        color: theme.colors.text.secondary,
        lineHeight: 17,
        marginTop: 3,
    },
    styleLink: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 8,
        alignSelf: 'flex-start',
    },
    styleLinkText: {
        fontSize: 12,
        fontWeight: '700',
        color: theme.colors.primary,
    },
    divider: {
        height: 1,
        backgroundColor: theme.colors.border,
        marginVertical: 14,
    },
    chipsWrap: {
        flex: 1,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
    },
    chipText: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
});
