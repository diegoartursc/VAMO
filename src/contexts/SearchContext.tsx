import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Package } from '../types';

export interface SearchFilters {
    destination: string;
    startDate?: Date;
    endDate?: Date;
    duration?: number; // Duração em dias (para roteiros)
    priceMin: number;
    priceMax: number;
}

export interface SearchResults {
    packages: Package[];
    itineraries: any[]; // TODO: Add Itinerary type
    totalResults: number;
}

interface SearchContextType {
    filters: SearchFilters;
    results: SearchResults;
    isSearching: boolean;
    activeTab: 'home' | 'packages' | 'itineraries';
    setFilters: (filters: Partial<SearchFilters>) => void;
    clearFilters: () => void;
    applySearch: () => void;
    setActiveTab: (tab: 'home' | 'packages' | 'itineraries') => void;
}

const defaultFilters: SearchFilters = {
    destination: '',
    startDate: undefined,
    endDate: undefined,
    duration: undefined,
    priceMin: 0,
    priceMax: 50000,
};

const defaultResults: SearchResults = {
    packages: [],
    itineraries: [],
    totalResults: 0,
};

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: ReactNode }) {
    const [filters, setFiltersState] = useState<SearchFilters>(defaultFilters);
    const [results, setResults] = useState<SearchResults>(defaultResults);
    const [isSearching, setIsSearching] = useState(false);
    const [activeTab, setActiveTab] = useState<'home' | 'packages' | 'itineraries'>('home');

    const setFilters = (newFilters: Partial<SearchFilters>) => {
        setFiltersState(prev => ({ ...prev, ...newFilters }));
    };

    const clearFilters = () => {
        setFiltersState(defaultFilters);
        setResults(defaultResults);
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
        setFilters,
        clearFilters,
        applySearch,
        setActiveTab,
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
