/**
 * Trilha do Roteirista — reputação/confiança comercial do CRIADOR.
 * Fonte ÚNICA da verdade, consumida pelo backend (cálculo/endpoint de
 * recomendação) e pelo mobile (renderização) — nunca duplicar esta fórmula.
 *
 * Distinção conceitual importante: esta é a trilha do ROTEIRISTA (5 níveis,
 * por CRITÉRIOS de qualidade+volume). NÃO confundir com o "Passaporte VAMO"
 * do VIAJANTE (7 níveis, por XP acumulado) — trilhas e arquivos separados
 * de propósito, ver apps/mobile/src/gamification/travelerLevels.ts.
 *
 * Por que 5 níveis (não 6): esta é a contagem canônica confirmada em sessões
 * anteriores do produto. Não existe um 6º nível documentado em nenhum outro
 * arquivo do repositório para a trilha do roteirista — se alguém mencionar
 * "6 níveis", está se referindo (por engano) à trilha do viajante, que tem
 * 7. Não adicionar um nível novo sem uma fonte de produto explícita.
 */

export type CreatorReputationLevel =
    | 'verified_creator'
    | 'recommended_creator'
    | 'travel_curator'
    | 'top_creator'
    | 'vamo_ambassador';

export interface CreatorReputationLevelConfig {
    level: CreatorReputationLevel;
    label: string;
    /** Frase curta, tom de confiança (nunca promessa absoluta). */
    description: string;
    /**
     * Critérios resumidos SEM números exatos — evita "jogar" o sistema e
     * fica estável mesmo se os limiares numéricos mudarem. Números reais
     * (quando fizer sentido mostrá-los) vivem no dashboard do criador, não
     * aqui.
     */
    criteriaSummary: string;
    icon: string;
    color: string;
    bgColor: string;
    /** true = nunca alcançado por cálculo automático, só atribuição manual. */
    manualOnly?: boolean;
}

const SECONDARY = '#1A3263';
const GOLD = '#B8860B';
const DEEP_TEAL = '#0E7C74';
const PRIMARY = '#28C9BF';
const NAVY_BG = '#EEF1F8';
const TEAL_BG = '#E6FAF8';
const GOLD_BG = '#FBF4E1';

/** Ordem crescente de reputação — única fonte da ordem em qualquer tela. */
export const CREATOR_REPUTATION_LEVELS: CreatorReputationLevelConfig[] = [
    {
        level: 'verified_creator',
        label: 'Roteirista Verificado',
        description: 'Identidade confirmada e perfil aprovado pela VAMO.',
        criteriaSummary: 'Perfil e identidade confirmados',
        icon: '🛡️',
        color: SECONDARY,
        bgColor: NAVY_BG,
    },
    {
        level: 'recommended_creator',
        label: 'Roteirista Recomendado',
        description: 'Histórico inicial de vendas com avaliações positivas comprovadas.',
        criteriaSummary: 'Boas avaliações e histórico inicial',
        icon: '⭐',
        color: GOLD,
        bgColor: GOLD_BG,
    },
    {
        level: 'travel_curator',
        label: 'Curador de Viagens',
        description: 'Experiência consistente, bom volume de vendas e avaliações excelentes.',
        criteriaSummary: 'Experiência consistente e boa resposta',
        icon: '🧭',
        color: DEEP_TEAL,
        bgColor: TEAL_BG,
    },
    {
        level: 'top_creator',
        label: 'Top Roteirista',
        description: 'Desempenho comercial elevado e reputação excelente comprovada por volume de avaliações.',
        criteriaSummary: 'Alto desempenho e excelente reputação',
        icon: '🏆',
        color: GOLD,
        bgColor: GOLD_BG,
    },
    {
        level: 'vamo_ambassador',
        label: 'Embaixador VAMO',
        description: 'Reconhecimento institucional da equipe VAMO como referência da comunidade.',
        criteriaSummary: 'Reconhecimento da equipe VAMO',
        icon: '💎',
        color: PRIMARY,
        bgColor: TEAL_BG,
        manualOnly: true,
    },
];

export const CREATOR_REPUTATION_ORDER: CreatorReputationLevel[] =
    CREATOR_REPUTATION_LEVELS.map((c) => c.level);

