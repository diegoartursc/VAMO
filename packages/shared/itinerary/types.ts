/**
 * Tipos canônicos para criação/edição de roteiro.
 * Espelham o schema Prisma em apps/backend/prisma/schema.prisma.
 */

export type Currency = "BRL" | "USD" | "EUR" | "GBP";
export type ProductType = "DIGITAL" | "PHYSICAL" | "HIBRIDO";
export type ItineraryStatus =
    | "DRAFT"
    | "PENDING_REVIEW"
    | "ACTIVE"
    | "REJECTED";

export type ModuleKey =
    | "itinerario"
    | "voo"
    | "hospedagem"
    | "passeios"
    | "transporte"
    | "dicas"
    | "restaurantes"
    | "checklist"
    | "gasto";

export interface Activity {
    title: string;
    description: string;
    time: string;
    duration: string;
    location: string;
    mapLink?: string;
    type: string;          // 'transport' | 'activity' | 'meal' | 'rest'
    icon: string;
    tips: string;
    category: string;
}

export interface Day {
    dayNumber: number;
    title: string;
    summary: string;
    description: string;
    activities: Activity[];
}

export interface Accommodation {
    name: string;
    address: string;
    mapLink: string;
    description: string;
    nights: string;
    rating: string;
    externalLink: string;
    tips: string;
    startDate: string;
    endDate: string;
}

export interface Transport {
    description: string;
    passTypes: string;
    notes: string;
    startDate: string;
    endDate: string;
}

export interface ChecklistItem {
    category: string;
    item: string;
    isDefault: boolean;
}

export interface BreakdownItem {
    category: string;
    min: string;
    max: string;
    currency: string;
}

export interface RestaurantItem {
    name: string;
    cuisine: string;
    location: string;
    description: string;
    hours: string;
    hoursStart: string;
    externalLink: string;
    tips: string;
    startDate: string;
    endDate: string;
}

export interface AttractionItem {
    name: string;
    type: string;
    location: string;
    mapLink: string;
    description: string;
    hours: string;
    duration: string;
    externalLink: string;
    tips: string;
    startDate: string;
    endDate: string;
    price?: string;
}

export interface SpendingEntry {
    moduleKey: string;
    label: string;
    icon: string;
    priceValue: string;
    priceCurrency: string;
    receiptUrl: string;
    originCity?: string;
}

export interface FlightLeg {
    airline: string;
    originCity: string;
    originAirport: string;
    destinationAirport: string;
    departureDate: string;
    arrivalDate: string;
    stops: number;
}

export interface FlightInfo {
    outbound: FlightLeg;
    return: FlightLeg;
    tips: string[];
}

export interface LocationGroup {
    country: string;
    cities: string[];
}

/** Estado completo do formulário de criação/edição. */
export interface ItineraryFormState {
    id?: string;
    // Identidade
    title: string;
    subtitle: string;
    locations: LocationGroup[];
    destination: string;            // legacy/derived
    country: string;                // legacy/derived
    description: string;
    duration: number;
    travelStyles: string[];         // max 3
    categories: string[];           // min 1, max 5
    travelProofUrl: string;
    // Comercial
    price: number;
    currency: Currency;
    promoPrice?: number;
    installments?: number;
    immediateAccess: boolean;
    lifetimeAccess: boolean;
    offlineDownload: boolean;
    allowPdf: boolean;
    allowShare: boolean;
    productType: ProductType;
    featured: boolean;
    // Módulos
    activeModules: ModuleKey[];
    // Conteúdo
    highlights: string[];           // texto curto
    inclusions: string[];
    days: Day[];
    accommodations: Accommodation[];
    transports: Transport[];
    attractions: AttractionItem[];
    restaurants: RestaurantItem[];
    checklistItems: ChecklistItem[];
    generalTips: string[];
    spendingEntries: SpendingEntry[];
    flightOutbound: FlightLeg;
    flightReturn: FlightLeg;
    flightTips: string[];
    // Mídia
    images: string[];               // galeria
    mediaUrls: string[];            // fotos/vídeos extras
    highlightPhotos: string[];      // 3 fotos de capa
}

export const EMPTY_FLIGHT_LEG: FlightLeg = {
    airline: "",
    originCity: "",
    originAirport: "",
    destinationAirport: "",
    departureDate: "",
    arrivalDate: "",
    stops: 0,
};

export function createEmptyForm(): ItineraryFormState {
    return {
        title: "",
        subtitle: "",
        locations: [{ country: "", cities: [""] }],
        destination: "",
        country: "",
        description: "",
        duration: 3,
        travelStyles: [],
        categories: [],
        travelProofUrl: "",
        price: 0,
        currency: "BRL",
        immediateAccess: true,
        lifetimeAccess: true,
        offlineDownload: true,
        allowPdf: false,
        allowShare: true,
        productType: "DIGITAL",
        featured: false,
        activeModules: ["itinerario"],
        highlights: [],
        inclusions: [
            "Roteiro completo dia a dia",
            "Dicas exclusivas do criador",
            "Estimativa de gastos",
        ],
        days: [],
        accommodations: [],
        transports: [],
        attractions: [],
        restaurants: [],
        checklistItems: [],
        generalTips: [],
        spendingEntries: [],
        flightOutbound: { ...EMPTY_FLIGHT_LEG },
        flightReturn: { ...EMPTY_FLIGHT_LEG },
        flightTips: [],
        images: [],
        mediaUrls: [],
        highlightPhotos: [],
    };
}
