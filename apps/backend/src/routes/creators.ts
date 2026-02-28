import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/creators - List all creators
router.get('/', async (req: Request, res: Response) => {
    try {
        const creators = await prisma.creator.findMany({
            include: { traveler: { select: { name: true, avatar: true } } },
            orderBy: { totalSales: 'desc' },
        });

        const result = creators.map(c => ({
            id: c.id, name: c.traveler.name, avatar: c.traveler.avatar || '👤',
            verificationLevel: c.verificationLevel.toLowerCase(),
            stats: {
                itinerariesCount: 0, // will be computed
                totalSales: c.totalSales, averageRating: c.averageRating,
                responseTime: c.responseTime, tripsCompleted: c.tripsCompleted,
            },
            bio: c.bio, destinations: c.destinations,
            memberSince: c.memberSince.getFullYear().toString(),
            languages: c.languages,
            socialLinks: {
                instagram: c.instagramUrl, youtube: c.youtubeUrl, blog: c.blogUrl,
            },
        }));

        // Compute itineraries count
        for (const creator of result) {
            const count = await prisma.itinerary.count({ where: { creatorId: creator.id } });
            creator.stats.itinerariesCount = count;
        }

        res.json(result);
    } catch (error) {
        console.error('Error fetching creators:', error);
        res.status(500).json({ error: 'Failed to fetch creators' });
    }
});

// GET /api/creators/:id
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const c = await prisma.creator.findUnique({
            where: { id: req.params.id },
            include: {
                traveler: { select: { name: true, avatar: true } },
                itineraries: {
                    where: { status: 'ACTIVE' },
                    include: { images: { orderBy: { order: 'asc' }, take: 1, select: { url: true } } },
                },
            },
        });

        if (!c) { res.status(404).json({ error: 'Creator not found' }); return; }

        const result = {
            id: c.id, name: c.traveler.name, avatar: c.traveler.avatar || '👤',
            verificationLevel: c.verificationLevel.toLowerCase(),
            stats: {
                itinerariesCount: c.itineraries.length, totalSales: c.totalSales,
                averageRating: c.averageRating, responseTime: c.responseTime,
                tripsCompleted: c.tripsCompleted,
            },
            bio: c.bio, destinations: c.destinations,
            memberSince: c.memberSince.getFullYear().toString(),
            languages: c.languages,
            socialLinks: { instagram: c.instagramUrl, youtube: c.youtubeUrl, blog: c.blogUrl },
            itineraries: c.itineraries.map(it => ({
                id: it.id, title: it.title, destination: it.destination,
                price: it.price, rating: it.rating, reviewCount: it.reviewCount,
                duration: it.duration, images: it.images.map(img => img.url),
            })),
        };

        res.json(result);
    } catch (error) {
        console.error('Error fetching creator:', error);
        res.status(500).json({ error: 'Failed to fetch creator' });
    }
});

export default router;
