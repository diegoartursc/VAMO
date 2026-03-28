import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// GET /api/destinations
router.get('/', async (req: Request, res: Response) => {
    try {
        const { search, popular } = req.query;
        const where: any = {};
        if (popular === 'true') where.popular = true;
        if (search) {
            where.OR = [
                { name: { contains: search as string, mode: 'insensitive' } },
                { country: { contains: search as string, mode: 'insensitive' } },
            ];
        }

        const destinations = await prisma.destination.findMany({ where, orderBy: { popular: 'desc' } });

        res.json(destinations.map(d => ({
            id: d.id, name: d.name, country: d.country, emoji: d.emoji, popular: d.popular,
        })));
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch destinations' });
    }
});

export default router;
