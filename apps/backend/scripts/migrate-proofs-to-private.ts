/**
 * Migra comprovantes que estão no bucket PÚBLICO (vamo-uploads) para o
 * armazenamento privado (`private_documents`) e troca as referências dos
 * roteiros por `private-doc://<id>` (SEC-03).
 *
 * SIMULAÇÃO por padrão: só lista o que faria, sem gravar nada.
 *
 *   npx tsx scripts/migrate-proofs-to-private.ts            # simulação (inventário)
 *   npx tsx scripts/migrate-proofs-to-private.ts --apply    # copia e troca referências
 *   npx tsx scripts/migrate-proofs-to-private.ts --apply --revoke   # + apaga o objeto público
 *
 * Se o --apply já foi feito antes (sem --revoke), use a lista do backup:
 *   npx tsx scripts/migrate-proofs-to-private.ts --revoke-from scripts/backups/proofs-<data>          # simulação
 *   npx tsx scripts/migrate-proofs-to-private.ts --revoke-from scripts/backups/proofs-<data> --apply  # apaga
 *
 * Ordem segura: rodar backup do banco antes; --apply; conferir o painel admin
 * (comprovantes abrindo por link assinado); só então --revoke.
 * --apply é reversível pelo arquivo de backup gravado em scripts/backups/
 * (referências antigas). --revoke NÃO é reversível sem a cópia local dos
 * arquivos, que o script grava em scripts/backups/proofs-<data>/ antes de apagar.
 */
import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { mapDocRefs } from '../src/lib/privateDocs';
import { hasValidFileSignature } from '../src/lib/file-signature';

const APPLY = process.argv.includes('--apply');
const REVOKE = process.argv.includes('--revoke');
const BUCKET = 'vamo-uploads';
const PUBLIC_MARKER = `/storage/v1/object/public/${BUCKET}/`;
const MIME_BY_EXT: Record<string, string> = {
    pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
    webp: 'image/webp', heic: 'image/heic', heif: 'image/heif',
};

const prisma = new PrismaClient();
const redact = (s: string) => crypto.createHash('sha256').update(s).digest('hex').slice(0, 10);
const storagePathOf = (url: string) => {
    const i = url.indexOf(PUBLIC_MARKER);
    return i >= 0 ? decodeURIComponent(url.slice(i + PUBLIC_MARKER.length).split('?')[0]) : null;
};

type Ref = { itineraryId: string; where: string; url: string; storagePath: string };

function collectPublicRefs(itineraryId: string, where: string, value: unknown, refs: Ref[]) {
    mapDocRefs(value, (url) => {
        const storagePath = storagePathOf(url);
        if (storagePath) refs.push({ itineraryId, where, url, storagePath });
        return url;
    });
}

type ItineraryRefs = {
    id: string; travelProofUrl: string | null; attractions: unknown; restaurants: unknown; extraSpendingItems: unknown; flightInfo: unknown; estimatedSpending: unknown;
    accommodations: { id: string; cost: unknown }[]; transports: { id: string; cost: unknown }[];
};
function collectAllPublicRefs(itineraries: ItineraryRefs[]): Ref[] {
    const refs: Ref[] = [];
    for (const it of itineraries) {
        collectPublicRefs(it.id, 'travelProofUrl', { travelProofUrl: it.travelProofUrl }, refs);
        collectPublicRefs(it.id, 'attractions', it.attractions, refs);
        collectPublicRefs(it.id, 'restaurants', it.restaurants, refs);
        collectPublicRefs(it.id, 'extraSpendingItems', it.extraSpendingItems, refs);
        collectPublicRefs(it.id, 'flightInfo', it.flightInfo, refs);
        collectPublicRefs(it.id, 'estimatedSpending', it.estimatedSpending, refs); // recibos (R-05)
        for (const a of it.accommodations) collectPublicRefs(it.id, `accommodation:${a.id}`, { cost: a.cost }, refs);
        for (const t of it.transports) collectPublicRefs(it.id, `transport:${t.id}`, { cost: t.cost }, refs);
    }
    return refs;
}

