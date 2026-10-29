/**
 * Fase 4 — campos de confiança só pelo admin (SEC-14).
 *
 *   cd apps/backend && npx tsx --import ./src/test/setup.ts --test src/security/phase4-trust.test.ts
 */
import '../test/setup';
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import { createFakePrisma, memoryTable, startApp, call } from '../test/helpers';

const db = createFakePrisma();
(globalThis as any).prisma = db;
const travelers = memoryTable<any>([]);
let base = '';
let close: () => Promise<void>;
let token = '';
let lastCreate: any = null;
let lastUpdate: any = null;
let lastAccommodationCost: any = null;

const proof = 'private-doc://doc_aaaaaa';
const approvedCost = { amount: '500', currency: 'USD', disclosureType: 'verified', sharedByPeople: 1, proofFiles: [{ url: proof }], proofStatus: 'approved' };

function existingItinerary() {
    return {
        id: 'it_1', creatorId: 'cr_1', status: 'ACTIVE', featured: false, title: 'T', destination: 'D', country: 'C', price: 10, duration: 1,
        images: [], days: [], accommodations: [{ id: 'h1', name: 'Hotel', cost: approvedCost, order: 0 }], transports: [], checklists: [],
        attractions: [], restaurants: [], extraSpendingItems: [], flightInfo: null, generalTips: [], highlightPhotos: [],
    };
}

before(async () => {
    travelers.rows.push({ id: 'trav_creator', email: 'creator@test.local', name: 'C', passwordHash: await bcrypt.hash('correct-horse-battery', 4) });
    Object.assign(db.traveler, { findFirst: travelers.findFirst, findUnique: travelers.findUnique });
    Object.assign(db.travelerSession, memoryTable<any>([]));
    db.creator.findUnique = async ({ where }: any) => (where?.travelerId === 'trav_creator' || where?.id === 'cr_1' ? { id: 'cr_1', travelerId: 'trav_creator' } : null);
    db.itinerary.create = async ({ data }: any) => { lastCreate = data; return { id: 'it_new', ...data }; };
    db.itinerary.findUnique = async () => existingItinerary();
    db.itinerary.update = async ({ data }: any) => { lastUpdate = data; return { id: 'it_1', ...data }; };
    db.privateDocument.findMany = async ({ where }: any) => where.id.in.map((id: string) => ({ id }));
    db.auditLog.create = async () => ({});
    for (const m of ['itineraryImage', 'itineraryDay', 'itineraryActivity', 'itineraryAccommodation', 'itineraryTransport', 'itineraryChecklist']) {
        Object.assign(db[m], { deleteMany: async () => ({ count: 0 }), createMany: async () => ({ count: 0 }), findMany: async () => [], create: async ({ data }: any) => { if (m === 'itineraryAccommodation') lastAccommodationCost = data.cost; return data; } });
    }
    const app = (await import('../app')).default;
    ({ base, close } = await startApp(app));
    token = (await call(base, 'POST', '/api/auth/traveler/login', { body: { email: 'creator@test.local', password: 'correct-horse-battery' } })).json.accessToken;
});
after(async () => { await close(); });

test('SEC-14: criador não consegue se colocar em destaque nem aprovar o próprio comprovante ao criar', async () => {
    const r = await call(base, 'POST', '/api/itineraries', {
        token,
        body: {
            title: 'T', destination: 'D', country: 'C', price: '10', duration: 1, status: 'DRAFT', featured: true,
            attractions: [{ name: 'A', cost: { ...approvedCost, amount: '20' } }],
            accommodations: [{ name: 'H', cost: { ...approvedCost, adminNote: 'forged' } }],
        },
    });
    assert.equal(r.status, 201, r.text);
    assert.equal(lastCreate.featured, false);
    assert.equal(lastCreate.attractions[0].cost.proofStatus, 'uploaded');
    const acc = lastCreate.accommodations.create[0].cost;
    assert.equal(acc.proofStatus, 'uploaded');
    assert.equal(acc.adminNote, undefined);
});

test('SEC-14: edição sem mudar valor nem arquivo mantém a aprovação do admin; mudar o valor invalida', async () => {
    const keep = await call(base, 'PUT', '/api/itineraries/it_1', { token, body: { status: 'DRAFT', accommodations: [{ name: 'Hotel', cost: { ...approvedCost } }], featured: true } });
    assert.equal(keep.status, 200, keep.text);
    assert.equal(lastAccommodationCost.proofStatus, 'approved');
    assert.equal(lastUpdate.featured, undefined, 'featured não pode ser gravado pelo criador');
    lastUpdate = null;
    const changed = await call(base, 'PUT', '/api/itineraries/it_1', { token, body: { status: 'DRAFT', accommodations: [{ name: 'Hotel', cost: { ...approvedCost, amount: '50' } }] } });
    assert.equal(changed.status, 200, changed.text);
    assert.equal(lastAccommodationCost.proofStatus, 'uploaded');
});

test('SEC-14: sem arquivo de comprovante o status é sempre none', async () => {
    const { enforceProofStatus } = await import('../lib/costProofs');
    const out: any = enforceProofStatus({ restaurants: [{ name: 'R', cost: { amount: '5', proofStatus: 'approved', proofFiles: [] } }] });
    assert.equal(out.restaurants[0].cost.proofStatus, 'none');
});

test('R-T1: copiar o bloco aprovado para outro item, duplicar ou renomear o hotel volta para revisão', async () => {
    const { enforceProofStatus } = await import('../lib/costProofs');
    const existing = { accommodations: [{ name: 'Hotel', cost: approvedCost }], attractions: [] };
    const out: any = enforceProofStatus({
        accommodations: [{ name: 'Hotel', cost: { ...approvedCost } }, { name: 'Hotel', cost: { ...approvedCost } }, { name: 'Other Hotel', cost: { ...approvedCost } }],
        attractions: [{ name: 'Museum', cost: { ...approvedCost } }],
        restaurants: [{ name: 'Hotel', cost: { ...approvedCost } }],
    }, existing);
    assert.deepEqual(out.accommodations.map((a: any) => a.cost.proofStatus), ['approved', 'uploaded', 'uploaded']);
    assert.equal(out.attractions[0].cost.proofStatus, 'uploaded');
    assert.equal(out.restaurants[0].cost.proofStatus, 'uploaded');
});
