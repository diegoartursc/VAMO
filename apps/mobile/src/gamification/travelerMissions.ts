/**
 * Missões do Passaporte VAMO, organizadas por nível e na ordem da jornada.
 *
 * Jornada (sem repetições com nome diferente):
 *   perfil → favorito → carrinho → pergunta → 3 favoritos → 2 no carrinho →
 *   compartilhar → 1ª compra → personalizar → 1ª avaliação → avaliação c/ foto →
 *   2ª compra → publicar → aprovar → qualityScore 80 → divulgar próprio →
 *   3 compras → 3 avaliações → qualityScore 90 → 1ª venda → 5 compras →
 *   5 avaliações → 3 publicados → 5 vendas → 10 compras → 10 avaliações →
 *   10 vendas → destaque.
 *
 * Cada missão depende de uma AÇÃO DO PRÓPRIO usuário. Nada de "ver na vitrine",
 * "abrir checkout", "receber resposta" ou "avaliação marcada como útil".
 *
 * Puro/testável. Dados ausentes do backend chegam como 0 (ver TravelerStatsInput).
 */
import type {
    TravelerStatsInput, Mission, TravelerLevel, MissionCategory,
} from './gamification.types';
import { TRAVELER_MISSION_XP as XP } from './gamificationRules';

/** Stats normalizadas: todo campo numérico vira número seguro (>= 0). */
interface NormStats {
    profileCompleted: boolean;
    savedCount: number;
    cartCount: number;
    questionsCount: number;
    sharedCount: number;
    purchasesCount: number;
    customizedPurchasedItinerariesCount: number;
    reviewsCount: number;
    reviewsWithPhotoCount: number;
    publishedItinerariesCount: number;
    approvedItinerariesCount: number;
    ownItinerarySharesCount: number;
    creatorSalesCount: number;
    featuredItinerariesCount: number;
    maxPublishedItineraryQualityScore: number;
}

const n = (v: unknown): number => {
    const x = Number(v);
    return Number.isFinite(x) && x > 0 ? Math.floor(x) : 0;
};

function normalize(s: TravelerStatsInput): NormStats {
    return {
        profileCompleted: !!s.profileCompleted,
        savedCount: n(s.savedCount),
        cartCount: n(s.cartCount),
        questionsCount: n(s.questionsCount),
        sharedCount: n(s.sharedCount),
        purchasesCount: n(s.purchasesCount),
        customizedPurchasedItinerariesCount: n(s.customizedPurchasedItinerariesCount),
        reviewsCount: n(s.reviewsCount),
        reviewsWithPhotoCount: n(s.reviewsWithPhotoCount),
        publishedItinerariesCount: n(s.publishedItinerariesCount),
        approvedItinerariesCount: n(s.approvedItinerariesCount),
        ownItinerarySharesCount: n(s.ownItinerarySharesCount),
        creatorSalesCount: n(s.creatorSalesCount),
        featuredItinerariesCount: n(s.featuredItinerariesCount),
        maxPublishedItineraryQualityScore: n(s.maxPublishedItineraryQualityScore),
    };
}

interface MissionDef {
    key: string;
    level: TravelerLevel;
    label: string;
    hint: string;
    xp: number;
    category: MissionCategory;
    /** Meta numérica (para barra/contador). Missões booleanas usam 1. */
    target?: number;
    /** Valor atual rumo à meta (booleanas: 0/1). */
    value: (s: NormStats) => number;
    /** Concluída? */
    done: (s: NormStats) => boolean;
}

/** Helper p/ missão de contagem com meta. */
const count = (
    pick: (s: NormStats) => number,
    target: number,
): Pick<MissionDef, 'target' | 'value' | 'done'> => ({
    target,
    value: (s) => Math.min(pick(s), target),
    done: (s) => pick(s) >= target,
});

/** Helper p/ missão booleana (progresso 0/1). */
const bool = (pick: (s: NormStats) => boolean): Pick<MissionDef, 'value' | 'done'> => ({
    value: (s) => (pick(s) ? 1 : 0),
    done: pick,
});

/**
 * Definições na ORDEM da jornada (order = índice + 1). Não alterar a ordem sem
 * revisar os níveis: ela espelha a progressão lógica da Etapa 5.
 */
