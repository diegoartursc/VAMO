#!/bin/bash

echo "🚀 Iniciando VAMO Stack..."
echo ""

# Cores
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Terminal 1: Backend
echo -e "${BLUE}[1/3]${NC} Iniciando Backend (porta 3333)..."
cd apps/backend
npm run dev > ../../backend.log 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}✓ Backend iniciado (PID: $BACKEND_PID)${NC}"
echo "   Logs: tail -f backend.log"
echo ""

# Terminal 2: Mobile (Expo)
echo -e "${BLUE}[2/3]${NC} Iniciando Mobile App (porta 8081)..."
cd ../mobile
npm run dev > ../../mobile.log 2>&1 &
MOBILE_PID=$!
echo -e "${GREEN}✓ Mobile iniciado (PID: $MOBILE_PID)${NC}"
echo "   Logs: tail -f mobile.log"
echo ""

# Terminal 3: Site (Next.js)
echo -e "${BLUE}[3/3]${NC} Iniciando Site (porta 3000)..."
cd ../site
npm run dev > ../../site.log 2>&1 &
SITE_PID=$!
echo -e "${GREEN}✓ Site iniciado (PID: $SITE_PID)${NC}"
echo "   Logs: tail -f site.log"
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
