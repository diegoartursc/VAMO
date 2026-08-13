/**
 * VAMO API Service — Gateway to backend database.
 * Sem fallbacks de mock: retorna apenas dados reais do backend.
 *
 * Contrato de erro:
 *  - Falha de rede / timeout / 5xx → lança `ApiError` (mensagem PT-BR amigável).
 *  - 404 em buscas por id (`getById`) → retorna `null` (não é erro de sistema).
 *  - 401 em requisição QUE ENVIOU Authorization → dispara o callback registrado
 *    via `setOnUnauthorized` (AuthContext usa para deslogar) e lança `ApiError`.
 *  - Listagens NÃO engolem mais erros: backend fora do ar = erro visível na UI.
 */

import type {
    AttractionItem,
    BreakdownItem,
    Currency,
    ExtraSpendingItem,
    FlightInfo,
    ItineraryStatus,
    ModuleCostInfo,
    ModuleSpending,
    ProductType,
    RestaurantItem,
    SpendingEntry,
} from '@vamo/shared';
import type { TravelerStatsInput } from '../gamification/gamification.types';

// Em celular físico, localhost não aponta para o seu computador.
// Defina EXPO_PUBLIC_API_URL no arquivo .env do mobile com o IP da sua máquina.
// Exemplo: EXPO_PUBLIC_API_URL=http://192.168.1.100:3333/api
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3333/api';

// ─── Erro de API ─────────────────────────────────────────────────
const MSG_TIMEOUT = 'O servidor demorou demais para responder. Verifique sua conexão e tente novamente.';
const MSG_NETWORK = 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.';
const MSG_SERVER = 'Nosso servidor está com problemas no momento. Tente novamente em instantes.';
const MSG_UNAUTHORIZED = 'Sua sessão expirou. Faça login novamente.';
const MSG_FORBIDDEN = 'Você não tem permissão para acessar este conteúdo.';
const MSG_NOT_FOUND = 'Conteúdo não encontrado.';
const MSG_GENERIC = 'Algo deu errado. Tente novamente.';

export class ApiError extends Error {
    /** Status HTTP da resposta. `null` quando a requisição nem chegou ao servidor. */
    readonly status: number | null;
    /** Endpoint relativo (ex: `/itineraries`). */
    readonly endpoint: string;
    /** true quando foi falha de rede/timeout (sem resposta HTTP). */
    readonly isNetworkError: boolean;

    constructor(
        message: string,
        opts: { endpoint: string; status?: number | null; isNetworkError?: boolean },
    ) {
        super(message);
        this.name = 'ApiError';
        this.status = opts.status ?? null;
        this.endpoint = opts.endpoint;
        this.isNetworkError = opts.isNetworkError ?? false;
    }
}

function friendlyMessage(status: number, backendMessage: string | null): string {
    if (status >= 500) return MSG_SERVER;
    // 4xx: backend costuma mandar mensagens PT-BR úteis (ex: "Você já avaliou
    // este roteiro") — preserva quando existir.
    if (backendMessage) return backendMessage;
    if (status === 401) return MSG_UNAUTHORIZED;
    if (status === 403) return MSG_FORBIDDEN;
    if (status === 404) return MSG_NOT_FOUND;
    return MSG_GENERIC;
}

/**
 * Mensagem de erro específica para telas do Portal do Roteirista
 * (vendas/avaliações). Distingue os casos que o usuário precisa entender:
 *  - 401 → sessão expirada;
 *  - 404 → rota inexistente no backend (sintoma clássico de backend em
 *    produção defasado em relação ao frontend — ver CLAUDE.md/Render);
 *  - 5xx → erro de servidor;
 *  - rede/timeout → conexão.
 * Loga endpoint + status em dev para diagnóstico rápido, evitando o antigo
 * "verifique sua conexão" genérico que mascarava um 404/500 real.
 */
export function describeDashboardError(err: unknown): string {
    if (err instanceof ApiError) {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
            console.warn(`[dashboard] ${err.endpoint} falhou — status=${err.status ?? 'network'} msg="${err.message}"`);
        }
        if (err.status === 404) {
            return 'Este recurso ainda não está disponível no servidor. Se o problema continuar, o backend pode precisar ser atualizado.';
        }
        // .message já é status-aware (401/403/5xx/rede/timeout).
        return err.message;
    }
    if (typeof __DEV__ !== 'undefined' && __DEV__) console.warn('[dashboard] erro inesperado', err);
    return MSG_GENERIC;
}

// ─── 401 global (token expirado) ─────────────────────────────────
type UnauthorizedCallback = () => void;
let onUnauthorized: UnauthorizedCallback | null = null;

/**
 * Registra um callback global disparado quando uma requisição AUTENTICADA
 * (enviou header Authorization) recebe 401. Endpoints públicos que retornem
 * 401 NÃO disparam o callback. Registrado pelo AuthContext (logout).
 */
export function setOnUnauthorized(cb: UnauthorizedCallback | null): void {
    onUnauthorized = cb;
}

