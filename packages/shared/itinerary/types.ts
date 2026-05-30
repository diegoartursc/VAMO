/**
 * Tipos canônicos para criação/edição de roteiro.
 * Espelham o schema Prisma em apps/backend/prisma/schema.prisma.
 */

// Currency é tipado como string em vez de union literal para suportar
// a lista completa de moedas (igual à dashboard admin/site). Validação
// real é feita por CURRENCIES em constants.ts.
export type Currency = string;
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
    | "gastos_extras"
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

/**
 * ModuleSpending — formato LEGADO de gasto opcional por item.
 * Mantido para compatibilidade com roteiros antigos. Novos itens devem
 * usar `cost: ModuleCostInfo` (transparência graduada).
 */
export interface ModuleSpending {
    value: string;        // valor por pessoa (string para preservar zeros)
    currency: string;     // código (AUD, USD, EUR, BRL, ...)
}

export const EMPTY_MODULE_SPENDING: ModuleSpending = {
    value: "",
    currency: "AUD",
};

/**
 * Transparência graduada de custos.
 *
 *  not_informed — o criador não quer/lembra informar valor.
 *  estimated    — valor aproximado, sem necessidade de comprovante.
 *  verified     — valor com comprovante anexado pelo criador.
 *                  Só vira "Verificado pela VAMO" após aprovação admin
 *                  (ver CostProofStatus.approved).
 */
export type CostDisclosureType = "not_informed" | "estimated" | "verified";

/**
 * Estado do comprovante anexado a um item.
 *
 *  none           — sem arquivo.
 *  uploaded       — arquivo anexado pelo criador, ainda não revisado.
 *  pending_review — em fila de moderação.
 *  approved       — admin aprovou. Pode exibir "Verificado pela VAMO".
 *  rejected       — admin rejeitou.
 */
export type CostProofStatus =
    | "none"
    | "uploaded"
    | "pending_review"
    | "approved"
    | "rejected";

/**
 * Arquivo de comprovante anexado a um item de custo. NÃO é exibido
 * publicamente para o comprador por padrão — serve para validação/selo.
 */
export interface CostProofFile {
    url: string;
    name?: string;
    mimeType?: string;
    size?: number;
    uploadedAt?: string;
}

/**
 * Bloco de custo de um item/módulo do roteiro.
 *
 * Todos os campos são opcionais EXCETO `disclosureType`, que define
 * a semântica visual e de validação:
 *
 *  - disclosureType=not_informed → amount/proofFiles devem estar vazios.
 *  - disclosureType=estimated    → amount recomendado, proofFiles opcional.
 *  - disclosureType=verified     → amount obrigatório, proofFiles obrigatório
 *                                  para exibir selo público.
 */
export interface ModuleCostInfo {
    /** Valor TOTAL pago no item (na moeda informada). Para gastos
     *  individuais (sharedByPeople=1), esse valor é também o valor
     *  por pessoa. Para gastos compartilhados (sharedByPeople>1), o
     *  valor por pessoa é calculado como amount/sharedByPeople. */
    amount?: string | null;
    /** Código de moeda (AUD, USD, EUR, BRL, ...). Default: "AUD". */
    currency?: string;
    /** Como o criador classifica esta informação de custo. */
    disclosureType: CostDisclosureType;
    /** Quantidade de pessoas que dividiram esse gasto. Default = 1
     *  (gasto individual). Valores > 1 indicam custo compartilhado e
     *  são usados para calcular a referência por pessoa. */
    sharedByPeople?: number;
    /** Observação opcional do criador (ex: "por pessoa", "alta temporada"). */
    notes?: string;
    /** Arquivos de comprovante (recibo, reserva, print). Privado por padrão. */
    proofFiles?: CostProofFile[];
    /** Status do comprovante (workflow de moderação). */
    proofStatus?: CostProofStatus;
    /** ISO timestamp da última atualização. */
    updatedAt?: string;
}

export const EMPTY_MODULE_COST_INFO: ModuleCostInfo = {
    amount: "",
    currency: "AUD",
    disclosureType: "not_informed",
    sharedByPeople: 1,
    notes: "",
    proofFiles: [],
    proofStatus: "none",
};

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
    /** @deprecated Use `cost` (ModuleCostInfo) — mantido por compatibilidade. */
    spending?: ModuleSpending;
    cost?: ModuleCostInfo;
}

export interface Transport {
    description: string;
    passTypes: string;
    notes: string;
    startDate: string;
    endDate: string;
    /** @deprecated Use `cost` (ModuleCostInfo) — mantido por compatibilidade. */
    spending?: ModuleSpending;
    cost?: ModuleCostInfo;
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
    /** @deprecated Use `cost` (ModuleCostInfo) — mantido por compatibilidade. */
    spending?: ModuleSpending;
    cost?: ModuleCostInfo;
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
    /** @deprecated Use `cost` (ModuleCostInfo) — mantido por compatibilidade. */
    spending?: ModuleSpending;
    cost?: ModuleCostInfo;
}

/**
 * ExtraSpendingItem — entrada do módulo "Gastos Extras" (chip, seguro,
 * taxas, gorjetas, lavanderia, etc.).
 *
 * `value`/`currency` são o formato legado. Novos itens podem usar `cost`
 * (ModuleCostInfo) para suportar transparência graduada (estimado vs
 * comprovado).
 */
export interface ExtraSpendingItem {
    id: string;
    category: string;         // chave da categoria (ver EXTRA_SPENDING_CATEGORIES)
    title: string;            // ex: "Chip de internet 10GB"
    description: string;      // observação opcional
    /** @deprecated Use `cost.amount`. Mantido para compatibilidade. */
    value: string;            // valor por pessoa, opcional
    /** @deprecated Use `cost.currency`. Mantido para compatibilidade. */
    currency: string;         // código da moeda
    cost?: ModuleCostInfo;
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
    /** @deprecated Use `flightCost` (ModuleCostInfo). Mantido para compatibilidade. */
    flightSpending?: ModuleSpending;       // gasto único da passagem (ida + volta) — legado
    flightCost?: ModuleCostInfo;            // bloco de custo com transparência graduada
    extraSpendingItems: ExtraSpendingItem[]; // módulo "Gastos Extras"
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
        currency: "AUD",
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
        extraSpendingItems: [],
        images: [],
        mediaUrls: [],
        highlightPhotos: [],
    };
}
