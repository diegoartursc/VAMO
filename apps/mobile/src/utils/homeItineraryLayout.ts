/**
 * Métricas dos carrosséis de roteiro da Home — valor ÚNICO para todas as
 * seções (Destaque, Novos, Continue sua busca, Experiências inesquecíveis).
 *
 * Fica fora do componente por ser lógica pura e testável sem React Native.
 */

/** Largura de referência do card de roteiro na Home. */
export const HOME_ITINERARY_CARD_MAX_WIDTH = 320;
/** Respiro nas laterais: o card nunca encosta na borda da viewport. */
export const HOME_CAROUSEL_PADDING_HORIZONTAL = 20;
/** Espaço entre cards do carrossel. */
export const HOME_CAROUSEL_GAP = 16;

/**
 * Largura responsiva do card: 320px sempre que couber, senão a viewport menos
 * as margens laterais. Mantém a "espiadinha" do próximo card em telas largas e
 * evita card cortado/encostado na borda em telas estreitas.
 *
 * Entrada inválida (0, negativa, NaN) cai no padrão — nunca devolve largura
 * inutilizável.
 */
export function getHomeItineraryCardWidth(windowWidth: number): number {
    if (!Number.isFinite(windowWidth) || windowWidth <= 0) return HOME_ITINERARY_CARD_MAX_WIDTH;
    const available = windowWidth - HOME_CAROUSEL_PADDING_HORIZONTAL * 2;
    return Math.max(1, Math.min(HOME_ITINERARY_CARD_MAX_WIDTH, available));
}
