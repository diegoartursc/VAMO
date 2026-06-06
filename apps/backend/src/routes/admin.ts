import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

const router = Router();
const JWT_SECRET: string = process.env.JWT_SECRET || (() => {
    throw new Error('FATAL: JWT_SECRET must be set for admin authentication.');
})();
let devAdminCache: any = null;

// ─── Auth Middleware ────────────────────────────────────────────────────────
async function verifyAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Token obrigatório' });
        return;
    }
    const token = auth.split(' ')[1];

    // MVP "no-login" bypass: aceita o token fake usado pelo /admin/login do site
    // em dev. Resolve (ou cria) um admin real no banco para que aprovações/rejeições
    // tenham um approvedBy válido (FK).
    if (process.env.NODE_ENV !== 'production' && token === 'mock-admin-token') {
        if (devAdminCache) {
            (req as any).admin = devAdminCache;
            next();
            return;
        }

        let admin = await prisma.admin.findFirst({ where: { active: true } }).catch(() => null);
        if (!admin) {
            admin = await prisma.admin.create({
                data: {
                    name: 'Dev Admin',
                    email: 'dev-admin@vamo.local',
                    passwordHash: await bcrypt.hash('dev-only', 10),
                    role: 'SUPER_ADMIN',
                    active: true,
                },
            }).catch(() => null);
        }
        if (!admin) { res.status(500).json({ error: 'Falha ao resolver admin dev' }); return; }
        devAdminCache = admin;
        (req as any).admin = admin;
        next();
        return;
    }

    try {
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
    if (process.env.NODE_ENV === 'production') {
        const configuredSecret = process.env.ADMIN_SEED_SECRET;
        const providedSecret = req.header('x-admin-seed-secret');
        if (!configuredSecret || providedSecret !== configuredSecret) {
            res.status(403).json({ error: 'Bootstrap de admin não autorizado' });
            return;
        }
    }
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

// GET /api/admin/creators/pending
router.get('/creators/pending', verifyAdmin, async (_req: Request, res: Response) => {
    try {
        const creators = await prisma.creator.findMany({
            where: { verificationLevel: 'BASIC' },
            select: {
                id: true,
                bio: true,
                createdAt: true,
                traveler: { select: { name: true, email: true, avatar: true } },
            },
            orderBy: { createdAt: 'asc' },
        });
        res.json(creators);
    } catch (error) {
        console.error('Error fetching pending creators:', error);
        res.status(500).json({ error: 'Falha ao carregar roteiristas pendentes' });
    }
});

// POST /api/admin/creators/:id/approve
router.post('/creators/:id/approve', verifyAdmin, async (req: Request, res: Response) => {
    try {
        const id = String(req.params.id);
        const existing = await prisma.creator.findUnique({ where: { id }, select: { id: true } });
        if (!existing) {
            res.status(404).json({ error: 'Roteirista não encontrado' });
            return;
        }
        const creator = await prisma.creator.update({
            where: { id },
            data: { verificationLevel: 'TRUSTED' },
            select: { id: true, verificationLevel: true },
        });
        res.json(creator);
    } catch (error) {
        console.error('Error approving creator:', error);
        res.status(500).json({ error: 'Falha ao aprovar roteirista' });
    }
});

// GET /api/admin/agencies
router.get('/agencies', verifyAdmin, async (_req: Request, res: Response) => {
    try {
        const agencies = await prisma.agency.findMany({
            include: {
                employees: {
                    select: { id: true, name: true, email: true, role: true, active: true },
                    orderBy: { createdAt: 'asc' },
                },
                packages: {
                    select: { qualityScore: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json(agencies.map((agency) => {
            const qualityScores = agency.packages
                .map((pkg) => pkg.qualityScore)
                .filter((score): score is number => score !== null);
            return {
                id: agency.id,
                name: agency.name,
                cnpj: agency.cnpj,
                manager: agency.employees[0]?.name ?? '',
                email: agency.employees[0]?.email ?? '',
                packagesCount: agency.packages.length,
                qualityAvg: qualityScores.length > 0
                    ? Math.round(qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length)
                    : 0,
                status: agency.employees.length > 0 && agency.employees.every((employee) => !employee.active)
                    ? 'SUSPENDED'
                    : agency.verified ? 'ACTIVE' : 'PENDING',
                verified: agency.verified,
                createdAt: agency.createdAt,
            };
        }));
    } catch (error) {
        console.error('Error fetching agencies:', error);
        res.status(500).json({ error: 'Falha ao carregar agências' });
    }
});

// POST /api/admin/agencies
router.post('/agencies', verifyAdmin, async (req: Request, res: Response) => {
    try {
        const { name, cnpj, employeeName, email, password } = req.body || {};
        if (!name || !employeeName || !email || !password) {
            res.status(400).json({ error: 'name, employeeName, email e password são obrigatórios' });
            return;
        }
        if (String(password).length < 8) {
            res.status(400).json({ error: 'A senha deve ter pelo menos 8 caracteres' });
            return;
        }

        const normalizedEmail = String(email).trim().toLowerCase();
        const existingEmployee = await prisma.agencyEmployee.findUnique({ where: { email: normalizedEmail } });
        if (existingEmployee) {
            res.status(409).json({ error: 'Já existe um gestor com este email' });
            return;
        }

        const passwordHash = await bcrypt.hash(String(password), 10);
        const agency = await prisma.agency.create({
            data: {
                name: String(name).trim(),
                cnpj: cnpj ? String(cnpj).trim() : null,
                verified: false,
                employees: {
                    create: {
                        name: String(employeeName).trim(),
                        email: normalizedEmail,
                        passwordHash,
                        role: 'MANAGER',
                    },
                },
            },
            select: { id: true, name: true, cnpj: true, verified: true, createdAt: true },
        });
        res.status(201).json(agency);
    } catch (error) {
        console.error('Error creating agency:', error);
        res.status(500).json({ error: 'Falha ao criar agência' });
    }
});

// PATCH /api/admin/agencies/:id/status
router.patch('/agencies/:id/status', verifyAdmin, async (req: Request, res: Response) => {
    try {
        const id = String(req.params.id);
        const status = String(req.body?.status || '');
        if (!['PENDING', 'ACTIVE', 'SUSPENDED'].includes(status)) {
            res.status(400).json({ error: 'Status de agência inválido' });
            return;
        }
        const existing = await prisma.agency.findUnique({ where: { id }, select: { id: true } });
        if (!existing) {
            res.status(404).json({ error: 'Agência não encontrada' });
            return;
        }
        await prisma.$transaction([
            prisma.agency.update({
                where: { id },
                data: { verified: status === 'ACTIVE' },
            }),
            prisma.agencyEmployee.updateMany({
                where: { agencyId: id },
                data: { active: status !== 'SUSPENDED' },
            }),
        ]);
        res.json({ id, status });
    } catch (error) {
        console.error('Error updating agency status:', error);
        res.status(500).json({ error: 'Falha ao atualizar status da agência' });
    }
});

// GET /api/admin/stats
router.get('/stats', verifyAdmin, async (_req: Request, res: Response) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const pendingPackages = await prisma.package.count({ where: { status: 'PENDING_REVIEW' } });
        const pendingItineraries = await prisma.itinerary.count({ where: { status: 'PENDING_REVIEW' } });
        const approvedPackagesToday = await prisma.package.count({ where: { status: 'APPROVED', approvedAt: { gte: today } } });
        const approvedItinerariesToday = await prisma.itinerary.count({ where: { status: 'ACTIVE', approvedAt: { gte: today } } });
        const rejectedPackages = await prisma.package.count({ where: { status: 'REJECTED' } });
        const rejectedItineraries = await prisma.itinerary.count({ where: { status: 'REJECTED' } });

        res.json({
            pendingPackages,
            pendingItineraries,
            totalPending: pendingPackages + pendingItineraries,
            approvedToday: approvedPackagesToday + approvedItinerariesToday,
            rejectedTotal: rejectedPackages + rejectedItineraries,
        });
    } catch (error) {
        console.error('[admin stats] error:', error);
        res.status(500).json({ error: 'Failed to fetch admin stats' });
    }
});

// GET /api/admin/pending
router.get('/pending', verifyAdmin, async (req: Request, res: Response) => {
    try {
        const { type } = req.query as { type?: string };

        const packages = type === 'itinerary' ? [] : await prisma.package.findMany({
            where: { status: 'PENDING_REVIEW' },
            orderBy: { createdAt: 'asc' },
            include: {
                agency: { select: { id: true, name: true, logo: true } },
                images: { take: 1, orderBy: { order: 'asc' }, select: { url: true } },
            },
        });
        const itineraryRows = type === 'package' ? [] : await prisma.itinerary.findMany({
            where: { status: 'PENDING_REVIEW' },
            orderBy: { createdAt: 'asc' },
            include: {
                creator: { select: { id: true, traveler: { select: { name: true, avatar: true } } } },
                images: { take: 1, orderBy: { order: 'asc' }, select: { url: true } },
            },
        });
        const itineraries = itineraryRows.map((r: any) => ({
            // Resolve thumbnail server-side: prefere ItineraryImage[0], depois
            // highlightPhotos[0], depois mediaUrls[0]. Admin sempre vê algo.
            ...r,
            images: r.images?.length
                ? r.images
                : r.highlightPhotos?.[0]
                    ? [{ url: r.highlightPhotos[0] }]
                    : r.mediaUrls?.[0]
                        ? [{ url: r.mediaUrls[0] }]
                        : [],
        }));

        res.json({ packages, itineraries });
    } catch (error) {
        console.error('[admin pending] error:', error);
        res.status(500).json({ error: 'Failed to fetch pending admin items' });
    }
});

// GET /api/admin/all
router.get('/all', verifyAdmin, async (req: Request, res: Response) => {
    try {
        const { status, type } = req.query as { status?: string; type?: string };

        const pkgWhere: any = status ? { status } : {};
        const itWhere: any = status ? { status } : {};

        const packages = type === 'itinerary' ? [] : await prisma.package.findMany({
            where: pkgWhere,
            orderBy: { updatedAt: 'desc' },
            take: 50,
            select: {
                id: true, title: true, destination: true, status: true,
                approvalNote: true, approvedAt: true, createdAt: true, qualityScore: true,
                agency: { select: { name: true } },
            },
        });
        const itineraryRows = type === 'package' ? [] : await prisma.itinerary.findMany({
            where: itWhere,
            orderBy: { updatedAt: 'desc' },
            take: 50,
            select: {
                id: true, title: true, destination: true, country: true, status: true,
                approvalNote: true, approvedAt: true, createdAt: true, qualityScore: true,
                price: true, currency: true,
                travelProofUrl: true,
                // Galeria + capa (highlightPhotos) — admin precisa ver thumbnail
                images: { take: 1, orderBy: { order: 'asc' }, select: { url: true } },
                highlightPhotos: true,
                mediaUrls: true,
                creator: { select: { traveler: { select: { name: true } } } },
            },
        });
        const itineraries = itineraryRows.map((r: any) => ({
            ...r,
            images: r.images?.length
                ? r.images
                : r.highlightPhotos?.[0]
                    ? [{ url: r.highlightPhotos[0] }]
                    : r.mediaUrls?.[0]
                        ? [{ url: r.mediaUrls[0] }]
                        : [],
        }));

        res.json({ packages, itineraries });
    } catch (error) {
        console.error('[admin all] error:', error);
        res.status(500).json({ error: 'Failed to fetch admin items' });
    }
});

// GET /api/admin/itineraries/:id
router.get('/itineraries/:id', verifyAdmin, async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const itinerary = await prisma.itinerary.findUnique({
            where: { id },
            include: {
                creator: { select: { id: true, traveler: { select: { id: true, name: true, avatar: true, email: true } } } },
                images: { orderBy: { order: 'asc' } },
                days: { orderBy: { dayNumber: 'asc' }, include: { activities: { orderBy: { order: 'asc' } } } },
                accommodations: { orderBy: { order: 'asc' } },
                transports: { orderBy: { order: 'asc' } },
                checklists: { orderBy: { order: 'asc' } },
                files: true,
                reviews: { orderBy: { createdAt: 'desc' }, take: 10, include: { images: true, responses: true } },
            },
        });
        if (!itinerary) {
            res.status(404).json({ error: 'Itinerary not found' });
            return;
        }
        res.json(itinerary);
    } catch (error) {
        console.error('[admin itinerary detail] error:', error);
        res.status(500).json({ error: 'Failed to fetch itinerary detail' });
    }
});

// POST /api/admin/packages/:id/approve
router.post('/packages/:id/approve', verifyAdmin, async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const pkg = await prisma.package.update({
        where: { id },
        data: { status: 'APPROVED', approvedAt: new Date(), approvedBy: (req as any).admin.id, approvalNote: null },
    });
    res.json({ id: pkg.id, status: pkg.status, approvedAt: pkg.approvedAt });
});

// POST /api/admin/packages/:id/reject
router.post('/packages/:id/reject', verifyAdmin, async (req: Request, res: Response) => {
    const id = req.params.id as string;
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
    try {
        const id = req.params.id as string;
        const existing = await prisma.itinerary.findUnique({ where: { id }, select: { id: true, status: true } });
        if (!existing) {
            res.status(404).json({ error: 'Itinerary not found' });
            return;
        }
        if (existing.status !== 'PENDING_REVIEW') {
            res.status(400).json({ error: 'Apenas roteiros em análise podem ser aprovados.' });
            return;
        }
        const it = await prisma.itinerary.update({
            where: { id },
            data: { status: 'ACTIVE', approvedAt: new Date(), approvedBy: (req as any).admin.id, approvalNote: null },
        });
        res.json({ id: it.id, status: it.status, approvedAt: it.approvedAt });
    } catch (error) {
        console.error('[admin itinerary approve] error:', error);
        res.status(500).json({ error: 'Failed to approve itinerary' });
    }
});

// POST /api/admin/itineraries/:id/reject
router.post('/itineraries/:id/reject', verifyAdmin, async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const { note } = req.body || {};
        const rejectionNote = String(note || '').trim();
        if (!rejectionNote) {
            res.status(400).json({ error: 'Informe o motivo da rejeição.' });
            return;
        }
        const existing = await prisma.itinerary.findUnique({ where: { id }, select: { id: true, status: true } });
        if (!existing) {
            res.status(404).json({ error: 'Itinerary not found' });
            return;
        }
        if (existing.status !== 'PENDING_REVIEW') {
            res.status(400).json({ error: 'Apenas roteiros em análise podem ser rejeitados.' });
            return;
        }
        const it = await prisma.itinerary.update({
            where: { id },
            data: {
                status: 'REJECTED',
                approvalNote: rejectionNote,
                approvedBy: (req as any).admin.id,
            },
        });
        res.json({ id: it.id, status: it.status, approvalNote: it.approvalNote });
    } catch (error) {
        console.error('[admin itinerary reject] error:', error);
        res.status(500).json({ error: 'Failed to reject itinerary' });
    }
});

