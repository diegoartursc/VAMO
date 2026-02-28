/**
 * Mock data for the "Minhas Viagens" tab.
 * Organized by journey stage: upcoming, past, itineraries, saved.
 */

// ─── Types ──────────────────────────────────────────────

export type BookingStatus = 'confirmed' | 'pending_payment' | 'cancelled';
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

export const upcomingPackages: BookedPackage[] = [
    {
        id: 'purch-1',
        title: 'Paris Romântica - 7 Dias Inesquecíveis',
        destination: 'Paris',
        country: 'França',
        image: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=1600',
        travelDate: '2026-03-15',
        travelEndDate: '2026-03-22',
        status: 'confirmed',
        agencyName: 'CVC',
        agencyLogo: '🏖️',
        price: 8500,
        currency: 'BRL',
    },
    {
        id: 'purch-2',
        title: 'Caribe All Inclusive - Cancún',
        destination: 'Cancún',
        country: 'México',
        image: 'https://images.unsplash.com/photo-1568402102990-bc541580b59f?w=1600',
        travelDate: '2026-07-10',
        travelEndDate: '2026-07-15',
        status: 'confirmed',
        agencyName: 'Decolar',
        agencyLogo: '✈️',
        price: 6500,
        currency: 'BRL',
    },
    {
        id: 'purch-3',
        title: 'Dubai Luxo e Tradição',
        destination: 'Dubai',
        country: 'Emirados Árabes',
        image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1600',
        travelDate: '2026-12-20',
        travelEndDate: '2026-12-27',
        status: 'pending_payment',
        agencyName: 'Azul Viagens',
        agencyLogo: '🛫',
        price: 10000,
        currency: 'BRL',
    },
];

export const pastPackages: BookedPackage[] = [
    {
        id: 'purch-past-1',
        title: 'Patagônia Argentina Aventura',
        destination: 'El Calafate',
        country: 'Argentina',
        image: 'https://images.unsplash.com/photo-1531065208531-4036c0dba3ca?w=1600',
        travelDate: '2025-09-05',
        travelEndDate: '2025-09-13',
        status: 'confirmed',
        agencyName: 'CVC',
        agencyLogo: '🏖️',
        price: 8000,
        currency: 'BRL',
    },
    {
        id: 'purch-past-2',
        title: 'Europa Clássica - 15 Dias',
        destination: 'Multi-destinos',
        country: 'Europa',
        image: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=1600',
        travelDate: '2025-06-01',
        travelEndDate: '2025-06-16',
        status: 'confirmed',
        agencyName: 'CVC',
        agencyLogo: '🏖️',
        price: 15000,
        currency: 'BRL',
    },
];

export const purchasedItineraries: PurchasedItineraryItem[] = [
    {
        id: 'itin-1',
        title: 'Paris Econômica - 10 dias por R$ 6.000',
        destination: 'Paris',
        country: 'França',
        image: 'https://images.unsplash.com/photo-1543349689-9a4d426bee8e?w=1600',
        purchaseDate: '2026-01-15',
        creatorName: 'Diego Artur',
        creatorAvatar: '👨‍✈️',
        price: 49.90,
        currency: 'BRL',
    },
    {
        id: 'itin-2',
        title: 'Tóquio Autêntica - 15 dias de Cultura',
        destination: 'Tóquio',
        country: 'Japão',
        image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1600',
        purchaseDate: '2026-02-01',
        creatorName: 'Mariana Silva',
        creatorAvatar: '👩‍🦰',
        price: 79.90,
        currency: 'BRL',
    },
];

export const savedItems: SavedItem[] = [
    {
        id: 'pkg-5',
        title: 'Nova York - A Cidade que Nunca Dorme',
        destination: 'Nova York',
        country: 'Estados Unidos',
        image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1600',
        type: 'package',
        price: 7500,
        currency: 'BRL',
        savedDate: '2026-02-20',
    },
    {
        id: 'itin-5',
        title: 'Barcelona e Praias - 12 dias de Sol',
        destination: 'Barcelona',
        country: 'Espanha',
        image: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=1600',
        type: 'itinerary',
        price: 69.90,
        currency: 'BRL',
        savedDate: '2026-02-21',
    },
];

