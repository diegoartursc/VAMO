/**
 * Fase 5 — achados da revisão independente no dinheiro (R-M1..R-M4, recompra, corrida).
 *
 *   cd apps/backend && npx tsx --import ./src/test/setup.ts --test src/security/phase5-money.test.ts
 */
import '../test/setup';
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createFakePrisma, memoryTable } from '../test/helpers';

const db = createFakePrisma();
(globalThis as any).prisma = db;
const DAY = 86_400_000;
let sales = memoryTable<any>([]);

// Pagou US$ 100; ganho do roteirista US$ 80.
function sale(over: Partial<any> = {}) {
    return {
        id: 's1', itineraryId: 'it_1', travelerId: 'trav_buyer', price: 100, commission: 20,
        createdAt: new Date(Date.now() - 10 * DAY), purchaseData: { payment: { provider: 'stripe', paymentIntentId: 'pi_1' } },
        paymentIntentId: 'pi_1', paidAmountCents: 10000, paidCurrency: 'usd', commissionCents: 2000, creatorEarningCents: 8000,
        paymentStatus: 'paid', refundedCents: 0, disputeStatus: null, disputeId: null, disputeLostCents: 0,
        payoutTransferId: null, payoutTransferredAt: null, payoutAmount: null, payoutStatus: null,
        payoutAttempts: 0, payoutNextAttemptAt: null, payoutLastError: null, payoutReversedCents: 0,
        itinerary: { currency: 'USD', creator: { id: 'cr_1', stripeAccountId: 'acct_creator' } },
        ...over,
    };
}
function fakeStripe(charge: Partial<any> = {}) {
    const calls: Record<string, any[]> = { reversals: [], transfers: [], refunds: [] };
    return {
        calls,
        accounts: { retrieve: async () => ({ payouts_enabled: true }) },
        paymentIntents: { retrieve: async () => ({ id: 'pi_1', amount: 10000, amount_received: 10000, latest_charge: { id: 'ch_1', currency: 'usd', amount: 10000, amount_refunded: 0, refunded: false, disputed: false, ...charge } }) },
        refunds: { list: async () => ({ data: [], has_more: false }), create: async (p: any) => { calls.refunds.push(p); return { id: 're', status: 'succeeded', lastResponse: { headers: {} } }; } },
        transfers: {
            create: async (p: any) => { calls.transfers.push(p); return { id: 'tr_new' }; },
            createReversal: async (id: string, p: any, o: any) => { calls.reversals.push({ id, p, o }); return { id: 'trr' }; },
        },
    } as any;
}
const ev = (id: string, type: string, object: any) => ({ id, type, data: { object } } as any);

beforeEach(() => {
    sales = memoryTable<any>([]);
    Object.assign(db.itinerarySale, sales);
    Object.assign(db.stripeEvent, memoryTable<any>([]));
});

test('R-M1: estorno de 30 antes do repasse (repasse 56) e total de 50 depois → reverte só 16 (roteirista fica com 40)', async () => {
    const { handleStripeEvent } = await import('../lib/paymentEvents');
    const { payoutDueCents } = await import('../lib/money');
    sales.rows.push(sale({ refundedCents: 3000, paymentStatus: 'partially_refunded' }));
    assert.equal(payoutDueCents(sales.rows[0]), 5600);
    Object.assign(sales.rows[0], { payoutTransferId: 'tr_1', payoutStatus: 'transferred', payoutAmount: 56 });
    const stripe = fakeStripe();
    await handleStripeEvent(stripe, ev('e1', 'charge.refunded', { id: 'ch_1', payment_intent: 'pi_1', amount: 10000, amount_refunded: 5000 }));
    assert.equal(stripe.calls.reversals.length, 1);
    assert.equal(stripe.calls.reversals[0].p.amount, 1600);
});

test('R-M2: repasse 80, estorno de 30 (reverte 24) e disputa perdida dos 70 restantes → reverte os 80 no total', async () => {
    const { handleStripeEvent } = await import('../lib/paymentEvents');
    sales.rows.push(sale({ payoutTransferId: 'tr_1', payoutStatus: 'transferred', payoutAmount: 80 }));
    const stripe = fakeStripe();
    await handleStripeEvent(stripe, ev('e1', 'charge.refunded', { id: 'ch_1', payment_intent: 'pi_1', amount: 10000, amount_refunded: 3000 }));
    await handleStripeEvent(stripe, ev('e2', 'charge.dispute.closed', { id: 'dp_1', payment_intent: 'pi_1', amount: 7000, status: 'lost' }));
    const total = stripe.calls.reversals.reduce((s: number, r: any) => s + r.p.amount, 0);
    assert.equal(total, 8000);
    assert.equal(sales.rows[0].payoutReversedCents, 8000);
});

