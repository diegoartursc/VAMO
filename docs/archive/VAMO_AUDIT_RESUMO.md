# 🗺️ VAMO - Auditoria Completa de Produto e Arquitetura

**Data:** Maio 2026 | **Status:** MVP - Roteiros de Criadores | **Preparado por:** Product Manager Sênior + Arquiteto de Software + UX Researcher

---

## 📋 SUMÁRIO EXECUTIVO

A VAMO é uma plataforma de **marketplace de viagens** que conecta:
- **🧳 Viajantes:** Exploram, compram e acessam roteiros
- **✍️ Roteiristas:** Criam, editam e vendem roteiros
- **👨‍⚖️ Administradores:** Aprovam, rejeitam e gerenciam roteiros

**Arquitetura:** Monorepo com Backend (Node.js/Express), Website (Next.js) e Mobile App (React Native/Expo)

---

## ✅ DESCOBERTAS PRINCIPAIS

| Status | Descoberta |
|--------|-----------|
| ✓ | Arquitetura sólida e bem estruturada |
| ✓ | Fluxo de aprovação admin funcional |
| ✓ | Autenticação JWT implementada |
| ⚠️ | **CRÍTICO:** Checkout sem pagamento real (Stripe/PagSeguro) |
| ⚠️ | Site vs App desalinhados (site é apenas área logada) |
| ⚠️ | Carrinho apenas no mobile (AsyncStorage) |
| ⚠️ | Sem notificações real-time implementadas |

---

## 🏗️ STACK TECNOLÓGICO

| Componente | Tecnologia | Porta |
|-----------|-----------|--------|
| Backend | Node.js + Express + Prisma | 3333 |
| Website | Next.js App Router | 3033 |
| Mobile | React Native + Expo SDK 54 | 8081 |
| Database | PostgreSQL 14+ | 5432 |
| Auth | JWT (24h access, 7d refresh) | — |

---

## 👥 PERSONAS E FLUXOS

### 1. Visitante Não Logado
```
Home → Explora → Pesquisa → Detalhe → [Quer favoritar/comprar/criar] → Login
```

### 2. Viajante / Comprador
```
Home → Explora → Favorita/Carrinho → Checkout → Compra → Meus Roteiros → Acesso
```

### 3. Roteirista / Criador
```
Perfil → Criar Roteiro → Preenche módulos → Salva DRAFT → Envia Análise → Fila Admin → Aprovação
```

### 4. Administrador
```
Dashboard → Pendentes → Revisa → Aprova/Rejeita → Criador notificado → Publica
```

---

## 📊 ESTADOS DOS ROTEIROS (Lifecycle)

```
DRAFT 
  ↓
PENDING_REVIEW (Admin revisa)
  ├→ APPROVED (Pode publicar)
  │   ↓
  │  ACTIVE (Público vê)
  │   ├→ PAUSED
  │   └→ ARCHIVED
  │
  └→ REJECTED (Volta ao DRAFT)
```

**Tabela de Permissões:**

| Status | Criador Vê | Admin Vê | Público Vê | Editar | Próximo |
|--------|-----------|---------|-----------|--------|---------|
| DRAFT | ✓ privado | ✗ | ✗ | ✓ | PENDING_REVIEW |
| PENDING_REVIEW | ✓ em análise | ✓ fila | ✗ | ✗ | APPROVED/REJECTED |
| APPROVED | ✓ | ✓ histórico | ✓ | ✓ | ACTIVE |
| REJECTED | ✓ com motivo | ✓ | ✗ | ✓ | PENDING_REVIEW |
| ACTIVE | ✓ | ✓ | ✓ **público** | ✓ | PAUSED/ARCHIVED |
| PAUSED | ✓ | ✓ | ✗ | ✓ | ACTIVE/ARCHIVED |
| ARCHIVED | ✓ histórico | ✓ | ✗ | ✗ | — |

---

## 🔐 FLUXO DE AUTENTICAÇÃO

```javascript
// Traveler (Viajante/Criador)
POST /api/auth/traveler/register  // email, password, name
POST /api/auth/traveler/login     // email, password
POST /api/auth/traveler/refresh   // refreshToken

// Response
{
  accessToken: "JWT (24h)",
  refreshToken: "JWT (7d)",
  traveler: { id, name, email }
}
```

**Providers suportados:** EMAIL (ativo), GOOGLE/APPLE/FACEBOOK (estrutura pronta)

---

## 📝 FLUXO DE CRIAÇÃO DE ROTEIRO

