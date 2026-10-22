/**
 * Helpers para a vitrine de venda do roteiro (tela de detalhes).
 *
 * Concentra a lógica de copy comercial que depende dos dados do roteiro
 * — categoria, estilo, módulos ativos, destaques — pra manter a tela
 * de detalhes enxuta e consistente com a "vitrine".
 *
 * Regra: nunca inventar atributos. Bullets/teasers só são gerados a
 * partir do que o criador realmente preencheu.
 */
import { STYLE_OPTIONS } from '@vamo/shared/itinerary';
import type { IconName } from '../components/common/Icons';
import { getCategoryChips } from './itineraryCardBadges';

// ─── Estilo da experiência ─────────────────────────────────────────
const STYLE_COPY: Record<string, string> = {
    economico:
        'Made for people who want to get more for less: choices focused on value.',
    moderado:
        'A balance of comfort, great experiences and controlled spending — without overdoing it.',
    luxo:
        'A more comfortable, premium experience with higher-end choices.',
};

export interface ExperienceStyle {
    key: string;
    label: string;
    blurb: string;
}

/**
 * Devolve um estilo principal pra exibir no bloco "Estilo da experiência".
 * Quando o criador marca mais de um, prioriza o primeiro do array (pode
 * ser estendido para mostrar múltiplos, mas hoje mostramos um pra evitar
 * conflito visual com Econômico+Luxo, p.ex.).
 */
export function getExperienceStyle(itinerary: any): ExperienceStyle | null {
    const styles: string[] = itinerary?.travelStyles ?? [];
    if (!Array.isArray(styles) || styles.length === 0) return null;
    const primary = styles[0];
    const opt = STYLE_OPTIONS.find((s) => s.key === primary);
    if (!opt) return null;
    return {
        key: opt.key,
        label: opt.label,
        blurb: STYLE_COPY[opt.key] ?? '',
    };
}

// ─── Counts derivados ──────────────────────────────────────────────
function arr(x: any): any[] {
    return Array.isArray(x) ? x : [];
}

function countDays(itinerary: any): number {
    return arr(itinerary?.days).length;
}
function countTips(itinerary: any): number {
    return arr(itinerary?.generalTips).filter((t) => typeof t === 'string' && t.trim()).length;
}
function countChecklist(itinerary: any): number {
    const items =
        arr(itinerary?.checklistItems).length > 0
            ? arr(itinerary?.checklistItems)
            : arr(itinerary?.checklists).length > 0
            ? arr(itinerary?.checklists)
            : arr(itinerary?.checklist);
    return items.filter((c: any) => typeof c?.item === 'string' && c.item.trim()).length;
}
function checklistCategories(itinerary: any): string[] {
    const items =
        arr(itinerary?.checklistItems).length > 0
            ? arr(itinerary?.checklistItems)
            : arr(itinerary?.checklists).length > 0
            ? arr(itinerary?.checklists)
            : arr(itinerary?.checklist);
    const set = new Set<string>();
    for (const c of items) {
        if (c?.cat && typeof c.cat === 'string') set.add(c.cat.trim());
    }
    return Array.from(set).filter(Boolean);
}
function countAttractions(itinerary: any): number {
    return arr(itinerary?.attractions).filter((a: any) => a?.name?.trim()).length;
}
function countRestaurants(itinerary: any): number {
    return arr(itinerary?.restaurants).filter((r: any) => r?.name?.trim()).length;
}
function countAccommodations(itinerary: any): number {
    return arr(itinerary?.accommodations).filter((a: any) => a?.name?.trim()).length;
}
function countMedia(itinerary: any): number {
    const images = arr(itinerary?.images).length;
    const media = arr(itinerary?.mediaUrls).length;
    const highlights = arr(itinerary?.highlightPhotos).length;
    return images + media + highlights;
}

// ─── "Por que comprar este roteiro?" ───────────────────────────────
export function getWhyBuyBullets(itinerary: any): string[] {
    const bullets: string[] = [];
    const active: string[] = arr(itinerary?.activeModules);
    const creatorName: string = itinerary?.creator?.name || 'a VAMO creator';

    bullets.push(`Created by ${creatorName} — someone who has been to the destination and organized what works.`);

    if (active.includes('itinerario') && countDays(itinerary) > 0) {
        bullets.push(`Day-by-day plan already structured for ${countDays(itinerary)} days.`);
    } else if (active.includes('itinerario')) {
        bullets.push('Day-by-day plan already structured to save you time.');
    }

    if (active.includes('dicas') && countTips(itinerary) > 0) {
        bullets.push(`${countTips(itinerary)} practical tips you'd normally only learn by traveling.`);
    } else if (active.includes('dicas')) {
        bullets.push('Practical tips you\'d normally only learn by traveling.');
    }

    const hasCostInfo =
        !!itinerary?.flightInfo ||
        countAttractions(itinerary) > 0 ||
        countRestaurants(itinerary) > 0 ||
        arr(itinerary?.extraSpendingItems).length > 0;
    if (hasCostInfo) {
        bullets.push('Cost references by category to help you plan your budget.');
    }

    if (active.includes('checklist') && countChecklist(itinerary) > 0) {
        bullets.push('A ready-to-use checklist to track your trip preparation.');
    }

    bullets.push('A digital product with instant access after payment is confirmed.');

    return bullets;
}

