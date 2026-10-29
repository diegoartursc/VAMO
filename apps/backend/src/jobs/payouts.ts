/**
 * Repasse dos 80% ao roteirista (Stripe Connect, "separate charges and transfers").
 *
 *  - o pagamento cai inteiro na conta da plataforma, que paga a taxa da Stripe (sai dos 20% da VAMO);
 *  - PAYOUT_HOLD_DAYS depois da compra (fim da janela de reembolso), transfere o ganho CONGELADO
 *    na venda (SEC-13), na moeda do pagamento, proporcional ao que não foi devolvido;
 *  - não repassa venda reembolsada, em disputa ou bloqueada (SEC-11);
 *  - fila sem travamento (SEC-15): venda inelegível por motivo transitório (conta do roteirista
 *    ainda não habilitada, erro da Stripe) ganha `payoutNextAttemptAt` com espera crescente;
 *    motivo definitivo vira `payoutStatus = blocked`. As próximas da fila seguem sendo pagas;
 *  - uma transferência por venda: chave de idempotência da Stripe + gravação do `payoutTransferId`.
 */
import type Stripe from 'stripe';
import prisma from '../lib/prisma';
import { getStripe } from '../lib/stripe';
import { PAYOUT_HOLD_DAYS } from '@vamo/shared/itinerary';
import { PAYMENT_STATUS, payoutDueCents } from '../lib/money';

const DAY = 24 * 60 * 60 * 1000;
export const PAYOUT_HOLD_MS = PAYOUT_HOLD_DAYS * DAY;
const BATCH = 50;
const MAX_BACKOFF_MS = 2 * DAY;

/** Venda pronta para repasse? (puro, sem banco nem Stripe) */
export function isPayoutDue(
    sale: { createdAt: Date; price: number; payoutTransferId: string | null; paymentStatus?: string | null; payoutStatus?: string | null },
    now: Date = new Date(),
): boolean {
    if (sale.payoutTransferId) return false;
    if (!(sale.price > 0)) return false;
    if (sale.payoutStatus === 'blocked' || sale.payoutStatus === 'on_hold' || sale.payoutStatus === 'needs_attention') return false;
    if (sale.paymentStatus && sale.paymentStatus !== PAYMENT_STATUS.paid && sale.paymentStatus !== PAYMENT_STATUS.partiallyRefunded) return false;
    return now.getTime() - sale.createdAt.getTime() >= PAYOUT_HOLD_MS;
}

/** Valor do repasse em centavos (inteiro), a partir dos valores gravados na venda. */
export function payoutAmountCents(sale: { price: number; commission: number; paidAmountCents?: number | null; creatorEarningCents?: number | null; refundedCents?: number | null }): number {
    return payoutDueCents(sale);
}

function paymentIntentIdOf(sale: { paymentIntentId?: string | null; purchaseData: unknown }): string | null {
    if (sale.paymentIntentId) return sale.paymentIntentId;
    const id = (sale.purchaseData as any)?.payment?.paymentIntentId;
    const provider = (sale.purchaseData as any)?.payment?.provider;
    return provider === 'stripe' && typeof id === 'string' && id ? id : null;
}

function paidCurrencyOf(sale: any): string | null {
    const c = sale.paidCurrency || (sale.purchaseData as any)?.payment?.currency;
    return typeof c === 'string' && c ? c.toLowerCase() : null;
}

async function postpone(saleId: string, attempts: number, now: Date, reason: string) {
    const wait = Math.min(MAX_BACKOFF_MS, 60 * 60 * 1000 * 2 ** Math.min(attempts, 6));
    await prisma.itinerarySale.update({
        where: { id: saleId },
        data: { payoutAttempts: attempts + 1, payoutNextAttemptAt: new Date(now.getTime() + wait), payoutLastError: reason.slice(0, 500) },
    });
}

async function block(saleId: string, reason: string) {
    await prisma.itinerarySale.update({ where: { id: saleId }, data: { payoutStatus: 'blocked', payoutLastError: reason.slice(0, 500) } });
}

