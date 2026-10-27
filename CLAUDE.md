# VAMO — Instruções para Claude

> **Leia ANTES de qualquer outra ação nesta sessão.** Esse arquivo existe para evitar que erros já cometidos no passado se repitam.

---

## 🧭 Norte atual: lançamento

Checklist do que falta para lançar, ordenado por prioridade: [docs/LANCAMENTO-TASKS.md](docs/LANCAMENTO-TASKS.md). Marque `[x]` ao concluir cada item.

---

## 🚀 Boot obrigatório (FAZER PRIMEIRO, sempre)

O projeto VAMO tem **três processos** que precisam estar no ar (o Admin só quando for usar o painel):

| Serviço | Porta | Por quê |
|---|---|---|
| **backend** (Express + Prisma) | 3333 | Login, listagem de roteiros, qualquer chamada autenticada |
| **mobile** (Expo) | 8081 | A própria UI do app no navegador |
| **admin** (Next.js, `apps/site`) | 3034 | Painel Admin (`/admin`): aprovar roteiros/roteiristas, financeiro |

**Toda nova sessão de Claude deve começar com estas três chamadas em paralelo:**

```
mcp__Claude_Preview__preview_start { name: "backend" }
mcp__Claude_Preview__preview_start { name: "mobile" }
mcp__Claude_Preview__preview_start { name: "admin" }
```

Ambas são **idempotentes** — se já estiverem rodando, retornam `{ reused: true }` e não duplicam.

**Depois disso, sempre confirme com `bash scripts/health.sh` no raiz.** Esse script:
- Verifica `localhost:3333/health` (backend de pé)
- Verifica `localhost:8081` (Expo de pé)
- Lista quantos travelers/admins/itinerários estão no banco
- Confirma qual banco está conectado (Supabase prod vs local)

**Se você pular esse boot**, o usuário vai abrir o app, tentar login, e ver "falhou". Não é bug — é serviço faltando. Isso já aconteceu 4 vezes. **Não permita a quinta.**

---

## 🖥️ Painel Admin local (LEIA se for abrir o dashboard)

O Admin é `apps/site` (Next.js) em `/admin`, rodando em **http://localhost:3034/admin** e falando com o backend em `localhost:3333`. Telas: Visão Geral, Roteiros (aprovar), Roteiristas, Clientes, Conversão de Moedas, Financeiro, Histórico (+ Pacotes e Configurações fora do menu). `/admin/agencias` dá 404 de propósito (`LegacyAgenciesPage`). Também existe publicado na Vercel (projeto `vamo-admin`, ver "Deploy"); local e Vercel usam o MESMO banco de produção, então aprovar em um aparece no outro.

**Carregamento:** `AdminDataProvider` (`shared.tsx`) guarda os dados num cache em memória compartilhado entre as telas, busca as 6 rotas em paralelo e o `layout.tsx`/login chamam `prefetchAdminData()` ao abrir. Trocar de aba mostra os dados na hora e revalida em segundo plano; `clearAdminCache()` no logout/login. Não voltar a buscar por tela (as telas abriam zeradas).

**Como subir (qualquer sessão):** `bash scripts/subir-admin.sh` na raiz. Liga só o que estiver desligado, espera responder e abre o Chrome. Para desligar: `bash scripts/subir-admin.sh parar`. Em falha, mostra o fim dos logs (`.local/logs/`).

**Sessão local (app Claude Code no Mac, pasta VAMO):** use `preview_start { name: "backend" }` e `preview_start { name: "admin" }` (definidos em `.claude/launch.json`).

**Sessão na nuvem (a conversa só "enxerga" a pasta):** NÃO existe `preview_start`, o shell da sessão é um Linux separado (os `node_modules` do Mac quebram nele e `localhost` de lá não é o do Chrome do usuário). Não tente rodar servidor lá, não peça controle de mouse/teclado e não crie páginas substitutas. Diga na primeira resposta: "esta sessão é na nuvem e não liga o Admin; rode `bash scripts/subir-admin.sh` ou abra uma sessão local na pasta VAMO". Depois que o usuário avisar que subiu, abra `http://localhost:3034/admin` no Chrome e confira a tela antes de dizer que está aberto.

