/**
 * Rich booking detail data for the Trip Central (Central da Viagem) screen.
 * Provides all information needed for success confirmation + trip dashboard.
 */

// ─── Types ──────────────────────────────────────────────

export type TimelineStepStatus = 'completed' | 'in_progress' | 'pending';

export interface TimelineStep {
    id: string;
    title: string;
    description: string;
    status: TimelineStepStatus;
    icon: string; // Ionicons name
    completedDate?: string;
}

export interface TripDocument {
    id: string;
    title: string;
    description: string;
    icon: string; // Ionicons name
    type: 'voucher' | 'ticket' | 'policy' | 'info';
    available: boolean;
}

export interface TripInclusion {
    id: string;
    icon: string;
    label: string;
    detail: string;
}

export interface PreparationItem {
    id: string;
    icon: string;
    title: string;
    items: string[];
}

export interface ItineraryActivity {
    id: string;
    time: string;
    title: string;
    description: string;
    icon?: string;
    location?: string;
    tips?: string;
    isHighlight?: boolean;
}

export interface ItineraryDay {
    day: number;
    title: string;
    date?: string; // Optional, calculated dynamically usually
    activities: ItineraryActivity[];
}

export type UploadStatus = 'pending' | 'uploading' | 'reviewing' | 'approved' | 'rejected';

export interface RequiredDocItem {
    id: string;
    name: string;      // Ex: "Passaporte", "Visto Americano"
    description: string;
    required: boolean;
}

export interface BookingDetail {
    id: string;
    packageId: string;
    bookingCode: string;
    title: string;
    destination: string;
    country: string;
    image: string;
    travelDate: string;
    travelEndDate: string;
    status: 'confirmed' | 'pending_payment' | 'cancelled';
    agencyName: string;
    agencyLogo: string;
    price: number;
    currency: string;
    travelers: {
        adults: number;
        children: number;
    };
    paymentMethod: string;
    contactName: string;
    contactEmail: string;
    checkedBags: number;
    timeline: TimelineStep[];
    documents: TripDocument[];
    inclusions: TripInclusion[];
    preparation: PreparationItem[];
    detailedItinerary?: ItineraryDay[];
    /** Documents the agency requires the traveler to upload */
    requiredDocuments?: RequiredDocItem[];
}

// ─── Helpers ────────────────────────────────────────────

export function getDaysUntilTrip(dateString: string): number {
    const now = new Date();
    const target = new Date(dateString);
    const diff = target.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function isPostTrip(endDateString: string): boolean {
    return new Date(endDateString) < new Date();
}

export function formatTripDates(start: string, end: string): string {
    const s = new Date(start);
    const e = new Date(end);
    const opts: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short' };
    return `${s.toLocaleDateString('pt-BR', opts)} – ${e.toLocaleDateString('pt-BR', { ...opts, year: 'numeric' })}`;
}

export function formatFullDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    });
}

// ─── Mock Data ──────────────────────────────────────────

export const mockBookings: BookingDetail[] = [];

// ─── Getters ────────────────────────────────────────────

export function getBookingById(id: string): BookingDetail | undefined {
    return undefined;
}

export function getBookingByPackageId(packageId: string): BookingDetail | undefined {
    return undefined;
}
