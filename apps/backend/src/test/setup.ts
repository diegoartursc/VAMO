/**
 * Ambiente isolado para os testes de segurança. Carregado ANTES de qualquer
 * módulo do app:
 *
 *   npx tsx --import ./src/test/setup.ts --test src/security/*.test.ts
 *
 * - nunca lê o .env real (dotenv aponta para um arquivo inexistente);
 * - banco aponta para uma porta fechada (qualquer acesso real falha);
 * - Stripe, Supabase e SMTP ficam sem chave;
 * - fetch para fora de localhost é bloqueado.
 */
process.env.DOTENV_CONFIG_PATH = '/nonexistent/vamo-test.env';
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-only-secret-not-used-anywhere-else-0123456789abcdef';
process.env.DATABASE_URL = 'postgresql://never:never@127.0.0.1:9/never_real_db';
for (const key of [
    'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY',
    'SMTP_USER', 'SMTP_PASS', 'SMTP_HOST', 'ADMIN_NOTIFICATION_EMAIL', 'ALLOWED_ORIGINS',
    'ALLOW_DEMO_PURCHASES', 'ADMIN_SEED_SECRET',
]) {
    delete process.env[key];
}

const realFetch = globalThis.fetch;
globalThis.fetch = (async (input: any, init?: any) => {
    const url = typeof input === 'string' ? input : input?.url ?? String(input);
    if (!/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(url)) {
        throw new Error(`[test] rede externa bloqueada: ${url.split('?')[0]}`);
    }
    return realFetch(input, init);
}) as typeof fetch;
