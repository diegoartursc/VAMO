import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { verifyAdminToken } from '../lib/auth';

export interface AdminAuthRequest extends Request {
    admin?: {
        id: string;
        name: string;
        email: string;
        role: string;
    };
}

/**
 * Único verificador de admin (usado por /api/admin, auditoria e taxas).
 * Exige token de finalidade `admin`, conta ativa e `sessionVersion` igual à do
 * token: trocar a senha ou sair incrementa a versão e derruba tokens antigos.
 */
export function adminAuthMiddleware(
    req: AdminAuthRequest,
    res: Response,
    next: NextFunction
): void {
    const auth = req.headers.authorization;
    const claims = typeof auth === 'string' && auth.startsWith('Bearer ')
        ? verifyAdminToken(auth.slice(7).trim())
        : null;
    if (!claims) {
        res.status(401).json({ error: 'Invalid token' });
        return;
    }
    prisma.admin.findUnique({ where: { id: claims.adminId } })
        .then((admin) => {
            if (!admin || !admin.active || (admin.sessionVersion ?? 0) !== claims.sv) {
                res.status(401).json({ error: 'Invalid admin' });
                return;
            }
            req.admin = admin;
            next();
        })
        .catch((err) => {
            console.error('[admin-auth] erro ao validar admin:', err?.message || err);
            res.status(500).json({ error: 'Failed to validate admin' });
        });
}
