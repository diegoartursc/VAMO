import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// GET /api/packages - List all packages (public, or filtered by agencyId query param)
router.get('/', async (req: Request, res: Response) => {
    try {
        const { destination, featured, category, minPrice, maxPrice, sort, agencyId } = req.query;

        const where: any = {};
        // If agencyId is provided, show all statuses for that agency (dashboard view)
        if (agencyId) {
            where.agencyId = agencyId as string;
        } else {
            // Public API: only show APPROVED packages
            where.status = 'APPROVED';
        }
        if (destination) where.destination = { contains: destination as string, mode: 'insensitive' };
        if (featured === 'true') where.featured = true;
        if (category) where.categories = { has: category as string };
        if (minPrice) where.priceMin = { gte: parseFloat(minPrice as string) };
        if (maxPrice) where.priceMax = { lte: parseFloat(maxPrice as string) };

        let orderBy: any = { featured: 'desc' };
        if (sort === 'price_asc') orderBy = { priceMin: 'asc' };
        if (sort === 'price_desc') orderBy = { priceMax: 'desc' };
        if (sort === 'rating') orderBy = { rating: 'desc' };
        if (sort === 'newest') orderBy = { createdAt: 'desc' };

        const packages = await prisma.package.findMany({
            where,
            orderBy,
            include: {
                agency: { select: { id: true, name: true, logo: true, verified: true, contactUrl: true, whatsapp: true } },
                images: { orderBy: { order: 'asc' }, select: { url: true, alt: true } },
                pricingWindows: { where: { startDate: { gte: new Date() } }, orderBy: { startDate: 'asc' }, select: { startDate: true, endDate: true, price: true, availableSlots: true } },
                departures: { where: { status: { in: ['ABERTA', 'QUASE_LOTADO'] }, startDate: { gte: new Date() } }, orderBy: { startDate: 'asc' } },
            },
        });

        // Transform to match frontend expected format
        const result = packages.map(pkg => ({
            id: pkg.id,
            title: pkg.title,
            destination: pkg.destination,
            country: pkg.country,
            agency: pkg.agency,
            price: { min: pkg.priceMin, max: pkg.priceMax, currency: pkg.currency },
            images: pkg.images.map(img => img.url),
            duration: pkg.duration,
            includes: pkg.includes,
            rating: pkg.rating,
            reviewCount: pkg.reviewCount,
            featured: pkg.featured,
            description: pkg.description,
            highlights: pkg.highlights,
            badge: pkg.badge?.toLowerCase(),
            inclusions: pkg.inclusions,
            categories: pkg.categories,
            hasFreeCancellation: pkg.hasFreeCancellation,
            isAllInclusive: pkg.isAllInclusive,
            recentPurchases: pkg.recentPurchases,
            priceComparison: pkg.priceComparison,
            priceDiscount: pkg.priceDiscount,
            itinerary: pkg.routeDetails,
            fullDescription: pkg.fullDescription,
            emotionalIntro: pkg.emotionalIntro,
            includedItems: pkg.includedItems,
            notRecommendedFor: pkg.notRecommendedFor,
            importantInfo: pkg.importantInfo,
            perfectFor: pkg.perfectFor,
            availableDates: pkg.pricingWindows.map(pw => ({
                date: pw.startDate.toISOString().split('T')[0],
                price: pw.price,
                spotsLeft: pw.availableSlots,
            })),
        }));

        res.json(result);
    } catch (error) {
        console.error('Error fetching packages:', error);
        res.status(500).json({ error: 'Failed to fetch packages' });
    }
});

// GET /api/packages/featured
router.get('/featured', async (req: Request, res: Response) => {
    try {
        const packages = await prisma.package.findMany({
            where: { featured: true, status: 'APPROVED' },
            include: {
                agency: { select: { id: true, name: true, logo: true, verified: true, contactUrl: true, whatsapp: true } },
                images: { orderBy: { order: 'asc' }, select: { url: true } },
                pricingWindows: { where: { startDate: { gte: new Date() } }, orderBy: { startDate: 'asc' }, select: { startDate: true, endDate: true, price: true, availableSlots: true } },
            },
        });

        const result = packages.map(pkg => ({
            id: pkg.id, title: pkg.title, destination: pkg.destination, country: pkg.country,
            agency: pkg.agency,
            price: { min: pkg.priceMin, max: pkg.priceMax, currency: pkg.currency },
            images: pkg.images.map((img: any) => img.url),
            duration: pkg.duration, includes: pkg.includes, rating: pkg.rating,
            reviewCount: pkg.reviewCount, featured: pkg.featured,
            description: pkg.description, highlights: pkg.highlights,
            badge: pkg.badge?.toLowerCase(), inclusions: pkg.inclusions,
            categories: pkg.categories, hasFreeCancellation: pkg.hasFreeCancellation,
            isAllInclusive: pkg.isAllInclusive, recentPurchases: pkg.recentPurchases,
            priceComparison: pkg.priceComparison, priceDiscount: pkg.priceDiscount,
            itinerary: pkg.routeDetails,
            availableDates: pkg.pricingWindows.map((pw: any) => ({
                date: pw.startDate.toISOString().split('T')[0],
                price: pw.price, spotsLeft: pw.availableSlots,
            })),
        }));

        res.json(result);
    } catch (error) {
        console.error('Error fetching featured packages:', error);
        res.status(500).json({ error: 'Failed to fetch featured packages' });
    }
});