**Login do Admin:** `admin@vamo.com` (SUPER_ADMIN). O Chrome guarda o login por porta, então use sempre a 3034.

---

## 🏗️ Topologia (estado atual em 2026-06-18)

### Bancos
- **Produção (único banco em uso):** Supabase Postgres
  - Host: `aws-1-us-west-2.pooler.supabase.com:5432` (Session pooler, IPv4)
  - Conexão: `apps/backend/.env` → `DATABASE_URL`
- **Limite de conexões:** o Session pooler aceita **15 clientes**. `src/lib/prisma.ts` limita o Prisma a 5 por instância (`DB_POOL_SIZE`). Se aparecer `EMAXCONNSESSION` / "Can't reach database server", confira `pg_stat_activity` pela porta **6543** (transaction pooler, `?pgbouncer=true`), que não sofre esse limite.
- **Local:** Postgres em `localhost:5432/vamo` foi **wipado e abandonado** em 2026-06-06. Não usar. Não rodar seed. Se precisar testar destrutivo, descomente a URL de fallback no `.env` e isole.

### Dados que devem existir em prod (estado canônico — 2026-09-29)
- **Banco zerado para começar o lançamento com dados reais** (pedido do Diego em 2026-09-29). Todos os dados fictícios (usuários de teste, roteiros, vendas, avaliações, perguntas e as 73 fotos) foram apagados; a estrutura (tabelas, migrations, código) ficou intacta.
- Backup completo anterior à limpeza: `../VAMO-backups-archive/pre-reset-2026-09-28_2322/` (SQL + JSON + fotos + LEIA-ME).
- 1 traveler: `anapaulaabeckenkamp@gmail.com` (Ana Paula Beckenkamp, conta real criada em 2026-09-29, mantida a pedido do Diego).
- 1 admin: `admin@vamo.com` (SUPER_ADMIN). Senha redefinida em 2026-09-28 (o Diego tem). Para trocar: `npx tsx scripts/reset-admin-password.ts <email> [senha]` em `apps/backend`.
- Em 2026-10-14: 4 roteiros ACTIVE, todos da Ana Paula (Tromsø, Queenstown, California, Caribbean). Os 2 últimos foram aprovados direto no banco (sem e-mail de aprovação). 0 vendas · 0 agências. Tudo isso é real: não apagar sem confirmação.
- **Senhas são bcrypt — impossível ler.** Nunca informe senha que não foi confirmada; para recuperar acesso use `npx tsx scripts/reset-password.ts <email> <senha>` (em `apps/backend`).

**Se a auditoria (`npx tsx scripts/audit-prod.ts` no `apps/backend`) mostrar números muito diferentes, INVESTIGUE antes de mexer em qualquer coisa.**

### Apps
- `apps/mobile` — Expo / React Native (também roda no navegador via Metro web). **É o app do VIAJANTE** (busca, compra, roteiro comprado).
- `apps/site` — Next.js (landing pública, dashboards do criador/agência, admin). NÃO é a vitrine de compra do viajante.
- `apps/backend` — Express + Prisma
- `packages/shared` — lógica + tipos compartilhados (single source of truth entre mobile/site/backend)

### Deploy (produção)
`vamo-ten.vercel.app` (Vercel, app mobile/Expo Web) → `vamo-699h.onrender.com/api` (Render, backend) → Supabase.
Render e Vercel publicam a `main` automaticamente no push. **Migrations são automáticas no deploy do Render** (ver "Migrations automáticas" abaixo). O serviço do Render foi criado pelo painel, sem Blueprint: o `render.yaml` só espelha o painel, que é a fonte da verdade. O painel admin (`apps/site`) também está na Vercel como projeto `vamo-admin` (configurado por `apps/site/vercel.json`), com a Deployment Protection da Vercel ligada (só membros do time entram). Para funcionar fora do Mac precisa de `NEXT_PUBLIC_API_URL=https://vamo-699h.onrender.com/api` na Vercel e do domínio dele em `ALLOWED_ORIGINS` no Render (ainda não verificado em 2026-10-14). O projeto `vamo-backend` na Vercel não é usado pelo app. Detalhes em [[supabase-database]].

