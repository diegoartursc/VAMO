import React, { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Itinerary } from '../data/mockItineraries';
import { useAuth } from './AuthContext';
import { SearchIntent, mergeSearchIntent } from '../utils/homeSections';

export interface SearchFilters {
    destination: string;
    startDate?: Date;
    endDate?: Date;
    duration?: number; // Duração em dias (para roteiros)
    // priceMin/priceMax: filtro de faixa de preço REMOVIDO da UI. Campos
    // mantidos opcionais só por compat de quem ainda passa Partial; não
    // afetam mais a busca.
    priceMin?: number;
    priceMax?: number;
}

export interface SearchResults {
    itineraries: Itinerary[];
    totalResults: number;
}

interface SearchContextType {
    filters: SearchFilters;
    results: SearchResults;
    isSearching: boolean;
    activeTab: 'home' | 'itineraries';
    travelIntent: string | null;
    selectedCategory: string | null;
    selectedCategories: string[];
    setFilters: (filters: Partial<SearchFilters>) => void;
    clearFilters: () => void;
    applySearch: () => void;
    setActiveTab: (tab: 'home' | 'itineraries') => void;
    setTravelIntent: (intent: string | null) => void;
    setSelectedCategory: (category: string | null) => void;
    setSelectedCategories: (categories: string[]) => void;
    toggleSelectedCategory: (category: string) => void;
    // Histórico de intenção (para "Continue sua busca")
    searchIntent: SearchIntent | null;
    recordSearchIntent: (partial: Partial<SearchIntent>) => void;
    clearSearchIntent: () => void;
}

/** Prefixo das chaves de histórico de busca no AsyncStorage (por usuário). */
const SEARCH_INTENT_KEY_PREFIX = '@vamo_search_intent:';

const defaultFilters: SearchFilters = {
    destination: '',
    startDate: undefined,
    endDate: undefined,
    duration: undefined,
};

const defaultResults: SearchResults = {
    itineraries: [],
    totalResults: 0,
};

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: ReactNode }) {
    const [filters, setFiltersState] = useState<SearchFilters>(defaultFilters);
    const [results, setResults] = useState<SearchResults>(defaultResults);
    const [isSearching, setIsSearching] = useState(false);
    const [activeTab, setActiveTab] = useState<'home' | 'itineraries'>('home');
    const [travelIntent, setTravelIntent] = useState<string | null>(null);
    const [selectedCategories, setSelectedCategoriesState] = useState<string[]>([]);
    const selectedCategory = selectedCategories[0] ?? null;

    // ── Histórico de intenção, persistido por usuário ────────
    const { user } = useAuth();
    const intentKey = `${SEARCH_INTENT_KEY_PREFIX}${user?.travelerId ?? 'guest'}`;
    const [searchIntent, setSearchIntent] = useState<SearchIntent | null>(null);
    // Marca para qual chave o estado já foi hidratado — evita persistir
    // intenção de um usuário sob a chave de outro durante a troca.
    const hydratedForKey = useRef<string | null>(null);

    // Carrega (ou recarrega ao trocar de usuário) o histórico salvo.
    useEffect(() => {
        let cancelled = false;
        hydratedForKey.current = null;
        (async () => {
            try {
                const raw = await AsyncStorage.getItem(intentKey);
                if (cancelled) return;
                setSearchIntent(raw ? JSON.parse(raw) : null);
            } catch {
                if (!cancelled) setSearchIntent(null);
            } finally {
                if (!cancelled) hydratedForKey.current = intentKey;
            }
        })();
        return () => { cancelled = true; };
    }, [intentKey]);

    // Persiste sempre que a intenção muda — só depois de hidratar a chave atual.
    useEffect(() => {
        if (hydratedForKey.current !== intentKey) return;
        AsyncStorage.setItem(intentKey, JSON.stringify(searchIntent ?? null)).catch(() => {});
    }, [searchIntent, intentKey]);

    const recordSearchIntent = useCallback((partial: Partial<SearchIntent>) => {
        setSearchIntent(prev => mergeSearchIntent(prev, partial, Date.now()));
    }, []);

    const clearSearchIntent = useCallback(() => {
        setSearchIntent(null);
    }, []);

    const setFilters = (newFilters: Partial<SearchFilters>) => {
        setFiltersState(prev => ({ ...prev, ...newFilters }));
    };

    const clearFilters = () => {
        setFiltersState(defaultFilters);
        setResults(defaultResults);
        setTravelIntent(null);
        setSelectedCategoriesState([]);
    };

    const setSelectedCategory = (category: string | null) => {
        setSelectedCategoriesState(category ? [category] : []);
    };

    const setSelectedCategories = (categories: string[]) => {
        setSelectedCategoriesState(Array.from(new Set(categories.filter(Boolean))));
    };

    const toggleSelectedCategory = (category: string) => {
        setSelectedCategoriesState(prev =>
            prev.includes(category)
                ? prev.filter(item => item !== category)
                : [...prev, category]
        );
    };

    const applySearch = () => {
        setIsSearching(true);
        // A lógica de busca será implementada no hook useSearch
        // Este método serve apenas para marcar que uma busca está ativa
        setTimeout(() => setIsSearching(false), 300);
    };

    const value: SearchContextType = {
        filters,
        results,
        isSearching,
        activeTab,
        travelIntent,
        selectedCategory,
        selectedCategories,
        setFilters,
        clearFilters,
        applySearch,
        setActiveTab,
        setTravelIntent,
        setSelectedCategory,
        setSelectedCategories,
        toggleSelectedCategory,
        searchIntent,
        recordSearchIntent,
        clearSearchIntent,
    };

    return (
        <SearchContext.Provider value={value}>
            {children}
        </SearchContext.Provider>
    );
}

export function useSearchContext() {
    const context = useContext(SearchContext);
    if (!context) {
        throw new Error('useSearchContext must be used within SearchProvider');
    }
    return context;
}
