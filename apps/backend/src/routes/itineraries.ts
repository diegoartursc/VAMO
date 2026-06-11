import { Router, Request, Response } from 'express';
import { authMiddleware, optionalAuthMiddleware, AuthRequest } from '../middleware/auth';
import { createAuditMiddleware } from '../middleware/audit';
import prisma from '../lib/prisma';
import { travelerAuthMiddleware, TravelerAuthRequest } from '../middleware/traveler-auth';

const router = Router();

// GET /api/itineraries - List all itineraries
router.get('/', async (req: Request, res: Response) => {
    try {
        const { destination, featured, sort } = req.query;
        // Aceita roteiros em qualquer status público da vitrine. O frontend
        // (mobile + site) já considera ACTIVE e APPROVED equivalentes; o filtro
        // só rígido em APPROVED escondia roteiros legítimos que ficam ACTIVE.
        const where: any = { status: { in: ['APPROVED', 'ACTIVE'] } };
        if (destination) where.destination = { contains: destination as string, mode: 'insensitive' };
        if (featured === 'true') where.featured = true;

        // Default: featured first, then highest qualityScore, then best rating
        let orderBy: any = [{ featured: 'desc' }, { qualityScore: 'desc' }, { rating: 'desc' }];
        if (sort === 'price_asc')   orderBy = [{ price: 'asc' }];
        if (sort === 'price_desc')  orderBy = [{ price: 'desc' }];
        if (sort === 'rating')      orderBy = [{ rating: 'desc' }, { qualityScore: 'desc' }];
        if (sort === 'score')       orderBy = [{ qualityScore: 'desc' }, { rating: 'desc' }];
        // Marketplace-oriented sorts (Parte C)
        if (sort === 'newest')      orderBy = [{ createdAt: 'desc' }];
        if (sort === 'popular')     orderBy = [{ featured: 'desc' }, { qualityScore: 'desc' }, { rating: 'desc' }];
        // "sales" usa o totalSales do criador (a Itinerary não tem salesCount próprio
        // ainda — proxy seguro até existir uma tabela de transações própria).
        if (sort === 'sales') {
            orderBy = [
                { creator: { totalSales: 'desc' } },
                { qualityScore: 'desc' },
                { rating: 'desc' },
            ];
        }

        const itineraries = await prisma.itinerary.findMany({
            where, orderBy,
            include: {
                creator: { include: { traveler: { select: { name: true, avatar: true } } } },
                images: { orderBy: { order: 'asc' }, select: { url: true } },
                // Vendas reais POR ROTEIRO (contagem em ItinerarySale). Necessário
                // porque `creator.totalSales` é um campo agregado historicamente
                // não-incrementado a cada venda — virou 0 enquanto há compras reais.
                _count: { select: { sales: true } },
            },
        });

        const result = itineraries.map(it => ({
            id: it.id, title: it.title, destination: it.destination, country: it.country,
            creator: {
                id: it.creator.id, name: it.creator.traveler.name,
                avatar: it.creator.traveler.avatar || '👤',
                verificationLevel: it.creator.verificationLevel.toLowerCase(),
                rating: it.creator.averageRating, salesCount: it.creator.totalSales,
            },
            // salesCount no top-level = vendas REAIS deste roteiro
            // (ItinerarySale.count). Diferente de creator.salesCount, que é
            // o total acumulado do criador.
            salesCount: it._count.sales,
            description: it.description, price: it.price, currency: it.currency,
            images: it.images.map(img => img.url), rating: it.rating,
            // Capa e galeria — sem estes, o card cai em fallback quando o criador
            // só preencheu highlightPhotos (caso comum no fluxo de criação atual).
            highlightPhotos: (it as any).highlightPhotos || [],
            mediaUrls: (it as any).mediaUrls || [],
            reviewCount: it.reviewCount, inclusions: it.inclusions,
            duration: it.duration, featured: it.featured,
            highlights: it.highlights, estimatedSpending: it.estimatedSpending,
            qualityScore: it.qualityScore,
            // Campos para badges do card (vitrines): categorias temáticas e módulos ativos
            categories: it.categories || [],
            travelStyles: it.travelStyles || [],
            activeModules: it.activeModules || [],
            // Campos para badge de orçamento do card (BudgetSummaryCard).
            // Apenas JSON cols (zero query extra). Accommodations/Transports
            // ficam ausentes na listagem por serem relações.
            attractions: it.attractions || [],
            restaurants: it.restaurants || [],
            extraSpendingItems: (it as any).extraSpendingItems || [],
            flightInfo: it.flightInfo || null,
        }));

        res.json(result);
    } catch (error) {
        console.error('Error fetching itineraries:', error);
        res.status(500).json({ error: 'Failed to fetch itineraries' });
    }
});

// GET /api/itineraries/featured
router.get('/featured', async (req: Request, res: Response) => {
    try {
        const itineraries = await prisma.itinerary.findMany({
            where: { featured: true, status: { in: ['APPROVED', 'ACTIVE'] } },
            orderBy: [{ qualityScore: 'desc' }, { rating: 'desc' }],
            include: {
                creator: { include: { traveler: { select: { name: true, avatar: true } } } },
                images: { orderBy: { order: 'asc' }, select: { url: true } },
                _count: { select: { sales: true } },
            },
        });

        const result = itineraries.map(it => ({
            id: it.id, title: it.title, destination: it.destination, country: it.country,
            creator: {
                id: it.creator.id, name: it.creator.traveler.name,
                avatar: it.creator.traveler.avatar || '👤',
                verificationLevel: it.creator.verificationLevel.toLowerCase(),
                rating: it.creator.averageRating, salesCount: it.creator.totalSales,
            },
            salesCount: it._count.sales,
            description: it.description, price: it.price, currency: it.currency,
            images: it.images.map(img => img.url), rating: it.rating,
            // Capa e galeria — espelha GET /api/itineraries pra cards manterem fidelidade.
            highlightPhotos: (it as any).highlightPhotos || [],
            mediaUrls: (it as any).mediaUrls || [],
            reviewCount: it.reviewCount, inclusions: it.inclusions,
            duration: it.duration, featured: it.featured,
            highlights: it.highlights, estimatedSpending: it.estimatedSpending,
            qualityScore: it.qualityScore,
            // Campos para badges do card (vitrines): categorias temáticas e módulos ativos
            categories: it.categories || [],
            travelStyles: it.travelStyles || [],
            activeModules: it.activeModules || [],
            // Campos para badge de orçamento do card (BudgetSummaryCard).
            // Apenas JSON cols (zero query extra). Accommodations/Transports
            // ficam ausentes na listagem por serem relações.
            attractions: it.attractions || [],
            restaurants: it.restaurants || [],
            extraSpendingItems: (it as any).extraSpendingItems || [],
            flightInfo: it.flightInfo || null,
        }));

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch featured itineraries' });
    }
});

