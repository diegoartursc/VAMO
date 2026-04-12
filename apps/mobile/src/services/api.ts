/**
 * VAMO API Service — Gateway to backend database
 * Tries real API first, falls back to mock data when API is unavailable
 *
 * IMPORTANT: Mock data is ONLY for development
 * In production (EAS build), API must be working
 */
import { mockPackages } from '../data/mockPackages';
import { mockItineraries } from '../data/mockItineraries';
import { mockCreators, getFeaturedCreators as mockFeaturedCreators } from '../data/mockCreators';

// Em celular físico, localhost não aponta para o seu computador.
// Defina EXPO_PUBLIC_API_URL no arquivo .env do mobile com o IP da sua máquina.
// Exemplo: EXPO_PUBLIC_API_URL=http://192.168.1.100:3333/api
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3333/api';
const IS_DEVELOPMENT = __DEV__; // Expo global

// ─── Helper ───
async function fetchApi<T>(endpoint: string): Promise<T> {
    const res = await fetch(`${API_BASE_URL}${endpoint}`);
    if (!res.ok) throw new Error(`API Error: ${res.status} ${res.statusText}`);
    return res.json();
}

/**
 * Safely use mock data with warning in development
 * In production, always throws error
 */
function useMockData<T>(mockData: T, context: string): T {
    if (!IS_DEVELOPMENT) {
        throw new Error(`Backend unavailable (${context}). Please check your internet connection.`);
    }
    console.warn(`⚠️ [API] Using MOCK DATA for development (${context})`);
    return mockData;
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
    } catch (error) {
        return useMockData(mockPackages, 'getPackages');
    }
}

export async function getPackageById(id: string): Promise<any | null> {
    try {
        const result = await fetchApi(`/packages/${id}`);
        if (result) return result;
    } catch (error) {
        const mockPkg = mockPackages.find(p => p.id === id);
        if (mockPkg) return useMockData(mockPkg, `getPackageById(${id})`);
        return null;
    }
}

export async function getFeaturedPackages(): Promise<any[]> {
    try { return await fetchApi('/packages/featured'); }
    catch (error) { return useMockData(mockPackages.filter(p => p.featured), 'getFeaturedPackages'); }
}

export async function getRelatedPackages(id: string): Promise<any[]> {
    try { return await fetchApi(`/packages/${id}/related`); }
    catch (error) { return useMockData(mockPackages.filter(p => p.id !== id).slice(0, 4), `getRelatedPackages(${id})`); }
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
    } catch (error) {
        return useMockData(mockItineraries, 'getItineraries');
    }
}

export async function getItineraryById(id: string): Promise<any | null> {
    try {
        const result = await fetchApi(`/itineraries/${id}`);
        if (result) return result;
    } catch (error) {
        const mockItinerary = mockItineraries.find(i => i.id === id);
        if (mockItinerary) return useMockData(mockItinerary, `getItineraryById(${id})`);
        return null;
    }
}

export async function getFeaturedItineraries(): Promise<any[]> {
    try { return await fetchApi('/itineraries/featured'); }
    catch (error) { return useMockData(mockItineraries.filter(i => i.featured), 'getFeaturedItineraries'); }
}

// ─── Creators ───
export async function getCreators(): Promise<any[]> {
    try { return await fetchApi('/creators'); }
    catch (error) { return useMockData(mockCreators, 'getCreators'); }
}

export async function getCreatorById(id: string): Promise<any | null> {
    try {
        const result = await fetchApi(`/creators/${id}`);
        if (result) return result;
    } catch (error) {
        const mockCreator = mockCreators.find(c => c.id === id);
        if (mockCreator) return useMockData(mockCreator, `getCreatorById(${id})`);
        return null;
    }
}

export async function getFeaturedCreators(): Promise<any[]> {
    try {
        const creators = await getCreators();
        return creators.slice(0, 5);
    } catch (error) {
        return useMockData(mockFeaturedCreators(), 'getFeaturedCreators');
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
        return await fetchApi(`/my-trips`);
    } catch (error) {
        // Fallback to local mock data (development only)
        const { upcomingPackages, pastPackages, purchasedItineraries, savedItems } = require('../data/mockMyTrips');
        const mockData = {
            upcomingPackages,
            pastPackages,
            purchasedItineraries,
            savedItems,
        };
        return useMockData(mockData, `getMyTrips(${travelerId})`);
    }
}

// ─── Reviews ────────────────────────────────────────────

async function postApi<T>(endpoint: string, body: object): Promise<T> {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `API Error: ${res.status}`);
    return data;
}

export async function submitItineraryReview(params: {
    travelerId: string;
    itineraryId: string;
    rating: number;
    comment: string;
    photos: string[];
}): Promise<{ review: { id: string; rating: number; comment: string } }> {
    return postApi('/reviews', params);
}

export async function getMyReviews(travelerId: string): Promise<{
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
        return await fetchApi(`/reviews/my?travelerId=${encodeURIComponent(travelerId)}`);
    } catch {
        return { reviews: [] };
    }
}
