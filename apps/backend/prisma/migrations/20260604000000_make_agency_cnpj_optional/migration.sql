-- Torna o CNPJ da agência opcional (mercado AUD não usa identificação fiscal BR).
-- Múltiplos NULL são permitidos sob o índice @unique no Postgres.
ALTER TABLE "agencies" ALTER COLUMN "cnpj" DROP NOT NULL;
