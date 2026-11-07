# Google Play — ficha da loja e formulários

Rascunho para colar no Play Console (textos da loja em inglês, mercado EUA).
Imagens nesta pasta: `icon-512.png` (ícone da loja), `feature-graphic-1024x500.png` (imagem de destaque) e `screenshots/`.

> O ícone é **provisório** (logo branco da VAMO sobre o degradê da marca). O dossiê de marca ainda marca o ícone oficial como "a definir". Para trocar: substitua `apps/mobile/assets/icon.png`, `adaptive-icon.png`, `adaptive-background.png` e `splash-icon.png` e gere um build novo.

---

## Dados do app

| Campo | Valor |
|---|---|
| Nome do app | VAMO: Travel Itineraries |
| Pacote | `app.vamo.travel` (não muda depois de publicado) |
| Categoria | Travel & Local |
| Tags sugeridas | Travel planning, Travel guides |
| E-mail de contato | vamoappviagens@gmail.com |
| Site | https://vamo-ten.vercel.app |
| Política de privacidade | https://vamo-ten.vercel.app/legal/privacy |
| Exclusão de conta (link web) | https://vamo-ten.vercel.app/account/security (entrar → Delete account). No app: Profile → Account → Security. |
| Preço do app | Gratuito (as compras de roteiro são pagas pelo Stripe) |
| Anúncios | Não tem |

## Short description (máx. 80 caracteres)

```
Trip-ready itineraries made by real travelers. Buy once, use on your trip.
```

## Full description (máx. 4.000 caracteres)

```
Plan less, travel more. VAMO is a marketplace of digital travel itineraries created by people who actually took the trip.

Each itinerary is a complete, day-by-day plan you can follow on the road:
• Flights, where to stay and how to get around
• Day-by-day schedule with times and places
• Tours and restaurants worth your time
• Real costs, so you know what to budget
• Local tips and a packing checklist

FIND YOUR NEXT TRIP
Search by destination and trip length. Every itinerary shows the budget style (Budget, Moderate or Luxury), what is included and reviews from travelers who bought it.

MAKE IT YOURS
After you buy, the itinerary is yours. Keep the original and build your own version: move days around, add places and check off your list as you go.

ASK THE CREATOR
Have a question before buying? Ask it on the itinerary page and the creator answers.

TURN YOUR TRIPS INTO INCOME
Been somewhere amazing? Become a creator, publish your itinerary and earn 80% of every sale. Every itinerary is reviewed by the VAMO team before it goes live.

Secure checkout by Stripe. VAMO never sees your full card number.
```

## Classificação de conteúdo (questionário IARC)

- Categoria: "All other app types" (não é jogo).
- Violência, sexo, linguagem, drogas: não.
- Interação entre usuários: **sim** (perguntas públicas nos roteiros e avaliações). Não tem chat privado.
- Compartilha localização do usuário: não.
- Compras digitais: **sim** (roteiros digitais).
- Resultado esperado: classificação livre/Teen. O app é 18+ pelos Termos; em "Público-alvo" marque **18 anos ou mais**.

## Segurança dos dados (Data safety)

Coleta de dados: **sim**. Criptografia em trânsito: **sim** (HTTPS). Pessoa pode pedir exclusão: **sim**.
Nenhum dado é vendido nem usado para publicidade. Não há SDK de analytics nem de anúncios no app.

| Tipo de dado (nome no Console) | Coletado | Compartilhado | Obrigatório | Para quê |
|---|---|---|---|---|
| Personal info → Name | Sim | Não | Sim | Account management, App functionality |
| Personal info → Email address | Sim | Não | Sim | Account management, App functionality, Developer communications |
| Personal info → Phone number | Sim | Não | Opcional | App functionality (contato da compra) |
| Financial info → Purchase history | Sim | Não | Sim | App functionality |
| Financial info → Payment info | **Não** pelo app (o cartão é digitado na página da Stripe) | — | — | — |
| Photos and videos → Photos | Sim (fotos de roteiro e perfil, quem envia) | Não | Opcional | App functionality |
| Files and docs | Sim (comprovantes de viagem dos roteiristas) | Não | Opcional | App functionality |
| App activity → Other user-generated content | Sim (avaliações, perguntas) | Não | Opcional | App functionality |

Observação: o Google não conta como "compartilhamento" o envio a prestadores de serviço que processam dados em nome da VAMO (Stripe, Supabase, Render, Gmail).

## Acesso ao app (para a revisão do Google)

A maior parte do app abre sem login. Para revisar compra e roteiro comprado, o Google pede uma conta de teste:
- Criar uma conta de viajante só para a revisão (e-mail e senha que o Diego define) e informar no Console em "App access".
- Opcional: deixar um roteiro já comprado nessa conta (ou um roteiro grátis) para o revisor ver o conteúdo sem pagar.

## Pagamentos (política do Google Play)

O app vende conteúdo digital (roteiros) com Stripe, fora do Google Play Billing. Nos EUA isso é permitido pelo programa de cobrança alternativa / links externos que veio da decisão Epic × Google. Antes de publicar:
- No Play Console, em **Monetization setup → Alternative billing / External offers**, inscrever o app e conferir a taxa de serviço que o Google cobra sobre essas vendas.
- Limitar a distribuição aos **Estados Unidos** enquanto o programa só valer lá.

## Pendências antes de enviar para revisão

- [ ] Preencher nos textos legais (`packages/shared/legal/index.ts`, `LEGAL_PLACEHOLDERS`): nome legal da empresa, estado e endereço comercial. A política de privacidade publicada não pode ter campos entre colchetes.
- [ ] Confirmar o e-mail da tela "Contact support": hoje é `suporte@vamo.app` (`apps/mobile/app/help/contact-support.tsx`). Se o domínio vamo.app não for da VAMO, trocar por vamoappviagens@gmail.com.
- [ ] Ícone oficial (opcional; o provisório já funciona).

## Estado do teste no Android (2026-11-07)

- Build release local (APK, servidor de produção) compilou e abriu no emulador: home em inglês, sem erro de JavaScript.
- Não testado ainda: login, compra (Stripe abrindo dentro do app e voltando para a confirmação), cadastro de recebimentos (Stripe Connect), roteiro comprado. O emulador deste Mac ficou lento demais (Android 37 sem aceleração gráfica). Próximo passo: gerar um APK de teste pelo EAS (`eas build -p android --profile preview`) e testar num celular Android de verdade.
- Capturas de tela da loja: tirar desse mesmo teste no celular (mínimo 2, proporção até 2:1; as de `docs/marca/assets` são altas demais).
- Build local: o caminho da pasta tem acento ("Códigos") e o empacotador do React Native não acha o `index.ts`. Para build local, copie o projeto para um caminho sem acento (`cp -cR <pasta VAMO> ~/vamo-build.noindex`). O EAS não tem esse problema.