test('R-M3: disputa ganha seguida de evento atrasado "created" não congela o repasse', async () => {
    const { handleStripeEvent } = await import('../lib/paymentEvents');
    sales.rows.push(sale());
    const stripe = fakeStripe();
    await handleStripeEvent(stripe, ev('e1', 'charge.dispute.closed', { id: 'dp_1', payment_intent: 'pi_1', amount: 10000, status: 'won' }));
    await handleStripeEvent(stripe, ev('e2', 'charge.dispute.created', { id: 'dp_1', payment_intent: 'pi_1', amount: 10000, status: 'needs_response' }));
    assert.equal(sales.rows[0].paymentStatus, 'paid');
    assert.equal(sales.rows[0].payoutStatus, null);
});

test('R-M4: estorno total que chegou antes da venda → venda nasce estornada (sem acesso, sem repasse)', async () => {
    const payments = await import('../routes/payments');
    payments.setStripeClientForTests(fakeStripe({ amount_refunded: 10000, refunded: true }));
    const { hasActiveAccess } = await import('../lib/money');
    db.itinerary.findUnique = async () => ({
        id: 'it_1', title: 'T', price: 100, currency: 'USD', status: 'ACTIVE', creatorId: 'cr_1',
        creator: { id: 'cr_1', verificationLevel: 'BASIC', averageRating: 0, totalSales: 0, traveler: { id: 'trav_c', name: 'C', avatar: null } },
        images: [], days: [], files: [], accommodations: [], transports: [], checklists: [], reviews: [], _count: { sales: 0 },
    });
    db.creator.update = async () => ({});
    await (payments as any).fulfillItineraryPurchaseForTests({
        itineraryId: 'it_1', travelerId: 'trav_buyer',
        payment: { provider: 'stripe', paymentIntentId: 'pi_late', amountTotal: 100, currency: 'usd' },
    });
    const created = sales.rows.find((s) => s.paymentIntentId === 'pi_late');
    assert.equal(created.paymentStatus, 'refunded');
    assert.equal(created.payoutStatus, 'blocked');
    assert.equal(hasActiveAccess(created), false);
    payments.setStripeClientForTests(null);
});

test('Recompra de venda que já teve repasse é bloqueada e o pagamento novo é estornado (registro preservado)', async () => {
    const payments = await import('../routes/payments');
    const stripe = fakeStripe();
    stripe.paymentIntents.retrieve = async () => ({ id: 'pi_new', amount: 10000, amount_received: 10000, latest_charge: null });
    payments.setStripeClientForTests(stripe);
    sales.rows.push(sale({ paymentStatus: 'refunded', refundedCents: 10000, payoutTransferId: 'tr_old', payoutStatus: 'needs_attention', payoutAmount: 80 }));
    await assert.rejects((payments as any).fulfillItineraryPurchaseForTests({
        itineraryId: 'it_1', travelerId: 'trav_buyer',
        payment: { provider: 'stripe', paymentIntentId: 'pi_new', amountTotal: 100, currency: 'usd' },
    }), (e: any) => e instanceof payments.PurchaseBlockedError && e.refunded === true);
    assert.equal(sales.rows[0].payoutTransferId, 'tr_old');
    assert.equal(sales.rows[0].payoutStatus, 'needs_attention');
    assert.equal(stripe.calls.refunds.length, 1);
    payments.setStripeClientForTests(null);
});

test('Corrida: estorno gravado durante a transferência é revertido logo depois', async () => {
    const { runPayoutSweep } = await import('../jobs/payouts');
    sales.rows.push(sale());
    const stripe = fakeStripe();
    stripe.transfers.create = async (p: any) => {
        stripe.calls.transfers.push(p);
        Object.assign(sales.rows[0], { refundedCents: 10000, paymentStatus: 'refunded' }); // chega no meio
        return { id: 'tr_new' };
    };
    await runPayoutSweep(new Date(), stripe);
    assert.equal(stripe.calls.transfers.length, 1);
    assert.equal(stripe.calls.reversals.length, 1);
    assert.equal(stripe.calls.reversals[0].p.amount, 8000);
});
