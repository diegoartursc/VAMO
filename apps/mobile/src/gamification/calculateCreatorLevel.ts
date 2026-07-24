/**
 * Cálculo do nível de reputação do roteirista — reexporta a implementação
 * canônica de @vamo/shared/gamification/creatorReputation. Backend e mobile
 * usam a MESMA função sobre a MESMA config; não duplicar a fórmula aqui.
 */

export { calculateCreatorLevel, confidenceRating, CREATOR_REPUTATION_LEVELS as CREATOR_REPUTATION_TRAIL } from '@vamo/shared';
