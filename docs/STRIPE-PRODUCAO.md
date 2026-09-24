# Stripe — colocar pagamentos reais no ar

Estado verificado em 2026-09-24:

| Item | Status |
|---|---|
| Render (backend) | `main` @ `f90a4b9`, Live, deploy automático a cada commit |
| Vercel (app) | `vamo-ten.vercel.app` publicando a `main` automaticamente |
| Supabase | 11/11 migrations aplicadas |
| Stripe modo TESTE | Funcionando ponta a ponta: sessão em AUD, só cartão, volta para `vamo-ten.vercel.app`, webhook ativo com 0% de erro |
| Stripe modo PRODUÇÃO | **Conta não ativada** — nenhum pagamento real é possível ainda |

O código não precisa mudar para ir para produção. Só faltam os passos abaixo.

## 1. Ativar a conta (só você pode fazer)

Stripe → **Alternar para conta de produção** → **Ative sua conta**.

- **Localização da empresa** e **Tipo de empresa** (Pessoa Física ou CNPJ) **não podem ser alterados depois**. Se o VAMO vai ter CNPJ, ative já com ele.
- A conta bancária de repasse precisa estar no mesmo CPF/CNPJ informado.
- Os compradores pagam em **AUD**. Antes de enviar, confirme em *Configurações → Pagamentos → Moedas* que a conta aceita cobrar em AUD. No modo teste funciona; o Stripe converte para a moeda do repasse (BRL, se a conta for do Brasil), e cobra uma taxa de conversão.

## 2. Criar o webhook de produção

Stripe (modo produção) → **Desenvolvedores → Webhooks → Adicionar destino**:

- URL: `https://vamo-699h.onrender.com/api/payments/webhook`
- Evento: `checkout.session.completed`
- Depois de criar, copie o **Segredo de assinatura** (`whsec_...`).

## 3. Trocar as chaves no Render

Render → serviço **VAMO** → **Environment** → **Edit**:

| Variável | Novo valor |
|---|---|
| `STRIPE_SECRET_KEY` | chave secreta de produção (`sk_live_...`, em Desenvolvedores → Chaves de API) |
| `STRIPE_WEBHOOK_SECRET` | o `whsec_...` do webhook de produção (passo 2) |
| `APP_BASE_URL` | manter `https://vamo-ten.vercel.app` (já está certo) |

Salvar → o Render reinicia sozinho (~1 min).

> A chave e o segredo do webhook precisam ser do **mesmo modo**. Chave `sk_live` com `whsec` do webhook de teste = toda compra fica sem confirmar.

## 4. Testar com dinheiro real

1. No app, compre um roteiro com um cartão seu.
2. Confira: Stripe → Pagamentos mostra o pagamento; Webhooks mostra o evento entregue (200); o roteiro aparece em *Meus Roteiros*.
3. Reembolse pelo Stripe (Pagamentos → ... → Reembolsar).

## Detalhes que já estão resolvidos no código

- Só cartão (Apple Pay/Google Pay incluídos). Afterpay/Klarna/Zip ficam desligados mesmo se o Stripe os ativar no painel.
- A compra é registrada uma única vez, mesmo que o webhook e a tela de retorno cheguem juntos (índice único no banco).
- Se o `STRIPE_WEBHOOK_SECRET` faltar, o webhook responde erro 500 de propósito, para não aceitar evento falso.
