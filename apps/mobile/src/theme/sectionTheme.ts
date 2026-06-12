// VAMO — Identidade visual por seção (roteiro comprado)
//
// Cada seção importante do roteiro ganha um acento de cor próprio, sutil e
// consistente, aplicado APENAS em elementos pequenos (ícone, barra lateral,
// badge). Nada de pintar a tela inteira. As cores são derivadas da paleta
// VAMO (teal/navy) e estendidas com tons suaves e legíveis sobre branco.
//
// Uso típico:
//   import { sectionThemeFor, inferSectionKey } from '../../theme/sectionTheme';
//   const accent = sectionThemeFor('flight').accent;
//
// Para tints, basta concatenar o sufixo alpha hex (RN aceita #RRGGBBAA):
//   backgroundColor: accent + '1A'   // ~10% opacidade
//
// IMPORTANTE: este arquivo é puramente visual. Não altera dados, cálculo,
// nem comportamento — só centraliza tokens de cor/ícone por seção.

export type SectionKey =
    | 'itinerary'
    | 'stays'
    | 'flight'
    | 'attractions'
    | 'transport'
    | 'food'
    | 'tips'
    | 'costs'
    | 'checklist'
    | 'files';

export interface SectionThemeEntry {
    /** Cor de acento (ícone, barra lateral, texto do badge). Legível sobre branco. */
    accent: string;
    /** Ícone Ionicons padrão da seção. */
    icon: string;
}

export const sectionTheme: Record<SectionKey, SectionThemeEntry> = {
    itinerary: { accent: '#1FA89F', icon: 'map-outline' },              // teal VAMO — a jornada
    stays: { accent: '#0EA37A', icon: 'bed-outline' },                 // verde/teal suave
    flight: { accent: '#2F80ED', icon: 'airplane-outline' },           // azul céu
    attractions: { accent: '#0CA5B8', icon: 'camera-outline' },        // turquesa
    transport: { accent: '#0E7490', icon: 'navigate-outline' },        // azul petróleo
    food: { accent: '#EC6A5E', icon: 'restaurant-outline' },           // coral/laranja suave
    tips: { accent: '#CA8A04', icon: 'bulb-outline' },                 // amarelo/âmbar
    costs: { accent: '#B45309', icon: 'wallet-outline' },              // dourado/âmbar profundo
    checklist: { accent: '#16A34A', icon: 'checkmark-circle-outline' },// verde
    files: { accent: '#6366F1', icon: 'folder-outline' },              // roxo/azul suave
};

const DEFAULT_ENTRY: SectionThemeEntry = { accent: '#1FA89F', icon: 'ellipse-outline' };

/** Retorna o tema da seção (ou um fallback teal) — nunca lança. */
export function sectionThemeFor(key?: SectionKey | null): SectionThemeEntry {
    return (key && sectionTheme[key]) || DEFAULT_ENTRY;
}

/**
 * Mapeia o RÓTULO em PT-BR de uma seção para sua chave de tema. Permite
 * aplicar identidade por seção sem precisar tocar em todos os call sites
 * dos cabeçalhos existentes — basta inferir pela label já passada.
 */
const LABEL_TO_KEY: Record<string, SectionKey> = {
    'Itinerário por Dia': 'itinerary',
    'Onde Fiquei': 'stays',
    'Meu Voo': 'flight',
    'Passeios & Atrações': 'attractions',
    'Transporte': 'transport',
    'Restaurantes & Gastronomia': 'food',
    'Dicas do Viajante': 'tips',
    'Gastos Extras': 'costs',
    'Checklist do roteiro': 'checklist',
};

export function inferSectionKey(label?: string): SectionKey | undefined {
    if (!label) return undefined;
    return LABEL_TO_KEY[label.trim()];
}
