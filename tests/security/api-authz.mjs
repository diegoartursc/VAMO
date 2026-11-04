#!/usr/bin/env node
/**
 * Matriz de autorização da API (Etapas 2 e 3 da auditoria).
 *
 * Chama cada endpoint como: anônimo, token inválido, token expirado, token de
 * outra finalidade, comprador A/B, roteirista A/B, moderador e admin.
 * Para cada chamada confere (1) se o status bate com o esperado e (2) se a
 * resposta vaza marcadores PAID-SECRET-* / PRIVATE-SECRET-* que aquele papel
 * não deveria ver.
 *
 * Só contra o backend ISOLADO (scripts/audit/isolated-env.ts):
 *   AUDIT_API=http://localhost:4333 AUDIT_JWT_SECRET=... node tests/security/api-authz.mjs
 *
 * Endpoints que ALTERAM dados só são chamados com papéis que devem ser
 * recusados; os fixtures são recriados no fim por quem roda a suíte.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const API = process.env.AUDIT_API || 'http://localhost:4333';
if (!/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(API)) { console.error('Recusado: AUDIT_API precisa ser localhost.'); process.exit(2); }
const F = JSON.parse(fs.readFileSync(path.join(here, '.fixtures.local.json'), 'utf8'));
const SECRET = process.env.AUDIT_JWT_SECRET || '';
const I = F.itineraries;

// ── tokens ───────────────────────────────────────────────────────────
const b64u = (b) => Buffer.from(b).toString('base64url');
function craft(type, claims, expSecondsFromNow) {
    const key = crypto.createHmac('sha256', SECRET).update(`vamo-jwt:v2:${type}`).digest();
    const now = Math.floor(Date.now() / 1000);
    const head = b64u(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const body = b64u(JSON.stringify({ ...claims, typ: type, iat: now - 7200, exp: now + expSecondsFromNow, iss: 'vamo-api', aud: `vamo:${type}` }));
    const sig = crypto.createHmac('sha256', key).update(`${head}.${body}`).digest('base64url');
    return `${head}.${body}.${sig}`;
}
let ipSeq = 1;
const nextIp = () => `198.51.100.${(ipSeq++ % 250) + 1}`; // TEST-NET-2: cada chamada como um cliente diferente
async function json(method, url, { token, body, headers = {} } = {}) {
    headers = { 'x-forwarded-for': nextIp(), ...headers };
    const res = await fetch(API + url, {
        method, headers: { ...(body !== undefined ? { 'content-type': 'application/json' } : {}), ...(token ? { authorization: `Bearer ${token}` } : {}), ...headers },
        body: body !== undefined ? JSON.stringify(body) : undefined, redirect: 'manual',
    });
    const text = await res.text();
    return { status: res.status, text };
}
async function loginTraveler(k) {
    const r = await json('POST', '/api/auth/traveler/login', { body: { email: F[k].email, password: F[k].password } });
    if (r.status !== 200) throw new Error(`login ${k} falhou: ${r.status}`);
    return JSON.parse(r.text);
}
async function loginAdmin(k) {
    const r = await json('POST', '/api/admin/login', { body: { email: F[k].email, password: F[k].password } });
    if (r.status !== 200) throw new Error(`login ${k} falhou: ${r.status}`);
    return JSON.parse(r.text).token;
}

const T = {};
const sessions = {};
for (const k of ['buyerA', 'buyerB', 'creatorA', 'creatorB']) { sessions[k] = await loginTraveler(k); T[k] = sessions[k].accessToken; }
T.admin = await loginAdmin('admin');
T.moderator = await loginAdmin('moderator');
T.anon = null;
T.garbage = 'not-a-jwt';
T.forgedNoSig = `${b64u(JSON.stringify({ alg: 'none', typ: 'JWT' }))}.${b64u(JSON.stringify({ travelerId: F.buyerB.travelerId, sid: 'x', typ: 'access', iss: 'vamo-api', aud: 'vamo:access', exp: 9e9 }))}.`;
const sidA = JSON.parse(Buffer.from(T.buyerA.split('.')[1], 'base64url').toString()).sid;
T.expired = SECRET ? craft('access', { travelerId: F.buyerA.travelerId, email: F.buyerA.email, sid: sidA }, -60) : null;
T.refreshAsAccess = sessions.buyerA.refreshToken;          // token de outra finalidade
T.adminTokenAsTraveler = T.admin;                            // token admin em rota de viajante

const NEG = ['anon', 'garbage', 'forgedNoSig', 'expired', 'refreshAsAccess'];
const ALL_TRAVELERS = ['buyerA', 'buyerB', 'creatorA', 'creatorB'];
const ADMINS = ['admin', 'moderator'];

// ── casos ────────────────────────────────────────────────────────────
// allow: papéis que devem receber 2xx. deny: papéis que devem receber 401/403/404.
// leakOk: marcadores que cada papel PODE ver (o resto é vazamento).
const paidOf = (tag) => [`PAID-SECRET-TIP-${tag}`, `PAID-SECRET-ATTRACTION-${tag}`, `PAID-SECRET-RESTAURANT-${tag}`, `PAID-SECRET-DAY-`, `PAID-SECRET-ACTIVITY-`];
const cases = [
    // Público
    { name: 'Catálogo público', m: 'GET', u: '/api/itineraries?limit=50', allow: ['anon', ...ALL_TRAVELERS, 'garbage', 'expired'] },
    { name: 'Destaques', m: 'GET', u: '/api/itineraries/featured', allow: ['anon', 'buyerA'] },
    { name: 'Destinos', m: 'GET', u: '/api/destinations', allow: ['anon'] },
    { name: 'Roteiristas (lista)', m: 'GET', u: '/api/creators', allow: ['anon'], forbidText: [F.creatorA.email, F.creatorB.email, 'stripeAccountId', 'passwordHash'] },
    { name: 'Roteirista (perfil)', m: 'GET', u: `/api/creators/${F.creatorA.creatorId}`, allow: ['anon'], forbidText: [F.creatorA.email, 'passwordHash', 'stripeAccountId'] },
    { name: 'Roteirista por viajante', m: 'GET', u: `/api/creators/by-traveler/${F.creatorA.travelerId}`, allow: ['anon'], forbidText: [F.creatorA.email, 'passwordHash'] },
    { name: 'Recomendados', m: 'GET', u: '/api/creators/recommended', allow: ['anon'], forbidText: ['passwordHash', '@audit.vamo.test'] },
    { name: 'Avaliações públicas', m: 'GET', u: `/api/reviews?itineraryId=${I.B1}`, allow: ['anon'], forbidText: [F.buyerB.email] },
    { name: 'Câmbio', m: 'GET', u: '/api/rates', allow: ['anon'] },
    { name: 'Perguntas do roteiro', m: 'GET', u: `/api/questions/itinerary/${I.A1}`, allow: ['anon', 'buyerA'], forbidText: ['@audit.vamo.test'] },

    // Detalhe e conteúdo pago
    { name: 'Detalhe roteiro ativo (prévia)', m: 'GET', u: `/api/itineraries/${I.A1}`, allow: ['anon', ...ALL_TRAVELERS, 'admin'],
        leakOk: { buyerA: paidOf('A1'), creatorA: [...paidOf('A1'), 'PRIVATE-SECRET-ADMIN-NOTE-A1', 'PRIVATE-SECRET-PROOF-A1'] } },
    { name: 'Detalhe roteiro PENDENTE de outro', m: 'GET', u: `/api/itineraries/${I.A2_pending}`, allow: ['creatorA'], deny: ['anon', 'buyerA', 'buyerB', 'creatorB', ...NEG],
        leakOk: { creatorA: [...paidOf('A2-PENDING'), 'PRIVATE-SECRET-ADMIN-NOTE-A2', 'PRIVATE-SECRET-PROOF-A2'] } },
    { name: 'Detalhe RASCUNHO de outro', m: 'GET', u: `/api/itineraries/${I.A3_draft}`, allow: ['creatorA'], deny: ['anon', 'buyerB', 'creatorB'],
        leakOk: { creatorA: [...paidOf('A3-DRAFT'), 'PRIVATE-SECRET-ADMIN-NOTE-A3', 'PRIVATE-SECRET-PROOF-A3'] } },
    { name: 'Conteúdo comprado (dono da compra)', m: 'GET', u: `/api/itineraries/${I.A1}/purchased`, allow: ['buyerA'], deny: ['anon', 'buyerB', 'creatorB', ...NEG],
        leakOk: { buyerA: paidOf('A1'), creatorA: [...paidOf('A1'), 'PRIVATE-SECRET-ADMIN-NOTE-A1', 'PRIVATE-SECRET-PROOF-A1'] } },
    { name: 'Comprado e depois ARQUIVADO pelo autor', m: 'GET', u: `/api/itineraries/${I.B2_archived_bought_by_B}/purchased`, allow: ['buyerB'], deny: ['anon', 'buyerA', 'creatorA'],
        leakOk: { buyerB: paidOf('B2-ARCHIVED'), creatorB: [...paidOf('B2-ARCHIVED'), 'PRIVATE-SECRET-ADMIN-NOTE-B2', 'PRIVATE-SECRET-PROOF-B2'] } },
    { name: 'Visão do autor (edição)', m: 'GET', u: `/api/itineraries/${I.A1}/creator`, allow: ['creatorA'], deny: ['anon', 'buyerA', 'buyerB', 'creatorB', ...NEG],
        leakOk: { creatorA: [...paidOf('A1'), 'PRIVATE-SECRET-ADMIN-NOTE-A1', 'PRIVATE-SECRET-PROOF-A1'] } },

    // Escrita em roteiro alheio (só papéis que devem ser recusados)
    { name: 'Editar roteiro de outro autor', m: 'PUT', u: `/api/itineraries/${I.A1}`, body: { title: 'HACKED' }, deny: ['anon', 'buyerA', 'buyerB', 'creatorB', 'adminTokenAsTraveler', ...NEG] },
    { name: 'Mudar status de roteiro de outro', m: 'PATCH', u: `/api/itineraries/${I.A1}/creator/status`, body: { status: 'ARCHIVED' }, deny: ['anon', 'buyerA', 'creatorB', ...NEG] },
    { name: 'Excluir roteiro de outro', m: 'DELETE', u: `/api/itineraries/${I.A1}`, deny: ['anon', 'buyerA', 'buyerB', 'creatorB', ...NEG] },
    { name: 'Criar roteiro sem login', m: 'POST', u: '/api/itineraries', body: { title: 'x' }, deny: ['anon', ...NEG] },
    { name: 'Compra direta sem pagar (demo)', m: 'POST', u: `/api/itineraries/${I.B1}/purchase`, body: {}, disabledOk: true, deny: ['anon', 'buyerA', 'creatorA', ...NEG] },
    { name: 'Compartilhar roteiro público (legítimo, só registra o clique)', m: 'POST', u: `/api/itineraries/${I.B1}/share`, body: {}, allow: ['anon', 'buyerA'] },
    { name: 'Compartilhar roteiro PENDENTE de outro', m: 'POST', u: `/api/itineraries/${I.A2_pending}/share`, body: {}, deny: ['anon', 'buyerA', 'creatorB', ...NEG] },

    // Painel do roteirista
    { name: 'Estatísticas do roteirista', m: 'GET', u: '/api/itineraries/dashboard/stats', allow: ['creatorA', 'creatorB'], deny: ['anon', ...NEG], forbidTextFor: { creatorA: ['B1 '], creatorB: ['A1 '] } },
    { name: 'Vendas do roteirista', m: 'GET', u: '/api/itineraries/dashboard/sales', allow: ['creatorA'], deny: ['anon', ...NEG], forbidTextFor: { creatorA: [F.buyerB.email, F.buyerA.email, I.B1] } },
    { name: 'Avaliações do roteirista', m: 'GET', u: '/api/itineraries/dashboard/reviews', allow: ['creatorA'], deny: ['anon', ...NEG], forbidTextFor: { creatorA: [F.buyerB.email, I.B1] } },
    { name: 'Ganhos (extrato)', m: 'GET', u: '/api/creators/me/earnings', allow: ['creatorA'], deny: ['anon', ...NEG], forbidTextFor: { creatorA: [I.B1, F.sales.buyerB_B1] } },
    { name: 'Status Stripe do roteirista', m: 'GET', u: '/api/creators/me/stripe/account-status', deny: ['anon', ...NEG] },
    { name: 'Link de cadastro Stripe', m: 'POST', u: '/api/creators/me/stripe/onboarding-link', body: {}, deny: ['anon', ...NEG] },

    // Dados do viajante
    { name: 'Meu perfil', m: 'GET', u: '/api/auth/traveler/me', allow: ALL_TRAVELERS, deny: ['anon', 'adminTokenAsTraveler', ...NEG], forbidTextFor: { buyerA: [F.buyerB.email, 'passwordHash'] } },
    { name: 'Passaporte', m: 'GET', u: '/api/auth/traveler/passport-stats', allow: ['buyerA'], deny: ['anon', ...NEG] },
    { name: 'Minhas viagens', m: 'GET', u: '/api/my-trips', allow: ['buyerA'], deny: ['anon', ...NEG], forbidTextFor: { buyerA: [I.B1, I.B2_archived_bought_by_B] } },
    { name: 'Itens salvos', m: 'GET', u: '/api/saved-items', allow: ['buyerA'], deny: ['anon', ...NEG] },
    { name: 'Minhas avaliações', m: 'GET', u: '/api/reviews/my', allow: ['buyerA'], deny: ['anon', ...NEG] },
    { name: 'Minhas perguntas', m: 'GET', u: '/api/questions/mine', allow: ['buyerA'], deny: ['anon', ...NEG] },
    { name: 'Perguntas recebidas (roteirista)', m: 'GET', u: '/api/questions/creator/mine', allow: ['creatorA'], deny: ['anon', ...NEG] },
    { name: 'Checklist da viagem de OUTRO', m: 'GET', u: `/api/trip-center/${I.B1}/checklist`, deny: ['anon', ...NEG], allowIfNoLeak: ['buyerA'], },
    { name: 'Arquivos da viagem de OUTRO', m: 'GET', u: `/api/trip-center/${I.B1}/files`, deny: ['anon', ...NEG], allowIfNoLeak: ['buyerA'] },
    { name: 'Baixar arquivo de OUTRO', m: 'GET', u: `/api/trip-center/files/${F.privateObjects.travelerFileB}/content`, deny: ['anon', 'buyerA', 'creatorB', ...NEG] },
    { name: 'Editar item de checklist de OUTRO', m: 'PATCH', u: `/api/trip-center/${I.B1}/checklist/${F.privateObjects.checklistItemB}`, body: { completed: true }, deny: ['anon', 'buyerA', ...NEG] },
    { name: 'Apagar item de checklist de OUTRO', m: 'DELETE', u: `/api/trip-center/${I.B1}/checklist/${F.privateObjects.checklistItemB}`, deny: ['anon', 'buyerA', ...NEG] },
    { name: 'Apagar arquivo de OUTRO', m: 'DELETE', u: `/api/trip-center/${I.B1}/files/${F.privateObjects.travelerFileB}`, deny: ['anon', 'buyerA', ...NEG] },
    { name: 'Personalização de roteiro não comprado', m: 'GET', u: `/api/route-customization/${I.B1}/customization`, deny: ['anon', ...NEG], allowIfNoLeak: ['buyerA'] },
    { name: 'Snapshot de roteiro não comprado', m: 'GET', u: `/api/route-customization/${I.B1}/snapshot`, deny: ['anon', 'buyerA', ...NEG] },
    { name: 'Salvar personalização em roteiro não comprado', m: 'PUT', u: `/api/route-customization/${I.B1}/customization`, body: { data: {} }, deny: ['anon', 'buyerA', ...NEG] },
    { name: 'Editar avaliação de OUTRO', m: 'PUT', u: `/api/reviews/${F.privateObjects.reviewB}`, body: { rating: 1, comment: 'hacked' }, deny: ['anon', 'buyerA', ...NEG] },
    { name: 'Avaliar roteiro não comprado', m: 'POST', u: '/api/reviews', body: { itineraryId: I.B1, rating: 1, comment: 'fake review' }, deny: ['anon', 'buyerA', 'creatorB', ...NEG] },

    // Documentos e uploads
    { name: 'Comprovante privado sem link assinado', m: 'GET', u: `/api/private-docs/${F.privateObjects.privateDocB}/proof.pdf`, deny: ['anon', 'buyerA', 'creatorB', 'admin'] },
    { name: 'Comprovante com token de sessão no lugar do link', m: 'GET', u: `/api/private-docs/${F.privateObjects.privateDocB}/proof.pdf?token=TOKEN_BUYERA`, deny: ['anon'] },
    { name: 'Upload sem login', m: 'POST', u: '/api/uploads', body: {}, deny: ['anon', ...NEG] },

    // Pagamento
    { name: 'Criar checkout', m: 'POST', u: '/api/payments/checkout-session', body: { itineraryId: I.B1 }, deny: ['anon', ...NEG] },
    { name: 'Consultar checkout', m: 'GET', u: '/api/payments/checkout-session/cs_test_x', deny: ['anon', ...NEG] },

    // Admin
    ...[
        ['GET', '/api/admin/travelers'], ['GET', '/api/admin/creators/pending'], ['GET', '/api/admin/reviews'], ['GET', '/api/admin/stats'],
        ['GET', '/api/admin/sales'], ['GET', '/api/admin/pending'], ['GET', '/api/admin/all'], ['GET', `/api/admin/itineraries/${I.A2_pending}`],
        ['GET', `/api/admin/itineraries/${I.B1}/cost-proofs`], ['GET', '/api/admin/audit-logs'], ['GET', '/api/admin/audit-logs/stats/summary'],
    ].map(([m, u]) => ({ name: `Admin ${m} ${u.replace(/c[a-z0-9]{20,}/g, ':id')}`, m, u, allow: ['admin'], deny: ['anon', ...ALL_TRAVELERS, ...NEG] })),
    ...[
        ['POST', `/api/admin/itineraries/${I.A2_pending}/approve`, {}], ['POST', `/api/admin/itineraries/${I.A2_pending}/reject`, { reason: 'x' }],
        ['POST', `/api/admin/creators/${F.creatorA.creatorId}/approve`, {}], ['POST', `/api/admin/reviews/${F.privateObjects.reviewB}/hide`, {}],
        ['POST', `/api/admin/itineraries/${I.B1}/cost-proofs/decide`, {}], ['PUT', '/api/rates', { base: 'USD', rates: { EUR: 999 } }],
    ].map(([m, u, body]) => ({ name: `Admin ${m} ${u.replace(/c[a-z0-9]{20,}/g, ':id')} por não-admin`, m, u, body, deny: ['anon', ...ALL_TRAVELERS, ...NEG] })),
    { name: 'Criar admin pelo seed', m: 'POST', u: '/api/admin/seed', body: { name: 'x', email: 'evil@x.test', password: 'aaaaaaaaaaaaaaa' }, deny: ['anon', 'buyerA', 'admin'] },
];

// ── execução ─────────────────────────────────────────────────────────
const MARK = /(PAID|PRIVATE)-SECRET-[A-Z0-9-]+/g;
const results = [];
const findings = [];
for (const c of cases) {
    const roles = new Set([...(c.allow || []), ...(c.deny || []), ...(c.allowIfNoLeak || [])]);
    for (const role of roles) {
        if (role === 'expired' && !T.expired) continue;
        let url = c.u.replace('TOKEN_BUYERA', encodeURIComponent(T.buyerA));
        const r = await json(c.m, url, { token: T[role], body: c.body });
        const markers = [...new Set(r.text.match(MARK) || [])];
        const okList = (c.leakOk && c.leakOk[role]) || [];
        const adminSees = role === 'admin' && c.u.startsWith('/api/admin/'); // o admin revisa o conteúdo completo
        const leaks = adminSees ? [] : markers.filter((mk) => !okList.some((ok) => mk.startsWith(ok)));
        const textHits = [...(c.forbidText || []), ...((c.forbidTextFor && c.forbidTextFor[role]) || [])].filter((s) => s && r.text.includes(s));
        const expectAllow = (c.allow || []).includes(role);
        const expectDeny = (c.deny || []).includes(role);
        const is2xx = r.status >= 200 && r.status < 300;
        let verdict = 'ok';
        if (r.status >= 500) verdict = 'ERRO-500';
        else if (expectAllow && !is2xx) verdict = 'BLOQUEOU-LEGÍTIMO';
        else if (expectDeny && is2xx) verdict = 'ACESSO-INDEVIDO';
        if (verdict === 'ERRO-500' && r.status === 503 && expectDeny && c.disabledOk) verdict = 'ok';
        if (leaks.length) verdict = verdict === 'ok' ? 'VAZAMENTO' : `${verdict}+VAZAMENTO`;
        if (textHits.length) verdict = verdict === 'ok' ? 'DADO-PRIVADO' : `${verdict}+DADO-PRIVADO`;
        const row = { case: c.name, method: c.m, path: c.u.replace(/c[a-z0-9]{20,}/g, ':id').replace(/TOKEN_BUYERA/, '<token-sessão>'), role, expected: expectAllow ? 'permitir' : expectDeny ? 'recusar' : 'sem vazar', status: r.status, leaks, textHits: textHits.map((t) => t.includes('@') ? '<email>' : t.length > 20 ? '<id>' : t), verdict };
        results.push(row);
        if (verdict !== 'ok') findings.push(row);
    }
}

const outDir = path.join(here, 'results');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'api-authz.json'), JSON.stringify({ ranAt: new Date().toISOString(), api: API, total: results.length, findings, results }, null, 2));
console.log(`Chamadas: ${results.length} · problemas: ${findings.length}`);
for (const f of findings) console.log(`  ✗ [${f.verdict}] ${f.case} · ${f.method} ${f.path} · papel=${f.role} · status=${f.status}${f.leaks.length ? ' · vazou ' + f.leaks.join(',') : ''}${f.textHits.length ? ' · contém ' + f.textHits.join(',') : ''}`);
process.exit(findings.length ? 1 : 0);
