/**
 * Fase 4 — upload sem estourar memória (SEC-08) e Multer atualizado (SEC-09).
 *
 *   cd apps/backend && npx tsx --import ./src/test/setup.ts --test src/security/phase4-uploads.test.ts
 */
import '../test/setup';
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import bcrypt from 'bcryptjs';
import { createFakePrisma, memoryTable, startApp, call } from '../test/helpers';

process.env.UPLOAD_MAX_REQUEST_BYTES = String(64 * 1024);
process.env.UPLOAD_MAX_FILE_BYTES = String(32 * 1024);
process.env.UPLOAD_MAX_CONCURRENT_PER_USER = '1';

const db = createFakePrisma();
(globalThis as any).prisma = db;
const travelers = memoryTable<any>([]);
let base = '';
let close: () => Promise<void>;
let token = '';

before(async () => {
    travelers.rows.push({ id: 'trav_A', email: 'a@test.local', name: 'A', passwordHash: await bcrypt.hash('correct-horse-battery', 4) });
    Object.assign(db.traveler, { findFirst: travelers.findFirst, findUnique: travelers.findUnique });
    Object.assign(db.travelerSession, memoryTable<any>([]));
    const app = (await import('../app')).default;
    ({ base, close } = await startApp(app));
    token = (await call(base, 'POST', '/api/auth/traveler/login', { body: { email: 'a@test.local', password: 'correct-horse-battery' } })).json.accessToken;
});
after(async () => { await close(); });

function rawPost(path: string, headers: Record<string, string | number>, body?: Buffer, holdOpenMs = 0, rest?: Buffer): Promise<number> {
    return new Promise((resolve, reject) => {
        const url = new URL(base + path);
        const req = http.request({ hostname: url.hostname, port: url.port, path: url.pathname, method: 'POST', headers }, (res) => {
            res.resume();
            resolve(res.statusCode || 0);
        });
        req.on('error', (e: any) => (e.code === 'ECONNRESET' || e.code === 'EPIPE' ? resolve(-1) : reject(e)));
        if (body) req.write(body);
        if (holdOpenMs) setTimeout(() => (rest ? req.end(rest) : req.end()), holdOpenMs); else req.end();
    });
}

const jpeg = (size: number) => Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(size - 4, 1)]);
function multipart(files: Array<{ name: string; data: Buffer; field?: string }>) {
    const boundary = '----vamoTestBoundary';
    const parts: Buffer[] = [];
    for (const f of files) {
        parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${f.field || 'files'}"; filename="${f.name}"\r\nContent-Type: image/jpeg\r\n\r\n`));
        parts.push(f.data, Buffer.from('\r\n'));
    }
    parts.push(Buffer.from(`--${boundary}--\r\n`));
    return { body: Buffer.concat(parts), type: `multipart/form-data; boundary=${boundary}` };
}

test('SEC-09: Multer instalado é 2.x (sem a falha de encerramento do processo)', async () => {
    const pkg = require('multer/package.json');
    assert.ok(Number(pkg.version.split('.')[0]) >= 2, `multer ${pkg.version}`);
});

test('SEC-08: pedido maior que o teto é recusado antes de ler o corpo (Content-Length)', async () => {
    const status = await rawPost('/api/uploads/multiple', {
        authorization: `Bearer ${token}`, 'content-type': 'multipart/form-data; boundary=x', 'content-length': 10 * 1024 * 1024,
    });
    assert.equal(status, 413);
});

test('SEC-08: upload sem Content-Length (chunked) é recusado', async () => {
    const status = await rawPost('/api/uploads/multiple', {
        authorization: `Bearer ${token}`, 'content-type': 'multipart/form-data; boundary=x', 'transfer-encoding': 'chunked',
    }, Buffer.from('x'));
    assert.ok(status === 411 || status === 413, `status ${status}`);
});

test('SEC-08: muitos arquivos num pedido e arquivo acima do limite são recusados', async () => {
    const many = multipart(Array.from({ length: 12 }, (_, i) => ({ name: `p${i}.jpg`, data: jpeg(1024) })));
    const r1 = await rawPost('/api/uploads/multiple', { authorization: `Bearer ${token}`, 'content-type': many.type, 'content-length': many.body.length }, many.body);
    assert.ok([400, 413].includes(r1), `12 arquivos → ${r1}`);
    const big = multipart([{ name: 'big.jpg', data: jpeg(40 * 1024), field: 'file' }]);
    const r2 = await rawPost('/api/uploads', { authorization: `Bearer ${token}`, 'content-type': big.type, 'content-length': big.body.length }, big.body);
    assert.equal(r2, 413);
});

test('SEC-08: o mesmo usuário não abre uploads simultâneos acima do limite', async () => {
    const one = multipart([{ name: 'a.jpg', data: jpeg(1024), field: 'file' }]);
    const slow = rawPost('/api/uploads', { authorization: `Bearer ${token}`, 'content-type': one.type, 'content-length': one.body.length }, one.body.subarray(0, 100), 800, one.body.subarray(100));
    await new Promise((r) => setTimeout(r, 150));
    const second = await rawPost('/api/uploads', { authorization: `Bearer ${token}`, 'content-type': one.type, 'content-length': one.body.length }, one.body);
    assert.equal(second, 429);
    await slow;
});

test('SEC-08: conexão lenta que nunca termina perde a vaga depois do tempo máximo', async () => {
    process.env.UPLOAD_TIMEOUT_MS = '300';
    const one = multipart([{ name: 'a.jpg', data: jpeg(1024), field: 'file' }]);
    const stuck = rawPost('/api/uploads', { authorization: `Bearer ${token}`, 'content-type': one.type, 'content-length': one.body.length + 50 }, one.body.subarray(0, 50), 5000);
    await new Promise((r) => setTimeout(r, 700));
    const next = multipart([{ name: 'b.jpg', data: jpeg(1024), field: 'file' }]);
    const status = await rawPost('/api/uploads', { authorization: `Bearer ${token}`, 'content-type': next.type, 'content-length': next.body.length }, next.body);
    assert.equal(status, 200, 'a vaga continuou presa');
    delete process.env.UPLOAD_TIMEOUT_MS;
    await stuck;
});

test('SEC-08: upload legítimo pequeno continua funcionando e o servidor segue vivo', async () => {
    const one = multipart([{ name: 'ok.jpg', data: jpeg(2048), field: 'file' }]);
    const status = await rawPost('/api/uploads', { authorization: `Bearer ${token}`, 'content-type': one.type, 'content-length': one.body.length }, one.body);
    assert.equal(status, 200);
    assert.equal((await call(base, 'GET', '/health')).status, 200);
});

test('R-U1: cota por conta (pedidos por hora) recusa o excesso', async () => {
    process.env.UPLOAD_MAX_PER_HOUR = '1';
    const one = multipart([{ name: 'q.jpg', data: jpeg(1024), field: 'file' }]);
    const status = await rawPost('/api/uploads', { authorization: `Bearer ${token}`, 'content-type': one.type, 'content-length': one.body.length }, one.body);
    delete process.env.UPLOAD_MAX_PER_HOUR;
    assert.equal(status, 429);
});
