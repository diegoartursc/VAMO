import { Package } from '../types';
import { Itinerary } from '../data/mockItineraries';

/**
 * Filtra pacotes por destino (cidade ou país)
 */
export function filterByDestination(packages: Package[], destination: string): Package[] {
    if (!destination || destination.trim() === '') {
        return packages;
    }

    const searchTerm = destination.toLowerCase().trim();

    return packages.filter(pkg => {
        const cityMatch = pkg.destination.toLowerCase().includes(searchTerm);
        const countryMatch = pkg.country.toLowerCase().includes(searchTerm);
        return cityMatch || countryMatch;
    });
}

/**
 * Filtra pacotes por intervalo de datas
 * Nota: Como Package não tem availableDates, retorna todos os pacotes
 * TODO: Adicionar campo availableDates ao tipo Package se necessário
 */
export function filterByDate(
    packages: Package[],
    _startDate?: Date,
    _endDate?: Date
): Package[] {
    // Por enquanto, retorna todos os pacotes pois não temos campo de data
    return packages;
}

/**
 * Filtra pacotes por faixa de preço
 */
export function filterByPrice(
    packages: Package[],
    minPrice: number,
    maxPrice: number
): Package[] {
    return packages.filter(pkg => {
        // Usa o menor preço do pacote para comparação
        const price = pkg.price.min;
        return price >= minPrice && price <= maxPrice;
    });
}

/**
 * Filtra pacotes por duração (com tolerância de ±2 dias)
 */
export function filterByDuration(
    packages: Package[],
    targetDuration: number
): Package[] {
    return packages.filter(pkg => {
        return Math.abs(pkg.duration - targetDuration) <= 2;
    });
}

/**
 * Aplica todos os filtros de uma vez
 */
export function applyAllFilters(
    packages: Package[],
    filters: {
        destination?: string;
        startDate?: Date;
        endDate?: Date;
        duration?: number;
        priceMin: number;
        priceMax: number;
    }
): Package[] {
    let filtered = packages;

    // Filtro por destino
    if (filters.destination) {
        filtered = filterByDestination(filtered, filters.destination);
    }

    // Filtro por data
    if (filters.startDate || filters.endDate) {
        filtered = filterByDate(filtered, filters.startDate, filters.endDate);
    }

    // Filtro por duração
    if (filters.duration !== undefined) {
        filtered = filterByDuration(filtered, filters.duration);
    }

    // Filtro por preço
    filtered = filterByPrice(filtered, filters.priceMin, filters.priceMax);

    return filtered;
}

// ── Itinerary Filters ──────────────────────────────────────────────────

/**
 * Filtra roteiros por destino (cidade ou país)
 */
export function filterItinerariesByDestination(itineraries: Itinerary[], destination: string): Itinerary[] {
    if (!destination || destination.trim() === '') {
        return itineraries;
    }
    const searchTerm = destination.toLowerCase().trim();
    return itineraries.filter(it => {
        const cityMatch = it.destination.toLowerCase().includes(searchTerm);
        const countryMatch = it.country.toLowerCase().includes(searchTerm);
        return cityMatch || countryMatch;
    });
}

/**
 * Filtra roteiros por duração (com tolerância de ±2 dias)
 */
export function filterItinerariesByDuration(itineraries: Itinerary[], targetDuration: number): Itinerary[] {
    return itineraries.filter(it => Math.abs(it.duration - targetDuration) <= 2);
}

/**
 * Filtra roteiros por faixa de preço (preço do roteiro em si)
 */
export function filterItinerariesByPrice(itineraries: Itinerary[], minPrice: number, maxPrice: number): Itinerary[] {
    return itineraries.filter(it => it.price >= minPrice && it.price <= maxPrice);
}

/**
 * Aplica todos os filtros aos roteiros
 */
export function applyAllItineraryFilters(
    itineraries: Itinerary[],
    filters: {
        destination?: string;
        duration?: number;
        priceMin: number;
        priceMax: number;
    }
): Itinerary[] {
    let filtered = itineraries;

    if (filters.destination) {
        filtered = filterItinerariesByDestination(filtered, filters.destination);
    }

    if (filters.duration !== undefined) {
        filtered = filterItinerariesByDuration(filtered, filters.duration);
    }

    filtered = filterItinerariesByPrice(filtered, filters.priceMin, filters.priceMax);

    return filtered;
}
