/**
 * Corridas e falhas intermediárias no dinheiro (revisão de 07/11/2026, R-01 a R-04).
 * Mesmos cenários que reproduziram os defeitos, agora assertando as invariantes certas:
 *  - valor devolvido nunca diminui; acesso não renasce por evento concorrente/atrasado;
 *  - reversão acumulada nunca passa do devido;
 *  - todo pagamento pago tem entrega OU devolução;
 *  - venda não nasce paga sem conferir a cobrança na Stripe;
 *  - transferência de resultado incerto é sempre recuperada.
 * Prisma e Stripe falsos; leituras devolvem CÓPIAS (como o Prisma real).
 *
 *   cd apps/backend && npx tsx --import ./src/test/setup.ts --test src/security/phase6-money-races.test.ts
 */
import '../test/setup';
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createFakePrisma, memoryTable } from '../test/helpers';

const db = createFakePrisma();
(globalThis as any).prisma = db;

const DAY = 86_400_000;
const now = new Date('2026-11-06T12:00:00Z');
const sale = (over: any = {}) => ({
    id: 'sale1', itineraryId: 'it1', travelerId: 'trav1', price: 100, commission: 20,
    createdAt: new Date(now.getTime() - 10 * DAY),
    purchaseData: { payment: { provider: 'stripe', paymentIntentId: 'pi1' } }, paymentIntentId: 'pi1',
    paidAmountCents: 10000, paidCurrency: 'usd', commissionCents: 2000, creatorEarningCents: 8000,
    paymentStatus: 'paid', refundedCents: 0, disputeStatus: null, disputeId: null, disputeLostCents: 0,
    payoutTransferId: null, payoutTransferredAt: null, payoutAmount: null, payoutStatus: null,
    payoutAttempts: 0, payoutNextAttemptAt: null, payoutLastError: null, payoutReversedCents: 0,
    itinerary: { currency: 'USD', creator: { id: 'cr1', stripeAccountId: 'acct1' } },
    ...over,
});
const itinerary = {
    id: 'it1', title: 'Synthetic itinerary', price: 100, currency: 'USD', status: 'ACTIVE', creatorId: 'cr1',
    creator: { id: 'cr1', verificationLevel: 'BASIC', averageRating: 0, totalSales: 0, traveler: { id: 'trav_creator', name: 'Synthetic', avatar: null } },
    images: [], days: [], files: [], accommodations: [], transports: [], checklists: [], reviews: [], _count: { sales: 0 },
};

let table = memoryTable<any>([]);
function reset(rows: any[] = []) {
    table = memoryTable<any>(rows);
    Object.assign(db.itinerarySale, table);
    const unique = table.findUnique, first = table.findFirst, many = table.findMany;
    db.itinerarySale.findUnique = async (q: any) => structuredClone(await unique(q));
    db.itinerarySale.findFirst = async (q: any) => structuredClone(await first(q));
    db.itinerarySale.findMany = async (q: any) => structuredClone(
        (await many(q)).sort((a: any, b: any) => +new Date(a.createdAt) - +new Date(b.createdAt)).slice(0, q?.take ?? Infinity));
    Object.assign(db.stripeEvent, memoryTable<any>([]));
    db.traveler.findUnique = async () => null;
    db.itinerary.findUnique = async () => itinerary;
    db.creator.update = async () => ({});
    db.$transaction = async (ops: any[]) => Promise.all(ops);
}
beforeEach(async () => {
    reset();
    (await import('../lib/paymentEvents')).refundNotifier.send = async () => true;
});

const event = (id: string, type: string, obj: any) => ({ id, type, data: { object: obj } } as any);

function fakeStripe() {
    const calls: any = { transfers: [], reversals: [], refunds: [] };
    const transfersAtStripe: any[] = [];
    return {
        calls, transfersAtStripe,
        accounts: { retrieve: async () => ({ payouts_enabled: true }) },
        paymentIntents: { retrieve: async () => ({ id: 'pi1', amount: 10000, amount_received: 10000, currency: 'usd', latest_charge: { id: 'ch1', amount: 10000, currency: 'usd', amount_refunded: 0, refunded: false, disputed: false } }) },
        refunds: {
            list: async () => ({ data: [], has_more: false }),
            create: async (p: any, o: any) => { calls.refunds.push({ p, o }); return { id: `re_${calls.refunds.length}`, amount: p.amount, status: 'succeeded', lastResponse: { headers: {} } }; },
        },
        transfers: {
            create: async (p: any, o: any) => { calls.transfers.push({ p, o }); const t = { id: 'tr1', amount: p.amount, created: 1, metadata: p.metadata, transfer_group: p.transfer_group }; transfersAtStripe.push(t); return t; },
            list: async (q: any) => ({ data: transfersAtStripe.filter((t) => t.transfer_group === q.transfer_group) }),
            createReversal: async (id: string, p: any, o: any) => { calls.reversals.push({ id, p, o }); return { id: `trr_${calls.reversals.length}` }; },
        },
    } as any;
}

