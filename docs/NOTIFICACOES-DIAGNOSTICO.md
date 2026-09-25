# Diagnóstico de e-mails e notificações do VAMO

> Auditoria do código e de produção feita em 2026-09-24, depois que o envio de e-mail passou a funcionar (Render pago + senha de app do Gmail).
> Base: `apps/backend/src` (todas as chamadas de envio e de notificação), `apps/mobile` (telas que mostram avisos) e as configurações do Stripe.

## Resumo

| Canal | Situação |
|---|---|
| **E-mail do VAMO** (Gmail `vamoappviagens@gmail.com`) | ✅ Funcionando em produção. **3 e-mails** existem: boas-vindas, confirmação de compra e recuperação de senha. |
| **E-mails do Stripe** (recibos) | ✅ Configurados. Só são enviados no **modo real**; no modo teste o Stripe não manda recibo. |
| **Notificações dentro do app** (tabela `notifications`) | ⚠️ **Gravadas mas invisíveis.** Dois eventos gravam aviso no banco, mas nenhuma tela nem rota lê essa tabela. |
| **Sininho da Home** | ❌ É falso: mostra sempre "Você não possui notificações", e na versão web nem isso aparece. |
| **Preferências de notificação** (Perfil → Notificações) | ❌ Promete 6 tipos de aviso; as escolhas ficam só no aparelho e nenhum envio as consulta. |
| **Push (notificação no celular)** | ❌ Não existe (sem `expo-notifications`, sem registro de aparelho). |

**Em resumo:** hoje o cliente só recebe e-mail em 3 momentos. Todo o resto (respostas de perguntas, vendas, aprovação de roteiro, avaliações) acontece **sem avisar ninguém**.

---

## 1. E-mails do VAMO (funcionando)

Todos saem de `apps/backend/src/lib/mailer.ts`, com remetente `VAMO <vamoappviagens@gmail.com>` e "responder para" o mesmo endereço. Os textos estão em português, com o layout do VAMO (cabeçalho em degradê `#28C9BF` → `#1A3263`, botão turquesa) e com uma versão só texto. Se o envio falhar, o erro vai para o log do Render e a ação do usuário continua normalmente.

| # | E-mail | Quando é enviado | Para quem | Onde está no código | Testado em produção |
|---|---|---|---|---|---|
| 1 | **"Bem-vindo(a) ao VAMO ✈️"** | Logo após criar conta | O viajante que se cadastrou | `routes/traveler-auth.ts` → `POST /register` | ⚠️ Não: o único cadastro de teste foi feito antes do Render pago (deu timeout). |
| 2 | **"Seu roteiro está liberado: <título>"** | Quando a compra é registrada: pagamento confirmado no Stripe ou roteiro gratuito. Sai **uma única vez por compra**, mesmo que o webhook e a tela de retorno cheguem juntos. | O comprador | `routes/payments.ts` → `fulfillItineraryPurchase` | ⚠️ Não: depende de uma compra de teste com cartão. |
| 3 | **"Redefina sua senha no VAMO"** | Quando alguém pede "Esqueci minha senha" para um e-mail com conta (login por e-mail). No máximo 1 por minuto por conta. | O dono da conta | `routes/traveler-auth.ts` → `POST /forgot-password` | ✅ Sim: chegou na caixa de entrada em 2026-09-24 às 22:34. |

**O que cada e-mail diz:**
1. **Boas-vindas:** "Bem-vindo(a) ao VAMO, *nome*! Sua conta está pronta. No VAMO você encontra roteiros completos, feitos por quem já viveu o destino — com voos, hospedagem, passeios, custos e checklist." Botão **Explorar roteiros**, que leva à Home.
2. **Confirmação de compra:** "Compra confirmada! 🎉 Oi, *nome*! Seu roteiro já está liberado: *título*. Valor pago: *A$ 29,90*. Ele fica para sempre em Meus Roteiros. O recibo do pagamento chega em um e-mail separado da Stripe." Botão **Abrir meu roteiro**, que leva a `/purchased-itinerary/<id>`.
3. **Recuperação de senha:** "Oi, *nome*! Recebemos uma solicitação para redefinir a senha da sua conta. O link expira em 1 hora e só pode ser usado uma vez." Botão **Redefinir minha senha**, com o link também em texto. Termina com "Se não foi você quem pediu, é só ignorar este e-mail".

Teste de infraestrutura, em 2026-09-24: um e-mail enviado de dentro do servidor do Render para `anapaulaabeckenkamp@gmail.com` foi aceito pelo Gmail (`250 2.0.0 OK`).

## 2. E-mails do Stripe (configurados, só no modo real)

| E-mail | Quando | Para quem | Idioma | Observação |
|---|---|---|---|---|
| Recibo de pagamento | Pagamento concluído | O e-mail do comprador, preenchido automaticamente no checkout | Inglês | Com o logo e as cores do VAMO. |
| Recibo de reembolso | Reembolso feito pelo painel ou automático | O comprador | Inglês | Cobre também o **reembolso automático** que o backend faz quando o roteiro é pausado durante o pagamento. |

- No modo teste, o Stripe **não envia** esses recibos. Eles só passam a sair quando a conta for ativada (task 5).
- Nos recibos, o e-mail de suporte ainda é o pessoal do Diego. Trocar para `vamoappviagens@gmail.com` na ativação.

## 3. Notificações dentro do app: gravadas, mas ninguém vê

Estes eventos gravam uma linha na tabela `notifications` do banco, mas **nenhuma rota do backend lista essas linhas e nenhuma tela do app as mostra**. Na prática, o usuário não fica sabendo.

