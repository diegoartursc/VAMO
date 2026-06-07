-- Secure the post-purchase traveler layer without deleting existing data.
-- Backfill uses the canonical ItinerarySale for the same traveler/itinerary.

ALTER TABLE "traveler_checklist_items"
  ADD COLUMN "saleId" TEXT;

ALTER TABLE "traveler_files"
  ADD COLUMN "saleId" TEXT,
  ADD COLUMN "originalFileName" TEXT,
  ADD COLUMN "note" TEXT,
  ADD COLUMN "content" BYTEA;

UPDATE "traveler_itinerary_customizations" c
SET "saleId" = (
  SELECT s."id"
  FROM "itinerary_sales" s
  WHERE s."travelerId" = c."travelerId"
    AND s."itineraryId" = c."itineraryId"
  ORDER BY s."createdAt" DESC
  LIMIT 1
)
WHERE c."saleId" IS NULL;

UPDATE "traveler_checklist_items" c
SET "saleId" = (
  SELECT s."id"
  FROM "itinerary_sales" s
  WHERE s."travelerId" = c."travelerId"
    AND s."itineraryId" = c."itineraryId"
  ORDER BY s."createdAt" DESC
  LIMIT 1
);

UPDATE "traveler_files" f
SET "saleId" = (
  SELECT s."id"
  FROM "itinerary_sales" s
  WHERE s."travelerId" = f."travelerId"
    AND s."itineraryId" = f."itineraryId"
  ORDER BY s."createdAt" DESC
  LIMIT 1
);

CREATE INDEX "traveler_checklist_items_saleId_idx"
  ON "traveler_checklist_items"("saleId");
CREATE INDEX "traveler_files_saleId_idx"
  ON "traveler_files"("saleId");

ALTER TABLE "traveler_checklist_items"
  ADD CONSTRAINT "traveler_checklist_items_saleId_fkey"
  FOREIGN KEY ("saleId") REFERENCES "itinerary_sales"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "traveler_files"
  ADD CONSTRAINT "traveler_files_saleId_fkey"
  FOREIGN KEY ("saleId") REFERENCES "itinerary_sales"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "traveler_itinerary_customizations"
  DROP CONSTRAINT "traveler_itinerary_customizations_saleId_fkey",
  ADD CONSTRAINT "traveler_itinerary_customizations_saleId_fkey"
  FOREIGN KEY ("saleId") REFERENCES "itinerary_sales"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Purchased routes are archived by the application. Restrict physical
-- deletion so acquired access and traveler data cannot disappear silently.
ALTER TABLE "itinerary_sales"
  DROP CONSTRAINT "itinerary_sales_itineraryId_fkey",
  ADD CONSTRAINT "itinerary_sales_itineraryId_fkey"
  FOREIGN KEY ("itineraryId") REFERENCES "itineraries"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "traveler_itinerary_customizations"
  DROP CONSTRAINT "traveler_itinerary_customizations_itineraryId_fkey",
  ADD CONSTRAINT "traveler_itinerary_customizations_itineraryId_fkey"
  FOREIGN KEY ("itineraryId") REFERENCES "itineraries"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "traveler_checklist_items"
  DROP CONSTRAINT "traveler_checklist_items_itineraryId_fkey",
  ADD CONSTRAINT "traveler_checklist_items_itineraryId_fkey"
  FOREIGN KEY ("itineraryId") REFERENCES "itineraries"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "traveler_files"
  DROP CONSTRAINT "traveler_files_itineraryId_fkey",
  ADD CONSTRAINT "traveler_files_itineraryId_fkey"
  FOREIGN KEY ("itineraryId") REFERENCES "itineraries"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
