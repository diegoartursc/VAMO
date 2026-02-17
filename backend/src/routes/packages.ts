import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/packages - List all packages
router.get('/', async (req: Request, res: Response) => {
    try {
        const { destination, featured, category, minPrice, maxPrice, sort } = req.query;

        const where: any = { status: 'ACTIVE' };
        if (destination) where.destination = { contains: destination as string, mode: 'insensitive' };
        if (featured === 'true') where.featured = true;
        if (category) where.categories = { has: category as string };
        if (minPrice) where.priceMin = { gte: parseFloat(minPrice as string) };
        if (maxPrice) where.priceMax = { lte: parseFloat(maxPrice as string) };

        let orderBy: any = { featured: 'desc' };
        if (sort === 'price_asc') orderBy = { priceMin: 'asc' };
        if (sort === 'price_desc') orderBy = { priceMax: 'desc' };
        if (sort === 'rating') orderBy = { rating: 'desc' };
        if (sort === 'newest') orderBy = { createdAt: 'desc' };

        const packages = await prisma.package.findMany({
            where,
            orderBy,
            include: {
                agency: { select: { id: true, name: true, logo: true, verified: true, contactUrl: true, whatsapp: true } },
                images: { orderBy: { order: 'asc' }, select: { url: true, alt: true } },
                pricingWindows: { where: { startDate: { gte: new Date() } }, orderBy: { startDate: 'asc' }, select: { startDate: true, endDate: true, price: true, availableSlots: true } },
            },
        });

        // Transform to match frontend expected format
        const result = packages.map(pkg => ({
            id: pkg.id,
            title: pkg.title,
            destination: pkg.destination,
            country: pkg.country,
            agency: pkg.agency,
            price: { min: pkg.priceMin, max: pkg.priceMax, currency: pkg.currency },
            images: pkg.images.map(img => img.url),
            duration: pkg.duration,
            includes: pkg.includes,
            rating: pkg.rating,
            reviewCount: pkg.reviewCount,
            featured: pkg.featured,
            description: pkg.description,
            highlights: pkg.highlights,
            badge: pkg.badge?.toLowerCase(),
            inclusions: pkg.inclusions,
            categories: pkg.categories,
            hasFreeCancellation: pkg.hasFreeCancellation,
            isAllInclusive: pkg.isAllInclusive,
            recentPurchases: pkg.recentPurchases,
            priceComparison: pkg.priceComparison,
            priceDiscount: pkg.priceDiscount,
            itinerary: pkg.routeDetails,
            fullDescription: pkg.fullDescription,
            emotionalIntro: pkg.emotionalIntro,
            includedItems: pkg.includedItems,
            notRecommendedFor: pkg.notRecommendedFor,
            importantInfo: pkg.importantInfo,
            perfectFor: pkg.perfectFor,
            availableDates: pkg.pricingWindows.map(pw => ({
                date: pw.startDate.toISOString().split('T')[0],
                price: pw.price,
                spotsLeft: pw.availableSlots,
            })),
        }));

        res.json(result);
    } catch (error) {
        console.error('Error fetching packages:', error);
        res.status(500).json({ error: 'Failed to fetch packages' });
    }
});

// GET /api/packages/featured
router.get('/featured', async (req: Request, res: Response) => {
    try {
        const packages = await prisma.package.findMany({
            where: { featured: true, status: 'ACTIVE' },
            include: {
                agency: { select: { id: true, name: true, logo: true, verified: true, contactUrl: true, whatsapp: true } },
                images: { orderBy: { order: 'asc' }, select: { url: true } },
            },
        });

        const result = packages.map(pkg => ({
            id: pkg.id, title: pkg.title, destination: pkg.destination, country: pkg.country,
            agency: pkg.agency,
            price: { min: pkg.priceMin, max: pkg.priceMax, currency: pkg.currency },
            images: pkg.images.map(img => img.url),
            duration: pkg.duration, includes: pkg.includes, rating: pkg.rating,
            reviewCount: pkg.reviewCount, featured: pkg.featured,
            description: pkg.description, highlights: pkg.highlights,
            badge: pkg.badge?.toLowerCase(), inclusions: pkg.inclusions,
            categories: pkg.categories, hasFreeCancellation: pkg.hasFreeCancellation,
            isAllInclusive: pkg.isAllInclusive, recentPurchases: pkg.recentPurchases,
            priceComparison: pkg.priceComparison, priceDiscount: pkg.priceDiscount,
            itinerary: pkg.routeDetails,
        }));

        res.json(result);
    } catch (error) {
        console.error('Error fetching featured packages:', error);
        res.status(500).json({ error: 'Failed to fetch featured packages' });
    }
});

