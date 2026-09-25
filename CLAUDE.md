# VAMO — Instruções para Claude

> **Leia ANTES de qualquer outra ação nesta sessão.** Esse arquivo existe para evitar que erros já cometidos no passado se repitam.

---

## 🧭 Norte atual: lançamento

Checklist do que falta para lançar, ordenado por prioridade: [docs/LANCAMENTO-TASKS.md](docs/LANCAMENTO-TASKS.md). Marque `[x]` ao concluir cada item.

---

## 🚀 Boot obrigatório (FAZER PRIMEIRO, sempre)

O projeto VAMO tem **dois processos** que precisam estar no ar para o app funcionar:

| Serviço | Porta | Por quê |
|---|---|---|
| **backend** (Express + Prisma) | 3333 | Login, listagem de roteiros, qualquer chamada autenticada |
| **mobile** (Expo) | 8081 | A própria UI do app no navegador |

**Toda nova sessão de Claude deve começar com estas duas chamadas em paralelo:**

```
mcp__Claude_Preview__preview_start { name: "backend" }
mcp__Claude_Preview__preview_start { name: "mobile" }
```

Ambas são **idempotentes** — se já estiverem rodando, retornam `{ reused: true }` e não duplicam.

**Depois disso, sempre confirme com `bash scripts/health.sh` no raiz.** Esse script:
- Verifica `localhost:3333/health` (backend de pé)
- Verifica `localhost:8081` (Expo de pé)
- Lista quantos travelers/admins/itinerários estão no banco
- Confirma qual banco está conectado (Supabase prod vs local)

**Se você pular esse boot**, o usuário vai abrir o app, tentar login, e ver "falhou". Não é bug — é serviço faltando. Isso já aconteceu 4 vezes. **Não permita a quinta.**

---

## 🏗️ Topologia (estado atual em 2026-06-18)

### Bancos
- **Produção (único banco em uso):** Supabase Postgres
  - Host: `aws-1-us-west-2.pooler.supabase.com:5432` (Session pooler, IPv4)
  - Conexão: `apps/backend/.env` → `DATABASE_URL`
- **Local:** Postgres em `localhost:5432/vamo` foi **wipado e abandonado** em 2026-06-06. Não usar. Não rodar seed. Se precisar testar destrutivo, descomente a URL de fallback no `.env` e isole.

### Dados que devem existir em prod (estado canônico — 2026-06-18)
- Travelers (auditado 2026-09-24): `juliavamo@gmail.com` / Julia Beckenkamp (conta real, antes "Maria"; senha redefinida para `vamo123` em 2026-09-24), `diegovamo@gmail.com` (Diego GOGO, teste), `arianavamo@gmail.com` (Ariana). `mariavamo@gmail.com` NÃO existe mais.
- **Senhas são bcrypt — impossível ler.** `hasPwd=true` só diz que existe senha. Nunca informe senha que não foi confirmada; para recuperar acesso use `npx tsx scripts/reset-password.ts <email> <senha>` (em `apps/backend`, salva hash antigo em `scripts/backups/`).
- 1 admin: `admin@vamo.com` (SUPER_ADMIN)
- 1 creator: Maria (BASIC)
- **2 itinerários (ambos ACTIVE, by Maria):**
  - "Japão Clássico: 10 Dias em Tóquio, Kyoto e Osaka…" — 1 review real (5★), `travelStyles: ["moderado"]`
  - "Japão Essencial: 10 dias por Tóquio, Kyoto e Osaka" — 0 reviews (aparece como "Novo")
- 0 agências · 0 pacotes
- 3 vendas de teste

**Se a auditoria (`npx tsx scripts/audit-prod.ts` no `apps/backend`) mostrar números muito diferentes, INVESTIGUE antes de mexer em qualquer coisa.**

### Apps
- `apps/mobile` — Expo / React Native (também roda no navegador via Metro web). **É o app do VIAJANTE** (busca, compra, roteiro comprado).
- `apps/site` — Next.js (landing pública, dashboards do criador/agência, admin). NÃO é a vitrine de compra do viajante.
- `apps/backend` — Express + Prisma
- `packages/shared` — lógica + tipos compartilhados (single source of truth entre mobile/site/backend)

### Deploy (produção)
`vamo-ten.vercel.app` (Vercel, app mobile/Expo Web) → `vamo-699h.onrender.com/api` (Render, backend) → Supabase.
Render e Vercel publicam a `main` automaticamente no push. **Migrations são automáticas no deploy do Render** (ver "Migrations automáticas" abaixo). O serviço do Render foi criado pelo painel, sem Blueprint: o `render.yaml` só espelha o painel, que é a fonte da verdade. O projeto `vamo-backend` na Vercel não é usado pelo app. Detalhes em [[supabase-database]].

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
- **`time.ts`** — horários no padrão AU (12h AM/PM). `formatTimeForAustraliaDisplay()` (exibição, lida com ranges), `parseAustralianTimeInput()` (input → "HH:mm" 24h), `to12HourTime`/`to24HourTime`. Storage segue 24h.
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
- E-mails só pelo `mailer.ts` (Gmail SMTP hoje; trocar provider = trocar só o transporte). Nunca logar token de reset.
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

- **Mercado-alvo atual (confirmado 2026-06-10):** compradores **australianos**, roteiros para **qualquer destino do mundo** (Austrália é o MERCADO, não o destino). Moeda AUD. Config centralizada em `packages/shared/itinerary/market.ts`. ⚠️ Incongruência conhecida: UI segue em PT-BR — i18n en-AU é decisão pendente do Diego; não traduzir sem ele pedir. Herói da Home = Bali (destino internacional nº 1 dos australianos).
- **Modelo de usuário:** Traveler é o "root" — todo viajante pode opcionalmente virar Creator (extensão 1:1). NÃO são contas separadas.
- **Gamificação:** Passaporte VAMO (viajante) + Trilha do Roteirista (reputação). Código em `src/gamification/`.

---

## 🔗 Memória persistente

Memórias de longo prazo do usuário ficam em `~/.claude/projects/-Users-diegoartur-Documents-Diego-Artur--C-digos-VAMO/memory/`. Atualize quando algo mudar de tópico (deploy, modelo, etc.).
