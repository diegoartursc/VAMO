import React, { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_KEY = '@vamo_favorites';

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
    const [favorites, setFavorites] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load favorites from storage on mount
    useEffect(() => {
        loadFavorites();
    }, []);

    const loadFavorites = async () => {
        try {
            const stored = await AsyncStorage.getItem(FAVORITES_KEY);
            if (stored) {
                const normalized = normalizeFavoriteIds(JSON.parse(stored));
                setFavorites(normalized);
                if (stored !== JSON.stringify(normalized)) {
                    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(normalized));
                }
            }
        } catch (error) {
            console.error('Error loading favorites:', error);
            await AsyncStorage.removeItem(FAVORITES_KEY);
            setFavorites([]);
        } finally {
            setIsLoading(false);
        }
    };

    const saveFavorites = async (newFavorites: string[]) => {
        const normalized = normalizeFavoriteIds(newFavorites);
        try {
            setFavorites(normalized);
            await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(normalized));
        } catch (error) {
            console.error('Error saving favorites:', error);
        }
    };

    const isFavorite = useCallback((id: string) => {
        return typeof id === 'string' && favorites.includes(id.trim());
    }, [favorites]);

    const addFavorite = useCallback(async (id: string) => {
        const normalizedId = typeof id === 'string' ? id.trim() : '';
        if (!normalizedId) return;
        if (!favorites.includes(normalizedId)) {
            const updated = [...favorites, normalizedId];
            await saveFavorites(updated);
        }
    }, [favorites]);

    const removeFavorite = useCallback(async (id: string) => {
        const normalizedId = typeof id === 'string' ? id.trim() : '';
        const updated = favorites.filter(fav => fav !== normalizedId);
        await saveFavorites(updated);
    }, [favorites]);

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
        await saveFavorites([]);
    }, []);

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
