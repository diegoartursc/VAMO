# Tasks para finalizar e lançar o VAMO

> Nosso norte na reta final. Ordenado por **prioridade** (definida pelo Diego em 2026-09-24).
> Marque `[x]` ao concluir. Última atualização: 2026-10-22.
>
> **Mudanças desde a primeira versão:** o mercado-alvo passou a ser **EUA / USD** (2026-10-15, fonte única em `packages/shared/itinerary/market.ts`), o banco foi zerado para dados reais (2026-09-29) e a conta Stripe de produção passa a ser da sócia, aberta com a LLC dela nos EUA (2026-10-22). Onde este arquivo ainda fala em AUD, "en-AU" ou ABN, leia como USD / inglês dos EUA: a revisão completa dos textos ainda está pendente (task 9).

**Legenda:**
- **Esforço:** ⚡ minutos · 🟢 horas · 🟡 1–3 dias · 🔴 1+ semana.
- **Quem faz:** 👤 Diego · 🤖 Claude · 👥 os dois.

## 🚨 Vulnerabilidades de dependências: 38 → 13 (2026-10-27)

Corrigidas em 2026-10-27, com `npm audit fix`, Nodemailer 10.2.1 e Next.js 16.4.3, e validadas com instalação limpa e build do app, do backend e do site (como Vercel e Render fazem). **Críticas: 0. Altas do backend: só o Zod.**

**O que ainda aparece no `npm audit` (13):**
| Pacote | Gravidade | Por que sobrou | Plano |
|---|---|---|---|
| `expo`, `@expo/cli`, `expo-router`, `postcss`, `node-forge`, `@expo/metro-config`, `decode-uri-component`, `query-string`, `esbuild` | alta/moderada/baixa | Ferramentas de **build do Expo** (não rodam em produção). A correção exige subir o Expo SDK inteiro (breaking). | Migração planejada do Expo SDK (🤖, 1 a 2 dias + teste em celular). Não bloqueia o lançamento. |
| `zod` (backend) | alta | DoS com coleções enormes. A correção é a versão 4 (breaking). O corpo das requisições já tem limite de tamanho. | Migrar schemas do Zod 3 → 4 (🤖, algumas horas). |
| `image-size`, `qs`, `@expo/code-signing-certificates` | alta/moderada | Dependências transitivas sem correção compatível ainda. | O Dependabot abre o PR assim que sair a versão corrigida. |

- [x] 🤖 Dependências corrigidas e validadas em instalação limpa (2026-10-27). Cuidado aprendido: `npm audit fix --legacy-peer-deps` removeu o peer `expo-font`, e o build do app quebrou; ele foi fixado no `apps/mobile/package.json`.
- [x] 🤖 Dependabot ligado (`.github/dependabot.yml`, semanal, agrupando patch e minor).
- [ ] 🤖 Migração do Zod 3 → 4.
- [ ] 🤖 Migração do Expo SDK (resolve a maior parte do que resta).

## 🎯 FASE FINAL (definida em 2026-10-26): Connect em produção → auditorias → publicação

Ordem de execução. Cada bloco só começa quando o anterior tem o essencial pronto. Legenda: 👤 Diego/sócia · 🤖 Claude · 👥 os dois.

### A. Stripe Connect em produção, com a comissão funcionando · 🔴 · 👥

**Estado atual no código (verificado em 2026-10-26):**
- Já existe: rota de onboarding Express (`POST /api/creators/me/stripe/onboarding-link`) e consulta de status (`apps/backend/src/routes/creators.ts`).
- Não existe o dinheiro andando: o checkout é cobrança simples na conta da plataforma (sem `application_fee` nem transferência ao roteirista). A comissão é só um número gravado na venda, agora **20% VAMO / 80% roteirista** (decidido pelo Diego em 2026-10-27, lido de `commission.ts` em `payments.ts` e `itineraries.ts`). Vendas antigas já gravadas seguem com 15%.
- A tela de ganhos mostra estimativa (`payoutAccountStatus` fixo em `not_started`); reembolso não desfaz repasse; o vínculo roteirista↔conta Connect fica só na *metadata* da Stripe (sem coluna no banco); não há webhooks de Connect.

**Decisões que dependem de vocês (👤):**
- [x] Comissão final: **20% VAMO / 80% roteirista** (decidido em 2026-10-27, já no código, nos Termos do Criador, no app e no site). Pendente: quem paga a taxa da Stripe (a plataforma, o roteirista ou dividida)?
- [ ] Quando o roteirista recebe: **recomendação** → cobrar na plataforma e **transferir após a janela de reembolso (7 dias)**, o mesmo prazo da Política de Reembolso. Evita ter de reverter repasse. A alternativa (cobrança direta com `transfer_data`) paga na hora, mas exige conta do roteirista já ativa e complica reembolso.
- [ ] Roteirista fora dos EUA: a Stripe só permite repasse automático entre países limitados. Definir se o piloto é só EUA ou se fora dos EUA o repasse segue manual (relatório "a pagar" no admin).
- [ ] Contador: tributação do repasse e declarações americanas (a Stripe Connect Express emite 1099 para roteiristas dos EUA).

