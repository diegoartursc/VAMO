import { Router, Request, Response } from 'express';
import { DepartureStatus } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';
import { travelerAuthMiddleware, TravelerAuthRequest } from '../middleware/traveler-auth';
import prisma from '../lib/prisma';

const router = Router();

// ─────────────────────────────────────────────
// GET /api/departures/:packageId - List departures for a package (public)
// ─────────────────────────────────────────────
router.get('/:packageId', async (req: Request, res: Response) => {
    try {
        const packageId = req.params.packageId as string;
        const { includeAll } = req.query;

        const where: any = { packageId };
        // Public API: only show open departures with future dates
        if (!includeAll) {
            where.status = { in: ['ABERTA', 'QUASE_LOTADO'] };
            where.startDate = { gte: new Date() };
        }

        const departures = await prisma.packageDeparture.findMany({
            where,
            orderBy: { startDate: 'asc' },
            include: {
                _count: { select: { bookings: true } },
            },
        });

        const result = departures.map(dep => ({
            id: dep.id,
            packageId: dep.packageId,
            startDate: dep.startDate.toISOString().split('T')[0],
            price: dep.price,
            capacityTotal: dep.capacityTotal,
            capacityVamo: dep.capacityVamo,
            capacityVamoAvailable: dep.capacityVamoAvailable,
            capacityVamoReserved: dep.capacityVamo - dep.capacityVamoAvailable,
            minPeople: dep.minPeople,
            status: dep.status,
            totalBookings: dep._count.bookings,
            // Urgency indicators
            urgency: dep.capacityVamoAvailable <= 3
                ? 'ULTIMAS_VAGAS'
                : dep.capacityVamoAvailable <= 5
                    ? 'POUCAS_VAGAS'
                    : null,
        }));

        res.json(result);
    } catch (error: any) {
        console.error('Error fetching departures:', error);
        res.status(500).json({ error: 'Failed to fetch departures' });
    }
});

// ─────────────────────────────────────────────
// POST /api/departures - Create a new departure (agency auth)
// ─────────────────────────────────────────────
router.post('/', authMiddleware, async (req: Request, res: Response) => {
    try {
        const { packageId, startDate, price, capacityTotal, capacityVamo, minPeople } = req.body;

        if (!packageId || !startDate || price == null || !capacityTotal || !capacityVamo) {
            return res.status(400).json({ error: 'Missing required fields: packageId, startDate, price, capacityTotal, capacityVamo' });
        }

        if (capacityVamo > capacityTotal) {
            return res.status(400).json({ error: 'Vagas VAMO não podem exceder a capacidade total' });
        }

        const departure = await prisma.packageDeparture.create({
            data: {
                packageId,
                startDate: new Date(startDate),
                price: parseFloat(price),
                capacityTotal: parseInt(capacityTotal),
                capacityVamo: parseInt(capacityVamo),
                capacityVamoAvailable: parseInt(capacityVamo), // starts fully available
                minPeople: minPeople ? parseInt(minPeople) : null,
                status: 'ABERTA',
            },
        });

        // Update package priceMin/priceMax based on all departures
        await updatePackagePriceRange(packageId);

        res.status(201).json(departure);
    } catch (error: any) {
        console.error('Error creating departure:', error);
        res.status(500).json({ error: 'Failed to create departure' });
    }
});

// ─────────────────────────────────────────────
// PUT /api/departures/:id - Update a departure
// ─────────────────────────────────────────────
router.put('/:id', authMiddleware, async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const { startDate, price, capacityTotal, capacityVamo, minPeople, status } = req.body;

        const existing = await prisma.packageDeparture.findUnique({ where: { id } });
        if (!existing) return res.status(404).json({ error: 'Departure not found' });

        const bookedSlots = existing.capacityVamo - existing.capacityVamoAvailable;
        const newCapacityVamo = capacityVamo != null ? parseInt(capacityVamo) : existing.capacityVamo;

        if (newCapacityVamo < bookedSlots) {
            return res.status(400).json({
                error: `Não é possível reduzir para ${newCapacityVamo} vagas VAMO. Já existem ${bookedSlots} reservas.`
            });
        }

        const departure = await prisma.packageDeparture.update({
            where: { id },
            data: {
                ...(startDate && { startDate: new Date(startDate) }),
                ...(price != null && { price: parseFloat(price) }),
                ...(capacityTotal != null && { capacityTotal: parseInt(capacityTotal) }),
                ...(capacityVamo != null && {
                    capacityVamo: newCapacityVamo,
                    capacityVamoAvailable: newCapacityVamo - bookedSlots,
                }),
                ...(minPeople !== undefined && { minPeople: minPeople ? parseInt(minPeople) : null }),
                ...(status && { status: status as DepartureStatus }),
            },
        });

        await updatePackagePriceRange(existing.packageId);

        res.json(departure);
    } catch (error: any) {
        console.error('Error updating departure:', error);
        res.status(500).json({ error: 'Failed to update departure' });
    }
});

