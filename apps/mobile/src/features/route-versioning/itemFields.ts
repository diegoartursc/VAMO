/**
 * itemFields — descreve quais campos cada `kind` de item expõe nos
 * modais de Editar/Adicionar.
 *
 * Mantemos UM mapa só (kind → FieldSpec[]) e os dois modais (Edit/Add)
 * o consomem — sem divergência entre "o que mostro pra editar" e "o
 * que mostro pra criar".
 *
 * Cada campo tem um `type` que o renderer do modal sabe traduzir
 * (text, multiline, money, date, time, number). O modal genérico
 * compõe FormInput / MoneyInput / DatePickerField / TimePickerField
 * com base no spec — mantém os modais "burros".
 */

import type { ItemKind } from '../../services/routeCustomization';

export type FieldType =
    | 'text'        // string, FormInput
    | 'multiline'   // string, FormInput multiline
    | 'money'       // string monetária (preserva vírgula), MoneyInput
    | 'date'        // ISO YYYY-MM-DD, DatePickerField
    | 'time'        // HH:MM, TimePickerField
    | 'number'      // numérico (inteiro), FormInput keyboardType numeric
    | 'picker'      // chips horizontais com opções fixas (single-select)
    | 'cost'        // { value, currency } — MoneyInput + CurrencyPicker do creator
    | 'stars';      // classificação do hotel 0–5 (string), HotelStarsInput

export interface FieldSpec {
    /** Chave no objeto `data` do item. */
    key: string;
    /** Label visível no formulário. */
    label: string;
    /** Tipo de renderizador. */
    type: FieldType;
    /** Placeholder opcional. */
    placeholder?: string;
    /** Hint exibido abaixo do input. */
    hint?: string;
    /** Quando true, marca como obrigatório (não bloqueia salvar, só visual). */
    required?: boolean;
    /** Prefix for money (e.g. "$"). */
    prefix?: string;
    /** Suffix for money (e.g. "USD"). */
    suffix?: string;
    /**
     * Opções para `type: 'picker'`. Cada opção tem um `value` (salvo no data)
     * e um `label` (mostrado no chip). O picker é single-select; clicar
     * novamente na opção ativa limpa o campo.
     */
    options?: ReadonlyArray<{ value: string; label: string }>;
}

// ─── Opções de chip alinhadas com new-itinerary.tsx ─────────────────
//
// Os valores precisam bater EXATAMENTE com os mesmos enums usados pelo
// criador para que filtros, badges e comparações cruzadas continuem
// funcionando. Quando o criador adicionar opções no futuro, sincronize
// aqui também.

const CUISINE_OPTIONS = [
    { value: 'brasileira', label: 'Brazilian' },
    { value: 'francesa', label: 'French' },
    { value: 'italiana', label: 'Italian' },
    { value: 'japonesa', label: 'Japanese' },
    { value: 'chinesa', label: 'Chinese' },
    { value: 'mexicana', label: 'Mexican' },
    { value: 'arabe', label: 'Arabic' },
    { value: 'indiana', label: 'Indian' },
    { value: 'mediterranea', label: 'Mediterranean' },
    { value: 'tailandesa', label: 'Thai' },
    { value: 'fastfood', label: 'Fast food' },
    { value: 'vegana', label: 'Vegan' },
    { value: 'cafeteria', label: 'Cafe' },
    { value: 'outros', label: 'Other' },
] as const;

const EXTRA_SPENDING_CATEGORY_OPTIONS = [
    { value: 'internet', label: 'Internet / SIM card' },
    { value: 'seguro', label: 'Insurance' },
    { value: 'taxas', label: 'Fees' },
    { value: 'visto', label: 'Visa' },
    { value: 'lavanderia', label: 'Laundry' },
    { value: 'guardavolume', label: 'Luggage storage' },
    { value: 'gorjetas', label: 'Tips' },
    { value: 'compras', label: 'Shopping' },
    { value: 'bagagem', label: 'Baggage' },
    { value: 'aluguel', label: 'Rental' },
    { value: 'farmacia', label: 'Pharmacy' },
    { value: 'estacionamento', label: 'Parking' },
    { value: 'outros', label: 'Other' },
] as const;

// ─── Field sets por kind ────────────────────────────────────────────
//
// CADA bloco abaixo replica fielmente os campos do passo correspondente
// em `apps/mobile/app/new-itinerary.tsx`. A regra é "nem mais, nem menos":
// se o criador NÃO mostra um campo, o viajante também não vê. Se o criador
// mostra, o viajante vê com o mesmo label, tipo e placeholder análogos.
//
// `cost` block do criador (value + currency + comprovante) é replicado
// aqui via FieldType `'cost'` — renderiza MoneyInput + CurrencyPicker
// (mesmo componente compacto do criador) e salva como objeto único
// `{ value, currency }` em `data.cost`. O comprovante (upload) NÃO é
// replicado nesta rodada — o viajante tem a Central da Viagem pra
// guardar comprovantes próprios. Registrado como pendência futura.