// ─── DASHBOARD STATS ───
// GET /api/itineraries/dashboard/stats
// NOTE: Must be registered BEFORE /:id to avoid being caught by the catch-all param
router.get('/dashboard/stats', optionalAuthMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        let { creatorId } = req.query as { creatorId?: string };

        // Resolução do creatorId em ordem:
        // 1. creatorId explícito na query
        // 2. travelerId do token JWT → resolve creator vinculado
        // SEM fallback para "primeiro creator" (causa do bug do Diego!)
        if (!creatorId && req.traveler?.travelerId) {
            const myCreator = await (prisma.creator as any).findUnique({
                where: { travelerId: req.traveler.travelerId },
                select: { id: true },
            });
            creatorId = myCreator?.id;
            console.log('[dashboard/stats] resolved creatorId from token:', { travelerId: req.traveler.travelerId, creatorId });
        }

        if (!creatorId) {
            console.log('[dashboard/stats] no creatorId resolved — returning empty stats');
            res.json({
                totalRevenue: 0, totalSales: 0, averageRating: 0, totalReviews: 0,
                activeItineraries: 0, totalItineraries: 0, itineraries: [],
            });
            return;
        }
        const where: any = { creatorId };
        console.log('[dashboard/stats] querying creatorId=', creatorId);

        const itineraries = await prisma.itinerary.findMany({
            where,
            include: {
                sales: { select: { id: true, price: true } },
                reviews: { select: { id: true, rating: true } },
            },
        });

        const totalSales = itineraries.reduce((sum, it) => sum + it.sales.length, 0);
        const totalRevenue = itineraries.reduce((sum, it) =>
            sum + it.sales.reduce((s, sale) => s + sale.price, 0), 0);
        const allReviews = itineraries.flatMap(it => it.reviews);
        const averageRating = allReviews.length > 0
            ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
            : 0;
        // Contagens por status (UPPERCASE no DB)
        const activeOrApproved = itineraries.filter(it => it.status === 'ACTIVE' || it.status === 'APPROVED');
        const publishedItineraries = activeOrApproved.length;
        // Qualidade média APENAS de roteiros ativos/aprovados. Roteiros
        // em DRAFT/PENDING_REVIEW/REJECTED não entram — score deles é
        // referencial pra criação, não métrica pública do criador.
        // null = "sem roteiros ativos" (UI deve mostrar — em vez de 0%).
        const averageQualityScore = activeOrApproved.length > 0
            ? Math.round(activeOrApproved.reduce((sum, it) => sum + (it.qualityScore || 0), 0) / activeOrApproved.length)
            : null;
        const pendingReview = itineraries.filter(it => it.status === 'PENDING_REVIEW').length;
        const draftItineraries = itineraries.filter(it => it.status === 'DRAFT').length;
        const rejectedItineraries = itineraries.filter(it => it.status === 'REJECTED').length;

        res.json({
            totalRevenue,
            totalSales,
            averageRating: Math.round(averageRating * 10) / 10,
            averageQualityScore,
            totalReviews: allReviews.length,
            activeItineraries: itineraries.filter(it => it.status === 'ACTIVE').length,
            publishedItineraries,
            pendingReview,
            draftItineraries,
            rejectedItineraries,
            totalItineraries: itineraries.length,
            itineraries: itineraries.map(it => ({
                id: it.id,
                title: it.title,
                destination: it.destination,
                country: it.country,
                status: it.status.toLowerCase(),
                sales: it.sales.length,
                revenue: it.sales.reduce((s, sale) => s + sale.price, 0),
                rating: it.rating,
                reviewCount: it.reviewCount,
                duration: it.duration,
                price: it.price,
                qualityScore: it.qualityScore,
                updatedAt: it.updatedAt.toISOString(),
            })),
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
});

export const PURCHASED_ITINERARY_INCLUDE = {
    creator: { include: { traveler: { select: { name: true, avatar: true, id: true } } } },
    images: { orderBy: { order: 'asc' as const }, select: { url: true } },
    days: { orderBy: { dayNumber: 'asc' as const }, include: { activities: { orderBy: { order: 'asc' as const } } } },
    files: true,
    accommodations: { orderBy: { order: 'asc' as const } },
    transports: { orderBy: { order: 'asc' as const } },
    checklists: { orderBy: { order: 'asc' as const } },
    reviews: { include: { images: true, responses: true }, orderBy: { createdAt: 'desc' as const }, take: 10 },
    _count: { select: { sales: true } },
};

export function serializeDate(value: any): string | null {
    if (!value) return null;
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'string') return value;
    return null;
}

export function getRouteSnapshot(purchaseData: any): any | null {
    const snapshot = purchaseData?.routeSnapshot;
    return snapshot && typeof snapshot === 'object' ? snapshot : null;
}

export function toJsonSafe(value: any): any {
    if (value === undefined) return undefined;
    if (value === null) return null;
    if (value instanceof Date) return value.toISOString();
    if (Array.isArray(value)) return value.map(toJsonSafe).filter((item) => item !== undefined);
    if (typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value)
                .map(([key, item]) => [key, toJsonSafe(item)])
                .filter(([, item]) => item !== undefined),
        );
    }
    return value;
}

export function buildPurchasedItineraryPayload(it: any, sale?: { id?: string; price?: number; createdAt?: Date | string }) {
    const accommodationList = (it.accommodations || []).map((a: any) => ({
        id: a.id, name: a.name, neighborhood: a.neighborhood,
        description: a.description, priceRange: a.priceRange, rating: a.rating,
        externalLink: a.externalLink, address: a.address, mapLink: a.mapLink,
        tips: a.tips, nights: a.nights, startDate: a.startDate, endDate: a.endDate,
        totalPrice: a.totalPrice, priceCurrency: a.priceCurrency, order: a.order,
        spending: a.spending ?? undefined, cost: a.cost ?? undefined,
    }));
    const transportList = (it.transports || []).map((t: any) => ({
        id: t.id, description: t.description, passTypes: t.passTypes,
        estimatedPrice: t.estimatedPrice, notes: t.notes,
        startDate: t.startDate, endDate: t.endDate,
        priceValue: t.priceValue, priceCurrency: t.priceCurrency, order: t.order,
        spending: t.spending ?? undefined, cost: t.cost ?? undefined,
    }));
    const checklistList = (it.checklists || []).map((c: any) => ({
        id: c.id, category: c.category, item: c.item,
        isDefault: c.isDefault, order: c.order, completed: false,
    }));

    return {
        id: it.id, title: it.title, destination: it.destination, country: it.country,
        purchaseId: sale?.id,
        purchasedAt: serializeDate(sale?.createdAt),
        pricePaid: typeof sale?.price === 'number' ? sale.price : undefined,
        snapshotVersion: 1,
        archivedAccessNotice: ['ARCHIVED', 'PAUSED'].includes(String(it.status || '').toUpperCase())
            ? 'Este roteiro não está mais disponível para novas compras, mas seu acesso permanece ativo.'
            : undefined,
        creator: {
            id: it.creator.id, name: it.creator.traveler.name,
            avatar: it.creator.traveler.avatar || '👤',
            verificationLevel: it.creator.verificationLevel.toLowerCase(),
            rating: it.creator.averageRating, salesCount: it.creator.totalSales,
        },
        // Vendas reais POR ROTEIRO (ItinerarySale.count). Fallback 0 se
        // o include não trouxer `_count` (rotas que ainda não foram
        // atualizadas).
        salesCount: (it as any)._count?.sales ?? 0,
        description: it.description, price: it.price, currency: it.currency,
        images: (it.images || []).map((img: any) => img.url), rating: it.rating,
        reviewCount: it.reviewCount, inclusions: it.inclusions,
        duration: it.duration, featured: it.featured,
        highlights: it.highlights, estimatedSpending: it.estimatedSpending,
        downloadCount: it.downloadCount,
        subtitle: it.subtitle, travelStyles: it.travelStyles, categories: it.categories,
        productType: it.productType, activeModules: it.activeModules,
        promoPrice: it.promoPrice, installments: it.installments,
        immediateAccess: it.immediateAccess, lifetimeAccess: it.lifetimeAccess,
        offlineDownload: it.offlineDownload, allowPdf: it.allowPdf, allowShare: it.allowShare,
        travelProofUrl: it.travelProofUrl,
        qualityScore: it.qualityScore, status: it.status,
        approvalNote: it.approvalNote, approvedAt: serializeDate(it.approvedAt),
        extraCities: it.extraCities || [], extraCountries: it.extraCountries || [],
        tripStartDate: serializeDate(it.tripStartDate), tripEndDate: serializeDate(it.tripEndDate),
        flightInfo: it.flightInfo || null,
        attractions: it.attractions || [],
        restaurants: it.restaurants || [],
        generalTips: it.generalTips || [],
        mediaUrls: it.mediaUrls || [],
        highlightPhotos: it.highlightPhotos || [],
        spendingProfile: it.spendingProfile || null,
        receiveList: it.receiveList || null,
        extraSpendingItems: it.extraSpendingItems || [],
        accommodations: accommodationList,
        accommodationOptions: accommodationList,
        transports: transportList,
        transport: { items: transportList },
        checklists: checklistList,
        checklist: checklistList,
        days: (it.days || []).map((d: any) => ({
            dayNumber: d.dayNumber, title: d.title, summary: d.summary,
            description: d.description,
            activities: (d.activities || []).map((a: any) => ({
                id: a.id, title: a.title, description: a.description,
                duration: a.duration, location: a.location, tips: a.tips,
                time: a.time, type: a.type, icon: a.icon, images: a.images,
                mapLink: a.mapLink, completed: a.completed, notes: a.notes,
                latitude: a.latitude, longitude: a.longitude, category: a.category,
            })),
        })),
        files: (it.files || []).map((f: any) => ({ id: f.id, name: f.name, type: f.type, url: f.url, size: f.size })),
        reviews: (it.reviews || []).map((r: any) => ({
            id: r.id, rating: r.rating, text: r.comment,
            date: serializeDate(r.createdAt)?.split('T')[0],
            verified: r.verified, helpful: r.helpful,
            user: { name: r.userName, location: r.userLocation, avatar: r.userAvatar, initial: r.userInitial },
            photos: (r.images || []).map((img: any) => img.url),
            responses: (r.responses || []).map((rsp: any) => ({
                id: rsp.id, text: rsp.text, createdAt: serializeDate(rsp.createdAt),
            })),
        })),
    };
}

