/**
 * Dashboard API utility — connects to VAMO backend
 * Automatically attaches JWT token from auth lib
 */

import { getAuthHeaders } from './auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333/api';

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
            ...options?.headers,
        },
        ...options,
    });
    if (!res.ok) {
        const error = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(error.error || `API Error: ${res.status}`);
    }
    return res.json();
}

// ─── Dashboard Stats ───
export interface DashboardStats {
    totalRevenue: number;
    totalSales: number;
    averageRating: number;
    totalReviews: number;
    activeItineraries: number;
    totalItineraries: number;
    itineraries: DashboardItinerary[];
}

export interface DashboardItinerary {
    id: string;
    title: string;
    destination: string;
    country: string;
    status: string;
    sales: number;
    revenue: number;
    rating: number | null;
    reviewCount: number;
    duration: number;
    price: number;
    updatedAt: string;
}

const MOCK_ITINERARIES: DashboardItinerary[] = [
    { id: "mock-1", title: "[MOCK] Chapada Diamantina — 7 dias", destination: "Lençóis", country: "Brasil", status: "active", sales: 24, revenue: 7176, rating: 4.9, reviewCount: 18, duration: 7, price: 299, updatedAt: new Date().toISOString() },
    { id: "mock-2", title: "[MOCK] Jalapão Selvagem", destination: "Palmas", country: "Brasil", status: "active", sales: 11, revenue: 1650, rating: 4.7, reviewCount: 9, duration: 5, price: 150, updatedAt: new Date(Date.now() - 86400000 * 3).toISOString() },
    { id: "mock-3", title: "[MOCK] Fernando de Noronha — Mergulho", destination: "Fernando de Noronha", country: "Brasil", status: "pending", sales: 0, revenue: 0, rating: null, reviewCount: 0, duration: 6, price: 2500, updatedAt: new Date(Date.now() - 86400000 * 7).toISOString() },
];

/**
 * Helper to safely return mock data with warning
 * In production, always throws error instead
 */
function useMockData<T>(mockData: T, context: string): T {
    if (process.env.NODE_ENV === 'production') {
        throw new Error(`Backend unavailable (${context}). Please try again later.`);
    }
    // Development: warn user about mock data
    console.warn(`⚠️ [API] Backend offline, using MOCK DATA for development (${context})`);
    return mockData;
}

export async function getDashboardStats(creatorId?: string): Promise<DashboardStats> {
    const query = creatorId ? `?creatorId=${creatorId}` : '';
    try {
        const stats = await fetchApi<DashboardStats>(`/itineraries/dashboard/stats${query}`);
        // Return mock data if no itineraries found (for demo/development)
        if (!stats.itineraries || stats.itineraries.length === 0) throw new Error('Empty');
        return stats;
    } catch (error) {
        return useMockData({
            totalRevenue: 13650,
            totalSales: 35,
            averageRating: 4.8,
            totalReviews: 27,
            activeItineraries: 2,
            totalItineraries: 3,
            itineraries: MOCK_ITINERARIES,
        }, 'getDashboardStats');
    }
}

// ─── Itineraries CRUD ───
export async function getItineraries(): Promise<DashboardItinerary[]> {
    const stats = await getDashboardStats();
    return stats.itineraries;
}

export async function getItineraryById(id: string): Promise<any> {
    try {
        return await fetchApi(`/itineraries/${id}`);
    } catch (error) {
        const mockData = MOCK_ITINERARIES.find(i => i.id === id) || MOCK_ITINERARIES[0] || null;
        return useMockData(mockData, `getItineraryById(${id})`);
    }
}

