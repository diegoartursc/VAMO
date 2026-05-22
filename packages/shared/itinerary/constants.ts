/**
 * Constantes canônicas usadas no formulário de criação de roteiro.
 * Espelha o que existe em apps/site/src/app/dashboard/roteiro/[id]/page.tsx.
 */

import type { ModuleKey, Currency } from "./types";

/** Estilos de viagem — máximo 3. */
export const STYLE_OPTIONS: { key: string; label: string }[] = [
    { key: "economico", label: "Econômico" },
    { key: "moderado",  label: "Moderado" },
    { key: "luxo",      label: "Luxo" },
];

/** Categorias temáticas — mínimo 1, máximo 5. */
export const CATEGORY_OPTIONS: { key: string; label: string; emoji: string }[] = [
    { key: "cultura",     label: "Cultura",     emoji: "🏛️" },
    { key: "gastronomia", label: "Gastronomia", emoji: "👨‍🍳" },
    { key: "natureza",    label: "Natureza",    emoji: "🌿" },
    { key: "esportes",    label: "Esportes",    emoji: "🏋️" },
    { key: "cruzeiros",   label: "Cruzeiros",   emoji: "🛳️" },
    { key: "eurotrip",    label: "Eurotrip",    emoji: "🌍" },
    { key: "relax",       label: "Relax",       emoji: "✨" },
    { key: "praia",       label: "Praia",       emoji: "🏖️" },
    { key: "historico",   label: "Histórico",   emoji: "📜" },
    { key: "festivais",   label: "Festivais",   emoji: "🎵" },
    { key: "mochilao",    label: "Mochilão",    emoji: "🎒" },
    { key: "familia",     label: "Família",     emoji: "👨‍👩‍👧" },
    { key: "romantico",   label: "Romântico",   emoji: "💕" },
    { key: "aventura",    label: "Aventura",    emoji: "🏔️" },
];

/** Módulos opcionais — controlam quais seções aparecem no roteiro. */
export const MODULE_OPTIONS: { key: ModuleKey; label: string; desc: string; emoji: string }[] = [
    { key: "itinerario",   label: "Itinerário por dia",                emoji: "🗓️", desc: "Roteiro dia a dia completo" },
    { key: "voo",          label: "Meu voo",                            emoji: "✈️", desc: "Sugestões de voo" },
    { key: "hospedagem",   label: "Hospedagens",                        emoji: "🏨", desc: "Hotéis e hospedagens sugeridas" },
    { key: "passeios",     label: "Passeios & Atrações",                emoji: "🎫", desc: "Atrações e passeios imperdíveis" },
    { key: "transporte",   label: "Transporte",                         emoji: "🚌", desc: "Dicas de locomoção" },
    { key: "dicas",        label: "Dicas exclusivas",                   emoji: "💡", desc: "Dicas do criador (mín. 2)" },
    { key: "restaurantes", label: "Restaurantes",                       emoji: "🍴", desc: "Onde comer" },
    { key: "checklist",    label: "Checklist interativo",               emoji: "✅", desc: "O que levar (mín. 5)" },
    { key: "gasto",        label: "Estimativa de gastos",               emoji: "💳", desc: "Quanto você vai gastar" },
];

export const CHECKLIST_CATS = [
    "documentos", "mala", "pre-viagem", "finanças", "apps úteis", "outros",
];

export const SPENDING_CATS = [
    "🏨 Hospedagem",
    "🍽️ Alimentação",
    "🚌 Transporte",
    "🎫 Atrações",
    "🎁 Extras",
];

export const ATTRACTION_TYPES = [
    "Museu", "Monumento", "Parque", "Tour", "Mirante", "Igreja",
    "Palácio", "Praia", "Trilha", "Show / Espetáculo", "Parque Temático",
    "Mercado", "Passeio de Barco", "Outro",
];

export const CUISINE_OPTIONS = [
    "Ramen", "Sushi", "Tempura", "Izakaya", "Yakitori",
    "Italiana", "Francesa", "Brasileira", "Mexicana", "Indiana",
    "Tailandesa", "Fast Food", "Café", "Padaria", "Bistrô",
    "Fine Dining", "Street Food", "Vegetariana", "Frutos do Mar", "Outro",
];

export const CURRENCIES: { code: Currency; label: string; symbol: string }[] = [
    { code: "BRL", label: "Real",  symbol: "R$" },
    { code: "USD", label: "Dólar", symbol: "US$" },
    { code: "EUR", label: "Euro",  symbol: "€" },
    { code: "GBP", label: "Libra", symbol: "£" },
];

export const MAX_STYLES = 3;
export const MAX_CATEGORIES = 5;
export const MIN_CATEGORIES = 1;
export const MIN_DAYS = 3;
export const MIN_TIPS = 2;
export const MIN_CHECKLIST = 5;
