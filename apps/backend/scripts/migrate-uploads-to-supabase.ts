/**
 * Migra uploads locais (public/uploads) para o Supabase Storage e reescreve
 * no banco todas as URLs que apontam para /uploads/.
 *
 * Uso:
 *   npx tsx scripts/migrate-uploads-to-supabase.ts            # DRY-RUN (padrão, só lista)
 *   npx tsx scripts/migrate-uploads-to-supabase.ts --apply    # executa de verdade
 *
 * Regras:
 * - DRY-RUN por padrão: não sobe nada, não escreve nada — apenas imprime o plano.
 * - --apply exige SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env (recusa sem elas).
 * - Arquivos referenciados por TravelerFile são PRIVADOS: não vão para o bucket
 *   público. Com --apply, o conteúdo é importado para a coluna `content` (Bytes)
 *   do próprio registro — o endpoint assinado do Trip Center já prioriza
 *   `content` sobre `url`, então o arquivo continua privado e acessível.
 * - Toda mudança (upload, update de linha) é logada individualmente.
 *
 * Alvos no banco (campos que persistem URLs /uploads — ver schema.prisma):
 *   Traveler.avatar, Agency.logo, PackageImage.url, ItineraryImage.url,
 *   ItineraryFile.url, ReviewImage.url, Itinerary.mediaUrls/highlightPhotos
 *   (String[]), ItineraryActivity.images (String[]), e campos JSON do
 *   Itinerary (flightInfo, attractions, restaurants, extraSpendingItems,
 *   spendingProfile, receiveList) via varredura recursiva de strings.
 */
import { PrismaClient, Prisma } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import {
    UPLOADS_BUCKET,
    isCloudStorageEnabled,
    getSupabaseClient,
    uploadBufferToCloud,
    contentTypeForFilename,
} from '../src/lib/storage';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const APPLY = process.argv.includes('--apply');
const UPLOADS_ROOT = path.join(process.cwd(), 'public/uploads');

// Casa qualquer URL/caminho que aponte para /uploads/<dir>/<arquivo>,
// absoluto (http://host/uploads/...) ou relativo (/uploads/...).
// O prefixo scheme+host é capturado (opcional) para ser descartado na
// reescrita — a URL nova substitui a URL antiga INTEIRA.
const UPLOAD_URL_RE = /(?:https?:\/\/[^/\s"']+)?\/uploads\/([a-z0-9_-]+)\/([^/?#"'\s]+)/i;

const dbHost = (process.env.DATABASE_URL || '').match(/@([^/:]+)/)?.[1] || 'unknown';
console.log(`🔌 Banco: ${dbHost} ${dbHost.includes('supabase') ? '(PROD Supabase)' : '(local)'}`);
console.log(`🏃 Modo: ${APPLY ? '🚨 APPLY (vai escrever!)' : 'DRY-RUN (só lista, não muda nada)'}\n`);

if (APPLY && !isCloudStorageEnabled()) {
    console.error('❌ --apply exige SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no apps/backend/.env');
    console.error('   Obtenha em: Supabase Dashboard → Project Settings → API');
    process.exit(1);
}

const prisma = new PrismaClient({ log: ['error'] });

/** URL pública final de um objeto no bucket. Em dry-run sem env, usa placeholder. */
function publicUrlFor(storagePath: string): string {
    if (isCloudStorageEnabled()) {
        return getSupabaseClient().storage.from(UPLOADS_BUCKET).getPublicUrl(storagePath).data.publicUrl;
    }
    return `<SUPABASE_URL>/storage/v1/object/public/${UPLOADS_BUCKET}/${storagePath}`;
}

/** Se a string contém uma URL /uploads/, retorna { storagePath, newValue }. */
function rewriteUploadUrl(value: string): { storagePath: string; newValue: string } | null {
    const m = value.match(UPLOAD_URL_RE);
    if (!m) return null;
    const storagePath = `${m[1]}/${m[2]}`;
    return { storagePath, newValue: value.replace(UPLOAD_URL_RE, () => publicUrlFor(storagePath)) };
}

/** Varredura recursiva de JSON: reescreve strings com /uploads/ e conta mudanças. */
function rewriteJsonDeep(node: unknown, hits: string[]): { value: unknown; changed: boolean } {
    if (typeof node === 'string') {
        const rw = rewriteUploadUrl(node);
        if (rw) {
            hits.push(rw.storagePath);
            return { value: rw.newValue, changed: true };
        }
        return { value: node, changed: false };
    }
    if (Array.isArray(node)) {
        let changed = false;
        const out = node.map((item) => {
            const r = rewriteJsonDeep(item, hits);
            changed = changed || r.changed;
            return r.value;
        });
        return { value: out, changed };
    }
    if (node && typeof node === 'object') {
        let changed = false;
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
            const r = rewriteJsonDeep(v, hits);
            changed = changed || r.changed;
            out[k] = r.value;
        }
        return { value: out, changed };
    }
    return { value: node, changed: false };
}

function listLocalFiles(): { relPath: string; absPath: string; size: number }[] {
    if (!fs.existsSync(UPLOADS_ROOT)) return [];
    const out: { relPath: string; absPath: string; size: number }[] = [];
    const walk = (dir: string) => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const abs = path.join(dir, entry.name);
            if (entry.isDirectory()) walk(abs);
            else if (entry.isFile() && !entry.name.startsWith('.')) {
                out.push({
                    relPath: path.relative(UPLOADS_ROOT, abs).split(path.sep).join('/'),
                    absPath: abs,
                    size: fs.statSync(abs).size,
                });
            }
        }
    };
    walk(UPLOADS_ROOT);
    return out.sort((a, b) => a.relPath.localeCompare(b.relPath));
}

