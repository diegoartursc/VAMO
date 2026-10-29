/**
 * Utilitários dos testes de segurança: Prisma falso, app real numa porta
 * efêmera e chamadas HTTP. Nenhum acesso a banco ou serviço real.
 */
import http from 'http';
import type { AddressInfo } from 'net';

type Handler = (args: any) => any;

/**
 * Prisma falso. Cada modelo é um objeto de métodos que o teste define
 * (ex.: `db.itinerary.findUnique = async () => fixture`). Chamar um método não
 * definido lança erro — o teste nunca passa "sem querer" por um mock genérico.
 */
export function createFakePrisma() {
    const models: Record<string, Record<string, Handler>> = {};
    const calls: Array<{ model: string; method: string; args: any }> = [];
    const modelProxy = (model: string) => new Proxy(models[model] ||= {}, {
        get(target, method: string) {
            if (method === 'then') return undefined;
            const fn = target[method];
            if (!fn) {
                return async (args: any) => {
                    calls.push({ model, method, args });
                    throw new Error(`[fake-prisma] chamada não prevista: ${model}.${method}`);
                };
            }
            return async (args: any) => {
                calls.push({ model, method, args });
                return fn(args);
            };
        },
        set(target, method: string, value) {
            target[method] = value;
            return true;
        },
    });
    const client: any = new Proxy({}, {
        get(_t, prop: string) {
            if (prop === '$transaction') {
                return async (arg: any) => (typeof arg === 'function' ? arg(client) : Promise.all(arg));
            }
            if (prop === '$disconnect' || prop === '$connect') return async () => {};
            if (prop === '__calls') return calls;
            if (prop === 'then') return undefined;
            return modelProxy(prop);
        },
    });
    return client;
}

/** Tabela em memória mínima (igualdade simples no where) para modelos de estado. */
export function memoryTable<T extends { id: string }>(rows: T[] = []) {
    const matches = (row: any, where: any = {}) => Object.entries(where).every(([k, v]) => {
        if (v && typeof v === 'object' && !(v instanceof Date)) {
            const op = v as any;
            if ('equals' in op) {
                return op.mode === 'insensitive'
                    ? String(row[k] ?? '').toLowerCase() === String(op.equals ?? '').toLowerCase()
                    : row[k] === op.equals;
            }
            if ('not' in op) return (row[k] ?? null) !== op.not;
            if ('in' in op) return op.in.includes(row[k]);
            if ('gt' in op) return row[k] != null && row[k] > op.gt;
            if ('gte' in op) return row[k] != null && row[k] >= op.gte;
            if ('lt' in op) return row[k] != null && row[k] < op.lt;
            if ('lte' in op) return row[k] != null && row[k] <= op.lte;
            return false;
        }
        return (row[k] ?? null) === (v ?? null);
    });
    let seq = 0;
    return {
        rows,
        findUnique: async ({ where }: any) => rows.find((r) => matches(r, where)) ?? null,
        findFirst: async ({ where }: any = {}) => rows.find((r) => matches(r, where)) ?? null,
        findMany: async ({ where }: any = {}) => rows.filter((r) => matches(r, where)),
        count: async ({ where }: any = {}) => rows.filter((r) => matches(r, where)).length,
        create: async ({ data }: any) => {
            const row = { id: data.id ?? `row_${++seq}`, createdAt: new Date(), ...data };
            rows.push(row);
            return row;
        },
        update: async ({ where, data }: any) => {
            const row: any = rows.find((r) => matches(r, where));
            if (!row) throw new Error('not found');
            for (const [k, v] of Object.entries(data)) {
                row[k] = v && typeof v === 'object' && 'increment' in (v as any) ? (row[k] ?? 0) + (v as any).increment : v;
            }
            return row;
        },
        updateMany: async ({ where, data }: any) => {
            const hit = rows.filter((r) => matches(r, where));
            for (const row of hit as any[]) {
                for (const [k, v] of Object.entries(data)) {
                    row[k] = v && typeof v === 'object' && 'increment' in (v as any) ? (row[k] ?? 0) + (v as any).increment : v;
                }
            }
            return { count: hit.length };
        },
        deleteMany: async ({ where }: any = {}) => {
            const before = rows.length;
            for (let i = rows.length - 1; i >= 0; i--) if (matches(rows[i], where)) rows.splice(i, 1);
            return { count: before - rows.length };
        },
    };
}

/** Sobe o app real numa porta efêmera de localhost. */
export async function startApp(app: any) {
    const server = http.createServer(app);
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const { port } = server.address() as AddressInfo;
    return {
        base: `http://127.0.0.1:${port}`,
        close: () => new Promise<void>((resolve) => {
            // fetch mantém conexões keep-alive; sem isso o close espera para sempre.
            server.closeAllConnections?.();
            server.close(() => resolve());
        }),
    };
}

export async function call(
    base: string,
    method: string,
    path: string,
    opts: { token?: string; body?: any; headers?: Record<string, string> } = {},
) {
    const headers: Record<string, string> = { ...(opts.headers || {}) };
    if (opts.token) headers.authorization = `Bearer ${opts.token}`;
    let body: any;
    if (opts.body !== undefined) {
        headers['content-type'] = headers['content-type'] || 'application/json';
        body = typeof opts.body === 'string' ? opts.body : JSON.stringify(opts.body);
    }
    const res = await fetch(base + path, { method, headers, body, redirect: 'manual' });
    const text = await res.text();
    let json: any = null;
    try { json = JSON.parse(text); } catch { /* corpo não-JSON */ }
    return { status: res.status, json, text, headers: res.headers };
}

/** Procura uma chave em qualquer profundidade de um JSON. */
export function findKeyDeep(value: any, keys: string[], path = '$'): string[] {
    const hits: string[] = [];
    if (Array.isArray(value)) value.forEach((v, i) => hits.push(...findKeyDeep(v, keys, `${path}[${i}]`)));
    else if (value && typeof value === 'object') {
        for (const [k, v] of Object.entries(value)) {
            if (keys.includes(k) && v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && v.length === 0)) hits.push(`${path}.${k}`);
            hits.push(...findKeyDeep(v, keys, `${path}.${k}`));
        }
    }
    return hits;
}