/**
 * Carrega o itinerário completo do banco (mesmo `include` do GET
 * /:id/purchased) e devolve o payload já serializado e "json-safe" pronto
 * para ser persistido em `ItinerarySale.purchaseData.routeSnapshot`.
 *
 * Usado tanto no momento da venda — para congelar a versão "Original"
 * do roteiro que o viajante comprou — quanto sob demanda pela rota
 * `POST /api/route-customization/:itineraryId/purchased-snapshot`,
 * que reconstrói o snapshot para vendas antigas que ainda não o têm.
 *
 * Retorna `null` quando o roteiro não existe (caller decide se loga ou
 * 404).
 */
export async function buildItinerarySnapshot(
    prismaClient: typeof prisma,
    itineraryId: string,
    sale?: { id?: string; price?: number; createdAt?: Date | string },
): Promise<any | null> {
    const it = await prismaClient.itinerary.findUnique({
        where: { id: itineraryId },
        include: PURCHASED_ITINERARY_INCLUDE,
    });
    if (!it) return null;
    return toJsonSafe(buildPurchasedItineraryPayload(it, sale));
}

// GET /api/itineraries/:id
// GET /api/itineraries/:id/purchased
// Detalhe COMPLETO de um roteiro comprado. Exige autenticação (JWT do
// traveler) e bloqueia se o usuário não tem registro de compra
// (`ItinerarySale`) para esse roteiro. Retorna o mesmo payload do `/:id`
// público — a tela pós-compra reaproveita todos os campos (accommodationOptions,
// transport.items, checklist, days, etc.). Sem este endpoint, a tela
// "Meus Roteiros → abrir" caía em 404 e mostrava "Este roteiro não está
// liberado para esta conta."
router.get('/:id/purchased', optionalAuthMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const travelerId = req.traveler?.travelerId;
        if (!travelerId) {
            res.status(401).json({ error: 'Autenticação necessária' });
            return;
        }

        const itineraryId = req.params.id as string;
        const sale = await prisma.itinerarySale.findFirst({
            where: { itineraryId, travelerId },
            select: { id: true, price: true, createdAt: true, purchaseData: true },
        });
        if (!sale) {
            res.status(403).json({ error: 'Roteiro não comprado por este usuário' });
            return;
        }

        const snapshot = getRouteSnapshot(sale.purchaseData);
        if (snapshot) {
            res.json({
                ...snapshot,
                purchaseId: sale.id,
                purchasedAt: serializeDate(sale.createdAt),
                pricePaid: sale.price,
            });
            return;
        }

        const it = await prisma.itinerary.findUnique({
            where: { id: itineraryId },
            include: PURCHASED_ITINERARY_INCLUDE,
        });
        if (!it) { res.status(404).json({ error: 'Itinerary not found' }); return; }

        // Reaproveita o mesmo shape do GET /:id (a tela pós-compra consome
        // o mesmo payload). Pular o gate de status público: quem comprou
        // tem acesso mesmo se o roteiro depois foi pausado/arquivado.
        res.json(buildPurchasedItineraryPayload(it, sale));
    } catch (error) {
        console.error('Error fetching purchased itinerary:', error);
        res.status(500).json({ error: 'Failed to fetch purchased itinerary' });
    }
});

// GET /api/itineraries/:id/creator
// Visão completa para o criador dono do roteiro, incluindo rascunhos,
// rejeitados e itens em análise. Usada pelo app para editar e ver status.
router.get('/:id/creator', optionalAuthMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const it = await prisma.itinerary.findUnique({
            where: { id },
            include: {
                creator: { include: { traveler: { select: { id: true, name: true, avatar: true } } } },
                images: { orderBy: { order: 'asc' }, select: { url: true } },
                days: { orderBy: { dayNumber: 'asc' }, include: { activities: { orderBy: { order: 'asc' } } } },
                accommodations: { orderBy: { order: 'asc' } },
                transports: { orderBy: { order: 'asc' } },
                checklists: { orderBy: { order: 'asc' } },
                sales: { select: { id: true, price: true, createdAt: true } },
            },
        });
        if (!it) {
            res.status(404).json({ error: 'Itinerary not found' });
            return;
        }
        if (!(await requireCreatorOwner(req, res, it.creatorId))) return;

        res.json({
            ...it,
            images: it.images.map(img => img.url),
            creator: {
                id: it.creator.id,
                name: it.creator.traveler.name,
                travelerId: it.creator.traveler.id,
                avatar: it.creator.traveler.avatar,
            },
        });
    } catch (error) {
        console.error('[itineraries.creator.get] Error:', error);
        res.status(500).json({ error: 'Failed to fetch creator itinerary' });
    }
});

// PATCH /api/itineraries/:id/creator/status
// Ações de status do criador: reenviar para análise, pausar e republicar
// roteiro pausado. Aprovação/rejeição seguem exclusivas do admin.
router.patch('/:id/creator/status', optionalAuthMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const requestedStatus = normalizeStatus(req.body?.status);
        if (!requestedStatus || !CREATOR_STATUS_ACTIONS.includes(requestedStatus as any)) {
            res.status(400).json({ error: 'Status inválido para ação do criador.' });
            return;
        }

        const existing = await prisma.itinerary.findUnique({
            where: { id },
            include: {
                days: { include: { activities: true } },
                accommodations: true,
                transports: true,
                checklists: true,
            },
        });
        if (!existing) {
            res.status(404).json({ error: 'Itinerary not found' });
            return;
        }
        if (!(await requireCreatorOwner(req, res, existing.creatorId))) return;

        const current = existing.status as string;
        if (requestedStatus === 'PAUSED' && current !== 'ACTIVE') {
            res.status(400).json({ error: 'Apenas roteiros publicados podem ser pausados.' });
            return;
        }
        if (requestedStatus === 'ACTIVE' && !['PAUSED', 'APPROVED'].includes(current)) {
            res.status(400).json({ error: 'Apenas roteiros pausados ou aprovados podem ser publicados pelo criador.' });
            return;
        }
        if (requestedStatus === 'PENDING_REVIEW') {
            const issues = validateItinerarySubmission(existing);
            if (issues.length) {
                res.status(400).json({ error: `Corrija antes de enviar: ${issues.join(' ')}` });
                return;
            }
        }

        const updated = await prisma.itinerary.update({
            where: { id },
            data: requestedStatus === 'PENDING_REVIEW'
                ? { status: 'PENDING_REVIEW', approvalNote: null, approvedAt: null, approvedBy: null }
                : { status: requestedStatus as any },
            select: { id: true, status: true, approvalNote: true, approvedAt: true, updatedAt: true },
        });

        res.json(updated);
    } catch (error) {
        console.error('[itineraries.creator.status] Error:', error);
        res.status(500).json({ error: 'Failed to update itinerary status' });
    }
});

