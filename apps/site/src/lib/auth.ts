/**
 * VAMO — Site Auth Utility
 * MVP: autenticação baseada em mock para acesso sem login
 * Autenticação real será implementada na Fase 3 (Login/Registro de usuários)
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333/api';

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

// MVP: retorna true para permitir acesso aos dashboards sem login
export function isAuthenticated(): boolean {
    return true;
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

// ─── Mock Session (MVP sem login) ───
const MOCK_SESSION: AuthSession = {
    employee: {
        id: 'mock-id',
        name: 'Diego Artur',
        email: 'diego@vamo.com',
        role: 'ADMIN'
    },
    agency: {
        id: 'mock-agency-id',
        name: 'VAMO Demo Agency',
        verified: true,
        logo: null,
        cnpj: '00.000.000/0001-00'
    }
};

// ─── Auth Actions ───

export async function login(email: string, password: string): Promise<AuthSession> {
    try {
        const res = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        if (!res.ok) {
            // MVP: fallback para mock se backend indisponível ou credencial errada
            return MOCK_SESSION;
        }

        const data: LoginResponse = await res.json();
        setTokens(data.accessToken, data.refreshToken);
        return { employee: data.employee, agency: data.agency };
    } catch {
        // Backend offline — retorna sessão mock
        return MOCK_SESSION;
    }
}

export async function register(payload: {
    agencyName: string;
    cnpj: string;
    whatsapp?: string;
    employeeName: string;
    email: string;
    password: string;
}): Promise<AuthSession> {
    try {
        const res = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            return MOCK_SESSION;
        }

        const data: RegisterResponse = await res.json();
        setTokens(data.accessToken, data.refreshToken);
        return { employee: data.employee, agency: data.agency };
    } catch {
        return MOCK_SESSION;
    }
}

export async function getSession(): Promise<AuthSession | null> {
    const token = getToken();

    // MVP: sem token, retorna mock para manter dashboards acessíveis
    if (!token) return MOCK_SESSION;

    try {
        const res = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
            return MOCK_SESSION;
        }

        return await res.json();
    } catch {
        // Backend offline — retorna mock
        return MOCK_SESSION;
    }
}

export function logout() {
    clearTokens();
    if (typeof window !== 'undefined') {
        window.location.href = '/';
    }
}
