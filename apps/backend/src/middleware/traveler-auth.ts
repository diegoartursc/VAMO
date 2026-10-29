import { Request, Response, NextFunction } from 'express';
import { authenticateTravelerRequest, SessionStoreUnavailableError } from '../lib/sessions';

export interface TravelerAuthRequest extends Request {
    traveler?: {
        travelerId: string;
        email: string;
        sid?: string;
    };
}

/**
 * Exige access token de sessão válido (tipo `access`, sessão ativa no banco).
 * Token de arquivo, refresh, admin ou legado sem tipo → 401.
 */
export const travelerAuthMiddleware = (
    req: TravelerAuthRequest,
    res: Response,
    next: NextFunction
) => {
    authenticateTravelerRequest(req)
        .then((traveler) => {
            if (!traveler) {
                res.status(401).json({ error: 'Invalid or expired session' });
                return;
            }
            req.traveler = traveler;
            next();
        })
        .catch((err) => (err instanceof SessionStoreUnavailableError
            ? res.status(503).json({ error: 'Service temporarily unavailable. Please try again.' })
            : res.status(401).json({ error: 'Authentication failed' })));
};
