import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/my-trips/:travelerId
router.get('/:travelerId', async (req: Request, res: Response) => {
    try {
        const travelerId = req.params.travelerId as string;
        const now = new Date();

        // ─── Upcoming Packages (travel date in the future, not cancelled) ───
        const upcomingPurchases = await prisma.purchaseHistory.findMany({
            where: {
                travelerId,
                travelDate: { gt: now },
                status: { not: 'CANCELLED' },
            },
            include: {
                package: {
                    include: {
                        agency: { select: { id: true, name: true, logo: true } },
                        images: { orderBy: { order: 'asc' }, take: 1, select: { url: true } },
                    },
                },
            },
            orderBy: { travelDate: 'asc' },
        });

        const upcomingPackages = upcomingPurchases.map((p: any) => ({
            id: p.package.id,
            title: p.package.title,
            destination: p.package.destination,
            country: p.package.country,
            image: p.package.images[0]?.url || '',
            travelDate: p.travelDate?.toISOString().split('T')[0] || '',
            travelEndDate: p.travelEndDate?.toISOString().split('T')[0] || '',
            status: p.status === 'CONFIRMED' ? 'confirmed'
                : p.status === 'PENDING' ? 'pending_payment'
                    : 'cancelled',
            agencyName: p.package.agency.name,
            agencyLogo: p.package.agency.logo || '',
            price: p.totalPrice,
            currency: p.package.currency || 'BRL',
        }));

        // ─── Past Packages (travel date in the past or status completed) ───
        const pastPurchases = await prisma.purchaseHistory.findMany({
            where: {
                travelerId,
                OR: [
                    { travelDate: { lt: now }, status: { not: 'CANCELLED' } },
                    { status: 'COMPLETED' },
                ],
            },
            include: {
                package: {
                    include: {
                        agency: { select: { id: true, name: true, logo: true } },
                        images: { orderBy: { order: 'asc' }, take: 1, select: { url: true } },
                    },
                },
            },
            orderBy: { travelDate: 'desc' },
        });

        const pastPackages = pastPurchases.map((p: any) => ({
            id: p.package.id,
            title: p.package.title,
            destination: p.package.destination,
            country: p.package.country,
            image: p.package.images[0]?.url || '',
            travelDate: p.travelDate?.toISOString().split('T')[0] || '',
            travelEndDate: p.travelEndDate?.toISOString().split('T')[0] || '',
            status: 'confirmed' as const,
            agencyName: p.package.agency.name,
            agencyLogo: p.package.agency.logo || '',
            price: p.totalPrice,
            currency: p.package.currency || 'BRL',
        }));

        // ─── Purchased Itineraries ───
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

        const purchasedItineraries = itinerarySales.map((s: any) => ({
            id: s.itinerary.id,
            title: s.itinerary.title,
            destination: s.itinerary.destination,
            country: s.itinerary.country,
            image: s.itinerary.images[0]?.url || '',
            purchaseDate: s.createdAt.toISOString().split('T')[0],
            creatorName: s.itinerary.creator.traveler.name,
            creatorAvatar: s.itinerary.creator.traveler.avatar || '',
            price: s.price,
            currency: s.itinerary.currency || 'BRL',
        }));

        // ─── Saved Items ───
        const savedDbItems = await prisma.savedItem.findMany({
            where: { travelerId },
            include: {
                package: {
                    include: {
                        images: { orderBy: { order: 'asc' }, take: 1, select: { url: true } },
                    },
                },
                itinerary: {
                    include: {
                        images: { orderBy: { order: 'asc' }, take: 1, select: { url: true } },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        const savedItems = savedDbItems.map((si: any) => {
            const isPackage = !!si.packageId;
            const item = isPackage ? si.package : si.itinerary;
            return {
                id: item.id,
                title: item.title,
                destination: item.destination,
                country: item.country,
                image: item.images?.[0]?.url || '',
                type: isPackage ? 'package' : 'itinerary',
                price: isPackage ? (si.package.priceMin || 0) : si.itinerary.price,
                currency: item.currency || 'BRL',
                savedDate: si.createdAt.toISOString().split('T')[0],
            };
        });

        res.json({ upcomingPackages, pastPackages, purchasedItineraries, savedItems });
    } catch (error) {
        console.error('Error fetching my trips:', error);
        res.status(500).json({ error: 'Failed to fetch trips' });
    }
});

export default router;
