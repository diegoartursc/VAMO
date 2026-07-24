/**
 * Testes da Trilha do Roteirista (reputação real, não VerificationLevel).
 * Roda sem framework: `npx tsx --test packages/shared/gamification/creatorReputation.test.ts`
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    calculateCreatorLevel,
    confidenceRating,
    CREATOR_REPUTATION_LEVELS,
    CREATOR_REPUTATION_ORDER,
    CREATOR_REPUTATION_BY_KEY,
    type CreatorReputationStatsInput,
} from './creatorReputation';

const base: CreatorReputationStatsInput = {
    identityApproved: true,
    activeItineraries: 0,
    totalSales: 0,
    averageRating: 0,
    reviewCount: 0,
};

// ── 1. Configuração e cálculo possuem os mesmos níveis ──
test('configuração tem exatamente 5 níveis (canônico, não 6)', () => {
    assert.equal(CREATOR_REPUTATION_LEVELS.length, 5);
    assert.equal(CREATOR_REPUTATION_ORDER.length, 5);
    assert.deepEqual(CREATOR_REPUTATION_ORDER, [
        'verified_creator', 'recommended_creator', 'travel_curator', 'top_creator', 'vamo_ambassador',
    ]);
});

test('todo nível calculável existe na config (CREATOR_REPUTATION_BY_KEY)', () => {
    for (const level of CREATOR_REPUTATION_ORDER) {
        assert.ok(CREATOR_REPUTATION_BY_KEY[level], `nível ${level} sem config`);
    }
});

// ── 2. Ordem determinística ──
test('ordem dos níveis é estável e determinística', () => {
    const order1 = CREATOR_REPUTATION_LEVELS.map((c) => c.level);
    const order2 = CREATOR_REPUTATION_LEVELS.map((c) => c.level);
    assert.deepEqual(order1, order2);
});

// ── 3. Criador sem critérios fica no nível inicial ──
test('criador sem nenhuma métrica fica em verified_creator', () => {
    const result = calculateCreatorLevel(base);
    assert.equal(result.level, 'verified_creator');
    assert.equal(result.nextLevel, 'recommended_creator');
});

// ── 4. Uma única avaliação não promove indevidamente ──
test('nota 5,0 com 1 avaliação NÃO alcança "Recomendado" (piso de amostra)', () => {
    const result = calculateCreatorLevel({
        ...base, activeItineraries: 3, totalSales: 5, averageRating: 5.0, reviewCount: 1,
    });
    assert.equal(result.level, 'verified_creator');
});

test('confidenceRating: 5,0 com 1 avaliação fica bem abaixo de 4,9 com 120', () => {
    const oneReview = confidenceRating(5.0, 1);
    const manyReviews = confidenceRating(4.9, 120);
    assert.ok(oneReview < manyReviews, `esperado ${oneReview} < ${manyReviews}`);
    assert.ok(manyReviews > 4.85);
});

// ── 5. Critérios de Recomendado funcionam ──
test('3 roteiros ativos + 5 vendas + nota alta + amostra suficiente => recommended_creator', () => {
    const result = calculateCreatorLevel({
        ...base, activeItineraries: 3, totalSales: 5, averageRating: 5.0, reviewCount: 5,
    });
    assert.equal(result.level, 'recommended_creator');
});

test('quase lá (faltam vendas) continua verified_creator', () => {
    const result = calculateCreatorLevel({
        ...base, activeItineraries: 3, totalSales: 4, averageRating: 4.9, reviewCount: 5,
    });
    assert.equal(result.level, 'verified_creator');
    assert.ok(result.unmetCriteria.some((c) => c.includes('vendas')));
});

// ── 6. Critérios de Curador funcionam ──
test('10 ativos + 30 vendas + nota alta + resposta boa => travel_curator', () => {
    const result = calculateCreatorLevel({
        ...base, activeItineraries: 10, totalSales: 30, averageRating: 5.0, reviewCount: 15, responseRatePct: 80,
    });
    assert.equal(result.level, 'travel_curator');
});

test('sem taxa de resposta real (undefined) NÃO alcança curator mesmo com o resto ok', () => {
    const result = calculateCreatorLevel({
        ...base, activeItineraries: 10, totalSales: 30, averageRating: 5.0, reviewCount: 15,
    });
    assert.notEqual(result.level, 'travel_curator');
    assert.equal(result.level, 'recommended_creator');
});

// ── 7. Critérios de Top funcionam ──
test('20 ativos + 100 vendas + nota altíssima + amostra grande => top_creator', () => {
    const result = calculateCreatorLevel({
        ...base, activeItineraries: 20, totalSales: 100, averageRating: 4.95, reviewCount: 40, complaintRatePct: 2,
    });
    assert.equal(result.level, 'top_creator');
});

test('muitas vendas mas nota ruim NÃO chega em top_creator nem recommended', () => {
    // Cenário do enunciado: criador A (muitas vendas, avaliação ruim).
    const result = calculateCreatorLevel({
        ...base, activeItineraries: 20, totalSales: 500, averageRating: 3.0, reviewCount: 200,
    });
    assert.notEqual(result.level, 'top_creator');
    assert.equal(result.level, 'verified_creator');
});

// ── 8. Embaixador depende de autorização manual ──
test('manualAmbassador=true força vamo_ambassador mesmo sem nenhuma métrica', () => {
    const result = calculateCreatorLevel({ ...base, manualAmbassador: true });
    assert.equal(result.level, 'vamo_ambassador');
});

test('critérios automáticos de top_creator NÃO promovem a embaixador sozinhos', () => {
    const result = calculateCreatorLevel({
        ...base, activeItineraries: 50, totalSales: 1000, averageRating: 5.0, reviewCount: 500,
    });
    assert.notEqual(result.level, 'vamo_ambassador');
    assert.equal(result.level, 'top_creator');
});

// ── 9. Remoção de Embaixador recalcula o nível normal ──
test('manualAmbassador=false volta a calcular pelo critério automático', () => {
    const stats: CreatorReputationStatsInput = {
        ...base, activeItineraries: 3, totalSales: 5, averageRating: 5.0, reviewCount: 5, manualAmbassador: false,
    };
    const result = calculateCreatorLevel(stats);
    assert.equal(result.level, 'recommended_creator');
});

// ── 11. Nenhum nível inexistente gera fallback enganoso ──
test('resultado sempre referencia um level presente em CREATOR_REPUTATION_ORDER', () => {
    const scenarios: CreatorReputationStatsInput[] = [
        base,
        { ...base, activeItineraries: 3, totalSales: 5, averageRating: 4.6, reviewCount: 3 },
        { ...base, manualAmbassador: true },
    ];
    for (const s of scenarios) {
        const r = calculateCreatorLevel(s);
        assert.ok(CREATOR_REPUTATION_ORDER.includes(r.level));
        assert.equal(r.config.level, r.level);
    }
});

// ── Complementar: nextLevel/nextConfig consistentes ──
test('nextLevel é sempre o próximo da ordem, e null no topo (embaixador)', () => {
    const top = calculateCreatorLevel({ ...base, manualAmbassador: true });
    assert.equal(top.nextLevel, null);
    assert.equal(top.nextConfig, null);

    const recommended = calculateCreatorLevel({
        ...base, activeItineraries: 3, totalSales: 5, averageRating: 5.0, reviewCount: 5,
    });
    assert.equal(recommended.nextLevel, 'travel_curator');
});
