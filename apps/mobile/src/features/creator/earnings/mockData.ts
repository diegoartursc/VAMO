import type {
    CreatorEarningTransaction,
    CreatorEarningsSummary,
} from './types';

// VAMO platform fee used to derive net amount in the mocks (25%).
// Not surfaced in UI as a fixed rule — kept here just for mock math.
const VAMO_FEE_RATE = 0.25;

const buildTx = (
    overrides: Partial<CreatorEarningTransaction> & Pick<
        CreatorEarningTransaction,
        'id' | 'itineraryId' | 'itineraryTitle' | 'saleDate' | 'grossAmount' | 'status'
    >,
): CreatorEarningTransaction => {
    const platformFee = +(overrides.grossAmount * VAMO_FEE_RATE).toFixed(2);
    const estimatedPayout = +(overrides.grossAmount - platformFee).toFixed(2);
    return {
        currency: 'AUD',
        platformFee,
        estimatedPayout,
        ...overrides,
    };
};

export const mockCreatorEarningsSummary: CreatorEarningsSummary = {
    currency: 'AUD',
    availableBalance: 428.5,
    pendingBalance: 196,
    totalEarned: 2840.75,
    nextPayoutDate: '2026-06-10',
    payoutAccountStatus: 'pending',
};

export const mockCreatorEarningTransactions: CreatorEarningTransaction[] = [
    buildTx({
        id: 'txn_001',
        itineraryId: 'itn_melbourne_cafes',
        itineraryTitle: 'Melbourne Hidden Cafés Weekend',
        saleDate: '2026-05-28',
        grossAmount: 49,
        status: 'available',
    }),
    buildTx({
        id: 'txn_002',
        itineraryId: 'itn_sydney_first_timer',
        itineraryTitle: 'Sydney 5-Day First Timer Guide',
        saleDate: '2026-05-27',
        grossAmount: 79,
        status: 'pending',
    }),
    buildTx({
        id: 'txn_003',
        itineraryId: 'itn_tasmania_roadtrip',
        itineraryTitle: 'Tasmania Road Trip Planner',
        saleDate: '2026-05-24',
        grossAmount: 129,
        status: 'paid_out',
    }),
    buildTx({
        id: 'txn_004',
        itineraryId: 'itn_byron_long_weekend',
        itineraryTitle: 'Byron Bay Long Weekend',
        saleDate: '2026-05-21',
        grossAmount: 59,
        status: 'paid_out',
    }),
    buildTx({
        id: 'txn_005',
        itineraryId: 'itn_great_ocean_road',
        itineraryTitle: 'Great Ocean Road in 3 Days',
        saleDate: '2026-05-18',
        grossAmount: 89,
        status: 'paid_out',
    }),
    buildTx({
        id: 'txn_006',
        itineraryId: 'itn_uluru_outback',
        itineraryTitle: 'Uluru & Red Centre Essentials',
        saleDate: '2026-05-14',
        grossAmount: 119,
        status: 'refunded',
    }),
];
