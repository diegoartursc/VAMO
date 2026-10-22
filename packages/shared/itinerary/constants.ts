/**
 * Constantes canônicas usadas no formulário de criação de roteiro.
 * Espelha o que existe em apps/site/src/app/dashboard/roteiro/[id]/page.tsx.
 */

import type { ModuleKey, Currency } from "./types";
import { BASE_CURRENCY } from "./market";

/**
 * Estilo de orçamento do roteiro — ESCOLHA ÚNICA entre Econômico, Moderado e
 * Luxo (mutuamente excludentes). Armazenado em `travelStyles[]` por compat de
 * schema, mas só UMA destas keys deve estar presente.
 *
 * NÃO confundir com categorias temáticas (cultura/gastronomia/...). As keys
 * "economico"/"moderado"/"luxo" são imutáveis — não renomear.
 */
export const STYLE_OPTIONS: { key: string; label: string }[] = [
    { key: "economico", label: "Budget" },
    { key: "moderado",  label: "Moderate" },
    { key: "luxo",      label: "Luxury" },
];

/** Keys canônicas de estilo de orçamento (escolha única). */
export const BUDGET_STYLE_KEYS = ["economico", "moderado", "luxo"] as const;
export type BudgetStyleKey = (typeof BUDGET_STYLE_KEYS)[number];

export interface BudgetStyleGuideEntry {
    key: BudgetStyleKey;
    label: string;
    /** Resumo de 1 linha (chips/preview). */
    shortDescription: string;
    /** Texto oficial mostrado ao VIAJANTE no detalhe do roteiro. */
    buyerDescription: string;
    /** Dica curta mostrada ao ROTEIRISTA após selecionar a opção. */
    creatorHint: string;
    /** Critérios detalhados (lista do modal de ajuda). */
    criteria: string[];
}

/**
 * Critérios oficiais da VAMO para classificar o estilo de orçamento.
 * Fonte única — criação (mobile/web), preview, detalhe e ajuda leem daqui.
 */
export const BUDGET_STYLE_GUIDE: Record<BudgetStyleKey, BudgetStyleGuideEntry> = {
    economico: {
        key: "economico",
        label: "Budget",
        shortDescription: "Spend less, with simpler options.",
        buyerDescription:
            "An itinerary designed to spend less, using simple lodging, affordable transportation and good-value attractions.",
        creatorHint:
            "Choose Budget when the itinerary prioritizes saving money: simple lodging, cheap transportation and free or affordable attractions.",
        criteria: [
            "Simple lodging, hostels, basic inns or budget accommodation",
            "Public transit, walking, buses or regular trains",
            "Simple meals, grocery stores, street food or affordable restaurants",
            "Many free or low-cost activities",
            "More focus on saving money than on convenience",
        ],
    },
    moderado: {
        key: "moderado",
        label: "Moderate",
        shortDescription: "A balance of comfort, location and value.",
        buyerDescription:
            "A balanced itinerary with good comfort, convenient locations and controlled spending.",
        creatorHint:
            "Choose Moderate when the itinerary balances comfort, good locations, paid activities and controlled spending.",
        criteria: [
            "3-star hotels, comfortable apartments or good inns",
            "A mix of public transit, rideshare, taxis or occasional rentals",
            "Casual restaurants and a few better dining experiences",
            "Worthwhile paid activities, without too many expensive experiences",
            "A good overall experience balancing price and comfort",
        ],
    },
    luxo: {
        key: "luxo",
        label: "Luxury",
        shortDescription: "High comfort, convenience and premium experiences.",
        buyerDescription:
            "An itinerary with a high standard of comfort, upscale lodging, premium experiences and maximum convenience.",
        creatorHint:
            "Choose Luxury when the itinerary includes high comfort, premium experiences, convenient transportation and less focus on saving money.",
        criteria: [
            "4- or 5-star hotels, resorts, villas or premium boutique lodging",
            "Private transfers, a driver, frequent taxis or upgraded transportation",
            "Upscale restaurants, rooftops or standout dining experiences",
            "Private tours, premium tours, spas, beach clubs or exclusive experiences",
            "More focus on comfort, time and convenience than on saving money",
        ],
    },
};

/** Nota geral mostrada nos modais de ajuda (criação e detalhe). */
export const BUDGET_STYLE_GENERAL_NOTE =
    "The category reflects the overall standard of the experience, not just the total cost. VAMO considers lodging, transportation, food, activities and convenience.";

