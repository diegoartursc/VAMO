/**
 * VAMO — Site Auth Utility
 * Autenticação real baseada em traveler/creator (Portal do Criador)
 * + fallback para agência/employee (legacy, retrocompatibilidade)
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333/api';

const TOKEN_KEY = 'vamo_access_token';
const REFRESH_KEY = 'vamo_refresh_token';
const TRAVELER_SESSION_KEY = 'vamo_traveler_session';
const AGENCY_SESSION_KEY = 'vamo_agency_session';

// ─── Token Management ───

export function getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(REFRESH_KEY);
}

function setTokens(accessToken: string, refreshToken: string) {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, refreshToken);
}

function clearAllSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(TRAVELER_SESSION_KEY);
    localStorage.removeItem(AGENCY_SESSION_KEY);
}

export function getAuthHeaders(): Record<string, string> {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Retorna true apenas se houver token + sessão real persistida.
 * NUNCA retorna true sem usuário real autenticado.
 */
export function isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    const token = getToken();
    if (!token) return false;
    const traveler = getTravelerSession();
    const agency = getAgencySessionRaw();
    return !!(traveler || agency);
}

// ─── Traveler Session (Creators) ───

export interface TravelerSession {
    travelerId: string;
    creatorId: string | null;
    name: string;
    email: string;
    avatar: string | null;
    role: 'CREATOR' | 'TRAVELER';
}

export function getTravelerSession(): TravelerSession | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(TRAVELER_SESSION_KEY);
    try { return raw ? JSON.parse(raw) : null; } catch { return null; }
}

function setTravelerSession(session: TravelerSession) {
    localStorage.setItem(TRAVELER_SESSION_KEY, JSON.stringify(session));
}

// ─── Agency Session (Legacy) ───

export interface AuthEmployee {
    id: string;
    name: string;
    email: string;
    role: string;
}

export interface AuthAgency {
    id: string;
    name: string;
    verified: boolean;
    logo: string | null;
    cpf?: string;
    cnpj?: string;
}

export interface AuthSession {
    employee: AuthEmployee;
    agency: AuthAgency;
}

function getAgencySessionRaw(): AuthSession | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(AGENCY_SESSION_KEY);
    try { return raw ? JSON.parse(raw) : null; } catch { return null; }
}

function setAgencySession(session: AuthSession) {
    localStorage.setItem(AGENCY_SESSION_KEY, JSON.stringify(session));
}

export interface LoginResponse {
    message: string;
    employee: AuthEmployee;
    agency: AuthAgency;
    accessToken: string;
    refreshToken: string;
}

export interface RegisterResponse extends LoginResponse {}

// ─── Resolve creatorId a partir do travelerId ───
async function resolveCreatorId(travelerId: string): Promise<string | null> {
    try {
        const res = await fetch(`${API_BASE_URL}/creators/by-traveler/${travelerId}`);
        if (!res.ok) return null;
        const data = await res.json();
        return data.id ?? null;
    } catch {
        return null;
    }
}

// ─── Auth Actions ───

/**
 * Login do Portal do Criador.
 * Tenta primeiro como traveler/creator (rota correta).
 * Fallback para agency/employee (legacy).
 * Lança erro se credenciais inválidas (NÃO faz silent fallback para mock).
 */
// Lock para evitar double-call (React StrictMode chama 2x em dev)
let loginInFlight: Promise<TravelerSession | AuthSession> | null = null;

export async function login(email: string, password: string): Promise<TravelerSession | AuthSession> {
    if (loginInFlight) return loginInFlight;
    loginInFlight = doLogin(email, password).finally(() => { loginInFlight = null; });
    return loginInFlight;
}

