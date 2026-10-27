-- Repasse de 80% ao roteirista via Stripe Connect (aditivo).
ALTER TABLE "creators" ADD COLUMN "stripeAccountId" TEXT;
CREATE UNIQUE INDEX "creators_stripeAccountId_key" ON "creators"("stripeAccountId");

ALTER TABLE "itinerary_sales" ADD COLUMN "payoutTransferId" TEXT;
ALTER TABLE "itinerary_sales" ADD COLUMN "payoutTransferredAt" TIMESTAMP(3);
ALTER TABLE "itinerary_sales" ADD COLUMN "payoutAmount" DOUBLE PRECISION;
