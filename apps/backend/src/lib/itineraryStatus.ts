/**
 * Regra ÚNICA de status público/comercial de um Itinerary. Todo endpoint que
 * decide "esse roteiro pode aparecer/ser comprado publicamente?" importa
 * daqui — nunca reescreve a lista de status permitida localmente.
 *
 * Semântica (ver CLAUDE.md / auditoria do ciclo de publicação):
 *   DRAFT, PENDING_REVIEW, REJECTED, APPROVED → nunca públicos, nunca compráveis.
 *     APPROVED = aprovado pela VAMO mas ainda não publicado pelo criador
 *     ("Publicar roteiro" leva ACTIVE).
 *   ACTIVE    → único status público e comercialmente disponível.
 *   PAUSED    → despublicado temporariamente pelo criador. Compradores
 *     anteriores mantêm acesso via /purchased; público não vê mais.
 *   ARCHIVED  → retirado comercialmente (soft delete). Mesmo efeito público
 *     que PAUSED; nunca reativa sozinho.
 */

export const PUBLIC_ITINERARY_STATUS = 'ACTIVE' as const;
export const PURCHASABLE_ITINERARY_STATUS = 'ACTIVE' as const;

function normalize(status: unknown): string {
    return String(status ?? '').trim().toUpperCase();
}

/** true somente para status === 'ACTIVE'. Único status visível ao público. */
export function isPublicItineraryStatus(status: unknown): boolean {
    return normalize(status) === PUBLIC_ITINERARY_STATUS;
}

/** Hoje idêntico a isPublicItineraryStatus — só ACTIVE pode ser comprado. */
export function isPurchasableItineraryStatus(status: unknown): boolean {
    return normalize(status) === PURCHASABLE_ITINERARY_STATUS;
}

/** Where-clause Prisma pronta para reuso em `itinerary.findMany/findFirst`. */
export const PUBLIC_ITINERARY_WHERE = { status: PUBLIC_ITINERARY_STATUS } as const;
