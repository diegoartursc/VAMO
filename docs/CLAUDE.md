# Claude no Projeto VAMO

> Documento de posicionamento — como o Claude atua neste projeto, o que já foi feito, o que sabe e como se comportar nas próximas sessões.

**Última atualização:** 28/03/2026

---

## O que é o VAMO

VAMO é uma plataforma de turismo com três partes integradas:

- **`apps/backend`** — API REST em Node.js + TypeScript + Prisma + PostgreSQL, rodando na porta `3333`
- **`apps/mobile`** — App React Native / Expo para viajantes (busca pacotes, roteiros, faz reservas)
- **`apps/site`** — Dashboard Next.js para agências e criadores de roteiros gerenciarem seus produtos

É um monorepo npm com `apps/*` como workspaces.

---

## Como rodar o projeto

### Backend
```bash
cd apps/backend
npm run dev          # ts-node-dev, hot reload
# ou
npx tsc && node dist/index.js
```
> Requer PostgreSQL com `DATABASE_URL` configurado em `apps/backend/.env`

### Site (dashboard)
```bash
cd apps/site
npm run dev          # porta 3001 (ou 3000 se livre)
npm run build && npm start
```

### App mobile
```bash
cd apps/mobile
npx expo start       # abre Expo Go no celular
npx expo start --web # roda no browser
```
> Em celular físico: defina `EXPO_PUBLIC_API_URL=http://<SEU_IP>:3333/api` em `apps/mobile/.env`

---

## Regras de engenharia que seguimos

- **Nunca criar `new PrismaClient()`** fora de `src/lib/prisma.ts` — usar sempre o singleton exportado de lá
- **Rotas protegidas usam `authMiddleware`** — importar de `src/middleware/auth.ts`
- **Ownership obrigatório** — após autenticar, verificar se o recurso pertence à agência do token (`req.agency.agencyId`)
- **`agencyId` nunca vem do body** em rotas autenticadas — sempre usar `req.agency!.agencyId` do JWT
- **Sem dados mock em rotas de produção** — fallback mock fica no cliente, não no servidor
- **Variáveis de ambiente sensíveis** nunca têm fallback hardcoded em produção — apenas em dev com chave óbvia de substituição

---

## O que o Claude já fez neste projeto

### Sessão 28/03/2026 — Revisão e correção de bugs

**Bugs corrigidos (Rodada 1):**

| # | Bug | Arquivo(s) |
|---|-----|------------|
| 1 | 12 instâncias separadas de `PrismaClient` substituídas pelo singleton | Todos os arquivos em `src/routes/` |
| 2 | Rotas `GET /sales/:agencyId` e `PUT /sales/:purchaseId` sem autenticação | `routes/sales.ts` |
| 3 | UI Mocks hardcoded (Santorini, Cusco) sendo retornados para todos os usuários | `routes/my-trips.ts` |
| 4 | Endpoint `GET /packages/dashboard/stats` chamado pelo site mas inexistente no backend | `routes/packages.ts` |
| 5 | `POST /api/auth/refresh` inexistente apesar de o login retornar `refreshToken` | `routes/auth.ts` |
| 6 | Data de pagamento hardcoded como "seg., mar. 9" no checkout | `app/checkout/payment.tsx` |
| 7 | CORS completamente aberto sem restrição de origin | `src/index.ts` |
| 8 | `import bcrypt from 'bcrypt'` trocado para `bcryptjs` (sem binário nativo) | `lib/auth.ts`, `routes/admin.ts` |
| 9 | `binaryTargets` do Prisma adicionado para suportar Linux + macOS | `prisma/schema.prisma` |

**Bugs corrigidos (Rodada 2):**

| # | Bug | Arquivo(s) |
|---|-----|------------|
| 10 | Sales: agência A podia ver vendas da agência B (sem validação de ownership) | `routes/sales.ts` |
| 11 | Sales: agência A podia editar documentos de vendas da agência B | `routes/sales.ts` |
| 12 | Pacotes: `agencyId` era aceito do body — qualquer agência podia criar pacote em nome de outra | `routes/packages.ts` |
| 13 | Pacotes: `PUT` e `DELETE` sem verificação de ownership da agência | `routes/packages.ts` |
| 14 | `API_BASE_URL` hardcoded como `localhost` no mobile (não funciona em celular físico) | `src/services/api.ts`, criado `.env` |
| 15 | Mensagem de erro no dashboard apontava para porta 3000 em vez de 3333 | `app/dashboard/page.tsx` |

---

## Bugs conhecidos que ainda precisam de atenção

