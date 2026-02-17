import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/reviews?packageId=X or ?itineraryId=X
router.get('/', async (req: Request, res: Response) => {
    try {
        const { packageId, itineraryId } = req.query;
        const where: any = {};
        if (packageId) where.packageId = packageId as string;
        if (itineraryId) where.itineraryId = itineraryId as string;

        const reviews = await prisma.review.findMany({
            where,
            include: { images: { select: { url: true } }, responses: { select: { text: true, createdAt: true } } },
            orderBy: { createdAt: 'desc' },
        });

        const result = reviews.map(r => ({
            id: r.id, packageId: r.packageId, itineraryId: r.itineraryId,
            rating: r.rating, text: r.comment,
            date: r.createdAt.toISOString().split('T')[0],
            verified: r.verified, language: r.language, helpful: r.helpful,
            user: { name: r.userName, location: r.userLocation, avatar: r.userAvatar, initial: r.userInitial },
            photos: r.images.map(img => img.url),
            response: r.responses[0] ? { date: r.responses[0].createdAt.toISOString().split('T')[0], text: r.responses[0].text } : undefined,
        }));

        // Also compute stats
        const totalReviews = result.length;
        const averageRating = totalReviews > 0 ? result.reduce((sum, r) => sum + r.rating, 0) / totalReviews : 0;

        res.json({ reviews: result, stats: { total: totalReviews, averageRating: Math.round(averageRating * 10) / 10 } });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
});

export default router;
