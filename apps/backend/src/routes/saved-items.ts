import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { travelerAuthMiddleware, TravelerAuthRequest } from '../middleware/traveler-auth';
import { PUBLIC_ITINERARY_WHERE } from '../lib/itineraryStatus';

const router = Router();

router.get('/', travelerAuthMiddleware, async (req: TravelerAuthRequest, res: Response) => {
    try {
        const travelerId = req.traveler!.travelerId;
        const rows = await prisma.savedItem.findMany({
            where: {
                travelerId,
                itineraryId: { not: null },
            },
            select: { id: true, itineraryId: true, itinerary: { select: { status: true } } },
            orderBy: { createdAt: 'asc' },
        });

        // Limpeza defensiva: um SavedItem só sobrevive aqui se o roteiro
        // continuar ACTIVE. Roteiros pausados/arquivados (ou removidos)
        // nunca devem ser devolvidos como favorito — e aproveitamos a
        // consulta pra já apagar o registro obsoleto, então a próxima
        // leitura não paga esse custo de novo.
        const staleIds: string[] = [];
        const activeIds: string[] = [];
        for (const row of rows) {
            if (!row.itineraryId) continue;
            if (row.itinerary && row.itinerary.status === PUBLIC_ITINERARY_WHERE.status) {
                activeIds.push(row.itineraryId);
            } else {
                staleIds.push(row.id);
            }
        }
        if (staleIds.length) {
            prisma.savedItem.deleteMany({ where: { id: { in: staleIds } } }).catch((err) => {
                console.error('[saved-items] failed to prune stale favorites:', err);
            });
        }

        res.json({ itineraryIds: activeIds });
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
                ...PUBLIC_ITINERARY_WHERE,
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