const MISSION_DEFS: MissionDef[] = [
    // ── 1. EXPLORADOR ──
    { key: 'profile_ready', level: 'explorer', label: 'Perfil pronto para viajar', hint: 'Complete nome, foto, moeda, interesses e preferências.', xp: XP.PROFILE_READY, category: 'profile', ...bool((s) => s.profileCompleted) },
    { key: 'first_saved_itinerary', level: 'explorer', label: 'Primeiro roteiro salvo', hint: 'Salve/favorite o seu primeiro roteiro.', xp: XP.FIRST_SAVED_ITINERARY, category: 'discovery', ...bool((s) => s.savedCount >= 1) },
    { key: 'first_cart_itinerary', level: 'explorer', label: 'Primeiro roteiro no carrinho', hint: 'Adicione o primeiro roteiro ao carrinho.', xp: XP.FIRST_CART_ITINERARY, category: 'cart', ...bool((s) => s.cartCount >= 1) },
    { key: 'first_question_sent', level: 'explorer', label: 'Primeira dúvida enviada', hint: 'Faça uma pergunta sobre um roteiro.', xp: XP.FIRST_QUESTION_SENT, category: 'engagement', ...bool((s) => s.questionsCount >= 1) },

    // ── 2. VIAJANTE ATIVO ──
    { key: 'three_saved_itineraries', level: 'active_traveler', label: 'Lista de viagem criada', hint: 'Tenha 3 roteiros salvos.', xp: XP.THREE_SAVED_ITINERARIES, category: 'discovery', ...count((s) => s.savedCount, 3) },
    { key: 'two_cart_itineraries', level: 'active_traveler', label: 'Carrinho de viagem montado', hint: 'Tenha 2 roteiros no carrinho.', xp: XP.TWO_CART_ITINERARIES, category: 'cart', ...count((s) => s.cartCount, 2) },
    { key: 'first_itinerary_shared', level: 'active_traveler', label: 'Roteiro compartilhado', hint: 'Compartilhe um roteiro com alguém.', xp: XP.FIRST_ITINERARY_SHARED, category: 'engagement', ...bool((s) => s.sharedCount >= 1) },
    { key: 'first_purchase', level: 'active_traveler', label: 'Primeira compra na VAMO', hint: 'Compre o seu primeiro roteiro.', xp: XP.FIRST_PURCHASE, category: 'purchase', ...bool((s) => s.purchasesCount >= 1) },

    // ── 3. PLANEJADOR ──
    { key: 'first_purchased_itinerary_customized', level: 'planner', label: 'Roteiro personalizado', hint: 'Personalize um roteiro comprado em "Meus Roteiros".', xp: XP.FIRST_PURCHASED_ITINERARY_CUSTOMIZED, category: 'engagement', ...bool((s) => s.customizedPurchasedItinerariesCount >= 1) },
    { key: 'first_review_created', level: 'planner', label: 'Primeira avaliação publicada', hint: 'Avalie um roteiro comprado.', xp: XP.FIRST_REVIEW_CREATED, category: 'review', ...bool((s) => s.reviewsCount >= 1) },
    { key: 'first_review_with_photo', level: 'planner', label: 'Avaliação com foto', hint: 'Adicione ao menos 1 foto na avaliação de um roteiro comprado.', xp: XP.FIRST_REVIEW_WITH_PHOTO, category: 'review', ...bool((s) => s.reviewsWithPhotoCount >= 1) },
    { key: 'second_purchase', level: 'planner', label: 'Segunda compra na VAMO', hint: 'Compre o seu segundo roteiro.', xp: XP.SECOND_PURCHASE, category: 'purchase', ...count((s) => s.purchasesCount, 2) },

    // ── 4. VIAJANTE CRIADOR (key 'backpacker') ──
    { key: 'first_itinerary_published', level: 'backpacker', label: 'Primeiro roteiro publicado', hint: 'Crie e publique o seu primeiro roteiro como roteirista.', xp: XP.FIRST_ITINERARY_PUBLISHED, category: 'creator', ...bool((s) => s.publishedItinerariesCount >= 1) },
    { key: 'first_itinerary_approved', level: 'backpacker', label: 'Roteiro aprovado pela VAMO', hint: 'Tenha o primeiro roteiro aprovado na análise.', xp: XP.FIRST_ITINERARY_APPROVED, category: 'creator', ...bool((s) => s.approvedItinerariesCount >= 1) },
    { key: 'itinerary_quality_80', level: 'backpacker', label: 'Roteiro de qualidade', hint: 'Tenha um roteiro publicado com Quality Score acima de 80%.', xp: XP.ITINERARY_QUALITY_80, category: 'creator', ...bool((s) => s.maxPublishedItineraryQualityScore >= 80) },
    { key: 'own_itinerary_shared', level: 'backpacker', label: 'Roteiro enviado para divulgação', hint: 'Compartilhe o seu próprio roteiro publicado.', xp: XP.OWN_ITINERARY_SHARED, category: 'creator', ...bool((s) => s.ownItinerarySharesCount >= 1) },

    // ── 5. VIAJANTE EXPERIENTE ──
    { key: 'three_purchases', level: 'experienced', label: '3 roteiros comprados', hint: 'Compre 3 roteiros no total.', xp: XP.THREE_PURCHASES, category: 'purchase', ...count((s) => s.purchasesCount, 3) },
    { key: 'three_reviews', level: 'experienced', label: '3 avaliações publicadas', hint: 'Avalie 3 roteiros comprados.', xp: XP.THREE_REVIEWS, category: 'review', ...count((s) => s.reviewsCount, 3) },
    { key: 'itinerary_quality_90', level: 'experienced', label: 'Roteiro excelente', hint: 'Tenha um roteiro publicado com Quality Score acima de 90%.', xp: XP.ITINERARY_QUALITY_90, category: 'creator', ...bool((s) => s.maxPublishedItineraryQualityScore >= 90) },
    { key: 'first_creator_sale', level: 'experienced', label: 'Primeira venda como roteirista', hint: 'Venda o seu primeiro roteiro publicado.', xp: XP.FIRST_CREATOR_SALE, category: 'creator', ...bool((s) => s.creatorSalesCount >= 1) },

    // ── 6. DESBRAVADOR ──
    { key: 'five_purchases', level: 'pathfinder', label: '5 roteiros comprados', hint: 'Compre 5 roteiros no total.', xp: XP.FIVE_PURCHASES, category: 'purchase', ...count((s) => s.purchasesCount, 5) },
    { key: 'five_reviews', level: 'pathfinder', label: '5 avaliações publicadas', hint: 'Publique 5 avaliações de roteiros comprados.', xp: XP.FIVE_REVIEWS, category: 'review', ...count((s) => s.reviewsCount, 5) },
    { key: 'three_itineraries_published', level: 'pathfinder', label: '3 roteiros publicados', hint: 'Tenha 3 roteiros aprovados/publicados.', xp: XP.THREE_ITINERARIES_PUBLISHED, category: 'creator', ...count((s) => Math.max(s.publishedItinerariesCount, s.approvedItinerariesCount), 3) },
    { key: 'five_creator_sales', level: 'pathfinder', label: '5 vendas realizadas', hint: 'Alcance 5 vendas como roteirista.', xp: XP.FIVE_CREATOR_SALES, category: 'creator', ...count((s) => s.creatorSalesCount, 5) },

    // ── 7. EMBAIXADOR VAMO ──
    { key: 'ten_purchases', level: 'ambassador', label: '10 roteiros comprados', hint: 'Compre 10 roteiros no total.', xp: XP.TEN_PURCHASES, category: 'purchase', ...count((s) => s.purchasesCount, 10) },
    { key: 'ten_reviews', level: 'ambassador', label: '10 avaliações publicadas', hint: 'Publique 10 avaliações reais.', xp: XP.TEN_REVIEWS, category: 'review', ...count((s) => s.reviewsCount, 10) },
    { key: 'ten_creator_sales', level: 'ambassador', label: '10 vendas como roteirista', hint: 'Alcance 10 vendas de roteiros publicados.', xp: XP.TEN_CREATOR_SALES, category: 'creator', ...count((s) => s.creatorSalesCount, 10) },
    { key: 'featured_itinerary', level: 'ambassador', label: 'Roteiro em destaque', hint: 'Tenha um roteiro classificado em "Roteiros em Destaque".', xp: XP.FEATURED_ITINERARY, category: 'milestone', ...bool((s) => s.featuredItinerariesCount >= 1) },
];

