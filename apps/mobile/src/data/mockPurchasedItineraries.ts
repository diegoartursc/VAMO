import { Itinerary } from './mockItineraries';

export interface DayActivity {
    id: string;
    time: string;
    duration: string;
    title: string;
    location: string;
    description: string;
    images: string[];
    tips: string[];
    mapLink?: string;
    completed?: boolean;
    notes?: string;
    type: 'transport' | 'activity' | 'meal' | 'rest';
    icon: string;
}

export interface ItineraryDay {
    dayNumber: number;
    date?: string;
    title: string;
    summary: string;
    activities: DayActivity[];
    estimatedCost?: {
        min: number;
        max: number;
        currency: string;
    };
}

export interface AccommodationInfo {
    name: string;
    address: string;
    phone: string;
    checkIn: string;
    checkOut: string;
    confirmationNumber?: string;
    mapLink?: string;
    images: string[];
}

export interface EmergencyContact {
    type: string;
    name: string;
    phone: string;
    available: string;
}

export interface ChecklistItem {
    id: string;
    category: 'documents' | 'packing' | 'pre-trip' | 'custom';
    text: string;
    completed: boolean;
}

export interface SpendingProfile {
    id: 'economico' | 'conforto' | 'luxo';
    label: string;
    icon: string;
    dailyCost: number; // base cost per person per day in AUD
    breakdown: {
        category: string;
        amount: number;
    }[];
}

export interface TransportItem {
    description: string;
    passTypes?: string;
    priceValue?: string;
    priceCurrency?: string;
    notes?: string;
}

export interface TransportInfo {
    items: TransportItem[];
}

export interface FlightLeg {
    airline: string;
    originCity?: string;
    originAirport: string;
    destinationAirport: string;
    departureDate?: string;
    arrivalDate?: string;
    stops: number;
}

export interface FlightInfo {
    outbound: FlightLeg;
    return: FlightLeg;
    totalPrice?: string;
    priceCurrency?: string;
    tips: string[];
}

export interface AccommodationOption {
    id: string;
    name: string;
    priceRange: string;
    priceCurrency?: string;
    location: string;
    address?: string;
    mapLink?: string;
    description: string;
    rating?: number;
    externalLink?: string;
    tips?: string;
}

export interface RestaurantInfo {
    name: string;
    cuisine: string;
    location: string;
    description: string;
    priceRange?: string;
    priceCurrency?: string;
    hours?: string;
    externalLink?: string;
    tips?: string;
}

export interface AttractionInfo {
    name: string;
    type: string;
    location: string;
    mapLink?: string;
    description: string;
    ticketPrice?: string;
    ticketCurrency?: string;
    hours?: string;
    duration?: string;
    externalLink?: string;
    tips?: string;
}

export interface ReceiveItem {
    icon: string;
    label: string;
}

export interface PurchasedItinerary extends Itinerary {
    purchaseDate: string;
    tripStartDate: string;
    tripEndDate: string;
    days: ItineraryDay[];
    accommodation?: AccommodationInfo[];
    emergencyContacts: EmergencyContact[];
    checklist: ChecklistItem[];
    importantInfo: string[];
    weatherInfo?: {
        temperature: string;
        conditions: string;
        recommendation: string;
    };
    spendingProfile?: SpendingProfile;
    transport?: TransportInfo;
    flightInfo?: FlightInfo;
    accommodationOptions?: AccommodationOption[];
    receiveList?: ReceiveItem[];
    restaurants?: RestaurantInfo[];
    generalTips?: string[];
    attractions?: AttractionInfo[];
}

export const mockPurchasedItineraries: PurchasedItinerary[] = [];

export const getPurchasedItineraryById = (id: string): PurchasedItinerary | undefined => {
    return undefined;
};

export const getAllPurchasedItineraries = (): PurchasedItinerary[] => {
    return [];
};
