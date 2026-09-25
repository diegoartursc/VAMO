# E-mails e notificações do VAMO

> Estado em 2026-09-24, depois da entrega "todos os e-mails transacionais".
> Fonte da verdade: `apps/backend/src/lib/mailer.ts` (único ponto de envio) e as rotas citadas abaixo.

## Resumo

| Canal | Situação |
|---|---|
| **E-mail do VAMO** (Gmail `vamoappviagens@gmail.com`, SMTP) | ✅ **13 e-mails** implementados e testados localmente, com proteção contra envio duplicado. Envio em produção funcionando (Render Starter). |
| **E-mails do Stripe** (recibos) | ✅ Configurados. Só são enviados no **modo real**; no modo teste o Stripe não manda recibo, e isso não é bug. |
| **Avisos dentro do app** (tabela `notifications`) | ⚠️ Gravados em 3 eventos (nova pergunta, pergunta respondida, nova avaliação), mas **nenhuma tela mostra** ainda. |
| **Sininho da Home** | ✅ Honesto: abre o modal do VAMO dizendo que os avisos importantes chegam por e-mail e que a central no app vem em breve. Antes era falso e não funcionava na web. |
| **Preferências** (Perfil → Notificações) | ✅ Honesto: mostra o que chega sempre por e-mail e marca as opções como "em breve", porque ainda não controlam nenhum envio. |
| **Push no celular** | ❌ Não existe (depende das lojas, task 11). |

## Tabela completa de e-mails

"Local ✅" = testado em banco isolado com as rotas reais (33 verificações). "Prod ✅" = testado no Render com entrega real (ver seção "Testes em produção").

| # | Evento | Destinatário | Gatilho (rota) | Função do mailer | Assunto | Proteção contra duplicado | Testado |
|---|---|---|---|---|---|---|---|
| A | Cadastro | Viajante | `POST /api/auth/traveler/register` | `sendWelcomeEmail` | Bem-vindo(a) ao VAMO ✈️ | 1 por conta criada | Local ✅ |
| B | Compra confirmada | Comprador | `payments.ts` → `fulfillItineraryPurchase` (webhook **ou** tela de retorno) | `sendPurchaseConfirmationEmail` | Seu roteiro está liberado: *título* | Só quem cria a `ItinerarySale` envia (índice único venda+viajante) | Local ✅ (3 webhooks, 2 simultâneos → 1 e-mail) |
| C | Esqueci minha senha | Dono da conta | `POST /api/auth/traveler/forgot-password` | `sendPasswordResetEmail` | Redefina sua senha no VAMO | No máximo 1 por minuto por conta | Local ✅ · Prod ✅ (entregue em 2026-09-24) |
| D | Senha alterada | Dono da conta | `POST /api/auth/traveler/reset-password` (depois de gravar) | `sendPasswordChangedEmail` | Sua senha do VAMO foi alterada | 1 por token consumido (o token é apagado em transação) | Local ✅ (mesmo link 2x em paralelo → 1 e-mail) |
| E | Venda realizada | Roteirista | `payments.ts` → `fulfillItineraryPurchase` (mesmo evento do B) | `sendCreatorSaleEmail` | Você vendeu: *título* | Igual ao B | Local ✅ |
| F | Roteiro aprovado | Roteirista | `POST /api/admin/itineraries/:id/approve` | `sendItineraryApprovedEmail` | Roteiro aprovado: *título* | Transição atômica PENDING_REVIEW → APPROVED | Local ✅ (2 aprovações simultâneas → 1 e-mail) |
| G | Roteiro reprovado | Roteirista | `POST /api/admin/itineraries/:id/reject` | `sendItineraryRejectedEmail` | Roteiro precisa de ajustes: *título* | Transição atômica PENDING_REVIEW → REJECTED | Local ✅ |
| H | Roteiro enviado para revisão | Admin (`ADMIN_NOTIFICATION_EMAIL`, senão `SMTP_USER`) | `PATCH /api/itineraries/:id/creator/status` → PENDING_REVIEW | `sendItinerarySubmittedForReviewEmail` | [Admin] Roteiro para revisão: *título* | Só quando o status anterior não era PENDING_REVIEW | Local ✅ (repetir não duplica; reenvio após reprovação avisa de novo) |
| I | Nova pergunta | Roteirista | `POST /api/questions` | `sendNewQuestionEmail` | Nova pergunta: *título* | 1 por pergunta criada | Local ✅ |
| J | Pergunta respondida | Viajante que perguntou | `POST /api/questions/:id/answer` | `sendQuestionAnsweredEmail` | Sua pergunta foi respondida: *título* | 1 por resposta criada (a rota recusa 2ª resposta com 409) | Local ✅ |
| K | Nova avaliação | Roteirista | `POST /api/reviews` (**não** no `PUT`, que é edição) | `sendNewReviewEmail` | Nova avaliação (*n*/5): *título* | 1 por avaliação criada | Local ✅ (editar não envia) |
| L | Roteirista aprovado | Roteirista | `POST /api/admin/creators/:id/approve` | `sendCreatorApprovedEmail` | Seu perfil de roteirista foi aprovado | Só na transição atômica BASIC → TRUSTED ("Roteirista Recomendado" no app) | Local ✅ |
| M | Estorno automático | Comprador | `payments.ts` → compra bloqueada (roteiro pausado ou arquivado durante o pagamento) | `sendPurchaseAutoRefundEmail` | Estorno do seu pagamento: *título* | Só se o estorno foi criado **agora** (`newlyCreated`: listagem prévia + idempotency key + cabeçalho `Idempotent-Replayed`) | Local ✅ com Stripe **modo teste real** (3 webhooks, 2 simultâneos → 1 estorno, 1 e-mail) |

