/**
 * Dados FICTÍCIOS para a auditoria de segurança e os testes de carga.
 *
 * Só roda contra um banco LOCAL dedicado (padrão: vamo_audit). Recusa qualquer
 * outro host ou nome de banco, para nunca tocar a produção. Não é seed do app:
 * apaga e recria tudo dentro do banco de auditoria a cada execução.
 *
 *   AUDIT_DATABASE_URL=postgresql://<user>@localhost:5432/vamo_audit \
 *     npx tsx scripts/audit/create-fixtures.ts [--bulk 300]
 *
 * Grava as credenciais de teste em tests/security/.fixtures.local.json
 * (fora do Git). Os textos pagos levam o marcador PAID-SECRET-* e os privados
 * PRIVATE-SECRET-*, para os testes detectarem vazamento procurando a string.
 */
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const url = process.env.AUDIT_DATABASE_URL || '';
const parsed = (() => { try { return new URL(url); } catch { return null; } })();
if (!parsed || !['localhost', '127.0.0.1'].includes(parsed.hostname) || !/^\/vamo_audit\w*$/.test(parsed.pathname)) {
    console.error('Recusado: AUDIT_DATABASE_URL precisa apontar para localhost e para um banco vamo_audit*.');
    process.exit(1);
}
process.env.DATABASE_URL = url;

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PrismaClient } = require('@prisma/client');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient({ datasources: { db: { url } } });

const bulkIdx = process.argv.indexOf('--bulk');
const BULK = bulkIdx >= 0 ? Number(process.argv[bulkIdx + 1] || 300) : 0;
const pw = () => `Audit-${crypto.randomBytes(9).toString('base64url')}`;
const OUT = process.env.FIXTURES_OUT ? path.resolve(process.env.FIXTURES_OUT) : path.resolve(__dirname, '../../../../tests/security/.fixtures.local.json');

const DESTS = [
    ['Lisbon', 'Portugal'], ['Kyoto', 'Japan'], ['Cusco', 'Peru'], ['Reykjavik', 'Iceland'], ['Cape Town', 'South Africa'],
    ['Queenstown', 'New Zealand'], ['Tromso', 'Norway'], ['Tulum', 'Mexico'], ['Rome', 'Italy'], ['Bali', 'Indonesia'],
];

async function wipe() {
    const tables: { tablename: string }[] = await prisma.$queryRawUnsafe(
        `select tablename from pg_tables where schemaname='public' and tablename <> '_prisma_migrations'`);
    if (tables.length) await prisma.$executeRawUnsafe(`truncate ${tables.map((t) => `"${t.tablename}"`).join(', ')} cascade`);
}

async function traveler(key: string, name: string, creator: boolean, creds: any) {
    const password = pw();
    const t = await prisma.traveler.create({
        data: {
            name, email: `${key}@audit.vamo.test`, passwordHash: await bcrypt.hash(password, 10),
            termsAcceptedAt: new Date(), termsVersion: 'audit',
            ...(creator ? { creator: { create: { bio: `Bio of ${name}`, destinations: ['Lisbon'], languages: ['en'] } } } : {}),
        },
        include: { creator: true },
    });
    creds[key] = { email: t.email, password, travelerId: t.id, creatorId: t.creator?.id ?? null };
    return t;
}

async function itinerary(creatorId: string, tag: string, status: string, i = 0, extra: any = {}) {
    const [destination, country] = DESTS[i % DESTS.length];
    return prisma.itinerary.create({
        data: {
            creatorId, title: `${destination} ${tag}`, destination, country, description: `Public description ${tag}`,
            price: 9.9 + (i % 7) * 5, currency: 'USD', duration: 3 + (i % 12), highlights: ['Public highlight'],
            travelStyles: ['moderado'], categories: ['culture'], activeModules: ['itinerario', 'dicas', 'checklist', 'restaurantes'],
            extraCities: [], extraCountries: [], generalTips: [`PAID-SECRET-TIP-${tag}`], mediaUrls: [], highlightPhotos: [],
            attractions: [{ name: `PAID-SECRET-ATTRACTION-${tag}`, externalLink: `https://example.test/paid-${tag}` }],
            restaurants: [{ name: `PAID-SECRET-RESTAURANT-${tag}` }],
            travelProofUrl: `private-doc://PRIVATE-SECRET-PROOF-${tag}`,
            approvalNote: `PRIVATE-SECRET-ADMIN-NOTE-${tag}`,
            status, approvedAt: status === 'ACTIVE' ? new Date(Date.now() - i * 3600_000) : null,
            rating: i % 3 ? 4 + (i % 10) / 10 : null, reviewCount: i % 3 ? 1 + (i % 9) : 0,
            days: { create: [1, 2, 3].map((d) => ({
                dayNumber: d, title: `PAID-SECRET-DAY-${d}-${tag}`, summary: 'paid summary',
                activities: { create: [{ title: `PAID-SECRET-ACTIVITY-${d}-${tag}`, location: 'paid location', order: 0 }] },
            })) },
            ...extra,
        },
    });
}

