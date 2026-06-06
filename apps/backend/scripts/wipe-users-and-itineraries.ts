/**
 * Wipe completo de usuários (travelers/creators) e roteiros (itineraries) + dependências.
 *
 * Preserva: admins, agencies, agency_employees, packages, destinations, audit_logs.
 * Faz snapshot JSON do estado antes de deletar em scripts/backups/.
 *
 * Uso:
 *   npx tsx scripts/wipe-users-and-itineraries.ts           # dry-run (só mostra o que faria)
 *   npx tsx scripts/wipe-users-and-itineraries.ts --confirm # executa
 */
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const CONFIRM = process.argv.includes('--confirm');
const p = new PrismaClient();

async function snapshot() {
  const data = {
    takenAt: new Date().toISOString(),
    travelers: await p.traveler.findMany({ include: { personalData: true, creator: { include: { balance: true } } } }),
    itineraries: await p.itinerary.findMany({
      include: {
        images: true, files: true, days: { include: { activities: true } },
        accommodations: true, transports: true, checklists: true, sales: true,
      },
    }),
    reviews: await p.review.findMany({ include: { images: true, responses: true } }),
    purchaseHistory: await p.purchaseHistory.findMany({
      include: { timeline: true, documents: true, bookingInclusions: true, flightQuote: true, agencyDocuments: true },
    }),
    savedItems: await p.savedItem.findMany(),
    notifications: await p.notification.findMany(),
    faqQuestions: await p.faqQuestion.findMany({ include: { answers: true } }),
  };
  const file = path.join(__dirname, 'backups', `wipe-${data.takenAt.replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  return file;
}

async function wipe() {
  // Ordem: filhos → pais. Cascades cobririam, mas deixo explícito.
  const r: Record<string, number> = {};

  r.faqAnswers = (await p.faqAnswer.deleteMany({})).count;
  r.faqQuestions = (await p.faqQuestion.deleteMany({})).count;
  r.reviewResponses = (await p.reviewResponse.deleteMany({})).count;
  r.reviewImages = (await p.reviewImage.deleteMany({})).count;
  r.reviews = (await p.review.deleteMany({})).count;

  r.agencyDocuments = (await p.agencyDocument.deleteMany({})).count;
  r.flightQuotes = (await p.flightQuote.deleteMany({})).count;
  r.bookingInclusions = (await p.bookingInclusion.deleteMany({})).count;
  r.bookingDocuments = (await p.bookingDocument.deleteMany({})).count;
  r.bookingTimelines = (await p.bookingTimeline.deleteMany({})).count;
  r.purchaseHistory = (await p.purchaseHistory.deleteMany({})).count;

  r.savedItems = (await p.savedItem.deleteMany({})).count;
  r.notifications = (await p.notification.deleteMany({})).count;

  r.itinerarySales = (await p.itinerarySale.deleteMany({})).count;
  r.itineraryActivities = (await p.itineraryActivity.deleteMany({})).count;
  r.itineraryDays = (await p.itineraryDay.deleteMany({})).count;
  r.itineraryAccommodations = (await p.itineraryAccommodation.deleteMany({})).count;
  r.itineraryTransports = (await p.itineraryTransport.deleteMany({})).count;
  r.itineraryChecklists = (await p.itineraryChecklist.deleteMany({})).count;
  r.itineraryImages = (await p.itineraryImage.deleteMany({})).count;
  r.itineraryFiles = (await p.itineraryFile.deleteMany({})).count;
  r.itineraries = (await p.itinerary.deleteMany({})).count;

  r.creatorBalances = (await p.creatorBalance.deleteMany({})).count;
  r.creators = (await p.creator.deleteMany({})).count;
  r.travelerPersonalData = (await p.travelerPersonalData.deleteMany({})).count;
  r.travelers = (await p.traveler.deleteMany({})).count;

  return r;
}

async function verify() {
  return {
    travelers: await p.traveler.count(),
    creators: await p.creator.count(),
    itineraries: await p.itinerary.count(),
    itineraryDays: await p.itineraryDay.count(),
    itinerarySales: await p.itinerarySale.count(),
    reviews: await p.review.count(),
    purchaseHistory: await p.purchaseHistory.count(),
    savedItems: await p.savedItem.count(),
    notifications: await p.notification.count(),
    faqQuestions: await p.faqQuestion.count(),
    admins: await p.admin.count(),
    agencies: await p.agency.count(),
    packages: await p.package.count(),
    destinations: await p.destination.count(),
  };
}

(async () => {
  const dbUrl = process.env.DATABASE_URL ?? '';
  const env = dbUrl.includes('localhost') ? 'LOCAL' : dbUrl.includes('supabase') ? 'PRODUÇÃO (Supabase)' : 'DESCONHECIDO';
  console.log(`Conectado em: ${env}`);
  if (!CONFIRM) {
    console.log('\nDRY-RUN — nada será deletado. Rode com --confirm para executar.');
    return;
  }
  console.log('\nFazendo snapshot...');
  const file = await snapshot();
  console.log(`Snapshot salvo em: ${file}`);
  console.log('\nDeletando...');
  const deleted = await wipe();
  console.log(JSON.stringify(deleted, null, 2));
  console.log('\nEstado final:');
  console.log(JSON.stringify(await verify(), null, 2));
  await p.$disconnect();
})();
