/**
 * VAMO Mobile — AuthContext
 * Gerencia sessão real do usuário via secureSession
 * (SecureStore no nativo, AsyncStorage no web).
 * Sem mock, sem usuário fantasma.
 */

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    ReactNode,
} from 'react';
import {
    loginWithEmail,
    registerWithEmail,
    refreshAccessToken,
    fetchMe,
    type TravelerSession,
} from '../services/auth';
import {
    getSession as getStoredSession,
    setSession as setStoredSession,
    removeSession as removeStoredSession,
} from '../utils/secureSession';
import { setOnUnauthorized } from '../services/api';

// ─── Types ─────────────────────────────────────────────────────
export interface AuthUser {
    travelerId: string;
    creatorId: string | null;
    name: string;
    email: string;
    avatar: string | null;
    coverUrl: string | null;
    verificationLevel: string | null;
    phone: string | null;
    cpf: string | null;
}

interface AuthContextType {
    user: AuthUser | null;
    accessToken: string | null;
    isLoading: boolean;      // aguardando hidratação inicial
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (params: {
        name: string;
        email: string;
        password: string;
        profileName?: string;
        cpf?: string;
        phone?: string;
    }) => Promise<void>;
    logout: () => Promise<void>;
    /** Atualiza o usuário localmente (ex.: após upload de avatar/cover).
     *  Não toca no backend — chame o endpoint apropriado antes e passe o
     *  retorno aqui para refletir na UI sem precisar de re-login. */
    updateUser: (patch: Partial<AuthUser>) => void;
}

// ─── Context ───────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Provider ──────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // ── Hidratar sessão salva no storage ─────────────────────
    useEffect(() => {
        (async () => {
            try {
                const session = await getStoredSession();
                if (!session) {
                    console.log('[auth] sem sessão salva — estado deslogado');
                    return;
                }

                console.log('[auth] sessão encontrada, travelerId:', session.traveler?.id);

                // Tenta usar o accessToken atual para validar com /me
                const me = await fetchMe(session.accessToken);

                if (me) {
                    console.log('[auth] sessão válida — carregando usuário:', me.traveler.email);
                    applySession(session.accessToken, session.refreshToken, me.traveler, me.creator);
                    return;
                }

                // Token expirou — tenta refresh
                console.log('[auth] accessToken expirado, tentando refresh...');
                const newToken = await refreshAccessToken(session.refreshToken);
                if (newToken) {
                    const updatedSession: TravelerSession = { ...session, accessToken: newToken };
                    await setStoredSession(updatedSession);
                    const me2 = await fetchMe(newToken);
                    if (me2) {
                        console.log('[auth] sessão renovada — usuário:', me2.traveler.email);
                        applySession(newToken, session.refreshToken, me2.traveler, me2.creator);
                        return;
                    }
                }

                // Sessão inválida — limpar
                console.warn('[auth] sessão inválida — limpando storage');
                await removeStoredSession();
            } catch (err) {
                console.error('[auth] erro ao hidratar sessão:', err);
            } finally {
                setIsLoading(false);
            }
        })();
    }, []);

    function applySession(
        token: string,
        _refreshToken: string,
        traveler: TravelerSession['traveler'],
        creator: TravelerSession['creator'],
    ) {
        setAccessToken(token);
        setUser({
            travelerId: traveler.id,
            creatorId: creator?.id ?? null,
            name: traveler.name,
            email: traveler.email,
            avatar: traveler.avatar,
            coverUrl: traveler.coverUrl ?? null,
            verificationLevel: creator?.verificationLevel ?? null,
            phone: traveler.phone ?? null,
            cpf: traveler.cpf ?? null,
        });
        console.log('[auth] usuário aplicado:', {
            travelerId: traveler.id,
            creatorId: creator?.id,
            email: traveler.email,
        });
    }

    // ── Login ────────────────────────────────────────────────
    const login = useCallback(async (email: string, password: string) => {
        const session = await loginWithEmail(email, password);

        // Persistir no storage (SecureStore no nativo, AsyncStorage no web)
        await setStoredSession(session);

        applySession(session.accessToken, session.refreshToken, session.traveler, session.creator);
    }, []);

    // ── Registro ─────────────────────────────────────────────
    const register = useCallback(async (params: Parameters<AuthContextType['register']>[0]) => {
        const session = await registerWithEmail(params);
        await setStoredSession(session);
        applySession(session.accessToken, session.refreshToken, session.traveler, session.creator);
    }, []);

    // ── Update local user (avatar/cover post-upload, etc.) ──
    const updateUser = useCallback((patch: Partial<AuthUser>) => {
        setUser((current) => (current ? { ...current, ...patch } : current));
    }, []);

    // ── Logout ───────────────────────────────────────────────
    const logout = useCallback(async () => {
        console.log('[auth] logout — limpando sessão');
        await removeStoredSession();
        setUser(null);
        setAccessToken(null);
    }, []);

    // ── 401 global (token expirado/inválido) ─────────────────
    // O client de API (services/api.ts) dispara este callback APENAS quando
    // uma requisição que ENVIOU Authorization recebeu 401 — sessão morta.
    // Desloga para o app voltar a um estado consistente.
    useEffect(() => {
        setOnUnauthorized(() => {
            console.warn('[auth] 401 em chamada autenticada — sessão expirada, deslogando');
            logout().catch((err) => console.error('[auth] erro ao deslogar após 401:', err));
        });
        return () => setOnUnauthorized(null);
    }, [logout]);

    return (
        <AuthContext.Provider value={{
            user,
            accessToken,
            isLoading,
            isAuthenticated: !!user,
            login,
            register,
            logout,
            updateUser,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

// ─── Hook ──────────────────────────────────────────────────────
export function useAuth(): AuthContextType {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
    return ctx;
}

export default useAuth;
