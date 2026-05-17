import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../lib/auth';

export interface AuthRequest extends Request {
    agency?: {
        agencyId: string;
        employeeId: string;
        email: string;
    };
    traveler?: {
        travelerId: string;
        email: string;
    };
}

export const authMiddleware = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.substring(7); // Remove 'Bearer '
        const decoded = verifyToken(token);

        if (!decoded || typeof decoded === 'string') {
            return res.status(401).json({ error: 'Invalid token' });
        }

        req.agency = decoded as { agencyId: string; employeeId: string; email: string };
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Authentication failed' });
    }
};

/**
 * Optional auth middleware — popula req.agency OU req.traveler conforme o token.
 * Nunca bloqueia: rotas decidem se exigem identidade.
 */
export const optionalAuthMiddleware = (
    req: AuthRequest,
    _res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const decoded = verifyToken(token);
            if (decoded && typeof decoded !== 'string') {
                const payload = decoded as any;
                if (payload.agencyId) {
                    req.agency = payload as { agencyId: string; employeeId: string; email: string };
                }
                if (payload.travelerId) {
                    req.traveler = { travelerId: payload.travelerId, email: payload.email };
                }
            }
        }
    } catch { /* ignore — proceed anonymously */ }
    next();
};