router.get('/:id', optionalAuthMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const it = await prisma.itinerary.findUnique({
            where: { id: req.params.id as string },
            include: {
                creator: { include: { traveler: { select: { name: true, avatar: true, id: true } } } },
                images: { orderBy: { order: 'asc' }, select: { url: true } },
                days: { orderBy: { dayNumber: 'asc' }, include: { activities: { orderBy: { order: 'asc' } } } },
                files: true,
                accommodations: { orderBy: { order: 'asc' } },
                transports:     { orderBy: { order: 'asc' } },
                checklists:     { orderBy: { order: 'asc' } },
                reviews: { include: { images: true, responses: true }, orderBy: { createdAt: 'desc' }, take: 10 },
                _count: { select: { sales: true } },
            },
        });

        if (!it) { res.status(404).json({ error: 'Itinerary not found' }); return; }

        // Block access to non-public itineraries for non-owners
        const isPublic = PUBLIC_STATUSES.includes(it.status as string);
        const isOwner  = req.traveler?.travelerId === (it as any).creator?.traveler?.id;
        if (!isPublic && !isOwner) {
            res.status(404).json({ error: 'Itinerary not found' });
            return;
        }

        const i = it as any;

        // Map accommodations (format also as accommodationOptions for post-purchase screen)
        const accommodationList = (i.accommodations || []).map((a: any) => ({
            id: a.id, name: a.name, neighborhood: a.neighborhood,
            description: a.description, priceRange: a.priceRange, rating: a.rating,
            externalLink: a.externalLink, address: a.address, mapLink: a.mapLink,
            tips: a.tips, nights: a.nights, startDate: a.startDate, endDate: a.endDate,
            totalPrice: a.totalPrice, priceCurrency: a.priceCurrency, order: a.order,
            // Transparência graduada de custos (round-trip)
            spending: a.spending ?? undefined,
            cost: a.cost ?? undefined,
        }));

        // Map transports (also as transport.items for post-purchase screen)
        const transportList = (i.transports || []).map((t: any) => ({
            id: t.id, description: t.description, passTypes: t.passTypes,
            estimatedPrice: t.estimatedPrice, notes: t.notes,
            startDate: t.startDate, endDate: t.endDate,
            priceValue: t.priceValue, priceCurrency: t.priceCurrency, order: t.order,
            // Transparência graduada de custos (round-trip)
            spending: t.spending ?? undefined,
            cost: t.cost ?? undefined,
        }));

        // Map checklists (flatten to a single "checklist" array for post-purchase screen)
        const checklistList = (i.checklists || []).map((c: any) => ({
            id: c.id, category: c.category, item: c.item,
            isDefault: c.isDefault, order: c.order, completed: false,
        }));

        const result = {
            id: i.id, title: i.title, destination: i.destination, country: i.country,
            creator: {
                id: i.creator.id, name: i.creator.traveler.name,
                avatar: i.creator.traveler.avatar || '👤',
                verificationLevel: i.creator.verificationLevel.toLowerCase(),
                rating: i.creator.averageRating, salesCount: i.creator.totalSales,
            },
            // Vendas reais POR ROTEIRO. Top-level pra ser inequívoco vs
            // o salesCount do creator (acumulado).
            salesCount: (i as any)._count?.sales ?? 0,
            description: i.description, price: i.price, currency: i.currency,
            images: (i.images || []).map((img: any) => img.url), rating: i.rating,
            reviewCount: i.reviewCount, inclusions: i.inclusions,
            duration: i.duration, featured: i.featured,
            highlights: i.highlights, estimatedSpending: i.estimatedSpending,
            downloadCount: i.downloadCount,
            // ─── Identidade e comercial ───
            subtitle: i.subtitle, travelStyles: i.travelStyles, categories: i.categories,
            productType: i.productType, activeModules: i.activeModules,
            promoPrice: i.promoPrice, installments: i.installments,
            immediateAccess: i.immediateAccess, lifetimeAccess: i.lifetimeAccess,
            offlineDownload: i.offlineDownload, allowPdf: i.allowPdf, allowShare: i.allowShare,
            travelProofUrl: i.travelProofUrl,
            qualityScore: i.qualityScore, status: i.status,
            approvalNote: i.approvalNote, approvedAt: i.approvedAt,
            // ─── Destinos extras ───
            extraCities: i.extraCities || [], extraCountries: i.extraCountries || [],
            // ─── Datas da viagem ───
            tripStartDate: i.tripStartDate, tripEndDate: i.tripEndDate,
            // ─── Módulos (JSON) ───
            flightInfo:   i.flightInfo   || null,
            attractions:  i.attractions  || [],
            restaurants:  i.restaurants  || [],
            generalTips:  i.generalTips  || [],
            mediaUrls:    i.mediaUrls    || [],
            highlightPhotos: i.highlightPhotos || [],
            spendingProfile: i.spendingProfile || null,
            receiveList:  i.receiveList  || null,
            // ─── Transparência graduada de custos ───
            extraSpendingItems: i.extraSpendingItems || [],
            // ─── Relações (com alias compat pro mobile pós-compra) ───
            accommodations: accommodationList,
            accommodationOptions: accommodationList,  // alias para mobile pós-compra
            transports: transportList,
            transport: { items: transportList },       // alias para mobile pós-compra
            checklists: checklistList,
            checklist: checklistList,                  // alias para mobile pós-compra
            days: (i.days || []).map((d: any) => ({
                dayNumber: d.dayNumber, title: d.title, summary: d.summary,
                description: d.description,
                activities: (d.activities || []).map((a: any) => ({
                    id: a.id, title: a.title, description: a.description,
                    duration: a.duration, location: a.location, tips: a.tips,
                    time: a.time, type: a.type, icon: a.icon, images: a.images,
                    mapLink: a.mapLink, completed: a.completed, notes: a.notes,
                    latitude: a.latitude, longitude: a.longitude, category: a.category,
                })),
            })),
            files: (i.files || []).map((f: any) => ({ id: f.id, name: f.name, type: f.type, url: f.url, size: f.size })),
            reviews: (i.reviews || []).map((r: any) => ({
                id: r.id, rating: r.rating, text: r.comment,
                date: r.createdAt.toISOString().split('T')[0],
                verified: r.verified, helpful: r.helpful,
                user: { name: r.userName, location: r.userLocation, avatar: r.userAvatar, initial: r.userInitial },
                photos: (r.images || []).map((img: any) => img.url),
            })),
        };

        res.json(result);
    } catch (error) {
        console.error('Error fetching itinerary:', error);
        res.status(500).json({ error: 'Failed to fetch itinerary' });
    }
});


// ─── QUALITY SCORE CALCULATOR ───────────────────────────────────────────────
// Blocos (total = 100 pts):
//   1. Identidade & Indexação  22 pts
//   2. Comercial               10 pts
//   3. Imagens de capa          8 pts
//   4. Itinerário dia a dia    20 pts
//   5. Módulos de conteúdo     20 pts
//   6. Estimativa de gasto      5 pts
//   7. Confiança & Qualidade   15 pts
// Quanto maior o score, mais destaque no app (home + buscas).
function calcItineraryQuality(data: any): number {
    let s = 0;

    // Bloco 1 — Identidade & Indexação (22 pts)
    if (data.title?.trim()) s += 5;
    if (data.subtitle?.trim()) s += 3;
    if (data.destination?.trim()) s += 4;
    if (data.country?.trim()) s += 2;
    if (data.description?.trim()) s += 3;
    if ((data.description?.trim().length ?? 0) >= 150) s += 2;
    if ((data.travelStyles?.length ?? 0) >= 1) s += 3;

    // Bloco 2 — Comercial (10 pts)
    if (parseFloat(data.price) > 0) s += 6;
    if ((data.categories?.length ?? 0) >= 1) s += 2;
    if ((data.promoPrice && parseFloat(data.promoPrice) > 0) || data.installments) s += 2;

    // Bloco 3 — Imagens de capa (8 pts)
    const imgs = Array.from(new Set([
        ...((data.images || []).filter(Boolean)),
        ...((data.highlightPhotos || []).filter(Boolean)),
    ]));
    if (imgs.length >= 1) s += 5;
    if (imgs.length >= 3) s += 3;

    // Bloco 4 — Itinerário dia a dia (20 pts)
    const days: any[] = data.days || [];
    if (days.length >= 1) s += 5;
    if (days.length >= parseInt(data.duration) || days.length >= (data.duration ?? 1)) s += 7;
    const totalActs = days.reduce((acc: number, d: any) => acc + (d.activities?.length ?? 0), 0);
    if (days.length > 0 && totalActs / days.length >= 2) s += 5;
    if (days.some((d: any) => d.activities?.some((a: any) => a.time?.trim()))) s += 3;

    // Bloco 5 — Módulos de conteúdo (20 pts)
    const accomms   = data.accommodations || [];
    const attrs     = data.attractions    || [];
    const rests     = data.restaurants    || [];
    const transps   = data.transports     || [];
    const tips      = data.generalTips    || [];
    const checks    = data.checklists     || [];
    if (accomms.length >= 1) s += 4;
    if (attrs.length   >= 1) s += 4;
    if (rests.length   >= 1) s += 4;
    if (transps.length >= 1) s += 4;
    if (tips.filter((t: string) => typeof t === 'string' && t.trim()).length >= 1) s += 2;
    if (checks.length  >= 1) s += 2;

    // Bloco 6 — Estimativa de gasto (5 pts)
    const sp = data.estimatedSpending;
    if (sp && (parseFloat(sp.min) > 0 || parseFloat(sp.max) > 0)) s += 5;

    // Bloco 7 — Confiança & Qualidade (15 pts)
    if (data.travelProofUrl?.trim()) s += 5;
    if ((data.highlights || []).filter(Boolean).length >= 2) s += 5;
    if ((data.inclusions || []).filter(Boolean).length >= 2) s += 5;

    return Math.min(Math.round(s), 100);
}

