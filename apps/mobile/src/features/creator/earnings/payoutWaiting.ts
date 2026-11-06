import type { PayoutAccountStatus } from './types';

/** Mostra o aviso quando há ganho a receber e a conta de recebimento não está pronta. */
export function shouldShowPayoutWaiting(pendingBalance: number, status: PayoutAccountStatus | null | undefined): boolean {
    return pendingBalance > 0 && status !== 'verified';
}
