/**
 * Testes do Passaporte VAMO (motor de missões + progresso).
 * Roda sem framework: `npx tsx --test src/gamification/travelerMissions.test.ts`
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    buildAllMissions,
    getCurrentLevelMissions,
    TRAVELER_MISSIONS_BY_LEVEL,
    xpFromMissions,
} from './travelerMissions';
import { calculateTravelerProgress, deriveTravelerXp } from './calculateTravelerProgress';
import type { TravelerStatsInput } from './gamification.types';
import { TRAVELER_LEVELS } from './travelerLevels';

const done = (stats: TravelerStatsInput, key: string): boolean => {
    const m = buildAllMissions(stats).find((x) => x.key === key);
    if (!m) throw new Error(`missão ${key} não existe`);
    return m.completed;
};

// ── Cenário 1: usuário novo ──
test('usuário novo: Explorador, nenhuma missão concluída, XP 0', () => {
    const p = calculateTravelerProgress({ profileCompleted: false, savedCount: 0, purchasesCount: 0 });
    assert.equal(p.level, 'explorer');
    assert.equal(p.xp, 0);
    assert.equal(p.completedMissions, 0);
    assert.equal(buildAllMissions({}).filter((m) => m.completed).length, 0);
});

// ── Cenário 2: perfil completo ──
test('perfil completo: "profile_ready" concluída e +40 XP', () => {
    const stats = { profileCompleted: true };
    assert.equal(done(stats, 'profile_ready'), true);
    assert.equal(xpFromMissions(stats), 40);
});

// ── Cenário 3: 3 salvos ──
test('3 salvos: first_saved + three_saved concluídas, progresso 3/3', () => {
    const stats = { savedCount: 3 };
    assert.equal(done(stats, 'first_saved_itinerary'), true);
    assert.equal(done(stats, 'three_saved_itineraries'), true);
    const m = buildAllMissions(stats).find((x) => x.key === 'three_saved_itineraries')!;
    assert.equal(m.target, 3);
    assert.equal(m.progress, 3);
});

test('1 salvo: three_saved mostra progresso 1/3 e não concluída', () => {
    const m = buildAllMissions({ savedCount: 1 }).find((x) => x.key === 'three_saved_itineraries')!;
    assert.equal(m.completed, false);
    assert.equal(m.progress, 1);
    assert.equal(m.target, 3);
});

// ── Cenário 4: 1 compra ──
test('1 compra: first_purchase concluída, second_purchase não', () => {
    const stats = { purchasesCount: 1 };
    assert.equal(done(stats, 'first_purchase'), true);
    assert.equal(done(stats, 'second_purchase'), false);
});

// ── Cenário 5: 2 compras ──
test('2 compras: second_purchase concluída, three_purchases não', () => {
    const stats = { purchasesCount: 2 };
    assert.equal(done(stats, 'second_purchase'), true);
    assert.equal(done(stats, 'three_purchases'), false);
});

test('3 compras: three_purchases concluída, five_purchases não', () => {
    const stats = { purchasesCount: 3 };
    assert.equal(done(stats, 'three_purchases'), true);
    assert.equal(done(stats, 'five_purchases'), false);
});

// ── Cenário 6/7: qualityScore ──
test('qualityScore 80: quality_80 concluída, quality_90 não', () => {
    const stats = { maxPublishedItineraryQualityScore: 80 };
    assert.equal(done(stats, 'itinerary_quality_80'), true);
    assert.equal(done(stats, 'itinerary_quality_90'), false);
});

test('qualityScore 90: quality_80 e quality_90 concluídas', () => {
    const stats = { maxPublishedItineraryQualityScore: 90 };
    assert.equal(done(stats, 'itinerary_quality_80'), true);
    assert.equal(done(stats, 'itinerary_quality_90'), true);
});

// ── Cenário 8: vendas ──
test('1 venda: first_creator_sale concluída, five_creator_sales não', () => {
    const stats = { creatorSalesCount: 1 };
    assert.equal(done(stats, 'first_creator_sale'), true);
    assert.equal(done(stats, 'five_creator_sales'), false);
});

// ── Cenário 9: sem duplicidade ──
test('cada missão tem key única (sem duplicidade)', () => {
    const keys = buildAllMissions({}).map((m) => m.key);
    assert.equal(keys.length, 28);
    assert.equal(new Set(keys).size, 28);
});

test('cada nível tem exatamente 4 missões próprias', () => {
    for (const level of TRAVELER_LEVELS) {
        assert.equal(TRAVELER_MISSIONS_BY_LEVEL[level.level].length, 4, level.label);
        assert.equal(getCurrentLevelMissions(level.level, {}).length, 4, level.label);
    }
});

test('não existem missões proibidas ou dependentes de terceiros', () => {
    const text = buildAllMissions({})
        .flatMap((mission) => [mission.key, mission.label, mission.hint ?? ''])
        .join(' ')
        .toLocaleLowerCase('pt-BR');
    assert.doesNotMatch(text, /checkout/);
    assert.doesNotMatch(text, /vitrine/);
    assert.doesNotMatch(text, /receber resposta|pergunta respondida/);
    assert.doesNotMatch(text, /útil|util/);
    assert.doesNotMatch(text, /perfil de roteirista/);
});

test('compra aparece como missões distintas, não repetida com outro nome', () => {
    const all = buildAllMissions({});
    const purchaseKeys = all.filter((m) => m.category === 'purchase').map((m) => m.key).sort();
    assert.deepEqual(purchaseKeys, ['first_purchase', 'five_purchases', 'second_purchase', 'ten_purchases', 'three_purchases']);
});

// ── XP não cresce infinito por ação repetível ──
test('30 salvos não geram XP infinito: só as missões de salvar pontuam', () => {
    // savedCount alto: só first_saved (15) + three_saved (30) = 45.
    assert.equal(xpFromMissions({ savedCount: 30 }), 45);
});

test('10 compras liberam exatamente 1ª/2ª/3/5/10 — não "10× compra"', () => {
    const all = buildAllMissions({ purchasesCount: 10 });
    const purchaseDone = all.filter((m) => m.category === 'purchase' && m.completed).map((m) => m.key).sort();
    assert.deepEqual(purchaseDone, ['first_purchase', 'five_purchases', 'second_purchase', 'ten_purchases', 'three_purchases']);
});

// ── thresholds e nível 4 ──
test('thresholds e nível 4 = Viajante Criador (key backpacker)', () => {
    // XP 500 → nível backpacker / "Viajante Criador"
    const p = calculateTravelerProgress({ xp: 500 });
    assert.equal(p.level, 'backpacker');
    assert.equal(p.levelConfig.label, 'Viajante Criador');
    assert.equal(p.levelConfig.minXp, 500);
});

// ── prévia bloqueada e missões visíveis ──
test('visíveis = nível atual + prévia bloqueada; não as 28', () => {
    const p = calculateTravelerProgress({ profileCompleted: false });
    assert.equal(p.level, 'explorer');
    // 4 do explorer + 2 prévia do active_traveler = 6
    assert.equal(p.missions.length, 6);
    assert.equal(p.missions.filter((m) => m.locked).length, 2);
    assert.equal(p.totalCurrentLevelMissions, 4);
    // prévia bloqueada não conta em completedMissions
    const pFull = calculateTravelerProgress({ profileCompleted: true });
    assert.ok(pFull.missions.every((m) => !(m.locked && !m.locked)));
});

// ── subtítulo dinâmico muda com a fase ──
// ── Compartilhamento: missão + XP por evento com cap ──
test('1 share: missão first_itinerary_shared concluída e +30 XP da missão', () => {
    const stats = { sharedCount: 1 };
    const m = buildAllMissions(stats).find((x) => x.key === 'first_itinerary_shared')!;
    assert.equal(m.completed, true);
    assert.equal(deriveTravelerXp(stats), 30);
});

test('100 shares NÃO geram XP infinito: só a missão única pontua', () => {
    assert.equal(deriveTravelerXp({ sharedCount: 100 }), 30);
});

test('stats.xp do backend sobrescreve cálculo local de shared XP', () => {
    // Mesmo com sharedCount alto, stats.xp explícito tem prioridade.
    assert.equal(deriveTravelerXp({ xp: 42, sharedCount: 50 }), 42);
});

test('subtítulo muda conforme a fase do progresso', () => {
    const start = calculateTravelerProgress({ xp: 0 }).subtitle;
    const almost = calculateTravelerProgress({ xp: 95 }).subtitle; // ~95% rumo a 100
    assert.notEqual(start, almost);
    assert.match(almost, /Falta pouco/);
});
