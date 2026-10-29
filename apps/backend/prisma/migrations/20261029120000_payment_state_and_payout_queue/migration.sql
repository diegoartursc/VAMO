-- Fase 3 de segurança (SEC-11/12/13/15): valores congelados da venda, estado de pagamento/repasse e eventos Stripe.
-- Só aditiva: colunas novas com DEFAULT ou NULL e uma tabela nova. Vendas antigas ficam com paymentStatus='paid'.
-- AlterTable
ALTER TABLE "itinerary_sales" ADD COLUMN     "commissionCents" INTEGER,
ADD COLUMN     "creatorEarningCents" INTEGER,
ADD COLUMN     "disputeStatus" TEXT,
ADD COLUMN     "paidAmountCents" INTEGER,
ADD COLUMN     "paidCurrency" TEXT,
ADD COLUMN     "paymentIntentId" TEXT,
ADD COLUMN     "paymentStatus" TEXT NOT NULL DEFAULT 'paid',
ADD COLUMN     "payoutAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "payoutLastError" TEXT,
ADD COLUMN     "payoutNextAttemptAt" TIMESTAMP(3),
ADD COLUMN     "payoutReversedCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "payoutStatus" TEXT,
ADD COLUMN     "refundedCents" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "stripe_events" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "stripe_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "itinerary_sales_paymentIntentId_key" ON "itinerary_sales"("paymentIntentId");


ALTER TABLE "stripe_events" ENABLE ROW LEVEL SECURITY;
