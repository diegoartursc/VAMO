import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/itineraries - List all itineraries
router.get('/', async (req: Request, res: Response) => {
    try {
        const { destination, featured, sort } = req.query;
        const where: any = { status: 'ACTIVE' };
        if (destination) where.destination = { contains: destination as string, mode: 'insensitive' };
        if (featured === 'true') where.featured = true;

        let orderBy: any = { featured: 'desc' };
        if (sort === 'price_asc') orderBy = { price: 'asc' };
        if (sort === 'price_desc') orderBy = { price: 'desc' };
        if (sort === 'rating') orderBy = { rating: 'desc' };

        const itineraries = await prisma.itinerary.findMany({
            where, orderBy,
            include: {
                creator: { include: { traveler: { select: { name: true, avatar: true } } } },
                images: { orderBy: { order: 'asc' }, select: { url: true } },
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
            description: it.description, price: it.price, currency: it.currency,
            images: it.images.map(img => img.url), rating: it.rating,
            reviewCount: it.reviewCount, inclusions: it.inclusions,
            duration: it.duration, featured: it.featured,
            highlights: it.highlights, estimatedSpending: it.estimatedSpending,
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
            where: { featured: true, status: 'ACTIVE' },
            include: {
                creator: { include: { traveler: { select: { name: true, avatar: true } } } },
                images: { orderBy: { order: 'asc' }, select: { url: true } },
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
            description: it.description, price: it.price, currency: it.currency,
            images: it.images.map(img => img.url), rating: it.rating,
            reviewCount: it.reviewCount, inclusions: it.inclusions,
            duration: it.duration, featured: it.featured,
            highlights: it.highlights, estimatedSpending: it.estimatedSpending,
        }));

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch featured itineraries' });
    }
});

// GET /api/itineraries/:id
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const it = await prisma.itinerary.findUnique({
            where: { id: req.params.id },
            include: {
                creator: { include: { traveler: { select: { name: true, avatar: true } } } },
                images: { orderBy: { order: 'asc' }, select: { url: true } },
                days: { orderBy: { dayNumber: 'asc' }, include: { activities: { orderBy: { order: 'asc' } } } },
                files: true,
                reviews: { include: { images: true, responses: true }, orderBy: { createdAt: 'desc' }, take: 10 },
            },
        });

        if (!it) { res.status(404).json({ error: 'Itinerary not found' }); return; }

        const result = {
            id: it.id, title: it.title, destination: it.destination, country: it.country,
            creator: {
                id: it.creator.id, name: it.creator.traveler.name,
                avatar: it.creator.traveler.avatar || '👤',
                verificationLevel: it.creator.verificationLevel.toLowerCase(),
                rating: it.creator.averageRating, salesCount: it.creator.totalSales,
            },
            description: it.description, price: it.price, currency: it.currency,
            images: it.images.map(img => img.url), rating: it.rating,
            reviewCount: it.reviewCount, inclusions: it.inclusions,
            duration: it.duration, featured: it.featured,
            highlights: it.highlights, estimatedSpending: it.estimatedSpending,
            downloadCount: it.downloadCount,
            days: it.days.map(d => ({
                dayNumber: d.dayNumber, title: d.title, summary: d.summary,
                description: d.description,
                activities: d.activities.map(a => ({
                    id: a.id, title: a.title, description: a.description,
                    duration: a.duration, location: a.location, tips: a.tips,
                    time: a.time, type: a.type, icon: a.icon, images: a.images,
                    mapLink: a.mapLink, completed: a.completed, notes: a.notes,
                })),
            })),
            files: it.files.map(f => ({ id: f.id, name: f.name, type: f.type, url: f.url, size: f.size })),
            reviews: it.reviews.map(r => ({
                id: r.id, rating: r.rating, text: r.comment,
                date: r.createdAt.toISOString().split('T')[0],
                verified: r.verified, helpful: r.helpful,
                user: { name: r.userName, location: r.userLocation, avatar: r.userAvatar, initial: r.userInitial },
                photos: r.images.map(img => img.url),
            })),
        };

        res.json(result);
    } catch (error) {
        console.error('Error fetching itinerary:', error);
        res.status(500).json({ error: 'Failed to fetch itinerary' });
    }
});

export default router;
