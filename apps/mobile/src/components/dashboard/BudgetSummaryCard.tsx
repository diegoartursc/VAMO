/**
 * BudgetSummaryCard — bloco "Referência de custos da viagem" usado em
 * 3 superfícies:
 *
 *   1. Prévia do roteiro durante criação
 *   2. Vitrine pública (detalhes do roteiro)
 *   3. Roteiro adquirido ("Meus Roteiros")
 *
 * O bloco mostra:
 *  - confidence label (ex: "Orçamento parcialmente comprovado")
 *  - total informado (estimado + comprovado)
 *  - percentuais de cobertura (estimado x comprovado)
 *  - aviso de que valores são referências, não preço garantido
 *  - microcopy contextual conforme `variant`
 *
 * NUNCA expõe URLs/arquivos de comprovante — apenas os contadores.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
    type BudgetSummary,
    type ItineraryFormState,
    calculateBudgetSummary,
    formatBudgetConfidence,
    formatMoney,
    COST_DISCLOSURE_COPY,
} from '@vamo/shared/itinerary';
import { theme } from '../../theme/theme';

export type BudgetSummaryVariant =
    | 'preview'      // prévia durante criação
    | 'public'       // vitrine pública (não-comprador)
    | 'purchased';   // roteiro adquirido

export interface BudgetSummaryCardProps {
    /** Pode receber o form direto (prévia/criação) ou um itinerary da API. */
    form?: Partial<ItineraryFormState> | null;
    /** Variante define o microcopy do aviso. */
    variant?: BudgetSummaryVariant;
    /** Override do summary (caso o caller já tenha calculado). */
    summary?: BudgetSummary;
    /** Esconde o bloco quando não há nenhum dado (default true). */
    hideWhenEmpty?: boolean;
    /**
     * Ênfase visual. 'default' mantém o layout compacto histórico (usado na
     * prévia de criação e no roteiro comprado). 'premium' adiciona valor em
     * destaque + barra de proporção comprovado/estimado — só na vitrine
     * pública. A LÓGICA (calculateBudgetSummary) é a mesma nos dois.
     */
    emphasis?: 'default' | 'premium';
}