export const CREATOR_REPUTATION_BY_KEY: Record<CreatorReputationLevel, CreatorReputationLevelConfig> =
    CREATOR_REPUTATION_LEVELS.reduce((acc, cfg) => {
        acc[cfg.level] = cfg;
        return acc;
    }, {} as Record<CreatorReputationLevel, CreatorReputationLevelConfig>);

/**
 * Métricas REAIS de um criador usadas pelo cálculo. Nomes explícitos para
 * nunca confundir "aprovado mas não publicado" (APPROVED) com "publicado e
 * disponível" (ACTIVE) — reputação PÚBLICA só considera roteiros ACTIVE.
 */
export interface CreatorReputationStatsInput {
    identityApproved: boolean;
    /** Roteiros do criador com status ACTIVE (publicados, à venda). */
    activeItineraries: number;
    /** Vendas REAIS (ItinerarySale.count) — nunca o campo agregado legado sozinho. */
    totalSales: number;
    /** Média simples das avaliações (o cálculo aplica a suavização por volume internamente). */
    averageRating: number;
    /** Quantidade de avaliações reais — usada para dar confiança à média. */
    reviewCount: number;
    /** 0..100 — taxa de resposta a dúvidas. Ausente = tratado como 0 (não penaliza nem promove sem dado real). */
    responseRatePct?: number;
    /** 0..100 — taxa de reclamação/reembolso (quanto menor, melhor). Ausente = tratado como 0. */
    complaintRatePct?: number;
    /** Seleção manual da equipe VAMO (sobrepõe critérios automáticos). Nunca setável pelo próprio criador. */
    manualAmbassador?: boolean;
}

export interface CreatorReputationResult {
    level: CreatorReputationLevel;
    config: CreatorReputationLevelConfig;
    nextLevel: CreatorReputationLevel | null;
    nextConfig: CreatorReputationLevelConfig | null;
    /** Critérios ainda não atingidos para o PRÓXIMO nível (texto p/ dashboard do criador). */
    unmetCriteria: string[];
}

/**
 * Limiares por nível. `minReviews` é o piso de AMOSTRA — sem ele, uma nota
 * 5,0 com 1 avaliação passaria no `ratingThreshold` sem nenhuma confiança
 * estatística. `ratingThreshold` é comparado contra a nota JÁ SUAVIZADA por
 * `confidenceRating`, não a média crua.
 */
const THRESHOLDS = {
    recommended: { activeItineraries: 3, sales: 5, minReviews: 3, ratingThreshold: 4.5 },
    curator: { activeItineraries: 10, sales: 30, minReviews: 10, ratingThreshold: 4.7, responseRate: 70 },
    top: { activeItineraries: 20, sales: 100, minReviews: 25, ratingThreshold: 4.8, maxComplaint: 5 },
} as const;

/** Nota-âncora usada quando o volume de avaliações ainda é baixo. */
const RATING_BASELINE = 4.3;
/** Constante de suavização (quanto maior, mais avaliações são exigidas para "confiar" na média crua). */
const RATING_SMOOTHING_K = 8;

/**
 * Média bayesiana simples: com poucas avaliações, a nota é puxada em
 * direção a `RATING_BASELINE`; com muitas, converge para a média real.
 * Mesma técnica usada no ranking de "Roteiros em Destaque"
 * (ver apps/backend/src/utils/featuredRanking.ts) — mantém o produto
 * consistente entre roteiro e criador.
 */
export function confidenceRating(averageRating: number, reviewCount: number): number {
    const avg = Number.isFinite(averageRating) ? averageRating : 0;
    const count = Number.isFinite(reviewCount) && reviewCount > 0 ? reviewCount : 0;
    return (
        (count / (count + RATING_SMOOTHING_K)) * avg +
        (RATING_SMOOTHING_K / (count + RATING_SMOOTHING_K)) * RATING_BASELINE
    );
}

function meetsRecommended(s: CreatorReputationStatsInput): boolean {
    const t = THRESHOLDS.recommended;
    return s.activeItineraries >= t.activeItineraries
        && s.totalSales >= t.sales
        && s.reviewCount >= t.minReviews
        && confidenceRating(s.averageRating, s.reviewCount) >= t.ratingThreshold;
}

