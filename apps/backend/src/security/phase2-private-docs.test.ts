/**
 * Fase 2 — comprovantes privados (SEC-03, parte de armazenamento).
 *
 *   cd apps/backend && npx tsx --import ./src/test/setup.ts --test src/security/phase2-private-docs.test.ts
 */
import '../test/setup';
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import { createFakePrisma, memoryTable, startApp, call } from '../test/helpers';

const db = createFakePrisma();
(globalThis as any).prisma = db;

const PASSWORD = 'correct-horse-battery';
const travelers = memoryTable<any>([]);
const sessions = memoryTable<any>([]);
const docs = memoryTable<any>([]);
const admins = memoryTable<any>([]);
let base = '';
let close: () => Promise<void>;

before(async () => {
    const hash = await bcrypt.hash(PASSWORD, 4);
    travelers.rows.push(
        { id: 'trav_creator', email: 'creator@test.local', name: 'C', passwordHash: hash },
        { id: 'trav_other', email: 'other@test.local', name: 'O', passwordHash: hash },
    );
    Object.assign(db.traveler, { findFirst: travelers.findFirst, findUnique: travelers.findUnique });
    Object.assign(db.travelerSession, sessions);
    admins.rows.push({ id: 'adm_1', email: 'admin@test.local', name: 'Admin', passwordHash: hash, role: 'SUPER_ADMIN', active: true, sessionVersion: 0 });
    Object.assign(db.admin, admins, { count: async () => admins.rows.length });
    Object.assign(db.privateDocument, docs, {
        aggregate: async ({ where }: any) => {
            const mine = docs.rows.filter((d) => d.ownerTravelerId === where.ownerTravelerId);
            return { _count: { _all: mine.length }, _sum: { sizeBytes: mine.reduce((n, d) => n + d.sizeBytes, 0) } };
        },
        findMany: async ({ where }: any) => docs.rows.filter((d) =>
            where.id.in.includes(d.id) && (!where.ownerTravelerId || d.ownerTravelerId === where.ownerTravelerId)),
    });
    const app = (await import('../app')).default;
    ({ base, close } = await startApp(app));
});
after(async () => { await close(); });

async function tokenFor(email: string) {
    const r = await call(base, 'POST', '/api/auth/traveler/login', { body: { email, password: PASSWORD } });
    return r.json.accessToken as string;
}

async function uploadPdf(token: string | null, name = 'boarding-pass.pdf') {
    const fd = new FormData();
    fd.append('purpose', 'travelProof');
    fd.append('file', new Blob([Buffer.from('%PDF-1.4 synthetic boarding pass')], { type: 'application/pdf' }), name);
    const res = await fetch(`${base}/api/private-docs`, {
        method: 'POST', body: fd, headers: token ? { authorization: `Bearer ${token}` } : {},
    });
    const json: any = await res.json().catch(() => null);
    return { status: res.status, json };
}

