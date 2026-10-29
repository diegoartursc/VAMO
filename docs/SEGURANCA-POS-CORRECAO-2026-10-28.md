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

## Fase 2 — Conteúdo pago e documentos (concluída no código)

Testes: `src/security/phase2-content.test.ts` (9) e `src/security/phase2-private-docs.test.ts` (3), com o app real e roteiro de teste com marcadores de conteúdo pago e de comprovante.

**Antes** (código `a71490e`): 9 testes de conteúdo, **2 passaram e 7 falharam**. O anônimo recebeu dicas, atividades, hotel e arquivo pagos. A listagem trouxe o conteúdo dos passeios. O comprovante de embarque, o recibo e a nota interna do admin saíram para anônimo e comprador. `/dashboard/stats?creatorId=` anônimo respondeu 200 com o roteiro do criador. `/uploads/itineraries//arquivo.pdf` e `/uploads/%69tineraries/...` abriram o arquivo privado.
**Depois:** 9 de 9 e 3 de 3. Suíte do backend: 96 de 96. Mobile: 216 de 216 e `tsc` sem erro novo.

| ID | Mudança | Arquivos | Status |
| --- | --- | --- | --- |
| SEC-02 | DTO por papel. A vitrine e o detalhe para quem não comprou recebem só a prévia. Os módulos viram "tocos" com o bloco de custo (o resumo de orçamento continua) e `contentCounts` informa quantos itens há. Dias, atividades, dicas, checklist, nomes de hotéis/restaurantes, horários, links e arquivos ficam para comprador (`/:id/purchased`), dono e admin. O app usa `contentCounts` para "O que você vai receber" e para os selos dos cards. | `lib/itineraryDto.ts`, `routes/itineraries.ts`, `apps/mobile/src/utils/itineraryCardBadges.ts`, `apps/mobile/src/utils/itinerarySales.ts` | **corrigido e validado** |
| SEC-03 (respostas) | `travelProofUrl`, `receiptUrl`, `approvalNote` e as URLs de `proofFiles` saem de toda resposta que não seja para dono ou admin, em qualquer profundidade, inclusive snapshots antigos de compra (`/:id/purchased`, `/route-customization/:id/snapshot`). `proofFiles` vira um marcador sem URL, para o cálculo de confiança dos custos seguir igual. | `lib/itineraryDto.ts`, `routes/itineraries.ts`, `routes/traveler-route-customization.ts` | **corrigido e validado** |
| SEC-03 (armazenamento) | Comprovantes novos vão para `private_documents` (nunca para o bucket público) por `POST /api/private-docs`. Só abrem por link assinado de 30 min, emitido ao dono (`/:id/creator` e o próprio detalhe) e ao admin (pendentes, todos, detalhe, comprovantes de custo). Ao salvar o roteiro, o backend troca o link por `private-doc://<id>` e descarta comprovante de outra pessoa. O app manda os contextos `travelProof` e `costProof` para o endpoint privado. | `prisma/schema.prisma`, migration `20261029110000_private_documents`, `lib/privateDocs.ts`, `routes/private-docs.ts`, `routes/admin.ts`, `apps/mobile/src/utils/uploadFile.ts` | **corrigido e validado** (código). **Pendente de operação externa:** migrar os comprovantes já publicados |
| SEC-04 | `/dashboard/stats` exige sessão e resolve o criador só pelo token; `?creatorId=` é ignorado | `routes/itineraries.ts` | **corrigido e validado** |
| SEC-05 | A checagem de arquivo privado legado usa o mesmo caminho que o `express.static` serve: decodifica, normaliza barras e pontos, confere pelo nome do arquivo em qualquer subpasta e falha fechado em erro. `/uploads` só aceita GET/HEAD. | `app.ts` | **corrigido e validado**. O impacto real depende de existir arquivo legado no disco do Render, que é efêmero. |
| NEW-04 | Nota interna do admin removida das respostas públicas e de comprador | `lib/itineraryDto.ts` | **corrigido e validado** |

**Ferramenta de migração (não executada):** `scripts/migrate-proofs-to-private.ts`.
- Sem argumento faz só a simulação: inventário com o id do roteiro, o campo e o hash do objeto, sem mostrar URL.
- `--apply` copia cada comprovante do bucket público para `private_documents`, valida o formato, troca as referências e grava backup das referências antigas e cópia local dos arquivos em `scripts/backups/proofs-<data>/`.
- `--apply --revoke` também apaga os objetos públicos. Enquanto isso não rodar, quem já tem o link público de um comprovante antigo ainda consegue abrir.

**Mudança visível:** quem não comprou deixa de ver o conteúdo detalhado no detalhe do roteiro (o produto já dizia "desbloqueado após a compra"). Cards e resumo de custos continuam.

---

## Fase 3 — Dinheiro (concluída no código)

Teste: `src/security/phase3-money.test.ts` (15). Stripe e Prisma falsos, eventos assinados offline com segredo de teste. Nenhuma cobrança, estorno ou transferência real.

