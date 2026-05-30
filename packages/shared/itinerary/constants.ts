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

/**
 * Módulos opcionais — controlam quais seções aparecem no roteiro.
 *
 * Observação: o módulo "gasto" (Estimativa de gastos por pessoa) foi
 * removido da lista de opções porque os gastos agora são informados
 * inline dentro de cada módulo (voo, hospedagem, passeios, transporte,
 * restaurantes) e o restante via "gastos_extras". A key "gasto"
 * continua existindo em ModuleKey para roteiros legados.
 */
export const MODULE_OPTIONS: { key: ModuleKey; label: string; desc: string; emoji: string }[] = [
    { key: "itinerario",    label: "Itinerário por dia",   emoji: "🗓️", desc: "Roteiro dia a dia completo" },
    { key: "voo",           label: "Meu voo",              emoji: "✈️", desc: "Sugestões de voo" },
    { key: "hospedagem",    label: "Hospedagens",          emoji: "🏨", desc: "Hotéis e hospedagens sugeridas" },
    { key: "passeios",      label: "Passeios & Atrações",  emoji: "🎫", desc: "Atrações e passeios imperdíveis" },
    { key: "transporte",    label: "Transporte",           emoji: "🚌", desc: "Dicas de locomoção" },
    { key: "dicas",         label: "Dicas exclusivas",     emoji: "💡", desc: "Dicas do criador (mín. 2)" },
    { key: "restaurantes",  label: "Restaurantes",         emoji: "🍴", desc: "Onde comer" },
    { key: "checklist",     label: "Checklist interativo", emoji: "✅", desc: "O que levar (mín. 5)" },
    { key: "gastos_extras", label: "Gastos Extras",        emoji: "💰", desc: "Chip, seguro, taxas, gorjetas, lavanderia e outros" },
];

/**
 * Categorias sugeridas para o módulo "Gastos Extras".
 * Apenas referência de UI — o roteirista pode digitar título livre.
 */