/** Texto curto para o ROTEIRISTA (subtítulo da etapa de criação). */
export const BUDGET_STYLE_CREATOR_SUBTITLE =
    "Choose the overall standard of the trip, considering lodging, transportation, food, activities and convenience.";

/** Texto de transparência para o VIAJANTE no detalhe do roteiro. */
export const BUDGET_STYLE_BUYER_TRANSPARENCY =
    "This rating follows VAMO's criteria and is provided by the creator based on the overall standard of the experience.";

/** Resolve o guia a partir de uma key (ou null se ausente/inválida). */
export function getBudgetStyleGuide(key?: string | null): BudgetStyleGuideEntry | null {
    if (!key) return null;
    return BUDGET_STYLE_GUIDE[key as BudgetStyleKey] ?? null;
}

/**
 * Normaliza `travelStyles` para ESCOLHA ÚNICA de orçamento. Roteiros legados
 * que tenham mais de um estilo retornam o primeiro válido. Devolve a key ou
 * null. NÃO altera dados salvos — só interpreta na leitura.
 */
export function getPrimaryBudgetStyle(travelStyles?: string[] | null): BudgetStyleKey | null {
    if (!Array.isArray(travelStyles)) return null;
    const found = travelStyles.find((s): s is BudgetStyleKey =>
        (BUDGET_STYLE_KEYS as readonly string[]).includes(s),
    );
    return found ?? null;
}

/** Categorias temáticas — mínimo 1, máximo 5. */
export const CATEGORY_OPTIONS: { key: string; label: string; emoji: string }[] = [
    { key: "cultura",     label: "Culture",     emoji: "🏛️" },
    { key: "gastronomia", label: "Food & Drink", emoji: "👨‍🍳" },
    { key: "natureza",    label: "Nature",    emoji: "🌿" },
    { key: "esportes",    label: "Sports",    emoji: "🏋️" },
    { key: "cruzeiros",   label: "Cruises",   emoji: "🛳️" },
    { key: "eurotrip",    label: "Europe Trip",    emoji: "🌍" },
    { key: "relax",       label: "Relax",       emoji: "✨" },
    { key: "praia",       label: "Beach",       emoji: "🏖️" },
    { key: "historico",   label: "Historic",   emoji: "📜" },
    { key: "festivais",   label: "Festivals",   emoji: "🎵" },
    { key: "mochilao",    label: "Backpacking",    emoji: "🎒" },
    { key: "familia",     label: "Family",     emoji: "👨‍👩‍👧" },
    { key: "romantico",   label: "Romantic",   emoji: "💕" },
    { key: "aventura",    label: "Adventure",    emoji: "🏔️" },
];

/**
 * Módulos opcionais — controlam quais seções aparecem no roteiro.
 *
 * Observação: o módulo "gasto" (Estimativa de gastos por pessoa) foi
 * removido da lista de opções porque os gastos agora são informados
 * inline dentro de cada módulo (voo, hospedagem, passeios, transporte,
 * restaurantes) e o restante via "gastos_extras". A key "gasto"
 * continua existindo em ModuleKey para roteiros legados.
 */
// Ordem alinhada a MODULE_ORDER (sectionOrder.ts): a sequência aqui é a
// MESMA que aparece no wizard de criação, nas views Original/Minha versão
// do roteiro comprado e nas seções do PDF. Mudar a ordem aqui propaga
// para tudo de uma vez — não reordenar nos consumidores.
export const MODULE_OPTIONS: { key: ModuleKey; label: string; desc: string; emoji: string }[] = [
    { key: "voo",           label: "My Flight",            emoji: "✈️", desc: "Flight suggestions" },
    { key: "hospedagem",    label: "Lodging",              emoji: "🏨", desc: "Suggested hotels and stays" },
    { key: "passeios",      label: "Tours & Attractions", emoji: "🎫", desc: "Must-see attractions and tours" },
    { key: "itinerario",    label: "Daily Itinerary",     emoji: "🗓️", desc: "Complete day-by-day plan" },
    { key: "transporte",    label: "Transportation",      emoji: "🚌", desc: "Getting around tips" },
    { key: "restaurantes",  label: "Restaurants",          emoji: "🍴", desc: "Where to eat" },
    { key: "dicas",         label: "Insider Tips",         emoji: "💡", desc: "Creator tips (min. 2)" },
    { key: "gastos_extras", label: "Extra Expenses",       emoji: "💰", desc: "SIM card, insurance, fees, tips, laundry and more" },
    { key: "checklist",     label: "Interactive Checklist", emoji: "✅", desc: "What to bring (min. 5)" },
];

