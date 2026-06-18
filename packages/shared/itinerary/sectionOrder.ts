/**
 * sectionOrder — fonte ÚNICA de ordenação das seções do roteiro.
 *
 * O fluxo de leitura segue a ordem natural da viagem: como você vai (voo) →
 * onde dorme (hospedagem) → o que vai ver (passeios) → quando vê o quê
 * (itinerário por dia) → como se desloca dentro do destino (transporte) →
 * onde come (restaurantes) → o que aprendeu na estrada (dicas) → orçamento
 * extra → o que levar (checklist). Mídia e Avaliar só fazem sentido no
 * roteiro comprado e vão no FIM.
 *
 * Cada tela (criação, OriginalView, MyRouteView, PDF, atalhos) DEVE consultar
 * essa lista. Reordenar aqui = reordenar em todo lugar.
 */

export type RouteSectionKey =
    | 'flight'         // Meu voo
    | 'accommodation'  // Onde fiquei / Hospedagens
    | 'attractions'    // Passeios & Atrações
    | 'itinerary'      // Itinerário por dia
    | 'transport'      // Transportes
    | 'restaurants'    // Restaurantes & Gastronomia
    | 'tips'           // Dicas do viajante
    | 'extraExpenses'  // Gastos extras
    | 'checklist'      // Checklist do roteiro
    | 'media'          // Fotos e vídeos da viagem (só no comprado)
    | 'review'         // Avaliar este roteiro (só no comprado)
    ;

/**
 * Ordem canônica usada em todas as telas que listam os MÓDULOS do roteiro
 * (sem mídia/review, que existem apenas no roteiro comprado).
 */
export const MODULE_ORDER: readonly RouteSectionKey[] = [
    'flight',
    'accommodation',
    'attractions',
    'itinerary',
    'transport',
    'restaurants',
    'tips',
    'extraExpenses',
    'checklist',
] as const;

/** Ordem do roteiro COMPRADO (adiciona mídia e avaliar no fim). */
export const PURCHASED_SECTION_ORDER: readonly RouteSectionKey[] = [
    ...MODULE_ORDER,
    'media',
    'review',
] as const;

/** Ordem do WIZARD de criação (mídia entra; review é o passo final do wizard). */
export const CREATION_MODULE_ORDER: readonly RouteSectionKey[] = [
    ...MODULE_ORDER,
    'media',
] as const;

/**
 * Retorna o índice de uma key na ordem canônica; usado por sorts estáveis.
 * Keys desconhecidas vão para o FIM (não somem) — defensivo contra módulos
 * legados não declarados aqui.
 */
export function moduleOrderIndex(key: RouteSectionKey | string): number {
    const idx = MODULE_ORDER.indexOf(key as RouteSectionKey);
    return idx === -1 ? MODULE_ORDER.length : idx;
}

/**
 * Ordena estável uma lista de objetos pela `key` declarada (objeto deve
 * expor a key via accessor). Útil para reorganizar arrays de "selected
 * modules" sem reimplementar a comparação em cada tela.
 */
export function sortByModuleOrder<T>(items: T[], keyOf: (item: T) => string): T[] {
    return items
        .map((item, originalIndex) => ({ item, originalIndex, idx: moduleOrderIndex(keyOf(item)) }))
        .sort((a, b) => a.idx - b.idx || a.originalIndex - b.originalIndex)
        .map(({ item }) => item);
}
