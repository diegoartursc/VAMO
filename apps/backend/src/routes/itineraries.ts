import { Router, Request, Response } from 'express';
import { authMiddleware, optionalAuthMiddleware, AuthRequest } from '../middleware/auth';
import { createAuditMiddleware } from '../middleware/audit';
import prisma from '../lib/prisma';
import { verifyToken } from '../lib/auth';

const router = Router();

// GET /api/itineraries - List all itineraries
router.get('/', async (req: Request, res: Response) => {
    try {
        const { destination, featured, sort } = req.query;
        const where: any = { status: 'APPROVED' };
        if (destination) where.destination = { contains: destination as string, mode: 'insensitive' };
        if (featured === 'true') where.featured = true;

        // Default: featured first, then highest qualityScore, then best rating
        let orderBy: any = [{ featured: 'desc' }, { qualityScore: 'desc' }, { rating: 'desc' }];
        if (sort === 'price_asc')   orderBy = [{ price: 'asc' }];
        if (sort === 'price_desc')  orderBy = [{ price: 'desc' }];
        if (sort === 'rating')      orderBy = [{ rating: 'desc' }, { qualityScore: 'desc' }];
        if (sort === 'score')       orderBy = [{ qualityScore: 'desc' }, { rating: 'desc' }];
        // Marketplace-oriented sorts (Parte C)
        if (sort === 'newest')      orderBy = [{ createdAt: 'desc' }];
        if (sort === 'popular')     orderBy = [{ featured: 'desc' }, { qualityScore: 'desc' }, { rating: 'desc' }];
        // "sales" usa o totalSales do criador (a Itinerary não tem salesCount próprio
        // ainda — proxy seguro até existir uma tabela de transações própria).
        if (sort === 'sales') {
            orderBy = [
                { creator: { totalSales: 'desc' } },
                { qualityScore: 'desc' },
                { rating: 'desc' },
            ];
        }

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
            qualityScore: it.qualityScore,
            // Campos para badges do card (vitrines): categorias temáticas e módulos ativos
            categories: it.categories || [],
            travelStyles: it.travelStyles || [],
            activeModules: it.activeModules || [],
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
            orderBy: [{ qualityScore: 'desc' }, { rating: 'desc' }],
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
            qualityScore: it.qualityScore,
            // Campos para badges do card (vitrines): categorias temáticas e módulos ativos
            categories: it.categories || [],
            travelStyles: it.travelStyles || [],
            activeModules: it.activeModules || [],
        }));

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch featured itineraries' });
    }
});

