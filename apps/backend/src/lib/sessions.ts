/**
 * Sessões revogáveis do viajante (SEC-01/SEC-07).
 *
 * - Login/cadastro criam uma `TravelerSession`; access e refresh carregam o `sid`.
 * - Toda autenticação confere no banco se a sessão existe, é do mesmo viajante e
 *   não foi revogada. Logout, troca de senha e scripts de reset revogam no servidor.
 * - Refresh é rotativo: só o `refreshJti` atual vale. Reutilizar um refresh antigo
 *   revoga a sessão inteira (sinal de token vazado).
 */
import type { Request } from 'express';
import prisma from './prisma';
import {
    generateAccessToken, generateRefreshToken, newTokenId,
    verifyAccessToken, verifyRefreshToken,
} from './auth';

export interface AuthenticatedTraveler { travelerId: string; email: string; sid: string }

export async function startSession(traveler: { id: string; email: string }) {
    const jti = newTokenId();
    const session = await prisma.travelerSession.create({
        data: { travelerId: traveler.id, refreshJti: jti },
        select: { id: true },
    });
    return {
        accessToken: generateAccessToken({ travelerId: traveler.id, email: traveler.email, sid: session.id }),
        refreshToken: generateRefreshToken({ travelerId: traveler.id, sid: session.id, jti }),
    };
}

/** Valida o Bearer de sessão (access) e a sessão no banco. Nunca lança. */
export async function authenticateTravelerRequest(req: Request): Promise<AuthenticatedTraveler | null> {
    const header = req.headers.authorization;
    if (typeof header !== 'string' || !header.startsWith('Bearer ')) return null;
    const claims = verifyAccessToken(header.slice(7).trim());
    if (!claims) return null;
    try {
        const session = await prisma.travelerSession.findUnique({
            where: { id: claims.sid },
            select: { travelerId: true, revokedAt: true },
        });
        if (!session || session.revokedAt || session.travelerId !== claims.travelerId) return null;
        return claims;
    } catch (err: any) {
        console.error('[sessions] falha ao validar sessão:', err?.message || err);
        return null;
    }
}

export type RefreshResult =
    | { ok: true; accessToken: string; refreshToken: string }
    | { ok: false; reason: 'invalid' | 'revoked' | 'reused' | 'race' };

export async function rotateRefreshToken(rawRefreshToken: unknown): Promise<RefreshResult> {
    const claims = verifyRefreshToken(rawRefreshToken);
    if (!claims) return { ok: false, reason: 'invalid' };

    const session = await prisma.travelerSession.findUnique({
        where: { id: claims.sid },
        select: { id: true, travelerId: true, refreshJti: true, revokedAt: true, traveler: { select: { email: true } } },
    });
    if (!session || session.travelerId !== claims.travelerId) return { ok: false, reason: 'invalid' };
    if (session.revokedAt) return { ok: false, reason: 'revoked' };

    if (session.refreshJti !== claims.jti) {
        // Refresh já trocado sendo usado de novo: alguém tem uma cópia. Derruba tudo.
        await revokeSession(session.id, 'refresh_reuse');
        return { ok: false, reason: 'reused' };
    }

    const nextJti = newTokenId();
    // Troca condicional: em duas chamadas simultâneas com o mesmo refresh, só uma vence.
    const swapped = await prisma.travelerSession.updateMany({
        where: { id: session.id, refreshJti: claims.jti, revokedAt: null },
        data: { refreshJti: nextJti, lastUsedAt: new Date() },
    });
    if (swapped.count !== 1) return { ok: false, reason: 'race' };

    const email = session.traveler?.email ?? '';
    return {
        ok: true,
        accessToken: generateAccessToken({ travelerId: claims.travelerId, email, sid: session.id }),
        refreshToken: generateRefreshToken({ travelerId: claims.travelerId, sid: session.id, jti: nextJti }),
    };
}

export async function revokeSession(sid: string, reason: string) {
    await prisma.travelerSession.updateMany({
        where: { id: sid, revokedAt: null },
        data: { revokedAt: new Date(), revokedReason: reason },
    });
}

/** Encerra todas as sessões abertas do viajante (troca de senha, reset administrativo). */
export async function revokeAllSessions(travelerId: string, reason: string, client: any = prisma) {
    return client.travelerSession.updateMany({
        where: { travelerId, revokedAt: null },
        data: { revokedAt: new Date(), revokedReason: reason },
    });
}
