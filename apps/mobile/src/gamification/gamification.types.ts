/**
 * Camada de gamificação/reputação do VAMO.
 *
 * Separação conceitual proposital:
 *  - "Passaporte VAMO" → gamificação lúdica do VIAJANTE (missões, carimbos, XP).
 *  - "Trilha do Roteirista" → reputação/confiança comercial do ROTEIRISTA.
 *
 * Tudo aqui é puro (sem React/IO) para ser testável e ligar a dados reais
 * depois, mantendo fallbacks por enquanto.
 */

// ─── Viajante (Passaporte VAMO) ─────────────────────────────────
export type TravelerLevel =
    | 'explorer'
    | 'active_traveler'
    | 'planner'
    | 'backpacker'
    | 'experienced'
    | 'pathfinder'
    | 'ambassador';

// ─── Roteirista (Trilha do Roteirista) ──────────────────────────
export type CreatorReputationLevel =
    | 'verified_creator'
    | 'recommended_creator'
    | 'travel_curator'
    | 'top_creator'
    | 'vamo_ambassador';

// ─── Eventos que geram XP ───────────────────────────────────────
export type GamificationEvent =
    // Viajante
    | 'PROFILE_COMPLETED'
    | 'ITINERARY_SAVED'
    | 'ITINERARY_VIEWED'
    | 'ITINERARY_PURCHASED'
    | 'REVIEW_CREATED'
    | 'REVIEW_MARKED_USEFUL'
    | 'ITINERARY_SHARED'
    | 'WISHLIST_ADDED'
    | 'CHECKLIST_COMPLETED'
    // Roteirista
    | 'CREATOR_IDENTITY_APPROVED'
    | 'CREATOR_FIRST_ITINERARY_APPROVED'
    | 'CREATOR_ITINERARY_APPROVED'
    | 'CREATOR_FIRST_SALE'
    | 'CREATOR_SALE_CONFIRMED'
    | 'CREATOR_REVIEW_5'
    | 'CREATOR_REVIEW_4'
    | 'CREATOR_FAST_RESPONSE'
    | 'CREATOR_ROUTE_UPDATED'
    | 'CREATOR_COMPLAINT';

/** Config visual de um nível (viajante ou roteirista). */
export interface LevelConfig<L extends string> {
    level: L;
    label: string;
    description: string;
    /** Emoji/ícone temático (renderizado como texto por enquanto). */
    icon: string;
    /** Cor do texto/realce — deve vir do design system salvo badge justificado. */
    color: string;
    /** Cor de fundo suave do badge. */
    bgColor: string;
    /** XP mínimo acumulado para atingir o nível (apenas viajante). */
    minXp: number;
}

// ─── Entradas/saídas dos cálculos do viajante ───────────────────
/**
 * Stats do viajante logado que alimentam o Passaporte. TODOS os campos são
 * contagens do PRÓPRIO usuário. Campos ausentes do backend devem ser tratados
 * como 0/false pelo motor — NUNCA mockados. Ver TODOs em profile/backend.
 */
export interface TravelerStatsInput {
    profileCompleted?: boolean;
    /** Roteiros salvos/favoritados. */
    savedCount?: number;
    /** Roteiros no carrinho. */
    cartCount?: number;
    /** Perguntas que o usuário fez sobre roteiros. */
    questionsCount?: number;
    /** Vezes que o usuário compartilhou um roteiro (qualquer). */
    sharedCount?: number;
    /** Roteiros comprados. */
    purchasesCount?: number;
    /** Roteiros comprados que o usuário personalizou em "Meus Roteiros". */
    customizedPurchasedItinerariesCount?: number;
    /** Avaliações que o usuário publicou. */
    reviewsCount?: number;
    /** Avaliações publicadas que incluíram ao menos 1 foto. */
    reviewsWithPhotoCount?: number;
    /** Roteiros que o usuário publicou como criador. */
    publishedItinerariesCount?: number;
    /** Roteiros do usuário aprovados na análise. */
    approvedItinerariesCount?: number;
    /** Vezes que o usuário compartilhou um roteiro PRÓPRIO publicado. */
    ownItinerarySharesCount?: number;
    /** Vendas do usuário como criador. */
    creatorSalesCount?: number;
    /** Roteiros do usuário que entraram em "Roteiros em Destaque". */
    featuredItinerariesCount?: number;
    /** Maior qualityScore (0..100) entre os roteiros publicados do usuário. */
    maxPublishedItineraryQualityScore?: number;
    /** @deprecated mantido por compatibilidade; não gera missão. */
    usefulReviewsCount?: number;
    /** @deprecated mantido por compatibilidade; use savedCount. */
    destinationsCount?: number;
    /** XP já computado externamente (backend); se ausente, deriva das missões. */
    xp?: number;
}

/** Categoria temática da missão (para agrupar/ícones, opcional na UI). */
export type MissionCategory =
    | 'profile' | 'discovery' | 'cart' | 'engagement'
    | 'purchase' | 'review' | 'creator' | 'milestone';

export interface Mission {
    key: string;
    /** Nível ao qual a missão pertence. */
    level: TravelerLevel;
    label: string;
    hint?: string;
    xp: number;
    completed: boolean;
    /** Progresso atual rumo à meta (ex.: 2). Ausente em missões booleanas. */
    progress?: number;
    /** Meta numérica (ex.: 3). Ausente em missões booleanas. */
    target?: number;
    category?: MissionCategory;
    /** Prévia de um nível ainda não alcançado (exibição discreta). */
    locked?: boolean;
    /** Ordem global na jornada. */
    order: number;
}

export interface TravelerProgress {
    level: TravelerLevel;
    levelConfig: LevelConfig<TravelerLevel>;
    nextLevel: TravelerLevel | null;
    nextLevelConfig: LevelConfig<TravelerLevel> | null;
    xp: number;
    /** XP acumulado dentro do nível atual. */
    xpIntoLevel: number;
    /** XP necessário (a partir do nível atual) para o próximo; null no topo. */
    xpForNextLevel: number | null;
    /** Progresso 0..1 até o próximo nível (1 quando no topo). */
    progressPct: number;
    /** Subtítulo dinâmico do card conforme nível + fase do progresso. */
    subtitle: string;
    /** Missões visíveis: nível atual + prévia bloqueada do próximo. */
    missions: Mission[];
    completedMissions: number;
    /** Total de missões desbloqueadas do nível atual (sempre 4). */
    totalCurrentLevelMissions: number;
}

// ─── Entradas/saídas dos cálculos do roteirista ─────────────────
export interface CreatorStatsInput {
    identityApproved: boolean;
    approvedItineraries: number;
    averageRating: number;
    totalSales: number;
    /** 0..100 — taxa de resposta a dúvidas. */
    responseRatePct?: number;
    /** 0..100 — taxa de reclamação/reembolso (quanto menor, melhor). */
    complaintRatePct?: number;
    /** Roteiros atualizados recentemente. */
    routesUpdatedRecently?: boolean;
    /** Seleção manual da equipe VAMO (sobrepõe critérios automáticos). */
    manualAmbassador?: boolean;
}

export interface CreatorLevelResult {
    level: CreatorReputationLevel;
    config: LevelConfig<CreatorReputationLevel>;
    nextLevel: CreatorReputationLevel | null;
    nextConfig: LevelConfig<CreatorReputationLevel> | null;
    /** Critérios ainda não atingidos para o próximo nível (texto p/ UI). */
    unmetCriteria: string[];
}