**Passos técnicos (🤖 depois das decisões):**
- [ ] 👤 Ativar a conta Stripe da LLC (dados da empresa, banco, documentos) e **habilitar o Connect** em Settings → Connect (sem isso a API responde `connect_not_enabled`).
- [ ] 🤖 Migration aditiva: `Creator.stripeAccountId` + status de recebimento (substitui a busca por metadata).
- [x] 🤖 Comissão em **um só lugar** (`packages/shared/itinerary/commission.ts`, 2026-10-27): pagamento, e-mails, página de recebimento e Help leem de lá. Valor atual **20%**. Mudar de novo = editar 1 número (e o prazo `PAYOUT_HOLD_DAYS`). Falta a tela de ganhos e o admin usarem a mesma função.
- [ ] 🤖 Fluxo de dinheiro: cobrança na plataforma + transferência ao roteirista após 7 dias (job agendado e idempotente), ou `application_fee` + `transfer_data` se a decisão for pagar na hora.
- [ ] 🤖 Reembolso desfaz o repasse (antes do pagamento: cancela a transferência; depois: `reverse_transfer`). Roteirista sem conta ativa: saldo fica retido e vira repasse quando ele concluir o cadastro.
- [ ] 🤖 Webhooks de Connect no endpoint de produção: `account.updated`, `transfer.created/failed/reversed`, `payout.failed`, `charge.refunded`, `charge.dispute.created`.
- [ ] 🤖 Tela de ganhos do roteirista com dados reais (disponível, a liberar, pago, histórico) e relatório no admin; remover o mock.
- [ ] 🤖 Testes automatizados com a Stripe em modo teste (conta Connect de teste): compra → comissão → transferência → reembolso.
- [ ] 👥 Teste real de ponta a ponta no modo teste com 2 contas (viajante e roteirista), depois a **troca para chaves `sk_live_`/`whsec_` de produção**, compra real de baixo valor, reembolso e conferência do saldo.

### B. Auditoria de funcionamento (QA completo) · 🟡 · 👥
- [ ] 🤖 Roteiro de testes ponta a ponta em produção: cadastro, login, recuperar senha pelo link, busca e filtros, compra com cartão, e-mail de compra, Meus Roteiros, roteiro comprado (Original / Minha versão / PDF), avaliação, pergunta e resposta, favoritos, carrinho.
- [ ] 🤖 Fluxo do roteirista: tornar-se roteirista, criar roteiro (com módulos desativados), enviar, admin aprova, venda, e-mail de venda, ganhos, pausar/arquivar.
- [ ] 🤖 Fluxo do admin: aprovar/reprovar roteiro e roteirista, financeiro, conversão de moedas, histórico.
- [ ] 🤖 Os 13 e-mails em produção, conferindo texto, links e caixa de spam.
- [ ] 🤖 Celular real (iOS Safari e Android Chrome) e desktop; conexão lenta; app depois de ficar parado.
- [ ] 🤖 Corrigir o roteiro da Califórnia (15 dias vazios) e impedir aprovação de roteiro sem conteúdo nos módulos ativos.
- [x] 🤖 Alerta de queda (2026-10-27): GitHub Actions `uptime.yml` testa `/health`, a API e o app a cada 15 min e o GitHub avisa por e-mail se falhar. `render.yaml` já declara `healthCheckPath: /health`.
- [ ] 👤 Preencher **Health Check Path = `/health`** no painel do Render (Settings → Health Checks): o painel é a fonte da verdade.
- [ ] 🤖 Monitoramento de erros (Sentry ou similar): precisa de uma conta e da chave (DSN).
- [ ] 👤 Teste com 3 a 5 pessoas reais (americanas, de preferência) e lista de bloqueadores.

### C. Auditoria de segurança · 🔴 · 🤖 (👤 nas chaves)
Base: [AUDITORIA-SEGURANCA-2026-10-15.md](AUDITORIA-SEGURANCA-2026-10-15.md) (achados ainda a conferir) + as 6 vulnerabilidades do topo.
- [x] 🤖 Dependências corrigidas (raiz, backend, site e mobile) e Dependabot ligado (2026-10-27). Restam Zod e Expo (seção acima). Multer ainda a conferir.
- [x] 🤖 Pagamentos (2026-10-27): checkout idempotente (mesma sessão para duplo clique, janela de 30 min), segundo pagamento do mesmo roteiro estornado automaticamente com e-mail, estorno que falha faz o webhook responder 500 para a Stripe tentar de novo. Testes novos. Falta: deduplicar eventos do webhook por ID e fila persistente de estornos.
- [ ] 🤖 Rodar de novo a auditoria da lista de 15/10 e marcar o que já foi resolvido.
- [ ] 🤖 Autorização por rota: um usuário nunca acessa roteiro, venda, ganhos ou arquivos de outro; rotas de admin protegidas; token do Trip Center e uploads privados.
- [ ] 🤖 CORS (`ALLOWED_ORIGINS`), limites de requisição, cabeçalhos de segurança, validação de uploads, logs sem dados pessoais nem tokens.
- [ ] 🤖 Supabase: RLS ligado em todas as tabelas, bucket de uploads, backup diário (Pro) e restauração testada.
- [ ] 👤 Rotacionar segredos antes de produção: chave do Supabase que passou pelo chat, senha de app do Gmail, `JWT_SECRET`; chaves Stripe com permissões mínimas (restricted key) quando possível.
- [ ] 👤 Ativar 2FA na Stripe, Render, Vercel, Supabase, GitHub e Gmail do projeto.

### D. Subir nas plataformas · 🟡 · 👥
- [ ] 🤖 Pré-requisitos: A concluído, B e C sem bloqueadores, backup do banco logo antes.
- [ ] 👤 Domínio próprio (task 6) e atualizar `APP_BASE_URL`, `ALLOWED_ORIGINS`, webhook e links dos e-mails.
- [ ] 👤 Variáveis de produção conferidas no Render e nas Vercels (`vamo`, `vamo-admin`): chaves live, SMTP, `ADMIN_APP_URL`, URL da API.
- [ ] 🤖 Publicar a `main` (Render e Vercel) e conferir `/health`, compra real de teste, webhook 200 e e-mail.
- [ ] 👥 Decidir App Store e Google Play (task 11): a Apple e o Google exigem pagamento deles para conteúdo digital dentro do app.
- [ ] 👥 Acompanhar as primeiras vendas por 48 horas (Stripe, e-mails, repasses).

