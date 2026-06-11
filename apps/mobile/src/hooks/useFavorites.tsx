import React, { useState, useEffect, useCallback, createContext, useContext, ReactNode, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import {
    getSavedItineraryIds,
    saveItinerary,
    unsaveItinerary,
} from '../services/api';

// Favoritos são por-usuário. A chave inclui o travelerId para evitar que a
// lista vaze entre contas no mesmo dispositivo (ex.: Maria faz logout, Diego
// faz login e herda os favoritos da Maria). Usuário não logado opera em
// memória — nada persiste, e nada migra para a conta quando ele logar.
const KEY_PREFIX = '@vamo_favorites';
const LEGACY_GLOBAL_KEY = '@vamo_favorites';
const keyFor = (travelerId: string | null | undefined) =>
    travelerId ? `${KEY_PREFIX}:${travelerId}` : null;

export const normalizeFavoriteIds = (value: unknown): string[] => {
    if (!Array.isArray(value)) return [];

    const seen = new Set<string>();
    const ids: string[] = [];

    value.forEach((item) => {
        if (typeof item !== 'string') return;
        const id = item.trim();
        if (!id || seen.has(id)) return;
        seen.add(id);
        ids.push(id);
    });

    return ids;
};

interface FavoritesContextType {
    favorites: string[];
    isFavorite: (id: string) => boolean;
    addFavorite: (id: string) => Promise<void>;
    removeFavorite: (id: string) => Promise<void>;
    toggleFavorite: (id: string) => Promise<boolean>;
    clearFavorites: () => Promise<void>;
    isLoading: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

interface FavoritesProviderProps {
    children: ReactNode;
}

export const FavoritesProvider: React.FC<FavoritesProviderProps> = ({ children }) => {
    const { user, accessToken } = useAuth();
    const travelerId = user?.travelerId ?? null;

    const [favorites, setFavorites] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Migration one-shot: chave global pré-namespacing podia vazar entre usuários.
    // Apagamos no primeiro mount para que ninguém herde a lista por engano.
    const legacyWiped = useRef(false);
    useEffect(() => {
        if (legacyWiped.current) return;
        legacyWiped.current = true;
        AsyncStorage.removeItem(LEGACY_GLOBAL_KEY).catch(() => {});
    }, []);

    // Carrega (ou esvazia) a lista sempre que o usuário muda. Logout -> []; login -> bucket dele.
    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setIsLoading(true);
            const key = keyFor(travelerId);
            if (!key) {
                if (!cancelled) {
                    setFavorites([]);
                    setIsLoading(false);
                }
                return;
            }
            try {
                const stored = await AsyncStorage.getItem(key);
                if (cancelled) return;
                const cached = stored
                    ? normalizeFavoriteIds(JSON.parse(stored))
                    : [];
                if (!accessToken) {
                    setFavorites(cached);
                    return;
                }

                const remote = normalizeFavoriteIds(await getSavedItineraryIds(accessToken));
                const missingRemote = cached.filter(id => !remote.includes(id));
                const migrated = await Promise.allSettled(
                    missingRemote.map(id => saveItinerary(id, accessToken)),
                );
                const acceptedMigrated = missingRemote.filter(
                    (_id, index) => migrated[index]?.status === 'fulfilled',
                );
                const normalized = normalizeFavoriteIds([...remote, ...acceptedMigrated]);
                setFavorites(normalized);
                await AsyncStorage.setItem(key, JSON.stringify(normalized));
            } catch (error) {
                console.error('Error loading favorites:', error);
                if (!cancelled) {
                    try {
                        const cached = await AsyncStorage.getItem(key);
                        setFavorites(cached ? normalizeFavoriteIds(JSON.parse(cached)) : []);
                    } catch {
                        setFavorites([]);
                    }
                }
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };
        load();
        return () => { cancelled = true; };
    }, [travelerId, accessToken]);

    const persist = useCallback(async (next: string[]) => {
        const key = keyFor(travelerId);
        if (!key) return; // anônimo: só memória
        try {
            await AsyncStorage.setItem(key, JSON.stringify(next));
        } catch (error) {
            console.error('Error saving favorites:', error);
        }
    }, [travelerId]);

    const saveFavorites = useCallback(async (newFavorites: string[]) => {
        const normalized = normalizeFavoriteIds(newFavorites);
        setFavorites(normalized);
        await persist(normalized);
    }, [persist]);

    const isFavorite = useCallback((id: string) => {
        return typeof id === 'string' && favorites.includes(id.trim());
    }, [favorites]);

    const addFavorite = useCallback(async (id: string) => {
        const normalizedId = typeof id === 'string' ? id.trim() : '';
        if (!normalizedId) return;
        if (!favorites.includes(normalizedId)) {
            const previous = favorites;
            await saveFavorites([...previous, normalizedId]);
            try {
                if (accessToken) await saveItinerary(normalizedId, accessToken);
            } catch (error) {
                await saveFavorites(previous);
                throw error;
            }
        }
    }, [accessToken, favorites, saveFavorites]);

    const removeFavorite = useCallback(async (id: string) => {
        const normalizedId = typeof id === 'string' ? id.trim() : '';
        const previous = favorites;
        await saveFavorites(previous.filter(fav => fav !== normalizedId));
        try {
            if (accessToken) await unsaveItinerary(normalizedId, accessToken);
        } catch (error) {
            await saveFavorites(previous);
            throw error;
        }
    }, [accessToken, favorites, saveFavorites]);

    const toggleFavorite = useCallback(async (id: string): Promise<boolean> => {
        const normalizedId = typeof id === 'string' ? id.trim() : '';
        if (!normalizedId) return false;

        const isCurrentlyFavorite = favorites.includes(normalizedId);

        if (isCurrentlyFavorite) {
            await removeFavorite(normalizedId);
            return false;
        } else {
            await addFavorite(normalizedId);
            return true;
        }
    }, [favorites, addFavorite, removeFavorite]);

    const clearFavorites = useCallback(async () => {
        const previous = favorites;
        await saveFavorites([]);
        try {
            if (accessToken) {
                await Promise.all(previous.map(id => unsaveItinerary(id, accessToken)));
            }
        } catch (error) {
            await saveFavorites(previous);
            throw error;
        }
    }, [accessToken, favorites, saveFavorites]);

    const value: FavoritesContextType = {
        favorites,
        isFavorite,
        addFavorite,
        removeFavorite,
        toggleFavorite,
        clearFavorites,
        isLoading,
    };

    return (
        <FavoritesContext.Provider value={value}>
            {children}
        </FavoritesContext.Provider>
    );
};

export const useFavorites = () => {
    const context = useContext(FavoritesContext);
    if (!context) {
        throw new Error('useFavorites must be used within a FavoritesProvider');
    }
    return context;
};

export default useFavorites;