const CREATOR_WRITABLE_STATUSES = ['DRAFT', 'PENDING_REVIEW'] as const;
const CREATOR_STATUS_ACTIONS = ['PENDING_REVIEW', 'ACTIVE', 'PAUSED'] as const;
const PUBLIC_STATUSES = ['APPROVED', 'ACTIVE'];

function normalizeStatus(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    return value.trim().toUpperCase();
}

function hasContentUpdate(body: any): boolean {
    const keys = [
        'title', 'destination', 'country', 'description', 'price', 'currency', 'duration',
        'highlights', 'inclusions', 'estimatedSpending', 'images', 'days', 'subtitle',
        'travelStyles', 'categories', 'productType', 'activeModules', 'promoPrice',
        'installments', 'immediateAccess', 'lifetimeAccess', 'offlineDownload', 'allowPdf',
        'allowShare', 'accommodations', 'transports', 'checklists', 'travelProofUrl',
        'extraCities', 'extraCountries', 'flightInfo', 'attractions', 'restaurants',
        'generalTips', 'mediaUrls', 'highlightPhotos', 'tripStartDate', 'tripEndDate',
        'spendingProfile', 'receiveList', 'extraSpendingItems',
    ];
    return keys.some(key => Object.prototype.hasOwnProperty.call(body || {}, key));
}

function parseDecimalInput(value: unknown): number {
    if (typeof value === 'number') return Number.isFinite(value) ? value : NaN;
    if (typeof value !== 'string') return NaN;
    const trimmed = value.trim();
    if (!trimmed) return NaN;
    const normalized = trimmed
        .replace(/\s/g, '')
        .replace(/\.(?=\d{3}(?:\D|$))/g, '')
        .replace(',', '.');
    return Number(normalized);
}

function parseIntegerInput(value: unknown): number {
    if (typeof value === 'number') return Number.isFinite(value) ? Math.trunc(value) : NaN;
    if (typeof value !== 'string') return NaN;
    const parsed = parseInt(value.trim(), 10);
    return Number.isFinite(parsed) ? parsed : NaN;
}

function activityHasContent(activity: any): boolean {
    return !!(
        String(activity?.title || '').trim()
        || String(activity?.description || '').trim()
        || String(activity?.location || '').trim()
        || String(activity?.mapLink || '').trim()
    );
}

function dayIsCompleteForSubmission(day: any): boolean {
    if (!String(day?.description || '').trim()) return false;
    const activities = Array.isArray(day?.activities) ? day.activities : [];
    const realActivities = activities.filter(activityHasContent);
    return realActivities.length > 0
        && realActivities.every((activity: any) => String(activity?.title || '').trim());
}

function normalizeActivitiesForPersistence(activities: any[] | undefined): any[] {
    if (!Array.isArray(activities)) return [];
    return activities.filter(activityHasContent);
}

function validateItinerarySubmission(data: any): string[] {
    const issues: string[] = [];
    const activeModules = Array.isArray(data.activeModules) ? data.activeModules : [];
    const days = Array.isArray(data.days) ? data.days : [];

    if (!String(data.title || '').trim()) issues.push('Defina um título para o roteiro.');
    if (!String(data.destination || '').trim() || !String(data.country || '').trim()) issues.push('Informe cidade e país de destino.');
    if (!String(data.description || '').trim()) issues.push('Escreva uma descrição para o roteiro.');
    if (!Array.isArray(data.categories) || data.categories.filter(Boolean).length < 1) issues.push('Selecione pelo menos 1 categoria.');
    if (!Number.isFinite(parseDecimalInput(data.price)) || parseDecimalInput(data.price) <= 0) issues.push('Defina um preço de venda válido.');
    if (!Number.isFinite(parseIntegerInput(data.duration)) || parseIntegerInput(data.duration) < 1) issues.push('A duração precisa ter pelo menos 1 dia.');
    if (!String(data.travelProofUrl || '').trim()) issues.push('Anexe o comprovante de viagem.');
    if (activeModules.length < 1) issues.push('Ative pelo menos 1 módulo.');
    if (days.length < 1) issues.push('Cadastre pelo menos 1 dia de roteiro.');

    const coverCount = new Set([
        ...((data.highlightPhotos || []).filter(Boolean)),
        ...((data.images || []).filter(Boolean)),
    ]).size;
    if (coverCount < 1) issues.push('Adicione pelo menos 1 imagem de capa.');

    const moduleIncomplete = (key: string): string | null => {
        if (key === 'itinerario') {
            const ok = days.length > 0 && days.every(dayIsCompleteForSubmission);
            return ok ? null : 'Preencha o itinerário por dia com descrição e atividades.';
        }
        if (key === 'voo') {
            const out = data.flightInfo?.outbound;
            const ret = data.flightInfo?.return;
            const ok = !!(out?.originCity && out?.departureDate && out?.arrivalDate && ret?.originCity && ret?.departureDate && ret?.arrivalDate);
            return ok ? null : 'Preencha os dados mínimos de ida e volta em Meu Voo.';
        }
        if (key === 'hospedagem') {
            const rows = Array.isArray(data.accommodations) ? data.accommodations : [];
            return rows.length > 0 && rows.every((a: any) => String(a.name || '').trim()) ? null : 'Adicione pelo menos 1 hospedagem com nome.';
        }
        if (key === 'passeios') {
            const rows = Array.isArray(data.attractions) ? data.attractions : [];
            return rows.length > 0 && rows.every((a: any) => String(a.name || '').trim()) ? null : 'Adicione pelo menos 1 passeio ou atração.';
        }
        if (key === 'transporte') {
            const rows = Array.isArray(data.transports) ? data.transports : [];
            return rows.length > 0 && rows.every((t: any) => String(t.description || '').trim() && String(t.passTypes || '').trim()) ? null : 'Preencha as dicas de transporte.';
        }
        if (key === 'dicas') {
            const rows = Array.isArray(data.generalTips) ? data.generalTips : [];
            return rows.filter((t: string) => String(t || '').trim()).length >= 2 ? null : 'Adicione pelo menos 2 dicas exclusivas.';
        }
        if (key === 'restaurantes') {
            const rows = Array.isArray(data.restaurants) ? data.restaurants : [];
            return rows.length > 0 && rows.every((r: any) => String(r.name || '').trim() && String(r.location || '').trim()) ? null : 'Adicione pelo menos 1 restaurante com nome e localização.';
        }
        if (key === 'checklist') {
            const rows = Array.isArray(data.checklists) ? data.checklists : [];
            return rows.filter((c: any) => String(c.item || '').trim()).length >= 5 ? null : 'Adicione pelo menos 5 itens no checklist.';
        }
        if (key === 'gastos_extras') {
            const rows = Array.isArray(data.extraSpendingItems) ? data.extraSpendingItems : [];
            return rows.length > 0 && rows.every((e: any) => String(e.title || '').trim()) ? null : 'Preencha pelo menos 1 gasto extra.';
        }
        return null;
    };

    for (const moduleKey of activeModules) {
        const error = moduleIncomplete(moduleKey);
        if (error) issues.push(error);
    }

    return Array.from(new Set(issues));
}

async function requireCreatorOwner(req: AuthRequest, res: Response, creatorId: string): Promise<boolean> {
    if (!req.traveler?.travelerId) {
        res.status(401).json({ error: 'Faça login como criador para continuar.' });
        return false;
    }
    const creator = await prisma.creator.findUnique({
        where: { id: creatorId },
        select: { travelerId: true },
    });
    if (!creator || creator.travelerId !== req.traveler.travelerId) {
        res.status(403).json({ error: 'Sem permissão para acessar este roteiro' });
        return false;
    }
    return true;
}

