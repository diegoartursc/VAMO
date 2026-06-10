/**
 * Abstração de storage de uploads.
 *
 * Duas implementações, escolhidas por env var (sem mudança de código):
 *
 * 1. Supabase Storage — ativa quando SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY
 *    existem no ambiente. Usa o bucket público "vamo-uploads" (criado de forma
 *    lazy na primeira operação) e retorna a URL pública do objeto. É o modo
 *    correto para produção (Render tem disco efêmero: arquivos locais somem a
 *    cada deploy).
 *
 * 2. Disco local — fallback quando as env vars não existem. Comportamento
 *    idêntico ao histórico: arquivos em public/uploads/, servidos via
 *    express.static em /uploads. Continua sendo o modo de desenvolvimento.
 *
 * Obter as chaves: Supabase Dashboard → Project Settings → API
 * (URL do projeto + service_role key — NUNCA a anon key, e nunca no client).
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import path from 'path';
import fs from 'fs';

export const UPLOADS_BUCKET = 'vamo-uploads';

/** Raiz local dos uploads (modo disco). Mesmo caminho usado desde sempre. */
export const LOCAL_UPLOADS_ROOT = path.join(process.cwd(), 'public/uploads');

/** Cloud storage está configurado? (decide qual implementação as rotas usam) */
export function isCloudStorageEnabled(): boolean {
    return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

let client: SupabaseClient | null = null;

/** Client Supabase com service role (apenas backend; bypassa RLS). */
export function getSupabaseClient(): SupabaseClient {
    if (!isCloudStorageEnabled()) {
        throw new Error(
            'Supabase Storage não configurado: defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env',
        );
    }
    if (!client) {
        client = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
            auth: { persistSession: false, autoRefreshToken: false },
        });
    }
    return client;
}

// Criação lazy do bucket: memoizada para custar uma chamada por processo.
let ensureBucketPromise: Promise<void> | null = null;

async function ensureBucket(): Promise<void> {
    if (!ensureBucketPromise) {
        ensureBucketPromise = (async () => {
            const supabase = getSupabaseClient();
            const { data } = await supabase.storage.getBucket(UPLOADS_BUCKET);
            if (data) return;
            const { error } = await supabase.storage.createBucket(UPLOADS_BUCKET, { public: true });
            // Corrida benigna: outro processo pode ter criado entre o get e o create.
            if (error && !/already exists/i.test(error.message)) {
                throw new Error(`Falha ao criar bucket "${UPLOADS_BUCKET}": ${error.message}`);
            }
        })().catch((err) => {
            // Não memoizar falha — permite retry na próxima operação.
            ensureBucketPromise = null;
            throw err;
        });
    }
    return ensureBucketPromise;
}

/** Content-Type por extensão — fallback quando o MIME do cliente é genérico. */
export function contentTypeForFilename(filename: string, fallback?: string): string {
    const ext = path.extname(filename).toLowerCase();
    const map: Record<string, string> = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp',
        '.heic': 'image/heic',
        '.heif': 'image/heif',
        '.mp4': 'video/mp4',
        '.mov': 'video/quicktime',
        '.webm': 'video/webm',
        '.pdf': 'application/pdf',
    };
    if (map[ext]) return map[ext];
    if (fallback && fallback !== 'application/octet-stream') return fallback;
    return 'application/octet-stream';
}

export interface UploadResult {
    /** URL pública final do arquivo (a que deve ser persistida/retornada). */
    url: string;
    /** Caminho do objeto dentro do bucket (ex.: itineraries/file-123.jpg). */
    storagePath: string;
}

/**
 * Sobe um buffer para o Supabase Storage e retorna a URL pública.
 * `storagePath` é o caminho dentro do bucket, ex.: `itineraries/file-1.jpg`
 * — espelha a estrutura local `public/uploads/<storagePath>`.
 */
export async function uploadBufferToCloud(
    buffer: Buffer,
    storagePath: string,
    contentType: string,
): Promise<UploadResult> {
    await ensureBucket();
    const supabase = getSupabaseClient();
    const { error } = await supabase.storage.from(UPLOADS_BUCKET).upload(storagePath, buffer, {
        contentType,
        upsert: false,
        cacheControl: '31536000', // nomes são únicos (timestamp+random) → cache agressivo ok
    });
    if (error) {
        throw new Error(`Falha no upload para Supabase Storage (${storagePath}): ${error.message}`);
    }
    const { data } = supabase.storage.from(UPLOADS_BUCKET).getPublicUrl(storagePath);
    return { url: data.publicUrl, storagePath };
}

/** Remove um objeto do bucket (cloud) ou o arquivo local (disco). Best-effort. */
export async function deleteUpload(storagePath: string): Promise<void> {
    if (isCloudStorageEnabled()) {
        const supabase = getSupabaseClient();
        const { error } = await supabase.storage.from(UPLOADS_BUCKET).remove([storagePath]);
        if (error) throw new Error(`Falha ao remover ${storagePath} do Supabase: ${error.message}`);
        return;
    }
    const localPath = path.join(LOCAL_UPLOADS_ROOT, storagePath);
    // Proteção contra path traversal antes de tocar no filesystem.
    if (!localPath.startsWith(LOCAL_UPLOADS_ROOT + path.sep)) {
        throw new Error(`Caminho inválido: ${storagePath}`);
    }
    await fs.promises.rm(localPath, { force: true });
}
