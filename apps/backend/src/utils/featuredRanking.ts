/**
 * Ranking de confiança de "Roteiros em Destaque" (lado backend).
 *
 * ⚠️ Esta fórmula e suas constantes DEVEM permanecer SINCRONIZADAS com a
 * versão do mobile em `apps/mobile/src/utils/homeSections.ts`
 * (calculateFeaturedRankScore / selectFeatured). Backend e mobile não
 * compartilham um pacote comum para essa regra hoje — por isso a duplicação
 * é intencional. Qualquer ajuste de constante/fórmula aqui precisa ser
 * replicado lá, e vice-versa, senão a API /featured e a Home divergem.
 *
 * Intenção (NÃO é rating puro):
 *  - a nota continua importando (peso dominante);
 *  - volume de reviews aumenta a confiança na nota (média bayesiana);
 *  - vendas REAIS do roteiro são prova social;
 *  - qualidade técnica ajuda no desempate de score;
 *  - rating 5.0 com pouquíssimas avaliações NÃO domina 4.9 com muitas.
 */

/** Nota mínima para entrar em Destaque. */
export const FEATURED_MIN_RATING = 4.5;
/** Mínimo de reviews REAIS — 1 review já basta enquanto o catálogo é pequeno. */
export const FEATURED_MIN_REVIEWS = 1;
/**
 * Volume de reviews a partir do qual confiamos na nota "como ela é". Abaixo
 * disso a média bayesiana puxa a nota em direção à BASELINE_RATING.
 */
export const MIN_CONFIDENCE_REVIEWS = 25;
/** Nota-âncora usada pela média bayesiana quando há poucos reviews. */
export const BASELINE_RATING = 4.5;

/**
 * Pontuação de CONFIANÇA para ranking de Destaque. Pura e determinística.
 * Espelho exato de calculateFeaturedRankScore no mobile.
 */
export function calculateFeaturedRankScore(it: any): number {
    const rating = Number(it?.averageRating ?? it?.rating) || 0;
    const reviewCount = Number(it?.reviewCount) || 0;
    // Vendas REAIS DESTE roteiro (salesCount = Itinerary._count.sales). Fallback
    // defensivo no agregado do criador SÓ pra não regredir quando o salesCount
    // top-level estiver ausente — `creator.salesCount` é o total acumulado do
    // criador, NÃO as vendas deste roteiro específico.
    const salesCount = Number(it?.salesCount ?? it?.creator?.salesCount) || 0;
    const qualityScore = Number(it?.qualityScore) || 0;

    // Média bayesiana: poucos reviews ⇒ nota puxada para BASELINE_RATING.
    const weightedRating =
        (reviewCount / (reviewCount + MIN_CONFIDENCE_REVIEWS)) * rating +
        (MIN_CONFIDENCE_REVIEWS / (reviewCount + MIN_CONFIDENCE_REVIEWS)) * BASELINE_RATING;

    // log1p dá peso a volume sem deixar números enormes esmagarem a nota.
    return (
        weightedRating * 100 +
        Math.log1p(reviewCount) * 12 +
        Math.log1p(salesCount) * 10 +
        qualityScore * 0.25
    );
}

/**
 * Aplica os pisos de Destaque (reviews/rating) e ordena por
 * featuredRankScore DESC, com os mesmos desempates do mobile:
 * reviewCount → salesCount → rating → qualityScore → featured → recência.
 *
 * Recebe itens JÁ no shape do payload da API (com `salesCount` top-level,
 * `reviewCount`, `rating`, `qualityScore`, `featured`, `approvedAt`,
 * `createdAt`). O caller decide o `limit` final.
 */
export function selectFeaturedRanked<T extends Record<string, any>>(
    items: T[],
    limit?: number,
): T[] {
    if (!Array.isArray(items)) return [];
    const ranked = items
        .filter((it) => {
            const reviews = Number(it.reviewCount) || 0;
            const rating = Number(it.averageRating ?? it.rating) || 0;
            return reviews >= FEATURED_MIN_REVIEWS && rating >= FEATURED_MIN_RATING;
        })
        .map((it) => ({ it, score: calculateFeaturedRankScore(it) }))
        .sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            const x = a.it, y = b.it;
            const na = Number(x.reviewCount) || 0, nb = Number(y.reviewCount) || 0;
            if (nb !== na) return nb - na;
            const sa = Number(x.salesCount ?? x.creator?.salesCount) || 0;
            const sb = Number(y.salesCount ?? y.creator?.salesCount) || 0;
            if (sb !== sa) return sb - sa;
            const ra = Number(x.averageRating ?? x.rating) || 0;
            const rb = Number(y.averageRating ?? y.rating) || 0;
            if (rb !== ra) return rb - ra;
            const qa = Number(x.qualityScore) || 0, qb = Number(y.qualityScore) || 0;
            if (qb !== qa) return qb - qa;
            if (!!y.featured !== !!x.featured) return (y.featured ? 1 : 0) - (x.featured ? 1 : 0);
            return publishedTime(y) - publishedTime(x);
        })
        .map(({ it }) => it);
    return typeof limit === 'number' ? ranked.slice(0, limit) : ranked;
}

/** Recência de publicação: approvedAt → createdAt. */
function publishedTime(it: any): number {
    const candidate = it?.approvedAt ?? it?.createdAt;
    if (!candidate) return 0;
    const t = new Date(candidate).getTime();
    return Number.isFinite(t) ? t : 0;
}
