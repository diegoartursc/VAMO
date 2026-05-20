/**
 * Mock data for Creator Dashboard
 * Initializes from mockPurchasedItineraries with added revenue/sales metrics
 */

import { PurchasedItinerary, mockPurchasedItineraries } from './mockPurchasedItineraries';

export interface CreatorItineraryStats {
    totalSales: number;
    totalRevenue: number;      // in BRL
    averageRating: number;
    reviewCount: number;
    viewsLast30Days: number;
    conversionRate: number;    // percentage
}

export interface CreatorDashboardItinerary {
    itinerary: PurchasedItinerary;
    stats: CreatorItineraryStats;
    status: 'published' | 'draft' | 'paused';
    lastEditedAt: string;
}

export interface CreatorDashboardData {
    creatorId: string;
    creatorName: string;
    creatorAvatar: string;
    totalRevenue: number;
    totalSales: number;
    averageRating: number;
    itineraries: CreatorDashboardItinerary[];
}

// Template vazio para novo roteiro
export const EMPTY_ITINERARY_TEMPLATE: PurchasedItinerary = {
    id: '',
    title: '',
    destination: '',
    country: '',
    creator: {
        id: 'diego',
        name: 'Diego Artur',
        avatar: '👨‍✈️',
        verificationLevel: 'ambassador',
        rating: 4.9,
        salesCount: 1234,
    },
    description: '',
    price: 0,
    currency: 'BRL',
    images: [],
    rating: 0,
    reviewCount: 0,
    inclusions: ['Planilha', 'Mapa'],
    duration: 1,
    featured: false,
    purchaseDate: '',
    tripStartDate: '',
    tripEndDate: '',
    days: [],
    emergencyContacts: [],
    checklist: [],
    importantInfo: [],
    highlights: [],
    receiveList: [
        { icon: '📋', label: 'Itinerário completo dia a dia' },
        { icon: '🏨', label: 'Hospedagens recomendadas por faixa' },
        { icon: '🚇', label: 'Guia de locomoção local' },
        { icon: '💡', label: 'Dicas exclusivas do criador' },
        { icon: '🍽️', label: 'Restaurantes selecionados' },
        { icon: '💰', label: 'Estimativa de gastos interativa' },
        { icon: '✅', label: 'Checklist de planejamento' },
    ],
};

export const mockCreatorDashboard: CreatorDashboardData = {
    creatorId: '',
    creatorName: '',
    creatorAvatar: '',
    totalRevenue: 0,
    totalSales: 0,
    averageRating: 0,
    itineraries: [],
};

export const getCreatorDashboard = (creatorId: string): CreatorDashboardData => mockCreatorDashboard;

export const getCreatorItineraryById = (itineraryId: string): CreatorDashboardItinerary | undefined => undefined;
