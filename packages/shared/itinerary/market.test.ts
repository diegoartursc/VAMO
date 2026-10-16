/**
 * Testes da configuração central de mercado (market.ts).
 * `npx tsx --test packages/shared/itinerary/market.test.ts`
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BASE_CURRENCY, BASE_LOCALE, BASE_CURRENCY_SYMBOL, DEFAULT_RATES_TO_BASE, formatMoney } from './index';

test('moeda-base do mercado é USD e vale 1 na tabela de taxas', () => {
    assert.equal(BASE_CURRENCY, 'USD');
    assert.equal(BASE_LOCALE, 'en-US');
    assert.equal(BASE_CURRENCY_SYMBOL, '$');
    assert.equal(DEFAULT_RATES_TO_BASE[BASE_CURRENCY], 1);
});

test('todas as taxas padrão são números positivos e AUD vale menos que 1 USD', () => {
    for (const [code, rate] of Object.entries(DEFAULT_RATES_TO_BASE)) {
        assert.ok(Number.isFinite(rate) && rate > 0, code);
    }
    assert.ok(DEFAULT_RATES_TO_BASE.AUD > 0.5 && DEFAULT_RATES_TO_BASE.AUD < 0.8);
});

test('formatMoney sem moeda usa a moeda-base; roteiros antigos em AUD continuam com A$', () => {
    assert.equal(formatMoney(29.9), '$29.90');
    assert.equal(formatMoney(29.9, 'AUD'), 'A$ 29.90');
});
