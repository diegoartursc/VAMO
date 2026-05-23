/**
 * Derives real module/category data from itinerary objects.
 *
 * Source of truth for what the card, preview and detail screens display.
 * Handles BOTH the wizard form shape (flightOutbound, checklistItems) AND
 * the backend API shape (flightInfo, checklists/checklist alias).
 *
 * A module is "visible" only when it is both:
 *   1. listed in activeModules
 *   2. has real content (or content array is absent and we trust activeModules)
 */
import { CATEGORY_OPTIONS } from '@vamo/shared/itinerary';
import type { IconName } from '../components/common/Icons';

export interface ModuleBadge {
    key: string;
    label: string;
    icon: IconName;
}

export interface CategoryChip {
    key: string;
    label: string;
    emoji: string;
}

export interface ReceivedModule {
    key: string;
    title: string;
    description: string;
    icon: IconName;
    iconColor: string;
    bgColor: string;
}

// Short badge config (card chips)
const MODULE_BADGE_CONFIG: Record<string, { label: string; icon: IconName }> = {
    itinerario:    { label: "Itinerário",       icon: "calendar" },
    passeios:      { label: "Passeios",         icon: "landmark" },
    hospedagem:    { label: "Hospedagens",      icon: "hotel" },
    transporte:    { label: "Transporte",       icon: "car" },
    restaurantes:  { label: "Gastronomia",      icon: "utensils" },
    dicas:         { label: "Dicas exclusivas", icon: "gem" },
    checklist:     { label: "Checklist",        icon: "clipboard-list" },
    voo:           { label: "Voos",             icon: "plane" },
    gastos_extras: { label: "Gastos extras",    icon: "wallet" },
};

// Full module details (for "O que você vai receber" sections in preview/detail)
const NAVY = '#1A3263';
const TEAL = '#28C9BF';
const NAVY_BG = '#F0F4F8';
const TEAL_BG = '#F0FAF9';

const MODULE_DETAILS: Record<string, Omit<ReceivedModule, 'key'>> = {
    itinerario: {
        title: 'Diário de Viagem Detalhado',
        description: 'Programação dia a dia com horários, locais e dicas práticas para cada atividade',
        icon: 'calendar', iconColor: NAVY, bgColor: NAVY_BG,
    },
    voo: {
        title: 'Voos & Itinerário Aéreo',
        description: 'Voos recomendados, horários, companhias aéreas e dicas para sua chegada',
        icon: 'plane', iconColor: TEAL, bgColor: TEAL_BG,
    },
    hospedagem: {
        title: 'Hotéis & Hospedagens',
        description: 'Lista com os melhores lugares para se hospedar e localização estratégica',
        icon: 'hotel', iconColor: NAVY, bgColor: NAVY_BG,
    },
    passeios: {
        title: 'Passeios & Atrações',
        description: 'Atrações imperdíveis, preços de ingressos e como evitar filas',
        icon: 'landmark', iconColor: TEAL, bgColor: TEAL_BG,
    },
    transporte: {
        title: 'Locomoção',
        description: 'Como se locomover na cidade: metrô, ônibus, apps e passes de transporte',
        icon: 'car', iconColor: NAVY, bgColor: NAVY_BG,
    },
    dicas: {
        title: 'Dicas Exclusivas',
        description: 'Truques de quem já foi: melhores horários, segredos locais e como economizar',
        icon: 'gem', iconColor: TEAL, bgColor: TEAL_BG,
    },
    restaurantes: {
        title: 'Restaurantes & Gastronomia',
        description: 'Onde comer bem, opções para todos os bolsos e pratos típicos imperdíveis',
        icon: 'utensils', iconColor: NAVY, bgColor: NAVY_BG,
    },
    checklist: {
        title: 'Checklist de Planejamento',
        description: 'Lista interativa com documentos, itens de mala e tarefas pré-viagem',
        icon: 'clipboard-list', iconColor: TEAL, bgColor: TEAL_BG,
    },
    gastos_extras: {
        title: 'Gastos Extras',
        description: 'Chip de internet, seguro, taxas, gorjetas e outros custos da viagem',
        icon: 'wallet', iconColor: NAVY, bgColor: NAVY_BG,
    },
};

// Display priority (most relevant for purchase decision first)
const MODULE_PRIORITY = [
    "itinerario", "passeios", "hospedagem", "transporte",
    "restaurantes", "dicas", "checklist", "voo", "gastos_extras",
];

