# Claude no Projeto VAMO

> Documento de posicionamento — como o Claude atua neste projeto, o que já foi feito, o que sabe e como se comportar nas próximas sessões.

**Última atualização:** 28/03/2026

---

## O que é o VAMO

VAMO é uma plataforma de turismo com três partes integradas:

- **`apps/backend`** — API REST em Node.js + TypeScript + Prisma + PostgreSQL, rodando na porta `3333`
- **`apps/mobile`** — App React Native / Expo para viajantes (busca e compra de roteiros de criadores independentes)
- **`apps/site`** — Dashboard Next.js para criadores de roteiros gerenciarem seus produtos

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
| 4 | **[PAUSADO]** Endpoint `GET /packages/dashboard/stats` — funcionalidade de pacotes não é foco MVP | `routes/packages.ts` |
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
| 12 | **[PAUSADO]** Pacotes: `agencyId` — funcionalidade não é foco MVP | `routes/packages.ts` |
| 13 | **[PAUSADO]** Pacotes: ownership validation — funcionalidade não é foco MVP | `routes/packages.ts` |
| 14 | `API_BASE_URL` hardcoded como `localhost` no mobile (não funciona em celular físico) | `src/services/api.ts`, criado `.env` |
| 15 | Mensagem de erro no dashboard apontava para porta 3000 em vez de 3333 | `app/dashboard/page.tsx` |

**Bugs corrigidos (Rodada 3 — Consistência de UI):**

| # | Bug | Arquivo(s) |
|---|-----|------------|
| 16 | `PremiumReviewsSection` renderizado duas vezes na mesma página de pacote (duplicata visual) | `app/package/[id].tsx` |
| 17 | FAQ dos pacotes `pkg-1` e `pkg-2` usava chaves erradas (`'1'` e `'2'`) — sempre caía no FAQ genérico | `src/data/mockFAQ.ts` |

---

## Decisão de produto — Sem autenticação durante o desenvolvimento

**Durante toda a fase de desenvolvimento, os dashboards (agência e criador) devem ser acessados livremente, sem pedir senha.** A experiência precisa ser fluida. Isso é uma decisão intencional do Diego, não um bug.

Consequências diretas desta decisão — **não corrigir estes itens até o Diego autorizar:**

- **`isAuthenticated()` sempre retorna `true`** em `site/src/lib/auth.ts` — dashboards abertos sem login real
- **`login()` retorna `MOCK_SESSION`** quando o backend está offline ou credenciais erradas — acesso garantido no dev local
- **`TRAVELER_ID = 'trav-diego'` hardcoded** em `app/(tabs)/my-trips.tsx` — todos veem as viagens do usuário demo

Outros itens aguardando autenticação real:

- **Telas de detalhe de reserva só leem mock** — `purchased-package/[id].tsx` e `booking-awaiting-quote/[id].tsx` usam `getBookingById()` de mock local; quando chegarem IDs reais do banco, vão mostrar "não encontrado"

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

## Modelos de referência de UI — NÃO modificar sem aprovação

Esta seção documenta as telas e componentes que servem como **padrão oficial de design e estrutura** do VAMO. Qualquer nova tela ou componente deve seguir esses modelos como base. Nunca alterar o layout, ordem de seções ou estrutura visual desses arquivos sem aprovação explícita do Diego.

### 📱 Página de Detalhe de Pacote — **[FUNCIONALIDADE PAUSADA]**

> ⚠️ **NÃO MODIFICAR** — Esta funcionalidade foi pausada. O foco atual é exclusivamente em **Roteiros de Criadores** (`apps/mobile/app/itinerary/[id].tsx`). Esta documentação é mantida apenas como referência histórica para desenvolvimento futuro.

**Arquivo:** `apps/mobile/app/package/[id].tsx`
**Pacote de referência:** `pkg-1` — *Paris Romântica - 7 Dias Inesquecíveis*
**Dados em:** `apps/mobile/src/data/mockPackages.ts`

