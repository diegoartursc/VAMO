/**
 * Ranking real de "Criadores recomendados" (lado backend, puro — sem
 * Prisma/Express, testável isoladamente). Consumido por
 * `GET /api/creators/recommended` em routes/creators.ts.
 *
 * NUNCA ordena só por vendas nem por média simples — ver
 * calculateCreatorLevel/confidenceRating em @vamo/shared. Regras:
 *
 *  1. Elegibilidade: precisa ter ao menos 1 roteiro ACTIVE (senão não há
 *     nada pra vender agora) E nível de reputação calculado >= "Roteirista
 *     Recomendado" (ver CREATOR_REPUTATION_ORDER). Um criador com só
 *     rascunhos/pendentes/pausados/arquivados nunca aparece aqui, mesmo
 *     com histórico de vendas antigo.
 *  2. Score de ranking pondera vendas reais (log1p, satura influência de
 *     volume bruto), nota com confiança estatística (confidenceRating —
 *     suaviza notas com poucas avaliações), o PRÓPRIO nível de reputação
 *     (peso adicional, não único critério) e qualidade média dos roteiros
 *     ATIVOS. `responseRatePct`/`complaintRatePct` ainda não têm dado real
 *     persistido no produto — entram como 0 (nem penalizam nem promovem
 *     por dado inexistente; documentado como limitação conhecida).
 *  3. Bônus contextual (destino/categoria/estilo do filtro ativo) é somado
 *     DEPOIS do score de reputação e é limitado (CONTEXT_BONUS_CAP) pra
 *     nunca superar a diferença típica entre dois níveis de reputação —
 *     um criador sem histórico nunca fica em primeiro só por ter 1 roteiro
 *     no destino pesquisado, porque ele nem passa da elegibilidade.
 *  4. Sem candidato elegível relacionado ao contexto → cai pros melhores
 *     elegíveis GLOBAIS automaticamente (o bônus contextual é 0 pra quem
 *     não bate; a ordenação por finalScore já resolve o fallback sem
 *     lógica extra, nunca perfis aleatórios, nunca afrouxa elegibilidade).
 */
import {
    calculateCreatorLevel,
    confidenceRating,
    CREATOR_REPUTATION_ORDER,
    CREATOR_REPUTATION_BY_KEY,
    type CreatorReputationStatsInput,
} from '@vamo/shared';

export const PUBLIC_ITINERARY_STATUS = 'ACTIVE';

// ─── Pesos (documentados) ────────────────────────────────────────
// Soma dos pesos "positivos" = 1.0; a penalidade de reclamação é subtraída
// à parte (recommendationScore nunca fica negativo).
export const SALES_WEIGHT = 0.30;
export const RATING_WEIGHT = 0.30;
export const REPUTATION_WEIGHT = 0.15;
export const QUALITY_WEIGHT = 0.15;
export const RESPONSE_WEIGHT = 0.10;
export const COMPLAINT_PENALTY_WEIGHT = 0.25;
/** Vendas "de referência" pra normalizar log1p(sales) em 0..1 (satura suave). */
export const SALES_REFERENCE = 200;
/** Teto do bônus contextual — sempre menor que o gap típico entre dois
 *  níveis de reputação consecutivos, pra nunca inverter a ordem só por
 *  afinidade de destino/categoria. */
export const CONTEXT_BONUS_CAP = 0.12;
export const CONTEXT_BONUS_PER_MATCH = 0.06;

/** Elegível = já alcançou pelo menos "Roteirista Recomendado" no cálculo real. */
export const MIN_ELIGIBLE_LEVEL_INDEX = CREATOR_REPUTATION_ORDER.indexOf('recommended_creator');

export function splitCsv(value: string | undefined): string[] {
    if (!value) return [];
    return value.split(',').map((v) => v.trim().toLowerCase()).filter(Boolean);
}

export function normalizeMatchText(value: string | undefined | null): string {
    return String(value || '').trim().toLowerCase();
}

/** Normaliza x para 0..1 usando log1p contra uma referência (satura volume bruto). */
export function logConfidence(value: number, reference: number): number {
    if (value <= 0) return 0;
    return Math.min(1, Math.log1p(value) / Math.log1p(reference));
}

