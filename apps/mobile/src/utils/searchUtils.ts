export interface ItineraryFilterInput {
    destination?: string;
    duration?: number;
    // priceMin/priceMax mantidos opcionais só pra compat de spread de
    // context.filters — NÃO são mais usados pra filtrar (filtro removido).
    priceMin?: number;
    priceMax?: number;
    ratingMin?: number;
    featured?: boolean;
    verifiedCreatorOnly?: boolean;
    selectedCategories?: string[];
}

export function normalizeText(value: unknown): string {
    return String(value ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ');
}

export function normalizeArray(value: unknown): string[] {
    if (Array.isArray(value)) return value.map(normalizeText).filter(Boolean);
    const normalized = normalizeText(value);
    return normalized ? [normalized] : [];
}

const CATEGORY_ALIASES: Record<string, string[]> = {
    aventura: ['aventura', 'trilha', 'trilhas', 'radical', 'outdoor'],
    cultura: ['cultura', 'cultural', 'arte', 'museu', 'museus'],
    gastronomia: ['gastronomia', 'gastronomico', 'gastronomica', 'culinaria', 'comida', 'restaurantes'],
    historico: ['historico', 'historia', 'histórico', 'história'],
    familia: ['familia', 'criancas', 'crianca', 'kids', 'com criancas'],
    mochilao: ['mochilao', 'mochileiro', 'backpack', 'backpacking', 'economico'],
    natureza: ['natureza', 'natural', 'trilha', 'trilhas', 'parque', 'parques'],
    praia: ['praia', 'praias', 'litoral', 'mar'],
    romantico: ['romantico', 'romance', 'casal', 'lua de mel'],
};

function getCategoryTerms(category: string): string[] {
    const normalized = normalizeText(category);
    return Array.from(new Set([normalized, ...(CATEGORY_ALIASES[normalized] || []).map(normalizeText)]));
}

export function getItinerarySearchableCategories(itinerary: any): string[] {
    return Array.from(new Set([
        ...normalizeArray(itinerary?.category),
        ...normalizeArray(itinerary?.categories),
        ...normalizeArray(itinerary?.tags),
        ...normalizeArray(itinerary?.style),
        ...normalizeArray(itinerary?.travelStyle),
        ...normalizeArray(itinerary?.travelStyles),
        ...normalizeArray(itinerary?.themes),
        ...normalizeArray(itinerary?.interests),
        ...normalizeArray(itinerary?.experienceTypes),
    ]));
}

export function itineraryMatchesCategory(itinerary: any, selectedCategories?: string[] | string | null): boolean {
    const selected = normalizeArray(selectedCategories);
    if (selected.length === 0) return true;

    const searchable = getItinerarySearchableCategories(itinerary);
    if (searchable.length === 0) return false;

    return selected.some(category =>
        getCategoryTerms(category).some(term =>
            searchable.some(item => item === term || item.includes(term) || term.includes(item)),
        ),
    );
}

export function filterItinerariesByDestination<T extends Record<string, any>>(itineraries: T[], destination: string): T[] {
    const searchTerm = normalizeText(destination);
    if (!searchTerm) return itineraries;

    return itineraries.filter(itinerary => {
        const searchable = [
            itinerary?.destination,
            itinerary?.country,
            itinerary?.city,
            itinerary?.title,
            ...(Array.isArray(itinerary?.extraCities) ? itinerary.extraCities : []),
            ...(Array.isArray(itinerary?.extraCountries) ? itinerary.extraCountries : []),
        ].map(normalizeText);

        return searchable.some(value => value.includes(searchTerm));
    });
}

export function filterItinerariesByDuration<T extends Record<string, any>>(itineraries: T[], maxDuration: number): T[] {
    return itineraries.filter(itinerary => {
        const duration = Number(itinerary?.duration);
        return Number.isFinite(duration) && duration <= maxDuration;
    });
}

export function filterItinerariesByPrice<T extends Record<string, any>>(itineraries: T[], minPrice: number, maxPrice: number): T[] {
    return itineraries.filter(itinerary => {
        const price = Number(itinerary?.price);
        return Number.isFinite(price) && price >= minPrice && price <= maxPrice;
    });
}

export function itineraryMatchesFilters<T extends Record<string, any>>(itinerary: T, filters: ItineraryFilterInput): boolean {
    if (filters.destination && filterItinerariesByDestination([itinerary], filters.destination).length === 0) {
        return false;
    }

    if (filters.selectedCategories?.length && !itineraryMatchesCategory(itinerary, filters.selectedCategories)) {
        return false;
    }

    if (filters.duration !== undefined && filterItinerariesByDuration([itinerary], filters.duration).length === 0) {
        return false;
    }

    // Filtro de faixa de preço REMOVIDO da UI — não aplicar aqui pra que
    // nenhum parâmetro de preço continue ativo de forma invisível. O preço
    // segue exibido nos cards/checkout normalmente; só não filtra mais.

    if (filters.ratingMin !== undefined && Number(itinerary?.rating || 0) < filters.ratingMin) {
        return false;
    }

    if (filters.featured === true && itinerary?.featured !== true) {
        return false;
    }

    if (filters.verifiedCreatorOnly === true && !itinerary?.creator?.verificationLevel) {
        return false;
    }

    return true;
}

export function applyAllItineraryFilters<T extends Record<string, any>>(itineraries: T[], filters: ItineraryFilterInput): T[] {
    return itineraries.filter(itinerary => itineraryMatchesFilters(itinerary, filters));
}
