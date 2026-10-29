-- Fase 2 de segurança (SEC-03): comprovantes fora do bucket público. Só aditiva.
-- CreateTable
CREATE TABLE "private_documents" (
    "id" TEXT NOT NULL,
    "ownerTravelerId" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "content" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "private_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "private_documents_ownerTravelerId_idx" ON "private_documents"("ownerTravelerId");

-- AddForeignKey
ALTER TABLE "private_documents" ADD CONSTRAINT "private_documents_ownerTravelerId_fkey" FOREIGN KEY ("ownerTravelerId") REFERENCES "travelers"("id") ON DELETE CASCADE ON UPDATE CASCADE;


ALTER TABLE "private_documents" ENABLE ROW LEVEL SECURITY;
