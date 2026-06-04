import { formatMoney } from '@vamo/shared/itinerary';
import type { EarningTransactionStatus, PayoutAccountStatus } from './types';

/** Currency formatter for the Australian market. Wraps the shared helper. */
export function formatCurrencyAUD(value: number): string {
    return formatMoney(value, 'AUD', 'en-AU');
}

/** Short, human date — e.g. "Mon, 10 Jun". Returns '—' for invalid input. */
export function formatShortDate(iso?: string): string {
    if (!iso) return '—';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('en-AU', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
    }).format(date);
}

/** Long-form date — e.g. "28 May 2026". */
export function formatLongDate(iso?: string): string {
    if (!iso) return '—';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('en-AU', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(date);
}

export interface TransactionStatusVisual {
    label: string;
    bg: string;
    fg: string;
}

export const TRANSACTION_STATUS_VISUALS: Record<EarningTransactionStatus, TransactionStatusVisual> = {
    pending:   { label: 'Pending',   bg: '#F59E0B1F', fg: '#A16207' },
    available: { label: 'Available', bg: '#28C9BF1F', fg: '#0F766E' },
    paid_out:  { label: 'Paid out',  bg: '#22C55E1F', fg: '#15803D' },
    refunded:  { label: 'Refunded',  bg: '#94A3B81F', fg: '#475569' },
    disputed:  { label: 'Disputed',  bg: '#EF44441F', fg: '#B91C1C' },
};

export interface PayoutSetupVisual {
    /** Card title — premium, non-technical. */
    title: string;
    /** Supporting copy. */
    description: string;
    /** Badge text on the right of the card. */
    badge: string;
    /** Badge palette. */
    badgeBg: string;
    badgeFg: string;
    /** Action button label. */
    ctaLabel: string;
    /** Primary action gets the teal pill; secondary is a subtle outline. */
    ctaVariant: 'primary' | 'secondary';
}

export const PAYOUT_SETUP_VISUALS: Record<PayoutAccountStatus, PayoutSetupVisual> = {
    not_started: {
        title: 'Set up your payouts',
        description:
            'Add your bank details and complete identity verification to receive your earnings.',
        badge: 'Action needed',
        badgeBg: '#F59E0B1F',
        badgeFg: '#A16207',
        ctaLabel: 'Set up payouts',
        ctaVariant: 'primary',
    },
    pending: {
        title: 'Finish your payout setup',
        description:
            'Add your bank details and complete identity verification to receive your earnings.',
        badge: 'Action needed',
        badgeBg: '#F59E0B1F',
        badgeFg: '#A16207',
        ctaLabel: 'Set up payouts',
        ctaVariant: 'primary',
    },
    verified: {
        title: 'Payouts are active',
        description:
            'Your bank account is connected and ready to receive payouts.',
        badge: 'Verified',
        badgeBg: '#22C55E1F',
        badgeFg: '#15803D',
        ctaLabel: 'Manage payout settings',
        ctaVariant: 'secondary',
    },
    restricted: {
        title: 'Payouts temporarily paused',
        description:
            'We need a few more details before we can send payouts to your bank account.',
        badge: 'Needs review',
        badgeBg: '#EF44441F',
        badgeFg: '#B91C1C',
        ctaLabel: 'Update details',
        ctaVariant: 'primary',
    },
    disabled: {
        title: 'Payouts disabled',
        description:
            'Your payout account is currently disabled. Please contact VAMO support to restore payouts.',
        badge: 'Disabled',
        badgeBg: '#94A3B81F',
        badgeFg: '#475569',
        ctaLabel: 'Contact support',
        ctaVariant: 'secondary',
    },
};
