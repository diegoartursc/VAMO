-- Migration: Add Traveler.coverUrl (foto de capa do perfil)
--
-- Adiciona coluna opcional para a URL pública da capa do perfil. Avatar
-- já existe (Traveler.avatar). Sem backfill — usuários existentes ficam
-- com NULL e o app cai no header padrão.

ALTER TABLE "travelers" ADD COLUMN "coverUrl" TEXT;
