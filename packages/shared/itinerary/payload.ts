/**
 * Construção do payload que vai para POST /api/itineraries ou PUT /api/itineraries/:id.
 * O backend (apps/backend/src/routes/itineraries.ts) consome exatamente este formato.
 */

import type { ItineraryFormState } from "./types";

/** Payload mínimo aceito por POST/PUT /api/itineraries. */
export interface ItineraryPayload {
    title: string;
    subtitle?: string;
    destination: string;
    country: string;
    locations: { country: string; cities: string[] }[];
    description: string;
    price: string;
    currency: string;
    duration: string;
    featured: boolean;
    travelStyles: string[];
    categories: string[];
    productType: string;
    activeModules: string[];
    promoPrice?: string;
    installments?: string;
    immediateAccess: boolean;
    lifetimeAccess: boolean;
    offlineDownload: boolean;
    allowPdf: boolean;
    allowShare: boolean;
    highlights: string[];
    inclusions: string[];
    estimatedSpending: { manualEntries: any[] };
    images: string[];
    travelProofUrl: string;
    days: any[];
    accommodations: any[];
    transports: any[];
    checklists: any[];
    flightInfo?: { outbound: any; return: any; tips: string[]; spending?: any; cost?: any };
    restaurants: any[];
    generalTips: string[];
    attractions: any[];
    extraSpendingItems: any[];
    mediaUrls: string[];
    highlightPhotos: string[];
}

export function buildPayload(form: ItineraryFormState): ItineraryPayload {
    const validEntries = form.spendingEntries.filter(e => parseFloat(e.priceValue) > 0);
    const mainCountry     = form.locations[0]?.country   || form.country     || "";
    const mainDestination = form.locations[0]?.cities[0] || form.destination || "";

    const flightHasData = !!(form.flightOutbound.airline || form.flightReturn.airline);

    return {
        title: form.title,
        subtitle: form.subtitle || undefined,
        destination: mainDestination,
        country: mainCountry,
        locations: form.locations,
        description: form.description,
        price: form.price.toString(),
        currency: form.currency,
        duration: form.duration.toString(),
        featured: form.featured,
        travelStyles: form.travelStyles,
        categories: form.categories,
        productType: form.productType,
        activeModules: form.activeModules,
        promoPrice: form.promoPrice ? form.promoPrice.toString() : undefined,
        installments: form.installments ? form.installments.toString() : undefined,
        immediateAccess: form.immediateAccess,
        lifetimeAccess: form.lifetimeAccess,
        offlineDownload: form.offlineDownload,
        allowPdf: form.allowPdf,
        allowShare: form.allowShare,
        highlights: form.highlights.filter(h => h.trim()),
        inclusions: form.inclusions,
        estimatedSpending: { manualEntries: validEntries },
        images: form.images.filter(Boolean),
        travelProofUrl: form.travelProofUrl,
        days: form.days.map((d, i) => ({ ...d, dayNumber: i + 1 })),
        accommodations: form.accommodations,
        transports: form.transports,
        checklists: form.checklistItems,
        flightInfo: flightHasData ? {
            outbound: form.flightOutbound,
            return:   form.flightReturn,
            tips:     form.flightTips.filter(t => t.trim()),
            spending: form.flightSpending,
            cost:     form.flightCost,
        } : undefined,
        restaurants: form.restaurants
            .filter(r => r.name.trim())
            .map(r => ({ ...r, hours: [r.hoursStart].filter(Boolean).join(" – ") || r.hours })),
        generalTips: form.generalTips.filter(t => t.trim()),
        attractions: form.attractions.filter(a => a.name.trim()),
        extraSpendingItems: form.extraSpendingItems.filter(e => e.title?.trim()),
        mediaUrls: form.mediaUrls.filter(Boolean),
        highlightPhotos: form.highlightPhotos.filter(Boolean),
    };
}
