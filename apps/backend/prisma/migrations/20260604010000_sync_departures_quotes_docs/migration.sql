-- Sincroniza tabelas/enums que existiam no schema mas nunca viraram migration
-- (criadas no DB local via prisma db push). Conteúdo aditivo: departures,
-- flight_quotes, agency_documents, colunas extras e defaults AUD.

-- CreateEnum
CREATE TYPE "DepartureStatus" AS ENUM ('ABERTA', 'QUASE_LOTADO', 'ESGOTADO', 'ENCERRADA');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('AWAITING_QUOTE', 'QUOTED', 'ACCEPTED', 'EXPIRED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AgencyDocType" AS ENUM ('BOARDING_PASS', 'HOTEL_VOUCHER', 'HOTEL_CHECKIN', 'TRANSFER_VOUCHER', 'TOUR_TICKET', 'INSURANCE', 'OTHER');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PurchaseStatus" ADD VALUE 'AWAITING_QUOTE';
ALTER TYPE "PurchaseStatus" ADD VALUE 'PROCESSING';
ALTER TYPE "PurchaseStatus" ADD VALUE 'DOCS_SENT';

-- AlterTable
ALTER TABLE "creator_balances" ALTER COLUMN "currency" SET DEFAULT 'AUD';

-- AlterTable
ALTER TABLE "itineraries" ADD COLUMN     "attractions" JSONB,
ADD COLUMN     "coverFocalPoint" JSONB,
ADD COLUMN     "extraCities" TEXT[],
ADD COLUMN     "extraCountries" TEXT[],
ADD COLUMN     "flightInfo" JSONB,
ADD COLUMN     "generalTips" TEXT[],
ADD COLUMN     "highlightPhotos" TEXT[],
ADD COLUMN     "mediaUrls" TEXT[],
ADD COLUMN     "receiveList" JSONB,
ADD COLUMN     "restaurants" JSONB,
ADD COLUMN     "spendingProfile" JSONB,
ADD COLUMN     "travelProofUrl" TEXT,
ADD COLUMN     "tripEndDate" TIMESTAMP(3),
ADD COLUMN     "tripStartDate" TIMESTAMP(3),
ALTER COLUMN "currency" SET DEFAULT 'AUD',
ALTER COLUMN "status" SET DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "itinerary_accommodations" ADD COLUMN     "address" TEXT,
ADD COLUMN     "endDate" TEXT,
ADD COLUMN     "mapLink" TEXT,
ADD COLUMN     "nights" INTEGER,
ADD COLUMN     "priceCurrency" TEXT,
ADD COLUMN     "startDate" TEXT,
ADD COLUMN     "tips" TEXT,
ADD COLUMN     "totalPrice" TEXT;

-- AlterTable
ALTER TABLE "itinerary_transports" ADD COLUMN     "endDate" TEXT,
ADD COLUMN     "priceCurrency" TEXT,
ADD COLUMN     "priceValue" TEXT,
ADD COLUMN     "startDate" TEXT;

-- AlterTable
ALTER TABLE "packages" ALTER COLUMN "currency" SET DEFAULT 'AUD',
ALTER COLUMN "status" SET DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "purchase_history" ADD COLUMN     "autoMessage" TEXT,
ADD COLUMN     "departureId" TEXT,
ADD COLUMN     "eticketUrl" TEXT,
ADD COLUMN     "originCity" TEXT,
ADD COLUMN     "voucherUrl" TEXT;

-- CreateTable
CREATE TABLE "package_departures" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "capacityTotal" INTEGER NOT NULL,
    "capacityVamo" INTEGER NOT NULL,
    "capacityVamoAvailable" INTEGER NOT NULL,
    "minPeople" INTEGER,
    "status" "DepartureStatus" NOT NULL DEFAULT 'ABERTA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "package_departures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flight_quotes" (
    "id" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "originCity" TEXT NOT NULL,
    "originAirport" TEXT,
    "airline" TEXT,
    "flightDetails" TEXT,
    "flightImageUrl" TEXT,
    "airfarePrice" DOUBLE PRECISION,
    "totalPrice" DOUBLE PRECISION,
    "status" "QuoteStatus" NOT NULL DEFAULT 'AWAITING_QUOTE',
    "expiresAt" TIMESTAMP(3),
    "quotedAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "agencyNote" TEXT,
    "userNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "flight_quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agency_documents" (
    "id" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "AgencyDocType" NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "viewedAt" TIMESTAMP(3),

    CONSTRAINT "agency_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "flight_quotes_purchaseId_key" ON "flight_quotes"("purchaseId");

-- AddForeignKey
ALTER TABLE "package_departures" ADD CONSTRAINT "package_departures_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_history" ADD CONSTRAINT "purchase_history_departureId_fkey" FOREIGN KEY ("departureId") REFERENCES "package_departures"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flight_quotes" ADD CONSTRAINT "flight_quotes_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "purchase_history"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agency_documents" ADD CONSTRAINT "agency_documents_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "purchase_history"("id") ON DELETE CASCADE ON UPDATE CASCADE;