const ACCOMMODATIONS: FieldSpec[] = [
    { key: 'name', label: 'Hotel / hostel name', type: 'text', placeholder: 'E.g. Waldorf Astoria', required: true },
    { key: 'rating', label: 'Rating (stars)', type: 'stars' },
    { key: 'address', label: 'Place name or address', type: 'text', placeholder: 'E.g. 228 Rue de Rivoli' },
    { key: 'mapLink', label: 'Location link (Google Maps)', type: 'text', placeholder: 'E.g. https://goo.gl/maps/…' },
    { key: 'nights', label: 'Nights', type: 'number', placeholder: '1', hint: 'How many nights you\'re staying.' },
    { key: 'description', label: 'What makes this lodging special?', type: 'multiline', placeholder: 'E.g. The location is excellent…' },
    { key: 'startDate', label: 'Check-in', type: 'date' },
    { key: 'endDate', label: 'Check-out', type: 'date' },
    { key: 'externalLink', label: 'Lodging link', type: 'text', placeholder: 'E.g. Booking, hotel website, Airbnb' },
    { key: 'tips', label: 'Extra tip', type: 'multiline', placeholder: 'E.g. Ask for a room on the top floor…' },
    { key: 'cost', label: 'Lodging cost', type: 'cost' },
];

const TRANSPORTS: FieldSpec[] = [
    { key: 'description', label: 'Transportation / pass description', type: 'multiline', placeholder: 'E.g. JR Pass (Japan Rail Pass)', required: true },
    { key: 'passTypes', label: 'Pass / ticket type', type: 'text', placeholder: 'E.g. National Weekly Pass (7 days)' },
    { key: 'startDate', label: 'Date', type: 'date' },
    { key: 'notes', label: 'Additional notes and tips', type: 'multiline', placeholder: 'E.g. Bring a passport-size photo…' },
    { key: 'cost', label: 'Cost per person', type: 'cost' },
];

const ATTRACTIONS: FieldSpec[] = [
    { key: 'name', label: 'Attraction name', type: 'text', placeholder: 'E.g. Eiffel Tower', required: true },
    { key: 'location', label: 'Place name or address', type: 'text', placeholder: 'E.g. Champ de Mars, 5 Ave…' },
    { key: 'mapLink', label: 'Google Maps link', type: 'text', placeholder: 'E.g. https://goo.gl/maps/…' },
    { key: 'startDate', label: 'Start date', type: 'date' },
    { key: 'endDate', label: 'End date', type: 'date' },
    { key: 'duration', label: 'Duration', type: 'text', placeholder: 'Ex: 2h' },
    { key: 'description', label: 'Description / Why you recommend it', type: 'multiline', placeholder: 'E.g. An unmissable view…', required: true },
    { key: 'externalLink', label: 'Purchase or booking link', type: 'text', placeholder: 'E.g. official site, ticket or booking' },
    { key: 'hours', label: 'Recommended time', type: 'time' },
    { key: 'tips', label: 'Experience tip', type: 'multiline', placeholder: 'E.g. Go near sunset…' },
    { key: 'cost', label: 'Cost per person', type: 'cost' },
];

const RESTAURANTS: FieldSpec[] = [
    { key: 'name', label: 'Restaurant name', type: 'text', placeholder: 'E.g. Le Jules Verne', required: true },
    { key: 'cuisine', label: 'Cuisine', type: 'picker', options: CUISINE_OPTIONS },
    { key: 'location', label: 'City or location', type: 'text', placeholder: 'E.g. Tokyo, Shibuya, downtown or near the station', hint: 'Enter a city, neighborhood, area or landmark.', required: true },
    { key: 'mapLink', label: 'Google Maps link', type: 'text', placeholder: 'E.g. https://goo.gl/maps/…' },
    { key: 'description', label: 'Description / Why you recommend it', type: 'multiline', placeholder: 'E.g. The best croque monsieur in town…' },
    { key: 'hoursStart', label: 'Time', type: 'time' },
    { key: 'startDate', label: 'Date', type: 'date' },
    { key: 'externalLink', label: 'Restaurant link', type: 'text', placeholder: 'E.g. website, menu or reservation' },
    { key: 'tips', label: 'Experience tips', type: 'multiline', placeholder: 'E.g. Arrive early or make a reservation…' },
    { key: 'cost', label: 'Cost per person', type: 'cost' },
];

const GENERAL_TIPS: FieldSpec[] = [
    { key: 'text', label: 'Tip', type: 'multiline', placeholder: 'E.g. Buy the Navigo pass on Monday', required: true },
];

