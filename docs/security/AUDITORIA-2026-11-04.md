# Auditoria de segurança, invasão controlada e escalabilidade — VAMO

- **Data:** 04/11/2026
- **Branch:** `security-audit-2026-11-04`, criada a partir de `main` em `439613a`. A `main` não foi alterada.
- **Ambiente:** tudo foi testado num ambiente **isolado** no Mac:
  - Postgres local com os bancos `vamo_audit` e `vamo_audit_scale`, só com dados fictícios;
  - backend sem o `.env` real e com a rede externa bloqueada;
  - Stripe com chave falsa e eventos assinados localmente.
- **O que tocou a produção:** só leituras, e todas autorizadas:
  - permissões e advisors do Supabase;
  - cabeçalhos HTTP do app, do admin e da API;
  - contador de limite da API (8 pedidos GET).
- **Nada foi escrito na produção** e nenhum teste de carga rodou contra ela.
- **Como reproduzir:** [README.md](README.md). Acesso anônimo detalhado: [anonymous-access-report.md](anonymous-access-report.md). Carga: [../performance/carga-2026-11-04.md](../performance/carga-2026-11-04.md).

## Arquitetura real (Etapa 1)

| Parte | Tecnologia | Onde | Autenticação |
|---|---|---|---|
| App do viajante e do roteirista | Expo / React Native Web (SPA) | Vercel (`vamo-ten.vercel.app`) | JWT no `Authorization: Bearer`. No web fica no `localStorage`; no celular, no SecureStore |
| Painel admin | Next.js (`apps/site/admin`) | Vercel (`vamo-admin-six.vercel.app`) | JWT de admin no `localStorage` |
| API | Express + Prisma | Render Starter, atrás da Cloudflare | Middleware próprio. Tokens HS256 com chave derivada por finalidade (`access`, `refresh`, `file`, `doc`, `admin`), checando `iss`, `aud`, `typ` e `exp`. Sessões no banco, revogáveis |
| Banco | Postgres | Supabase (pooler de sessão) | Só o backend acessa, com o papel `postgres` |
| Arquivos | Supabase Storage (bucket público de mídia) + tabela `private_documents` no banco para comprovantes | Supabase | Upload só pelo backend (service role). Comprovantes por link assinado de 30 min |
| Pagamentos | Stripe Checkout hospedado + webhook assinado + Connect (repasses) | Stripe | Webhook com assinatura obrigatória |

**Como o Supabase é usado:** só como Postgres e Storage. **Nenhum frontend usa o Supabase direto**, e não existe chave `anon` nem `publishable` no app (conferido no código e no bundle gerado). Toda autorização acontece no backend. A RLS é uma segunda trava (ver C).

**Superfície de ataque:**

- **API:**
  - 94 rotas montadas;
  - 5 arquivos de rotas não montados (código morto, AUD-11);
  - `/uploads` estático;
  - `/health`;
  - webhook.
- **Telas:** 52 no app.
- **Admin:** 20 rotas em `/api/admin/*`, mais 3 de auditoria.
- **Escrita pública sem login:** cadastro, login, recuperação de senha, compartilhamento e webhook.

## A. Vulnerabilidades

Severidade: P0 crítico · P1 alto · P2 médio · P3 melhoria.

