-- CreateTable
CREATE TABLE "currency_rates" (
    "id" TEXT NOT NULL DEFAULT 'current',
    "base" TEXT NOT NULL,
    "rates" JSONB NOT NULL,
    "source" TEXT NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "currency_rates_pkey" PRIMARY KEY ("id")
);