// Checklist segue vivendo no TripCenter (UI separada) — esta spec
// permanece pra back-compat se algum item vier do mergeEngine com
// kind 'checklistItems'. Mantido alinhado com chips do criador.
const CHECKLIST_CATEGORY_OPTIONS = [
    { value: 'documentos', label: 'Documents' },
    { value: 'saude', label: 'Health' },
    { value: 'bagagem', label: 'Baggage' },
    { value: 'dinheiro', label: 'Money' },
    { value: 'eletronicos', label: 'Electronics' },
    { value: 'roupas', label: 'Clothing' },
    { value: 'outros', label: 'Other' },
] as const;

const CHECKLIST: FieldSpec[] = [
    { key: 'category', label: 'Category', type: 'picker', options: CHECKLIST_CATEGORY_OPTIONS },
    { key: 'item', label: 'Checklist item', type: 'text', placeholder: 'E.g. Renew passport', required: true },
];

const EXTRA_SPENDING: FieldSpec[] = [
    { key: 'category', label: 'Category', type: 'picker', options: EXTRA_SPENDING_CATEGORY_OPTIONS },
    { key: 'title', label: 'Expense title / name', type: 'text', placeholder: 'E.g. 10GB SIM card', required: true },
    { key: 'description', label: 'Description', type: 'multiline', placeholder: 'Details or context for the expense' },
    { key: 'cost', label: 'Cost per person', type: 'cost' },
];

const FLIGHT: FieldSpec[] = [
    { key: 'airline', label: 'Airline', type: 'text', placeholder: 'E.g. Delta, United, Air France' },
    { key: 'originCity', label: 'Departure city', type: 'text', placeholder: 'E.g. New York, Los Angeles, Chicago', required: true },
    { key: 'originAirport', label: 'Origin airport', type: 'text', placeholder: 'E.g. JFK — New York/John F. Kennedy' },
    { key: 'destinationAirport', label: 'Destination airport', type: 'text', placeholder: 'E.g. CDG — Paris/Charles de Gaulle' },
    { key: 'departureDate', label: 'Departure date', type: 'date', required: true },
    { key: 'arrivalDate', label: 'Arrival date', type: 'date', required: true },
    { key: 'stops', label: 'Stops', type: 'number', placeholder: '0 = nonstop' },
];

const DAY_ACTIVITY: FieldSpec[] = [
    { key: 'title', label: 'What to do', type: 'text', placeholder: 'E.g. Visit the Louvre Museum', required: true },
    { key: 'time', label: 'Time', type: 'time' },
    { key: 'duration', label: 'Duration', type: 'text', placeholder: 'E.g. 1h, 30min' },
    { key: 'location', label: 'Place name or address', type: 'text', placeholder: 'E.g. 250 Main Street' },
    { key: 'mapLink', label: 'Location link (Google Maps)', type: 'text', placeholder: 'E.g. https://goo.gl/maps/…' },
    { key: 'tips', label: 'Optional tip', type: 'multiline', placeholder: 'E.g. Try to arrive 20 minutes early…' },
];

const DAY: FieldSpec[] = [
    {
        key: 'dayNumber',
        label: 'Day number',
        type: 'number',
        placeholder: 'E.g. 8',
        required: true,
        hint: 'We suggest the next free number. You can change it if you prefer.',
    },
    { key: 'title', label: 'Day title', type: 'text', placeholder: 'E.g. Eiffel Tower and Trocadéro' },
    {
        key: 'description',
        label: 'What to expect that day',
        type: 'multiline',
        placeholder: 'E.g. A morning of sightseeing downtown…',
        required: true,
    },
];

// ─── Mapa público ──────────────────────────────────────────────────

export const FIELDS_BY_KIND: Record<ItemKind, FieldSpec[]> = {
    accommodations: ACCOMMODATIONS,
    transports: TRANSPORTS,
    attractions: ATTRACTIONS,
    restaurants: RESTAURANTS,
    generalTips: GENERAL_TIPS,
    checklistItems: CHECKLIST,
    extraSpendingItems: EXTRA_SPENDING,
    flightOutbound: FLIGHT,
    flightReturn: FLIGHT,
    dayActivity: DAY_ACTIVITY,
    day: DAY,
};

export const KIND_TITLE: Record<ItemKind, { singular: string; addLabel: string }> = {
    accommodations: { singular: 'Lodging', addLabel: 'Add lodging' },
    transports: { singular: 'Transportation', addLabel: 'Add transportation' },
    attractions: { singular: 'Tour', addLabel: 'Add tour' },
    restaurants: { singular: 'Restaurant', addLabel: 'Add restaurant' },
    generalTips: { singular: 'Tip', addLabel: 'Add tip' },
    checklistItems: { singular: 'Checklist item', addLabel: 'Add checklist item' },
    extraSpendingItems: { singular: 'Extra expense', addLabel: 'Add extra expense' },
    flightOutbound: { singular: 'Outbound flight', addLabel: 'Add outbound flight' },
    flightReturn: { singular: 'Return flight', addLabel: 'Add return flight' },
    dayActivity: { singular: 'Day activity', addLabel: 'Add activity' },
    day: { singular: 'Day', addLabel: 'Add day' },
};