Este é o componente dinâmico compartilhado por TODOS os 10 pacotes do app. O layout é único e idêntico para todos — cada seção aparece condicionalmente apenas se o campo existir nos dados do pacote.

**Esqueleto oficial da página (em ordem de exibição):**

1. **Hero Image** — imagem de fundo imersiva com gradiente (`images[0]`)
2. **Header de navegação** — botão voltar (glass) + botão favorito (glass)
3. **Quick Stats** — badge de rating + badge de país/localização
4. **Título** do pacote
5. **Chips de inclusões** — ícones de voo, hotel (estrelas), refeições, passeios, extras
6. **Divider**
7. **Info da agência** — logo + nome + selo verificado + link "Como verificamos as agências"
8. **Preço + CTA principal** — "A partir de R$ X" + botão "Verificar Disponibilidade"
9. **Botão de alerta de preço** (secundário)
10. **Saídas disponíveis** — cards de datas com vagas e preço por saída
11. **Badge WhatsApp** — "Confirmação via WhatsApp / Resposta em até 24h"
12. **Card "Como funciona a reserva"** — 4 passos fixos
13. **Sobre a experiência** — `emotionalIntro` + `description` + `fullDescription`
14. **Avaliações** (`PremiumReviewsSection`) — aparece aqui, logo após a descrição
15. **Inclui** — lista colapsável (`includedItems`)
16. **Não indicado para** — lista colapsável (`notRecommendedFor`)
17. **Informações importantes** — lista colapsável (`importantInfo`)
18. **Destaques da Viagem** — lista colapsável expandida por padrão (`highlights`)
19. **Itinerário Sugerido** — timeline vertical colapsável expandida por padrão (`itinerary`)
20. **Esta viagem é perfeita para você se...** — cards de identificação (`perfectFor`)
21. **Sua viagem sem preocupações** — bloco fixo de tranquilização (estático)
22. **Política de cancelamento** — card fixo "Cancelamento Gratuito"
23. **Perguntas Frequentes** — FAQ específico por pacote (`getPackageFAQ(id)`)
24. **Você também pode gostar** — pacotes relacionados em scroll horizontal

**Regra:** Todos os campos acima devem estar preenchidos em cada novo pacote adicionado ao `mockPackages.ts`. Os pacotes `pkg-1` a `'10'` já seguem este padrão — qualquer pacote novo deve seguir a mesma estrutura de dados.

**IDs dos pacotes existentes:**
| ID | Título |
|----|--------|
| `pkg-1` | Paris Romântica - 7 Dias Inesquecíveis *(modelo de referência)* |
| `pkg-2` | Caribe All Inclusive - Cancún |
| `3` | Europa Clássica - 15 Dias |
| `4` | Fernando de Noronha Completo |
| `5` | Nova York - A Cidade que Nunca Dorme |
| `6` | Machu Picchu e Cusco Místico |
| `7` | Dubai Luxo e Tradição |
| `8` | Patagônia Argentina Aventura |
| `9` | Paris Essencial - Weekend Perfeito |
| `10` | Paris Completa - Experiência de Luxo |

> ⚠️ Os dois primeiros IDs (`pkg-1`, `pkg-2`) têm formato diferente dos demais (`'3'` a `'10'`). Isso é uma inconsistência histórica — ao adicionar novos pacotes, usar formato numérico simples (`'11'`, `'12'`, etc.) para manter consistência com a maioria.

---

### 🗺️ Página de Detalhe de Roteiro — Modelo Oficial

**Arquivo:** `apps/mobile/app/itinerary/[id].tsx`
**Roteiro de referência:** `'1'` — *Paris Econômica - 10 dias por R$ 6.000* (criador: Diego Artur)
**Dados em:** `apps/mobile/src/data/mockItineraries.ts`

Este é o componente dinâmico compartilhado por TODOS os 9 roteiros do app. Diferente dos pacotes (que são vendidos por agências), os roteiros são **produtos digitais** vendidos por criadores independentes.

