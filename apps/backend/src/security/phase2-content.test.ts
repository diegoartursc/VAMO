/**
 * Fase 2 — conteúdo pago, comprovantes, estatísticas e arquivos legados
 * (SEC-02, SEC-03, SEC-04, SEC-05, NEW-04). App real + Prisma falso.
 *
 *   cd apps/backend && npx tsx --import ./src/test/setup.ts --test src/security/phase2-content.test.ts
 */
import '../test/setup';
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { createFakePrisma, memoryTable, startApp, call, findKeyDeep } from '../test/helpers';

const db = createFakePrisma();
(globalThis as any).prisma = db;

const PASSWORD = 'correct-horse-battery';
const SECRET_PROOF = 'https://storage.example/vamo-uploads/itineraries/boarding-pass-SECRET.pdf';
const COST_PROOF = 'https://storage.example/vamo-uploads/itineraries/receipt-SECRET.jpg';
const PAID_TIP = 'PAID-TIP: ask for the rooftop table';
const PAID_ACTIVITY = 'PAID-ACTIVITY: sunrise hike';
const PAID_HOTEL = 'PAID-HOTEL Waldorf';
const PAID_FILE = 'https://storage.example/vamo-uploads/itineraries/paid-guide.pdf';

const cost = (amount: string) => ({
    amount, currency: 'USD', disclosureType: 'verified', sharedByPeople: 1,
    proofFiles: [{ url: COST_PROOF, name: 'receipt.jpg' }], proofStatus: 'approved',
    notes: 'PAID cost note: ask for table 7', adminNote: 'INTERNAL rejection note',
});

function fullItinerary(status = 'ACTIVE', creatorTravelerId = 'trav_creator') {
    return {
        id: 'it_1', title: 'California', destination: 'LA', country: 'USA', status,
        creatorId: 'cr_1',
        creator: { id: 'cr_1', verificationLevel: 'BASIC', averageRating: 0, totalSales: 0, traveler: { id: creatorTravelerId, name: 'Ana', avatar: null } },
        description: 'desc', price: 26.9, currency: 'USD', rating: 0, reviewCount: 0, inclusions: [], duration: 2,
        featured: false, highlights: [], estimatedSpending: null, downloadCount: 0, subtitle: '', travelStyles: [],
        categories: [], productType: 'DIGITAL', activeModules: ['itinerario', 'dicas', 'hospedagem', 'passeios', 'checklist'],
        promoPrice: null, immediateAccess: true, lifetimeAccess: true, offlineDownload: true, allowPdf: false, allowShare: true,
        travelProofUrl: SECRET_PROOF, qualityScore: 80, approvalNote: 'INTERNAL admin note', approvedAt: new Date(),
        extraCities: [], extraCountries: [], tripStartDate: null, tripEndDate: null,
        flightInfo: { outbound: { airline: 'Delta', originCity: 'NYC' }, return: { airline: 'Delta', originCity: 'LA' }, tips: ['PAID flight tip'], cost: cost('300') },
        attractions: [{ name: 'Griffith', description: 'PAID attraction details', cost: cost('20') }],
        restaurants: [{ name: 'Secret Diner', location: 'Hidden st', cost: cost('40') }],
        generalTips: [PAID_TIP, 'second tip'],
        mediaUrls: [], highlightPhotos: [], spendingProfile: { receipts: [{ receiptUrl: COST_PROOF }] }, receiveList: null,
        extraSpendingItems: [{ id: 'x1', category: 'chip', title: 'SIM', description: '', value: '10', currency: 'USD', cost: cost('10') }],
        images: [{ url: 'https://storage.example/cover.jpg' }],
        days: [{ dayNumber: 1, title: 'Day 1', summary: '', description: 'PAID day description', activities: [{ id: 'a1', title: PAID_ACTIVITY, description: 'x' }] }],
        files: [{ id: 'f1', name: 'guide.pdf', type: 'pdf', url: PAID_FILE, size: 1 }],
        accommodations: [{ id: 'h1', name: PAID_HOTEL, cost: cost('500'), order: 0 }],
        transports: [{ id: 't1', description: 'PAID metro tip', passTypes: 'TAP', cost: cost('5'), order: 0 }],
        checklists: [{ id: 'c1', category: 'documentos', item: 'Passport', isDefault: false, order: 0 }],
        reviews: [], _count: { sales: 0 },
        sales: [{ id: 's1', price: 26.9 }],
        updatedAt: new Date(), createdAt: new Date(),
    };
}

const travelers = memoryTable<any>([]);
const sessions = memoryTable<any>([]);
let base = '';
let close: () => Promise<void>;
const PRIVATE_DIR = path.join(process.env.LOCAL_UPLOADS_DIR!, 'itineraries');
const PRIVATE_FILE = 'synthetic-private-test.pdf';
const PUBLIC_FILE = 'synthetic-public-test.jpg';

