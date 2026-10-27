/**
 *   npx tsx --test packages/shared/itinerary/commission.test.ts
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeCommission, computeCreatorEarning, PLATFORM_COMMISSION_RATE, PLATFORM_COMMISSION_PERCENT, CREATOR_SHARE_PERCENT } from './commission';

test('comissão e ganho do roteirista somam o preço (sem perder centavo)', () => {
    for (const price of [0.99, 9.9, 13.9, 26.9, 29.9, 39.9, 100, 1234.56]) {
        const total = computeCommission(price) + computeCreatorEarning(price);
        assert.ok(Math.abs(total - price) < 0.005, `${price} → ${total}`);
    }
});

test('roteiro de 26.90 com a taxa atual', () => {
    assert.equal(computeCommission(26.9, 0.15), 4.04);
    assert.equal(computeCreatorEarning(26.9, 0.15), 22.86);
    assert.equal(computeCommission(26.9, 0.2), 5.38);
});

test('preço inválido ou grátis não gera comissão', () => {
    for (const p of [0, -5, NaN, Infinity]) {
        assert.equal(computeCommission(p), 0);
        assert.equal(computeCreatorEarning(p), 0);
    }
});

test('percentuais exibidos batem com a taxa', () => {
    assert.equal(PLATFORM_COMMISSION_PERCENT, Math.round(PLATFORM_COMMISSION_RATE * 100));
    assert.equal(PLATFORM_COMMISSION_PERCENT + CREATOR_SHARE_PERCENT, 100);
});
