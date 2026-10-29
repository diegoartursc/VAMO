/**
 * Comprovantes privados (SEC-03).
 *
 * - Guardados em `private_documents` (nunca no bucket público).
 * - No roteiro ficam como `private-doc://<id>` (em `travelProofUrl` e em
 *   `cost.proofFiles[].url`, em qualquer profundidade).
 * - Só o dono e o admin recebem link assinado de curta duração
 *   (`/api/private-docs/<id>/<nome>?token=`). Quem salva o roteiro só pode
 *   referenciar documentos próprios; referência alheia é descartada.
 */
import type { Request } from 'express';
import prisma from './prisma';
import { generateDocumentToken } from './auth';

export const PRIVATE_DOC_PREFIX = 'private-doc://';
const SIGNED_PATH = /\/api\/private-docs\/([A-Za-z0-9_-]{5,64})\//;

/** Id do documento privado numa URL (canônica ou link assinado nosso), ou null. */
export function docIdFromRef(url: unknown): string | null {
    if (typeof url !== 'string' || !url) return null;
    if (url.startsWith(PRIVATE_DOC_PREFIX)) {
        const id = url.slice(PRIVATE_DOC_PREFIX.length);
        return /^[A-Za-z0-9_-]{5,64}$/.test(id) ? id : null;
    }
    const m = SIGNED_PATH.exec(url);
    return m ? m[1] : null;
}

export function safeDocName(name: string | null | undefined): string {
    const cleaned = String(name || '').replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
    return cleaned || 'document';
}

type RefMapper = (url: string) => string | null;

/**
 * Aplica `fn` a cada referência de comprovante (`travelProofUrl` e
 * `proofFiles[].url`) em qualquer profundidade. `null` remove: o comprovante
 * vira '' e o arquivo sai da lista.
 */
export function mapDocRefs<T>(value: T, fn: RefMapper): T {
    if (Array.isArray(value)) return value.map((v) => mapDocRefs(v, fn)) as any;
    if (!value || typeof value !== 'object' || value instanceof Date || Buffer.isBuffer(value)) return value;
    const out: Record<string, unknown> = {};
    for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
        if (key === 'travelProofUrl' && typeof v === 'string') {
            out[key] = v ? fn(v) ?? '' : v;
        } else if (key === 'proofFiles' && Array.isArray(v)) {
            out[key] = v
                .map((file: any) => {
                    if (!file || typeof file !== 'object' || typeof file.url !== 'string') return file;
                    const url = fn(file.url);
                    return url === null ? null : { ...file, url };
                })
                .filter((f) => f !== null);
        } else {
            out[key] = mapDocRefs(v, fn);
        }
    }
    return out as T;
}

function collectDocIds(value: unknown): string[] {
    const ids = new Set<string>();
    mapDocRefs(value, (url) => {
        const id = docIdFromRef(url);
        if (id) ids.add(id);
        return url;
    });
    return Array.from(ids);
}

/**
 * Antes de gravar: transforma links assinados em `private-doc://<id>` e
 * descarta documentos que não pertencem a quem está salvando.
 * URLs que não são nossas (legado no bucket público) ficam como estão.
 */
export async function canonicalizeDocRefs<T>(body: T, ownerTravelerId: string, legacyAllowed: Set<string> = new Set()): Promise<T> {
    const ids = collectDocIds(body);
    const owned = ids.length
        ? await prisma.privateDocument.findMany({ where: { id: { in: ids }, ownerTravelerId }, select: { id: true } })
        : [];
    const allowed = new Set(owned.map((d) => d.id));
    return mapDocRefs(body, (url) => {
        const id = docIdFromRef(url);
        // Comprovante NOVO só pelo armazenamento privado. URL pública só se já
        // estava gravada neste roteiro (legado, até a migração).
        if (!id) return legacyAllowed.has(url) ? url : null;
        return allowed.has(id) ? `${PRIVATE_DOC_PREFIX}${id}` : null;
    });
}

/** URLs de comprovante já gravadas (legado público aceito só se não mudou). */
export function existingProofRefs(existing: unknown): Set<string> {
    const set = new Set<string>();
    mapDocRefs(existing, (url) => { set.add(url); return url; });
    return set;
}

function publicBase(req: Request): string {
    const configured = (process.env.PUBLIC_BACKEND_URL || '').replace(/\/+$/, '');
    return configured || `${req.protocol}://${req.get('host')}`;
}

export function signedDocUrl(req: Request, id: string, name?: string | null): string {
    return `${publicBase(req)}/api/private-docs/${encodeURIComponent(id)}/${safeDocName(name)}?token=${encodeURIComponent(generateDocumentToken(id))}`;
}

/** Para respostas ao dono/admin: `private-doc://<id>` vira link assinado. */
export async function signDocRefs<T>(value: T, req: Request): Promise<T> {
    const ids = collectDocIds(value);
    if (ids.length === 0) return value;
    const docs = await prisma.privateDocument.findMany({
        where: { id: { in: ids } },
        select: { id: true, originalFileName: true },
    });
    const names = new Map(docs.map((d) => [d.id, d.originalFileName]));
    return mapDocRefs(value, (url) => {
        const id = docIdFromRef(url);
        if (!id) return url;
        return names.has(id) ? signedDocUrl(req, id, names.get(id)) : null;
    });
}
