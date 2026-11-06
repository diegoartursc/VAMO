import type { PayoutAccountStatus } from './types';

/** Mostra o aviso quando há ganho (pendente ou liberado) e a conta de recebimento não está pronta. */
export function shouldShowPayoutWaiting(totalUnpaid: number, status: PayoutAccountStatus | null | undefined): boolean {
    return totalUnpaid > 0 && status !== 'verified';
}

/**
 * Texto do aviso, coerente com a regra dos 7 dias:
 * - algo já liberado → "pronto para pagar", depende só do cadastro;
 * - só pendente → mostra quando libera; o cadastro é para não atrasar.
 */
export function payoutWaitingCopy(available: number, pending: number, releaseLabel: string | null, fmt: (n: number) => string) {
    if (available > 0) {
        return {
            title: `${fmt(available)} is ready to be paid to you`,
            body: `Set up payouts so we can send it to your bank.${pending > 0 ? ` Another ${fmt(pending)} is still in the 7-day refund window.` : ''} Your money stays safe with VAMO until then.`,
        };
    }
    return {
        title: `${fmt(pending)} in pending earnings`,
        body: `Earnings are released 7 days after each purchase${releaseLabel ? ` (next release: ${releaseLabel})` : ''}. Set up payouts now so they reach your bank as soon as they're released. It takes about 10 minutes with Stripe.`,
    };
}
