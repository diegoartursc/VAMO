# VAMO Backend

Backend API for the VAMO Agency Management System.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database (local or hosted on Supabase/Neon)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Setup environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your database URL and JWT secret.

3. Initialize database:
```bash
npm run prisma:generate
npm run prisma:migrate
```

4. Start development server:
```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## 📋 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new agency
- `POST /api/auth/login` - Login

### Packages (Public)
- `GET /api/packages` - List all packages (with filters)
- `GET /api/packages/:id` - Get single package

### Packages (Protected - requires JWT)
- `POST /api/packages` - Create package
- `PUT /api/packages/:id` - Update package
- `DELETE /api/packages/:id` - Delete package (soft delete)

## 🛠️ Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio (database GUI)

## 📦 Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Auth:** JWT + bcrypt
- **Validation:** Zod
