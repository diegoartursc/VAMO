/**
 * Regras de pontuação (XP) e proteções contra abuso.
 *
 * Os valores ficam centralizados aqui para que o backend (futuro) e o app
 * compartilhem a mesma fonte da verdade. Hoje alimentam os cálculos locais.
 */

import type { GamificationEvent } from './gamification.types';

/** XP por evento do VIAJANTE. */
export const TRAVELER_XP: Partial<Record<GamificationEvent, number>> = {
    PROFILE_COMPLETED: 50,
    ITINERARY_SAVED: 10,
    ITINERARY_VIEWED: 5,
    ITINERARY_PURCHASED: 100,
    REVIEW_CREATED: 80,
    REVIEW_MARKED_USEFUL: 30,
    ITINERARY_SHARED: 20,
    WISHLIST_ADDED: 10,
    CHECKLIST_COMPLETED: 40,
};

/** XP por evento do ROTEIRISTA (reclamação procedente penaliza). */
export const CREATOR_XP: Partial<Record<GamificationEvent, number>> = {
    CREATOR_IDENTITY_APPROVED: 100,
    CREATOR_FIRST_ITINERARY_APPROVED: 150,
    CREATOR_ITINERARY_APPROVED: 80,
    CREATOR_FIRST_SALE: 200,
    CREATOR_SALE_CONFIRMED: 50,
    CREATOR_REVIEW_5: 80,
    CREATOR_REVIEW_4: 40,
    CREATOR_FAST_RESPONSE: 20,
    CREATOR_ROUTE_UPDATED: 50,
    CREATOR_COMPLAINT: -120,
};

/**
 * Proteções contra abuso (teto mensal de XP por tipo de evento). Eventos de
 * baixo esforço/alta repetição são limitados; eventos de alto valor (compra,
 * avaliação) não entram aqui.
 */
export const MONTHLY_XP_CAPS: Partial<Record<GamificationEvent, number>> = {
    ITINERARY_SAVED: 200,   // ~20 saves/mês
    ITINERARY_VIEWED: 150,  // ~30 views/mês
    ITINERARY_SHARED: 100,  // ~5 shares/mês
    WISHLIST_ADDED: 100,
};

/**
 * Regras de integridade que a camada de eventos deve respeitar:
 *  - Avaliação só pontua se vinculada a uma compra real (verificar no backend).
 *  - Nível de roteirista nunca depende só de quantidade — ver calculateCreatorLevel.
 */
export const INTEGRITY_RULES = {
    reviewRequiresPurchase: true,
    creatorLevelRequiresQuality: true,
} as const;

/**
 * Aplica o teto mensal a um ganho de XP de um evento. Recebe quanto já foi
 * ganho no mês para aquele evento e devolve o XP efetivamente concedido
 * (0 quando o teto já foi atingido). Útil quando houver log de eventos real.
 */
export function applyMonthlyCap(
    event: GamificationEvent,
    rawPoints: number,
    alreadyEarnedThisMonth: number,
): number {
    const cap = MONTHLY_XP_CAPS[event];
    if (cap === undefined) return rawPoints; // sem teto
    const remaining = Math.max(0, cap - Math.max(0, alreadyEarnedThisMonth));
    return Math.max(0, Math.min(rawPoints, remaining));
}
