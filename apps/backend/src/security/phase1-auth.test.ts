/**
 * Fase 1 — tokens, sessões e admin (SEC-01, SEC-06, SEC-07, SEC-10, NEW-02).
 * Usa o app Express REAL numa porta local e um Prisma falso em memória.
 *
 *   cd apps/backend && npx tsx --import ./src/test/setup.ts --test src/security/phase1-auth.test.ts
 */
// Primeiro import: isola o ambiente (sem .env real, sem rede externa).
import '../test/setup';
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { createFakePrisma, memoryTable, startApp, call } from '../test/helpers';

const db = createFakePrisma();
(globalThis as any).prisma = db;

const PASSWORD = 'correct-horse-battery';
const travelers = memoryTable<any>([]);
const sessions = memoryTable<any>([]);
const resetTokens = memoryTable<any>([]);
const admins = memoryTable<any>([]);
const travelerFiles = memoryTable<any>([]);

let base = '';
let close: () => Promise<void>;
let unhandled: unknown[] = [];
const onUnhandled = (r: unknown) => { unhandled.push(r); };

before(async () => {
    const hash = await bcrypt.hash(PASSWORD, 4);
    travelers.rows.push(
        { id: 'trav_A', email: 'a@test.local', name: 'Alice', passwordHash: hash, avatar: null, coverUrl: null, bio: null, passwordChangedAt: null, creator: null, personalData: null },
        { id: 'trav_B', email: 'b@test.local', name: 'Bob', passwordHash: hash, avatar: null, coverUrl: null, bio: null, passwordChangedAt: null, creator: null, personalData: null },
    );
    admins.rows.push({ id: 'adm_1', email: 'admin@test.local', name: 'Admin', passwordHash: hash, role: 'SUPER_ADMIN', active: true, sessionVersion: 0 });
    travelerFiles.rows.push(
        { id: 'file_A', travelerId: 'trav_A', content: Buffer.from('%PDF-1.4 A'), url: 'private://postgres', mimeType: 'application/pdf', originalFileName: 'a.pdf', title: 'A' },
        { id: 'file_B', travelerId: 'trav_B', content: Buffer.from('%PDF-1.4 B'), url: 'private://postgres', mimeType: 'application/pdf', originalFileName: 'b.pdf', title: 'B' },
    );

    Object.assign(db.traveler, {
        findFirst: travelers.findFirst, findUnique: travelers.findUnique, update: travelers.update,
    });
    Object.assign(db.travelerSession, sessions);
    Object.assign(db.passwordResetToken, resetTokens);
    Object.assign(db.admin, admins, { count: async () => admins.rows.length });
    Object.assign(db.travelerFile, { findFirst: travelerFiles.findFirst });

    process.on('unhandledRejection', onUnhandled);
    const app = (await import('../app')).default;
    ({ base, close } = await startApp(app));
});

after(async () => {
    process.off('unhandledRejection', onUnhandled);
    await close();
});

async function login(email = 'a@test.local') {
    const r = await call(base, 'POST', '/api/auth/traveler/login', { body: { email, password: PASSWORD } });
    assert.equal(r.status, 200, `login falhou: ${r.text}`);
    return r.json as { accessToken: string; refreshToken: string };
}

// ── Fluxo legítimo ───────────────────────────────────────────────

test('login → /me funciona com o access token', async () => {
    const { accessToken } = await login();
    const me = await call(base, 'GET', '/api/auth/traveler/me', { token: accessToken });
    assert.equal(me.status, 200);
    assert.equal(me.json.traveler.id, 'trav_A');
});

test('refresh válido devolve novo access E novo refresh (rotação)', async () => {
    const { refreshToken } = await login();
    const r = await call(base, 'POST', '/api/auth/traveler/refresh', { body: { refreshToken } });
    assert.equal(r.status, 200, r.text);
    assert.ok(r.json.accessToken);
    assert.ok(r.json.refreshToken, 'refresh precisa ser rotacionado');
    assert.notEqual(r.json.refreshToken, refreshToken);
    const me = await call(base, 'GET', '/api/auth/traveler/me', { token: r.json.accessToken });
    assert.equal(me.status, 200);
});

