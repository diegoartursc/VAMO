/**
 * Validação canônica de roteiro — mesma lógica usada pelo web em
 * `isSectionComplete` / `MODULE_CONTENT` no dashboard do criador.
 *
 * Aplicada antes de enviar para análise (PENDING_REVIEW).
 */

import type {
    ItineraryFormState,
    ModuleKey,
} from "./types";
import {
    MIN_DAYS,
    MIN_TIPS,
    MIN_CHECKLIST,
    MIN_CATEGORIES,
} from "./constants";

export interface ValidationIssue {
    /** Identificador da seção/módulo. */
    section: string;
    /** Mensagem amigável para o usuário. */
    message: string;
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
            return !!(out.originCity && out.departureDate && out.arrivalDate
                && ret.originCity && ret.departureDate && ret.arrivalDate);
        }
        case "hospedagem":
            return form.accommodations.length > 0
                && form.accommodations.every(a => a.name?.trim() !== "");
        case "passeios":
            return form.attractions.length > 0
                && form.attractions.every(a => a.name?.trim() !== "");
        case "transporte":
            return form.transports.length > 0
                && form.transports.every(t =>
                    t.description?.trim() !== ""
                    && t.passTypes?.trim() !== "");
        case "dicas":
            return form.generalTips.filter(t => t.trim() !== "").length >= MIN_TIPS;
        case "restaurantes":
            return form.restaurants.length > 0
                && form.restaurants.every(r =>
                    r.name?.trim() !== "" && r.location?.trim() !== "");
        case "checklist":
            return form.checklistItems.filter(c => c.item?.trim() !== "").length >= MIN_CHECKLIST;
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
        issues.push({ section: "identity", message: "Anexe o Comprovante de Viagem" });
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

    for (const m of form.activeModules) {
        if (!isModuleComplete(m, form)) {
            issues.push({
                section: m,
                message: moduleIncompleteMessage(m),
            });
        }
    }

    return issues;
}

function moduleIncompleteMessage(key: ModuleKey): string {
    switch (key) {
        case "itinerario":   return "Preencha todos os dias com descrição e ao menos 1 atividade";
        case "voo":          return "Preencha origem, ida e volta do voo";
        case "hospedagem":   return "Adicione pelo menos 1 hospedagem com nome";
        case "passeios":     return "Adicione pelo menos 1 passeio com nome";
        case "transporte":   return "Adicione transporte com descrição e tipo de passe";
        case "dicas":        return `Preencha pelo menos ${MIN_TIPS} dicas exclusivas`;
        case "restaurantes": return "Adicione pelo menos 1 restaurante com nome e local";
        case "checklist":    return `Preencha pelo menos ${MIN_CHECKLIST} itens no checklist`;
        case "gasto":        return "Preencha valores válidos nos itens de gasto";
    }
}