function meetsCurator(s: CreatorReputationStatsInput): boolean {
    const t = THRESHOLDS.curator;
    return s.activeItineraries >= t.activeItineraries
        && s.totalSales >= t.sales
        && s.reviewCount >= t.minReviews
        && confidenceRating(s.averageRating, s.reviewCount) >= t.ratingThreshold
        && (s.responseRatePct ?? 0) >= t.responseRate;
}

function meetsTop(s: CreatorReputationStatsInput): boolean {
    const t = THRESHOLDS.top;
    return s.activeItineraries >= t.activeItineraries
        && s.totalSales >= t.sales
        && s.reviewCount >= t.minReviews
        && confidenceRating(s.averageRating, s.reviewCount) >= t.ratingThreshold
        && (s.complaintRatePct ?? 0) <= t.maxComplaint;
}

/** Texto dos critérios que faltam para alcançar `target` (uso: dashboard do criador). */
function unmetFor(target: CreatorReputationLevel, s: CreatorReputationStatsInput): string[] {
    const out: string[] = [];
    const need = (cond: boolean, text: string) => { if (!cond) out.push(text); };
    const rating = confidenceRating(s.averageRating, s.reviewCount);

    if (target === 'recommended_creator') {
        const t = THRESHOLDS.recommended;
        need(s.activeItineraries >= t.activeItineraries, `${t.activeItineraries} roteiros publicados`);
        need(s.totalSales >= t.sales, `${t.sales} vendas`);
        need(s.reviewCount >= t.minReviews, `${t.minReviews} avaliações`);
        need(rating >= t.ratingThreshold, `média ${t.ratingThreshold}+ com avaliações suficientes`);
    } else if (target === 'travel_curator') {
        const t = THRESHOLDS.curator;
        need(s.activeItineraries >= t.activeItineraries, `${t.activeItineraries} roteiros publicados`);
        need(s.totalSales >= t.sales, `${t.sales} vendas`);
        need(s.reviewCount >= t.minReviews, `${t.minReviews} avaliações`);
        need(rating >= t.ratingThreshold, `média ${t.ratingThreshold}+ com avaliações suficientes`);
        need((s.responseRatePct ?? 0) >= t.responseRate, 'boa taxa de resposta');
    } else if (target === 'top_creator') {
        const t = THRESHOLDS.top;
        need(s.activeItineraries >= t.activeItineraries, `${t.activeItineraries} roteiros publicados`);
        need(s.totalSales >= t.sales, `${t.sales} vendas`);
        need(s.reviewCount >= t.minReviews, `${t.minReviews} avaliações`);
        need(rating >= t.ratingThreshold, `média ${t.ratingThreshold}+ com avaliações suficientes`);
        need((s.complaintRatePct ?? 0) <= t.maxComplaint, 'baixa taxa de reclamação');
    } else if (target === 'vamo_ambassador') {
        out.push('Seleção manual da equipe VAMO');
    }
    return out;
}

/**
 * Calcula o nível de reputação a partir de métricas reais.
 * `manualAmbassador` sobrepõe qualquer critério automático — mas só deve
 * ser setado por uma rotina administrativa (nunca pelo próprio criador).
 */
export function calculateCreatorLevel(stats: CreatorReputationStatsInput): CreatorReputationResult {
    let level: CreatorReputationLevel = 'verified_creator';

    if (stats.manualAmbassador) {
        level = 'vamo_ambassador';
    } else if (meetsTop(stats)) {
        level = 'top_creator';
    } else if (meetsCurator(stats)) {
        level = 'travel_curator';
    } else if (meetsRecommended(stats)) {
        level = 'recommended_creator';
    }

    const idx = CREATOR_REPUTATION_ORDER.indexOf(level);
    const nextLevel = idx < CREATOR_REPUTATION_ORDER.length - 1 ? CREATOR_REPUTATION_ORDER[idx + 1] : null;

    return {
        level,
        config: CREATOR_REPUTATION_BY_KEY[level],
        nextLevel,
        nextConfig: nextLevel ? CREATOR_REPUTATION_BY_KEY[nextLevel] : null,
        unmetCriteria: nextLevel ? unmetFor(nextLevel, stats) : [],
    };
}