(async () => {
    await wipe();
    const creds: any = { generatedAt: new Date().toISOString(), database: `${parsed.hostname}${parsed.pathname}` };

    const adminPw = pw();
    const admin = await prisma.admin.create({ data: { name: 'Audit Admin', email: 'admin@audit.vamo.test', passwordHash: await bcrypt.hash(adminPw, 10), role: 'SUPER_ADMIN' } });
    creds.admin = { email: admin.email, password: adminPw, adminId: admin.id };
    const modPw = pw();
    const mod = await prisma.admin.create({ data: { name: 'Audit Moderator', email: 'moderator@audit.vamo.test', passwordHash: await bcrypt.hash(modPw, 10), role: 'MODERATOR' } });
    creds.moderator = { email: mod.email, password: modPw, adminId: mod.id };

    await traveler('buyerA', 'Buyer A', false, creds);
    await traveler('buyerB', 'Buyer B', false, creds);
    await traveler('creatorA', 'Creator A', true, creds);
    await traveler('creatorB', 'Creator B', true, creds);

    const A1 = await itinerary(creds.creatorA.creatorId, 'A1', 'ACTIVE', 0);
    const A2 = await itinerary(creds.creatorA.creatorId, 'A2-PENDING', 'PENDING_REVIEW', 1);
    const A3 = await itinerary(creds.creatorA.creatorId, 'A3-DRAFT', 'DRAFT', 2);
    const B1 = await itinerary(creds.creatorB.creatorId, 'B1', 'ACTIVE', 3);
    const B2 = await itinerary(creds.creatorB.creatorId, 'B2-ARCHIVED', 'ARCHIVED', 4);
    creds.itineraries = { A1: A1.id, A2_pending: A2.id, A3_draft: A3.id, B1: B1.id, B2_archived_bought_by_B: B2.id };

    const sale = (itineraryId: string, travelerId: string, price: number) => prisma.itinerarySale.create({
        data: { itineraryId, travelerId, price, commission: +(price * 0.2).toFixed(2), paidAmountCents: Math.round(price * 100), paidCurrency: 'usd',
            commissionCents: Math.round(price * 20), creatorEarningCents: Math.round(price * 80), paymentStatus: 'paid' },
    });
    const sA = await sale(A1.id, creds.buyerA.travelerId, A1.price);
    const sB1 = await sale(B1.id, creds.buyerB.travelerId, B1.price);
    const sB2 = await sale(B2.id, creds.buyerB.travelerId, B2.price);
    creds.sales = { buyerA_A1: sA.id, buyerB_B1: sB1.id, buyerB_B2: sB2.id };

    const item = await prisma.travelerChecklistItem.create({ data: { travelerId: creds.buyerB.travelerId, itineraryId: B1.id, saleId: sB1.id, category: 'custom', item: 'PRIVATE-SECRET-CHECKLIST-B' } });
    const file = await prisma.travelerFile.create({ data: { travelerId: creds.buyerB.travelerId, itineraryId: B1.id, saleId: sB1.id, category: 'voos', title: 'PRIVATE-SECRET-FILE-B', url: 'db://private', mimeType: 'application/pdf', sizeBytes: 5, content: Buffer.from('%PDF-') } });
    const doc = await prisma.privateDocument.create({ data: { ownerTravelerId: creds.creatorB.travelerId, purpose: 'travelProof', mimeType: 'application/pdf', originalFileName: 'proof.pdf', sizeBytes: 5, content: Buffer.from('%PDF-') } });
    await prisma.itinerary.update({ where: { id: B1.id }, data: { travelProofUrl: `private-doc://${doc.id}` } });
    const docA = await prisma.privateDocument.create({ data: { ownerTravelerId: creds.creatorA.travelerId, purpose: 'travelProof', mimeType: 'application/pdf', originalFileName: 'proofA.pdf', sizeBytes: 5, content: Buffer.from('%PDF-') } });
    const review = await prisma.review.create({ data: { itineraryId: B1.id, travelerId: creds.buyerB.travelerId, rating: 5, comment: 'Great trip' } as any }).catch((e: any) => { console.warn('review não criada:', e.message.split('\n').pop()); return null; });
    creds.privateObjects = { checklistItemB: item.id, travelerFileB: file.id, privateDocB: doc.id, privateDocA: docA.id, reviewB: review?.id ?? null };

    if (BULK) {
        for (let i = 0; i < BULK; i++) await itinerary(i % 2 ? creds.creatorA.creatorId : creds.creatorB.creatorId, `BULK-${i}`, 'ACTIVE', i);
    }
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, JSON.stringify(creds, null, 2), { mode: 0o600 });
    console.log(`Fixtures prontos em ${creds.database}: 2 admins, 4 viajantes (2 roteiristas), ${5 + BULK} roteiros, 3 vendas.`);
    console.log(`Credenciais de teste: ${path.relative(process.cwd(), OUT)} (fora do Git).`);
    await prisma.$disconnect();
})().catch(async (e) => { console.error(e?.message || e); await prisma.$disconnect(); process.exit(1); });
