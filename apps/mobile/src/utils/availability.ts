// Single rule of "is this itinerary actually purchasable right now?"
//
// Shared by:
// - useCart (hydrates each id in storage → marks owned/available/unavailable)
// - Cart screen (renders the badge/banner)
// - Itinerary detail + ItineraryCard (gates "Adicionar ao carrinho" / "Comprar agora")
//
// Backend equivalent: status ∈ {APPROVED, ACTIVE} (apps/backend/src/routes/itineraries.ts).
// Keep this aligned with that list — when the product adds a new purchasable status,
// update both sides (or move to packages/shared and consume there).

export const PURCHASABLE_STATUSES = ['APPROVED', 'ACTIVE'] as const;

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
    DRAFT: 'Roteiro ainda é um rascunho do criador',
    PENDING_REVIEW: 'Roteiro em revisão pela VAMO',
    REJECTED: 'Roteiro não foi aprovado pela VAMO',
    PAUSED: 'Roteiro está pausado pelo criador',
    ARCHIVED: 'Roteiro foi arquivado pelo criador',
};

export const evaluateItineraryAvailability = (
    itinerary: any,
): AvailabilityResult => {
    if (!itinerary) {
        return { ok: false, reason: 'Roteiro removido ou não encontrado' };
    }

    const status = normalizeStatus(
        itinerary.status ?? itinerary.approvalStatus,
    );

    if (status && status !== 'APPROVED' && status !== 'ACTIVE') {
        return { ok: false, reason: REASONS[status] ?? 'Roteiro indisponível para compra' };
    }

    const price = Number(itinerary.price);
    if (!Number.isFinite(price) || price <= 0) {
        return { ok: false, reason: 'Preço não definido' };
    }

    return { ok: true };
};
