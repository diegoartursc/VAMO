"use client";

/**
 * BudgetSummaryCard (web) — versão React do bloco "Referência de custos
 * da viagem" usado no editor e na prévia do site. Espelha o componente
 * mobile (apps/mobile/src/components/dashboard/BudgetSummaryCard.tsx),
 * usando inline styles em vez de StyleSheet.
 *
 * NUNCA expõe URLs/arquivos de comprovante.
 */

import {
    type BudgetSummary,
    type ItineraryFormState,
    calculateBudgetSummary,
    formatBudgetConfidence,
    formatMoney,
    COST_DISCLOSURE_COPY,
} from "@vamo/shared/itinerary";

export type BudgetSummaryVariant = "preview" | "public" | "purchased";

export interface BudgetSummaryCardProps {
    /** Form/data do roteiro (parcial). */
    form?: Partial<ItineraryFormState> | null;
    /** Variante de microcopy. */
    variant?: BudgetSummaryVariant;
    /** Override do summary calculado. */
    summary?: BudgetSummary;
    /** Esconde o card quando não há nada para mostrar (default false). */
    hideWhenEmpty?: boolean;
    /** style overrides do contêiner. */
    style?: React.CSSProperties;
}

const TONE_PALETTE = {
    info:    { bg: "#3B82F60F", border: "#3B82F633", iconBg: "#3B82F61A", iconColor: "#3B82F6", badgeBg: "#3B82F622", badgeColor: "#3B82F6" },
    success: { bg: "#22C55E0F", border: "#22C55E33", iconBg: "#22C55E1A", iconColor: "#22C55E", badgeBg: "#22C55E22", badgeColor: "#22C55E" },
    warning: { bg: "#F59E0B0F", border: "#F59E0B33", iconBg: "#F59E0B1A", iconColor: "#F59E0B", badgeBg: "#F59E0B22", badgeColor: "#A16207" },
    muted:   { bg: "#F1F5F9",   border: "#E2E8F0",   iconBg: "#E2E8F0",   iconColor: "#64748B", badgeBg: "#E2E8F0",   badgeColor: "#475569" },
} as const;

function iconFor(tone: "info" | "success" | "warning" | "muted"): string {
    switch (tone) {
        case "success": return "🛡️";
        case "info":    return "💼";
        case "warning": return "⚠️";
        case "muted":   return "❔";
    }
}

export default function BudgetSummaryCard({
    form,
    variant = "public",
    summary: summaryProp,
    hideWhenEmpty = false,
    style,
}: BudgetSummaryCardProps) {
    const summary = summaryProp ?? calculateBudgetSummary(form);
    const confidence = formatBudgetConfidence(summary.confidenceLevel);
    const palette = TONE_PALETTE[confidence.tone];

    const noData = summary.informedItemsCount === 0;
    if (noData && hideWhenEmpty) return null;

    let mainText: string;
    if (noData) {
        mainText = "Este roteiro não possui referência de custos detalhada. Você ainda poderá visualizar o passo a passo, dicas, locais e recomendações do criador.";
    } else if (summary.confidenceLevel === "verified") {
        mainText = `Referência de custo com comprovantes analisados pela VAMO: ${formatMoney(summary.totalInformed, summary.currency)}`;
    } else if (summary.itemsWithProof > 0) {
        mainText = `Referência de custo informada pelo criador: cerca de ${formatMoney(summary.totalInformed, summary.currency)}`;
    } else {
        mainText = `Orçamento estimado pelo criador: cerca de ${formatMoney(summary.totalInformed, summary.currency)}`;
    }

    const warning = variant === "purchased"
        ? COST_DISCLOSURE_COPY.purchasedPlanningTip
        : COST_DISCLOSURE_COPY.variabilityWarning;

    return (
        <div
            style={{
                margin: "12px 0",
                padding: 14,
                borderRadius: 14,
                border: `1px solid ${palette.border}`,
                background: palette.bg,
                display: "flex",
                flexDirection: "column",
                gap: 10,
                ...style,
            }}
        >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <div
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        background: palette.iconBg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 16,
                    }}
                    aria-hidden
                >
                    {iconFor(confidence.tone)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>
                        Referência de custos da viagem
                    </div>
                    <div style={{ marginTop: 4 }}>
                        <span
                            style={{
                                display: "inline-block",
                                padding: "3px 8px",
                                borderRadius: 8,
                                background: palette.badgeBg,
                                color: palette.badgeColor,
                                fontSize: 11,
                                fontWeight: 700,
                            }}
                        >
                            {confidence.label}
                        </span>
                    </div>
                </div>
            </div>

            <div style={{ fontSize: 13, color: "#0F172A", lineHeight: 1.4 }}>{mainText}</div>

            {!noData && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 2 }}>
                    {summary.verifiedPercentage > 0 && (
                        <Stat value={`${summary.verifiedPercentage}%`} label="comprovado" tone="success" />
                    )}
                    {summary.estimatedPercentage > 0 && (
                        <Stat value={`${summary.estimatedPercentage}%`} label="estimado" tone="info" />
                    )}
                    {summary.notInformedItemsCount > 0 && (
                        <Stat
                            value={`${summary.notInformedItemsCount}`}
                            label={summary.notInformedItemsCount === 1 ? "item sem valor" : "itens sem valor"}
                            tone="muted"
                        />
                    )}
                </div>
            )}

            {summary.itemsApprovedByVamo > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#22C55E", fontSize: 11, fontWeight: 600 }}>
                    <span aria-hidden>🛡️</span>
                    Comprovantes aprovados pela VAMO em {summary.itemsApprovedByVamo}
                    {summary.itemsApprovedByVamo === 1 ? " item" : " itens"}
                </div>
            )}

            <div style={{ fontSize: 11, color: "#94A3B8", lineHeight: 1.4, fontStyle: "italic" }}>{warning}</div>

            {variant === "public" && !noData && (
                <div style={{ fontSize: 11, color: "#64748B", lineHeight: 1.4 }}>
                    {COST_DISCLOSURE_COPY.publicReferenceWarning}
                </div>
            )}
        </div>
    );
}

function Stat({ value, label, tone }: { value: string; label: string; tone: "success" | "info" | "muted" }) {
    const color = tone === "success" ? "#22C55E"
        : tone === "info" ? "#3B82F6"
        : "#94A3B8";
    return (
        <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span style={{ fontSize: 16, fontWeight: 800, color }}>{value}</span>
            <span style={{ fontSize: 11, color: "#64748B" }}>{label}</span>
        </div>
    );
}
