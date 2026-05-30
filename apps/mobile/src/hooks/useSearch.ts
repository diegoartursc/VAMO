import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchContext, SearchFilters } from '../contexts/SearchContext';
import { getItineraries } from '../services/api';
import { applyAllItineraryFilters, itineraryMatchesCategory } from '../utils/searchUtils';

/**
 * Hook personalizado para gerenciar busca e filtros.
 * Busca dados reais da API (PostgreSQL). Sem fallback de mocks.
 */
export function useSearch() {
    const context = useSearchContext();
    const [allItineraries, setAllItineraries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        async function loadData() {
            try {
                setError(null);
                const itins = await getItineraries();
                if (!cancelled) {
                    setAllItineraries(itins || []);
                }
            } catch (err: any) {
                if (!cancelled) {
                    setError(err?.message || 'Não foi possível carregar os roteiros.');
                    setAllItineraries([]);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        loadData();
        return () => { cancelled = true; };
    }, []);

    /**
     * Filtra roteiros com base nos filtros atuais, categoria e intent de viagem
     */
    const filteredItineraries = useMemo(() => {
        let itineraries = applyAllItineraryFilters(allItineraries, {
            ...context.filters,
            selectedCategories: context.selectedCategories,
        });

        // Filtro por intenção de viagem (estilo)
        if (context.travelIntent) {
            if (context.travelIntent === 'luxo') {
                itineraries = itineraries.filter(it =>
                    itineraryMatchesCategory(it, ['luxo', 'luxury'])
                );
            } else if (context.travelIntent === 'economico' || context.travelIntent === 'custo-beneficio') {
                itineraries = itineraries.filter(it =>
                    itineraryMatchesCategory(it, ['economico', 'mochilao'])
                );
            } else if (context.travelIntent === 'moderado') {
                itineraries = itineraries.filter(it =>
                    !itineraryMatchesCategory(it, ['luxo', 'luxury'])
                );
            } else if (context.travelIntent === 'mochilao') {
                itineraries = itineraries.filter(it =>
                    itineraryMatchesCategory(it, ['mochilao', 'economico'])
                );
            } else if (context.travelIntent === 'romantico') {
                itineraries = itineraries.filter(it =>
                    itineraryMatchesCategory(it, ['romantico'])
                );
            } else if (context.travelIntent === 'aventura') {
                itineraries = itineraries.filter(it =>
                    itineraryMatchesCategory(it, ['aventura'])
                );
            }
        }

        return itineraries;
    }, [allItineraries, context.filters, context.travelIntent, context.selectedCategories]);

    const getItinerariesOnly = useCallback(() => {
        return filteredItineraries;
    }, [filteredItineraries]);

    const getAllResults = useCallback(() => {
        return {
            itineraries: filteredItineraries,
        };
    }, [filteredItineraries]);

    const applyFilters = useCallback((filters: SearchFilters) => {
        context.setFilters(filters);
        context.applySearch();
    }, [context]);

    const clearFilters = useCallback(() => {
        context.clearFilters();
    }, [context]);

    const hasActiveFilters = useMemo(() => {
        const { destination, startDate, endDate, priceMin, priceMax, duration } = context.filters;
        return !!(
            destination ||
            startDate ||
            endDate ||
            priceMin > 0 ||
            priceMax < 50000 ||
            duration !== undefined ||
            context.travelIntent ||
            context.selectedCategories.length > 0
        );
    }, [context.filters, context.travelIntent, context.selectedCategories]);

    const activeFilterCount = useMemo(() => {
        let count = 0;
        const { destination, priceMin, priceMax, duration } = context.filters;
        if (destination) count++;
        if (duration !== undefined) count++;
        if (context.travelIntent) count++;
        if (context.selectedCategories.length > 0) count++;
        if (priceMin > 0 || priceMax < 50000) count++;
        return count;
    }, [context.filters, context.travelIntent, context.selectedCategories]);

    const totalResultsCount = useMemo(() => {
        return filteredItineraries.length;
    }, [filteredItineraries]);

    return {
        // Filtros
        filters: context.filters,
        setFilters: context.setFilters,
        clearFilters,
        applyFilters,
        hasActiveFilters,
        activeFilterCount,

        // Travel Intent
        travelIntent: context.travelIntent,
        setTravelIntent: context.setTravelIntent,

        // Category
        selectedCategory: context.selectedCategory,
        selectedCategories: context.selectedCategories,
        setSelectedCategory: context.setSelectedCategory,
        setSelectedCategories: context.setSelectedCategories,
        toggleSelectedCategory: context.toggleSelectedCategory,

        // Resultados
        filteredItineraries,
        totalResultsCount,
        getItinerariesOnly,
        getAllResults,

        // Estado
        isSearching: context.isSearching,
        loading,
        error,
        activeTab: context.activeTab,
        setActiveTab: context.setActiveTab,

        // Raw data for screens that need it
        allItineraries,

        // Histórico de intenção (para "Continue sua busca")
        searchIntent: context.searchIntent,
        recordSearchIntent: context.recordSearchIntent,
        clearSearchIntent: context.clearSearchIntent,
    };
}