/** Ordem dos níveis (espelha TRAVELER_LEVELS) — para fatiar missões. */
const LEVEL_ORDER: TravelerLevel[] = [
    'explorer', 'active_traveler', 'planner', 'backpacker',
    'experienced', 'pathfinder', 'ambassador',
];

function toMission(def: MissionDef, s: NormStats, order: number, locked = false): Mission {
    const m: Mission = {
        key: def.key,
        level: def.level,
        label: def.label,
        hint: def.hint,
        xp: def.xp,
        category: def.category,
        completed: def.done(s),
        order,
        locked,
    };
    if (typeof def.target === 'number') {
        m.target = def.target;
        m.progress = def.value(s);
    } else {
        m.target = 1;
        m.progress = def.value(s);
    }
    return m;
}

export type TravelerMissionDefinition = Pick<
    MissionDef,
    'key' | 'level' | 'label' | 'hint' | 'xp' | 'category' | 'target'
> & { order: number };

export const TRAVELER_MISSIONS_BY_LEVEL: Record<TravelerLevel, TravelerMissionDefinition[]> =
    MISSION_DEFS.reduce((acc, def, index) => {
        acc[def.level].push({
            key: def.key,
            level: def.level,
            label: def.label,
            hint: def.hint,
            xp: def.xp,
            category: def.category,
            target: def.target ?? 1,
            order: index + 1,
        });
        return acc;
    }, {
        explorer: [],
        active_traveler: [],
        planner: [],
        backpacker: [],
        experienced: [],
        pathfinder: [],
        ambassador: [],
    } as Record<TravelerLevel, TravelerMissionDefinition[]>);

