/**
 * VAMO API Service — Gateway to backend database.
 * Sem fallbacks de mock: retorna apenas dados reais do backend.
 */

// Em celular físico, localhost não aponta para o seu computador.
// Defina EXPO_PUBLIC_API_URL no arquivo .env do mobile com o IP da sua máquina.
// Exemplo: EXPO_PUBLIC_API_URL=http://192.168.1.100:3333/api
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3333/api';

// ─── Helper ───
async function fetchApi<T>(endpoint: string): Promise<T> {
    const res = await fetch(`${API_BASE_URL}${endpoint}`);
    if (!res.ok) throw new Error(`API Error: ${res.status} ${res.statusText}`);
    return res.json();
}

// ─── Legacy Package APIs ───
// Mantidos apenas para telas legadas ainda existentes. O fluxo principal do
// VAMO usa roteiros digitais via Itineraries.
export async function getPackages(params?: {
    destination?: string; featured?: boolean; category?: string;
    minPrice?: number; maxPrice?: number; sort?: string;
}): Promise<any[]> {
    try {
        const query = new URLSearchParams();
        if (params?.destination) query.set('destination', params.destination);
        if (params?.featured) query.set('featured', 'true');
        if (params?.category) query.set('category', params.category);
        if (params?.minPrice) query.set('minPrice', params.minPrice.toString());
        if (params?.maxPrice) query.set('maxPrice', params.maxPrice.toString());
        if (params?.sort) query.set('sort', params.sort);
        const qs = query.toString();
        return await fetchApi(`/packages${qs ? `?${qs}` : ''}`);
    } catch {
        return [];
    }
}

export async function getPackageById(id: string): Promise<any | null> {
    try {
        return await fetchApi(`/packages/${id}`);
    } catch {
        return null;
    }
}

export async function getFeaturedPackages(): Promise<any[]> {
    try { return await fetchApi('/packages/featured'); }
    catch { return []; }
}

export async function getRelatedPackages(id: string): Promise<any[]> {
    try { return await fetchApi(`/packages/${id}/related`); }
    catch { return []; }
}

// ─── Itineraries ───
export async function getItineraries(params?: {
    destination?: string; featured?: boolean; sort?: string;
}): Promise<any[]> {
    const query = new URLSearchParams();
    if (params?.destination) query.set('destination', params.destination);
    if (params?.featured) query.set('featured', 'true');
    if (params?.sort) query.set('sort', params.sort);
    const qs = query.toString();
    return fetchApi(`/itineraries${qs ? `?${qs}` : ''}`);
}

export async function getItineraryById(id: string): Promise<any | null> {
    try {
        return await fetchApi(`/itineraries/${id}`);
    } catch {
        return null;
    }
}

export async function getItineraryByIdStrict(id: string): Promise<any> {
    return fetchApi(`/itineraries/${id}`);
}

export async function getFeaturedItineraries(): Promise<any[]> {
    try { return await fetchApi('/itineraries/featured'); }
    catch { return []; }
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
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    const res = await fetch(`${API_BASE_URL}/itineraries/${itineraryId}/purchase`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ paymentMethod }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `API Error: ${res.status}`);
    return data;
}

// ─── Currency Rates ───
/** Taxas padrão usadas como fallback quando o backend não está disponível */
const DEFAULT_CURRENCY_RATES: Record<string, number> = {
    AED: 1.36, ARS: 0.005, AUD: 3.3, BOB: 0.72, BRL: 1.0,
    CAD: 3.7, CHF: 5.6, CLP: 0.005, CNY: 0.7, COP: 0.001,
    CRC: 0.01, CUP: 0.21, DOP: 0.085, EGP: 0.1, EUR: 5.4,
    GBP: 6.3, GTQ: 0.65, IDR: 0.00031, INR: 0.06, JPY: 0.033,
    KES: 0.038, MAD: 0.5, MXN: 0.3, MYR: 1.12, NOK: 0.47,
    NZD: 3.0, PEN: 1.34, PHP: 0.089, PYG: 0.00068, SGD: 3.74,
    THB: 0.15, TRY: 0.15, USD: 5.0, UYU: 0.13, VND: 0.0002, ZAR: 0.27,
};

/**
 * Busca as taxas de conversão atuais definidas pelo admin.
 * Mantém fallback de taxas padrão (não é mock de roteiro, é câmbio).
 */
export async function getCurrencyRates(): Promise<Record<string, number>> {
    try {
        return await fetchApi<Record<string, number>>('/rates');
    } catch {
        return DEFAULT_CURRENCY_RATES;
    }
}

// ─── Creators ───
export async function getCreators(): Promise<any[]> {
    try { return await fetchApi('/creators'); }
    catch { return []; }
}

export async function getCreatorById(id: string): Promise<any | null> {
    try {
        return await fetchApi(`/creators/${id}`);
    } catch {
        return null;
    }
}

export async function getFeaturedCreators(): Promise<any[]> {
    try {
        const creators = await getCreators();
        return creators.slice(0, 5);
    } catch {
        return [];
    }
}

// ─── Destinations ───
export async function getDestinations(params?: {
    search?: string; popular?: boolean;
}): Promise<any[]> {
    try {
        const query = new URLSearchParams();
        if (params?.search) query.set('search', params.search);
        if (params?.popular) query.set('popular', 'true');
        const qs = query.toString();
        return await fetchApi(`/destinations${qs ? `?${qs}` : ''}`);
    } catch {
        return [];
    }
}

