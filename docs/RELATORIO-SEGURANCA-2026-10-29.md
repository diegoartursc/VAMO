# Relatório de segurança — VAMO (correção e reauditoria, 28–29/10/2026)

> Resumo executivo do prompt de segurança, do que foi executado e do que falta para publicar.
> Relatório técnico completo (arquivos, linhas, testes): [SEGURANCA-POS-CORRECAO-2026-10-28.md](SEGURANCA-POS-CORRECAO-2026-10-28.md).
> Prompt: [PROMPT-CLAUDE-CORRECAO-SEGURANCA-2026-10-28.md](PROMPT-CLAUDE-CORRECAO-SEGURANCA-2026-10-28.md) · Análise original: [ANALISE-SEGURANCA-2026-10-28.md](ANALISE-SEGURANCA-2026-10-28.md).
> Versão visual (abrir no navegador): [RELATORIO-SEGURANCA-2026-10-29.html](RELATORIO-SEGURANCA-2026-10-29.html).

- **Branch:** `security-fixes-2026-10-28` (base `4bc6f9e` → último commit de código `0760ec2`)
- **Executor:** Claude Opus 5.5 + revisor independente
- **Situação em 03/11/2026:** nada publicado. A `main` do GitHub continua em `4bc6f9e`; a Vercel e o Render rodam essa versão, sem as correções.

## Resumo

| Onde | Situação |
|---|---|
| Código local | **Aprovado nos testes.** Os 16 achados originais e os da revisão estão corrigidos e cobertos por testes, com as exceções parciais listadas abaixo. |
| Homologação | **Pendente.** Não há ambiente de teste separado; tudo foi validado com banco e Stripe simulados. |
| Produção | **Não publicado.** Publicar segue a Fase 6, com autorização do Diego a cada passo. |

Backend 138/138 testes · App 216/216 testes · TypeScript sem erro novo (backend, app, painel) · 3 migrations, todas aditivas · commits locais, sem push.

> **Ação urgente, independente desta branch:** o `JWT_SECRET` do `.env` local é igual ao valor de exemplo que esteve publicado no repositório, e o repositório no GitHub é **público**. Se o Render usar o mesmo valor, qualquer pessoa consegue forjar login de qualquer conta, inclusive admin. Gerar um segredo novo no Render e outro no `.env` local, e avaliar deixar o repositório privado.

## 1. Requisitos do prompt

O prompt partia da análise de 28/10 (16 achados, SEC-01 a SEC-16) e exigia:

- **Analisar:** confirmar cada achado e investigar 12 áreas pouco cobertas (permissão por rota, rotas novas, painel admin, CORS e limites, e-mails, campos protegidos, fluxo de aprovação, tokens no app, storage, segredos e logs, dependências, privacidade).
- **Corrigir:** antes de cada correção, um teste de ataque que falhe; depois, o mesmo teste passando junto com os fluxos legítimos.
- **Reauditar:** revisão independente tentando derrubar as correções; depois, publicação com autorização a cada passo.

### Regras de segurança do trabalho
- Boot automático desligado (`.claude/skip-boot`), para nenhum servidor local ligar no banco de produção.
- Testes só com banco e Stripe simulados; sem rede externa; sem ler valores do `.env`.
- Branch separada, commits locais, sem push nem deploy até a Fase 6.
- Migrations só aditivas, geradas offline; nada de `migrate dev`, seed ou reset.

### Decisões de produto definidas no prompt

| Tema | Decisão |
|---|---|
| Reembolso total | Perde o acesso ao conteúdo; a venda fica registrada como reembolsada |
| Reembolso parcial | Mantém o acesso |
| Disputa aberta | Mantém o acesso; repasse travado |
| Disputa perdida | Perde o acesso; reverte o repasse na proporção |
| Reembolso depois do repasse | Reverte a transferência na proporção; sem saldo, alerta o admin |
| Taxa da Stripe | Paga pela VAMO; o roteirista recebe 80% cheios |
| Prévia pública | Título, capa, descrição, preço, duração, módulos e contagens, resumo de custos. Dias, dicas, checklist, nomes, links e arquivos só para quem comprou |
| Troca do sistema de tokens | Pode exigir novo login de todos |

## 2. O que foi executado, por fase