// GET /api/packages/:id
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const pkg = await prisma.package.findUnique({
            where: { id: req.params.id },
            include: {
                agency: { select: { id: true, name: true, logo: true, verified: true, contactUrl: true, whatsapp: true } },
                images: { orderBy: { order: 'asc' }, select: { url: true, alt: true } },
                pricingWindows: { orderBy: { startDate: 'asc' }, select: { startDate: true, endDate: true, price: true, availableSlots: true } },
                reviews: { include: { images: true, responses: true }, orderBy: { createdAt: 'desc' }, take: 10 },
            },
        });

        if (!pkg) { res.status(404).json({ error: 'Package not found' }); return; }

        const result = {
            id: pkg.id, title: pkg.title, destination: pkg.destination, country: pkg.country,
            agency: pkg.agency,
            price: { min: pkg.priceMin, max: pkg.priceMax, currency: pkg.currency },
            images: pkg.images.map(img => img.url),
            duration: pkg.duration, includes: pkg.includes, rating: pkg.rating,
            reviewCount: pkg.reviewCount, featured: pkg.featured,
            description: pkg.description, fullDescription: pkg.fullDescription,
            emotionalIntro: pkg.emotionalIntro,
            highlights: pkg.highlights, badge: pkg.badge?.toLowerCase(),
            inclusions: pkg.inclusions, categories: pkg.categories,
            hasFreeCancellation: pkg.hasFreeCancellation, isAllInclusive: pkg.isAllInclusive,
            recentPurchases: pkg.recentPurchases, priceComparison: pkg.priceComparison,
            priceDiscount: pkg.priceDiscount, itinerary: pkg.routeDetails,
            includedItems: pkg.includedItems, notRecommendedFor: pkg.notRecommendedFor,
            importantInfo: pkg.importantInfo, perfectFor: pkg.perfectFor,
            maxSlots: pkg.maxSlots,
            availableDates: pkg.pricingWindows.map(pw => ({
                date: pw.startDate.toISOString().split('T')[0],
                price: pw.price, spotsLeft: pw.availableSlots,
            })),
            reviews: pkg.reviews.map(r => ({
                id: r.id, rating: r.rating, text: r.comment, date: r.createdAt.toISOString().split('T')[0],
                verified: r.verified, language: r.language, helpful: r.helpful,
                user: { name: r.userName, location: r.userLocation, avatar: r.userAvatar, initial: r.userInitial },
                photos: r.images.map(img => img.url),
                response: r.responses[0] ? { date: r.responses[0].createdAt.toISOString().split('T')[0], text: r.responses[0].text } : undefined,
            })),
        };

        res.json(result);
    } catch (error) {
        console.error('Error fetching package:', error);
        res.status(500).json({ error: 'Failed to fetch package' });
    }
});

// GET /api/packages/:id/related
router.get('/:id/related', async (req: Request, res: Response) => {
    try {
        const pkg = await prisma.package.findUnique({ where: { id: req.params.id } });
        if (!pkg) { res.json([]); return; }

        const related = await prisma.package.findMany({
            where: { id: { not: pkg.id }, status: 'ACTIVE', OR: [{ destination: pkg.destination }, { country: pkg.country }] },
            include: {
                agency: { select: { id: true, name: true, logo: true, verified: true } },
                images: { orderBy: { order: 'asc' }, take: 1, select: { url: true } },
            },
            take: 4,
        });

        const result = related.map(r => ({
            id: r.id, title: r.title, destination: r.destination, country: r.country,
            agency: r.agency, price: { min: r.priceMin, max: r.priceMax, currency: r.currency },
            images: r.images.map(img => img.url), duration: r.duration,
            rating: r.rating, reviewCount: r.reviewCount, badge: r.badge?.toLowerCase(),
        }));

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch related packages' });
    }
});

export default router;
