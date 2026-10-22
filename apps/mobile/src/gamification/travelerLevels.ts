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
        label: 'Explorer',
        description: 'You\'ve started your journey on VAMO. Complete your profile, save itineraries and take your first steps toward planning your next trip.',
        icon: '🌍',
        color: SECONDARY,
        bgColor: NAVY_BG,
        minXp: 0,
    },
    {
        level: 'active_traveler',
        label: 'Active Traveler',
        description: 'You\'re already planning your trips better. Keep saving experiences, building your cart and moving toward your first purchase.',
        icon: '✈️',
        color: SECONDARY,
        bgColor: NAVY_BG,
        minXp: 100,
    },
    {
        level: 'planner',
        label: 'Planner',
        description: 'You already turn inspiration into real planning. Now your experience starts helping other travelers too.',
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
        label: 'Creator Traveler',
        description: 'You can now turn your experience into published itineraries and start building your presence as a creator.',
        icon: '🧭',
        color: PRIMARY,
        bgColor: PRIMARY_BG,
        minXp: 500,
    },
    {
        level: 'experienced',
        label: 'Seasoned Traveler',
        description: 'You\'re now a real part of VAMO: you buy, review, publish and start building a reputation.',
        icon: '⭐',
        color: PRIMARY,
        bgColor: PRIMARY_BG,
        minXp: 900,
    },
    {
        level: 'pathfinder',
        label: 'Pathfinder',
        description: 'You\'re already a reference on VAMO. Your purchases, reviews and itineraries help the community grow.',
        icon: '🚀',
        color: PRIMARY,
        bgColor: PRIMARY_BG,
        minXp: 1500,
    },
    {
        level: 'ambassador',
        label: 'VAMO Ambassador',
        description: 'You\'ve reached a special status on VAMO. Your journey inspires travelers and strengthens the community.',
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
