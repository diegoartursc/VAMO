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
            include: {
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
            if (!s.itinerary?.id || seenItineraryIds.has(s.itinerary.id)) return false;
            seenItineraryIds.add(s.itinerary.id);
            return true;
        }).map((s: any) => ({
            id: s.itinerary.id,
            title: s.itinerary.title,
            destination: s.itinerary.destination,
            country: s.itinerary.country,
            image: s.itinerary.images[0]?.url || '',
            purchaseDate: s.createdAt.toISOString().split('T')[0],
            creatorName: s.itinerary.creator.traveler.name || 'Criador VAMO',
            creatorAvatar: s.itinerary.creator.traveler.avatar || '',
            price: s.price,
            currency: s.itinerary.currency || 'AUD',
            duration: s.itinerary.duration,
        }));

        res.json({ purchasedItineraries });
    } catch (error) {
        console.error('Error fetching my trips:', error);
        res.status(500).json({ error: 'Failed to fetch purchased itineraries' });
    }
});

export default router;
