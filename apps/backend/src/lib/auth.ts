import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('FATAL: JWT_SECRET must be set in environment variables. See .env.example for setup instructions.');
}
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
const FILE_TOKEN_EXPIRES_IN = '15m';
const ADMIN_TOKEN_EXPIRES_IN = '8h';
const DOC_TOKEN_EXPIRES_IN = '30m';

/**
 * Cada finalidade de token tem chave, audience e claim `typ` próprios. Um token
 * de uma finalidade nunca valida em outra (arquivo ≠ sessão ≠ refresh ≠ admin),
 * mesmo que algum código esqueça de checar o tipo: a assinatura não bate.
 * Tokens antigos (sem `typ`, assinados direto com JWT_SECRET) deixam de valer.
 */
export type TokenType = 'access' | 'refresh' | 'file' | 'doc' | 'admin';

const ISSUER = 'vamo-api';
const ALGORITHM = 'HS256' as const;
const keyCache = new Map<TokenType, Buffer>();

function keyFor(type: TokenType): Buffer {
    let key = keyCache.get(type);
    if (!key) {
        key = crypto.createHmac('sha256', JWT_SECRET!).update(`vamo-jwt:v2:${type}`).digest();
        keyCache.set(type, key);
    }
    return key;
}

function sign(type: TokenType, claims: Record<string, unknown>, expiresIn: string): string {
    const options: SignOptions = {
        algorithm: ALGORITHM,
        issuer: ISSUER,
        audience: `vamo:${type}`,
        expiresIn: expiresIn as any,
    };
    return jwt.sign({ ...claims, typ: type }, keyFor(type), options);
}

function verify(type: TokenType, token: unknown): Record<string, any> | null {
    if (typeof token !== 'string' || token.length > 4096) return null;
    try {
        const payload = jwt.verify(token, keyFor(type), {
            algorithms: [ALGORITHM],
            issuer: ISSUER,
            audience: `vamo:${type}`,
        });
        if (typeof payload === 'string' || payload.typ !== type) return null;
        return payload as Record<string, any>;
    } catch {
        return null;
    }
}

const isId = (v: unknown): v is string => typeof v === 'string' && v.length > 0 && v.length <= 200;

export const hashPassword = async (password: string): Promise<string> => {
    return bcrypt.hash(password, 10);
};

export const comparePassword = async (
    password: string,
    hash: string
): Promise<boolean> => {
    return bcrypt.compare(password, hash);
};

/** Id aleatório para o `jti` do refresh (rotação/detecção de reuso). */
export const newTokenId = () => crypto.randomBytes(16).toString('base64url');

// ─── Sessão do viajante ───────────────────────────────────────────

export interface TravelerAccessClaims { travelerId: string; email: string; sid: string }
export interface TravelerRefreshClaims { travelerId: string; sid: string; jti: string }

export const generateAccessToken = (claims: TravelerAccessClaims) =>
    sign('access', { travelerId: claims.travelerId, email: claims.email, sid: claims.sid }, JWT_EXPIRES_IN);

export const generateRefreshToken = (claims: TravelerRefreshClaims) =>
    sign('refresh', { travelerId: claims.travelerId, sid: claims.sid, jti: claims.jti }, JWT_REFRESH_EXPIRES_IN);

export function verifyAccessToken(token: unknown): TravelerAccessClaims | null {
    const p = verify('access', token);
    if (!p || !isId(p.travelerId) || !isId(p.sid)) return null;
    return { travelerId: p.travelerId, email: typeof p.email === 'string' ? p.email : '', sid: p.sid };
}

export function verifyRefreshToken(token: unknown): TravelerRefreshClaims | null {
    const p = verify('refresh', token);
    if (!p || !isId(p.travelerId) || !isId(p.sid) || !isId(p.jti)) return null;
    return { travelerId: p.travelerId, sid: p.sid, jti: p.jti };
}

// ─── Link de arquivo privado (Central da Viagem) ─────────────────

export const generatePrivateFileToken = (payload: { fileId: string; travelerId: string }) =>
    sign('file', { fileId: payload.fileId, travelerId: payload.travelerId }, FILE_TOKEN_EXPIRES_IN);

export const verifyPrivateFileToken = (token: unknown) => {
    const p = verify('file', token);
    if (!p || !isId(p.fileId) || !isId(p.travelerId)) return null;
    return { fileId: p.fileId, travelerId: p.travelerId, purpose: 'traveler-file' as const };
};

// ─── Documento privado (comprovantes, SEC-03) ────────────────────

export const generateDocumentToken = (docId: string) => sign('doc', { docId }, DOC_TOKEN_EXPIRES_IN);

export function verifyDocumentToken(token: unknown): { docId: string } | null {
    const p = verify('doc', token);
    return p && isId(p.docId) ? { docId: p.docId } : null;
}

// ─── Admin ────────────────────────────────────────────────────────

export interface AdminClaims { adminId: string; role: string; sv: number }

export const generateAdminToken = (claims: AdminClaims) =>
    sign('admin', { adminId: claims.adminId, role: claims.role, sv: claims.sv }, ADMIN_TOKEN_EXPIRES_IN);

export function verifyAdminToken(token: unknown): AdminClaims | null {
    const p = verify('admin', token);
    if (!p || !isId(p.adminId) || typeof p.role !== 'string' || !Number.isInteger(p.sv)) return null;
    return { adminId: p.adminId, role: p.role, sv: p.sv };
}