**Antes** (código `0b36e54`): 13 testes, **1 passou e 12 falharam**. Exemplos:
- Um refund de 1 centavo fez o sistema considerar o pagamento "devolvido".
- `charge.refunded`, `charge.dispute.*` e `transfer.reversed` eram ignorados.
- A venda e o repasse usavam o preço, a moeda e a comissão atuais.
- 60 vendas inelegíveis no início da fila impediam o repasse da 61ª.

**Depois:** 15 de 15, incluindo 2 testes ponta a ponta acrescentados depois. Suíte do backend: 111 de 111. O teste antigo `payments.refund.test.ts` teve as fixtures atualizadas para o formato real da Stripe (refunds com valor) e mantém as mesmas verificações.

| ID | Mudança | Arquivos | Status |
| --- | --- | --- | --- |
| SEC-11 | Webhook registra cada evento em `stripe_events` e o marca como processado só depois de aplicar (replay = ignorado; falha = 500 e a Stripe reenvia). Trata `charge.refunded`, `charge.dispute.created/updated/closed` e `transfer.reversed` usando valores acumulados (eventos fora de ordem convergem). Política aplicada no servidor: estorno total e disputa perdida tiram o acesso (`/:id/purchased`, Central da Viagem, personalização, avaliação, "Meus roteiros"); estorno parcial e disputa aberta mantêm. Disputa aberta trava o repasse (`on_hold`); ganha libera; perdida reverte o repasse na proporção. Estorno depois do repasse reverte a transferência na proporção, com chave de idempotência por valor-alvo. Falha na reversão marca `needs_attention` e guarda o erro. Recompra depois de estorno reaproveita a venda e zera o estado. Tela de ganhos mostra "Refunded"/"Disputed". | `lib/paymentEvents.ts`, `lib/money.ts`, `routes/payments.ts`, `routes/itineraries.ts`, `routes/traveler-trip-center.ts`, `routes/traveler-route-customization.ts`, `routes/reviews.ts`, `routes/my-trips.ts`, `routes/creators.ts` | **corrigido e validado** (código) |
| SEC-12 | O estorno automático soma os valores devolvidos (concluídos e pendentes; falhos não contam, com paginação) e devolve só o restante, com chave de idempotência que inclui o já devolvido. Estorno total pendente conta como iniciado e não gera outro nem retry. O e-mail ao comprador passou a dizer "We started your refund". | `routes/payments.ts`, `lib/mailer.ts`, `routes/payments.refund.test.ts` | **corrigido e validado** |
| SEC-13 | A venda grava, a partir do pagamento confirmado pela Stripe, `paidAmountCents`, `paidCurrency`, `commissionCents`, `creatorEarningCents` e `paymentIntentId`. O repasse usa esses valores e a moeda do pagamento. Venda antiga usa preço e comissão gravados (15%), nunca a taxa atual. | `lib/money.ts`, `routes/payments.ts`, `jobs/payouts.ts`, migration `20261029120000_payment_state_and_payout_queue` | **corrigido e validado** (código). **Pendente de operação externa:** conciliar as vendas antigas |
| SEC-15 | A fila filtra no banco só as vendas tentáveis agora. Motivo transitório (conta do roteirista não habilitada, erro da Stripe) agenda `payoutNextAttemptAt` com espera crescente (1 h a 2 dias). Motivo definitivo vira `blocked`; disputa vira `on_hold`. | `jobs/payouts.ts` | **corrigido e validado** |

**Ferramenta de conciliação (não executada):** `scripts/reconcile-sales.ts`.
- Sem argumento faz só a simulação: lê o banco e a Stripe e lista o valor pago, o estornado, o status e alertas (preço gravado diferente do pago, repasse já feito numa venda estornada).
- `--apply` grava paymentIntentId, valores congelados e estado. Nunca cria estorno, transferência ou reversão: casos que pedem reversão manual aparecem no relatório.

**Pendências:**
- **Eventos novos no webhook (operação externa):** na Stripe, o destino do webhook precisa passar a enviar também `charge.refunded`, `charge.dispute.created`, `charge.dispute.updated`, `charge.dispute.closed` e `transfer.reversed`. Hoje escuta só 1 evento.
- **Saldo insuficiente na conta do roteirista para reverter:** fica marcado `needs_attention` com o erro. Falta um alerta ativo ao admin (e-mail ou tela).

---

## Fase 4 — Upload, dependências e confiança (concluída no código)

Testes:
- `phase4-uploads.test.ts` (7);
- `phase4-trust.test.ts` (3);
- `phase4-account.test.ts` (3);
- `isolation.test.ts` (2), novo: garante que os testes nunca alcançam serviço real.

**Antes:**
- uploads: 6 testes, 1 passou (o do Multer, que já tinha sido atualizado no começo da fase) e 4 falharam;
- confiança: 3 testes, 1 passou (o teste unitário da biblioteca nova) e 2 falharam, porque o criador gravou `featured: true` e manteve `proofStatus: approved` forjado.

**Depois:** 7 de 7, 3 de 3, 3 de 3 e 2 de 2. Suíte do backend: 126 de 126. Mobile: `tsc` sem erro novo.

