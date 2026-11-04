/**
 * AUD-P3 — cache do catálogo público: serve do cache, limpa em qualquer
 * escrita bem-sucedida e nunca guarda resposta de rota privada.
 *
 *   cd apps/backend && npx tsx --import ./src/test/setup.ts --test src/security/aud-public-cache.test.ts
 */
import '../test/setup';
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createFakePrisma, startApp } from '../test/helpers';

process.env.PUBLIC_CATALOG_CACHE_MS = '60000';
const db = createFakePrisma();
(globalThis as any).prisma = db;
let catalogQueries = 0;
let title = 'Lisbon v1';
db.itinerary.findMany = async () => {
    catalogQueries++;
    return [{ id: 'it_1', title, destination: 'Lisbon', country: 'PT', description: 'd', price: 10, currency: 'USD', duration: 3, rating: null, reviewCount: 0,
        featured: false, highlights: [], inclusions: [], estimatedSpending: null, qualityScore: 1, status: 'ACTIVE', createdAt: new Date(), approvedAt: new Date(),
        categories: [], travelStyles: [], activeModules: [], extraCities: [], extraCountries: [], highlightPhotos: [], mediaUrls: [], images: [], _count: { sales: 0 },
        creator: { id: 'cr', verificationLevel: 'BASIC', averageRating: null, totalSales: 0, traveler: { name: 'C', avatar: null } } }];
};
let base = '';
let close: () => Promise<void>;
before(async () => { ({ base, close } = await startApp((await import('../app')).default)); });
after(async () => { await close(); });

test('AUD-P3: catálogo público vem do cache e é invalidado por escrita bem-sucedida', async () => {
    const a = await fetch(base + '/api/itineraries');
    const b = await fetch(base + '/api/itineraries');
    assert.equal(a.headers.get('x-cache'), 'MISS');
    assert.equal(b.headers.get('x-cache'), 'HIT');
    assert.equal(catalogQueries, 1, 'a segunda leitura não devia ir ao banco');
    // filtro diferente = chave diferente
    assert.equal((await fetch(base + '/api/itineraries?destination=Kyoto')).headers.get('x-cache'), 'MISS');

    // escrita que falha (401) NÃO limpa
    await fetch(base + '/api/itineraries', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
    assert.equal((await fetch(base + '/api/itineraries')).headers.get('x-cache'), 'HIT');

    // escrita bem-sucedida limpa (o webhook/aprovação passam pelo mesmo caminho)
    title = 'Lisbon v2';
    db.traveler.findFirst = async () => null;
    db.traveler.findUnique = async () => null;
    const w = await fetch(base + '/api/auth/traveler/forgot-password', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'nobody@test.local' }) });
    assert.ok(w.status < 400, `escrita de teste devia dar certo (${w.status})`);
    const c = await fetch(base + '/api/itineraries');
    assert.equal(c.headers.get('x-cache'), 'MISS');
    assert.ok((await c.text()).includes('Lisbon v2'), 'depois de limpar deve trazer o dado novo');
});

test('AUD-P3: rota privada nunca é servida do cache', async () => {
    const r = await fetch(base + '/api/itineraries/it_1/purchased');
    assert.equal(r.headers.get('x-cache'), null);
});
