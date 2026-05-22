#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────
# setup-vercel.sh
# Conecta os 3 repos VAMO ao Vercel e dispara o primeiro deploy.
# Pré-requisitos:
#   - vercel CLI instalado (npm i -g vercel)
#   - vercel login feito (rode `vercel login` se ainda não)
#   - Backend rodando em algum host público (Railway, Render, etc.)
#     — VAMOsite/adminVAMO precisam de NEXT_PUBLIC_API_URL pra valer
# ─────────────────────────────────────────────────────────────────────
set -e

API_URL_PROD="${1:-https://SUA-API-VAMO.aqui/api}"

echo "→ API_URL_PROD = $API_URL_PROD"
echo

if ! command -v vercel >/dev/null 2>&1; then
    echo "ERRO: vercel CLI não está instalado. Rode: npm i -g vercel"
    exit 1
fi

if ! vercel whoami >/dev/null 2>&1; then
    echo "ERRO: não está logado. Rode: vercel login"
    exit 1
fi

# Função para deploy + env var
deploy_repo() {
    local NAME="$1"
    local REPO_URL="$2"
    local TMP="/tmp/vercel-$NAME-$$"

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "► $NAME"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    rm -rf "$TMP"
    git clone "$REPO_URL" "$TMP"
    cd "$TMP"

    echo "$API_URL_PROD" | vercel env add NEXT_PUBLIC_API_URL production --yes || true
    echo "$API_URL_PROD" | vercel env add NEXT_PUBLIC_API_URL preview --yes || true

    vercel link --yes --project "$NAME"
    vercel deploy --prod --yes

    cd -
}

deploy_repo "vamosite"  "git@github.com:diegoartursc/VAMOsite.git"
deploy_repo "adminvamo" "git@github.com:diegoartursc/adminVAMO.git"

echo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✓ Deploys disparados."
echo "VAMOsite:  https://vamosite.vercel.app"
echo "adminVAMO: https://adminvamo.vercel.app"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
