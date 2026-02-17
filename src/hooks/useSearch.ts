import { useMemo, useCallback } from 'react';
import { useSearchContext, SearchFilters } from '../contexts/SearchContext';
import { mockPackages } from '../data/mockPackages';
import { mockItineraries } from '../data/mockItineraries';
import { applyAllFilters, applyAllItineraryFilters } from '../utils/searchUtils';
import { Package } from '../types';

/**
 * Hook personalizado para gerenciar busca e filtros
 * // TODO: Future personalization — accept user preferences to pre-fill filters
 */
export function useSearch() {
    const context = useSearchContext();

    /**
     * Filtra os pacotes com base nos filtros atuais e intent de viagem
     */
    const filteredPackages = useMemo(() => {
        let packages = applyAllFilters(mockPackages, context.filters);

        // Apply category filter
        if (context.selectedCategory) {
            packages = packages.filter(p =>
                p.categories?.includes(context.selectedCategory!)
            );
        }

        // Apply travel intent filter
        if (context.travelIntent) {
            if (context.travelIntent === 'luxo') {
                packages = packages.filter(p =>
                    p.categories?.includes('luxury') || p.badge === 'luxury'
                );
            } else if (context.travelIntent === 'economico' || context.travelIntent === 'custo-beneficio') {
                packages = packages.filter(p =>
                    p.priceComparison === 'below' || p.badge === 'value'
                );
            }
            // Other intents can be mapped to categories as needed
        }

        return packages;
    }, [context.filters, context.travelIntent, context.selectedCategory]);

    /**
     * Filtra roteiros com base nos filtros atuais
     */
    const filteredItineraries = useMemo(() => {
        let itineraries = applyAllItineraryFilters(mockItineraries, context.filters);

        // Apply category filter (match against inclusions or destination-based heuristics)
        // Currently roteiros don't have a categories field, so skip for now

        return itineraries;
    }, [context.filters]);

    /**
     * Retorna apenas pacotes (para aba Pacotes)
     */
    const getPackagesOnly = useCallback((): Package[] => {
        return filteredPackages;
    }, [filteredPackages]);

    /**
     * Retorna apenas roteiros (para aba Roteiros)
     */
    const getItinerariesOnly = useCallback(() => {
        return filteredItineraries;
    }, [filteredItineraries]);

    /**
     * Retorna pacotes + roteiros (para aba Home)
     */
    const getAllResults = useCallback(() => {
        return {
            packages: filteredPackages,
            itineraries: filteredItineraries,
        };
    }, [filteredPackages, filteredItineraries]);

    /**
     * Aplica filtros e executa a busca
     */
    const applyFilters = useCallback((filters: SearchFilters) => {
        context.setFilters(filters);
        context.applySearch();
    }, [context]);

    /**
     * Limpa todos os filtros
     */
    const clearFilters = useCallback(() => {
        context.clearFilters();
    }, [context]);

    /**
     * Verifica se há filtros ativos
     */
    const hasActiveFilters = useMemo(() => {
        const { destination, startDate, endDate, priceMin, priceMax, duration } = context.filters;
        return !!(
            destination ||
            startDate ||
            endDate ||
            priceMin > 0 ||
            priceMax < 50000 ||
            (duration && duration !== 7) ||
            context.travelIntent ||
            context.selectedCategory
        );
    }, [context.filters, context.travelIntent, context.selectedCategory]);

    /**
     * Conta quantos filtros estão ativos
     */
    const activeFilterCount = useMemo(() => {
        let count = 0;
        const { destination, priceMin, priceMax, duration } = context.filters;
        if (destination) count++;
        if (duration && duration !== 7) count++;
        if (context.travelIntent) count++;
        if (context.selectedCategory) count++;
        if (priceMin > 0 || priceMax < 50000) count++;
        return count;
    }, [context.filters, context.travelIntent, context.selectedCategory]);

    /**
     * Total de resultados combinados
     */
    const totalResultsCount = useMemo(() => {
        return filteredPackages.length + filteredItineraries.length;
    }, [filteredPackages, filteredItineraries]);

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
        setSelectedCategory: context.setSelectedCategory,

        // Resultados
        filteredPackages,
        filteredItineraries,
        totalResultsCount,
        getPackagesOnly,
        getItinerariesOnly,
        getAllResults,

        // Estado
        isSearching: context.isSearching,
        activeTab: context.activeTab,
        setActiveTab: context.setActiveTab,

        // TODO: Future personalization — expose searchHistory here
    };
}
