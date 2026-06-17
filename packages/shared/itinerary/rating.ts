/**
 * rating — decide como EXIBIR a nota de um roteiro/pacote nos cards.
 *
 * Regra dura: nota só aparece se houver pelo menos UMA avaliação real.
 * Sem reviews, mostra "Novo" — não 5.0, não 0.0, não nota do criador.
 *
 * Fonte única — todo card (Home/Busca/Favoritos/Carrinho/Detalhes/PDF) usa
 * essa função pra que a regra seja a mesma em qualquer lugar.
 */

export interface RouteRatingDisplay {
    /** 'rating' = mostra estrela + nota; 'new' = mostra "Novo". */
    type: 'rating' | 'new';
    /** Texto pronto pra renderizar (ex: "4.8" ou "Novo"). */
    label: string;
    /** Nota numérica quando type='rating'; undefined em 'new'. */
    rating?: number;
    /** Quantidade de reviews reais (sempre presente; 0 em 'new'). */
    reviewCount: number;
}

/**
 * Resolve a exibição de rating a partir do estado real do roteiro.
 *
 * NUNCA misture com `creator.rating` — a nota do criador é OUTRA métrica
 * (reputação acumulada do roteirista), e nunca substitui a do roteiro.
 * Se quiser exibir a do criador, faça isso em outro componente com label
 * explícito ("Roteirista 5.0"), não no badge de rating do card.
 */
export function getRouteRatingDisplay(input: {
    averageRating?: number | string | null;
    reviewCount?: number | string | null;
}): RouteRatingDisplay {
    const count = toFiniteNonNegative(input.reviewCount);
    if (count < 1) {
        return { type: 'new', label: 'Novo', reviewCount: 0 };
    }
    const raw = toFiniteNonNegative(input.averageRating);
    // Defensivo: se o caller bateu o gate de reviewCount mas o backend mandou
    // averageRating null/0 (inconsistência), preferimos "Novo" a um falso 0.0.
    if (raw <= 0) {
        return { type: 'new', label: 'Novo', reviewCount: count };
    }
    const clamped = Math.min(5, raw);
    return {
        type: 'rating',
        label: clamped.toFixed(1),
        rating: clamped,
        reviewCount: count,
    };
}

function toFiniteNonNegative(v: unknown): number {
    const n = Number(v);
    if (!Number.isFinite(n) || n < 0) return 0;
    return n;
}
