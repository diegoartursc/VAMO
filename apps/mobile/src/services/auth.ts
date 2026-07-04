/**
 * VAMO Mobile — Auth Service
 * Conecta com o backend real via /api/auth/traveler/*
 */

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3333/api';

export interface TravelerSession {
    traveler: {
        id: string;
        name: string;
        email: string;
        avatar: string | null;
        coverUrl: string | null;
        phone?: string | null;
        cpf?: string | null;
    };
    creator: {
        id: string;
        verificationLevel: string;
    } | null;
    accessToken: string;
    refreshToken: string;
}

export async function loginWithEmail(email: string, password: string): Promise<TravelerSession> {
    console.log('[auth.login] tentando login:', email);

    const res = await fetch(`${API_BASE_URL}/auth/traveler/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
        const msg = data?.error || 'Erro ao fazer login';
        console.warn('[auth.login] erro:', res.status, msg);
        throw new Error(msg);
    }

    console.log('[auth.login] sucesso:', { travelerId: data.traveler?.id, creatorId: data.creator?.id });

    return {
        traveler: data.traveler,
        creator: data.creator ?? null,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
    };
}

export async function registerWithEmail(params: {
    name: string;
    email: string;
    password: string;
    profileName?: string;
    cpf?: string;
    phone?: string;
}): Promise<TravelerSession> {
    console.log('[auth.register] criando conta:', params.email);

    const res = await fetch(`${API_BASE_URL}/auth/traveler/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
    });

    const data = await res.json();

    if (!res.ok) {
        const msg = data?.error || 'Erro ao criar conta';
        console.warn('[auth.register] erro:', res.status, msg);
        throw new Error(msg);
    }

    console.log('[auth.register] sucesso:', { travelerId: data.traveler?.id, creatorId: data.creator?.id });

    return {
        traveler: data.traveler,
        creator: data.creator ?? null,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
    };
}

export async function refreshAccessToken(refreshToken: string): Promise<string | null> {
    try {
        const res = await fetch(`${API_BASE_URL}/auth/traveler/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data.accessToken ?? null;
    } catch {
        return null;
    }
}

export async function fetchMe(accessToken: string): Promise<Pick<TravelerSession, 'traveler' | 'creator'> | null> {
    try {
        const res = await fetch(`${API_BASE_URL}/auth/traveler/me`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}
