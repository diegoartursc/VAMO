/**
 * Testes do ranking de Destaque no backend (selectFeaturedRanked).
 * Garante PARIDADE com o mobile (mesma fórmula/desempates).
 *
 * Roda via runner nativo do Node:
 *   cd apps/backend && npx tsx --test src/utils/featuredRanking.test.ts
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { selectFeaturedRanked, calculateFeaturedRankScore } from './featuredRanking';

/** Shape mínimo do payload da API que o ranking consome. */
function makeRoute(over: Record<string, any>): any {
    return {
        id: over.id ?? Math.random().toString(36).slice(2),
        rating: 0,
        reviewCount: 0,
        salesCount: 0,
        qualityScore: 0,
        featured: false,
        ...over,
    };
}
const ids = (arr: any[]) => arr.map((it) => it.id);

test('volume vence rating puro: B(4.9,300) acima de A(5.0,10)', () => {
    const A = makeRoute({ id: 'A', rating: 5.0, reviewCount: 10, salesCount: 10 });
    const B = makeRoute({ id: 'B', rating: 4.9, reviewCount: 300, salesCount: 300 });
    assert.deepEqual(ids(selectFeaturedRanked([A, B])), ['B', 'A']);
});

test('mesmo 5.0: mais volume vence', () => {
    const A = makeRoute({ id: 'A', rating: 5.0, reviewCount: 3, salesCount: 3 });
    const B = makeRoute({ id: 'B', rating: 5.0, reviewCount: 200, salesCount: 200 });
    assert.deepEqual(ids(selectFeaturedRanked([A, B])), ['B', 'A']);
});

test('piso de reviews: 0 reviews não entra', () => {
    assert.deepEqual(
        selectFeaturedRanked([makeRoute({ id: 'x', rating: 5.0, reviewCount: 0, salesCount: 50 })]),
        [],
    );
});

test('piso de rating: < 4.5 não entra', () => {
    assert.deepEqual(
        selectFeaturedRanked([makeRoute({ id: 'x', rating: 4.4, reviewCount: 100, salesCount: 100 })]),
        [],
    );
});

test('usa salesCount do roteiro (top-level), não cai no creator quando presente', () => {
    // salesCount=0 no roteiro, mas creator tem 9999 — o ranking NÃO deve usar
    // o agregado do criador quando o top-level existe (mesmo sendo 0).
    const semVendasProprias = makeRoute({
        id: 'sem', rating: 4.6, reviewCount: 30, salesCount: 0,
        creator: { salesCount: 9999 },
    });
    const comVendasProprias = makeRoute({ id: 'com', rating: 4.6, reviewCount: 30, salesCount: 40 });
    assert.deepEqual(ids(selectFeaturedRanked([semVendasProprias, comVendasProprias])), ['com', 'sem']);
});

test('aceita averageRating como alias de rating', () => {
    const s1 = calculateFeaturedRankScore({ rating: 4.8, reviewCount: 50 });
    const s2 = calculateFeaturedRankScore({ averageRating: 4.8, reviewCount: 50 });
    assert.equal(s1, s2);
});

test('respeita o limit', () => {
    const rotas = Array.from({ length: 8 }, (_, i) =>
        makeRoute({ id: `r${i}`, rating: 4.6, reviewCount: 10 + i, salesCount: 10 + i }),
    );
    assert.equal(selectFeaturedRanked(rotas, 3).length, 3);
});
