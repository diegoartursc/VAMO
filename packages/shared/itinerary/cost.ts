/**
 * Utilitários para o sistema de transparência graduada de custos.
 *
 * Princípio: cada item de módulo (hospedagem, passeio, transporte,
 * restaurante, voo, gasto extra) pode declarar um `cost: ModuleCostInfo`
 * com `disclosureType` not_informed | estimated | verified. Dados antigos
 * (`spending: ModuleSpending` ou `price: string`) continuam funcionando
 * — ver `resolveCostInfo()`.
 */

import type {
    CostDisclosureType,
    CostProofStatus,
    ModuleCostInfo,
    ModuleSpending,
    ItineraryFormState,
    Accommodation,
    Transport,
    AttractionItem,
    RestaurantItem,
    ExtraSpendingItem,
} from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// Parsing
// ─────────────────────────────────────────────────────────────────────────────

/** Converte string monetária pt-BR ("1.234,56") ou en-US ("1234.56") para number. Retorna 0 se inválido. */
export function parseMoney(raw?: string | number | null): number {
    if (raw == null) return 0;
    if (typeof raw === "number") return Number.isFinite(raw) ? raw : 0;
    const s = String(raw).trim();
    if (!s) return 0;
    // Remove tudo que não for dígito, vírgula, ponto ou sinal de menos.
    const cleaned = s.replace(/[^0-9.,-]/g, "");
    if (!cleaned) return 0;
    // Heurística: se tem vírgula e ponto, assume formato pt-BR (1.234,56).
    // Se só tem vírgula, troca por ponto. Se só tem ponto, mantém.
    const hasComma = cleaned.includes(",");
    const hasDot = cleaned.includes(".");
    let normalized: string;
    if (hasComma && hasDot) {
        normalized = cleaned.replace(/\./g, "").replace(",", ".");
    } else if (hasComma) {
        normalized = cleaned.replace(",", ".");
    } else {
        normalized = cleaned;
    }
    const n = parseFloat(normalized);
    return Number.isFinite(n) ? n : 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// Resolução legado → ModuleCostInfo
// ─────────────────────────────────────────────────────────────────────────────

interface LegacyShape {
    cost?: ModuleCostInfo | null;
    spending?: ModuleSpending | null;
    /** alguns itens (AttractionItem) ainda têm campo "price" antigo */
    price?: string | null;
    /** ExtraSpendingItem usa value/currency direto. */
    value?: string | null;
    currency?: string | null;
}

/**
 * Resolve o ModuleCostInfo "efetivo" de um item, mesclando o novo
 * formato `cost` com os campos legados (`spending`, `price`, `value`).
 *
 * Regra de inferência:
 *  1. Se existe `cost`, usa direto.
 *  2. Senão, se existe valor legado > 0, infere disclosureType="estimated".
 *  3. Senão, "not_informed".
 *
 * Esta função NUNCA altera o item original — apenas retorna a leitura.
 */
export function resolveCostInfo(item?: LegacyShape | null): ModuleCostInfo {
    if (!item) {
        return { disclosureType: "not_informed", currency: "BRL", amount: "", sharedByPeople: 1, proofFiles: [], proofStatus: "none" };
    }
    if (item.cost && typeof item.cost === "object") {
        const c = item.cost;
        return {
            amount: c.amount ?? "",
            currency: c.currency ?? "BRL",
            disclosureType: c.disclosureType ?? "not_informed",
            sharedByPeople: normalizeSharedBy(c.sharedByPeople),
            notes: c.notes ?? "",
            proofFiles: Array.isArray(c.proofFiles) ? c.proofFiles : [],
            proofStatus: c.proofStatus ?? (c.proofFiles && c.proofFiles.length > 0 ? "uploaded" : "none"),
            updatedAt: c.updatedAt,
        };
    }
    // Fallback legado
    const legacyValue = item.spending?.value ?? item.price ?? item.value ?? "";
    const legacyCurrency = item.spending?.currency ?? item.currency ?? "BRL";
    const hasValue = parseMoney(legacyValue) > 0;
    return {
        amount: hasValue ? String(legacyValue) : "",
        currency: legacyCurrency,
        disclosureType: hasValue ? "estimated" : "not_informed",
        sharedByPeople: 1,
        notes: "",
        proofFiles: [],
        proofStatus: "none",
    };
}

/**
 * Cria um ModuleCostInfo "limpo" para um novo item. Default not_informed.
 */
export function createEmptyCostInfo(currency: string = "BRL"): ModuleCostInfo {
    return {
        amount: "",
        currency,
        disclosureType: "not_informed",
        sharedByPeople: 1,
        notes: "",
        proofFiles: [],
        proofStatus: "none",
    };
}

/**
 * Normaliza o campo `sharedByPeople` — garante número >= 1.
 * Roteiros antigos sem este campo viram 1 (gasto individual).
 */
export function normalizeSharedBy(raw?: number | string | null): number {
    if (raw == null) return 1;
    const n = typeof raw === "number" ? raw : parseInt(String(raw), 10);
    if (!Number.isFinite(n) || n < 1) return 1;
    return Math.min(Math.floor(n), 99);
}

/**
 * Calcula o valor POR PESSOA a partir do `amount` total e do
 * `sharedByPeople`. Retorna 0 se amount inválido ou negativo.
 */
export function getAmountPerPerson(cost?: ModuleCostInfo | null): number {
    if (!cost) return 0;
    const total = parseMoney(cost.amount);
    if (total <= 0) return 0;
    const shared = normalizeSharedBy(cost.sharedByPeople);
    return total / shared;
}

// ─────────────────────────────────────────────────────────────────────────────
// Formatação para exibição
// ─────────────────────────────────────────────────────────────────────────────

/** Formata número como moeda. Default: pt-BR + BRL. */
export function formatMoney(amount: number, currency: string = "BRL", locale: string = "pt-BR"): string {
    try {
        return new Intl.NumberFormat(locale, {
            style: "currency",
            currency: currency || "BRL",
            maximumFractionDigits: 2,
        }).format(amount);
    } catch {
        // Currency inválida — fallback simples
        return `${currency || ""} ${amount.toFixed(2)}`.trim();
    }
}

/**
 * Resultado completo da formatação de um custo, contendo tanto o texto
 * principal quanto o badge (selo) quando aplicável.
 */
export interface CostLabel {
    /** Texto principal (ex: "Custo estimado: cerca de R$ 250"). */
    text: string;
    /** Selo curto (ex: "Comprovado"). null se não aplica. */
    badge: string | null;
    /** Variante visual sugerida para o selo. */
    badgeTone: "info" | "success" | "warning" | "muted" | null;
    /** Tipo bruto para lógica de UI. */
    disclosureType: CostDisclosureType;
    /** Tem comprovante público (aprovado pela VAMO) — pode usar texto "Verificado pela VAMO". */
    isVamoVerified: boolean;
    /** Tem arquivo enviado (mas não necessariamente aprovado). */
    hasProof: boolean;
}

/**
 * Gera os textos de exibição de um custo, seguindo a regra de produto:
 *  - not_informed:           "Valor não informado"
 *  - estimated + valor:      "Custo estimado: cerca de R$ X"
 *  - verified + aprovado:    "Custo comprovado: R$ X" + selo "Verificado pela VAMO"
 *  - verified + uploaded:    "Custo com comprovante enviado: R$ X" + selo "Comprovado pelo criador"
 *  - verified + sem arquivo: "Custo: R$ X" + selo "Aguardando comprovante"
 */
export function formatCostLabel(
    info: ModuleCostInfo | null | undefined,
    opts: { locale?: string; compact?: boolean } = {},
): CostLabel {
    const locale = opts.locale ?? "pt-BR";
    const resolved = info ?? { disclosureType: "not_informed" as CostDisclosureType };
    const type = resolved.disclosureType;
    const amount = parseMoney(resolved.amount);
    const currency = resolved.currency || "BRL";
    const moneyStr = amount > 0 ? formatMoney(amount, currency, locale) : "";
    const hasFile = (resolved.proofFiles?.length ?? 0) > 0;
    const status = resolved.proofStatus ?? "none";
    const isVamoVerified = type === "verified" && status === "approved";

    if (type === "not_informed") {
        return {
            text: "Valor não informado",
            badge: opts.compact ? null : "Sem valor",
            badgeTone: "muted",
            disclosureType: type,
            isVamoVerified: false,
            hasProof: false,
        };
    }

    if (type === "estimated") {
        return {
            text: amount > 0
                ? `Custo estimado: cerca de ${moneyStr}`
                : "Custo estimado pelo criador",
            badge: "Estimado",
            badgeTone: "info",
            disclosureType: type,
            isVamoVerified: false,
            hasProof: false,
        };
    }

    // verified
    if (isVamoVerified) {
        return {
            text: amount > 0 ? `Custo comprovado: ${moneyStr}` : "Custo comprovado pelo criador",
            badge: "Verificado pela VAMO",
            badgeTone: "success",
            disclosureType: type,
            isVamoVerified: true,
            hasProof: true,
        };
    }
    if (hasFile) {
        return {
            text: amount > 0
                ? `Custo com comprovante enviado: ${moneyStr}`
                : "Comprovante enviado pelo criador",
            badge: "Comprovado pelo criador",
            badgeTone: "success",
            disclosureType: type,
            isVamoVerified: false,
            hasProof: true,
        };
    }
    return {
        text: amount > 0 ? `Custo informado: ${moneyStr}` : "Custo informado pelo criador",
        badge: "Aguardando comprovante",
        badgeTone: "warning",
        disclosureType: type,
        isVamoVerified: false,
        hasProof: false,
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Validação por item
// ─────────────────────────────────────────────────────────────────────────────

export interface CostValidationResult {
    ok: boolean;
    /** Mensagem amigável quando ok=false. */
    message?: string;
}

/**
 * Valida um ModuleCostInfo isolado. Usado pelos campos de criação
 * antes de salvar/avançar.
 *
 * Regras:
 *  - not_informed → sempre ok.
 *  - estimated    → ok mesmo sem amount (form pode aceitar rascunho).
 *                    Avisa quando amount está vazio.
 *  - verified     → exige amount > 0. Exige proofFiles para uso do selo.
 */
export function validateCostInfo(
    info: ModuleCostInfo | null | undefined,
    opts: { requireProof?: boolean } = {},
): CostValidationResult {
    if (!info) return { ok: true };
    const type = info.disclosureType;
    const amount = parseMoney(info.amount);

    if (type === "not_informed") return { ok: true };

    if (type === "estimated") {
        if (amount <= 0) {
            return {
                ok: false,
                message: "Informe um valor aproximado ou escolha \"Não informar valor\".",
            };
        }
        return { ok: true };
    }

    if (type === "verified") {
        if (amount <= 0) {
            return {
                ok: false,
                message: "Informe o valor pago ou escolha \"Valor estimado\".",
            };
        }
        if (opts.requireProof && (info.proofFiles?.length ?? 0) === 0) {
            return {
                ok: false,
                message: "Envie um comprovante ou altere para \"Valor estimado\".",
            };
        }
        return { ok: true };
    }
    return { ok: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// Sumário do orçamento
// ─────────────────────────────────────────────────────────────────────────────

export type BudgetConfidenceLevel =
    | "none"
    | "low"
    | "medium"
    | "high"
    | "verified";

export interface BudgetSummary {
    /** Total considerando TODOS os itens com valor informado. */
    totalInformed: number;
    /** Subtotal de itens com disclosureType="estimated" e valor > 0. */
    totalEstimated: number;
    /** Subtotal de itens com disclosureType="verified" e valor > 0. */
    totalVerified: number;
    /** Moeda dominante encontrada (BRL por padrão). */
    currency: string;
    /** Contagens */
    informedItemsCount: number;
    notInformedItemsCount: number;
    estimatedItemsCount: number;
    verifiedItemsCount: number;
    /** Quantos itens verified têm comprovante anexado (qualquer status). */
    itemsWithProof: number;
    /** Quantos têm proofStatus = approved. */
    itemsApprovedByVamo: number;
    /** Total de itens considerados (incluindo not_informed). */
    totalItemsCount: number;
    /** Percentuais (0–100). */
    estimatedPercentage: number;
    verifiedPercentage: number;
    /** Nível de confiança agregado. */
    confidenceLevel: BudgetConfidenceLevel;
}

/**
 * Compõe um sumário agregado a partir do formulário do roteiro.
 * Considera hospedagens, passeios, transporte, restaurantes, voo e
 * gastos extras. Dados legados (spending) também entram via resolveCostInfo.
 */
export function calculateBudgetSummary(form?: Partial<ItineraryFormState> | null): BudgetSummary {
    const empty: BudgetSummary = {
        totalInformed: 0,
        totalEstimated: 0,
        totalVerified: 0,
        currency: "BRL",
        informedItemsCount: 0,
        notInformedItemsCount: 0,
        estimatedItemsCount: 0,
        verifiedItemsCount: 0,
        itemsWithProof: 0,
        itemsApprovedByVamo: 0,
        totalItemsCount: 0,
        estimatedPercentage: 0,
        verifiedPercentage: 0,
        confidenceLevel: "none",
    };
    if (!form) return empty;

    const items: { info: ModuleCostInfo }[] = [];
    const pushItem = (it: LegacyShape | null | undefined) => {
        if (!it) return;
        items.push({ info: resolveCostInfo(it) });
    };

    (form.accommodations as Accommodation[] | undefined)?.forEach(pushItem);
    (form.attractions    as AttractionItem[] | undefined)?.forEach(pushItem);
    (form.transports     as Transport[] | undefined)?.forEach(pushItem);
    (form.restaurants    as RestaurantItem[] | undefined)?.forEach(pushItem);
    (form.extraSpendingItems as ExtraSpendingItem[] | undefined)?.forEach(pushItem);
    // Voo é único; pode vir como flightCost ou flightSpending (legado).
    if (form.flightCost || form.flightSpending) {
        items.push({
            info: resolveCostInfo({
                cost: form.flightCost ?? null,
                spending: form.flightSpending ?? null,
            }),
        });
    }

    if (items.length === 0) return empty;

    let totalEstimated = 0;
    let totalVerified = 0;
    let estimatedItemsCount = 0;
    let verifiedItemsCount = 0;
    let notInformedItemsCount = 0;
    let itemsWithProof = 0;
    let itemsApprovedByVamo = 0;
    const currencyCounts = new Map<string, number>();

    for (const { info } of items) {
        // amount é o valor TOTAL pago no item. perPerson é o valor por
        // pessoa após dividir por `sharedByPeople`. O agregado do orçamento
        // é por pessoa — assim o PeopleSimulator pode multiplicar pela
        // quantidade de viajantes do comprador sem distorção.
        const perPerson = getAmountPerPerson(info);
        const c = info.currency || "BRL";
        currencyCounts.set(c, (currencyCounts.get(c) ?? 0) + 1);

        if (info.disclosureType === "not_informed") {
            notInformedItemsCount++;
            continue;
        }
        if (info.disclosureType === "estimated") {
            estimatedItemsCount++;
            if (perPerson > 0) totalEstimated += perPerson;
            continue;
        }
        if (info.disclosureType === "verified") {
            verifiedItemsCount++;
            if (perPerson > 0) totalVerified += perPerson;
            if ((info.proofFiles?.length ?? 0) > 0) itemsWithProof++;
            if (info.proofStatus === "approved") itemsApprovedByVamo++;
        }
    }

    const informedItemsCount = estimatedItemsCount + verifiedItemsCount;
    const totalInformed = totalEstimated + totalVerified;
    const totalItemsCount = items.length;

    // Moeda dominante
    let dominantCurrency = "BRL";
    let max = 0;
    for (const [c, n] of currencyCounts.entries()) {
        if (n > max) { max = n; dominantCurrency = c; }
    }

    const estimatedPercentage = informedItemsCount > 0
        ? Math.round((estimatedItemsCount / informedItemsCount) * 100)
        : 0;
    const verifiedPercentage = informedItemsCount > 0
        ? Math.round((verifiedItemsCount / informedItemsCount) * 100)
        : 0;

    // Confiança agregada
    let confidenceLevel: BudgetConfidenceLevel = "none";
    if (informedItemsCount === 0) {
        confidenceLevel = "none";
    } else if (itemsApprovedByVamo > 0 && itemsApprovedByVamo >= Math.ceil(informedItemsCount * 0.5)) {
        confidenceLevel = "verified";
    } else if (itemsWithProof > 0 || verifiedItemsCount >= Math.ceil(informedItemsCount * 0.5)) {
        confidenceLevel = "high";
    } else if (informedItemsCount >= Math.ceil(totalItemsCount * 0.5)) {
        confidenceLevel = "medium";
    } else {
        confidenceLevel = "low";
    }

    return {
        totalInformed,
        totalEstimated,
        totalVerified,
        currency: dominantCurrency,
        informedItemsCount,
        notInformedItemsCount,
        estimatedItemsCount,
        verifiedItemsCount,
        itemsWithProof,
        itemsApprovedByVamo,
        totalItemsCount,
        estimatedPercentage,
        verifiedPercentage,
        confidenceLevel,
    };
}

/**
 * Label amigável para o nível de confiança agregado do orçamento.
 */
export function formatBudgetConfidence(level: BudgetConfidenceLevel): {
    label: string;
    description: string;
    tone: "info" | "success" | "warning" | "muted";
} {
    switch (level) {
        case "none":
            return {
                label: "Orçamento não informado",
                description: "Este roteiro não possui referência de custos detalhada.",
                tone: "muted",
            };
        case "low":
            return {
                label: "Orçamento parcial",
                description: "Poucos itens têm valor informado. Use como referência inicial.",
                tone: "muted",
            };
        case "medium":
            return {
                label: "Orçamento estimado",
                description: "Boa parte dos itens tem valor estimado pelo criador.",
                tone: "info",
            };
        case "high":
            return {
                label: "Orçamento parcialmente comprovado",
                description: "O criador anexou comprovantes para alguns itens.",
                tone: "success",
            };
        case "verified":
            return {
                label: "Orçamento com comprovantes analisados",
                description: "Comprovantes revisados e aprovados pela VAMO.",
                tone: "success",
            };
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Textos padrão (microcopy)
// ─────────────────────────────────────────────────────────────────────────────

export const COST_DISCLOSURE_COPY = {
    sectionTitle: "Custo deste item",
    sectionSubtitle:
        "Ajude o viajante a entender quanto essa experiência pode custar. Você pode informar um valor aproximado. Comprovantes são opcionais, mas aumentam a confiança do roteiro.",
    options: {
        not_informed: {
            label: "Não informar valor",
            description:
                "Use se você não lembra, se o custo varia muito ou se prefere não informar.",
        },
        estimated: {
            label: "Valor estimado",
            description: "Use para informar aproximadamente quanto você gastou.",
        },
        verified: {
            label: "Valor comprovado",
            description:
                "Use quando você tem comprovante, reserva, recibo, print ou confirmação.",
        },
    },
    notesPlaceholder:
        "Ex: valor por pessoa, valor total do casal, comprado com antecedência, baixa temporada...",
    proofUploadHelp:
        "Envie print, recibo, reserva, nota, confirmação de compra ou fatura. O arquivo não será exibido integralmente ao comprador; ele serve para validação e selo de confiança.",
    proofPrivacyTip:
        "Antes de enviar, oculte dados sensíveis como CPF, endereço completo, número de cartão ou código de reserva se não forem necessários.",
    publicReferenceWarning:
        "Os valores deste roteiro são referências informadas pelo criador. Eles não representam preço garantido.",
    variabilityWarning:
        "Valores podem variar conforme data, temporada, câmbio, antecedência da compra, disponibilidade e estilo de consumo.",
    purchasedPlanningTip:
        "Use os custos como guia de planejamento. Antes de viajar, confirme preços atuais nos canais oficiais.",
} as const;

/** Categorias com incentivo amigável para anexar comprovante. */
export const COST_PROOF_RECOMMENDED_CATEGORIES = new Set([
    "hospedagem",
    "voo",
    "passeio_caro",
    "ingresso",
]);

/** Mostrar incentivo de comprovante para este tipo de módulo/categoria? */
export function shouldEncourageProof(moduleOrCategory: string): boolean {
    const key = (moduleOrCategory ?? "").toLowerCase();
    if (COST_PROOF_RECOMMENDED_CATEGORIES.has(key)) return true;
    if (key.includes("voo") || key.includes("flight")) return true;
    if (key.includes("hospedagem") || key.includes("hotel") || key.includes("accommodation")) return true;
    return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// Referências de custo por módulo (para exibição em Detalhes/Prévia)
// ─────────────────────────────────────────────────────────────────────────────

export interface CostReferenceItem {
    /** Título legível do item (ex.: "Hotel Central", "Passagem aérea"). */
    title: string;
    /**
     * @deprecated Use `amountPerPerson` ou `amountTotal`. Mantido para
     * compatibilidade com renderizadores antigos — equivale a `amountPerPerson`.
     */
    amount: number;
    /** Valor total pago no item (referência informada pelo criador). */
    amountTotal: number;
    /** Valor por pessoa (= amountTotal / sharedByPeople). */
    amountPerPerson: number;
    /** Quantidade de pessoas que dividiram esse gasto. 1 = individual. */
    sharedByPeople: number;
    /** Moeda original cadastrada (ex.: "CAD"). */
    currency: string;
    /** Tipo de transparência. "verified" sem proof é tratado como inconsistente
     *  pela validação — aqui exibimos do mesmo jeito que o criador marcou. */
    disclosureType: "estimated" | "verified";
    /** Comprovante anexado? */
    hasProof: boolean;
    /** Status do comprovante na moderação. */
    proofStatus?: CostProofStatus;
    /** Observação contextual (se houver). */
    notes?: string;
}

export interface CostReferencesGroup {
    /** Chave do módulo (ex.: "voo", "hospedagem"). */
    moduleKey:
        | "voo"
        | "hospedagem"
        | "passeios"
        | "transporte"
        | "restaurantes"
        | "gastos_extras";
    /** Rótulo legível em PT-BR. */
    moduleLabel: string;
    /** Itens do módulo com custo informado (estimado/comprovado, amount > 0). */
    items: CostReferenceItem[];
}

const MODULE_LABEL_PT: Record<CostReferencesGroup["moduleKey"], string> = {
    voo:           "Meu Voo",
    hospedagem:    "Hospedagens",
    passeios:      "Passeios & Atrações",
    transporte:    "Transporte",
    restaurantes:  "Restaurantes & Gastronomia",
    gastos_extras: "Gastos Extras",
};

/**
 * Converte um item de módulo + título em CostReferenceItem normalizado.
 * Retorna null quando o item não tem custo informado/exibível.
 */
function toReferenceItem(
    cost: ModuleCostInfo | null | undefined,
    legacy: ModuleSpending | null | undefined,
    title: string,
): CostReferenceItem | null {
    if (!title?.trim()) title = "Item sem título";
    const info = cost ?? (legacy ? resolveCostInfo({ spending: legacy }) : null);
    if (!info) return null;
    if (info.disclosureType === "not_informed") return null;
    const amountTotal = parseMoney(info.amount);
    if (amountTotal <= 0) return null;
    const sharedByPeople = normalizeSharedBy(info.sharedByPeople);
    const amountPerPerson = amountTotal / sharedByPeople;
    const hasProof = (info.proofFiles?.length ?? 0) > 0;
    return {
        title: title.trim(),
        amount: amountPerPerson, // compat: leitores antigos usavam amount como per-person
        amountTotal,
        amountPerPerson,
        sharedByPeople,
        currency: info.currency || "BRL",
        disclosureType: info.disclosureType,
        hasProof,
        proofStatus: info.proofStatus,
        notes: info.notes?.trim() || undefined,
    };
}

/**
 * Coleta referências de custo agrupadas por módulo, prontas para
 * exibição em Detalhes/Prévia do roteiro. Só inclui módulos com pelo
 * menos 1 item exibível (custo informado com valor > 0).
 */
export function getCostReferences(
    form?: Partial<ItineraryFormState> | null,
): CostReferencesGroup[] {
    if (!form) return [];
    const groups: CostReferencesGroup[] = [];

    // Voo (item único)
    if (form.flightCost || form.flightSpending) {
        const item = toReferenceItem(
            form.flightCost,
            form.flightSpending as ModuleSpending | null,
            "Passagem aérea",
        );
        if (item) {
            groups.push({ moduleKey: "voo", moduleLabel: MODULE_LABEL_PT.voo, items: [item] });
        }
    }

    const pushGroup = (
        moduleKey: CostReferencesGroup["moduleKey"],
        items: CostReferenceItem[],
    ) => {
        if (items.length === 0) return;
        groups.push({ moduleKey, moduleLabel: MODULE_LABEL_PT[moduleKey], items });
    };

    pushGroup("hospedagem", ((form.accommodations as Accommodation[] | undefined) ?? [])
        .map(a => toReferenceItem(a.cost, a.spending, a.name))
        .filter((x): x is CostReferenceItem => x !== null));

    pushGroup("passeios", ((form.attractions as AttractionItem[] | undefined) ?? [])
        .map(a => toReferenceItem(a.cost, a.spending, a.name))
        .filter((x): x is CostReferenceItem => x !== null));

    pushGroup("transporte", ((form.transports as Transport[] | undefined) ?? [])
        .map(t => toReferenceItem(t.cost, t.spending, t.description || t.passTypes || "Transporte"))
        .filter((x): x is CostReferenceItem => x !== null));

    pushGroup("restaurantes", ((form.restaurants as RestaurantItem[] | undefined) ?? [])
        .map(r => toReferenceItem(r.cost, r.spending, r.name))
        .filter((x): x is CostReferenceItem => x !== null));

    pushGroup("gastos_extras", ((form.extraSpendingItems as ExtraSpendingItem[] | undefined) ?? [])
        .map(e => {
            // gastos_extras tem value/currency direto, sem spending. resolveCostInfo trata.
            const cost = e.cost ?? resolveCostInfo({ value: e.value, currency: e.currency } as any);
            return toReferenceItem(cost, null, e.title);
        })
        .filter((x): x is CostReferenceItem => x !== null));

    return groups;
}