/**
 * Remoção dos objetos públicos DEPOIS de um --apply já feito (o --apply troca as
 * referências, então rodar de novo não encontra mais nada no bucket público).
 * Lê a lista do backup `references-before.json` e só apaga um objeto se:
 *  - a cópia local dele existe na mesma pasta de backup;
 *  - nenhum roteiro do banco ainda aponta para o link público dele.
 * Simulação por padrão; apaga só com --apply.
 */
async function revokeFromBackup(backupDir: string) {
    const refFile = path.join(backupDir, 'references-before.json');
    if (!fs.existsSync(refFile)) throw new Error(`Não achei ${refFile}.`);
    const backed: ItineraryRefs[] = JSON.parse(fs.readFileSync(refFile, 'utf8'));
    const paths = Array.from(new Set(collectAllPublicRefs(backed).map((r) => r.storagePath)));

    const current = await prisma.itinerary.findMany({
        select: {
            id: true, travelProofUrl: true, attractions: true, restaurants: true, extraSpendingItems: true, flightInfo: true, estimatedSpending: true,
            accommodations: { select: { id: true, cost: true } }, transports: { select: { id: true, cost: true } },
        },
    });
    const stillReferenced = new Set(collectAllPublicRefs(current).map((r) => r.storagePath));

    const ready: string[] = [];
    for (const p of paths) {
        const local = path.join(backupDir, `${redact(p)}${path.extname(p).toLowerCase()}`);
        const hasCopy = fs.existsSync(local) && fs.statSync(local).size > 0;
        const inUse = stillReferenced.has(p);
        const status = inUse ? 'MANTIDO (roteiro ainda usa o link público)' : !hasCopy ? 'MANTIDO (sem cópia local)' : 'pode apagar';
        console.log(`  - objeto #${redact(p)} (${path.extname(p) || 'sem extensão'}): ${status}`);
        if (!inUse && hasCopy) ready.push(p);
    }
    console.log(`\nNo backup: ${paths.length} objeto(s). Prontos para apagar: ${ready.length}.`);
    if (!APPLY) {
        console.log('Simulação: nada foi apagado. Rode com --apply para apagar do bucket público.');
        return;
    }
    if (!ready.length) return;
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY ausentes.');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
    const { data, error } = await supabase.storage.from(BUCKET).remove(ready);
    console.log(error ? `Falha ao remover: ${error.message}` : `Removidos ${data?.length ?? 0} objeto(s) do bucket público.`);
}

