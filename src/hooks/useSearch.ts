import { useMemo, useCallback } from 'react';
import { useSearchContext, SearchFilters } from '../contexts/SearchContext';
import { mockPackages } from '../data/mockPackages';
import { applyAllFilters } from '../utils/searchUtils';
import { Package } from '../types';

/**
 * Hook personalizado para gerenciar busca e filtros
 */
export function useSearch() {
    const context = useSearchContext();

    /**
     * Filtra os pacotes com base nos filtros atuais
     */
    const filteredPackages = useMemo(() => {
        return applyAllFilters(mockPackages, context.filters);
    }, [context.filters]);

    /**
     * Retorna apenas pacotes (para aba Pacotes)
     */
    const getPackagesOnly = useCallback((): Package[] => {
        return filteredPackages;
    }, [filteredPackages]);

    /**
     * Retorna apenas roteiros (para aba Roteiros)
     * TODO: Implementar quando tivermos dados de roteiros
     */
    const getItinerariesOnly = useCallback(() => {
        return [];
    }, []);

    /**
     * Retorna pacotes + roteiros (para aba Home)
     */
    const getAllResults = useCallback(() => {
        return {
            packages: filteredPackages,
            itineraries: [], // TODO: Adicionar roteiros quando disponível
        };
    }, [filteredPackages]);

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
        const { destination, startDate, endDate, priceMin, priceMax } = context.filters;
        return !!(
            destination ||
            startDate ||
            endDate ||
            priceMin > 0 ||
            priceMax < 50000
        );
    }, [context.filters]);

    return {
        // Filtros
        filters: context.filters,
        setFilters: context.setFilters,
        clearFilters,
        applyFilters,
        hasActiveFilters,

        // Resultados
        filteredPackages,
        getPackagesOnly,
        getItinerariesOnly,
        getAllResults,

        // Estado
        isSearching: context.isSearching,
        activeTab: context.activeTab,
        setActiveTab: context.setActiveTab,
    };
}
