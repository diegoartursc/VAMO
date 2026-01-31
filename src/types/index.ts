export interface Agency {
    id: string;
    name: string;
    logo: string;
    verified: boolean;
    contactUrl: string;
    whatsapp?: string;
}

export interface Package {
    id: string;
    title: string;
    destination: string;
    country: string;
    agency: Agency;
    price: {
        min: number;
        max: number;
        currency: 'BRL';
    };
    images: string[];
    duration: number; // days
    includes: string[];
    rating: number;
    reviewCount: number;
    featured: boolean;
    description: string;
    highlights: string[];
    badge?: 'bestseller' | 'flash' | 'luxury' | 'value' | 'verified' | 'new' | 'featured';
    inclusions?: {
        flight: boolean;
        hotel: { stars: number; meals: string[] };
        tours: string[];
        extras: string[];
    };
    categories?: string[];
    // Trust & Conversion Badges
    hasFreeCancellation?: boolean;
    isAllInclusive?: boolean;
    recentPurchases?: number; // How many sold recently
    priceComparison?: 'below' | 'average' | 'above'; // Compared to market
    priceDiscount?: number; // Percentage below average
    itinerary?: {
        mainStop: string;
        pickupLocations: string[];
        transport: {
            type: string;
            duration: string;
        };
        mainActivity: {
            location: string;
            activity: string;
            duration: string;
        };
        returnLocations: string[];
        mapImageUrl?: string;
    };
}

export interface User {
    id: string;
    name: string;
    avatar?: string;
    verified: boolean;
    bio?: string;
    tripsCount?: number;
}

export interface ItineraryFile {
    id: string;
    name: string;
    type: 'pdf' | 'spreadsheet' | 'document';
    url: string;
    size: number; // bytes
}

export interface Itinerary {
    id: string;
    title: string;
    destination: string;
    country: string;
    author: User;
    price: number;
    images: string[];
    duration: number;
    downloadCount: number;
    rating: number;
    reviewCount: number;
    files: ItineraryFile[];
    description: string;
    highlights: string[];
    includes: string[];
}

export interface Review {
    id: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    rating: number;
    comment: string;
    date: string;
    images?: string[];
    helpful: number;
}

export interface SearchFilters {
    destination?: string;
    startDate?: Date;
    endDate?: Date;
    travelers?: number;
    minPrice?: number;
    maxPrice?: number;
    agencies?: string[];
    rating?: number;
}

export type CategoryType = 'estadias' | 'voos' | 'carros' | 'pacotes';
