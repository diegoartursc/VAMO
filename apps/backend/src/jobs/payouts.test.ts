/**
 * Regras do repasse (sem banco nem Stripe).
 *   cd apps/backend && npx tsx --test src/jobs/payouts.test.ts
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isPayoutDue, payoutAmountCents } from './payouts';

const DAY = 24 * 60 * 60 * 1000;
const now = new Date('2026-11-20T12:00:00Z');
const sale = (daysAgo: number, price = 26.9, payoutTransferId: string | null = null) =>
    ({ createdAt: new Date(now.getTime() - daysAgo * DAY), price, payoutTransferId });

test('antes de 7 dias não repassa', () => {
    assert.equal(isPayoutDue(sale(6.9), now), false);
});

test('com 7+ dias repassa', () => {
    assert.equal(isPayoutDue(sale(7), now), true);
    assert.equal(isPayoutDue(sale(30), now), true);
});

test('venda já repassada ou grátis não repassa', () => {
    assert.equal(isPayoutDue(sale(30, 26.9, 'tr_123'), now), false);
    assert.equal(isPayoutDue(sale(30, 0), now), false);
});

test('repasse é 80% do preço em centavos', () => {
    assert.equal(payoutAmountCents(26.9), 2152);
    assert.equal(payoutAmountCents(39.9), 3192);
    assert.equal(payoutAmountCents(100), 8000);
});
