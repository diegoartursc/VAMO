# Segurança pós-correção — VAMO (relatório vivo)

Branch: `security-fixes-2026-10-28` (criada a partir de `4bc6f9e`, sem push).
Executor: Claude Opus 5.5, seguindo `docs/PROMPT-CLAUDE-CORRECAO-SEGURANCA-2026-10-28.md`.
Ambiente: `.claude/skip-boot` presente; nenhum servidor local ligado (3333, 8081 e 3034 livres); nenhum acesso a banco, Stripe, SMTP ou storage reais.

Status permitidos: **corrigido e validado** · **já corrigido com evidência** · **condicional/não aplicável com justificativa** · **pendente de operação externa** · **não corrigido**.

---

## Fase 0 — Análise (concluída)

Linha de base antes de qualquer mudança: `npx tsx --test src/**/*.test.ts` no backend → 58 testes, 58 passam. Versões instaladas: express 4.22.1, jsonwebtoken 9.0.3, multer 1.4.5-lts.2, zod 3.25.76.

### Reconfirmação SEC-01 a SEC-16 (código em `4bc6f9e`)

| ID | Estado na Fase 0 | Evidência atual |
| --- | --- | --- |
| SEC-01 | Confirmado por leitura | `lib/auth.ts:22-35` access/refresh com o mesmo segredo, sem tipo; `:41` token de arquivo com o mesmo segredo. `middleware/traveler-auth.ts:24`, `middleware/auth.ts:29,55`, `routes/traveler-auth.ts:201,384,543,726` usam `verifyToken` genérico. Admin (`routes/admin.ts:53,83`, `middleware/admin-auth.ts:32`) também usa o mesmo `JWT_SECRET`. |
| SEC-02 | Confirmado por leitura | `routes/itineraries.ts:879-1010` entrega dias, atividades, dicas, checklist, hospedagens, transportes e `files` a anônimos para roteiro ACTIVE. `:14-111` e `:113-180` (listagem e destaque) devolvem `attractions`, `restaurants`, `extraSpendingItems` e `flightInfo` completos. |
| SEC-03 | Confirmado por leitura | `travelProofUrl` em `itineraries.ts:964` (público) e `:566` (comprador/snapshot); `cost.proofFiles` dentro de `cost` de hospedagens/transportes e dos JSON de módulos. Bucket público em `lib/storage.ts` (`createBucket(..., { public: true })`, `getPublicUrl`). |
| SEC-04 | Confirmado por leitura | `itineraries.ts:185-210` aceita `?creatorId=` com auth opcional; devolve receita e rascunhos. Clientes atuais (`apps/mobile/app/created-itineraries.tsx`, `(tabs)/profile.tsx`) não mandam `creatorId`; `apps/site/src/lib/api.ts:103` manda (dashboard legado do site). |
| SEC-05 | Condicional, confirmado por leitura | `index.ts:108-125`: checagem literal em `/uploads/itineraries/:filename` antes do `express.static`. Só tem impacto se houver arquivo privado legado no disco do servidor (Render tem disco efêmero). |
| SEC-06 | Confirmado por leitura | `admin.ts:26` aceita `mock-admin-token` fora de produção e cria SUPER_ADMIN; `payments.ts` aceita webhook sem assinatura fora de produção; `itineraries.ts:1840` compra demo bloqueada só com `NODE_ENV=production`. O backend local usa o banco de produção (CLAUDE.md). |
| SEC-07 | Confirmado por leitura | `traveler-auth.ts:217-219` checa `passwordChangedAt` só no refresh; middleware não consulta revogação; admin JWT 8h sem revogação. |
| SEC-08 | Confirmado por leitura | `uploads.ts`: `memoryStorage` com cloud, 100 MiB × 20 arquivos. Também `traveler-trip-center.ts` (50 MiB em memória) e avatar/capa. |
| SEC-09 | Confirmado | `npm ls`: multer 1.4.5-lts.2. |
| SEC-10 | Confirmado por leitura | `admin.ts:67-83` (login) e `:88-113` (seed) são async sem try/catch no Express 4; `verifyAdmin` (bypass dev) também. |
| SEC-11 | Confirmado por leitura | Webhook só trata `checkout.session.completed`/`async_payment_succeeded`; `jobs/payouts.ts` só olha vendas sem `payoutTransferId`. |
| SEC-12 | Confirmado por leitura | `refundPaymentIntentIfNeeded` considera qualquer refund `succeeded`/`pending` como devolução completa. |
| SEC-13 | Confirmado por leitura | Fulfillment grava `itinerary.price` atual e recalcula comissão; payout usa moeda atual do roteiro e `computeCreatorEarning` vigente. |
| SEC-14 | Confirmado por leitura | `featured` aceito em `itineraries.ts` POST/PUT; `cost.proofStatus` vem do cliente e o selo usa `approved`. |
| SEC-15 | Confirmado por leitura | `jobs/payouts.ts`: sempre as 50 mais antigas sem `payoutTransferId`, sem cursor nem estado de tentativa. |
| SEC-16 | Contido no arquivo atual | Credencial removida do hook em `1bccf6d`; continua no histórico do Git. `.claude/settings.local.json` (não versionado) contém senhas em comandos permitidos. |

