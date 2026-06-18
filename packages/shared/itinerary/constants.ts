/**
 * Constantes canônicas usadas no formulário de criação de roteiro.
 * Espelha o que existe em apps/site/src/app/dashboard/roteiro/[id]/page.tsx.
 */

import type { ModuleKey, Currency } from "./types";

/**
 * Estilo de orçamento do roteiro — ESCOLHA ÚNICA entre Econômico, Moderado e
 * Luxo (mutuamente excludentes). Armazenado em `travelStyles[]` por compat de
 * schema, mas só UMA destas keys deve estar presente.
 *
 * NÃO confundir com categorias temáticas (cultura/gastronomia/...). As keys
 * "economico"/"moderado"/"luxo" são imutáveis — não renomear.
 */
export const STYLE_OPTIONS: { key: string; label: string }[] = [
    { key: "economico", label: "Econômico" },
    { key: "moderado",  label: "Moderado" },
    { key: "luxo",      label: "Luxo" },
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
        label: "Econômico",
        shortDescription: "Para gastar menos, com opções mais simples.",
        buyerDescription:
            "Roteiro pensado para gastar menos, usando hospedagens simples, transporte acessível e atrações com bom custo-benefício.",
        creatorHint:
            "Use Econômico quando o roteiro prioriza economia, hospedagens simples, transporte barato e atrações gratuitas ou acessíveis.",
        criteria: [
            "Hospedagens simples, hostel, pousada básica ou acomodação econômica",
            "Transporte público, caminhada, ônibus ou trem comum",
            "Alimentação simples, mercado, comida de rua ou restaurantes acessíveis",
            "Muitos passeios gratuitos ou de baixo custo",
            "Mais foco em economia do que em conveniência",
        ],
    },
    moderado: {
        key: "moderado",
        label: "Moderado",
        shortDescription: "Equilíbrio entre conforto, localização e custo-benefício.",
        buyerDescription:
            "Roteiro equilibrado, com bom conforto, localização conveniente e gastos controlados.",
        creatorHint:
            "Use Moderado quando o roteiro equilibra conforto, boa localização, passeios pagos e controle de gastos.",
        criteria: [
            "Hotéis 3 estrelas, apartamentos confortáveis ou boas pousadas",
            "Mistura de transporte público, rideshare, táxi ou aluguel pontual",
            "Restaurantes casuais e algumas experiências gastronômicas melhores",
            "Passeios pagos relevantes, mas sem excesso de experiências caras",
            "Boa experiência geral com equilíbrio entre preço e conforto",
        ],
    },
    luxo: {
        key: "luxo",
        label: "Luxo",
        shortDescription: "Alto conforto, conveniência e experiências premium.",
        buyerDescription:
            "Roteiro com alto padrão de conforto, hospedagens superiores, experiências premium e maior conveniência.",
        creatorHint:
            "Use Luxo quando o roteiro inclui alto conforto, experiências premium, transporte conveniente e menor foco em economia.",
        criteria: [
            "Hotéis 4 ou 5 estrelas, resorts, villas ou hospedagens boutique premium",
            "Transfers privados, motorista, táxi frequente ou transporte superior",
            "Restaurantes sofisticados, rooftops ou experiências gastronômicas marcantes",
            "Passeios privativos, tours premium, spas, beach clubs ou experiências exclusivas",
            "Mais foco em conforto, tempo e conveniência do que em economia",
        ],
    },
};

/** Nota geral mostrada nos modais de ajuda (criação e detalhe). */
export const BUDGET_STYLE_GENERAL_NOTE =
    "A categoria representa o padrão geral da experiência, não apenas o valor total. A VAMO considera hospedagem, transporte, alimentação, passeios e conveniência.";

/** Texto curto para o ROTEIRISTA (subtítulo da etapa de criação). */
export const BUDGET_STYLE_CREATOR_SUBTITLE =
    "Escolha o padrão geral da viagem considerando hospedagem, transporte, alimentação, passeios e conveniência.";

/** Texto de transparência para o VIAJANTE no detalhe do roteiro. */
export const BUDGET_STYLE_BUYER_TRANSPARENCY =
    "Essa classificação segue critérios da VAMO e é informada pelo roteirista com base no padrão geral da experiência.";

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
// Ordem alinhada a MODULE_ORDER (sectionOrder.ts): a sequência aqui é a
// MESMA que aparece no wizard de criação, nas views Original/Minha versão
// do roteiro comprado e nas seções do PDF. Mudar a ordem aqui propaga
// para tudo de uma vez — não reordenar nos consumidores.
export const MODULE_OPTIONS: { key: ModuleKey; label: string; desc: string; emoji: string }[] = [
    { key: "voo",           label: "Meu voo",              emoji: "✈️", desc: "Sugestões de voo" },
    { key: "hospedagem",    label: "Hospedagens",          emoji: "🏨", desc: "Hotéis e hospedagens sugeridas" },
    { key: "passeios",      label: "Passeios & Atrações",  emoji: "🎫", desc: "Atrações e passeios imperdíveis" },
    { key: "itinerario",    label: "Itinerário por dia",   emoji: "🗓️", desc: "Roteiro dia a dia completo" },
    { key: "transporte",    label: "Transporte",           emoji: "🚌", desc: "Dicas de locomoção" },
    { key: "restaurantes",  label: "Restaurantes",         emoji: "🍴", desc: "Onde comer" },
    { key: "dicas",         label: "Dicas exclusivas",     emoji: "💡", desc: "Dicas do criador (mín. 2)" },
    { key: "gastos_extras", label: "Gastos Extras",        emoji: "💰", desc: "Chip, seguro, taxas, gorjetas, lavanderia e outros" },
    { key: "checklist",     label: "Checklist interativo", emoji: "✅", desc: "O que levar (mín. 5)" },
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
