/**
 * TravelCostSummarySection — seção ÚNICA de custos da tela pública de
 * Detalhes do Roteiro.
 *
 * Substitui as três áreas antigas ("Referência de custos da viagem" +
 * "Referência de Gastos por Pessoa" + "Simule para mais pessoas") por um
 * único card com 4 blocos internos (resumo geral, categorias, simulador,
 * aviso) — ver auditoria da reformulação da área de custos.
 *
 * Toda a matemática vem de `buildConsolidatedCostSummary` (fonte única da
 * verdade em @vamo/shared/itinerary/cost.ts): total geral, percentuais,
 * lista por categoria e simulador consomem a MESMA estrutura, nunca
 * cálculos paralelos.
 *
 * Privacidade: só mostra CATEGORIAS agregadas (Voo, Hospedagem, Passeios,
 * Transporte, Restaurantes, Gastos Extras) — nunca nome de hotel, atração,
 * fornecedor ou item individual. Isso preserva o valor comercial do
 * conteúdo pago (fica só no roteiro adquirido).
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Icon, IconName } from '../common/Icons';
import { theme } from '../../theme/theme';
import {
    buildConsolidatedCostSummary,
    formatMoney,
    type CostReferencesGroup,
    type ConsolidatedCostCategory,
    type ItineraryFormState,
} from '@vamo/shared/itinerary';
import { convertToBase } from '../../utils/currencyConversion';
import { BASE_CURRENCY } from '@vamo/shared/itinerary';

export interface TravelCostSummarySectionProps {
    form: Partial<ItineraryFormState> | null | undefined;
    activeModules?: string[] | null;
    currencyRates: Record<string, number>;
    peopleCount: number;
    onPeopleCountChange: (value: number) => void;
}

const MODULE_ICONS: Record<CostReferencesGroup['moduleKey'], IconName> = {
    voo: 'plane',
    hospedagem: 'hotel',
    passeios: 'compass',
    transporte: 'car',
    restaurantes: 'utensils',
    gastos_extras: 'star',
};

const STATUS_META: Record<ConsolidatedCostCategory['status'], { label: string; color: string }> = {
    verified: { label: 'Verified amount', color: theme.colors.verified },
    estimated: { label: 'Estimated amount', color: theme.colors.info },
    mixed: { label: 'Partially verified', color: theme.colors.warning },
};

const SIM_MIN = 1;
const SIM_MAX = 20;

export function TravelCostSummarySection({
    form, activeModules, currencyRates, peopleCount, onPeopleCountChange,
}: TravelCostSummarySectionProps) {
    const [missingExpanded, setMissingExpanded] = useState(false);

    const summary = buildConsolidatedCostSummary(
        form,
        activeModules,
        (amount, currency) => convertToBase(amount, currency, currencyRates),
    );

    const isPureVerified = summary.hasAnyData && summary.estimatedAmountBase === 0;
    const isPureEstimated = summary.hasAnyData && summary.verifiedAmountBase === 0;
    const isMixedTotal = summary.hasAnyData && summary.verifiedAmountBase > 0 && summary.estimatedAmountBase > 0;

    return (
        <View style={styles.card}>
            {/* ── Bloco 1: resumo geral ── */}
            <View style={styles.headerRow}>
                <View style={styles.headerIcon}>
                    <Icon name="wallet" size={18} color={theme.colors.primaryDark} />
                </View>
                <Text style={styles.title}>Trip cost reference</Text>
            </View>

            {!summary.hasAnyData ? (
                <Text style={styles.emptyText}>
                    There's no cost estimate available for this itinerary yet.
                </Text>
            ) : (
                <>
                    <Text
                        style={styles.totalValue}
                        accessibilityLabel={`Reference amount per person: ${formatMoney(summary.perPersonTotalBase, BASE_CURRENCY)}`}
                    >
                        {formatMoney(summary.perPersonTotalBase, BASE_CURRENCY)}
                        <Text style={styles.totalSuffix}> per person</Text>
                    </Text>

                    {isMixedTotal && (
                        <>
                            <View
                                style={styles.progressBar}
                                accessibilityRole="progressbar"
                                accessibilityLabel={`${summary.verifiedPercentage}% verified, ${summary.estimatedPercentage}% estimated`}
                            >
                                <View style={[styles.progressVerified, { flex: summary.verifiedPercentage || 0.0001 }]} />
                                <View style={[styles.progressEstimated, { flex: summary.estimatedPercentage || 0.0001 }]} />
                            </View>
                            <Text style={styles.progressLabel}>
                                {summary.verifiedPercentage}% comprovado · {summary.estimatedPercentage}% estimado
                                {summary.missingCategories.length > 0 && (
                                    ` · ${summary.missingCategories.length} ${summary.missingCategories.length === 1 ? 'category without an amount' : 'categories without an amount'}`
                                )}
                            </Text>
                        </>
                    )}
                    {(isPureVerified || isPureEstimated) && (
                        <Text style={[styles.progressLabel, { color: isPureVerified ? theme.colors.verified : theme.colors.info, fontWeight: '700' }]}>
                            {isPureVerified ? '100% verified' : '100% estimated'}
                            {summary.missingCategories.length > 0 && (
                                ` · ${summary.missingCategories.length} ${summary.missingCategories.length === 1 ? 'category without an amount' : 'categories without an amount'}`
                            )}
                        </Text>
                    )}

                    {summary.hasConversionFailure && (
                        <View style={styles.conversionWarningRow}>
                            <Icon name="info" size={12} color={theme.colors.warning} />
                            <Text style={styles.conversionWarningText}>
                                Alguns valores não puderam ser convertidos para {BASE_CURRENCY} agora — o total pode estar subestimado.
                            </Text>
                        </View>
                    )}

                    {/* ── Bloco 2: lista por categoria ── */}
                    <View style={styles.divider} />
                    <View style={{ gap: 12 }}>
                        {summary.categories.map((cat) => (
                            <CategoryRow key={cat.moduleKey} category={cat} />
                        ))}
                    </View>

                    {summary.missingCategories.length > 0 && (
                        <TouchableOpacity
                            style={styles.missingRow}
                            onPress={() => setMissingExpanded((v) => !v)}
                            activeOpacity={0.7}
                            accessibilityRole="button"
                            accessibilityLabel={missingExpanded ? 'Hide categories without an amount' : 'Show categories without an amount'}
                        >
                            <Text style={styles.missingText}>
                                {missingExpanded
                                    ? `No amount yet: ${summary.missingCategories.join(', ')}.`
                                    : `${summary.missingCategories.length} ${summary.missingCategories.length === 1 ? 'category without an amount' : 'categories without an amount'}`}
                            </Text>
                            <Ionicons
                                name={missingExpanded ? 'chevron-up' : 'chevron-down'}
                                size={14}
                                color={theme.colors.text.tertiary}
                            />
                        </TouchableOpacity>
                    )}

                    {/* ── Bloco 3: simulador de grupo ── */}
                    <View style={styles.divider} />
                    <GroupSimulatorBlock
                        perPersonBase={summary.perPersonTotalBase}
                        value={peopleCount}
                        onChange={onPeopleCountChange}
                    />

                    {/* ── Bloco 4: aviso (uma única vez) ── */}
                    <View style={styles.divider} />
                    <View style={styles.disclaimerRow}>
                        <Icon name="info" size={13} color={theme.colors.text.tertiary} />
                        <Text style={styles.disclaimerText}>
                            Amounts are references provided by the creator and can vary by date, season,
                            exchange rate, how far ahead you book, availability and spending style.
                            {summary.verifiedAmountBase > 0 && (
                                ' Approved proof reflects amounts the creator paid in that context and does not guarantee the same price for other dates or travelers.'
                            )}
                        </Text>
                    </View>
                </>
            )}
        </View>
    );
}

