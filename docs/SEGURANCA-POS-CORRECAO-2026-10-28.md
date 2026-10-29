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

## Fases seguintes

(atualizado ao fim de cada fase)
