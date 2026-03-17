import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// GET /api/itineraries - List all itineraries
router.get('/', async (req: Request, res: Response) => {
    try {
        const { destination, featured, sort } = req.query;
        const where: any = { status: 'APPROVED' };
        if (destination) where.destination = { contains: destination as string, mode: 'insensitive' };
        if (featured === 'true') where.featured = true;

        let orderBy: any = { featured: 'desc' };
        if (sort === 'price_asc') orderBy = { price: 'asc' };
        if (sort === 'price_desc') orderBy = { price: 'desc' };
        if (sort === 'rating') orderBy = { rating: 'desc' };

        const itineraries = await prisma.itinerary.findMany({
            where, orderBy,
            include: {
                creator: { include: { traveler: { select: { name: true, avatar: true } } } },
                images: { orderBy: { order: 'asc' }, select: { url: true } },
            },
        });

        const result = itineraries.map(it => ({
            id: it.id, title: it.title, destination: it.destination, country: it.country,
            creator: {
                id: it.creator.id, name: it.creator.traveler.name,
                avatar: it.creator.traveler.avatar || '👤',
                verificationLevel: it.creator.verificationLevel.toLowerCase(),
                rating: it.creator.averageRating, salesCount: it.creator.totalSales,
            },
            description: it.description, price: it.price, currency: it.currency,
            images: it.images.map(img => img.url), rating: it.rating,
            reviewCount: it.reviewCount, inclusions: it.inclusions,
            duration: it.duration, featured: it.featured,
            highlights: it.highlights, estimatedSpending: it.estimatedSpending,
        }));

        res.json(result);
    } catch (error) {
        console.error('Error fetching itineraries:', error);
        res.status(500).json({ error: 'Failed to fetch itineraries' });
    }
});

// GET /api/itineraries/featured
router.get('/featured', async (req: Request, res: Response) => {
    try {
        const itineraries = await prisma.itinerary.findMany({
            where: { featured: true, status: 'APPROVED' },
            include: {
                creator: { include: { traveler: { select: { name: true, avatar: true } } } },
                images: { orderBy: { order: 'asc' }, select: { url: true } },
            },
        });

        const result = itineraries.map(it => ({
            id: it.id, title: it.title, destination: it.destination, country: it.country,
            creator: {
                id: it.creator.id, name: it.creator.traveler.name,
                avatar: it.creator.traveler.avatar || '👤',
                verificationLevel: it.creator.verificationLevel.toLowerCase(),
                rating: it.creator.averageRating, salesCount: it.creator.totalSales,
            },
            description: it.description, price: it.price, currency: it.currency,
            images: it.images.map(img => img.url), rating: it.rating,
            reviewCount: it.reviewCount, inclusions: it.inclusions,
            duration: it.duration, featured: it.featured,
            highlights: it.highlights, estimatedSpending: it.estimatedSpending,
        }));

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch featured itineraries' });
    }
});

