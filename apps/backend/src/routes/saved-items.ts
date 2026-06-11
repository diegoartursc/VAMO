import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { travelerAuthMiddleware, TravelerAuthRequest } from '../middleware/traveler-auth';

const router = Router();

router.get('/', travelerAuthMiddleware, async (req: TravelerAuthRequest, res: Response) => {
    try {
        const rows = await prisma.savedItem.findMany({
            where: {
                travelerId: req.traveler!.travelerId,
                itineraryId: { not: null },
            },
            select: { itineraryId: true },
            orderBy: { createdAt: 'asc' },
        });
        res.json({
            itineraryIds: rows
                .map(row => row.itineraryId)
                .filter((id): id is string => !!id),
        });
    } catch (error) {
        console.error('Error fetching saved itineraries:', error);
        res.status(500).json({ error: 'Falha ao carregar roteiros salvos' });
    }
});

router.put('/:itineraryId', travelerAuthMiddleware, async (req: TravelerAuthRequest, res: Response) => {
    try {
        const travelerId = req.traveler!.travelerId;
        const itineraryId = req.params.itineraryId as string;
        const itinerary = await prisma.itinerary.findFirst({
            where: {
                id: itineraryId,
                status: { in: ['APPROVED', 'ACTIVE'] },
            },
            select: { id: true },
        });
        if (!itinerary) {
            res.status(404).json({ error: 'Roteiro indisponível para salvar' });
            return;
        }

        await prisma.savedItem.upsert({
            where: { travelerId_itineraryId: { travelerId, itineraryId } },
            create: { travelerId, itineraryId },
            update: {},
        });
        res.json({ saved: true, itineraryId });
    } catch (error) {
        console.error('Error saving itinerary:', error);
        res.status(500).json({ error: 'Falha ao salvar roteiro' });
    }
});

router.delete('/:itineraryId', travelerAuthMiddleware, async (req: TravelerAuthRequest, res: Response) => {
    try {
        await prisma.savedItem.deleteMany({
            where: {
                travelerId: req.traveler!.travelerId,
                itineraryId: req.params.itineraryId as string,
            },
        });
        res.json({ saved: false, itineraryId: req.params.itineraryId });
    } catch (error) {
        console.error('Error removing saved itinerary:', error);
        res.status(500).json({ error: 'Falha ao remover roteiro salvo' });
    }
});

export default router;