| ID | Componente | Falha | Sev. | Evidência | Correção | Reteste | Status |
|---|---|---|---|---|---|---|---|
| AUD-01 | API, painel do roteirista | `/dashboard/sales` e `/dashboard/reviews` respondiam 200 (painel zerado) a anônimos e a tokens inválidos ou forjados. Não vazava dado | P3 | Matriz da API: 10 chamadas indevidas | Exigem sessão (401), como `/dashboard/stats` | Teste `AUD-01` falha sem a correção e passa com ela; matriz com 0 problemas | **Corrigido** |
| AUD-02 | API, tratador de erros | Corpo grande demais, JSON inválido e origem recusada pelo CORS respondiam **500** e poluíam o log | P3 | `abuse.mjs`: corpo de 2 MB → 500; CORS → 500 | 413, 400 e 403 | Teste `AUD-02` (falha → passa); `abuse.mjs` 22/22 | **Corrigido** |
| AUD-03 | API em produção (Render + Cloudflare) | O app usava o **IP da Cloudflare** e não o do visitante. Com o mesmo IP de origem, o contador de limite oscilava (99, 98, 99, 98…). Efeitos: os limites por IP (geral, login, cadastro) eram divididos entre visitantes diferentes e mais fracos contra ataque; e o limite geral de **100 pedidos a cada 15 min** era baixo para a SPA | P2 | 8 GETs de leitura em produção com cabeçalhos `ratelimit-remaining` (anotados no relatório) | `TRUST_PROXY_HOPS` configurável (o padrão continua 1) e `RATE_LIMIT_MAX` (padrão 300) | Teste `AUD-03` (falha → passa): o limite segue o visitante e um `X-Forwarded-For` forjado não troca o IP | **Corrigido no código. Pendente:** colocar `TRUST_PROXY_HOPS=2` no Render e conferir (passo a passo no README) |
| AUD-04 | App e admin na Vercel | Sem `X-Frame-Options` ou `frame-ancestors`, sem `nosniff` e sem `Referrer-Policy`. O admin podia ser embutido em outro site (clickjacking) | P2 | `curl -I` em produção: só HSTS | `vercel.json` (app) e `apps/site/vercel.json` (admin) com os cabeçalhos; admin com `noindex` | Só depois do deploy (a Vercel aplica na publicação) | **Corrigido na configuração. Pendente:** deploy e conferência |
| AUD-05 | API, catálogo | `GET /api/itineraries` sem paginação; `limit` ignorado. Com 7.000 roteiros: 9,3 MB e a CPU travada | P3 | k6: degradação a partir de 10 VUs (catálogo com p95 de 1,8 s, e as outras rotas esperando na fila) | Cache em memória de 30 s, guardando o JSON pronto e invalidado em qualquer escrita. `/featured` limita `limit` a 100 | k6: p95 de 1.545 → 68 ms com 20 VUs; vazão de 99 → 197 pedidos/s com 100 VUs; testes `AUD-P3` | **Mitigado. Pendente:** paginação no servidor e no app antes de ~500 roteiros |
| AUD-06 | Banco | Sem índice nas chaves estrangeiras mais consultadas (dias, atividades, imagens, vendas por viajante, avaliações, roteiros por autor, perguntas) | P3 | `EXPLAIN ANALYZE`: atividades 18 ms (busca sequencial em 300 mil linhas) | Migration aditiva `20261104120000_audit_fk_indexes` com 7 índices | Atividades 0,09 ms, dias 0,08 ms, vendas 0,04 ms | **Corrigido.** Entra em produção no próximo deploy (migration automática) |
| AUD-07 | App, tela inicial | Chama `GET /api/itineraries` 2 vezes por visita | P3 | Playwright: `/` e `/itineraries` | O cache absorve o custo | — | **Aberto (baixo)** |
| AUD-08 | Supabase | `anon` e `authenticated` têm permissão total (GRANT ALL) nas 45 tabelas. **Não expõe nada**: todas têm RLS ligado e nenhuma policy (nega tudo) | P3 | Consulta `has_table_privilege` + advisors | Script pronto: `docs/security/sql/revoke-anon-grants.sql` | — | **Pendente de aprovação** |
| AUD-09 | Supabase Storage | Bucket `vamo-uploads` sem limite de tamanho nem de tipo no próprio Storage. Hoje só o backend impõe, porque o upload só acontece pelo backend | P3 | `storage.buckets` | No mesmo script, alinhado ao backend (100 MB, mesma lista de tipos) | — | **Pendente de aprovação** |
| AUD-10 | API, compartilhamento | `POST /itineraries/:id/share` sem login grava uma linha por pedido (só para roteiro publicado). Limitado só pelo limite geral por IP | P3 | Matriz: 201 para anônimo | — | — | **Aberto (baixo):** limite próprio por IP |
| AUD-11 | API e app | Código morto: 5 arquivos de rota não montados (`packages`, `departures`, `flight-quotes`, `agency-documents`, `sales`) e telas do app chamando `/api/packages/undefined` (404) | P3 | Inventário + Playwright | — | — | **Aberto (limpeza)** |
| AUD-12 | App web e admin | Token de sessão no `localStorage`, sem CSP de scripts. Uma falha de XSS levaria a sessão. Nenhum XSS encontrado: zero `dangerouslySetInnerHTML`, `innerHTML` ou `eval`, e o React escapa o texto | P2 | Revisão de código | — | — | **Aberto (já conhecido, NEW-07)** |
| AUD-OBS | API | Sem registro de pedidos lentos e sem id de correlação | P3 | — | Log JSON `slow_request` acima de `SLOW_REQUEST_MS` (1 s), sem dado pessoal; `X-Request-Id` em toda resposta | Teste `AUD-OBS` | **Corrigido.** Alerta automático: ver F |

