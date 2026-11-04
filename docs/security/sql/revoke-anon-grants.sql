-- PENDENTE DE APROVAÇÃO DO DIEGO. Não está em prisma/migrations de propósito
-- (lá ele seria aplicado sozinho no próximo deploy).
--
-- O que é: o Supabase dá, por padrão, permissão total aos papéis `anon` e
-- `authenticated` em todas as tabelas do schema public. Hoje isso NÃO expõe
-- dado nenhum: as 45 tabelas têm RLS ligado e nenhuma policy, então a Data API
-- recusa toda linha (verificado em 04/11/2026). Este script tira a permissão
-- também, como segunda trava: se um dia alguém desligar o RLS de uma tabela
-- por engano, ela continua fechada.
--
-- Quem usa o banco hoje: só o backend (papel postgres, pelo pooler) e o
-- painel do Supabase. Nenhum app usa a chave anon (conferido no código e no
-- bundle do app). Nada deve quebrar.
--
-- Como aplicar, se aprovado: virar uma migration em prisma/migrations
-- (commit + push), ou rodar no SQL editor do Supabase. Para desfazer:
--   GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated;

-- Tabelas que o Prisma criar no futuro já nascem sem essas permissões.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anon, authenticated;

-- Bucket de mídia pública: limite de tamanho e de tipo também no Storage
-- (hoje só o backend impõe esses limites).
UPDATE storage.buckets
   SET file_size_limit = 104857600, -- 100 MB, igual ao UPLOAD_MAX_FILE_BYTES do backend
       allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','image/heic','image/heif','image/heic-sequence','image/heif-sequence',
                                  'video/mp4','video/quicktime','video/webm','application/pdf'] -- mesma lista de routes/uploads.ts
 WHERE id = 'vamo-uploads';
