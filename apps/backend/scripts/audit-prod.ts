// AUDITORIA READ-ONLY do Supabase prod.
// Uso: npx tsx scripts/audit-prod.ts
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const host = (process.env.DATABASE_URL || '').match(/@([^/:]+)/)?.[1] || 'unknown';
console.log(`🔌 Conectado em: ${host}`);
console.log(`   ${host.includes('supabase') ? '✅ PROD (Supabase)' : '⚠️  LOCAL'}\n`);

const prisma = new PrismaClient();

async function safe<T>(label: string, fn: () => Promise<T>): Promise<T | null> {
  try { return await fn(); } catch (e: any) {
    console.log(`   ⚠️ ${label}: ${e.message.split('\n')[0]}`);
    return null;
  }
}

(async () => {
  try {
    const travelers = await safe('travelers', () => prisma.traveler.findMany({
      select: { id: true, name: true, email: true, createdAt: true, passwordHash: true, authProvider: true },
      orderBy: { createdAt: 'asc' },
    }));
    if (travelers) {
      console.log(`👤 TRAVELERS (${travelers.length} total)`);
      travelers.forEach(u => {
        const flag = u.email.toLowerCase().includes('maria') ? '✅' : '❓';
        console.log(`   ${flag} ${u.email.padEnd(40)} "${u.name}"  hasPwd=${!!u.passwordHash} provider=${u.authProvider}  ${u.createdAt.toISOString().slice(0,10)}`);
      });
    }

    const admins = await safe('admins', () => prisma.admin.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true, active: true },
    }));
    if (admins) {
      console.log(`\n👑 ADMINS (${admins.length} total)`);
      admins.forEach(a => console.log(`   - [${a.role}] ${a.email.padEnd(40)} "${a.name}"  active=${a.active}`));
    }

    const creators = await safe('creators', () => prisma.creator.findMany({
      select: { id: true, verificationLevel: true, traveler: { select: { email: true, name: true } } },
    }));
    if (creators) {
      console.log(`\n🎨 CRIADORES (${creators.length} total)`);
      creators.forEach(c => console.log(`   - ${c.traveler.email.padEnd(40)} "${c.traveler.name}" lvl=${c.verificationLevel}`));
    }

    const agencies = await safe('agencies', () => prisma.agency.findMany({
      select: { id: true, name: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    }));
    if (agencies) {
      console.log(`\n🏢 AGÊNCIAS (${agencies.length} total)`);
      agencies.forEach((a: any) => console.log(`   - "${a.name}"  ${a.createdAt?.toISOString?.().slice(0,10) || ''}`));
    }

    const itins = await safe('itineraries', () => prisma.itinerary.findMany({
      select: { id: true, title: true, status: true, createdAt: true, creator: { select: { traveler: { select: { email: true } } } } },
      orderBy: { createdAt: 'asc' },
    }));
    if (itins) {
      console.log(`\n📍 ROTEIROS (${itins.length} total)`);
      itins.forEach(i => console.log(`   - [${i.status.padEnd(9)}] "${i.title}" by ${i.creator?.traveler?.email || '?'}  ${i.createdAt.toISOString().slice(0,10)}`));
    }

    const sales = await safe('sales', () => prisma.itinerarySale.count());
    if (sales !== null) console.log(`\n💰 VENDAS: ${sales}`);

    const packages = await safe('packages', () => prisma.package.count());
    if (packages !== null) console.log(`📦 PACOTES (agência): ${packages}`);
  } finally {
    await prisma.$disconnect();
  }
})();
