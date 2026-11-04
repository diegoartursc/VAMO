# Relatório de acesso anônimo — VAMO

Teste executado em 04/11/2026, no ambiente isolado: banco `vamo_audit` com dados fictícios e backend em modo produção. O navegador é o Playwright 1.64 (Chromium), sempre num contexto limpo, sem cookies, sem storage e sem token. A rodada de API usou a mesma configuração.

Os dados pagos e privados do teste levam os marcadores `PAID-SECRET-*` e `PRIVATE-SECRET-*`, e os e-mails terminam em `@audit.vamo.test`. Vazamento é qualquer aparição desses marcadores:

- no HTML da página;
- no texto da tela, conferido a cada quadro, para pegar o que aparece só por um instante antes de um redirecionamento;
- nas respostas da API.

Como reproduzir: veja [README.md](README.md). Os resultados brutos ficam em `tests/security/results/` (fora do Git).

## Resumo

- **52 rotas do app** abertas direto pela URL: **0 vazamentos** (nem no HTML, nem na tela, nem nas respostas da API).
- **284 chamadas diretas à API** sem sessão válida (anônimo, token inválido, forjado sem assinatura, expirado e de outra finalidade): **0 acessos indevidos** no código final.
- O app é uma SPA: a Vercel devolve HTTP 200 com o mesmo `index.html` para qualquer rota. Por isso a proteção avaliada é a dos **dados e das ações**, que fica no backend, e não o status da página.

## Tudo o que um visitante sem login consegue acessar hoje

### Acesso público legítimo