| Fase | Tema | Testes de ataque (antes → depois) | O que foi feito |
|---|---|---|---|
| 0 | Análise | — | 16 achados confirmados no código, mais 8 novos. O mais grave: segredo JWT publicado num repositório público (NEW-08). Também: exclusão de conta que não fazia nada (NEW-01) e login sem limite próprio de tentativas. |
| 1 | Contas e admin | 3/21 → 23/23 | Tokens separados por finalidade; sessões revogáveis no servidor; logout e troca de senha derrubam tudo; `mock-admin-token` removido; erros assíncronos tratados; limite de login. |
| 2 | Conteúdo pago e documentos | 2/9 → 14/14 | Prévia pública sem conteúdo pago; comprovantes em armazenamento privado com link assinado; estatísticas de outro criador fechadas; truques de caminho em `/uploads` fechados. |
| 3 | Dinheiro | 1/13 → 15/15 | Estorno, disputa e reversão conciliados pelo webhook; reembolso parcial correto; valores da venda congelados no pagamento; fila de repasse que não trava. |
| 4 | Upload, dependências e confiança | 2/9 → 17/17 | Limites de upload sem estourar memória; Multer 2.5 e Express 4.22.3; destaque e selo de comprovante só pelo admin; exclusão de conta real; testes isolados da rede. |
| 5 | Reauditoria independente | 6 testes novos + 7 ampliados | Revisor com contexto novo reproduziu 6 falhas e confirmou outras por leitura. Todas corrigidas, com testes de regressão. |
| 6 | Publicação | pendente | Não iniciada. Checklist pronto; cada passo depende de autorização. |

## 3. Achados originais (SEC-01 a SEC-16)

| ID | Problema | O que foi feito | Status |
|---|---|---|---|
| SEC-01 | Token de arquivo/refresh servia como login | Chave, tipo e destino próprios por finalidade; tokens antigos invalidados | corrigido |
| SEC-02 | Conteúdo pago aberto na API pública | Prévia só com contagens e custos; conteúdo completo só para comprador ou dono | corrigido |
| SEC-03 | Comprovantes expostos | Removidos das respostas; uploads novos em armazenamento privado com link assinado de 30 min | código ok · migrar antigos |
| SEC-04 | Estatísticas de qualquer criador sem login | Exige login; criador vem só do token | corrigido |
| SEC-05 | Arquivos legados abertos por variação de caminho | Mesmo caminho canônico do servidor de arquivos, sem diferenciar maiúsculas | corrigido |
| SEC-06 | Atalhos de desenvolvimento ativos | Atalho de admin removido; webhook sempre assinado; compra demo só em teste; servidor recusa configuração insegura | corrigido |
| SEC-07 | Troca de senha não derrubava sessões | Sessões no banco; logout real; refresh rotativo com tolerância de 10 s; admin com versão de sessão | código ok · migration |
| SEC-08 | Upload podia estourar a memória | Recusa pelo tamanho antes de ler; arquivo temporário em disco; vagas e cota por conta; tempo máximo | corrigido |
| SEC-09 | Multer com falha conhecida | Multer 2.5.0; Express 4.22.3 (tira o aviso do `qs`) | corrigido |
| SEC-10 | Login admin malformado travava requisição | Validação de tipos; erros assíncronos encaminhados ao tratador | corrigido |
| SEC-11 | Estornos e disputas ignorados | Webhook com eventos idempotentes; política de acesso; reversão proporcional sobre o valor transferido | código ok · eventos na Stripe |
| SEC-12 | Estorno parcial tratado como total | Soma os valores e devolve só o restante; pendente conta como iniciado | corrigido |
| SEC-13 | Venda usava preço e comissão atuais | Valor, moeda, comissão e ganho congelados no pagamento | código ok · conciliar antigas |
| SEC-14 | Criador marcava destaque e aprovação | Destaque ignorado; status do comprovante recalculado pelo servidor, por item | corrigido |
| SEC-15 | Fila de repasse podia travar | Próxima tentativa agendada; bloqueio definitivo separado | corrigido |
| SEC-16 | Senha no hook versionado | Removida do arquivo; continua no histórico do repositório público | decidir repositório |

## 4. Achados novos (análise própria e revisão)

