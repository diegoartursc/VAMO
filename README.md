# VAMO — Monorepo

> Plataforma de viagens que conecta viajantes a criadores independentes de roteiros digitais.

Este repositório contém o **monorepo principal** da VAMO: app mobile, backend (API + banco) e o frontend web/dashboard creator. O painel administrativo e o site público têm repositórios espelhados (ver [Ecossistema](#ecossistema-de-repositórios)).

> Status MVP (Maio 2026): foco em **Roteiros de Criadores**. Pacotes de agência estão em pausa.

---

## Estrutura

```
apps/
  backend/   Express + Prisma + PostgreSQL  (porta 3333)
  site/      Next.js 16 — site público + área logada (porta 3033)
  mobile/    Expo SDK 54 + React Native     (porta 8081)
design-system/   Tokens e estilos compartilhados
docs/            Documentação do produto
```

Workspaces npm: `apps/*` definidos no `package.json` da raiz.

---

## Ecossistema de repositórios

| Repo | Conteúdo | Status |
|---|---|---|
| [`diegoartursc/VAMO`](https://github.com/diegoartursc/VAMO) | **Este repo.** Monorepo: backend + mobile + site (área logada + público) | canônico |
| [`diegoartursc/VAMOsite`](https://github.com/diegoartursc/VAMOsite) | Espelho extraído de `apps/site` (sem `/admin`) — site público + área do usuário | extraído daqui |
| [`diegoartursc/adminVAMO`](https://github.com/diegoartursc/adminVAMO) | Painel administrativo extraído de `apps/site/src/app/admin` | extraído daqui |

Backend (`apps/backend`) é único e mora **apenas neste repo** — consumido pelos 3 fronts via `NEXT_PUBLIC_API_URL` / `EXPO_PUBLIC_API_URL`.

---

## Como rodar

### Pré-requisitos
- Node 20+
- PostgreSQL 14+ rodando em `localhost:5432`
- Banco `vamo` criado

### Setup inicial
```bash
npm install                                        # instala todos os workspaces
cp apps/backend/.env.example apps/backend/.env     # configurar DATABASE_URL e JWT_SECRET
npm run prisma:migrate --workspace=apps/backend
npm run prisma:seed --workspace=apps/backend       # se existir seed
```

### Subir tudo
```bash
npm run dev:backend     # API em http://localhost:3333
npm run dev:site        # Web em http://localhost:3033
npm run dev:mobile      # Expo em http://localhost:8081
```

Ou use `./start-all.sh` que sobe os três em paralelo.

---

## Variáveis de ambiente

### `apps/backend/.env` (ver `.env.example`)
- `DATABASE_URL` — Postgres connection string
- `JWT_SECRET` — gerar via `openssl rand -base64 32`
- `JWT_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`
- `PORT` (default 3333)
- `ALLOWED_ORIGINS` (CSV; em dev usa whitelist hardcoded)

### `apps/site/.env.local`
- `NEXT_PUBLIC_API_URL=http://localhost:3333/api`

### `apps/mobile/.env`
- `EXPO_PUBLIC_API_URL=http://localhost:3333/api`

**Nunca commitar `.env*` reais.** O `.gitignore` já cobre.

---

## Scripts da raiz

```bash
npm run dev:backend     # tsx watch apps/backend
npm run dev:site        # next dev apps/site
npm run dev:mobile      # expo start apps/mobile
npm run build:site      # next build apps/site
npm run build:mobile    # expo export apps/mobile (web)
```

Por workspace:
```bash
npm run <script> --workspace=apps/backend
npm run <script> --workspace=apps/site
npm run <script> --workspace=apps/mobile
```

---

## Arquitetura — modelo de usuário

Um único usuário (`Traveler`) pode acumular roles: `TRAVELER`, `CREATOR`, `ADMIN`.
- Entry point pós-login: `/perfil` no app mobile e site web
- Workspace do criador: criação e gerenciamento de roteiros
- Painel admin: gerenciamento de plataforma

Veja [`docs/README.md`](./docs/README.md) para o **índice navegável** completo, incluindo:
- 🎯 [Auditoria do Funil de Conversão 2026-05](./docs/CONVERSION_FUNNEL_AUDIT_2026-05.md) — análise técnica para AI
- 📖 [Produto](./docs/PRODUTO.md) — visão, princípios e funcionalidades
- 📊 [Status do projeto](./docs/STATUS.md)
- 🏗️ [Arquitetura backend](./docs/architecture/backend.md)
- 🎨 [Design system](./docs/design/design-system.md)

---

## Branding

- Cores primárias: gradiente Teal → Blue (criador), Coral `#FF385C` (Airbnb-style accent)
- Tipografia: system stack
- Logo: `apps/site/public/images/logo_transparent.png`

---

## Estrutura do Monorepo

```
VAMO/
├── apps/
│   ├── mobile/            # App React Native + Expo (foco do MVP)
│   │   ├── app/           # Expo Router (rotas)
│   │   └── src/           # componentes, serviços, theme
│   └── backend/           # API Node.js + Express + Prisma
│       ├── src/routes/    # endpoints REST
│       └── prisma/        # schema do banco
├── packages/
│   └── shared/            # tipos, score, validação e payload de roteiro
│                          # (single source of truth — consumido pelo app)
├── docs/                  # documentação do produto (incluindo auditoria técnica)
└── design-system/         # referência visual
```

> 🎯 O foco atual é exclusivamente em **Roteiros de Criadores**. A web e pacotes de agências 
> estão em pausa, mas a infraestrutura suporta ambos quando necessário.

---

## 🎯 Status MVP (Maio 2026)

### ✅ Implementadas
- Busca e descoberta de roteiros digitais
- Filtros avançados (preço, duração, rating)
- Sistema de favoritos e carrinho de compras
- Autenticação JWT do viajante
- Checkout com confirmação de compra
- Página de detalhe com reviews e avaliações
- Suporte a criadores independentes

### 🔜 Em Progresso
- Integração com gateway de pagamento real (Stripe/Asaas/PIX)
- Checkout com múltiplos itinerários
- Download offline de roteiros
- Sistema de reviews pós-compra

### 🔮 Futuro
- Chat com criadores
- Notificações push
- Programa de fidelidade

---

## 📄 Licença

© 2026 VAMO — Propriedade de Diego Artur Schmid Conrad. Todos os direitos reservados.
