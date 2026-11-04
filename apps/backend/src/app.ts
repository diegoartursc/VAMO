/**
 * Cria o app Express (rotas, middlewares, CORS, limites). Não abre porta nem
 * inicia jobs: isso fica em index.ts. Testes importam este módulo diretamente.
 */
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
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
import savedItemsRoutes from './routes/saved-items';
import paymentRoutes, { stripeWebhookHandler } from './routes/payments';
import shareRoutes from './routes/shares';
import privateDocsRoutes from './routes/private-docs';
import prisma from './lib/prisma';
import { LOCAL_UPLOADS_ROOT } from './lib/storage';
import { clearPublicCache } from './lib/publicCache';

const app = express();

// Atrás de proxy: quantos saltos de proxy CONFIÁVEIS existem antes do app.
// O IP do visitante (usado por todos os limites de tentativas) é o primeiro
// endereço do X-Forwarded-For depois de pular esses saltos. Valor errado:
//  - baixo demais → o app enxerga o IP do proxy (limites compartilhados entre
//    visitantes e fracos contra ataques). Foi o caso medido no Render, que fica
//    atrás da Cloudflare (AUD-03: contador oscilando com o mesmo IP de origem);
//  - alto demais → o visitante escolhe o próprio IP mandando X-Forwarded-For.
// Ver docs/security/README.md (verificação depois de mudar TRUST_PROXY_HOPS).
const trustProxyHops = process.env.TRUST_PROXY_HOPS ? Number(process.env.TRUST_PROXY_HOPS) : NaN;
app.set('trust proxy', Number.isInteger(trustProxyHops) && trustProxyHops >= 0 && trustProxyHops <= 5 ? trustProxyHops : 1);

// Security headers. A API serve JSON e imagens de /uploads consumidas por
// outras origens (Expo web em :8081, site dashboard), então liberamos
// Cross-Origin-Resource-Policy para não bloquear o carregamento dessas mídias.
// Não há HTML/app servido por aqui, então a CSP padrão do helmet é mantida
// sem risco para os clientes.
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// Rate limiting
// Em desenvolvimento (NODE_ENV !== 'production') o limite é generoso e
// pulamos requests de localhost — durante desenvolvimento é comum disparar
// muitos requests via HMR, testes e refetches, e bloquear o login da
// própria máquina cria um falso positivo que parece bug crítico.
const isDev = process.env.NODE_ENV !== 'production';
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    // AUD-03: 100 chamadas/15 min por IP era pouco para o app (cada tela faz
    // várias chamadas). Ajustável sem deploy de código via RATE_LIMIT_MAX.
    max: isDev ? 5000 : (Number(process.env.RATE_LIMIT_MAX) > 0 ? Number(process.env.RATE_LIMIT_MAX) : 300),
    standardHeaders: true,
    legacyHeaders: false,
    // Em dev, pula completamente localhost (evita falsos positivos por HMR/loops)
    skip: isDev
        ? (req) => {
            const ip = (req.ip || '').toString();
            return ip === '127.0.0.1' || ip === '::1' || ip.endsWith(':127.0.0.1') || ip.endsWith(':::1') || ip === '::ffff:127.0.0.1';
        }
        : undefined,
    message: { error: 'Too many requests. Please wait a few minutes and try again.' },
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
    'http://localhost:3034', // Painel admin (launch "admin")
    'http://localhost:8081', // Expo web
    'http://localhost:8082', // Expo web (porta alternativa quando a 8081 está ocupada)
    'http://localhost:19006', // Expo Go
];