/** Todas as 28 missões com completed/progress resolvidos. */
export function buildAllMissions(stats: TravelerStatsInput): Mission[] {
    const s = normalize(stats);
    return MISSION_DEFS.map((def, i) => toMission(def, s, i + 1));
}

export const buildAllTravelerMissions = buildAllMissions;

/** Soma do XP das missões concluídas (fonte do XP quando o backend não envia). */
export function xpFromMissions(stats: TravelerStatsInput): number {
    const s = normalize(stats);
    return MISSION_DEFS.reduce((sum, def) => (def.done(s) ? sum + def.xp : sum), 0);
}

/**
 * Missões VISÍVEIS no card: as do nível atual + até `previewCount` do próximo
 * nível como prévia bloqueada. Evita despejar as 28 de uma vez.
 */
export function buildVisibleMissions(
    stats: TravelerStatsInput,
    currentLevel: TravelerLevel,
    previewCount = 2,
): Mission[] {
    const s = normalize(stats);
    const idx = LEVEL_ORDER.indexOf(currentLevel);
    const levelIndex = idx >= 0 ? idx : 0;
    const nextLevel: TravelerLevel | undefined = LEVEL_ORDER[levelIndex + 1];

    const visible: Mission[] = [];
    MISSION_DEFS.forEach((def, i) => {
        if (def.level === currentLevel) {
            visible.push(toMission(def, s, i + 1, false));
        }
    });
    if (nextLevel && previewCount > 0) {
        const previews = MISSION_DEFS
            .map((def, i) => ({ def, i }))
            .filter(({ def }) => def.level === nextLevel)
            .slice(0, previewCount)
            .map(({ def, i }) => toMission(def, s, i + 1, true));
        visible.push(...previews);
    }
    return visible;
}

export function getCurrentLevelMissions(
    level: TravelerLevel,
    stats: TravelerStatsInput,
): Mission[] {
    return buildAllMissions(stats).filter((mission) => mission.level === level);
}

export function getNextLevelPreviewMissions(
    level: TravelerLevel,
    stats: TravelerStatsInput,
    previewCount = 2,
): Mission[] {
    const idx = LEVEL_ORDER.indexOf(level);
    const nextLevel = idx >= 0 ? LEVEL_ORDER[idx + 1] : undefined;
    if (!nextLevel || previewCount <= 0) return [];
    return getCurrentLevelMissions(nextLevel, stats)
        .slice(0, previewCount)
        .map((mission) => ({ ...mission, locked: true }));
}

export function getMissionProgress(
    missionKey: string,
    stats: TravelerStatsInput,
): Pick<Mission, 'key' | 'completed' | 'progress' | 'target'> | null {
    const mission = buildAllMissions(stats).find((item) => item.key === missionKey);
    if (!mission) return null;
    return {
        key: mission.key,
        completed: mission.completed,
        progress: mission.progress,
        target: mission.target,
    };
}
