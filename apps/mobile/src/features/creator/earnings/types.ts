// Creator earnings — type contracts for the in-app financial area.
//
// Designed so we can swap the current mock for a real backend response
// (Stripe Connect Express + VAMO ledger) without touching the UI.

export type CurrencyCode = 'AUD';

export type PayoutAccountStatus =
    | 'not_started'
    | 'pending'
    | 'verified'
    | 'restricted'
    | 'disabled';

export type EarningTransactionStatus =
    | 'pending'
    | 'available'
    | 'paid_out'
    | 'refunded'
    | 'disputed';

export interface CreatorEarningsSummary {
    currency: CurrencyCode;
    availableBalance: number;
    pendingBalance: number;
    totalEarned: number;
    /** ISO-8601 date string of the next scheduled payout. */
    nextPayoutDate?: string;
    payoutAccountStatus: PayoutAccountStatus;
}

export interface CreatorEarningTransaction {
    id: string;
    itineraryId: string;
    itineraryTitle: string;
    /** ISO-8601 date string of the sale. */
    saleDate: string;
    grossAmount: number;
    platformFee: number;
    stripeFee?: number;
    estimatedPayout: number;
    currency: CurrencyCode;
    status: EarningTransactionStatus;
}