### Análise própria — novos achados

| ID | Gravidade | Achado | Evidência | Fase |
| --- | --- | --- | --- | --- |
| NEW-01 | Alta (conformidade) | "Delete account" no app só mostra "Request sent" e não faz nada: não há endpoint nem registro do pedido. Promete exclusão que não acontece (CCPA e exigência da App Store). | `apps/mobile/app/(tabs)/profile.tsx:701-711`; nenhum `router.delete('/me')` no backend | 4 |
| NEW-02 | Média | Login de viajante e de admin sem limite próprio de tentativas (só o global de 100/15 min por IP em produção). Força bruta e credential stuffing ficam limitados apenas pelo limite global. | `traveler-auth.ts:135`, `admin.ts:67`, `index.ts` | 1 |
| NEW-03 | Baixa | Cadastro revela se o e-mail existe ("Email already registered"); o "esqueci a senha" é neutro. Enumeração de contas. | `traveler-auth.ts:58-60` | 1 (registrar) |
| NEW-04 | Baixa | `approvalNote` (nota interna do admin) volta no detalhe público e no payload do comprador. | `itineraries.ts:967`, `:567` | 2 |
| NEW-05 | Baixa | Compartilhamento grava `saleId` vindo do cliente sem conferir dono. Só integridade de analytics. | `itineraries.ts` `POST /:id/share` | 4 |
| NEW-06 | Baixa, condicional | Em modo disco (sem Supabase), as URLs de upload são montadas com o `Host` da requisição e gravadas no banco. Só afeta ambiente local. | `uploads.ts:115`, `traveler-auth.ts:713` | 4 |
| NEW-07 | Média | Tokens de sessão do app web e do admin ficam em `localStorage`; sem CSP nos frontends. Aumenta o impacto de um XSS (nenhum XSS foi encontrado). | `apps/mobile/src/utils/secureSession.ts`, `apps/site/src/app/admin/login/page.tsx:32` | registrar |

Verificado sem achado relevante: escopo por dono em perguntas, avaliações (criar/editar/denunciar), personalização pós-compra, central da viagem e favoritos; perfil público do criador só lista roteiros ACTIVE; e-mails escapam HTML e o link de reset usa URL configurada (não o Host); `express.json()` com limite padrão de 100 KB; upload valida assinatura do arquivo e rejeita extensões fora da lista; `rates` exige admin para escrita.

Não verificável daqui: RLS e políticas reais do Supabase, conteúdo do bucket, variáveis do Render/Vercel, Deployment Protection, histórico completo de segredos fora do Git.

### Plano revisado

Ordem mantida (Fase 1 contas/admin → 2 conteúdo pago → 3 dinheiro → 4 upload/dependências/confiança + NEW-01). Ajustes:

- O backend sobe o servidor e os jobs no mesmo módulo (`src/index.ts`). Para testar rotas reais sem efeitos, separar `src/app.ts` (cria o app) de `src/index.ts` (listener e jobs).
- Testes HTTP usam o app real numa porta efêmera, Prisma falso injetado via `globalThis.prisma` (já suportado por `lib/prisma.ts`), `.env` real desligado (`DOTENV_CONFIG_PATH` apontando para arquivo inexistente) e `fetch` externo bloqueado.

---

## Fase 1 — Contas e admin (concluída no código)

Teste: `src/security/phase1-auth.test.ts` (app Express real numa porta local, Prisma falso em memória, sem `.env` real nem rede externa) e `src/security/config.test.ts`.

**Antes da correção** (código `030020f`): 21 testes, **3 passaram e 18 falharam ou travaram**. Exemplos: o token de arquivo abriu `/me` (200); refresh foi aceito como Bearer; o `/logout` não existia (404); o access antigo continuou valendo depois do reset de senha; `mock-admin-token` foi aceito; o login admin com `password: {}` travou a requisição até o tempo do teste esgotar (rejeição não tratada); 12 tentativas de login seguidas sem nenhum 429.
**Depois:** 21 de 21 passam. Configuração: 5 de 5. Suíte inteira do backend: 79 de 79 antes do teste de configuração, 84 de 84 com ele. `tsc` do backend, do site e do mobile sem erros novos (o mobile tem 1 erro antigo em `VamoButton.tsx`).