// ─── CREATE ───
// POST /api/itineraries (requires auth)
router.post('/', optionalAuthMiddleware, createAuditMiddleware('CREATE'), async (req: AuthRequest, res: Response) => {
    try {
        const {
            creatorId, title, destination, country, description,
            price, currency, duration, highlights, inclusions,
            estimatedSpending, featured, images, days,
            // New fields
            subtitle, travelStyles, categories, productType,
            activeModules, promoPrice, installments,
            immediateAccess, lifetimeAccess, offlineDownload,
            allowPdf, allowShare,
            accommodations, transports, checklists,
            travelProofUrl,
            // ─── Novos campos (pós-audit) ───
            extraCities, extraCountries,
            flightInfo, attractions, restaurants, generalTips,
            mediaUrls, highlightPhotos,
            tripStartDate, tripEndDate,
            spendingProfile, receiveList,
            // ─── Transparência graduada de custos ───
            extraSpendingItems,
        } = req.body;
        void creatorId;

        if (!req.traveler?.travelerId) {
            res.status(401).json({ error: 'Faça login como criador para publicar roteiros.' });
            return;
        }

        const requestedStatus = normalizeStatus(req.body?.status) || 'PENDING_REVIEW';
        if (!CREATOR_WRITABLE_STATUSES.includes(requestedStatus as any)) {
            res.status(400).json({ error: 'Criadores só podem salvar rascunho ou enviar para análise.' });
            return;
        }

        // Validate required fields (description is optional — backend stores empty string if absent)
        const missing: string[] = [];
        if (!title)       missing.push('title');
        if (!destination) missing.push('destination');
        if (!country)     missing.push('country');
        if (!price)       missing.push('price');
        if (!duration)    missing.push('duration');
        if (missing.length) {
            console.warn('[itineraries.POST] Missing required fields:', missing, 'body keys:', Object.keys(req.body || {}));
            res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
            return;
        }
        // Validate styles max 3
        if (travelStyles && travelStyles.length > 3) {
            res.status(400).json({ error: 'Máximo 3 estilos de viagem' });
            return;
        }
        // Validate categories min 1 max 5
        if (categories && categories.length > 5) {
            res.status(400).json({ error: 'Máximo 5 categorias' });
            return;
        }

        // Resolve o criador exclusivamente pelo JWT. Não confiamos em
        // creatorId vindo do frontend porque isso vincula roteiro ao usuário errado.
        let resolvedCreatorId: string | null = null;
        const myCreator = await (prisma.creator as any).findUnique({
            where: { travelerId: req.traveler.travelerId },
            select: { id: true },
        });
        resolvedCreatorId = myCreator?.id || null;
        console.log('[POST /itineraries] creator resolved from token:', { travelerId: req.traveler.travelerId, creatorId: resolvedCreatorId });

        // Auto-promote: se o traveler logado ainda não tem Creator, criar agora.
        // Política de produto: criar o primeiro roteiro já torna o usuário um roteirista.
        if (!resolvedCreatorId) {
            const traveler = await prisma.traveler.findUnique({
                where: { id: req.traveler.travelerId },
                select: { id: true, name: true, bio: true },
            });
            if (traveler) {
                const newCreator = await (prisma.creator as any).create({
                    data: {
                        travelerId: traveler.id,
                        bio: traveler.bio || `Roteirista no VAMO — ${traveler.name}`,
                        verificationLevel: 'BASIC',
                    },
                    select: { id: true },
                });
                resolvedCreatorId = newCreator.id;
                console.log('[POST /itineraries] auto-created creator for traveler:', { travelerId: traveler.id, creatorId: resolvedCreatorId });
            }
        }
        if (!resolvedCreatorId) {
            res.status(401).json({ error: 'Faça login como criador para publicar roteiros.' });
            return;
        }

        if (requestedStatus === 'PENDING_REVIEW') {
            const issues = validateItinerarySubmission(req.body);
            if (issues.length) {
                res.status(400).json({ error: `Corrija antes de enviar: ${issues.join(' ')}` });
                return;
            }
        }

        const qualityScore = calcItineraryQuality(req.body);

        const itinerary = await prisma.itinerary.create({
            data: {
                creatorId: resolvedCreatorId,
                title,
                destination,
                country,
                description: description || '',
                price: parseDecimalInput(price),
                currency: currency || 'AUD',
                duration: parseIntegerInput(duration),
                highlights: highlights || [],
                inclusions: inclusions || [],
                estimatedSpending: estimatedSpending || undefined,
                featured: featured || false,
                subtitle: subtitle || undefined,
                travelStyles: travelStyles || [],
                categories: categories || [],
                productType: productType || 'DIGITAL',
                activeModules: activeModules || [],
                promoPrice: promoPrice ? parseDecimalInput(promoPrice) : undefined,
                installments: installments ? parseIntegerInput(installments) : undefined,
                immediateAccess: immediateAccess ?? true,
                lifetimeAccess: lifetimeAccess ?? true,
                offlineDownload: offlineDownload ?? true,
                allowPdf: allowPdf ?? false,
                allowShare: allowShare ?? true,
                qualityScore,
                status: requestedStatus as any,
                approvalNote: null,
                approvedAt: null,
                approvedBy: null,
                travelProofUrl: travelProofUrl || undefined,
                // ─── Novos campos ───
                extraCities: extraCities || [],
                extraCountries: extraCountries || [],
                flightInfo: flightInfo || undefined,
                attractions: attractions || undefined,
                restaurants: restaurants || undefined,
                generalTips: generalTips || [],
                mediaUrls: mediaUrls || [],
                highlightPhotos: highlightPhotos || [],
                tripStartDate: tripStartDate ? new Date(tripStartDate) : undefined,
                tripEndDate: tripEndDate ? new Date(tripEndDate) : undefined,
                spendingProfile: spendingProfile || undefined,
                receiveList: receiveList || undefined,
                // ─── Transparência graduada de custos: módulo "Gastos Extras" ───
                extraSpendingItems: extraSpendingItems ?? undefined,
                images: images?.length ? {
                    create: images.map((url: string, i: number) => ({ url, order: i })),
                } : undefined,
                days: days?.length ? {
                    create: days.map((day: any) => ({
                        dayNumber: day.dayNumber,
                        title: day.title,
                        summary: day.summary || '',
                        description: day.description || '',
                        activities: normalizeActivitiesForPersistence(day.activities).length ? {
                            create: normalizeActivitiesForPersistence(day.activities).map((act: any, i: number) => ({
                                order: i,
                                title: act.title,
                                description: act.description || '',
                                duration: act.duration || '',
                                location: act.location || '',
                                tips: act.tips || '',
                                time: act.time || '',
                                type: act.type || 'activity',
                                icon: act.icon || '📍',
                                images: act.images || [],
                                mapLink: act.mapLink || '',
                                latitude: act.latitude ? parseFloat(act.latitude) : undefined,
                                longitude: act.longitude ? parseFloat(act.longitude) : undefined,
                                category: act.category || undefined,
                            })),
                        } : undefined,
                    })),
                } : undefined,
                accommodations: accommodations?.length ? {
                    create: accommodations.map((a: any, i: number) => ({
                        name: a.name, neighborhood: a.neighborhood || '',
                        description: a.description || '', priceRange: a.priceRange || '',
                        rating: a.rating ? parseFloat(a.rating) : undefined,
                        externalLink: a.externalLink || '',
                        address: a.address || undefined,
                        mapLink: a.mapLink || undefined,
                        tips: a.tips || undefined,
                        nights: a.nights ? parseInt(a.nights) : undefined,
                        startDate: a.startDate || undefined,
                        endDate: a.endDate || undefined,
                        totalPrice: a.totalPrice || undefined,
                        priceCurrency: a.priceCurrency || undefined,
                        // Transparência graduada de custos
                        spending: a.spending ?? undefined,
                        cost: a.cost ?? undefined,
                        order: i,
                    })),
                } : undefined,
                transports: transports?.length ? {
                    create: transports.map((t: any, i: number) => ({
                        description: t.description || '', passTypes: t.passTypes || '',
                        estimatedPrice: t.estimatedPrice || '', notes: t.notes || '',
                        startDate: t.startDate || undefined,
                        endDate: t.endDate || undefined,
                        priceValue: t.priceValue || undefined,
                        priceCurrency: t.priceCurrency || undefined,
                        // Transparência graduada de custos
                        spending: t.spending ?? undefined,
                        cost: t.cost ?? undefined,
                        order: i,
                    })),
                } : undefined,
                checklists: checklists?.length ? {
                    create: checklists.map((c: any, i: number) => ({
                        category: c.category, item: c.item,
                        isDefault: c.isDefault ?? true, order: i,
                    })),
                } : undefined,
            },
            include: {
                images: true,
                days: { include: { activities: true } },
                accommodations: { orderBy: { order: 'asc' } },
                transports: { orderBy: { order: 'asc' } },
                checklists: { orderBy: { order: 'asc' } },
                creator: { include: { traveler: { select: { name: true, avatar: true } } } },
            },
        });

        res.status(201).json(itinerary);
    } catch (error: any) {
        // Surface a useful message to the frontend so the user knows what to fix.
        const code = error?.code;
        const meta = error?.meta;
        console.error('[itineraries.POST] Error creating itinerary:', {
            message: error?.message, code, meta,
        });
        let userMessage = 'Failed to create itinerary';
        if (code === 'P2003') userMessage = `Foreign key constraint failed (${meta?.field_name || 'unknown'}). Verifique se o creatorId existe.`;
        else if (code === 'P2002') userMessage = `Valor duplicado em ${meta?.target?.join(', ') || 'campo único'}.`;
        else if (error?.message) userMessage = `Erro do servidor: ${error.message}`;
        res.status(500).json({ error: userMessage });
    }
});

