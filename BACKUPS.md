# Política de backups e arquivos locais

## TL;DR

Três regras simples:

1. **Backup pesado** (cópia do projeto, dump do banco, tarball) → `../VAMO-backups-archive/` (FORA do projeto)
2. **Arquivos do dev** (logs, notas, scratch) → `.local/` (dentro do projeto, mas ignorado pelo Git)
3. **Documentação útil pra outros devs / IA / GitHub** → `docs/` (versionado)

```
[Códigos/
├── VAMO/                       ← o projeto (limpo, ~3 GB)
│   ├── apps/, packages/        ← código (versionado)
│   ├── docs/                   ← docs visíveis no GitHub (versionado)
│   ├── README.md, BACKUPS.md   ← docs raiz (versionado)
│   └── .local/                 ← gaveta do dev (IGNORADO pelo Git)
│       ├── logs/
│       ├── notes/
│       └── scratch/
└── VAMO-backups-archive/       ← TODO backup pesado mora aqui (~12 GB)
    ├── VAMO-backup-*.tar.gz
    ├── public_backup_*/        ← criado pelo db:reset-test-data
    └── ...
```

## Por quê?

Cópias do projeto inteiro dentro do projeto causam três problemas:

1. **Inflam o repositório** — o VAMO já tinha 7.7 GB de tarballs antigos em
   `backups/` antes da limpeza.
2. **Confundem ferramentas** — IDE, busca, watcher, antivírus, tudo varre dentro
   do diretório raiz. Backup dentro = workload extra constante.
3. **O Git já é o backup** — toda mudança versionada está no histórico. Para
   pontos críticos, use `git tag backup/YYYY-MM-DD-descricao` (0 bytes locais).

## Quando precisar de um backup pesado

| Situação | O que fazer |
|---|---|
| Antes de uma refatoração grande | `git tag backup/pre-cost-refactor` + `git push origin --tags` |
| Snapshot do banco | `pg_dump vamo > ../VAMO-backups-archive/db-YYYY-MM-DD.sql.gz` |
| Snapshot do código completo + node_modules + builds | `tar -czf ../VAMO-backups-archive/VAMO-backup-YYYY-MM-DD.tar.gz --exclude=node_modules VAMO/` |
| Reset de dados de teste (uploads runtime) | `npm run db:reset-test-data` — o script já manda automaticamente pra `../VAMO-backups-archive/` |

## O que NÃO fazer

- ❌ Criar pasta `backups/` dentro do projeto
- ❌ Tarball dentro do projeto (mesmo na raiz)
- ❌ `public_backup_*/` dentro de `apps/backend/`
- ❌ `cp -r VAMO/ VAMO-copia/` (idem)

`.gitignore` já bloqueia os principais padrões como segurança, mas a regra
primária é não criar esses arquivos aqui dentro em primeiro lugar.

## Recuperando algo de um backup antigo

Tudo que estava em `backups/` foi consolidado em `../VAMO-backups-archive/` em
24/05/2026. Se precisar extrair algo de um tarball antigo:

```bash
cd ../VAMO-backups-archive/
tar -xzf VAMO-backup-XXXX.tar.gz -C /tmp/
# pega o arquivo específico que precisa, copia pro VAMO
```
