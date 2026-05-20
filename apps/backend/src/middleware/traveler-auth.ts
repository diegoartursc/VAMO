import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../lib/auth';

export interface TravelerAuthRequest extends Request {
    traveler?: {
        travelerId: string;
        email: string;
    };
}

export const travelerAuthMiddleware = (
    req: TravelerAuthRequest,
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

        // Check if this is a traveler token (has travelerId, not agencyId)
        if (!(decoded as any).travelerId) {
            return res.status(401).json({ error: 'Invalid token type - expected traveler token' });
        }

        req.traveler = {
            travelerId: (decoded as any).travelerId,
            email: (decoded as any).email,
        };

        next();
    } catch (error) {
        return res.status(401).json({ error: 'Authentication failed' });
    }
};
