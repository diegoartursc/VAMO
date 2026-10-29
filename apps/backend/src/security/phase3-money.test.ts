/**
 * Fase 3 — dinheiro (SEC-11, SEC-12, SEC-13, SEC-15). Stripe e Prisma falsos;
 * nenhuma cobrança, estorno ou transferência real.
 *
 *   cd apps/backend && npx tsx --import ./src/test/setup.ts --test src/security/phase3-money.test.ts
 */
import '../test/setup';
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import Stripe from 'stripe';
import { createFakePrisma, memoryTable, startApp, call } from '../test/helpers';

const db = createFakePrisma();
(globalThis as any).prisma = db;

const DAY = 86_400_000;
let sales = memoryTable<any>([]);
let events = memoryTable<any>([]);

function sale(over: Partial<any> = {}) {
    return {
        id: over.id ?? `s_${sales.rows.length + 1}`,
        itineraryId: 'it_1', travelerId: 'trav_buyer', price: 26.9, commission: 5.38,
        createdAt: new Date(Date.now() - 10 * DAY),
        purchaseData: { payment: { provider: 'stripe', paymentIntentId: over.paymentIntentId ?? 'pi_1' } },
        paymentIntentId: 'pi_1', paidAmountCents: 2690, paidCurrency: 'usd', commissionCents: 538, creatorEarningCents: 2152,
        paymentStatus: 'paid', refundedCents: 0, disputeStatus: null,
        payoutTransferId: null, payoutTransferredAt: null, payoutAmount: null, payoutStatus: null,
        payoutAttempts: 0, payoutNextAttemptAt: null, payoutLastError: null, payoutReversedCents: 0,
        itinerary: { currency: 'USD', creator: { id: 'cr_1', stripeAccountId: 'acct_creator' } },
        ...over,
    };
}

function fakeStripe(opts: { refunds?: any[]; chargeAmount?: number; refunded?: boolean; disputed?: boolean } = {}) {
    const calls: Record<string, any[]> = { refunds: [], transfers: [], reversals: [] };
    const stripe: any = {
        calls,
        paymentIntents: {
            retrieve: async (id: string) => ({
                id, amount: opts.chargeAmount ?? 2690, amount_received: opts.chargeAmount ?? 2690, currency: 'usd',
                latest_charge: { id: 'ch_1', currency: 'usd', amount: opts.chargeAmount ?? 2690, refunded: !!opts.refunded, amount_refunded: opts.refunded ? (opts.chargeAmount ?? 2690) : 0, disputed: !!opts.disputed },
            }),
        },
        refunds: {
            list: async () => ({ data: opts.refunds ?? [], has_more: false }),
            create: async (params: any, reqOpts: any) => { calls.refunds.push({ params, reqOpts }); return { id: 're_new', status: 'succeeded', amount: params.amount, lastResponse: { headers: {} } }; },
        },
        accounts: { retrieve: async () => ({ id: 'acct_creator', payouts_enabled: true }) },
        transfers: {
            create: async (params: any, reqOpts: any) => { calls.transfers.push({ params, reqOpts }); return { id: `tr_${calls.transfers.length}` }; },
            createReversal: async (id: string, params: any, reqOpts: any) => { calls.reversals.push({ id, params, reqOpts }); return { id: `trr_${calls.reversals.length}` }; },
        },
    };
    return stripe;
}

beforeEach(() => {
    sales = memoryTable<any>([]);
    events = memoryTable<any>([]);
    Object.assign(db.itinerarySale, sales);
    Object.assign(db.stripeEvent, events);
});

// ── SEC-12 ───────────────────────────────────────────────────────

test('SEC-12: refund parcial existente (1 centavo) NÃO conta como devolução total; devolve o restante', async () => {
    const { refundPaymentIntentIfNeeded } = await import('../routes/payments');
    const stripe = fakeStripe({ refunds: [{ status: 'succeeded', amount: 1 }] });
    const r = await refundPaymentIntentIfNeeded(stripe, 'pi_1', 'teste');
    assert.equal(stripe.calls.refunds.length, 1, 'precisava criar o refund do restante');
    assert.equal(stripe.calls.refunds[0].params.amount, 2689);
    assert.equal(r.refunded, true);
});

test('SEC-12: refund total pendente é iniciação válida: não cria outro nem pede retry', async () => {
    const { refundPaymentIntentIfNeeded } = await import('../routes/payments');
    const stripe = fakeStripe({ refunds: [{ status: 'pending', amount: 2690 }] });
    const r = await refundPaymentIntentIfNeeded(stripe, 'pi_1', 'teste');
    assert.equal(stripe.calls.refunds.length, 0);
    assert.equal(r.refunded, true);
    assert.equal((r as any).pending, true, 'precisa informar que ainda está pendente');
});

