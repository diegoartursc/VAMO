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
    { id: "mock-1", title: "Chapada Diamantina — 7 dias", destination: "Lençóis", country: "Brasil", status: "active", sales: 24, revenue: 7176, rating: 4.9, reviewCount: 18, duration: 7, price: 299, updatedAt: new Date().toISOString() },
    { id: "mock-2", title: "Jalapão Selvagem", destination: "Palmas", country: "Brasil", status: "active", sales: 11, revenue: 1650, rating: 4.7, reviewCount: 9, duration: 5, price: 150, updatedAt: new Date(Date.now() - 86400000 * 3).toISOString() },
    { id: "mock-3", title: "Fernando de Noronha — Mergulho", destination: "Fernando de Noronha", country: "Brasil", status: "pending", sales: 0, revenue: 0, rating: null, reviewCount: 0, duration: 6, price: 2500, updatedAt: new Date(Date.now() - 86400000 * 7).toISOString() },
];

export async function getDashboardStats(creatorId?: string): Promise<DashboardStats> {
    const query = creatorId ? `?creatorId=${creatorId}` : '';
    try {
        return await fetchApi(`/itineraries/dashboard/stats${query}`);
    } catch {
        return {
            totalRevenue: 13650,
            totalSales: 35,
            averageRating: 4.8,
            totalReviews: 27,
            activeItineraries: 2,
            totalItineraries: 3,
            itineraries: MOCK_ITINERARIES,
        };
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
    } catch {
        return MOCK_ITINERARIES.find(i => i.id === id) || MOCK_ITINERARIES[0] || null;
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
    { id: "pkg-1", title: "Paris Romântica — 10 dias", destination: "Paris", country: "França", duration: 10, status: "ACTIVE", priceMin: 8500, priceMax: 12000, qualityScore: 85, rating: 4.8, reviewCount: 32, recentPurchases: 7 },
    { id: "pkg-2", title: "Japão Completo", destination: "Tóquio", country: "Japão", duration: 15, status: "ACTIVE", priceMin: 14000, priceMax: 18000, qualityScore: 92, rating: 4.9, reviewCount: 19, recentPurchases: 4 },
    { id: "pkg-3", title: "Grécia — Ilhas e Cultura", destination: "Atenas", country: "Grécia", duration: 12, status: "PAUSED", priceMin: 9800, priceMax: 13500, qualityScore: 68, rating: 4.5, reviewCount: 11, recentPurchases: 0 },
];

export async function getPackages(agencyId?: string): Promise<any[]> {
    const query = agencyId ? `?agencyId=${agencyId}` : '';
    try {
        return await fetchApi(`/packages${query}`);
    } catch {
        return MOCK_PACKAGES;
    }
}

export async function getAgencyPackages(agencyId: string): Promise<any[]> {
    try {
        return await fetchApi(`/packages?agencyId=${agencyId}`);
    } catch {
        return MOCK_PACKAGES;
    }
}

export async function getPackageById(id: string): Promise<any> {
    try {
        return await fetchApi(`/packages/${id}`);
    } catch {
        const pkg = MOCK_PACKAGES.find(p => p.id === id);
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
        return await fetchApi(`/packages/dashboard/stats?agencyId=${agencyId}`);
    } catch {
        return {
            totalPackages: MOCK_PACKAGES.length,
            activePackages: MOCK_PACKAGES.filter(p => p.status === "ACTIVE").length,
            totalRevenue: 312500,
            totalSales: 11,
            averageQualityScore: 82,
            packages: MOCK_PACKAGES,
        };
    }
}