**O que cada e-mail diz** (todos em português, com layout do VAMO, versão texto e links via `APP_BASE_URL`):
- **A · Boas-vindas:** conta pronta; botão *Explorar roteiros*.
- **B · Compra:** título, valor pago (ex.: A$29.90); fica em Meus Roteiros; o recibo vem da Stripe. Botão *Abrir meu roteiro*.
- **C · Recuperação:** link de 1 hora, uso único, com a URL também em texto.
- **D · Senha alterada:** data e hora (horário de Sydney); "se não foi você, fale com o suporte imediatamente". Nunca inclui a senha.
- **E · Venda:** título, valor da venda, comissão VAMO (15%, a registrada na venda) e valor líquido estimado. Botão *Ver minhas vendas*.
- **F · Aprovado:** avisa que **aprovado ainda não é publicado** e orienta tocar em "Publicar roteiro". Botão *Abrir e publicar*.
- **G · Reprovado:** motivo real do admin (`approvalNote`), orientação para corrigir e reenviar. Botão *Corrigir roteiro*.
- **H · Admin:** roteirista, título, destino, duração, preço e ID. Link para o painel se `ADMIN_APP_URL` estiver definido; senão, o caminho "painel admin → Roteiros → Em análise".
- **I · Nova pergunta:** título, pergunta, primeiro nome de quem perguntou. Botão *Responder pergunta*.
- **J · Respondida:** título, pergunta original e resposta. Botão *Ver minhas perguntas*.
- **K · Avaliação:** título, estrelas (*n*/5) e comentário. Botão *Ver avaliações*.
- **L · Roteirista aprovado:** novo nível "Roteirista Recomendado" com selo. Botão *Abrir Portal do Roteirista*.
- **M · Estorno:** pagamento recebido, roteiro ficou indisponível, estorno integral já iniciado, prazo depende da operadora (normalmente 5 a 10 dias úteis).

**Regras gerais**
- A ação principal sempre é gravada **antes** do envio, e nenhuma função do mailer lança erro: falha de Gmail vira log `[mailer] falha…` e a venda, aprovação ou resposta segue normalmente.
- Tudo que vem do usuário (títulos, perguntas, respostas, motivos, comentários) é escapado no HTML.
- E-mails transacionais e de segurança **não dependem** das preferências do app, e isso é intencional.

## E-mails do Stripe (responsabilidade da Stripe)

| E-mail | Quando | Para quem | Observação |
|---|---|---|---|
| Recibo de pagamento | Pagamento concluído | E-mail preenchido no checkout (o da conta VAMO) | Em inglês, com a marca do VAMO. **Só no modo real.** |
| Recibo de reembolso | Reembolso (manual ou o automático do caso M) | Comprador | **Só no modo real.** |