// ─────────────────────────────────────────────
// POST /api/departures/:id/duplicate - Duplicate a departure
// ─────────────────────────────────────────────
router.post('/:id/duplicate', authMiddleware, async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const { startDate } = req.body;

        if (!startDate) {
            return res.status(400).json({ error: 'Nova data de saída é obrigatória para duplicar' });
        }

        const original = await prisma.packageDeparture.findUnique({ where: { id } });
        if (!original) return res.status(404).json({ error: 'Departure not found' });

        const duplicate = await prisma.packageDeparture.create({
            data: {
                packageId: original.packageId,
                startDate: new Date(startDate),
                price: original.price,
                capacityTotal: original.capacityTotal,
                capacityVamo: original.capacityVamo,
                capacityVamoAvailable: original.capacityVamo, // fresh availability
                minPeople: original.minPeople,
                status: 'ABERTA',
            },
        });

        await updatePackagePriceRange(original.packageId);

        res.status(201).json(duplicate);
    } catch (error: any) {
        console.error('Error duplicating departure:', error);
        res.status(500).json({ error: 'Failed to duplicate departure' });
    }
});

// ─────────────────────────────────────────────
// POST /api/departures/:id/close - Close a departure for sales
// ─────────────────────────────────────────────
router.post('/:id/close', authMiddleware, async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;

        const departure = await prisma.packageDeparture.update({
            where: { id },
            data: { status: 'ENCERRADA' },
        });

        res.json(departure);
    } catch (error: any) {
        console.error('Error closing departure:', error);
        res.status(500).json({ error: 'Failed to close departure' });
    }
});

// ─────────────────────────────────────────────
// DELETE /api/departures/:id - Delete a departure (only if no bookings)
// ─────────────────────────────────────────────
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;

        const departure = await prisma.packageDeparture.findUnique({
            where: { id },
            include: { _count: { select: { bookings: true } } },
        });

        if (!departure) return res.status(404).json({ error: 'Departure not found' });

        const depAny = departure as any;
        if (depAny._count && depAny._count.bookings > 0) {
            return res.status(400).json({
                error: 'Não é possível excluir uma saída com reservas. Encerre as vendas em vez disso.'
            });
        }

        await prisma.packageDeparture.delete({ where: { id } });

        await updatePackagePriceRange(departure.packageId);

        res.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting departure:', error);
        res.status(500).json({ error: 'Failed to delete departure' });
    }
});

// ─────────────────────────────────────────────
// POST /api/departures/:id/book - Book slots (with overbooking protection)
// ─────────────────────────────────────────────
router.post('/:id/book', travelerAuthMiddleware, async (req: TravelerAuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const { peopleCount, contactName, contactEmail, paymentMethod } = req.body;
        const travelerId = req.traveler!.travelerId;

        if (!peopleCount) {
            return res.status(400).json({ error: 'peopleCount is required' });
        }

        const count = parseInt(peopleCount);

        // === TRANSACTION: Overbooking Protection ===
        const result = await prisma.$transaction(async (tx) => {
            // Lock the departure row by reading it inside the transaction
            const departure = await tx.packageDeparture.findUnique({ where: { id } });

            if (!departure) throw new Error('DEPARTURE_NOT_FOUND');
            if (departure.status === 'ESGOTADO' || departure.status === 'ENCERRADA') {
                throw new Error('DEPARTURE_CLOSED');
            }
            if (departure.capacityVamoAvailable < count) {
                throw new Error('INSUFFICIENT_SLOTS');
            }

            // Decrement available slots
            const newAvailable = departure.capacityVamoAvailable - count;
            const newStatus: DepartureStatus = newAvailable === 0
                ? 'ESGOTADO'
                : newAvailable <= 3
                    ? 'QUASE_LOTADO'
                    : departure.status;

            await tx.packageDeparture.update({
                where: { id },
                data: {
                    capacityVamoAvailable: newAvailable,
                    status: newStatus,
                },
            });

            // Generate booking code
            const bookingCode = `VAMO-${Date.now().toString(36).toUpperCase()}`;

            // Create the purchase/booking
            const booking = await tx.purchaseHistory.create({
                data: {
                    travelerId,
                    packageId: departure.packageId,
                    departureId: departure.id,
                    totalPrice: departure.price * count,
                    travelers: count,
                    adultsCount: count,
                    status: 'PENDING',
                    bookingCode,
                    contactName: contactName || null,
                    contactEmail: contactEmail || null,
                    paymentMethod: paymentMethod || null,
                    travelDate: departure.startDate,
                },
            });

            return { booking, departure: { ...departure, capacityVamoAvailable: newAvailable, status: newStatus } };
        });

        res.status(201).json({
            booking: result.booking,
            departure: {
                id: result.departure.id,
                capacityVamoAvailable: result.departure.capacityVamoAvailable,
                status: result.departure.status,
            },
        });
    } catch (error: any) {
        if (error.message === 'DEPARTURE_NOT_FOUND') {
            return res.status(404).json({ error: 'Saída não encontrada' });
        }
        if (error.message === 'DEPARTURE_CLOSED') {
            return res.status(400).json({ error: 'Esta saída não está mais disponível para reservas' });
        }
        if (error.message === 'INSUFFICIENT_SLOTS') {
            return res.status(400).json({ error: 'Vagas insuficientes para esta saída' });
        }
        console.error('Error booking departure:', error);
        res.status(500).json({ error: 'Failed to book departure' });
    }
});

// ─────────────────────────────────────────────
// HELPER: Update package priceMin/priceMax from departures
// ─────────────────────────────────────────────
async function updatePackagePriceRange(packageId: string) {
    const departures = await prisma.packageDeparture.findMany({
        where: { packageId, status: { not: 'ENCERRADA' } },
        select: { price: true },
    });

    if (departures.length > 0) {
        const prices = departures.map(d => d.price);
        await prisma.package.update({
            where: { id: packageId },
            data: {
                priceMin: Math.min(...prices),
                priceMax: Math.max(...prices),
            },
        });
    }
}

export default router;
