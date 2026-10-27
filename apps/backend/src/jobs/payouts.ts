/**
 * Repasse dos 80% ao roteirista (Stripe Connect, "separate charges and transfers").
 *
 *  - o pagamento cai inteiro na conta da plataforma, que paga a taxa da Stripe (sai dos 20% da VAMO);
 *  - PAYOUT_HOLD_DAYS depois da compra (fim da janela de reembolso), transfere
 *    computeCreatorEarning(preço) para a conta Connect do roteirista;
 *  - só repassa venda paga pela Stripe, sem reembolso/disputa, com a conta do roteirista habilitada;
 *  - uma transferência por venda: chave de idempotência da Stripe + gravação do `payoutTransferId`.
 */
import type Stripe from 'stripe';
import prisma from '../lib/prisma';
import { getStripe } from '../lib/stripe';
import { PAYOUT_HOLD_DAYS, computeCreatorEarning } from '@vamo/shared/itinerary';

const DAY = 24 * 60 * 60 * 1000;
export const PAYOUT_HOLD_MS = PAYOUT_HOLD_DAYS * DAY;
const BATCH = 50;

/** Venda pronta para repasse? (puro, sem banco nem Stripe) */
export function isPayoutDue(sale: { createdAt: Date; price: number; payoutTransferId: string | null }, now: Date = new Date()): boolean {
    if (sale.payoutTransferId) return false;
    if (!(sale.price > 0)) return false;
    return now.getTime() - sale.createdAt.getTime() >= PAYOUT_HOLD_MS;
}

/** Valor do repasse em centavos (inteiro). */
export function payoutAmountCents(price: number): number {
    return Math.round(computeCreatorEarning(price) * 100);
}

function paymentIntentIdOf(purchaseData: unknown): string | null {
    const id = (purchaseData as any)?.payment?.paymentIntentId;
    const provider = (purchaseData as any)?.payment?.provider;
    return provider === 'stripe' && typeof id === 'string' && id ? id : null;
}

export async function runPayoutSweep(now: Date = new Date()): Promise<{ transferred: number; skipped: number }> {
    const stripe = getStripe();
    if (!stripe) return { transferred: 0, skipped: 0 };

    const sales = await prisma.itinerarySale.findMany({
        where: {
            payoutTransferId: null,
            price: { gt: 0 },
            createdAt: { lte: new Date(now.getTime() - PAYOUT_HOLD_MS) },
            itinerary: { creator: { stripeAccountId: { not: null } } },
        },
        orderBy: { createdAt: 'asc' },
        take: BATCH,
        select: {
            id: true, price: true, createdAt: true, payoutTransferId: true, purchaseData: true,
            itinerary: { select: { currency: true, creator: { select: { id: true, stripeAccountId: true } } } },
        },
    });

    const accountOk = new Map<string, boolean>();
    let transferred = 0;
    let skipped = 0;
    for (const sale of sales) {
        const accountId = sale.itinerary.creator?.stripeAccountId;
        const paymentIntentId = paymentIntentIdOf(sale.purchaseData);
        if (!accountId || !paymentIntentId || !isPayoutDue(sale, now)) { skipped++; continue; }

        try {
            if (!accountOk.has(accountId)) {
                const account = await stripe.accounts.retrieve(accountId);
                accountOk.set(accountId, !!(account as Stripe.Account).payouts_enabled);
            }
            if (!accountOk.get(accountId)) { skipped++; continue; } // onboarding incompleto: tenta na próxima varredura

            const pi = await stripe.paymentIntents.retrieve(paymentIntentId, { expand: ['latest_charge'] });
            const charge = pi.latest_charge as Stripe.Charge | null;
            if (!charge || charge.refunded || charge.amount_refunded > 0 || charge.disputed) { skipped++; continue; }

            const amount = payoutAmountCents(sale.price);
            if (amount <= 0) { skipped++; continue; }

            const transfer = await stripe.transfers.create({
                amount,
                currency: (sale.itinerary.currency || charge.currency).toLowerCase(),
                destination: accountId,
                source_transaction: charge.id,
                transfer_group: `sale_${sale.id}`,
                metadata: { saleId: sale.id, creatorId: sale.itinerary.creator!.id },
            }, { idempotencyKey: `payout-sale-${sale.id}` });

            await prisma.itinerarySale.updateMany({
                where: { id: sale.id, payoutTransferId: null },
                data: { payoutTransferId: transfer.id, payoutTransferredAt: now, payoutAmount: amount / 100 },
            });
            transferred++;
        } catch (e: any) {
            skipped++;
            console.error(`[payouts] venda ${sale.id} não repassada:`, e?.message || e);
        }
    }
    return { transferred, skipped };
}

/** Roda a cada hora (e uma vez logo após subir). Desligável com PAYOUTS_ENABLED=false. */
export function startPayoutScheduler(): void {
    if (process.env.NODE_ENV !== 'production' || process.env.PAYOUTS_ENABLED === 'false') {
        console.log('[payouts] scheduler off (only runs in production)');
        return;
    }
    const tick = () => runPayoutSweep()
        .then((r) => { if (r.transferred) console.log(`[payouts] ${r.transferred} transfer(s) sent, ${r.skipped} skipped`); })
        .catch((e) => console.error('[payouts] sweep failed:', e?.message || e));
    setTimeout(tick, 3 * 60 * 1000);
    setInterval(tick, 60 * 60 * 1000);
    console.log('[payouts] scheduler on (hourly)');
}
