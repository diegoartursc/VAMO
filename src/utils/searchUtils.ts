import { Package } from '../types';

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
 * Aplica todos os filtros de uma vez
 */
export function applyAllFilters(
    packages: Package[],
    filters: {
        destination?: string;
        startDate?: Date;
        endDate?: Date;
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

    // Filtro por preço
    filtered = filterByPrice(filtered, filters.priceMin, filters.priceMax);

    return filtered;
}
