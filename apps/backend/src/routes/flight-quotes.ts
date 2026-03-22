import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// ─── POST /api/quotes — Create a quote request (App) ───
router.post('/', async (req, res) => {
    try {
        const {
            travelerId,
            packageId,
            departureId,
            totalPrice,
            travelers,
            adultsCount,
            childrenCount,
            travelDate,
            contactName,
            contactEmail,
            paymentMethod,
            originCity,
        } = req.body;

        if (!travelerId || !packageId || !originCity) {
            return res.status(400).json({ error: 'travelerId, packageId, and originCity are required' });
        }

        // Create PurchaseHistory with AWAITING_QUOTE status
        const purchase = await prisma.purchaseHistory.create({
            data: {
                travelerId,
                packageId,
                departureId: departureId || undefined,
                totalPrice: totalPrice || 0,
                travelers: travelers || adultsCount || 1,
                adultsCount: adultsCount || 1,
                childrenCount: childrenCount || 0,
                travelDate: travelDate ? new Date(travelDate) : undefined,
                contactName,
                contactEmail,
                paymentMethod,
                originCity,
                status: 'AWAITING_QUOTE',
                bookingCode: `VAMO-${Date.now().toString(36).toUpperCase()}`,
            },
        });

        // Create FlightQuote linked to purchase
        const quote = await prisma.flightQuote.create({
            data: {
                purchaseId: purchase.id,
                originCity,
                status: 'AWAITING_QUOTE',
            },
        });

        res.status(201).json({ purchase, quote });
    } catch (error) {
        console.error('Error creating quote request:', error);
        res.status(500).json({ error: 'Failed to create quote request' });
    }
});

// ─── GET /api/quotes/:purchaseId — Get quote status (App) ───
router.get('/:purchaseId', async (req, res) => {
    try {
        const { purchaseId } = req.params;

        const quote = await prisma.flightQuote.findUnique({
            where: { purchaseId },
            include: {
                purchase: {
                    include: {
                        package: {
                            select: { id: true, title: true, images: true, agencyId: true, agency: { select: { id: true, name: true } } }
                        },
                        traveler: {
                            select: { id: true, name: true, email: true }
                        },
                    }
                }
            }
        });

        if (!quote) {
            return res.status(404).json({ error: 'Quote not found' });
        }

        // Auto-expire if past expiresAt
        if (quote.status === 'QUOTED' && quote.expiresAt && new Date() > quote.expiresAt) {
            const expired = await prisma.flightQuote.update({
                where: { id: quote.id },
                data: { status: 'EXPIRED' },
            });
            return res.json({ ...expired, purchase: quote.purchase });
        }

        res.json(quote);
    } catch (error) {
        console.error('Error fetching quote:', error);
        res.status(500).json({ error: 'Failed to fetch quote' });
    }
});

// ─── GET /api/quotes/agency/:agencyId — List quotes for agency (Dashboard) ───
router.get('/agency/:agencyId', async (req, res) => {
    try {
        const { agencyId } = req.params;

        const quotes = await prisma.flightQuote.findMany({
            where: {
                purchase: {
                    package: { agencyId }
                }
            },
            include: {
                purchase: {
                    include: {
                        package: { select: { id: true, title: true, images: true } },
                        traveler: { select: { id: true, name: true, email: true } },
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Auto-expire any that are past their deadline
        const now = new Date();
        for (const q of quotes) {
            if (q.status === 'QUOTED' && q.expiresAt && now > q.expiresAt) {
                await prisma.flightQuote.update({
                    where: { id: q.id },
                    data: { status: 'EXPIRED' },
                });
                (q as any).status = 'EXPIRED';
            }
        }

        res.json(quotes);
    } catch (error) {
        console.error('Error fetching agency quotes:', error);
        res.status(500).json({ error: 'Failed to fetch agency quotes' });
    }
});

// ─── PUT /api/quotes/:id/submit — Agency submits quote proposal (Dashboard) ───
router.put('/:id/submit', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            airline,
            flightDetails,
            flightImageUrl,
            airfarePrice,
            totalPrice,
            agencyNote,
            expiresInHours,
        } = req.body;

        if (!airfarePrice || !totalPrice) {
            return res.status(400).json({ error: 'airfarePrice and totalPrice are required' });
        }

        const hours = expiresInHours || 6;
        const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);

        const quote = await prisma.flightQuote.update({
            where: { id },
            data: {
                airline,
                flightDetails,
                flightImageUrl,
                airfarePrice,
                totalPrice,
                agencyNote,
                status: 'QUOTED',
                quotedAt: new Date(),
                expiresAt,
            },
        });

        res.json(quote);
    } catch (error) {
        console.error('Error submitting quote:', error);
        res.status(500).json({ error: 'Failed to submit quote' });
    }
});

// ─── PUT /api/quotes/:id/accept — User accepts quote (App) ───
router.put('/:id/accept', async (req, res) => {
    try {
        const { id } = req.params;

        const quote = await prisma.flightQuote.findUnique({ where: { id } });
        if (!quote) return res.status(404).json({ error: 'Quote not found' });

        // Check if expired
        if (quote.expiresAt && new Date() > quote.expiresAt) {
            await prisma.flightQuote.update({ where: { id }, data: { status: 'EXPIRED' } });
            return res.status(410).json({ error: 'Quote has expired' });
        }

        // Update quote
        const updated = await prisma.flightQuote.update({
            where: { id },
            data: { status: 'ACCEPTED', acceptedAt: new Date() },
        });

        // Update purchase status + total price
        await prisma.purchaseHistory.update({
            where: { id: quote.purchaseId },
            data: {
                status: 'PENDING',
                totalPrice: quote.totalPrice || undefined,
            },
        });

        res.json(updated);
    } catch (error) {
        console.error('Error accepting quote:', error);
        res.status(500).json({ error: 'Failed to accept quote' });
    }
});

// ─── PUT /api/quotes/:id/reject — User rejects quote (App) ───
router.put('/:id/reject', async (req, res) => {
    try {
        const { id } = req.params;
        const { userNote } = req.body;

        const quote = await prisma.flightQuote.update({
            where: { id },
            data: { status: 'REJECTED', userNote },
        });

        res.json(quote);
    } catch (error) {
        console.error('Error rejecting quote:', error);
        res.status(500).json({ error: 'Failed to reject quote' });
    }
});

export default router;