| ID | Causa | Mudança | Arquivos | Status |
| --- | --- | --- | --- | --- |
| SEC-01 | Um segredo e nenhum tipo para access, refresh, arquivo e admin | Chave derivada por finalidade (HMAC do `JWT_SECRET`), `typ`, `iss`, `aud`, só HS256, claims tipadas. Um verificador por finalidade; tokens legados sem `typ` deixam de valer. Middlewares e validadores manuais (`/me`, `PATCH /me`, avatar/capa, passport-stats) usam a mesma validação. | `lib/auth.ts`, `lib/sessions.ts`, `middleware/*.ts`, `routes/traveler-auth.ts`, `routes/admin.ts` | **corrigido e validado** (código local) |
| SEC-06 | Atalhos de dev ativos fora de produção | Removido `mock-admin-token`; webhook exige assinatura em todo ambiente (sem segredo → 503); compra demo só com `NODE_ENV=test` e flag; `lib/config.ts` recusa subir com combinações inseguras; seed do admin exige `ADMIN_SEED_SECRET` sempre | `routes/admin.ts`, `routes/payments.ts`, `routes/itineraries.ts`, `lib/config.ts`, `index.ts`, `.env.example` | **corrigido e validado** |
| SEC-07 | Sem revogação no servidor | Tabela `traveler_sessions`: toda requisição autenticada confere a sessão no banco. Refresh rotativo com detecção de reuso (reuso revoga a sessão). `POST /api/auth/traveler/logout`. Reset de senha (app e script) revoga todas as sessões. Admin: `sessionVersion` no token e no banco; script de reset e `POST /api/admin/logout` incrementam | `prisma/schema.prisma`, migration `20261029100000_sessions_and_admin_session_version`, `lib/sessions.ts`, `scripts/reset-password.ts`, `scripts/reset-admin-password.ts` | **corrigido e validado** (código); migration **pendente de operação externa** |
| SEC-10 | Handlers async sem tratamento no Express 4 | `lib/router.ts` encaminha toda rejeição para o error handler (todas as rotas montadas usam); login/seed admin validam tipos e tamanhos com zod antes do Prisma/bcrypt; `index.ts` registra `unhandledRejection` sem derrubar o processo | `lib/router.ts`, `routes/*.ts`, `routes/admin.ts`, `index.ts` | **corrigido e validado** |
| SEC-16 | Credencial no hook versionado | Removida do arquivo atual (`1bccf6d`). **O repositório no GitHub é público**: a senha antiga continua visível no histórico. A conta da Maria não existe mais no banco; a senha não deve ser reutilizada em lugar nenhum. | `.claude/settings.json`, `scripts/session-start-hook.sh` | **pendente de operação externa** (decidir se o repositório fica público) |
| NEW-02 | Login sem limite próprio | Limite por IP + e-mail: 10 tentativas / 15 min no login de viajante e de admin; cadastro 20 / hora por IP | `routes/traveler-auth.ts`, `routes/admin.ts` | **corrigido e validado** |
| NEW-08 | **Crítica, condicional.** O `JWT_SECRET` do `.env` local é igual ao valor de exemplo que esteve no `.env.example`, publicado num **repositório público** (commit `2e37e3f` em diante). Se o Render usar esse valor, qualquer pessoa forja login de qualquer conta, inclusive admin. Não dá para verificar o Render daqui. | Valor removido do `.env.example`; `lib/config.ts` recusa subir em produção com esse segredo (comparação por SHA-256, sem guardar o valor) e avisa fora de produção | `.env.example`, `lib/config.ts`, `src/security/config.test.ts` | **pendente de operação externa**: gerar um `JWT_SECRET` novo no Render (e outro no `.env` local) antes do deploy |

**Clientes atualizados:**
- App mobile: refresh rotativo com single-flight, para duas telas não queimarem o mesmo refresh. Salva o refresh novo no AuthContext e na Central da Viagem. O logout chama o servidor.
- Painel admin: o "Sair" chama `/api/admin/logout`.

**Efeito para os usuários no deploy:** todas as sessões atuais caem, porque os tokens antigos não têm `typ` nem `sid`. Todo mundo precisa entrar de novo, conforme decidido. Hoje são 2 viajantes e 1 admin.

**Risco residual registrado:**
- O backend local continua apontando para o banco de produção. Os atalhos perigosos foram removidos, mas qualquer ação local ainda grava em dados reais. O servidor agora avisa isso ao subir.
- Access tokens seguem com 24 h, mas agora são revogáveis.
- O app web guarda tokens em `localStorage` (NEW-07).

---

## Fases seguintes

(atualizado ao fim de cada fase)