// ─── UPDATE ───
// PUT /api/itineraries/:id (requires auth)
router.put('/:id', optionalAuthMiddleware, createAuditMiddleware('UPDATE'), async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const {
            title, destination, country, description,
            price, currency, duration, highlights, inclusions,
            estimatedSpending, featured, status, images, days,
            // New fields
            subtitle, travelStyles, categories, productType,
            activeModules, promoPrice, installments,
            immediateAccess, lifetimeAccess, offlineDownload,
            allowPdf, allowShare,
            accommodations, transports, checklists,
            travelProofUrl,
            // ─── Novos campos (pós-audit) ───
            extraCities, extraCountries,
            flightInfo, attractions, restaurants, generalTips,
            mediaUrls, highlightPhotos,
            tripStartDate, tripEndDate,
            spendingProfile, receiveList,
            // ─── Transparência graduada de custos ───
            extraSpendingItems,
        } = req.body;

        // Check itinerary exists
        const existing = await prisma.itinerary.findUnique({
            where: { id },
            include: {
                images: { orderBy: { order: 'asc' }, select: { url: true } },
                days: { include: { activities: true } },
                accommodations: true,
                transports: true,
                checklists: true,
            },
        });
        if (!existing) {
            res.status(404).json({ error: 'Itinerary not found' });
            return;
        }

        if (!(await requireCreatorOwner(req, res, existing.creatorId))) return;

        // Validate styles max 3
        if (travelStyles && travelStyles.length > 3) {
            res.status(400).json({ error: 'Máximo 3 estilos de viagem' });
            return;
        }
        if (categories && categories.length > 5) {
            res.status(400).json({ error: 'Máximo 5 categorias' });
            return;
        }

        // Build update data (only include fields that were sent)
        const updateData: any = {};
        if (title !== undefined) updateData.title = title;
        if (destination !== undefined) updateData.destination = destination;
        if (country !== undefined) updateData.country = country;
        if (description !== undefined) updateData.description = description;
        if (price !== undefined) updateData.price = parseDecimalInput(price);
        if (currency !== undefined) updateData.currency = currency;
        if (duration !== undefined) updateData.duration = parseIntegerInput(duration);
        if (highlights !== undefined) updateData.highlights = highlights;
        if (inclusions !== undefined) updateData.inclusions = inclusions;
        if (estimatedSpending !== undefined) updateData.estimatedSpending = estimatedSpending;
        if (featured !== undefined) updateData.featured = featured;

        const requestedStatus = normalizeStatus(status);
        if (requestedStatus && !CREATOR_WRITABLE_STATUSES.includes(requestedStatus as any)) {
            res.status(400).json({ error: 'Criadores só podem salvar rascunho ou enviar para análise.' });
            return;
        }
        if (requestedStatus) {
            updateData.status = requestedStatus;
        } else if (hasContentUpdate(req.body) && !['DRAFT', 'PENDING_REVIEW'].includes(existing.status as string)) {
            updateData.status = 'PENDING_REVIEW';
        }
        // New fields
        if (subtitle !== undefined) updateData.subtitle = subtitle;
        if (travelStyles !== undefined) updateData.travelStyles = travelStyles;
        if (categories !== undefined) updateData.categories = categories;
        if (productType !== undefined) updateData.productType = productType;
        if (activeModules !== undefined) updateData.activeModules = activeModules;
        if (promoPrice !== undefined) updateData.promoPrice = promoPrice ? parseDecimalInput(promoPrice) : null;
        if (installments !== undefined) updateData.installments = installments ? parseIntegerInput(installments) : null;
        if (immediateAccess !== undefined) updateData.immediateAccess = immediateAccess;
        if (lifetimeAccess !== undefined) updateData.lifetimeAccess = lifetimeAccess;
        if (offlineDownload !== undefined) updateData.offlineDownload = offlineDownload;
        if (allowPdf !== undefined) updateData.allowPdf = allowPdf;
        if (allowShare !== undefined) updateData.allowShare = allowShare;
        if (travelProofUrl !== undefined) updateData.travelProofUrl = travelProofUrl;
        // ─── Novos campos ───
        if (extraCities !== undefined)     updateData.extraCities = extraCities;
        if (extraCountries !== undefined)  updateData.extraCountries = extraCountries;
        if (flightInfo !== undefined)      updateData.flightInfo = flightInfo;
        if (attractions !== undefined)     updateData.attractions = attractions;
        if (restaurants !== undefined)     updateData.restaurants = restaurants;
        if (generalTips !== undefined)     updateData.generalTips = generalTips;
        if (mediaUrls !== undefined)       updateData.mediaUrls = mediaUrls;
        if (highlightPhotos !== undefined) updateData.highlightPhotos = highlightPhotos;
        if (tripStartDate !== undefined)   updateData.tripStartDate = tripStartDate ? new Date(tripStartDate) : null;
        if (tripEndDate !== undefined)     updateData.tripEndDate = tripEndDate ? new Date(tripEndDate) : null;
        if (spendingProfile !== undefined) updateData.spendingProfile = spendingProfile;
        if (receiveList !== undefined)     updateData.receiveList = receiveList;
        // Transparência graduada de custos: módulo "Gastos Extras"
        if (extraSpendingItems !== undefined) updateData.extraSpendingItems = extraSpendingItems;

        // Recalculate quality score
        const merged = {
            ...existing,
            ...updateData,
            days: days ?? existing.days,
            accommodations: accommodations ?? existing.accommodations,
            transports: transports ?? existing.transports,
            checklists: checklists ?? existing.checklists,
            attractions: attractions ?? existing.attractions,
            restaurants: restaurants ?? existing.restaurants,
            generalTips: generalTips ?? existing.generalTips,
            highlightPhotos: highlightPhotos ?? existing.highlightPhotos,
            images: images ?? existing.images.map(img => img.url),
            extraSpendingItems: extraSpendingItems ?? existing.extraSpendingItems,
            flightInfo: flightInfo ?? existing.flightInfo,
        };
        updateData.qualityScore = calcItineraryQuality(merged);

        if (updateData.status === 'PENDING_REVIEW') {
            const issues = validateItinerarySubmission(merged);
            if (issues.length) {
                res.status(400).json({ error: `Corrija antes de enviar: ${issues.join(' ')}` });
                return;
            }
            updateData.approvalNote = null;
            updateData.approvedAt = null;
            updateData.approvedBy = null;
        }

        // Use a transaction for atomic updates
        const result = await prisma.$transaction(async (tx) => {
            // Update images if provided
            if (images !== undefined) {
                await tx.itineraryImage.deleteMany({ where: { itineraryId: id } });
                if (images.length > 0) {
                    await tx.itineraryImage.createMany({
                        data: images.map((url: string, i: number) => ({
                            itineraryId: id, url, order: i,
                        })),
                    });
                }
            }

            // Update days if provided
            if (days !== undefined) {
                const existingDays = await tx.itineraryDay.findMany({ where: { itineraryId: id } });
                for (const day of existingDays) {
                    await tx.itineraryActivity.deleteMany({ where: { dayId: day.id } });
                }
                await tx.itineraryDay.deleteMany({ where: { itineraryId: id } });

                for (const day of days) {
                    await tx.itineraryDay.create({
                        data: {
                            itineraryId: id,
                            dayNumber: day.dayNumber,
                            title: day.title,
                            summary: day.summary || '',
                            description: day.description || '',
                            activities: normalizeActivitiesForPersistence(day.activities).length ? {
                                create: normalizeActivitiesForPersistence(day.activities).map((act: any, i: number) => ({
                                    order: i,
                                    title: act.title,
                                    description: act.description || '',
                                    duration: act.duration || '',
                                    location: act.location || '',
                                    tips: act.tips || '',
                                    time: act.time || '',
                                    type: act.type || 'activity',
                                    icon: act.icon || '📍',
                                    images: act.images || [],
                                    mapLink: act.mapLink || '',
                                    latitude: act.latitude ? parseFloat(act.latitude) : undefined,
                                    longitude: act.longitude ? parseFloat(act.longitude) : undefined,
                                    category: act.category || undefined,
                                })),
                            } : undefined,
                        },
                    });
                }
            }

            // Update accommodations if provided
            if (accommodations !== undefined) {
                await tx.itineraryAccommodation.deleteMany({ where: { itineraryId: id } });
                if (accommodations.length > 0) {
                    for (let i = 0; i < accommodations.length; i++) {
                        const a = accommodations[i];
                        await tx.itineraryAccommodation.create({
                            data: {
                                itineraryId: id, name: a.name, neighborhood: a.neighborhood || '',
                                description: a.description || '', priceRange: a.priceRange || '',
                                rating: a.rating ? parseFloat(a.rating) : undefined,
                                externalLink: a.externalLink || '',
                                address: a.address || undefined,
                                mapLink: a.mapLink || undefined,
                                tips: a.tips || undefined,
                                nights: a.nights ? parseInt(a.nights) : undefined,
                                startDate: a.startDate || undefined,
                                endDate: a.endDate || undefined,
                                totalPrice: a.totalPrice || undefined,
                                priceCurrency: a.priceCurrency || undefined,
                                // Transparência graduada de custos
                                spending: a.spending ?? undefined,
                                cost: a.cost ?? undefined,
                                order: i,
                            },
                        });
                    }
                }
            }

            // Update transports if provided
            if (transports !== undefined) {
                await tx.itineraryTransport.deleteMany({ where: { itineraryId: id } });
                if (transports.length > 0) {
                    for (let i = 0; i < transports.length; i++) {
                        const t = transports[i];
                        await tx.itineraryTransport.create({
                            data: {
                                itineraryId: id, description: t.description || '',
                                passTypes: t.passTypes || '', estimatedPrice: t.estimatedPrice || '',
                                notes: t.notes || '',
                                startDate: t.startDate || undefined,
                                endDate: t.endDate || undefined,
                                priceValue: t.priceValue || undefined,
                                priceCurrency: t.priceCurrency || undefined,
                                // Transparência graduada de custos
                                spending: t.spending ?? undefined,
                                cost: t.cost ?? undefined,
                                order: i,
                            },
                        });
                    }
                }
            }

            // Update checklists if provided
            if (checklists !== undefined) {
                await tx.itineraryChecklist.deleteMany({ where: { itineraryId: id } });
                if (checklists.length > 0) {
                    for (let i = 0; i < checklists.length; i++) {
                        const c = checklists[i];
                        await tx.itineraryChecklist.create({
                            data: {
                                itineraryId: id, category: c.category, item: c.item,
                                isDefault: c.isDefault ?? true, order: i,
                            },
                        });
                    }
                }
            }

            // Update the itinerary itself
            return tx.itinerary.update({
                where: { id },
                data: updateData,
                include: {
                    images: { orderBy: { order: 'asc' } },
                    days: { orderBy: { dayNumber: 'asc' }, include: { activities: { orderBy: { order: 'asc' } } } },
                    accommodations: { orderBy: { order: 'asc' } },
                    transports: { orderBy: { order: 'asc' } },
                    checklists: { orderBy: { order: 'asc' } },
                    creator: { include: { traveler: { select: { name: true, avatar: true } } } },
                },
            });
        });

        res.json(result);
    } catch (error) {
        console.error('Error updating itinerary:', error);
        res.status(500).json({ error: 'Failed to update itinerary' });
    }
});

