# Análise e Plano de Reorganização da Documentação — VAMO

> **Produzido em:** 28/03/2026
> **Objetivo:** Transformar a documentação atual (dispersa, com redundâncias e arquivos obsoletos) numa estrutura profissional, navegável e sustentável.

---

## 1. Inventário atual — o que existe hoje

### Raiz do projeto (`/`)
| Arquivo | Linhas | Situação |
|---------|--------|----------|
| `README.md` | 164 | Desatualizado — falta estrutura técnica real, seção de setup incorreta |

### Pasta `docs/` (raiz de documentação)
| Arquivo | Linhas | Situação |
|---------|--------|----------|
| `CLAUDE.md` | ~190 | ✅ Recém-criado — referência técnica principal |
| `STATUS_PROJETO.md` | 376 | ⚠️ Parcialmente desatualizado — escrito em jan/2026, bugs já corrigidos |
| `RESUMO_EXECUTIVO.md` | 217 | ⚠️ Conteúdo de produto/negócio misturado — serve para pitch, não para dev |
| `DESCRITIVO_COMPLETO.md` | 227 | ⚠️ Duplica o RESUMO_EXECUTIVO com outras palavras |
| `INCOERENCIAS_IDENTIFICADAS.md` | 303 | 🗑️ Histórico — inconsistências de jan/2026, a maioria já corrigida |
| `PROMPT_ANALISE_VAMO.md` | 65 | 🗑️ Template de prompt para IA — não é documentação de produto |
| `REGISTRATION_FIELDS_CHECKLIST.md` | 75 | ⚠️ Útil mas mal posicionado — pertence à pasta de produto/UX |
| `APP_FLOWCHART.md` | 105 | ✅ Útil — diagramas de fluxo do usuário em Mermaid |
| `ESTRATEGIA_INTEGRACAO_AGENCIAS.md` | 450 | ⚠️ Estratégia de negócio misturada com requisitos técnicos |

### `docs/backend/`
| Arquivo | Linhas | Situação |
|---------|--------|----------|
| `ARQUITETURA_BACKEND.md` | 837 | ⚠️ Muito detalhado mas desatualizado em vários pontos |
| `RESUMO_EXECUTIVO_BACKEND.md` | 332 | 🗑️ Duplica partes do ARQUITETURA_BACKEND.md |

### `docs/design/`
| Arquivo | Linhas | Situação |
|---------|--------|----------|
| `design_system.md` | 426 | ✅ Valioso — cores, tipografia, componentes do VAMO |

### `docs/changelog/`
| Arquivo | Linhas | Situação |
|---------|--------|----------|
| `2026-01-30_bug_fixes.md` | 200 | ⚠️ Útil mas deveria ter mais entradas — parou em janeiro |

### `docs/archive/`
| Arquivo | Linhas | Situação |
|---------|--------|----------|
| `DESCRITIVO_COMPLETO_VAMO.md` | 905 | 🗑️ Versão antiga do descritivo — superceded pelo atual |

### `docs/logs-de-prompts/` e `docs/logs_de_prompts/` (duas pastas!)
| Arquivo | Linhas | Situação |
|---------|--------|----------|
| `2026-W06.md` | — | 🗑️ Log de prompts internos — não é documentação de produto |
| `2026-W07.md` | — | 🗑️ Idem |
| `2026-W08.md` | — | 🗑️ Idem |
| `log_19_a_20_fev_2026.txt` | 50 | 🗑️ Idem (em outra pasta com nome diferente!) |
| `README.md` | — | 🗑️ Explica como usar os logs de prompt — meta-doc desnecessária |

### `apps/` (READMEs dentro dos apps)
| Arquivo | Linhas | Situação |
|---------|--------|----------|
| `apps/backend/README.md` | 70 | ⚠️ Quick start desatualizado — conflita com CLAUDE.md |
| `apps/backend/SETUP_GUIDE.md` | 147 | ⚠️ Boas informações mas sobreposição com README |
| `apps/mobile/src/services/README.md` | 45 | ⚠️ Descreve pasta `services/` — vale manter se atualizado |
| `apps/site/README.md` | 36 | 🗑️ README padrão gerado pelo Next.js, sem info sobre o VAMO |

---

## 2. Diagnóstico dos problemas

### Problema 1: Duplicação excessiva
Existem pelo menos **três versões do "o que é o VAMO"** espalhadas em arquivos diferentes: `DESCRITIVO_COMPLETO.md`, `RESUMO_EXECUTIVO.md`, e `docs/archive/DESCRITIVO_COMPLETO_VAMO.md`. Quem lê não sabe qual é a versão certa.