/**
 * Whether a module has real, non-empty content.
 *
 * - When the corresponding content array is ABSENT from the payload
 *   (e.g. lightweight list endpoint), we trust activeModules and return true.
 * - When the content array is PRESENT but empty/blank, we return false.
 *
 * Handles wizard form shape (flightOutbound, checklistItems) AND backend
 * API shape (flightInfo, checklists/checklist).
 */
function isModulePopulated(itinerary: any, key: string): boolean {
    switch (key) {
        case "itinerario":
            if (itinerary.days !== undefined) return (itinerary.days?.length ?? 0) > 0;
            return true;

        case "voo": {
            // Wizard form shape
            if (itinerary.flightOutbound !== undefined || itinerary.flightReturn !== undefined) {
                return !!(
                    itinerary.flightOutbound?.airline ||
                    itinerary.flightOutbound?.originCity ||
                    itinerary.flightReturn?.airline ||
                    itinerary.flightReturn?.originCity
                );
            }
            // Backend API shape
            if (itinerary.flightInfo !== undefined) {
                const f = itinerary.flightInfo;
                if (f === null) return false;
                return !!(
                    f?.outbound?.airline || f?.outbound?.originCity ||
                    f?.return?.airline || f?.return?.originCity
                );
            }
            return true;
        }

        case "hospedagem":
            if (itinerary.accommodations !== undefined) {
                return (itinerary.accommodations ?? []).some((a: any) => a?.name?.trim());
            }
            return true;

        case "passeios":
            if (itinerary.attractions !== undefined) {
                return (itinerary.attractions ?? []).some((a: any) => a?.name?.trim());
            }
            return true;

        case "transporte":
            if (itinerary.transports !== undefined) {
                return (itinerary.transports ?? []).some((t: any) => t?.description?.trim() || t?.passTypes?.trim());
            }
            return true;

        case "dicas":
            if (itinerary.generalTips !== undefined) {
                return (itinerary.generalTips ?? []).some((t: any) => typeof t === 'string' && t.trim());
            }
            return true;

        case "restaurantes":
            if (itinerary.restaurants !== undefined) {
                return (itinerary.restaurants ?? []).some((r: any) => r?.name?.trim());
            }
            return true;

        case "checklist": {
            // Wizard shape
            if (itinerary.checklistItems !== undefined) {
                return (itinerary.checklistItems ?? []).some((c: any) => c?.item?.trim());
            }
            // Backend shape (both alias names)
            if (itinerary.checklists !== undefined) {
                return (itinerary.checklists ?? []).some((c: any) => c?.item?.trim());
            }
            if (itinerary.checklist !== undefined) {
                return (itinerary.checklist ?? []).some((c: any) => c?.item?.trim());
            }
            return true;
        }

        case "gastos_extras":
            if (itinerary.extraSpendingItems !== undefined) {
                return (itinerary.extraSpendingItems ?? []).some((e: any) => e?.title?.trim());
            }
            return true;

        default:
            return false;
    }
}

/**
 * Returns the keys of all modules that are active AND populated.
 * Sorted by display priority.
 */
function getVisibleModuleKeys(itinerary: any): string[] {
    const activeModules: string[] = itinerary?.activeModules ?? [];
    if (activeModules.length === 0) return [];
    return MODULE_PRIORITY.filter(
        key => activeModules.includes(key) && isModulePopulated(itinerary, key),
    );
}

/**
 * Compact badges for vitrine cards. Max recommended display: 3.
 */
export function getModuleBadges(itinerary: any): ModuleBadge[] {
    return getVisibleModuleKeys(itinerary)
        .map(key => ({ key, ...MODULE_BADGE_CONFIG[key] }))
        .filter(b => !!b.label);
}

/**
 * Thematic category chips derived from itinerary.categories.
 */
export function getCategoryChips(itinerary: any): CategoryChip[] {
    const categories: string[] = itinerary?.categories ?? [];
    if (categories.length === 0) return [];
    return categories
        .map(key => CATEGORY_OPTIONS.find(opt => opt.key === key))
        .filter((opt): opt is NonNullable<typeof opt> => !!opt)
        .map(opt => ({ key: opt.key, label: opt.label, emoji: opt.emoji }));
}

/**
 * Full "what you'll receive" list for preview and detail screens.
 * Each entry includes title, description, icon and colors.
 *
 * The buyer sees ONLY modules that the creator activated and filled.
 */
export function getReceivedModules(itinerary: any): ReceivedModule[] {
    return getVisibleModuleKeys(itinerary)
        .map(key => ({ key, ...MODULE_DETAILS[key] }))
        .filter(m => !!m.title);
}