// ─── DELETE ───
// DELETE /api/itineraries/:id (requires auth)
//
// Buyer-access rule: creator "delete" is commercial archiving, never content
// destruction. ItinerarySale.itinerary, ItineraryImage and ItineraryFile all
// cascade on physical delete, so a hard delete can silently wipe a buyer's
// digital library. Keep admin-only destructive cleanup out of this endpoint.
router.delete('/:id', optionalAuthMiddleware, createAuditMiddleware('DELETE'), async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const hardRequested = req.query.hard === 'true';

        const existing = await prisma.itinerary.findUnique({ where: { id: id as string } });
        if (!existing) {
            res.status(404).json({ error: 'Itinerary not found' });
            return;
        }

        if (!(await requireCreatorOwner(req, res, existing.creatorId))) return;

        const salesCount = await prisma.itinerarySale.count({ where: { itineraryId: id } });

        // Soft delete — archive. Removes from storefront/search/purchase
        // while preserving content for existing buyers.
        await prisma.itinerary.update({
            where: { id },
            data: { status: 'ARCHIVED' },
        });
        res.json({
            success: true,
            message: 'Itinerary archived',
            mode: 'archive',
            salesCount,
            hardRequested,
        });
    } catch (error) {
        console.error('Error deleting itinerary:', error);
        res.status(500).json({ error: 'Failed to delete itinerary' });
    }
});

// ─── PURCHASE ───
// POST /api/itineraries/:id/purchase (traveler-auth required)
// Records an ItinerarySale so the itinerary appears in the traveler's "Meus Roteiros".
router.post('/:id/purchase', travelerAuthMiddleware, async (req: TravelerAuthRequest, res: Response) => {
    try {
        const itineraryId = req.params.id as string;
        const { paymentMethod } = req.body || {};
        const travelerId = req.traveler!.travelerId;

        if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEMO_PURCHASES !== 'true') {
            res.status(503).json({
                error: 'Pagamento online ainda não está habilitado. Nenhuma cobrança ou liberação foi realizada.',
            });
            return;
        }

        const itinerary = await prisma.itinerary.findUnique({
            where: { id: itineraryId },
            include: PURCHASED_ITINERARY_INCLUDE,
        });
        if (!itinerary) { res.status(404).json({ error: 'Itinerary not found' }); return; }

        // Idempotent: if a sale already exists for this traveler+itinerary, return it.
        const existing = await prisma.itinerarySale.findFirst({
            where: { itineraryId, travelerId },
            select: { id: true },
        });
        if (existing) {
            res.json({ id: existing.id, itineraryId, travelerId, alreadyPurchased: true });
            return;
        }

        if (itinerary.status !== 'APPROVED' && itinerary.status !== 'ACTIVE') {
            res.status(400).json({ error: 'Itinerary is not available for purchase' });
            return;
        }

        // Congelamos o snapshot UMA VEZ em `purchaseData.routeSnapshot`.
        // Esse é o formato compatível com o banco em produção e é lido pelo
        // /purchased, Meus Roteiros e customizações pós-compra.
        const snapshotPayload = toJsonSafe(buildPurchasedItineraryPayload(itinerary, {
            price: itinerary.price,
            createdAt: new Date(),
        }));

        // Cria a venda E incrementa `Creator.totalSales` na MESMA transação.
        // Sem o increment, `creator.salesCount` no list endpoint ficava parado
        // em 0 enquanto compras reais aconteciam — quebrava o "X vendas" nos
        // cards, no perfil do criador e na ordenação por popularidade.
        // Race-safe: o `increment` é atômico no SQL gerado pelo Prisma.
        const [sale] = await prisma.$transaction([
            prisma.itinerarySale.create({
                data: {
                    itineraryId,
                    travelerId,
                    price: itinerary.price,
                    commission: itinerary.price * 0.15, // 15% platform commission
                    purchaseData: {
                        routeSnapshot: snapshotPayload,
                    },
                },
                select: { id: true },
            }),
            prisma.creator.update({
                where: { id: itinerary.creatorId },
                data: { totalSales: { increment: 1 } },
            }),
        ]);

        res.json({ id: sale.id, itineraryId, travelerId, paymentMethod: paymentMethod || 'unknown', alreadyPurchased: false });
    } catch (error) {
        console.error('Error creating itinerary purchase:', error);
        res.status(500).json({ error: 'Failed to record purchase' });
    }
});

export default router;