---

## 🚨 Regras invioláveis

Estas restrições foram dadas pelo usuário em sessões anteriores. **Respeite todas:**

1. **Stack:** Não troque. Não migre. Não introduza Firebase. Não substitua Prisma. Não substitua PostgreSQL.
2. **Git destrutivo:** Não rode `reset --hard`, `push --force`, rebase arriscado, exclusão de branch, ou qualquer alteração destrutiva no banco sem **explicar primeiro e pedir confirmação**.
3. **Migrations:**
   - **NUNCA** `prisma migrate dev` (cria SHADOW DB direto no Supabase e quebra)
   - **SEMPRE** `prisma migrate diff --from-schema-datamodel ... --to-schema-datamodel ... --script` para gerar SQL offline
   - Versionar a pasta da migration no Git: o deploy do Render aplica sozinho (`prisma migrate deploy`). Não aplicar pelo Supabase SQL editor, porque isso deixa `_prisma_migrations` inconsistente.
   - Migration destrutiva (DROP, rename, NOT NULL em coluna com dados) só com autorização explícita do Diego.
4. **Seed:** NÃO existe mais (`prisma/seed.ts` foi deletado em 2026-06-06). NÃO recriar. NÃO rodar `prisma db seed`. NÃO rodar `prisma migrate reset`. O bloco `prisma.seed` foi removido do `package.json` do backend justamente pra impedir isso.
5. **Dados em prod:** Não apagar usuários reais. Maria é usuária real, criada manualmente pelo app — tratar como sagrada.
6. **Refatoração:** Não fazer refatoração ampla. Não trocar arquitetura. Não criar novo backend. Não mudar banco. Não remover rotas. Não remover funcionalidades existentes.
7. **Diagnóstico antes de correção:** Começar pelo diagnóstico. Não corrigir no escuro.

---

## 🛠️ Comandos úteis

```bash
# Subir tudo de uma vez (alternativa ao preview_start duplo)
npm run dev:all

# Sanidade rápida
bash scripts/health.sh

# Auditoria completa do banco (read-only)
cd apps/backend && npx tsx scripts/audit-prod.ts

# Backup do prod (rodar antes de qualquer mudança arriscada)
cd apps/backend && npx tsx scripts/backup-db.ts
```

---

## 🧱 Primitivas compartilhadas — REUSE, não reinvente

Antes de criar lógica/UI nova, cheque se já existe. Padrão consolidado em 2026-06:

### `packages/shared/itinerary/` (single source of truth)
- **`time.ts`** — horários no padrão americano (12h AM/PM). `formatTimeForDisplay()` (exibição, lida com ranges), `parseTimeInput()` (input → "HH:mm" 24h), `to12HourTime`/`to24HourTime`. Storage segue 24h.
- **`rating.ts`** — `getRouteRatingDisplay({averageRating, reviewCount})`. Sem review → `{type:'new', label:'Novo'}`. NUNCA herdar `creator.rating` para o card do roteiro.
- **`sectionOrder.ts`** — `MODULE_ORDER` (voo→hospedagem→passeios→itinerário→transporte→restaurantes→dicas→gastos→checklist). Ordem do wizard segue `MODULE_OPTIONS` em `constants.ts` (alinhado). Mudar a ordem = mudar num lugar.
- **`constants.ts` → `BUDGET_STYLE_GUIDE`** — critérios oficiais Econômico/Moderado/Luxo. `getPrimaryBudgetStyle()` (escolha única, tolera legado), `getBudgetStyleGuide()`. `travelStyles[]` guarda só UMA key de orçamento.
- **`cost.ts`** — `getCostReferences`, `calculateBudgetSummary`, `formatMoney`. Usado por tela E PDF (mesma fonte).

