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
        id: 'pkg-1',
        title: 'Paris Romântica',
        destination: 'Paris',
        country: 'França',
        image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1600',
        travelDate: '2026-03-15',
        travelEndDate: '2026-03-22',
        status: 'confirmed',
        agencyName: 'CVC',
        agencyLogo: '🏖️',
        price: 8500,
        currency: 'BRL',
    },
    {
        id: 'pkg-2',
        title: 'Caribe All Inclusive',
        destination: 'Cancún',
        country: 'México',
        image: 'https://images.unsplash.com/photo-1568402102990-bc541580b59f?w=1600',
        travelDate: '2026-07-10',
        travelEndDate: '2026-07-17',
        status: 'confirmed',
        agencyName: 'Decolar',
        agencyLogo: '✈️',
        price: 6500,
        currency: 'BRL',
    },
    {
        id: 'pkg-3',
        title: 'Maldivas Luxo',
        destination: 'Malé',
        country: 'Maldivas',
        image: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1600',
        travelDate: '2026-12-20',
        travelEndDate: '2026-12-30',
        status: 'pending_payment',
        agencyName: 'Hurb',
        agencyLogo: '🌴',
        price: 22000,
        currency: 'BRL',
    },
];

export const pastPackages: BookedPackage[] = [
    {
        id: 'pkg-past-1',
        title: 'Toscana & Amalfi',
        destination: 'Roma',
        country: 'Itália',
        image: 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=1600',
        travelDate: '2025-09-05',
        travelEndDate: '2025-09-15',
        status: 'confirmed',
        agencyName: 'CVC',
        agencyLogo: '🏖️',
        price: 12000,
        currency: 'BRL',
    },
    {
        id: 'pkg-past-2',
        title: 'Patagônia Aventura',
        destination: 'El Calafate',
        country: 'Argentina',
        image: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1600',
        travelDate: '2025-06-12',
        travelEndDate: '2025-06-20',
        status: 'confirmed',
        agencyName: 'Azul Viagens',
        agencyLogo: '🛫',
        price: 7800,
        currency: 'BRL',
    },
    {
        id: 'pkg-past-3',
        title: 'Lisboa e Porto',
        destination: 'Lisboa',
        country: 'Portugal',
        image: 'https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=1600',
        travelDate: '2025-01-20',
        travelEndDate: '2025-01-28',
        status: 'confirmed',
        agencyName: 'Decolar',
        agencyLogo: '✈️',
        price: 9200,
        currency: 'BRL',
    },
];

export const purchasedItineraries: PurchasedItineraryItem[] = [
    {
        id: '1',
        title: 'Paris Econômica - 10 dias',
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
        id: '2',
        title: 'Tóquio Completo - 14 dias',
        destination: 'Tóquio',
        country: 'Japão',
        image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1600',
        purchaseDate: '2026-02-01',
        creatorName: 'Ana Viajante',
        creatorAvatar: '🌸',
        price: 59.90,
        currency: 'BRL',
    },
    {
        id: '3',
        title: 'Bali & Tailândia - 21 dias',
        destination: 'Bali',
        country: 'Indonésia',
        image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1600',
        purchaseDate: '2026-02-10',
        creatorName: 'Marco Explorer',
        creatorAvatar: '🧭',
        price: 69.90,
        currency: 'BRL',
    },
];

export const savedItems: SavedItem[] = [
    {
        id: 'saved-1',
        title: 'Europa Clássica - 15 Dias',
        destination: 'Multi-destinos',
        country: 'Europa',
        image: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=1600',
        type: 'package',
        price: 15000,
        currency: 'BRL',
        savedDate: '2026-02-12',
    },
    {
        id: 'saved-2',
        title: 'Dubai Luxo',
        destination: 'Dubai',
        country: 'EAU',
        image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1600',
        type: 'package',
        price: 9500,
        currency: 'BRL',
        savedDate: '2026-02-10',
    },
    {
        id: 'saved-3',
        title: 'Nova York Econômica - 7 dias',
        destination: 'Nova York',
        country: 'EUA',
        image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1600',
        type: 'itinerary',
        price: 39.90,
        currency: 'BRL',
        savedDate: '2026-02-08',
    },
    {
        id: 'saved-4',
        title: 'Machu Picchu',
        destination: 'Cusco',
        country: 'Peru',
        image: 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=1600',
        type: 'package',
        price: 5500,
        currency: 'BRL',
        savedDate: '2026-02-05',
    },
    {
        id: 'saved-5',
        title: 'Grécia Completa - 12 dias',
        destination: 'Atenas',
        country: 'Grécia',
        image: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=1600',
        type: 'itinerary',
        price: 44.90,
        currency: 'BRL',
        savedDate: '2026-01-28',
    },
];