function CategoryRow({ category }: { category: ConsolidatedCostCategory }) {
    const meta = STATUS_META[category.status];
    const showOriginal = !!category.originalCurrency && category.originalCurrency !== BASE_CURRENCY;
    const showMixedOriginals = !category.originalCurrency && category.originalCurrencies.length > 1;

    const a11yLabel = [
        category.moduleLabel,
        formatMoney(category.perPersonBase, BASE_CURRENCY) + ' per person',
        meta.label,
    ].join(', ');

    return (
        <View style={styles.categoryRow} accessibilityLabel={a11yLabel}>
            <View style={styles.categoryIconWrap}>
                <Icon name={MODULE_ICONS[category.moduleKey]} size={16} color={theme.colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
                <View style={styles.categoryTopRow}>
                    <Text style={styles.categoryLabel} numberOfLines={1}>{category.moduleLabel}</Text>
                    <Text style={styles.categoryAmount}>{formatMoney(category.perPersonBase, BASE_CURRENCY)}</Text>
                </View>

                {showOriginal && (
                    <Text style={styles.categorySub} numberOfLines={1}>
                        {formatMoney(category.originalAmountPerPerson ?? 0, category.originalCurrency!)} per person
                        {' ≈ '}{formatMoney(category.perPersonBase, BASE_CURRENCY)}
                    </Text>
                )}
                {showMixedOriginals && (
                    <Text style={styles.categorySub} numberOfLines={1}>
                        Amounts originally provided in {category.originalCurrencies.join(' and ')}
                    </Text>
                )}
                {category.sharedBase && (
                    <Text style={styles.categoryMeta}>
                        Base: {formatMoney(category.sharedBase.amountTotal, category.sharedBase.currency)} for {category.sharedBase.people} people
                    </Text>
                )}
                {category.hasConversionGap && (
                    <Text style={styles.conversionGapText}>
                        {BASE_CURRENCY} equivalent unavailable for part of this amount.
                    </Text>
                )}

                <View style={styles.statusRow}>
                    <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
                    {category.status === 'mixed' && (
                        <Text style={styles.statusMixedDetail}>
                            {' · '}{formatMoney(category.verifiedBase, BASE_CURRENCY)} verified · {formatMoney(category.estimatedBase, BASE_CURRENCY)} estimated
                        </Text>
                    )}
                </View>
            </View>
        </View>
    );
}

function GroupSimulatorBlock({
    perPersonBase, value, onChange,
}: { perPersonBase: number; value: number; onChange: (n: number) => void }) {
    const safeValue = Math.max(SIM_MIN, Math.min(SIM_MAX, value || SIM_MIN));
    const totalGroup = Math.round(perPersonBase * safeValue * 100) / 100;
    const peopleLabel = safeValue === 1 ? '1 person' : `${safeValue} people`;

    const dec = () => onChange(Math.max(SIM_MIN, safeValue - 1));
    const inc = () => onChange(Math.min(SIM_MAX, safeValue + 1));

    return (
        <View>
            <View style={styles.simHeaderRow}>
                <Icon name="users" size={16} color={theme.colors.primary} />
                <Text style={styles.simTitle}>Estimate for your group</Text>
            </View>
            <Text style={styles.simHelper}>
                The reference amount is calculated per person. Adjust the number to estimate the group total.
            </Text>

            <View style={styles.simStepperRow}>
                <Text style={styles.simStepperLabel}>Number of people</Text>
                <View style={styles.stepper}>
                    <TouchableOpacity
                        style={[styles.stepperBtn, safeValue <= SIM_MIN && styles.stepperBtnDisabled]}
                        onPress={dec}
                        disabled={safeValue <= SIM_MIN}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel="Decrease number of people"
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <Ionicons name="remove" size={18} color={safeValue <= SIM_MIN ? theme.colors.text.tertiary : theme.colors.primary} />
                    </TouchableOpacity>
                    <Text style={styles.stepperValue}>{safeValue}</Text>
                    <TouchableOpacity
                        style={[styles.stepperBtn, safeValue >= SIM_MAX && styles.stepperBtnDisabled]}
                        onPress={inc}
                        disabled={safeValue >= SIM_MAX}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel="Increase number of people"
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <Ionicons name="add" size={18} color={safeValue >= SIM_MAX ? theme.colors.text.tertiary : theme.colors.primary} />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.simSummaryRow}>
                <View style={styles.simSummaryCell}>
                    <Text style={styles.simSummaryLabel}>Per person</Text>
                    <Text style={styles.simSummaryValue}>{formatMoney(perPersonBase, BASE_CURRENCY)}</Text>
                </View>
                <View style={styles.simSummaryDivider} />
                <View style={styles.simSummaryCell}>
                    <Text style={styles.simSummaryLabel}>Total for {peopleLabel}</Text>
                    <Text style={[styles.simSummaryValue, styles.simSummaryValueGroup]}>
                        {formatMoney(totalGroup, BASE_CURRENCY)}
                    </Text>
                </View>
            </View>
        </View>
    );
}