### Etapas:
1. Acessa `/criador/` ou `/dashboard/`
2. Clica "Criar Roteiro"
3. Preenche módulos obrigatórios (título, destino, país, preço, duração)
4. Faz upload de imagens → `POST /api/uploads`
5. Sistema calcula `qualityScore`
6. Salva como `DRAFT` (privado, editável)
7. Clica "Enviar para Análise" → Status `PENDING_REVIEW`
8. Admin revisa → Aprova ou Rejeita
9. Se aprovado → `ACTIVE` → Aparece no app/site
10. Se rejeitado → Criador recebe motivo e pode editar + reenviar

### Módulos:
| Módulo | Obrigatório | Impacto no Score |
|--------|------------|------------------|
| Identidade | ✓ título, destination, country | Crítico |
| Preço | ✓ price, currency | Alto |
| Duração | ✓ duration | Médio |
| Descrição | ✓ description | Alto |
| Imagens | ✓ min 1 | Alto |
| Dia a Dia | — | Médio |
| Gastos | — | Baixo |
| Atrações | — | Médio |

---

## 💳 FLUXO DE COMPRA

### No Mobile:
```
Roteiro → Comprar → Carrinho (AsyncStorage)
→ Checkout (contato) → Pagamento (simulado)
→ Confirma → POST /api/itineraries/:id/purchase
→ Cria ItinerarySale → Aparece em "Meus Roteiros"
```

### No Site:
```
Roteiro → Favoritar (SavedItem)
⚠️ NÃO TEM CARRINHO NO SITE
```

**⚠️ CRÍTICO:** Checkout é **SIMULADO**. Sem integração real com Stripe/PagSeguro.

---

## ❤️ FLUXO DE FAVORITOS

```
Roteiro → Clica "Favoritar"
→ POST /api/itineraries/:id/save (cria SavedItem)
→ GET /api/travelers/me/saved (lista)
→ DELETE /api/itineraries/:id/save (remove)
```

**Armazenamento:** Banco de dados (tabela `SavedItem`)

---

## 🛒 FLUXO DE CARRINHO (Mobile Only)

```
Roteiro → Clica "Adicionar ao Carrinho"
→ AsyncStorage local ({ id, title, price })
→ Tela de Carrinho → Visualiza itens
→ Checkout → POST /purchase
```

**⚠️ Inconsistência:** Site não tem carrinho. Usa apenas SavedItem (favoritos).

---

## 📊 ROTAS DA API (Backend)

```
GET  /api/itineraries                          # Listar roteiros APPROVED
POST /api/itineraries                          # Criar (requer auth)
GET  /api/itineraries/:id                      # Detalhe
PUT  /api/itineraries/:id                      # Editar (requer auth)
POST /api/itineraries/:id/purchase             # Comprar (cria ItinerarySale)
POST /api/itineraries/:id/save                 # Favoritar
DELETE /api/itineraries/:id/save               # Desfavoritar

GET  /api/creators                             # Listar criadores
GET  /api/creators/:id                         # Perfil criador
POST /api/creators/:id/profile                 # Atualizar perfil (requer auth)

GET  /api/admin/stats                          # Dashboard admin
GET  /api/admin/pending                        # Roteiros PENDING_REVIEW
POST /api/admin/:id/approve                    # Aprovar (requer admin)
POST /api/admin/:id/reject                     # Rejeitar + motivo (requer admin)

GET  /api/my-trips                             # Roteiros comprados (requer auth)
GET  /api/sales                                # Dashboard criador (stats/vendas)
GET  /api/reviews                              # Listar reviews
POST /api/reviews                              # Criar review (requer auth)

POST /api/uploads                              # Upload de imagens (requer auth)

POST /api/auth/traveler/register               # Cadastro
POST /api/auth/traveler/login                  # Login
POST /api/auth/traveler/refresh                # Refresh token
```

---

## ⚠️ INCONSISTÊNCIAS CRÍTICAS

### 🔴 Críticas (Afetam Fluxo)

1. **Checkout sem pagamento real**
   - `POST /purchase` simula venda
   - Sem integração Stripe/PagSeguro
   - Impossível fazer vendas reais

2. **Site vs App desalinhados**
   - Site: Só login + área criador/admin
   - App: Tem exploração pública
   - Visitante só pode explorar no app, não no site

3. **Carrinho apenas no mobile**
   - Mobile: AsyncStorage (local)
   - Site: Sem carrinho, apenas SavedItem (favoritos)
   - Experiência diferente entre plataformas