const corsOrigins = ALLOWED_ORIGINS.length > 0 ? ALLOWED_ORIGINS : DEFAULT_DEV_ORIGINS;

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, Postman)
        if (!origin) return callback(null, true);
        if (corsOrigins.includes(origin)) return callback(null, true);
        // Em desenvolvimento, qualquer porta de localhost (app, site, painel
        // admin, worktrees) — lista fixa quebrava o login a cada porta nova.
        if (isDev && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return callback(null, true);
        callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
}));
// Webhook do Stripe: registrado ANTES do express.json (a assinatura é
// verificada sobre o corpo BRUTO) e antes do rate limiter (Stripe reenvia
// eventos e não pode ser bloqueado por limite de IP).
// Pedidos lentos (AUD-OBS): uma linha JSON por pedido acima de
// SLOW_REQUEST_MS (padrão 1000 ms), sem query string, corpo ou dado pessoal.
// Os ids no caminho viram ':id'. O x-request-id do cliente (ou um gerado)
// volta na resposta para correlacionar com o log.
const SLOW_MS = Number(process.env.SLOW_REQUEST_MS) > 0 ? Number(process.env.SLOW_REQUEST_MS) : 1000;
app.use((req, res, next) => {
    const started = process.hrtime.bigint();
    const incoming = req.header('x-request-id');
    const requestId = incoming && /^[A-Za-z0-9._-]{1,64}$/.test(incoming) ? incoming : Math.random().toString(36).slice(2, 12);
    res.setHeader('X-Request-Id', requestId);
    res.on('finish', () => {
        const ms = Number(process.hrtime.bigint() - started) / 1e6;
        if (ms < SLOW_MS) return;
        const route = req.originalUrl.split('?')[0].replace(/\/c[a-z0-9]{20,}(?=\/|$)/g, '/:id').slice(0, 200);
        console.warn(JSON.stringify({ evt: 'slow_request', method: req.method, route, status: res.statusCode, ms: Math.round(ms), requestId }));
    });
    next();
});

// Cache do catálogo público (lib/publicCache.ts): qualquer escrita
// bem-sucedida (inclusive o webhook de pagamento) limpa o cache, para que
// publicar, aprovar, editar, avaliar ou vender apareça na hora.
app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS') {
        res.on('finish', () => { if (res.statusCode < 400) clearPublicCache(); });
    }
    next();
});
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), stripeWebhookHandler);

app.use(express.json());
app.use('/api', limiter);

// Arquivos privados da Central da Viagem gravados pelo fluxo legado dividiam
// este diretório público com a mídia dos roteiros (SEC-05). A checagem usa o
// MESMO caminho que o express.static vai servir: decodifica, normaliza barras e
// pontos e confere pelo nome do arquivo em qualquer subpasta. Falha fechado.
import path from 'path';
app.use('/uploads', async (req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.status(405).end();
        return;
    }
    let decoded: string;
    try {
        decoded = decodeURIComponent(req.path);
    } catch {
        res.status(400).end();
        return;
    }
    const normalized = path.posix.normalize(`/${decoded.replace(/\\/g, '/')}`);
    const filename = path.posix.basename(normalized);
    if (!filename || normalized.includes('\0')) {
        res.status(404).end();
        return;
    }
    try {
        const privateRecord = await prisma.travelerFile.findFirst({
            // Sem diferenciar maiúsculas: disco do Mac/Windows não diferencia (R-U3).
            where: { url: { endsWith: `/${filename}`, mode: 'insensitive' } },
            select: { id: true },
        });
        if (privateRecord) {
            res.status(404).json({ error: 'File not found' });
            return;
        }
        next();
    } catch (error) {
        console.error('Error checking private upload:', error);
        res.status(500).json({ error: 'Failed to validate file' });
    }
});
app.use('/uploads', express.static(LOCAL_UPLOADS_ROOT));

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
app.use('/api/saved-items', savedItemsRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/share', shareRoutes);
app.use('/api/private-docs', privateDocsRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Erros do cliente não são falha do servidor (AUD-02): corpo grande demais,
    // JSON inválido e origem recusada pelo CORS respondiam 500 e poluíam o log.
    if (err?.type === 'entity.too.large') {
        res.status(413).json({ error: 'Request body too large.' });
        return;
    }
    if (err?.type === 'entity.parse.failed') {
        res.status(400).json({ error: 'Invalid JSON body.' });
        return;
    }
    if (typeof err?.message === 'string' && err.message.endsWith('not allowed by CORS')) {
        res.status(403).json({ error: 'Origin not allowed.' });
        return;
    }
    console.error(err.stack);
    res.status(500).json({
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

export default app;
