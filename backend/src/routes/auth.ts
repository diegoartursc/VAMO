import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { hashPassword, comparePassword, generateAccessToken, generateRefreshToken } from '../lib/auth';

const router = Router();

// Validation schemas
const registerSchema = z.object({
    name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
    whatsapp: z.string().optional(),
    contactUrl: z.string().url().optional(),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

// POST /api/auth/register - Agency registration
router.post('/register', async (req: Request, res: Response) => {
    try {
        const validatedData = registerSchema.parse(req.body);

        // Check if agency already exists
        const existingAgency = await prisma.agency.findUnique({
            where: { email: validatedData.email },
        });

        if (existingAgency) {
            return res.status(400).json({ error: 'Email já cadastrado' });
        }

        // Hash password
        const passwordHash = await hashPassword(validatedData.password);

        // Create agency
        const agency = await prisma.agency.create({
            data: {
                name: validatedData.name,
                email: validatedData.email,
                passwordHash,
                whatsapp: validatedData.whatsapp,
                contactUrl: validatedData.contactUrl,
            },
            select: {
                id: true,
                name: true,
                email: true,
                verified: true,
                createdAt: true,
            },
        });

        // Generate tokens
        const accessToken = generateAccessToken({
            agencyId: agency.id,
            email: agency.email
        });
        const refreshToken = generateRefreshToken({ agencyId: agency.id });

        res.status(201).json({
            message: 'Agência cadastrada com sucesso',
            agency,
            accessToken,
            refreshToken,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                error: 'Dados inválidos',
                details: error.errors
            });
        }
        console.error('Register error:', error);
        res.status(500).json({ error: 'Erro ao cadastrar agência' });
    }
});

// POST /api/auth/login - Agency login
router.post('/login', async (req: Request, res: Response) => {
    try {
        const validatedData = loginSchema.parse(req.body);

        // Find agency
        const agency = await prisma.agency.findUnique({
            where: { email: validatedData.email },
        });

        if (!agency) {
            return res.status(401).json({ error: 'Email ou senha incorretos' });
        }

        // Verify password
        const isPasswordValid = await comparePassword(
            validatedData.password,
            agency.passwordHash
        );

        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Email ou senha incorretos' });
        }

        // Generate tokens
        const accessToken = generateAccessToken({
            agencyId: agency.id,
            email: agency.email
        });
        const refreshToken = generateRefreshToken({ agencyId: agency.id });

        res.json({
            message: 'Login realizado com sucesso',
            agency: {
                id: agency.id,
                name: agency.name,
                email: agency.email,
                verified: agency.verified,
                logo: agency.logo,
            },
            accessToken,
            refreshToken,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                error: 'Dados inválidos',
                details: error.errors
            });
        }
        console.error('Login error:', error);
        res.status(500).json({ error: 'Erro ao fazer login' });
    }
});

export default router;