export default function BudgetSummaryCard({
    form,
    variant = 'public',
    summary: summaryProp,
    hideWhenEmpty = false,
    emphasis = 'default',
}: BudgetSummaryCardProps) {
    const summary = summaryProp ?? calculateBudgetSummary(form);
    const confidence = formatBudgetConfidence(summary.confidenceLevel);

    const noData = summary.informedItemsCount === 0;
    if (noData && hideWhenEmpty) return null;

    const toneStyles = TONE_STYLES[confidence.tone];
    const isPremium = emphasis === 'premium' && !noData;

    if (isPremium) {
        const summaryParts: string[] = [];
        if (summary.verifiedPercentage > 0) summaryParts.push(`${summary.verifiedPercentage}% comprovado`);
        if (summary.estimatedPercentage > 0) summaryParts.push(`${summary.estimatedPercentage}% estimado`);
        if (summary.notInformedItemsCount > 0) {
            summaryParts.push(`${summary.notInformedItemsCount} ${summary.notInformedItemsCount === 1 ? 'item sem valor' : 'itens sem valor'}`);
        }
        const warning = variant === 'purchased'
            ? COST_DISCLOSURE_COPY.purchasedPlanningTip
            : COST_DISCLOSURE_COPY.variabilityWarning;

        return (
            <View style={premium.card}>
                <View style={premium.headerRow}>
                    <Text style={premium.title}>Referência de custos da viagem</Text>
                    <View style={[styles.confidenceBadge, toneStyles.badge]}>
                        <Text style={[styles.confidenceText, toneStyles.badgeText]}>{confidence.label}</Text>
                    </View>
                </View>

                <View style={premium.valueRow}>
                    <Text style={premium.value}>{formatMoney(summary.totalInformed, summary.currency)}</Text>
                    <Text style={premium.valueSuffix}>estimados</Text>
                </View>

                {(summary.verifiedPercentage > 0 || summary.estimatedPercentage > 0) && (
                    <View style={premium.barTrack}>
                        {summary.verifiedPercentage > 0 && (
                            <View style={[premium.barVerified, { flex: summary.verifiedPercentage }]} />
                        )}
                        {summary.estimatedPercentage > 0 && (
                            <View style={[premium.barEstimated, { flex: summary.estimatedPercentage }]} />
                        )}
                    </View>
                )}

                {summaryParts.length > 0 && (
                    <Text style={premium.summaryLine}>{summaryParts.join(' · ')}</Text>
                )}

                {summary.itemsApprovedByVamo > 0 && (
                    <View style={styles.vamoBadgeRow}>
                        <Ionicons name="shield-checkmark" size={14} color={theme.colors.verified} />
                        <Text style={styles.vamoBadgeText}>
                            Comprovantes aprovados pela VAMO em {summary.itemsApprovedByVamo}
                            {summary.itemsApprovedByVamo === 1 ? ' item' : ' itens'}
                        </Text>
                    </View>
                )}

                <Text style={styles.warning}>{warning}</Text>
            </View>
        );
    }

    // Texto principal
    let mainText: string;
    if (noData) {
        mainText = 'Este roteiro não possui referência de custos detalhada. Você ainda poderá visualizar o passo a passo, dicas, locais e recomendações do criador.';
    } else if (summary.confidenceLevel === 'verified') {
        mainText = `Referência de custo com comprovantes analisados pela VAMO: ${formatMoney(summary.totalInformed, summary.currency)}`;
    } else if (summary.itemsWithProof > 0) {
        mainText = `Referência de custo informada pelo criador: cerca de ${formatMoney(summary.totalInformed, summary.currency)}`;
    } else {
        mainText = `Orçamento estimado pelo criador: cerca de ${formatMoney(summary.totalInformed, summary.currency)}`;
    }

    const warning = variant === 'purchased'
        ? COST_DISCLOSURE_COPY.purchasedPlanningTip
        : COST_DISCLOSURE_COPY.variabilityWarning;

    return (
        <View style={[styles.card, toneStyles.card]}>
            <View style={styles.headerRow}>
                <View style={[styles.iconWrap, toneStyles.iconWrap]}>
                    <Ionicons
                        name={iconForTone(confidence.tone)}
                        size={18}
                        color={toneStyles.iconColor}
                    />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.title}>Referência de custos da viagem</Text>
                    <View style={styles.badgeRow}>
                        <View style={[styles.confidenceBadge, toneStyles.badge]}>
                            <Text style={[styles.confidenceText, toneStyles.badgeText]}>
                                {confidence.label}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            <Text style={styles.mainText}>{mainText}</Text>

            {!noData && (
                <View style={styles.statsRow}>
                    {summary.verifiedPercentage > 0 && (
                        <Stat
                            value={`${summary.verifiedPercentage}%`}
                            label="comprovado"
                            tone="success"
                        />
                    )}
                    {summary.estimatedPercentage > 0 && (
                        <Stat
                            value={`${summary.estimatedPercentage}%`}
                            label="estimado"
                            tone="info"
                        />
                    )}
                    {summary.notInformedItemsCount > 0 && (
                        <Stat
                            value={`${summary.notInformedItemsCount}`}
                            label={summary.notInformedItemsCount === 1 ? 'item sem valor' : 'itens sem valor'}
                            tone="muted"
                        />
                    )}
                </View>
            )}

            {summary.itemsApprovedByVamo > 0 && (
                <View style={styles.vamoBadgeRow}>
                    <Ionicons name="shield-checkmark" size={14} color={theme.colors.verified} />
                    <Text style={styles.vamoBadgeText}>
                        Comprovantes aprovados pela VAMO em {summary.itemsApprovedByVamo}
                        {summary.itemsApprovedByVamo === 1 ? ' item' : ' itens'}
                    </Text>
                </View>
            )}

            <Text style={styles.warning}>{warning}</Text>

            {variant === 'public' && !noData && (
                <Text style={styles.publicNotice}>
                    {COST_DISCLOSURE_COPY.publicReferenceWarning}
                </Text>
            )}
        </View>
    );
}

function Stat({ value, label, tone }: { value: string; label: string; tone: 'success' | 'info' | 'muted' }) {
    const color =
        tone === 'success' ? theme.colors.verified
        : tone === 'info' ? theme.colors.info
        : theme.colors.text.tertiary;
    return (
        <View style={styles.stat}>
            <Text style={[styles.statValue, { color }]}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    );
}

