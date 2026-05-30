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
        description: 'Bem-vindo a bordo! Sua jornada está começando.',
        icon: '🌍',
        color: SECONDARY,
        bgColor: NAVY_BG,
        minXp: 0,
    },
    {
        level: 'active_traveler',
        label: 'Viajante Ativo',
        description: 'Você já está explorando roteiros e deixando sua marca.',
        icon: '✈️',
        color: SECONDARY,
        bgColor: NAVY_BG,
        minXp: 100,
    },
    {
        level: 'planner',
        label: 'Planejador',
        description: 'Começou a transformar sonhos em planos de viagem.',
        icon: '🗺️',
        color: SECONDARY,
        bgColor: NAVY_BG,
        minXp: 250,
    },
    {
        level: 'backpacker',
        label: 'Mochileiro VAMO',
        description: 'Já adquiriu roteiros e avalia o que viveu.',
        icon: '🎒',
        color: PRIMARY,
        bgColor: PRIMARY_BG,
        minXp: 500,
    },
    {
        level: 'experienced',
        label: 'Viajante Experiente',
        description: 'Avaliações úteis e vários destinos na bagagem.',
        icon: '⭐',
        color: PRIMARY,
        bgColor: PRIMARY_BG,
        minXp: 900,
    },
    {
        level: 'pathfinder',
        label: 'Desbravador',
        description: 'Engajamento alto — referência para outros viajantes.',
        icon: '🚀',
        color: PRIMARY,
        bgColor: PRIMARY_BG,
        minXp: 1500,
    },
    {
        level: 'ambassador',
        label: 'Embaixador VAMO',
        description: 'Status especial reconhecido pela comunidade VAMO.',
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
