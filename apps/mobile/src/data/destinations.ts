/**
 * Metadados COMPLEMENTARES de destino.
 *
 * A lista estática de "destinos populares" que existia aqui foi removida: ela
 * não representava os roteiros publicados (sugeria Paris, Cancún, Dubai… sem
 * nenhum roteiro por trás). As sugestões do autocomplete passam a ser
 * derivadas dos roteiros reais — ver `buildDestinationSuggestions` em
 * `utils/searchUtils.ts`.
 *
 * O que sobra aqui é só enriquecimento de BUSCA: apelidos e grafias
 * alternativas (inglês, sem acento, nome antigo) que o usuário pode digitar e
 * que não aparecem literalmente no cadastro do roteiro. Nada aqui cria
 * sugestão — apenas amplia o que um texto digitado consegue encontrar.
 */

/**
 * alias digitado (normalizado) → termos canônicos (normalizados) que ele deve
 * alcançar. Mantido pequeno e de propósito: cada entrada existe porque um
 * australiano/brasileiro pode digitar assim.
 */
export const DESTINATION_ALIASES: Record<string, string[]> = {
    tokyo: ['toquio'],
    japan: ['japao'],
    kioto: ['kyoto'],
    australia: ['australia'],
    spain: ['espanha'],
    france: ['franca'],
    italy: ['italia'],
    greece: ['grecia'],
    portugal: ['portugal'],
    lisbon: ['lisboa'],
    brazil: ['brasil'],
    'new york': ['nova york'],
    'nova iorque': ['nova york'],
    thailand: ['tailandia'],
    bali: ['bali'],
    indonesia: ['indonesia'],
};

/**
 * Expande um termo já normalizado nas variantes que devem ser testadas contra
 * os campos do roteiro. Sempre inclui o próprio termo.
 */
export function expandDestinationAliases(normalizedTerm: string): string[] {
    if (!normalizedTerm) return [];
    const variants = new Set<string>([normalizedTerm]);

    for (const [alias, canonicals] of Object.entries(DESTINATION_ALIASES)) {
        // Prefixo basta: quem digita "tok" já deve alcançar "toquio".
        if (alias.startsWith(normalizedTerm) || normalizedTerm.startsWith(alias)) {
            canonicals.forEach(canonical => variants.add(canonical));
        }
    }

    return Array.from(variants);
}
