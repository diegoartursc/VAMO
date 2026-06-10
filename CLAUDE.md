# VAMO — Instruções para Claude

> **Leia ANTES de qualquer outra ação nesta sessão.** Esse arquivo existe para evitar que erros já cometidos no passado se repitam.

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

## 🏗️ Topologia (estado atual em 2026-06-06)

### Bancos
- **Produção (único banco em uso):** Supabase Postgres
  - Host: `aws-1-us-west-2.pooler.supabase.com:5432` (Session pooler, IPv4)
  - Conexão: `apps/backend/.env` → `DATABASE_URL`
- **Local:** Postgres em `localhost:5432/vamo` foi **wipado e abandonado** em 2026-06-06. Não usar. Não rodar seed. Se precisar testar destrutivo, descomente a URL de fallback no `.env` e isole.

### Dados que devem existir em prod (estado canônico)
- 1 traveler: `mariavamo@gmail.com` (Maria Beckenkamp) — senha `vamo123`
- 1 admin: `admin@vamo.com` (SUPER_ADMIN) — senha `admin123`
- 1 creator: Maria (BASIC)
- 1 itinerário: "Japão Clássico: 10 Dias em Tóquio, Kyoto e Osaka..." (ACTIVE, by Maria)
- 0 agências
- 0 pacotes
- 1+ venda de teste (Maria comprou pra validar pós-compra)

**Se a auditoria (`npx tsx scripts/audit-prod.ts` no `apps/backend`) mostrar números diferentes, INVESTIGUE antes de mexer em qualquer coisa.**

### Apps
- `apps/mobile` — Expo / React Native (também roda no navegador via Metro web)
- `apps/site` — Next.js (landing pública, dashboards criador/agência, admin)
- `apps/backend` — Express + Prisma
- `packages/shared` — tipos compartilhados

---

## 🚨 Regras invioláveis

Estas restrições foram dadas pelo usuário em sessões anteriores. **Respeite todas:**

1. **Stack:** Não troque. Não migre. Não introduza Firebase. Não substitua Prisma. Não substitua PostgreSQL.
2. **Git destrutivo:** Não rode `reset --hard`, `push --force`, rebase arriscado, exclusão de branch, ou qualquer alteração destrutiva no banco sem **explicar primeiro e pedir confirmação**.
3. **Migrations:**
   - **NUNCA** `prisma migrate dev` (cria SHADOW DB direto no Supabase e quebra)
   - **SEMPRE** `prisma migrate diff --from-schema-datamodel ... --to-schema-datamodel ... --script` para gerar SQL offline
   - Aplicar com `prisma migrate deploy` ou via Supabase SQL editor
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

## 📋 Mercado / produto

- **Mercado-alvo atual (confirmado 2026-06-10):** compradores **australianos**, roteiros para **qualquer destino do mundo** (Austrália é o MERCADO, não o destino). Moeda AUD. Config centralizada em `packages/shared/itinerary/market.ts`. ⚠️ Incongruência conhecida: UI segue em PT-BR — i18n en-AU é decisão pendente do Diego; não traduzir sem ele pedir. Herói da Home = Bali (destino internacional nº 1 dos australianos).
- **Modelo de usuário:** Traveler é o "root" — todo viajante pode opcionalmente virar Creator (extensão 1:1). NÃO são contas separadas.
- **Gamificação:** Passaporte VAMO (viajante) + Trilha do Roteirista (reputação). Código em `src/gamification/`.

---

## 🔗 Memória persistente

Memórias de longo prazo do usuário ficam em `~/.claude/projects/-Users-diegoartur-Documents-Diego-Artur--C-digos-VAMO/memory/`. Atualize quando algo mudar de tópico (deploy, modelo, etc.).
