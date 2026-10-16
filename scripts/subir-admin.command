#!/bin/bash
# Duplo clique no Finder: roda scripts/subir-admin.sh numa janela do Terminal.
cd "$(dirname "$0")/.." || exit 1
bash scripts/subir-admin.sh
echo; echo "Pode fechar esta janela: os servidores continuam rodando em segundo plano."