// ─── Core request ────────────────────────────────────────────────
const REQUEST_TIMEOUT_MS = 15_000;

interface RequestOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    body?: object;
    accessToken?: string | null;
}

async function request<T>(endpoint: string, opts: RequestOptions = {}): Promise<T> {
    const headers: Record<string, string> = {};
    if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
    const sentAuth = !!opts.accessToken;
    if (sentAuth) headers.Authorization = `Bearer ${opts.accessToken}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let res: Response;
    try {
        res = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: opts.method ?? 'GET',
            headers,
            body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
            signal: controller.signal,
        });
    } catch (err) {
        const aborted = err instanceof Error && err.name === 'AbortError';
        throw new ApiError(aborted ? MSG_TIMEOUT : MSG_NETWORK, {
            endpoint,
            isNetworkError: true,
        });
    } finally {
        clearTimeout(timer);
    }

    if (!res.ok) {
        // 401 em chamada autenticada = sessão inválida/expirada → logout global.
        if (res.status === 401 && sentAuth && onUnauthorized) {
            try { onUnauthorized(); } catch { /* callback não pode quebrar a request */ }
        }
        const data = await res.json().catch(() => null);
        const backendMessage =
            data && typeof (data as any).error === 'string' ? (data as any).error : null;
        throw new ApiError(friendlyMessage(res.status, backendMessage), {
            endpoint,
            status: res.status,
        });
    }

    try {
        return (await res.json()) as T;
    } catch {
        throw new ApiError(MSG_SERVER, { endpoint, status: res.status });
    }
}

/**
 * Variante para buscas por id: status presentes em `nullStatuses` (default
 * 404) retornam `null` em vez de lançar. Rede/5xx continuam lançando.
 */
async function requestOrNull<T>(
    endpoint: string,
    opts: RequestOptions = {},
    nullStatuses: number[] = [404],
): Promise<T | null> {
    try {
        return await request<T>(endpoint, opts);
    } catch (err) {
        if (err instanceof ApiError && err.status !== null && nullStatuses.includes(err.status)) {
            return null;
        }
        throw err;
    }
}

// ─── Tipos de resposta (shape REAL do backend) ───────────────────
// Onde existe tipo no @vamo/shared (módulos JSON round-trip do form), usamos
// o tipo compartilhado. O restante espelha os `res.json(...)` das rotas em
// apps/backend/src/routes/*.ts.

/** Bloco `creator` embutido em roteiros (listagem e detalhe). */
export interface ItineraryCreatorSummary {
    id: string;
    name: string;
    avatar: string;
    verificationLevel: string;
    rating: number | null;
    salesCount: number;
}

/** estimatedSpending (Json no Prisma): { min, max, currency, breakdown, manualEntries } */
export interface EstimatedSpending {
    min?: number;
    max?: number;
    currency?: string;
    breakdown?: BreakdownItem[];
    manualEntries?: SpendingEntry[];
}

/** Item de GET /api/itineraries e GET /api/itineraries/featured. */
export interface ItinerarySummary {
    id: string;
    title: string;
    destination: string;
    country: string;
    /**
     * Destinos adicionais (multi-destino). Opcionais na listagem: um backend
     * anterior à inclusão desses campos simplesmente não os envia, e a busca
     * degrada para destino/país sem quebrar.
     */
    extraCities?: string[];
    extraCountries?: string[];
    creator: ItineraryCreatorSummary;
    /** Vendas reais DESTE roteiro (diferente de creator.salesCount, acumulado do criador). */
    salesCount: number;
    description: string;
    price: number;
    currency: Currency;
    images: string[];
    rating: number | null;
    highlightPhotos: string[];
    mediaUrls: string[];
    reviewCount: number;
    inclusions: string[];
    duration: number;
    featured: boolean;
    highlights: string[];
    estimatedSpending: EstimatedSpending | null;
    qualityScore: number;
    categories: string[];
    travelStyles: string[];
    activeModules: string[];
    attractions: AttractionItem[];
    restaurants: RestaurantItem[];
    extraSpendingItems: ExtraSpendingItem[];
    flightInfo: FlightInfo | null;
}

// Módulos JSON usam os tipos do shared; relações (accommodations, transports,
// checklists, days) têm shape próprio da API (id/order/priceRange etc.).

/** Hospedagem como retornada por GET /api/itineraries/:id (relação + aliases). */
export interface ApiAccommodation {
    id: string;
    name: string | null;
    neighborhood: string | null;
    description: string | null;
    priceRange: string | null;
    rating: string | null;
    externalLink: string | null;
    address: string | null;
    mapLink: string | null;
    tips: string | null;
    nights: string | null;
    startDate: string | null;
    endDate: string | null;
    totalPrice: number | null;
    priceCurrency: string | null;
    order: number;
    spending?: ModuleSpending;
    cost?: ModuleCostInfo;
}

export interface ApiTransport {
    id: string;
    description: string | null;
    passTypes: string | null;
    estimatedPrice: string | null;
    notes: string | null;
    startDate: string | null;
    endDate: string | null;
    priceValue: string | null;
    priceCurrency: string | null;
    order: number;
    spending?: ModuleSpending;
    cost?: ModuleCostInfo;
}

export interface ApiChecklistItem {
    id: string;
    category: string | null;
    item: string;
    isDefault: boolean;
    order: number;
    completed: boolean;
    /** Presente apenas no payload de roteiro comprado (normalizado no client). */
    text?: string;
}

export interface ApiActivity {
    id: string;
    title: string;
    description: string | null;
    duration: string | null;
    location: string | null;
    tips: string | null;
    time: string | null;
    type: string | null;
    icon: string | null;
    images: string[];
    mapLink: string | null;
    completed: boolean;
    notes: string | null;
    latitude: number | null;
    longitude: number | null;
    category: string | null;
}

export interface ApiDay {
    dayNumber: number;
    title: string;
    summary: string | null;
    description: string | null;
    activities: ApiActivity[];
}

export interface ApiFile {
    id: string;
    name: string;
    type: string;
    url: string;
    size: number | null;
}

/** Review pública embutida no detalhe do roteiro / GET /api/reviews. */
export interface PublicReview {
    id: string;
    rating: number;
    text: string;
    date: string;
    verified: boolean;
    helpful: number;
    user: {
        name: string | null;
        location: string | null;
        avatar: string | null;
        initial: string | null;
    };
    photos: string[];
}

/** Item de GET /api/reviews (lista por roteiro/pacote). */
export interface ReviewListItem extends PublicReview {
    packageId: string | null;
    itineraryId: string | null;
    travelerId: string | null;
    language: string | null;
    response?: { date: string; text: string };
}

export interface ReviewsResponse {
    reviews: ReviewListItem[];
    stats: { total: number; averageRating: number };
}

/** Resposta de GET /api/itineraries/:id (detalhe completo). */
export interface ItineraryDetail extends ItinerarySummary {
    downloadCount: number;
    subtitle: string | null;
    productType: ProductType | string;
    promoPrice: number | null;
    immediateAccess: boolean;
    lifetimeAccess: boolean;
    offlineDownload: boolean;
    allowPdf: boolean;
    allowShare: boolean;
    travelProofUrl: string | null;
    status: ItineraryStatus | string;
    approvalNote: string | null;
    approvedAt: string | null;
    extraCities: string[];
    extraCountries: string[];
    tripStartDate: string | null;
    tripEndDate: string | null;
    generalTips: string[];
    spendingProfile: { icon?: string; label?: string } | null;
    receiveList: Array<{ icon?: string; label?: string }> | null;
    accommodations: ApiAccommodation[];
    /** Alias de `accommodations` para a tela pós-compra. */
    accommodationOptions: ApiAccommodation[];
    transports: ApiTransport[];
    /** Alias de `transports` para a tela pós-compra. */
    transport: { items: ApiTransport[] };
    checklists: ApiChecklistItem[];
    /** Alias de `checklists` para a tela pós-compra. */
    checklist: ApiChecklistItem[];
    days: ApiDay[];
    files: ApiFile[];
    reviews: PublicReview[];
}

/** Resposta de GET /api/itineraries/:id/purchased (detalhe + dados da compra). */
export interface PurchasedItineraryDetail extends ItineraryDetail {
    purchaseId?: string;
    purchasedAt?: string | null;
    pricePaid?: number;
    snapshotVersion?: number;
    /** @deprecated Campo legado — pode existir em snapshots antigos, mas nunca é gerado/renderizado. Ignorar. */
    archivedAccessNotice?: string;
}

/** Item de GET /api/my-trips → purchasedItineraries. */
export interface PurchasedTripSummary {
    id: string;
    purchaseId: string;
    title: string;
    destination: string;
    country: string;
    image: string;
    purchaseDate: string;
    creatorName: string;
    creatorAvatar: string;
    price: number;
    currency: string;
    duration: number;
}

export interface MyTripsResponse {
    purchasedItineraries: PurchasedTripSummary[];
}

/** Item de GET /api/creators. */
export interface CreatorProfile {
    id: string;
    name: string;
    avatar: string;
    coverUrl: string | null;
    /** @deprecated Prefira `reputation.level` (calculado) quando presente — mantido por compat. */
    verificationLevel: string;
    /**
     * Reputação REAL calculada (mesma fórmula de /creators/recommended).
     * Presente em GET /creators/:id; ainda não retornado por GET /creators
     * (lista) — ver limitação documentada na Parte 2 da auditoria.
     */
    reputation?: {
        level: string;
        label: string;
        icon: string;
        color: string;
    };
    stats: {
        itinerariesCount: number;
        totalSales: number;
        averageRating: number | null;
        /** Contagem real de avaliações — só em GET /creators/:id por ora. */
        reviewCount?: number;
        responseTime: string | null;
        tripsCompleted: number;
    };
    bio: string | null;
    destinations: string[];
    memberSince: string;
    languages: string[];
    socialLinks: { instagram: string | null; youtube: string | null; blog: string | null };
}

/** Resposta de GET /api/creators/:id (perfil + vitrine de roteiros). */
export interface CreatorDetail extends CreatorProfile {
    itineraries: Array<{
        id: string;
        title: string;
        destination: string;
        country: string;
        price: number;
        currency: string;
        rating: number | null;
        reviewCount: number;
        duration: number;
        images: string[];
        salesCount: number;
        categories: string[];
        activeModules: string[];
    }>;
}


/** Item de GET /api/destinations. */
export interface DestinationSummary {
    id: string;
    name: string;
    country: string;
    emoji: string | null;
    popular: boolean;
}

// ─── Legacy Package APIs ───
// Mantidos apenas para telas legadas ainda existentes. O fluxo principal do
// VAMO usa roteiros digitais via Itineraries. Shapes espelham
// apps/backend/src/routes/packages.ts.

export interface PackageAgency {
    id: string;
    name: string;
    logo: string | null;
    verified: boolean;
    contactUrl: string | null;
    whatsapp: string | null;
}

export interface PackageDeparture {
    date: string;
    price: number;
    spotsLeft: number | null;
}

export interface PackageSummary {
    id: string;
    title: string;
    destination: string;
    country: string;
    agency: PackageAgency;
    price: { min: number; max: number; currency: string };
    images: string[];
    duration: number;
    includes: string[];
    rating: number | null;
    reviewCount: number;
    featured: boolean;
    description: string;
    highlights: string[];
    badge?: string;
    availableDates: PackageDeparture[];
    inclusions: string[];
    categories: string[];
    hasFreeCancellation: boolean;
    isAllInclusive: boolean;
    recentPurchases: number | null;
    priceComparison: unknown;
    priceDiscount: number | null;
    itinerary: unknown;
    fullDescription?: string | null;
    emotionalIntro?: string | null;
    includedItems?: unknown;
    notRecommendedFor?: string[] | null;
    importantInfo?: unknown;
    perfectFor?: string[] | null;
    /** Presente apenas em GET /api/packages/:id. */
    reviews?: PublicReview[];
}

export async function getPackages(params?: {
    destination?: string; featured?: boolean; category?: string;
    minPrice?: number; maxPrice?: number; sort?: string;
}): Promise<PackageSummary[]> {
    const query = new URLSearchParams();
    if (params?.destination) query.set('destination', params.destination);
    if (params?.featured) query.set('featured', 'true');
    if (params?.category) query.set('category', params.category);
    if (params?.minPrice) query.set('minPrice', params.minPrice.toString());
    if (params?.maxPrice) query.set('maxPrice', params.maxPrice.toString());
    if (params?.sort) query.set('sort', params.sort);
    const qs = query.toString();
    return request<PackageSummary[]>(`/packages${qs ? `?${qs}` : ''}`);
}

export async function getPackageById(id: string): Promise<PackageSummary | null> {
    return requestOrNull<PackageSummary>(`/packages/${id}`);
}

export async function getFeaturedPackages(): Promise<PackageSummary[]> {
    return request<PackageSummary[]>('/packages/featured');
}

export async function getRelatedPackages(id: string): Promise<PackageSummary[]> {
    return request<PackageSummary[]>(`/packages/${id}/related`);
}

// ─── Itineraries ───
export async function getItineraries(params?: {
    destination?: string; featured?: boolean; sort?: string;
}): Promise<ItinerarySummary[]> {
    const query = new URLSearchParams();
    if (params?.destination) query.set('destination', params.destination);
    if (params?.featured) query.set('featured', 'true');
    if (params?.sort) query.set('sort', params.sort);
    const qs = query.toString();
    return request<ItinerarySummary[]>(`/itineraries${qs ? `?${qs}` : ''}`);
}

/** Retorna `null` quando o roteiro não existe (404). Lança em rede/5xx. */
export async function getItineraryById(id: string): Promise<ItineraryDetail | null> {
    return requestOrNull<ItineraryDetail>(`/itineraries/${id}`);
}

/** Variante estrita: lança ApiError inclusive em 404 (caller decide). */
export async function getItineraryByIdStrict(id: string): Promise<ItineraryDetail> {
    return request<ItineraryDetail>(`/itineraries/${id}`);
}

export async function getFeaturedItineraries(): Promise<ItinerarySummary[]> {
    return request<ItinerarySummary[]>('/itineraries/featured');
}

/**
 * Records a purchase. Sends the JWT so the backend attributes the sale to
 * the authenticated traveler (and not the dev-fallback first traveler).
 */
export async function purchaseItinerary(
    itineraryId: string,
    paymentMethod: string,
    accessToken?: string | null,
): Promise<{ id: string; itineraryId: string; alreadyPurchased: boolean }> {
    return request(`/itineraries/${itineraryId}/purchase`, {
        method: 'POST',
        body: { paymentMethod },
        accessToken,
    });
}

// ─── Pagamento (Stripe Checkout) ───
export interface CheckoutSessionResult {
    itineraryId: string;
    /** URL da página de checkout hospedada pelo Stripe (ausente se grátis/já comprado). */
    url?: string;
    sessionId?: string;
    saleId?: string;
    /** true quando o roteiro já pertencia ao traveler — nada foi cobrado. */
    alreadyPurchased?: boolean;
    /** true quando o roteiro é grátis e foi liberado direto, sem Stripe. */
    freePurchase?: boolean;
}

/** Cria a sessão de pagamento no Stripe e devolve a URL do checkout hospedado. */
export async function createCheckoutSession(
    itineraryId: string,
    opts: { source?: string } = {},
    accessToken?: string | null,
): Promise<CheckoutSessionResult> {
    return request('/payments/checkout-session', {
        method: 'POST',
        body: { itineraryId, source: opts.source },
        accessToken,
    });
}

/**
 * Consulta o status do pagamento ao voltar do Stripe. Se pago, o backend
 * libera o roteiro na hora (idempotente — convive com o webhook em prod).
 */
export async function getCheckoutSessionStatus(
    sessionId: string,
    accessToken?: string | null,
): Promise<{ status: string; itineraryId: string; saleId?: string; alreadyPurchased?: boolean }> {
    return request(`/payments/checkout-session/${encodeURIComponent(sessionId)}`, { accessToken });
}

// ─── Currency Rates ───
/** Taxas padrão com base AUD: 1 unidade da moeda = X AUD. */
const DEFAULT_CURRENCY_RATES: Record<string, number> = {
    AED: 0.41212, ARS: 0.0015152, AUD: 1, BOB: 0.21818, BRL: 0.30303,
    CAD: 1.1212, CHF: 1.697, CLP: 0.0015152, CNY: 0.21212, COP: 0.000303,
    CRC: 0.0030303, CUP: 0.06364, DOP: 0.02576, EGP: 0.0303, EUR: 1.6364,
    GBP: 1.9091, GTQ: 0.19697, IDR: 0.0000939, INR: 0.01818, JPY: 0.01,
    KES: 0.01152, MAD: 0.15152, MXN: 0.09091, MYR: 0.33939, NOK: 0.14242,
    NZD: 0.90909, PEN: 0.40606, PHP: 0.02697, PYG: 0.0002061, SGD: 1.1333,
    THB: 0.04545, TRY: 0.04545, USD: 1.5152, UYU: 0.03939,
    VND: 0.0000606, ZAR: 0.08182,
};

/**
 * Busca as taxas de conversão atuais definidas pelo admin.
 * Mantém fallback de taxas padrão (não é mock de roteiro, é câmbio) —
 * exceção consciente à regra "sem engolir erro": sem taxas o app inteiro
 * deixaria de formatar preços.
 */
export async function getCurrencyRates(): Promise<Record<string, number>> {
    try {
        return await request<Record<string, number>>('/rates');
    } catch {
        return DEFAULT_CURRENCY_RATES;
    }
}

// ─── Saved itineraries ───
export async function getSavedItineraryIds(accessToken: string): Promise<string[]> {
    const response = await request<{ itineraryIds: string[] }>('/saved-items', { accessToken });
    return Array.isArray(response.itineraryIds) ? response.itineraryIds : [];
}

export async function saveItinerary(itineraryId: string, accessToken: string): Promise<void> {
    await request(`/saved-items/${encodeURIComponent(itineraryId)}`, {
        method: 'PUT',
        accessToken,
    });
}

export async function unsaveItinerary(itineraryId: string, accessToken: string): Promise<void> {
    await request(`/saved-items/${encodeURIComponent(itineraryId)}`, {
        method: 'DELETE',
        accessToken,
    });
}

// ─── Creators ───
export async function getCreators(): Promise<CreatorProfile[]> {
    return request<CreatorProfile[]>('/creators');
}

/** Retorna `null` quando o criador não existe (404). Lança em rede/5xx. */
export async function getCreatorById(id: string): Promise<CreatorDetail | null> {
    return requestOrNull<CreatorDetail>(`/creators/${id}`);
}

/** Item de GET /api/creators/recommended — ranking real calculado no backend. */
export interface RecommendedItineraryThumbnail {
    id: string;
    title: string;
    image: string | null;
}

export interface RecommendedCreator {
    id: string;
    name: string;
    avatar: string | null;
    coverUrl: string | null;
    reputation: {
        level: string;
        label: string;
        icon: string;
        color: string;
    };
    stats: {
        activeItineraries: number;
        totalSales: number;
        averageRating: number | null;
        reviewCount: number;
        averageQualityScore: number | null;
    };
    /** Até 3 roteiros ativos com imagem real, pra prévia visual do card. */
    topItineraries: RecommendedItineraryThumbnail[];
    recommendation: {
        score: number;
        contextualMatch: boolean;
        matchingDestinations: string[];
        matchingCategories: string[];
        /** Evidência mais forte — sempre presente. */
        primaryReason: string;
        /** Segunda evidência, só quando existe uma segunda genuína. */
        secondaryReason?: string;
        /** @deprecated primaryReason + secondaryReason já cobrem o mesmo dado. */
        reason: string;
    };
}

/** `contextual` = pelo menos 1 criador tem afinidade real com o filtro aplicado.
 *  `global_fallback` = sem filtro, ou nenhum criador batia — lista dos melhores globais. */
export type RecommendedCreatorsResultType = 'contextual' | 'global_fallback';

export interface RecommendedCreatorsResponse {
    type: RecommendedCreatorsResultType;
    creators: RecommendedCreator[];
}

/**
 * Ranking de "Criadores recomendados" — SEMPRE calculado no backend
 * (elegibilidade + score ponderado + afinidade contextual). Nunca fazer
 * `getCreators().slice(...)` no cliente: isso ordenava por vendas cruas e
 * podia recomendar perfis sem qualidade/reputação comprovada.
 */
export async function getRecommendedCreators(params?: {
    destination?: string;
    country?: string;
    categories?: string[];
    travelStyles?: string[];
    limit?: number;
}): Promise<RecommendedCreatorsResponse> {
    const query = new URLSearchParams();
    if (params?.destination) query.set('destination', params.destination);
    if (params?.country) query.set('country', params.country);
    if (params?.categories?.length) query.set('categories', params.categories.join(','));
    if (params?.travelStyles?.length) query.set('travelStyles', params.travelStyles.join(','));
    if (params?.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    return request<RecommendedCreatorsResponse>(`/creators/recommended${qs ? `?${qs}` : ''}`);
}

// ─── Destinations ───
export async function getDestinations(params?: {
    search?: string; popular?: boolean;
}): Promise<DestinationSummary[]> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.popular) query.set('popular', 'true');
    const qs = query.toString();
    return request<DestinationSummary[]>(`/destinations${qs ? `?${qs}` : ''}`);
}

// ─── Reviews ───
export async function getReviews(params: {
    packageId?: string; itineraryId?: string;
}): Promise<ReviewsResponse> {
    const query = new URLSearchParams();
    if (params.packageId) query.set('packageId', params.packageId);
    if (params.itineraryId) query.set('itineraryId', params.itineraryId);
    return request<ReviewsResponse>(`/reviews?${query.toString()}`);
}

// ─── Purchased Itinerary Detail ───
/**
 * Busca o detalhe completo de um roteiro comprado pelo id.
 * Usado na tela pós-compra — retorna todos os módulos (dias, checklist, etc).
 * Retorna `null` quando o acesso não está liberado (401/403) ou o roteiro
 * não existe (404); lança ApiError em falha de rede/5xx.
 */
export async function getPurchasedItineraryDetail(
    id: string,
    accessToken?: string | null,
): Promise<PurchasedItineraryDetail | null> {
    const data = await requestOrNull<PurchasedItineraryDetail>(
        `/itineraries/${id}/purchased`,
        { accessToken },
        [401, 403, 404],
    );
    if (!data) return null;
    // Normalizar checklist: a API retorna { item } mas a tela espera { text }
    if (Array.isArray(data.checklist)) {
        data.checklist = data.checklist.map((c) => ({ ...c, text: c.item ?? c.text ?? '' }));
    }
    return data;
}

// ─── My Trips ───
/**
 * Lista compras do usuário autenticado. O backend resolve o traveler a partir
 * do JWT enviado no header. Token obrigatório — lança ApiError 401 sem
 * autenticação (e dispara o logout global se o token enviado expirou).
 */
export async function getMyTrips(accessToken?: string | null): Promise<MyTripsResponse> {
    const data = await request<MyTripsResponse>('/my-trips', { accessToken });
    return {
        purchasedItineraries: Array.isArray(data.purchasedItineraries)
            ? data.purchasedItineraries
            : [],
    };
}

// ─── Reviews (escrita + minhas avaliações) ───────────────────────

export interface SubmittedReview {
    id: string;
    itineraryId: string;
    rating: number;
    comment: string;
    photos: string[];
}

export async function submitItineraryReview(params: {
    itineraryId: string;
    rating: number;
    comment: string;
    photos: string[];
}, accessToken?: string | null): Promise<{ review: SubmittedReview }> {
    return request('/reviews', { method: 'POST', body: params, accessToken });
}

export async function updateItineraryReview(
    reviewId: string,
    params: {
        rating: number;
        comment: string;
        photos: string[];
    },
    accessToken?: string | null,
): Promise<{ review: SubmittedReview }> {
    return request(`/reviews/${reviewId}`, { method: 'PUT', body: params, accessToken });
}

/** Item de GET /api/reviews/my. */
export interface MyReview {
    id: string;
    itineraryId: string | null;
    rating: number;
    comment: string;
    date: string;
    photos: string[];
    itinerary: {
        id: string;
        title: string;
        destination: string;
        country: string;
        image: string | null;
    } | null;
}

export async function getMyReviews(
    accessToken?: string | null,
): Promise<{ reviews: MyReview[] }> {
    return request<{ reviews: MyReview[] }>('/reviews/my', { accessToken });
}

export type TravelerPassportStats = Pick<
    TravelerStatsInput,
    | 'profileCompleted'
    | 'savedCount'
    | 'questionsCount'
    | 'sharedCount'
    | 'purchasesCount'
    | 'customizedPurchasedItinerariesCount'
    | 'reviewsCount'
    | 'reviewsWithPhotoCount'
    | 'publishedItinerariesCount'
    | 'approvedItinerariesCount'
    | 'ownItinerarySharesCount'
    | 'creatorSalesCount'
    | 'featuredItinerariesCount'
    | 'maxPublishedItineraryQualityScore'
>;

export async function getTravelerPassportStats(
    accessToken?: string | null,
): Promise<TravelerPassportStats> {
    return request<TravelerPassportStats>('/auth/traveler/passport-stats', { accessToken });
}

export async function getCreatorEarnings(
    accessToken?: string | null,
): Promise<{
    summary: import('../features/creator/earnings/types').CreatorEarningsSummary;
    transactions: import('../features/creator/earnings/types').CreatorEarningTransaction[];
}> {
    return request('/creators/me/earnings', { accessToken });
}

/** Dashboard de vendas do roteirista (GET /api/itineraries/dashboard/sales). */
export async function getCreatorSalesDashboard(
    accessToken?: string | null,
): Promise<import('../features/creator/dashboard/types').CreatorSalesDashboard> {
    return request('/itineraries/dashboard/sales', { accessToken });
}

/** Dashboard de avaliações do roteirista (GET /api/itineraries/dashboard/reviews). */
export async function getCreatorReviewsDashboard(
    accessToken?: string | null,
): Promise<import('../features/creator/dashboard/types').CreatorReviewsDashboard> {
    return request('/itineraries/dashboard/reviews', { accessToken });
}

// ─── Stripe Connect (payouts do roteirista) ───
export interface CreatorPayoutStatus {
    connected: boolean;
    stripeConfigured?: boolean;
    accountId?: string | null;
    status: 'not_started' | 'pending' | 'verified' | 'restricted' | 'disabled';
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
    detailsSubmitted: boolean;
    requirementsDue: string[];
}

/** Status da conta de recebimento do criador (GET /api/creators/me/stripe/account-status). */
export async function getCreatorPayoutStatus(accessToken?: string | null): Promise<CreatorPayoutStatus> {
    return request('/creators/me/stripe/account-status', { accessToken });
}

/** Cria/recupera a conta Connect e devolve o link de onboarding hospedado da Stripe. */
export async function createCreatorOnboardingLink(accessToken?: string | null): Promise<{ url: string; accountId: string }> {
    return request('/creators/me/stripe/onboarding-link', { method: 'POST', accessToken });
}

// ─── Questions (FAQ Q&A) ───
/** Pergunta exibida na seção "Perguntas sobre este roteiro". */
export interface ItineraryQuestion {
    id: string;
    itineraryId?: string;
    question: string;
    createdAt: string;
    user?: { id?: string; name?: string; avatar?: string | null };
    isMine?: boolean;
    answer: { id?: string; text: string; createdAt: string } | null;
    status: 'answered' | 'pending';
    itinerary?: {
        id: string; title: string; destination: string; country: string;
        image: string | null; creatorName: string;
    };
}

/** Lista perguntas de um roteiro (públicas + pendentes do próprio usuário). */
export async function getItineraryQuestions(
    itineraryId: string,
    accessToken?: string | null,
): Promise<{ questions: ItineraryQuestion[] }> {
    return request(`/questions/itinerary/${encodeURIComponent(itineraryId)}`, { accessToken });
}

/** Cria uma nova pergunta sobre o roteiro. Exige autenticação. */
export async function createItineraryQuestion(
    itineraryId: string,
    questionText: string,
    accessToken?: string | null,
): Promise<{ question: ItineraryQuestion }> {
    return request('/questions', {
        method: 'POST',
        body: { itineraryId, questionText },
        accessToken,
    });
}

/** Perguntas do usuário autenticado (para a tela "Minhas Perguntas"). */
export async function getMyQuestions(
    accessToken?: string | null,
): Promise<{ questions: ItineraryQuestion[] }> {
    if (!accessToken) return { questions: [] };
    return request('/questions/mine', { accessToken });
}

/** Perguntas recebidas pelo criador autenticado (todos os seus roteiros). */
export async function getCreatorQuestions(
    accessToken?: string | null,
): Promise<{ questions: ItineraryQuestion[] }> {
    if (!accessToken) return { questions: [] };
    return request('/questions/creator/mine', { accessToken });
}

/** Criador responde a uma pergunta sua. */
export async function answerQuestion(
    questionId: string,
    answerText: string,
    accessToken?: string | null,
): Promise<{ answer: { id: string; text: string; createdAt: string } }> {
    return request(`/questions/${encodeURIComponent(questionId)}/answer`, {
        method: 'POST',
        body: { answerText },
        accessToken,
    });
}

// ─── Foto de perfil e capa do viajante ───────────────────────────
/**
 * Envia uma imagem (URI local do expo-image-picker) para o endpoint do
 * perfil. Funciona tanto no web (fetch → blob) quanto no nativo (RN
 * formdata file descriptor). Retorna o traveler atualizado.
 */
export interface UpdateProfileImageResponse {
    traveler: {
        id: string;
        name: string;
        email: string;
        avatar: string | null;
        coverUrl: string | null;
    };
    url: string;
}

async function uploadProfileImage(
    endpoint: '/auth/traveler/me/avatar' | '/auth/traveler/me/cover',
    uri: string,
    accessToken: string,
    suggestedName: string,
): Promise<UpdateProfileImageResponse> {
    const formData = new FormData();

    // No web o uri costuma ser blob: ou data: e fetch() resolve. No nativo
    // o RN aceita objeto { uri, name, type } direto no FormData.
    if (typeof document !== 'undefined') {
        const response = await fetch(uri);
        const blob = await response.blob();
        formData.append('file', blob, suggestedName);
    } else {
        const ext = (uri.split('.').pop() || 'jpg').toLowerCase();
        const mime = ext === 'png' ? 'image/png'
            : ext === 'webp' ? 'image/webp'
            : ext === 'heic' || ext === 'heif' ? `image/${ext}`
            : 'image/jpeg';
        // RN FormData aceita esse shape "non-standard" — não usar Blob.
        formData.append('file', { uri, name: suggestedName, type: mime } as any);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 60_000);
    let res: Response;
    try {
        res = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${accessToken}` },
            body: formData as any,
            signal: controller.signal,
        });
    } catch (err) {
        const aborted = err instanceof Error && err.name === 'AbortError';
        throw new ApiError(aborted ? MSG_TIMEOUT : MSG_NETWORK, { endpoint, isNetworkError: true });
    } finally {
        clearTimeout(timer);
    }

    if (!res.ok) {
        const data = await res.json().catch(() => null);
        const backend = data && typeof (data as any).error === 'string' ? (data as any).error : null;
        throw new ApiError(friendlyMessage(res.status, backend), { endpoint, status: res.status });
    }
    return (await res.json()) as UpdateProfileImageResponse;
}

