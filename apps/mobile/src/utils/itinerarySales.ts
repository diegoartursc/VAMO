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
        'Pensado para quem quer aproveitar mais gastando menos: escolhas com foco em custo-benefício.',
    moderado:
        'Equilíbrio entre conforto, boas experiências e controle de gastos — sem exageros.',
    luxo:
        'Experiência mais confortável e premium, com escolhas de maior padrão.',
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
    const creatorName: string = itinerary?.creator?.name || 'um criador VAMO';

    bullets.push(`Criado por ${creatorName} — alguém que já esteve no destino e organizou o que funciona.`);

    if (active.includes('itinerario') && countDays(itinerary) > 0) {
        bullets.push(`Planejamento dia a dia já estruturado para ${countDays(itinerary)} dias.`);
    } else if (active.includes('itinerario')) {
        bullets.push('Planejamento dia a dia já estruturado para economizar seu tempo.');
    }

    if (active.includes('dicas') && countTips(itinerary) > 0) {
        bullets.push(`${countTips(itinerary)} dicas práticas que normalmente só se descobrem viajando.`);
    } else if (active.includes('dicas')) {
        bullets.push('Dicas práticas que normalmente só se descobrem viajando.');
    }

    const hasCostInfo =
        !!itinerary?.flightInfo ||
        countAttractions(itinerary) > 0 ||
        countRestaurants(itinerary) > 0 ||
        arr(itinerary?.extraSpendingItems).length > 0;
    if (hasCostInfo) {
        bullets.push('Referências de custos por categoria para você planejar melhor o orçamento.');
    }

    if (active.includes('checklist') && countChecklist(itinerary) > 0) {
        bullets.push('Checklist pronto para acompanhar a preparação da viagem.');
    }

    bullets.push('Produto digital com acesso imediato após a confirmação do pagamento.');

    return bullets;
}

// ─── "Para quem é este roteiro?" ───────────────────────────────────
const CATEGORY_AUDIENCE: Record<string, string> = {
    natureza: 'experiências em meio à natureza',
    gastronomia: 'experiências gastronômicas',
    cultura: 'imersão cultural',
    praia: 'destinos de praia',
    mochilao: 'mochilão e viagens econômicas',
    familia: 'viagens em família',
    romantico: 'viagens a dois',
    historico: 'destinos com forte carga histórica',
    festivais: 'festivais e eventos locais',
    cruzeiros: 'cruzeiros e viagens marítimas',
    aventura: 'aventuras e atividades ao ar livre',
    eurotrip: 'eurotrips e viagens internacionais',
    relax: 'descanso e bem-estar',
    esportes: 'esportes e atividades físicas',
};

const STYLE_AUDIENCE: Record<string, string> = {
    economico: 'planejamento econômico, com foco em custo-benefício',
    moderado: 'planejamento moderado, equilibrando conforto e gastos',
    luxo: 'experiência mais premium e confortável',
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
        bullets.push(`viagens de aproximadamente ${duration} dias`);
    }

    if (active.includes('dicas') || active.includes('checklist')) {
        bullets.push('quem quer chegar preparado, com dicas e checklist na mão');
    }

    if (
        active.includes('gastos_extras') ||
        arr(itinerary?.attractions).length > 0 ||
        arr(itinerary?.restaurants).length > 0
    ) {
        bullets.push('quem prefere ter referência de custos antes de fechar a viagem');
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
            title: 'Itinerário completo',
            subtitle: days > 0 ? `${days} dias organizados passo a passo` : 'Programação dia a dia detalhada',
            icon: 'calendar',
        });
    }

    if (active.includes('dicas')) {
        const tips = countTips(itinerary);
        cards.push({
            key: 'dicas',
            title: tips > 0 ? `${tips} dicas exclusivas` : 'Dicas exclusivas',
            subtitle: 'Sugestões práticas de quem esteve lá',
            icon: 'gem',
        });
    }

    if (active.includes('passeios')) {
        const n = countAttractions(itinerary);
        cards.push({
            key: 'passeios',
            title: n > 0 ? `${n} passeios mapeados` : 'Passeios & atrações',
            subtitle: 'Atrações imperdíveis com horários e dicas',
            icon: 'landmark',
        });
    }

    if (active.includes('restaurantes')) {
        const n = countRestaurants(itinerary);
        cards.push({
            key: 'restaurantes',
            title: n > 0 ? `${n} indicações gastronômicas` : 'Restaurantes & gastronomia',
            subtitle: 'Onde comer bem e experiências locais',
            icon: 'utensils',
        });
    }

    if (active.includes('hospedagem')) {
        const n = countAccommodations(itinerary);
        cards.push({
            key: 'hospedagem',
            title: n > 0 ? `${n} hospedagens sugeridas` : 'Hospedagens',
            subtitle: 'Onde ficar e por que escolher cada região',
            icon: 'hotel',
        });
    }

    if (active.includes('checklist')) {
        const cats = checklistCategories(itinerary);
        const total = countChecklist(itinerary);
        const catSuffix = cats.length > 0
            ? `Inclui ${cats.slice(0, 4).join(', ')}${cats.length > 4 ? '…' : ''}`
            : 'Lista completa para acompanhar a preparação';
        cards.push({
            key: 'checklist',
            title: total > 0 ? `Checklist com ${total} itens` : 'Checklist de planejamento',
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
            title: 'Referências de custos',
            subtitle: 'Valores estimados ou comprovados por categoria',
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
        { icon: 'download', text: 'Este é um produto digital — você recebe acesso ao conteúdo do roteiro.' },
        { icon: 'lock', text: 'Não inclui passagens, hospedagens, passeios ou reservas — gastos de viagem são apenas referências informativas.' },
        { icon: 'briefcase', text: 'O roteiro fica disponível em Meus Roteiros após a confirmação do pagamento.' },
    ];
    if (itinerary?.lifetimeAccess) {
        items.push({ icon: 'eye', text: 'Acesso permanente: consulte o roteiro quando quiser, quantas vezes precisar.' });
    }
    return items;
}

// Re-export pra centralizar import na tela
export { getCategoryChips };
