/**
 * Lógica de seleção/ordenação das seções dinâmicas da Home.
 *
 * Tudo aqui é puro (sem React, sem I/O) para ser testável e reutilizável
 * tanto na Home quanto na tela "Ver todos". A regra de ouro: uma seção só
 * existe se devolver itens — quem renderiza decide esconder título/subtítulo/
 * "Ver todos" quando o array volta vazio.
 */

import {
    normalizeText,
    itineraryMatchesCategory,
    filterItinerariesByDestination,
    getItinerarySearchableCategories,
} from './searchUtils';

// ─── Histórico de intenção do usuário ───────────────────────────
export interface SearchIntent {
    /** Texto livre da última busca (ex.: "México", "praia"). */
    lastSearchQuery?: string;
    /** País da última intenção (vindo de busca/filtro/detalhe). */
    lastCountry?: string;
    /** Cidade/destino da última intenção. */
    lastCity?: string;
    /** Categorias temáticas tocadas/filtradas/visualizadas. */
    lastCategories?: string[];
    /** Estilo de viagem (economico/moderado/luxo/aventura/...). */
    lastStyle?: string | null;
    /** IDs dos últimos roteiros abertos (mais recente primeiro). */
    lastViewedIds?: string[];
    /** epoch ms da última atualização. */
    updatedAt?: number;
}

const MAX_VIEWED = 10;
const MAX_CATEGORIES = 6;

const cleanStr = (v: unknown): string | undefined => {
    const s = typeof v === 'string' ? v.trim() : '';
    return s.length ? s : undefined;
};

const uniq = (arr: string[]): string[] => Array.from(new Set(arr.filter(Boolean)));

/**
 * Mescla um pedaço de intenção sobre a intenção anterior. Campos ausentes
 * (undefined) preservam o valor antigo; arrays acumulam com dedupe.
 */
export function mergeSearchIntent(
    prev: SearchIntent | null,
    partial: Partial<SearchIntent>,
    now: number,
): SearchIntent {
    const base: SearchIntent = prev ? { ...prev } : {};

    const q = cleanStr(partial.lastSearchQuery);
    if (q) base.lastSearchQuery = q;

    const country = cleanStr(partial.lastCountry);
    if (country) base.lastCountry = country;

    const city = cleanStr(partial.lastCity);
    if (city) base.lastCity = city;

    if (partial.lastStyle !== undefined) {
        base.lastStyle = cleanStr(partial.lastStyle) ?? null;
    }

    if (partial.lastCategories && partial.lastCategories.length) {
        const incoming = partial.lastCategories.map((c) => String(c).trim()).filter(Boolean);
        if (incoming.length) {
            base.lastCategories = uniq([...incoming, ...(base.lastCategories ?? [])]).slice(0, MAX_CATEGORIES);
        }
    }

    if (partial.lastViewedIds && partial.lastViewedIds.length) {
        const incoming = partial.lastViewedIds.map((id) => String(id).trim()).filter(Boolean);
        base.lastViewedIds = uniq([...incoming, ...(base.lastViewedIds ?? [])]).slice(0, MAX_VIEWED);
    }

    base.updatedAt = now;
    return base;
}

/** Há sinal suficiente para montar "Continue sua busca"? */
export function hasUsableIntent(intent: SearchIntent | null | undefined): boolean {
    if (!intent) return false;
    return Boolean(
        intent.lastSearchQuery ||
        intent.lastCountry ||
        intent.lastCity ||
        (intent.lastCategories && intent.lastCategories.length) ||
        intent.lastStyle ||
        (intent.lastViewedIds && intent.lastViewedIds.length),
    );
}

// ─── Validade de vitrine ────────────────────────────────────────
const PUBLIC_STATUSES = new Set([
    'active', 'ativo', 'approved', 'aprovado', 'published', 'publicado',
]);

/**
 * Roteiro válido para aparecer em qualquer vitrine da Home: publicado/ativo,
 * com título, preço numérico (>= 0) e criador identificável. Evita "roteiro
 * fantasma" (rascunho, em análise, sem preço, sem criador).
 */
export function isShowcaseItinerary(it: any): boolean {
    if (!it || typeof it !== 'object') return false;
    const status = String(it.status ?? it.approvalStatus ?? 'active').toLowerCase();
    if (!PUBLIC_STATUSES.has(status)) return false;
    if (!cleanStr(it.title)) return false;
    const price = Number(it.price);
    if (!Number.isFinite(price) || price < 0) return false;
    const creatorName = cleanStr(it.creator?.name) || cleanStr(it.creator?.traveler?.name);
    if (!creatorName) return false;
    return true;
}

// ─── "Experiências inesquecíveis" ───────────────────────────────
/** Categorias com forte apelo emocional/experiencial. */
export const EMOTIONAL_CATEGORIES = [
    'natureza', 'aventura', 'gastronomia', 'cultura', 'romantico',
    'praia', 'historico', 'festivais', 'cruzeiros', 'relax',
];

