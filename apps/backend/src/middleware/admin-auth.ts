import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

export interface AdminAuthRequest extends Request {
    admin?: {
        id: string;
        name: string;
        email: string;
        role: string;
    };
}

const JWT_SECRET = process.env.JWT_SECRET;

export async function adminAuthMiddleware(
    req: AdminAuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Token obrigatório' });
        return;
    }
    try {
        const token = auth.split(' ')[1];
        if (!JWT_SECRET) {
            res.status(500).json({ error: 'Server configuration error' });
            return;
        }
        const payload = jwt.verify(token, JWT_SECRET) as { adminId: string };
        const admin = await prisma.admin.findUnique({ where: { id: payload.adminId } });
        if (!admin || !admin.active) {
            res.status(401).json({ error: 'Admin inválido' });
            return;
        }
        req.admin = admin;
        next();
    } catch {
        res.status(401).json({ error: 'Token inválido' });
    }
}