### E. Avaliações nos roteiros · 🟡 · 🤖
Hoje: só quem comprou avalia (1 por roteiro), com fotos; não há nenhuma avaliação real, então "Destaque" (nota ≥ 4,5 e ≥ 1 avaliação) fica vazio.
- [ ] 🤖 Testar o fluxo inteiro em produção: avaliar, editar, nota média e contagem no card e na página, foto, resposta do criador.
- [x] 🤖 **E-mail de convite para avaliar** (2026-10-27): 3 dias depois da compra + 1 lembrete 7 dias depois, só para quem não avaliou, só compras dos últimos 60 dias, sem repetir mesmo com reinício do servidor (roda de 6 em 6 horas em produção; desligável com `REVIEW_REQUESTS_ENABLED=false`).
- [x] 🤖 Moderação (2026-10-27): botão de denunciar na avaliação (5 motivos, 1 por pessoa), e-mail ao admin e tela **Avaliações** no painel admin para esconder ou restaurar. Esconder não apaga, tira da página e da nota média e recalcula.
- [ ] 🤖 Resposta pública do roteirista à avaliação (e e-mail ao viajante).
- [ ] 👤 Conseguir as primeiras avaliações reais (convidar compradores do piloto, sem incentivo que fira as regras da Stripe/FTC: avaliações compradas ou incentivadas precisam ser divulgadas).
- [ ] 🤖 Rever as regras de Destaque e do selo "Novo" quando houver avaliações.

### F. Orientar os novos roteiristas sobre saque e finanças · 🟡 · 👥
- [x] 🤖 (2026-10-27) Passo "Get paid" no `become-creator` e página **How you get paid** (Central do Roteirista → Settings), que lê comissão e prazo do arquivo único. Explica: **comissão (X%)**, **como e quando recebe** (após 7 dias da compra, via Stripe), cadastro de banco e identidade, **reembolso desfaz o ganho**, taxas, valor mínimo, moeda (USD), prazos de saque.
- [ ] 🤖 Impostos: roteirista dos EUA preenche o formulário fiscal no cadastro da Stripe (W-9) e recebe 1099 quando aplicável; fora dos EUA, outro formulário. Texto aprovado pelo contador.
- [x] 🤖 O e-mail de roteirista aprovado agora traz o resumo de como recebe e o link da página. Falta o atalho "Configurar recebimentos" enquanto a conta não estiver ativa (depende do Connect).
- [x] 🤖 Perguntas frequentes no Help: quanto ganho, quando recebo, saldo retido, reembolso e impostos.
- [ ] 🤖 Atualizar os Termos do Criador (`packages/shared/legal`) com a comissão final, o prazo de repasse e o tratamento de reembolso e disputa.
- [ ] 👤 Definir quem responde dúvidas financeiras dos roteiristas (e-mail de suporte) e o prazo de resposta.

## Resumo

| # | Task | Status |
|---|---|---|
| 1 | E-mails automáticos | ✅ 13 e-mails no ar e entregues em produção (caixa de entrada); pendentes: central no app e validação com Stripe em modo real |
| 2 | "Esqueci minha senha" | 🟡 no ar e o e-mail chega; falta testar a troca de senha pelo link em produção |
| 3 | Migrations automáticas no deploy | ✅ concluída |
| 4 | Render pago + Supabase Pro | 🟡 Render Starter ✅; falta o Supabase Pro |
| 0 | Vulnerabilidades de dependências | 🟡 38 → 13; críticas 0; sobra ferramenta de build do Expo e o Zod (ver seção) |
| A | 🎯 Stripe Connect em produção com comissão | 🔴 só o onboarding existe; falta o fluxo de dinheiro, comissão única, reembolso e ganhos reais |
| B | 🎯 Auditoria de funcionamento (QA) | ⬜ |
| C | 🎯 Auditoria de segurança | 🟡 dependências e pagamentos feitos; faltam autorização por rota, RLS, segredos e 2FA |
| D | 🎯 Subir nas plataformas | ⬜ depende de A, B e C |
| E | 🎯 Avaliações nos roteiros | 🟡 convite por e-mail, denúncia e moderação feitos; faltam resposta do roteirista e as primeiras avaliações |
| F | 🎯 Orientação financeira dos roteiristas | 🟡 página "How you get paid", FAQ e e-mail feitos; falta fechar comissão e prazo e a revisão do contador |
| 5 | Stripe em produção + repasse aos roteiristas | 🟡 conta da sócia (LLC nos EUA) aberta; webhook de teste criado; falta colar as chaves no Render e testar a compra |
| 6 | Domínio próprio | ⬜ |
| 7 | Termos, privacidade, reembolso e termos dos roteiristas | 🟡 rascunhos em inglês escritos e publicados no app e no site; falta revisão de advogado, dados da LLC e aceite no cadastro |
| 8 | Catálogo inicial (~15 roteiros) | ⬜ 3 ativos hoje |
| 9 | Tradução completa para inglês americano | 🟡 app, backend (e-mails/erros) e textos compartilhados traduzidos; falta painel admin, editor web do criador e área de agências do `apps/site` |
| 10 | QA geral de pré-lançamento | ⬜ |
| 11 | Apple App Store e Google Play | ⬜ |
| 12 | Lançamento | ⬜ |