/**
 * Categorias sugeridas para o módulo "Gastos Extras".
 * Apenas referência de UI — o roteirista pode digitar título livre.
 */
export const EXTRA_SPENDING_CATEGORIES: { key: string; label: string; emoji: string }[] = [
    { key: "internet",     label: "Internet/SIM Card",         emoji: "📶" },
    { key: "seguro",       label: "Travel Insurance",         emoji: "🛡️" },
    { key: "taxas",        label: "Local Fees",          emoji: "🏛️" },
    { key: "visto",        label: "Visa/Documents",    emoji: "📑" },
    { key: "lavanderia",   label: "Laundry",            emoji: "👕" },
    { key: "guardavolume", label: "Luggage Storage",        emoji: "🎒" },
    { key: "gorjetas",     label: "Tips",              emoji: "💵" },
    { key: "compras",      label: "Essential Shopping",    emoji: "🛍️" },
    { key: "bagagem",      label: "Extra Baggage",         emoji: "🧳" },
    { key: "aluguel",      label: "Equipment Rental",emoji: "🚲" },
    { key: "farmacia",     label: "Pharmacy/Medicine",     emoji: "💊" },
    { key: "estacionamento", label: "Parking",      emoji: "🅿️" },
    { key: "outros",       label: "Other",                emoji: "✨" },
];

// ATENÇÃO: estes valores são GRAVADOS no banco (itinerary_checklists.category)
// e já existem em roteiros reais. Não renomear: para exibir, use
// getChecklistCategoryLabel().
export const CHECKLIST_CATS = [
    "documentos", "mala", "pre-viagem", "finanças", "apps úteis", "outros",
];

const CHECKLIST_CAT_LABELS: Record<string, string> = {
    "documentos": "Documents",
    "mala": "Packing",
    "pre-viagem": "Pre-trip",
    "finanças": "Finances",
    "apps úteis": "Useful apps",
    "outros": "Other",
};

