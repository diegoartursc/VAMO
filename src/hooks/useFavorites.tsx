import React, { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_KEY = '@vamo_favorites';

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
                setFavorites(JSON.parse(stored));
            }
        } catch (error) {
            console.error('Error loading favorites:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const saveFavorites = async (newFavorites: string[]) => {
        try {
            await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
            setFavorites(newFavorites);
        } catch (error) {
            console.error('Error saving favorites:', error);
        }
    };

    const isFavorite = useCallback((id: string) => {
        return favorites.includes(id);
    }, [favorites]);

    const addFavorite = useCallback(async (id: string) => {
        if (!favorites.includes(id)) {
            const updated = [...favorites, id];
            await saveFavorites(updated);
        }
    }, [favorites]);

    const removeFavorite = useCallback(async (id: string) => {
        const updated = favorites.filter(fav => fav !== id);
        await saveFavorites(updated);
    }, [favorites]);

    const toggleFavorite = useCallback(async (id: string): Promise<boolean> => {
        const isCurrentlyFavorite = favorites.includes(id);

        if (isCurrentlyFavorite) {
            await removeFavorite(id);
            return false;
        } else {
            await addFavorite(id);
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
        <FavoritesContext.Provider value= { value } >
        { children }
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
