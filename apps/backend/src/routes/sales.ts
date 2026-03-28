import express from 'express';
import prisma from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = express.Router();

// GET all sales for a specific agency
router.get('/:agencyId', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const agencyId = req.params.agencyId as string;

        // Ownership check: the logged-in employee must belong to the requested agency
        if (req.agency?.agencyId !== agencyId) {
            return res.status(403).json({ error: 'Acesso negado: você não pertence a esta agência' });
        }

        const sales = await prisma.purchaseHistory.findMany({
            where: {
                package: {
                    agencyId: agencyId
                }
            },
            include: {
                package: {
                    select: {
                        id: true,
                        title: true,
                        images: true
                    }
                },
                departure: true,
                traveler: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.json(sales);
    } catch (error) {
        console.error('Error fetching sales:', error);
        res.status(500).json({ error: 'Failed to fetch sales' });
    }
});

// PUT update post-purchase documents for a specific sale
router.put('/:purchaseId', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const purchaseId = req.params.purchaseId as string;
        const { voucherUrl, eticketUrl, autoMessage } = req.body;

        // Ownership check: verify this purchase belongs to the requester's agency
        const sale = await prisma.purchaseHistory.findUnique({
            where: { id: purchaseId },
            include: { package: { select: { agencyId: true } } },
        });

        if (!sale) {
            return res.status(404).json({ error: 'Venda não encontrada' });
        }

        if (sale.package.agencyId !== req.agency?.agencyId) {
            return res.status(403).json({ error: 'Acesso negado: esta venda não pertence à sua agência' });
        }

        const updatedSale = await prisma.purchaseHistory.update({
            where: { id: purchaseId },
            data: { voucherUrl, eticketUrl, autoMessage },
        });

        res.json(updatedSale);
    } catch (error) {
        console.error('Error updating sale documents:', error);
        res.status(500).json({ error: 'Failed to update documents' });
    }
});

export default router;
