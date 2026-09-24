# Tasks para finalizar e lançar o VAMO

> Nosso norte na reta final. Ordenado do **menor esforço** para o **maior**.
> Marque `[x]` ao concluir. Atualizado em 2026-09-24.

**Legenda:**
- **Esforço:** ⚡ minutos · 🟢 horas · 🟡 1–3 dias · 🔴 1+ semana.
- **Quem faz:** 👤 Diego · 🤖 Claude · 👥 os dois.
- **Bloqueia:** o item precisa estar feito antes do lançamento.

## Já está pronto ✅

- [x] Backend (Render), app (Vercel) e banco (Supabase) publicam a `main` e estão na versão mais recente.
- [x] Compra de ponta a ponta funcionando no modo teste: ver o roteiro, pagar no Stripe e ver o roteiro em "Meus Roteiros".
- [x] Pagamento em AUD, só com cartão (Apple Pay e Google Pay incluídos), sem parcelamento.
- [x] O login aceita e-mail com maiúscula e espaço, e o script `reset-password.ts` recupera o acesso manualmente.

## ⚠️ Decisão que destrava outras tasks

**Pessoa Física ou CNPJ?** Precisa ser decidido antes da task 5 (ativar o Stripe), porque o tipo de empresa **não muda depois** no Stripe. Leve essa pergunta ao contador (task 10). Se ainda não tiver CNPJ, vale esperar o CNPJ para ativar o Stripe.

## 1. Ligar recibo por e-mail no Stripe · ⚡ · 👤

- [ ] Stripe → Configurações → **E-mails para clientes** → ligar "Pagamentos bem-sucedidos" e "Reembolsos".
- [ ] Em Configurações → **Marca**, colocar o logo e a cor do VAMO, que aparecem no recibo e na página de pagamento.

## 2. Migrations do banco automáticas no deploy · ⚡ · 👥 · Bloqueia

Hoje, uma migration nova só vai para o Supabase se alguém rodar à mão. No plano gratuito do Render, o "Pre-Deploy Command" fica bloqueado.

- [ ] 👤 Aprovar a mudança: `npm start` passa a rodar `prisma migrate deploy && tsx src/index.ts`.
- [ ] 🤖 Aplicar, fazer o push e conferir no Render que o deploy subiu e rodou as migrations.
- [ ] 🤖 Atualizar o `render.yaml` e o CLAUDE.md.

Se você fizer upgrade do Render (task 3), dá para usar o campo "Pre-Deploy Command" no lugar.

## 3. Render no plano pago · ⚡ · 👤 · Bloqueia

No plano gratuito, o servidor "dorme" sem uso e o primeiro acesso leva mais de 50 segundos. Para o cliente, parece que o app travou.

- [ ] Render → serviço VAMO → **Upgrade your instance** → plano **Starter** (US$ 7 por mês).
- [ ] 🤖 Conferir que o `/health` responde rápido logo após um período sem uso.

## 4. Supabase no plano Pro · ⚡ · 👤 · Bloqueia

No plano gratuito, o projeto pausa após inatividade e não há backup automático. Perder o banco significa perder as vendas.

- [ ] Supabase → Organization → Billing → plano **Pro** (US$ 25 por mês).
- [ ] Confirmar que os **backups diários** aparecem em Database → Backups.

## 5. Stripe em produção (dinheiro real) · 🟢 · 👥 · Bloqueia

Passo a passo detalhado em [STRIPE-PRODUCAO.md](STRIPE-PRODUCAO.md). Depende da decisão PF/CNPJ acima.

- [ ] 👤 Ativar a conta: dados da empresa, conta bancária e documentos.
- [ ] 👤 Confirmar em Configurações → Pagamentos que a conta aceita cobrar em **AUD**.
- [ ] 🤖 Criar o webhook de produção apontando para `https://vamo-699h.onrender.com/api/payments/webhook`, com o evento `checkout.session.completed`.
- [ ] 👤 No Render, trocar `STRIPE_SECRET_KEY` pela `sk_live_…` e `STRIPE_WEBHOOK_SECRET` pelo `whsec_…` do webhook de produção.
- [ ] 👥 Fazer uma compra real com o seu cartão, conferir no Stripe, no webhook e em "Meus Roteiros", e depois reembolsar.