const fmtKB = (bytes: number) => `${(bytes / 1024).toFixed(0)} KB`;

async function main() {
    // ── 1. Arquivos locais ────────────────────────────────────────────────
    const localFiles = listLocalFiles();
    const localByPath = new Map(localFiles.map(f => [f.relPath, f]));
    const totalBytes = localFiles.reduce((s, f) => s + f.size, 0);
    console.log(`📁 Arquivos locais em public/uploads: ${localFiles.length} (${(totalBytes / 1024 / 1024).toFixed(1)} MB)`);

    // ── 2. TravelerFile (privados) — nunca vão para o bucket público ─────
    const travelerFiles = await prisma.travelerFile.findMany({
        select: { id: true, title: true, url: true, mimeType: true, content: true },
    });
    const privatePaths = new Set<string>();
    type PrivatePlan = { id: string; title: string; relPath: string; hasContent: boolean; localExists: boolean };
    const privatePlan: PrivatePlan[] = [];
    for (const tf of travelerFiles) {
        const m = (tf.url || '').match(UPLOAD_URL_RE);
        if (!m) continue;
        const relPath = `${m[1]}/${m[2]}`;
        privatePaths.add(relPath);
        privatePlan.push({
            id: tf.id,
            title: tf.title,
            relPath,
            hasContent: tf.content != null && tf.content.length > 0,
            localExists: localByPath.has(relPath),
        });
    }

    // ── 3. Plano de upload público (tudo que não é privado) ──────────────
    const publicUploads = localFiles.filter(f => !privatePaths.has(f.relPath));
    console.log(`\n☁️  UPLOADS PÚBLICOS → bucket "${UPLOADS_BUCKET}" (${publicUploads.length} arquivos):`);
    for (const f of publicUploads) {
        console.log(`   ⬆️  ${f.relPath} (${fmtKB(f.size)}, ${contentTypeForFilename(f.relPath)})`);
    }

    console.log(`\n🔒 ARQUIVOS PRIVADOS (TravelerFile) — NÃO vão pro bucket público (${privatePlan.length}):`);
    if (privatePlan.length === 0) console.log('   (nenhum)');
    for (const p of privatePlan) {
        const action = p.hasContent
            ? 'já tem content no banco — nada a fazer'
            : p.localExists
                ? 'importar bytes do disco para a coluna content (Bytes)'
                : '⚠️ sem content e sem arquivo local — irrecuperável (cliente precisa reenviar)';
        console.log(`   🔐 ${p.relPath} [${p.title}] → ${action}`);
    }

    // ── 4. Referências no banco a reescrever ──────────────────────────────
    type Change = { label: string; apply: () => Promise<void> };
    const changes: Change[] = [];
    const referencedPaths = new Set<string>();

    const planScalar = (
        label: string,
        oldValue: string,
        applyFn: (newValue: string) => Promise<void>,
    ) => {
        const rw = rewriteUploadUrl(oldValue);
        if (!rw) return;
        referencedPaths.add(rw.storagePath);
        const missing = !localByPath.has(rw.storagePath) ? '  ⚠️ arquivo NÃO existe localmente (URL já estava quebrada)' : '';
        changes.push({
            label: `${label}\n        ${oldValue}\n      → ${rw.newValue}${missing}`,
            apply: () => applyFn(rw.newValue),
        });
    };

    // Traveler.avatar
    for (const t of await prisma.traveler.findMany({ where: { avatar: { contains: '/uploads/' } }, select: { id: true, email: true, avatar: true } })) {
        planScalar(`Traveler.avatar (${t.email})`, t.avatar!, (v) =>
            prisma.traveler.update({ where: { id: t.id }, data: { avatar: v } }).then(() => {}));
    }
    // Agency.logo
    for (const a of await prisma.agency.findMany({ where: { logo: { contains: '/uploads/' } }, select: { id: true, name: true, logo: true } })) {
        planScalar(`Agency.logo (${a.name})`, a.logo!, (v) =>
            prisma.agency.update({ where: { id: a.id }, data: { logo: v } }).then(() => {}));
    }
    // PackageImage.url
    for (const img of await prisma.packageImage.findMany({ where: { url: { contains: '/uploads/' } }, select: { id: true, url: true } })) {
        planScalar(`PackageImage ${img.id}`, img.url, (v) =>
            prisma.packageImage.update({ where: { id: img.id }, data: { url: v } }).then(() => {}));
    }
    // ItineraryImage.url
    for (const img of await prisma.itineraryImage.findMany({ where: { url: { contains: '/uploads/' } }, select: { id: true, itineraryId: true, url: true } })) {
        planScalar(`ItineraryImage ${img.id} (itinerary ${img.itineraryId})`, img.url, (v) =>
            prisma.itineraryImage.update({ where: { id: img.id }, data: { url: v } }).then(() => {}));
    }
    // ItineraryFile.url
    for (const f of await prisma.itineraryFile.findMany({ where: { url: { contains: '/uploads/' } }, select: { id: true, name: true, url: true } })) {
        planScalar(`ItineraryFile ${f.id} (${f.name})`, f.url, (v) =>
            prisma.itineraryFile.update({ where: { id: f.id }, data: { url: v } }).then(() => {}));
    }
    // ReviewImage.url
    for (const img of await prisma.reviewImage.findMany({ where: { url: { contains: '/uploads/' } }, select: { id: true, url: true } })) {
        planScalar(`ReviewImage ${img.id}`, img.url, (v) =>
            prisma.reviewImage.update({ where: { id: img.id }, data: { url: v } }).then(() => {}));
    }

    // Itinerary: String[] (mediaUrls, highlightPhotos) + campos JSON
    const itineraries = await prisma.itinerary.findMany({
        select: {
            id: true, title: true, mediaUrls: true, highlightPhotos: true,
            flightInfo: true, attractions: true, restaurants: true,
            extraSpendingItems: true, spendingProfile: true, receiveList: true,
        },
    });
    for (const it of itineraries) {
        const data: Record<string, unknown> = {};
        const detail: string[] = [];

        for (const field of ['mediaUrls', 'highlightPhotos'] as const) {
            const arr = it[field];
            let changed = false;
            const rewritten = arr.map((u) => {
                const rw = rewriteUploadUrl(u);
                if (!rw) return u;
                changed = true;
                referencedPaths.add(rw.storagePath);
                detail.push(`${field}: ${u} → ${rw.newValue}`);
                return rw.newValue;
            });
            if (changed) data[field] = rewritten;
        }
        for (const field of ['flightInfo', 'attractions', 'restaurants', 'extraSpendingItems', 'spendingProfile', 'receiveList'] as const) {
            const raw = it[field];
            if (raw == null) continue;
            const hits: string[] = [];
            const { value, changed } = rewriteJsonDeep(raw, hits);
            if (changed) {
                hits.forEach(h => referencedPaths.add(h));
                detail.push(`${field} (JSON): ${hits.length} URL(s) reescrita(s)`);
                data[field] = value as Prisma.InputJsonValue;
            }
        }
        if (Object.keys(data).length > 0) {
            changes.push({
                label: `Itinerary ${it.id} ("${it.title.slice(0, 50)}")\n        ${detail.join('\n        ')}`,
                apply: () => prisma.itinerary.update({ where: { id: it.id }, data }).then(() => {}),
            });
        }
    }

    // ItineraryActivity.images (String[])
    for (const act of await prisma.itineraryActivity.findMany({ where: { images: { isEmpty: false } }, select: { id: true, title: true, images: true } })) {
        let changed = false;
        const detail: string[] = [];
        const rewritten = act.images.map((u) => {
            const rw = rewriteUploadUrl(u);
            if (!rw) return u;
            changed = true;
            referencedPaths.add(rw.storagePath);
            detail.push(`${u} → ${rw.newValue}`);
            return rw.newValue;
        });
        if (changed) {
            changes.push({
                label: `ItineraryActivity ${act.id} (${act.title}) images:\n        ${detail.join('\n        ')}`,
                apply: () => prisma.itineraryActivity.update({ where: { id: act.id }, data: { images: rewritten } }).then(() => {}),
            });
        }
    }

    console.log(`\n🗄️  REFERÊNCIAS NO BANCO A REESCREVER (${changes.length} registros):`);
    if (changes.length === 0) console.log('   (nenhuma)');
    changes.forEach((c, i) => console.log(`   ${i + 1}. ${c.label}`));

    // Arquivos no disco que ninguém referencia (sobem mesmo assim, por segurança)
    const orphans = publicUploads.filter(f => !referencedPaths.has(f.relPath));
    if (orphans.length > 0) {
        console.log(`\n👻 Arquivos locais sem referência no banco (sobem mesmo assim): ${orphans.length}`);
    }

    if (!APPLY) {
        console.log('\n✋ DRY-RUN — nada foi alterado. Rode com --apply para executar.');
        return;
    }

    // ── 5. APPLY ──────────────────────────────────────────────────────────
    console.log('\n🚀 Aplicando...\n');

    let uploaded = 0;
    for (const f of publicUploads) {
        const buffer = await fs.promises.readFile(f.absPath);
        try {
            await uploadBufferToCloud(buffer, f.relPath, contentTypeForFilename(f.relPath));
            uploaded++;
            console.log(`   ✅ upload ${f.relPath}`);
        } catch (e: any) {
            if (/already exists|Duplicate/i.test(e.message)) {
                console.log(`   ↩️  já existia no bucket: ${f.relPath}`);
            } else {
                throw e;
            }
        }
    }
    console.log(`   ⬆️  ${uploaded} arquivos enviados ao bucket "${UPLOADS_BUCKET}".\n`);

    for (const p of privatePlan) {
        if (p.hasContent) continue;
        const local = localByPath.get(p.relPath);
        if (!local) {
            console.log(`   ⚠️  TravelerFile ${p.id}: arquivo legado ausente, pulado.`);
            continue;
        }
        const bytes = await fs.promises.readFile(local.absPath);
        await prisma.travelerFile.update({ where: { id: p.id }, data: { content: bytes } });
        console.log(`   🔐 TravelerFile ${p.id}: content importado (${fmtKB(bytes.length)}).`);
    }

    for (const [i, c] of changes.entries()) {
        await c.apply();
        console.log(`   ✅ [${i + 1}/${changes.length}] ${c.label.split('\n')[0]}`);
    }

    console.log('\n🎉 Migração concluída. Arquivos locais NÃO foram apagados (apague manualmente após validar o app).');
}

main()
    .catch((e) => {
        console.error('\n❌ Erro na migração:', e);
        process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
