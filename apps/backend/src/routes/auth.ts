import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { hashPassword, comparePassword, generateAccessToken, generateRefreshToken, verifyToken } from '../lib/auth';

const router = Router();

// Validation schemas
const registerSchema = z.object({
    // Agency data
    agencyName: z.string().min(2, 'Nome da agência deve ter no mínimo 2 caracteres'),
    // CNPJ opcional (mercado australiano não usa CNPJ-BR). Quando ausente,
    // a agência é criada sem identificação fiscal.
    cnpj: z.string().min(1).optional(),
    whatsapp: z.string().optional(),
    contactUrl: z.string().url().optional(),
    // Employee (admin) data
    employeeName: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

// POST /api/auth/register - Agency + first employee registration
router.post('/register', async (req: Request, res: Response) => {
    try {
        const validatedData = registerSchema.parse(req.body);

        // Check if employee email already exists
        const existingEmployee = await prisma.agencyEmployee.findUnique({
            where: { email: validatedData.email },
        });

        if (existingEmployee) {
            return res.status(400).json({ error: 'Email já cadastrado' });
        }

        // Check if CNPJ already exists (apenas quando informado)
        if (validatedData.cnpj) {
            const existingAgency = await prisma.agency.findUnique({
                where: { cnpj: validatedData.cnpj },
            });

            if (existingAgency) {
                return res.status(400).json({ error: 'CNPJ já cadastrado' });
            }
        }

        // Hash password
        const passwordHash = await hashPassword(validatedData.password);

        // Create agency + first employee (MANAGER) in a transaction
        const result = await prisma.$transaction(async (tx) => {
            const agency = await tx.agency.create({
                data: {
                    name: validatedData.agencyName,
                    cnpj: validatedData.cnpj ?? null,
                    whatsapp: validatedData.whatsapp,
                    contactUrl: validatedData.contactUrl,
                },
            });

            const employee = await tx.agencyEmployee.create({
                data: {
                    agencyId: agency.id,
                    name: validatedData.employeeName,
                    email: validatedData.email,
                    passwordHash,
                    role: 'MANAGER',
                },
            });

            return { agency, employee };
        });

        // Generate tokens
        const accessToken = generateAccessToken({
            agencyId: result.agency.id,
            employeeId: result.employee.id,
            email: result.employee.email,
        });
        const refreshToken = generateRefreshToken({
            agencyId: result.agency.id,
            employeeId: result.employee.id,
        });

        res.status(201).json({
            message: 'Agência cadastrada com sucesso',
            agency: {
                id: result.agency.id,
                name: result.agency.name,
                verified: result.agency.verified,
            },
            employee: {
                id: result.employee.id,
                name: result.employee.name,
                email: result.employee.email,
                role: result.employee.role,
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
        console.error('Register error:', error);
        res.status(500).json({ error: 'Erro ao cadastrar agência' });
    }
});

// POST /api/auth/login - Employee login
router.post('/login', async (req: Request, res: Response) => {
    try {
        const validatedData = loginSchema.parse(req.body);

        // Find employee by email (with agency info)
        const employee = await prisma.agencyEmployee.findUnique({
            where: { email: validatedData.email },
            include: {
                agency: {
                    select: {
                        id: true,
                        name: true,
                        verified: true,
                        logo: true,
                    },
                },
            },
        });

        if (!employee) {
            return res.status(401).json({ error: 'Email ou senha incorretos' });
        }

        if (!employee.active) {
            return res.status(403).json({ error: 'Conta desativada. Entre em contato com o administrador.' });
        }

        // Verify password
        const isPasswordValid = await comparePassword(
            validatedData.password,
            employee.passwordHash
        );

        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Email ou senha incorretos' });
        }

        // Generate tokens
        const accessToken = generateAccessToken({
            agencyId: employee.agencyId,
            employeeId: employee.id,
            email: employee.email,
        });
        const refreshToken = generateRefreshToken({
            agencyId: employee.agencyId,
            employeeId: employee.id,
        });

        res.json({
            message: 'Login realizado com sucesso',
            employee: {
                id: employee.id,
                name: employee.name,
                email: employee.email,
                role: employee.role,
            },
            agency: employee.agency,
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

// GET /api/auth/me - Get current employee + agency from JWT
router.get('/me', async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.substring(7);
        const decoded = verifyToken(token) as { agencyId: string; employeeId: string; email: string } | null;

        if (!decoded) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        const employee = await prisma.agencyEmployee.findUnique({
            where: { id: decoded.employeeId },
            include: {
                agency: {
                    select: {
                        id: true,
                        name: true,
                        verified: true,
                        logo: true,
                        cnpj: true,
                    },
                },
            },
        });

        if (!employee || !employee.active) {
            return res.status(401).json({ error: 'Account not found or deactivated' });
        }

        res.json({
            employee: {
                id: employee.id,
                name: employee.name,
                email: employee.email,
                role: employee.role,
            },
            agency: employee.agency,
        });
    } catch (error) {
        console.error('Auth/me error:', error);
        res.status(401).json({ error: 'Authentication failed' });
    }
});

// POST /api/auth/refresh - Renew access token using refresh token
router.post('/refresh', async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ error: 'Refresh token é obrigatório' });
        }

        const decoded = verifyToken(refreshToken) as { agencyId: string; employeeId: string } | null;
        if (!decoded) {
            return res.status(401).json({ error: 'Refresh token inválido ou expirado' });
        }

        // Verify employee still exists and is active
        const employee = await prisma.agencyEmployee.findUnique({
            where: { id: decoded.employeeId },
            select: { id: true, agencyId: true, email: true, active: true },
        });

        if (!employee || !employee.active) {
            return res.status(401).json({ error: 'Conta não encontrada ou desativada' });
        }

        // Issue new access token
        const accessToken = generateAccessToken({
            agencyId: employee.agencyId,
            employeeId: employee.id,
            email: employee.email,
        });

        res.json({ accessToken });
    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(401).json({ error: 'Falha ao renovar token' });
    }
});

export default router;
