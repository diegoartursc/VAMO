/**
 * VAMO — Reset Test Data
 *
 * Apaga TODOS os usuários (travelers + creators) e TODOS os roteiros
 * (itineraries) com seus dependentes, deixando o banco limpo para
 * testes do zero.
 *
 * Preserva:
 *   - admins                (login do painel admin continua funcionando)
 *   - agencies / agency_employees
 *   - packages / package_*  (módulo de agências/pacotes intocado)
 *   - destinations          (catálogo)
 *   - audit_logs            (histórico)
 *
 * Cascateia automaticamente (via @relation onDelete: Cascade):
 *   - PurchaseHistory (compras de travelers em pacotes — cascateia
 *     BookingTimeline, BookingDocument, BookingInclusion, FlightQuote,
 *     AgencyDocument)
 *   - Review, ReviewImage, ReviewResponse
 *   - SavedItem, Notification, FaqQuestion (+ FaqAnswer via Cascade)
 *   - ItinerarySale, ItineraryDay (+ activities), ItineraryImage,
 *     ItineraryFile, ItineraryAccommodation, ItineraryTransport,
 *     ItineraryChecklist
 *   - CreatorBalance
 *
 * Storage local em apps/backend/public/uploads/ é movido para
 * apps/backend/public_backup_<timestamp>/ (não-destrutivo).
 *
 * Como rodar:
 *   npm run db:reset-test-data
 *
 * Proteção contra produção:
 *   NODE_ENV=production sem CONFIRM_PROD_RESET=true → bloqueia.
 */

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

function header(s: string) {
    console.log("\n" + "─".repeat(60));
    console.log(s);
    console.log("─".repeat(60));
}

