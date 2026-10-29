#!/usr/bin/env bash
# Contexto injetado no início de cada sessão do Claude (hook SessionStart em .claude/settings.json).
#
# Sessões que NÃO devem ligar o backend contra o banco de produção (ex.: correção/auditoria
# de segurança) criam o arquivo .claude/skip-boot antes de abrir a sessão:
#   touch .claude/skip-boot     # desliga o boot automático
#   rm .claude/skip-boot        # volta ao normal
# Nunca coloque e-mail/senha neste arquivo: ele é versionado.

ROOT="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"

if [ -f "$ROOT/.claude/skip-boot" ]; then
  cat <<'JSON'
{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"# VAMO — boot automático DESLIGADO\n\nExiste o arquivo .claude/skip-boot. NÃO rode preview_start do backend/mobile/admin, NÃO rode scripts/health.sh, audit-prod.ts, npm start ou qualquer comando que conecte ao banco, Stripe, SMTP ou storage reais. Use apenas ambiente isolado (Prisma/Stripe simulados). Siga a tarefa dada pelo usuário. Para reativar o boot, o usuário apaga .claude/skip-boot."}}
JSON
  exit 0
fi

cat <<'JSON'
{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"# VAMO — Boot obrigatório\n\nANTES de qualquer outra ação nesta sessão, execute em paralelo:\n\n1. preview_start { name: \"backend\" }\n2. preview_start { name: \"mobile\" }\n3. preview_start { name: \"admin\" }  (painel Admin, porta 3034)\n\npreview_start é idempotente (reused: true se já estiver rodando).\n\nMotivo: o app mobile chama o backend em localhost:3333. Sem ele, login e qualquer chamada autenticada falham com erro de rede. Já aconteceu 4 vezes.\n\nDepois rode 1x \"bash scripts/health.sh\" na raiz para confirmar backend OK e banco conectado. Atenção: o backend local usa o banco de PRODUÇÃO.\n\nReferência completa: CLAUDE.md na raiz do repo."}}
JSON