export async function runPayoutSweep(now: Date = new Date(), stripeClient?: Stripe | null): Promise<{ transferred: number; skipped: number }> {
    const stripe = stripeClient ?? getStripe();
    if (!stripe) return { transferred: 0, skipped: 0 };

    const candidates = await prisma.itinerarySale.findMany({
        where: {
            payoutTransferId: null,
            payoutStatus: null,
            paymentStatus: { in: [PAYMENT_STATUS.paid, PAYMENT_STATUS.partiallyRefunded] },
            price: { gt: 0 },
            createdAt: { lte: new Date(now.getTime() - PAYOUT_HOLD_MS) },
            itinerary: { creator: { stripeAccountId: { not: null } } },
            // Adiadas ficam fora até a hora delas: nunca bloqueiam as seguintes (SEC-15).
            OR: [{ payoutNextAttemptAt: null }, { payoutNextAttemptAt: { lte: now } }],
        },
        orderBy: { createdAt: 'asc' },
        take: BATCH,
        select: {
            id: true, price: true, commission: true, createdAt: true, purchaseData: true,
            paymentIntentId: true, paidAmountCents: true, paidCurrency: true, creatorEarningCents: true,
            refundedCents: true, paymentStatus: true, payoutStatus: true, payoutTransferId: true,
            payoutAttempts: true, payoutNextAttemptAt: true,
            itinerary: { select: { currency: true, creator: { select: { id: true, stripeAccountId: true } } } },
        },
    });
    const sales = candidates;

    const accountOk = new Map<string, boolean>();
    let transferred = 0;
    let skipped = 0;
    for (const sale of sales as any[]) {
        const accountId = sale.itinerary?.creator?.stripeAccountId;
        const paymentIntentId = paymentIntentIdOf(sale);
        if (!isPayoutDue(sale, now) || !accountId) { skipped++; continue; }
        if (!paymentIntentId) { await block(sale.id, 'sale without a Stripe payment'); skipped++; continue; }

        try {
            if (!accountOk.has(accountId)) {
                const account = await stripe.accounts.retrieve(accountId);
                accountOk.set(accountId, !!(account as Stripe.Account).payouts_enabled);
            }
            if (!accountOk.get(accountId)) {
                await postpone(sale.id, sale.payoutAttempts ?? 0, now, 'creator payout account not ready');
                skipped++;
                continue;
            }

            const pi = await stripe.paymentIntents.retrieve(paymentIntentId, { expand: ['latest_charge'] });
            const charge = pi.latest_charge as Stripe.Charge | null;
            if (!charge) { await postpone(sale.id, sale.payoutAttempts ?? 0, now, 'charge not found'); skipped++; continue; }
            if (charge.disputed) {
                await prisma.itinerarySale.update({ where: { id: sale.id }, data: { payoutStatus: 'on_hold', payoutLastError: 'charge disputed' } });
                skipped++;
                continue;
            }
            if (charge.refunded) { await block(sale.id, 'charge fully refunded'); skipped++; continue; }

            const refundedCents = Math.max(sale.refundedCents ?? 0, charge.amount_refunded ?? 0);
            const amount = payoutAmountCents({ ...sale, refundedCents });
            if (amount <= 0) { await block(sale.id, 'nothing to pay out'); skipped++; continue; }
            const currency = paidCurrencyOf(sale) || charge.currency;

            const transfer = await stripe.transfers.create({
                amount,
                currency,
                destination: accountId,
                source_transaction: charge.id,
                transfer_group: `sale_${sale.id}`,
                metadata: { saleId: sale.id, creatorId: sale.itinerary.creator.id },
            }, { idempotencyKey: `payout-sale-${sale.id}` });

            await prisma.itinerarySale.updateMany({
                where: { id: sale.id, payoutTransferId: null },
                data: {
                    payoutTransferId: transfer.id, payoutTransferredAt: now, payoutAmount: amount / 100,
                    payoutStatus: 'transferred', payoutLastError: null,
                },
            });
            transferred++;
        } catch (e: any) {
            skipped++;
            const message = String(e?.message || e);
            console.error(`[payouts] venda ${sale.id} não repassada:`, message);
            await postpone(sale.id, sale.payoutAttempts ?? 0, now, message).catch(() => {});
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
