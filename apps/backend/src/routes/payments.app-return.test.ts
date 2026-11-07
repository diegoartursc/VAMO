/**
 * Compra iniciada no app Android/iOS: as URLs de retorno da Stripe levam `app=1`,
 * para a página web devolver a pessoa ao app. No site, nada muda.
 *
 *   cd apps/backend && npx tsx --import ./src/test/setup.ts --test src/routes/payments.app-return.test.ts
 */
import '../test/setup';
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import { createFakePrisma, memoryTable, startApp, call } from '../test/helpers';

const db = createFakePrisma();
(globalThis as any).prisma = db;
const PASSWORD = 'correct-horse-battery';
const created: any[] = [];
let base = '';
let close: () => Promise<void>;

before(async () => {
    const travelers = memoryTable<any>([
        { id: 'trav_A', email: 'a@test.local', name: 'Alice', passwordHash: await bcrypt.hash(PASSWORD, 4), creator: null },
    ]);
    Object.assign(db.traveler, { findFirst: travelers.findFirst, findUnique: travelers.findUnique });
    Object.assign(db.travelerSession, memoryTable<any>([]));
    db.itinerary.findUnique = async () => ({
        id: 'it_1', title: 'Synthetic trip', destination: 'Lisbon', country: 'Portugal', price: 19.9, currency: 'USD', status: 'ACTIVE',
    });
    db.itinerarySale.findFirst = async () => null;
    const payments = await import('./payments');
    payments.setStripeClientForTests({
        checkout: { sessions: { create: async (params: any) => { created.push(params); return { id: `cs_${created.length}`, url: 'https://checkout.stripe.test/x' }; } } },
    } as any);
    const app = (await import('../app')).default;
    ({ base, close } = await startApp(app));
});
after(async () => {
    (await import('./payments')).setStripeClientForTests(null);
    await close();
});

async function checkout(body: any) {
    const login = await call(base, 'POST', '/api/auth/traveler/login', { body: { email: 'a@test.local', password: PASSWORD } });
    const r = await call(base, 'POST', '/api/payments/checkout-session', { token: login.json.accessToken, body });
    assert.equal(r.status, 200, r.text);
    return created[created.length - 1];
}

test('app nativo (returnTo=app): success_url e cancel_url levam app=1', async () => {
    const params = await checkout({ itineraryId: 'it_1', returnTo: 'app' });
    assert.match(params.success_url, /\/checkout\/itinerary-confirm\?session_id=\{CHECKOUT_SESSION_ID\}&itineraryId=it_1&app=1$/);
    assert.match(params.cancel_url, /canceled=true&itineraryId=it_1&app=1$/);
});

test('site (sem returnTo ou valor desconhecido): URLs de retorno sem app=1', async () => {
    for (const body of [{ itineraryId: 'it_1' }, { itineraryId: 'it_1', returnTo: 'evil://x' }]) {
        const params = await checkout(body);
        assert.ok(!params.success_url.includes('app=1'), params.success_url);
        assert.ok(!params.cancel_url.includes('app=1'), params.cancel_url);
    }
});