## Últimas ações (mais recentes primeiro)

| Data | O que foi feito | Commit |
|---|---|---|
| 2026-10-27 | **Segurança, avaliações e recebimento:** 38 → 13 vulnerabilidades; checkout idempotente e estorno de pagamento duplicado/falho; Dependabot e alerta de queda; convite e moderação de avaliações (migration aditiva); aceite dos termos no cadastro; comissão em um arquivo; página "How you get paid". | — |
| 2026-10-22 | **Correção de validação de roteiro:** módulo desativado não gera mais pendência nem bloqueia o envio (dias do itinerário e links); validação do app e do backend alinhadas, com 14 testes novos. Causa do roteiro da Califórnia ter 15 dias vazios. | — |
| 2026-10-22 | **Textos legais (US):** Termos de Uso, Privacidade, Reembolso e Termos do Criador em inglês (`packages/shared/legal/`), publicados no app (`/legal/[doc]`, ligados ao cadastro, ao checkout e ao Perfil) e no site (`/termos`, `/privacidade`, `/reembolsos`, `/termos-criadores`). **Rascunho para advogado**: preencher `LEGAL_PLACEHOLDERS` (razão social da LLC, estado e endereço). | — |
| 2026-10-22 | **Tradução para inglês americano:** app mobile inteiro, mensagens e e-mails do backend, pontuação, validações e gamificação; telefone, ponto decimal, feriados e cidades dos EUA; auditoria de Austrália/AUD feita (AUD segue só como moeda estrangeira e Austrália como destino). Categorias gravadas em português (checklist, arquivos da viagem, culinária) foram mantidas no banco e ganharam rótulos em inglês na tela. | — |
| 2026-10-22 | **Auditoria de dependências:** o aviso do Render (6 vulnerabilidades) foi identificado com `npm audit` e documentado como pendência urgente (ver o topo deste arquivo). Ainda não corrigido. | — |
| 2026-10-22 | **Stripe, troca para a conta da sócia (LLC nos EUA):** confirmado que o código não depende da conta (só `STRIPE_SECRET_KEY` e `STRIPE_WEBHOOK_SECRET`; o preço é criado na hora, sem ID de produto fixo). Webhook de **teste** criado na conta nova: `vamo-backend-render`, evento `checkout.session.completed`, payload snapshot, URL `https://vamo-699h.onrender.com/api/payments/webhook`. `STRIPE-PRODUCAO.md` atualizado para a LLC e o USD. | — |
| 2026-10-22 | **Verificação da produção:** `/health` do Render responde 200 em ~0,5s e `/api/itineraries` 200; o 503 visto no início do dia não se repetiu. Painel do Render mostra o serviço VAMO "Deployed" (Starter). Health Check Path continua vazio. | — |
| 2026-10-15 | Moeda-base passou de AUD para **USD (EUA)**, num lugar só (`market.ts`), e o painel admin passou a pré-carregar os dados. | `a04b710` |
| 2026-10-14 | Painel admin publicado na Vercel como `vamo-admin`. | `e285cfb`, `5b26c34` |
| 2026-09-29 | **Banco zerado para o lançamento:** dados fictícios apagados, 1 traveler real e 1 admin mantidos. Backup anterior arquivado em `../VAMO-backups-archive/`. | — |
| 2026-09-24 | **Todos os e-mails transacionais:** 10 novos (senha alterada, venda ao roteirista, aprovado, reprovado, revisão ao admin, nova pergunta, resposta, avaliação, roteirista aprovado, estorno automático), com proteção contra duplicado. Corrigido o valor da compra, que aparecia dividido por 100 (A$0.30). Sininho e preferências sem promessas falsas. 33 verificações locais + 12 testes permanentes. | `e5cf1db` |
| 2026-09-24 | Diagnóstico de e-mails e notificações: só 3 e-mails existem; os avisos dentro do app são gravados mas nenhuma tela mostra; o sininho e as preferências são falsos. Ver [NOTIFICACOES-DIAGNOSTICO.md](NOTIFICACOES-DIAGNOSTICO.md). | `a4b570d` |
| 2026-09-24 | **E-mails funcionando em produção.** Criada a senha de app do Gmail (com verificação em duas etapas), `SMTP_USER`/`SMTP_PASS` no Render. Teste para anapaulaabeckenkamp@gmail.com aceito pelo Gmail e e-mail de recuperação de senha entregue. | `c83c6d2` |
| 2026-09-24 | **Render passou para o plano Starter** (0.5c-512mb, US$ 7 por mês). Motivo: o plano gratuito bloqueia o envio de e-mail (SMTP) e "dorme" sem uso. | — |
| 2026-09-24 | Checklist reordenado pela prioridade do Diego (12 tasks). | `ffed266` |
| 2026-09-24 | **Migrations automáticas no deploy:** o `npm run start` roda `prisma migrate deploy` antes de subir e falha sem subir se a migration der erro. Validado em deploy real. | `b26f011`, `8875f32` |
| 2026-09-24 | **"Esqueci minha senha"** completo (backend, telas, e-mail, limites contra abuso, 37 testes). A migration foi aplicada pelo próprio deploy. | `587ecbb` |
| 2026-09-24 | E-mails de boas-vindas e de confirmação de compra (`mailer.ts`). Recibos e marca do VAMO configurados no Stripe. | `c56ef03` |
| 2026-09-24 | Login aceita e-mail com maiúscula e espaço; script `reset-password.ts` de emergência. | `f90a4b9` |