// ─── DASHBOARD STATS ───
// GET /api/itineraries/dashboard/stats
// NOTE: Must be registered BEFORE /:id to avoid being caught by the catch-all param
router.get('/dashboard/stats', optionalAuthMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        let { creatorId } = req.query as { creatorId?: string };

        // Resolução do creatorId em ordem:
        // 1. creatorId explícito na query
        // 2. travelerId do token JWT → resolve creator vinculado
        // SEM fallback para "primeiro creator" (causa do bug do Diego!)
        if (!creatorId && req.traveler?.travelerId) {
            const myCreator = await (prisma.creator as any).findUnique({
                where: { travelerId: req.traveler.travelerId },
                select: { id: true },
            });
            creatorId = myCreator?.id;
            console.log('[dashboard/stats] resolved creatorId from token:', { travelerId: req.traveler.travelerId, creatorId });
        }

        if (!creatorId) {
            console.log('[dashboard/stats] no creatorId resolved — returning empty stats');
            res.json({
                totalRevenue: 0, totalSales: 0, averageRating: 0, totalReviews: 0,
                activeItineraries: 0, totalItineraries: 0, itineraries: [],
            });
            return;
        }
        const where: any = { creatorId };
        console.log('[dashboard/stats] querying creatorId=', creatorId);

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
router.get('/:id', optionalAuthMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const it = await prisma.itinerary.findUnique({
            where: { id: req.params.id as string },
            include: {
                creator: { include: { traveler: { select: { name: true, avatar: true, id: true } } } },
                images: { orderBy: { order: 'asc' }, select: { url: true } },
                days: { orderBy: { dayNumber: 'asc' }, include: { activities: { orderBy: { order: 'asc' } } } },
                files: true,
                accommodations: { orderBy: { order: 'asc' } },
                transports:     { orderBy: { order: 'asc' } },
                checklists:     { orderBy: { order: 'asc' } },
                reviews: { include: { images: true, responses: true }, orderBy: { createdAt: 'desc' }, take: 10 },
            },
        });

        if (!it) { res.status(404).json({ error: 'Itinerary not found' }); return; }

        // Block access to non-public itineraries for non-owners
        const PUBLIC_STATUSES = ['APPROVED', 'ACTIVE'];
        const isPublic = PUBLIC_STATUSES.includes(it.status as string);
        const isOwner  = req.traveler?.travelerId === (it as any).creator?.traveler?.id;
        if (!isPublic && !isOwner) {
            res.status(404).json({ error: 'Itinerary not found' });
            return;
        }

        const i = it as any;

        // Map accommodations (format also as accommodationOptions for post-purchase screen)
        const accommodationList = (i.accommodations || []).map((a: any) => ({
            id: a.id, name: a.name, neighborhood: a.neighborhood,
            description: a.description, priceRange: a.priceRange, rating: a.rating,
            externalLink: a.externalLink, address: a.address, mapLink: a.mapLink,
            tips: a.tips, nights: a.nights, startDate: a.startDate, endDate: a.endDate,
            totalPrice: a.totalPrice, priceCurrency: a.priceCurrency, order: a.order,
        }));

        // Map transports (also as transport.items for post-purchase screen)
        const transportList = (i.transports || []).map((t: any) => ({
            id: t.id, description: t.description, passTypes: t.passTypes,
            estimatedPrice: t.estimatedPrice, notes: t.notes,
            startDate: t.startDate, endDate: t.endDate,
            priceValue: t.priceValue, priceCurrency: t.priceCurrency, order: t.order,
        }));

        // Map checklists (flatten to a single "checklist" array for post-purchase screen)
        const checklistList = (i.checklists || []).map((c: any) => ({
            id: c.id, category: c.category, item: c.item,
            isDefault: c.isDefault, order: c.order, completed: false,
        }));

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
            // ─── Identidade e comercial ───
            subtitle: i.subtitle, travelStyles: i.travelStyles, categories: i.categories,
            productType: i.productType, activeModules: i.activeModules,
            promoPrice: i.promoPrice, installments: i.installments,
            immediateAccess: i.immediateAccess, lifetimeAccess: i.lifetimeAccess,
            offlineDownload: i.offlineDownload, allowPdf: i.allowPdf, allowShare: i.allowShare,
            travelProofUrl: i.travelProofUrl,
            qualityScore: i.qualityScore, status: i.status,
            approvalNote: i.approvalNote, approvedAt: i.approvedAt,
            // ─── Destinos extras ───
            extraCities: i.extraCities || [], extraCountries: i.extraCountries || [],
            // ─── Datas da viagem ───
            tripStartDate: i.tripStartDate, tripEndDate: i.tripEndDate,
            // ─── Módulos (JSON) ───
            flightInfo:   i.flightInfo   || null,
            attractions:  i.attractions  || [],
            restaurants:  i.restaurants  || [],
            generalTips:  i.generalTips  || [],
            mediaUrls:    i.mediaUrls    || [],
            highlightPhotos: i.highlightPhotos || [],
            spendingProfile: i.spendingProfile || null,
            receiveList:  i.receiveList  || null,
            // ─── Relações (com alias compat pro mobile pós-compra) ───
            accommodations: accommodationList,
            accommodationOptions: accommodationList,  // alias para mobile pós-compra
            transports: transportList,
            transport: { items: transportList },       // alias para mobile pós-compra
            checklists: checklistList,
            checklist: checklistList,                  // alias para mobile pós-compra
            days: (i.days || []).map((d: any) => ({
                dayNumber: d.dayNumber, title: d.title, summary: d.summary,
                description: d.description,
                activities: (d.activities || []).map((a: any) => ({
                    id: a.id, title: a.title, description: a.description,
                    duration: a.duration, location: a.location, tips: a.tips,
                    time: a.time, type: a.type, icon: a.icon, images: a.images,
                    mapLink: a.mapLink, completed: a.completed, notes: a.notes,
                    latitude: a.latitude, longitude: a.longitude, category: a.category,
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


// ─── QUALITY SCORE CALCULATOR ───────────────────────────────────────────────
// Blocos (total = 100 pts):
//   1. Identidade & Indexação  22 pts
//   2. Comercial               10 pts
//   3. Imagens de capa          8 pts
//   4. Itinerário dia a dia    20 pts
//   5. Módulos de conteúdo     20 pts
//   6. Estimativa de gasto      5 pts
//   7. Confiança & Qualidade   15 pts
// Quanto maior o score, mais destaque no app (home + buscas).
function calcItineraryQuality(data: any): number {
    let s = 0;

    // Bloco 1 — Identidade & Indexação (22 pts)
    if (data.title?.trim()) s += 5;
    if (data.subtitle?.trim()) s += 3;
    if (data.destination?.trim()) s += 4;
    if (data.country?.trim()) s += 2;
    if (data.description?.trim()) s += 3;
    if ((data.description?.trim().length ?? 0) >= 150) s += 2;
    if ((data.travelStyles?.length ?? 0) >= 1) s += 3;

    // Bloco 2 — Comercial (10 pts)
    if (parseFloat(data.price) > 0) s += 6;
    if ((data.categories?.length ?? 0) >= 1) s += 2;
    if ((data.promoPrice && parseFloat(data.promoPrice) > 0) || data.installments) s += 2;

    // Bloco 3 — Imagens de capa (8 pts)
    const imgs = (data.images || []).filter(Boolean);
    if (imgs.length >= 1) s += 5;
    if (imgs.length >= 3) s += 3;

    // Bloco 4 — Itinerário dia a dia (20 pts)
    const days: any[] = data.days || [];
    if (days.length >= 1) s += 5;
    if (days.length >= parseInt(data.duration) || days.length >= (data.duration ?? 1)) s += 7;
    const totalActs = days.reduce((acc: number, d: any) => acc + (d.activities?.length ?? 0), 0);
    if (days.length > 0 && totalActs / days.length >= 2) s += 5;
    if (days.some((d: any) => d.activities?.some((a: any) => a.time?.trim()))) s += 3;

    // Bloco 5 — Módulos de conteúdo (20 pts)
    const accomms   = data.accommodations || [];
    const attrs     = data.attractions    || [];
    const rests     = data.restaurants    || [];
    const transps   = data.transports     || [];
    const tips      = data.generalTips    || [];
    const checks    = data.checklists     || [];
    if (accomms.length >= 1) s += 4;
    if (attrs.length   >= 1) s += 4;
    if (rests.length   >= 1) s += 4;
    if (transps.length >= 1) s += 4;
    if (tips.filter((t: string) => typeof t === 'string' && t.trim()).length >= 1) s += 2;
    if (checks.length  >= 1) s += 2;

    // Bloco 6 — Estimativa de gasto (5 pts)
    const sp = data.estimatedSpending;
    if (sp && (parseFloat(sp.min) > 0 || parseFloat(sp.max) > 0)) s += 5;

    // Bloco 7 — Confiança & Qualidade (15 pts)
    if (data.travelProofUrl?.trim()) s += 5;
    if ((data.highlights || []).filter(Boolean).length >= 2) s += 5;
    if ((data.inclusions || []).filter(Boolean).length >= 2) s += 5;

    return Math.min(Math.round(s), 100);
}

// ─── CREATE ───
// POST /api/itineraries (requires auth)
router.post('/', optionalAuthMiddleware, createAuditMiddleware('CREATE'), async (req: AuthRequest, res: Response) => {
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
            travelProofUrl,
            // ─── Novos campos (pós-audit) ───
            extraCities, extraCountries,
            flightInfo, attractions, restaurants, generalTips,
            mediaUrls, highlightPhotos,
            tripStartDate, tripEndDate,
            spendingProfile, receiveList,
        } = req.body;

        // Validate required fields (description is optional — backend stores empty string if absent)
        const missing: string[] = [];
        if (!title)       missing.push('title');
        if (!destination) missing.push('destination');
        if (!country)     missing.push('country');
        if (!price)       missing.push('price');
        if (!duration)    missing.push('duration');
        if (missing.length) {
            console.warn('[itineraries.POST] Missing required fields:', missing, 'body keys:', Object.keys(req.body || {}));
            res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
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

        // Resolve creator em ordem:
        // 1. creatorId enviado explicitamente no body
        // 2. travelerId do token JWT → busca creator vinculado
        // SEM fallback para "primeiro creator" (causa o bug do Diego)
        let resolvedCreatorId: string | null = null;
        if (creatorId) {
            const existing = await prisma.creator.findUnique({ where: { id: creatorId } });
            if (existing) resolvedCreatorId = existing.id;
        }
        if (!resolvedCreatorId && req.traveler?.travelerId) {
            const myCreator = await (prisma.creator as any).findUnique({
                where: { travelerId: req.traveler.travelerId },
                select: { id: true },
            });
            resolvedCreatorId = myCreator?.id || null;
            console.log('[POST /itineraries] creator resolved from token:', { travelerId: req.traveler.travelerId, creatorId: resolvedCreatorId });

            // Auto-promote: se o traveler logado ainda não tem Creator, criar agora.
            // Política de produto: criar o primeiro roteiro já torna o usuário um roteirista.
            if (!resolvedCreatorId) {
                const traveler = await prisma.traveler.findUnique({
                    where: { id: req.traveler.travelerId },
                    select: { id: true, name: true, bio: true },
                });
                if (traveler) {
                    const newCreator = await (prisma.creator as any).create({
                        data: {
                            travelerId: traveler.id,
                            bio: traveler.bio || `Roteirista no VAMO — ${traveler.name}`,
                            verificationLevel: 'BASIC',
                        },
                        select: { id: true },
                    });
                    resolvedCreatorId = newCreator.id;
                    console.log('[POST /itineraries] auto-created creator for traveler:', { travelerId: traveler.id, creatorId: resolvedCreatorId });
                }
            }
        }
        if (!resolvedCreatorId) {
            res.status(401).json({ error: 'Faça login como criador para publicar roteiros.' });
            return;
        }

        const qualityScore = calcItineraryQuality(req.body);

        const itinerary = await prisma.itinerary.create({
            data: {
                creatorId: resolvedCreatorId,
                title,
                destination,
                country,
                description: description || '',
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
                status: 'PENDING_REVIEW',  // sempre vai para fila de aprovação
                travelProofUrl: travelProofUrl || undefined,
                // ─── Novos campos ───
                extraCities: extraCities || [],
                extraCountries: extraCountries || [],
                flightInfo: flightInfo || undefined,
                attractions: attractions || undefined,
                restaurants: restaurants || undefined,
                generalTips: generalTips || [],
                mediaUrls: mediaUrls || [],
                highlightPhotos: highlightPhotos || [],
                tripStartDate: tripStartDate ? new Date(tripStartDate) : undefined,
                tripEndDate: tripEndDate ? new Date(tripEndDate) : undefined,
                spendingProfile: spendingProfile || undefined,
                receiveList: receiveList || undefined,
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
                        externalLink: a.externalLink || '',
                        address: a.address || undefined,
                        mapLink: a.mapLink || undefined,
                        tips: a.tips || undefined,
                        nights: a.nights ? parseInt(a.nights) : undefined,
                        startDate: a.startDate || undefined,
                        endDate: a.endDate || undefined,
                        totalPrice: a.totalPrice || undefined,
                        priceCurrency: a.priceCurrency || undefined,
                        order: i,
                    })),
                } : undefined,
                transports: transports?.length ? {
                    create: transports.map((t: any, i: number) => ({
                        description: t.description || '', passTypes: t.passTypes || '',
                        estimatedPrice: t.estimatedPrice || '', notes: t.notes || '',
                        startDate: t.startDate || undefined,
                        endDate: t.endDate || undefined,
                        priceValue: t.priceValue || undefined,
                        priceCurrency: t.priceCurrency || undefined,
                        order: i,
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
    } catch (error: any) {
        // Surface a useful message to the frontend so the user knows what to fix.
        const code = error?.code;
        const meta = error?.meta;
        console.error('[itineraries.POST] Error creating itinerary:', {
            message: error?.message, code, meta,
        });
        let userMessage = 'Failed to create itinerary';
        if (code === 'P2003') userMessage = `Foreign key constraint failed (${meta?.field_name || 'unknown'}). Verifique se o creatorId existe.`;
        else if (code === 'P2002') userMessage = `Valor duplicado em ${meta?.target?.join(', ') || 'campo único'}.`;
        else if (error?.message) userMessage = `Erro do servidor: ${error.message}`;
        res.status(500).json({ error: userMessage });
    }
});

// ─── UPDATE ───
// PUT /api/itineraries/:id (requires auth)
router.put('/:id', optionalAuthMiddleware, createAuditMiddleware('UPDATE'), async (req: AuthRequest, res: Response) => {
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
            travelProofUrl,
            // ─── Novos campos (pós-audit) ───
            extraCities, extraCountries,
            flightInfo, attractions, restaurants, generalTips,
            mediaUrls, highlightPhotos,
            tripStartDate, tripEndDate,
            spendingProfile, receiveList,
        } = req.body;

        // Check itinerary exists
        const existing = await prisma.itinerary.findUnique({ where: { id } });
        if (!existing) {
            res.status(404).json({ error: 'Itinerary not found' });
            return;
        }

        // Ownership check: if request is authenticated, only the owner can edit
        if (req.traveler) {
            const creator = await prisma.creator.findUnique({
                where: { id: existing.creatorId },
                select: { travelerId: true },
            });
            if (!creator || creator.travelerId !== req.traveler.travelerId) {
                res.status(403).json({ error: 'Sem permissão para editar este roteiro' });
                return;
            }
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
        if (travelProofUrl !== undefined) updateData.travelProofUrl = travelProofUrl;
        // ─── Novos campos ───
        if (extraCities !== undefined)     updateData.extraCities = extraCities;
        if (extraCountries !== undefined)  updateData.extraCountries = extraCountries;
        if (flightInfo !== undefined)      updateData.flightInfo = flightInfo;
        if (attractions !== undefined)     updateData.attractions = attractions;
        if (restaurants !== undefined)     updateData.restaurants = restaurants;
        if (generalTips !== undefined)     updateData.generalTips = generalTips;
        if (mediaUrls !== undefined)       updateData.mediaUrls = mediaUrls;
        if (highlightPhotos !== undefined) updateData.highlightPhotos = highlightPhotos;
        if (tripStartDate !== undefined)   updateData.tripStartDate = tripStartDate ? new Date(tripStartDate) : null;
        if (tripEndDate !== undefined)     updateData.tripEndDate = tripEndDate ? new Date(tripEndDate) : null;
        if (spendingProfile !== undefined) updateData.spendingProfile = spendingProfile;
        if (receiveList !== undefined)     updateData.receiveList = receiveList;

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
                                externalLink: a.externalLink || '',
                                address: a.address || undefined,
                                mapLink: a.mapLink || undefined,
                                tips: a.tips || undefined,
                                nights: a.nights ? parseInt(a.nights) : undefined,
                                startDate: a.startDate || undefined,
                                endDate: a.endDate || undefined,
                                totalPrice: a.totalPrice || undefined,
                                priceCurrency: a.priceCurrency || undefined,
                                order: i,
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
                                notes: t.notes || '',
                                startDate: t.startDate || undefined,
                                endDate: t.endDate || undefined,
                                priceValue: t.priceValue || undefined,
                                priceCurrency: t.priceCurrency || undefined,
                                order: i,
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
router.delete('/:id', optionalAuthMiddleware, createAuditMiddleware('DELETE'), async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const { hard } = req.query;

        const existing = await prisma.itinerary.findUnique({ where: { id: id as string } });
        if (!existing) {
            res.status(404).json({ error: 'Itinerary not found' });
            return;
        }

        // Ownership check: if request is authenticated, only the owner can delete
        if (req.traveler) {
            const creator = await prisma.creator.findUnique({
                where: { id: existing.creatorId },
                select: { travelerId: true },
            });
            if (!creator || creator.travelerId !== req.traveler.travelerId) {
                res.status(403).json({ error: 'Sem permissão para excluir este roteiro' });
                return;
            }
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

// ─── PURCHASE ───
// POST /api/itineraries/:id/purchase (traveler-auth required)
// Records an ItinerarySale so the itinerary appears in the traveler's "Meus Roteiros".
router.post('/:id/purchase', async (req: Request, res: Response) => {
    try {
        const itineraryId = req.params.id as string;
        const { paymentMethod } = req.body || {};

        // Resolve traveler — prefer JWT, fall back to first traveler (demo / dev mode)
        let travelerId: string | null = null;
        const authHeader = req.headers.authorization;
        if (authHeader?.startsWith('Bearer ')) {
            try {
                const decoded = verifyToken(authHeader.substring(7)) as any;
                if (decoded?.travelerId) travelerId = decoded.travelerId;
            } catch { /* ignore — fall through */ }
        }
        if (!travelerId) {
            res.status(401).json({ error: 'Autenticação necessária para realizar a compra' });
            return;
        }

        const itinerary = await prisma.itinerary.findUnique({ where: { id: itineraryId } });
        if (!itinerary) { res.status(404).json({ error: 'Itinerary not found' }); return; }
        if (itinerary.status !== 'APPROVED') {
            res.status(400).json({ error: 'Itinerary is not available for purchase' });
            return;
        }

        // Idempotent: if a sale already exists for this traveler+itinerary, return it.
        const existing = await prisma.itinerarySale.findFirst({
            where: { itineraryId, travelerId },
        });
        if (existing) {
            res.json({ id: existing.id, itineraryId, travelerId, alreadyPurchased: true });
            return;
        }

        const sale = await prisma.itinerarySale.create({
            data: {
                itineraryId,
                travelerId,
                price: itinerary.price,
                commission: itinerary.price * 0.15, // 15% platform commission
            },
        });

        res.json({ id: sale.id, itineraryId, travelerId, paymentMethod: paymentMethod || 'unknown', alreadyPurchased: false });
    } catch (error) {
        console.error('Error creating itinerary purchase:', error);
        res.status(500).json({ error: 'Failed to record purchase' });
    }
});

export default router;