/** Segura as duas primeiras leituras da venda por PaymentIntent até ambas terem lido (corrida). */
function gateTwoReadsByPaymentIntent() {
    let reads = 0; let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    const original = db.itinerarySale.findUnique;
    db.itinerarySale.findUnique = async (q: any) => {
        const snap = await original(q);
        if (q.where.paymentIntentId) { if (++reads === 2) release(); await gate; }
        return snap;
    };
}

test('R-01: estorno total e parcial concorrentes — o valor devolvido não diminui e o acesso não volta', async () => {
    const { handleStripeEvent } = await import('../lib/paymentEvents');
    const { hasActiveAccess } = await import('../lib/money');
    reset([sale()]);
    gateTwoReadsByPaymentIntent();
    // o parcial só grava depois do total (pior ordem)
    const originalUpdateMany = table.updateMany; let fullDone!: () => void;
    const full = new Promise<void>((r) => (fullDone = r));
    db.itinerarySale.updateMany = async (q: any) => {
        if (q.data.refundedCents === 1000) await full;
        const res = await originalUpdateMany(q);
        if (q.data.refundedCents === 10000) fullDone();
        return res;
    };
    await Promise.all([
        handleStripeEvent(fakeStripe(), event('ev_full', 'charge.refunded', { payment_intent: 'pi1', amount: 10000, amount_refunded: 10000 })),
        handleStripeEvent(fakeStripe(), event('ev_partial', 'charge.refunded', { payment_intent: 'pi1', amount: 10000, amount_refunded: 1000 })),
    ]);
    assert.equal(table.rows[0].refundedCents, 10000);
    assert.equal(table.rows[0].paymentStatus, 'refunded');
    assert.equal(hasActiveAccess(table.rows[0]), false);
});

test('R-01: estornos parciais concorrentes depois do repasse — reversão total = exatamente o devido', async () => {
    const { handleStripeEvent } = await import('../lib/paymentEvents');
    const { reversalTargetCents } = await import('../lib/money');
    reset([sale({ payoutTransferId: 'tr_existing', payoutAmount: 80, payoutStatus: 'transferred' })]);
    gateTwoReadsByPaymentIntent();
    const st = fakeStripe();
    await Promise.all([
        handleStripeEvent(st, event('e_rev_1', 'charge.refunded', { payment_intent: 'pi1', amount: 10000, amount_refunded: 1000 })),
        handleStripeEvent(st, event('e_rev_2', 'charge.refunded', { payment_intent: 'pi1', amount: 10000, amount_refunded: 2000 })),
    ]);
    const reversed = st.calls.reversals.reduce((sum: number, c: any) => sum + c.p.amount, 0);
    assert.equal(table.rows[0].refundedCents, 2000);
    assert.equal(reversalTargetCents(table.rows[0]), 1600);
    assert.equal(reversed, 1600, 'pediu mais reversão do que o devido');
    assert.equal(table.rows[0].payoutReversedCents, 1600);
});

test('R-01: reversão que falha na Stripe desfaz a reserva e marca para atenção', async () => {
    const { handleStripeEvent } = await import('../lib/paymentEvents');
    reset([sale({ payoutTransferId: 'tr_existing', payoutAmount: 80, payoutStatus: 'transferred' })]);
    const st = fakeStripe();
    st.transfers.createReversal = async () => { throw new Error('insufficient_funds'); };
    await assert.rejects(handleStripeEvent(st, event('e_fail', 'charge.refunded', { payment_intent: 'pi1', amount: 10000, amount_refunded: 10000 })));
    assert.equal(table.rows[0].payoutReversedCents, 0, 'reserva não foi desfeita');
    assert.equal(table.rows[0].payoutStatus, 'needs_attention');
});

