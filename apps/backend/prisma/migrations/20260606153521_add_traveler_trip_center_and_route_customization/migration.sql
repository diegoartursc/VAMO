-- CreateTable
CREATE TABLE "traveler_itinerary_customizations" (
    "id" TEXT NOT NULL,
    "travelerId" TEXT NOT NULL,
    "itineraryId" TEXT NOT NULL,
    "saleId" TEXT,
    "notes" TEXT,
    "addedItems" JSONB NOT NULL DEFAULT '[]',
    "hiddenOriginalIds" JSONB NOT NULL DEFAULT '[]',
    "editedOriginalItems" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "traveler_itinerary_customizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "traveler_checklist_items" (
    "id" TEXT NOT NULL,
    "travelerId" TEXT NOT NULL,
    "itineraryId" TEXT NOT NULL,
    "purchaseId" TEXT,
    "category" TEXT NOT NULL,
    "item" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "traveler_checklist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "traveler_files" (
    "id" TEXT NOT NULL,
    "travelerId" TEXT NOT NULL,
    "itineraryId" TEXT NOT NULL,
    "purchaseId" TEXT,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "traveler_files_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "traveler_itinerary_customizations_saleId_idx" ON "traveler_itinerary_customizations"("saleId");

-- CreateIndex
CREATE UNIQUE INDEX "traveler_itinerary_customizations_travelerId_itineraryId_key" ON "traveler_itinerary_customizations"("travelerId", "itineraryId");

-- CreateIndex
CREATE INDEX "traveler_checklist_items_travelerId_itineraryId_idx" ON "traveler_checklist_items"("travelerId", "itineraryId");

-- CreateIndex
CREATE INDEX "traveler_checklist_items_purchaseId_idx" ON "traveler_checklist_items"("purchaseId");

-- CreateIndex
CREATE INDEX "traveler_files_travelerId_itineraryId_idx" ON "traveler_files"("travelerId", "itineraryId");

-- CreateIndex
CREATE INDEX "traveler_files_purchaseId_idx" ON "traveler_files"("purchaseId");

-- AddForeignKey
ALTER TABLE "traveler_itinerary_customizations" ADD CONSTRAINT "traveler_itinerary_customizations_travelerId_fkey" FOREIGN KEY ("travelerId") REFERENCES "travelers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "traveler_itinerary_customizations" ADD CONSTRAINT "traveler_itinerary_customizations_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "itineraries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "traveler_itinerary_customizations" ADD CONSTRAINT "traveler_itinerary_customizations_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "itinerary_sales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "traveler_checklist_items" ADD CONSTRAINT "traveler_checklist_items_travelerId_fkey" FOREIGN KEY ("travelerId") REFERENCES "travelers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "traveler_checklist_items" ADD CONSTRAINT "traveler_checklist_items_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "itineraries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "traveler_checklist_items" ADD CONSTRAINT "traveler_checklist_items_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "purchase_history"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "traveler_files" ADD CONSTRAINT "traveler_files_travelerId_fkey" FOREIGN KEY ("travelerId") REFERENCES "travelers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "traveler_files" ADD CONSTRAINT "traveler_files_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "itineraries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "traveler_files" ADD CONSTRAINT "traveler_files_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "purchase_history"("id") ON DELETE SET NULL ON UPDATE CASCADE;