/** Shape mínimo de Itinerary usado pelo ranking (subset do Prisma include). */
export interface RecommendationItineraryInput {
    id: string;
    title?: string | null;
    status: string;
    destination?: string | null;
    country?: string | null;
    categories?: string[] | null;
    travelStyles?: string[] | null;
    qualityScore?: number | null;
    reviews?: { rating: number }[];
    _count?: { sales: number };
    /** Primeira imagem de capa, quando existir (ItineraryImage[0].url). */
    coverImage?: string | null;
}

/** Shape mínimo de Creator usado pelo ranking (subset do Prisma include). */
export interface RecommendationCreatorInput {
    id: string;
    verificationLevel: string;
    traveler: { name: string; avatar?: string | null; coverUrl?: string | null };
    itineraries: RecommendationItineraryInput[];
}

export interface RecommendationContext {
    wantedDestination: string;
    wantedCountry: string;
    wantedCategories: string[];
    wantedStyles: string[];
}

export interface RecommendedItineraryThumbnail {
    id: string;
    title: string;
    image: string | null;
}

export interface RecommendationCandidate {
    id: string;
    eligible: boolean;
    contextualMatch: boolean;
    finalScore: number;
    stats: { totalSales: number; reviewCount: number };
    payload: {
        id: string;
        name: string;
        avatar: string | null;
        coverUrl: string | null;
        reputation: { level: string; label: string; icon: string; color: string };
        stats: {
            activeItineraries: number;
            totalSales: number;
            averageRating: number | null;
            reviewCount: number;
            averageQualityScore: number | null;
        };
        /** Até 3 roteiros ativos pra prévia visual — prioriza os que batem
         *  com o contexto pesquisado. Nunca preenchido com dado genérico:
         *  ausente quando o roteiro não tem nenhuma imagem real. */
        topItineraries: RecommendedItineraryThumbnail[];
        recommendation: {
            score: number;
            contextualMatch: boolean;
            matchingDestinations: string[];
            matchingCategories: string[];
            /** Evidência mais forte — sempre presente quando eligible. */
            primaryReason: string;
            /** Segunda evidência, só quando há uma segunda genuína (nunca inventada). */
            secondaryReason?: string;
            /** @deprecated Mantido por compat (primaryReason + secondaryReason já cobrem o mesmo dado). */
            reason: string;
        };
    };
}

/**
 * Monta o candidato a recomendação de um Creator (com `itineraries` já
 * incluindo `reviews`/`_count.sales`/status). Aplica elegibilidade, calcula
 * o nível de reputação REAL (não o VerificationLevel técnico), o score
 * ponderado e o bônus contextual. Pura — sem I/O.
 */
