/**
 * Dashboard API utility — connects to VAMO backend
 * Automatically attaches JWT token from auth lib
 */

import { getAuthHeaders } from './auth';
import { convertHeicIfNeeded } from './heicSupport';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333/api';

function friendlyUploadError(status: number, fallback?: string): string {
    if (status === 401) return 'Sua sessão expirou. Faça login novamente.';
    if (status === 403) return 'Você não tem permissão para enviar este arquivo.';
    if (status === 413) return 'Esse arquivo é muito grande. Tente enviar uma versão menor.';
    if (status === 415) return 'Esse formato não é aceito neste campo.';
    return fallback || 'Não foi possível enviar o arquivo. Verifique sua conexão e tente novamente.';
}

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

// ─── Uploads ───
// HEIC/HEIF (formato de fotos do iPhone) é convertido para JPEG no client
// antes do envio sempre que possível — previews e admin funcionam em
// qualquer navegador. Se a conversão falhar, o HEIC bruto é enviado e
// o backend aceita (ver allow-list em apps/backend/src/routes/uploads.ts).
export async function uploadFile(file: File): Promise<string> {
    const prepared = await convertHeicIfNeeded(file);
    const fd = new FormData();
    fd.append('file', prepared);
    const res = await fetch(`${API_BASE_URL}/uploads`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: fd,
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Falha no upload' }));
        throw new Error(friendlyUploadError(res.status, err.error));
    }
    const data = await res.json();
    return data.url as string;
}

export async function uploadFiles(files: File[]): Promise<string[]> {
    const prepared = await Promise.all(files.map(f => convertHeicIfNeeded(f)));
    const fd = new FormData();
    prepared.forEach(f => fd.append('files', f));
    const res = await fetch(`${API_BASE_URL}/uploads/multiple`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: fd,
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Falha no upload' }));
        throw new Error(friendlyUploadError(res.status, err.error));
    }
    const data = await res.json();
    return (data.urls || []) as string[];
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
    try {
        const stats = await fetchApi<DashboardStats>(`/itineraries/dashboard/stats${query}`);
        return {
            ...stats,
            itineraries: stats.itineraries || [],
        };
    } catch (error) {
        throw error;
    }
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
    try {
        return await fetchApi(`/packages`);
    } catch {
        return [];
    }
}

export async function getAgencyPackages(agencyId: string): Promise<any[]> {
    try {
        return await fetchApi<any[]>(`/packages/dashboard/stats`) || [];
    } catch {
        return [];
    }
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
        return { ...stats, packages: stats.packages || [] };
    } catch {
        return { totalPackages: 0, activePackages: 0, totalRevenue: 0, totalSales: 0, averageQualityScore: 0, packages: [] };
    }
}