test('SEC-12: refund que falhou não conta como devolvido', async () => {
    const { refundPaymentIntentIfNeeded } = await import('../routes/payments');
    const stripe = fakeStripe({ refunds: [{ status: 'failed', amount: 2690 }] });
    await refundPaymentIntentIfNeeded(stripe, 'pi_1', 'teste');
    assert.equal(stripe.calls.refunds.length, 1);
    assert.equal(stripe.calls.refunds[0].params.amount, 2690);
});

// ── SEC-13 ───────────────────────────────────────────────────────

test('SEC-13: venda grava o valor PAGO, não o preço atual do roteiro', async () => {
    const { buildSaleAmounts } = await import('../lib/money');
    const frozen = buildSaleAmounts({ amountTotalCents: 2690, currency: 'usd' });
    assert.deepEqual(frozen, { price: 26.9, paidAmountCents: 2690, paidCurrency: 'usd', commissionCents: 538, creatorEarningCents: 2152, commission: 5.38 });
});

test('SEC-13: repasse usa valores congelados mesmo se moeda/comissão do roteiro mudarem; venda antiga usa a comissão gravada', async () => {
    const { runPayoutSweep } = await import('../jobs/payouts');
    sales.rows.push(sale({ id: 's_new', itinerary: { currency: 'EUR', creator: { id: 'cr_1', stripeAccountId: 'acct_creator' } } }));
    sales.rows.push(sale({ id: 's_legacy', paymentIntentId: 'pi_legacy', paidAmountCents: null, paidCurrency: null, commissionCents: null, creatorEarningCents: null, price: 26.9, commission: 4.04, purchaseData: { payment: { provider: 'stripe', paymentIntentId: 'pi_legacy', currency: 'usd' } } }));
    const stripe = fakeStripe();
    await runPayoutSweep(new Date(), stripe);
    const byId = Object.fromEntries(stripe.calls.transfers.map((t: any) => [t.params.metadata.saleId, t.params]));
    assert.equal(byId.s_new.amount, 2152);
    assert.equal(byId.s_new.currency, 'usd', 'moeda do pagamento, não a atual do roteiro');
    assert.equal(byId.s_legacy.amount, 2286, 'venda antiga: 26.90 - 4.04 (15% gravado), não 80% de hoje');
});

// ── SEC-15 ───────────────────────────────────────────────────────

test('SEC-15: 60 vendas inelegíveis antigas não impedem o repasse de uma elegível mais nova', async () => {
    const { runPayoutSweep } = await import('../jobs/payouts');
    for (let i = 0; i < 60; i++) {
        sales.rows.push(sale({ id: `s_bad_${i}`, paymentIntentId: `pi_bad_${i}`, createdAt: new Date(Date.now() - (40 - i / 10) * DAY), itinerary: { currency: 'USD', creator: { id: 'cr_x', stripeAccountId: 'acct_not_ready' } } }));
    }
    sales.rows.push(sale({ id: 's_good', paymentIntentId: 'pi_good', createdAt: new Date(Date.now() - 8 * DAY) }));
    const stripe = fakeStripe();
    stripe.accounts.retrieve = async (id: string) => ({ id, payouts_enabled: id === 'acct_creator' });
    for (let run = 0; run < 3 && !stripe.calls.transfers.length; run++) await runPayoutSweep(new Date(), stripe);
    assert.equal(stripe.calls.transfers.length, 1, 'a venda elegível não foi repassada');
    assert.equal(stripe.calls.transfers[0].params.metadata.saleId, 's_good');
    const bad = sales.rows.find((s) => s.id === 's_bad_0');
    assert.ok(bad.payoutNextAttemptAt > new Date(), 'inelegível transitória precisa de próxima tentativa agendada');
});

test('SEC-11/15: venda reembolsada ou em disputa não recebe repasse', async () => {
    const { runPayoutSweep } = await import('../jobs/payouts');
    sales.rows.push(sale({ id: 's_ref', paymentStatus: 'refunded', refundedCents: 2690 }));
    sales.rows.push(sale({ id: 's_disp', paymentIntentId: 'pi_d', paymentStatus: 'disputed' }));
    const stripe = fakeStripe();
    await runPayoutSweep(new Date(), stripe);
    assert.equal(stripe.calls.transfers.length, 0);
});

// ── SEC-11: eventos ──────────────────────────────────────────────

const ev = (id: string, type: string, object: any) => ({ id, type, data: { object } } as any);

