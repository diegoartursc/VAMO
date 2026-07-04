/**
 * Níveis do "Passaporte VAMO" (viajante). Linguagem lúdica de jornada.
 * Cores vêm do design system; ícones são emojis temáticos de viagem.
 */

import type { LevelConfig, TravelerLevel } from './gamification.types';

// Paleta base do tema (evita import circular com theme.ts).
const SECONDARY = '#1A3263';
const PRIMARY = '#28C9BF';
const PRIMARY_BG = '#E6FAF8';
const NAVY_BG = '#EEF1F8';

/** Ordem crescente — os limites de XP são acumulados (não incrementais). */
export const TRAVELER_LEVELS: LevelConfig<TravelerLevel>[] = [
    {
        level: 'explorer',
        label: 'Explorador',
        description: 'Você começou sua jornada na VAMO. Complete seu perfil, salve roteiros e dê os primeiros passos para planejar sua próxima viagem.',
        icon: '🌍',
        color: SECONDARY,
        bgColor: NAVY_BG,
        minXp: 0,
    },
    {
        level: 'active_traveler',
        label: 'Viajante Ativo',
        description: 'Você já está planejando melhor suas viagens. Continue salvando experiências, montando seu carrinho e avançando para sua primeira compra.',
        icon: '✈️',
        color: SECONDARY,
        bgColor: NAVY_BG,
        minXp: 100,
    },
    {
        level: 'planner',
        label: 'Planejador',
        description: 'Você já transforma inspiração em planejamento real. Agora sua experiência começa a ajudar outros viajantes também.',
        icon: '🗺️',
        color: SECONDARY,
        bgColor: NAVY_BG,
        minXp: 250,
    },
    {
        // Key mantida como 'backpacker' de propósito: o nível é derivado do XP e
        // não é persistido, mas manter a key evita qualquer regressão sutil.
        // O rótulo público virou "Viajante Criador".
        level: 'backpacker',
        label: 'Viajante Criador',
        description: 'Você já pode transformar sua experiência em roteiros publicados e começar a construir presença como criador.',
        icon: '🧭',
        color: PRIMARY,
        bgColor: PRIMARY_BG,
        minXp: 500,
    },
    {
        level: 'experienced',
        label: 'Viajante Experiente',
        description: 'Você já participa de verdade da VAMO: compra, avalia, publica e começa a construir reputação.',
        icon: '⭐',
        color: PRIMARY,
        bgColor: PRIMARY_BG,
        minXp: 900,
    },
    {
        level: 'pathfinder',
        label: 'Desbravador',
        description: 'Você já é uma referência dentro da VAMO. Suas compras, avaliações e roteiros ajudam a comunidade a crescer.',
        icon: '🚀',
        color: PRIMARY,
        bgColor: PRIMARY_BG,
        minXp: 1500,
    },
    {
        level: 'ambassador',
        label: 'Embaixador VAMO',
        description: 'Você alcançou um status especial na VAMO. Sua jornada inspira viajantes e fortalece a comunidade.',
        icon: '👑',
        color: PRIMARY,
        bgColor: PRIMARY_BG,
        minXp: 3000,
    },
];

export const TRAVELER_LEVELS_BY_KEY: Record<TravelerLevel, LevelConfig<TravelerLevel>> =
    TRAVELER_LEVELS.reduce((acc, cfg) => {
        acc[cfg.level] = cfg;
        return acc;
    }, {} as Record<TravelerLevel, LevelConfig<TravelerLevel>>);
