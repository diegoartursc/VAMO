/**
 * Validação canônica de roteiro — mesma lógica usada pelo web em
 * `isSectionComplete` / `MODULE_CONTENT` no dashboard do criador.
 *
 * Aplicada antes de enviar para análise (PENDING_REVIEW).
 */

import type {
    ItineraryFormState,
    ModuleCostInfo,
    ModuleKey,
    ModuleSpending,
} from "./types";
import {
    MIN_DAYS,
    MIN_TIPS,
    MIN_CHECKLIST,
    MIN_CATEGORIES,
} from "./constants";

/**
 * Checa se um `ModuleCostInfo` está em estado inconsistente: marcado como
 * `verified` mas sem nenhum comprovante anexado. Esse estado nunca pode
 * passar pra análise — o usuário precisa anexar comprovante OU trocar
 * para "estimated"/"not_informed".
 */
function isVerifiedWithoutProof(cost?: ModuleCostInfo | null): boolean {
    if (!cost) return false;
    if (cost.disclosureType !== "verified") return false;
    const proofs = cost.proofFiles ?? [];
    return proofs.length === 0;
}

export interface ValidationIssue {
    /** Identificador da seção/módulo. */
    section: string;
    /** Mensagem amigável para o usuário. */
    message: string;
}

/**
 * Gasto por módulo é 100% opcional. Tanto o valor quanto o comprovante
 * não são obrigatórios. Esta função sempre retorna `true` — mantida
 * apenas como hook para validações futuras (ex.: detectar formato
 * inválido). Nunca deve bloquear envio.
 *
 * (Regra anterior exigia comprovante quando valor > 0. Foi revertida.)
 */
function spendingOk(_sp?: ModuleSpending | null): boolean {
    return true;
}

/** Verifica se um módulo ativo tem conteúdo mínimo. */
export function isModuleComplete(
    moduleKey: ModuleKey,
    form: ItineraryFormState,
): boolean {
    switch (moduleKey) {
        case "itinerario":
            return form.days.length > 0
                && form.days.every(d =>
                    d.description?.trim() !== ""
                    && d.activities?.length > 0
                    && d.activities.every(a => a.title?.trim() !== ""));
        case "voo": {
            const { flightOutbound: out, flightReturn: ret } = form;
            const baseOk = !!(out.originCity && out.departureDate && out.arrivalDate
                && ret.originCity && ret.departureDate && ret.arrivalDate);
            return baseOk && spendingOk(form.flightSpending);
        }
        case "hospedagem":
            return form.accommodations.length > 0
                && form.accommodations.every(a => a.name?.trim() !== "" && spendingOk(a.spending));
        case "passeios":
            return form.attractions.length > 0
                && form.attractions.every(a => a.name?.trim() !== "" && spendingOk(a.spending));
        case "transporte":
            return form.transports.length > 0
                && form.transports.every(t =>
                    t.description?.trim() !== ""
                    && t.passTypes?.trim() !== ""
                    && spendingOk(t.spending));
        case "dicas":
            return form.generalTips.filter(t => t.trim() !== "").length >= MIN_TIPS;
        case "restaurantes":
            return form.restaurants.length > 0
                && form.restaurants.every(r =>
                    r.name?.trim() !== ""
                    && r.location?.trim() !== ""
                    && spendingOk(r.spending));
        case "checklist":
            return form.checklistItems.filter(c => c.item?.trim() !== "").length >= MIN_CHECKLIST;
        case "gastos_extras":
            return form.extraSpendingItems.length > 0
                && form.extraSpendingItems.every(e => e.title?.trim() !== "");
        // Legacy: módulo "gasto" foi removido das opções, mas mantemos a
        // checagem aqui para roteiros antigos que ainda o tenham ativo.
        case "gasto":
            return form.spendingEntries.length > 0
                && form.spendingEntries.every(e => {
                    if (parseFloat(e.priceValue) <= 0) return false;
                    if (e.moduleKey === "voo" && !e.originCity?.trim()) return false;
                    return true;
                });
    }
}