/** Rótulo em inglês de uma categoria de checklist gravada (aceita valores livres). */
export function getChecklistCategoryLabel(category?: string | null): string {
    const raw = (category || "").trim();
    if (!raw) return CHECKLIST_CAT_LABELS.outros;
    const known = CHECKLIST_CAT_LABELS[raw.toLowerCase()];
    if (known) return known;
    return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export const SPENDING_CATS = [
    "🏨 Lodging",
    "🍽️ Food",
    "🚌 Transportation",
    "🎫 Attractions",
    "🎁 Extras",
];

export const CUISINE_OPTIONS = [
    "Ramen", "Sushi", "Tempura", "Izakaya", "Yakitori",
    "Italian", "French", "Brazilian", "Mexican", "Indian",
    "Thai", "Fast Food", "Cafe", "Bakery", "Bistro",
    "Fine Dining", "Street Food", "Vegetarian", "Seafood", "Other",
];

// Roteiros antigos têm a culinária gravada em português.
const CUISINE_LEGACY: Record<string, string> = {
    "Italiana": "Italian", "Francesa": "French", "Brasileira": "Brazilian",
    "Mexicana": "Mexican", "Indiana": "Indian", "Tailandesa": "Thai",
    "Café": "Cafe", "Padaria": "Bakery", "Bistrô": "Bistro",
    "Vegetariana": "Vegetarian", "Frutos do Mar": "Seafood", "Outro": "Other",
};

/** Culinária em inglês, traduzindo valores antigos gravados em português. */
export function getCuisineLabel(value?: string | null): string {
    const raw = (value || "").trim();
    return CUISINE_LEGACY[raw] ?? raw;
}

/**
 * Lista canônica de moedas — espelha exatamente a usada pela dashboard
 * web do criador (apps/site/src/app/dashboard/roteiro/[id]/page.tsx).
 * Single source of truth para mobile + site + admin.
 */
export const CURRENCIES: { code: Currency; label: string; symbol: string; emoji: string }[] = [
    { code: "AED", label: "UAE Dirham",       symbol: "د.إ",  emoji: "🇦🇪" },
    { code: "ARS", label: "Argentine Peso",            symbol: "$",    emoji: "🇦🇷" },
    { code: "AUD", label: "Australian Dollar",         symbol: "A$",   emoji: "🇦🇺" },
    { code: "BOB", label: "Bolivian Boliviano",                 symbol: "Bs",   emoji: "🇧🇴" },
    { code: "BRL", label: "Brazilian Real",           symbol: "R$",   emoji: "🇧🇷" },
    { code: "CAD", label: "Canadian Dollar",           symbol: "C$",   emoji: "🇨🇦" },
    { code: "CHF", label: "Swiss Franc",              symbol: "Fr",   emoji: "🇨🇭" },
    { code: "CLP", label: "Chilean Peso",              symbol: "$",    emoji: "🇨🇱" },
    { code: "CNY", label: "Chinese Yuan",               symbol: "¥",    emoji: "🇨🇳" },
    { code: "COP", label: "Colombian Peso",           symbol: "$",    emoji: "🇨🇴" },
    { code: "CRC", label: "Costa Rican Colón",      symbol: "₡",    emoji: "🇨🇷" },
    { code: "CUP", label: "Cuban Peso",               symbol: "$",    emoji: "🇨🇺" },
    { code: "DOP", label: "Dominican Peso",           symbol: "RD$",  emoji: "🇩🇴" },
    { code: "EGP", label: "Egyptian Pound",             symbol: "£",    emoji: "🇪🇬" },
    { code: "EUR", label: "Euro",                      symbol: "€",    emoji: "🇪🇺" },
    { code: "GBP", label: "British Pound",           symbol: "£",    emoji: "🇬🇧" },
    { code: "GTQ", label: "Guatemalan Quetzal",      symbol: "Q",    emoji: "🇬🇹" },
    { code: "IDR", label: "Indonesian Rupiah",           symbol: "Rp",   emoji: "🇮🇩" },
    { code: "INR", label: "Indian Rupee",             symbol: "₹",    emoji: "🇮🇳" },
    { code: "JPY", label: "Japanese Yen",              symbol: "¥",    emoji: "🇯🇵" },
    { code: "KES", label: "Kenyan Shilling",            symbol: "KSh",  emoji: "🇰🇪" },
    { code: "MAD", label: "Moroccan Dirham",         symbol: "د.م.", emoji: "🇲🇦" },
    { code: "MXN", label: "Mexican Peso",             symbol: "$",    emoji: "🇲🇽" },
    { code: "MYR", label: "Malaysian Ringgit",            symbol: "RM",   emoji: "🇲🇾" },
    { code: "NZD", label: "New Zealand Dollar",         symbol: "NZ$",  emoji: "🇳🇿" },
    { code: "NOK", label: "Norwegian Krone",          symbol: "kr",   emoji: "🇳🇴" },
    { code: "PEN", label: "Peruvian Sol",               symbol: "S/",   emoji: "🇵🇪" },
    { code: "PHP", label: "Philippine Peso",             symbol: "₱",    emoji: "🇵🇭" },
    { code: "PYG", label: "Paraguayan Guaraní",         symbol: "Gs",   emoji: "🇵🇾" },
    { code: "SGD", label: "Singapore Dollar",        symbol: "S$",   emoji: "🇸🇬" },
    { code: "THB", label: "Thai Baht",            symbol: "฿",    emoji: "🇹🇭" },
    { code: "TRY", label: "Turkish Lira",                symbol: "₺",    emoji: "🇹🇷" },
    { code: "USD", label: "US Dollar",           symbol: "$",    emoji: "🇺🇸" },
    { code: "UYU", label: "Uruguayan Peso",             symbol: "$U",   emoji: "🇺🇾" },
    { code: "VND", label: "Vietnamese Dong",           symbol: "₫",    emoji: "🇻🇳" },
    { code: "ZAR", label: "South African Rand",         symbol: "R",    emoji: "🇿🇦" },
];

/** Símbolo da moeda (e.g. "USD" → "$", "EUR" → "€"). Sem código: moeda-base do mercado. */
export function getCurrencySymbol(code?: string | null): string {
    const c = (code || BASE_CURRENCY).toUpperCase();
    return CURRENCIES.find(x => x.code === c)?.symbol ?? c;
}

export const MAX_STYLES = 3;
export const MAX_CATEGORIES = 5;
export const MIN_CATEGORIES = 1;
export const MIN_DAYS = 1;
export const MIN_TIPS = 2;
export const MIN_CHECKLIST = 5;
