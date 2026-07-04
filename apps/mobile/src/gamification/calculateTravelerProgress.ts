/**
 * Calcula o progresso do viajante no "Passaporte VAMO".
 *
 * XP = soma das missões concluídas (fonte da verdade local). Se o backend um
 * dia enviar `stats.xp`, ele tem prioridade — mas as missões continuam sendo
 * calculadas para exibição. Isso evita XP infinito por ações repetíveis: cada
 * missão pontua UMA vez (ex.: comprar 10 roteiros libera 1, 2, 3, 5 e 10 — não
 * "10 × XP de compra").
 */

import type {
    TravelerStatsInput,
    TravelerProgress,
    TravelerLevel,
    LevelConfig,
} from './gamification.types';
import { TRAVELER_LEVELS } from './travelerLevels';
import { getTravelerLevelSubtitle } from './travelerSubtitles';
import { buildVisibleMissions, xpFromMissions } from './travelerMissions';

/**
 * XP total do viajante. Prioriza `stats.xp` (backend, fonte oficial futura);
 * senão soma somente o XP das missões concluídas.
 */
export function deriveTravelerXp(stats: TravelerStatsInput): number {
    if (typeof stats.xp === 'number' && Number.isFinite(stats.xp)) {
        return Math.max(0, Math.round(stats.xp));
    }
    return xpFromMissions(stats);
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

export function calculateTravelerProgress(stats: TravelerStatsInput): TravelerProgress {
    const xp = deriveTravelerXp(stats);
    const { current, index } = levelForXp(xp);
    const next = index < TRAVELER_LEVELS.length - 1 ? TRAVELER_LEVELS[index + 1] : null;

    const xpIntoLevel = xp - current.minXp;
    const xpForNextLevel = next ? next.minXp - current.minXp : null;
    const progressPct = next && xpForNextLevel && xpForNextLevel > 0
        ? Math.max(0, Math.min(1, xpIntoLevel / xpForNextLevel))
        : 1;

    const subtitle = getTravelerLevelSubtitle(current.level, progressPct, next === null);

    // Missões visíveis: nível atual + prévia bloqueada do próximo (não as 28).
    const missions = buildVisibleMissions(stats, current.level);
    // Conta só as concluídas e DESBLOQUEADAS (prévias bloqueadas não contam).
    const completedMissions = missions.filter(m => m.completed && !m.locked).length;
    const totalCurrentLevelMissions = missions.filter(m => !m.locked).length;

    return {
        level: current.level,
        levelConfig: current,
        nextLevel: next ? next.level : null,
        nextLevelConfig: next,
        xp,
        xpIntoLevel,
        xpForNextLevel,
        progressPct,
        subtitle,
        missions,
        completedMissions,
        totalCurrentLevelMissions,
    };
}
