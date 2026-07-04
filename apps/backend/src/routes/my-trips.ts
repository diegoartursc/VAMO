import { Router, Response } from 'express';
import { travelerAuthMiddleware, TravelerAuthRequest } from '../middleware/traveler-auth';
import prisma from '../lib/prisma';

const router = Router();

// GET /api/my-trips - Get current traveler's trips (requires auth)
router.get('/', travelerAuthMiddleware, async (req: TravelerAuthRequest, res: Response) => {
    try {
        const travelerId = req.traveler!.travelerId;
        const itinerarySales = await prisma.itinerarySale.findMany({
            where: { travelerId },
            select: {
                id: true,
                price: true,
                createdAt: true,
                purchaseData: true,
                itinerary: {
                    include: {
                        creator: { include: { traveler: { select: { name: true, avatar: true } } } },
                        images: { orderBy: { order: 'asc' }, take: 1, select: { url: true } },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        const seenItineraryIds = new Set<string>();
        const purchasedItineraries = itinerarySales.filter((s: any) => {
            const snapshot = s.purchaseData?.routeSnapshot;
            const itineraryId = snapshot?.id || s.itinerary?.id;
            if (!itineraryId || seenItineraryIds.has(itineraryId)) return false;
            seenItineraryIds.add(itineraryId);
            return true;
        }).map((s: any) => {
            const snapshot = s.purchaseData?.routeSnapshot;
            const images = Array.isArray(snapshot?.images) ? snapshot.images : [];
            const highlightPhotos = Array.isArray(snapshot?.highlightPhotos) ? snapshot.highlightPhotos : [];
            const image = images[0] || highlightPhotos[0] || s.itinerary?.images?.[0]?.url || '';
            return {
                id: snapshot?.id || s.itinerary.id,
                purchaseId: s.id,
                title: snapshot?.title || s.itinerary.title,
                destination: snapshot?.destination || s.itinerary.destination,
                country: snapshot?.country || s.itinerary.country,
                image,
                purchaseDate: s.createdAt.toISOString().split('T')[0],
                // Identidade do criador = SEMPRE a atual (perfil ao vivo), não o
                // snapshot congelado na compra. Assim a foto/nome atualizados do
                // criador aparecem em "Meus Roteiros". O snapshot preserva o
                // CONTEÚDO do roteiro, não a identidade visual da pessoa.
                creatorName: s.itinerary.creator.traveler.name || snapshot?.creator?.name || 'Criador VAMO',
                creatorAvatar: s.itinerary.creator.traveler.avatar || '',
                price: s.price,
                currency: snapshot?.currency || s.itinerary.currency || 'AUD',
                duration: snapshot?.duration || s.itinerary.duration,
            };
        });

        res.json({ purchasedItineraries });
    } catch (error) {
        console.error('Error fetching my trips:', error);
        res.status(500).json({ error: 'Failed to fetch purchased itineraries' });
    }
});

export default router;