// ─────────────────────────────────────────────────────────────────────────
// COST DISCLOSURE — Admin review of cost proofs (transparência graduada)
// ─────────────────────────────────────────────────────────────────────────
//
// Para qualquer item com `cost.disclosureType === 'verified'` que tenha
// `proofFiles`, o admin pode revisar o comprovante e aprovar/rejeitar.
// Aprovação muda `proofStatus` para "approved" e habilita o selo
// "Verificado pela VAMO" na vitrine. Rejeição muda para "rejected".

interface CostProofRow {
    module: string;     // 'accommodation' | 'transport' | 'attraction' | 'restaurant' | 'flight' | 'extra'
    itemRef: string;    // 'accommodations[0]', 'attractions[2]', 'flightCost', etc.
    itemLabel?: string; // name/title do item (fallback)
    disclosureType: string;
    proofStatus: string;
    amount?: string | number | null;
    currency?: string;
    notes?: string;
    proofFiles: Array<{ url: string; name?: string; mimeType?: string }>;
}

function extractCostRowsFromItinerary(it: any): CostProofRow[] {
    const rows: CostProofRow[] = [];
    const pushItem = (
        module: CostProofRow['module'],
        itemRef: string,
        item: any,
        label?: string,
    ) => {
        const c = item?.cost;
        if (!c || c.disclosureType !== 'verified') return;
        const files = Array.isArray(c.proofFiles) ? c.proofFiles : [];
        if (files.length === 0) return; // Sem comprovante anexado, nada a revisar
        rows.push({
            module,
            itemRef,
            itemLabel: label || undefined,
            disclosureType: c.disclosureType,
            proofStatus: c.proofStatus || 'uploaded',
            amount: c.amount,
            currency: c.currency,
            notes: c.notes,
            proofFiles: files,
        });
    };

    (it.accommodations || []).forEach((a: any, i: number) =>
        pushItem('accommodation', `accommodations[${i}]`, a, a.name));
    (it.transports || []).forEach((t: any, i: number) =>
        pushItem('transport', `transports[${i}]`, t, t.description));
    (Array.isArray(it.attractions) ? it.attractions : []).forEach((a: any, i: number) =>
        pushItem('attraction', `attractions[${i}]`, a, a.name));
    (Array.isArray(it.restaurants) ? it.restaurants : []).forEach((r: any, i: number) =>
        pushItem('restaurant', `restaurants[${i}]`, r, r.name));
    (Array.isArray(it.extraSpendingItems) ? it.extraSpendingItems : []).forEach((e: any, i: number) =>
        pushItem('extra', `extraSpendingItems[${i}]`, e, e.title));

    if (it.flightInfo) {
        pushItem('flight', 'flightInfo', it.flightInfo, 'Passagem aérea');
    }
    return rows;
}

