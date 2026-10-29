/**
 * Fase 4 — exclusão de conta de verdade (NEW-01).
 *
 *   cd apps/backend && npx tsx --import ./src/test/setup.ts --test src/security/phase4-account.test.ts
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
const deleted: string[] = [];
let base = '';
let close: () => Promise<void>;

before(async () => {
    const hash = await bcrypt.hash(PASSWORD, 4);
    travelers.rows.push(
        { id: 'trav_A', email: 'a@test.local', name: 'Alice Real', passwordHash: hash, avatar: 'https://x/a.jpg', creator: null },
        { id: 'trav_C', email: 'c@test.local', name: 'Creator', passwordHash: hash, creator: { id: 'cr_1' } },
    );
    Object.assign(db.traveler, { findFirst: travelers.findFirst, findUnique: travelers.findUnique, update: travelers.update });
    Object.assign(db.travelerSession, memoryTable<any>([]));
    db.review.updateMany = async () => ({ count: 0 });
    db.travelerFile.findMany = async () => [];
    db.purchaseHistory.updateMany = async () => { deleted.push('purchaseHistoryContact'); return { count: 0 }; };
    for (const m of ['travelerPersonalData', 'savedItem', 'notification', 'travelerChecklistItem', 'travelerFile', 'travelerItineraryCustomization', 'passwordResetToken', 'privateDocument']) {
        db[m].deleteMany = async () => { deleted.push(m); return { count: 0 }; };
    }
    // Vendas são registro financeiro: qualquer escrita nelas aqui é erro.
    db.itinerarySale.deleteMany = async () => { throw new Error('vendas não podem ser apagadas'); };
    const app = (await import('../app')).default;
    ({ base, close } = await startApp(app));
});
after(async () => { await close(); });

async function login(email: string) {
    return (await call(base, 'POST', '/api/auth/traveler/login', { body: { email, password: PASSWORD } })).json?.accessToken as string;
}

test('NEW-01: exclusão exige login e a senha correta', async () => {
    assert.equal((await call(base, 'POST', '/api/auth/traveler/delete-account', { body: { password: PASSWORD } })).status, 401);
    const token = await login('a@test.local');
    assert.equal((await call(base, 'POST', '/api/auth/traveler/delete-account', { token, body: { password: 'wrong' } })).status, 401);
    assert.equal(travelers.rows[0].name, 'Alice Real');
});

test('NEW-01: conta de criador vai para o suporte (não apaga sozinha)', async () => {
    const token = await login('c@test.local');
    const r = await call(base, 'POST', '/api/auth/traveler/delete-account', { token, body: { password: PASSWORD } });
    assert.equal(r.status, 409);
    assert.equal(r.json.code, 'CREATOR_ACCOUNT');
});

test('NEW-01: viajante é anonimizado, dados pessoais apagados, sessão encerrada e login antigo deixa de funcionar', async () => {
    const token = await login('a@test.local');
    const r = await call(base, 'POST', '/api/auth/traveler/delete-account', { token, body: { password: PASSWORD } });
    assert.equal(r.status, 200, r.text);
    const t = travelers.rows.find((x) => x.id === 'trav_A');
    assert.equal(t.name, 'Deleted user');
    assert.ok(!t.email.includes('a@test.local'));
    assert.equal(t.passwordHash, null);
    assert.equal(t.avatar, null);
    for (const m of ['travelerPersonalData', 'travelerFile', 'privateDocument', 'savedItem', 'purchaseHistoryContact']) assert.ok(deleted.includes(m), `${m} não foi apagado`);
    assert.equal((await call(base, 'GET', '/api/auth/traveler/me', { token })).status, 401, 'sessão continuou valendo');
    assert.equal((await call(base, 'POST', '/api/auth/traveler/login', { body: { email: 'a@test.local', password: PASSWORD } })).status, 401);
});