### `apps/mobile/src/components/common/` (UI base)
- **`VamoButton.tsx`** — botão padrão (variants primary/secondary/danger/ghost; sizes sm/md/lg; loading). Texto sempre centralizado, multiline sem corte. **Use em todo botão novo.**
- **`VamoConfirmHost.tsx`** + `utils/confirm.ts` — modais de confirmação. Passe `action: 'logout'|'archive'|'delete'|…` (mapa `CONFIRM_ACTION_CONFIG`) em vez de `icon`/`variant` manual. **Lixeira só em exclusão real.** `confirm()`/`notify()` imperativos. Alert.alert do RN é no-op no web — sempre usar esses.
- **`MediaLightbox.tsx`** + hook `useMediaLightbox()` — visualizador global de imagem/vídeo. Qualquer `<Image>` clicável deve abrir por aqui.
- **`BudgetStyleGuideSheet.tsx`** — bottom-sheet de ajuda do estilo de orçamento.

### Autenticação Traveler e e-mail (`apps/backend/src/routes/traveler-auth.ts`, `src/lib/mailer.ts`)
- E-mail sempre normalizado (`trim().toLowerCase()`, busca case-insensitive). Política de senha única: `passwordSchema` (min 6) vale para cadastro E redefinição.
- **Esqueci minha senha:** `POST /forgot-password` (resposta sempre neutra, cooldown 1 e-mail/min por conta) e `POST /reset-password`. Token = 32 bytes base64url no link; no banco só o SHA-256 (`password_reset_tokens`), TTL 1h, uso único (linha apagada em transação), só o último token vale. Telas `app/forgot-password.tsx` e `app/reset-password.tsx` (moldura `src/components/auth/AuthScreenShell.tsx`).
- JWT é stateless: o reset grava `travelers.passwordChangedAt` e o `/refresh` recusa refresh emitido antes disso. Access token segue válido até expirar (24h). O middleware NÃO consulta o banco.
- E-mails só pelo `mailer.ts` (Gmail SMTP hoje; trocar provider = trocar só o transporte). Nunca logar token de reset. Lista completa (13 e-mails, gatilhos, proteção contra duplicado) em `docs/NOTIFICACOES-DIAGNOSTICO.md`.
- **Regra dos e-mails:** gravar a ação primeiro e enviar depois (o mailer nunca lança erro). Um e-mail por evento lógico, amarrado a algo gravado: transição atômica com `updateMany where status = …` (aprovar, reprovar, revisão, BASIC → TRUSTED), linha criada (venda, resposta, avaliação) ou estorno com `newlyCreated`. Nunca deduplicar com timer ou memória.
- `amountTotal` em `payments.ts` já está em unidades da moeda (29.9), não em centavos.
- `scripts/reset-password.ts` continua como ferramenta administrativa de emergência.

### Migrations automáticas (Render)
- **Onde:** no `npm run start` do backend (`apps/backend/package.json`): `npm run prisma:migrate:deploy && tsx src/index.ts`. O painel do Render chama `npm run start`.
- **Por que não pre-deploy:** quando isto foi feito, o serviço estava no plano gratuito, onde o Pre-Deploy Command não existe. Desde 2026-09-24 o serviço está no **Starter (0.5c-512mb, pago)**, então o pre-deploy ficou disponível. Continua no start por ora. Se mover para o pre-deploy, **tirar do start**, para não rodar duas vezes.
- **Falha:** se o `migrate deploy` falhar, o `&&` impede o servidor de subir, a porta não abre, o deploy falha e o Render mantém a versão anterior no ar. Nunca usar `||`.
- **Sem migration pendente:** "No pending migrations to apply" e o servidor sobe normalmente. Roda também a cada reinício do servidor (alguns segundos a mais).
- **Verificar:** logs do deploy no Render (procurar `prisma migrate deploy`) ou `cd apps/backend && npx prisma migrate status`.
- **Fluxo para mudar o schema:**
  1. Editar o `schema.prisma`.
  2. Gerar o SQL offline com `prisma migrate diff --from-schema-datamodel <schema antigo> --to-schema-datamodel prisma/schema.prisma --script` e salvar em `prisma/migrations/<timestamp>_<nome>/migration.sql`.
  3. Revisar se é só aditivo.
  4. Commit e push para a `main`: o Render aplica a migration e sobe o código novo no mesmo deploy.
