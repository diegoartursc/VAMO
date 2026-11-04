/**
 * Etapa 2: visitante anônimo (contexto limpo, sem cookies/storage/token)
 * abre TODAS as rotas do app direto pela URL. Para cada uma registra:
 * redirecionamento, chamadas de API e seus status, e se algum dado pago ou
 * privado (marcadores PAID-SECRET-* / PRIVATE-SECRET-*, e-mails de teste)
 * aparece no HTML, na tela (mesmo por instantes) ou nas respostas da API.
 */
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const F = JSON.parse(fs.readFileSync(path.join(here, '../security/.fixtures.local.json'), 'utf8'));
const I = F.itineraries;
const API = process.env.AUDIT_API || 'http://localhost:4333';
const SECRET = /(PAID|PRIVATE)-SECRET-[A-Z0-9-]+|@audit\.vamo\.test/g;

const ROUTES = [
    // [rota, classe esperada]
    ['/', 'public'], ['/itineraries', 'public'], [`/itinerary/${I.A1}`, 'public-preview'], [`/itinerary/${I.A2_pending}`, 'private'],
    [`/itinerary/${I.B2_archived_bought_by_B}`, 'private'], [`/creator/${F.creatorA.creatorId}`, 'public'], ['/packages', 'public'],
    ['/login', 'public'], ['/register', 'public'], ['/forgot-password', 'public'], ['/reset-password', 'public'],
    ['/legal/terms', 'public'], ['/legal/privacy', 'public'], ['/about-vamo', 'public'], ['/how-it-works', 'public'], ['/help', 'public'],
    ['/help/contact-support', 'public'], ['/how-you-get-paid', 'public'], ['/verification-explained', 'public'],
    ['/cart', 'private'], ['/my-trips', 'private'], ['/profile', 'private'], ['/saved', 'private'],
    ['/account/notifications', 'private'], ['/account/personal-data', 'private'], ['/account/security', 'private'],
    [`/purchased-itinerary/${I.A1}`, 'private'], [`/purchased-itinerary/${I.B2_archived_bought_by_B}`, 'private'],
    ['/checkout/itinerary-confirm', 'private'], ['/checkout/itinerary-contact', 'private'], ['/checkout/itinerary-payment', 'private'],
    ['/checkout/contact', 'private'], ['/checkout/payment', 'private'], ['/booking-confirmed', 'private'],
    ['/created-itineraries', 'private'], [`/creator-itinerary/${I.A1}`, 'private'], ['/creator-earnings', 'private'],
    ['/creator-sales', 'private'], ['/creator-reviews', 'private'], ['/creator-questions', 'private'], ['/creator-settings', 'private'],
    ['/new-itinerary', 'private'], ['/become-creator', 'private'], ['/await-review', 'private'], ['/itinerary-preview', 'private'],
    ['/my-questions', 'private'], ['/my-reviews', 'private'], ['/write-review', 'private'],
    [`/availability/${I.A1}`, 'private'], [`/quote-details/${I.A1}`, 'private'], [`/purchased-package/${I.A1}`, 'private'],
    ['/booking-awaiting-quote', 'private'],
];

const out = [];
test.afterAll(() => {
    fs.mkdirSync(path.join(here, '../security/results'), { recursive: true });
    fs.writeFileSync(path.join(here, '../security/results/anonymous-browser.json'), JSON.stringify({ ranAt: new Date().toISOString(), routes: out }, null, 2));
});

for (const [route, expected] of ROUTES) {
    test(`anônimo ${route}`, async ({ browser }) => {
        const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
        const page = await context.newPage();
        const api = [];
        const leaks = new Set();
        page.on('response', async (res) => {
            if (!res.url().startsWith(API)) return;
            let body = '';
            try { body = await res.text(); } catch { /* binário ou cancelado */ }
            for (const m of body.match(SECRET) || []) leaks.add(`api:${m}`);
            api.push({ method: res.request().method(), path: new URL(res.url()).pathname.replace(/c[a-z0-9]{20,}/g, ':id'), status: res.status(), bytes: body.length });
        });
        // Registra o que aparece na tela A CADA quadro, para pegar dado privado
        // que pisca antes de um redirecionamento.
        await page.addInitScript(() => {
            window.__seen = new Set();
            const scan = () => { const t = document.body?.innerText || ''; for (const m of t.match(/(PAID|PRIVATE)-SECRET-[A-Z0-9-]+|@audit\.vamo\.test/g) || []) window.__seen.add(m); requestAnimationFrame(scan); };
            requestAnimationFrame(scan);
        });
        const nav = await page.goto(route, { waitUntil: 'load' });
        await page.waitForTimeout(4000);
        const html = await page.content();
        for (const m of html.match(SECRET) || []) leaks.add(`dom:${m}`);
        for (const m of await page.evaluate(() => [...(window.__seen || [])])) leaks.add(`tela:${m}`);
        const finalPath = new URL(page.url()).pathname;
        const text = (await page.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ').slice(0, 160);
        out.push({ route: route.replace(/c[a-z0-9]{20,}/g, ':id'), expected, httpStatus: nav?.status(), finalPath: finalPath.replace(/c[a-z0-9]{20,}/g, ':id'), redirected: finalPath !== route, apiCalls: api, leaks: [...leaks], screenText: text });
        await context.close();
        expect([...leaks], `dados privados visíveis para anônimo em ${route}`).toEqual([]);
    });
}
