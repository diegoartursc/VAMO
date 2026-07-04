-- Migration: Add ItineraryShare (eventos de compartilhamento + cliques)
--
-- Cria a tabela itinerary_shares para registrar:
--   - Intenções/conclusões de compartilhamento por um viajante ou criador.
--   - Código rastreável (shareCode) usado no link público para contar cliques.
--
-- Sem backfill: tabela nova, totalmente nullable nos campos opcionais. ON
-- DELETE RESTRICT no FK protege histórico de shares caso alguém tente apagar
-- um roteiro com shares — alinhado ao padrão usado pelos demais relacionamentos
-- de auditoria (TravelerFile, TravelerChecklistItem etc).

CREATE TABLE "itinerary_shares" (
    "id"           TEXT NOT NULL,
    "itineraryId"  TEXT NOT NULL,
    "travelerId"   TEXT,
    "creatorId"    TEXT,
    "saleId"       TEXT,
    "actorRole"    TEXT NOT NULL,
    "surface"      TEXT NOT NULL,
    "channel"      TEXT NOT NULL,
    "status"       TEXT NOT NULL,
    "shareCode"    TEXT NOT NULL,
    "clickedCount" INTEGER NOT NULL DEFAULT 0,
    "lastClickAt"  TIMESTAMP(3),
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt"  TIMESTAMP(3),

    CONSTRAINT "itinerary_shares_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "itinerary_shares_shareCode_key" ON "itinerary_shares"("shareCode");
CREATE INDEX "itinerary_shares_itineraryId_idx"  ON "itinerary_shares"("itineraryId");
CREATE INDEX "itinerary_shares_travelerId_idx"   ON "itinerary_shares"("travelerId");
CREATE INDEX "itinerary_shares_creatorId_idx"    ON "itinerary_shares"("creatorId");
CREATE INDEX "itinerary_shares_createdAt_idx"    ON "itinerary_shares"("createdAt");

ALTER TABLE "itinerary_shares"
    ADD CONSTRAINT "itinerary_shares_itineraryId_fkey"
    FOREIGN KEY ("itineraryId") REFERENCES "itineraries"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