// ── SEC-01: confusão de tokens ───────────────────────────────────

test('SEC-01: token de arquivo NÃO serve como sessão (Bearer)', async () => {
    const { generatePrivateFileToken } = await import('../lib/auth');
    const fileToken = generatePrivateFileToken({ fileId: 'file_A', travelerId: 'trav_A' });
    for (const path of ['/api/auth/traveler/me', '/api/my-trips', '/api/saved-items']) {
        const r = await call(base, 'GET', path, { token: fileToken });
        assert.equal(r.status, 401, `${path} aceitou token de arquivo`);
    }
    const patch = await call(base, 'PATCH', '/api/auth/traveler/me', { token: fileToken, body: { name: 'Hacked' } });
    assert.equal(patch.status, 401);
});

test('SEC-01: refresh token NÃO serve como access token', async () => {
    const { refreshToken } = await login();
    const r = await call(base, 'GET', '/api/auth/traveler/me', { token: refreshToken });
    assert.equal(r.status, 401);
});

test('SEC-01: access token e token de arquivo NÃO renovam sessão no /refresh', async () => {
    const { accessToken } = await login();
    const { generatePrivateFileToken } = await import('../lib/auth');
    const fileToken = generatePrivateFileToken({ fileId: 'file_A', travelerId: 'trav_A' });
    for (const t of [accessToken, fileToken]) {
        const r = await call(base, 'POST', '/api/auth/traveler/refresh', { body: { refreshToken: t } });
        assert.equal(r.status, 401);
    }
});

test('SEC-01: token legado sem finalidade, segredo errado e alg none são recusados', async () => {
    const legacy = jwt.sign({ travelerId: 'trav_A', email: 'a@test.local' }, process.env.JWT_SECRET!, { expiresIn: '1h' });
    const wrong = jwt.sign({ travelerId: 'trav_A', typ: 'access' }, 'outro-segredo', { expiresIn: '1h' });
    const none = jwt.sign({ travelerId: 'trav_A', typ: 'access' }, '', { algorithm: 'none' as any });
    for (const t of [legacy, wrong, none, 'lixo.lixo.lixo']) {
        const r = await call(base, 'GET', '/api/auth/traveler/me', { token: t });
        assert.equal(r.status, 401);
    }
});

test('SEC-01: token de viajante não acessa admin e token de admin não acessa conta de viajante', async () => {
    const { accessToken } = await login();
    const adminRoute = await call(base, 'GET', '/api/admin/travelers', { token: accessToken });
    assert.equal(adminRoute.status, 401);
    const adminLogin = await call(base, 'POST', '/api/admin/login', { body: { email: 'admin@test.local', password: PASSWORD } });
    assert.equal(adminLogin.status, 200, adminLogin.text);
    const me = await call(base, 'GET', '/api/auth/traveler/me', { token: adminLogin.json.token });
    assert.equal(me.status, 401);
});

test('SEC-01: link de arquivo abre só o próprio arquivo', async () => {
    const { generatePrivateFileToken } = await import('../lib/auth');
    const tokenA = generatePrivateFileToken({ fileId: 'file_A', travelerId: 'trav_A' });
    const ok = await call(base, 'GET', `/api/trip-center/files/file_A/content?token=${encodeURIComponent(tokenA)}`);
    assert.equal(ok.status, 200);
    const other = await call(base, 'GET', `/api/trip-center/files/file_B/content?token=${encodeURIComponent(tokenA)}`);
    assert.equal(other.status, 401);
    const { accessToken } = await login();
    const asAccess = await call(base, 'GET', `/api/trip-center/files/file_A/content?token=${encodeURIComponent(accessToken)}`);
    assert.equal(asAccess.status, 401, 'access token não pode abrir arquivo');
});

// ── SEC-07: revogação ────────────────────────────────────────────

test('SEC-07: logout revoga o access e o refresh no servidor', async () => {
    const { accessToken, refreshToken } = await login();
    const out = await call(base, 'POST', '/api/auth/traveler/logout', { token: accessToken });
    assert.equal(out.status, 200, out.text);
    assert.equal((await call(base, 'GET', '/api/auth/traveler/me', { token: accessToken })).status, 401);
    assert.equal((await call(base, 'POST', '/api/auth/traveler/refresh', { body: { refreshToken } })).status, 401);
});

