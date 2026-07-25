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
import { convertToAud } from '../../utils/currencyConversion';

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
    verified: { label: 'Valor comprovado', color: theme.colors.verified },
    estimated: { label: 'Valor estimado', color: theme.colors.info },
    mixed: { label: 'Parcialmente comprovado', color: theme.colors.warning },
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
        (amount, currency) => convertToAud(amount, currency, currencyRates),
    );

    const isPureVerified = summary.hasAnyData && summary.estimatedAmountAUD === 0;
    const isPureEstimated = summary.hasAnyData && summary.verifiedAmountAUD === 0;
    const isMixedTotal = summary.hasAnyData && summary.verifiedAmountAUD > 0 && summary.estimatedAmountAUD > 0;

    return (
        <View style={styles.card}>
            {/* ── Bloco 1: resumo geral ── */}
            <View style={styles.headerRow}>
                <View style={styles.headerIcon}>
                    <Icon name="wallet" size={18} color={theme.colors.primaryDark} />
                </View>
                <Text style={styles.title}>Referência de custos da viagem</Text>
            </View>

            {!summary.hasAnyData ? (
                <Text style={styles.emptyText}>
                    Ainda não há uma estimativa de custos disponível para este roteiro.
                </Text>
            ) : (
                <>
                    <Text
                        style={styles.totalValue}
                        accessibilityLabel={`Valor de referência por pessoa: ${formatMoney(summary.perPersonTotalAUD, 'AUD')}`}
                    >
                        {formatMoney(summary.perPersonTotalAUD, 'AUD')}
                        <Text style={styles.totalSuffix}> por pessoa</Text>
                    </Text>

                    {isMixedTotal && (
                        <>
                            <View
                                style={styles.progressBar}
                                accessibilityRole="progressbar"
                                accessibilityLabel={`${summary.verifiedPercentage}% comprovado, ${summary.estimatedPercentage}% estimado`}
                            >
                                <View style={[styles.progressVerified, { flex: summary.verifiedPercentage || 0.0001 }]} />
                                <View style={[styles.progressEstimated, { flex: summary.estimatedPercentage || 0.0001 }]} />
                            </View>
                            <Text style={styles.progressLabel}>
                                {summary.verifiedPercentage}% comprovado · {summary.estimatedPercentage}% estimado
                                {summary.missingCategories.length > 0 && (
                                    ` · ${summary.missingCategories.length} ${summary.missingCategories.length === 1 ? 'categoria sem valor' : 'categorias sem valor'}`
                                )}
                            </Text>
                        </>
                    )}
                    {(isPureVerified || isPureEstimated) && (
                        <Text style={[styles.progressLabel, { color: isPureVerified ? theme.colors.verified : theme.colors.info, fontWeight: '700' }]}>
                            {isPureVerified ? '100% comprovado' : '100% estimado'}
                            {summary.missingCategories.length > 0 && (
                                ` · ${summary.missingCategories.length} ${summary.missingCategories.length === 1 ? 'categoria sem valor' : 'categorias sem valor'}`
                            )}
                        </Text>
                    )}

                    {summary.hasConversionFailure && (
                        <View style={styles.conversionWarningRow}>
                            <Icon name="info" size={12} color={theme.colors.warning} />
                            <Text style={styles.conversionWarningText}>
                                Alguns valores não puderam ser convertidos para AUD agora — o total pode estar subestimado.
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
                            accessibilityLabel={missingExpanded ? 'Ocultar categorias sem valor' : 'Ver categorias sem valor'}
                        >
                            <Text style={styles.missingText}>
                                {missingExpanded
                                    ? `Ainda sem valor: ${summary.missingCategories.join(', ')}.`
                                    : `${summary.missingCategories.length} ${summary.missingCategories.length === 1 ? 'categoria sem valor' : 'categorias sem valor'}`}
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
                        perPersonAUD={summary.perPersonTotalAUD}
                        value={peopleCount}
                        onChange={onPeopleCountChange}
                    />

                    {/* ── Bloco 4: aviso (uma única vez) ── */}
                    <View style={styles.divider} />
                    <View style={styles.disclaimerRow}>
                        <Icon name="info" size={13} color={theme.colors.text.tertiary} />
                        <Text style={styles.disclaimerText}>
                            Os valores são referências informadas pelo criador e podem variar conforme data, temporada,
                            câmbio, antecedência, disponibilidade e estilo de consumo.
                            {summary.verifiedAmountAUD > 0 && (
                                ' Comprovantes aprovados representam valores pagos pelo criador naquele contexto e não garantem o mesmo preço para outras datas ou viajantes.'
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
    const showOriginal = !!category.originalCurrency && category.originalCurrency !== 'AUD';
    const showMixedOriginals = !category.originalCurrency && category.originalCurrencies.length > 1;

    const a11yLabel = [
        category.moduleLabel,
        formatMoney(category.perPersonAUD, 'AUD') + ' por pessoa',
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
                    <Text style={styles.categoryAmount}>{formatMoney(category.perPersonAUD, 'AUD')}</Text>
                </View>

                {showOriginal && (
                    <Text style={styles.categorySub} numberOfLines={1}>
                        {formatMoney(category.originalAmountPerPerson ?? 0, category.originalCurrency!)} por pessoa
                        {' ≈ '}{formatMoney(category.perPersonAUD, 'AUD')}
                    </Text>
                )}
                {showMixedOriginals && (
                    <Text style={styles.categorySub} numberOfLines={1}>
                        Valores originalmente informados em {category.originalCurrencies.join(' e ')}
                    </Text>
                )}
                {category.sharedBase && (
                    <Text style={styles.categoryMeta}>
                        Base: {formatMoney(category.sharedBase.amountTotal, category.sharedBase.currency)} para {category.sharedBase.people} pessoas
                    </Text>
                )}
                {category.hasConversionGap && (
                    <Text style={styles.conversionGapText}>
                        Equivalente em AUD indisponível para parte deste valor.
                    </Text>
                )}

                <View style={styles.statusRow}>
                    <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
                    {category.status === 'mixed' && (
                        <Text style={styles.statusMixedDetail}>
                            {' · '}{formatMoney(category.verifiedAUD, 'AUD')} comprovados · {formatMoney(category.estimatedAUD, 'AUD')} estimados
                        </Text>
                    )}
                </View>
            </View>
        </View>
    );
}

function GroupSimulatorBlock({
    perPersonAUD, value, onChange,
}: { perPersonAUD: number; value: number; onChange: (n: number) => void }) {
    const safeValue = Math.max(SIM_MIN, Math.min(SIM_MAX, value || SIM_MIN));
    const totalGroup = Math.round(perPersonAUD * safeValue * 100) / 100;
    const peopleLabel = safeValue === 1 ? '1 pessoa' : `${safeValue} pessoas`;

    const dec = () => onChange(Math.max(SIM_MIN, safeValue - 1));
    const inc = () => onChange(Math.min(SIM_MAX, safeValue + 1));

    return (
        <View>
            <View style={styles.simHeaderRow}>
                <Icon name="users" size={16} color={theme.colors.primary} />
                <Text style={styles.simTitle}>Simule para o seu grupo</Text>
            </View>
            <Text style={styles.simHelper}>
                O valor de referência é calculado por pessoa. Ajuste a quantidade para estimar o total do grupo.
            </Text>

            <View style={styles.simStepperRow}>
                <Text style={styles.simStepperLabel}>Quantidade de pessoas</Text>
                <View style={styles.stepper}>
                    <TouchableOpacity
                        style={[styles.stepperBtn, safeValue <= SIM_MIN && styles.stepperBtnDisabled]}
                        onPress={dec}
                        disabled={safeValue <= SIM_MIN}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel="Diminuir quantidade de pessoas"
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
                        accessibilityLabel="Aumentar quantidade de pessoas"
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <Ionicons name="add" size={18} color={safeValue >= SIM_MAX ? theme.colors.text.tertiary : theme.colors.primary} />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.simSummaryRow}>
                <View style={styles.simSummaryCell}>
                    <Text style={styles.simSummaryLabel}>Por pessoa</Text>
                    <Text style={styles.simSummaryValue}>{formatMoney(perPersonAUD, 'AUD')}</Text>
                </View>
                <View style={styles.simSummaryDivider} />
                <View style={styles.simSummaryCell}>
                    <Text style={styles.simSummaryLabel}>Total para {peopleLabel}</Text>
                    <Text style={[styles.simSummaryValue, styles.simSummaryValueGroup]}>
                        {formatMoney(totalGroup, 'AUD')}
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
