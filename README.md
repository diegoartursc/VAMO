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

## Deploy

### Backend no Render

O [`render.yaml`](./render.yaml) define o backend com:

- root directory `apps/backend`;
- build `npm ci && npm run build`;
- migration segura de produção via `npm run prisma:migrate:deploy`;
- start `npm start`;
- health check em `/health`;
- Node 22.

No painel do Render, configure `DATABASE_URL`, `JWT_SECRET`,
`ADMIN_SEED_SECRET` e `ALLOWED_ORIGINS`. Mantenha
`ALLOW_DEMO_PURCHASES=false` até existir um gateway de pagamento real.

Uploads ainda usam o filesystem local do serviço e não são persistentes no
Render. Não trate `/uploads` como storage de produção até integrar um serviço
externo e migrar as URLs existentes.

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
- Entry point pós-login: `/perfil` (Airbnb-style) no site
- Workspace do criador: `/dashboard/*` (mesmo site)
- Painel admin: `apps/site/src/app/admin/*` (espelhado em `adminVAMO`)

Veja `docs/` para diagramas e decisões.

---

## Branding

- Cores primárias: gradiente Teal → Blue (criador), Coral `#FF385C` (Airbnb-style accent)
- Tipografia: system stack
- Logo: `apps/site/public/images/logo_transparent.png`

---

## Licença

Propriedade de Diego Artur Schmid Conrad. Todos os direitos reservados.
