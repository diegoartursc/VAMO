/**
 * Garante que os testes de segurança nunca alcançam serviços reais.
 *   cd apps/backend && npx tsx --import ./src/test/setup.ts --test src/security/isolation.test.ts
 */
import '../test/setup';
import { test } from 'node:test';
import assert from 'node:assert/strict';

test('chaves reais nunca ficam disponíveis, mesmo depois de importar o Prisma e o app', async () => {
    (globalThis as any).prisma = {};
    await import('@prisma/client');
    await import('../app');
    for (const key of ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'SMTP_USER', 'SMTP_PASS']) {
        assert.equal(process.env[key] || '', '', `${key} vazou para o teste`);
    }
    assert.match(process.env.DATABASE_URL || '', /127\.0\.0\.1:9\//);
});

test('conexão de rede externa é bloqueada (fetch, https e tls)', async () => {
    await assert.rejects(fetch('https://example.com/'));
    const https = await import('https');
    assert.throws(() => https.request('https://example.com/').end());
    const tls = await import('tls');
    assert.throws(() => tls.connect(443, 'example.com'));
});
