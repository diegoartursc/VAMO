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
    Object.assign(db.privateDocument, docs, {
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
    assert.equal(out.attractions[0].cost.proofFiles[0].url, 'https://legacy.example/old.jpg', 'legado não é tocado aqui (migração cuida)');
});