4. **Sem notificações real-time**
   - Tabela `Notification` existe
   - Sem implementação de envio (email/push)
   - Criador não sabe quando roteiro é aprovado/rejeitado

5. **Bug de creatorId**
   - Fallback para "primeiro creator" em algumas rotas
   - Usuário pode editar roteiros de outro criador
   - Documentado no código (linha 123 em itineraries.ts)

6. **Sem validação de duplicidade de compra**
   - `/purchase` é idempotent (retorna `alreadyPurchased=true`)
   - Mas não há feedback visual ao usuário

### 🟡 Menores (UX/Polish)

- Estados vazios não tratados (favoritos/carrinho vazios)
- Sem paginação em GET /itineraries (retorna todos)
- Reviews incompleto (POST funciona, UI limitada)
- Offline access não planejado
- Filtros não documentados na UI

---

## 💡 RECOMENDAÇÕES

### Arquitetura (Crítica)

1. **Integrar pagamento real (P0)**
   - Adicionar Stripe/PagSeguro
   - Webhook para confirmar venda
   - Status da compra: PROCESSING → CONFIRMED → COMPLETED

2. **Unificar carrinho (P1)**
   - Migrar de AsyncStorage para tabela `Cart` no banco
   - Site e app compartilham mesmo carrinho
   - Sincronizar entre dispositivos

3. **Adicionar paginação (P1)**
   - `GET /itineraries?limit=20&offset=0`
   - Performance e UX

4. **Melhorar resolução de creatorId (P1)**
   - Sempre exigir creatorId explícito ou do JWT
   - Remover fallback para "primeiro creator"

5. **Notificações real-time (P2)**
   - WebSocket ou polling
   - Email transacional para aprovação/rejeição

### UX / Product (Importante)

1. **Site como vitrine pública (P1)**
   - Landing page atraente
   - Exploração de roteiros SEM login
   - Conversão a login quando interessado

2. **Unificar navegação (P1)**
   - Mesma IA em site e app
   - Bottom tabs no app, top nav no site

3. **Carrinho visual (P1)**
   - Contador de itens
   - Preview antes de checkout

4. **Progressão criador (P2)**
   - Onboarding: Viajante → Ativar Creator → Criar → Enviar
   - Tutorial step-by-step

5. **Dashboard criador melhorado (P2)**
   - Views, conversões, rating médio
   - Previsão de receita

---

## 📅 PLANO DE IMPLEMENTAÇÃO POR FASES

### Fase 1 (Sprint 1-2): Foundation
- [ ] Integrar Stripe (checkout real)
- [ ] Adicionar paginação ao backend
- [ ] Remover fallback de creatorId
- [ ] Email de aprovação/rejeição

### Fase 2 (Sprint 3-4): Convergência
- [ ] Migrar carrinho para banco de dados
- [ ] Sincronizar site/app
- [ ] Preview de carrinho em ambas plataformas
- [ ] Audit log completo

### Fase 3 (Sprint 5-6): Site Público
- [ ] Landing page
- [ ] Exploração pública (site)
- [ ] SEO basics
- [ ] Filtros avançados

### Fase 4 (Sprint 7-8): Onboarding
- [ ] Fluxo viajante → criador
- [ ] Tutorial de criação
- [ ] Dashboard com métricas
- [ ] Email melhorado

### Fase 5 (Post-Launch): Avançado
- [ ] Offline access (PDF)
- [ ] OAuth integrado
- [ ] Analytics (Mixpanel)
- [ ] A/B testing

---

## 📁 ARQUIVOS ENTREGUES

1. **VAMO_Audit_Report.pdf** - Relatório executivo com análise geral
2. **VAMO_Flowcharts.html** - Fluxogramas Mermaid interativos (abrir no navegador)
3. **VAMO_AUDIT_RESUMO.md** - Este documento (resumo em Markdown)

---

## 🎯 CONCLUSÃO

A VAMO possui uma **base sólida** de arquitetura e modelo de negócio claro.

**Status atual:** ✓ Fluxos principais (exploração, criação, aprovação) implementados, ⚠️ Com lacunas críticas em pagamento e unificação.

**Próximos passos:** Implementar as 5 fases do plano para remover atrito (pagamento) e aumentar visibilidade (site público).

---

**Preparado por:** Product Manager Sênior + Arquiteto de Software + UX Researcher
**Data:** Maio 2026
**© 2026 Diego Artur Schmid Conrad. All rights reserved.**
