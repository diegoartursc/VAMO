#!/usr/bin/env bash
# VAMO — sanity check rápido.
# Uso: bash scripts/health.sh
# Saída: status colorido de backend, mobile e banco. Exit code 0 se tudo OK, 1 se algo faltando.

set -uo pipefail

GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[0;33m'; BLUE='\033[0;34m'; NC='\033[0m'

ok=0; total=0; missing=()

check() {
  local label=$1; local check_cmd=$2
  total=$((total+1))
  if eval "$check_cmd" >/dev/null 2>&1; then
    printf "  ${GREEN}✓${NC} %s\n" "$label"
    ok=$((ok+1))
  else
    printf "  ${RED}✗${NC} %s\n" "$label"
    missing+=("$label")
  fi
}

echo ""
echo -e "${BLUE}🔍 VAMO health check${NC}"
echo ""

echo "Serviços:"
check "Backend  (http://localhost:3333/health)" "curl -sf http://localhost:3333/health"
check "Mobile   (http://localhost:8081)"        "curl -sf http://localhost:8081"
echo ""

# Banco — só inspeciona se backend estiver no ar
if curl -sf http://localhost:3333/health >/dev/null 2>&1; then
  echo "Banco:"
  ROOT="$(cd "$(dirname "$0")/.." && pwd)"
  cd "$ROOT/apps/backend" || exit 1

  if [ -f .env ]; then
    DB_HOST=$(grep -E "^DATABASE_URL" .env | head -1 | sed -E 's/.*@([^/:]+).*/\1/')
    if echo "$DB_HOST" | grep -q "supabase"; then
      printf "  ${GREEN}✓${NC} DATABASE_URL aponta para Supabase prod (%s)\n" "$DB_HOST"
    elif echo "$DB_HOST" | grep -qE "localhost|127\.0\.0\.1"; then
      printf "  ${YELLOW}⚠${NC} DATABASE_URL aponta para LOCAL (%s) — esperado prod\n" "$DB_HOST"
    else
      printf "  ${YELLOW}?${NC} DATABASE_URL aponta para %s\n" "$DB_HOST"
    fi
  fi

  echo ""
  echo "Contagens (READ-ONLY no banco conectado):"
  npx tsx scripts/audit-prod.ts 2>&1 | grep -E "^👤|^👑|^🎨|^🏢|^📍|^💰|^📦|^   ✅|^   👑" | sed 's/^/  /'
else
  echo -e "${YELLOW}⚠${NC} Backend offline — pulando inspeção do banco."
fi

echo ""
if [ ${#missing[@]} -eq 0 ]; then
  echo -e "${GREEN}✅ Todos os $total serviços estão de pé.${NC}"
  exit 0
else
  echo -e "${RED}❌ Faltando: ${missing[*]}${NC}"
  echo ""
  echo "Para subir:"
  for s in "${missing[@]}"; do
    case "$s" in
      *Backend*) echo "  - Backend:  mcp__Claude_Preview__preview_start { name: \"backend\" }" ;;
      *Mobile*)  echo "  - Mobile:   mcp__Claude_Preview__preview_start { name: \"mobile\" }" ;;
    esac
  done
  exit 1
fi
