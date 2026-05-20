/**
 * Mock data for the "Minhas Viagens" tab.
 * Organized by journey stage: upcoming, past, itineraries, saved.
 */

// ─── Types ──────────────────────────────────────────────

export type BookingStatus = 'confirmed' | 'pending_payment' | 'cancelled' | 'awaiting_quote';
export type SavedItemType = 'package' | 'itinerary';

export interface BookedPackage {
    id: string;
    title: string;
    destination: string;
    country: string;
    image: string;
    travelDate: string;       // ISO date string for the trip start
    travelEndDate: string;    // ISO date string for the trip end
    status: BookingStatus;
    agencyName: string;
    agencyLogo: string;
    price: number;
    currency: string;
    voucherUrl?: string;      // Post-purchase voucher
    eticketUrl?: string;      // Post-purchase e-ticket
    autoMessage?: string;     // Instructions from agency
}

export interface PurchasedItineraryItem {
    id: string;
    title: string;
    destination: string;
    country: string;
    image: string;
    purchaseDate: string;     // ISO date string
    creatorName: string;
    creatorAvatar: string;
    price: number;
    currency: string;
}

export interface SavedItem {
    id: string;
    title: string;
    destination: string;
    country: string;
    image: string;
    type: SavedItemType;
    price: number;
    currency: string;
    savedDate: string;        // ISO date string
}

// ─── Helpers ────────────────────────────────────────────

export function getDaysUntil(dateString: string): number {
    const now = new Date();
    const target = new Date(dateString);
    const diff = target.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function formatMonthYear(dateString: string): string {
    const date = new Date(dateString);
    const months = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
    ];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

// ─── Mock Data ──────────────────────────────────────────

export const upcomingPackages: BookedPackage[] = [];

export const pastPackages: BookedPackage[] = [];

export const purchasedItineraries: PurchasedItineraryItem[] = [];

export const savedItems: SavedItem[] = [];