// ─── DASHBOARD STATS ───
// GET /api/itineraries/dashboard/stats
// NOTE: Must be registered BEFORE /:id to avoid being caught by the catch-all param
router.get('/dashboard/stats', async (req: Request, res: Response) => {
    try {
        const { creatorId } = req.query;
        const where: any = {};
        if (creatorId) where.creatorId = creatorId as string;

        const itineraries = await prisma.itinerary.findMany({
            where,
            include: { sales: true, reviews: true },
        });

        const totalSales = itineraries.reduce((sum, it) => sum + it.sales.length, 0);
        const totalRevenue = itineraries.reduce((sum, it) =>
            sum + it.sales.reduce((s, sale) => s + sale.price, 0), 0);
        const allReviews = itineraries.flatMap(it => it.reviews);
        const averageRating = allReviews.length > 0
            ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
            : 0;

        res.json({
            totalRevenue,
            totalSales,
            averageRating: Math.round(averageRating * 10) / 10,
            totalReviews: allReviews.length,
            activeItineraries: itineraries.filter(it => it.status === 'ACTIVE').length,
            totalItineraries: itineraries.length,
            itineraries: itineraries.map(it => ({
                id: it.id,
                title: it.title,
                destination: it.destination,
                country: it.country,
                status: it.status.toLowerCase(),
                sales: it.sales.length,
                revenue: it.sales.reduce((s, sale) => s + sale.price, 0),
                rating: it.rating,
                reviewCount: it.reviewCount,
                duration: it.duration,
                price: it.price,
                updatedAt: it.updatedAt.toISOString(),
            })),
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
});

// GET /api/itineraries/:id
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const it = await prisma.itinerary.findUnique({
            where: { id: req.params.id as string },
            include: {
                creator: { include: { traveler: { select: { name: true, avatar: true } } } },
                images: { orderBy: { order: 'asc' }, select: { url: true } },
                days: { orderBy: { dayNumber: 'asc' }, include: { activities: { orderBy: { order: 'asc' } } } },
                files: true,
                reviews: { include: { images: true, responses: true }, orderBy: { createdAt: 'desc' }, take: 10 },
            },
        });

        if (!it) { res.status(404).json({ error: 'Itinerary not found' }); return; }

        const i = it as any;
        const result = {
            id: i.id, title: i.title, destination: i.destination, country: i.country,
            creator: {
                id: i.creator.id, name: i.creator.traveler.name,
                avatar: i.creator.traveler.avatar || '👤',
                verificationLevel: i.creator.verificationLevel.toLowerCase(),
                rating: i.creator.averageRating, salesCount: i.creator.totalSales,
            },
            description: i.description, price: i.price, currency: i.currency,
            images: (i.images || []).map((img: any) => img.url), rating: i.rating,
            reviewCount: i.reviewCount, inclusions: i.inclusions,
            duration: i.duration, featured: i.featured,
            highlights: i.highlights, estimatedSpending: i.estimatedSpending,
            downloadCount: i.downloadCount,
            days: (i.days || []).map((d: any) => ({
                dayNumber: d.dayNumber, title: d.title, summary: d.summary,
                description: d.description,
                activities: (d.activities || []).map((a: any) => ({
                    id: a.id, title: a.title, description: a.description,
                    duration: a.duration, location: a.location, tips: a.tips,
                    time: a.time, type: a.type, icon: a.icon, images: a.images,
                    mapLink: a.mapLink, completed: a.completed, notes: a.notes,
                })),
            })),
            files: (i.files || []).map((f: any) => ({ id: f.id, name: f.name, type: f.type, url: f.url, size: f.size })),
            reviews: (i.reviews || []).map((r: any) => ({
                id: r.id, rating: r.rating, text: r.comment,
                date: r.createdAt.toISOString().split('T')[0],
                verified: r.verified, helpful: r.helpful,
                user: { name: r.userName, location: r.userLocation, avatar: r.userAvatar, initial: r.userInitial },
                photos: (r.images || []).map((img: any) => img.url),
            })),
        };

        res.json(result);
    } catch (error) {
        console.error('Error fetching itinerary:', error);
        res.status(500).json({ error: 'Failed to fetch itinerary' });
    }
});


// ─── QUALITY SCORE CALCULATOR ───
function calcItineraryQuality(data: any): number {
    let s = 0;
    const c = (v: any, p: number) => { if (v && (typeof v !== 'string' || v.trim())) s += p; };
    const a = (v: any[], p: number) => { if (v && v.length > 0) s += p; };
    c(data.title, 8); c(data.destination, 8); c(data.country, 5); c(data.description, 8);
    c(data.subtitle, 5); c(data.duration, 3); c(data.price, 10);
    a(data.travelStyles, 8); a(data.categories, 8);
    a(data.activeModules, 5); a(data.highlights, 5); a(data.inclusions, 5);
    a(data.days, 10); // has at least 1 day
    if (data.days && data.days.length >= 3) s += 5; // bonus for 3+ days
    if (data.estimatedSpending) s += 5;
    c(data.productType, 2); c(data.promoPrice, 2);
    return Math.min(s, 100);
}