**Testado e sem falha** (o mecanismo funciona, comprovado por teste):

- **Autorização entre contas (BOLA/IDOR):** 439 chamadas, 0 problemas. Papéis testados: anônimo, token inválido, token forjado com `alg: none`, expirado, token de renovação usado como acesso, token de admin em rota de viajante, comprador A/B, roteirista A/B, moderador e admin. Cobre:
  - roteiro comprado de outro;
  - roteiro pendente ou rascunho de outro;
  - comprado e depois arquivado (o comprador continua com acesso; os outros não);
  - extrato e vendas de outro roteirista;
  - checklist, arquivos e personalização de outro viajante;
  - editar, excluir e mudar status de roteiro alheio;
  - todas as rotas admin com não-admin;
  - criação de admin pelo `seed`.
- **Campos extras / mass assignment:** 11/11. O dono não consegue:
  - se dar destaque;
  - trocar o dono, a nota, os contadores ou o aprovador;
  - publicar ou aprovar sozinho;
  - virar admin ou roteirista pelo perfil;
  - trocar e-mail ou senha pelo perfil;
  - perguntar ou avaliar em nome de outro;
  - dar nota fora de 1 a 5.
  - O `qualityScore` é recalculado pelo servidor.
- **Abuso:** 22/22.
  - Upload disfarçado (HTML ou SVG como JPG, HTML, PDF falso) → 415.
  - 5 variações de travessia de caminho em `/uploads` → 404.
  - Força bruta no login bloqueada por IP (11ª tentativa) e por conta (21ª, mesmo trocando de IP). No admin, por conta (21ª).
  - "Esqueci a senha" e o login não revelam se o e-mail existe.
  - Webhook sem assinatura, com segredo errado ou com assinatura antiga (replay) → 400.
  - Corpo gigante → 413.
  - Cabeçalhos do helmet presentes; CORS recusa origem desconhecida.
  - Logout derruba o token na hora: `/me` → 401, refresh → 401.
- **Pagamento:**
  - O preço sai do banco; o cliente manda só o `itineraryId`.
  - A compra é ligada ao comprador do token.
  - O conteúdo só é liberado pelo webhook assinado.
  - Idempotência, estorno e disputa estão cobertos pelos testes das fases 3 e 5 (incluídos nos 145).
  - Nenhum pagamento real: Stripe falsa no ambiente isolado.
- **SQL injection:** só Prisma parametrizado; zero `$queryRawUnsafe` ou `$executeRawUnsafe`.
- **Segredos no cliente:** o bundle web gerado não tem `sk_`, `whsec_`, `service_role`, `sb_secret_` nem JWT de serviço. Não há source map publicado. Nos arquivos versionados há só o `.env.example`, com valores vazios.

## B. Acesso anônimo

Detalhe completo, rota por rota: [anonymous-access-report.md](anonymous-access-report.md).

- **52 telas** abertas direto pela URL, num navegador limpo: **0 vazamentos** de conteúdo pago, dado privado ou e-mail, nem no HTML, nem na tela (inclusive no instante antes de redirecionar), nem nas respostas da API.
- **Acesso público legítimo:**
  - catálogo e destaques (sem conteúdo pago);
  - prévia de roteiro publicado (pendente, rascunho e arquivado dão 404);
  - perfis públicos de roteirista (sem e-mail nem conta Stripe);
  - avaliações e perguntas públicas;
  - destinos e câmbio;
  - cadastro, login e recuperação de senha;
  - compartilhamento de roteiro publicado;
  - webhook assinado;
  - páginas institucionais.
- **Acesso indevido corrigido:** AUD-01.
- **Acesso indevido ainda existente:** nenhum.
- **Não testado:** as rotas dos 5 arquivos de API não montados (respondem 404 hoje) e a navegação anônima nas telas antigas do `apps/site` fora do admin.

## C. Supabase e banco (produção, só leitura)

