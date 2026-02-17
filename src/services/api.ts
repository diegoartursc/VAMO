/**
 * VAMO API Service — Gateway to backend database
 * Replaces all mock data imports with real API calls
 */

const API_BASE_URL = __DEV__
    ? 'http://localhost:3000/api'
    : 'https://api.vamo.com.br/api'; // TODO: update production URL

// ─── Helper ───
async function fetchApi<T>(endpoint: string): Promise<T> {
    const res = await fetch(`${API_BASE_URL}${endpoint}`);
    if (!res.ok) throw new Error(`API Error: ${res.status} ${res.statusText}`);
    return res.json();
}

// ─── Packages ───
export async function getPackages(params?: {
    destination?: string; featured?: boolean; category?: string;
    minPrice?: number; maxPrice?: number; sort?: string;
}): Promise<any[]> {
    const query = new URLSearchParams();
    if (params?.destination) query.set('destination', params.destination);
    if (params?.featured) query.set('featured', 'true');
    if (params?.category) query.set('category', params.category);
    if (params?.minPrice) query.set('minPrice', params.minPrice.toString());
    if (params?.maxPrice) query.set('maxPrice', params.maxPrice.toString());
    if (params?.sort) query.set('sort', params.sort);
    const qs = query.toString();
    return fetchApi(`/packages${qs ? `?${qs}` : ''}`);
}

export async function getPackageById(id: string): Promise<any | null> {
    try { return await fetchApi(`/packages/${id}`); }
    catch { return null; }
}

export async function getFeaturedPackages(): Promise<any[]> {
    return fetchApi('/packages/featured');
}

export async function getRelatedPackages(id: string): Promise<any[]> {
    return fetchApi(`/packages/${id}/related`);
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
    try { return await fetchApi(`/itineraries/${id}`); }
    catch { return null; }
}

export async function getFeaturedItineraries(): Promise<any[]> {
    return fetchApi('/itineraries/featured');
}

// ─── Creators ───
export async function getCreators(): Promise<any[]> {
    return fetchApi('/creators');
}

export async function getCreatorById(id: string): Promise<any | null> {
    try { return await fetchApi(`/creators/${id}`); }
    catch { return null; }
}

export async function getFeaturedCreators(): Promise<any[]> {
    const creators = await getCreators();
    return creators.slice(0, 5); // Top 5 by sales
}

// ─── Destinations ───
export async function getDestinations(params?: {
    search?: string; popular?: boolean;
}): Promise<any[]> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.popular) query.set('popular', 'true');
    const qs = query.toString();
    return fetchApi(`/destinations${qs ? `?${qs}` : ''}`);
}

// ─── Reviews ───
export async function getReviews(params: {
    packageId?: string; itineraryId?: string;
}): Promise<{ reviews: any[]; stats: { total: number; averageRating: number } }> {
    const query = new URLSearchParams();
    if (params.packageId) query.set('packageId', params.packageId);
    if (params.itineraryId) query.set('itineraryId', params.itineraryId);
    return fetchApi(`/reviews?${query.toString()}`);
}