before(async () => {
    const hash = await bcrypt.hash(PASSWORD, 4);
    for (const [id, email] of [['trav_anon', 'x@test.local'], ['trav_buyer', 'buyer@test.local'], ['trav_creator', 'creator@test.local'], ['trav_other', 'other@test.local']]) {
        travelers.rows.push({ id, email, name: id, passwordHash: hash, avatar: null, coverUrl: null, bio: null, creator: null, personalData: null });
    }
    Object.assign(db.traveler, { findFirst: travelers.findFirst, findUnique: travelers.findUnique });
    Object.assign(db.travelerSession, sessions);

    db.itinerary.findUnique = async () => fullItinerary();
    db.itinerary.findMany = async () => [fullItinerary()];
    db.itinerarySale.findFirst = async ({ where }: any) =>
        where?.travelerId === 'trav_buyer' ? { id: 's1', price: 26.9, createdAt: new Date(), purchaseData: null } : null;
    db.creator.findUnique = async ({ where }: any) =>
        where?.travelerId === 'trav_creator' || where?.id === 'cr_1' ? { id: 'cr_1', travelerId: 'trav_creator' } : null;

    fs.mkdirSync(PRIVATE_DIR, { recursive: true });
    fs.writeFileSync(path.join(PRIVATE_DIR, PRIVATE_FILE), '%PDF-1.4 synthetic private');
    fs.writeFileSync(path.join(PRIVATE_DIR, PUBLIC_FILE), Buffer.from([0xff, 0xd8, 0xff, 0x00]));
    db.travelerFile.findFirst = async ({ where }: any) => {
        const url: string = where?.url?.endsWith ?? '';
        return url.endsWith(PRIVATE_FILE) ? { id: 'tf_legacy' } : null;
    };

    const app = (await import('../app')).default;
    ({ base, close } = await startApp(app));
});

after(async () => {
    fs.rmSync(path.join(PRIVATE_DIR, PRIVATE_FILE), { force: true });
    fs.rmSync(path.join(PRIVATE_DIR, PUBLIC_FILE), { force: true });
    await close();
});

async function tokenFor(email: string) {
    const r = await call(base, 'POST', '/api/auth/traveler/login', { body: { email, password: PASSWORD } });
    assert.equal(r.status, 200, r.text);
    return r.json.accessToken as string;
}

const PAID_MARKERS = ['PAID cost note', PAID_TIP, PAID_ACTIVITY, PAID_HOTEL, PAID_FILE, 'PAID day description', 'PAID attraction details', 'PAID metro tip', 'PAID flight tip', 'Secret Diner'];
const SECRET_MARKERS = [SECRET_PROOF, COST_PROOF, 'INTERNAL admin note', 'INTERNAL rejection note'];

function assertNoMarkers(body: string, markers: string[], label: string) {
    for (const m of markers) assert.ok(!body.includes(m), `${label}: vazou "${m}"`);
}

// ── SEC-02 ───────────────────────────────────────────────────────

test('SEC-02: detalhe público (anônimo e usuário sem compra) não entrega conteúdo pago', async () => {
    const anon = await call(base, 'GET', '/api/itineraries/it_1');
    assert.equal(anon.status, 200);
    assertNoMarkers(anon.text, PAID_MARKERS, 'anônimo');
    const other = await call(base, 'GET', '/api/itineraries/it_1', { token: await tokenFor('other@test.local') });
    assertNoMarkers(other.text, PAID_MARKERS, 'usuário B');
});

test('SEC-02: prévia continua útil (título, preço, módulos, contagens e custos)', async () => {
    const r = await call(base, 'GET', '/api/itineraries/it_1');
    assert.equal(r.json.title, 'California');
    assert.equal(r.json.price, 26.9);
    assert.deepEqual(r.json.activeModules, ['itinerario', 'dicas', 'hospedagem', 'passeios', 'checklist']);
    assert.equal(r.json.contentCounts?.itinerario, 1);
    assert.equal(r.json.contentCounts?.dicas, 2);
    assert.equal(r.json.contentCounts?.hospedagem, 1);
    assert.equal(r.json.accommodations?.[0]?.cost?.amount, '500', 'custo da hospedagem precisa continuar no resumo');
});

test('SEC-02: listagem e destaque não entregam conteúdo pago', async () => {
    for (const p of ['/api/itineraries', '/api/itineraries/featured']) {
        const r = await call(base, 'GET', p);
        assert.equal(r.status, 200, `${p} ${r.text.slice(0, 120)}`);
        assertNoMarkers(r.text, PAID_MARKERS.filter((m) => m !== PAID_HOTEL), p);
    }
});

test('SEC-02: comprador recebe o conteúdo completo; dono também', async () => {
    const buyer = await call(base, 'GET', '/api/itineraries/it_1/purchased', { token: await tokenFor('buyer@test.local') });
    assert.equal(buyer.status, 200, buyer.text);
    assert.ok(buyer.text.includes(PAID_TIP) && buyer.text.includes(PAID_ACTIVITY));
    const owner = await call(base, 'GET', '/api/itineraries/it_1/creator', { token: await tokenFor('creator@test.local') });
    assert.equal(owner.status, 200, owner.text);
    assert.ok(owner.text.includes(PAID_TIP));
});

