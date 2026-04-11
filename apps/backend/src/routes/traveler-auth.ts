import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { hashPassword, comparePassword, generateAccessToken, generateRefreshToken, verifyToken } from '../lib/auth';

const router = Router();

// ─── VALIDATION SCHEMAS ───
const travelerRegisterSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

const travelerLoginSchema = z.object({
    email: z.string().email('Invalid email'),
    password: z.string().min(1, 'Password is required'),
});

// ─── TYPES ───
export interface TravelerAuthRequest extends Request {
    traveler?: {
        travelerId: string;
        email: string;
        name: string;
    };
}

// ─── POST /api/auth/traveler/register ───
router.post('/register', async (req: Request, res: Response) => {
    try {
        const validatedData = travelerRegisterSchema.parse(req.body);

        // Check if email already exists
        const existingTraveler = await prisma.traveler.findUnique({
            where: { email: validatedData.email },
        });

        if (existingTraveler) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Hash password
        const passwordHash = await hashPassword(validatedData.password);

        // Create traveler
        const traveler = await prisma.traveler.create({
            data: {
                name: validatedData.name,
                email: validatedData.email,
                passwordHash,
                authProvider: 'EMAIL',
            },
        });

        // Generate tokens
        const accessToken = generateAccessToken({
            travelerId: traveler.id,
            email: traveler.email,
        });
        const refreshToken = generateRefreshToken({
            travelerId: traveler.id,
            email: traveler.email,
        });

        res.json({
            message: 'Traveler registered successfully',
            traveler: {
                id: traveler.id,
                name: traveler.name,
                email: traveler.email,
            },
            accessToken,
            refreshToken,
        });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(422).json({
                error: 'Validation failed',
                details: error.flatten().fieldErrors,
            });
        }
        console.error('Traveler register error:', error);
        res.status(500).json({ error: 'Failed to register traveler' });
    }
});

// ─── POST /api/auth/traveler/login ───
router.post('/login', async (req: Request, res: Response) => {
    try {
        const validatedData = travelerLoginSchema.parse(req.body);

        // Find traveler by email
        const traveler = await prisma.traveler.findUnique({
            where: { email: validatedData.email },
        });

        if (!traveler || !traveler.passwordHash) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Verify password
        const isPasswordValid = await comparePassword(validatedData.password, traveler.passwordHash);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Generate tokens
        const accessToken = generateAccessToken({
            travelerId: traveler.id,
            email: traveler.email,
        });
        const refreshToken = generateRefreshToken({
            travelerId: traveler.id,
            email: traveler.email,
        });

        res.json({
            message: 'Login successful',
            traveler: {
                id: traveler.id,
                name: traveler.name,
                email: traveler.email,
                avatar: traveler.avatar,
            },
            accessToken,
            refreshToken,
        });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(422).json({
                error: 'Validation failed',
                details: error.flatten().fieldErrors,
            });
        }
        console.error('Traveler login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// ─── POST /api/auth/traveler/refresh ───
router.post('/refresh', async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ error: 'Refresh token is required' });
        }

        const decoded = verifyToken(refreshToken);
        if (!decoded || typeof decoded === 'string') {
            return res.status(401).json({ error: 'Invalid refresh token' });
        }

        // Check if traveler still exists
        const traveler = await prisma.traveler.findUnique({
            where: { id: (decoded as any).travelerId },
        });

        if (!traveler) {
            return res.status(401).json({ error: 'Traveler not found' });
        }

        // Generate new access token
        const newAccessToken = generateAccessToken({
            travelerId: traveler.id,
            email: traveler.email,
        });

        res.json({
            accessToken: newAccessToken,
        });
    } catch (error) {
        console.error('Traveler refresh error:', error);
        res.status(500).json({ error: 'Failed to refresh token' });
    }
});

export default router;
