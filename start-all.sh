#!/bin/bash
# Sobe os 3 serviços do VAMO em background.
# Logs vão pra .local/logs/ (gitignored — veja .local/README.md).

# Garante que a pasta de logs existe (rodando da raiz do projeto)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="$SCRIPT_DIR/.local/logs"
mkdir -p "$LOG_DIR"

echo "🚀 Iniciando VAMO Stack..."
echo ""

# Cores
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Terminal 1: Backend
echo -e "${BLUE}[1/3]${NC} Iniciando Backend (porta 3333)..."
cd "$SCRIPT_DIR/apps/backend"
npm run dev > "$LOG_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}✓ Backend iniciado (PID: $BACKEND_PID)${NC}"
echo "   Logs: tail -f .local/logs/backend.log"
echo ""

# Terminal 2: Mobile (Expo)
echo -e "${BLUE}[2/3]${NC} Iniciando Mobile App (porta 8081)..."
cd "$SCRIPT_DIR/apps/mobile"
npm run dev > "$LOG_DIR/mobile.log" 2>&1 &
MOBILE_PID=$!
echo -e "${GREEN}✓ Mobile iniciado (PID: $MOBILE_PID)${NC}"
echo "   Logs: tail -f .local/logs/mobile.log"
echo ""

# Terminal 3: Site (Next.js)
echo -e "${BLUE}[3/3]${NC} Iniciando Site (porta 3000)..."
cd "$SCRIPT_DIR/apps/site"
npm run dev > "$LOG_DIR/site.log" 2>&1 &
SITE_PID=$!
echo -e "${GREEN}✓ Site iniciado (PID: $SITE_PID)${NC}"
echo "   Logs: tail -f .local/logs/site.log"
echo ""

echo -e "${YELLOW}📍 URLs:${NC}"
echo "   Backend API: http://localhost:3333"
echo "   Mobile App: http://localhost:8081"
echo "   Website:    http://localhost:3000"
echo ""
echo -e "${YELLOW}📋 Para parar tudo:${NC} kill $BACKEND_PID $MOBILE_PID $SITE_PID"
echo ""
echo "Aguarde alguns segundos para o apps iniciarem..."

# Aguardar
sleep 3

echo ""
echo "📊 Status dos processos:"
ps aux | grep -E "(tsx|expo|next)" | grep -v grep || echo "Aguardando inicialização..."