// ─── "Para quem é este roteiro?" ───────────────────────────────────
const CATEGORY_AUDIENCE: Record<string, string> = {
    natureza: 'nature experiences',
    gastronomia: 'food and drink experiences',
    cultura: 'cultural immersion',
    praia: 'beach destinations',
    mochilao: 'backpacking and budget travel',
    familia: 'family trips',
    romantico: 'trips for two',
    historico: 'destinations rich in history',
    festivais: 'festivals and local events',
    cruzeiros: 'cruises and sea voyages',
    aventura: 'adventures and outdoor activities',
    eurotrip: 'Europe trips and international travel',
    relax: 'rest and relaxation',
    esportes: 'sports and physical activities',
};

const STYLE_AUDIENCE: Record<string, string> = {
    economico: 'budget-friendly planning focused on value',
    moderado: 'moderate planning that balances comfort and spending',
    luxo: 'a more premium, comfortable experience',
};

export function getIdealForBullets(itinerary: any): string[] {
    const bullets: string[] = [];
    const categories: string[] = arr(itinerary?.categories);
    const styles: string[] = arr(itinerary?.travelStyles);
    const duration = Number(itinerary?.duration) || 0;
    const active: string[] = arr(itinerary?.activeModules);

    for (const cat of categories) {
        const desc = CATEGORY_AUDIENCE[cat];
        if (desc) bullets.push(desc);
    }

    if (styles.length > 0) {
        const desc = STYLE_AUDIENCE[styles[0]];
        if (desc) bullets.push(desc);
    }

    if (duration > 0) {
        bullets.push(`trips of about ${duration} days`);
    }

    if (active.includes('dicas') || active.includes('checklist')) {
        bullets.push('people who want to arrive prepared, with tips and a checklist in hand');
    }

    if (
        active.includes('gastos_extras') ||
        arr(itinerary?.attractions).length > 0 ||
        arr(itinerary?.restaurants).length > 0
    ) {
        bullets.push('people who want cost references before booking the trip');
    }

    // Deduplicar mantendo ordem
    return Array.from(new Set(bullets));
}

// ─── "Prévia do que você vai desbloquear" ──────────────────────────
export interface UnlockCard {
    key: string;
    title: string;
    subtitle: string;
    icon: IconName;
}

export function getUnlockPreviewCards(itinerary: any): UnlockCard[] {
    const cards: UnlockCard[] = [];
    const active: string[] = arr(itinerary?.activeModules);
    const duration = Number(itinerary?.duration) || 0;

    if (active.includes('itinerario')) {
        const days = countDays(itinerary) || duration;
        cards.push({
            key: 'itinerario',
            title: 'Complete itinerary',
            subtitle: days > 0 ? `${days} days organized step by step` : 'Detailed day-by-day schedule',
            icon: 'calendar',
        });
    }

    if (active.includes('dicas')) {
        const tips = countTips(itinerary);
        cards.push({
            key: 'dicas',
            title: tips > 0 ? `${tips} insider tips` : 'Insider tips',
            subtitle: 'Practical suggestions from someone who\'s been there',
            icon: 'gem',
        });
    }

    if (active.includes('passeios')) {
        const n = countAttractions(itinerary);
        cards.push({
            key: 'passeios',
            title: n > 0 ? `${n} tours mapped out` : 'Tours & attractions',
            subtitle: 'Must-see attractions with times and tips',
            icon: 'landmark',
        });
    }

    if (active.includes('restaurantes')) {
        const n = countRestaurants(itinerary);
        cards.push({
            key: 'restaurantes',
            title: n > 0 ? `${n} dining picks` : 'Restaurants & dining',
            subtitle: 'Where to eat well and local experiences',
            icon: 'utensils',
        });
    }

    if (active.includes('hospedagem')) {
        const n = countAccommodations(itinerary);
        cards.push({
            key: 'hospedagem',
            title: n > 0 ? `${n} suggested stays` : 'Lodging',
            subtitle: 'Where to stay and why to choose each area',
            icon: 'hotel',
        });
    }

    if (active.includes('checklist')) {
        const cats = checklistCategories(itinerary);
        const total = countChecklist(itinerary);
        const catSuffix = cats.length > 0
            ? `Includes ${cats.slice(0, 4).join(', ')}${cats.length > 4 ? '…' : ''}`
            : 'A complete list to track your preparation';
        cards.push({
            key: 'checklist',
            title: total > 0 ? `Checklist with ${total} items` : 'Planning checklist',
            subtitle: catSuffix,
            icon: 'clipboard-list',
        });
    }

    const hasCosts =
        !!itinerary?.flightInfo ||
        countAttractions(itinerary) > 0 ||
        countRestaurants(itinerary) > 0 ||
        arr(itinerary?.extraSpendingItems).length > 0;
    if (hasCosts) {
        cards.push({
            key: 'custos',
            title: 'Cost references',
            subtitle: 'Estimated or verified amounts by category',
            icon: 'wallet',
        });
    }

    return cards;
}

// ─── "Antes de comprar, saiba" ─────────────────────────────────────
export interface BeforeBuyItem {
    icon: IconName;
    text: string;
}

export function getBeforeBuyItems(itinerary: any): BeforeBuyItem[] {
    const items: BeforeBuyItem[] = [
        { icon: 'download', text: 'This is a digital product — you get access to the itinerary\'s content.' },
        { icon: 'lock', text: 'It doesn\'t include flights, lodging, tours or bookings — travel costs are for reference only.' },
        { icon: 'briefcase', text: 'The itinerary is available in My Itineraries once payment is confirmed.' },
    ];
    if (itinerary?.lifetimeAccess) {
        items.push({ icon: 'eye', text: 'Lifetime access: open the itinerary whenever you want, as many times as you need.' });
    }
    return items;
}

// Re-export pra centralizar import na tela
export { getCategoryChips };
