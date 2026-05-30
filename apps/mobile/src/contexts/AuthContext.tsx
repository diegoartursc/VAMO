/**
 * VAMO Mobile — AuthContext
 * Gerencia sessão real do usuário via AsyncStorage.
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    loginWithEmail,
    registerWithEmail,
    refreshAccessToken,
    fetchMe,
    type TravelerSession,
} from '../services/auth';

// ─── Storage keys ──────────────────────────────────────────────
const STORAGE_KEYS = {
    SESSION: '@vamo_session',
} as const;

// ─── Types ─────────────────────────────────────────────────────
export interface AuthUser {
    travelerId: string;
    creatorId: string | null;
    name: string;
    email: string;
    avatar: string | null;
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
}

// ─── Context ───────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Provider ──────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // ── Hidratar sessão salva no AsyncStorage ────────────────
    useEffect(() => {
        (async () => {
            try {
                const raw = await AsyncStorage.getItem(STORAGE_KEYS.SESSION);
                if (!raw) {
                    console.log('[auth] sem sessão salva — estado deslogado');
                    return;
                }

                const session: TravelerSession = JSON.parse(raw);
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
                    await AsyncStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(updatedSession));
                    const me2 = await fetchMe(newToken);
                    if (me2) {
                        console.log('[auth] sessão renovada — usuário:', me2.traveler.email);
                        applySession(newToken, session.refreshToken, me2.traveler, me2.creator);
                        return;
                    }
                }

                // Sessão inválida — limpar
                console.warn('[auth] sessão inválida — limpando AsyncStorage');
                await AsyncStorage.removeItem(STORAGE_KEYS.SESSION);
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

        // Persistir no AsyncStorage
        await AsyncStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));

        applySession(session.accessToken, session.refreshToken, session.traveler, session.creator);
    }, []);

    // ── Registro ─────────────────────────────────────────────
    const register = useCallback(async (params: Parameters<AuthContextType['register']>[0]) => {
        const session = await registerWithEmail(params);
        await AsyncStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
        applySession(session.accessToken, session.refreshToken, session.traveler, session.creator);
    }, []);

    // ── Logout ───────────────────────────────────────────────
    const logout = useCallback(async () => {
        console.log('[auth] logout — limpando sessão');
        await AsyncStorage.removeItem(STORAGE_KEYS.SESSION);
        setUser(null);
        setAccessToken(null);
    }, []);

    return (
        <AuthContext.Provider value={{
            user,
            accessToken,
            isLoading,
            isAuthenticated: !!user,
            login,
            register,
            logout,
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
