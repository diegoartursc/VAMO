import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Validation schemas
const createPackageSchema = z.object({
    title: z.string().min(5, 'Título deve ter no mínimo 5 caracteres'),
    destination: z.string().min(2),
    country: z.string().min(2),
    description: z.string().min(20, 'Descrição deve ter no mínimo 20 caracteres'),
    priceMin: z.number().positive('Preço mínimo deve ser positivo'),
    priceMax: z.number().positive('Preço máximo deve ser positivo'),
    duration: z.number().int().positive('Duração deve ser um número inteiro positivo'),
    includes: z.array(z.string()).min(1, 'Adicione pelo menos 1 item incluído'),
    highlights: z.array(z.string()).optional().default([]),
    categories: z.array(z.string()).optional().default([]),
    hasFreeCancellation: z.boolean().optional().default(false),
    isAllInclusive: z.boolean().optional().default(false),
});

// GET /api/packages - List all packages (PUBLIC)
router.get('/', async (req, res: Response) => {
    try {
        const { destination, country, minPrice, maxPrice, duration, category } = req.query;

        const packages = await prisma.package.findMany({
            where: {
                status: 'active',
                ...(destination && {
                    destination: {
                        contains: destination as string,
                        mode: 'insensitive'
                    }
                }),
                ...(country && {
                    country: {
                        contains: country as string,
                        mode: 'insensitive'
                    }
                }),
                ...(minPrice && { priceMin: { gte: Number(minPrice) } }),
                ...(maxPrice && { priceMax: { lte: Number(maxPrice) } }),
                ...(duration && { duration: Number(duration) }),
                ...(category && { categories: { has: category as string } }),
            },
            include: {
                agency: {
                    select: {
                        id: true,
                        name: true,
                        logo: true,
                        verified: true,
                        contactUrl: true,
                        whatsapp: true,
                    },
                },
                images: {
                    orderBy: { order: 'asc' },
                },
            },
            orderBy: [
                { featured: 'desc' },
                { createdAt: 'desc' },
            ],
        });

        res.json({
            total: packages.length,
            packages,
        });
    } catch (error) {
        console.error('Get packages error:', error);
        res.status(500).json({ error: 'Erro ao buscar pacotes' });
    }
});

// GET /api/packages/:id - Get single package (PUBLIC)
router.get('/:id', async (req, res: Response) => {
    try {
        const { id } = req.params;

        const packageData = await prisma.package.findUnique({
            where: { id },
            include: {
                agency: {
                    select: {
                        id: true,
                        name: true,
                        logo: true,
                        verified: true,
                        contactUrl: true,
                        whatsapp: true,
                    },
                },
                images: {
                    orderBy: { order: 'asc' },
                },
                reviews: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
            },
        });

        if (!packageData) {
            return res.status(404).json({ error: 'Pacote não encontrado' });
        }

        res.json(packageData);
    } catch (error) {
        console.error('Get package error:', error);
        res.status(500).json({ error: 'Erro ao buscar pacote' });
    }
});

// POST /api/packages - Create package (PROTECTED)
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const validatedData = createPackageSchema.parse(req.body);

        const package_ = await prisma.package.create({
            data: {
                ...validatedData,
                agencyId: req.agency!.agencyId,
            },
            include: {
                agency: {
                    select: {
                        id: true,
                        name: true,
                        verified: true,
                    },
                },
            },
        });

        res.status(201).json({
            message: 'Pacote criado com sucesso',
            package: package_,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                error: 'Dados inválidos',
                details: error.errors
            });
        }
        console.error('Create package error:', error);
        res.status(500).json({ error: 'Erro ao criar pacote' });
    }
});

// PUT /api/packages/:id - Update package (PROTECTED)
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const validatedData = createPackageSchema.partial().parse(req.body);

        // Check if package belongs to agency
        const existingPackage = await prisma.package.findUnique({
            where: { id },
        });

        if (!existingPackage) {
            return res.status(404).json({ error: 'Pacote não encontrado' });
        }

        if (existingPackage.agencyId !== req.agency!.agencyId) {
            return res.status(403).json({ error: 'Você não tem permissão para editar este pacote' });
        }

        const updatedPackage = await prisma.package.update({
            where: { id },
            data: validatedData,
            include: {
                images: true,
            },
        });

        res.json({
            message: 'Pacote atualizado com sucesso',
            package: updatedPackage,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                error: 'Dados inválidos',
                details: error.errors
            });
        }
        console.error('Update package error:', error);
        res.status(500).json({ error: 'Erro ao atualizar pacote' });
    }
});

// DELETE /api/packages/:id - Soft delete package (PROTECTED)
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        // Check if package belongs to agency
        const existingPackage = await prisma.package.findUnique({
            where: { id },
        });

        if (!existingPackage) {
            return res.status(404).json({ error: 'Pacote não encontrado' });
        }

        if (existingPackage.agencyId !== req.agency!.agencyId) {
            return res.status(403).json({ error: 'Você não tem permissão para deletar este pacote' });
        }

        await prisma.package.update({
            where: { id },
            data: { status: 'inactive' },
        });

        res.json({ message: 'Pacote removido com sucesso' });
    } catch (error) {
        console.error('Delete package error:', error);
        res.status(500).json({ error: 'Erro ao deletar pacote' });
    }
});

export default router;
