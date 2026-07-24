/**
 * Trilha do Roteirista — reputação/confiança comercial. Tom mais sério.
 *
 * A CONFIGURAÇÃO (níveis, ordem, cores, critérios) vive em
 * @vamo/shared/gamification/creatorReputation — este arquivo só re-exporta
 * pra manter os imports existentes (`../gamification`) estáveis, e mantém a
 * ponte de compatibilidade com o `VerificationLevel` técnico do backend.
 * NÃO redefinir níveis/cores/labels aqui.
 */

import {
    CREATOR_REPUTATION_LEVELS,
    CREATOR_REPUTATION_BY_KEY,
    CREATOR_REPUTATION_ORDER,
    type CreatorReputationLevel,
    type CreatorReputationLevelConfig,
} from '@vamo/shared';
import type { VerificationLevel } from '../types/creator';

export {
    CREATOR_REPUTATION_LEVELS,
    CREATOR_REPUTATION_BY_KEY,
    CREATOR_REPUTATION_ORDER,
};

/**
 * Ponte de compatibilidade: o backend ainda entrega o `VerificationLevel`
 * técnico (4 valores) em superfícies que não passaram pelo cálculo real
 * (`calculateCreatorLevel`). Mapeamos para a camada semântica de reputação
 * SÓ como fallback — sempre que houver métricas reais disponíveis, prefira
 * `calculateCreatorLevel(stats).level`, que é a fonte de verdade real.
 * Obs.: 'top_creator' não tem equivalente técnico antigo — só é atingido
 * pelo cálculo por critérios.
 */
export const VERIFICATION_TO_REPUTATION: Record<VerificationLevel, CreatorReputationLevel> = {
    basic: 'verified_creator',
    trusted: 'recommended_creator',
    expert: 'travel_curator',
    ambassador: 'vamo_ambassador',
};

export function reputationFromVerificationLevel(
    level: VerificationLevel | null | undefined,
): CreatorReputationLevelConfig {
    const key = level ? VERIFICATION_TO_REPUTATION[level] : 'verified_creator';
    return CREATOR_REPUTATION_BY_KEY[key] ?? CREATOR_REPUTATION_BY_KEY.verified_creator;
}
