/**
 * VAMO API Service — Gateway to backend database
 * Tries real API first, falls back to mock data when API is unavailable
 */
import { mockPackages } from '../data/mockPackages';
import { mockItineraries } from '../data/mockItineraries';
import { mockCreators, getFeaturedCreators as mockFeaturedCreators } from '../data/mockCreators';

const API_BASE_URL = 'http://localhost:3333/api';

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
        return mockPackages;
    }
}

export async function getPackageById(id: string): Promise<any | null> {
    try {
        const result = await fetchApi(`/packages/${id}`);
        if (result) return result;
    } catch { /* fall through to mock */ }
    return mockPackages.find(p => p.id === id) || null;
}

export async function getFeaturedPackages(): Promise<any[]> {
    try { return await fetchApi('/packages/featured'); }
    catch { return mockPackages.filter(p => p.featured); }
}

export async function getRelatedPackages(id: string): Promise<any[]> {
    try { return await fetchApi(`/packages/${id}/related`); }
    catch { return mockPackages.filter(p => p.id !== id).slice(0, 4); }
}

// ─── Itineraries ───
export async function getItineraries(params?: {
    destination?: string; featured?: boolean; sort?: string;
}): Promise<any[]> {
    try {
        const query = new URLSearchParams();
        if (params?.destination) query.set('destination', params.destination);
        if (params?.featured) query.set('featured', 'true');
        if (params?.sort) query.set('sort', params.sort);
        const qs = query.toString();
        return await fetchApi(`/itineraries${qs ? `?${qs}` : ''}`);
    } catch {
        return mockItineraries;
    }
}

export async function getItineraryById(id: string): Promise<any | null> {
    try {
        const result = await fetchApi(`/itineraries/${id}`);
        if (result) return result;
    } catch { /* fall through to mock */ }
    return mockItineraries.find(i => i.id === id) || null;
}

export async function getFeaturedItineraries(): Promise<any[]> {
    try { return await fetchApi('/itineraries/featured'); }
    catch { return mockItineraries.filter(i => i.featured); }
}

// ─── Creators ───
export async function getCreators(): Promise<any[]> {
    try { return await fetchApi('/creators'); }
    catch { return mockCreators; }
}

export async function getCreatorById(id: string): Promise<any | null> {
    try {
        const result = await fetchApi(`/creators/${id}`);
        if (result) return result;
    } catch { /* fall through to mock */ }
    return mockCreators.find(c => c.id === id) || null;
}

export async function getFeaturedCreators(): Promise<any[]> {
    try {
        const creators = await getCreators();
        return creators.slice(0, 5);
    } catch {
        return mockFeaturedCreators();
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

// ─── My Trips ───
export async function getMyTrips(travelerId: string): Promise<{
    upcomingPackages: any[];
    pastPackages: any[];
    purchasedItineraries: any[];
    savedItems: any[];
}> {
    try {
        return await fetchApi(`/my-trips/${travelerId}`);
    } catch {
        return { upcomingPackages: [], pastPackages: [], purchasedItineraries: [], savedItems: [] };
    }
}