test('R-02: duas recompras pagas ao mesmo tempo — uma entra, a outra é estornada', async () => {
    const payments = await import('../routes/payments');
    reset([sale({ paymentStatus: 'refunded', refundedCents: 10000 })]);
    let reads = 0; let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    const first = db.itinerarySale.findFirst;
    db.itinerarySale.findFirst = async (q: any) => {
        const snap = await first(q);
        if (q.where.itineraryId) { if (++reads === 2) release(); await gate; }
        return snap;
    };
    const st = fakeStripe();
    payments.setStripeClientForTests(st);
    try {
        const results = await Promise.all(['pi_new_a', 'pi_new_b'].map((paymentIntentId) =>
            payments.fulfillItineraryPurchaseForTests({ itineraryId: 'it1', travelerId: 'trav1', payment: { provider: 'stripe', paymentIntentId, amountTotal: 100, currency: 'usd' } })));
        assert.equal(results.filter((r) => r.alreadyPurchased === false).length, 1);
        const winnerPi = table.rows[0].paymentIntentId;
        const loserPi = winnerPi === 'pi_new_a' ? 'pi_new_b' : 'pi_new_a';
        assert.equal(st.calls.refunds.length, 1, 'pagamento sobrando não foi estornado');
        assert.equal(st.calls.refunds[0].p.payment_intent, loserPi);
    } finally {
        payments.setStripeClientForTests(null);
    }
});

test('R-03: estorno chega antes da venda e a Stripe não responde — venda NÃO nasce paga; depois nasce estornada', async () => {
    const { handleStripeEvent } = await import('../lib/paymentEvents');
    const { hasActiveAccess } = await import('../lib/money');
    const payments = await import('../routes/payments');
    reset();
    const st = fakeStripe();
    st.paymentIntents.retrieve = async () => { throw new Error('synthetic provider timeout'); };
    payments.setStripeClientForTests(st);
    try {
        await handleStripeEvent(st, event('ev_early', 'charge.refunded', { payment_intent: 'pi1', amount: 10000, amount_refunded: 10000 }));
        const purchase = { itineraryId: 'it1', travelerId: 'trav1', payment: { provider: 'stripe' as const, paymentIntentId: 'pi1', amountTotal: 100, currency: 'usd' } };
        await assert.rejects(payments.fulfillItineraryPurchaseForTests(purchase), (e: any) => e instanceof payments.PaymentVerificationPendingError);
        assert.equal(table.rows.length, 0, 'venda foi criada sem conferir a cobrança');
        // Stripe volta: a venda nasce com o estado real (estornada, sem acesso).
        st.paymentIntents.retrieve = async () => ({ id: 'pi1', latest_charge: { id: 'ch1', amount: 10000, amount_refunded: 10000, refunded: true, disputed: false } });
        await payments.fulfillItineraryPurchaseForTests(purchase);
        assert.equal(table.rows[0].paymentStatus, 'refunded');
        assert.equal(hasActiveAccess(table.rows[0]), false);
    } finally {
        payments.setStripeClientForTests(null);
    }
});

test('R-04: transferência feita com resposta perdida + estorno — a recuperação acha, grava e reverte', async () => {
    const { handleStripeEvent } = await import('../lib/paymentEvents');
    const { runPayoutSweep } = await import('../jobs/payouts');
    reset([sale()]);
    const st = fakeStripe();
    const realCreate = st.transfers.create;
    st.transfers.create = async (p: any, o: any) => { await realCreate(p, o); throw new Error('synthetic response lost after provider committed transfer'); };
    await runPayoutSweep(now, st);
    assert.equal(table.rows[0].payoutStatus, 'transferring');
    assert.equal(table.rows[0].payoutTransferId, null);
    await handleStripeEvent(st, event('ev_after_lost_response', 'charge.refunded', { payment_intent: 'pi1', amount: 10000, amount_refunded: 10000 }));
    assert.equal(table.rows[0].payoutStatus, 'transferring', 'estorno não pode tirar a venda da recuperação');
    await runPayoutSweep(new Date(now.getTime() + 2 * DAY), st);
    assert.equal(st.calls.transfers.length, 1, 'não pode transferir de novo');
    assert.equal(table.rows[0].payoutTransferId, 'tr1');
    assert.equal(st.calls.reversals.length, 1);
    assert.equal(st.calls.reversals[0].p.amount, 8000, 'estorno total reverte o repasse inteiro');
});

test('R-04: transferência que NÃO aconteceu volta para a fila e é feita uma vez só', async () => {
    const { runPayoutSweep } = await import('../jobs/payouts');
    reset([sale()]);
    const st = fakeStripe();
    let fail = true;
    const realCreate = st.transfers.create;
    st.transfers.create = async (p: any, o: any) => { if (fail) throw new Error('network down before reaching Stripe'); return realCreate(p, o); };
    await runPayoutSweep(now, st);
    assert.equal(table.rows[0].payoutStatus, 'transferring');
    fail = false;
    await runPayoutSweep(new Date(now.getTime() + 3 * DAY), st); // recuperação: não achou → volta à fila
    await runPayoutSweep(new Date(now.getTime() + 6 * DAY), st); // fila normal transfere
    assert.equal(st.calls.transfers.length, 1);
    assert.equal(table.rows[0].payoutTransferId, 'tr1');
    assert.equal(table.rows[0].payoutStatus, 'transferred');
});
