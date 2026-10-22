// Single rule of "is this itinerary actually purchasable right now?"
//
// Shared by:
// - useCart (hydrates each id in storage → marks available, or purges the id)
// - Cart screen (renders the badge)
// - Itinerary detail + ItineraryCard (gates "Adicionar ao carrinho" / "Comprar agora")
//
// Backend equivalent: status === 'ACTIVE' (apps/backend/src/lib/itineraryStatus.ts).
// ACTIVE is the ONLY public/purchasable status — APPROVED means "aprovado
// pela VAMO mas o criador ainda não publicou", nunca compravel. Keep this
// aligned with the backend — when the product adds a new purchasable
// status, update both sides (or move to packages/shared and consume there).

export const PURCHASABLE_STATUSES = ['ACTIVE'] as const;

const normalizeStatus = (raw: unknown): string =>
    String(raw ?? '').trim().toUpperCase();

export const isPurchasableStatus = (status: unknown): boolean => {
    const s = normalizeStatus(status);
    // Listing endpoints pre-filter; payloads without `status` are treated as
    // purchasable so cards that don't carry the field don't get falsely blocked.
    if (!s) return true;
    return (PURCHASABLE_STATUSES as readonly string[]).includes(s);
};

export type AvailabilityResult =
    | { ok: true }
    | { ok: false; reason: string };

const REASONS: Record<string, string> = {
    DRAFT: 'Itinerary is still a creator draft',
    PENDING_REVIEW: 'Itinerary is under VAMO review',
    REJECTED: 'Itinerary was not approved by VAMO',
    PAUSED: 'Itinerary is paused by the creator',
    ARCHIVED: 'Itinerary was archived by the creator',
};

export const evaluateItineraryAvailability = (
    itinerary: any,
): AvailabilityResult => {
    if (!itinerary) {
        return { ok: false, reason: 'Itinerary removed or not found' };
    }

    const status = normalizeStatus(
        itinerary.status ?? itinerary.approvalStatus,
    );

    if (status && status !== 'ACTIVE') {
        return { ok: false, reason: REASONS[status] ?? 'Itinerary unavailable for purchase' };
    }

    const price = Number(itinerary.price);
    if (!Number.isFinite(price) || price <= 0) {
        return { ok: false, reason: 'Price not set' };
    }

    return { ok: true };
};
