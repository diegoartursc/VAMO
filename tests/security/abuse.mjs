#!/usr/bin/env node
/**
 * Abuso e entradas maliciosas (Etapa 5): upload disfarçado, travessia de
 * caminho em /uploads, força bruta no login, webhook falso, payloads grandes.
 *   AUDIT_API=http://localhost:4333 node tests/security/abuse.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const API = process.env.AUDIT_API || 'http://localhost:4333';
if (!/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(API)) { console.error('Recusado: só local.'); process.exit(2); }
const F = JSON.parse(fs.readFileSync(path.join(here, '.fixtures.local.json'), 'utf8'));
let ipn = 1;
const ip = () => `192.0.2.${(ipn++ % 250) + 1}`;
const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok, detail }); console.log(`${ok ? '✓' : '✗'} ${name}${detail ? ' · ' + detail : ''}`); };
async function req(method, url, { token, body, headers = {}, raw } = {}) {
    const r = await fetch(API + url, { method, redirect: 'manual', headers: { 'x-forwarded-for': headers['x-forwarded-for'] || ip(), ...(token ? { authorization: `Bearer ${token}` } : {}), ...(body && !raw ? { 'content-type': 'application/json' } : {}), ...headers }, body: raw ?? (body ? JSON.stringify(body) : undefined) });
    return { status: r.status, text: await r.text(), headers: r.headers };
}
const token = JSON.parse((await req('POST', '/api/auth/traveler/login', { body: { email: F.buyerA.email, password: F.buyerA.password } })).text).accessToken;

// Upload disfarçado
for (const [name, type, content] of [
    ['evil.jpg', 'image/jpeg', '<html><script>alert(1)</script></html>'],
    ['evil.svg', 'image/svg+xml', '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"/>'],
    ['evil.html', 'text/html', '<script>alert(1)</script>'],
    ['evil.pdf', 'application/pdf', '<script>alert(1)</script>'],
]) {
    const fd = new FormData();
    fd.append('file', new Blob([content], { type }), name);
    const r = await fetch(API + '/api/uploads', { method: 'POST', headers: { authorization: `Bearer ${token}`, 'x-forwarded-for': ip() }, body: fd });
    check(`Upload disfarçado recusado (${name})`, r.status >= 400 && r.status < 500, `status ${r.status}`);
}

// Travessia de caminho no servidor de arquivos
for (const p of ['/uploads/../package.json', '/uploads/..%2fpackage.json', '/uploads/%2e%2e/%2e%2e/.env', '/uploads/..%5c..%5c.env', '/uploads/%252e%252e/package.json']) {
    const r = await req('GET', p);
    check(`Travessia bloqueada ${p}`, r.status >= 400 && !/"name"\s*:\s*"/.test(r.text) && !/JWT_SECRET|DATABASE_URL/.test(r.text), `status ${r.status}`);
}

// Força bruta no login: mesmo IP e mesma conta
const fixedIp = '192.0.2.250';
let blockedAt = null;
for (let i = 1; i <= 30; i++) {
    const r = await req('POST', '/api/auth/traveler/login', { body: { email: F.buyerB.email, password: `wrong-${i}` }, headers: { 'x-forwarded-for': fixedIp } });
    if (r.status === 429) { blockedAt = i; break; }
}
check('Força bruta no login bloqueada (mesmo IP)', blockedAt !== null && blockedAt <= 21, `bloqueou na tentativa ${blockedAt}`);
let acctBlockedAt = null;
for (let i = 1; i <= 30; i++) {
    const r = await req('POST', '/api/auth/traveler/login', { body: { email: F.creatorB.email, password: `wrong-${i}` } }); // IP muda a cada tentativa
    if (r.status === 429) { acctBlockedAt = i; break; }
}
check('Força bruta distribuída (IPs diferentes) bloqueada por conta', acctBlockedAt !== null && acctBlockedAt <= 25, `bloqueou na tentativa ${acctBlockedAt}`);
let adminBlockedAt = null;
for (let i = 1; i <= 30; i++) {
    const r = await req('POST', '/api/admin/login', { body: { email: F.moderator.email, password: `wrong-${i}` } });
    if (r.status === 429) { adminBlockedAt = i; break; }
}
check('Força bruta no login admin bloqueada por conta', adminBlockedAt !== null && adminBlockedAt <= 21, `bloqueou na tentativa ${adminBlockedAt}`);

// Recuperação de senha: resposta neutra (não revela se o e-mail existe)
const known = await req('POST', '/api/auth/traveler/forgot-password', { body: { email: F.buyerA.email } });
const unknown = await req('POST', '/api/auth/traveler/forgot-password', { body: { email: 'nobody-here@audit.vamo.test' } });
check('Esqueci a senha não revela se a conta existe', known.status === unknown.status && known.text === unknown.text, `status ${known.status}/${unknown.status}`);
const login404 = await req('POST', '/api/auth/traveler/login', { body: { email: 'nobody-here@audit.vamo.test', password: 'whatever-123' } });
const loginWrong = await req('POST', '/api/auth/traveler/login', { body: { email: F.buyerA.email, password: 'whatever-123' } });
check('Login não revela se a conta existe', login404.status === loginWrong.status && login404.text === loginWrong.text, `status ${login404.status}/${loginWrong.status}`);

// Webhook: sem assinatura, assinatura errada, assinatura velha
const evt = JSON.stringify({ id: 'evt_audit_1', type: 'checkout.session.completed', data: { object: { id: 'cs_test_audit', payment_status: 'paid', metadata: { itineraryId: F.itineraries.B1, travelerId: F.buyerA.travelerId } } } });
const sign = (secret, ts, payload) => `t=${ts},v1=${crypto.createHmac('sha256', secret).update(`${ts}.${payload}`).digest('hex')}`;
let r = await req('POST', '/api/payments/webhook', { raw: evt, headers: { 'content-type': 'application/json' } });
check('Webhook sem assinatura recusado', r.status === 400, `status ${r.status}`);
r = await req('POST', '/api/payments/webhook', { raw: evt, headers: { 'content-type': 'application/json', 'stripe-signature': sign('whsec_wrong', Math.floor(Date.now() / 1000), evt) } });
check('Webhook com segredo errado recusado', r.status === 400, `status ${r.status}`);
r = await req('POST', '/api/payments/webhook', { raw: evt, headers: { 'content-type': 'application/json', 'stripe-signature': sign(process.env.AUDIT_WEBHOOK_SECRET || 'whsec_audit_local_only', Math.floor(Date.now() / 1000) - 3600, evt) } });
check('Webhook reenviado com assinatura velha (replay) recusado', r.status === 400, `status ${r.status}`);

// Corpo gigante
r = await req('POST', '/api/auth/traveler/login', { raw: JSON.stringify({ email: 'a'.repeat(2_000_000), password: 'x' }), headers: { 'content-type': 'application/json' } });
check('Corpo JSON gigante recusado sem derrubar', r.status === 413 || r.status === 400, `status ${r.status}`);
r = await req('GET', '/health');
check('Servidor segue no ar depois dos abusos', r.status === 200);

// Cabeçalhos de segurança da API
r = await req('GET', '/api/itineraries?limit=1');
const h = r.headers;
check('API envia cabeçalhos de segurança (helmet)', !!h.get('x-content-type-options') && !!h.get('strict-transport-security') && !h.get('x-powered-by'), `nosniff=${h.get('x-content-type-options')} hsts=${!!h.get('strict-transport-security')} x-powered-by=${h.get('x-powered-by')}`);
r = await req('OPTIONS', '/api/itineraries', { headers: { origin: 'https://evil.example', 'access-control-request-method': 'GET' } });
check('CORS recusa origem desconhecida', !r.headers.get('access-control-allow-origin'), `status ${r.status} allow-origin=${r.headers.get('access-control-allow-origin')}`);

const outDir = path.join(here, 'results'); fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'abuse.json'), JSON.stringify({ ranAt: new Date().toISOString(), results }, null, 2));
process.exit(results.every((x) => x.ok) ? 0 : 1);