test('SEC-07: redefinir senha derruba access e refresh emitidos antes', async () => {
    const { accessToken, refreshToken } = await login('b@test.local');
    const crypto = await import('crypto');
    const raw = 'reset-token-for-tests-0123456789abcdef';
    resetTokens.rows.push({ id: 'rt_1', travelerId: 'trav_B', tokenHash: crypto.createHash('sha256').update(raw).digest('hex'), expiresAt: new Date(Date.now() + 3600_000) });
    const reset = await call(base, 'POST', '/api/auth/traveler/reset-password', { body: { token: raw, password: 'new-password-123' } });
    assert.equal(reset.status, 200, reset.text);
    assert.equal((await call(base, 'GET', '/api/auth/traveler/me', { token: accessToken })).status, 401, 'access antigo continuou valendo');
    assert.equal((await call(base, 'POST', '/api/auth/traveler/refresh', { body: { refreshToken } })).status, 401);
    travelers.rows.find((t) => t.id === 'trav_B').passwordHash = await bcrypt.hash(PASSWORD, 4);
});

test('SEC-07: refresh reutilizado é detectado e derruba a sessão inteira', async () => {
    const { refreshToken } = await login();
    const first = await call(base, 'POST', '/api/auth/traveler/refresh', { body: { refreshToken } });
    assert.equal(first.status, 200);
    const replay = await call(base, 'POST', '/api/auth/traveler/refresh', { body: { refreshToken } });
    assert.equal(replay.status, 401, 'refresh antigo foi aceito de novo');
    const afterReuse = await call(base, 'GET', '/api/auth/traveler/me', { token: first.json.accessToken });
    assert.equal(afterReuse.status, 401, 'reuso deveria encerrar a sessão');
});

test('SEC-07: refresh simultâneo com o mesmo token só gera uma sessão válida', async () => {
    const { refreshToken } = await login();
    const [a, b] = await Promise.all([
        call(base, 'POST', '/api/auth/traveler/refresh', { body: { refreshToken } }),
        call(base, 'POST', '/api/auth/traveler/refresh', { body: { refreshToken } }),
    ]);
    const ok = [a, b].filter((r) => r.status === 200);
    assert.ok(ok.length <= 1, 'dois refresh do mesmo token foram aceitos');
});

// ── SEC-06 / SEC-07 / SEC-10: admin ─────────────────────────────

test('SEC-06: mock-admin-token não é aceito em nenhum ambiente', async () => {
    for (const ip of ['127.0.0.1', '10.0.0.5']) {
        const r = await call(base, 'GET', '/api/admin/travelers', { token: 'mock-admin-token', headers: { 'x-forwarded-for': ip } });
        assert.equal(r.status, 401);
    }
    assert.equal(admins.rows.length, 1, 'nenhum admin novo pode ser criado');
});

test('SEC-10: login admin com tipos errados responde 400 e não gera rejeição solta', async () => {
    unhandled = [];
    for (const body of [{ email: 'admin@test.local', password: {} }, { email: ['x'], password: 'a' }, {}, { email: 'x'.repeat(5000), password: 'a' }]) {
        const r = await call(base, 'POST', '/api/admin/login', { body });
        assert.equal(r.status, 400, `corpo ${JSON.stringify(body).slice(0, 60)} → ${r.status}`);
    }
    await new Promise((r) => setTimeout(r, 50));
    assert.equal(unhandled.length, 0, 'houve unhandledRejection');
    const health = await call(base, 'GET', '/health');
    assert.equal(health.status, 200);
});

test('SEC-10: falha do banco no login admin vira 500 tratado', async () => {
    unhandled = [];
    const original = db.admin.findUnique;
    db.admin.findUnique = async () => { throw new Error('db down'); };
    const r = await call(base, 'POST', '/api/admin/login', { body: { email: 'admin@test.local', password: PASSWORD } });
    db.admin.findUnique = original;
    assert.equal(r.status, 500);
    await new Promise((res) => setTimeout(res, 50));
    assert.equal(unhandled.length, 0);
});

