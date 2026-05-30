/**
 * Trilha do Roteirista — reputação/confiança comercial. Tom mais sério.
 * Linguagem de confiança ("histórico positivo", "identidade confirmada"),
 * nunca de garantia/promessa absoluta.
 */

import type {
    LevelConfig,
    CreatorReputationLevel,
} from './gamification.types';
import type { VerificationLevel } from '../types/creator';

// Paleta alinhada ao tema (badges com tons justificados por tier).
const SECONDARY = '#1A3263';
const PRIMARY = '#28C9BF';
const DEEP_TEAL = '#0E7C74';
const GOLD = '#B8860B';
const NAVY_BG = '#EEF1F8';
const TEAL_BG = '#E6FAF8';
const GOLD_BG = '#FBF4E1';

/** Ordem crescente de reputação. `minXp` não é usado aqui (cálculo por critérios). */
export const CREATOR_REPUTATION_LEVELS: LevelConfig<CreatorReputationLevel>[] = [
    {
        level: 'verified_creator',
        label: 'Roteirista Verificado',
        description: 'Identidade confirmada e perfil aprovado.',
        icon: '🛡️',
        color: SECONDARY,
        bgColor: NAVY_BG,
        minXp: 0,
    },
    {
        level: 'recommended_creator',
        label: 'Roteirista Recomendado',
        description: 'Bons roteiros, avaliações positivas e histórico consistente.',
        icon: '⭐',
        color: GOLD,
        bgColor: GOLD_BG,
        minXp: 0,
    },
    {
        level: 'travel_curator',
        label: 'Curador de Viagens',
        description: 'Roteiros consistentes, bem avaliados e úteis para planejar melhor.',
        icon: '🧭',
        color: DEEP_TEAL,
        bgColor: TEAL_BG,
        minXp: 0,
    },
    {
        level: 'top_creator',
        label: 'Top Roteirista',
        description: 'Alto desempenho, muitas vendas e excelente reputação.',
        icon: '🏆',
        color: GOLD,
        bgColor: GOLD_BG,
        minXp: 0,
    },
    {
        level: 'vamo_ambassador',
        label: 'Embaixador VAMO',
        description: 'Selecionado pela equipe VAMO como referência da comunidade.',
        icon: '💎',
        color: PRIMARY,
        bgColor: TEAL_BG,
        minXp: 0,
    },
];

export const CREATOR_REPUTATION_BY_KEY: Record<CreatorReputationLevel, LevelConfig<CreatorReputationLevel>> =
    CREATOR_REPUTATION_LEVELS.reduce((acc, cfg) => {
        acc[cfg.level] = cfg;
        return acc;
    }, {} as Record<CreatorReputationLevel, LevelConfig<CreatorReputationLevel>>);

/**
 * Ponte de compatibilidade: o backend ainda entrega o `VerificationLevel`
 * técnico (4 valores). Mapeamos para a camada semântica de reputação.
 * Obs.: 'top_creator' não tem equivalente técnico antigo — só é atingido
 * pelo cálculo por critérios (calculateCreatorLevel).
 */
export const VERIFICATION_TO_REPUTATION: Record<VerificationLevel, CreatorReputationLevel> = {
    basic: 'verified_creator',
    trusted: 'recommended_creator',
    expert: 'travel_curator',
    ambassador: 'vamo_ambassador',
};

export function reputationFromVerificationLevel(
    level: VerificationLevel | null | undefined,
): LevelConfig<CreatorReputationLevel> {
    const key = level ? VERIFICATION_TO_REPUTATION[level] : 'verified_creator';
    return CREATOR_REPUTATION_BY_KEY[key] ?? CREATOR_REPUTATION_BY_KEY.verified_creator;
}