// ─── CREATE ───
// POST /api/itineraries (requires auth)
router.post('/', authMiddleware, async (req: Request, res: Response) => {
    try {
        const {
            creatorId, title, destination, country, description,
            price, currency, duration, highlights, inclusions,
            estimatedSpending, featured, images, days,
            // New fields
            subtitle, travelStyles, categories, productType,
            activeModules, promoPrice, installments,
            immediateAccess, lifetimeAccess, offlineDownload,
            allowPdf, allowShare,
            accommodations, transports, checklists,
        } = req.body;

        // Validate required fields
        if (!creatorId || !title || !destination || !country || !description || !price || !duration) {
            res.status(400).json({ error: 'Missing required fields: creatorId, title, destination, country, description, price, duration' });
            return;
        }
        // Validate styles max 3
        if (travelStyles && travelStyles.length > 3) {
            res.status(400).json({ error: 'Máximo 3 estilos de viagem' });
            return;
        }
        // Validate categories min 1 max 5
        if (categories && categories.length > 5) {
            res.status(400).json({ error: 'Máximo 5 categorias' });
            return;
        }

        const qualityScore = calcItineraryQuality(req.body);

        const itinerary = await prisma.itinerary.create({
            data: {
                creatorId,
                title,
                destination,
                country,
                description,
                price: parseFloat(price),
                currency: currency || 'BRL',
                duration: parseInt(duration),
                highlights: highlights || [],
                inclusions: inclusions || [],
                estimatedSpending: estimatedSpending || undefined,
                featured: featured || false,
                subtitle: subtitle || undefined,
                travelStyles: travelStyles || [],
                categories: categories || [],
                productType: productType || 'DIGITAL',
                activeModules: activeModules || [],
                promoPrice: promoPrice ? parseFloat(promoPrice) : undefined,
                installments: installments ? parseInt(installments) : undefined,
                immediateAccess: immediateAccess ?? true,
                lifetimeAccess: lifetimeAccess ?? true,
                offlineDownload: offlineDownload ?? true,
                allowPdf: allowPdf ?? false,
                allowShare: allowShare ?? true,
                qualityScore,
                images: images?.length ? {
                    create: images.map((url: string, i: number) => ({ url, order: i })),
                } : undefined,
                days: days?.length ? {
                    create: days.map((day: any) => ({
                        dayNumber: day.dayNumber,
                        title: day.title,
                        summary: day.summary || '',
                        description: day.description || '',
                        activities: day.activities?.length ? {
                            create: day.activities.map((act: any, i: number) => ({
                                order: i,
                                title: act.title,
                                description: act.description || '',
                                duration: act.duration || '',
                                location: act.location || '',
                                tips: act.tips || '',
                                time: act.time || '',
                                type: act.type || 'activity',
                                icon: act.icon || '📍',
                                images: act.images || [],
                                mapLink: act.mapLink || '',
                                latitude: act.latitude ? parseFloat(act.latitude) : undefined,
                                longitude: act.longitude ? parseFloat(act.longitude) : undefined,
                                category: act.category || undefined,
                            })),
                        } : undefined,
                    })),
                } : undefined,
                accommodations: accommodations?.length ? {
                    create: accommodations.map((a: any, i: number) => ({
                        name: a.name, neighborhood: a.neighborhood || '',
                        description: a.description || '', priceRange: a.priceRange || '',
                        rating: a.rating ? parseFloat(a.rating) : undefined,
                        externalLink: a.externalLink || '', order: i,
                    })),
                } : undefined,
                transports: transports?.length ? {
                    create: transports.map((t: any, i: number) => ({
                        description: t.description || '', passTypes: t.passTypes || '',
                        estimatedPrice: t.estimatedPrice || '', notes: t.notes || '', order: i,
                    })),
                } : undefined,
                checklists: checklists?.length ? {
                    create: checklists.map((c: any, i: number) => ({
                        category: c.category, item: c.item,
                        isDefault: c.isDefault ?? true, order: i,
                    })),
                } : undefined,
            },
            include: {
                images: true,
                days: { include: { activities: true } },
                accommodations: { orderBy: { order: 'asc' } },
                transports: { orderBy: { order: 'asc' } },
                checklists: { orderBy: { order: 'asc' } },
                creator: { include: { traveler: { select: { name: true, avatar: true } } } },
            },
        });

        res.status(201).json(itinerary);
    } catch (error) {
        console.error('Error creating itinerary:', error);
        res.status(500).json({ error: 'Failed to create itinerary' });
    }
});