// GET /api/packages/:id
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const pkg = await prisma.package.findUnique({
            where: { id },
            include: {
                agency: { select: { id: true, name: true, logo: true, verified: true, contactUrl: true, whatsapp: true } },
                images: { orderBy: { order: 'asc' }, select: { url: true, alt: true } },
                pricingWindows: { orderBy: { startDate: 'asc' }, select: { startDate: true, endDate: true, price: true, availableSlots: true } },
                departures: { where: { status: { in: ['ABERTA', 'QUASE_LOTADO'] }, startDate: { gte: new Date() } }, orderBy: { startDate: 'asc' } },
                reviews: { include: { images: true, responses: true }, orderBy: { createdAt: 'desc' }, take: 10 },
            },
        });

        if (!pkg) { res.status(404).json({ error: 'Package not found' }); return; }

        const p = pkg as any;
        const result = {
            id: p.id, title: p.title, destination: p.destination, country: p.country,
            agency: p.agency,
            price: { min: p.priceMin, max: p.priceMax, currency: p.currency },
            images: (p.images || []).map((img: any) => img.url),
            duration: p.duration, includes: p.includes, rating: p.rating,
            reviewCount: p.reviewCount, featured: p.featured,
            description: p.description, fullDescription: p.fullDescription,
            emotionalIntro: p.emotionalIntro,
            highlights: p.highlights, badge: p.badge?.toLowerCase(),
            inclusions: p.inclusions, categories: p.categories,
            hasFreeCancellation: p.hasFreeCancellation, isAllInclusive: p.isAllInclusive,
            recentPurchases: p.recentPurchases, priceComparison: p.priceComparison,
            priceDiscount: p.priceDiscount, itinerary: p.routeDetails,
            includedItems: p.includedItems, notRecommendedFor: p.notRecommendedFor,
            importantInfo: p.importantInfo, perfectFor: p.perfectFor,
            maxSlots: p.maxSlots,
            availableDates: (p.pricingWindows || []).map((pw: any) => ({
                date: pw.startDate.toISOString().split('T')[0],
                price: pw.price, spotsLeft: pw.availableSlots,
            })),
            departures: p.departures || [],
            reviews: (p.reviews || []).map((r: any) => ({
                id: r.id, rating: r.rating, text: r.comment, date: r.createdAt.toISOString().split('T')[0],
                verified: r.verified, language: r.language, helpful: r.helpful,
                user: { name: r.userName, location: r.userLocation, avatar: r.userAvatar, initial: r.userInitial },
                photos: (r.images || []).map((img: any) => img.url),
                response: r.responses?.[0] ? { date: r.responses[0].createdAt.toISOString().split('T')[0], text: r.responses[0].text } : undefined,
            })),
        };

        res.json(result);
    } catch (error) {
        console.error('Error fetching package:', error);
        res.status(500).json({ error: 'Failed to fetch package' });
    }
});

// GET /api/packages/:id/related
router.get('/:id/related', async (req: Request, res: Response) => {
    try {
        const pkg = await prisma.package.findUnique({ where: { id: req.params.id as string } });
        if (!pkg) { res.json([]); return; }

        const related = await prisma.package.findMany({
            where: { id: { not: pkg.id }, status: 'APPROVED', OR: [{ destination: pkg.destination }, { country: pkg.country }] },
            include: {
                agency: { select: { id: true, name: true, logo: true, verified: true } },
                images: { orderBy: { order: 'asc' }, take: 1, select: { url: true } },
            },
            take: 4,
        });

        const result = related.map(r => ({
            id: r.id, title: r.title, destination: r.destination, country: r.country,
            agency: r.agency, price: { min: r.priceMin, max: r.priceMax, currency: r.currency },
            images: r.images.map((img: any) => img.url), duration: r.duration,
            rating: r.rating, reviewCount: r.reviewCount, badge: r.badge?.toLowerCase(),
        }));

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch related packages' });
    }
});

// ─── Helpers ───────────────────────────────────────

