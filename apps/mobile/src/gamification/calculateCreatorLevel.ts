/**
 * Calcula o nível de reputação do roteirista a partir de critérios de
 * QUALIDADE + volume (nunca só volume). Preparado para dados reais; aceita
 * fallbacks quando alguma métrica ainda não existe.
 */

import type {
    CreatorStatsInput,
    CreatorLevelResult,
    CreatorReputationLevel,
} from './gamification.types';
import { CREATOR_REPUTATION_LEVELS, CREATOR_REPUTATION_BY_KEY } from './creatorLevels';

/** Limiares por nível (espelham os critérios conceituais do produto). */
const THRESHOLDS = {
    recommended: { itineraries: 3, rating: 4.5, sales: 5 },
    curator: { itineraries: 10, rating: 4.7, sales: 30, responseRate: 70 },
    top: { itineraries: 20, rating: 4.8, sales: 100, maxComplaint: 5 },
};

const LEVEL_ORDER: CreatorReputationLevel[] = [
    'verified_creator',
    'recommended_creator',
    'travel_curator',
    'top_creator',
    'vamo_ambassador',
];

function meetsRecommended(s: CreatorStatsInput): boolean {
    return s.approvedItineraries >= THRESHOLDS.recommended.itineraries
        && s.averageRating >= THRESHOLDS.recommended.rating
        && s.totalSales >= THRESHOLDS.recommended.sales;
}

function meetsCurator(s: CreatorStatsInput): boolean {
    return s.approvedItineraries >= THRESHOLDS.curator.itineraries
        && s.averageRating >= THRESHOLDS.curator.rating
        && s.totalSales >= THRESHOLDS.curator.sales
        && (s.responseRatePct ?? 0) >= THRESHOLDS.curator.responseRate;
}

function meetsTop(s: CreatorStatsInput): boolean {
    return s.approvedItineraries >= THRESHOLDS.top.itineraries
        && s.averageRating >= THRESHOLDS.top.rating
        && s.totalSales >= THRESHOLDS.top.sales
        && (s.complaintRatePct ?? 0) <= THRESHOLDS.top.maxComplaint;
}

/** Texto dos critérios que faltam para alcançar `target`. */
function unmetFor(target: CreatorReputationLevel, s: CreatorStatsInput): string[] {
    const out: string[] = [];
    const need = (cond: boolean, text: string) => { if (!cond) out.push(text); };

    if (target === 'recommended_creator') {
        need(s.approvedItineraries >= THRESHOLDS.recommended.itineraries, `${THRESHOLDS.recommended.itineraries} roteiros aprovados`);
        need(s.averageRating >= THRESHOLDS.recommended.rating, `média ${THRESHOLDS.recommended.rating}+`);
        need(s.totalSales >= THRESHOLDS.recommended.sales, `${THRESHOLDS.recommended.sales} vendas`);
    } else if (target === 'travel_curator') {
        need(s.approvedItineraries >= THRESHOLDS.curator.itineraries, `${THRESHOLDS.curator.itineraries} roteiros aprovados`);
        need(s.averageRating >= THRESHOLDS.curator.rating, `média ${THRESHOLDS.curator.rating}+`);
        need(s.totalSales >= THRESHOLDS.curator.sales, `${THRESHOLDS.curator.sales} vendas`);
        need((s.responseRatePct ?? 0) >= THRESHOLDS.curator.responseRate, 'boa taxa de resposta');
    } else if (target === 'top_creator') {
        need(s.approvedItineraries >= THRESHOLDS.top.itineraries, `${THRESHOLDS.top.itineraries} roteiros aprovados`);
        need(s.averageRating >= THRESHOLDS.top.rating, `média ${THRESHOLDS.top.rating}+`);
        need(s.totalSales >= THRESHOLDS.top.sales, `${THRESHOLDS.top.sales} vendas`);
        need((s.complaintRatePct ?? 0) <= THRESHOLDS.top.maxComplaint, 'baixa taxa de reclamação');
    } else if (target === 'vamo_ambassador') {
        out.push('Seleção manual da equipe VAMO');
    }
    return out;
}

export function calculateCreatorLevel(stats: CreatorStatsInput): CreatorLevelResult {
    let level: CreatorReputationLevel = 'verified_creator';

    // Embaixador é seleção manual e sobrepõe critérios automáticos.
    if (stats.manualAmbassador) {
        level = 'vamo_ambassador';
    } else if (meetsTop(stats)) {
        level = 'top_creator';
    } else if (meetsCurator(stats)) {
        level = 'travel_curator';
    } else if (meetsRecommended(stats)) {
        level = 'recommended_creator';
    } else {
        level = 'verified_creator';
    }

    const idx = LEVEL_ORDER.indexOf(level);
    const nextLevel = idx < LEVEL_ORDER.length - 1 ? LEVEL_ORDER[idx + 1] : null;

    return {
        level,
        config: CREATOR_REPUTATION_BY_KEY[level],
        nextLevel,
        nextConfig: nextLevel ? CREATOR_REPUTATION_BY_KEY[nextLevel] : null,
        unmetCriteria: nextLevel ? unmetFor(nextLevel, stats) : [],
    };
}

/** Conveniência: lista ordenada para telas explicativas. */
export const CREATOR_REPUTATION_TRAIL = CREATOR_REPUTATION_LEVELS;