export default TravelCostSummarySection;

const styles = StyleSheet.create({
    card: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        ...theme.shadows.small,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 12,
    },
    headerIcon: {
        width: 32,
        height: 32,
        borderRadius: theme.borderRadius.sm,
        backgroundColor: 'rgba(40, 201, 191, 0.12)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        flex: 1,
        fontSize: 15,
        fontWeight: '800',
        color: theme.colors.text.primary,
    },
    emptyText: {
        fontSize: 13,
        color: theme.colors.text.secondary,
        lineHeight: 18,
    },
    totalValue: {
        fontSize: 26,
        fontWeight: '800',
        color: theme.colors.secondary,
        marginBottom: 8,
    },
    totalSuffix: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text.tertiary,
    },
    progressBar: {
        flexDirection: 'row',
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
        backgroundColor: theme.colors.borderLight,
    },
    progressVerified: {
        backgroundColor: theme.colors.verified,
    },
    progressEstimated: {
        backgroundColor: theme.colors.info,
    },
    progressLabel: {
        marginTop: 6,
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.text.secondary,
    },
    conversionWarningRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 6,
        marginTop: 8,
    },
    conversionWarningText: {
        flex: 1,
        fontSize: 11,
        color: theme.colors.warning,
        lineHeight: 15,
    },
    divider: {
        height: 1,
        backgroundColor: theme.colors.borderLight,
        marginVertical: 14,
    },
    // ── Categoria ──
    categoryRow: {
        flexDirection: 'row',
        gap: 10,
    },
    categoryIconWrap: {
        width: 30,
        height: 30,
        borderRadius: theme.borderRadius.sm,
        backgroundColor: theme.colors.surfaceLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 1,
    },
    categoryTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    },
    categoryLabel: {
        flex: 1,
        fontSize: 13.5,
        fontWeight: '700',
        color: theme.colors.text.primary,
    },
    categoryAmount: {
        fontSize: 13.5,
        fontWeight: '800',
        color: theme.colors.text.primary,
    },
    categorySub: {
        fontSize: 11.5,
        color: theme.colors.text.secondary,
        marginTop: 2,
    },
    categoryMeta: {
        fontSize: 11,
        color: theme.colors.text.tertiary,
        marginTop: 2,
    },
    conversionGapText: {
        fontSize: 11,
        color: theme.colors.warning,
        marginTop: 2,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        marginTop: 4,
    },
    statusText: {
        fontSize: 11.5,
        fontWeight: '700',
    },
    statusMixedDetail: {
        fontSize: 11,
        color: theme.colors.text.tertiary,
    },
    // ── Categorias sem valor ──
    missingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 12,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: theme.colors.borderLight,
    },
    missingText: {
        flex: 1,
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.text.tertiary,
    },
    // ── Simulador ──
    simHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    simTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.colors.text.primary,
    },
    simHelper: {
        fontSize: 12,
        color: theme.colors.text.secondary,
        lineHeight: 17,
        marginBottom: 10,
    },
    simStepperRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    simStepperLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.text.primary,
        flex: 1,
    },
    stepper: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: theme.colors.surfaceLight,
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
    simSummaryRow: {
        flexDirection: 'row',
        backgroundColor: theme.colors.surfaceLight,
        borderRadius: 12,
        padding: 12,
    },
    simSummaryCell: {
        flex: 1,
        gap: 2,
    },
    simSummaryDivider: {
        width: StyleSheet.hairlineWidth,
        backgroundColor: theme.colors.border,
        marginHorizontal: 10,
    },
    simSummaryLabel: {
        fontSize: 11,
        color: theme.colors.text.tertiary,
        fontWeight: '600',
    },
    simSummaryValue: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.text.primary,
    },
    simSummaryValueGroup: {
        color: theme.colors.primary,
    },
    // ── Aviso ──
    disclaimerRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
    },
    disclaimerText: {
        flex: 1,
        fontSize: 11,
        lineHeight: 15,
        color: theme.colors.text.tertiary,
    },
});
