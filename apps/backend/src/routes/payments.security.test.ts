/**
 * Segurança de pagamentos: cobrança duplicada e idempotência do checkout.
 *
 *   cd apps/backend && npx tsx --test src/routes/payments.security.test.ts
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

test('mesmo comprador + mesmo roteiro na mesma janela → mesma chave de idempotência', async () => {
    const { checkoutIdempotencyKey, CHECKOUT_WINDOW_MS } = await import('./payments');
    const t0 = 1_800_000_000_000;
    const a = checkoutIdempotencyKey('trav_1', 'it_1', t0);
    const b = checkoutIdempotencyKey('trav_1', 'it_1', t0 + 60_000);
    assert.equal(a, b, 'dois cliques em 1 minuto devem reutilizar a sessão');
    const later = checkoutIdempotencyKey('trav_1', 'it_1', t0 + CHECKOUT_WINDOW_MS + 1);
    assert.notEqual(a, later, 'depois da janela, uma sessão nova');
});

test('chaves diferentes para outro comprador, outro roteiro ou nova tentativa', async () => {
    const { checkoutIdempotencyKey } = await import('./payments');
    const t0 = 1_800_000_000_000;
    const base = checkoutIdempotencyKey('trav_1', 'it_1', t0);
    assert.notEqual(base, checkoutIdempotencyKey('trav_2', 'it_1', t0));
    assert.notEqual(base, checkoutIdempotencyKey('trav_1', 'it_2', t0));
    assert.notEqual(base, checkoutIdempotencyKey('trav_1', 'it_1', t0, 1));
});

test('mesmo pagamento chegando de novo (webhook + tela de retorno) NÃO é duplicidade', async () => {
    const { isDuplicatePayment } = await import('./payments');
    assert.equal(isDuplicatePayment('pi_A', 'pi_A'), false);
});

test('segundo pagamento (outro PaymentIntent) de um roteiro já comprado É duplicidade', async () => {
    const { isDuplicatePayment } = await import('./payments');
    assert.equal(isDuplicatePayment('pi_A', 'pi_B'), true);
    assert.equal(isDuplicatePayment(null, 'pi_B'), true, 'venda antiga sem PaymentIntent salvo também é duplicidade');
});

test('sem PaymentIntent no pagamento recebido (grátis/legado) nunca estorna', async () => {
    const { isDuplicatePayment } = await import('./payments');
    assert.equal(isDuplicatePayment('pi_A', null), false);
    assert.equal(isDuplicatePayment('pi_A', undefined), false);
});
