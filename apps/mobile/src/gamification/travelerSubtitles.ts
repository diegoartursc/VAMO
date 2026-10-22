/**
 * Subtítulo dinâmico do card do Passaporte VAMO.
 *
 * Varia conforme o NÍVEL e a FASE do progresso dentro do nível. Os nomes das
 * fases (início / em movimento / reta / quase / máximo) são internos — o
 * usuário vê apenas o texto. Puro e testável.
 */
import type { TravelerLevel } from './gamification.types';

interface PhaseText {
    /** 0%–24% */
    start: string;
    /** 25%–59% */
    moving: string;
    /** 60%–89% */
    stretch: string;
    /** 90%–99% */
    almost: string;
    /** nível máximo (sem próximo nível) */
    max?: string;
}

const PHASE_TEXT: Record<TravelerLevel, PhaseText> = {
    explorer: {
        start: 'You\'ve started your journey on VAMO. Complete your profile, save itineraries and earn your first stamps.',
        moving: 'You\'ve taken your first steps. Keep saving itineraries and planning your next trip.',
        stretch: 'You\'re close to becoming an Active Traveler. Complete more missions to unlock the next stamp.',
        almost: 'You\'re almost an Active Traveler. One more action could take you to the next level.',
    },
    active_traveler: {
        start: 'You\'re already planning your trips better. Save experiences and start building your cart.',
        moving: 'Your travel plans are taking shape. Keep moving toward your first purchase.',
        stretch: 'You\'re close to becoming a Planner. Your first purchase is right around the corner.',
        almost: 'You\'re almost a Planner. Finish your purchase journey to level up.',
    },
    planner: {
        start: 'You already turn inspiration into real planning. Use your itineraries and start helping other travelers.',
        moving: 'Your reviews and customizations are starting to build trust in the community.',
        stretch: 'You\'re close to becoming a Creator Traveler. Keep reviewing and making the most of your itineraries.',
        almost: 'You\'re almost a Creator Traveler. One more action locks in your progress.',
    },
    // key 'backpacker' = "Viajante Criador"
    backpacker: {
        start: 'You\'ve started turning your experience into published itineraries.',
        moving: 'Your role as a creator is taking shape. Keep improving your itineraries.',
        stretch: 'You\'re close to establishing yourself as a Seasoned Traveler.',
        almost: 'You\'re almost at the next level. Keep publishing, improving and promoting your itineraries.',
    },
    experienced: {
        start: 'You\'re part of both sides of VAMO: you buy, review and publish.',
        moving: 'Your reputation as a buyer and creator is taking hold.',
        stretch: 'You\'re close to becoming a Pathfinder. Keep selling and raising the quality of your itineraries.',
        almost: 'You\'re almost a Pathfinder. Your journey is close to the next tier.',
    },
    pathfinder: {
        start: 'You\'re already a reference on VAMO. Your purchases, reviews and itineraries move the community.',
        moving: 'Your scale in the marketplace is growing in a healthy way.',
        stretch: 'You\'re close to becoming a VAMO Ambassador. Keep growing your impact.',
        almost: 'You\'re almost a VAMO Ambassador. The top of the journey is right there.',
    },
    ambassador: {
        start: 'You\'ve reached the highest status on VAMO. Your journey inspires travelers and strengthens the community.',
        moving: 'You\'ve reached the highest status on VAMO. Your journey inspires travelers and strengthens the community.',
        stretch: 'You\'ve reached the highest status on VAMO. Your journey inspires travelers and strengthens the community.',
        almost: 'You\'ve reached the highest status on VAMO. Your journey inspires travelers and strengthens the community.',
        max: 'You\'ve reached the highest status on VAMO. Keep inspiring the community — every purchase, review and itinerary leaves its mark.',
    },
};

/**
 * Retorna o subtítulo coerente com o nível e a fase do progresso.
 * @param progressPct 0..1 dentro do nível atual.
 * @param isMaxLevel true quando não há próximo nível (Embaixador).
 */
export function getTravelerLevelSubtitle(
    level: TravelerLevel,
    progressPct: number,
    isMaxLevel: boolean,
): string {
    const t = PHASE_TEXT[level] ?? PHASE_TEXT.explorer;
    if (isMaxLevel) return t.max ?? t.start;
    const pct = Number.isFinite(progressPct) ? Math.max(0, Math.min(1, progressPct)) : 0;
    if (pct >= 0.9) return t.almost;
    if (pct >= 0.6) return t.stretch;
    if (pct >= 0.25) return t.moving;
    return t.start;
}
