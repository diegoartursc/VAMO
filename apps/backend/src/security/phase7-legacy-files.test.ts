/**
 * Fase 7 — cópia legada de arquivo privado não pode ficar pública (R-13).
 * Se a remoção do disco falhar, o registro continua e o guard de /uploads segue bloqueando.
 *
 *   cd apps/backend && npx tsx --import ./src/test/setup.ts --test src/security/phase7-legacy-files.test.ts
 */
import '../test/setup';
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { createFakePrisma, memoryTable, startApp, call } from '../test/helpers';
import { LOCAL_UPLOADS_ROOT } from '../lib/storage';

const db = createFakePrisma();
(globalThis as any).prisma = db;
const PASSWORD = 'correct-horse-battery';
const travelers = memoryTable<any>([]);
const files = memoryTable<any>([]);
let base = '';
let close: () => Promise<void>;

const legacyDir = path.join(LOCAL_UPLOADS_ROOT, 'itineraries');
const legacyFile = (name: string) => path.join(legacyDir, name);
const realRm = fs.promises.rm;
let failRmFor: string | null = null;

function writeLegacy(name: string) {
    fs.mkdirSync(legacyDir, { recursive: true });
    fs.writeFileSync(legacyFile(name), '%PDF-1.4 synthetic private passport');
    files.rows.push({
        id: `file_${name}`, travelerId: 'trav_A', itineraryId: 'it_1', saleId: 'sale_1',
        url: `/uploads/itineraries/${name}`,
    });
}

before(async () => {
    const hash = await bcrypt.hash(PASSWORD, 4);
    travelers.rows.push({ id: 'trav_A', email: 'a@test.local', name: 'Alice', passwordHash: hash, creator: null });
    Object.assign(db.traveler, { findFirst: travelers.findFirst, findUnique: travelers.findUnique, update: travelers.update });
    Object.assign(db.travelerSession, memoryTable<any>([]));
    db.itinerarySale.findFirst = async ({ where }: any) =>
        where.travelerId === 'trav_A' && where.itineraryId === 'it_1' ? { id: 'sale_1' } : null;
    db.travelerFile.findFirst = async ({ where }: any) => files.rows.find((f) =>
        where.id ? f.id === where.id && f.travelerId === where.travelerId
            : where.url?.endsWith && f.url.toLowerCase().endsWith(where.url.endsWith.toLowerCase())) ?? null;
    db.travelerFile.findMany = async ({ where }: any) => files.rows.filter((f) => f.travelerId === where.travelerId);
    db.travelerFile.deleteMany = async ({ where }: any) => {
        const keep = files.rows.filter((f) => !(f.travelerId === where.travelerId && (!where.id || f.id === where.id)));
        const count = files.rows.length - keep.length;
        files.rows.splice(0, files.rows.length, ...keep);
        return { count };
    };
    db.review.updateMany = async () => ({ count: 0 });
    db.purchaseHistory.updateMany = async () => ({ count: 0 });
    for (const m of ['travelerPersonalData', 'savedItem', 'notification', 'travelerChecklistItem', 'travelerItineraryCustomization', 'passwordResetToken', 'privateDocument']) {
        db[m].deleteMany = async () => ({ count: 0 });
    }
    (fs.promises as any).rm = async (p: string, opts: any) => {
        if (failRmFor && p === legacyFile(failRmFor)) {
            throw Object.assign(new Error('EACCES: synthetic permission denied'), { code: 'EACCES' });
        }
        return realRm(p, opts);
    };
    const app = (await import('../app')).default;
    ({ base, close } = await startApp(app));
});
after(async () => {
    (fs.promises as any).rm = realRm;
    await close();
});

const login = async () =>
    (await call(base, 'POST', '/api/auth/traveler/login', { body: { email: 'a@test.local', password: PASSWORD } })).json?.accessToken as string;

test('R-13: remoção do disco falha → registro fica e a URL antiga continua bloqueada', async () => {
    writeLegacy('passport-a.pdf');
    const token = await login();
    assert.equal((await call(base, 'GET', '/uploads/itineraries/passport-a.pdf')).status, 404);

    failRmFor = 'passport-a.pdf';
    const del = await call(base, 'DELETE', '/api/trip-center/it_1/files/file_passport-a.pdf', { token });
    assert.equal(del.status, 500);
    assert.ok(files.rows.some((f) => f.id === 'file_passport-a.pdf'), 'registro não pode sumir antes do arquivo');
    assert.equal((await call(base, 'GET', '/uploads/itineraries/passport-a.pdf')).status, 404, 'arquivo ficou público');

    failRmFor = null;
    const retry = await call(base, 'DELETE', '/api/trip-center/it_1/files/file_passport-a.pdf', { token });
    assert.equal(retry.status, 200, retry.text);
    assert.ok(!fs.existsSync(legacyFile('passport-a.pdf')));
    assert.equal((await call(base, 'GET', '/uploads/itineraries/passport-a.pdf')).status, 404);
});

test('R-13: exclusão de conta com falha no disco não apaga nada e não expõe o arquivo', async () => {
    writeLegacy('visa-a.pdf');
    const token = await login();
    failRmFor = 'visa-a.pdf';
    const r = await call(base, 'POST', '/api/auth/traveler/delete-account', { token, body: { password: PASSWORD } });
    assert.equal(r.status, 500);
    assert.equal(travelers.rows[0].name, 'Alice', 'conta não pode ser anonimizada pela metade');
    assert.ok(files.rows.some((f) => f.id === 'file_visa-a.pdf'));
    assert.equal((await call(base, 'GET', '/uploads/itineraries/visa-a.pdf')).status, 404);

    failRmFor = null;
    const ok = await call(base, 'POST', '/api/auth/traveler/delete-account', { token, body: { password: PASSWORD } });
    assert.equal(ok.status, 200, ok.text);
    assert.ok(!fs.existsSync(legacyFile('visa-a.pdf')));
    assert.equal(files.rows.length, 0);
});