## Próximos passos (em ordem)

0. 🚨 🤖 **Corrigir as 6 vulnerabilidades do backend** (seção urgente no topo).
0. 👤 **Stripe:** colar `STRIPE_SECRET_KEY` (`sk_test_…`, em Developers → API keys) e `STRIPE_WEBHOOK_SECRET` (`whsec_…`, na página do webhook) no Render → Environment → Save. Depois, 👥 compra de teste com o cartão `4242 4242 4242 4242` e conferência do webhook (200) e de "Meus Roteiros". Só então ativar a conta da LLC e trocar para `sk_live_…` + webhook de produção.
1. 🤖 **Central de notificações no app** (task 1): mostrar os avisos já gravados de pergunta, resposta e avaliação. Opcional antes do lançamento.
2. 🤖 **Testes em produção pendentes:** troca de senha pelo link (task 2) e e-mail de confirmação de compra (task 1), com a conta de teste `vamoappviagens+teste2225@gmail.com`.
3. 👤 **Supabase Pro** (task 4), para ter backups diários.
4. 👤 **Contador e decisão PF ou CNPJ** (task 5.1). Isso trava a ativação do Stripe.
5. 👥 **Termos, privacidade e reembolso** (task 7). Posso começar pelas páginas e pelos textos-base para revisão.

## Já está pronto ✅

- [x] Backend (Render), app (Vercel) e banco (Supabase) publicam a `main` automaticamente.
- [x] Compra de ponta a ponta funcionando no modo teste: ver o roteiro, pagar no Stripe e ver o roteiro em "Meus Roteiros".
- [x] Pagamento em AUD, só com cartão (Apple Pay e Google Pay incluídos), sem parcelamento.
- [x] O login aceita e-mail com maiúscula e espaço, e o script `reset-password.ts` recupera o acesso manualmente.

---

## 1. Finalizar e testar os e-mails automáticos · ⚡ · 👥

E-mail oficial do VAMO: **vamoappviagens@gmail.com**. Diagnóstico completo de e-mails e avisos (o que existe, textos, quando sai, o que falta): [NOTIFICACOES-DIAGNOSTICO.md](NOTIFICACOES-DIAGNOSTICO.md).

**E-mails transacionais (tabela completa no diagnóstico):**
- [x] 🤖 13 e-mails: boas-vindas, compra, recuperação e alteração de senha, venda, aprovado, reprovado, revisão ao admin, nova pergunta, resposta, avaliação, roteirista aprovado e estorno automático. Todos com proteção contra duplicado e 33 verificações locais.
- [x] 🤖 Corrigido o valor do e-mail de compra, que era dividido por 100 duas vezes (A$29.90 aparecia como A$0.30).
- [x] 🤖 Sininho e tela de preferências não prometem mais avisos que não existem.
- [x] 🤖 Entrega confirmada em produção: os 13 chegaram na caixa de entrada, nenhum no spam (2026-09-24). A, C e D pelo fluxo real completo.
- [ ] 👥 Validar B, E e M pelo fluxo real com a Stripe em modo real (task 5), incluindo os recibos da Stripe.
- [ ] 🤖 Central de notificações no app (`GET /api/notifications` + sininho), que vai mostrar os avisos já gravados de pergunta, resposta e avaliação.
- [ ] 🤖 Índice único em respostas e avaliações, para impedir linha duplicada numa corrida.
- [ ] 👤 Quando o painel admin (site) for publicado: `ADMIN_APP_URL` no Render.

O envio usa o Gmail da conta do VAMO, via SMTP com uma "senha de app". Só funciona com o Render em instância paga.

**Recibos do Stripe:**
- [x] Recibo de pagamento concluído e de reembolso ligados, em inglês, na conta principal e na área restrita de testes.
- [x] Marca no Stripe: ícone do VAMO, cor `#28C9BF` e destaque `#1A3263`.
- [ ] 👤 Na ativação da conta (task 5), preencher o **e-mail de suporte** com `vamoappviagens@gmail.com`. Hoje o Stripe mostra o e-mail pessoal do Diego, e esse campo só pode ser alterado depois da ativação.

**E-mails do próprio VAMO (`apps/backend/src/lib/mailer.ts`):**
- [x] 🤖 Boas-vindas no cadastro, confirmação de compra (uma única vez por compra) e recuperação de senha.
- [x] 🤖 Sem a senha configurada, o backend só registra um aviso e segue funcionando.
- [x] 👤 Criar a **senha de app** do Gmail (feito em 2026-09-24, com a verificação em duas etapas ligada): entrar em myaccount.google.com com a conta `vamoappviagens@gmail.com` → Segurança → ativar a **Verificação em duas etapas** → **Senhas de app** → criar "VAMO backend" → copiar o código de 16 letras.
- [x] 👤 Na conta atual do Render → serviço VAMO → **Environment** → adicionar `SMTP_USER=vamoappviagens@gmail.com` e `SMTP_PASS=<código de 16 letras>` e salvar. ⚠️ No plano **gratuito** o Render bloqueia as portas de SMTP (dá "Connection timeout"); só funciona em instância paga (task 4). O Render reinicia sozinho. No `apps/backend/.env` local, preencher o `SMTP_PASS`.
- [x] 🤖 Envio testado em produção em 2026-09-24: o e-mail de teste para anapaulaabeckenkamp@gmail.com foi aceito pelo Gmail (`250 OK`), e o de recuperação de senha para a conta de teste `vamoappviagens+teste2225@gmail.com` chegou na caixa de entrada.
- [ ] 🤖 Falta testar numa compra de teste, conferindo a chegada, o visual e os links dos e-mails de boas-vindas e de confirmação. Conferir também a caixa de spam.