// ─── UPDATE ───
// PUT /api/itineraries/:id (requires auth)
router.put('/:id', authMiddleware, async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const {
            title, destination, country, description,
            price, currency, duration, highlights, inclusions,
            estimatedSpending, featured, status, images, days,
            // New fields
            subtitle, travelStyles, categories, productType,
            activeModules, promoPrice, installments,
            immediateAccess, lifetimeAccess, offlineDownload,
            allowPdf, allowShare,
            accommodations, transports, checklists,
        } = req.body;

        // Check itinerary exists
        const existing = await prisma.itinerary.findUnique({ where: { id } });
        if (!existing) {
            res.status(404).json({ error: 'Itinerary not found' });
            return;
        }

        // Validate styles max 3
        if (travelStyles && travelStyles.length > 3) {
            res.status(400).json({ error: 'Máximo 3 estilos de viagem' });
            return;
        }
        if (categories && categories.length > 5) {
            res.status(400).json({ error: 'Máximo 5 categorias' });
            return;
        }

        // Build update data (only include fields that were sent)
        const updateData: any = {};
        if (title !== undefined) updateData.title = title;
        if (destination !== undefined) updateData.destination = destination;
        if (country !== undefined) updateData.country = country;
        if (description !== undefined) updateData.description = description;
        if (price !== undefined) updateData.price = parseFloat(price);
        if (currency !== undefined) updateData.currency = currency;
        if (duration !== undefined) updateData.duration = parseInt(duration);
        if (highlights !== undefined) updateData.highlights = highlights;
        if (inclusions !== undefined) updateData.inclusions = inclusions;
        if (estimatedSpending !== undefined) updateData.estimatedSpending = estimatedSpending;
        if (featured !== undefined) updateData.featured = featured;
        if (status !== undefined) updateData.status = status.toUpperCase();
        // New fields
        if (subtitle !== undefined) updateData.subtitle = subtitle;
        if (travelStyles !== undefined) updateData.travelStyles = travelStyles;
        if (categories !== undefined) updateData.categories = categories;
        if (productType !== undefined) updateData.productType = productType;
        if (activeModules !== undefined) updateData.activeModules = activeModules;
        if (promoPrice !== undefined) updateData.promoPrice = promoPrice ? parseFloat(promoPrice) : null;
        if (installments !== undefined) updateData.installments = installments ? parseInt(installments) : null;
        if (immediateAccess !== undefined) updateData.immediateAccess = immediateAccess;
        if (lifetimeAccess !== undefined) updateData.lifetimeAccess = lifetimeAccess;
        if (offlineDownload !== undefined) updateData.offlineDownload = offlineDownload;
        if (allowPdf !== undefined) updateData.allowPdf = allowPdf;
        if (allowShare !== undefined) updateData.allowShare = allowShare;

        // Recalculate quality score
        const merged = { ...existing, ...updateData, days, accommodations, transports, checklists };
        updateData.qualityScore = calcItineraryQuality(merged);

        // Use a transaction for atomic updates
        const result = await prisma.$transaction(async (tx) => {
            // Update images if provided
            if (images !== undefined) {
                await tx.itineraryImage.deleteMany({ where: { itineraryId: id } });
                if (images.length > 0) {
                    await tx.itineraryImage.createMany({
                        data: images.map((url: string, i: number) => ({
                            itineraryId: id, url, order: i,
                        })),
                    });
                }
            }

            // Update days if provided
            if (days !== undefined) {
                const existingDays = await tx.itineraryDay.findMany({ where: { itineraryId: id } });
                for (const day of existingDays) {
                    await tx.itineraryActivity.deleteMany({ where: { dayId: day.id } });
                }
                await tx.itineraryDay.deleteMany({ where: { itineraryId: id } });

                for (const day of days) {
                    await tx.itineraryDay.create({
                        data: {
                            itineraryId: id,
                            dayNumber: day.dayNumber,
                            title: day.title,
                            summary: day.summary || '',
                            description: day.description || '',
                            activities: day.activities?.length ? {
                                create: day.activities.map((act: any, i: number) => ({
                                    order: i,
                                    title: act.title,
                                    description: act.description || '',
                                    duration: act.duration || '',
                                    location: act.location || '',
                                    tips: act.tips || '',
                                    time: act.time || '',
                                    type: act.type || 'activity',
                                    icon: act.icon || '📍',
                                    images: act.images || [],
                                    mapLink: act.mapLink || '',
                                    latitude: act.latitude ? parseFloat(act.latitude) : undefined,
                                    longitude: act.longitude ? parseFloat(act.longitude) : undefined,
                                    category: act.category || undefined,
                                })),
                            } : undefined,
                        },
                    });
                }
            }

            // Update accommodations if provided
            if (accommodations !== undefined) {
                await tx.itineraryAccommodation.deleteMany({ where: { itineraryId: id } });
                if (accommodations.length > 0) {
                    for (let i = 0; i < accommodations.length; i++) {
                        const a = accommodations[i];
                        await tx.itineraryAccommodation.create({
                            data: {
                                itineraryId: id, name: a.name, neighborhood: a.neighborhood || '',
                                description: a.description || '', priceRange: a.priceRange || '',
                                rating: a.rating ? parseFloat(a.rating) : undefined,
                                externalLink: a.externalLink || '', order: i,
                            },
                        });
                    }
                }
            }

            // Update transports if provided
            if (transports !== undefined) {
                await tx.itineraryTransport.deleteMany({ where: { itineraryId: id } });
                if (transports.length > 0) {
                    for (let i = 0; i < transports.length; i++) {
                        const t = transports[i];
                        await tx.itineraryTransport.create({
                            data: {
                                itineraryId: id, description: t.description || '',
                                passTypes: t.passTypes || '', estimatedPrice: t.estimatedPrice || '',
                                notes: t.notes || '', order: i,
                            },
                        });
                    }
                }
            }

            // Update checklists if provided
            if (checklists !== undefined) {
                await tx.itineraryChecklist.deleteMany({ where: { itineraryId: id } });
                if (checklists.length > 0) {
                    for (let i = 0; i < checklists.length; i++) {
                        const c = checklists[i];
                        await tx.itineraryChecklist.create({
                            data: {
                                itineraryId: id, category: c.category, item: c.item,
                                isDefault: c.isDefault ?? true, order: i,
                            },
                        });
                    }
                }
            }

            // Update the itinerary itself
            return tx.itinerary.update({
                where: { id },
                data: updateData,
                include: {
                    images: { orderBy: { order: 'asc' } },
                    days: { orderBy: { dayNumber: 'asc' }, include: { activities: { orderBy: { order: 'asc' } } } },
                    accommodations: { orderBy: { order: 'asc' } },
                    transports: { orderBy: { order: 'asc' } },
                    checklists: { orderBy: { order: 'asc' } },
                    creator: { include: { traveler: { select: { name: true, avatar: true } } } },
                },
            });
        });

        res.json(result);
    } catch (error) {
        console.error('Error updating itinerary:', error);
        res.status(500).json({ error: 'Failed to update itinerary' });
    }
});

// ─── DELETE ───
// DELETE /api/itineraries/:id (requires auth)
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const { hard } = req.query;

        const existing = await prisma.itinerary.findUnique({ where: { id: id as string } });
        if (!existing) {
            res.status(404).json({ error: 'Itinerary not found' });
            return;
        }

        if (hard === 'true') {
            // Hard delete — remove completely
            await prisma.itinerary.delete({ where: { id } });
        } else {
            // Soft delete — archive
            await prisma.itinerary.update({
                where: { id },
                data: { status: 'ARCHIVED' },
            });
        }

        res.json({ success: true, message: hard === 'true' ? 'Itinerary deleted' : 'Itinerary archived' });
    } catch (error) {
        console.error('Error deleting itinerary:', error);
        res.status(500).json({ error: 'Failed to delete itinerary' });
    }
});

export default router;
