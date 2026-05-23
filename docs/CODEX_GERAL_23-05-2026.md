# codex geral 23/05/2026

Data: 23/05/2026  
Autor: Codex (análise técnica profunda)  
Escopo: `apps/backend` + `apps/site` + `apps/mobile`

## Resumo executivo

Foram encontrados problemas críticos de autorização, segurança e consistência de fluxo entre backend/site/app.  
O sistema está compilando em alguns alvos, mas a qualidade de proteção de dados e integridade de permissões ainda está abaixo do mínimo para produção.

### Resultado dos checks executados

- `npm run build --workspace=apps/backend`: passou
- `npm run lint --workspace=apps/site`: falhou com **251 problemas** (`182 errors`, `69 warnings`)
- `npm run build --workspace=apps/site`: passou, mas com bypass de validações
- `npm run build:web --workspace=apps/mobile`: passou

## Problemas críticos (P0)

### 1) Edição e exclusão de roteiros sem autenticação/ownership no backend

Impacto: qualquer cliente pode tentar editar/arquivar/deletar roteiro por ID sem validação de dono.  

Evidências:
- `apps/backend/src/routes/itineraries.ts:588` usa `optionalAuthMiddleware` no `PUT /:id`
- `apps/backend/src/routes/itineraries.ts:815` usa `optionalAuthMiddleware` no `DELETE /:id`
- Não há checagem de `req.traveler` obrigatória nem checagem `existing.creatorId === creator do token`.

Risco: alteração indevida de conteúdo e corrupção de catálogo.

### 2) Compra de roteiro com fallback para “primeiro traveler”

Impacto: compra pode ser registrada no usuário errado quando não há token.  

Evidências:
- `apps/backend/src/routes/itineraries.ts:847` (`POST /:id/purchase`) não exige auth middleware.
- `apps/backend/src/routes/itineraries.ts:862-864` fallback para `prisma.traveler.findFirst(...)`.

Risco: vendas atribuídas ao perfil errado, dados financeiros e histórico comprometidos.

### 3) Exposição pública de roteiro por ID sem validar status

Impacto: possível leitura de rascunhos/rejeitados se alguém tiver o ID.  

Evidências:
- `apps/backend/src/routes/itineraries.ts:182` (`GET /:id`) busca e retorna sem filtrar `status`.
- Não há bloqueio para `DRAFT`, `REJECTED`, `PENDING_REVIEW`.

Risco: vazamento de conteúdo privado de criadores.

### 4) Upload aberto sem autenticação

Impacto: qualquer usuário pode fazer upload para o servidor.  

Evidências:
- `apps/backend/src/routes/uploads.ts:32` e `:49` sem middleware de autenticação.

Risco: abuso de armazenamento, spam de arquivos, superfície de ataque.

### 5) Review forjado (sem autenticação + sem validação de compra real)

Impacto: qualquer pessoa pode avaliar qualquer roteiro em nome de qualquer `travelerId`.  

Evidências:
- `apps/backend/src/routes/reviews.ts:82` (`POST /reviews`) sem auth.
- `apps/backend/src/routes/reviews.ts:84-89` confia em `travelerId` vindo no body.
- `apps/backend/src/routes/reviews.ts:114` marca review como `verified: true` sem checar compra.

Risco: reputação manipulada e fraude de avaliação.

### 6) Admin login “auto” com token mock no site + bypass no backend

Impacto: painel admin acessível em ambiente não-prod sem login real; risco alto se configuração de ambiente estiver errada.

Evidências:
- `apps/site/src/app/admin/login/page.tsx:11` grava `mock-admin-token` no `localStorage`.
- `apps/backend/src/routes/admin.ts:21` aceita `mock-admin-token` quando `NODE_ENV !== 'production'`.

Risco: acesso administrativo indevido em ambientes mal configurados.

### 7) `creatorId` hardcoded no frontend de criação/edição

Impacto: payload pode ser enviado com ID fixo; mistura de autoria e risco de roteiros vinculados incorretamente.

Evidências:
- `apps/site/src/app/dashboard/roteiro/[id]/page.tsx:185` define `DEFAULT_CREATOR_ID`.
- `apps/site/src/app/dashboard/roteiro/[id]/page.tsx:763` envia `creatorId: DEFAULT_CREATOR_ID`.
- `apps/site/src/app/criador/roteiro/[id]/page.tsx:106` e `:291` repetem o padrão.

Risco: roteiro atrelado ao criador errado em cenários específicos.

## Problemas altos (P1)

### 8) Site build em “verde” ignorando erros de TS/ESLint

Impacto: regressões passam para produção sem bloqueio.  

Evidências:
- `apps/site/next.config.ts:9` `typescript: { ignoreBuildErrors: true }`
- `apps/site/next.config.ts:10` `eslint: { ignoreDuringBuilds: true }`
- `next build` mostrou warning de config inválida e pulou validação de tipos.

### 9) Inconsistência de status entre endpoints

Impacto: mesmos dados aparecem/desaparecem dependendo da tela.  

