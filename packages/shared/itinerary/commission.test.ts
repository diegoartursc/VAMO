/**
 *   npx tsx --test packages/shared/itinerary/commission.test.ts
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MIN_ITINERARY_PRICE, minItineraryPriceIn, minPriceIssue, splitPrice, computeCommission, computeCreatorEarning, PLATFORM_COMMISSION_RATE, PLATFORM_COMMISSION_PERCENT, CREATOR_SHARE_PERCENT } from './commission';

test('comissão e ganho do roteirista somam o preço (sem perder centavo)', () => {
    for (const price of [0.99, 9.9, 13.9, 26.9, 29.9, 39.9, 100, 1234.56]) {
        const total = computeCommission(price) + computeCreatorEarning(price);
        assert.ok(Math.abs(total - price) < 0.005, `${price} → ${total}`);
    }
});

test('roteiro de 26.90 com a taxa atual (20% VAMO / 80% roteirista)', () => {
    assert.equal(PLATFORM_COMMISSION_PERCENT, 20);
    assert.equal(CREATOR_SHARE_PERCENT, 80);
    assert.equal(computeCommission(26.9), 5.38);
    assert.equal(computeCreatorEarning(26.9), 21.52);
    assert.equal(computeCommission(26.9, 0.15), 4.04);
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

test('splitPrice: o comprador paga o preço do roteirista; ele recebe 80% e a VAMO 20%', () => {
    assert.deepEqual(splitPrice(10), { price: 10, creatorEarning: 8, commission: 2 });
    assert.deepEqual(splitPrice(26.9), { price: 26.9, creatorEarning: 21.52, commission: 5.38 });
    assert.deepEqual(splitPrice(0), { price: 0, creatorEarning: 0, commission: 0 });
    assert.deepEqual(splitPrice(NaN), { price: 0, creatorEarning: 0, commission: 0 });
});

test('preço mínimo: US$ 5 na moeda-base; abaixo dele vira problema ao enviar; preço inválido é de outra regra', () => {
    assert.equal(MIN_ITINERARY_PRICE, 5);
    assert.equal(minPriceIssue(5, 'USD'), null);
    assert.equal(minPriceIssue(4.99, 'USD'), 'The minimum price is $5.00.');
    assert.equal(minPriceIssue(1, undefined), 'The minimum price is $5.00.');
    assert.equal(minPriceIssue(0, 'USD'), null);
    assert.equal(minPriceIssue(NaN, 'USD'), null);
    // outra moeda: o mínimo equivale a US$ 5 pelas taxas padrão
    assert.ok(minItineraryPriceIn('AUD') > 5);
    assert.equal(minPriceIssue(minItineraryPriceIn('AUD'), 'AUD'), null);
    assert.match(minPriceIssue(1, 'AUD') || '', /minimum price is \d+\.\d\d AUD/);
});