## 6. Domínio próprio · 🟢 · 👥

`vamo-ten.vercel.app` passa pouca confiança na hora de pagar.

- [ ] 👤 Comprar o domínio (ex.: `vamo.com.au` exige ABN australiano; `.com` não exige).
- [ ] 👤 Vercel → projeto `vamo` → Domains → adicionar o domínio e configurar o DNS.
- [ ] 🤖 Opcional: criar `api.<domínio>` apontando para o Render.
- [ ] 👤 No Render, atualizar `APP_BASE_URL` e `ALLOWED_ORIGINS` com o domínio novo.
- [ ] 🤖 Atualizar `EXPO_PUBLIC_API_URL` na Vercel, se a API mudar de endereço.
- [ ] 🤖 Testar login e compra pelo domínio novo.

## 7. "Esqueci minha senha" · 🟡 · 🤖 (+👤 para criar a conta de e-mail) · Bloqueia

Hoje, o cliente que esquece a senha perde o acesso aos roteiros que comprou.

- [ ] 👤 Criar uma conta num serviço de e-mail transacional (sugestão: **Resend**) e verificar o domínio da task 6.
- [ ] 🤖 Backend: token de reset com validade de 1 hora e uso único. Precisa de migration.
- [ ] 🤖 Backend: rota `POST /auth/traveler/forgot-password`, que responde sempre "ok" para não revelar se o e-mail existe, e rota `POST /auth/traveler/reset-password`.
- [ ] 🤖 Backend: limite de tentativas nessas rotas.
- [ ] 🤖 App: link "Esqueci minha senha" no login, tela para pedir o e-mail e tela para criar a senha nova.
- [ ] 🤖 Testar o fluxo inteiro em produção com uma conta de teste.

## 8. Termos de uso, privacidade e reembolso · 🟡 · 👥 · Bloqueia

Exigidos pelo Stripe, pela lei de consumidor australiana (Australian Consumer Law) e pela lei de privacidade da Austrália (Privacy Act).

- [ ] 👤 Definir a **política de reembolso**. Ex.: reembolso em até 7 dias se o roteiro não foi aberto. Pela lei australiana, não dá para negar reembolso quando o produto tem defeito.
- [ ] 👥 Escrever os textos: Termos de Uso, Política de Privacidade e Política de Reembolso. Idealmente, revisados por um advogado.
- [ ] 🤖 Criar as páginas no app e no site, com link no rodapé e no cadastro.
- [ ] 🤖 Incluir no checkout: "Ao comprar você concorda com os Termos" e ligar os termos no Stripe (Configurações → Checkout).
- [ ] 🤖 Aceite obrigatório dos termos no cadastro, registrando a data.
- [ ] 👤 Termos específicos para roteiristas: direitos sobre o conteúdo, comissão e repasse.

## 9. Catálogo mínimo de roteiros · 🟡→🔴 (contínuo) · 👤

Hoje há só 3 roteiros ativos, 2 deles do Japão. O público australiano procura muito Bali, Tailândia, Japão, Nova Zelândia, Fiji e Europa.

- [ ] Definir a meta de lançamento (ex.: pelo menos 10 roteiros em pelo menos 6 destinos).
- [ ] Recrutar 3 a 5 roteiristas.
- [ ] Revisar e aprovar os roteiros no painel admin.
- [ ] Conseguir pelo menos 1 avaliação real nos roteiros principais, que é o critério para aparecer em "Destaque".

## 10. Estrutura tributária e empresa · 🔴 (prazo externo) · 👤 · Bloqueia a task 5

