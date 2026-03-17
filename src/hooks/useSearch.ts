import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchContext, SearchFilters } from '../contexts/SearchContext';
import { getPackages, getItineraries } from '../services/api';
import { applyAllFilters, applyAllItineraryFilters } from '../utils/searchUtils';
import { Package } from '../types';
import { mockPackages } from '../data/mockPackages';
import { mockItineraries } from '../data/mockItineraries';

/**
 * Hook personalizado para gerenciar busca e filtros
 * Busca dados da API (banco de dados PostgreSQL) com fallback para mock data
 */
export function useSearch() {
    const context = useSearchContext();
    const [allPackages, setAllPackages] = useState<any[]>([]);
    const [allItineraries, setAllItineraries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch data from API on mount, with fallback to mock data
    useEffect(() => {
        let cancelled = false;
        async function loadData() {
            try {
                const [pkgs, itins] = await Promise.all([
                    getPackages(),
                    getItineraries(),
                ]);
                if (!cancelled) {
                    setAllPackages(pkgs.length > 0 ? pkgs : mockPackages);
                    setAllItineraries(itins.length > 0 ? itins : mockItineraries);
                    setLoading(false);
                }
            } catch (err) {
                console.error('Failed to load data from API:', err);
                console.warn('Using mock data as fallback');
                if (!cancelled) {
                    setAllPackages(mockPackages);
                    setAllItineraries(mockItineraries);
                }
                setLoading(false);
            }
        }
        loadData();
        return () => { cancelled = true; };
    }, []);

    /**
     * Filtra os pacotes com base nos filtros atuais e intent de viagem
     */
    const filteredPackages = useMemo(() => {
        let packages = applyAllFilters(allPackages, context.filters);

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
                    (p.priceComparison === 'below' || p.badge === 'value') &&
                    !p.categories?.includes('luxury')
                );
            }
        }

        return packages;
    }, [allPackages, context.filters, context.travelIntent, context.selectedCategory]);

    /**
     * Filtra roteiros com base nos filtros atuais
     */
    const filteredItineraries = useMemo(() => {
        let itineraries = applyAllItineraryFilters(allItineraries, context.filters);
        return itineraries;
    }, [allItineraries, context.filters]);

    const getPackagesOnly = useCallback((): Package[] => {
        return filteredPackages;
    }, [filteredPackages]);

    const getItinerariesOnly = useCallback(() => {
        return filteredItineraries;
    }, [filteredItineraries]);

    const getAllResults = useCallback(() => {
        return {
            packages: filteredPackages,
            itineraries: filteredItineraries,
        };
    }, [filteredPackages, filteredItineraries]);

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
            context.selectedCategory
        );
    }, [context.filters, context.travelIntent, context.selectedCategory]);

    const activeFilterCount = useMemo(() => {
        let count = 0;
        const { destination, priceMin, priceMax, duration } = context.filters;
        if (destination) count++;
        if (duration !== undefined) count++;
        if (context.travelIntent) count++;
        if (context.selectedCategory) count++;
        if (priceMin > 0 || priceMax < 50000) count++;
        return count;
    }, [context.filters, context.travelIntent, context.selectedCategory]);

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
        loading,
        activeTab: context.activeTab,
        setActiveTab: context.setActiveTab,

        // Raw data for screens that need it
        allPackages,
        allItineraries,
    };
}