export async function createItinerary(data: any): Promise<any> {
    return fetchApi('/itineraries', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function updateItinerary(id: string, data: any): Promise<any> {
    return fetchApi(`/itineraries/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

export async function deleteItinerary(id: string): Promise<any> {
    return fetchApi(`/itineraries/${id}`, {
        method: 'DELETE',
    });
}

// ─── Packages CRUD ───
const MOCK_PACKAGES: any[] = [
    { id: "pkg-1", title: "[MOCK] Paris Romântica — 10 dias", destination: "Paris", country: "França", duration: 10, status: "ACTIVE", priceMin: 8500, priceMax: 12000, qualityScore: 85, rating: 4.8, reviewCount: 32, recentPurchases: 7 },
    { id: "pkg-2", title: "[MOCK] Japão Completo", destination: "Tóquio", country: "Japão", duration: 15, status: "ACTIVE", priceMin: 14000, priceMax: 18000, qualityScore: 92, rating: 4.9, reviewCount: 19, recentPurchases: 4 },
    { id: "pkg-3", title: "[MOCK] Grécia — Ilhas e Cultura", destination: "Atenas", country: "Grécia", duration: 12, status: "PAUSED", priceMin: 9800, priceMax: 13500, qualityScore: 68, rating: 4.5, reviewCount: 11, recentPurchases: 0 },
];

export async function getPackages(agencyId?: string): Promise<any[]> {
    try {
        // Note: agencyId param is ignored in public API (returns ONLY ACTIVE packages)
        return await fetchApi(`/packages`);
    } catch (error) {
        return useMockData(MOCK_PACKAGES, 'getPackages');
    }
}

export async function getAgencyPackages(agencyId: string): Promise<any[]> {
    try {
        const pkgs = await fetchApi<any[]>(`/packages/dashboard/stats`);
        // Return mock data if no packages found (for demo/development)
        if (!pkgs || pkgs.length === 0) throw new Error('Empty');
        return pkgs;
    } catch (error) {
        return useMockData(MOCK_PACKAGES, `getAgencyPackages(${agencyId})`);
    }
}

export async function getPackageById(id: string): Promise<any> {
    try {
        return await fetchApi(`/packages/${id}`);
    } catch {
        // Try exact match first, then index-based match (for numeric IDs like "1","2","3")
        const pkg = MOCK_PACKAGES.find(p => p.id === id)
            || MOCK_PACKAGES[parseInt(id, 10) - 1]
            || MOCK_PACKAGES[0];
        if (pkg) return pkg;
        throw new Error("Pacote não encontrado");
    }
}

export async function createPackage(data: any): Promise<any> {
    return fetchApi('/packages', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function updatePackage(id: string, data: any): Promise<any> {
    return fetchApi(`/packages/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

export async function deletePackage(id: string): Promise<any> {
    return fetchApi(`/packages/${id}`, {
        method: 'DELETE',
    });
}

// ─── Sales / Purchases ───
export async function getAgencySales(agencyId: string): Promise<any[]> {
    try {
        return await fetchApi(`/sales/${agencyId}`);
    } catch {
        return [];
    }
}

export async function updateSaleDocuments(purchaseId: string, data: { voucherUrl?: string, eticketUrl?: string, autoMessage?: string }): Promise<any> {
    return fetchApi(`/sales/${purchaseId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

// ─── Package Dashboard Stats ───
export interface PackageDashboardStats {
    totalPackages: number;
    activePackages: number;
    totalRevenue: number;
    totalSales: number;
    averageQualityScore: number;
    packages: any[];
}

export async function getPackageDashboardStats(agencyId: string): Promise<PackageDashboardStats> {
    try {
        const stats = await fetchApi<PackageDashboardStats>(`/packages/dashboard/stats`);
        if (!stats.packages || stats.packages.length === 0) throw new Error('Empty');
        return stats;
    } catch (error) {
        return useMockData({
            totalPackages: MOCK_PACKAGES.length,
            activePackages: MOCK_PACKAGES.filter(p => p.status === "ACTIVE").length,
            totalRevenue: 312500,
            totalSales: 11,
            averageQualityScore: 82,
            packages: MOCK_PACKAGES,
        }, `getPackageDashboardStats(${agencyId})`);
    }
}
