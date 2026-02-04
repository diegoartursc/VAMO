# 🛠️ Arquitetura do Backend - VAMO

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Arquitetura de Sistema](#arquitetura-de-sistema)
4. [Banco de Dados](#banco-de-dados)
5. [APIs e Endpoints](#apis-e-endpoints)
6. [Autenticação e Segurança](#autenticação-e-segurança)
7. [Integrações Externas](#integrações-externas)
8. [Roadmap de Implementação](#roadmap-de-implementação)

---

## 🎯 Visão Geral

O backend do VAMO será construído como uma **API RESTful** que serve o aplicativo mobile React Native. A arquitetura é projetada para:

- ✅ **Escalabilidade**: Suportar crescimento de usuários e transações
- ✅ **Modularidade**: Separação clara entre camadas de serviço
- ✅ **Segurança**: Autenticação robusta e proteção de dados
- ✅ **Performance**: Respostas rápidas e otimização de queries
- ✅ **Manutenibilidade**: Código limpo e bem documentado

---

## 🔧 Stack Tecnológico

### Core
```yaml
Runtime: Node.js 18+ LTS
Framework: Express.js (ou Fastify para melhor performance)
Linguagem: TypeScript 5.x
Package Manager: npm
```

### Banco de Dados
```yaml
Principal: PostgreSQL 15+
Hosting: Supabase (recomendado) ou Neon
ORM: Prisma (type-safe, migrations automáticas)
Cache: Redis (para sessions e queries frequentes)
```

### Serviços Cloud
```yaml
Hosting Backend: Railway, Render ou Vercel (Serverless)
Storage de Imagens: AWS S3 ou Cloudinary
CDN: Cloudflare
Monitoring: Sentry
```

### Integrações
```yaml
Pagamentos: Stripe + Mercado Pago
Emails: Resend ou SendGrid
SMS/WhatsApp: Twilio
Autenticação: Supabase Auth ou Clerk
```

---

## 🏗️ Arquitetura de Sistema

### Diagrama de Arquitetura
```
┌─────────────────────────────────────────────────────────┐
│                     VAMO Mobile App                      │
│                  (React Native + Expo)                   │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTPS/TLS
                        ↓
┌─────────────────────────────────────────────────────────┐
│                    API Gateway / CDN                     │
│                    (Cloudflare)                          │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────────┐
│                   VAMO Backend API                       │
│                   (Node.js + Express)                    │
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Auth       │  │  Packages    │  │  Bookings    │  │
│  │   Service    │  │  Service     │  │  Service     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Itineraries  │  │   Reviews    │  │   Users      │  │
│  │  Service     │  │   Service    │  │   Service    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└───────────┬───────────────┬───────────────┬─────────────┘
            │               │               │
            ↓               ↓               ↓
    ┌──────────────┐ ┌──────────┐ ┌────────────────┐
    │  PostgreSQL  │ │  Redis   │ │  AWS S3        │
    │  (Supabase)  │ │  Cache   │ │  (Imagens)     │
    └──────────────┘ └──────────┘ └────────────────┘
            │
            ↓
    ┌──────────────────────────────────────────┐
    │         Integrações Externas             │
    ├──────────────┬───────────┬───────────────┤
    │   Stripe     │  Resend   │    Twilio     │
    │ (Pagamentos) │ (Emails)  │ (SMS/WhatsApp)│
    └──────────────┴───────────┴───────────────┘
```

### Estrutura de Diretórios
```
backend/
├── src/
│   ├── config/              # Configurações (DB, env, etc)
│   ├── controllers/         # Controladores de rotas
│   │   ├── auth.controller.ts
│   │   ├── packages.controller.ts
│   │   ├── itineraries.controller.ts
│   │   ├── bookings.controller.ts
│   │   ├── reviews.controller.ts
│   │   └── users.controller.ts
│   ├── services/            # Lógica de negócio
│   │   ├── auth.service.ts
│   │   ├── packages.service.ts
│   │   ├── payment.service.ts
│   │   ├── email.service.ts
│   │   └── storage.service.ts
│   ├── models/              # Esquemas Prisma
│   │   └── schema.prisma
│   ├── middlewares/         # Autenticação, validação, etc
│   │   ├── auth.middleware.ts
│   │   ├── validation.middleware.ts
│   │   └── error.middleware.ts
│   ├── routes/              # Definição de rotas
│   │   ├── index.ts
│   │   ├── auth.routes.ts
│   │   ├── packages.routes.ts
│   │   ├── itineraries.routes.ts
│   │   ├── bookings.routes.ts
│   │   └── reviews.routes.ts
│   ├── utils/               # Utilitários
│   │   ├── logger.ts
│   │   ├── validators.ts
│   │   └── helpers.ts
│   ├── types/               # TypeScript interfaces
│   │   └── index.ts
│   └── app.ts               # Configuração Express
├── prisma/
│   ├── schema.prisma        # Esquema do banco
│   ├── migrations/          # Histórico de migrations
│   └── seed.ts              # Dados iniciais
├── tests/                   # Testes (Jest)
│   ├── unit/
│   └── integration/
├── .env.example
├── package.json
└── tsconfig.json
```

---

## 🗄️ Banco de Dados

### Esquema Principal (Prisma Schema)

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ====================================
// USUÁRIOS E AUTENTICAÇÃO
// ====================================

model User {
  id            String    @id @default(uuid())
  email         String    @unique
  name          String
  phone         String?
  avatar        String?
  passwordHash  String
  role          UserRole  @default(TRAVELER)
  verified      Boolean   @default(false)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Relações
  bookings      Booking[]
  reviews       Review[]
  favorites     Favorite[]
  itineraries   Itinerary[] // Se for creator
  
  @@index([email])
}

enum UserRole {
  TRAVELER      // Viajante comum
  CREATOR       // Criador de roteiros
  AGENCY        // Agência de turismo
  ADMIN         // Administrador VAMO
}

// ====================================
// AGÊNCIAS
// ====================================

model Agency {
  id              String    @id @default(uuid())
  name            String
  slug            String    @unique
  logo            String
  verified        Boolean   @default(false)
  verificationBadge String? // 'basic', 'trusted', 'premium'
  description     String?
  whatsapp        String?
  email           String
  website         String?
  rating          Float     @default(0)
  totalReviews    Int       @default(0)
  createdAt       DateTime  @default(now())
  
  // Relações
  packages        Package[]
  
  @@index([slug])
}

// ====================================
// PACOTES DE VIAGEM
// ====================================

model Package {
  id              String    @id @default(uuid())
  title           String
  slug            String    @unique
  description     String
  destination     String
  country         String
  city            String?
  duration        Int       // dias
  
  // Preços
  priceMin        Decimal   @db.Decimal(10, 2)
  priceMax        Decimal   @db.Decimal(10, 2)
  currency        String    @default("BRL")
  
  // Metadata
  badge           PackageBadge?
  featured        Boolean   @default(false)
  active          Boolean   @default(true)
  
  // Inclusões
  includeFlight   Boolean   @default(false)
  includeHotel    Boolean   @default(false)
  hotelStars      Int?
  meals           String[]  // ['breakfast', 'lunch', 'dinner']
  tours           String[]
  extras          String[]
  
  // Imagens
  images          String[]  // URLs do S3
  coverImage      String
  
  // Itinerário
  itineraryData   Json?     // Estrutura flexível para dia-a-dia
  
  // Políticas
  cancellationPolicy String?
  
  // Relações
  agencyId        String
  agency          Agency    @relation(fields: [agencyId], references: [id])
  bookings        Booking[]
  reviews         Review[]
  favorites       Favorite[]
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([slug])
  @@index([destination])
  @@index([agencyId])
}

enum PackageBadge {
  BESTSELLER
  FLASH
  LUXURY
  VALUE
  VERIFIED
  NEW
  FEATURED
}

// ====================================
// ROTEIROS INDEPENDENTES
// ====================================

model Itinerary {
  id              String    @id @default(uuid())
  title           String
  slug            String    @unique
  description     String
  destination     String
  country         String
  duration        Int       // dias
  
  price           Decimal   @db.Decimal(10, 2)
  currency        String    @default("BRL")
  
  // Conteúdo do roteiro
  content         Json      // Estrutura rica com dia-a-dia, dicas, etc
  pdfUrl          String?
  
  // Metadata
  difficulty      String?   // 'easy', 'moderate', 'hard'
  style           String[]  // ['adventure', 'relaxation', 'culture']
  
  images          String[]
  coverImage      String
  
  downloads       Int       @default(0)
  rating          Float     @default(0)
  
  // Relações
  creatorId       String
  creator         User      @relation(fields: [creatorId], references: [id])
  reviews         Review[]
  
  active          Boolean   @default(true)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([slug])
  @@index([creatorId])
}

// ====================================
// RESERVAS
// ====================================

model Booking {
  id              String        @id @default(uuid())
  bookingCode     String        @unique // VAMO-123456
  
  // Usuário
  userId          String
  user            User          @relation(fields: [userId], references: [id])
  
  // Pacote
  packageId       String
  package         Package       @relation(fields: [packageId], references: [id])
  
  // Datas da viagem
  travelStart     DateTime
  travelEnd       DateTime
  travelers       Int
  
  // Status
  status          BookingStatus @default(PENDING)
  
  // Valores
  totalAmount     Decimal       @db.Decimal(10, 2)
  commissionAmount Decimal      @db.Decimal(10, 2)
  currency        String        @default("BRL")
  
  // Pagamento
  paymentStatus   PaymentStatus @default(PENDING)
  paymentId       String?       // ID do Stripe/Mercado Pago
  
  // Confirmação da agência
  agencyReference String?       // Código da agência (CVC-789012)
  confirmedAt     DateTime?
  
  // Dados do viajante
  contactName     String
  contactEmail    String
  contactPhone    String
  specialRequests String?
  
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  
  @@index([userId])
  @@index([packageId])
  @@index([bookingCode])
}

enum BookingStatus {
  PENDING       // Aguardando confirmação
  CONFIRMED     // Confirmado pela agência
  CANCELLED     // Cancelado
  COMPLETED     // Viagem realizada
}

enum PaymentStatus {
  PENDING       // Aguardando pagamento
  PAID          // Pago
  REFUNDED      // Reembolsado
  FAILED        // Falhou
}

// ====================================
// AVALIAÇÕES
// ====================================

model Review {
  id              String    @id @default(uuid())
  
  // Pode ser de Package OU Itinerary
  packageId       String?
  package         Package?  @relation(fields: [packageId], references: [id])
  
  itineraryId     String?
  itinerary       Itinerary? @relation(fields: [itineraryId], references: [id])
  
  // Autor
  userId          String
  user            User      @relation(fields: [userId], references: [id])
  
  // Conteúdo
  rating          Int       // 1-5
  title           String?
  text            String
  photos          String[]  // URLs
  
  verified        Boolean   @default(false) // Compra verificada
  language        String    @default("pt-BR")
  
  // Resposta da agência/creator
  response        String?
  responseDate    DateTime?
  
  helpful         Int       @default(0) // Quantos acharam útil
  
  createdAt       DateTime  @default(now())
  
  @@index([packageId])
  @@index([itineraryId])
  @@index([userId])
}

// ====================================
// FAVORITOS
// ====================================

model Favorite {
  id          String    @id @default(uuid())
  userId      String
  user        User      @relation(fields: [userId], references: [id])
  
  packageId   String
  package     Package   @relation(fields: [packageId], references: [id])
  
  createdAt   DateTime  @default(now())
  
  @@unique([userId, packageId])
  @@index([userId])
}
```

---

## 🌐 APIs e Endpoints

### Base URL
```
Production: https://api.vamo.app/v1
Development: http://localhost:3000/v1
```

### Estrutura de Resposta Padrão
```typescript
// Sucesso
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-02-01T20:00:00Z",
    "requestId": "req_abc123"
  }
}

// Erro
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": { ... }
  },
  "meta": {
    "timestamp": "2026-02-01T20:00:00Z",
    "requestId": "req_abc123"
  }
}
```

### Endpoints Principais

#### 1. Autenticação (`/auth`)
```typescript
POST   /auth/register          // Criar conta
POST   /auth/login             // Login
POST   /auth/logout            // Logout
POST   /auth/refresh           // Renovar token
POST   /auth/forgot-password   // Recuperar senha
POST   /auth/verify-email      // Verificar email
GET    /auth/me                // Dados do usuário atual
```

#### 2. Pacotes (`/packages`)
```typescript
GET    /packages               // Listar pacotes (com filtros)
GET    /packages/:id           // Detalhes de um pacote
GET    /packages/search        // Busca avançada
GET    /packages/featured      // Pacotes em destaque
GET    /packages/popular       // Mais populares
POST   /packages               // Criar pacote (admin/agency)
PUT    /packages/:id           // Atualizar pacote
DELETE /packages/:id           // Deletar pacote
```

**Exemplo de filtros:**
```
GET /packages?destination=Paris&priceMin=5000&priceMax=15000&duration=7&badge=luxury
```

#### 3. Roteiros (`/itineraries`)
```typescript
GET    /itineraries            // Listar roteiros
GET    /itineraries/:id        // Detalhes de roteiro
POST   /itineraries            // Criar roteiro (creator)
PUT    /itineraries/:id        // Atualizar roteiro
DELETE /itineraries/:id        // Deletar roteiro
GET    /itineraries/:id/download // Download do PDF
```

#### 4. Reservas (`/bookings`)
```typescript
GET    /bookings               // Minhas reservas
GET    /bookings/:id           // Detalhes da reserva
POST   /bookings               // Criar reserva
PUT    /bookings/:id/cancel    // Cancelar reserva
PUT    /bookings/:id/confirm   // Confirmar (agency)
```

**Payload de criação:**
```json
{
  "packageId": "uuid",
  "travelStart": "2026-06-01",
  "travelEnd": "2026-06-08",
  "travelers": 2,
  "contactName": "João Silva",
  "contactEmail": "joao@email.com",
  "contactPhone": "+5511999999999",
  "specialRequests": "Lua de mel, preferência por quarto com vista"
}
```

#### 5. Avaliações (`/reviews`)
```typescript
GET    /reviews                // Listar avaliações
GET    /reviews/package/:id    // Reviews de um pacote
POST   /reviews                // Criar review
PUT    /reviews/:id            // Editar review
DELETE /reviews/:id            // Deletar review
POST   /reviews/:id/helpful    // Marcar como útil
```

#### 6. Favoritos (`/favorites`)
```typescript
GET    /favorites              // Meus favoritos
POST   /favorites              // Adicionar favorito
DELETE /favorites/:packageId   // Remover favorito
```

#### 7. Usuários (`/users`)
```typescript
GET    /users/me               // Perfil do usuário
PUT    /users/me               // Atualizar perfil
PUT    /users/me/avatar        // Upload de avatar
GET    /users/:id/itineraries  // Roteiros de um creator
```

---

## 🔐 Autenticação e Segurança

### Estratégia de Autenticação
```yaml
Método: JWT (JSON Web Tokens)
Access Token: 15 minutos de validade
Refresh Token: 7 dias de validade
Storage: HTTP-only cookies (web) / SecureStore (mobile)
```

### Flow de Autenticação
```
1. Login → Servidor valida credenciais
2. Servidor gera accessToken + refreshToken
3. Cliente armazena tokens
4. Cliente envia accessToken no header: Authorization: Bearer <token>
5. Quando expira → Usa refreshToken para renovar
```

### Implementação (Middleware)
```typescript
// src/middlewares/auth.middleware.ts
import jwt from 'jsonwebtoken';

export const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: { code: 'NO_TOKEN', message: 'Authentication required' }
    });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' }
    });
  }
};
```

### Proteção de Rotas
```typescript
// Rota pública
router.get('/packages', getPackages);

