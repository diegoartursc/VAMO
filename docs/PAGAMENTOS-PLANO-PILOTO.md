# Pagamentos no piloto — Stripe (CPF) + repasse manual aos roteiristas

Decidido em 2026-10-15. Substitui o Stripe Connect (item 5.3 do LANCAMENTO-TASKS) por enquanto.

## Por que não Connect agora
- Conta Stripe do **Brasil** não faz repasse automático a roteiristas de outro país (docs.stripe.com/connect/cross-border-payouts: só EUA, UK, EEA, Canadá, Suíça).
- Mesmo uma LLC americana não cobre a Austrália nessa documentação. Só uma conta **australiana** (Pty Ltd) faria o split dentro do país.
- Revisar quando a empresa do VAMO existir. Trocar de conta = trocar `STRIPE_SECRET_KEY` e `STRIPE_WEBHOOK_SECRET` no Render, sem mudar código.

## Como o dinheiro anda
1. Comprador australiano paga em **AUD** (cartão) no checkout do Stripe.
2. Stripe desconta as taxas dele, converte para **BRL** e deposita na conta bancária brasileira do Diego.
3. No dia do repasse, o Diego paga a Wise por Pix e manda **AUD** direto para a conta do roteirista.

## Regra de negócio (fechada)
- Roteirista recebe **80% do preço cheio** do roteiro (ex.: roteiro de A$ 50 → A$ 40). VAMO fica com 20% e absorve as taxas do Stripe, a conversão e o custo do repasse.
- Constante única no código (a criar): `PLATFORM_COMMISSION_RATE = 0.20`.
- Reembolso: o roteirista só recebe depois do prazo de segurança; venda reembolsada não entra no repasse.

## Regras para o roteirista (texto a publicar nos termos)
- Repasse **mensal**, no dia 10, sobre as vendas confirmadas até o último dia do mês anterior.
- Prazo de segurança de **14 dias** após a compra antes de a venda contar (cobre reembolso e contestação).
- Pago em **AUD** por Wise (ou outro meio combinado), para conta em nome do próprio roteirista.
- Repasse mínimo de **A$ 20**; abaixo disso acumula para o mês seguinte.
- O roteirista informa os dados de recebimento (e-mail Wise ou conta bancária AU) no Portal do Roteirista.
- Taxas bancárias do lado do roteirista (se houver) são dele; o VAMO paga a taxa de envio.

---

## PARTE A — Stripe (você faz)
- [ ] A1. `dashboard.stripe.com` → alternar para produção → **Ativar conta**. Pessoa física, Brasil, CPF. País e tipo não mudam depois.
- [ ] A2. Conta bancária brasileira no seu CPF (banco digital serve) para receber os repasses.
- [ ] A3. Configurações → **Dados públicos**: nome público **VAMO**, descritor na fatura **VAMO**, e-mail de suporte `vamoappviagens@gmail.com`, logo.
- [ ] A4. Configurações → Pagamentos → **Moedas**: confirmar que o **AUD** está ativo.
- [ ] A5. Configurações → **Repasses**: ver a frequência (começa mais lenta e acelera) e o prazo do primeiro repasse.
- [ ] A6. Verificação de telefone por SMS (pendente hoje).
- [ ] A7. Desenvolvedores → Webhooks → Adicionar destino: `https://vamo-699h.onrender.com/api/payments/webhook`, evento `checkout.session.completed`. Copiar o `whsec_…`.
- [ ] A8. Desenvolvedores → Chaves de API: copiar a `sk_live_…` (nunca colar no chat).
- [ ] A9. Render → serviço VAMO → Environment: `STRIPE_SECRET_KEY`=sk_live, `STRIPE_WEBHOOK_SECRET`=whsec do A7. As duas de produção. `APP_BASE_URL` continua `https://vamo-ten.vercel.app`.
- [ ] A10. Compra real pequena com o seu cartão → conferir Stripe (pagamento), Webhooks (200), "Meus Roteiros" → reembolsar.

## PARTE B — App e painel (Claude faz, depois de A9)
- [ ] B1. Constante `PLATFORM_COMMISSION_RATE = 0.20` num só lugar; trocar os dois `* 0.15` em `payments.ts:211` e `itineraries.ts:1883`. (Hoje o código grava 15%.)
- [ ] B2. Campo do roteirista para dados de recebimento (Wise/conta AU): migration aditiva, tela no Portal do Roteirista (`creator-settings`).
- [ ] B3. Aviso de repasse no Portal do Roteirista: 80%, mensal dia 10, 14 dias, mínimo A$ 20. Mostrar ganhos reais (hoje `creator-earnings` é mock).
- [ ] B4. Aviso no cadastro de roteiro/precificação: "Você recebe 80% de A$ X = A$ Y".
- [ ] B5. Admin → Financeiro: tela **"A pagar por roteirista"** (vendas elegíveis, total 80%, dados de recebimento, botão "Marcar como pago" com data e comprovante). Tabela de repasses para não pagar duas vezes (migration aditiva).
- [ ] B6. E-mail ao roteirista quando o repasse for marcado como pago.
- [ ] B7. Termos para roteiristas e política de reembolso para compradores (revisar com contador).

## PARTE C — Rotina mensal (Diego)
1. Dia 10: abrir Admin → Financeiro → A pagar.
2. Wise: pagar por Pix e enviar AUD para cada roteirista com saldo ≥ A$ 20.
3. Marcar como pago no admin (data + comprovante).

## Pendências com contador
- IOF e imposto sobre receita recebida em PF; GST australiano (gatilho A$ 75 mil/ano).
- Quando a empresa do VAMO existir (Pty Ltd ou LLC): nova conta Stripe + troca de chaves; reavaliar Connect.
