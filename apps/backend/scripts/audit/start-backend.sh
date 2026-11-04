#!/usr/bin/env bash
# Sobe o backend ISOLADO da auditoria (banco local vamo_audit, rede externa
# bloqueada, nada do .env real). Uso, na pasta apps/backend:
#   bash scripts/audit/start-backend.sh [production|development] [porta]
# production = limites e CORS reais; development = sem limite global para localhost (testes de carga).
set -euo pipefail
cd "$(dirname "$0")/../.."
MODE="${1:-production}"
PORT="${2:-4333}"
SECRET_FILE="${AUDIT_JWT_SECRET_FILE:-$HOME/.vamo-audit-jwt}"
[ -f "$SECRET_FILE" ] || (umask 077; openssl rand -base64 48 | tr -d '\n' > "$SECRET_FILE")
export AUDIT_JWT_SECRET="$(cat "$SECRET_FILE")"
export AUDIT_DATABASE_URL="${AUDIT_DATABASE_URL:-postgresql://$(whoami)@localhost:5432/vamo_audit}"
export AUDIT_MODE="$MODE" PORT="$PORT"
exec npx tsx --import ./scripts/audit/isolated-env.ts src/index.ts
