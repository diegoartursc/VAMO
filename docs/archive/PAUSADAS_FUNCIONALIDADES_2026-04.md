# 🛑 Funcionalidades Pausadas — VAMO (Abril 2026)

> **Última atualização:** 11/04/2026  
> **Motivo:** Reescopo do projeto para foco exclusivo em **Roteiros de Criadores** durante MVP

---

## 📌 Status Geral

A partir de **Abril 2026**, o VAMO está focado **exclusivamente em Roteiros de Criadores Independentes**. A funcionalidade de **Pacotes de Agências** foi pausada.

Isso significa:
- ❌ Agências **não podem** criar ou vender pacotes (dashboard desabilitado)
- ❌ App mobile **não exibe** aba de pacotes
- ❌ Backend continua com rotas de pacotes mas **não é prioridade**
- ✅ **Roteiros de criadores** é a única funcionalidade de produto ativa

---

## 🔴 Código Pausado — Backend

### Routes
| Arquivo | Status | Detalhes |
|---------|--------|----------|
| `apps/backend/src/routes/packages.ts` | 🟡 Existe mas pausado | Endpoints de CRUD de pacotes — não remove, apenas não é prioridade |
| `apps/backend/src/routes/sales.ts` | 🟡 Parcial | Apenas vendas de roteiros são foco |

### Schemas
| Arquivo | Status | Detalhes |
|---------|--------|----------|
| `apps/backend/src/schemas/packages.ts` | 🟡 Existe mas pausado | Schema Zod para pacotes — manter para referência |

---

## 🟠 Código Pausado — Frontend Site

### Agência (Desabilitado)
| Rota | Status | Alteração |
|------|--------|-----------|
| `/agencia/pacotes` | 🔴 Visível mas marcado "[PAUSADO]" | Menu diz "Meus Pacotes (em pausa)" |
| `/agencia/pacote/new` | 🔴 Visível mas marcado "[PAUSADO]" | Menu diz "Novo Pacote (em pausa)" |
| `/agencia/pacote/[id]` | 🔴 Página existe mas não acessível | Navegar para `/agencia/pacotes` não carrega |
| Arquivo: `apps/site/src/app/agencia/layout.tsx` | ✏️ Atualizado | Seção "PACOTES [PAUSADO]" agora deixa claro |

### Dashboard (Criadores)
| Rota | Status | Detalhes |
|------|--------|----------|
| `/dashboard/*` | ✅ Ativo | Focado em roteiros — sem menção a pacotes |
| Arquivo: `apps/site/src/app/dashboard/layout.tsx` | ✅ Correto | Comentário: "roteiros-first model" |

### Admin
| Rota | Status | Detalhes |
|------|--------|----------|
| `/admin/roteiros` | ✅ Ativo | Moderação de roteiros |
| `/admin/roteiristas` | ✅ Ativo | Gestão de criadores |
| `/admin/pacotes` | ⚠️ Existe | Para admin gerenciar pacotes legados, mas não é foco |

---

## 🟡 Código Pausado — Mobile App

### Navegação
| Aba | Status | Alteração |
|-----|--------|-----------|
| `/itineraries` (Roteiros) | ✅ Ativa | Principal — funcionalidade ativa |
| `/packages` (Pacotes) | 🔴 Oculta | `href: null` — comentário atualizado para "[PAUSADO]" |

**Arquivo:** `apps/mobile/app/(tabs)/_layout.tsx`
```tsx
<Tabs.Screen
    name="packages"
    options={{
        href: null, // [PAUSADO] Funcionalidade de pacotes foi pausada - foco exclusivo em roteiros
        title: 'Pacotes',
        ...
    }}
/>
```

---

## 📚 Documentação Atualizada

### CLAUDE.md
- ✏️ **Linha 14:** Descrição do app removeu "busca pacotes"
- ✏️ **Linha 71:** Bug de endpoint de pacotes marcado como "[PAUSADO]"
- ✏️ **Linhas 84-85:** Bugs de pacotes marcados como "[PAUSADO]"
- ✏️ **Linhas 189-241:** Seção inteira marcada com aviso: `⚠️ NÃO MODIFICAR — Funcionalidade pausada`

### README.md (Raiz)
- ✏️ **Descrição:** Removeu menção a agências, focou em criadores
- ✏️ **Status:** Adicionado banner `📌 Status MVP: Foco exclusivo em Roteiros`
- ✏️ **Funcionalidades:** Seção "Concluído" agora lista apenas roteiros
- ✏️ **Nova seção:** "⏸️ Pausado" lista funcionalidades postas em pausa
- ✏️ **Próximos passos:** Removeu pacotes, focou em roteiros e pagamentos

### STATUS_PROJETO.md
- ✏️ **Header:** Atualizado para Abril 2026 com foco em roteiros
- ✏️ **Aviso:** Adicionado banner "Mudança de Escopo (Abril 2026)"

---

## 🔐 Como Tratar Código Pausado

### ✅ Seguro Manter
- Não deletar schemas, rotas ou componentes — pode ser útil no futuro
- Rotas pausadas continuam respondendo se alguém fizer request
- Componentes não renderizados não causam problema

### ⚠️ Evitar
- **Não** expandir funcionalidade de pacotes sem aprovação
- **Não** criar novos endpoints de pacotes
- **Não** adicionar campos ao schema de pacotes
- **Não** investir tempo melhorando performance de pacotes

### 🔄 Se Precisar Reativar Roteiristas Que Vendem Pacotes
1. Documentar com [@Diego](?) a decisão de reativar
2. Buscar em git log os commits antigos: `git log --oneline --grep="package"`
3. Reativar menu em `apps/site/src/app/agencia/layout.tsx`
4. Remover `href: null` de `apps/mobile/app/(tabs)/_layout.tsx`
5. Testar flows completos (criar pacote → listar → ver detalhes)

---

## 📋 Checklist Para Futuro Dev

Se futuramente precisar voltar a trabalhar com pacotes:

- [ ] Verificar se schema e rotas ainda compilam (`npx tsc --noEmit`)
- [ ] Testar endpoints manualmente (`curl` ou Postman)
- [ ] Revisar design system — componentes do pacote podem estar desatualizados
- [ ] Unificar UI de pacotes com nova identidade de roteiros
- [ ] Revisar pricing: pacotes têm `price`, roteiros têm `price` também

---

*Documento gerado em 11/04/2026 — Reflete reescopo de MVP para roteiros exclusivamente*
