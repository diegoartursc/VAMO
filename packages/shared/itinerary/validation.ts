/**
 * Validação canônica de roteiro — mesma lógica usada pelo web em
 * `isSectionComplete` / `MODULE_CONTENT` no dashboard do criador.
 *
 * Aplicada antes de enviar para análise (PENDING_REVIEW).
 */

import type {
    Activity,
    Day,
    ItineraryFormState,
    ModuleCostInfo,
    ModuleKey,
    ModuleSpending,
} from "./types";
import {
    MAX_CATEGORIES,
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
 * Considera uma atividade "vazia" quando nenhum dos campos textuais
 * principais tem conteúdo. Atividades vazias são placeholders criados
 * pelo botão "+ atividade" e não devem invalidar o dia.
 */
function activityHasContent(a: Activity | null | undefined): boolean {
    if (!a) return false;
    return !!(
        a.title?.trim()
        || a.description?.trim()
        || a.location?.trim()
        || a.mapLink?.trim()
    );
}

function submissionDays(form: ItineraryFormState): Day[] {
    const duration = Number.isFinite(form.duration)
        ? Math.max(0, Math.trunc(form.duration))
        : 0;
    return form.days.slice(0, duration);
}

/**
 * Predicado canônico — espelha `dayIsComplete` do StepDays do mobile.
 * Fonte única de verdade entre o form (UI) e a validação de envio.
 *
 * Um dia é completo quando:
 *  - possui descrição (após trim);
 *  - possui pelo menos 1 atividade com conteúdo (title OU description);
 *  - todas as atividades com conteúdo possuem título preenchido.
 */
export function dayIsComplete(d: Day | null | undefined): boolean {
    if (!d) return false;
    if (!d.description?.trim()) return false;
    const activities = Array.isArray(d.activities) ? d.activities : [];
    const real = activities.filter(activityHasContent);
    if (real.length === 0) return false;
    return real.every(a => !!a.title?.trim());
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

function isValidOptionalUrl(value?: string | null): boolean {
    const raw = value?.trim();
    if (!raw) return true;
    if (/\s/.test(raw)) return false;
    const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    try {
        const url = new URL(candidate);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch {
        return false;
    }
}

/** Verifica se um módulo ativo tem conteúdo mínimo. */
export function isModuleComplete(
    moduleKey: ModuleKey,
    form: ItineraryFormState,
): boolean {
    switch (moduleKey) {
        case "itinerario":
            // Valida exatamente os dias da duração atual. Dias órfãos de
            // uma duração antiga não podem gerar pendência falsa.
            return form.duration >= MIN_DAYS
                && form.days.length >= form.duration
                && submissionDays(form).every(dayIsComplete);
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
    if (form.categories.length > MAX_CATEGORIES) {
        issues.push({ section: "identity", message: `Selecione no máximo ${MAX_CATEGORIES} categorias` });
    }
    const uniqueCategories = new Set(form.categories.map(c => c.trim().toLowerCase()).filter(Boolean));
    if (uniqueCategories.size !== form.categories.filter(Boolean).length) {
        issues.push({ section: "identity", message: "Remova categorias duplicadas" });
    }
    if (!form.description.trim()) {
        issues.push({ section: "identity", message: "Escreva uma descrição para o roteiro" });
    }
    if (!form.travelProofUrl?.trim()) {
        issues.push({ section: "proof", message: "Anexe o Comprovante de Viagem" });
    }
    if (!Number.isFinite(form.price) || form.price <= 0) {
        issues.push({ section: "commerce", message: "Defina um preço de venda válido" });
    }
    if (!Number.isFinite(form.duration) || form.duration < 1) {
        issues.push({ section: "identity", message: "A duração precisa ter pelo menos 1 dia" });
    }
    if (form.activeModules.length < 1) {
        issues.push({ section: "modules", message: "Ative pelo menos 1 módulo" });
    }
    if (form.days.length < form.duration) {
        issues.push({
            section: "itinerary",
            message: `Cadastre os ${form.duration} dias definidos na duração do roteiro`,
        });
    }
    if (form.highlightPhotos.filter(Boolean).length < 1) {
        issues.push({ section: "media", message: "Adicione pelo menos 1 imagem de capa" });
    }

    // Nota: comprovante de gasto por módulo é OPCIONAL — não geramos
    // pendência por ausência. O comprovante geral de viagem
    // (travelProofUrl) continua sendo obrigatório no bloco acima.

    for (const m of form.activeModules) {
        if (isModuleComplete(m, form)) continue;
        if (m === "itinerario") {
            issues.push({
                section: m,
                message: itinerarioIncompleteMessage(form),
            });
            continue;
        }
        issues.push({
            section: m,
            message: moduleIncompleteMessage(m),
        });
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

    for (const [index, day] of submissionDays(form).entries()) {
        for (const [activityIndex, activity] of (day.activities || []).entries()) {
            if (!isValidOptionalUrl(activity.mapLink)) {
                issues.push({
                    section: "itinerary",
                    message: `Dia ${index + 1}, atividade ${activityIndex + 1}: link do mapa inválido`,
                });
            }
        }
    }

    const linkChecks: Array<{ section: string; label: string; values: string[] }> = [
        {
            section: "hospedagem",
            label: "Hospedagens",
            values: form.accommodations.flatMap(a => [a.mapLink, a.externalLink]).filter(Boolean) as string[],
        },
        {
            section: "passeios",
            label: "Passeios & Atrações",
            values: form.attractions.flatMap(a => [a.mapLink, a.externalLink]).filter(Boolean) as string[],
        },
        {
            section: "restaurantes",
            label: "Restaurantes",
            values: form.restaurants.map(r => r.externalLink).filter(Boolean) as string[],
        },
    ];
    for (const check of linkChecks) {
        if (check.values.some(v => !isValidOptionalUrl(v))) {
            issues.push({ section: check.section, message: `${check.label}: revise links inválidos` });
        }
    }

    return issues;
}

/**
 * Mensagem granular para o módulo "itinerário": lista exatamente
 * quais dias (pelo índice em `form.days`) estão incompletos.
 *
 *  - 1 dia incompleto  → "Complete o Dia X do itinerário."
 *  - 2+ dias           → "Complete os dias 2, 4 e 5 do itinerário."
 *  - todos incompletos → fallback genérico.
 */
function itinerarioIncompleteMessage(form: ItineraryFormState): string {
    const days = submissionDays(form);
    if (days.length === 0) {
        return "Cadastre pelo menos 1 dia de roteiro.";
    }
    const missing: number[] = [];
    for (let i = 0; i < days.length; i++) {
        if (!dayIsComplete(days[i])) missing.push(i + 1);
    }
    if (missing.length === 0) {
        // Não deveria ocorrer (módulo só entra aqui se incompleto),
        // mas mantemos fallback defensivo.
        return moduleIncompleteMessage("itinerario");
    }
    if (missing.length === days.length) {
        return "Preencha todos os dias com descrição e ao menos uma atividade.";
    }
    if (missing.length === 1) {
        return `Complete o Dia ${missing[0]} do itinerário.`;
    }
    const head = missing.slice(0, -1).join(", ");
    const tail = missing[missing.length - 1];
    return `Complete os dias ${head} e ${tail} do itinerário.`;
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
