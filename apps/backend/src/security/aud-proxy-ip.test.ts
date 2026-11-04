/**
 * AUD-03 — IP do visitante atrás de Cloudflare + Render.
 * Cadeia real: visitante → Cloudflare → balanceador do Render → app.
 * O X-Forwarded-For chega como "visitante, ip-da-cloudflare" e a conexão vem
 * do balanceador. Com 1 salto confiável o app usava o IP da Cloudflare (que
 * muda a cada pedido), e o limite de tentativas não seguia o visitante.
 *
 *   cd apps/backend && npx tsx --import ./src/test/setup.ts --test src/security/aud-proxy-ip.test.ts
 */
import '../test/setup';
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createFakePrisma, startApp } from '../test/helpers';

process.env.TRUST_PROXY_HOPS = '2';
(globalThis as any).prisma = createFakePrisma();
let base = '';
let close: () => Promise<void>;
before(async () => { ({ base, close } = await startApp((await import('../app')).default)); });
after(async () => { await close(); });

const remaining = async (xff: string) => {
    const r = await fetch(base + '/api/itineraries/featured', { headers: { 'x-forwarded-for': xff } });
    return Number(r.headers.get('ratelimit-remaining'));
};

test('AUD-03: o limite segue o visitante mesmo com o IP da Cloudflare mudando', async () => {
    const a = await remaining('203.0.113.10, 104.16.0.1');
    const b = await remaining('203.0.113.10, 104.16.0.2');
    const c = await remaining('203.0.113.10, 172.64.0.9');
    assert.equal(b, a - 1, `mesmo visitante, borda diferente: ${a} → ${b}`);
    assert.equal(c, b - 1, `mesmo visitante, outra borda: ${b} → ${c}`);
});

test('AUD-03: X-Forwarded-For forjado pelo visitante não troca o IP usado no limite', async () => {
    const a = await remaining('203.0.113.20, 104.16.0.1');
    const forged = await remaining('198.51.100.99, 203.0.113.20, 104.16.0.3');
    assert.equal(forged, a - 1, `forjar o cabeçalho deu um contador novo (${a} → ${forged})`);
});