Um comprador de roteiro pago recebe **dois** e-mails de propósito: o do VAMO ("Seu roteiro está liberado") e o recibo financeiro da Stripe. Na ativação da conta, o e-mail de suporte da Stripe deve ser `vamoappviagens@gmail.com`.

**Stripe Connect / repasses:** ainda não há e-mails do VAMO para payout, falha de payout, pedido de documentos ou disputa. A Stripe manda os dela. Auditar quando os repasses estiverem implementados (task 5.3).

## Fora do escopo, de propósito

- **Rotas legadas de agência** (`packages`, `departures`, `flight-quotes`, `agency-documents`, `sales`): não estão montadas em `index.ts`, então não recebem e-mail.
- **Compra legada** `POST /api/itineraries/:id/purchase`: desativada em produção (`ALLOW_DEMO_PURCHASES=false`) e sem e-mail.
- **Decisão de comprovante de custo** (`/admin/itineraries/:id/cost-proofs/decide`): sem e-mail por comprovante, para evitar spam. O que importa é aprovado ou reprovado, e o motivo vai no e-mail G.
- **Newsletter e promoções:** exigem consentimento pela lei australiana contra spam e uma ferramenta própria (Brevo ou Mailchimp). Nunca pelo Gmail.

## Pendências e riscos conhecidos

- **Avisos no app sem tela:** criar `GET /api/notifications` + central no sininho (os avisos I, J e K já são gravados).
- **Duplicata de dados (não de e-mail):** `faq_answers` e `reviews` não têm índice único. Duas chamadas simultâneas poderiam gravar 2 respostas ou 2 avaliações e, portanto, 2 e-mails. Recomendado: índice único em `faq_answers(questionId)` e `reviews(travelerId, itineraryId)`, com migration depois de conferir os dados atuais.
- **Painel admin não publicado:** o site (`apps/site`) não está na Vercel. Quando estiver, definir `ADMIN_APP_URL` no Render para o e-mail H ter o link direto.
- **Idioma:** e-mails do VAMO em português; recibos da Stripe em inglês. Alinhar na task 9 (en-AU).
- **Gmail:** cerca de 500 e-mails por dia e remetente @gmail.com. Migrar para o Resend com domínio próprio (task 6), trocando só `getTransporter()`.

## Variáveis de ambiente

| Variável | Obrigatória | Uso |
|---|---|---|
| `SMTP_USER` / `SMTP_PASS` | Sim | Conta Gmail e senha de app. Sem elas, nada é enviado (só log). |
| `APP_BASE_URL` | Sim | Base de todos os links (`https://vamo-ten.vercel.app` em produção). |
| `MAIL_FROM` | Não | Remetente; padrão `VAMO <SMTP_USER>`. |
| `ADMIN_NOTIFICATION_EMAIL` | Não | Destino do e-mail H; padrão `SMTP_USER` (`vamoappviagens@gmail.com`). |
| `ADMIN_APP_URL` | Não | Base do painel admin (site) para o link do e-mail H. |

## Testes

- **Permanentes** (rodam sem banco): `cd apps/backend && npx tsx --test src/lib/mailer.test.ts src/routes/payments.refund.test.ts`.
- **Ponta a ponta local:** 33 verificações com as rotas reais, banco Postgres isolado (apagado depois) e Stripe em modo teste para o estorno. Cobriu os e-mails A a M e os 6 cenários de duplicação:
  1. Webhook e retorno do pagamento ao mesmo tempo.
  2. Aprovar de novo.
  3. Reprovar de novo.
  4. Enviar para revisão de novo.
  5. Webhook repetido depois do estorno.
  6. Editar avaliação.
- **Testes em produção:** ver a seção abaixo (atualizada após o deploy).

## Testes em produção

Envio real pelo Render Starter:
- **Infraestrutura:** e-mail de teste para anapaulaabeckenkamp@gmail.com aceito pelo Gmail (`250 OK`).
- **Recuperação de senha (C):** entregue na caixa do VAMO em 2026-09-24.