test('SEC-07: troca de senha do admin (sessionVersion) derruba o token emitido antes', async () => {
    const login1 = await call(base, 'POST', '/api/admin/login', { body: { email: 'admin@test.local', password: PASSWORD } });
    assert.equal(login1.status, 200);
    db.admin.findMany = async () => [];
    db.traveler.findMany = async () => [];
    const ok = await call(base, 'GET', '/api/admin/travelers', { token: login1.json.token });
    assert.equal(ok.status, 200, ok.text);
    admins.rows[0].sessionVersion += 1;
    const revoked = await call(base, 'GET', '/api/admin/travelers', { token: login1.json.token });
    assert.equal(revoked.status, 401);
});

test('SEC-07: logout do admin invalida o token', async () => {
    const l = await call(base, 'POST', '/api/admin/login', { body: { email: 'admin@test.local', password: PASSWORD } });
    const out = await call(base, 'POST', '/api/admin/logout', { token: l.json.token });
    assert.equal(out.status, 200, out.text);
    const r = await call(base, 'GET', '/api/admin/travelers', { token: l.json.token });
    assert.equal(r.status, 401);
});

// ── SEC-06: webhook e compra demonstrativa ───────────────────────

test('SEC-06: webhook sem assinatura é recusado fora de produção também', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_fake_never_used_on_network';
    db.itinerarySale.findFirst = async () => { throw new Error('webhook sem assinatura chegou ao fulfillment'); };
    const noSecret = await call(base, 'POST', '/api/payments/webhook', {
        body: { type: 'checkout.session.completed', data: { object: { id: 'cs_fake', payment_status: 'paid', metadata: { itineraryId: 'it_1', travelerId: 'trav_A' } } } },
    });
    assert.ok(noSecret.status >= 400, `sem segredo → ${noSecret.status}`);
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_only';
    const forged = await call(base, 'POST', '/api/payments/webhook', {
        headers: { 'stripe-signature': 't=1,v1=deadbeef' },
        body: { type: 'checkout.session.completed', data: { object: { id: 'cs_fake', payment_status: 'paid', metadata: { itineraryId: 'it_1', travelerId: 'trav_A' } } } },
    });
    assert.equal(forged.status, 400);
    delete process.env.STRIPE_WEBHOOK_SECRET;
    delete process.env.STRIPE_SECRET_KEY;
    const r = await call(base, 'POST', '/api/payments/webhook', {
        body: { type: 'checkout.session.completed', data: { object: { id: 'cs_fake', metadata: { itineraryId: 'it_1', travelerId: 'trav_A' } } } },
    });
    assert.ok(r.status >= 400, `webhook sem Stripe configurado → ${r.status}`);
});

test('SEC-06: compra demonstrativa não libera roteiro fora de teste explícito', async () => {
    const { accessToken } = await login();
    db.itinerary.findUnique = async () => { throw new Error('não deveria nem consultar o roteiro'); };
    const r = await call(base, 'POST', '/api/itineraries/it_1/purchase', { token: accessToken, body: { paymentMethod: 'demo' } });
    assert.ok([403, 404, 410, 503].includes(r.status), `compra demo → ${r.status}`);
});

// ── NEW-02: força bruta ──────────────────────────────────────────

test('NEW-02: login de viajante limita tentativas erradas por e-mail', async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 12; i++) {
        const r = await call(base, 'POST', '/api/auth/traveler/login', { body: { email: 'bruteforce@test.local', password: `wrong-${i}` } });
        statuses.push(r.status);
    }
    assert.ok(statuses.includes(429), `nenhum 429 em 12 tentativas: ${statuses.join(',')}`);
});

test('NEW-02: login de admin limita tentativas erradas', async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 12; i++) {
        const r = await call(base, 'POST', '/api/admin/login', { body: { email: 'nobody@test.local', password: `wrong-${i}` } });
        statuses.push(r.status);
    }
    assert.ok(statuses.includes(429), `nenhum 429 em 12 tentativas: ${statuses.join(',')}`);
});
