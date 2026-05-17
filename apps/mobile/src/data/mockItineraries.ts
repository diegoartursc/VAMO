import { Creator } from '../types/creator';

export interface Itinerary {
    id: string;
    title: string;
    destination: string;
    country: string;
    creator: {
        id: string;
        name: string;
        avatar: string;
        verificationLevel: 'basic' | 'trusted' | 'expert' | 'ambassador';
        rating: number;
        salesCount: number;
    };
    description: string;
    price: number;
    currency: string;
    images: string[];
    rating: number;
    reviewCount: number;
    inclusions: string[];
    duration: number;
    featured: boolean;
    // Campos para filtros de busca
    categories?: string[];
    travelStyles?: string[];
    highlights?: string[];
    estimatedSpending?: {
        min: number;
        max: number;
        currency: string;
        flightDeparture?: string;
        breakdown?: {
            category: string;
            amount: string;
            description: string;
        }[];
    };
}


export const mockItineraries: Itinerary[] = [];

// Calculate relevance score (same formula as packages)
export const calculateRelevance = (rating: number, reviewCount: number): number => {
    return rating * Math.log(reviewCount + 1);
};

export const getItinerariesByRelevance = (): Itinerary[] => {
    return [];
};

export const getFeaturedItineraries = (): Itinerary[] => [];

export const getItineraryById = (id: string): Itinerary | undefined => undefined;