**Limites do Gmail:** cerca de 500 e-mails por dia, e o remetente é "@gmail.com". Quando o domínio próprio existir (task 6), migrar para o Resend com `contato@<domínio>`. É só trocar o transporte no `mailer.ts`.

**Newsletter (depois do lançamento):**
- [ ] 👥 A lei americana contra spam (CAN-SPAM Act) exige link de descadastro e identificação do remetente em todo e-mail promocional; para uma lista limpa, colete consentimento explícito. Adicionar a caixa "Quero receber novidades" no cadastro (desmarcada por padrão), registrando a data do aceite. Precisa de migration.
- [ ] 👤 Usar uma ferramenta própria de newsletter (Brevo ou Mailchimp) com link de descadastro. Não enviar newsletter pelo Gmail, porque há risco de bloqueio da conta.

## 2. "Esqueci minha senha" completo · 🟢 · 👥

No ar desde 2026-09-24 (commit `587ecbb`). O e-mail de recuperação chega na caixa de entrada (testado em produção). Falta testar a troca de senha pelo link em produção.

- [x] 🤖 Tabela `password_reset_tokens`, que guarda só o SHA-256 do token, e a coluna `travelers.passwordChangedAt`. Migration aplicada pelo deploy.
- [x] 🤖 `POST /api/auth/traveler/forgot-password`: resposta sempre neutra, token aleatório de 32 bytes, validade de 1 hora, só o link mais recente vale e no máximo 1 e-mail por minuto por conta.
- [x] 🤖 `POST /api/auth/traveler/reset-password`: uso único, seguro mesmo com dois envios simultâneos, e a política de senha é a mesma do cadastro (mínimo de 6 caracteres).
- [x] 🤖 Limites por IP: 5 pedidos de link e 10 tentativas de redefinição a cada 15 minutos, além do limite global.
- [x] 🤖 O refresh emitido antes da troca de senha passa a ser recusado (ver limitação abaixo).
- [x] 🤖 App: link "Esqueci minha senha?" no login, telas `/forgot-password` e `/reset-password?token=…`, e o atalho em Conta → Segurança.
- [x] 🤖 37 testes de API em banco isolado, fluxo testado no navegador e builds passando.
- [x] 👤 SMTP no Render (task 1). O e-mail de recuperação chegou na caixa de entrada em 2026-09-24.
- [ ] 🤖 Testar em produção com uma conta de teste: pedir o link, receber o e-mail, redefinir e entrar.

**Limitação conhecida:** o token de acesso continua valendo até expirar (24 horas). A troca de senha não desconecta na hora os outros aparelhos: eles saem quando tentam renovar a sessão.

## 3. Migrations automáticas no deploy · ✅ concluída em 2026-09-24

A cada push na `main`, o Render roda `prisma migrate deploy` antes de subir o servidor. Se a migration falhar, o servidor novo não sobe e a versão anterior continua no ar.

- [x] Diagnóstico:
  - O `preDeployCommand` do `render.yaml` nunca rodou: o serviço foi criado pelo painel, sem Blueprint.
  - O Pre-Deploy Command só existe em plano pago.
- [x] `npm run start` agora é `npm run prisma:migrate:deploy && tsx src/index.ts`.
- [x] Testado localmente em três cenários (banco zerado, reinício e migration com erro) e num deploy real (commit `b26f011`): o Render aplicou a migration, subiu e o `/health` respondeu 200.
- [x] `render.yaml` virou espelho do painel e o CLAUDE.md documenta o fluxo.
- [ ] 👤 Opcional: Render → VAMO → Settings → Health Checks → **Health Check Path** = `/health`. Hoje está vazio.

## 4. Render pago + Supabase Pro · ⚡ · 👤

**Render (US$ 7 por mês):** no plano gratuito, o servidor "dorme" sem uso e o primeiro acesso leva mais de 50 segundos. Para o cliente, parece que o app travou.
- [x] 👤 Render → serviço VAMO → **Compute** → plano Starter (0.5c-512mb, US$ 7 por mês), trocado em 2026-09-24.
- [ ] 🤖 Conferir que o `/health` responde rápido logo após um período sem uso.
- [ ] 🤖 Opcional: mover o `prisma migrate deploy` do `start` para o **Pre-Deploy Command**, que passa a ficar disponível, e tirar do `start` para não rodar duas vezes.

**Supabase Pro (US$ 25 por mês):** no plano gratuito, o projeto pausa após inatividade e não há backup automático.
- [ ] 👤 Supabase → Organization → Billing → plano **Pro**. **Próximo item desta task.**
- [ ] 👤 Confirmar que os **backups diários** aparecem em Database → Backups.

## 5. Stripe em produção + Stripe Connect / repasse aos roteiristas · 🔴 · 👥

Passo a passo do Stripe em [STRIPE-PRODUCAO.md](STRIPE-PRODUCAO.md).

**5.1 Pré-requisito: contador e estrutura (👤, prazo externo):**
- [ ] Contratar um contador especializado em **exportação de serviços** e comércio exterior.
- [ ] Decidir PF ou CNPJ e o regime tributário. O tipo de empresa **não muda depois** no Stripe, então essa decisão vem antes da ativação. Perguntar sobre isenção de PIS, COFINS e ISS em receita de exportação.
- [ ] Entender como declarar a receita que entra via Stripe (câmbio de AUD para reais) e como tributar o repasse para roteiristas, inclusive os que moram fora do Brasil.
- [ ] Entender com o contador a cobrança de **sales tax** sobre produto digital nos EUA: cada estado define se tributa e a partir de qual volume de vendas (nexo econômico). Verificar se o Stripe Tax resolve.