const CONTINENT_MAP: Record<string, string> = {
    'Brasil': 'América do Sul', 'Argentina': 'América do Sul', 'Chile': 'América do Sul', 'Colômbia': 'América do Sul',
    'Peru': 'América do Sul', 'Uruguai': 'América do Sul', 'Paraguai': 'América do Sul', 'Bolívia': 'América do Sul',
    'Equador': 'América do Sul', 'Venezuela': 'América do Sul', 'Guiana': 'América do Sul', 'Suriname': 'América do Sul',
    'Estados Unidos': 'América do Norte', 'Canadá': 'América do Norte', 'México': 'América do Norte',
    'Cuba': 'América Central', 'Jamaica': 'América Central', 'Costa Rica': 'América Central', 'Panamá': 'América Central',
    'República Dominicana': 'América Central', 'Guatemala': 'América Central', 'Honduras': 'América Central',
    'França': 'Europa', 'Itália': 'Europa', 'Espanha': 'Europa', 'Portugal': 'Europa', 'Alemanha': 'Europa',
    'Reino Unido': 'Europa', 'Holanda': 'Europa', 'Bélgica': 'Europa', 'Suíça': 'Europa', 'Áustria': 'Europa',
    'Grécia': 'Europa', 'Turquia': 'Europa', 'Croácia': 'Europa', 'República Tcheca': 'Europa', 'Polônia': 'Europa',
    'Hungria': 'Europa', 'Irlanda': 'Europa', 'Suécia': 'Europa', 'Noruega': 'Europa', 'Dinamarca': 'Europa',
    'Finlândia': 'Europa', 'Islândia': 'Europa', 'Romênia': 'Europa', 'Sérvia': 'Europa', 'Montenegro': 'Europa',
    'Japão': 'Ásia', 'China': 'Ásia', 'Tailândia': 'Ásia', 'Índia': 'Ásia', 'Indonésia': 'Ásia',
    'Coreia do Sul': 'Ásia', 'Vietnã': 'Ásia', 'Malásia': 'Ásia', 'Singapura': 'Ásia', 'Filipinas': 'Ásia',
    'Sri Lanka': 'Ásia', 'Nepal': 'Ásia', 'Camboja': 'Ásia', 'Maldivas': 'Ásia', 'Emirados Árabes': 'Ásia',
    'Israel': 'Ásia', 'Jordânia': 'Ásia',
    'Egito': 'África', 'África do Sul': 'África', 'Marrocos': 'África', 'Quênia': 'África', 'Tanzânia': 'África',
    'Namíbia': 'África', 'Etiópia': 'África', 'Moçambique': 'África', 'Nigéria': 'África',
    'Austrália': 'Oceania', 'Nova Zelândia': 'Oceania', 'Fiji': 'Oceania',
};

function getContinent(country: string): string | null {
    return CONTINENT_MAP[country] || null;
}

function calcQualityScore(data: any): number {
    let score = 0;
    const check = (v: any, pts: number) => { if (v && (typeof v !== 'string' || v.trim())) score += pts; };
    const checkArr = (v: any[], pts: number) => { if (v && v.length > 0) score += pts; };

    check(data.title, 8);
    check(data.destination, 8);
    check(data.country, 8);
    check(data.description, 8);
    check(data.duration, 5);
    check(data.priceMin, 10);
    checkArr(data.categories, 8);
    checkArr(data.travelStyles, 8);
    checkArr(data.highlights, 5);
    checkArr(data.includes, 5);
    checkArr(data.includedItems, 5);
    checkArr(data.perfectFor, 3);
    checkArr(data.notRecommendedFor, 3);
    check(data.fullDescription, 4);
    check(data.cancellationPolicy, 3);
    check(data.airport, 2);
    check(data.whatsappOfficial, 2);
    check(data.emotionalIntro, 3);

    return Math.min(score, 100);
}

