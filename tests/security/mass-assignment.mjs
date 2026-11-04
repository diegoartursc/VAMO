#!/usr/bin/env node
/**
 * Campos extras / mass assignment (Etapa 3, cenário 8) e auto-promoção.
 * O próprio dono faz a chamada tentando mudar campos que só o sistema ou o
 * admin podem mudar; depois o banco é lido direto para conferir o efeito.
 *
 *   AUDIT_API=http://localhost:4333 AUDIT_DB=vamo_audit node tests/security/mass-assignment.mjs
 * Altera os dados de teste: recrie os fixtures depois.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const API = process.env.AUDIT_API || 'http://localhost:4333';
const DB = process.env.AUDIT_DB || 'vamo_audit';
if (!/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(API) || !/^vamo_audit\w*$/.test(DB)) { console.error('Recusado: só ambiente local de auditoria.'); process.exit(2); }
const PSQL = process.env.PSQL || '/opt/homebrew/opt/postgresql@17/bin/psql';
const F = JSON.parse(fs.readFileSync(path.join(here, '.fixtures.local.json'), 'utf8'));
const I = F.itineraries;
const sql = (q) => execFileSync(PSQL, ['-h', 'localhost', '-d', DB, '-Atc', q], { encoding: 'utf8' }).trim();
let ip = 10;
async function call(method, url, token, body) {
    const r = await fetch(API + url, { method, headers: { 'x-forwarded-for': `198.51.100.${ip++ % 250}`, 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
    return { status: r.status, text: await r.text() };
}
async function login(k) { return JSON.parse((await call('POST', '/api/auth/traveler/login', null, { email: F[k].email, password: F[k].password })).text).accessToken; }

const results = [];
const check = (name, ok, detail) => { results.push({ name, ok, detail }); console.log(`${ok ? '✓' : '✗'} ${name}${detail ? ' · ' + detail : ''}`); };

const cA = await login('creatorA');
const valid = (title) => ({ title, destination: 'Lisbon', country: 'Portugal', description: 'Valid description', categories: ['culture'], price: 19.9, duration: 1,
    activeModules: ['dicas'], generalTips: ['First insider tip', 'Second insider tip'], highlightPhotos: ['https://example.test/cover.jpg'], travelProofUrl: `private-doc://${F.privateObjects.privateDocA}` });
const bA = await login('buyerA');

// 1. Dono edita roteiro ATIVO tentando mudar campos protegidos.
const before = sql(`select featured, "creatorId", "reviewCount", rating, "downloadCount", "approvedBy" from itineraries where id='${I.A1}'`);
let r = await call('PUT', `/api/itineraries/${I.A1}`, cA, { ...valid('A1 edited by owner'), status: 'PENDING_REVIEW', featured: true, creatorId: F.creatorB.creatorId, reviewCount: 999, rating: 5, downloadCount: 999, qualityScore: 100, approvedBy: 'evil' });
const after = sql(`select featured, "creatorId", "reviewCount", rating, "downloadCount", "approvedBy" from itineraries where id='${I.A1}'`);
check('PUT do dono não muda destaque/dono/nota/contadores/aprovador', before === after, `antes ${before} · depois ${after} ·` + `status ${r.status} ${r.status >= 400 ? r.text.slice(0, 160) : ""}`);

// 2. Dono tenta publicar sozinho o roteiro PENDENTE.
r = await call('PUT', `/api/itineraries/${I.A2_pending}`, cA, { ...valid('A2 edited'), status: 'ACTIVE', approvedAt: new Date().toISOString() });
check('PUT do dono não publica roteiro pendente', sql(`select status from itineraries where id='${I.A2_pending}'`) !== 'ACTIVE', `status ${r.status} → ${sql(`select status from itineraries where id='${I.A2_pending}'`)}`);
r = await call('PATCH', `/api/itineraries/${I.A2_pending}/creator/status`, cA, { status: 'ACTIVE' });
check('qualityScore é calculado pelo servidor (não aceita o 100 enviado)', sql(`select "qualityScore" from itineraries where id='${I.A1}'`) !== '100', `valor ${sql(`select "qualityScore" from itineraries where id='${I.A1}'`)}`);
check('PATCH de status não publica roteiro pendente', sql(`select status from itineraries where id='${I.A2_pending}'`) !== 'ACTIVE', `status ${r.status} → ${sql(`select status from itineraries where id='${I.A2_pending}'`)}`);
r = await call('PATCH', `/api/itineraries/${I.A3_draft}/creator/status`, cA, { status: 'APPROVED' });
check('PATCH de status não aprova rascunho', !['ACTIVE', 'APPROVED'].includes(sql(`select status from itineraries where id='${I.A3_draft}'`)), `status ${r.status} ${r.status >= 400 ? r.text.slice(0, 160) : ""}`);

// 3. Criação já "aprovada" e em destaque.
r = await call('POST', '/api/itineraries', cA, { ...valid('MA new'), status: 'PENDING_REVIEW', featured: true, approvedAt: new Date().toISOString(), creatorId: F.creatorB.creatorId, rating: 5, reviewCount: 50 });
const created = sql(`select status||'|'||featured||'|'||"creatorId"||'|'||coalesce(rating::text,'null')||'|'||"reviewCount" from itineraries where title='MA new' order by "createdAt" desc limit 1`);
const [st, feat, owner, rating, rc] = created.split('|');
check('Criar roteiro não nasce publicado/destaque/de outro dono', !!created && !['ACTIVE', 'APPROVED'].includes(st) && ['f', 'false'].includes(feat) && owner === F.creatorA.creatorId && rating === 'null' && rc === '0', `status ${r.status} ${r.text.slice(0,200)} → ${created ? `${st}, destaque=${feat}, dono ${owner === F.creatorA.creatorId ? 'ok' : 'OUTRO'}, nota=${rating}, avaliações=${rc}` : 'não criado'}`);

r = await call('POST', '/api/itineraries', cA, { ...valid('MA active'), status: 'ACTIVE' });
check('Criar já com status ACTIVE é recusado', r.status === 400 && sql(`select count(*) from itineraries where title='MA active'`) === '0', `status ${r.status}`);

// 4. Perfil: e-mail, senha, papel e vínculo de roteirista.
const pBefore = sql(`select email||'|'||coalesce("passwordHash",'')||'|'||(select count(*) from creators where "travelerId"='${F.buyerA.travelerId}') from travelers where id='${F.buyerA.travelerId}'`);
r = await call('PATCH', '/api/auth/traveler/me', bA, { name: 'Buyer A', email: 'owned@evil.test', passwordHash: 'x', role: 'admin', isAdmin: true, creator: { create: { bio: 'x' } }, id: F.buyerB.travelerId });
const pAfter = sql(`select email||'|'||coalesce("passwordHash",'')||'|'||(select count(*) from creators where "travelerId"='${F.buyerA.travelerId}') from travelers where id='${F.buyerA.travelerId}'`);
check('PATCH /me não troca e-mail, senha, papel nem vira roteirista', pBefore === pAfter, `status ${r.status} ${r.status >= 400 ? r.text.slice(0, 160) : ""}`);
check('PATCH /me com id de outro não altera o outro', sql(`select name from travelers where id='${F.buyerB.travelerId}'`) === 'Buyer B');

// 5. Pergunta e avaliação em nome de outro.
r = await call('POST', '/api/questions', bA, { itineraryId: I.B1, questionText: 'MA question about this itinerary?', travelerId: F.buyerB.travelerId });
const qOwner = sql(`select "travelerId" from faq_questions order by "createdAt" desc limit 1`);
check('Pergunta fica no nome de quem está logado', !qOwner || qOwner === F.buyerA.travelerId, `status ${r.status} ${r.status >= 400 ? r.text.slice(0, 160) : ""}`);
r = await call('POST', '/api/reviews', bA, { itineraryId: I.A1, rating: 99, comment: 'MA review text that is long enough to pass validation', travelerId: F.buyerB.travelerId });
r = await call('POST', '/api/reviews', bA, { itineraryId: I.A1, rating: 4, comment: 'MA review text that is long enough to pass validation', travelerId: F.buyerB.travelerId });
const rev = sql(`select "travelerId"||'|'||rating from reviews where "itineraryId"='${I.A1}' order by "createdAt" desc limit 1`);
check('Avaliação: nota fora de 1–5 recusada e autor = logado', !!rev && (rev.split('|')[0] === F.buyerA.travelerId && Number(rev.split('|')[1]) <= 5), `status ${r.status} → ${rev ? 'nota ' + rev.split('|')[1] : 'nenhuma'}`);

const outDir = path.join(here, 'results'); fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'mass-assignment.json'), JSON.stringify({ ranAt: new Date().toISOString(), results }, null, 2));
process.exit(results.every((x) => x.ok) ? 0 : 1);