**Esqueleto oficial da página (em ordem de exibição):**

1. **Hero Image** — imagem de fundo (400px), `images[0]`
2. **Header de navegação** (blur) — botão voltar + botão compartilhar (Share nativo)
3. **Badge do Criador** — avatar + nome + `VerifiedBadge` + rating + contagem de vendas
4. **Link "Como verificamos os criadores"** — navega para `/verification-explained`
5. **Título** do roteiro
6. **Localização** — ícone + destino + país
7. **Stats Row** — rating, duração em dias, tipo "Digital"
8. **Preço + CTA** — "Roteiro completo / R$ X,XX" + botão "Comprar Agora"
9. **Aviso Produto Digital** — texto explicando que é conteúdo informativo (fixo)
10. **Estimativa de Gasto** — CollapsibleSection *fechado* por padrão (`estimatedSpending` com breakdown por categoria)
11. **Sobre o Roteiro** — CollapsibleSection expandido por padrão (`description`)
12. **Destaques** — CollapsibleSection expandido por padrão (`highlights`)
13. **O que você vai receber** — CollapsibleSection expandido, lista fixa de `ITINERARY_INCLUSIONS`
14. **Como você vai receber** — CollapsibleSection com 4 passos fixos (Comprar → Acessar → Baixar offline → Acesso vitalício)
15. **Perguntas Frequentes** — FAQ específico por roteiro (`getItineraryFAQ(id)`)
16. **Avaliações** (`PremiumReviewsSection`) — aparece se houver reviews com `packageId: 'itinerary-{id}'`
17. **Card "Criador Verificado"** — bloco de confiança estático com nome e contagem de vendas
18. **Disclaimer Legal** — 4 pontos fixos sobre produto digital, acesso permanente e variação de preços

**Regra:** Todo novo roteiro adicionado ao `mockItineraries.ts` deve ter os campos: `highlights` (array) e `estimatedSpending` (com `breakdown`). Os demais campos são obrigatórios pelo tipo `Itinerary`.

**IDs dos roteiros existentes:**
| ID | Título | Criador |
|----|--------|---------|
| `'1'` | Paris Econômica - 10 dias por R$ 6.000 *(modelo de referência)* | Diego Artur |
| `'2'` | Tóquio Completo - Guia Definitivo | Mariana Costa |
| `'3'` | Nova York em 7 Dias | Carlos Mendes |
| `'4'` | Lisboa e Porto Essencial | Julia Ferreira |
| `'5'` | Machu Picchu e Peru | Pedro Alves |
| `'6'` | Bali e Ubud Espiritual | Ana Lima |
| `'7'` | Safari Quênia Aventura | Rafael Santos |
| `'8'` | Grécia Ilhas e Atenas | Camila Rocha |
| `'9'` | Patagônia Chilena | Lucas Oliveira |

> ℹ️ O ID de review no `mockReviews.ts` para roteiros usa o formato `'itinerary-{id}'` — ex: `'itinerary-1'` para a Paris Econômica. Sempre manter esse padrão ao adicionar reviews de novos roteiros.

---

## Como o Claude deve se comportar nas próximas sessões

1. **Sempre fazer backup antes de mudanças profundas** — `tar --exclude=node_modules -czf backups/VAMO-backup-$(date +%Y%m%d-%H%M%S).tar.gz .`
2. **Nunca regredir funcionalidade ou design** — as telas foram construídas no Antigravity e têm design intencional
3. **Explicar tudo de forma simples** — Diego não é programador, então cada mudança deve ser explicada em linguagem acessível
4. **Testar TypeScript antes de finalizar** — rodar `npx tsc --noEmit` no backend após cada mudança
5. **Usar o singleton do Prisma** — nunca `new PrismaClient()` fora de `lib/prisma.ts`
6. **Validar ownership** em qualquer rota autenticada que acessa dados de agência