export function updateMyAvatar(uri: string, accessToken: string): Promise<UpdateProfileImageResponse> {
    return uploadProfileImage('/auth/traveler/me/avatar', uri, accessToken, 'avatar.jpg');
}
export function updateMyCover(uri: string, accessToken: string): Promise<UpdateProfileImageResponse> {
    return uploadProfileImage('/auth/traveler/me/cover', uri, accessToken, 'cover.jpg');
}

/** Dados básicos do usuário logado retornados por GET/PATCH /auth/traveler/me. */
export interface MeProfile {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    coverUrl: string | null;
    bio: string | null;
    phone: string | null;
}

/** Busca o perfil completo do usuário logado (inclui phone/bio). */
export async function getMyProfile(accessToken: string): Promise<MeProfile> {
    const data = await request<{ traveler: MeProfile }>('/auth/traveler/me', { accessToken });
    return data.traveler;
}

/** Atualiza dados básicos editáveis do usuário logado (nome, telefone, bio). */
export async function updateMyProfile(
    patch: { name?: string; phone?: string | null; bio?: string | null },
    accessToken: string,
): Promise<MeProfile> {
    const data = await request<{ traveler: MeProfile }>('/auth/traveler/me', {
        method: 'PATCH',
        body: patch,
        accessToken,
    });
    return data.traveler;
}

