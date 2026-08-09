/**
 * searchUtils — regras PURAS de busca/filtragem de roteiros.
 *
 * Fonte única usada por: listagem (useSearch), prévia de contagem do
 * SearchModal e testes. Nenhuma tela deve reimplementar filtro nem fallback de
 * campo; se faltar algo, o lugar de mexer é aqui.
 */
import { expandDestinationAliases } from '../data/destinations';

export interface ItineraryFilterInput {
    destination?: string;
    /** Mínimo inclusivo de dias. Ausente = sem piso. */
    durationMin?: number;
    /** Máximo inclusivo de dias. Ausente = sem teto. */
    durationMax?: number;
    ratingMin?: number;
    featured?: boolean;
    verifiedCreatorOnly?: boolean;
    selectedCategories?: string[];
    /** Estilo/orçamento ("economico" | "moderado" | "luxo" | …). */
    travelIntent?: string | null;
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

// ── Disponibilidade ───────────────────────────────────────────────────────

const PUBLIC_STATUSES = ['active', 'ativo', 'published', 'publicado'];

/**
 * Um roteiro está realmente disponível na vitrine? A API pública já devolve só
 * ACTIVE, mas a checagem fica aqui para telas e prévias de contagem usarem
 * exatamente o mesmo critério (nada de rascunho/arquivado escapar).
 */
export function isPublicItinerary(itinerary: any): boolean {
    const status = String(itinerary?.status ?? itinerary?.approvalStatus ?? 'active').toLowerCase();
    return PUBLIC_STATUSES.includes(status);
}

// ── Duração ───────────────────────────────────────────────────────────────

/**
 * Extrai a duração em dias do roteiro. Centraliza os fallbacks de nome de
 * campo — nenhum componente deve repetir esse encadeamento.
 * Retorna `null` quando não há duração utilizável (nunca NaN).
 */
export function getItineraryDurationDays(itinerary: any): number | null {
    const candidates = [
        itinerary?.duration,
        itinerary?.durationDays,
        itinerary?.totalDays,
    ];

    for (const candidate of candidates) {
        if (candidate === null || candidate === undefined || candidate === '') continue;
        const parsed = Number(candidate);
        if (Number.isFinite(parsed)) return parsed;
    }

    // Último recurso: número de dias montados no roteiro.
    if (Array.isArray(itinerary?.days) && itinerary.days.length > 0) {
        return itinerary.days.length;
    }

    return null;
}

/**
 * Faixa REAL: mínimo e máximo independentes, ambos inclusivos e ambos
 * opcionais. Sem média, sem teto artificial.
 */
export function matchesDuration(
    itineraryDuration: unknown,
    durationMin?: number,
    durationMax?: number,
): boolean {
    if (durationMin === undefined && durationMax === undefined) return true;

    const duration = Number(itineraryDuration);
    // Duração ausente/inválida não pode passar por um filtro de faixa ativo,
    // mas também não pode explodir: só não casa.
    if (!Number.isFinite(duration)) return false;

    if (durationMin !== undefined && duration < durationMin) return false;
    if (durationMax !== undefined && duration > durationMax) return false;

    return true;
}

export function filterItinerariesByDuration<T extends Record<string, any>>(
    itineraries: T[],
    durationMin?: number,
    durationMax?: number,
): T[] {
    if (durationMin === undefined && durationMax === undefined) return itineraries;
    return itineraries.filter(itinerary =>
        matchesDuration(getItineraryDurationDays(itinerary), durationMin, durationMax),
    );
}

// ── Destino ───────────────────────────────────────────────────────────────

/** Um pedaço de localização com a origem de onde veio (usada só pro ícone). */
export interface ItineraryLocationToken {
    /** Texto como está cadastrado, para exibição ("Tóquio"). */
    label: string;
    type: 'country' | 'city' | 'destination';
}

/** Achata string | string[] | {country, cities[]} | null em textos. */
function collectStrings(value: unknown): string[] {
    if (value === null || value === undefined) return [];
    if (typeof value === 'string') return value.trim() ? [value.trim()] : [];
    if (typeof value === 'number') return [String(value)];
    if (Array.isArray(value)) return value.flatMap(collectStrings);
    if (typeof value === 'object') {
        const record = value as Record<string, unknown>;
        return [
            ...collectStrings(record.country),
            ...collectStrings(record.city),
            ...collectStrings(record.cities),
            ...collectStrings(record.name),
        ];
    }
    return [];
}

/**
 * Todos os textos de localização do roteiro, deduplicados.
 *
 * Cobre os campos que a API realmente devolve hoje (`destination`, `country`,
 * `extraCities`, `extraCountries`) e tolera formatos alternativos (`city`,
 * `locations: [{ country, cities }]`) sem quebrar em null/undefined.
 *
 * ⚠️ O cadastro atual mistura semântica: há roteiro com
 * `destination: "Tóquio", country: "Japão"` e outro com
 * `destination: "Portugal", country: "Lisboa"`. Por isso tratamos todos os
 * campos como termos buscáveis equivalentes; `type` só decide o ícone.
 */
export function getItineraryLocationTokens(itinerary: any): ItineraryLocationToken[] {
    const groups: Array<{ value: unknown; type: ItineraryLocationToken['type'] }> = [
        { value: itinerary?.destination, type: 'destination' },
        { value: itinerary?.country, type: 'country' },
        { value: itinerary?.extraCountries, type: 'country' },
        { value: itinerary?.city, type: 'city' },
        { value: itinerary?.cities, type: 'city' },
        { value: itinerary?.extraCities, type: 'city' },
        { value: itinerary?.locations, type: 'city' },
    ];

    const seen = new Set<string>();
    const tokens: ItineraryLocationToken[] = [];

    for (const group of groups) {
        for (const label of collectStrings(group.value)) {
            const key = normalizeText(label);
            if (!key || seen.has(key)) continue;
            seen.add(key);
            tokens.push({ label, type: group.type });
        }
    }

    return tokens;
}

/**
 * O roteiro casa com o termo de destino?
 *
 * Compara contra os campos ESTRUTURADOS de localização (com aliases: "japan"
 * acha "Japão", "tokyo" acha "Tóquio"). O título só entra como rede de
 * segurança para roteiros sem nenhum campo de localização preenchido — assim
 * um cadastro incompleto não some da busca, mas o título também não mascara
 * dados de localização errados.
 */
export function itineraryMatchesDestination(itinerary: any, destination: string): boolean {
    const searchTerm = normalizeText(destination);
    if (!searchTerm) return true;

    const variants = expandDestinationAliases(searchTerm);
    const tokens = getItineraryLocationTokens(itinerary);

    if (tokens.length > 0) {
        const normalizedTokens = tokens.map(token => normalizeText(token.label));
        if (normalizedTokens.some(token => variants.some(variant => token.includes(variant)))) {
            return true;
        }
        return false;
    }

    const title = normalizeText(itinerary?.title);
    return variants.some(variant => title.includes(variant));
}

export function filterItinerariesByDestination<T extends Record<string, any>>(itineraries: T[], destination: string): T[] {
    const searchTerm = normalizeText(destination);
    if (!searchTerm) return itineraries;
    return itineraries.filter(itinerary => itineraryMatchesDestination(itinerary, destination));
}

// ── Sugestões de destino (autocomplete) ───────────────────────────────────

export interface DestinationSuggestion {
    /** Chave estável = termo normalizado. */
    id: string;
    /** Texto exibido, como cadastrado ("Tóquio"). */
    label: string;
    /** Valor gravado no filtro — NUNCA o label composto. */
    searchValue: string;
    type: ItineraryLocationToken['type'];
    /** Quantos roteiros disponíveis têm esse destino. */
    itineraryCount: number;
}

/**
 * Constrói as sugestões a partir dos roteiros REAIS carregados.
 *
 * Só entram destinos com pelo menos um roteiro disponível — o autocomplete
 * nunca oferece um destino que devolveria lista vazia.
 */
export function buildDestinationSuggestions(itineraries: any[]): DestinationSuggestion[] {
    const byKey = new Map<string, DestinationSuggestion>();

    for (const itinerary of itineraries || []) {
        if (!isPublicItinerary(itinerary)) continue;

        for (const token of getItineraryLocationTokens(itinerary)) {
            const key = normalizeText(token.label);
            if (!key) continue;

            const existing = byKey.get(key);
            if (existing) {
                existing.itineraryCount += 1;
                // País tem precedência de ícone sobre cidade quando o mesmo
                // texto aparece nos dois papéis (dado invertido em alguns
                // cadastros).
                if (token.type === 'country') existing.type = 'country';
            } else {
                byKey.set(key, {
                    id: key,
                    label: token.label,
                    searchValue: token.label,
                    type: token.type,
                    itineraryCount: 1,
                });
            }
        }
    }

    return Array.from(byKey.values()).sort(compareSuggestions);
}

function compareSuggestions(a: DestinationSuggestion, b: DestinationSuggestion): number {
    if (b.itineraryCount !== a.itineraryCount) return b.itineraryCount - a.itineraryCount;
    return a.label.localeCompare(b.label, 'pt-BR');
}

/** Limite padrão do dropdown — poucas opções, sem virar lista virtualizada. */
export const DESTINATION_SUGGESTION_LIMIT = 8;

/**
 * Filtra as sugestões pelo texto digitado. Sem acento, sem caixa, parcial e
 * com aliases. Prioriza quem COMEÇA com o termo; depois, mais roteiros.
 * Query vazia devolve os destinos com mais roteiros disponíveis.
 */
export function searchDestinationSuggestions(
    suggestions: DestinationSuggestion[],
    query: string,
    limit: number = DESTINATION_SUGGESTION_LIMIT,
): DestinationSuggestion[] {
    const term = normalizeText(query);
    if (!term) return suggestions.slice(0, limit);

    const variants = expandDestinationAliases(term);

    const matches = suggestions
        .map(suggestion => {
            const normalized = normalizeText(suggestion.label);
            const startsWith = variants.some(variant => normalized.startsWith(variant));
            const contains = variants.some(variant => normalized.includes(variant));
            return { suggestion, startsWith, contains };
        })
        .filter(entry => entry.contains);

    matches.sort((a, b) => {
        if (a.startsWith !== b.startsWith) return a.startsWith ? -1 : 1;
        return compareSuggestions(a.suggestion, b.suggestion);
    });

    return matches.slice(0, limit).map(entry => entry.suggestion);
}

// ── Intenção de viagem (estilo/orçamento) ─────────────────────────────────

/** Categorias equivalentes a cada intenção. `null` = regra por exclusão. */
const INTENT_CATEGORY_MAP: Record<string, string[] | null> = {
    luxo: ['luxo', 'luxury'],
    economico: ['economico', 'mochilao'],
    'custo-beneficio': ['economico', 'mochilao'],
    mochilao: ['mochilao', 'economico'],
    romantico: ['romantico'],
    aventura: ['aventura'],
    // "moderado" = tudo que não é luxo.
    moderado: null,
};

export function itineraryMatchesTravelIntent(itinerary: any, travelIntent?: string | null): boolean {
    if (!travelIntent) return true;
    if (!(travelIntent in INTENT_CATEGORY_MAP)) return true;

    const categories = INTENT_CATEGORY_MAP[travelIntent];
    if (categories === null) return !itineraryMatchesCategory(itinerary, ['luxo', 'luxury']);
    return itineraryMatchesCategory(itinerary, categories);
}

// ── Composição ────────────────────────────────────────────────────────────

export function itineraryMatchesFilters<T extends Record<string, any>>(itinerary: T, filters: ItineraryFilterInput): boolean {
    if (filters.destination && !itineraryMatchesDestination(itinerary, filters.destination)) {
        return false;
    }

    if (filters.selectedCategories?.length && !itineraryMatchesCategory(itinerary, filters.selectedCategories)) {
        return false;
    }

    if (!matchesDuration(getItineraryDurationDays(itinerary), filters.durationMin, filters.durationMax)) {
        return false;
    }

    if (!itineraryMatchesTravelIntent(itinerary, filters.travelIntent)) {
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
    return (itineraries || []).filter(itinerary => itineraryMatchesFilters(itinerary, filters));
}

/**
 * Contagem de resultados para um conjunto de filtros — mesma regra da
 * listagem, incluindo o corte de disponibilidade. É o que a prévia do
 * SearchModal usa, garantindo que o número do rodapé bata com a lista.
 */
export function countMatchingItineraries(itineraries: any[], filters: ItineraryFilterInput): number {
    return (itineraries || []).filter(
        itinerary => isPublicItinerary(itinerary) && itineraryMatchesFilters(itinerary, filters),
    ).length;
}
