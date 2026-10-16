#!/usr/bin/env bash
# VAMO — sobe o backend (3333) e o painel Admin (3034) e abre o Admin no Chrome.
# Uso:   bash scripts/subir-admin.sh          (liga o que estiver desligado)
#        bash scripts/subir-admin.sh parar    (desliga os dois)
# Seguro de rodar várias vezes: só liga o que ainda não responde.
# Rode no TERMINAL DO MAC (Cursor/Terminal), nunca no shell de uma sessão na nuvem.
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT" || exit 1
LOG="$ROOT/.local/logs"; mkdir -p "$LOG"
BACKEND_URL="http://localhost:3333/health"
ADMIN_URL="http://localhost:3034/admin/login"

if [ "${1:-}" = "parar" ]; then
  for p in 3333 3034; do lsof -ti tcp:$p 2>/dev/null | xargs -r kill 2>/dev/null; done
  echo "Backend e Admin desligados."; exit 0
fi

up() { curl -s -m 3 -o /dev/null "$1"; }

if up "$BACKEND_URL"; then echo "✓ backend já está no ar (3333)"
else echo "→ ligando backend (3333)..."; nohup npm run dev:backend > "$LOG/backend.log" 2>&1 &
fi
if up "$ADMIN_URL"; then echo "✓ admin já está no ar (3034)"
else echo "→ ligando admin (3034)..."; nohup npm run dev --workspace=apps/site -- -p 3034 > "$LOG/admin.log" 2>&1 &
fi

echo "Aguardando os dois responderem (até 2 min)..."
for _ in $(seq 1 60); do
  if up "$BACKEND_URL" && up "$ADMIN_URL"; then OK=1; break; fi
  sleep 2
done

if [ "${OK:-0}" != "1" ]; then
  echo "✗ não subiu. Últimas linhas dos logs:"
  echo "--- backend ---"; tail -n 15 "$LOG/backend.log" 2>/dev/null
  echo "--- admin ---";   tail -n 15 "$LOG/admin.log" 2>/dev/null
  exit 1
fi

echo "✓ tudo no ar → http://localhost:3034/admin"
if command -v open >/dev/null 2>&1; then open -a "Google Chrome" "$ADMIN_URL" 2>/dev/null || open "$ADMIN_URL"; fi