Evidências:
- Itinerários públicos usam `APPROVED`: `apps/backend/src/routes/itineraries.ts:13`.
- Criador `/creators/:id` filtra itinerários por `ACTIVE`: `apps/backend/src/routes/creators.ts:61`.
- Pacotes públicos usam `ACTIVE`: `apps/backend/src/routes/packages.ts:87`.
- Pacotes “featured” usam `APPROVED`: `apps/backend/src/routes/packages.ts:160`.

Risco: experiência inconsistente e difícil de explicar para criador/admin.

### 10) Fluxo de carrinho/favoritos no site com rotas quebradas

Impacto: navegação leva para páginas inexistentes.  

Evidências:
- Links para `/explore` em:
  - `apps/site/src/components/GlobalHeader.tsx:118`
  - `apps/site/src/app/perfil/page.tsx:121`
  - `apps/site/src/app/perfil/compras/page.tsx:9`
  - `apps/site/src/app/perfil/favoritos/page.tsx:9`
- Link para `/explorar`: `apps/site/src/app/perfil/carrinho/page.tsx:66`
- Push para `/checkout`: `apps/site/src/app/perfil/carrinho/page.tsx:139`
- Essas rotas não existem em `apps/site/src/app`.

### 11) Páginas de perfil (compras/favoritos) sem integração real

Impacto: usuário vê placeholder e não seus dados reais.  

Evidências:
- `apps/site/src/app/perfil/favoritos/page.tsx` só renderiza `EmptyState`.
- `apps/site/src/app/perfil/compras/page.tsx` só renderiza `EmptyState`.

### 12) Salvamento de rascunho mobile sem validar sucesso da API

Impacto: usuário acredita que salvou, mesmo em falha HTTP.  

Evidências:
- `apps/mobile/app/new-itinerary.tsx:311-315` faz `fetch(...)` sem verificar `res.ok`.
- Depois executa fluxo de sucesso (`remove draft`, `router.replace`).

### 13) Endpoints sensíveis por query sem auth (reviews/my)

Impacto: enumeração de histórico de reviews por `travelerId`.  

Evidências:
- `apps/backend/src/routes/reviews.ts:42` (`GET /reviews/my?travelerId=...`) sem middleware auth.

## Problemas médios (P2)

### 14) Débito técnico massivo de lint no site

Impacto: manutenção cara e bugs silenciosos.  

Evidências:
- `npm run lint --workspace=apps/site` reportou 251 problemas.
- Muitos `react-hooks/set-state-in-effect`, `react-hooks/refs`, `no-explicit-any`.

### 15) Comentário de contrato divergente no mobile API service

Impacto: desenvolvedor pode assumir fallback inexistente.  

Evidências:
- `apps/mobile/src/services/api.ts:209-211` comenta fallback de traveler no `/my-trips`.
- Mas backend usa `travelerAuthMiddleware` e retorna 401 sem token: `apps/backend/src/routes/my-trips.ts:8`.

### 16) Ausência de suíte de testes automatizados

Impacto: regressão só descoberta tardiamente.  

Evidências:
- Busca por arquivos de teste retornou vazio em `apps/*`.

## Observações por camada

### Backend

- Boa estrutura geral de rotas e Prisma.
- Pontos críticos estão concentrados em autorização e validação de ownership.

### Site

- Build “passa”, mas a configuração atual está mascarando erros sérios.
- Fluxos de perfil/compras/favoritos ainda não conectados ao backend real.

### Mobile

- Build web estável.
- Fluxo de criação é avançado, mas há pontos de confiabilidade (save sem checagem de resposta).

## Plano de correção recomendado

### Fase 1 (imediata, segurança)

1. Trocar `optionalAuthMiddleware` por middleware obrigatório em `PUT/DELETE /itineraries/:id`.
2. Adicionar ownership check (`creator.travelerId === req.traveler.travelerId`) em update/delete.
3. Remover fallback de `findFirst` em compra; exigir token válido.
4. Proteger `/uploads` com auth e rate limit específico.
5. Proteger `/reviews` e `/reviews/my` com traveler auth.
6. Validar compra real antes de criar review `verified`.

### Fase 2 (integridade de produto)

1. Padronizar lifecycle e visibilidade (`APPROVED` vs `ACTIVE`) com regra única.
2. Remover `DEFAULT_CREATOR_ID` do frontend; resolver creator exclusivamente no backend via JWT.
3. Corrigir rotas quebradas (`/explore`, `/explorar`, `/checkout`) ou criar páginas equivalentes.
4. Integrar páginas de perfil (`favoritos`, `compras`) com dados reais.

### Fase 3 (qualidade e engenharia)

1. Reativar bloqueio de build por TS/ESLint no `apps/site`.
2. Reduzir erros de lint por prioridade (hooks/refs primeiro).
3. Adicionar testes de integração para auth/permissões/compra/review.

## Apêndice: evidências rápidas de comando

- `npm run lint --workspace=apps/site`: falhou com `251` problemas.
- `npm run build --workspace=apps/site`: passou com warning e pulando validações.
- `npm run build --workspace=apps/backend`: passou.
- `npm run build:web --workspace=apps/mobile`: passou.