export function buildRecommendationCandidate(
    creator: RecommendationCreatorInput,
    context: RecommendationContext,
): RecommendationCandidate {
    const allItineraries = creator.itineraries || [];
    const activeItineraries = allItineraries.filter((it) => it.status === PUBLIC_ITINERARY_STATUS);

    // Vendas REAIS (todas as épocas — histórico comercial sobrevive a
    // pausa/arquivamento), nunca o campo agregado Creator.totalSales sozinho.
    const totalSales = allItineraries.reduce((sum, it) => sum + (it._count?.sales ?? 0), 0);

    // Avaliações REAIS (Review), agregadas de TODOS os roteiros do criador —
    // avaliação histórica não some quando um roteiro é pausado/arquivado.
    const allReviews = allItineraries.flatMap((it) => it.reviews || []);
    const reviewCount = allReviews.length;
    const averageRating = reviewCount > 0
        ? allReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
        : 0;

    const activeQualityScores = activeItineraries
        .map((it) => Number(it.qualityScore) || 0)
        .filter((q) => q > 0);
    const averageQualityScore = activeQualityScores.length
        ? activeQualityScores.reduce((a, b) => a + b, 0) / activeQualityScores.length
        : null;

    const manualAmbassador = String(creator.verificationLevel).toUpperCase() === 'AMBASSADOR';

    const statsInput: CreatorReputationStatsInput = {
        identityApproved: true,
        activeItineraries: activeItineraries.length,
        totalSales,
        averageRating,
        reviewCount,
        // Sem dado real persistido hoje — documentado como limitação. Não
        // inventamos taxa de resposta/reclamação; ausente é neutro (não
        // pontua, não penaliza).
        responseRatePct: undefined,
        complaintRatePct: undefined,
        manualAmbassador,
    };

    const levelResult = calculateCreatorLevel(statsInput);
    const levelIndex = CREATOR_REPUTATION_ORDER.indexOf(levelResult.level);

    const eligible = activeItineraries.length > 0 && levelIndex >= MIN_ELIGIBLE_LEVEL_INDEX;

    // ─── Score ponderado ───
    const salesConfidenceScore = logConfidence(totalSales, SALES_REFERENCE);
    const ratedAvg = confidenceRating(averageRating, reviewCount); // já suaviza p/ pouca amostra
    const ratingConfidenceScore = Math.max(0, Math.min(1, ratedAvg / 5));
    const reputationScore = CREATOR_REPUTATION_ORDER.length > 1
        ? levelIndex / (CREATOR_REPUTATION_ORDER.length - 1)
        : 0;
    const itineraryQualityScore = averageQualityScore != null ? averageQualityScore / 100 : 0;
    const responseScore = (statsInput.responseRatePct ?? 0) / 100;
    const complaintPenalty = ((statsInput.complaintRatePct ?? 0) / 100) * COMPLAINT_PENALTY_WEIGHT;

    const recommendationScore = Math.max(0,
        salesConfidenceScore * SALES_WEIGHT +
        ratingConfidenceScore * RATING_WEIGHT +
        reputationScore * REPUTATION_WEIGHT +
        itineraryQualityScore * QUALITY_WEIGHT +
        responseScore * RESPONSE_WEIGHT -
        complaintPenalty,
    );

    // ─── Afinidade contextual ───
    const activeDestinations = new Set(activeItineraries.map((it) => normalizeMatchText(it.destination)));
    const activeCountries = new Set(activeItineraries.map((it) => normalizeMatchText(it.country)));
    const activeCategories = new Set(activeItineraries.flatMap((it) => (it.categories || []).map((x) => normalizeMatchText(x))));
    const activeStyles = new Set(activeItineraries.flatMap((it) => (it.travelStyles || []).map((x) => normalizeMatchText(x))));

    const matchingDestinations = context.wantedDestination && activeDestinations.has(context.wantedDestination)
        ? [context.wantedDestination] : [];
    const matchingCountry = !!context.wantedCountry && activeCountries.has(context.wantedCountry);
    const matchingCategories = context.wantedCategories.filter((c) => activeCategories.has(c));
    const matchingStyles = context.wantedStyles.filter((s) => activeStyles.has(s));

    const matchCount = matchingDestinations.length + (matchingCountry ? 1 : 0)
        + matchingCategories.length + matchingStyles.length;
    const contextualMatch = matchCount > 0;
    const contextualBonus = Math.min(CONTEXT_BONUS_CAP, matchCount * CONTEXT_BONUS_PER_MATCH);

    const finalScore = recommendationScore + contextualBonus;

    // ─── Razões visuais — no máximo 2 (primária + secundária), QUALITATIVAS
    // de propósito: os NÚMEROS já aparecem em `stats`/CreatorTrustMetrics no
    // card, então a razão nunca repete "4,9 · 82 avaliações" — ela explica
    // O QUE esse número significa ("Muito bem avaliado"). Ordem de
    // prioridade: afinidade contextual > selo de nível alto > avaliação
    // forte > volume de vendas > qualidade dos roteiros. Cada evidência só
    // entra se o dado por trás dela existir de verdade.
    const reasons: string[] = [];
    if (matchingDestinations.length) {
        const original = allItineraries.find((it) => normalizeMatchText(it.destination) === matchingDestinations[0]);
        reasons.push(`Especialista em ${original?.destination ?? matchingDestinations[0]}`);
    }
    if (levelResult.level === 'vamo_ambassador') reasons.push('Embaixador VAMO');
    else if (levelResult.level === 'top_creator') reasons.push('Top Roteirista');
    if (reviewCount >= 5 && ratedAvg >= 4.7) reasons.push('Muito bem avaliado');
    if (totalSales >= 100) reasons.push('Um dos mais vendidos');
    if (averageQualityScore != null && averageQualityScore >= 85) reasons.push('Alta qualidade dos roteiros');
    // Nunca fica sem nenhuma razão: elegibilidade já garante pelo menos o
    // critério qualitativo do próprio nível de reputação.
    if (reasons.length === 0) reasons.push(levelResult.config.criteriaSummary);

    const [primaryReason, secondaryReason] = reasons;
    const reason = reasons.slice(0, 2).join(' · ');

    const repConfig = CREATOR_REPUTATION_BY_KEY[levelResult.level];

    // ─── Miniaturas — só roteiros ativos com imagem real. Prioriza os que
    // batem com o contexto pesquisado (mesma lógica de afinidade acima),
    // depois os de maior qualityScore. Nunca imagem genérica/duplicada.
    const contextualIds = new Set([
        ...allItineraries.filter((it) => matchingDestinations.includes(normalizeMatchText(it.destination))).map((it) => it.id),
        ...allItineraries.filter((it) => (it.categories || []).some((c) => matchingCategories.includes(normalizeMatchText(c)))).map((it) => it.id),
    ]);
    const topItineraries: RecommendedItineraryThumbnail[] = activeItineraries
        .filter((it) => !!it.coverImage)
        .sort((a, b) => {
            const aCtx = contextualIds.has(a.id) ? 1 : 0;
            const bCtx = contextualIds.has(b.id) ? 1 : 0;
            if (bCtx !== aCtx) return bCtx - aCtx;
            return (Number(b.qualityScore) || 0) - (Number(a.qualityScore) || 0);
        })
        .slice(0, 3)
        .map((it) => ({ id: it.id, title: it.title || '', image: it.coverImage || null }));

    return {
        id: creator.id,
        eligible,
        contextualMatch,
        finalScore,
        stats: { totalSales, reviewCount },
        payload: {
            id: creator.id,
            name: creator.traveler.name,
            avatar: creator.traveler.avatar || null,
            coverUrl: creator.traveler.coverUrl || null,
            reputation: {
                level: repConfig.level,
                label: repConfig.label,
                icon: repConfig.icon,
                color: repConfig.color,
            },
            stats: {
                activeItineraries: activeItineraries.length,
                totalSales,
                averageRating: reviewCount > 0 ? Math.round(averageRating * 10) / 10 : null,
                reviewCount,
                averageQualityScore: averageQualityScore != null ? Math.round(averageQualityScore) : null,
            },
            topItineraries,
            recommendation: {
                score: Math.round(finalScore * 1000) / 1000,
                contextualMatch,
                matchingDestinations,
                matchingCategories: [...matchingCategories, ...matchingStyles],
                primaryReason,
                secondaryReason,
                reason,
            },
        },
    };
}

