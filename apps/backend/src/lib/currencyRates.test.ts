/**
 * Cotação automática: conversão de formato, validação, provedor reserva, gravação
 * e intervalo de 24h. Prisma e rede falsos (nenhuma chamada real).
 *
 *   cd apps/backend && npx tsx --import ./src/test/setup.ts --test src/lib/currencyRates.test.ts
 */
import '../test/setup';
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createFakePrisma } from '../test/helpers';

const db = createFakePrisma();
(globalThis as any).prisma = db;

let row: any = null;
beforeEach(async () => {
    row = null;
    db.currencyRates.findUnique = async () => row;
    db.currencyRates.upsert = async ({ create, update }: any) => {
        row = row ? { ...row, ...update } : { ...create };
        return row;
    };
    (await import('./currencyRates')).clearRatesCache();
});

/** Resposta no formato da open.er-api.com: 1 USD = X moeda. */
const erApi = (rates: Record<string, number>) => ({ result: 'success', base_code: 'USD', rates: { USD: 1, ...rates } });
const allPerUsd = async () => {
    const { SUPPORTED_CURRENCIES } = await import('./currencyRates');
    const { DEFAULT_RATES_TO_BASE } = await import('@vamo/shared/itinerary');
    return Object.fromEntries(SUPPORTED_CURRENCIES.map((c) => [c, 1 / DEFAULT_RATES_TO_BASE[c]]));
};
const reply = (body: any, status = 200) => ({ ok: status < 400, status, json: async () => body });

test('converte "1 USD = X moeda" para "1 moeda = Y USD"', async () => {
    const { invertPerBase } = await import('./currencyRates');
    const r = invertPerBase({ CHF: 0.8, EUR: 0.9, JPY: 150, XXX: 3, BRL: 'abc' });
    assert.equal(r.CHF, 1.25);
    assert.equal(r.EUR, 1.11111);
    assert.equal(r.JPY, 0.00666667);
    assert.equal(r.XXX, undefined, 'moeda que o sistema não usa fica de fora');
    assert.equal(r.BRL, undefined, 'valor inválido é descartado');
});

test('sem nada no banco, usa as taxas padrão do código', async () => {
    const { getCurrentRates } = await import('./currencyRates');
    const info = await getCurrentRates();
    assert.equal(info.source, 'default');
    assert.equal(info.rates.USD, 1);
    assert.ok(info.rates.CHF > 0);
});

test('atualização grava no banco com a fonte e a data; CHF reflete a cotação do dia', async () => {
    const { refreshCurrencyRates, getCurrentRates } = await import('./currencyRates');
    const per = await allPerUsd();
    per.CHF = 0.8; // 1 USD = 0.8 CHF → 1 CHF = 1.25 USD
    const r = await refreshCurrencyRates(async () => reply(erApi(per)) as any);
    assert.equal(r.ok, true);
    assert.equal(r.source, 'open.er-api.com');
    const info = await getCurrentRates();
    assert.equal(info.rates.CHF, 1.25);
    assert.equal(info.source, 'api:open.er-api.com');
    assert.ok(info.fetchedAt);
});

test('primeira API fora do ar: usa a reserva', async () => {
    const { refreshCurrencyRates } = await import('./currencyRates');
    const per = await allPerUsd();
    const lower = Object.fromEntries(Object.entries(per).map(([k, v]) => [k.toLowerCase(), v]));
    const urls: string[] = [];
    const r = await refreshCurrencyRates(async (url: string) => {
        urls.push(url);
        return (url.includes('open.er-api') ? reply({}, 503) : reply({ date: '2026-11-06', usd: lower })) as any;
    });
    assert.equal(r.ok, true);
    assert.equal(r.source, 'fawazahmed0/currency-api');
    assert.equal(urls.length, 2);
});

test('resposta quebrada (poucas moedas ou salto absurdo) não é gravada; taxas anteriores continuam', async () => {
    const { refreshCurrencyRates, getCurrentRates, clearRatesCache } = await import('./currencyRates');
    const few = await refreshCurrencyRates(async () => reply(erApi({ CHF: 0.8 })) as any);
    assert.equal(few.ok, false);
    // Salto só conta contra uma cotação real anterior.
    const { DEFAULT_RATES_TO_BASE } = await import('@vamo/shared/itinerary');
    row = { id: 'current', base: 'USD', rates: { ...DEFAULT_RATES_TO_BASE }, source: 'api:open.er-api.com', fetchedAt: new Date() };
    clearRatesCache();
    const per = await allPerUsd();
    per.EUR = per.EUR * 1000; // EUR "cai" 1000x num dia
    const jump = await refreshCurrencyRates(async () => reply(erApi(per)) as any);
    assert.equal(jump.ok, false);
    assert.match(jump.error || '', /EUR jumped/);
    assert.equal(row.rates.EUR, DEFAULT_RATES_TO_BASE.EUR, 'nada foi gravado');
    assert.equal((await getCurrentRates()).source, 'api:open.er-api.com');
});

test('primeira busca substitui as taxas padrão (desatualizadas) sem ser barrada pela trava de salto', async () => {
    const { refreshCurrencyRates, getCurrentRates } = await import('./currencyRates');
    const per = await allPerUsd();
    per.IDR = 16500; // 1 USD = 16.500 IDR (cotação real), muito longe do padrão antigo
    const r = await refreshCurrencyRates(async () => reply(erApi(per)) as any);
    assert.equal(r.ok, true);
    assert.equal((await getCurrentRates()).rates.IDR, Number((1 / 16500).toPrecision(6)));
});

test('rede caída nas duas APIs: não lança erro e mantém as taxas', async () => {
    const { refreshCurrencyRates } = await import('./currencyRates');
    const r = await refreshCurrencyRates(async () => { throw new Error('ENOTFOUND'); });
    assert.equal(r.ok, false);
    assert.equal(row, null);
});

test('busca no máximo 1x por dia; correção do admin vale até a próxima busca diária', async () => {
    const { refreshIfStale, saveRates, clearRatesCache } = await import('./currencyRates');
    const per = await allPerUsd();
    let calls = 0;
    const fetcher = async () => { calls++; return reply(erApi(per)) as any; };
    const t0 = new Date('2026-11-06T12:00:00Z');
    row = { id: 'current', base: 'USD', rates: { CHF: 1.1 }, source: 'api:open.er-api.com', fetchedAt: new Date('2026-11-06T06:00:00Z') };
    clearRatesCache();
    assert.equal((await refreshIfStale(t0, fetcher) as any).skipped, true);
    assert.equal(calls, 0);
    await refreshIfStale(new Date('2026-11-07T07:00:00Z'), fetcher);
    assert.equal(calls, 1);
    await saveRates({ CHF: 1.3 }, 'admin', new Date('2026-11-07T08:00:00Z'));
    await refreshIfStale(new Date('2026-11-07T09:00:00Z'), fetcher);
    assert.equal(calls, 1, 'correção do admin não é sobrescrita na hora seguinte');
    await refreshIfStale(new Date('2026-11-08T08:30:00Z'), fetcher);
    assert.equal(calls, 2, 'no dia seguinte a cotação automática volta');
});