test('SEC-11: estorno total antes do repasse bloqueia o repasse e corta o acesso', async () => {
    const { handleStripeEvent } = await import('../lib/paymentEvents');
    const { hasActiveAccess } = await import('../lib/money');
    sales.rows.push(sale({ id: 's1' }));
    const stripe = fakeStripe();
    await handleStripeEvent(stripe, ev('evt_1', 'charge.refunded', { id: 'ch_1', payment_intent: 'pi_1', amount: 2690, amount_refunded: 2690 }));
    const s = sales.rows[0];
    assert.equal(s.paymentStatus, 'refunded');
    assert.equal(s.payoutStatus, 'blocked');
    assert.equal(hasActiveAccess(s), false);
});

test('SEC-11: estorno parcial mantém acesso e reduz o repasse na proporção', async () => {
    const { handleStripeEvent } = await import('../lib/paymentEvents');
    const { hasActiveAccess, payoutDueCents } = await import('../lib/money');
    sales.rows.push(sale({ id: 's1' }));
    await handleStripeEvent(fakeStripe(), ev('evt_p', 'charge.refunded', { id: 'ch_1', payment_intent: 'pi_1', amount: 2690, amount_refunded: 1345 }));
    const s = sales.rows[0];
    assert.equal(s.paymentStatus, 'partially_refunded');
    assert.equal(hasActiveAccess(s), true);
    assert.equal(payoutDueCents(s), 1076);
});

test('SEC-11: estorno depois do repasse reverte a transferência proporcionalmente, uma vez só', async () => {
    const { handleStripeEvent } = await import('../lib/paymentEvents');
    sales.rows.push(sale({ id: 's1', payoutTransferId: 'tr_9', payoutStatus: 'transferred', payoutTransferredAt: new Date() }));
    const stripe = fakeStripe();
    const e = ev('evt_r', 'charge.refunded', { id: 'ch_1', payment_intent: 'pi_1', amount: 2690, amount_refunded: 2690 });
    await handleStripeEvent(stripe, e);
    await handleStripeEvent(stripe, e);
    assert.equal(stripe.calls.reversals.length, 1, 'evento repetido gerou duas reversões');
    assert.equal(stripe.calls.reversals[0].params.amount, 2152);
    assert.equal(sales.rows[0].payoutReversedCents, 2152);
});

test('SEC-11: falha ao reverter fica registrada para intervenção e não some', async () => {
    const { handleStripeEvent } = await import('../lib/paymentEvents');
    sales.rows.push(sale({ id: 's1', payoutTransferId: 'tr_9', payoutStatus: 'transferred' }));
    const stripe = fakeStripe();
    stripe.transfers.createReversal = async () => { throw new Error('insufficient_funds'); };
    await assert.rejects(handleStripeEvent(stripe, ev('evt_f', 'charge.refunded', { id: 'ch_1', payment_intent: 'pi_1', amount: 2690, amount_refunded: 2690 })));
    assert.equal(sales.rows[0].payoutStatus, 'needs_attention');
    assert.match(sales.rows[0].payoutLastError || '', /insufficient_funds/);
    assert.equal(events.rows.find((e) => e.id === 'evt_f')?.processedAt ?? null, null, 'evento com falha não pode ser marcado como processado');
});

test('SEC-11: disputa aberta trava o repasse e mantém o acesso; perdida corta acesso e reverte; ganha libera', async () => {
    const { handleStripeEvent } = await import('../lib/paymentEvents');
    const { hasActiveAccess } = await import('../lib/money');
    sales.rows.push(sale({ id: 's_lost', paymentIntentId: 'pi_lost', payoutTransferId: 'tr_1', payoutStatus: 'transferred' }));
    sales.rows.push(sale({ id: 's_won', paymentIntentId: 'pi_won' }));
    const stripe = fakeStripe();
    await handleStripeEvent(stripe, ev('evt_d1', 'charge.dispute.created', { id: 'dp_1', payment_intent: 'pi_won', amount: 2690, status: 'needs_response' }));
    const won = sales.rows.find((s) => s.id === 's_won');
    assert.equal(won.paymentStatus, 'disputed');
    assert.equal(won.payoutStatus, 'on_hold');
    assert.equal(hasActiveAccess(won), true);
    await handleStripeEvent(stripe, ev('evt_d2', 'charge.dispute.closed', { id: 'dp_1', payment_intent: 'pi_won', amount: 2690, status: 'won' }));
    assert.equal(won.paymentStatus, 'paid');
    assert.equal(won.payoutStatus, null, 'repasse precisa voltar para a fila');
    // Ordem invertida: fechamento (perdida) chega sem o "created".
    await handleStripeEvent(stripe, ev('evt_d3', 'charge.dispute.closed', { id: 'dp_2', payment_intent: 'pi_lost', amount: 2690, status: 'lost' }));
    const lost = sales.rows.find((s) => s.id === 's_lost');
    assert.equal(lost.paymentStatus, 'dispute_lost');
    assert.equal(hasActiveAccess(lost), false);
    assert.equal(stripe.calls.reversals.length, 1);
    assert.equal(stripe.calls.reversals[0].params.amount, 2152);
});