**5.2 Stripe em produção:**

> Atualização 2026-10-22: a conta é da sócia, com a LLC dela nos EUA. Isso resolve o pré-requisito 5.1 para a conta Stripe (PF/CNPJ brasileiro deixa de ser o caminho). O contador ainda vale para a tributação do lado de cá e do repasse.

- [x] 🤖 Confirmar que o código não depende da conta Stripe antiga (só as duas variáveis de ambiente; sem produto/preço fixo).
- [x] 👤 Conta Stripe da sócia aberta, logada, em modo teste (área restrita "VAMO").
- [x] 🤖 Webhook de **teste** criado na conta nova (`vamo-backend-render`, `checkout.session.completed`, snapshot, URL de produção do Render).
- [ ] 👤 Colar `STRIPE_SECRET_KEY` (`sk_test_…`) e `STRIPE_WEBHOOK_SECRET` (`whsec_…`) no Render e salvar. Cuidado para não trocar as duas.
- [ ] 👥 Compra de teste ponta a ponta na conta nova (cartão `4242 4242 4242 4242`).
- [ ] 👤 Ativar a conta: dados da LLC, conta bancária americana, documentos e e-mail de suporte `vamoappviagens@gmail.com`. A conta de teste já mostra "Ação necessária" para isso.
- [ ] 👤 Refazer na conta nova: recibos em inglês, marca (ícone, `#28C9BF`, `#1A3263`) e e-mail de suporte.
- [ ] 👤 Confirmar em Configurações → Pagamentos que a conta aceita cobrar em **USD** (a moeda-base agora).
- [ ] 🤖 Criar o webhook de **produção** (modo real) com a mesma URL e o evento `checkout.session.completed` (e os eventos do Connect, se for o caso).
- [ ] 👤 No Render, trocar `STRIPE_SECRET_KEY` pela `sk_live_…` e `STRIPE_WEBHOOK_SECRET` pelo `whsec_…` do webhook de produção.
- [ ] 👥 Fazer uma compra real com o seu cartão, conferir no Stripe, no webhook e em "Meus Roteiros", e depois reembolsar.

**5.3 Repasse aos roteiristas:**
- [x] 👤 Comissão do VAMO definida: 20% (2026-10-27). Falta definir a frequência do repasse.
- [ ] 👤 Confirmar que o Stripe Connect está disponível para a conta: depende do país da conta e do país dos roteiristas.
- [ ] 🤖 Cadastro do roteirista no Stripe Connect (conta Express), iniciado pelo Portal do Roteirista.
- [ ] 🤖 Checkout dividindo o pagamento: parte do roteirista e comissão do VAMO.
- [ ] 🤖 Painel de ganhos do roteirista com dados reais (hoje `creator-earnings` é mock) e relatório no admin.
- [ ] 🤖 Reembolso desfazendo o repasse.
- [ ] 👤 Alternativa enquanto o Connect não fica pronto: repasse manual com base num relatório "a pagar por roteirista" no admin.

## 6. Domínio próprio · 🟢 · 👥

`vamo-ten.vercel.app` passa pouca confiança na hora de pagar.

- [ ] 👤 Comprar o domínio (ex.: `.com`; evitar domínios com exigência de residência local).
- [ ] 👤 Vercel → projeto `vamo` → Domains → adicionar o domínio e configurar o DNS.
- [ ] 🤖 Opcional: criar `api.<domínio>` apontando para o Render.
- [ ] 👤 No Render, atualizar `APP_BASE_URL` e `ALLOWED_ORIGINS` com o domínio novo.
- [ ] 🤖 Atualizar `EXPO_PUBLIC_API_URL` na Vercel, se a API mudar de endereço.
- [ ] 👥 E-mail no domínio (`contato@<domínio>`) com o Resend, trocando o transporte no `mailer.ts`.
- [ ] 🤖 Trocar o ícone do app (`apps/mobile/assets/icon.png`), que ainda é o modelo padrão do Expo, pelo logo do VAMO. Conferir também o favicon e a imagem de abertura.
- [ ] 🤖 Testar login, compra e e-mails pelo domínio novo.

## 7. Termos de Uso + Privacidade + Reembolso + termos dos roteiristas · 🟡 · 👥

Exigidos pelo Stripe e pelas leis americanas de consumidor (FTC e leis estaduais) e de privacidade (CCPA/CPRA na Califórnia e leis de outros estados). **Rascunhos em inglês já escritos em `packages/shared/legal/` e publicados no app (rota `/legal/[doc]`); falta revisão de advogado e preencher razão social, estado e endereço da LLC em `LEGAL_PLACEHOLDERS`.**

- [ ] 👤 Definir a **política de reembolso**. Ex.: reembolso em até 7 dias se o roteiro não foi aberto. Nos EUA, regras estaduais e as exigências do Stripe e dos bancos fazem recusar reembolso de produto com defeito ou diferente do anunciado virar disputa (chargeback). A política rascunhada em `legal/` reembolsa nesses casos.
- [x] 🤖 Rascunho dos textos em inglês (Termos de Uso, Privacidade, Reembolso): feito em `packages/shared/legal/`.
- [ ] 👥 Revisão por advogado americano e preenchimento de `LEGAL_PLACEHOLDERS` (razão social, estado, endereço).
- [x] 🤖 Rascunho dos Termos do Criador (feito). A comissão (20%/80%) já consta nos Termos; a frequência de repasse ainda precisa ser decidida (👤).
- [x] 🤖 Páginas no app e no site, com link no cadastro, no checkout e no Perfil (feito).
- [ ] 🤖 Link no rodapé do site.
- [ ] 🤖 Incluir no checkout "Ao comprar você concorda com os Termos" e ligar os termos no Stripe (Configurações → Checkout).
- [ ] 🤖 Aceite obrigatório no cadastro (viajante) e ao virar roteirista, registrando a data e a versão aceita.