// GET /api/admin/itineraries/:id/cost-proofs
// Lista todos os comprovantes anexados a itens com disclosureType=verified.
router.get('/itineraries/:id/cost-proofs', verifyAdmin, async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const it = await prisma.itinerary.findUnique({
            where: { id },
            include: {
                accommodations: { orderBy: { order: 'asc' } },
                transports: { orderBy: { order: 'asc' } },
                creator: { include: { traveler: { select: { name: true, avatar: true } } } },
            },
        });
        if (!it) {
            res.status(404).json({ error: 'Itinerary not found' });
            return;
        }
        const rows = extractCostRowsFromItinerary(it);
        res.json({
            id: it.id,
            title: it.title,
            destination: it.destination,
            country: it.country,
            status: it.status,
            creator: {
                id: it.creator.id,
                name: it.creator.traveler.name,
            },
            totalProofs: rows.length,
            byStatus: {
                uploaded: rows.filter(r => r.proofStatus === 'uploaded').length,
                pending_review: rows.filter(r => r.proofStatus === 'pending_review').length,
                approved: rows.filter(r => r.proofStatus === 'approved').length,
                rejected: rows.filter(r => r.proofStatus === 'rejected').length,
            },
            proofs: rows,
        });
    } catch (error) {
        console.error('[admin cost-proofs] error:', error);
        res.status(500).json({ error: 'Failed to fetch cost proofs' });
    }
});