### Problema 2: Dois tipos de conteúdo misturados
Parte da documentação é **técnica** (como funciona o código, como rodar) e parte é **de produto/negócio** (o que é o VAMO, estratégia de agências, pitch). Esses dois mundos estão no mesmo nível de pasta, sem separação.

### Problema 3: Arquivos obsoletos não arquivados
`INCOERENCIAS_IDENTIFICADAS.md` lista problemas de janeiro de 2026. A maioria foi corrigida em março. O arquivo continua na pasta raiz como se ainda fosse atual — confunde qualquer dev que abrir o projeto.

### Problema 4: Logs de prompts de IA dentro da documentação do produto
As pastas `logs-de-prompts/` e `logs_de_prompts/` (note: duas pastas com nomes diferentes para a mesma finalidade!) guardam histórico de conversas com Claude. Isso **não é documentação** — é rascunho de trabalho. Não pertence ao repositório público ou à pasta `docs/`.

### Problema 5: README da raiz não reflete o projeto real
O `README.md` na raiz é o cartão de visita do projeto para qualquer pessoa que abrir o repositório. Atualmente está desatualizado: não explica a estrutura de monorepo, não lista os pré-requisitos corretos, não tem os comandos certos.

### Problema 6: Changelog abandonado
Existe um arquivo `docs/changelog/2026-01-30_bug_fixes.md` — boa iniciativa — mas parou em janeiro. A sessão de hoje corrigiu 17 bugs e nada foi registrado.

### Problema 7: Modelo de referência da UI não estava documentado
A página de detalhe de pacote (`apps/mobile/app/package/[id].tsx`) com o pacote *Paris Romântica* (`pkg-1`) como dados de referência é o **padrão oficial de layout** do app — mas isso não estava escrito em lugar nenhum. Qualquer desenvolvedor novo ou IA poderia alterar essa tela sem saber que ela é o modelo que todos os outros 10 pacotes seguem. Isso foi corrigido: a seção "Modelos de referência de UI" foi adicionada ao `docs/CLAUDE.md`.

---

## 3. O que fazer com cada arquivo

### 🗑️ DELETAR (ou mover para fora do repo)

| Arquivo | Motivo |
|---------|--------|
| `docs/INCOERENCIAS_IDENTIFICADAS.md` | Histórico obsoleto — problemas já resolvidos em março/2026 |
| `docs/PROMPT_ANALISE_VAMO.md` | Template de prompt para IA, não é doc de produto |
| `docs/archive/DESCRITIVO_COMPLETO_VAMO.md` | Versão antiga (905 linhas) — superceded pelo atual |
| `docs/logs-de-prompts/` (pasta inteira) | Logs de conversa com Claude — não é documentação |
| `docs/logs_de_prompts/` (pasta inteira) | Duplicata com nome diferente da anterior |
| `docs/backend/RESUMO_EXECUTIVO_BACKEND.md` | Duplica o conteúdo de `ARQUITETURA_BACKEND.md` |
| `apps/site/README.md` | Boilerplate Next.js sem informação do VAMO |

### 🔀 MESCLAR (combinar dois arquivos em um)

| De | Para | Como |
|----|------|------|
| `docs/RESUMO_EXECUTIVO.md` + `docs/DESCRITIVO_COMPLETO.md` | `docs/product/PRODUTO.md` | Unir em um único documento de produto: o que é o VAMO, público-alvo, proposta de valor, funcionalidades principais |
| `apps/backend/README.md` + `apps/backend/SETUP_GUIDE.md` | `apps/backend/README.md` | O SETUP_GUIDE tem informações boas — absorver no README do backend e deletar SETUP_GUIDE |

### ✏️ ATUALIZAR (manter mas reescrever/complementar)

| Arquivo | O que precisa mudar |
|---------|---------------------|
| `README.md` (raiz) | Reescrever do zero: estrutura monorepo, pré-requisitos, comandos de setup, links para a doc técnica |
| `docs/STATUS_PROJETO.md` | Atualizar status dos bugs corrigidos em março; remover itens que já estão no CLAUDE.md |
| `docs/ESTRATEGIA_INTEGRACAO_AGENCIAS.md` | Separar em duas partes: estratégia de negócio → `docs/product/` e requisitos técnicos → `docs/backend/` |
| `docs/backend/ARQUITETURA_BACKEND.md` | Atualizar para refletir as correções de março (singleton Prisma, authMiddleware, ownership validation) |
| `docs/APP_FLOWCHART.md` | Mover para `docs/product/` — é um diagrama de UX/jornada do usuário |
| `docs/REGISTRATION_FIELDS_CHECKLIST.md` | Mover para `docs/product/` — é requisito de produto, não técnico |

### ✅ MANTER como está

