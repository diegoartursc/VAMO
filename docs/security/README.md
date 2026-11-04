# Suíte de segurança e carga da VAMO

Tudo aqui roda num **ambiente isolado no Mac**. Nada toca a produção:

- banco local `vamo_audit`, com dados fictícios;
- nenhum `.env` real é lido;
- a rede externa fica bloqueada dentro do backend.

O relatório da auditoria de 04/11/2026 está em [AUDITORIA-2026-11-04.md](AUDITORIA-2026-11-04.md).

## 1. Preparar (uma vez)

```bash
# Postgres local (Homebrew) já instalado e rodando
createdb -h localhost vamo_audit
cd apps/backend && DATABASE_URL="postgresql://$(whoami)@localhost:5432/vamo_audit" npx prisma migrate deploy
cd ../../tests && npm install && npx playwright install chromium
brew install k6
```

## 2. Dados fictícios

```bash
cd apps/backend
AUDIT_DATABASE_URL="postgresql://$(whoami)@localhost:5432/vamo_audit" npx tsx scripts/audit/create-fixtures.ts --bulk 300
```

O script recusa qualquer banco que não seja `localhost/vamo_audit*`. Ele apaga e recria os dados a cada execução. As senhas de teste ficam em `tests/security/.fixtures.local.json`, que está fora do Git.

Os textos pagos levam o marcador `PAID-SECRET-*` e os privados, `PRIVATE-SECRET-*`. Os testes procuram esses marcadores para detectar vazamento.

## 3. Subir o backend isolado

```bash
cd apps/backend
AUDIT_ALLOWED_ORIGINS=http://localhost:8091 bash scripts/audit/start-backend.sh production 4333
```

O modo `production` aplica os limites e o CORS reais. O modo `development` não aplica o limite global para localhost.

## 4. Testes

```bash
cd tests
AUDIT_API=http://localhost:4333 AUDIT_JWT_SECRET="$(cat ~/.vamo-audit-jwt)" node security/api-authz.mjs   # 439 chamadas por papel
AUDIT_API=http://localhost:4333 node security/mass-assignment.mjs                                     # campos extras
AUDIT_API=http://localhost:4333 node security/abuse.mjs                                               # upload, travessia, força bruta, webhook
```

`mass-assignment.mjs` e `abuse.mjs` alteram os dados de teste. Recrie os fixtures antes de rodar outro teste.

### Navegador anônimo (Playwright)

Primeiro gere o build web apontando para o backend isolado:

```bash
cd apps/mobile && EXPO_PUBLIC_API_URL=http://localhost:4333/api npx expo export --platform web --output-dir /tmp/vamo-web-audit
```

Depois rode os testes:

```bash
cd tests && AUDIT_WEB_DIR=/tmp/vamo-web-audit npx playwright test -c e2e/playwright.config.mjs --workers=1
```

### Carga (k6)

Suba um backend separado na porta 4334 e rode:

```bash
cd tests/performance
k6 run -e API=http://localhost:4334 -e PROFILE=smoke vamo.k6.js
k6 run -e API=http://localhost:4334 -e PROFILE=stress -e VUS=20 vamo.k6.js
```

Perfis disponíveis: `smoke`, `baseline`, `load`, `stress`, `spike` e `soak`. O teste aborta sozinho se a taxa de erro inesperado passar de 5%.

**Nunca rode carga contra a produção.** O script recusa qualquer endereço que não seja localhost.

### Testes automáticos do backend (rodam sem banco)

```bash
cd apps/backend && npx tsx --import ./src/test/setup.ts --test $(find src -name '*.test.ts')
```

## Variáveis novas do backend (Render)

| Variável | Padrão | Para quê |
|---|---|---|
| `TRUST_PROXY_HOPS` | `1` | Quantos proxies confiáveis existem antes do app. No Render, que fica atrás da Cloudflare, o valor medido como certo é **2**. |
| `RATE_LIMIT_MAX` | `300` | Chamadas por IP a cada 15 minutos. Antes era 100, fixo no código. |
| `PUBLIC_CATALOG_CACHE_MS` | `30000` | Tempo do cache do catálogo público. Com `0`, o cache fica desligado. |

### Conferir o `TRUST_PROXY_HOPS` depois de mudar

Faça 5 pedidos seguidos do mesmo computador:

```bash
for i in 1 2 3 4 5; do curl -s -o /dev/null -D - https://vamo-699h.onrender.com/api/destinations | grep -i ratelimit-remaining; done
```

O contador precisa descer sem pular: 299, 298, 297... Hoje, com o valor 1, ele oscila.

Depois mande um pedido com o cabeçalho forjado:

```bash
curl -s -o /dev/null -D - -H 'x-forwarded-for: 203.0.113.77' https://vamo-699h.onrender.com/api/destinations | grep -i ratelimit-remaining
```

Esse pedido **não** pode voltar com o contador cheio. Se voltar, o valor está alto demais: volte para 1 e investigue.
