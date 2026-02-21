/**
 * VAMO — Site Auth Utility
 * Handles JWT token storage, login/logout, and session management
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

const TOKEN_KEY = 'vamo_access_token';
const REFRESH_KEY = 'vamo_refresh_token';

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

function clearTokens() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
}

export function isAuthenticated(): boolean {
    return !!getToken();
}

export function getAuthHeaders(): Record<string, string> {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
}

// ─── Auth Types ───

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
    cnpj: string;
}

export interface AuthSession {
    employee: AuthEmployee;
    agency: AuthAgency;
}

export interface LoginResponse {
    message: string;
    employee: AuthEmployee;
    agency: AuthAgency;
    accessToken: string;
    refreshToken: string;
}

export interface RegisterResponse extends LoginResponse { }

// ─── Auth Actions ───

export async function login(email: string, password: string): Promise<AuthSession> {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Erro de conexão' }));
        throw new Error(err.error || `Erro ${res.status}`);
    }

    const data: LoginResponse = await res.json();
    setTokens(data.accessToken, data.refreshToken);

    return { employee: data.employee, agency: data.agency };
}

export async function register(payload: {
    agencyName: string;
    cnpj: string;
    whatsapp?: string;
    employeeName: string;
    email: string;
    password: string;
}): Promise<AuthSession> {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Erro de conexão' }));
        throw new Error(err.error || `Erro ${res.status}`);
    }

    const data: RegisterResponse = await res.json();
    setTokens(data.accessToken, data.refreshToken);

    return { employee: data.employee, agency: data.agency };
}

export async function getSession(): Promise<AuthSession | null> {
    const token = getToken();
    if (!token) return null;

    try {
        const res = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
            clearTokens();
            return null;
        }

        return await res.json();
    } catch {
        return null;
    }
}

export function logout() {
    clearTokens();
    window.location.href = '/login';
}