test('SEC-11: webhook HTTP real com assinatura válida processa estorno e ignora replay', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_fake_never_used_on_network';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_only_phase3';
    sales.rows.push(sale({ id: 's1' }));
    const app = (await import('../app')).default;
    const { base, close } = await startApp(app);
    try {
        const payload = JSON.stringify(ev('evt_http_1', 'charge.refunded', { id: 'ch_1', payment_intent: 'pi_1', amount: 2690, amount_refunded: 2690 }));
        const header = Stripe.webhooks.generateTestHeaderString({ payload, secret: process.env.STRIPE_WEBHOOK_SECRET! });
        for (let i = 0; i < 2; i++) {
            const r = await call(base, 'POST', '/api/payments/webhook', { body: payload, headers: { 'stripe-signature': header } });
            assert.equal(r.status, 200, r.text);
        }
        assert.equal(sales.rows[0].paymentStatus, 'refunded');
        assert.equal(events.rows.filter((e) => e.id === 'evt_http_1').length, 1);
    } finally {
        await close();
        delete process.env.STRIPE_SECRET_KEY;
        delete process.env.STRIPE_WEBHOOK_SECRET;
    }
});

test('SEC-13: checkout pago a 26,90 com preço do roteiro alterado para 99 → venda grava 26,90 e comissão sobre 26,90', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_fake_never_used_on_network';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_only_phase3';
    db.itinerary.findUnique = async () => ({
        id: 'it_1', title: 'California', price: 99, currency: 'USD', status: 'ACTIVE', creatorId: 'cr_1',
        creator: { id: 'cr_1', verificationLevel: 'BASIC', averageRating: 0, totalSales: 0, traveler: { id: 'trav_creator', name: 'Ana', avatar: null } },
        images: [], days: [], files: [], accommodations: [], transports: [], checklists: [], reviews: [], _count: { sales: 0 },
    });
    db.creator.update = async () => ({});
    const app = (await import('../app')).default;
    const { base, close } = await startApp(app);
    try {
        const payload = JSON.stringify(ev('evt_paid_1', 'checkout.session.completed', {
            id: 'cs_1', payment_status: 'paid', amount_total: 2690, currency: 'usd', payment_intent: 'pi_new',
            payment_method_types: ['card'], metadata: { itineraryId: 'it_1', travelerId: 'trav_buyer' },
        }));
        const header = Stripe.webhooks.generateTestHeaderString({ payload, secret: process.env.STRIPE_WEBHOOK_SECRET! });
        const r = await call(base, 'POST', '/api/payments/webhook', { body: payload, headers: { 'stripe-signature': header } });
        assert.equal(r.status, 200, r.text);
        const created = sales.rows.find((s) => s.paymentIntentId === 'pi_new');
        assert.ok(created, 'venda não foi criada');
        assert.equal(created.price, 26.9);
        assert.equal(created.paidAmountCents, 2690);
        assert.equal(created.commissionCents, 538);
        assert.equal(created.creatorEarningCents, 2152);
        assert.equal(created.paidCurrency, 'usd');
    } finally {
        await close();
        delete process.env.STRIPE_SECRET_KEY;
        delete process.env.STRIPE_WEBHOOK_SECRET;
    }
});

test('SEC-11: comprador com estorno total perde o acesso ao conteúdo comprado; parcial mantém', async () => {
    const bcrypt = (await import('bcryptjs')).default;
    const travelers = memoryTable<any>([{ id: 'trav_buyer', email: 'buyer@test.local', name: 'B', passwordHash: await bcrypt.hash('correct-horse-battery', 4) }]);
    Object.assign(db.traveler, { findFirst: travelers.findFirst, findUnique: travelers.findUnique });
    Object.assign(db.travelerSession, memoryTable<any>([]));
    sales.rows.push(sale({ id: 's_ref', paymentStatus: 'refunded', purchaseData: { routeSnapshot: { id: 'it_1', title: 'California', generalTips: ['PAID tip'] } } }));
    const app = (await import('../app')).default;
    const { base, close } = await startApp(app);
    try {
        const login = await call(base, 'POST', '/api/auth/traveler/login', { body: { email: 'buyer@test.local', password: 'correct-horse-battery' } });
        const token = login.json.accessToken;
        const refunded = await call(base, 'GET', '/api/itineraries/it_1/purchased', { token });
        assert.equal(refunded.status, 403, `estorno total ainda abre o conteúdo: ${refunded.status}`);
        sales.rows[0].paymentStatus = 'partially_refunded';
        const partial = await call(base, 'GET', '/api/itineraries/it_1/purchased', { token });
        assert.equal(partial.status, 200);
    } finally {
        await close();
    }
});
