import { Request, Response, NextFunction } from 'express';
import { authenticateTravelerRequest, SessionStoreUnavailableError } from '../lib/sessions';

export interface AuthRequest extends Request {
    agency?: {
        agencyId: string;
        employeeId: string;
        email: string;
    };
    traveler?: {
        travelerId: string;
        email: string;
        sid?: string;
    };
}

/**
 * Legado (rotas de agência, não montadas em app.ts). Não existem mais tokens de
 * agência: exige a mesma sessão de viajante validada no banco.
 */
export const authMiddleware = (
    req: AuthRequest,
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

/**
 * Auth opcional: popula req.traveler só com sessão válida (mesma validação do
 * travelerAuthMiddleware). Token inválido/de outra finalidade = anônimo.
 */
export const optionalAuthMiddleware = (
    req: AuthRequest,
    _res: Response,
    next: NextFunction
) => {
    authenticateTravelerRequest(req)
        .then((traveler) => {
            if (traveler) req.traveler = traveler;
            next();
        })
        .catch(() => next());
};
