import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { optionalAuthMiddleware, AuthRequest } from '../middleware/auth';
import { travelerAuthMiddleware, TravelerAuthRequest } from '../middleware/traveler-auth';

const router = Router();

function normalizePhotoUrls(photos: unknown): string[] {
    if (!Array.isArray(photos)) return [];
    return photos
        .map((photo) => {
            if (typeof photo === 'string') return photo;
            if (photo && typeof photo === 'object' && typeof (photo as any).url === 'string') {
                return (photo as any).url;
            }
            return '';
        })
        .map((url) => url.trim())
        .filter((url) => /^https?:\/\//i.test(url));
}

async function recalculateItineraryAndCreatorRating(itineraryId: string) {
    const itineraryReviews = await prisma.review.findMany({
        where: { itineraryId },
        select: { rating: true },
    });
    const newAvg = itineraryReviews.length > 0
        ? itineraryReviews.reduce((sum, r) => sum + r.rating, 0) / itineraryReviews.length
        : 0;

    const itinerary = await prisma.itinerary.update({
        where: { id: itineraryId },
        data: {
            rating: Math.round(newAvg * 10) / 10,
            reviewCount: itineraryReviews.length,
        },
        select: { creatorId: true },
    });

    const creatorReviews = await prisma.review.findMany({
        where: { itinerary: { creatorId: itinerary.creatorId } },
        select: { rating: true },
    });
    const creatorAvg = creatorReviews.length > 0
        ? creatorReviews.reduce((sum, r) => sum + r.rating, 0) / creatorReviews.length
        : 0;

    await prisma.creator.update({
        where: { id: itinerary.creatorId },
        data: { averageRating: creatorReviews.length > 0 ? Math.round(creatorAvg * 10) / 10 : null },
    });
}

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

// GET /api/reviews/my
// Retorna todas as avaliações feitas pelo traveler
router.get('/my', travelerAuthMiddleware, async (req: TravelerAuthRequest, res: Response) => {
    try {
        const travelerId = req.traveler!.travelerId;

        const reviews = await prisma.review.findMany({
            where: { travelerId },
            include: {
                images: { select: { url: true } },
                itinerary: { select: { id: true, title: true, destination: true, country: true, images: { select: { url: true }, take: 1, orderBy: { order: 'asc' } } } },
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
                image: r.itinerary.images[0]?.url ?? null,
            } : null,
        }));

        res.json({ reviews: result });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
});

// POST /api/reviews
// Envia uma avaliação de roteiro comprado
router.post('/', optionalAuthMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const { itineraryId, rating, comment, photos } = req.body;
        const travelerId = req.traveler?.travelerId;

        // Validações básicas
        if (!travelerId) {
            return res.status(401).json({ error: 'Autenticação necessária para enviar avaliação' });
        }
        if (!itineraryId || rating === undefined || rating === null) {
            return res.status(400).json({ error: 'itineraryId e rating são obrigatórios' });
        }
        const numericRating = Number(rating);
        if (!Number.isFinite(numericRating) || numericRating < 1 || numericRating > 5) {
            return res.status(400).json({ error: 'rating deve ser entre 1 e 5' });
        }
        const photoUrls = normalizePhotoUrls(photos);
        if (Array.isArray(photos) && photoUrls.length !== photos.length) {
            return res.status(400).json({ error: 'As fotos da avaliação devem ser URLs válidas.' });
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

        // Apenas quem comprou o roteiro pode avaliá-lo. Conferimos via
        // ItinerarySale; sem registro de compra, recusamos a submissão.
        const purchase = await prisma.itinerarySale.findFirst({
            where: { travelerId, itineraryId },
            select: { id: true },
        });
        if (!purchase) {
            return res.status(403).json({ error: 'Apenas quem comprou este roteiro pode avaliá-lo.' });
        }

        // Criar bloqueio extra: o criador não avalia o próprio roteiro
        const itineraryRow = await prisma.itinerary.findUnique({
            where: { id: itineraryId },
            select: { id: true, creator: { select: { travelerId: true } } },
        });
        if (!itineraryRow) {
            return res.status(404).json({ error: 'Roteiro não encontrado' });
        }
        if (itineraryRow?.creator?.travelerId === travelerId) {
            return res.status(403).json({ error: 'Criadores não podem avaliar seus próprios roteiros.' });
        }

        // Criar o review
        const review = await prisma.review.create({
            data: {
                travelerId,
                itineraryId,
                rating: numericRating,
                comment: typeof comment === 'string' ? comment.trim() : '',
                verified: true,
                language: 'pt-BR',
                userName,
                userInitial,
                userAvatar: traveler?.avatar ?? null,
                userLocation: null,
            },
        });

        // Criar as imagens da review (se houver)
        if (photoUrls.length > 0) {
            await prisma.reviewImage.createMany({
                data: photoUrls.map((url: string, order: number) => ({ reviewId: review.id, url, order })),
            });
        }

        await recalculateItineraryAndCreatorRating(itineraryId);

        res.status(201).json({ review: { id: review.id, itineraryId, rating: review.rating, comment: review.comment, photos: photoUrls } });
    } catch (error) {
        console.error('Error creating review:', error);
        res.status(500).json({ error: 'Falha ao enviar avaliação' });
    }
});

// PUT /api/reviews/:id
// Atualiza uma avaliação já feita pelo comprador.
router.put('/:id', optionalAuthMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const id = String(req.params.id);
        const { rating, comment, photos } = req.body;
        const travelerId = req.traveler?.travelerId;

        if (!travelerId) {
            return res.status(401).json({ error: 'Autenticação necessária para atualizar avaliação' });
        }
        if (rating === undefined || rating === null) {
            return res.status(400).json({ error: 'rating é obrigatório' });
        }
        const numericRating = Number(rating);
        if (!Number.isFinite(numericRating) || numericRating < 1 || numericRating > 5) {
            return res.status(400).json({ error: 'rating deve ser entre 1 e 5' });
        }
        const photoUrls = normalizePhotoUrls(photos);
        if (Array.isArray(photos) && photoUrls.length !== photos.length) {
            return res.status(400).json({ error: 'As fotos da avaliação devem ser URLs válidas.' });
        }

        const existing = await prisma.review.findUnique({
            where: { id },
            select: { id: true, travelerId: true, itineraryId: true },
        });
        if (!existing) {
            return res.status(404).json({ error: 'Avaliação não encontrada' });
        }
        if (existing.travelerId !== travelerId) {
            return res.status(403).json({ error: 'Você só pode editar suas próprias avaliações.' });
        }
        if (!existing.itineraryId) {
            return res.status(400).json({ error: 'Esta avaliação não pertence a um roteiro.' });
        }

        const review = await prisma.$transaction(async (tx) => {
            await tx.reviewImage.deleteMany({ where: { reviewId: id } });
            const updated = await tx.review.update({
                where: { id },
                data: {
                    rating: numericRating,
                    comment: typeof comment === 'string' ? comment.trim() : '',
                },
            });

            if (photoUrls.length > 0) {
                await tx.reviewImage.createMany({
                    data: photoUrls.map((url: string, order: number) => ({ reviewId: id, url, order })),
                });
            }

            return updated;
        });

        await recalculateItineraryAndCreatorRating(existing.itineraryId);

        res.json({ review: { id: review.id, itineraryId: existing.itineraryId, rating: review.rating, comment: review.comment, photos: photoUrls } });
    } catch (error) {
        console.error('Error updating review:', error);
        res.status(500).json({ error: 'Falha ao atualizar avaliação' });
    }
});

export default router;
