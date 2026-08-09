import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchContext, SearchFilters } from '../contexts/SearchContext';
import { getItineraries } from '../services/api';
import {
    applyAllItineraryFilters,
    buildDestinationSuggestions,
    ItineraryFilterInput,
} from '../utils/searchUtils';
import { DEFAULT_DURATION_PRESET } from '../constants/durationPresets';

/**
 * Hook personalizado para gerenciar busca e filtros.
 * Busca dados reais da API (PostgreSQL). Sem fallback de mocks.
 */
export function useSearch() {
    const context = useSearchContext();
    const [allItineraries, setAllItineraries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [reloadKey, setReloadKey] = useState(0);

    /** Refaz o fetch da listagem (botão "Tentar novamente" nas telas). */
    const reload = useCallback(() => {
        setLoading(true);
        setReloadKey((k) => k + 1);
    }, []);

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
    }, [reloadKey]);

    /**
     * Filtros ativos no formato que as funções puras consomem. Mesma entrada
     * usada pela prévia de contagem do SearchModal — nenhuma regra de filtro
     * vive fora de `searchUtils`.
     */
    const activeFilterInput: ItineraryFilterInput = useMemo(() => ({
        destination: context.filters.destination,
        durationMin: context.filters.durationMin,
        durationMax: context.filters.durationMax,
        selectedCategories: context.selectedCategories,
        travelIntent: context.travelIntent,
    }), [context.filters, context.selectedCategories, context.travelIntent]);

    /** Roteiros que passam nos filtros atuais (destino, duração, categoria, intenção). */
    const filteredItineraries = useMemo(
        () => applyAllItineraryFilters(allItineraries, activeFilterInput),
        [allItineraries, activeFilterInput],
    );

    /**
     * Sugestões de destino do autocomplete, derivadas dos roteiros REAIS já
     * carregados. Memoizado aqui para o modal não recalcular a cada tecla nem
     * disparar request por caractere.
     */
    const destinationSuggestions = useMemo(
        () => buildDestinationSuggestions(allItineraries),
        [allItineraries],
    );

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
        const { destination, startDate, endDate, durationPreset } = context.filters;
        return !!(
            destination ||
            startDate ||
            endDate ||
            (durationPreset && durationPreset !== DEFAULT_DURATION_PRESET) ||
            context.travelIntent ||
            context.selectedCategories.length > 0
        );
    }, [context.filters, context.travelIntent, context.selectedCategories]);

    const activeFilterCount = useMemo(() => {
        let count = 0;
        const { destination, durationPreset } = context.filters;
        if (destination) count++;
        if (durationPreset && durationPreset !== DEFAULT_DURATION_PRESET) count++;
        if (context.travelIntent) count++;
        if (context.selectedCategories.length > 0) count++;
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
        /** Opções do autocomplete de destino (derivadas dos roteiros reais). */
        destinationSuggestions,
        getItinerariesOnly,
        getAllResults,

        // Estado
        isSearching: context.isSearching,
        loading,
        error,
        reload,
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
