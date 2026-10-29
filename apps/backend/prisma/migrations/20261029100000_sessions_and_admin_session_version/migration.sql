-- Fase 1 de segurança (SEC-01/SEC-07): sessões revogáveis do viajante e versão de sessão do admin.
-- Só aditiva: tabela nova e coluna com DEFAULT 0.

-- AlterTable
ALTER TABLE "admins" ADD COLUMN     "sessionVersion" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "traveler_sessions" (
    "id" TEXT NOT NULL,
    "travelerId" TEXT NOT NULL,
    "refreshJti" TEXT NOT NULL,
    "prevRefreshJti" TEXT,
    "rotatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "revokedReason" TEXT,

    CONSTRAINT "traveler_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "traveler_sessions_travelerId_idx" ON "traveler_sessions"("travelerId");

-- AddForeignKey
ALTER TABLE "traveler_sessions" ADD CONSTRAINT "traveler_sessions_travelerId_fkey" FOREIGN KEY ("travelerId") REFERENCES "travelers"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Mesma política das outras tabelas: só o backend (service role/owner) acessa.
ALTER TABLE "traveler_sessions" ENABLE ROW LEVEL SECURITY;