| Recurso | O que expõe | Avaliação |
|---|---|---|
| `GET /api/itineraries` | Catálogo de roteiros ACTIVE: título, capa, descrição, preço, duração, nota, contagens e resumo de custos. Sem dias, dicas, nomes de lugares, links ou arquivos | Legítimo (vitrine). Marcadores pagos ausentes |
| `GET /api/itineraries/featured` | Destaques (mesmos campos do catálogo) | Legítimo |
| `GET /api/itineraries/:id (só ACTIVE)` | Prévia comercial do roteiro. Roteiro pendente, rascunho ou arquivado → 404 | Legítimo. Conteúdo pago ausente |
| `GET /api/creators, /:id, /by-traveler/:id, /recommended` | Perfil público do roteirista: nome, bio, avatar, destinos, nota, nível. Sem e-mail e sem conta Stripe | Legítimo |
| `GET /api/reviews?itineraryId=` | Avaliações visíveis, sem e-mail do autor | Legítimo |
| `GET /api/questions/itinerary/:id` | Perguntas e respostas públicas do roteiro, sem e-mail | Legítimo |
| `GET /api/destinations, /api/rates` | Lista de destinos e câmbio | Legítimo |
| `POST /api/itineraries/:id/share` | Registra um compartilhamento de roteiro ACTIVE e devolve um código de rastreio. Não dá acesso a conteúdo pago (o link abre a prévia pública) | Legítimo. Abuso possível: grava uma linha por pedido sem login, limitada só pelo limite geral por IP (AUD-10, P3) |
| `GET /api/share/:code/resolve` | Redireciona para a página pública do roteiro | Legítimo |
| `POST /api/auth/traveler/register, /login, /forgot-password, /reset-password, /refresh` | Cadastro, login e recuperação de senha. Resposta neutra (não revela se o e-mail existe) e limites de tentativa | Legítimo |
| `POST /api/admin/login` | Login do admin, com limite por IP e por conta | Legítimo |
| `POST /api/payments/webhook` | Só aceita evento com assinatura válida da Stripe; sem assinatura, com segredo errado ou com assinatura antiga (replay) → 400 | Legítimo |
| `Telas públicas do app` | /, /itineraries, /itinerary/:id, /creator/:id, /login, /register, /forgot-password, /reset-password, /legal/*, /about-vamo, /how-it-works, /help, /how-you-get-paid, /verification-explained | Legítimo |

### Acessos indevidos encontrados e corrigidos

| Recurso | O que acontecia | Arquivo | Correção | Reteste |
|---|---|---|---|---|
| `GET /api/itineraries/dashboard/sales` e `/dashboard/reviews` | Respondiam **200** a anônimos e a tokens inválidos ou forjados, com um painel zerado. Não vazava dado, mas a regra era diferente da de `/dashboard/stats` | `apps/backend/src/routes/itineraries.ts` | Exigem sessão: 401 | `AUD-01` em `src/security/phase2-content.test.ts` (falha sem a correção, passa com ela) + matriz da API |

### Acessos indevidos ainda existentes

Nenhum encontrado.

### Não testado

- Rotas dos arquivos de API que **não estão montados** no app (`packages.ts`, `departures.ts`, `flight-quotes.ts`, `agency-documents.ts`, `sales.ts`). Hoje respondem 404, mas é código morto que vale remover (AUD-11).
- `apps/site` (landing e dashboards antigos do site): não houve navegação anônima por tela. O admin foi coberto pelas chamadas à API, porque todas as rotas `/api/admin/*` recusam quem não é admin.

## Rotas do app (navegador anônimo)

| Rota | Esperado | Status HTTP | Para onde foi | Chamadas de API (status) | Dados expostos | Risco |
|---|---|---|---|---|---|---|
| `/` | público | 200 | / | GET /api/itineraries → 200 ×2 | nenhum dado privado | nenhum |
| `/itineraries` | público | 200 | /itineraries | GET /api/creators/recommended → 200; GET /api/itineraries → 200 ×2 | nenhum dado privado | nenhum |
| `/itinerary/:id` | prévia pública | 200 | /itinerary/:id | GET /api/rates → 200; GET /api/itineraries/:id → 200; GET /api/questions/itinerary/:id → 200 | nenhum dado privado | nenhum |
| `/itinerary/:id` | exige login | 200 | fica na tela (sem dados) | GET /api/rates → 200; GET /api/itineraries/:id → 404 | nenhum dado privado | nenhum |
| `/itinerary/:id` | exige login | 200 | fica na tela (sem dados) | GET /api/rates → 200; GET /api/itineraries/:id → 404 | nenhum dado privado | nenhum |
| `/creator/:id` | público | 200 | /creator/:id | GET /api/creators/:id → 200 | nenhum dado privado | nenhum |
| `/packages` | público | 200 | /packages | — | nenhum dado privado | nenhum |
| `/login` | público | 200 | /login | — | nenhum dado privado | nenhum |
| `/register` | público | 200 | /register | — | nenhum dado privado | nenhum |
| `/forgot-password` | público | 200 | /forgot-password | — | nenhum dado privado | nenhum |
| `/reset-password` | público | 200 | /reset-password | — | nenhum dado privado | nenhum |
| `/legal/terms` | público | 200 | /legal/terms | — | nenhum dado privado | nenhum |
| `/legal/privacy` | público | 200 | /legal/privacy | — | nenhum dado privado | nenhum |
| `/about-vamo` | público | 200 | /about-vamo | — | nenhum dado privado | nenhum |
| `/how-it-works` | público | 200 | /how-it-works | — | nenhum dado privado | nenhum |
| `/help` | público | 200 | /help | — | nenhum dado privado | nenhum |
| `/help/contact-support` | público | 200 | /help/contact-support | — | nenhum dado privado | nenhum |
| `/how-you-get-paid` | público | 200 | /how-you-get-paid | — | nenhum dado privado | nenhum |
| `/verification-explained` | público | 200 | /verification-explained | — | nenhum dado privado | nenhum |
| `/cart` | exige login | 200 | fica na tela (sem dados) | — | nenhum dado privado | nenhum |
| `/my-trips` | exige login | 200 | fica na tela (sem dados) | — | nenhum dado privado | nenhum |
| `/profile` | exige login | 200 | fica na tela (sem dados) | — | nenhum dado privado | nenhum |
| `/saved` | exige login | 200 | fica na tela (sem dados) | — | nenhum dado privado | nenhum |
| `/account/notifications` | exige login | 200 | fica na tela (sem dados) | — | nenhum dado privado | nenhum |
| `/account/personal-data` | exige login | 200 | fica na tela (sem dados) | — | nenhum dado privado | nenhum |
| `/account/security` | exige login | 200 | fica na tela (sem dados) | — | nenhum dado privado | nenhum |
| `/purchased-itinerary/:id` | exige login | 200 | fica na tela (sem dados) | — | nenhum dado privado | nenhum |
| `/purchased-itinerary/:id` | exige login | 200 | fica na tela (sem dados) | — | nenhum dado privado | nenhum |
| `/checkout/itinerary-confirm` | exige login | 200 | /login | — | nenhum dado privado | nenhum |
| `/checkout/itinerary-contact` | exige login | 200 | /login | — | nenhum dado privado | nenhum |
| `/checkout/itinerary-payment` | exige login | 200 | /login | — | nenhum dado privado | nenhum |
| `/checkout/contact` | exige login | 200 | fica na tela (sem dados) | GET /api/packages/undefined → 404 | nenhum dado privado | nenhum |
| `/checkout/payment` | exige login | 200 | fica na tela (sem dados) | GET /api/packages/undefined → 404 | nenhum dado privado | nenhum |
| `/booking-confirmed` | exige login | 200 | fica na tela (sem dados) | — | nenhum dado privado | nenhum |
| `/created-itineraries` | exige login | 200 | fica na tela (sem dados) | — | nenhum dado privado | nenhum |
| `/creator-itinerary/:id` | exige login | 200 | fica na tela (sem dados) | — | nenhum dado privado | nenhum |
| `/creator-earnings` | exige login | 200 | fica na tela (sem dados) | GET /api/creators/me/earnings → 401; GET /api/creators/me/stripe/account-status → 401 ×2 | nenhum dado privado | nenhum |
| `/creator-sales` | exige login | 200 | fica na tela (sem dados) | — | nenhum dado privado | nenhum |
| `/creator-reviews` | exige login | 200 | fica na tela (sem dados) | — | nenhum dado privado | nenhum |
| `/creator-questions` | exige login | 200 | /login | — | nenhum dado privado | nenhum |
| `/creator-settings` | exige login | 200 | fica na tela (sem dados) | — | nenhum dado privado | nenhum |
| `/new-itinerary` | exige login | 200 | fica na tela (sem dados) | — | nenhum dado privado | nenhum |
| `/become-creator` | exige login | 200 | fica na tela (sem dados) | — | nenhum dado privado | nenhum |
| `/await-review` | exige login | 200 | fica na tela (sem dados) | — | nenhum dado privado | nenhum |
| `/itinerary-preview` | exige login | 200 | fica na tela (sem dados) | GET /api/rates → 200 | nenhum dado privado | nenhum |
| `/my-questions` | exige login | 200 | /login | — | nenhum dado privado | nenhum |
| `/my-reviews` | exige login | 200 | fica na tela (sem dados) | GET /api/reviews/my → 401 | nenhum dado privado | nenhum |
| `/write-review` | exige login | 200 | /login | — | nenhum dado privado | nenhum |
| `/availability/:id` | exige login | 200 | fica na tela (sem dados) | GET /api/packages/:id → 404 | nenhum dado privado | nenhum |
| `/quote-details/:id` | exige login | 200 | fica na tela (sem dados) | — | nenhum dado privado | nenhum |
| `/purchased-package/:id` | exige login | 200 | fica na tela (sem dados) | — | nenhum dado privado | nenhum |
| `/booking-awaiting-quote` | exige login | 200 | fica na tela (sem dados) | — | nenhum dado privado | nenhum |

As telas privadas que não redirecionam mostram um estado vazio ou um convite para entrar, sem dados: o backend recusa as chamadas (401) ou nem chega a ser chamado. As telas `/checkout/contact`, `/checkout/payment` e `/availability/:id` chamam `/api/packages/...`, uma rota antiga que não existe mais e devolve 404 (código morto no app, AUD-11).

## Chamadas diretas à API sem sessão válida

| Endpoint | Método | Papéis testados | Esperado | Observado |
|---|---|---|---|---|
| `/api/itineraries?limit=50` | GET | anon, expired, garbage | permitir | 200 ✓ |
| `/api/itineraries/featured` | GET | anon | permitir | 200 ✓ |
| `/api/destinations` | GET | anon | permitir | 200 ✓ |
| `/api/creators` | GET | anon | permitir | 200 ✓ |
| `/api/creators/:id` | GET | anon | permitir | 200 ✓ |
| `/api/creators/by-traveler/:id` | GET | anon | permitir | 200 ✓ |
| `/api/creators/recommended` | GET | anon | permitir | 200 ✓ |
| `/api/reviews?itineraryId=:id` | GET | anon | permitir | 200 ✓ |
| `/api/rates` | GET | anon | permitir | 200 ✓ |
| `/api/questions/itinerary/:id` | GET | anon | permitir | 200 ✓ |
| `/api/itineraries/:id` | GET | anon, expired, forgedNoSig, garbage, refreshAsAccess | permitir | 200/404 ✓ |
| `/api/itineraries/:id/purchased` | GET | anon, expired, forgedNoSig, garbage, refreshAsAccess | recusar | 401 ✓ |
| `/api/itineraries/:id/creator` | GET | anon, expired, forgedNoSig, garbage, refreshAsAccess | recusar | 401 ✓ |
| `/api/itineraries/:id` | PUT | anon, expired, forgedNoSig, garbage, refreshAsAccess | recusar | 401 ✓ |
| `/api/itineraries/:id/creator/status` | PATCH | anon, expired, forgedNoSig, garbage, refreshAsAccess | recusar | 400 ✓ |
| `/api/itineraries/:id` | DELETE | anon, expired, forgedNoSig, garbage, refreshAsAccess | recusar | 401 ✓ |
| `/api/itineraries` | POST | anon, expired, forgedNoSig, garbage, refreshAsAccess | recusar | 401 ✓ |
| `/api/itineraries/:id/purchase` | POST | anon, expired, forgedNoSig, garbage, refreshAsAccess | recusar | 401 ✓ |
| `/api/itineraries/:id/share` | POST | anon, expired, forgedNoSig, garbage, refreshAsAccess | permitir | 201/403 ✓ |
| `/api/itineraries/dashboard/stats` | GET | anon, expired, forgedNoSig, garbage, refreshAsAccess | recusar | 401 ✓ |
| `/api/itineraries/dashboard/sales` | GET | anon, expired, forgedNoSig, garbage, refreshAsAccess | recusar | 401 ✓ |
| `/api/itineraries/dashboard/reviews` | GET | anon, expired, forgedNoSig, garbage, refreshAsAccess | recusar | 401 ✓ |
| `/api/creators/me/earnings` | GET | anon, expired, forgedNoSig, garbage, refreshAsAccess | recusar | 401 ✓ |
| `/api/creators/me/stripe/account-status` | GET | anon, expired, forgedNoSig, garbage, refreshAsAccess | recusar | 401 ✓ |
| `/api/creators/me/stripe/onboarding-link` | POST | anon, expired, forgedNoSig, garbage, refreshAsAccess | recusar | 401 ✓ |
| `/api/auth/traveler/me` | GET | anon, expired, forgedNoSig, garbage, refreshAsAccess | recusar | 401 ✓ |
| `/api/auth/traveler/passport-stats` | GET | anon, expired, forgedNoSig, garbage, refreshAsAccess | recusar | 401 ✓ |
| `/api/my-trips` | GET | anon, expired, forgedNoSig, garbage, refreshAsAccess | recusar | 401 ✓ |
| `/api/saved-items` | GET | anon, expired, forgedNoSig, garbage, refreshAsAccess | recusar | 401 ✓ |
| `/api/reviews/my` | GET | anon, expired, forgedNoSig, garbage, refreshAsAccess | recusar | 401 ✓ |
| `/api/questions/mine` | GET | anon, expired, forgedNoSig, garbage, refreshAsAccess | recusar | 401 ✓ |
| `/api/questions/creator/mine` | GET | anon, expired, forgedNoSig, garbage, refreshAsAccess | recusar | 401 ✓ |
| `/api/trip-center/:id/checklist` | GET | anon, expired, forgedNoSig, garbage, refreshAsAccess | recusar | 401 ✓ |
| `/api/trip-center/:id/files` | GET | anon, expired, forgedNoSig, garbage, refreshAsAccess | recusar | 401 ✓ |
| `/api/trip-center/files/:id/content` | GET | anon, expired, forgedNoSig, garbage, refreshAsAccess | recusar | 401 ✓ |
| `/api/trip-center/:id/checklist/:id` | PATCH | anon, expired, forgedNoSig, garbage, refreshAsAccess | recusar | 401 ✓ |
| `/api/trip-center/:id/checklist/:id` | DELETE | anon, expired, forgedNoSig, garbage, refreshAsAccess | recusar | 401 ✓ |
| `/api/trip-center/:id/files/:id` | DELETE | anon, expired, forgedNoSig, garbage, refreshAsAccess | recusar | 401 ✓ |
| `/api/route-customization/:id/customization` | GET | anon, expired, forgedNoSig, garbage, refreshAsAccess | recusar | 401 ✓ |
| `/api/route-customization/:id/snapshot` | GET | anon, expired, forgedNoSig, garbage, refreshAsAccess | recusar | 401 ✓ |
| `/api/route-customization/:id/customization` | PUT | anon, expired, forgedNoSig, garbage, refreshAsAccess | recusar | 401 ✓ |
| `/api/reviews/:id` | PUT | anon, expired, forgedNoSig, garbage, refreshAsAccess | recusar | 401 ✓ |
| `/api/reviews` | POST | anon, expired, forgedNoSig, garbage, refreshAsAccess | recusar | 401 ✓ |
| `/api/private-docs/:id/proof.pdf` | GET | anon | recusar | 401 ✓ |
| `/api/private-docs/:id/proof.pdf?token=<token-sessão>` | GET | anon | recusar | 401 ✓ |
| `/api/uploads` | POST | anon, expired, forgedNoSig, garbage, refreshAsAccess | recusar | 401 ✓ |
| `/api/payments/checkout-session` | POST | anon, expired, forgedNoSig, garbage, refreshAsAccess | recusar | 401 ✓ |
| `/api/payments/checkout-session/cs_test_x` | GET | anon, expired, forgedNoSig, garbage, refreshAsAccess | recusar | 401 ✓ |
| `/api/admin/travelers` | GET | anon, expired, forgedNoSig, garbage, refreshAsAccess | recusar | 401 ✓ |
| `/api/admin/creators/pending` | GET | anon, expired, forgedNoSig, garbage, refreshAsAccess | recusar | 401 ✓ |
| `/api/admin/reviews` | GET | anon, expired, forgedNoSig, garbage, refreshAsAccess | recusar | 401 ✓ |
| `/api/admin/stats` | GET | anon, expired, forgedNoSig, garbage, refreshAsAccess | recusar | 401 ✓ |
| `/api/admin/sales` | GET | anon, expired, forgedNoSig, garbage, refreshAsAccess | recusar | 401 ✓ |
| `/api/admin/pending` | GET | anon, expired, forgedNoSig, garbage, refreshAsAccess | recusar | 401 ✓ |
| `/api/admin/all` | GET | anon, expired, forgedNoSig, garbage, refreshAsAccess | recusar | 401 ✓ |
| `/api/admin/itineraries/:id` | GET | anon, expired, forgedNoSig, garbage, refreshAsAccess | recusar | 401 ✓ |
| `/api/admin/itineraries/:id/cost-proofs` | GET | anon, expired, forgedNoSig, garbage, refreshAsAccess | recusar | 401 ✓ |
| `/api/admin/audit-logs` | GET | anon, expired, forgedNoSig, garbage, refreshAsAccess | recusar | 401 ✓ |
| `/api/admin/audit-logs/stats/summary` | GET | anon, expired, forgedNoSig, garbage, refreshAsAccess | recusar | 401 ✓ |
| `/api/admin/itineraries/:id/approve` | POST | anon, expired, forgedNoSig, garbage, refreshAsAccess | recusar | 401 ✓ |
| `/api/admin/itineraries/:id/reject` | POST | anon, expired, forgedNoSig, garbage, refreshAsAccess | recusar | 401 ✓ |
| `/api/admin/creators/:id/approve` | POST | anon, expired, forgedNoSig, garbage, refreshAsAccess | recusar | 401 ✓ |
| `/api/admin/reviews/:id/hide` | POST | anon, expired, forgedNoSig, garbage, refreshAsAccess | recusar | 401 ✓ |
| `/api/admin/itineraries/:id/cost-proofs/decide` | POST | anon, expired, forgedNoSig, garbage, refreshAsAccess | recusar | 401 ✓ |
| `/api/rates` | PUT | anon, expired, forgedNoSig, garbage, refreshAsAccess | recusar | 401 ✓ |
| `/api/admin/seed` | POST | anon | recusar | 403 ✓ |

Legenda dos papéis: `anon` (sem token), `garbage` (texto qualquer), `forgedNoSig` (JWT com `alg: none` dizendo ser outro usuário), `expired` (token legítimo vencido), `refreshAsAccess` (token de renovação usado como token de acesso).