/** Lista todos os problemas que impedem o envio para análise. */
export function validateForSubmission(form: ItineraryFormState): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    const firstLoc = form.locations[0];
    const city    = (firstLoc?.cities?.[0] || form.destination || "").trim();
    const country = (firstLoc?.country     || form.country     || "").trim();

    if (!form.title.trim()) {
        issues.push({ section: "identity", message: "Defina um título para o roteiro" });
    }
    if (!city || !country) {
        issues.push({ section: "identity", message: "Informe cidade e país de destino" });
    }
    if (form.categories.length < MIN_CATEGORIES) {
        issues.push({ section: "identity", message: `Selecione pelo menos ${MIN_CATEGORIES} categoria` });
    }
    if (!form.travelProofUrl?.trim()) {
        issues.push({ section: "proof", message: "Anexe o Comprovante de Viagem" });
    }
    if (form.price <= 0) {
        issues.push({ section: "commerce", message: "Defina um preço de venda válido" });
    }
    if (form.activeModules.length < 1) {
        issues.push({ section: "modules", message: "Ative pelo menos 1 módulo" });
    }
    if (form.days.length < MIN_DAYS) {
        issues.push({ section: "itinerary", message: `Cadastre pelo menos ${MIN_DAYS} dias de roteiro` });
    }

    // Nota: comprovante de gasto por módulo é OPCIONAL — não geramos
    // pendência por ausência. O comprovante geral de viagem
    // (travelProofUrl) continua sendo obrigatório no bloco acima.

    for (const m of form.activeModules) {
        if (!isModuleComplete(m, form)) {
            issues.push({
                section: m,
                message: moduleIncompleteMessage(m),
            });
        }
    }

    // ── Consistência de "Valor comprovado" sem comprovante ──
    // Quando o usuário escolhe explicitamente "Valor comprovado" mas não
    // anexa arquivo, o item fica em estado inconsistente: não dá pra dar
    // o selo de comprovado sem comprovante. Geramos pendência por módulo
    // afetado para que o usuário corrija (anexar OU rebaixar para
    // estimado/não informar). Só checamos módulos ativos.
    const activeSet = new Set<ModuleKey>(form.activeModules);

    type CostCheck = { module: ModuleKey; section: string; label: string; costs: Array<ModuleCostInfo | undefined | null> };
    const costChecks: CostCheck[] = [
        { module: "voo",           section: "voo",           label: "Meu Voo",                  costs: [form.flightCost] },
        { module: "hospedagem",    section: "hospedagem",    label: "Hospedagens",              costs: form.accommodations.map(a => a.cost) },
        { module: "passeios",      section: "passeios",      label: "Passeios & Atrações",      costs: form.attractions.map(a => a.cost) },
        { module: "transporte",    section: "transporte",    label: "Transporte",               costs: form.transports.map(t => t.cost) },
        { module: "restaurantes",  section: "restaurantes",  label: "Restaurantes & Gastronomia", costs: form.restaurants.map(r => r.cost) },
        { module: "gastos_extras", section: "gastos_extras", label: "Gastos Extras",            costs: form.extraSpendingItems.map(e => e.cost) },
    ];

    for (const check of costChecks) {
        if (!activeSet.has(check.module)) continue;
        const broken = check.costs.filter(isVerifiedWithoutProof).length;
        if (broken > 0) {
            issues.push({
                section: check.section,
                message: broken === 1
                    ? `${check.label}: valor marcado como comprovado, mas sem comprovante anexado.`
                    : `${check.label}: ${broken} valores comprovados sem comprovante anexado.`,
            });
        }
    }

    return issues;
}

function moduleIncompleteMessage(key: ModuleKey): string {
    switch (key) {
        case "itinerario":    return "Preencha todos os dias com descrição e ao menos 1 atividade";
        case "voo":           return "Preencha origem, ida e volta do voo";
        case "hospedagem":    return "Adicione pelo menos 1 hospedagem com nome";
        case "passeios":      return "Adicione pelo menos 1 passeio com nome";
        case "transporte":    return "Adicione transporte com descrição e tipo de passe";
        case "dicas":         return `Preencha pelo menos ${MIN_TIPS} dicas exclusivas`;
        case "restaurantes":  return "Adicione pelo menos 1 restaurante com nome e local";
        case "checklist":     return `Preencha pelo menos ${MIN_CHECKLIST} itens no checklist`;
        case "gastos_extras": return "Adicione pelo menos 1 gasto extra com título";
        case "gasto":         return "Preencha valores válidos nos itens de gasto";
    }
}