**Falha encontrada nos meus próprios testes (corrigida):** o `@prisma/client` carrega o `.env` real ao ser importado, e as chaves reais (Supabase, Stripe, SMTP) ficavam visíveis dentro dos testes. O bloqueio só cobria `fetch`. Ele pegou uma tentativa de criar o bucket no Supabase real e impediu a chamada. Agora o setup zera essas variáveis antes, bloqueia `net`, `tls` e `https` para qualquer host fora de localhost, e `isolation.test.ts` prova isso. Na revisão não encontrei chamada real à Stripe nem envio de e-mail: os testes de webhook usaram chave falsa, e o `SMTP_PASS` local está vazio.

| ID | Mudança | Arquivos | Status |
| --- | --- | --- | --- |
| SEC-08 | `lib/uploadGuard.ts` recusa pelo `Content-Length` antes de ler o corpo (sem tamanho → 411; acima do teto → 413). Limita uploads simultâneos por usuário (2) e no processo (4) e impõe tempo máximo por upload (5 min). O tempo máximo cobre conexão lenta que seguraria a vaga, um defeito que o teste encontrou no próprio guarda. O upload geral não guarda mais o pedido em memória: grava em temporário, confere a assinatura pelos primeiros bytes, sobe um arquivo por vez e apaga o temporário. Também há limites de arquivos, campos e partes. O guarda vale em `/api/uploads`, `/api/uploads/multiple`, `/api/private-docs`, Central da Viagem e avatar/capa. Orçamento de memória: no pior caso cerca de 4 × 100 MB no upload geral e 4 × 50 MB na Central da Viagem, que ainda guarda em memória porque grava no Postgres. Pasta local de uploads configurável (`LOCAL_UPLOADS_DIR`). | `lib/uploadGuard.ts`, `routes/uploads.ts`, `routes/private-docs.ts`, `routes/traveler-trip-center.ts`, `routes/traveler-auth.ts`, `lib/storage.ts`, `app.ts` | **corrigido e validado** (limites pequenos nos testes). Sem teste de carga real. |
| SEC-09 | `multer` 2.5.0 fixo (cobre GHSA-wc9g-mqfw-jrwm e GHSA-3pph-fpjx-jg34). `express` 4.22.3 fixo, que leva o `qs` para 6.16.2 e tira o aviso moderado do `qs` no backend. O lockfile só perdeu dependências antigas do Multer 1.x. `expo-font`, `react-refresh`, `next` e `nodemailer` continuam nas mesmas versões. | `apps/backend/package.json`, `package-lock.json` | **corrigido e validado** (código). Atenção: o `qs` 6.16.2 foi publicado em 27/10. Tentei fixar a 6.16.1 por `overrides` e o npm não aplicou. |
| SEC-14 | O criador não grava `featured` (ignorado no POST/PUT; criação sempre `false`). `proofStatus` e `adminNote` são recalculados pelo servidor: sem arquivo vira `none`; com arquivo vira `uploaded`, a menos que valor, moeda, divisão e arquivos sejam exatamente os da versão já decidida pelo admin. Qualquer mudança derruba a aprovação. | `lib/costProofs.ts`, `routes/itineraries.ts` | **corrigido e validado** |
| NEW-01 | Exclusão de conta real: `POST /api/auth/traveler/delete-account` com a senha. O viajante é anonimizado; perfil, dados pessoais, favoritos, notificações, checklist, arquivos da viagem, personalizações e comprovantes são apagados; avaliações ficam como "Former traveler"; sessões são encerradas; vendas ficam como registro financeiro, sem nome nem e-mail. Conta de criador responde 409 e vai para o suporte. No app, "Delete account" leva à tela de segurança, com senha e confirmação. | `routes/traveler-auth.ts`, `apps/mobile/app/account/security.tsx`, `apps/mobile/app/(tabs)/profile.tsx`, `apps/mobile/src/services/auth.ts` | **corrigido e validado** (backend). Tela do app sem teste visual. |
| NEW-05 | Compartilhamento só grava `saleId` se a venda for do próprio viajante e do mesmo roteiro | `routes/itineraries.ts` | **corrigido** (sem teste dedicado) |
| NEW-06 | URL com o `Host` da requisição em modo disco | — | **condicional/não aplicável**: só existe sem Supabase (ambiente local). Produção usa a URL do storage. |

**`npm audit --omit=dev` (28/10, depois das mudanças):**
- **Backend:** 1 aviso, `zod` alto (memória ao validar entrada grande demais). Alcance: as rotas validam JSON limitado a 100 KB pelo `express.json()`, então não há entrada grande no backend. A correção exige `zod` 4 (migração grande no backend e no `shared`): **pendente**, sem `audit fix --force`.
- **Geral:** 17 avisos (4 altos, 6 moderados, 7 baixos). Vêm de `image-size`, `node-forge`, `postcss`, `decode-uri-component`, `deepmerge` e pacotes `@expo/*`, usados na **ferramenta de build do app**, não no servidor. A correção pede atualizar o SDK do Expo (já estava na lista de lançamento) e não pode ser feita às cegas: **pendente**.

---

## Fases seguintes

(atualizado ao fim de cada fase)
