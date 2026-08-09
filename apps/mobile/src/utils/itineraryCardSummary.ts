/**
 * itineraryCardSummary — formatação e encaixe dos itens do painel de resumo
 * do card de roteiro.
 *
 * Só FORMATA e LIMITA. A origem dos dados continua em
 * `itineraryCardBadges.ts` (getCategoryChips / getModuleBadges) — nada aqui
 * decide o que é uma categoria válida nem qual módulo está preenchido.
 */

export interface SummaryItemLike {
    key: string;
    label: string;
}

// ── Destino ───────────────────────────────────────────────────────────────

/** Junta com vírgulas e "e" antes do último ("Tóquio, Kyoto e Osaka"). */
function joinNatural(parts: string[]): string {
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0];
    return `${parts.slice(0, -1).join(', ')} e ${parts[parts.length - 1]}`;
}

function cleanStrings(value: unknown): string[] {
    if (typeof value === 'string') return value.trim() ? [value.trim()] : [];
    if (Array.isArray(value)) return value.flatMap(cleanStrings);
    return [];
}

/**
 * Linha de destino do card: "Tóquio, Kyoto e Osaka · Japão".
 *
 * Retorna `null` quando não há nenhum dado de localização — o card não deve
 * renderizar a linha (nem "undefined, undefined", nem espaço reservado).
 *
 * ⚠️ Alguns cadastros têm destination/country invertidos (ver
 * [[search-filters-model]]); por isso só concatenamos, sem assumir semântica.
 */
export function formatItineraryDestination(itinerary: any): string | null {
    const places = [
        ...cleanStrings(itinerary?.destination),
        ...cleanStrings(itinerary?.city),
        ...cleanStrings(itinerary?.extraCities),
    ];
    const country = cleanStrings(itinerary?.country)[0] ?? null;

    // Dedup preservando ordem (destino principal primeiro).
    const seen = new Set<string>();
    const uniquePlaces = places.filter(place => {
        const key = place.toLowerCase();
        if (seen.has(key) || key === country?.toLowerCase()) return false;
        seen.add(key);
        return true;
    });

    const placesLabel = joinNatural(uniquePlaces);
    if (placesLabel && country) return `${placesLabel} · ${country}`;
    if (placesLabel) return placesLabel;
    if (country) return country;
    return null;
}

// ── Encaixe dos itens em UMA linha ────────────────────────────────────────

/**
 * Métricas do pill (mantidas em sincronia com os estilos de
 * ItinerarySummaryPanel). Só são usadas para ESTIMAR largura e decidir
 * quantos itens cabem — o pill em si ainda encolhe com ellipsis, então um
 * erro de estimativa nunca vira overflow nem corte pela metade.
 */
export const PILL_METRICS = {
    paddingHorizontal: 8,
    /** O pill "+X" não tem ícone e usa padding menor. */
    overflowPaddingHorizontal: 7,
    iconSize: 12,
    iconGap: 4,
    /**
     * Largura média por caractere em 11px semibold, CALIBRADA contra os pills
     * renderizados no app (Cultura 5,7 · Passeios 6,0 · Gastronomia 6,4 ·
     * Itinerário 5,0). 6,0 fica no topo da faixa comum: erra para mais, e o
     * erro só custa um item a menos — nunca um pill cortado.
     */
    charWidth: 6,
    /** Espaço entre pills. */
    gap: 6,
};

export function estimatePillWidth(label: string, withIcon = true): number {
    const padding = withIcon ? PILL_METRICS.paddingHorizontal : PILL_METRICS.overflowPaddingHorizontal;
    const icon = withIcon ? PILL_METRICS.iconSize + PILL_METRICS.iconGap : 0;
    return padding * 2 + icon + label.length * PILL_METRICS.charWidth;
}

export interface FitResult<T> {
    visible: T[];
    /** Quantos ficaram de fora — é exatamente o número do "+X". */
    hidden: number;
}

/**
 * Escolhe quantos itens cabem em UMA linha da largura disponível.
 *
 * Regras:
 *  - nunca passa de `maxItems` (2 estilos / 3 inclusos em card normal);
 *  - reserva espaço para o "+X" quando sobrar item escondido;
 *  - sempre mostra pelo menos 1 item quando existe algum (ele encolhe com
 *    ellipsis em vez de sumir);
 *  - `hidden` sempre reflete o total real que ficou de fora.
 *
 * `availableWidth <= 0` (antes do primeiro layout) devolve o corte por
 * `maxItems`, para o primeiro frame já sair coerente.
 */
export function fitSummaryItems<T extends SummaryItemLike>(
    items: T[],
    availableWidth: number,
    maxItems: number,
): FitResult<T> {
    const total = items.length;
    if (total === 0) return { visible: [], hidden: 0 };

    const cap = Math.max(1, Math.min(maxItems, total));

    if (!Number.isFinite(availableWidth) || availableWidth <= 0) {
        return { visible: items.slice(0, cap), hidden: total - cap };
    }

    let used = 0;
    let count = 0;

    for (let i = 0; i < cap; i++) {
        const width = estimatePillWidth(items[i].label);
        const gap = count === 0 ? 0 : PILL_METRICS.gap;
        // Ainda vai sobrar item depois deste? Então precisa caber o "+X".
        const remainingAfter = total - (count + 1);
        const overflowReserve = remainingAfter > 0
            ? PILL_METRICS.gap + estimatePillWidth(`+${remainingAfter}`, false)
            : 0;

        if (used + gap + width + overflowReserve > availableWidth && count > 0) break;
        used += gap + width;
        count += 1;
    }

    return { visible: items.slice(0, count), hidden: total - count };
}

// ── Acessibilidade ────────────────────────────────────────────────────────

/**
 * Descrição do painel para leitor de tela, com TODOS os itens reais — quem
 * navega por áudio não deve ouvir "mais dois" sem saber do que se trata.
 */
export function buildSummaryAccessibilityLabel(
    categories: SummaryItemLike[],
    modules: SummaryItemLike[],
): string | undefined {
    const parts: string[] = [];
    if (categories.length > 0) parts.push(`Estilo: ${joinNatural(categories.map(c => c.label))}.`);
    if (modules.length > 0) parts.push(`Inclui: ${joinNatural(modules.map(m => m.label))}.`);
    return parts.length > 0 ? parts.join(' ') : undefined;
}
