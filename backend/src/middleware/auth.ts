import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../lib/auth';

export interface AuthRequest extends Request {
    agency?: {
        agencyId: string;
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

        req.agency = decoded as { agencyId: string; email: string };
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Authentication failed' });
    }
};
