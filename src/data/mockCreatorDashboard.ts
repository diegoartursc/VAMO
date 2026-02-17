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
        { icon: '🗺️', label: 'Mapa com pontos marcados' },
        { icon: '🚇', label: 'Guia de locomoção local' },
        { icon: '💡', label: 'Dicas exclusivas do criador' },
        { icon: '🍽️', label: 'Restaurantes selecionados' },
        { icon: '💰', label: 'Estimativa de gastos interativa' },
        { icon: '✅', label: 'Checklist de planejamento' },
    ],
};

// Mock dashboard data based on Paris Econômica as the flagship
export const mockCreatorDashboard: CreatorDashboardData = {
    creatorId: 'diego',
    creatorName: 'Diego Artur',
    creatorAvatar: '👨‍✈️',
    totalRevenue: 61626.60,
    totalSales: 1234,
    averageRating: 4.9,
    itineraries: mockPurchasedItineraries.map((itinerary, index) => ({
        itinerary,
        stats: {
            totalSales: index === 0 ? 1234 : index === 1 ? 89 : 0,
            totalRevenue: index === 0 ? 61576.60 : index === 1 ? 5331.10 : 0,
            averageRating: itinerary.rating,
            reviewCount: itinerary.reviewCount,
            viewsLast30Days: index === 0 ? 4567 : index === 1 ? 1234 : 0,
            conversionRate: index === 0 ? 27 : index === 1 ? 7.2 : 0,
        },
        status: 'published' as const,
        lastEditedAt: index === 0 ? '2026-02-15' : '2026-02-10',
    })),
};

export const getCreatorDashboard = (creatorId: string): CreatorDashboardData => {
    return mockCreatorDashboard;
};

export const getCreatorItineraryById = (itineraryId: string): CreatorDashboardItinerary | undefined => {
    return mockCreatorDashboard.itineraries.find(i => i.itinerary.id === itineraryId);
};
