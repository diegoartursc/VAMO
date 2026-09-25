# Tasks para finalizar e lançar o VAMO

> Nosso norte na reta final. Ordenado por **prioridade** (definida pelo Diego em 2026-09-24).
> Marque `[x]` ao concluir. Última atualização: 2026-09-24 (noite).

**Legenda:**
- **Esforço:** ⚡ minutos · 🟢 horas · 🟡 1–3 dias · 🔴 1+ semana.
- **Quem faz:** 👤 Diego · 🤖 Claude · 👥 os dois.

## Resumo

| # | Task | Status |
|---|---|---|
| 1 | E-mails automáticos | ✅ 13 e-mails no ar e entregues em produção (caixa de entrada); pendentes: central no app e validação com Stripe em modo real |
| 2 | "Esqueci minha senha" | 🟡 no ar e o e-mail chega; falta testar a troca de senha pelo link em produção |
| 3 | Migrations automáticas no deploy | ✅ concluída |
| 4 | Render pago + Supabase Pro | 🟡 Render Starter ✅; falta o Supabase Pro |
| 5 | Stripe em produção + repasse aos roteiristas | ⬜ depende do contador (PF/CNPJ) |
| 6 | Domínio próprio | ⬜ |
| 7 | Termos, privacidade, reembolso e termos dos roteiristas | ⬜ |
| 8 | Catálogo inicial (~15 roteiros) | ⬜ 3 ativos hoje |
| 9 | Tradução completa para en-AU | ⬜ |
| 10 | QA geral de pré-lançamento | ⬜ |
| 11 | Apple App Store e Google Play | ⬜ |
| 12 | Lançamento | ⬜ |

## Últimas ações (mais recentes primeiro)

| Data | O que foi feito | Commit |
|---|---|---|
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
- [ ] 👥 A lei australiana contra spam (Spam Act 2003) exige consentimento explícito. Adicionar a caixa "Quero receber novidades" no cadastro (desmarcada por padrão), registrando a data do aceite. Precisa de migration.
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
- [ ] Anotar o gatilho do **GST australiano**: registrar ao passar de A$ 75 mil por ano em vendas para a Austrália.

**5.2 Stripe em produção:**
- [ ] 👤 Ativar a conta: dados da empresa, conta bancária, documentos e e-mail de suporte `vamoappviagens@gmail.com`.
- [ ] 👤 Confirmar em Configurações → Pagamentos que a conta aceita cobrar em **AUD**.
- [ ] 🤖 Criar o webhook de produção apontando para `https://vamo-699h.onrender.com/api/payments/webhook`, com o evento `checkout.session.completed` (e os eventos do Connect, se for o caso).
- [ ] 👤 No Render, trocar `STRIPE_SECRET_KEY` pela `sk_live_…` e `STRIPE_WEBHOOK_SECRET` pelo `whsec_…` do webhook de produção.
- [ ] 👥 Fazer uma compra real com o seu cartão, conferir no Stripe, no webhook e em "Meus Roteiros", e depois reembolsar.

**5.3 Repasse aos roteiristas:**
- [ ] 👤 Definir a comissão do VAMO (hoje o código grava 15% em `commission`) e a frequência do repasse.
- [ ] 👤 Confirmar que o Stripe Connect está disponível para a conta: depende do país da conta e do país dos roteiristas.
- [ ] 🤖 Cadastro do roteirista no Stripe Connect (conta Express), iniciado pelo Portal do Roteirista.
- [ ] 🤖 Checkout dividindo o pagamento: parte do roteirista e comissão do VAMO.
- [ ] 🤖 Painel de ganhos do roteirista com dados reais (hoje `creator-earnings` é mock) e relatório no admin.
- [ ] 🤖 Reembolso desfazendo o repasse.
- [ ] 👤 Alternativa enquanto o Connect não fica pronto: repasse manual com base num relatório "a pagar por roteirista" no admin.

## 6. Domínio próprio · 🟢 · 👥

`vamo-ten.vercel.app` passa pouca confiança na hora de pagar.

