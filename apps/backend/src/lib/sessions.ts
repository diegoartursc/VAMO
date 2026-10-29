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

/** Banco indisponível ao validar a sessão: responder 503, nunca "deslogado". */
export class SessionStoreUnavailableError extends Error {
    constructor() { super('Session store unavailable'); this.name = 'SessionStoreUnavailableError'; }
}

/** Janela em que o refresh ANTERIOR ainda vale (duas abas, resposta perdida na rede). */
export const REFRESH_GRACE_MS = 10_000;

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

/** Valida o Bearer de sessão (access) e a sessão no banco. Lança só se o banco falhar. */
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
        throw new SessionStoreUnavailableError();
    }
}

export type RefreshResult =
    | { ok: true; accessToken: string; refreshToken: string }
    | { ok: false; reason: 'invalid' | 'revoked' | 'reused' | 'race' };

export async function rotateRefreshToken(rawRefreshToken: unknown): Promise<RefreshResult> {
    const claims = verifyRefreshToken(rawRefreshToken);
    if (!claims) return { ok: false, reason: 'invalid' };

    const load = () => prisma.travelerSession.findUnique({
        where: { id: claims.sid },
        select: { id: true, travelerId: true, refreshJti: true, prevRefreshJti: true, rotatedAt: true, revokedAt: true, traveler: { select: { email: true } } },
    });
    const session = await load();
    if (!session || session.travelerId !== claims.travelerId) return { ok: false, reason: 'invalid' };
    if (session.revokedAt) return { ok: false, reason: 'revoked' };

    // Refresh anterior dentro da janela de tolerância: não é roubo, é a outra aba
    // ou um retry. Devolve o par ATUAL (sem bifurcar a sessão).
    const withinGrace = (s: typeof session) => !!s && s.prevRefreshJti === claims.jti && !!s.rotatedAt
        && Date.now() - new Date(s.rotatedAt).getTime() <= REFRESH_GRACE_MS;
    const currentPair = (s: NonNullable<typeof session>): RefreshResult => ({
        ok: true,
        accessToken: generateAccessToken({ travelerId: claims.travelerId, email: s.traveler?.email ?? '', sid: s.id }),
        refreshToken: generateRefreshToken({ travelerId: claims.travelerId, sid: s.id, jti: s.refreshJti }),
    });
    if (session.refreshJti !== claims.jti && withinGrace(session)) return currentPair(session);

    if (session.refreshJti !== claims.jti) {
        // Refresh já trocado sendo usado de novo: alguém tem uma cópia. Derruba tudo.
        await revokeSession(session.id, 'refresh_reuse');
        return { ok: false, reason: 'reused' };
    }

    const nextJti = newTokenId();
    // Troca condicional: em duas chamadas simultâneas com o mesmo refresh, só uma vence.
    const swapped = await prisma.travelerSession.updateMany({
        where: { id: session.id, refreshJti: claims.jti, revokedAt: null },
        data: { refreshJti: nextJti, prevRefreshJti: claims.jti, rotatedAt: new Date(), lastUsedAt: new Date() },
    });
    if (swapped.count !== 1) {
        // Outra chamada com o mesmo refresh acabou de trocar: devolve o par atual.
        const fresh = await load();
        return fresh && !fresh.revokedAt && withinGrace(fresh) ? currentPair(fresh) : { ok: false, reason: 'race' };
    }

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