Estes bugs foram identificados mas não corrigidos porque exigem implementar autenticação de usuário (ainda não existe):

- **`TRAVELER_ID` hardcoded** em `app/(tabs)/my-trips.tsx` — todos veem viagens do mesmo usuário demo
- **Telas de detalhe de reserva só leem mock** — `purchased-package/[id].tsx` e `booking-awaiting-quote/[id].tsx` usam `getBookingById()` de mock local; quando chegarem IDs reais do banco, vão mostrar "não encontrado"
- **`isAuthenticated()` sempre retorna `true`** no site — dashboards não têm proteção real de rota ainda (MVP intencional)
- **Login com senha errada retorna sessão mock** no site em vez de erro (também MVP intencional)

---

## Fila de Prioridades — Próximas melhorias

Ordenado por impacto para a fase atual de desenvolvimento (local/MVP):

### 🔴 Alta prioridade

1. **Autenticação de viajante (traveler auth)**
   - `TRAVELER_ID` hardcoded em `app/(tabs)/my-trips.tsx` — todos os usuários veem as mesmas viagens
   - Telas `purchased-package/[id].tsx` e `booking-awaiting-quote/[id].tsx` usam mock local em vez do banco
   - Depende de: criar tabela `Traveler`, endpoint `POST /auth/traveler`, middleware de auth no mobile

2. **Validação de input com Zod**
   - Nenhum endpoint valida o formato dos dados recebidos — um `name: 12345` ou `price: "abc"` chega ao banco sem barreira
   - Adicionar schemas Zod em cada rota que recebe body (`POST /packages`, `POST /auth/register`, etc.)
   - Retornar mensagens de erro claras (HTTP 422) em vez de crash do Prisma

3. **Checkout com gateway de pagamento real**
   - O fluxo de checkout existe no mobile mas não processa pagamento de verdade
   - Integrar Stripe ou Asaas (mais popular no Brasil); criar tabela `Payment` no Prisma
   - Sem isso, nenhuma transação financeira funciona em produção

### 🟡 Média prioridade

4. **Proteção real de rotas no site (dashboard)**
   - `isAuthenticated()` sempre retorna `true` — qualquer pessoa pode acessar o dashboard de qualquer agência
   - Login com senha errada retorna sessão mock no site
   - Implementar verificação do JWT no middleware do Next.js (`middleware.ts`)

5. **Audit log para ações de admin**
   - Rotas em `routes/admin.ts` executam ações críticas (criar agências, deletar dados) sem rastro
   - Criar tabela `AuditLog` com: `who`, `action`, `target`, `timestamp`, `ip`
   - Essencial antes de qualquer deploy em produção

### 🟢 Baixa prioridade (qualidade de código)

6. **Limpeza de mock data infiltrada**
   - Algumas telas do mobile ainda têm dados de exemplo hardcoded misturados com dados reais
   - Centralizar mocks em um arquivo `__mocks__/` separado, nunca inline nas telas

7. **Testes automatizados**
   - Nenhum teste escrito ainda — risco alto de regressão ao crescer o projeto
   - Começar com testes de integração nas rotas mais críticas (`/auth`, `/packages`, `/sales`)

---

## Variáveis de ambiente necessárias

### `apps/backend/.env`
```
DATABASE_URL="postgresql://..."
JWT_SECRET="..."               # chave forte, pelo menos 32 chars
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=3333
NODE_ENV="development"
ALLOWED_ORIGINS="http://localhost:3000,http://localhost:3001"
```

### `apps/mobile/.env`
```
# Em celular físico: trocar localhost pelo IP da máquina
EXPO_PUBLIC_API_URL=http://localhost:3333/api
```

### `apps/site/.env.local`
```
NEXT_PUBLIC_API_URL=http://localhost:3333/api
```

---

## Como o Claude deve se comportar nas próximas sessões

1. **Sempre fazer backup antes de mudanças profundas** — `tar --exclude=node_modules -czf backups/VAMO-backup-$(date +%Y%m%d-%H%M%S).tar.gz .`
2. **Nunca regredir funcionalidade ou design** — as telas foram construídas no Antigravity e têm design intencional
3. **Explicar tudo de forma simples** — Diego não é programador, então cada mudança deve ser explicada em linguagem acessível
4. **Testar TypeScript antes de finalizar** — rodar `npx tsc --noEmit` no backend após cada mudança
5. **Usar o singleton do Prisma** — nunca `new PrismaClient()` fora de `lib/prisma.ts`
6. **Validar ownership** em qualquer rota autenticada que acessa dados de agência