| Item | Situação | Efeito real |
|---|---|---|
| Tabelas expostas pela Data API (schema `public`) | 45 tabelas | — |
| RLS | **Ligado em 45 de 45** | Sem policy = ninguém lê nem escreve pela Data API |
| Policies | 0 | Negação por padrão (correto, porque só o backend acessa) |
| Permissões `anon` / `authenticated` | GRANT ALL nas 45 (padrão do Supabase) | Hoje bloqueadas pela RLS. Retirar como segunda trava (AUD-08) |
| Funções no `public` (`SECURITY DEFINER` / RPC) | Nenhuma | — |
| Views | Nenhuma | — |
| Storage | 1 bucket público (`vamo-uploads`, mídia), sem policies em `storage.objects` | Leitura por URL pública (intencional para imagens). Listar e enviar só com service role. Sem limite de tamanho ou tipo no bucket (AUD-09) |
| Comprovantes | Tabela `private_documents` (RLS ligado), servidos por link assinado de 30 min | Os 13 comprovantes antigos já saíram do bucket público em 04/11 |
| Chaves | `service_role` só no Render. Nenhuma chave do Supabase no app | Correto |
| Advisor de segurança | Só avisos "RLS sem policy" (nível INFO), esperados neste desenho | — |

Uma revisão que vale registrar: o backend usa o papel `postgres`, que ignora a RLS. **Toda a proteção dos dados depende do backend.** Por isso a matriz de autorização (A) é a prova principal, e foi feita com chamadas reais, não por leitura de código.

**JWT e sessão:**

- algoritmo fixo HS256;
- `iss`, `aud`, `typ` e `exp` verificados;
- chave diferente por finalidade;
- token `alg: none` recusado;
- token de renovação não serve como acesso;
- o logout revoga a sessão na hora;
- a renovação gira a cada uso e detecta reuso;
- nenhuma claim do cliente decide permissão (o papel de admin é conferido no banco a cada pedido).

**CSRF:** não se aplica. A autenticação é por cabeçalho `Authorization`, não por cookie.

## D. Performance

Resumo abaixo. Detalhe e premissas em [../performance/carga-2026-11-04.md](../performance/carga-2026-11-04.md). Os números são do Mac local, com 7.000 roteiros publicados; o Render tem menos CPU.

| Endpoint | VUs | Pedidos/s (total) | p50 | p95 | p99 | Erros | Gargalo | Resultado |
|---|---|---|---|---|---|---|---|---|
| Catálogo (antes) | 20 | 29,5 | — | 2.345 ms | — | 0% | CPU: monta e converte 9,3 MB a cada pedido; o resto fica na fila | ✗ meta |
| Catálogo (depois) | 20 | 72,1 | — | 101 ms | — | 0% | — | ✓ |
| Catálogo (depois) | 100 | 197,4 | — | 10.082 ms | — | 0% | Tamanho da resposta (9,3 MB); precisa de paginação | ✗ (com 7.000 roteiros) |
| Detalhe do roteiro (antes → depois) | 50 | 36,5 → 154,6 | — | 3.009 → 166 ms | — | 0% | Busca sequencial em dias e atividades + fila de CPU | ✓ depois |
| Roteiro comprado (antes → depois) | 50 | — | — | 3.798 → 164 ms | — | 0% | Idem | ✓ depois |
| Minhas viagens (antes → depois) | 50 | — | — | 5.143 → 197 ms | — | 0% | Sem índice em vendas por viajante + fila | ✓ depois |
| **Geral (depois)** | **100** | **197,4** | — | **480 ms** | — | **0%** | Catálogo grande | **✓ meta de 1 s no geral** |

Em todos os cenários houve **0 vazamentos entre usuários** e **0 falhas de autorização sob concorrência**: o k6 confere cada resposta de "minhas viagens", "comprado" e "vendas" contra o dono.

O p50 e o p99 por endpoint estão nos arquivos `tests/performance/results/k6-step-*.json`.

## E. Antes e depois (medido)

| Métrica | Antes | Depois |
|---|---|---|
| p95 geral com 20 VUs | 1.545 ms | 68 ms |
| p95 geral com 50 VUs | 4.356 ms | 155 ms |
| Vazão máxima | ~36 pedidos/s (saturava em 50 VUs) | ~197 pedidos/s com 100 VUs |
| Pedidos > 1 s com 50 VUs (45 s) | 560 | 89 |
| Leituras do catálogo no banco | 1 por pedido | 1 a cada 30 s ou a cada escrita (teste `AUD-P3`) |
| Consulta de atividades de um roteiro | 18 ms | 0,09 ms |
| Taxa de erro inesperado | 0% | 0% |
| Testes automáticos do backend | 138 | 145 (todos passando) |
| Testes do app | 216 | 216 (todos passando) |