test('SEC-03: upload de comprovante exige login e vai para o armazenamento privado', async () => {
    assert.equal((await uploadPdf(null)).status, 401);
    const up = await uploadPdf(await tokenFor('creator@test.local'));
    assert.equal(up.status, 201);
    assert.match(up.json.ref, /^private-doc:\/\//);
    assert.ok(!/storage|supabase|vamo-uploads/i.test(up.json.url), 'não pode ser URL pública de bucket');
    assert.equal(docs.rows.length, 1);
});

test('SEC-03: comprovante só abre com link assinado válido e do mesmo documento', async () => {
    const up = await uploadPdf(await tokenFor('creator@test.local'), 'proof-2.pdf');
    const signed = new URL(up.json.url);
    const ok = await call(base, 'GET', signed.pathname + signed.search);
    assert.equal(ok.status, 200);
    assert.ok(ok.text.includes('synthetic boarding pass'));
    const noToken = await call(base, 'GET', signed.pathname);
    assert.equal(noToken.status, 401);
    const other = await uploadPdf(await tokenFor('creator@test.local'), 'proof-3.pdf');
    const otherToken = new URL(other.json.url).searchParams.get('token')!;
    const swapped = await call(base, 'GET', `${signed.pathname}?token=${encodeURIComponent(otherToken)}`);
    assert.equal(swapped.status, 401, 'token de outro documento abriu este');
    const access = await tokenFor('creator@test.local');
    const withAccess = await call(base, 'GET', `${signed.pathname}?token=${encodeURIComponent(access)}`);
    assert.equal(withAccess.status, 401, 'token de sessão não pode abrir documento');
});

test('SEC-03: ao salvar roteiro, comprovante de outra pessoa é descartado e o próprio vira referência canônica', async () => {
    const { canonicalizeDocRefs } = await import('../lib/privateDocs');
    const mine = await uploadPdf(await tokenFor('creator@test.local'), 'mine.pdf');
    const theirs = await uploadPdf(await tokenFor('other@test.local'), 'theirs.pdf');
    const body = {
        travelProofUrl: theirs.json.url,
        accommodations: [{ name: 'H', cost: { amount: '1', disclosureType: 'verified', proofFiles: [{ url: mine.json.url }, { url: theirs.json.ref }] } }],
        attractions: [{ name: 'A', cost: { proofFiles: [{ url: 'https://legacy.example/old.jpg' }] } }],
    };
    const out: any = await canonicalizeDocRefs(body, 'trav_creator');
    assert.equal(out.travelProofUrl, '', 'comprovante alheio precisa sair');
    assert.deepEqual(out.accommodations[0].cost.proofFiles.map((f: any) => f.url), [mine.json.ref]);
    assert.equal(out.attractions[0].cost.proofFiles.length, 0, 'URL pública nova não entra como comprovante');
    const legacy: any = await canonicalizeDocRefs(body, 'trav_creator', new Set(['https://legacy.example/old.jpg']));
    assert.equal(legacy.attractions[0].cost.proofFiles[0].url, 'https://legacy.example/old.jpg', 'legado já gravado continua (até a migração)');
});

test('Cota de armazenamento de comprovantes por dono', async () => {
    for (let i = 0; i < 60; i++) docs.rows.push({ id: `quota_${i}`, ownerTravelerId: 'trav_other', sizeBytes: 10 });
    const r = await uploadPdf(await tokenFor('other@test.local'), 'over.pdf');
    assert.equal(r.status, 413);
});

test('R-08: falha do banco no upload privado responde 500 (sem rejeição solta)', async () => {
    const token = await tokenFor('creator@test.local');
    const unhandled: unknown[] = [];
    const onUnhandled = (e: unknown) => unhandled.push(e);
    process.on('unhandledRejection', onUnhandled);
    const original = { aggregate: db.privateDocument.aggregate, create: db.privateDocument.create };
    try {
        db.privateDocument.aggregate = async () => { throw new Error('synthetic aggregate failure'); };
        assert.equal((await uploadPdf(token, 'agg.pdf')).status, 500);
        db.privateDocument.aggregate = original.aggregate;
        db.privateDocument.create = async () => { throw new Error('synthetic create failure'); };
        const before = docs.rows.length;
        assert.equal((await uploadPdf(token, 'create.pdf')).status, 500);
        assert.equal(docs.rows.length, before);
        await new Promise((r) => setImmediate(r));
        assert.equal(unhandled.length, 0, 'nenhuma rejeição não tratada');
    } finally {
        Object.assign(db.privateDocument, original);
        process.off('unhandledRejection', onUnhandled);
    }
    assert.equal((await uploadPdf(token, 'after.pdf')).status, 201, 'upload volta a funcionar');
});

test('R-05: recibo dos gastos manuais também é comprovante privado', async () => {
    const { canonicalizeDocRefs, existingProofRefs } = await import('../lib/privateDocs');
    const mine = await uploadPdf(await tokenFor('creator@test.local'), 'receipt.pdf');
    const body = {
        estimatedSpending: {
            manualEntries: [
                { label: 'Taxi', receiptUrl: mine.json.url },
                { label: 'Museum', receiptUrl: 'https://bucket.example/public/receipt.jpg' },
                { label: 'Lunch', receiptUrl: '' },
            ],
        },
    };
    const out: any = await canonicalizeDocRefs(body, 'trav_creator');
    assert.deepEqual(out.estimatedSpending.manualEntries.map((e: any) => e.receiptUrl), [mine.json.ref, '', '']);
    // Recibo público já gravado continua só até a migração.
    const stored = existingProofRefs({ estimatedSpending: body.estimatedSpending });
    const legacy: any = await canonicalizeDocRefs(body, 'trav_creator', stored);
    assert.equal(legacy.estimatedSpending.manualEntries[1].receiptUrl, 'https://bucket.example/public/receipt.jpg');
});

test('Link novo do comprovante: só o dono recebe, e o link abre o arquivo', async () => {
    db.privateDocument.findFirst = docs.findFirst;
    const owner = await tokenFor('creator@test.local');
    const up = await uploadPdf(owner, 'fresh.pdf');
    const id = up.json.ref.replace('private-doc://', '');
    assert.equal((await call(base, 'GET', `/api/private-docs/link/${id}`)).status, 401);
    assert.equal((await call(base, 'GET', `/api/private-docs/link/${id}`, { token: await tokenFor('other@test.local') })).status, 404);
    const r = await call(base, 'GET', `/api/private-docs/link/${id}`, { token: owner });
    assert.equal(r.status, 200);
    const fresh = new URL(r.json.url);
    const open = await call(base, 'GET', fresh.pathname + fresh.search);
    assert.equal(open.status, 200);
    assert.ok(open.text.includes('synthetic boarding pass'));
});

test('Link novo do comprovante pelo painel admin: exige admin', async () => {
    const up = await uploadPdf(await tokenFor('creator@test.local'), 'admin-view.pdf');
    const id = up.json.ref.replace('private-doc://', '');
    const traveler = await tokenFor('creator@test.local');
    assert.equal((await call(base, 'GET', `/api/admin/private-docs/link/${id}`, { token: traveler })).status, 401);
    const admin = (await call(base, 'POST', '/api/admin/login', { body: { email: 'admin@test.local', password: PASSWORD } })).json.token as string;
    assert.equal((await call(base, 'GET', '/api/admin/private-docs/link/doc_missing', { token: admin })).status, 404);
    const r = await call(base, 'GET', `/api/admin/private-docs/link/${id}`, { token: admin });
    assert.equal(r.status, 200, r.text);
    const fresh = new URL(r.json.url);
    assert.equal((await call(base, 'GET', fresh.pathname + fresh.search)).status, 200);
});
