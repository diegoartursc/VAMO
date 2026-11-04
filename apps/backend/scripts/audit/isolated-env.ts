/**
 * Ambiente ISOLADO para subir o backend durante a auditoria (testes de
 * navegador, API e carga). Carregado antes do app:
 *
 *   AUDIT_DATABASE_URL=postgresql://<user>@localhost:5432/vamo_audit \
 *   AUDIT_MODE=production PORT=4333 \
 *     npx tsx --import ./scripts/audit/isolated-env.ts src/index.ts
 *
 * - nunca lê o .env real;
 * - banco só pode ser local e vamo_audit*;
 * - Stripe com chave falsa e segredo de webhook local (os testes assinam os
 *   próprios eventos); Supabase e SMTP vazios;
 * - qualquer conexão de rede fora de localhost é bloqueada.
 */
import crypto from 'crypto';

const url = process.env.AUDIT_DATABASE_URL || '';
const u = (() => { try { return new URL(url); } catch { return null; } })();
if (!u || !['localhost', '127.0.0.1'].includes(u.hostname) || !/^\/vamo_audit\w*$/.test(u.pathname)) {
    console.error('[audit] Recusado: AUDIT_DATABASE_URL precisa ser localhost/vamo_audit*.');
    process.exit(1);
}

process.env.DOTENV_CONFIG_PATH = '/nonexistent/vamo-audit.env';
process.env.NODE_ENV = process.env.AUDIT_MODE === 'production' ? 'production' : 'development';
process.env.DATABASE_URL = url;
process.env.DIRECT_URL = url;
process.env.JWT_SECRET = process.env.AUDIT_JWT_SECRET || crypto.randomBytes(48).toString('base64');
process.env.STRIPE_SECRET_KEY = 'sk_test_audit_fake_key_never_valid';
process.env.STRIPE_WEBHOOK_SECRET = process.env.AUDIT_WEBHOOK_SECRET || 'whsec_audit_local_only';
process.env.PAYOUTS_ENABLED = 'false';
process.env.PUBLIC_BACKEND_URL = `http://localhost:${process.env.PORT || 4333}`;
process.env.ALLOWED_ORIGINS = process.env.AUDIT_ALLOWED_ORIGINS || 'http://localhost:8081';
for (const key of ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'SMTP_USER', 'SMTP_PASS', 'SMTP_HOST',
    'ADMIN_NOTIFICATION_EMAIL', 'ALLOW_DEMO_PURCHASES', 'ADMIN_SEED_SECRET']) process.env[key] = '';
for (const key of Object.keys(process.env)) if (/^(SUPABASE|SMTP|MAIL|SENTRY|RENDER)_/.test(key)) process.env[key] = '';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const net = require('net');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const tls = require('tls');
const local = (h: unknown) => h === undefined || h === null || h === '' || h === 'localhost' || h === '127.0.0.1' || h === '::1' || h === '::ffff:127.0.0.1';
const guard = (name: string, orig: (...a: any[]) => any) => function (this: any, ...args: any[]) {
    const f = args[0];
    if (typeof f === 'object' && f?.path && !f?.host) return orig.apply(this, args);
    const host = typeof f === 'object' && f !== null ? (f.host ?? f.hostname) : typeof args[1] === 'string' ? args[1] : undefined;
    if (!local(host)) throw new Error(`[audit] rede externa bloqueada (${name} → ${String(host)})`);
    return orig.apply(this, args);
};
net.connect = guard('net.connect', net.connect);
net.createConnection = guard('net.createConnection', net.createConnection);
tls.connect = guard('tls.connect', tls.connect);
const realFetch = globalThis.fetch;
globalThis.fetch = (async (input: any, init?: any) => {
    const target = typeof input === 'string' ? input : input?.url ?? String(input);
    if (!/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(target)) throw new Error(`[audit] rede externa bloqueada: ${target.split('?')[0]}`);
    return realFetch(input, init);
}) as typeof fetch;
console.log(`[audit] backend isolado: ${process.env.NODE_ENV}, banco ${u.hostname}${u.pathname}, rede externa bloqueada.`);