// ── SEC-03 / NEW-04 ──────────────────────────────────────────────

test('SEC-03: comprovantes e nota interna não saem para anônimo, outro usuário nem comprador', async () => {
    const cases: Array<[string, string, string?]> = [
        ['anônimo', '/api/itineraries/it_1'],
        ['listagem', '/api/itineraries'],
        ['comprador', '/api/itineraries/it_1/purchased', 'buyer@test.local'],
    ];
    for (const [label, p, email] of cases) {
        const r = await call(base, 'GET', p, email ? { token: await tokenFor(email) } : {});
        assert.equal(r.status, 200, `${label}: ${r.status}`);
        assertNoMarkers(r.text, SECRET_MARKERS, label);
        assert.deepEqual(findKeyDeep(r.json, ['travelProofUrl', 'receiptUrl', 'approvalNote']), [], `${label}: chave privada presente`);
    }
});

test('SEC-03: snapshot antigo (com comprovante congelado) também sai limpo para o comprador', async () => {
    const original = db.itinerarySale.findFirst;
    db.itinerarySale.findFirst = async ({ where }: any) => where?.travelerId === 'trav_buyer'
        ? { id: 's1', price: 26.9, createdAt: new Date(), purchaseData: { routeSnapshot: { id: 'it_1', title: 'California', travelProofUrl: SECRET_PROOF, approvalNote: 'INTERNAL admin note', attractions: [{ name: 'Griffith', cost: cost('20') }] } } }
        : null;
    const token = await tokenFor('buyer@test.local');
    for (const p of ['/api/itineraries/it_1/purchased', '/api/route-customization/it_1/snapshot']) {
        const r = await call(base, 'GET', p, { token });
        assert.equal(r.status, 200, `${p}: ${r.text.slice(0, 100)}`);
        assertNoMarkers(r.text, SECRET_MARKERS, p);
    }
    db.itinerarySale.findFirst = original;
});

// ── SEC-04 ───────────────────────────────────────────────────────

test('SEC-04: estatísticas do criador exigem login e ignoram creatorId de terceiros', async () => {
    const anon = await call(base, 'GET', '/api/itineraries/dashboard/stats?creatorId=cr_1');
    assert.equal(anon.status, 401, `anônimo → ${anon.status}`);
    assert.ok(!anon.text.includes('California'));
    const other = await call(base, 'GET', '/api/itineraries/dashboard/stats?creatorId=cr_1', { token: await tokenFor('other@test.local') });
    assert.ok(!other.text.includes('California'), 'usuário B viu roteiro de outro criador');
    const owner = await call(base, 'GET', '/api/itineraries/dashboard/stats', { token: await tokenFor('creator@test.local') });
    assert.equal(owner.status, 200);
    assert.ok(owner.text.includes('California'), 'dono deve ver as próprias estatísticas');
});

test('AUD-01: painéis de vendas e avaliações do criador exigem login', async () => {
    for (const p of ['/api/itineraries/dashboard/sales', '/api/itineraries/dashboard/reviews']) {
        const anon = await call(base, 'GET', p);
        assert.equal(anon.status, 401, `${p} anônimo → ${anon.status}`);
    }
});

// ── SEC-05 ───────────────────────────────────────────────────────

test('SEC-05: arquivo privado legado não abre por variações de caminho', async () => {
    const variants = [
        `/uploads/itineraries/${PRIVATE_FILE}`,
        `/uploads/itineraries//${PRIVATE_FILE}`,
        `/uploads/%69tineraries/${PRIVATE_FILE}`,
        `/uploads/itineraries/%2e/${PRIVATE_FILE}`,
        `/uploads//itineraries/${PRIVATE_FILE}`,
        `/uploads/itineraries/${PRIVATE_FILE.replace('p', '%70')}`,
    ];
    for (const v of variants) {
        for (const method of ['GET', 'HEAD']) {
            const r = await call(base, method, v);
            assert.notEqual(r.status, 200, `${method} ${v} abriu o arquivo privado`);
            assert.ok(!r.text.includes('synthetic private'), `${method} ${v} devolveu o conteúdo`);
        }
    }
});

test('R-U3: nome em maiúsculas não burla a checagem (disco que não diferencia maiúsculas)', async () => {
    const original = db.travelerFile.findFirst;
    let seen: any = null;
    db.travelerFile.findFirst = async (args: any) => { seen = args.where.url; return original(args); };
    await call(base, 'GET', `/uploads/itineraries/${PRIVATE_FILE.toUpperCase()}`);
    db.travelerFile.findFirst = original;
    assert.equal(seen?.mode, 'insensitive');
});

test('SEC-05: arquivo público legítimo continua abrindo', async () => {
    const r = await call(base, 'GET', `/uploads/itineraries/${PUBLIC_FILE}`);
    assert.equal(r.status, 200);
});
