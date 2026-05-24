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
}

export default function BudgetSummaryCard({
    form,
    variant = 'public',
    summary: summaryProp,
    hideWhenEmpty = false,
}: BudgetSummaryCardProps) {
    const summary = summaryProp ?? calculateBudgetSummary(form);
    const confidence = formatBudgetConfidence(summary.confidenceLevel);

    const noData = summary.informedItemsCount === 0;
    if (noData && hideWhenEmpty) return null;

    const toneStyles = TONE_STYLES[confidence.tone];

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
