/**
 * refundPaymentIntentIfNeeded: `newlyCreated` só é true para quem de fato
 * criou o estorno — é o que decide o e-mail explicativo ao comprador.
 *
 * Roda via runner nativo do Node:
 *   cd apps/backend && npx tsx --test src/routes/payments.refund.test.ts
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const fakeStripe = (opts: { existing?: string[]; replayed?: boolean; createFails?: boolean }) => {
    const calls: any[] = [];
    return {
        calls,
        refunds: {
            list: async () => ({ data: (opts.existing || []).map((status) => ({ status })) }),
            create: async (params: any, reqOpts: any) => {
                calls.push({ params, reqOpts });
                if (opts.createFails) throw new Error('charge_already_refunded');
                return { id: 're_1', lastResponse: { headers: { 'idempotent-replayed': opts.replayed ? 'true' : 'false' } } };
            },
        },
    } as any;
};

test('cria estorno novo → newlyCreated true, com idempotency key por pagamento', async () => {
    const { refundPaymentIntentIfNeeded } = await import('./payments');
    const stripe = fakeStripe({});
    assert.deepEqual(await refundPaymentIntentIfNeeded(stripe, 'pi_1', 'teste'), { refunded: true, newlyCreated: true });
    assert.equal(stripe.calls[0].reqOpts.idempotencyKey, 'vamo-auto-refund-pi_1');
});

test('estorno já existente (retry do webhook) → newlyCreated false, sem nova chamada', async () => {
    const { refundPaymentIntentIfNeeded } = await import('./payments');
    const stripe = fakeStripe({ existing: ['succeeded'] });
    assert.deepEqual(await refundPaymentIntentIfNeeded(stripe, 'pi_1', 'teste'), { refunded: true, newlyCreated: false });
    assert.equal(stripe.calls.length, 0);
});

test('chamada concorrente recebe resposta repetida do Stripe → newlyCreated false', async () => {
    const { refundPaymentIntentIfNeeded } = await import('./payments');
    const stripe = fakeStripe({ replayed: true });
    assert.deepEqual(await refundPaymentIntentIfNeeded(stripe, 'pi_1', 'teste'), { refunded: true, newlyCreated: false });
});

test('falha ao estornar → refunded false, sem e-mail', async () => {
    const { refundPaymentIntentIfNeeded } = await import('./payments');
    const stripe = fakeStripe({ createFails: true });
    assert.deepEqual(await refundPaymentIntentIfNeeded(stripe, 'pi_1', 'teste'), { refunded: false, newlyCreated: false });
});
