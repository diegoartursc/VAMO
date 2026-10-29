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
// Uploads locais dos testes vão para uma pasta temporária, nunca para o projeto.
// eslint-disable-next-line @typescript-eslint/no-var-requires
process.env.LOCAL_UPLOADS_DIR = require('fs').mkdtempSync(require('path').join(require('os').tmpdir(), 'vamo-test-uploads-'));
for (const key of [
    'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY',
    'SMTP_USER', 'SMTP_PASS', 'SMTP_HOST', 'ADMIN_NOTIFICATION_EMAIL', 'ALLOWED_ORIGINS',
    'ALLOW_DEMO_PURCHASES', 'ADMIN_SEED_SECRET',
]) {
    // Vazio (e não `delete`): o @prisma/client carrega o .env real ao ser
    // importado e só preenche variáveis que NÃO existem.
    process.env[key] = '';
}
for (const key of Object.keys(process.env)) {
    if (/^(SUPABASE|STRIPE|SMTP|MAIL|SENTRY|RENDER)_/.test(key)) process.env[key] = '';
}

// Bloqueio de rede em todos os níveis (fetch, http/https, net/tls): só localhost.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const net = require('net');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const tls = require('tls');
const isLocalHost = (host: unknown) => host === undefined || host === null || host === '' ||
    host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '::ffff:127.0.0.1';
const guard = (name: string, original: (...a: any[]) => any) => function (this: any, ...args: any[]) {
    const first = args[0];
    const host = typeof first === 'object' && first !== null ? (first.host ?? first.hostname) : typeof args[1] === 'string' ? args[1] : undefined;
    if (typeof first === 'object' && first?.path && !first?.host) return original.apply(this, args); // socket unix (IPC)
    if (!isLocalHost(host)) throw new Error(`[test] rede externa bloqueada (${name} → ${String(host)})`);
    return original.apply(this, args);
};
net.connect = guard('net.connect', net.connect);
net.createConnection = guard('net.createConnection', net.createConnection);
tls.connect = guard('tls.connect', tls.connect);

const realFetch = globalThis.fetch;
globalThis.fetch = (async (input: any, init?: any) => {
    const url = typeof input === 'string' ? input : input?.url ?? String(input);
    if (!/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(url)) {
        throw new Error(`[test] rede externa bloqueada: ${url.split('?')[0]}`);
    }
    return realFetch(input, init);
}) as typeof fetch;