| ID | Gravidade | Achado | Status |
|---|---|---|---|
| NEW-08 | Crítica | Segredo JWT de exemplo publicado e usado no `.env` local; repositório público | **trocar o segredo** |
| NEW-01 | Alta | "Delete account" não fazia nada | exclusão real com senha |
| NEW-02 | Média | Login sem limite próprio de tentativas | por IP e por conta |
| NEW-04/05 | Baixa | Nota interna do admin exposta; `saleId` de compartilhamento sem dono | corrigido |
| R-M1/M2 | Alta | Reversão de repasse calculava valores errados | corrigido + teste |
| R-M3/M4 | Média | Evento atrasado de disputa; estorno antes da venda existir | corrigido + teste |
| R-T1/T2 | Média | Aprovação copiável entre itens; notas na prévia | corrigido + teste |
| R-U1–U3 | Média | Bloqueio de uploads por poucas contas; arquivo legado reaberto; maiúsculas | corrigido |
| R-A1 | Média | Duas abas renovando a sessão derrubavam o login | corrigido + teste |
| — | Média | Banco fora do ar virava "deslogado"; recompra apagava reversão; cota de comprovantes | corrigido |
| NEW-07 | Média | Tokens do app web e do admin em `localStorage`, sem CSP | registrado |

**Falha no próprio teste, encontrada e corrigida:** o cliente do Prisma carregava o `.env` real dentro dos testes. O bloqueio de rede impediu uma chamada ao Supabase, e não houve chamada real à Stripe nem envio de e-mail. O isolamento agora zera as chaves, bloqueia qualquer conexão externa e é verificado por teste próprio (`src/security/isolation.test.ts`).

## 5. Requisitos para publicar (o que falta)

### Depende do Diego
1. Gerar `JWT_SECRET` novo no Render e no `.env` local. Sem isso o backend local não sobe mais.
2. Decidir se o repositório do GitHub fica privado.
3. Na Stripe, acrescentar ao webhook: `charge.refunded`, `charge.dispute.created`, `charge.dispute.updated`, `charge.dispute.closed` e `transfer.reversed`.
4. No Render: `PUBLIC_BACKEND_URL`; conferir `STRIPE_WEBHOOK_SECRET` e `ALLOWED_ORIGINS`.
5. Autorizar a Fase 6, passo a passo.

### Trabalho técnico restante
- Migrar comprovantes antigos do bucket público (`scripts/migrate-proofs-to-private.ts`) e revogar os links.
- Conciliar vendas antigas com a Stripe (`scripts/reconcile-sales.ts`).
- Alerta ativo ao admin quando uma reversão falhar.
- Exclusão de conta: texto de avaliações e imagens de perfil no bucket público.
- `zod` 4 no backend e atualização do SDK do Expo (avisos do `npm audit` de baixo alcance).
- Segunda revisão independente depois das correções da Fase 5.

## 6. Publicação (Fase 6)

1. Backup do banco.
2. Variáveis novas no Render e na Vercel (o Diego cola; nenhum segredo no chat).
3. Merge da branch na `main`: o Render aplica 3 migrations aditivas e a Vercel publica. Todas as sessões caem e todos entram de novo.
4. Conferir `/health`, migrations e bundle novo na Vercel.
5. Testes seguros em produção com a conta do Diego, incluindo os ataques de antes sendo recusados.
6. Migração dos comprovantes: simulação, aplicação e revogação, cada uma com autorização.
7. Conciliação das vendas: simulação e aplicação.
8. Painéis: RLS das tabelas novas, 2FA nas contas, repositório privado.

Voltar o código para a versão anterior reabre todas as brechas. As migrations podem ficar no banco, porque são aditivas.

## 7. Como reproduzir a verificação

```bash
# Backend: 138 testes, banco e Stripe simulados, sem rede externa
cd apps/backend && npx tsx --import ./src/test/setup.ts --test 'src/**/*.test.ts'

# App: 216 testes
cd apps/mobile && npx tsx --test $(find src app -name "*.test.ts" -o -name "*.test.tsx")
```

Rodado de novo em 03/11/2026, já com a pasta renomeada para `Códigos`: backend 138/138, app 216/216.

Testes de segurança por fase: `apps/backend/src/security/*.test.ts` (cada arquivo traz no topo o comando para rodar sozinho).