// POST /api/admin/itineraries/:id/cost-proofs/decide
// body: { module, itemRef, decision: 'approved' | 'rejected' | 'pending_review', note?: string }
//
// Aprovação habilita selo "Verificado pela VAMO" no item. Rejeição
// mantém o valor visível mas remove o selo.
router.post('/itineraries/:id/cost-proofs/decide', verifyAdmin, async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const { module, itemRef, decision, note } = req.body || {};

        const ALLOWED: ReadonlyArray<string> = ['approved', 'rejected', 'pending_review'];
        if (!module || !itemRef || !decision || !ALLOWED.includes(decision)) {
            res.status(400).json({
                error: 'Required: module, itemRef, decision (approved | rejected | pending_review)',
            });
            return;
        }

        const it = await prisma.itinerary.findUnique({
            where: { id },
            include: {
                accommodations: { orderBy: { order: 'asc' } },
                transports: { orderBy: { order: 'asc' } },
            },
        });
        if (!it) {
            res.status(404).json({ error: 'Itinerary not found' });
            return;
        }

        // Resolve item de acordo com itemRef. Formatos aceitos:
        //   accommodations[N], transports[N]  → tabela dedicada (updateById)
        //   attractions[N], restaurants[N], extraSpendingItems[N], flightInfo → JSON do Itinerary
        const match = /^(\w+)(?:\[(\d+)\])?$/.exec(String(itemRef));
        if (!match) {
            res.status(400).json({ error: 'Invalid itemRef format' });
            return;
        }
        const field = match[1] as string;
        const idx = match[2] != null ? parseInt(match[2], 10) : null;

        const setCostStatus = (existingCost: any): any => ({
            ...(existingCost || {}),
            proofStatus: decision,
            ...(decision === 'rejected' && note ? { adminNote: note } : {}),
            updatedAt: new Date().toISOString(),
        });

        if (field === 'accommodations' && idx != null) {
            const item = (it as any).accommodations?.[idx];
            if (!item) { res.status(404).json({ error: 'Accommodation not found' }); return; }
            await prisma.itineraryAccommodation.update({
                where: { id: item.id },
                data: { cost: setCostStatus(item.cost) },
            });
        } else if (field === 'transports' && idx != null) {
            const item = (it as any).transports?.[idx];
            if (!item) { res.status(404).json({ error: 'Transport not found' }); return; }
            await prisma.itineraryTransport.update({
                where: { id: item.id },
                data: { cost: setCostStatus(item.cost) },
            });
        } else if ((field === 'attractions' || field === 'restaurants' || field === 'extraSpendingItems') && idx != null) {
            const list = ((it as any)[field] || []).slice();
            if (!list[idx]) { res.status(404).json({ error: `${field}[${idx}] not found` }); return; }
            list[idx] = { ...list[idx], cost: setCostStatus(list[idx].cost) };
            await prisma.itinerary.update({
                where: { id },
                data: { [field]: list } as any,
            });
        } else if (field === 'flightInfo') {
            const fi = (it as any).flightInfo || {};
            const next = { ...fi, cost: setCostStatus(fi.cost) };
            await prisma.itinerary.update({
                where: { id },
                data: { flightInfo: next },
            });
        } else {
            res.status(400).json({ error: 'Unsupported module/itemRef combination' });
            return;
        }

        res.json({ id, module, itemRef, decision, note: note ?? null });
    } catch (error) {
        console.error('[admin cost-proofs decide] error:', error);
        res.status(500).json({ error: 'Failed to update cost proof decision' });
    }
});

export default router;