Não foi medido: consumo de memória e CPU do processo durante a carga, e consumo de banco no Supabase real.

## F. Pendências

**Dependem do Diego** (configuração, produção ou decisão):

1. **Publicar esta branch:** abrir PR, revisar, fazer merge na `main`.
   - O Render aplica a migration de índices sozinho.
   - A Vercel publica os cabeçalhos novos.
2. **No Render:** `TRUST_PROXY_HOPS=2` e conferir com o passo a passo do README.
   - Se o contador ainda oscilar, ou se um `X-Forwarded-For` forjado devolver contador cheio, volte para 1.
   - Opcionais: `RATE_LIMIT_MAX` (padrão 300), `PUBLIC_CATALOG_CACHE_MS`, `SLOW_REQUEST_MS`.
3. **Aprovar `docs/security/sql/revoke-anon-grants.sql`** (AUD-08 e AUD-09).
4. **Do relatório anterior, ainda abertos:**
   - repositório público no GitHub com segredos antigos no histórico (já trocados) → deixar privado;
   - verificação em duas etapas (2FA) em GitHub, Render, Vercel, Supabase, Stripe e e-mail;
   - Stripe em modo real: webhook e chaves;
   - desativar a chave de teste da conta Stripe antiga.
5. **Homologação:** não existe ambiente de homologação. Sem ele, os números de carga do Render são estimativas.

**Trabalho técnico restante:**

- **AUD-05:** paginação do catálogo (servidor e app) antes de ~500 roteiros.
- **AUD-12:** CSP de scripts no app e no admin, e avaliar trocar o `localStorage` por cookie `httpOnly` no admin.
- **AUD-10:** limite próprio para compartilhamento anônimo.
- **AUD-11:** remover código morto.
- **AUD-07:** busca duplicada na tela inicial.
- **Alertas:** já existe um monitor de disponibilidade (`.github/workflows/uptime.yml`). A cada 15 minutos ele confere `/health`, o catálogo e o app, e o GitHub manda e-mail quando falha. Esta auditoria somou o log `slow_request` e o `X-Request-Id`. **Ainda não há alerta de lentidão**, do tipo "p95 > 1 s por 5 minutos": o Render não alerta por padrão de log. Para ter isso, é preciso um serviço de logs (Better Stack ou similar) com essa regra.
- **CI:** esta branch adiciona `.github/workflows/tests.yml`. Os 145 testes do backend e os 216 do app passam a rodar a cada push e PR, sem banco, rede ou Stripe. As suítes da auditoria e o k6 ficam de fora, porque precisam do ambiente isolado; a carga nunca deve rodar a cada commit.

## G. Parecer para lançamento

### **APTO COM RESSALVAS**

**Por que apto:**

- Nenhuma vulnerabilidade P0 ou P1 conhecida está aberta.
- O isolamento entre contas foi testado por chamadas reais em todos os papéis: 439 chamadas, 0 falhas.
- O conteúdo pago não vaza para anônimos (52 telas, 0 vazamentos).
- O banco nega tudo pela Data API (RLS em 45 de 45).
- Não há segredo administrativo no cliente.
- Pagamento só é liberado por webhook assinado, com preço do servidor.
- Os testes automáticos estão passando: 145 do backend + 216 do app + suítes da auditoria.
- A meta de p95 abaixo de 1 s foi cumprida até 100 usuários simultâneos no ambiente local, com o código novo.

**Ressalvas que precisam acontecer antes ou logo depois do lançamento:**

1. Esta branch publicada e `TRUST_PROXY_HOPS` conferido no Render (AUD-03). Sem isso, os limites de tentativa continuam presos ao IP da Cloudflare.
2. Stripe em modo real (webhook e chaves) e 2FA nas contas de serviço.
3. Repositório privado.
4. O monitor de disponibilidade já existe (`uptime.yml`). Falta o alerta de lentidão, que é recomendado mas não bloqueia o lançamento.

**Não provado nesta auditoria:** a capacidade real do Render Starter. Precisa de um ambiente de homologação com o mesmo plano para medir. Pela estimativa, atende algo como 100 usuários simultâneos com catálogo pequeno, e não atende 1.000 sem mudar de plano ou de instâncias.
