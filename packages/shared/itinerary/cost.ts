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
    /** Formatos planos usados por versões antigas dos modais. */
    priceValue?: string | number | null;
    priceCurrency?: string | null;
    ticketValue?: string | number | null;
    ticketCurrency?: string | null;
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
        return { disclosureType: "not_informed", currency: "AUD", amount: "", sharedByPeople: 1, proofFiles: [], proofStatus: "none" };
    }
    if (item.cost && typeof item.cost === "object") {
        const c = item.cost;
        const legacyCostValue = (c as ModuleCostInfo & { value?: string | number }).value;
        const rawAmount = c.amount ?? legacyCostValue ?? "";
        const amount = typeof rawAmount === "number" ? String(rawAmount) : rawAmount;
        return {
            amount,
            currency: c.currency ?? "AUD",
            disclosureType: c.disclosureType
                ?? (parseMoney(amount) > 0 ? "estimated" : "not_informed"),
            sharedByPeople: normalizeSharedBy(c.sharedByPeople),
            notes: c.notes ?? "",
            proofFiles: Array.isArray(c.proofFiles) ? c.proofFiles : [],
            proofStatus: c.proofStatus ?? (c.proofFiles && c.proofFiles.length > 0 ? "uploaded" : "none"),
            updatedAt: c.updatedAt,
        };
    }
    // Fallback legado
    const legacyValue =
        item.spending?.value
        ?? item.price
        ?? item.value
        ?? item.priceValue
        ?? item.ticketValue
        ?? "";
    const legacyCurrency =
        item.spending?.currency
        ?? item.currency
        ?? item.priceCurrency
        ?? item.ticketCurrency
        ?? "AUD";
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
export function createEmptyCostInfo(currency: string = "AUD"): ModuleCostInfo {
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

/** Formata número como moeda. Default: en-AU + AUD. */
export function formatMoney(amount: number, currency: string = "AUD", locale: string = "en-AU"): string {
    try {
        const formatted = new Intl.NumberFormat(locale, {
            style: "currency",
            currency: currency || "AUD",
            maximumFractionDigits: 2,
        }).format(amount);
        if ((currency || "AUD").toUpperCase() === "AUD") {
            if (formatted.startsWith("-$")) return `-A$ ${formatted.slice(2)}`;
            if (formatted.startsWith("$")) return `A$ ${formatted.slice(1)}`;
        }
        return formatted;
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
    /** Texto principal (ex: "Custo estimado: cerca de A$ 250"). */
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
 *  - estimated + valor:      "Custo estimado: cerca de A$ X"
 *  - verified + aprovado:    "Custo comprovado: A$ X" + selo "Verificado pela VAMO"
 *  - verified + uploaded:    "Custo com comprovante enviado: A$ X" + selo "Comprovado pelo criador"
 *  - verified + sem arquivo: "Custo: A$ X" + selo "Aguardando comprovante"
 */
export function formatCostLabel(
    info: ModuleCostInfo | null | undefined,
    opts: { locale?: string; compact?: boolean } = {},
): CostLabel {
    const locale = opts.locale ?? "pt-BR";
    const resolved = info ?? { disclosureType: "not_informed" as CostDisclosureType };
    const type = resolved.disclosureType;
    const amount = parseMoney(resolved.amount);
    const currency = resolved.currency || "AUD";
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
    /** Moeda dominante encontrada (AUD por padrão). */
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
        currency: "AUD",
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
        const c = info.currency || "AUD";
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
    let dominantCurrency = "AUD";
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
    legacySource?: LegacyShape | null,
): CostReferenceItem | null {
    if (!title?.trim()) title = "Item sem título";
    const info = resolveCostInfo({
        ...(legacySource ?? {}),
        cost: cost ?? legacySource?.cost,
        spending: legacy ?? legacySource?.spending,
    });
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
        currency: info.currency || "AUD",
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
        .map(a => toReferenceItem(a.cost, a.spending, a.name, a as LegacyShape))
        .filter((x): x is CostReferenceItem => x !== null));

    pushGroup("passeios", ((form.attractions as AttractionItem[] | undefined) ?? [])
        .map(a => toReferenceItem(a.cost, a.spending, a.name, a as LegacyShape))
        .filter((x): x is CostReferenceItem => x !== null));

    pushGroup("transporte", ((form.transports as Transport[] | undefined) ?? [])
        .map(t => toReferenceItem(
            t.cost,
            t.spending,
            t.description || t.passTypes || "Transporte",
            t as LegacyShape,
        ))
        .filter((x): x is CostReferenceItem => x !== null));

    pushGroup("restaurantes", ((form.restaurants as RestaurantItem[] | undefined) ?? [])
        .map(r => toReferenceItem(r.cost, r.spending, r.name, r as LegacyShape))
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

// ─────────────────────────────────────────────────────────────────────────────
// Resumo consolidado de custos por CATEGORIA (tela pública de Detalhes)
//
// Fonte ÚNICA da verdade pro card "Referência de custos da viagem": todo bloco
// (total geral, percentuais, lista por categoria, simulador de grupo) consome
// a MESMA `ConsolidatedTravelCostSummary` — nunca calcule o total numa função
// e os percentuais em outra. Nunca exibe título/nome de item individual
// (hotel, atração, fornecedor) — só a categoria agregada, preservando o valor
// comercial do conteúdo pago.
//
// Diferença crítica vs. `calculateBudgetSummary`: aquela função soma valores
// BRUTOS de moedas potencialmente diferentes e rotula com a "moeda
// dominante" (por contagem de itens) — o que produz totais sem sentido
// quando o roteiro mistura moedas (ex.: JPY 12.000 + A$ 2.000 vira "A$
// 14.000"). Aqui cada item é convertido pra AUD (moeda de referência do
// mercado) ANTES de somar, usando as mesmas taxas do admin já usadas pela
// conversão "≈ A$" item-a-item em outras telas.
// ─────────────────────────────────────────────────────────────────────────────

/** Converte um valor numa moeda pra AUD. Retorna `null` quando a taxa não
 *  está disponível — nunca 0 silencioso (evita subestimar o total). */
export type ConvertToAud = (amount: number, currency: string) => number | null;

export type CategoryCostStatus = "verified" | "estimated" | "mixed";

export interface ConsolidatedCostCategory {
    moduleKey: CostReferencesGroup["moduleKey"];
    moduleLabel: string;
    /** Total da categoria em AUD (por pessoa), já convertido. */
    perPersonAUD: number;
    verifiedAUD: number;
    estimatedAUD: number;
    status: CategoryCostStatus;
    /** Moeda original ÚNICA da categoria — null quando os itens misturam moedas
     *  (nesse caso, mostrar só o total em AUD com nota de moedas originais). */
    originalCurrency: string | null;
    /** Soma na moeda original (por pessoa) — só quando `originalCurrency` != null. */
    originalAmountPerPerson: number | null;
    /** Lista de moedas originais distintas presentes na categoria (>1 = mista). */
    originalCurrencies: string[];
    /** Base "total ÷ pessoas" — só exibida quando a categoria tem EXATAMENTE
     *  1 item e ele foi cadastrado como gasto compartilhado (sharedByPeople > 1).
     *  Agregados de múltiplos itens não têm uma "base" única e coerente. */
    sharedBase: { amountTotal: number; currency: string; people: number } | null;
    /** true quando ao menos 1 item da categoria não pôde ser convertido pra
     *  AUD (moeda sem taxa cadastrada) — o total da categoria fica subestimado. */
    hasConversionGap: boolean;
}

export interface ConsolidatedTravelCostSummary {
    /** Custo total estimado da viagem, por pessoa, em AUD. */
    perPersonTotalAUD: number;
    verifiedAmountAUD: number;
    estimatedAmountAUD: number;
    /** 0..100, sempre `verifiedPercentage + estimatedPercentage === 100`
     *  quando houver algum valor informado (nunca 99/101 por arredondamento
     *  independente — um dos dois é sempre `100 - o outro`). */
    verifiedPercentage: number;
    estimatedPercentage: number;
    /** Categorias com custo informado, na ordem canônica dos módulos. */
    categories: ConsolidatedCostCategory[];
    /** Rótulos das categorias ATIVAS no roteiro (activeModules) sem NENHUM
     *  custo informado ainda — nunca inclui módulo que o criador não ativou. */
    missingCategories: string[];
    /** false quando nenhuma categoria tem custo informado — UI deve mostrar
     *  o estado "ainda não há estimativa" e ocultar barra/lista/simulador. */
    hasAnyData: boolean;
    /** true quando qualquer categoria tem `hasConversionGap` — some
     *  ao menos 1 item não pôde ser convertido pra AUD. */
    hasConversionFailure: boolean;
}

const MODULE_ORDER: CostReferencesGroup["moduleKey"][] = [
    "voo", "hospedagem", "passeios", "transporte", "restaurantes", "gastos_extras",
];

/** Mapa activeModules (chaves do wizard) -> moduleKey de custo. Só os módulos
 *  com conceito de custo próprio entram aqui — "itinerario"/"dicas"/
 *  "checklist" não têm categoria de gasto equivalente. */
const ACTIVE_MODULE_TO_COST_KEY: Record<string, CostReferencesGroup["moduleKey"]> = {
    voo: "voo",
    hospedagem: "hospedagem",
    passeios: "passeios",
    transporte: "transporte",
    restaurantes: "restaurantes",
    gastos_extras: "gastos_extras",
};

/**
 * Agrega os grupos de `getCostReferences` em categorias consolidadas,
 * convertendo cada item pra AUD antes de somar (nunca soma moedas
 * diferentes cruas). Não expõe título/nome de item — só o agregado da
 * categoria.
 */
export function aggregateCostsByCategory(
    groups: CostReferencesGroup[],
    convert: ConvertToAud,
): ConsolidatedCostCategory[] {
    const byKey = new Map(groups.map((g) => [g.moduleKey, g] as const));

    return MODULE_ORDER
        .map((moduleKey) => byKey.get(moduleKey))
        .filter((g): g is CostReferencesGroup => !!g && g.items.length > 0)
        .map((group) => {
            let perPersonAUD = 0;
            let verifiedAUD = 0;
            let estimatedAUD = 0;
            let hasConversionGap = false;
            const currencies = new Set<string>();

            for (const item of group.items) {
                currencies.add(item.currency);
                const converted = convert(item.amountPerPerson, item.currency);
                if (converted === null) {
                    hasConversionGap = true;
                    continue; // não soma — evita subestimar silenciosamente com 0
                }
                perPersonAUD += converted;
                if (item.disclosureType === "verified") verifiedAUD += converted;
                else estimatedAUD += converted;
            }

            const originalCurrencies = Array.from(currencies);
            const singleCurrency = originalCurrencies.length === 1 ? originalCurrencies[0] : null;
            const originalAmountPerPerson = singleCurrency
                ? group.items.reduce((sum, it) => sum + it.amountPerPerson, 0)
                : null;

            const status: CategoryCostStatus =
                verifiedAUD > 0 && estimatedAUD > 0 ? "mixed"
                    : verifiedAUD > 0 ? "verified"
                        : "estimated";

            const sharedBase = group.items.length === 1 && group.items[0].sharedByPeople > 1
                ? {
                    amountTotal: group.items[0].amountTotal,
                    currency: group.items[0].currency,
                    people: group.items[0].sharedByPeople,
                }
                : null;

            const category: ConsolidatedCostCategory = {
                moduleKey: group.moduleKey,
                moduleLabel: group.moduleLabel,
                perPersonAUD,
                verifiedAUD,
                estimatedAUD,
                status,
                originalCurrency: singleCurrency,
                originalAmountPerPerson,
                originalCurrencies,
                sharedBase,
                hasConversionGap,
            };
            return category;
        });
}

/**
 * Fonte única da verdade do resumo de custos da tela pública de Detalhes.
 * `activeModules` vem de `itinerary.activeModules` — só entram como
 * "categoria sem valor" módulos que o criador de fato ativou.
 */
export function buildConsolidatedCostSummary(
    form: Partial<ItineraryFormState> | null | undefined,
    activeModules: string[] | null | undefined,
    convert: ConvertToAud,
): ConsolidatedTravelCostSummary {
    const groups = getCostReferences(form);
    const categories = aggregateCostsByCategory(groups, convert);

    let verifiedAmountAUD = 0;
    let estimatedAmountAUD = 0;
    let hasConversionFailure = false;
    for (const cat of categories) {
        verifiedAmountAUD += cat.verifiedAUD;
        estimatedAmountAUD += cat.estimatedAUD;
        if (cat.hasConversionGap) hasConversionFailure = true;
    }
    const perPersonTotalAUD = verifiedAmountAUD + estimatedAmountAUD;

    // Arredondamento consistente: o percentual estimado é sempre o
    // complemento do comprovado — nunca os dois arredondam
    // independentemente (evita somar 99% ou 101%).
    let verifiedPercentage = 0;
    let estimatedPercentage = 0;
    if (perPersonTotalAUD > 0) {
        verifiedPercentage = Math.round((verifiedAmountAUD / perPersonTotalAUD) * 100);
        estimatedPercentage = 100 - verifiedPercentage;
    }

    const presentKeys = new Set(categories.map((c) => c.moduleKey));
    const missingCategories = Array.from(new Set(activeModules ?? []))
        .map((m) => ACTIVE_MODULE_TO_COST_KEY[m])
        .filter((key): key is CostReferencesGroup["moduleKey"] => !!key && !presentKeys.has(key))
        .map((key) => MODULE_LABEL_PT[key]);

    return {
        perPersonTotalAUD,
        verifiedAmountAUD,
        estimatedAmountAUD,
        verifiedPercentage,
        estimatedPercentage,
        categories,
        missingCategories,
        hasAnyData: categories.length > 0,
        hasConversionFailure,
    };
}