## 8. Catálogo inicial: ~15 roteiros · 🔴 (contínuo) · 👤

Hoje há só 3 roteiros ativos, 2 deles do Japão. O público americano procura muito México, Caribe, Europa, Japão, Havaí, Costa Rica e parques nacionais dos EUA.

- [ ] Definir os ~15 roteiros-alvo por destino e duração.
- [ ] Recrutar 3 a 5 roteiristas.
- [ ] Revisar e aprovar os roteiros no painel admin (fotos, custos em AUD, checklist completo).
- [ ] Conseguir pelo menos 1 avaliação real nos roteiros principais, que é o critério para aparecer em "Destaque".
- [ ] Alinhar com a task 9: os roteiros novos já em inglês.

## 9. Tradução/localização completa para inglês americano (en-US) · 🟡 · 👥

**Estado em 2026-10-22:** o app mobile, o backend (e-mails e erros), os textos compartilhados e as páginas legais já estão em inglês americano (decisão: só inglês, sem seletor de idioma). Falta: painel admin e dashboards do `apps/site` (ainda em português) e a revisão por falante nativo.

- [ ] 👤 Decidir: só inglês, ou inglês e português com seletor de idioma.
- [ ] 🤖 Instalar a infraestrutura de tradução (ex.: `i18next`) no app e no site, com os textos em arquivos separados.
- [ ] 🤖 Extrair os textos tela por tela, nesta ordem: Home e busca → detalhe do roteiro → checkout → login e cadastro → Meus Roteiros e roteiro comprado → perfil → portal do roteirista → admin.
- [x] 🤖 Traduzir e-mails, mensagens de erro, confirmações e as páginas legais da task 7 (feito).
- [ ] 🤖 Traduzir o painel admin, o editor web do criador (`apps/site` dashboards) e a área de agências: ainda em português, uso interno.
- [x] 🤖 Aceite obrigatório dos termos no cadastro com data e versão (`LEGAL_VERSION`), gravado em `travelers.termsAcceptedAt/termsVersion` (migration `20261027120000`, 2026-10-27). Contas antigas ficam sem registro. Falta: pedir novo aceite quando `LEGAL_VERSION` mudar.
- [x] 🤖 Formatos americanos: datas (mm/dd/aaaa), moeda (US$), vírgula/ponto decimal e horário AM/PM (feito; ponto como separador decimal, feriados dos EUA na busca por datas).
- [ ] 👤 Revisar as traduções com um falante nativo.
- [ ] 👤 Decidir o que fazer com os roteiros escritos em português: exigir inglês dos roteiristas ou traduzir.

## 10. QA geral de pré-lançamento · 🟡 · 👥

- [ ] 🤖 Roteiro de testes ponta a ponta, feito no domínio final:
  - Cadastro, login e recuperação de senha.
  - Busca, filtros e detalhe do roteiro.
  - Compra com cartão real, e-mails, "Meus Roteiros", roteiro comprado e avaliação.
  - Portal do Roteirista: criar roteiro, submeter, aprovar, vender e ver o repasse.
  - Admin.
- [ ] 🤖 Testar em celular (iOS Safari e Android Chrome) e desktop (Chrome, Safari).
- [ ] 🤖 Testar em conexão lenta e depois de um tempo sem uso.
- [ ] 🤖 Revisão de segurança: CORS, limites de requisição, RLS do Supabase, segredos, rotas de admin.
- [ ] 🤖 Monitoramento de erros (ex.: Sentry) e alerta de queda do `/health`.
- [ ] 👤 Teste com 3 a 5 pessoas reais (idealmente americanas), coletando feedback.
- [ ] 👥 Corrigir os bloqueadores encontrados.

## 11. Apple App Store / Google Play · 🔴 · 👥

- [ ] 👤 Decidir se as lojas entram no lançamento ou logo depois. O site já funciona no celular.
- [ ] ⚠️ Apple e Google exigem o sistema de pagamento deles (taxa de 15 a 30%) para vender conteúdo digital dentro do app. Com Stripe, a compra precisa acontecer fora do app. Definir a estratégia antes de submeter.
- [ ] 👤 Contas de desenvolvedor: Apple (US$ 99 por ano) e Google (US$ 25, pagos uma vez).
- [ ] 🤖 Build com EAS, ícones, telas de abertura, capturas de tela e textos das lojas (em inglês).
- [ ] 👥 Política de privacidade publicada (task 7) e formulários de privacidade das lojas.
- [ ] 👥 Submeter, responder à revisão e publicar.

## 12. Lançamento · 👥

- [ ] 👥 Checklist final: tasks 1 a 10 concluídas (a 11 conforme a decisão tomada nela).
- [ ] 👤 Backup do banco logo antes e monitoramento ligado.
- [ ] 👤 Plano de divulgação: redes sociais, comunidades de viagem americanas, roteiristas divulgando os próprios roteiros.
- [ ] 👥 Acompanhar as primeiras vendas de perto (Stripe, e-mails, repasses) nas primeiras 48 horas.
