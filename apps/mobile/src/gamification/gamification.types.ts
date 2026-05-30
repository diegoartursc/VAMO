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
export interface TravelerStatsInput {
    profileCompleted: boolean;
    savedCount: number;
    reviewsCount: number;
    purchasesCount: number;
    usefulReviewsCount?: number;
    destinationsCount?: number;
    /** XP já computado externamente; se ausente, é derivado das stats. */
    xp?: number;
}

export interface Mission {
    key: string;
    label: string;
    hint?: string;
    xp: number;
    completed: boolean;
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
    missions: Mission[];
    completedMissions: number;
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
