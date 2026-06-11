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
    | 'cost';       // { value, currency } — MoneyInput + CurrencyPicker do creator

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

const ATTRACTION_TYPE_OPTIONS = [
    { value: 'museu', label: 'Museu' },
    { value: 'parque', label: 'Parque' },
    { value: 'monumento', label: 'Monumento' },
    { value: 'natureza', label: 'Natureza' },
    { value: 'cultural', label: 'Cultural' },
    { value: 'aventura', label: 'Aventura' },
    { value: 'praia', label: 'Praia' },
    { value: 'historico', label: 'Histórico' },
    { value: 'religioso', label: 'Religioso' },
    { value: 'gastronomia', label: 'Gastronomia' },
    { value: 'compras', label: 'Compras' },
    { value: 'vida_noturna', label: 'Vida noturna' },
    { value: 'familia', label: 'Família' },
    { value: 'outros', label: 'Outros' },
] as const;

const CUISINE_OPTIONS = [
    { value: 'brasileira', label: 'Brasileira' },
    { value: 'francesa', label: 'Francesa' },
    { value: 'italiana', label: 'Italiana' },
    { value: 'japonesa', label: 'Japonesa' },
    { value: 'chinesa', label: 'Chinesa' },
    { value: 'mexicana', label: 'Mexicana' },
    { value: 'arabe', label: 'Árabe' },
    { value: 'indiana', label: 'Indiana' },
    { value: 'mediterranea', label: 'Mediterrânea' },
    { value: 'tailandesa', label: 'Tailandesa' },
    { value: 'fastfood', label: 'Fast food' },
    { value: 'vegana', label: 'Vegana' },
    { value: 'cafeteria', label: 'Cafeteria' },
    { value: 'outros', label: 'Outros' },
] as const;

const EXTRA_SPENDING_CATEGORY_OPTIONS = [
    { value: 'internet', label: 'Internet / Chip' },
    { value: 'seguro', label: 'Seguro' },
    { value: 'taxas', label: 'Taxas' },
    { value: 'visto', label: 'Visto' },
    { value: 'lavanderia', label: 'Lavanderia' },
    { value: 'guardavolume', label: 'Guarda-volume' },
    { value: 'gorjetas', label: 'Gorjetas' },
    { value: 'compras', label: 'Compras' },
    { value: 'bagagem', label: 'Bagagem' },
    { value: 'aluguel', label: 'Aluguel' },
    { value: 'farmacia', label: 'Farmácia' },
    { value: 'estacionamento', label: 'Estacionamento' },
    { value: 'outros', label: 'Outros' },
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
    { key: 'name', label: 'Nome do hotel / hostel', type: 'text', placeholder: 'Ex: Waldorf Astoria', required: true },
    { key: 'rating', label: 'Nota', type: 'text', placeholder: 'Ex: 8.5' },
    { key: 'address', label: 'Nome do local ou endereço', type: 'text', placeholder: 'Ex: Rue de Rivoli, 228' },
    { key: 'mapLink', label: 'Link da localização (Google Maps)', type: 'text', placeholder: 'Ex: https://goo.gl/maps/…' },
    { key: 'nights', label: 'Noites', type: 'number', placeholder: '1', hint: 'Quantas noites a sua estadia.' },
    { key: 'description', label: 'O que torna essa hospedagem especial?', type: 'multiline', placeholder: 'Ex: A localização é excelente…' },
    { key: 'startDate', label: 'Check-in', type: 'date' },
    { key: 'endDate', label: 'Check-out', type: 'date' },
    { key: 'externalLink', label: 'Link da hospedagem', type: 'text', placeholder: 'Ex: Booking, site do hotel, Airbnb' },
    { key: 'tips', label: 'Dica extra', type: 'multiline', placeholder: 'Ex: Peça o quarto no último andar…' },
    { key: 'cost', label: 'Valor da hospedagem', type: 'cost' },
];

const TRANSPORTS: FieldSpec[] = [
    { key: 'description', label: 'Descrição do transporte / Passe', type: 'multiline', placeholder: 'Ex: JR Pass (Japan Rail Pass)', required: true },
    { key: 'passTypes', label: 'Tipo de passe / bilhete', type: 'text', placeholder: 'Ex: Passe Semanal Nacional (7 dias)' },
    { key: 'startDate', label: 'Data', type: 'date' },
    { key: 'notes', label: 'Notas e dicas adicionais', type: 'multiline', placeholder: 'Ex: Leve uma foto 3x4…' },
    { key: 'cost', label: 'Valor por pessoa', type: 'cost' },
];

const ATTRACTIONS: FieldSpec[] = [
    { key: 'name', label: 'Nome da atração', type: 'text', placeholder: 'Ex: Torre Eiffel', required: true },
    { key: 'type', label: 'Tipo', type: 'picker', options: ATTRACTION_TYPE_OPTIONS },
    { key: 'location', label: 'Nome do local ou endereço', type: 'text', placeholder: 'Ex: Champ de Mars, 5 Ave…' },
    { key: 'mapLink', label: 'Link do Google Maps', type: 'text', placeholder: 'Ex: https://goo.gl/maps/…' },
    { key: 'startDate', label: 'Data de início', type: 'date' },
    { key: 'endDate', label: 'Data de fim', type: 'date' },
    { key: 'duration', label: 'Duração', type: 'text', placeholder: 'Ex: 2h' },
    { key: 'description', label: 'Descrição / Por que recomendar', type: 'multiline', placeholder: 'Ex: Uma vista imperdível…', required: true },
    { key: 'externalLink', label: 'Link de compra ou reserva', type: 'text', placeholder: 'Ex: site oficial, ingresso ou reserva' },
    { key: 'hours', label: 'Horário recomendado', type: 'time' },
    { key: 'tips', label: 'Dica de experiência', type: 'multiline', placeholder: 'Ex: Vá próximo ao pôr do sol…' },
    { key: 'cost', label: 'Valor por pessoa', type: 'cost' },
];