/**
 * Ordena candidatos elegíveis por finalScore desc, com desempate
 * DETERMINÍSTICO (vendas → avaliações → id). Não filtra elegibilidade
 * (caller decide) — só ordena e corta pelo `limit`.
 */
export function rankRecommendationCandidates(
    candidates: RecommendationCandidate[],
    limit: number,
): RecommendationCandidate[] {
    return [...candidates]
        .sort((a, b) => {
            if (b.finalScore !== a.finalScore) return b.finalScore - a.finalScore;
            if (b.stats.totalSales !== a.stats.totalSales) return b.stats.totalSales - a.stats.totalSales;
            if (b.stats.reviewCount !== a.stats.reviewCount) return b.stats.reviewCount - a.stats.reviewCount;
            return a.id.localeCompare(b.id);
        })
        .slice(0, limit);
}

export type RecommendationResultType = 'contextual' | 'global_fallback';

/**
 * Classifica o resultado final pro frontend saber se pode dizer "relacionado
 * à sua busca" ou se precisa deixar claro que é um fallback global. `no_context`
 * quando a busca não tinha nenhum filtro pra começo de conversa (o frontend
 * trata igual a `global_fallback` pra fins de copy, mas o valor é distinto
 * pra não fingir correlação que nunca foi buscada).
 */
export function classifyRecommendationResult(
    ranked: RecommendationCandidate[],
    hasContext: boolean,
): RecommendationResultType {
    if (hasContext && ranked.some((c) => c.contextualMatch)) return 'contextual';
    return 'global_fallback';
}