/** Score mínimo para um roteiro entrar em "Experiências inesquecíveis". */
export const UNFORGETTABLE_MIN_SCORE = 50;

const hasCostReference = (it: any): boolean => {
    const s = it?.estimatedSpending;
    if (!s || typeof s !== 'object') return false;
    if (Array.isArray(s.manualEntries) && s.manualEntries.length > 0) return true;
    if (Array.isArray(s.breakdown) && s.breakdown.length > 0) return true;
    return Number(s.max) > 0 || Number(s.min) > 0;
};

/**
 * Pontua o quão "inesquecível" um roteiro aparenta ser, a partir do que
 * temos na listagem da Home. Rubrica calibrada com os campos reais.
 */
export function calculateUnforgettableScore(it: any): number {
    let score = 0;

    const images = Array.isArray(it?.images) ? it.images.filter(Boolean) : [];
    if (images.length >= 1) score += 25;                 // fotos reais

    const highlights = Array.isArray(it?.highlights)
        ? it.highlights.filter((h: any) => String(h).trim())
        : [];
    if (highlights.length >= 1) score += 20;             // destaques da viagem

    if (itineraryMatchesCategory(it, EMOTIONAL_CATEGORIES)) score += 15; // categoria emocional

    const quality = Number(it?.qualityScore);
    if (Number.isFinite(quality) && quality >= 80) score += 15;

    const rating = Number(it?.rating);
    if (Number.isFinite(rating) && rating >= 4.5) score += 10;

    const sales = Number(it?.creator?.salesCount);
    if (Number.isFinite(sales) && sales > 0) score += 10; // vendas/popularidade

    if (hasCostReference(it)) score += 5;

    return score;
}

/**
 * Seleciona e ordena os roteiros de "Experiências inesquecíveis".
 * Vazio quando nenhum roteiro atinge o score mínimo (seção fica oculta).
 */
export function selectUnforgettable(itineraries: any[], limit = 8): any[] {
    return (itineraries || [])
        .filter(isShowcaseItinerary)
        .map((it) => ({ it, score: calculateUnforgettableScore(it) }))
        .filter(({ score }) => score >= UNFORGETTABLE_MIN_SCORE)
        .sort((a, b) =>
            b.score - a.score ||
            (Number(b.it.rating) || 0) - (Number(a.it.rating) || 0) ||
            (Number(b.it.creator?.salesCount) || 0) - (Number(a.it.creator?.salesCount) || 0),
        )
        .slice(0, limit)
        .map(({ it }) => it);
}

// ─── "Continue sua busca" ───────────────────────────────────────
/**
 * Relevância de um roteiro frente à intenção do usuário. Apenas sinais
 * relacionais contam para o corte (país, destino, categoria, estilo, item
 * já visto) — sem isso o roteiro não entra. Rating/recência entram só como
 * desempate na ordenação.
 */
function relevanceCore(it: any, intent: SearchIntent): number {
    let score = 0;

    const country = normalizeText(intent.lastCountry);
    if (country && normalizeText(it?.country).includes(country)) score += 50;

    const destinationQueries = [intent.lastCity, intent.lastSearchQuery]
        .map((v) => (typeof v === 'string' ? v.trim() : ''))
        .filter(Boolean);
    if (destinationQueries.some((q) => filterItinerariesByDestination([it], q).length > 0)) {
        score += 35;
    }

    if (intent.lastCategories?.length && itineraryMatchesCategory(it, intent.lastCategories)) {
        score += 30;
    }

    const style = normalizeText(intent.lastStyle);
    if (style) {
        const searchable = getItinerarySearchableCategories(it);
        if (searchable.some((s) => s.includes(style) || style.includes(s))) score += 15;
    }

    if (intent.lastViewedIds?.length && intent.lastViewedIds.includes(String(it?.id))) {
        score += 20;
    }

    return score;
}

/**
 * Seleciona "Continue sua busca": só quando há histórico real e existem
 * roteiros relacionados a ele. Vazio (seção oculta) caso contrário.
 */
export function selectContinueSearch(
    itineraries: any[],
    intent: SearchIntent | null | undefined,
    limit = 8,
): any[] {
    if (!hasUsableIntent(intent) || !Array.isArray(itineraries) || itineraries.length === 0) return [];
    const safeIntent = intent as SearchIntent;

    return (itineraries || [])
        .filter(isShowcaseItinerary)
        .map((it) => ({ it, rel: relevanceCore(it, safeIntent) }))
        .filter(({ rel }) => rel > 0)
        .sort((a, b) =>
            b.rel - a.rel ||
            (Number(b.it.rating) || 0) - (Number(a.it.rating) || 0) ||
            (Number(b.it.creator?.salesCount) || 0) - (Number(a.it.creator?.salesCount) || 0),
        )
        .slice(0, limit)
        .map(({ it }) => it);
}