// Rota protegida (requer login)
router.post('/bookings', authenticate, createBooking);

// Rota admin (requer role específica)
router.delete('/packages/:id', authenticate, requireRole('ADMIN'), deletePackage);
```

---

## 🔌 Integrações Externas

### 1. Pagamentos (Stripe)
```typescript
// src/services/payment.service.ts
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createPaymentIntent = async (amount: number, bookingId: string) => {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount * 100, // Centavos
    currency: 'brl',
    metadata: { bookingId },
  });
  
  return paymentIntent;
};
```

### 2. Email (Resend)
```typescript
// src/services/email.service.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendBookingConfirmation = async (to: string, booking: Booking) => {
  await resend.emails.send({
    from: 'VAMO <reservas@vamo.app>',
    to,
    subject: '✅ Reserva Confirmada - VAMO',
    html: `<h1>Sua reserva foi confirmada!</h1>...`,
  });
};
```

### 3. Storage (AWS S3)
```typescript
// src/services/storage.service.ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({ region: 'us-east-1' });

export const uploadImage = async (file: Buffer, key: string) => {
  await s3.send(new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
    Body: file,
    ContentType: 'image/jpeg',
  }));
  
  return `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${key}`;
};
```

---

## 🚀 Roadmap de Implementação

### **Fase 1: MVP Backend (4-6 semanas)**

#### Sprint 1: Infraestrutura Base (1 semana)
- [ ] Setup do projeto Node.js + TypeScript
- [ ] Configuração Prisma + PostgreSQL (Supabase)
- [ ] Estrutura de pastas e organização
- [ ] Migrations do banco de dados
- [ ] Setup de variáveis de ambiente
- [ ] Deploy inicial (Railway/Render)

#### Sprint 2: Autenticação (1 semana)
- [ ] Sistema de registro e login
- [ ] JWT tokens (access + refresh)
- [ ] Middleware de autenticação
- [ ] Recuperação de senha
- [ ] Verificação de email

#### Sprint 3: Core APIs (2 semanas)
- [ ] CRUD de Packages
- [ ] CRUD de Reviews
- [ ] Sistema de favoritos
- [ ] Upload de imagens (S3)
- [ ] Busca e filtros avançados

#### Sprint 4: Sistema de Reservas (2 semanas)
- [ ] Criação de bookings
- [ ] Integração Stripe/Mercado Pago
- [ ] Email de confirmação (Resend)
- [ ] Dashboard de reservas
- [ ] Webhook de pagamentos

---

### **Fase 2: Features Avançadas (6-8 semanas)**

#### Sprint 5: Marketplace de Roteiros
- [ ] CRUD de Itineraries
- [ ] Sistema de creators
- [ ] Upload de PDFs
- [ ] Compra de roteiros digitais

#### Sprint 6: Integração com Agências
- [ ] Dashboard para agências
- [ ] Confirmação de reservas
- [ ] Sistema de comissões
- [ ] Relatórios de vendas

#### Sprint 7: Otimizações
- [ ] Cache com Redis
- [ ] CDN para imagens
- [ ] Índices de banco otimizados
- [ ] Rate limiting
- [ ] Logs e monitoring (Sentry)

---

### **Fase 3: Produção (4 semanas)**

#### Sprint 8: Testes e QA
- [ ] Testes unitários (Jest)
- [ ] Testes de integração
- [ ] Testes de carga
- [ ] Documentação completa (Swagger)

#### Sprint 9: Deploy e Lançamento
- [ ] CI/CD pipeline
- [ ] Ambiente de staging
- [ ] Backups automatizados
- [ ] Monitoramento de produção
- [ ] Lançamento gradual

---

## 📊 Métricas e Monitoramento

### KPIs Técnicos
```yaml
Performance:
  - Tempo de resposta: < 200ms (p95)
  - Disponibilidade: 99.9% uptime
  - Taxa de erro: < 0.1%

Escalabilidade:
  - Requisições/segundo: 1000+ RPS
  - Conexões simultâneas: 10,000+
  - Database queries: < 50ms (p95)
```

### Ferramentas
- **Logs**: Winston + CloudWatch
- **Errors**: Sentry
- **Performance**: New Relic ou DataDog
- **Uptime**: Uptime Robot

---

## 💰 Estimativa de Custos (Produção)

| Serviço | Provedor | Custo Mensal (USD) |
|---------|----------|-------------------|
| Backend Hosting | Railway/Render | $20-50 |
| Database | Supabase Pro | $25 |
| Redis Cache | Upstash | $10 |
| Storage S3 | AWS | $15 |
| Email | Resend | $15 |
| CDN | Cloudflare | $0 (Free) |
| Monitoring | Sentry | $26 |
| **TOTAL** | | **~$111-141/mês** |

---

## 🔗 Referências

- [Prisma Docs](https://www.prisma.io/docs)
- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
- [Supabase](https://supabase.com/docs)
- [Stripe API](https://stripe.com/docs/api)

---

**Última atualização:** 01 de Fevereiro de 2026  
**Status:** 📝 Documentação Completa - Aguardando Implementação
