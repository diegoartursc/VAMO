# 📚 Documentação VAMO

Índice navegável da documentação do projeto.
Foco atual: **app mobile** (React Native + Expo) e API backend.
O site web foi removido em maio/2026 — será reconstruído quando o app estiver maduro.

---

## 🟢 Documentos ativos (leitura recomendada)

| Documento | O que tem |
|---|---|
| [PRODUTO.md](./PRODUTO.md) | Visão completa do produto, princípios e funcionalidades |
| [STATUS.md](./STATUS.md) | Estado atual do desenvolvimento — atualizado periodicamente |
| [architecture/backend.md](./architecture/backend.md) | Arquitetura do backend Node.js + Express + Prisma |
| [architecture/backend-resumo.md](./architecture/backend-resumo.md) | Resumo executivo do backend |
| [architecture/app-flowchart.md](./architecture/app-flowchart.md) | Fluxogramas de jornada do usuário (Mermaid) |
| [design/design-system.md](./design/design-system.md) | Sistema de design extraído de `apps/mobile/src/theme/theme.ts` |
| [design/master.md](./design/master.md) | Regras-mestre do design system (overrides) |

> Para instruções de uso do Claude Code neste projeto, ver [`/CLAUDE.md`](../CLAUDE.md) na raiz.

---

## 📜 Changelog (em ordem cronológica)

| Data | Arquivo |
|---|---|
| 30/01/2026 | [2026-01-30_bug_fixes.md](./changelog/2026-01-30_bug_fixes.md) |
| 28/03/2026 | [2026-03-28_bug_fixes.md](./changelog/2026-03-28_bug_fixes.md) |
| 11/04/2026 | [2026-04-11_bug_fixes.md](./changelog/2026-04-11_bug_fixes.md) |

Novos relatórios de fix devem entrar aqui com formato `AAAA-MM-DD_<contexto>.md`.

---

## 💬 Logs de prompts (autoria humana)

`docs/prompts/` guarda registros semanais dos prompts do desenvolvedor.
Comprovação de que decisões/direções foram humanas.

| Período | Arquivo |
|---|---|
| Fevereiro 2026 (legado) | [2026-02_legacy.txt](./prompts/2026-02_legacy.txt) |
| Semana 06 (2026) | [2026-W06.md](./prompts/2026-W06.md) |
| Semana 07 (2026) | [2026-W07.md](./prompts/2026-W07.md) |
| Semana 08 (2026) | [2026-W08.md](./prompts/2026-W08.md) |
| Feature dedicada — Avaliações de Roteiros | [FEATURE_AVALIACOES_ROTEIROS.md](./prompts/FEATURE_AVALIACOES_ROTEIROS.md) |

Convenção: nome `AAAA-Www.md` (ISO week).

---

## 🗄️ Arquivo (referência histórica, não consultar como verdade)

Estes documentos foram preservados por valor histórico mas **não refletem o estado atual** do produto. A maioria menciona o site web ou as funcionalidades de agências, que foram removidos/pausados.

| Arquivo | Por quê está no archive |
|---|---|
| `DESCRITIVO_v0_905-linhas.md` | Versão antiga (v0) do descritivo de produto |
| `DESCRITIVO_COMPLETO_2026-03.md` | Versão intermediária — substituída por `PRODUTO.md` |
| `RESUMO_EXECUTIVO_pitch_2026.md` | Pitch externo — referencia agências (pausadas) |
| `PAUSADAS_FUNCIONALIDADES_2026-04.md` | Lista do que foi pausado em abr/2026 |
| `ESTRATEGIA_AGENCIAS_pausado.md` | Plano de integração com agências — pausado |
| `MODELO_REFERENCIA_paris_pausado.md` | Pacote "Paris Romântica" — modelo do mundo de agências |
| `REGISTRATION_FIELDS_dashboard_legacy.md` | Campos do dashboard do site (site removido) |
| `ANALISE_DOCUMENTACAO_2026-03.md` | Meta-doc — proposta de reorganização não-executada |
| `INCOERENCIAS_2026-01.md` | Auditoria pontual de contradições antigas |
| `PROMPT_ANALISE_template.md` | Template de prompt colaborativo |

---

## ⚠️ Pendências de conteúdo

Vários docs ativos (PRODUTO, STATUS, architecture/, design/) ainda contêm
referências a **agências**, **site/dashboard** ou **marketplace híbrido** — vestígios
da versão pré-reescopo. Pendente: passada de revisão removendo essas menções
e mantendo só o foco atual (criadores + app).