// ─── POST /api/packages ─── Create (requires auth)
router.post('/', authMiddleware, async (req: Request, res: Response) => {
    try {
        const data = req.body;

        // Validation
        const errors: string[] = [];
        if (!data.agencyId) errors.push('agencyId é obrigatório');
        if (!data.title?.trim()) errors.push('Título é obrigatório');
        if (!data.destination?.trim()) errors.push('Destino é obrigatório');
        if (!data.country?.trim()) errors.push('País é obrigatório');
        if (!data.duration || data.duration < 1) errors.push('Duração é obrigatória');
        if (!data.priceMin && data.priceMin !== 0) errors.push('Preço base é obrigatório');
        if (data.travelStyles && data.travelStyles.length > 3) errors.push('Máximo 3 estilos de viagem');
        if (data.categories && data.categories.length > 5) errors.push('Máximo 5 categorias');
        if (!data.categories || data.categories.length < 1) errors.push('Mínimo 1 categoria');

        if (errors.length > 0) {
            res.status(400).json({ error: 'Validação falhou', details: errors });
            return;
        }

        const continent = getContinent(data.country);
        const nights = data.duration ? data.duration - 1 : null;

        const pkg = await prisma.package.create({
            data: {
                agencyId: data.agencyId,
                title: data.title,
                destination: data.destination,
                country: data.country,
                description: data.description || '',
                fullDescription: data.fullDescription,
                emotionalIntro: data.emotionalIntro,
                currency: data.currency || 'BRL',
                duration: data.duration,
                nights,
                continent,
                airport: data.airport,
                multiDestination: data.multiDestination || false,
                additionalCities: data.additionalCities || [],
                travelStyles: data.travelStyles || [],
                priceMin: data.priceMin,
                priceMax: data.priceMax,
                promoPrice: data.promoPrice,
                installments: data.installments,
                cancellationPolicy: data.cancellationPolicy,
                includes: data.includes || [],
                includedItems: data.includedItems || [],
                highlights: data.highlights || [],
                notRecommendedFor: data.notRecommendedFor || [],
                importantInfo: data.importantInfo || [],
                perfectFor: data.perfectFor || [],
                categories: data.categories || [],
                inclusions: data.inclusions,
                routeDetails: data.routeDetails,
                featured: data.featured || false,
                hasFreeCancellation: data.hasFreeCancellation || false,
                isAllInclusive: data.isAllInclusive || false,
                whatsappOfficial: data.whatsappOfficial,
                autoMessage: data.autoMessage,
                voucherUrl: data.voucherUrl,
                eticketUrl: data.eticketUrl,
                qualityScore: 0, // will be recalculated
                status: 'PENDING_REVIEW', // goes to admin approval queue
            },
        });

        // Calculate quality score
        const qualityScore = calcQualityScore(pkg);
        const updated = await prisma.package.update({
            where: { id: pkg.id },
            data: { qualityScore },
        });

        res.status(201).json(updated);
    } catch (error) {
        console.error('Error creating package:', error);
        res.status(500).json({ error: 'Failed to create package' });
    }
});

// ─── PUT /api/packages/:id ─── Update (requires auth)
router.put('/:id', authMiddleware, async (req: Request, res: Response) => {
    try {
        const data = req.body;

        // Validation
        const errors: string[] = [];
        if (data.travelStyles && data.travelStyles.length > 3) errors.push('Máximo 3 estilos de viagem');
        if (data.categories && data.categories.length > 5) errors.push('Máximo 5 categorias');
        if (data.categories && data.categories.length < 1) errors.push('Mínimo 1 categoria');

        if (errors.length > 0) {
            res.status(400).json({ error: 'Validação falhou', details: errors });
            return;
        }

        // Auto-calculate
        if (data.country) data.continent = getContinent(data.country);
        if (data.duration) data.nights = data.duration - 1;

        const ALLOWED_FIELDS = [
            'title', 'destination', 'country', 'description', 'fullDescription', 'emotionalIntro',
            'currency', 'duration', 'nights', 'continent', 'airport', 'multiDestination',
            'additionalCities', 'travelStyles', 'priceMin', 'priceMax', 'promoPrice', 'installments',
            'cancellationPolicy', 'includes', 'includedItems', 'highlights', 'notRecommendedFor',
            'importantInfo', 'perfectFor', 'categories', 'inclusions', 'routeDetails', 'featured',
            'hasFreeCancellation', 'isAllInclusive', 'whatsappOfficial', 'autoMessage', 'voucherUrl',
            'eticketUrl', 'qualityScore', 'status', 'badge',
        ];
        const updateData: Record<string, any> = {};
        for (const key of ALLOWED_FIELDS) {
            if (data[key] !== undefined) updateData[key] = data[key];
        }

        const pkg = await prisma.package.update({
            where: { id: req.params.id as string },
            data: updateData,
        });

        // Recalculate quality score
        const qualityScore = calcQualityScore(data);
        const updated = await prisma.package.update({
            where: { id: pkg.id },
            data: { qualityScore },
        });

        res.json(updated);
    } catch (error) {
        console.error('Error updating package:', error);
        res.status(500).json({ error: 'Failed to update package' });
    }
});

// ─── DELETE /api/packages/:id ─── Soft delete (archive, requires auth)
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
    try {
        const pkg = await prisma.package.update({
            where: { id: req.params.id as string },
            data: { status: 'ARCHIVED' },
        });
        res.json({ message: 'Pacote arquivado', id: pkg.id });
    } catch (error) {
        console.error('Error archiving package:', error);
        res.status(500).json({ error: 'Failed to archive package' });
    }
});

export default router;
