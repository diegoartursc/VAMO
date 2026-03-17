import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// GET all sales for a specific agency
router.get('/:agencyId', async (req, res) => {
    try {
        const { agencyId } = req.params;
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
router.put('/:purchaseId', async (req, res) => {
    try {
        const { purchaseId } = req.params;
        const { voucherUrl, eticketUrl, autoMessage } = req.body;

        const updatedSale = await prisma.purchaseHistory.update({
            where: {
                id: purchaseId
            },
            data: {
                voucherUrl,
                eticketUrl,
                autoMessage
            }
        });

        res.json(updatedSale);
    } catch (error) {
        console.error('Error updating sale documents:', error);
        res.status(500).json({ error: 'Failed to update documents' });
    }
});

export default router;
