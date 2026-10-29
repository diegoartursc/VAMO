/**
 * Regras de dinheiro de uma venda (SEC-11/12/13). Tudo em unidades mínimas
 * (centavos) e a partir do pagamento CONFIRMADO, nunca do preço atual.
 */
import { computeCommission } from '@vamo/shared/itinerary';

export const PAYMENT_STATUS = {
    paid: 'paid',
    partiallyRefunded: 'partially_refunded',
    refunded: 'refunded',
    disputed: 'disputed',
    disputeLost: 'dispute_lost',
} as const;

/** Valores congelados na venda a partir do que a Stripe cobrou. */
export function buildSaleAmounts(paid: { amountTotalCents: number; currency: string }) {
    const paidAmountCents = Math.max(0, Math.round(paid.amountTotalCents));
    const commissionCents = Math.round(computeCommission(paidAmountCents / 100) * 100);
    return {
        price: paidAmountCents / 100,
        paidAmountCents,
        paidCurrency: paid.currency.toLowerCase(),
        commissionCents,
        creatorEarningCents: paidAmountCents - commissionCents,
        commission: commissionCents / 100,
    };
}

type SaleMoney = {
    price: number;
    commission: number;
    paidAmountCents?: number | null;
    creatorEarningCents?: number | null;
    refundedCents?: number | null;
    paymentStatus?: string | null;
};

export const paidCentsOf = (s: SaleMoney) => s.paidAmountCents ?? Math.round(s.price * 100);

/** Ganho do roteirista. Venda antiga: preço − comissão GRAVADOS na venda (nunca a taxa atual). */
export function creatorEarningCentsOf(s: SaleMoney): number {
    if (s.creatorEarningCents != null) return s.creatorEarningCents;
    return Math.max(0, Math.round(s.price * 100) - Math.round(s.commission * 100));
}

/** Quanto repassar: ganho proporcional ao que NÃO foi devolvido. */
export function payoutDueCents(s: SaleMoney): number {
    const paid = paidCentsOf(s);
    if (paid <= 0) return 0;
    const kept = Math.max(0, paid - (s.refundedCents ?? 0));
    return Math.floor((creatorEarningCentsOf(s) * kept) / paid);
}

/** Quanto do repasse precisa voltar quando `lostCents` do pagamento foi perdido (estorno/disputa). */
export function reversalTargetCents(s: SaleMoney, lostCents: number): number {
    const paid = paidCentsOf(s);
    if (paid <= 0 || lostCents <= 0) return 0;
    return Math.min(creatorEarningCentsOf(s), Math.round((creatorEarningCentsOf(s) * Math.min(lostCents, paid)) / paid));
}

/** Política de acesso: estorno total e disputa perdida tiram o acesso; parcial e disputa aberta mantêm. */
export function hasActiveAccess(s: { paymentStatus?: string | null }): boolean {
    return s.paymentStatus !== PAYMENT_STATUS.refunded && s.paymentStatus !== PAYMENT_STATUS.disputeLost;
}

/** Filtro Prisma das vendas que dão acesso ao conteúdo. */
export const ACTIVE_SALE_WHERE = { paymentStatus: { notIn: [PAYMENT_STATUS.refunded, PAYMENT_STATUS.disputeLost] } };
