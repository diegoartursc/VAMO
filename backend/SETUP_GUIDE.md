# VAMO Backend - Quick Setup Guide

## 🎯 Próximos Passos para Rodar Localmente

### 1. Configure o Banco de Dados

Você tem duas opções:

#### Opção A: Supabase (Recomendado - Grátis)
1. Acesse https://supabase.com
2. Crie uma conta e um novo projeto
3. Vá em **Settings** → **Database**
4. Copie a "Connection String" (URI format)

#### Opção B: PostgreSQL Local
```bash
# MacOS (via Homebrew)
brew install postgresql@15
brew services start postgresql@15
createdb vamo
```

### 2. Configure as Variáveis de Ambiente

```bash
cd backend
cp .env.example .env
```

Edite o arquivo `.env` e atualize:
```env
DATABASE_URL="postgresql://user:password@host:5432/vamo"
JWT_SECRET="sua-chave-secreta-aqui"
```

### 3. Instale Dependências e Rode Migrações

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
```

### 4. Inicie o Servidor

```bash
npm run dev
```

Você verá:
```
🚀 Server running on http://localhost:3000
📝 Environment: development
```

### 5. Teste a API

Teste o health check:
```bash
curl http://localhost:3000/health
```

Resposta esperada:
```json
{"status":"ok","timestamp":"2026-02-01T..."}
```

## 🧪 Testando Endpoints

### Registrar uma Agência
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "CVC Viagens",
    "email": "contato@cvc.com.br",
    "password": "senha123",
    "whatsapp": "+5511999999999"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "contato@cvc.com.br",
    "password": "senha123"
  }'
```

Copie o `accessToken` retornado.

### Criar um Pacote (com token)
```bash
curl -X POST http://localhost:3000/api/packages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "title": "Paris Romântica 7 Dias",
    "destination": "Paris",
    "country": "França",
    "description": "Descubra a cidade luz em um pacote completo",
    "priceMin": 8500,
    "priceMax": 12000,
    "duration": 7,
    "includes": [
      "Passagens aéreas",
      "Hotel 4 estrelas",
      "Café da manhã"
    ],
    "highlights": [
      "Torre Eiffel",
      "Louvre"
    ],
    "categories": ["cultural", "romantic"],
    "hasFreeCancellation": true
  }'
```

### Listar Pacotes (público)
```bash
curl http://localhost:3000/api/packages
```

## 🛠️ Ferramentas Úteis

### Prisma Studio (Interface Visual do Banco)
```bash
npm run prisma:studio
```

Abre em `http://localhost:5555` - você pode ver/editar dados visualmente.

---

## ⚠️ Troubleshooting

**Erro: "Can't reach database server"**
- Verifique se sua `DATABASE_URL` está correta
- Se usando Supabase, certifique-se que o projeto está ativo

**Erro: "Table does not exist"**
- Execute: `npm run prisma:migrate`

**Porta 3000 já em uso**
- Mude a porta no `.env`: `PORT=3001`