export const EXTRA_SPENDING_CATEGORIES: { key: string; label: string; emoji: string }[] = [
    { key: "internet",     label: "Internet/Chip",         emoji: "📶" },
    { key: "seguro",       label: "Seguro Viagem",         emoji: "🛡️" },
    { key: "taxas",        label: "Taxas Locais",          emoji: "🏛️" },
    { key: "visto",        label: "Visto/Documentação",    emoji: "📑" },
    { key: "lavanderia",   label: "Lavanderia",            emoji: "👕" },
    { key: "guardavolume", label: "Guarda-volumes",        emoji: "🎒" },
    { key: "gorjetas",     label: "Gorjetas",              emoji: "💵" },
    { key: "compras",      label: "Compras Essenciais",    emoji: "🛍️" },
    { key: "bagagem",      label: "Bagagem Extra",         emoji: "🧳" },
    { key: "aluguel",      label: "Aluguel de Equipamento",emoji: "🚲" },
    { key: "farmacia",     label: "Farmácia/Remédios",     emoji: "💊" },
    { key: "estacionamento", label: "Estacionamento",      emoji: "🅿️" },
    { key: "outros",       label: "Outros",                emoji: "✨" },
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

/**
 * Lista canônica de moedas — espelha exatamente a usada pela dashboard
 * web do criador (apps/site/src/app/dashboard/roteiro/[id]/page.tsx).
 * Single source of truth para mobile + site + admin.
 */
export const CURRENCIES: { code: Currency; label: string; symbol: string; emoji: string }[] = [
    { code: "AED", label: "Dirham dos Emirados",       symbol: "د.إ",  emoji: "🇦🇪" },
    { code: "ARS", label: "Peso Argentino",            symbol: "$",    emoji: "🇦🇷" },
    { code: "AUD", label: "Dólar Australiano",         symbol: "A$",   emoji: "🇦🇺" },
    { code: "BOB", label: "Boliviano",                 symbol: "Bs",   emoji: "🇧🇴" },
    { code: "BRL", label: "Real Brasileiro",           symbol: "R$",   emoji: "🇧🇷" },
    { code: "CAD", label: "Dólar Canadense",           symbol: "C$",   emoji: "🇨🇦" },
    { code: "CHF", label: "Franco Suíço",              symbol: "Fr",   emoji: "🇨🇭" },
    { code: "CLP", label: "Peso Chileno",              symbol: "$",    emoji: "🇨🇱" },
    { code: "CNY", label: "Yuan Chinês",               symbol: "¥",    emoji: "🇨🇳" },
    { code: "COP", label: "Peso Colombiano",           symbol: "$",    emoji: "🇨🇴" },
    { code: "CRC", label: "Colón Costarriquenho",      symbol: "₡",    emoji: "🇨🇷" },
    { code: "CUP", label: "Peso Cubano",               symbol: "$",    emoji: "🇨🇺" },
    { code: "DOP", label: "Peso Dominicano",           symbol: "RD$",  emoji: "🇩🇴" },
    { code: "EGP", label: "Libra Egípcia",             symbol: "£",    emoji: "🇪🇬" },
    { code: "EUR", label: "Euro",                      symbol: "€",    emoji: "🇪🇺" },
    { code: "GBP", label: "Libra Esterlina",           symbol: "£",    emoji: "🇬🇧" },
    { code: "GTQ", label: "Quetzal Guatemalteco",      symbol: "Q",    emoji: "🇬🇹" },
    { code: "IDR", label: "Rúpia Indonésia",           symbol: "Rp",   emoji: "🇮🇩" },
    { code: "INR", label: "Rúpia Indiana",             symbol: "₹",    emoji: "🇮🇳" },
    { code: "JPY", label: "Iene Japonês",              symbol: "¥",    emoji: "🇯🇵" },
    { code: "KES", label: "Xelim Queniano",            symbol: "KSh",  emoji: "🇰🇪" },
    { code: "MAD", label: "Dirham Marroquino",         symbol: "د.م.", emoji: "🇲🇦" },
    { code: "MXN", label: "Peso Mexicano",             symbol: "$",    emoji: "🇲🇽" },
    { code: "MYR", label: "Ringgit Malaio",            symbol: "RM",   emoji: "🇲🇾" },
    { code: "NZD", label: "Dólar Neozelandês",         symbol: "NZ$",  emoji: "🇳🇿" },
    { code: "NOK", label: "Coroa Norueguesa",          symbol: "kr",   emoji: "🇳🇴" },
    { code: "PEN", label: "Sol Peruano",               symbol: "S/",   emoji: "🇵🇪" },
    { code: "PHP", label: "Peso Filipino",             symbol: "₱",    emoji: "🇵🇭" },
    { code: "PYG", label: "Guarani Paraguaio",         symbol: "Gs",   emoji: "🇵🇾" },
    { code: "SGD", label: "Dólar de Singapura",        symbol: "S$",   emoji: "🇸🇬" },
    { code: "THB", label: "Baht Tailandês",            symbol: "฿",    emoji: "🇹🇭" },
    { code: "TRY", label: "Lira Turca",                symbol: "₺",    emoji: "🇹🇷" },
    { code: "USD", label: "Dólar Americano",           symbol: "$",    emoji: "🇺🇸" },
    { code: "UYU", label: "Peso Uruguaio",             symbol: "$U",   emoji: "🇺🇾" },
    { code: "VND", label: "Dong Vietnamita",           symbol: "₫",    emoji: "🇻🇳" },
    { code: "ZAR", label: "Rand Sul-africano",         symbol: "R",    emoji: "🇿🇦" },
];

export const MAX_STYLES = 3;
export const MAX_CATEGORIES = 5;
export const MIN_CATEGORIES = 1;
export const MIN_DAYS = 1;
export const MIN_TIPS = 2;
export const MIN_CHECKLIST = 5;
