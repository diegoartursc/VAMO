-- AlterTable
ALTER TABLE "travelers" ADD COLUMN     "termsAcceptedAt" TIMESTAMP(3),
ADD COLUMN     "termsVersion" TEXT;

-- AlterTable
ALTER TABLE "itinerary_sales" ADD COLUMN     "reviewReminderSentAt" TIMESTAMP(3),
ADD COLUMN     "reviewRequestSentAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "reviews" ADD COLUMN     "hidden" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hiddenAt" TIMESTAMP(3),
ADD COLUMN     "hiddenReason" TEXT;

-- CreateTable
CREATE TABLE "review_reports" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "review_reports_reviewId_idx" ON "review_reports"("reviewId");

-- CreateIndex
CREATE UNIQUE INDEX "review_reports_reviewId_reporterId_key" ON "review_reports"("reviewId", "reporterId");

-- AddForeignKey
ALTER TABLE "review_reports" ADD CONSTRAINT "review_reports_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_reports" ADD CONSTRAINT "review_reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "travelers"("id") ON DELETE CASCADE ON UPDATE CASCADE;



-- RLS sem policy, como as demais tabelas do schema public (scripts/enable-rls.ts).
ALTER TABLE "review_reports" ENABLE ROW LEVEL SECURITY;
