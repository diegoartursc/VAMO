-- PostgreSQL requires new enum values to be committed before they can be used as defaults
-- So we split: first commit ADD VALUE, then in a new implicit transaction set the DEFAULT

-- Step 1: New enums
CREATE TYPE "AdminRole" AS ENUM ('SUPER_ADMIN', 'MODERATOR');

-- Step 2: Add new values to ItineraryStatus (committed at statement level in PostgreSQL 12+)
ALTER TYPE "ItineraryStatus" ADD VALUE IF NOT EXISTS 'DRAFT';
ALTER TYPE "ItineraryStatus" ADD VALUE IF NOT EXISTS 'PENDING_REVIEW';
ALTER TYPE "ItineraryStatus" ADD VALUE IF NOT EXISTS 'APPROVED';
ALTER TYPE "ItineraryStatus" ADD VALUE IF NOT EXISTS 'REJECTED';

-- Step 3: Add new values to PackageStatus
ALTER TYPE "PackageStatus" ADD VALUE IF NOT EXISTS 'DRAFT';
ALTER TYPE "PackageStatus" ADD VALUE IF NOT EXISTS 'PENDING_REVIEW';
ALTER TYPE "PackageStatus" ADD VALUE IF NOT EXISTS 'APPROVED';
ALTER TYPE "PackageStatus" ADD VALUE IF NOT EXISTS 'REJECTED';

-- Step 4: Create admins table
CREATE TABLE "admins" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'MODERATOR',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");

-- Step 5: Create new tables (itinerary extensions)
CREATE TABLE IF NOT EXISTS "itinerary_accommodations" (
    "id" TEXT NOT NULL,
    "itineraryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "neighborhood" TEXT,
    "description" TEXT,
    "priceRange" TEXT,
    "rating" DOUBLE PRECISION,
    "externalLink" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "itinerary_accommodations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "itinerary_transports" (
    "id" TEXT NOT NULL,
    "itineraryId" TEXT NOT NULL,
    "description" TEXT,
    "passTypes" TEXT,
    "estimatedPrice" TEXT,
    "notes" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "itinerary_transports_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "itinerary_checklists" (
    "id" TEXT NOT NULL,
    "itineraryId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "item" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "itinerary_checklists_pkey" PRIMARY KEY ("id")
);

-- Step 6: Add columns to itineraries
ALTER TABLE "itineraries"
  ADD COLUMN IF NOT EXISTS "activeModules" TEXT[],
  ADD COLUMN IF NOT EXISTS "allowPdf" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "allowShare" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "approvalNote" TEXT,
  ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "approvedBy" TEXT,
  ADD COLUMN IF NOT EXISTS "categories" TEXT[],
  ADD COLUMN IF NOT EXISTS "immediateAccess" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "installments" INTEGER,
  ADD COLUMN IF NOT EXISTS "lifetimeAccess" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "offlineDownload" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "productType" TEXT NOT NULL DEFAULT 'DIGITAL',
  ADD COLUMN IF NOT EXISTS "promoPrice" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "qualityScore" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "subtitle" VARCHAR(160),
  ADD COLUMN IF NOT EXISTS "travelStyles" TEXT[];

-- Step 7: Add columns to itinerary_activities
ALTER TABLE "itinerary_activities"
  ADD COLUMN IF NOT EXISTS "category" TEXT,
  ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION;

-- Step 8: Add columns to packages
ALTER TABLE "packages"
  ADD COLUMN IF NOT EXISTS "additionalCities" TEXT[],
  ADD COLUMN IF NOT EXISTS "airport" TEXT,
  ADD COLUMN IF NOT EXISTS "approvalNote" TEXT,
  ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "approvedBy" TEXT,
  ADD COLUMN IF NOT EXISTS "autoMessage" TEXT,
  ADD COLUMN IF NOT EXISTS "cancellationPolicy" TEXT,
  ADD COLUMN IF NOT EXISTS "continent" TEXT,
  ADD COLUMN IF NOT EXISTS "eticketUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "installments" INTEGER,
  ADD COLUMN IF NOT EXISTS "multiDestination" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "nights" INTEGER,
  ADD COLUMN IF NOT EXISTS "promoPrice" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "qualityScore" INTEGER,
  ADD COLUMN IF NOT EXISTS "travelStyles" TEXT[],
  ADD COLUMN IF NOT EXISTS "voucherUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "whatsappOfficial" TEXT;

-- Step 9: Foreign keys for new tables
ALTER TABLE "itinerary_accommodations" DROP CONSTRAINT IF EXISTS "itinerary_accommodations_itineraryId_fkey";
ALTER TABLE "itinerary_accommodations" ADD CONSTRAINT "itinerary_accommodations_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "itineraries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "itinerary_transports" DROP CONSTRAINT IF EXISTS "itinerary_transports_itineraryId_fkey";
ALTER TABLE "itinerary_transports" ADD CONSTRAINT "itinerary_transports_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "itineraries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "itinerary_checklists" DROP CONSTRAINT IF EXISTS "itinerary_checklists_itineraryId_fkey";
ALTER TABLE "itinerary_checklists" ADD CONSTRAINT "itinerary_checklists_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "itineraries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 10: Create AUDIT_LOG table for LGPD compliance
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "who" TEXT NOT NULL,
    "timestamp" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip" TEXT,
    "changes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- Create indexes for efficient audit queries
CREATE INDEX "audit_logs_who_idx" ON "audit_logs"("who");
CREATE INDEX "audit_logs_target_idx" ON "audit_logs"("target");
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");
