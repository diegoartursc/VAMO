/**
 * Modelos de e-mail do mailer: escape, links via APP_BASE_URL, valores em
 * unidades da moeda e falha silenciosa sem SMTP.
 *
 * Roda via runner nativo do Node:
 *   cd apps/backend && npx tsx --test src/lib/mailer.test.ts
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import nodemailer from 'nodemailer';

process.env.SMTP_USER = 'vamoappviagens@gmail.com';
process.env.SMTP_PASS = 'fake';
process.env.APP_BASE_URL = 'https://app.exemplo.test/';
process.env.ADMIN_NOTIFICATION_EMAIL = 'admin@exemplo.test';

const outbox: any[] = [];
(nodemailer as any).createTransport = () => ({ sendMail: async (m: any) => { outbox.push(m); return {}; } });

const load = () => import('./mailer');
const last = () => outbox[outbox.length - 1];

test('formatMoney usa unidades da moeda, não centavos', async () => {
    const { formatMoney } = await load();
    assert.equal(formatMoney(29.9, 'aud'), '$29.90');
    assert.equal(formatMoney(null, 'aud'), null);
});

test('confirmação de compra: valor correto e link do roteiro comprado', async () => {
    const m = await load();
    await m.sendPurchaseConfirmationEmail({ to: 'a@x.test', name: 'Ana Paula', itineraryId: 'it_1', itineraryTitle: 'Japão', amount: 29.9, currency: 'AUD' });
    assert.match(last().html, /\$29\.90/);
    assert.ok(last().html.includes('https://app.exemplo.test/purchased-itinerary/it_1'));
    assert.match(last().text, /\$29\.90/);
});

test('conteúdo vindo do usuário é escapado no HTML', async () => {
    const m = await load();
    await m.sendItineraryRejectedEmail({ to: 'c@x.test', name: 'Carla', itineraryId: 'it_2', itineraryTitle: '<script>x</script>', reason: 'Faltam <b>fotos</b> & "custos"' });
    const html = last().html;
    assert.ok(!html.includes('<script>'));
    assert.ok(html.includes('&lt;script&gt;x&lt;/script&gt;'));
    assert.ok(html.includes('Faltam &lt;b&gt;fotos&lt;/b&gt; &amp; &quot;custos&quot;'));
});

test('venda ao roteirista: comissão e líquido', async () => {
    const m = await load();
    await m.sendCreatorSaleEmail({ to: 'c@x.test', name: 'Carla', itineraryTitle: 'Japão', price: 100, commission: 15, currency: 'AUD' });
    assert.ok(last().html.includes('$100.00'));
    assert.ok(last().html.includes('15%'));
    assert.ok(last().html.includes('$85.00'));
    assert.ok(last().html.includes('https://app.exemplo.test/creator-sales'));
});

test('e-mail ao admin vai para ADMIN_NOTIFICATION_EMAIL', async () => {
    const m = await load();
    await m.sendItinerarySubmittedForReviewEmail({ creatorName: 'Carla', itineraryId: 'it_3', itineraryTitle: 'Bali', destination: 'Ubud', country: 'Indonésia' });
    assert.equal(last().to, 'admin@exemplo.test');
    assert.match(last().subject, /^\[Admin\]/);
});

test('senha alterada nunca inclui senha e orienta o suporte', async () => {
    const m = await load();
    await m.sendPasswordChangedEmail({ to: 'a@x.test', name: 'Ana', changedAt: new Date('2026-09-24T12:00:00Z') });
    assert.match(last().html, /suporte/);
    assert.match(last().html, /Sydney/);
    assert.ok(!/senha:\s*\S/i.test(last().text));
});

test('todo e-mail tem HTML e texto, e nenhum link aponta para localhost', async () => {
    assert.ok(outbox.length > 0);
    for (const m of outbox) {
        assert.ok(m.html && m.text, m.subject);
        assert.ok(!/localhost/.test(m.html + m.text), m.subject);
    }
});

test('sem SMTP configurado: não lança, só retorna false', async () => {
    const m = await load();
    const pass = process.env.SMTP_PASS;
    delete process.env.SMTP_PASS;
    try {
        assert.equal(await m.sendWelcomeEmail('a@x.test', 'Ana'), false);
    } finally {
        process.env.SMTP_PASS = pass;
    }
});