function iconForTone(tone: 'info' | 'success' | 'warning' | 'muted'): keyof typeof Ionicons.glyphMap {
    switch (tone) {
        case 'success': return 'shield-checkmark';
        case 'info':    return 'wallet';
        case 'warning': return 'alert-circle';
        case 'muted':   return 'help-circle';
    }
}

const TONE_STYLES: Record<'info' | 'success' | 'warning' | 'muted', {
    card: any;
    iconWrap: any;
    iconColor: string;
    badge: any;
    badgeText: any;
}> = {
    info: {
        card: { backgroundColor: theme.colors.info + '10', borderColor: theme.colors.info + '33' },
        iconWrap: { backgroundColor: theme.colors.info + '1A' },
        iconColor: theme.colors.info,
        badge: { backgroundColor: theme.colors.info + '22' },
        badgeText: { color: theme.colors.info },
    },
    success: {
        card: { backgroundColor: theme.colors.verified + '10', borderColor: theme.colors.verified + '33' },
        iconWrap: { backgroundColor: theme.colors.verified + '1A' },
        iconColor: theme.colors.verified,
        badge: { backgroundColor: theme.colors.verified + '22' },
        badgeText: { color: theme.colors.verified },
    },
    warning: {
        card: { backgroundColor: theme.colors.warning + '10', borderColor: theme.colors.warning + '33' },
        iconWrap: { backgroundColor: theme.colors.warning + '1A' },
        iconColor: theme.colors.warning,
        badge: { backgroundColor: theme.colors.warning + '22' },
        badgeText: { color: theme.colors.warning },
    },
    muted: {
        card: { backgroundColor: theme.colors.surfaceLight, borderColor: theme.colors.border },
        iconWrap: { backgroundColor: theme.colors.surfaceHighlight },
        iconColor: theme.colors.text.tertiary,
        badge: { backgroundColor: theme.colors.surfaceHighlight },
        badgeText: { color: theme.colors.text.secondary },
    },
};

const premium = StyleSheet.create({
    card: {
        marginVertical: 12,
        padding: 18,
        borderRadius: 16,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        gap: 12,
        // Sombra um pouco mais forte que os demais blocos — é um card
        // financeiro, deve "pesar" mais e ser escaneável.
        shadowColor: theme.colors.secondary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 3,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
    },
    title: {
        flex: 1,
        fontSize: 15,
        fontWeight: '800',
        color: theme.colors.text.primary,
    },
    valueRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 8,
    },
    value: {
        fontSize: 30,
        fontWeight: '800',
        color: theme.colors.secondary,
        letterSpacing: -0.8,
    },
    valueSuffix: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.text.tertiary,
    },
    barTrack: {
        flexDirection: 'row',
        height: 8,
        borderRadius: 999,
        overflow: 'hidden',
        backgroundColor: theme.colors.surfaceHighlight,
        gap: 2,
    },
    barVerified: {
        backgroundColor: theme.colors.verified,
        borderRadius: 999,
    },
    barEstimated: {
        backgroundColor: theme.colors.info,
        borderRadius: 999,
    },
    summaryLine: {
        fontSize: 12.5,
        fontWeight: '600',
        color: theme.colors.text.secondary,
    },
});

const styles = StyleSheet.create({
    card: {
        marginVertical: 12,
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
        gap: 10,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
    },
    iconWrap: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.colors.text.primary,
    },
    badgeRow: {
        flexDirection: 'row',
        marginTop: 4,
    },
    confidenceBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    confidenceText: {
        fontSize: 11,
        fontWeight: '700',
    },
    mainText: {
        fontSize: 13,
        color: theme.colors.text.primary,
        lineHeight: 18,
    },
    statsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginTop: 2,
    },
    stat: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 4,
    },
    statValue: {
        fontSize: 16,
        fontWeight: '800',
    },
    statLabel: {
        fontSize: 11,
        color: theme.colors.text.secondary,
    },
    vamoBadgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    vamoBadgeText: {
        fontSize: 11,
        color: theme.colors.verified,
        fontWeight: '600',
    },
    warning: {
        fontSize: 11,
        color: theme.colors.text.tertiary,
        lineHeight: 15,
        fontStyle: 'italic',
    },
    publicNotice: {
        fontSize: 11,
        color: theme.colors.text.secondary,
        lineHeight: 15,
    },
});
