/**
 * Testes do ranking de "Criadores recomendados" (GET /api/creators/recommended).
 * Roda sem framework: `npx tsx --test src/utils/creatorRecommendation.test.ts`
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    buildRecommendationCandidate,
    rankRecommendationCandidates,
    classifyRecommendationResult,
    type RecommendationCreatorInput,
    type RecommendationContext,
} from './creatorRecommendation';

const noContext: RecommendationContext = {
    wantedDestination: '', wantedCountry: '', wantedCategories: [], wantedStyles: [],
};

function itinerary(overrides: Partial<{
    id: string; title: string; status: string; destination: string; country: string;
    categories: string[]; travelStyles: string[]; qualityScore: number;
    reviews: { rating: number }[]; sales: number; coverImage: string | null;
}> = {}) {
    return {
        id: overrides.id ?? 'it1',
        title: overrides.title ?? 'Roteiro de teste',
        status: overrides.status ?? 'ACTIVE',
        destination: overrides.destination ?? 'Tóquio',
        country: overrides.country ?? 'Japão',
        categories: overrides.categories ?? ['cultura'],
        travelStyles: overrides.travelStyles ?? ['aventura'],
        qualityScore: overrides.qualityScore ?? 80,
        reviews: overrides.reviews ?? [],
        _count: { sales: overrides.sales ?? 0 },
        coverImage: overrides.coverImage === undefined ? 'https://example.com/cover.jpg' : overrides.coverImage,
    };
}

function creator(overrides: Partial<RecommendationCreatorInput> & { id: string }): RecommendationCreatorInput {
    return {
        verificationLevel: 'BASIC',
        traveler: { name: 'Criador', avatar: null, coverUrl: null },
        itineraries: [],
        ...overrides,
    };
}

// ── 1. Muitas vendas + avaliação ruim não fica no topo ──
test('criador com 500 vendas e nota 3.0 fica ATRÁS de um com evidência de qualidade', () => {
    const badButPopular = creator({
        id: 'popular-ruim',
        itineraries: [itinerary({ id: 'a', sales: 500, reviews: Array(200).fill({ rating: 3.0 }) })],
    });
    const goodEvidence = creator({
        id: 'bom-comprovado',
        itineraries: [
            itinerary({ id: 'b1', sales: 50, reviews: Array(30).fill({ rating: 4.9 }) }),
            itinerary({ id: 'b2', sales: 0, reviews: [] }),
            itinerary({ id: 'b3', sales: 0, reviews: [] }),
        ],
    });
    const badCandidate = buildRecommendationCandidate(badButPopular, noContext);
    const goodCandidate = buildRecommendationCandidate(goodEvidence, noContext);

    // O de nota ruim nem deveria ser elegível (não bate o piso de reputação).
    assert.equal(badCandidate.eligible, false);
    assert.equal(goodCandidate.eligible, true);
});

// ── 2. 5,0 com 1 avaliação não supera 4,9 com muitas ──
test('5,0 com 1 avaliação não supera 4,9 com 120 avaliações no score', () => {
    const oneReview = creator({
        id: 'uma-avaliacao',
        itineraries: [itinerary({ id: 'a', sales: 10, reviews: [{ rating: 5.0 }] })],
    });
    const manyReviews = creator({
        id: 'muitas-avaliacoes',
        itineraries: [itinerary({ id: 'b', sales: 10, reviews: Array(120).fill({ rating: 4.9 }) })],
    });
    const c1 = buildRecommendationCandidate(oneReview, noContext);
    const c2 = buildRecommendationCandidate(manyReviews, noContext);
    assert.ok(c2.finalScore > c1.finalScore, `esperado ${c2.finalScore} > ${c1.finalScore}`);
});

// ── 3. Sem roteiro ativo não aparece ──
test('criador sem nenhum roteiro ACTIVE nunca é elegível, mesmo com histórico', () => {
    const noActive = creator({
        id: 'sem-ativo',
        itineraries: [
            itinerary({ id: 'a', status: 'ARCHIVED', sales: 200, reviews: Array(50).fill({ rating: 4.9 }) }),
        ],
    });
    const candidate = buildRecommendationCandidate(noActive, noContext);
    assert.equal(candidate.eligible, false);
});

// ── 4. Só rascunhos não aparece ──
test('criador só com DRAFT não é elegível', () => {
    const onlyDraft = creator({
        id: 'so-rascunho',
        itineraries: [itinerary({ id: 'a', status: 'DRAFT' })],
    });
    const candidate = buildRecommendationCandidate(onlyDraft, noContext);
    assert.equal(candidate.eligible, false);
});

// ── 5. Bônus contextual ──
test('criador com roteiro ativo no destino pesquisado recebe bônus contextual', () => {
    const c = creator({
        id: 'especialista-toquio',
        itineraries: [itinerary({ id: 'a', destination: 'Tóquio', sales: 10, reviews: Array(10).fill({ rating: 4.8 }) })],
    });
    const withoutContext = buildRecommendationCandidate(c, noContext);
    const withContext = buildRecommendationCandidate(c, { ...noContext, wantedDestination: 'tóquio' });
    assert.equal(withContext.contextualMatch, true);
    assert.ok(withContext.finalScore > withoutContext.finalScore);
});

// ── 6. Bônus contextual não supera critérios mínimos ──
test('bônus contextual não torna elegível quem não bate o piso de reputação', () => {
    const weakButMatching = creator({
        id: 'fraco-mas-no-destino',
        itineraries: [itinerary({ id: 'a', destination: 'Tóquio', sales: 0, reviews: [] })],
    });
    const candidate = buildRecommendationCandidate(weakButMatching, { ...noContext, wantedDestination: 'tóquio' });
    assert.equal(candidate.contextualMatch, true);
    assert.equal(candidate.eligible, false); // contexto nunca dispensa elegibilidade
});

// ── 7. Nenhum elegível => lista vazia (seção oculta no cliente) ──
test('sem nenhum candidato elegível, rankRecommendationCandidates retorna []', () => {
    const c = creator({ id: 'novo', itineraries: [itinerary({ id: 'a', sales: 0, reviews: [] })] });
    const candidate = buildRecommendationCandidate(c, noContext);
    const ranked = rankRecommendationCandidates([candidate].filter((x) => x.eligible), 4);
    assert.deepEqual(ranked, []);
});

// ── 8. Limite solicitado é respeitado ──
test('rankRecommendationCandidates respeita o limit', () => {
    const candidates = Array.from({ length: 10 }, (_, i) => {
        const c = creator({
            id: `c${i}`,
            itineraries: [
                itinerary({ id: `it${i}a`, sales: 20 + i, reviews: Array(10).fill({ rating: 4.9 }) }),
                itinerary({ id: `it${i}b`, sales: 0, reviews: [] }),
                itinerary({ id: `it${i}c`, sales: 0, reviews: [] }),
            ],
        });
        return buildRecommendationCandidate(c, noContext);
    }).filter((c) => c.eligible);
    assert.equal(candidates.length, 10, 'setup: todos deveriam ser elegíveis');
    const ranked = rankRecommendationCandidates(candidates, 4);
    assert.equal(ranked.length, 4);
});

// ── 9. Vendas reais são usadas (não Creator.totalSales cacheado) ──
test('totalSales vem da soma de _count.sales dos roteiros, não de um campo externo', () => {
    const c = creator({
        id: 'vendas-reais',
        itineraries: [
            itinerary({ id: 'a', sales: 7, reviews: Array(5).fill({ rating: 4.8 }) }),
            itinerary({ id: 'b', sales: 3, reviews: [] }),
        ],
    });
    const candidate = buildRecommendationCandidate(c, noContext);
    assert.equal(candidate.stats.totalSales, 10);
    assert.equal(candidate.payload.stats.totalSales, 10);
});

test('vendas de roteiro ARCHIVED continuam contando no histórico comercial', () => {
    const c = creator({
        id: 'vendas-historicas',
        itineraries: [
            itinerary({ id: 'a', status: 'ACTIVE', sales: 5, reviews: Array(5).fill({ rating: 4.8 }) }),
            itinerary({ id: 'b', status: 'ARCHIVED', sales: 20, reviews: [] }),
        ],
    });
    const candidate = buildRecommendationCandidate(c, noContext);
    assert.equal(candidate.stats.totalSales, 25);
    // Mas só 1 roteiro ACTIVE conta na vitrine.
    assert.equal(candidate.payload.stats.activeItineraries, 1);
});

// ── 10. Ranking determinístico em empates ──
test('empate exato de score é resolvido por vendas, depois reviews, depois id (determinístico)', () => {
    const a = creator({
        id: 'b-empate',
        itineraries: [itinerary({ id: '1', sales: 10, reviews: Array(10).fill({ rating: 4.9 }) })],
    });
    const b = creator({
        id: 'a-empate',
        itineraries: [itinerary({ id: '2', sales: 10, reviews: Array(10).fill({ rating: 4.9 }) })],
    });
    const candidateA = buildRecommendationCandidate(a, noContext);
    const candidateB = buildRecommendationCandidate(b, noContext);
    // Mesmo score e mesmas vendas/reviews — desempate final por id (ordem alfabética).
    const ranked1 = rankRecommendationCandidates([candidateA, candidateB], 2);
    const ranked2 = rankRecommendationCandidates([candidateA, candidateB], 2);
    assert.deepEqual(ranked1.map((c) => c.id), ranked2.map((c) => c.id));
    assert.deepEqual(ranked1.map((c) => c.id), ['a-empate', 'b-empate']);
});

// ── Extra: razão visual nunca tem mais de 3 evidências ──
test('reason nunca lista mais de 3 evidências', () => {
    const c = creator({
        id: 'muitas-evidencias',
        verificationLevel: 'AMBASSADOR',
        itineraries: [itinerary({
            id: 'a', destination: 'Tóquio', sales: 500,
            reviews: Array(200).fill({ rating: 4.9 }),
        })],
    });
    const candidate = buildRecommendationCandidate(c, { ...noContext, wantedDestination: 'tóquio' });
    const evidenceCount = candidate.payload.recommendation.reason.split(' · ').length;
    assert.ok(evidenceCount <= 3, `esperado <= 3, veio ${evidenceCount}: "${candidate.payload.recommendation.reason}"`);
});

// ── primaryReason / secondaryReason ──
test('primaryReason sempre presente quando elegível; secondaryReason só quando há 2ª evidência real', () => {
    const strong = creator({
        id: 'forte',
        itineraries: [
            itinerary({ id: 'a', destination: 'Tóquio', sales: 150, reviews: Array(20).fill({ rating: 4.9 }) }),
            itinerary({ id: 'b', sales: 0, reviews: [] }),
            itinerary({ id: 'c', sales: 0, reviews: [] }),
        ],
    });
    const candidate = buildRecommendationCandidate(strong, { ...noContext, wantedDestination: 'tóquio' });
    assert.equal(candidate.eligible, true);
    assert.ok(candidate.payload.recommendation.primaryReason.length > 0);
    assert.equal(candidate.payload.recommendation.primaryReason, 'Especialista em Tóquio');
    assert.equal(candidate.payload.recommendation.secondaryReason, 'Muito bem avaliado');
});

test('sem evidências fortes, primaryReason cai pro criteriaSummary do nível (nunca vazio)', () => {
    const barelyEligible = creator({
        id: 'raspando',
        itineraries: [
            itinerary({ id: 'a', sales: 5, reviews: Array(8).fill({ rating: 4.8 }) }),
            itinerary({ id: 'b', sales: 0, reviews: [] }),
            itinerary({ id: 'c', sales: 0, reviews: [] }),
        ],
    });
    const candidate = buildRecommendationCandidate(barelyEligible, noContext);
    assert.equal(candidate.eligible, true);
    assert.ok(candidate.payload.recommendation.primaryReason.length > 0);
});

// ── topItineraries (miniaturas) ──
test('topItineraries só inclui roteiros ACTIVE com imagem real, no máximo 3', () => {
    const c = creator({
        id: 'com-fotos',
        itineraries: [
            itinerary({ id: 'a', sales: 10, reviews: Array(5).fill({ rating: 4.8 }), coverImage: 'https://x/a.jpg' }),
            itinerary({ id: 'b', sales: 0, reviews: [], coverImage: null }),
            itinerary({ id: 'c', status: 'ARCHIVED', coverImage: 'https://x/c.jpg' }),
            itinerary({ id: 'd', sales: 0, reviews: [], coverImage: 'https://x/d.jpg' }),
            itinerary({ id: 'e', sales: 0, reviews: [], coverImage: 'https://x/e.jpg' }),
        ],
    });
    const candidate = buildRecommendationCandidate(c, noContext);
    assert.ok(candidate.payload.topItineraries.length <= 3);
    // 'b' (sem imagem) e 'c' (arquivado) nunca aparecem.
    assert.ok(!candidate.payload.topItineraries.some((t) => t.id === 'b' || t.id === 'c'));
    assert.ok(candidate.payload.topItineraries.every((t) => !!t.image));
});

// ── classifyRecommendationResult ──
test('classifyRecommendationResult: contextual quando há filtro E algum match real', () => {
    const c = creator({
        id: 'match',
        itineraries: [itinerary({ id: 'a', destination: 'Tóquio', sales: 20, reviews: Array(10).fill({ rating: 4.9 }) })],
    });
    const candidate = buildRecommendationCandidate(c, { ...noContext, wantedDestination: 'tóquio' });
    const ranked = rankRecommendationCandidates([candidate], 4);
    assert.equal(classifyRecommendationResult(ranked, true), 'contextual');
});

test('classifyRecommendationResult: global_fallback quando há filtro mas nenhum match real', () => {
    const c = creator({
        id: 'sem-match',
        itineraries: [itinerary({ id: 'a', destination: 'Paris', sales: 20, reviews: Array(10).fill({ rating: 4.9 }) })],
    });
    const candidate = buildRecommendationCandidate(c, { ...noContext, wantedDestination: 'tóquio' });
    const ranked = rankRecommendationCandidates([candidate], 4);
    assert.equal(classifyRecommendationResult(ranked, true), 'global_fallback');
});

test('classifyRecommendationResult: global_fallback quando não havia filtro nenhum', () => {
    const c = creator({
        id: 'sem-filtro',
        itineraries: [itinerary({ id: 'a', sales: 20, reviews: Array(10).fill({ rating: 4.9 }) })],
    });
    const candidate = buildRecommendationCandidate(c, noContext);
    const ranked = rankRecommendationCandidates([candidate], 4);
    assert.equal(classifyRecommendationResult(ranked, false), 'global_fallback');
});
