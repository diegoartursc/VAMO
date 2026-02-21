/**
 * Dashboard API utility — connects to VAMO backend
 * Automatically attaches JWT token from auth lib
 */

import { getAuthHeaders } from './auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

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

export async function getDashboardStats(creatorId?: string): Promise<DashboardStats> {
    const query = creatorId ? `?creatorId=${creatorId}` : '';
    return fetchApi(`/itineraries/dashboard/stats${query}`);
}

// ─── Itineraries CRUD ───
export async function getItineraries(): Promise<DashboardItinerary[]> {
    const stats = await getDashboardStats();
    return stats.itineraries;
}

export async function getItineraryById(id: string): Promise<any> {
    return fetchApi(`/itineraries/${id}`);
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
export async function getPackages(agencyId?: string): Promise<any[]> {
    const query = agencyId ? `?agencyId=${agencyId}` : '';
    return fetchApi(`/packages${query}`);
}

export async function getAgencyPackages(agencyId: string): Promise<any[]> {
    return fetchApi(`/packages?agencyId=${agencyId}`);
}

export async function getPackageById(id: string): Promise<any> {
    return fetchApi(`/packages/${id}`);
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
    return fetchApi(`/packages/dashboard/stats?agencyId=${agencyId}`);
}