| Evento | Quem deveria ser avisado | Texto gravado | Onde |
|---|---|---|---|
| Viajante faz uma pergunta num roteiro | O roteirista | "Nova pergunta recebida — Você recebeu uma nova pergunta no roteiro *título*." | `routes/questions.ts` (criar pergunta) |
| Roteirista responde a pergunta | O viajante | "Sua pergunta foi respondida — O criador respondeu sua pergunta sobre o roteiro." | `routes/questions.ts` (responder) |

**Outras coisas no app que parecem avisos mas não são:**
- **Sininho da Home** (`app/(tabs)/index.tsx`): só mostra um alerta fixo "Você não possui notificações no momento". Esse alerta usa `Alert.alert`, que **não faz nada na web**, então no site o sininho não responde ao clique.
- **Notificações rápidas na tela** (`NotificationProvider`): são só avisos de um instante, como "adicionado ao carrinho". Nada fica salvo nem chega depois.
- **Preferências** (Perfil → Notificações): as 6 chaves ficam salvas só no aparelho, e nenhum envio as consulta.

| Chave na tela | O que promete | Existe de verdade? |
|---|---|---|
| Compras e pedidos | Avisos de compra e confirmação | ✅ Parcial: e-mail de confirmação de compra (sempre enviado, ignora a preferência) |
| Atualizações de roteiros comprados | Quando o roteirista atualizar | ❌ Não existe |
| Respostas às suas perguntas | Quando o roteirista responder | ⚠️ Só a linha no banco, que ninguém vê |
| Promoções e novidades | Ofertas e lançamentos | ❌ Não existe (e precisa de consentimento pela lei australiana contra spam) |
| Vendas dos seus roteiros (roteirista) | Quando vender | ❌ Não existe |
| Avaliações recebidas (roteirista) | Quando avaliarem | ❌ Não existe |

## 4. Eventos importantes que hoje não avisam ninguém

Ordenado por impacto no lançamento.

| Prioridade | Evento | Quem precisa saber | Canal sugerido | Onde fica o evento no código |
|---|---|---|---|---|
| 🔴 Alta | **Venda de um roteiro** | Roteirista | E-mail e aviso no app | `payments.ts` → `fulfillItineraryPurchase` |
| 🔴 Alta | **Roteiro aprovado / reprovado** (com o motivo) | Roteirista | E-mail e aviso no app | `admin.ts` → `POST /itineraries/:id/approve` e `/reject` |
| 🔴 Alta | **Roteiro enviado para revisão** | Admin (`vamoappviagens@gmail.com`) | E-mail | `itineraries.ts` → `PATCH /:id/creator/status` (PENDING_REVIEW) |
| 🔴 Alta | **Senha alterada** (alerta de segurança) | Dono da conta | E-mail | `traveler-auth.ts` → `POST /reset-password` |
| 🟡 Média | **Nova pergunta num roteiro** | Roteirista | E-mail (o aviso no app já é gravado) | `questions.ts` |
| 🟡 Média | **Pergunta respondida** | Viajante | E-mail (o aviso no app já é gravado) | `questions.ts` |
| 🟡 Média | **Nova avaliação** | Roteirista | E-mail e aviso no app | `reviews.ts` → `POST /` |
| 🟡 Média | **Cadastro aprovado como roteirista** | Roteirista | E-mail | `admin.ts` → `POST /creators/:id/approve` |
| 🟢 Baixa | **Roteiro comprado foi atualizado** | Compradores | Aviso no app | Edição de roteiro com vendas |
| 🟢 Baixa | **Compra bloqueada e estornada** (roteiro pausado durante o pagamento) | Comprador | E-mail do VAMO explicando (o Stripe manda só o recibo do reembolso) | `payments.ts` |
| 🟢 Depois | Newsletter e promoções | Quem consentiu | Ferramenta própria (Brevo ou Mailchimp) | Precisa de caixa de consentimento no cadastro |

## 5. Recomendações

1. **Antes do lançamento (bloqueia):**
   - **E-mails ao roteirista e ao admin:** criar os e-mails de *venda*, *aprovado/reprovado*, *enviado para revisão* e *senha alterada*. Todos reaproveitam o `mailer.ts` e cada um leva cerca de uma hora.
   - **Sininho:** trocar o alerta falso por nada, ou por uma tela que liste a tabela `notifications`. Hoje ele passa a impressão de que existe um sistema de avisos.
   - **Preferências:** esconder ou marcar como "em breve" as chaves que não existem, para não prometer o que não acontece.
2. **Central de notificações de verdade:** criar a rota `GET /api/notifications`, marcar como lida e mostrar a lista no sininho. Isso aproveita os avisos de perguntas e respostas que já são gravados, e cada evento novo da seção 4 grava ali também.
3. **Respeitar as preferências:** levar as escolhas para o backend e consultá-las antes de enviar. Os e-mails de segurança e de compra são sempre enviados.
4. **Push no celular:** só depois das lojas (task 11).
5. **Idioma:** os e-mails do VAMO estão em português e os do Stripe em inglês. Alinhar na tradução para en-AU (task 9).

## 6. Limites e cuidados atuais

- **Gmail:** cerca de 500 e-mails por dia, remetente "@gmail.com", com risco de cair no spam. Migrar para o Resend com domínio próprio (task 6); é só trocar o transporte no `mailer.ts`.
- **Render:** o envio só funciona em **instância paga**, porque o plano gratuito bloqueia as portas de e-mail. O serviço está em Starter desde 2026-09-24.
- **Nunca** enviar newsletter pelo Gmail, porque há risco de a conta ser bloqueada.
- **Conta de teste em produção:** `vamoappviagens+teste2225@gmail.com` ("Teste E-mail VAMO"), que recebe na caixa do próprio VAMO. Serve para os próximos testes.