| Arquivo | Motivo |
|---------|--------|
| `docs/CLAUDE.md` | Referência técnica principal — recém-criada e atualizada |
| `docs/design/design_system.md` | Design system completo — muito valioso, bem organizado |
| `docs/changelog/2026-01-30_bug_fixes.md` | Manter e adicionar nova entrada para março/2026 |
| `apps/mobile/src/services/README.md` | Documentação localizada útil — manter perto do código |

### 🆕 CRIAR (novos arquivos necessários)

| Arquivo | Conteúdo |
|---------|----------|
| `docs/ROADMAP.md` | O que vem a seguir: autenticação de viajante, pagamentos, testes — baseado na fila de prioridades |
| `docs/changelog/2026-03-28_bug_fixes.md` | Registro dos 15 bugs corrigidos nesta sessão |
| `CONTRIBUTING.md` (raiz) | Como contribuir: padrões de código, como criar branch, como rodar testes |

---

## 4. Nova estrutura de pastas proposta

```
VAMO/
├── README.md                          ← Reescrever: visão geral + como rodar
├── CONTRIBUTING.md                    ← CRIAR: guia de contribuição
│
├── docs/
│   ├── CLAUDE.md                      ← Referência técnica principal (já existe, atualizado)
│   ├── ROADMAP.md                     ← CRIAR: próximas funcionalidades
│   │
│   ├── product/                       ← NOVA PASTA: tudo sobre o produto
│   │   ├── PRODUTO.md                 ← CRIAR: merge de RESUMO_EXECUTIVO + DESCRITIVO_COMPLETO
│   │   ├── APP_FLOWCHART.md           ← Mover de docs/
│   │   ├── REGISTRATION_FIELDS.md    ← Renomear e mover de docs/
│   │   └── ESTRATEGIA_AGENCIAS.md    ← Parte de negócio de ESTRATEGIA_INTEGRACAO
│   │
│   ├── backend/
│   │   ├── ARQUITETURA.md             ← Renomear de ARQUITETURA_BACKEND.md (atualizado)
│   │   └── REQUISITOS_AGENCIAS.md    ← Parte técnica de ESTRATEGIA_INTEGRACAO
│   │
│   ├── design/
│   │   └── design_system.md           ← Manter como está
│   │
│   ├── changelog/
│   │   ├── 2026-01-30_bug_fixes.md    ← Manter
│   │   └── 2026-03-28_bug_fixes.md    ← CRIAR
│   │
│   └── archive/                       ← Apenas para referência histórica, nunca consultado no dia a dia
│       └── STATUS_2026-01.md          ← Versão histórica do status de janeiro
│
└── apps/
    ├── backend/
    │   ├── README.md                  ← Reescrever (absorver SETUP_GUIDE)
    │   └── (deletar SETUP_GUIDE.md)
    ├── mobile/
    │   └── src/services/README.md     ← Manter
    └── site/
        └── (deletar README.md padrão do Next.js)
```

---

## 5. Ordem de execução recomendada

A reorganização pode ser feita em 3 sessões curtas:

**Sessão A — Limpeza (30 min)**
1. Deletar: `INCOERENCIAS_IDENTIFICADAS.md`, `PROMPT_ANALISE_VAMO.md`, `archive/DESCRITIVO_COMPLETO_VAMO.md`, pasta `logs-de-prompts/`, pasta `logs_de_prompts/`, `backend/RESUMO_EXECUTIVO_BACKEND.md`, `apps/site/README.md`
2. Criar pasta `docs/product/`
3. Mover: `APP_FLOWCHART.md` e `REGISTRATION_FIELDS_CHECKLIST.md` para `docs/product/`

**Sessão B — Consolidação (1h)**
1. Criar `docs/product/PRODUTO.md` (merge de RESUMO_EXECUTIVO + DESCRITIVO_COMPLETO)
2. Separar `ESTRATEGIA_INTEGRACAO_AGENCIAS.md` em duas partes
3. Reescrever `README.md` da raiz
4. Mesclar `apps/backend/SETUP_GUIDE.md` no `apps/backend/README.md`

**Sessão C — Criação (45 min)**
1. Criar `CONTRIBUTING.md`
2. Criar `docs/ROADMAP.md`
3. Criar `docs/changelog/2026-03-28_bug_fixes.md`
4. Atualizar `docs/backend/ARQUITETURA_BACKEND.md` com as correções de março

---

## 6. Tamanho estimado ao final

| Antes | Depois |
|-------|--------|
| ~25 arquivos de doc | ~16 arquivos de doc |
| ~4.500 linhas totais | ~3.000 linhas (sem duplicatas) |
| 2 pastas de logs misturadas na doc | 0 (removidas) |
| 0 pastas por tipo de conteúdo | 3 pastas claras: `product/`, `backend/`, `design/` |

---

*Análise produzida pelo Claude — 28/03/2026*
