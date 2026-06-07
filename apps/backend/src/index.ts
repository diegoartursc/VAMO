import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import travelerAuthRoutes from './routes/traveler-auth';
import itineraryRoutes from './routes/itineraries';
import creatorRoutes from './routes/creators';
import destinationRoutes from './routes/destinations';
import reviewRoutes from './routes/reviews';
import myTripsRoutes from './routes/my-trips';
import adminRoutes from './routes/admin';
import auditLogsRoutes from './routes/audit-logs';
import ratesRoutes from './routes/rates';
import uploadsRoutes from './routes/uploads';
import questionRoutes from './routes/questions';
import travelerTripCenterRoutes from './routes/traveler-trip-center';
import travelerRouteCustomizationRoutes from './routes/traveler-route-customization';
import prisma from './lib/prisma';

const app = express();
const PORT = process.env.PORT || 3333;

// Atrás de proxy (Render/Vercel/etc.): confia no primeiro hop para que o
// express-rate-limit leia o IP real via X-Forwarded-For sem disparar o
// ERR_ERL_UNEXPECTED_X_FORWARDED_FOR.
app.set('trust proxy', 1);

// Rate limiting
// Em desenvolvimento (NODE_ENV !== 'production') o limite é generoso e
// pulamos requests de localhost — durante desenvolvimento é comum disparar
// muitos requests via HMR, testes e refetches, e bloquear o login da
// própria máquina cria um falso positivo que parece bug crítico.
const isDev = process.env.NODE_ENV !== 'production';
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isDev ? 5000 : 100,
    standardHeaders: true,
    legacyHeaders: false,
    // Em dev, pula completamente localhost (evita falsos positivos por HMR/loops)
    skip: isDev
        ? (req) => {
            const ip = (req.ip || '').toString();
            return ip === '127.0.0.1' || ip === '::1' || ip.endsWith(':127.0.0.1') || ip.endsWith(':::1') || ip === '::ffff:127.0.0.1';
        }
        : undefined,
    message: { error: 'Muitas requisições. Aguarde alguns minutos e tente novamente.' },
});

// Allowed origins: site dashboard, local dev, and Expo mobile app
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);

// Always allow local dev origins
const DEFAULT_DEV_ORIGINS = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3030', // Claude Preview worktree
    'http://localhost:3033', // Site dashboard (worktree)
    'http://localhost:8081', // Expo web
    'http://localhost:19006', // Expo Go
];

const corsOrigins = ALLOWED_ORIGINS.length > 0 ? ALLOWED_ORIGINS : DEFAULT_DEV_ORIGINS;

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, Postman)
        if (!origin) return callback(null, true);
        if (corsOrigins.includes(origin)) return callback(null, true);
        callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
}));
app.use(express.json());
app.use('/api', limiter);

// Traveler files created by the legacy flow shared this public directory
// with itinerary media. Block direct access when the filename belongs to a
// private TravelerFile; the signed Trip Center endpoint remains available.
import path from 'path';
app.get('/uploads/itineraries/:filename', async (req, res, next) => {
    try {
        const filename = path.basename(req.params.filename);
        const privateRecord = await prisma.travelerFile.findFirst({
            where: { url: { endsWith: `/uploads/itineraries/${filename}` } },
            select: { id: true },
        });
        if (privateRecord) {
            res.status(404).json({ error: 'Arquivo não encontrado' });
            return;
        }
        next();
    } catch (error) {
        console.error('Error checking private upload:', error);
        res.status(500).json({ error: 'Falha ao validar arquivo' });
    }
});
app.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads')));

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.get('/api', (req, res) => {
    res.json({
        message: 'VAMO Agency Management API',
        version: '1.0.0'
    });
});

// API Routes
app.use('/api/auth/traveler', travelerAuthRoutes);
app.use('/api/itineraries', itineraryRoutes);
app.use('/api/creators', creatorRoutes);
app.use('/api/destinations', destinationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/my-trips', myTripsRoutes);
app.use('/api/trip-center', travelerTripCenterRoutes);
app.use('/api/route-customization', travelerRouteCustomizationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/audit-logs', auditLogsRoutes);
app.use('/api/rates', ratesRoutes);
app.use('/api/uploads', uploadsRoutes);
app.use('/api/questions', questionRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