// ─── Reviews ───
export async function getReviews(params: {
    packageId?: string; itineraryId?: string;
}): Promise<{ reviews: any[]; stats: { total: number; averageRating: number } }> {
    try {
        const query = new URLSearchParams();
        if (params.packageId) query.set('packageId', params.packageId);
        if (params.itineraryId) query.set('itineraryId', params.itineraryId);
        return await fetchApi(`/reviews?${query.toString()}`);
    } catch {
        return { reviews: [], stats: { total: 0, averageRating: 0 } };
    }
}

// ─── Purchased Itinerary Detail ───
/**
 * Busca o detalhe completo de um roteiro pelo id.
 * Usado na tela pós-compra — retorna todos os módulos (dias, checklist, etc).
 */
export async function getPurchasedItineraryDetail(
    id: string,
    accessToken?: string | null,
): Promise<any | null> {
    try {
        const headers: Record<string, string> = {};
        if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
        const res = await fetch(`${API_BASE_URL}/itineraries/${id}/purchased`, { headers });
        if (!res.ok) return null;
        const data = await res.json();
        // Normalizar checklist: a API retorna { item } mas a tela espera { text }
        if (Array.isArray(data.checklist)) {
            data.checklist = data.checklist.map((c: any) => ({ ...c, text: c.item ?? c.text ?? '' }));
        }
        return data;
    } catch {
        return null;
    }
}

// ─── My Trips ───
/**
 * Lista compras do usuário autenticado. O backend resolve o traveler a partir
 * do JWT enviado no header. Token obrigatório — retorna 401 sem autenticação.
 */
export interface MyTripsResponse {
    purchasedItineraries: any[];
}

export async function getMyTrips(accessToken?: string | null): Promise<MyTripsResponse> {
    const headers: Record<string, string> = {};
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    const res = await fetch(`${API_BASE_URL}/my-trips`, { headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `API ${res.status}`);
    return {
        purchasedItineraries: Array.isArray(data.purchasedItineraries) ? data.purchasedItineraries : [],
    };
}

// ─── Reviews ────────────────────────────────────────────

async function postApi<T>(endpoint: string, body: object, accessToken?: string | null): Promise<T> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `API Error: ${res.status}`);
    return data;
}

export async function submitItineraryReview(params: {
    itineraryId: string;
    rating: number;
    comment: string;
    photos: string[];
}, accessToken?: string | null): Promise<{ review: { id: string; itineraryId: string; rating: number; comment: string; photos: string[] } }> {
    return postApi('/reviews', params, accessToken);
}

export async function updateItineraryReview(
    reviewId: string,
    params: {
        rating: number;
        comment: string;
        photos: string[];
    },
    accessToken?: string | null,
): Promise<{ review: { id: string; itineraryId: string; rating: number; comment: string; photos: string[] } }> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    const res = await fetch(`${API_BASE_URL}/reviews/${reviewId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `API Error: ${res.status}`);
    return data;
}

export async function getMyReviews(accessToken?: string | null): Promise<{
    reviews: Array<{
        id: string;
        itineraryId: string | null;
        rating: number;
        comment: string;
        date: string;
        photos: string[];
        itinerary: { id: string; title: string; destination: string; country: string; image: string | null } | null;
    }>;
}> {
    try {
        const headers: Record<string, string> = {};
        if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
        const res = await fetch(`${API_BASE_URL}/reviews/my`, { headers });
        if (!res.ok) return { reviews: [] };
        return await res.json();
    } catch {
        return { reviews: [] };
    }
}

export async function getCreatorEarnings(
    accessToken?: string | null,
): Promise<{
    summary: import('../features/creator/earnings/types').CreatorEarningsSummary;
    transactions: import('../features/creator/earnings/types').CreatorEarningTransaction[];
}> {
    const headers: Record<string, string> = {};
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    const res = await fetch(`${API_BASE_URL}/creators/me/earnings`, { headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `API Error: ${res.status}`);
    return data;
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
    try {
        const headers: Record<string, string> = {};
        if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
        const res = await fetch(`${API_BASE_URL}/questions/itinerary/${encodeURIComponent(itineraryId)}`, { headers });
        if (!res.ok) return { questions: [] };
        return await res.json();
    } catch {
        return { questions: [] };
    }
}

/** Cria uma nova pergunta sobre o roteiro. Exige autenticação. */
export async function createItineraryQuestion(
    itineraryId: string,
    questionText: string,
    accessToken?: string | null,
): Promise<{ question: ItineraryQuestion }> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    const res = await fetch(`${API_BASE_URL}/questions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ itineraryId, questionText }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Falha ao enviar pergunta (HTTP ${res.status})`);
    return data;
}

/** Perguntas do usuário autenticado (para a tela "Minhas Perguntas"). */
export async function getMyQuestions(accessToken?: string | null): Promise<{ questions: ItineraryQuestion[] }> {
    if (!accessToken) return { questions: [] };
    try {
        const res = await fetch(`${API_BASE_URL}/questions/mine`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!res.ok) return { questions: [] };
        return await res.json();
    } catch {
        return { questions: [] };
    }
}

/** Perguntas recebidas pelo criador autenticado (todos os seus roteiros). */
export async function getCreatorQuestions(accessToken?: string | null): Promise<{ questions: ItineraryQuestion[] }> {
    if (!accessToken) return { questions: [] };
    try {
        const res = await fetch(`${API_BASE_URL}/questions/creator/mine`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!res.ok) return { questions: [] };
        return await res.json();
    } catch {
        return { questions: [] };
    }
}

/** Criador responde a uma pergunta sua. */
export async function answerQuestion(
    questionId: string,
    answerText: string,
    accessToken?: string | null,
): Promise<{ answer: { id: string; text: string; createdAt: string } }> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    const res = await fetch(`${API_BASE_URL}/questions/${encodeURIComponent(questionId)}/answer`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ answerText }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Falha ao enviar resposta (HTTP ${res.status})`);
    return data;
}
