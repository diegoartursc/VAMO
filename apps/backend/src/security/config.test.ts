/**
 * Validação de configuração antes de subir (SEC-06, NEW-08).
 *   cd apps/backend && npx tsx --import ./src/test/setup.ts --test src/security/config.test.ts
 */
import '../test/setup';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { collectConfigProblems } from '../lib/config';

const strong = 'x'.repeat(48);
const prodBase = { NODE_ENV: 'production', JWT_SECRET: strong, DATABASE_URL: 'postgresql://u:p@db.example:5432/x', ALLOWED_ORIGINS: 'https://app.example' };

test('produção com segredo publicado no repositório não sobe', () => {
    const r = collectConfigProblems({ ...prodBase, JWT_SECRET: 'bXTbleAdvChOal97Un3x1MGO4YYX1FZtLohF7QOIApw=' });
    assert.ok(r.fatal.some((m) => m.includes('publicado')));
});

test('segredo curto não sobe em nenhum ambiente', () => {
    assert.ok(collectConfigProblems({ ...prodBase, JWT_SECRET: 'curto' }).fatal.length > 0);
    assert.ok(collectConfigProblems({ NODE_ENV: 'development', JWT_SECRET: 'curto' }).fatal.length > 0);
});

test('compra demonstrativa ligada fora de teste não sobe', () => {
    assert.ok(collectConfigProblems({ ...prodBase, ALLOW_DEMO_PURCHASES: 'true' }).fatal.length > 0);
    assert.ok(collectConfigProblems({ NODE_ENV: 'development', JWT_SECRET: strong, ALLOW_DEMO_PURCHASES: 'true' }).fatal.length > 0);
});

test('Stripe sem segredo de webhook em produção não sobe; chave live fora de produção não sobe', () => {
    assert.ok(collectConfigProblems({ ...prodBase, STRIPE_SECRET_KEY: 'sk_test_x' }).fatal.length > 0);
    assert.ok(collectConfigProblems({ NODE_ENV: 'development', JWT_SECRET: strong, STRIPE_SECRET_KEY: 'sk_live_x' }).fatal.length > 0);
});

test('configuração de produção correta sobe sem erro', () => {
    const r = collectConfigProblems({ ...prodBase, STRIPE_SECRET_KEY: 'sk_live_x', STRIPE_WEBHOOK_SECRET: 'whsec_x' });
    assert.deepEqual(r.fatal, []);
});
