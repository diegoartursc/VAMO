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
        const msg = data?.error || 'Couldn\'t sign in';
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
    /** Aceite dos Termos de Uso, Privacidade e Reembolso (obrigatório). */
    acceptTerms: true;
}): Promise<TravelerSession> {
    console.log('[auth.register] criando conta:', params.email);

    const res = await fetch(`${API_BASE_URL}/auth/traveler/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
    });

    const data = await res.json();

    if (!res.ok) {
        const msg = data?.error || 'Couldn\'t create account';
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

export interface RefreshedTokens { accessToken: string; refreshToken: string }

// O refresh é rotativo no servidor: cada refresh só vale uma vez, e reusar um
// antigo derruba a sessão. Por isso duas telas pedindo refresh ao mesmo tempo
// precisam compartilhar a MESMA chamada (single-flight), e quem chama tem de
// salvar o refreshToken novo.
let inflightRefresh: { token: string; promise: Promise<RefreshedTokens | null> } | null = null;

export function refreshAccessToken(refreshToken: string): Promise<RefreshedTokens | null> {
    if (inflightRefresh && inflightRefresh.token === refreshToken) return inflightRefresh.promise;
    const promise = (async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/auth/traveler/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken }),
            });
            // 5xx ou sem rede: erro temporário (lança), para a sessão não ser apagada.
            if (res.status >= 500) throw new TemporaryAuthError(`server ${res.status}`);
            if (!res.ok) return null;
            const data = await res.json();
            if (!data?.accessToken || !data?.refreshToken) return null;
            return { accessToken: data.accessToken as string, refreshToken: data.refreshToken as string };
        } catch (err) {
            if (err instanceof TemporaryAuthError) throw err;
            throw new TemporaryAuthError('network');
        }
    })();
    const entry = { token: refreshToken, promise };
    inflightRefresh = entry;
    // Libera depois de terminar (falha de rede pode ser tentada de novo).
    const clear = () => { if (inflightRefresh === entry) inflightRefresh = null; };
    promise.then(clear, clear); // then(…, …) não gera rejeição solta
    return promise;
}

/** Encerra a sessão no servidor (access e refresh param de valer). Melhor esforço. */
export async function logoutRemote(accessToken: string | null | undefined): Promise<void> {
    if (!accessToken) return;
    try {
        await fetch(`${API_BASE_URL}/auth/traveler/logout`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken}` },
        });
    } catch {
        // Sem rede: o token local é apagado mesmo assim e expira sozinho.
    }
}

/** Erro de servidor/rede (não é "sessão inválida"): quem chama não deve apagar a sessão. */
export class TemporaryAuthError extends Error {}

/** null = sessão inválida (401/403). Lança TemporaryAuthError em 5xx ou sem rede. */
export async function fetchMe(accessToken: string): Promise<Pick<TravelerSession, 'traveler' | 'creator'> | null> {
    let res: Response;
    try {
        res = await fetch(`${API_BASE_URL}/auth/traveler/me`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
    } catch {
        throw new TemporaryAuthError('network');
    }
    if (res.status === 401 || res.status === 403 || res.status === 404) return null;
    if (!res.ok) throw new TemporaryAuthError(`server ${res.status}`);
    return await res.json();
}

async function postPublic(path: string, body: unknown, fallbackError: string): Promise<{ message?: string }> {
    let res: Response;
    try {
        res = await fetch(`${API_BASE_URL}${path}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
    } catch {
        throw new Error('Can\'t reach the server. Check your internet connection and try again.');
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const err = new Error(data?.error || fallbackError) as Error & { status?: number };
        err.status = res.status;
        throw err;
    }
    return data;
}

/** Resposta sempre neutra: não indica se o e-mail tem conta. */
export async function requestPasswordReset(email: string): Promise<void> {
    await postPublic(
        '/auth/traveler/forgot-password',
        { email: email.trim().toLowerCase() },
        'We couldn\'t send it right now. Please try again in a moment.',
    );
}

export async function resetPassword(token: string, password: string): Promise<void> {
    await postPublic(
        '/auth/traveler/reset-password',
        { token, password },
        'We couldn\'t reset your password. Please try again.',
    );
}

/**
 * Exclui a conta no servidor (anonimiza e apaga dados pessoais). Exige a senha.
 * Conta de criador volta `code: 'CREATOR_ACCOUNT'`: o pedido vai para o suporte.
 */
export async function deleteAccount(accessToken: string, password: string): Promise<{ ok: true } | { ok: false; error: string; code?: string }> {
    try {
        const res = await fetch(`${API_BASE_URL}/auth/traveler/delete-account`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
            body: JSON.stringify({ password }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) return { ok: true };
        return { ok: false, error: data?.error || 'We couldn\'t delete your account. Please try again.', code: data?.code };
    } catch {
        return { ok: false, error: 'No connection. Please try again.' };
    }
}