- [ ] Contratar um contador especializado em **exportação de serviços** e comércio exterior.
- [ ] Decidir PF ou CNPJ e o regime tributário (Simples ou Lucro Presumido). Perguntar sobre isenção de PIS, COFINS e ISS em receita de exportação.
- [ ] Entender como declarar a receita que entra via Stripe (câmbio de AUD para reais).
- [ ] Avaliar se faz sentido ter empresa ou conta no exterior no futuro, lembrando que a Lei 14.754/2023 tributa lucro de empresas no exterior controladas por brasileiros.
- [ ] Anotar o gatilho do **GST australiano**: registrar ao passar de A$ 75 mil por ano em vendas para a Austrália.

## 11. Repasse aos roteiristas · 🔴 · 👥

Hoje não existe nenhum mecanismo para pagar os criadores pelas vendas.

- [ ] 👤 Definir a comissão do VAMO (ex.: 30%) e a frequência do repasse (ex.: mensal).
- [ ] 👤 Escolher o caminho:
  - **(A) Manual no início:** planilha com as vendas e transferência para cada criador. Esforço 🟢, mas não escala.
  - **(B) Stripe Connect:** o criador cadastra a conta bancária dele e recebe automaticamente. Esforço 🔴.
- [ ] 🤖 Se escolher A: tela ou relatório de "a pagar por criador" no admin, a partir das vendas.
- [ ] 🤖 Se escolher B: cadastro do criador no Connect, divisão do pagamento no checkout e painel de ganhos com dados reais.
- [ ] 👤 Pensar na tributação do repasse para criadores no exterior (pergunta para o contador).

## 12. App em inglês (en-AU) · 🔴 · 👥 · Bloqueia

O público é australiano e o app está todo em português. Este é o maior item.

- [ ] 👤 Decidir: só inglês, ou inglês e português com seletor de idioma.
- [ ] 🤖 Instalar a infraestrutura de tradução (ex.: `i18next`) no app e no site, com os textos em arquivos separados.
- [ ] 🤖 Extrair os textos tela por tela, nesta ordem: Home e busca → detalhe do roteiro → checkout → login e cadastro → Meus Roteiros e roteiro comprado → perfil → portal do roteirista → admin.
- [ ] 🤖 Traduzir os textos fixos: e-mails, mensagens de erro, confirmações.
- [ ] 👤 Revisar as traduções com um falante nativo.
- [ ] 👤 Decidir o que fazer com os roteiros escritos em português: exigir inglês dos roteiristas ou traduzir.
- [ ] 🤖 Formatos australianos: datas (dd/mm/aaaa), moeda (A$) e horário AM/PM (já feito).

## 13. Lojas de aplicativos (opcional, pós-lançamento) · 🔴 · 👥

- [ ] 👤 Decidir se vale publicar nas lojas agora ou lançar só pelo site.
- [ ] ⚠️ Apple e Google exigem o sistema de pagamento deles (com taxa de 15 a 30%) para vender conteúdo digital dentro do app. Com Stripe, a venda precisa acontecer fora do app.
- [ ] 👤 Contas de desenvolvedor: Apple (US$ 99 por ano) e Google (US$ 25, pagos uma vez).
- [ ] 🤖 Build com EAS, ícones, telas de abertura e as páginas das lojas.

## Ordem sugerida para as próximas semanas

1. **Esta semana:**
   - Tasks 1, 3 e 4 (você, cerca de 30 minutos).
   - Task 2 (eu, assim que você aprovar).
   - Iniciar a task 10 (contratar o contador).
2. **Em paralelo:** eu faço a task 7; você escreve os textos da task 8 e recruta roteiristas (task 9).
3. **Com o CNPJ definido:** tasks 5 e 6.
4. **Maior bloco:** task 12 (inglês) e a task 11 no modo manual (A).
5. **Lançamento.** Depois dele: task 11 no modo Stripe Connect (B) e task 13.
