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
    | 'number';     // numérico (inteiro), FormInput keyboardType numeric

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
    /** Prefixo para money (ex: "A$"). */
    prefix?: string;
    /** Sufixo para money (ex: "AUD"). */
    suffix?: string;
}

// ─── Field sets por kind ────────────────────────────────────────────

const ACCOMMODATIONS: FieldSpec[] = [
    { key: 'name', label: 'Nome do local', type: 'text', placeholder: 'Ex: Hostel Sky', required: true },
    { key: 'address', label: 'Endereço', type: 'text', placeholder: 'Rua, número, bairro' },
    { key: 'neighborhood', label: 'Bairro', type: 'text', placeholder: 'Ex: Bondi' },
    { key: 'priceRange', label: 'Faixa de preço', type: 'text', placeholder: 'Ex: A$ 80–120/noite' },
    { key: 'rating', label: 'Avaliação', type: 'text', placeholder: 'Ex: 4.5' },
    { key: 'description', label: 'Descrição', type: 'multiline', placeholder: 'O que achou? Pontos altos…' },
    { key: 'tips', label: 'Dica pessoal', type: 'multiline', placeholder: 'Algo que vale lembrar…' },
    { key: 'mapLink', label: 'Link do mapa', type: 'text', placeholder: 'https://maps.google.com/…' },
];

const TRANSPORTS: FieldSpec[] = [
    { key: 'description', label: 'Descrição', type: 'text', placeholder: 'Ex: Opal Card / Uber / Aluguel', required: true },
    { key: 'passTypes', label: 'Tipos de passe', type: 'text', placeholder: 'Ex: Daily Pass, Weekly Pass' },
    { key: 'priceValue', label: 'Valor', type: 'money', prefix: 'A$', suffix: 'AUD' },
    { key: 'priceCurrency', label: 'Moeda', type: 'text', placeholder: 'AUD' },
    { key: 'notes', label: 'Notas', type: 'multiline', placeholder: 'Observações sobre transporte…' },
];

const ATTRACTIONS: FieldSpec[] = [
    { key: 'name', label: 'Nome da atração', type: 'text', placeholder: 'Ex: Sydney Opera House', required: true },
    { key: 'type', label: 'Tipo', type: 'text', placeholder: 'Ex: Cultural, Natureza, Aventura' },
    { key: 'location', label: 'Localização', type: 'text', placeholder: 'Bairro / cidade' },
    { key: 'ticketPrice', label: 'Preço do ingresso', type: 'text', placeholder: 'Ex: A$ 45 ou Grátis' },
    { key: 'hours', label: 'Horário de funcionamento', type: 'text', placeholder: 'Ex: 09h–17h' },
    { key: 'duration', label: 'Duração estimada', type: 'text', placeholder: 'Ex: 2h' },
    { key: 'description', label: 'Descrição', type: 'multiline', placeholder: 'O que é, por que vale a pena…' },
    { key: 'tips', label: 'Dica', type: 'multiline', placeholder: 'Algo prático para o viajante…' },
    { key: 'externalLink', label: 'Site oficial', type: 'text', placeholder: 'https://…' },
    { key: 'mapLink', label: 'Link do mapa', type: 'text', placeholder: 'https://maps.google.com/…' },
];

const RESTAURANTS: FieldSpec[] = [
    { key: 'name', label: 'Nome do restaurante', type: 'text', placeholder: 'Ex: Hubert', required: true },
    { key: 'cuisine', label: 'Cozinha', type: 'text', placeholder: 'Ex: Francesa, Asiática, Brasileira' },
    { key: 'location', label: 'Localização', type: 'text', placeholder: 'Endereço ou bairro' },
    { key: 'priceRange', label: 'Faixa de preço', type: 'text', placeholder: 'Ex: $$, A$ 30–60' },
    { key: 'hours', label: 'Horário', type: 'text', placeholder: 'Ex: 18h–23h' },
    { key: 'description', label: 'Descrição', type: 'multiline' },
    { key: 'tips', label: 'Dica', type: 'multiline', placeholder: 'O que pedir, melhor horário…' },
    { key: 'externalLink', label: 'Site / reservas', type: 'text', placeholder: 'https://…' },
];