async function doLogin(email: string, password: string): Promise<TravelerSession | AuthSession> {
    // 1. Tenta como traveler/creator
    let travelerResp: Response | null = null;
    try {
        travelerResp = await fetch(`${API_BASE_URL}/auth/traveler/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
    } catch (err) {
        console.error('[auth.login] traveler request failed:', err);
        throw new Error('Não foi possível contatar o servidor. Verifique se o backend está rodando.');
    }

    if (travelerResp.ok) {
        const data = await travelerResp.json();
        setTokens(data.accessToken, data.refreshToken);
        const creatorId = await resolveCreatorId(data.traveler.id);

        const session: TravelerSession = {
            travelerId: data.traveler.id,
            creatorId,
            name: data.traveler.name,
            email: data.traveler.email,
            avatar: data.traveler.avatar ?? null,
            role: creatorId ? 'CREATOR' : 'TRAVELER',
        };
        setTravelerSession(session);
        // Limpa eventual agency session pra evitar contaminação
        localStorage.removeItem(AGENCY_SESSION_KEY);
        console.log('[auth.login] traveler logged in:', { id: data.traveler.id, creatorId, name: data.traveler.name });
        return session;
    }

    // 2. Fallback: tenta como agency/employee
    let agencyResp: Response | null = null;
    try {
        agencyResp = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
    } catch (err) {
        console.error('[auth.login] agency request failed:', err);
        throw new Error('Não foi possível contatar o servidor. Verifique se o backend está rodando.');
    }

    if (agencyResp.ok) {
        const data: LoginResponse = await agencyResp.json();
        setTokens(data.accessToken, data.refreshToken);
        const session: AuthSession = { employee: data.employee, agency: data.agency };
        setAgencySession(session);
        localStorage.removeItem(TRAVELER_SESSION_KEY);
        console.log('[auth.login] agency logged in:', { id: data.employee.id, name: data.employee.name });
        return session;
    }

    // 3. Credenciais inválidas — lança erro de verdade (sem mock!)
    const errBody = await travelerResp.json().catch(() => ({ error: 'Email ou senha incorretos' }));
    throw new Error(errBody.error || 'Email ou senha incorretos');
}

/**
 * Registro de criador.
 * Cria traveler + creator no backend e persiste sessão real.
 * Lança erro se algo der errado (sem fallback para mock).
 */
export async function register(payload: {
    agencyName: string;
    cpf?: string;
    phone?: string;
    employeeName: string;
    email: string;
    password: string;
}): Promise<TravelerSession> {
    clearAllSession();

    let resp: Response;
    try {
        resp = await fetch(`${API_BASE_URL}/auth/traveler/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: payload.employeeName,
                email: payload.email,
                password: payload.password,
                profileName: payload.agencyName,
                cpf: payload.cpf,
                phone: payload.phone,
            }),
        });
    } catch (err) {
        console.error('[auth.register] request failed:', err);
        throw new Error('Não foi possível contatar o servidor. Verifique se o backend está rodando.');
    }

    if (!resp.ok) {
        const errBody = await resp.json().catch(() => ({ error: 'Erro ao cadastrar' }));
        throw new Error(errBody.error || 'Erro ao cadastrar');
    }

    const data = await resp.json();
    setTokens(data.accessToken, data.refreshToken);

    // O backend deve criar automaticamente o creator junto com o traveler
    const creatorId = await resolveCreatorId(data.traveler.id);

    const session: TravelerSession = {
        travelerId: data.traveler.id,
        creatorId,
        name: data.traveler.name,
        email: data.traveler.email,
        avatar: data.traveler.avatar ?? null,
        role: creatorId ? 'CREATOR' : 'TRAVELER',
    };
    setTravelerSession(session);
    console.log('[auth.register] new creator registered:', session);
    return session;
}

/**
 * Retorna a sessão ativa.
 * NÃO retorna mock. Retorna null se não houver usuário autenticado.
 */
export async function getSession(): Promise<TravelerSession | AuthSession | null> {
    if (typeof window === 'undefined') return null;

    // 1. Primeira fonte de verdade: sessão local (rápida)
    const traveler = getTravelerSession();
    if (traveler) return traveler;

    const agency = getAgencySessionRaw();
    if (agency) return agency;

    // 2. Sem token → não autenticado (sem mock!)
    const token = getToken();
    if (!token) return null;

    // 3. Token presente mas sem sessão local: tenta validar contra backend
    try {
        const res = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
            clearAllSession();
            return null;
        }
        const data = await res.json();
        // se /auth/me retornar agency, persiste como agency session
        if (data.employee && data.agency) {
            const s: AuthSession = { employee: data.employee, agency: data.agency };
            setAgencySession(s);
            return s;
        }
        return null;
    } catch {
        return null;
    }
}

/**
 * Helper: retorna o creatorId atual ou null.
 * Usado pelos dashboards para filtrar dados do usuário logado.
 */
export function getCurrentCreatorId(): string | null {
    const t = getTravelerSession();
    return t?.creatorId ?? null;
}

// ─── Unified User (Airbnb-style, multi-role) ───
export type UserRole = 'TRAVELER' | 'CREATOR' | 'ADMIN';

export interface CurrentUser {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    roles: UserRole[];
    creatorId: string | null;
}

/**
 * Retorna o usuário logado unificado, com lista de roles.
 * Um mesmo usuário pode ser TRAVELER + CREATOR (e futuramente + ADMIN).
 * Null se não houver sessão.
 */
export function getCurrentUser(): CurrentUser | null {
    if (typeof window === 'undefined') return null;
    const t = getTravelerSession();
    if (t) {
        const roles: UserRole[] = ['TRAVELER'];
        if (t.creatorId) roles.push('CREATOR');
        return {
            id: t.travelerId,
            name: t.name,
            email: t.email,
            avatar: t.avatar,
            roles,
            creatorId: t.creatorId,
        };
    }
    const a = getAgencySessionRaw();
    if (a) {
        return {
            id: a.employee.id,
            name: a.employee.name,
            email: a.employee.email,
            avatar: null,
            roles: ['CREATOR'],
            creatorId: null,
        };
    }
    return null;
}

/**
 * Helper: retorna o nome do usuário atualmente logado, ou null se não houver sessão.
 * NUNCA retorna "Diego Artur" fixo.
 */
export function getCurrentUserName(): string | null {
    const t = getTravelerSession();
    if (t) return t.name;
    const a = getAgencySessionRaw();
    if (a) return a.employee.name;
    return null;
}

export function logout() {
    clearAllSession();
    if (typeof window !== 'undefined') {
        window.location.replace('/login');
    }
}