async function main() {
    header("VAMO — Reset Test Data");

    const env = process.env.NODE_ENV ?? "development";
    const db = process.env.DATABASE_URL?.replace(/\/\/[^@]+@/, "//***@") ?? "(unset)";
    console.log(`Ambiente : ${env}`);
    console.log(`Banco    : ${db}`);

    if (env === "production" && process.env.CONFIRM_PROD_RESET !== "true") {
        console.error(
            "\n[ABORT] NODE_ENV=production. Para confirmar, rode novamente com CONFIRM_PROD_RESET=true.",
        );
        process.exit(1);
    }

    // ── Snapshot antes ──
    header("Contagem ANTES");
    const before = {
        travelers: await prisma.traveler.count(),
        creators: await prisma.creator.count(),
        itineraries: await prisma.itinerary.count(),
        itineraryDays: await prisma.itineraryDay.count(),
        itineraryActivities: await prisma.itineraryActivity.count(),
        itineraryImages: await prisma.itineraryImage.count(),
        itineraryFiles: await prisma.itineraryFile.count(),
        itineraryAccommodations: await prisma.itineraryAccommodation.count(),
        itineraryTransports: await prisma.itineraryTransport.count(),
        itineraryChecklists: await prisma.itineraryChecklist.count(),
        itinerarySales: await prisma.itinerarySale.count(),
        reviews: await prisma.review.count(),
        reviewResponses: await prisma.reviewResponse.count(),
        savedItems: await prisma.savedItem.count(),
        notifications: await prisma.notification.count(),
        faqQuestions: await prisma.faqQuestion.count(),
        faqAnswers: await prisma.faqAnswer.count(),
        purchaseHistory: await prisma.purchaseHistory.count(),
        flightQuotes: await prisma.flightQuote.count(),
        creatorBalances: await prisma.creatorBalance.count(),
        admins: await prisma.admin.count(),
        agencies: await prisma.agency.count(),
        packages: await prisma.package.count(),
    };
    console.table(before);

    // ── Backup pasta uploads ──
    // POLÍTICA: backups NÃO ficam dentro do projeto VAMO. Vão pra
    // `../../VAMO-backups-archive/` (irmã do diretório do projeto).
    // Se a pasta archive não existir, ela é criada na hora.
    header("Backup de uploads (vai PRA FORA do projeto)");
    const publicDir = path.resolve(__dirname, "..", "public");
    if (fs.existsSync(publicDir)) {
        const ts = new Date().toISOString().replace(/[:.]/g, "-");
        // __dirname = apps/backend/scripts/  →  ../../../../  =  pasta-pai-do-VAMO
        const archiveRoot = path.resolve(__dirname, "..", "..", "..", "..", "VAMO-backups-archive");
        fs.mkdirSync(archiveRoot, { recursive: true });
        const backupDir = path.join(archiveRoot, `public_backup_${ts}`);
        fs.renameSync(publicDir, backupDir);
        // Recria a árvore completa que o backend espera (multer usa
        // `public/uploads/itineraries` como destino e só cria a pasta
        // no startup — se ela some, uploads quebram com HTTP 500).
        fs.mkdirSync(path.join(publicDir, "uploads", "itineraries"), { recursive: true });
        console.log(`✓ Movido para ${backupDir}`);
        console.log(`✓ public/uploads/itineraries recriado vazio`);
    } else {
        console.log("(pasta public/ não existe — nada a fazer)");
    }

    // ── DELETE em ordem dependência → pai ──
    header("Excluindo dados");

    const r: Record<string, number> = {};

    // FaqAnswer não cascateia de AgencyEmployee (SetNull),
    // mas cascateia de FaqQuestion. Apagamos via question delete.
    r.notifications        = (await prisma.notification.deleteMany({})).count;
    r.savedItems           = (await prisma.savedItem.deleteMany({})).count;
    r.faqAnswers           = (await prisma.faqAnswer.deleteMany({})).count;
    r.faqQuestions         = (await prisma.faqQuestion.deleteMany({})).count;
    r.reviewResponses      = (await prisma.reviewResponse.deleteMany({})).count;
    r.reviewImages         = (await prisma.reviewImage.deleteMany({})).count;
    r.reviews              = (await prisma.review.deleteMany({})).count;

    r.itinerarySales       = (await prisma.itinerarySale.deleteMany({})).count;
    r.itineraryChecklists  = (await prisma.itineraryChecklist.deleteMany({})).count;
    r.itineraryAccommodations = (await prisma.itineraryAccommodation.deleteMany({})).count;
    r.itineraryTransports  = (await prisma.itineraryTransport.deleteMany({})).count;
    r.itineraryActivities  = (await prisma.itineraryActivity.deleteMany({})).count;
    r.itineraryDays        = (await prisma.itineraryDay.deleteMany({})).count;
    r.itineraryImages      = (await prisma.itineraryImage.deleteMany({})).count;
    r.itineraryFiles       = (await prisma.itineraryFile.deleteMany({})).count;
    r.itineraries          = (await prisma.itinerary.deleteMany({})).count;

    r.creatorBalances      = (await prisma.creatorBalance.deleteMany({})).count;
    r.creators             = (await prisma.creator.deleteMany({})).count;

    // Compras dos travelers em pacotes (preservamos pacotes, mas
    // não dá pra manter compras sem traveler — cascateia documentos,
    // timelines, cotações etc.).
    r.agencyDocuments      = (await prisma.agencyDocument.deleteMany({})).count;
    r.flightQuotes         = (await prisma.flightQuote.deleteMany({})).count;
    r.bookingInclusions    = (await prisma.bookingInclusion.deleteMany({})).count;
    r.bookingDocuments     = (await prisma.bookingDocument.deleteMany({})).count;
    r.bookingTimelines     = (await prisma.bookingTimeline.deleteMany({})).count;
    r.purchaseHistory      = (await prisma.purchaseHistory.deleteMany({})).count;

    r.travelerPersonalData = (await prisma.travelerPersonalData.deleteMany({})).count;
    r.travelers            = (await prisma.traveler.deleteMany({})).count;

    console.table(r);

    // ── Snapshot depois ──
    header("Contagem DEPOIS");
    const after = {
        travelers: await prisma.traveler.count(),
        creators: await prisma.creator.count(),
        itineraries: await prisma.itinerary.count(),
        itinerarySales: await prisma.itinerarySale.count(),
        reviews: await prisma.review.count(),
        savedItems: await prisma.savedItem.count(),
        purchaseHistory: await prisma.purchaseHistory.count(),
        // Preservados
        admins: await prisma.admin.count(),
        agencies: await prisma.agency.count(),
        packages: await prisma.package.count(),
        destinations: await prisma.destination.count(),
        auditLogs: await prisma.auditLog.count(),
    };
    console.table(after);

    const failed: string[] = [];
    if (after.travelers > 0) failed.push(`travelers=${after.travelers}`);
    if (after.creators > 0) failed.push(`creators=${after.creators}`);
    if (after.itineraries > 0) failed.push(`itineraries=${after.itineraries}`);

    if (failed.length > 0) {
        console.error(`\n[FALHA] Sobraram registros: ${failed.join(", ")}`);
        process.exit(2);
    }

    console.log("\n✓ Limpeza concluída. Banco pronto para testes do zero.");
    console.log("  Admins preservados | Agencies/packages preservados");
}

main()
    .catch((e) => {
        console.error("\n[ERRO]", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
