/**
 * Calcula o progresso do viajante no "Passaporte VAMO" a partir das stats
 * disponíveis. Prepara para dados reais; hoje deriva XP das contagens.
 */

import type {
    TravelerStatsInput,
    TravelerProgress,
    Mission,
    TravelerLevel,
    LevelConfig,
} from './gamification.types';
import { TRAVELER_LEVELS } from './travelerLevels';
import { TRAVELER_XP } from './gamificationRules';

/** Teto de saves contabilizados no XP agregado (espelha a proteção mensal). */
const SAVED_XP_CAP_COUNT = 20;

/**
 * Deriva o XP total do viajante a partir das stats agregadas. Quando o XP
 * já vier calculado (futuro backend), usa-o diretamente.
 */
export function deriveTravelerXp(stats: TravelerStatsInput): number {
    if (typeof stats.xp === 'number' && Number.isFinite(stats.xp)) {
        return Math.max(0, Math.round(stats.xp));
    }
    const saved = Math.max(0, stats.savedCount || 0);
    const cappedSaved = Math.min(saved, SAVED_XP_CAP_COUNT);
    const reviews = Math.max(0, stats.reviewsCount || 0);
    const purchases = Math.max(0, stats.purchasesCount || 0);
    const usefulReviews = Math.max(0, stats.usefulReviewsCount || 0);
    const destinations = Math.max(0, stats.destinationsCount || 0);

    let xp = 0;
    if (stats.profileCompleted) xp += TRAVELER_XP.PROFILE_COMPLETED ?? 0;
    xp += cappedSaved * (TRAVELER_XP.ITINERARY_SAVED ?? 0);
    xp += reviews * (TRAVELER_XP.REVIEW_CREATED ?? 0);
    xp += purchases * (TRAVELER_XP.ITINERARY_PURCHASED ?? 0);
    xp += usefulReviews * (TRAVELER_XP.REVIEW_MARKED_USEFUL ?? 0);
    xp += destinations * (TRAVELER_XP.WISHLIST_ADDED ?? 0);
    return xp;
}

function levelForXp(xp: number): { current: LevelConfig<TravelerLevel>; index: number } {
    let current = TRAVELER_LEVELS[0];
    let index = 0;
    for (let i = 0; i < TRAVELER_LEVELS.length; i++) {
        if (xp >= TRAVELER_LEVELS[i].minXp) {
            current = TRAVELER_LEVELS[i];
            index = i;
        }
    }
    return { current, index };
}

/**
 * Missões/carimbos do Passaporte. Linguagem de viagem; cada uma vale XP e
 * fica "carimbada" quando concluída.
 */
function buildMissions(stats: TravelerStatsInput): Mission[] {
    const saved = Math.max(0, stats.savedCount || 0);
    const reviews = Math.max(0, stats.reviewsCount || 0);
    const purchases = Math.max(0, stats.purchasesCount || 0);
    const destinations = Math.max(0, stats.destinationsCount ?? saved);

    return [
        {
            key: 'first_saved',
            label: 'Primeiro roteiro salvo',
            hint: 'Salve um roteiro que te interessou',
            xp: TRAVELER_XP.ITINERARY_SAVED ?? 10,
            completed: saved > 0,
        },
        {
            key: 'first_review',
            label: 'Primeira avaliação publicada',
            hint: 'Avalie um roteiro que você adquiriu',
            xp: TRAVELER_XP.REVIEW_CREATED ?? 80,
            completed: reviews > 0,
        },
        {
            key: 'first_acquired',
            label: 'Primeiro roteiro adquirido',
            hint: 'Adquira seu primeiro roteiro no VAMO',
            xp: TRAVELER_XP.ITINERARY_PURCHASED ?? 100,
            completed: purchases > 0,
        },
        {
            key: 'five_destinations',
            label: '5 destinos na sua lista',
            hint: 'Monte uma lista com 5 destinos salvos',
            xp: (TRAVELER_XP.WISHLIST_ADDED ?? 10) * 5,
            completed: destinations >= 5,
        },
        {
            key: 'profile_complete',
            label: 'Perfil completo',
            hint: 'Complete seus dados de viajante',
            xp: TRAVELER_XP.PROFILE_COMPLETED ?? 50,
            completed: !!stats.profileCompleted,
        },
        {
            key: 'first_purchase',
            label: 'Primeira compra no VAMO',
            hint: 'Conclua sua primeira compra',
            xp: TRAVELER_XP.ITINERARY_PURCHASED ?? 100,
            completed: purchases > 0,
        },
    ];
}

export function calculateTravelerProgress(stats: TravelerStatsInput): TravelerProgress {
    const xp = deriveTravelerXp(stats);
    const { current, index } = levelForXp(xp);
    const next = index < TRAVELER_LEVELS.length - 1 ? TRAVELER_LEVELS[index + 1] : null;

    const xpIntoLevel = xp - current.minXp;
    const xpForNextLevel = next ? next.minXp - current.minXp : null;
    const progressPct = next && xpForNextLevel && xpForNextLevel > 0
        ? Math.max(0, Math.min(1, xpIntoLevel / xpForNextLevel))
        : 1;

    const missions = buildMissions(stats);
    const completedMissions = missions.filter(m => m.completed).length;

    return {
        level: current.level,
        levelConfig: current,
        nextLevel: next ? next.level : null,
        nextLevelConfig: next,
        xp,
        xpIntoLevel,
        xpForNextLevel,
        progressPct,
        missions,
        completedMissions,
    };
}
