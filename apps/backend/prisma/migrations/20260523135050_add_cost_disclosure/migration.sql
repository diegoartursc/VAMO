-- Migration: Add cost disclosure (transparência graduada de custos)
--
-- Adds 3 optional JSON columns to support per-item cost transparency:
--   - itinerary_accommodations.spending / .cost
--   - itinerary_transports.spending     / .cost
--   - itineraries.extraSpendingItems    (array de itens do módulo "Gastos Extras")
--
-- All columns are NULLABLE — existing itineraries continue to work
-- without any data backfill. Reversible (DROP COLUMN).

-- AlterTable: itinerary_accommodations
ALTER TABLE "itinerary_accommodations"
  ADD COLUMN "spending" JSONB,
  ADD COLUMN "cost"     JSONB;

-- AlterTable: itinerary_transports
ALTER TABLE "itinerary_transports"
  ADD COLUMN "spending" JSONB,
  ADD COLUMN "cost"     JSONB;

-- AlterTable: itineraries
ALTER TABLE "itineraries"
  ADD COLUMN "extraSpendingItems" JSONB;