- [ ] 👤 Comprar o domínio (ex.: `vamo.com.au` exige ABN australiano; `.com` não exige).
- [ ] 👤 Vercel → projeto `vamo` → Domains → adicionar o domínio e configurar o DNS.
- [ ] 🤖 Opcional: criar `api.<domínio>` apontando para o Render.
- [ ] 👤 No Render, atualizar `APP_BASE_URL` e `ALLOWED_ORIGINS` com o domínio novo.
- [ ] 🤖 Atualizar `EXPO_PUBLIC_API_URL` na Vercel, se a API mudar de endereço.
- [ ] 👥 E-mail no domínio (`contato@<domínio>`) com o Resend, trocando o transporte no `mailer.ts`.
- [ ] 🤖 Trocar o ícone do app (`apps/mobile/assets/icon.png`), que ainda é o modelo padrão do Expo, pelo logo do VAMO. Conferir também o favicon e a imagem de abertura.
- [ ] 🤖 Testar login, compra e e-mails pelo domínio novo.

## 7. Termos de Uso + Privacidade + Reembolso + termos dos roteiristas · 🟡 · 👥

Exigidos pelo Stripe, pela lei de consumidor australiana (Australian Consumer Law) e pela lei de privacidade da Austrália (Privacy Act).

- [ ] 👤 Definir a **política de reembolso**. Ex.: reembolso em até 7 dias se o roteiro não foi aberto. Pela lei australiana, não dá para negar reembolso quando o produto tem defeito.
- [ ] 👥 Escrever os textos: Termos de Uso, Política de Privacidade e Política de Reembolso. Idealmente, revisados por um advogado.
- [ ] 👥 Termos dos roteiristas: direitos sobre o conteúdo, originalidade, comissão, repasse e remoção de roteiro.
- [ ] 🤖 Criar as páginas no app e no site, com link no rodapé e no cadastro.
- [ ] 🤖 Incluir no checkout "Ao comprar você concorda com os Termos" e ligar os termos no Stripe (Configurações → Checkout).
- [ ] 🤖 Aceite obrigatório no cadastro (viajante) e ao virar roteirista, registrando a data e a versão aceita.

## 8. Catálogo inicial: ~15 roteiros · 🔴 (contínuo) · 👤

Hoje há só 3 roteiros ativos, 2 deles do Japão. O público australiano procura muito Bali, Tailândia, Japão, Nova Zelândia, Fiji, Vietnã e Europa.

- [ ] Definir os ~15 roteiros-alvo por destino e duração.
- [ ] Recrutar 3 a 5 roteiristas.
- [ ] Revisar e aprovar os roteiros no painel admin (fotos, custos em AUD, checklist completo).
- [ ] Conseguir pelo menos 1 avaliação real nos roteiros principais, que é o critério para aparecer em "Destaque".
- [ ] Alinhar com a task 9: os roteiros novos já em inglês.

## 9. Tradução/localização completa para en-AU · 🔴 · 👥

O público é australiano e o app está todo em português.

- [ ] 👤 Decidir: só inglês, ou inglês e português com seletor de idioma.
- [ ] 🤖 Instalar a infraestrutura de tradução (ex.: `i18next`) no app e no site, com os textos em arquivos separados.
- [ ] 🤖 Extrair os textos tela por tela, nesta ordem: Home e busca → detalhe do roteiro → checkout → login e cadastro → Meus Roteiros e roteiro comprado → perfil → portal do roteirista → admin.
- [ ] 🤖 Traduzir e-mails, mensagens de erro, confirmações e as páginas legais da task 7.
- [ ] 🤖 Formatos australianos: datas (dd/mm/aaaa), moeda (A$) e horário AM/PM (já feito).
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
- [ ] 👤 Teste com 3 a 5 pessoas reais (idealmente australianas), coletando feedback.
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
- [ ] 👤 Plano de divulgação: redes sociais, comunidades de viagem australianas, roteiristas divulgando os próprios roteiros.
- [ ] 👥 Acompanhar as primeiras vendas de perto (Stripe, e-mails, repasses) nas primeiras 48 horas.