- **Pegadinha local:** depois de gerar o Prisma com coluna nova, scripts locais contra o Supabase (inclusive `backup-db.ts`) quebram com P2022 até a migration ser aplicada. Para fazer backup antes: rodar o `prisma generate` com o schema anterior, fazer o backup e depois rodar o `prisma generate` de novo.

### Roteiro comprado (`apps/mobile/app/purchased-itinerary/[id].tsx` + `src/features/route-versioning/`)
- Ordem da página: hero → "pronto pra usar" (atalhos) → experiência → custos → RouteVersioning (Original/Minha versão) → o que recebeu → mídia → avaliar.
- Atalhos usam refs por versão (`itinerary:original`, `checklist:mine`, etc.) e **nunca trocam de aba**. `scrollToSection` usa `scrollIntoView` no web, `measureLayout` no nativo.

> Memórias detalhadas por tópico em `~/.claude/.../memory/` — veja o índice `MEMORY.md`.

---

## 📋 Mercado / produto

- **Mercado-alvo atual: Estados Unidos, moeda USD (decidido pelo Diego em 2026-10-15; antes era Austrália/AUD desde 2026-06-10).** Fonte ÚNICA: `packages/shared/itinerary/market.ts` (`MARKET`, `BASE_CURRENCY`, `BASE_LOCALE`, `BASE_CURRENCY_SYMBOL`, fuso, `DEFAULT_RATES_TO_BASE`). Nunca escreva `'USD'`/`'AUD'`/`'$'` na mão como moeda-base: importe dali. Cada roteiro guarda a própria moeda (`itineraries.currency`), então roteiros antigos em AUD seguem mostrando A$ até serem convertidos (`apps/backend/scripts/convert-itineraries-to-base-currency.ts`, dry-run por padrão). Taxas de câmbio são "1 unidade = X moeda-base"; o arquivo salvo pelo admin só vale se tiver `base` igual à atual. **O app (mobile), o backend (e-mails e mensagens de erro) e os textos compartilhados estão em inglês americano desde 2026-10-22**; os textos legais ficam em `packages/shared/legal/` (rascunho para revisão de advogado). Ainda em português: painel admin e dashboards internos do `apps/site` (ver docs/LANCAMENTO-TASKS.md, task 9). Não escreva texto de tela em português.
- **Comissão: 20% VAMO / 80% roteirista (decidido em 2026-10-27).** Fonte única: `packages/shared/itinerary/commission.ts`. Vendas anteriores a essa data ficaram gravadas com 15%. O dinheiro ainda NÃO é dividido na Stripe (sem Connect transfer/application_fee): é só o número gravado na venda; ver docs/LANCAMENTO-TASKS.md, bloco A.
- **Modelo de usuário:** Traveler é o "root" — todo viajante pode opcionalmente virar Creator (extensão 1:1). NÃO são contas separadas.
- **Gamificação:** Passaporte VAMO (viajante) + Trilha do Roteirista (reputação). Código em `src/gamification/`.

---

## 🔗 Memória persistente

Memórias de longo prazo do usuário ficam em `~/.claude/projects/-Users-diegoartur-Documents-Diego-Artur--C-digos-VAMO/memory/`. Atualize quando algo mudar de tópico (deploy, modelo, etc.).