(async () => {
    const revokeFromIdx = process.argv.indexOf('--revoke-from');
    if (revokeFromIdx >= 0) {
        const dir = process.argv[revokeFromIdx + 1];
        if (!dir) throw new Error('Uso: --revoke-from <pasta scripts/backups/proofs-...> [--apply]');
        await revokeFromBackup(path.resolve(dir));
        await prisma.$disconnect();
        return;
    }
    if (REVOKE && !APPLY) throw new Error('--revoke só junto com --apply.');
    const itineraries = await prisma.itinerary.findMany({
        select: {
            id: true, travelProofUrl: true, attractions: true, restaurants: true, extraSpendingItems: true, flightInfo: true, estimatedSpending: true,
            creator: { select: { travelerId: true } },
            accommodations: { select: { id: true, cost: true } },
            transports: { select: { id: true, cost: true } },
        },
    });

    const refs: Ref[] = [];
    for (const it of itineraries) {
        collectPublicRefs(it.id, 'travelProofUrl', { travelProofUrl: it.travelProofUrl }, refs);
        collectPublicRefs(it.id, 'attractions', it.attractions, refs);
        collectPublicRefs(it.id, 'restaurants', it.restaurants, refs);
        collectPublicRefs(it.id, 'extraSpendingItems', it.extraSpendingItems, refs);
        collectPublicRefs(it.id, 'flightInfo', it.flightInfo, refs);
        collectPublicRefs(it.id, 'estimatedSpending', it.estimatedSpending, refs); // recibos (R-05)
        for (const a of it.accommodations) collectPublicRefs(it.id, `accommodation:${a.id}`, { cost: a.cost }, refs);
        for (const t of it.transports) collectPublicRefs(it.id, `transport:${t.id}`, { cost: t.cost }, refs);
    }

    console.log(`Roteiros analisados: ${itineraries.length}. Comprovantes no bucket público: ${refs.length}.`);
    for (const r of refs) console.log(`  - roteiro ${r.itineraryId} · ${r.where} · objeto #${redact(r.storagePath)} (${path.extname(r.storagePath) || 'sem extensão'})`);
    if (!APPLY) {
        console.log('\nSimulação: nada foi alterado. Rode com --apply para migrar.');
        await prisma.$disconnect();
        return;
    }

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY ausentes.');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(__dirname, 'backups', `proofs-${stamp}`);
    fs.mkdirSync(backupDir, { recursive: true, mode: 0o700 });
    const referenceBackup: any[] = [];

    // Um documento privado por objeto público (o mesmo arquivo pode aparecer em vários lugares).
    const docIdByUrl = new Map<string, string>();
    const ownerOf = new Map(itineraries.map((it) => [it.id, it.creator.travelerId]));
    for (const r of refs) {
        if (docIdByUrl.has(r.url)) continue;
        const { data, error } = await supabase.storage.from(BUCKET).download(r.storagePath);
        if (error || !data) { console.error(`  ! objeto #${redact(r.storagePath)} não baixou: ${error?.message}`); continue; }
        const buffer = Buffer.from(await data.arrayBuffer());
        const ext = path.extname(r.storagePath).slice(1).toLowerCase();
        if (!MIME_BY_EXT[ext] || !hasValidFileSignature(buffer, r.storagePath)) { console.error(`  ! objeto #${redact(r.storagePath)} com formato inesperado; ignorado`); continue; }
        fs.writeFileSync(path.join(backupDir, `${redact(r.storagePath)}.${ext}`), buffer, { mode: 0o600 });
        const doc = await prisma.privateDocument.create({
            data: {
                ownerTravelerId: ownerOf.get(r.itineraryId)!, purpose: r.where === 'travelProofUrl' ? 'travelProof' : 'costProof',
                mimeType: MIME_BY_EXT[ext], originalFileName: path.basename(r.storagePath).slice(0, 180),
                sizeBytes: buffer.length, content: buffer,
            },
            select: { id: true },
        });
        docIdByUrl.set(r.url, doc.id);
    }

    const swap = <T>(value: T) => mapDocRefs(value, (url) => (docIdByUrl.has(url) ? `private-doc://${docIdByUrl.get(url)}` : url));
    for (const it of itineraries) {
        const touched = refs.some((r) => r.itineraryId === it.id && docIdByUrl.has(r.url));
        if (!touched) continue;
        referenceBackup.push(it);
        await prisma.$transaction([
            prisma.itinerary.update({
                where: { id: it.id },
                data: {
                    travelProofUrl: swap({ travelProofUrl: it.travelProofUrl }).travelProofUrl,
                    attractions: swap(it.attractions) as any, restaurants: swap(it.restaurants) as any,
                    extraSpendingItems: swap(it.extraSpendingItems) as any, flightInfo: swap(it.flightInfo) as any,
                    estimatedSpending: swap(it.estimatedSpending) as any,
                },
            }),
            ...it.accommodations.map((a) => prisma.itineraryAccommodation.update({ where: { id: a.id }, data: { cost: swap({ cost: a.cost }).cost as any } })),
            ...it.transports.map((t) => prisma.itineraryTransport.update({ where: { id: t.id }, data: { cost: swap({ cost: t.cost }).cost as any } })),
        ]);
    }
    fs.writeFileSync(path.join(backupDir, 'references-before.json'), JSON.stringify(referenceBackup, null, 2), { mode: 0o600 });
    console.log(`\nMigrados: ${docIdByUrl.size} arquivo(s). Backup das referências e cópias em ${path.relative(process.cwd(), backupDir)}.`);

    if (REVOKE) {
        const paths = Array.from(new Set(refs.filter((r) => docIdByUrl.has(r.url)).map((r) => r.storagePath)));
        const { error } = await supabase.storage.from(BUCKET).remove(paths);
        console.log(error ? `Falha ao remover objetos públicos: ${error.message}` : `Removidos ${paths.length} objeto(s) do bucket público.`);
    } else {
        console.log('Objetos públicos ainda existem. Depois de conferir, rode de novo com --apply --revoke.');
    }
    await prisma.$disconnect();
})().catch(async (err) => {
    console.error(err?.message || err);
    await prisma.$disconnect();
    process.exit(1);
});