const GENERAL_TIPS: FieldSpec[] = [
    { key: 'text', label: 'Dica', type: 'multiline', placeholder: 'Escreva sua dica…', required: true },
];

const CHECKLIST: FieldSpec[] = [
    { key: 'item', label: 'Item', type: 'text', placeholder: 'Ex: Renovar passaporte', required: true },
    { key: 'category', label: 'Categoria', type: 'text', placeholder: 'documentos, mala, etc.' },
];

const EXTRA_SPENDING: FieldSpec[] = [
    { key: 'title', label: 'Título', type: 'text', placeholder: 'Ex: Compras de souvenir', required: true },
    { key: 'description', label: 'Descrição', type: 'multiline' },
    { key: 'value', label: 'Valor', type: 'money', prefix: 'A$', suffix: 'AUD' },
    { key: 'currency', label: 'Moeda', type: 'text', placeholder: 'AUD' },
];

const FLIGHT: FieldSpec[] = [
    { key: 'airline', label: 'Companhia aérea', type: 'text', placeholder: 'Ex: Qantas, LATAM' },
    { key: 'flightNumber', label: 'Número do voo', type: 'text', placeholder: 'Ex: QF 28' },
    { key: 'originAirport', label: 'Aeroporto de origem', type: 'text', placeholder: 'Ex: GRU' },
    { key: 'destinationAirport', label: 'Aeroporto de destino', type: 'text', placeholder: 'Ex: SYD' },
    { key: 'departureDate', label: 'Data de saída', type: 'date' },
    { key: 'departureTime', label: 'Horário de saída', type: 'time' },
    { key: 'arrivalDate', label: 'Data de chegada', type: 'date' },
    { key: 'arrivalTime', label: 'Horário de chegada', type: 'time' },
    { key: 'stops', label: 'Paradas', type: 'number', placeholder: '0 = direto' },
];

const DAY_ACTIVITY: FieldSpec[] = [
    { key: 'title', label: 'Título da atividade', type: 'text', placeholder: 'Ex: Café com vista', required: true },
    { key: 'time', label: 'Horário', type: 'time' },
    { key: 'duration', label: 'Duração', type: 'text', placeholder: 'Ex: 1h, 30min' },
    { key: 'icon', label: 'Emoji', type: 'text', placeholder: 'Ex: 🍽️' },
    { key: 'location', label: 'Local', type: 'text', placeholder: 'Endereço ou bairro' },
    { key: 'description', label: 'Descrição', type: 'multiline' },
    { key: 'mapLink', label: 'Link do mapa', type: 'text', placeholder: 'https://maps.google.com/…' },
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
};

export const KIND_TITLE: Record<ItemKind, { singular: string; addLabel: string }> = {
    accommodations: { singular: 'Hospedagem', addLabel: 'Adicionar hospedagem' },
    transports: { singular: 'Transporte', addLabel: 'Adicionar transporte' },
    attractions: { singular: 'Passeio', addLabel: 'Adicionar passeio' },
    restaurants: { singular: 'Restaurante', addLabel: 'Adicionar restaurante' },
    generalTips: { singular: 'Dica', addLabel: 'Adicionar dica' },
    checklistItems: { singular: 'Item do checklist', addLabel: 'Adicionar item ao checklist' },
    extraSpendingItems: { singular: 'Gasto extra', addLabel: 'Adicionar gasto extra' },
    flightOutbound: { singular: 'Voo de ida', addLabel: 'Adicionar voo de ida' },
    flightReturn: { singular: 'Voo de volta', addLabel: 'Adicionar voo de volta' },
    dayActivity: { singular: 'Atividade do dia', addLabel: 'Adicionar atividade' },
};