const RESTAURANTS: FieldSpec[] = [
    { key: 'name', label: 'Nome do restaurante', type: 'text', placeholder: 'Ex: Le Jules Verne', required: true },
    { key: 'cuisine', label: 'Culinária', type: 'picker', options: CUISINE_OPTIONS },
    { key: 'location', label: 'Cidade ou localização', type: 'text', placeholder: 'Ex: Tóquio, Shibuya, região central ou perto da estação', hint: 'Informe cidade, bairro, região ou ponto de referência.', required: true },
    { key: 'description', label: 'Descrição / Por que recomendar', type: 'multiline', placeholder: 'Ex: O melhor croque monsieur da cidade…' },
    { key: 'hoursStart', label: 'Horário', type: 'time' },
    { key: 'startDate', label: 'Data', type: 'date' },
    { key: 'externalLink', label: 'Link do restaurante', type: 'text', placeholder: 'Ex: site, cardápio ou reserva' },
    { key: 'tips', label: 'Dicas de experiência', type: 'multiline', placeholder: 'Ex: Chegue cedo ou faça reserva…' },
    { key: 'cost', label: 'Valor por pessoa', type: 'cost' },
];

const GENERAL_TIPS: FieldSpec[] = [
    { key: 'text', label: 'Dica', type: 'multiline', placeholder: 'Ex: Compre o passe Navigo na segunda-feira', required: true },
];

// Checklist segue vivendo no TripCenter (UI separada) — esta spec
// permanece pra back-compat se algum item vier do mergeEngine com
// kind 'checklistItems'. Mantido alinhado com chips do criador.
const CHECKLIST_CATEGORY_OPTIONS = [
    { value: 'documentos', label: 'Documentos' },
    { value: 'saude', label: 'Saúde' },
    { value: 'bagagem', label: 'Bagagem' },
    { value: 'dinheiro', label: 'Dinheiro' },
    { value: 'eletronicos', label: 'Eletrônicos' },
    { value: 'roupas', label: 'Roupas' },
    { value: 'outros', label: 'Outros' },
] as const;

const CHECKLIST: FieldSpec[] = [
    { key: 'category', label: 'Categoria', type: 'picker', options: CHECKLIST_CATEGORY_OPTIONS },
    { key: 'item', label: 'Item do checklist', type: 'text', placeholder: 'Ex: Renovar passaporte', required: true },
];

const EXTRA_SPENDING: FieldSpec[] = [
    { key: 'category', label: 'Categoria', type: 'picker', options: EXTRA_SPENDING_CATEGORY_OPTIONS },
    { key: 'title', label: 'Título / nome do gasto', type: 'text', placeholder: 'Ex: Chip de internet 10GB', required: true },
    { key: 'description', label: 'Descrição', type: 'multiline', placeholder: 'Detalhes ou contexto do gasto' },
    { key: 'cost', label: 'Valor por pessoa', type: 'cost' },
];

const FLIGHT: FieldSpec[] = [
    { key: 'airline', label: 'Companhia aérea', type: 'text', placeholder: 'Ex: LATAM, Gol, Air France' },
    { key: 'originCity', label: 'Cidade de saída', type: 'text', placeholder: 'Ex: São Paulo, Rio de Janeiro, Brasília', required: true },
    { key: 'originAirport', label: 'Aeroporto de origem', type: 'text', placeholder: 'Ex: GRU — São Paulo/Guarulhos' },
    { key: 'destinationAirport', label: 'Aeroporto de destino', type: 'text', placeholder: 'Ex: CDG — Paris/Charles de Gaulle' },
    { key: 'departureDate', label: 'Data de saída', type: 'date', required: true },
    { key: 'arrivalDate', label: 'Data de chegada', type: 'date', required: true },
    { key: 'stops', label: 'Paradas', type: 'number', placeholder: '0 = direto' },
];

const DAY_ACTIVITY: FieldSpec[] = [
    { key: 'title', label: 'O que fazer', type: 'text', placeholder: 'Ex: Visita ao Museu do Louvre', required: true },
    { key: 'time', label: 'Horário', type: 'time' },
    { key: 'duration', label: 'Duração', type: 'text', placeholder: 'Ex: 1h, 30min' },
    { key: 'location', label: 'Nome do local ou endereço', type: 'text', placeholder: 'Ex: Rua Direita, 250' },
    { key: 'mapLink', label: 'Link da localização (Google Maps)', type: 'text', placeholder: 'Ex: https://goo.gl/maps/…' },
    { key: 'tips', label: 'Dica opcional', type: 'multiline', placeholder: 'Ex: Tente chegar 20 minutos antes…' },
];

const DAY: FieldSpec[] = [
    {
        key: 'dayNumber',
        label: 'Número do dia',
        type: 'number',
        placeholder: 'Ex: 8',
        required: true,
        hint: 'Sugerimos o próximo número livre. Você pode trocar se preferir.',
    },
    { key: 'title', label: 'Título do dia', type: 'text', placeholder: 'Ex: Torre Eiffel e Trocadéro' },
    {
        key: 'description',
        label: 'O que esperar nesse dia',
        type: 'multiline',
        placeholder: 'Ex: Manhã de passeios no centro…',
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
    day: { singular: 'Dia', addLabel: 'Adicionar dia' },
};
