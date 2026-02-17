-- CreateEnum
CREATE TYPE "EmployeeRole" AS ENUM ('MANAGER', 'ATTENDANT');

-- CreateEnum
CREATE TYPE "AgencyPlan" AS ENUM ('FREE');

-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('EMAIL', 'GOOGLE', 'APPLE', 'FACEBOOK');

-- CreateEnum
CREATE TYPE "VerificationLevel" AS ENUM ('BASIC', 'TRUSTED', 'EXPERT', 'AMBASSADOR');

-- CreateEnum
CREATE TYPE "PackageBadge" AS ENUM ('BESTSELLER', 'FLASH', 'LUXURY', 'VALUE', 'VERIFIED', 'NEW', 'FEATURED');

-- CreateEnum
CREATE TYPE "PackageStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ItineraryStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PurchaseStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('PRICE_ALERT', 'PURCHASE_UPDATE', 'PROMO', 'SYSTEM');

-- CreateEnum
CREATE TYPE "BookingTimelineStatus" AS ENUM ('COMPLETED', 'IN_PROGRESS', 'PENDING');

-- CreateEnum
CREATE TYPE "BookingDocumentType" AS ENUM ('VOUCHER', 'TICKET', 'POLICY', 'INFO');

-- CreateTable
CREATE TABLE "agencies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "logo" TEXT,
    "contactUrl" TEXT,
    "whatsapp" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "plan" "AgencyPlan" NOT NULL DEFAULT 'FREE',
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verificationDoc" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agency_employees" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "EmployeeRole" NOT NULL DEFAULT 'ATTENDANT',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agency_employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "travelers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "avatar" TEXT,
    "authProvider" "AuthProvider" NOT NULL DEFAULT 'EMAIL',
    "authProviderId" TEXT,
    "bio" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "travelers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "traveler_personal_data" (
    "id" TEXT NOT NULL,
    "travelerId" TEXT NOT NULL,
    "cpf" TEXT,
    "phone" TEXT,
    "birthDate" TIMESTAMP(3),
    "passportNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "traveler_personal_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creators" (
    "id" TEXT NOT NULL,
    "travelerId" TEXT NOT NULL,
    "verificationLevel" "VerificationLevel" NOT NULL DEFAULT 'BASIC',
    "bio" TEXT NOT NULL,
    "destinations" TEXT[],
    "languages" TEXT[],
    "memberSince" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "instagramUrl" TEXT,
    "youtubeUrl" TEXT,
    "blogUrl" TEXT,
    "totalSales" INTEGER NOT NULL DEFAULT 0,
    "averageRating" DOUBLE PRECISION,
    "responseTime" TEXT,
    "tripsCompleted" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creator_balances" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "availableBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pendingBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creator_balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "packages" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "fullDescription" TEXT,
    "emotionalIntro" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "duration" INTEGER NOT NULL,
    "maxSlots" INTEGER,
    "priceMin" DOUBLE PRECISION,
    "priceMax" DOUBLE PRECISION,
    "includes" TEXT[],
    "includedItems" TEXT[],
    "highlights" TEXT[],
    "notRecommendedFor" TEXT[],
    "importantInfo" TEXT[],
    "perfectFor" TEXT[],
    "categories" TEXT[],
    "inclusions" JSONB,
    "routeDetails" JSONB,
    "badge" "PackageBadge",
    "rating" DOUBLE PRECISION,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "hasFreeCancellation" BOOLEAN NOT NULL DEFAULT false,
    "isAllInclusive" BOOLEAN NOT NULL DEFAULT false,
    "recentPurchases" INTEGER NOT NULL DEFAULT 0,
    "priceComparison" TEXT,
    "priceDiscount" INTEGER NOT NULL DEFAULT 0,
    "status" "PackageStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_images" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "package_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_pricing_windows" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "availableSlots" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "package_pricing_windows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itineraries" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "duration" INTEGER NOT NULL,
    "rating" DOUBLE PRECISION,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "highlights" TEXT[],
    "inclusions" TEXT[],
    "estimatedSpending" JSONB,
    "status" "ItineraryStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "itineraries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itinerary_images" (
    "id" TEXT NOT NULL,
    "itineraryId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "itinerary_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itinerary_files" (
    "id" TEXT NOT NULL,
    "itineraryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "itinerary_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itinerary_days" (
    "id" TEXT NOT NULL,
    "itineraryId" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "itinerary_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itinerary_activities" (
    "id" TEXT NOT NULL,
    "dayId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "duration" TEXT,
    "location" TEXT,
    "tips" TEXT,
    "time" TEXT,
    "type" TEXT,
    "icon" TEXT,
    "images" TEXT[],
    "mapLink" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "itinerary_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itinerary_sales" (
    "id" TEXT NOT NULL,
    "itineraryId" TEXT NOT NULL,
    "travelerId" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "commission" DOUBLE PRECISION NOT NULL,
    "purchaseData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "itinerary_sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "travelerId" TEXT NOT NULL,
    "packageId" TEXT,
    "itineraryId" TEXT,
    "rating" DOUBLE PRECISION NOT NULL,
    "comment" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "language" TEXT,
    "userName" TEXT,
    "userLocation" TEXT,
    "userAvatar" TEXT,
    "userInitial" TEXT,
    "helpful" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_images" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_responses" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "agencyId" TEXT,
    "creatorId" TEXT,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_history" (
    "id" TEXT NOT NULL,
    "travelerId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "pricingWindowId" TEXT,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "travelers" INTEGER NOT NULL DEFAULT 1,
    "status" "PurchaseStatus" NOT NULL DEFAULT 'PENDING',
    "bookingCode" TEXT,
    "paymentMethod" TEXT,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "adultsCount" INTEGER NOT NULL DEFAULT 1,
    "childrenCount" INTEGER NOT NULL DEFAULT 0,
    "travelDate" TIMESTAMP(3),
    "travelEndDate" TIMESTAMP(3),
    "preparation" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_timelines" (
    "id" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "BookingTimelineStatus" NOT NULL DEFAULT 'PENDING',
    "icon" TEXT NOT NULL,
    "completedDate" TIMESTAMP(3),
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_timelines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_documents" (
    "id" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "type" "BookingDocumentType" NOT NULL,
    "available" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_inclusions" (
    "id" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_inclusions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_items" (
    "id" TEXT NOT NULL,
    "travelerId" TEXT NOT NULL,
    "packageId" TEXT,
    "itineraryId" TEXT,
    "priceAlert" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "travelerId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faq_questions" (
    "id" TEXT NOT NULL,
    "travelerId" TEXT NOT NULL,
    "packageId" TEXT,
    "itineraryId" TEXT,
    "question" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "faq_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faq_answers" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "agencyEmployeeId" TEXT,
    "creatorId" TEXT,
    "answer" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "faq_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "destinations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "popular" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "destinations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "agencies_cnpj_key" ON "agencies"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "agency_employees_email_key" ON "agency_employees"("email");

-- CreateIndex
CREATE UNIQUE INDEX "travelers_email_key" ON "travelers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "traveler_personal_data_travelerId_key" ON "traveler_personal_data"("travelerId");

-- CreateIndex
CREATE UNIQUE INDEX "creators_travelerId_key" ON "creators"("travelerId");

-- CreateIndex
CREATE UNIQUE INDEX "creator_balances_creatorId_key" ON "creator_balances"("creatorId");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_history_bookingCode_key" ON "purchase_history"("bookingCode");

-- CreateIndex
CREATE UNIQUE INDEX "saved_items_travelerId_packageId_key" ON "saved_items"("travelerId", "packageId");

-- CreateIndex
CREATE UNIQUE INDEX "saved_items_travelerId_itineraryId_key" ON "saved_items"("travelerId", "itineraryId");

-- CreateIndex
CREATE UNIQUE INDEX "destinations_name_country_key" ON "destinations"("name", "country");

-- AddForeignKey
ALTER TABLE "agency_employees" ADD CONSTRAINT "agency_employees_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "traveler_personal_data" ADD CONSTRAINT "traveler_personal_data_travelerId_fkey" FOREIGN KEY ("travelerId") REFERENCES "travelers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creators" ADD CONSTRAINT "creators_travelerId_fkey" FOREIGN KEY ("travelerId") REFERENCES "travelers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_balances" ADD CONSTRAINT "creator_balances_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "creators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packages" ADD CONSTRAINT "packages_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_images" ADD CONSTRAINT "package_images_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_pricing_windows" ADD CONSTRAINT "package_pricing_windows_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itineraries" ADD CONSTRAINT "itineraries_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "creators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itinerary_images" ADD CONSTRAINT "itinerary_images_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "itineraries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itinerary_files" ADD CONSTRAINT "itinerary_files_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "itineraries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itinerary_days" ADD CONSTRAINT "itinerary_days_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "itineraries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itinerary_activities" ADD CONSTRAINT "itinerary_activities_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "itinerary_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itinerary_sales" ADD CONSTRAINT "itinerary_sales_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "itineraries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itinerary_sales" ADD CONSTRAINT "itinerary_sales_travelerId_fkey" FOREIGN KEY ("travelerId") REFERENCES "travelers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_travelerId_fkey" FOREIGN KEY ("travelerId") REFERENCES "travelers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "itineraries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_images" ADD CONSTRAINT "review_images_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_responses" ADD CONSTRAINT "review_responses_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_responses" ADD CONSTRAINT "review_responses_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_responses" ADD CONSTRAINT "review_responses_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "creators"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_history" ADD CONSTRAINT "purchase_history_travelerId_fkey" FOREIGN KEY ("travelerId") REFERENCES "travelers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_history" ADD CONSTRAINT "purchase_history_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_history" ADD CONSTRAINT "purchase_history_pricingWindowId_fkey" FOREIGN KEY ("pricingWindowId") REFERENCES "package_pricing_windows"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_timelines" ADD CONSTRAINT "booking_timelines_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "purchase_history"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_documents" ADD CONSTRAINT "booking_documents_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "purchase_history"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_inclusions" ADD CONSTRAINT "booking_inclusions_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "purchase_history"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_items" ADD CONSTRAINT "saved_items_travelerId_fkey" FOREIGN KEY ("travelerId") REFERENCES "travelers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_items" ADD CONSTRAINT "saved_items_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_items" ADD CONSTRAINT "saved_items_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "itineraries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_travelerId_fkey" FOREIGN KEY ("travelerId") REFERENCES "travelers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faq_questions" ADD CONSTRAINT "faq_questions_travelerId_fkey" FOREIGN KEY ("travelerId") REFERENCES "travelers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faq_questions" ADD CONSTRAINT "faq_questions_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faq_questions" ADD CONSTRAINT "faq_questions_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "itineraries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faq_answers" ADD CONSTRAINT "faq_answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "faq_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faq_answers" ADD CONSTRAINT "faq_answers_agencyEmployeeId_fkey" FOREIGN KEY ("agencyEmployeeId") REFERENCES "agency_employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