// ─── Compartilhamento de roteiros ────────────────────────────────
export type ShareSurface = 'detail' | 'card' | 'purchased_itinerary' | 'creator_dashboard';
export type ShareChannel =
    | 'native_share' | 'copy_link' | 'whatsapp' | 'telegram' | 'email'
    | 'sms' | 'facebook' | 'instagram' | 'unknown';
export type ShareStatus = 'intent' | 'completed' | 'cancelled' | 'failed';
export type ShareActorRole = 'traveler' | 'creator';

export interface ShareItineraryInput {
    surface: ShareSurface;
    channel: ShareChannel;
    status: ShareStatus;
    actorRole: ShareActorRole;
    saleId?: string | null;
}

export interface ShareItineraryResponse {
    shareId: string;
    shareCode: string;
    /** Link rastreável (passa pelo backend para contar clique antes do redirect). */
    shareUrl: string;
    /** Link direto da página pública do roteiro, sem rastreamento. */
    publicUrl: string;
    xpAwarded: number;
    missionCompleted: boolean;
    alreadyCompletedBefore: boolean;
}

/**
 * Registra um evento de compartilhamento e devolve o link rastreável.
 * Aceita chamada não autenticada (analytics-only) — XP só é concedido com token.
 */
export async function registerItineraryShare(
    itineraryId: string,
    input: ShareItineraryInput,
    accessToken?: string | null,
): Promise<ShareItineraryResponse> {
    return request(`/itineraries/${encodeURIComponent(itineraryId)}/share`, {
        method: 'POST',
        body: input,
        accessToken: accessToken ?? null,
    });
}
