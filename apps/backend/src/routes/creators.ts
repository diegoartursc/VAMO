import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { travelerAuthMiddleware, TravelerAuthRequest } from '../middleware/traveler-auth';

const router = Router();

// GET /api/creators/me/earnings
router.get('/me/earnings', travelerAuthMiddleware, async (req: TravelerAuthRequest, res: Response) => {
    try {
        const creator = await prisma.creator.findUnique({
            where: { travelerId: req.traveler!.travelerId },
            include: {
                balance: true,
                itineraries: {
                    select: {
                        id: true,
                        title: true,
                        sales: {
                            select: { id: true, price: true, commission: true, createdAt: true },
                            orderBy: { createdAt: 'desc' },
                        },
                    },
                },
            },
        });
        if (!creator) {
            res.status(404).json({ error: 'Perfil de roteirista não encontrado' });
            return;
        }

        const transactions = creator.itineraries.flatMap((itinerary) =>
            itinerary.sales.map((sale) => ({
                id: sale.id,
                itineraryId: itinerary.id,
                itineraryTitle: itinerary.title,
                saleDate: sale.createdAt.toISOString(),
                grossAmount: sale.price,
                platformFee: sale.commission,
                estimatedPayout: Math.max(0, sale.price - sale.commission),
                currency: 'AUD',
                status: 'pending',
            })),
        ).sort((a, b) => b.saleDate.localeCompare(a.saleDate));

        const pendingFromSales = transactions.reduce((sum, transaction) => sum + transaction.estimatedPayout, 0);
        res.json({
            summary: {
                currency: 'AUD',
                availableBalance: creator.balance?.availableBalance ?? 0,
                pendingBalance: creator.balance?.pendingBalance ?? pendingFromSales,
                totalEarned: pendingFromSales,
                payoutAccountStatus: 'not_started',
            },
            transactions,
        });
    } catch (error) {
        console.error('Error fetching creator earnings:', error);
        res.status(500).json({ error: 'Falha ao carregar ganhos do roteirista' });
    }
});

// GET /api/creators - List all creators (single query, no N+1)
router.get('/', async (req: Request, res: Response) => {
    try {
        const creators = await (prisma.creator as any).findMany({
            include: {
                traveler: { select: { name: true, avatar: true } },
                itineraries: {
                    select: { _count: { select: { sales: true } } },
                },
            },
        });

        const result = creators.map((c: any) => {
            const realTotalSales = c.itineraries.reduce(
                (sum: number, itinerary: any) => sum + itinerary._count.sales,
                0,
            );
            return {
                id: c.id, name: c.traveler.name, avatar: c.traveler.avatar || '👤',
                verificationLevel: c.verificationLevel.toLowerCase(),
                stats: {
                    itinerariesCount: c.itineraries.length,
                    totalSales: realTotalSales, averageRating: c.averageRating,
                    responseTime: c.responseTime, tripsCompleted: c.tripsCompleted,
                },
                bio: c.bio, destinations: c.destinations,
                memberSince: c.memberSince.getFullYear().toString(),
                languages: c.languages,
                socialLinks: {
                    instagram: c.instagramUrl, youtube: c.youtubeUrl, blog: c.blogUrl,
                },
            };
        }).sort((a: any, b: any) => b.stats.totalSales - a.stats.totalSales);

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch creators' });
    }
});

// GET /api/creators/by-traveler/:travelerId — resolve creatorId a partir do travelerId
router.get('/by-traveler/:travelerId', async (req: Request, res: Response) => {
    try {
        const creator = await (prisma.creator as any).findUnique({
            where: { travelerId: req.params.travelerId },
            select: { id: true, travelerId: true, verificationLevel: true },
        });
        if (!creator) { res.status(404).json({ error: 'Creator not found for this traveler' }); return; }
        res.json({ id: creator.id, travelerId: creator.travelerId, verificationLevel: creator.verificationLevel });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch creator' });
    }
});

// GET /api/creators/:id
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const c = await (prisma.creator as any).findUnique({
            where: { id: req.params.id },
            include: {
                traveler: { select: { name: true, avatar: true } },
                itineraries: {
                    where: { status: { in: ['APPROVED', 'ACTIVE'] } },
                    include: {
                        images: { orderBy: { order: 'asc' }, take: 1, select: { url: true } },
                        _count: { select: { sales: true } },
                    },
                },
            },
        });

        if (!c) { res.status(404).json({ error: 'Creator not found' }); return; }
        // O perfil público lista apenas roteiros ativos, mas o total de
        // vendas deve preservar compras de roteiros arquivados.
        const realTotalSales = await prisma.itinerarySale.count({
            where: { itinerary: { creatorId: c.id } },
        });

        const result = {
            id: c.id, name: c.traveler.name, avatar: c.traveler.avatar || '👤',
            verificationLevel: c.verificationLevel.toLowerCase(),
            stats: {
                itinerariesCount: c.itineraries.length, totalSales: realTotalSales,
                averageRating: c.averageRating, responseTime: c.responseTime,
                tripsCompleted: c.tripsCompleted,
            },
            bio: c.bio, destinations: c.destinations,
            memberSince: c.memberSince.getFullYear().toString(),
            languages: c.languages,
            socialLinks: { instagram: c.instagramUrl, youtube: c.youtubeUrl, blog: c.blogUrl },
            itineraries: c.itineraries.map((it: any) => ({
                id: it.id, title: it.title, destination: it.destination,
                price: it.price, rating: it.rating, reviewCount: it.reviewCount,
                duration: it.duration, images: it.images.map((img: any) => img.url),
            })),
        };

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch creator' });
    }
});

export default router;
