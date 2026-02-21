import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'vamo-admin-secret-2024';

// ─── Auth Middleware ────────────────────────────────────────────────────────
async function verifyAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Token obrigatório' });
        return;
    }
    try {
        const token = auth.split(' ')[1];
        const payload = jwt.verify(token, JWT_SECRET) as { adminId: string };
        const admin = await prisma.admin.findUnique({ where: { id: payload.adminId } });
        if (!admin || !admin.active) {
            res.status(401).json({ error: 'Admin inválido' });
            return;
        }
        (req as any).admin = admin;
        next();
    } catch {
        res.status(401).json({ error: 'Token inválido' });
    }
}

// POST /api/admin/login
router.post('/login', async (req: Request, res: Response) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
        res.status(400).json({ error: 'Email e senha obrigatórios' });
        return;
    }
    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin || !admin.active) {
        res.status(401).json({ error: 'Credenciais inválidas' });
        return;
    }
    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) {
        res.status(401).json({ error: 'Credenciais inválidas' });
        return;
    }
    const token = jwt.sign({ adminId: admin.id, role: admin.role }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role } });
});

// POST /api/admin/seed — create first super admin (only if none exist)
router.post('/seed', async (req: Request, res: Response) => {
    const count = await prisma.admin.count();
    if (count > 0) {
        res.status(409).json({ error: 'Admin já existe. Use o endpoint de login.' });
        return;
    }
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) {
        res.status(400).json({ error: 'name, email e password são obrigatórios' });
        return;
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const admin = await prisma.admin.create({
        data: { name, email, passwordHash, role: 'SUPER_ADMIN' },
    });
    res.status(201).json({ id: admin.id, email: admin.email, role: admin.role });
});

// GET /api/admin/stats
router.get('/stats', verifyAdmin, async (_req: Request, res: Response) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [pendingPackages, pendingItineraries, approvedToday, rejectedTotal] = await Promise.all([
        prisma.package.count({ where: { status: 'PENDING_REVIEW' } }),
        prisma.itinerary.count({ where: { status: 'PENDING_REVIEW' } }),
        prisma.package.count({ where: { status: 'APPROVED', approvedAt: { gte: today } } }),
        prisma.package.count({ where: { status: 'REJECTED' } }),
    ]);

    res.json({
        pendingPackages,
        pendingItineraries,
        totalPending: pendingPackages + pendingItineraries,
        approvedToday,
        rejectedTotal,
    });
});

// GET /api/admin/pending
router.get('/pending', verifyAdmin, async (req: Request, res: Response) => {
    const { type } = req.query as { type?: string };

    const [packages, itineraries] = await Promise.all([
        type === 'itinerary' ? Promise.resolve([]) : prisma.package.findMany({
            where: { status: 'PENDING_REVIEW' },
            orderBy: { createdAt: 'asc' },
            include: {
                agency: { select: { id: true, name: true, logo: true } },
                images: { take: 1, orderBy: { order: 'asc' }, select: { url: true } },
            },
        }),
        type === 'package' ? Promise.resolve([]) : prisma.itinerary.findMany({
            where: { status: 'PENDING_REVIEW' },
            orderBy: { createdAt: 'asc' },
            include: {
                creator: { select: { id: true, traveler: { select: { name: true, avatar: true } } } },
                images: { take: 1, orderBy: { order: 'asc' }, select: { url: true } },
            },
        }),
    ]);

    res.json({ packages, itineraries });
});

// GET /api/admin/all
router.get('/all', verifyAdmin, async (req: Request, res: Response) => {
    const { status, type } = req.query as { status?: string; type?: string };

    const pkgWhere: any = status ? { status } : {};
    const itWhere: any = status ? { status } : {};

    const [packages, itineraries] = await Promise.all([
        type === 'itinerary' ? Promise.resolve([]) : prisma.package.findMany({
            where: pkgWhere,
            orderBy: { updatedAt: 'desc' },
            take: 50,
            select: {
                id: true, title: true, destination: true, status: true,
                approvalNote: true, approvedAt: true, createdAt: true, qualityScore: true,
                agency: { select: { name: true } },
            },
        }),
        type === 'package' ? Promise.resolve([]) : prisma.itinerary.findMany({
            where: itWhere,
            orderBy: { updatedAt: 'desc' },
            take: 50,
            select: {
                id: true, title: true, destination: true, status: true,
                approvalNote: true, approvedAt: true, createdAt: true, qualityScore: true,
                creator: { select: { traveler: { select: { name: true } } } },
            },
        }),
    ]);

    res.json({ packages, itineraries });
});

// POST /api/admin/packages/:id/approve
router.post('/packages/:id/approve', verifyAdmin, async (req: Request, res: Response) => {
    const { id } = req.params;
    const pkg = await prisma.package.update({
        where: { id },
        data: { status: 'APPROVED', approvedAt: new Date(), approvedBy: (req as any).admin.id, approvalNote: null },
    });
    res.json({ id: pkg.id, status: pkg.status, approvedAt: pkg.approvedAt });
});

// POST /api/admin/packages/:id/reject
router.post('/packages/:id/reject', verifyAdmin, async (req: Request, res: Response) => {
    const { id } = req.params;
    const { note } = req.body || {};
    const pkg = await prisma.package.update({
        where: { id },
        data: {
            status: 'REJECTED',
            approvalNote: note || 'Não atende aos critérios de qualidade da plataforma.',
            approvedBy: (req as any).admin.id,
        },
    });
    res.json({ id: pkg.id, status: pkg.status, approvalNote: pkg.approvalNote });
});

// POST /api/admin/itineraries/:id/approve
router.post('/itineraries/:id/approve', verifyAdmin, async (req: Request, res: Response) => {
    const { id } = req.params;
    const it = await prisma.itinerary.update({
        where: { id },
        data: { status: 'APPROVED', approvedAt: new Date(), approvedBy: (req as any).admin.id, approvalNote: null },
    });
    res.json({ id: it.id, status: it.status, approvedAt: it.approvedAt });
});

// POST /api/admin/itineraries/:id/reject
router.post('/itineraries/:id/reject', verifyAdmin, async (req: Request, res: Response) => {
    const { id } = req.params;
    const { note } = req.body || {};
    const it = await prisma.itinerary.update({
        where: { id },
        data: {
            status: 'REJECTED',
            approvalNote: note || 'Não atende aos critérios de qualidade da plataforma.',
            approvedBy: (req as any).admin.id,
        },
    });
    res.json({ id: it.id, status: it.status, approvalNote: it.approvalNote });
});

export default router;
