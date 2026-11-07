# Evidências da verificação do plano — 06–07/11/2026

Relatório: [VERIFICACAO-PLANO-SEGURANCA-2026-11-07.md](../../VERIFICACAO-PLANO-SEGURANCA-2026-11-07.md). Base: `b83a959`. Os nomes dos scripts mantêm 06/11 porque a revisão começou nessa data.

## Resultados

- [resumo.json](resumo.json): commit, arquivos de teste, contagens, códigos de saída, typechecks, audit e hashes dos scripts.
- [backend-test-results.txt](backend-test-results.txt): 163 testes aprovados.
- [mobile-test-results.txt](mobile-test-results.txt): 223 testes aprovados.
- [shared-test-results.txt](shared-test-results.txt): 55 testes aprovados.
- [typechecks.json](typechecks.json) e [erro do mobile](typecheck-mobile.txt): backend/site aprovados; mobile TS2322 antigo.
- [client-docs-reproductions.jsonl](client-docs-reproductions.jsonl): helper real do site publicou PDF sintético; logout não revogou; erros de banco escaparam no upload privado; config aceitou demo com destino remoto sintético; falha na remoção do legado expôs arquivo após DELETE.
- [auth-race-reproduction.jsonl](auth-race-reproduction.jsonl): login já validado com senha anterior criou sessão ativa depois do reset.
- [money-reproductions.txt](money-reproductions.txt): cenários de concorrência/falhas de provedor e validação da fila de 50 itens.
- [postgres-integration.jsonl](postgres-integration.jsonl) e [postgres-run.json](postgres-run.json): três reproduções com Prisma/PostgreSQL reais; 20 migrations SQL; cluster isolado encerrado e removido.
- [npm-audit-all.json](npm-audit-all.json) e [npm-audit-backend.json](npm-audit-backend.json): consulta de dependências sem dev. Alertas dependem da data e não equivalem a exploração confirmada.

**Interpretação:** os scripts de reprodução são verificações observacionais que **assertam o comportamento defeituoso encontrado**. Exit code 0 confirma o achado; não aprova a aplicação. Após a correção, esses cenários devem virar testes com invariantes seguras na suíte da aplicação. Não usar estes scripts como job de aprovação de segurança.

## Isolamento

O preload substitui leituras de `.env*` por conteúdo vazio antes do Prisma/dotenv. O setup remove/substitui credenciais, bloqueia rede externa e grava uploads temporários. Contas, tokens, arquivos e IDs são sintéticos. Os testes HTTP/unitários usam Prisma fake.

Somente a integração de banco cria um **cluster PostgreSQL novo**, em diretório temporário e porta aleatória de `127.0.0.1`, com banco `vamo_audit_20261106` e usuário sintético. O runner aplica os SQLs apenas nesse cluster, encerra o processo e remove seus dados. Não usa banco Postgres preexistente. A Stripe é simulada em todos os casos.

Os três cenários PostgreSQL controlam o interleaving antes/depois das chamadas reais de banco. Não são testes de carga ou estimativas de frequência dos defeitos. Os scripts não são ferramentas para executar contra servidor publicado. Não substitua destinos por produção nem use credenciais reais.

## Reproduzir as suítes existentes

Na raiz do repositório, com dependências já instaladas:

```sh
VAMO_EVIDENCE="$PWD/docs/security/evidencias-2026-11-07"
(
  cd apps/backend
  env -i PATH="$PATH" HOME="$HOME" ../../node_modules/.bin/tsx \
    --import "$VAMO_EVIDENCE/scripts/vamo-reaudit-20261106-auth-isolate.ts" \
    --import ./src/test/setup.ts --test $(rg --files src -g '*.test.ts')
)
(
  cd apps/mobile
  env -i PATH="$PATH" HOME="$HOME" ../../node_modules/.bin/tsx \
    --import "$VAMO_EVIDENCE/scripts/vamo-reaudit-20261106-auth-isolate.ts" \
    --test $(rg --files src app -g '*.test.ts' -g '*.test.tsx')
)
env -i PATH="$PATH" HOME="$HOME" node_modules/.bin/tsx \
  --import "$VAMO_EVIDENCE/scripts/vamo-reaudit-20261106-auth-isolate.ts" \
  --test $(rg --files packages/shared -g '*.test.ts')

node_modules/.bin/tsc --noEmit --incremental false -p apps/backend/tsconfig.json
node_modules/.bin/tsc --noEmit --incremental false -p apps/site/tsconfig.json
node_modules/.bin/tsc --noEmit --incremental false -p apps/mobile/tsconfig.json
```

## Reproduzir os achados isolados

Na raiz do repositório:

```sh
VAMO_EVIDENCE="$PWD/docs/security/evidencias-2026-11-07"
env -i PATH="$PATH" HOME="$HOME" node_modules/.bin/tsx \
  --import "$VAMO_EVIDENCE/scripts/vamo-reaudit-20261106-auth-isolate.ts" \
  "$VAMO_EVIDENCE/scripts/vamo-reaudit-20261106-client-docs.ts"

env -i PATH="$PATH" HOME="$HOME" node_modules/.bin/tsx \
  --import "$VAMO_EVIDENCE/scripts/vamo-reaudit-20261106-auth-isolate.ts" \
  "$VAMO_EVIDENCE/scripts/vamo-reaudit-20261106-money.ts"

(
  cd apps/backend
  env -i PATH="$PATH" HOME="$HOME" ../../node_modules/.bin/tsx \
    --import "$VAMO_EVIDENCE/scripts/vamo-reaudit-20261106-auth-isolate.ts" \
    "$VAMO_EVIDENCE/scripts/vamo-reaudit-20261106-auth-race.ts"
)
```

O `fetch` do helper de upload do site é redirecionado exclusivamente à porta local efêmera do teste; nunca envia ao endpoint padrão. As falhas de persistência do upload privado são observadas no processo e abortadas após 500 ms, sem esperar o timeout operacional de cinco minutos.

## Integração PostgreSQL descartável

Requer binários PostgreSQL 17 já instalados. Padrão: `/opt/homebrew/opt/postgresql@17/bin`; `VAMO_REAUDIT_PG_BIN` permite outro diretório de binários. O runner não usa banco existente, `npm start`, `prisma migrate dev`, `db push`, seed ou scripts de produção.

```sh
VAMO_EVIDENCE="$PWD/docs/security/evidencias-2026-11-07"
VAMO_REAUDIT_SCRIPTS="$VAMO_EVIDENCE/scripts" \
  VAMO_REAUDIT_OUTPUT=/tmp/vamo-reaudit-postgres-repeat \
  python3 "$VAMO_EVIDENCE/scripts/vamo-reaudit-20261106-run-postgres.py"
```

Verifique também `stopped=true` e `temporary_cluster_removed=true` no resultado. Em falha de inicialização/teste, o runner registra o erro; resultado incompleto não é aprovação.
