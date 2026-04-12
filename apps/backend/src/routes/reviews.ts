import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

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
            travelerId: r.travelerId,
            rating: r.rating, text: r.comment,
            date: r.createdAt.toISOString().split('T')[0],
            verified: r.verified, language: r.language, helpful: r.helpful,
            user: { name: r.userName, location: r.userLocation, avatar: r.userAvatar, initial: r.userInitial },
            photos: r.images.map(img => img.url),
            response: r.responses[0] ? { date: r.responses[0].createdAt.toISOString().split('T')[0], text: r.responses[0].text } : undefined,
        }));

        const totalReviews = result.length;
        const averageRating = totalReviews > 0 ? result.reduce((sum, r) => sum + r.rating, 0) / totalReviews : 0;

        res.json({ reviews: result, stats: { total: totalReviews, averageRating: Math.round(averageRating * 10) / 10 } });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
});

// GET /api/reviews/my?travelerId=X
// Retorna todas as avaliações feitas pelo traveler
router.get('/my', async (req: Request, res: Response) => {
    try {
        const { travelerId } = req.query;
        if (!travelerId) {
            return res.status(400).json({ error: 'travelerId é obrigatório' });
        }

        const reviews = await prisma.review.findMany({
            where: { travelerId: travelerId as string },
            include: {
                images: { select: { url: true } },
                itinerary: { select: { id: true, title: true, destination: true, country: true, images: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        const result = reviews.map(r => ({
            id: r.id,
            itineraryId: r.itineraryId,
            rating: r.rating,
            comment: r.comment,
            date: r.createdAt.toISOString().split('T')[0],
            photos: r.images.map(img => img.url),
            itinerary: r.itinerary ? {
                id: r.itinerary.id,
                title: r.itinerary.title,
                destination: r.itinerary.destination,
                country: r.itinerary.country,
                image: (r.itinerary.images as string[])?.[0] ?? null,
            } : null,
        }));

        res.json({ reviews: result });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
});

// POST /api/reviews
// Envia uma avaliação de roteiro comprado
router.post('/', async (req: Request, res: Response) => {
    try {
        const { travelerId, itineraryId, rating, comment, photos } = req.body;

        // Validações básicas
        if (!travelerId || !itineraryId || !rating || !comment) {
            return res.status(400).json({ error: 'travelerId, itineraryId, rating e comment são obrigatórios' });
        }
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'rating deve ser entre 1 e 5' });
        }

        // Verificar se já avaliou este roteiro
        const existing = await prisma.review.findFirst({
            where: { travelerId, itineraryId },
        });
        if (existing) {
            return res.status(409).json({ error: 'Você já avaliou este roteiro' });
        }

        // Buscar dados do traveler para denormalizar no review
        const traveler = await prisma.traveler.findUnique({ where: { id: travelerId } }).catch(() => null);
        const userName = traveler?.name ?? 'Viajante';
        const userInitial = userName.charAt(0).toUpperCase();

        // Criar o review
        const review = await prisma.review.create({
            data: {
                travelerId,
                itineraryId,
                rating: Number(rating),
                comment,
                verified: true, // verificado pois foi validado via compra
                language: 'pt-BR',
                userName,
                userInitial,
                userAvatar: traveler?.avatar ?? null,
                userLocation: traveler?.location ?? null,
            },
        });

        // Criar as imagens da review (se houver)
        if (Array.isArray(photos) && photos.length > 0) {
            await prisma.reviewImage.createMany({
                data: photos.map((url: string) => ({ reviewId: review.id, url })),
            });
        }

        // Recalcular rating médio do itinerário
        const allReviews = await prisma.review.findMany({
            where: { itineraryId },
            select: { rating: true },
        });
        const newAvg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

        await prisma.itinerary.update({
            where: { id: itineraryId },
            data: {
                rating: Math.round(newAvg * 10) / 10,
                reviewCount: allReviews.length,
            },
        });

        res.status(201).json({ review: { id: review.id, rating: review.rating, comment: review.comment } });
    } catch (error) {
        console.error('Error creating review:', error);
        res.status(500).json({ error: 'Falha ao enviar avaliação' });
    }
});

export default router;
