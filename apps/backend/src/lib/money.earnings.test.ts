/**
 * Ganhos do roteirista: pendente (7 dias) → disponível → pago; reembolso zera; contestação trava.
 *   cd apps/backend && npx tsx --test src/lib/money.earnings.test.ts
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { earningOf, summarizeEarnings } from './money';

const DAY = 86_400_000;
const now = new Date('2026-11-06T18:00:00Z');
const sale = (over: any = {}) => ({
    price: 1, commission: 0.2, paidAmountCents: 100, creatorEarningCents: 80, refundedCents: 0,
    paymentStatus: 'paid', createdAt: new Date(now.getTime() - DAY), payoutTransferredAt: null, ...over,
});

test('venda de US$ 1 de ontem: US$ 0,80 pendente até 7 dias depois da compra; nada disponível ainda', () => {
    const s = sale();
    const e = earningOf(s, now);
    assert.equal(e.status, 'pending');
    assert.equal(e.amount, 0.8);
    assert.equal(e.releaseAt.toISOString(), new Date(s.createdAt.getTime() + 7 * DAY).toISOString());
    const t = summarizeEarnings([s], now);
    assert.deepEqual(t, { pending: 0.8, available: 0, paidOut: 0, totalEarned: 0.8, nextReleaseAt: e.releaseAt.toISOString() });
});

test('depois de 7 dias vira disponível; depois do envio, pago', () => {
    assert.equal(earningOf(sale({ createdAt: new Date(now.getTime() - 8 * DAY) }), now).status, 'available');
    assert.equal(earningOf(sale({ createdAt: new Date(now.getTime() - 8 * DAY), payoutTransferredAt: now }), now).status, 'paid_out');
});

test('reembolso total zera o ganho; parcial reduz na proporção; contestação aberta fica pendente', () => {
    assert.deepEqual(
        { s: earningOf(sale({ paymentStatus: 'refunded', refundedCents: 100 }), now).status, a: earningOf(sale({ paymentStatus: 'refunded', refundedCents: 100 }), now).amount },
        { s: 'refunded', a: 0 },
    );
    assert.equal(earningOf(sale({ paymentStatus: 'partially_refunded', refundedCents: 50 }), now).amount, 0.4);
    const t = summarizeEarnings([sale({ paymentStatus: 'disputed', createdAt: new Date(now.getTime() - 20 * DAY) })], now);
    assert.equal(t.pending, 0.8);
    assert.equal(t.available, 0);
});

test('totais somam pendente + disponível + pago, sem reembolsados', () => {
    const t = summarizeEarnings([
        sale({ price: 10, commission: 2, paidAmountCents: 1000, creatorEarningCents: 800 }),
        sale({ price: 20, commission: 4, paidAmountCents: 2000, creatorEarningCents: 1600, createdAt: new Date(now.getTime() - 9 * DAY) }),
        sale({ price: 5, commission: 1, paidAmountCents: 500, creatorEarningCents: 400, createdAt: new Date(now.getTime() - 30 * DAY), payoutTransferredAt: now }),
        sale({ price: 7, commission: 1.4, paidAmountCents: 700, creatorEarningCents: 560, paymentStatus: 'refunded', refundedCents: 700 }),
    ], now);
    assert.equal(t.pending, 8);
    assert.equal(t.available, 16);
    assert.equal(t.paidOut, 4);
    assert.equal(t.totalEarned, 28);
});
