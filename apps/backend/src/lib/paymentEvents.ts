/**
 * Conciliação de eventos da Stripe depois da venda (SEC-11).
 *
 * - Cada evento é registrado em `stripe_events`; só é marcado como processado
 *   depois de aplicado. Evento repetido é ignorado; falha → o webhook responde
 *   500 e a Stripe reenvia (tudo aqui é idempotente).
 * - Estados usam valores acumulados da Stripe (`amount_refunded`, status da
 *   disputa), então eventos fora de ordem convergem para o mesmo resultado.
 * - Política: estorno total e disputa perdida tiram o acesso; parcial e disputa
 *   aberta mantêm. Disputa aberta trava o repasse; perdida reverte o repasse na
 *   proporção do valor perdido. Estorno depois do repasse também reverte.
 */
import type Stripe from 'stripe';
import prisma from './prisma';
import { PAYMENT_STATUS, paidCentsOf, reversalTargetCents } from './money';
import { sendPurchaseRefundedEmail } from './mailer';

type SaleRow = Awaited<ReturnType<typeof prisma.itinerarySale.findFirst>> & Record<string, any>;

export async function findSaleByPaymentIntent(paymentIntentId: string | null | undefined): Promise<SaleRow | null> {
    if (!paymentIntentId) return null;
    const direct = await prisma.itinerarySale.findUnique({ where: { paymentIntentId } });
    if (direct) return direct as SaleRow;
    // Vendas antigas guardavam o PaymentIntent só em purchaseData.payment.
    return (await prisma.itinerarySale.findFirst({
        where: { purchaseData: { path: ['payment', 'paymentIntentId'], equals: paymentIntentId } },
    })) as SaleRow | null;
}

const piOf = (obj: any): string | null =>
    typeof obj?.payment_intent === 'string' ? obj.payment_intent : obj?.payment_intent?.id ?? null;

/** Reverte (parte d)o repasse para chegar a `lostCents` perdidos. Idempotente pelo alvo. */
async function reverseTransfer(stripe: Stripe, sale: SaleRow, reason: string) {
    if (!sale.payoutTransferId) return;
    // Alvo = transferido − ganho ainda devido após TODAS as perdas (estorno + disputa).
    const target = reversalTargetCents(sale as any);
    const delta = target - (sale.payoutReversedCents ?? 0);
    if (delta <= 0) return;
    try {
        await stripe.transfers.createReversal(
            sale.payoutTransferId,
            { amount: delta, metadata: { saleId: sale.id, reason } },
            { idempotencyKey: `vamo-reversal-${sale.id}-${target}` },
        );
        await prisma.itinerarySale.update({
            where: { id: sale.id },
            data: { payoutReversedCents: target, payoutLastError: null },
        });
    } catch (err: any) {
        const message = String(err?.message || err).slice(0, 500);
        console.error(`[payments][ACTION NEEDED] reversão do repasse da venda ${sale.id} falhou: ${message}`);
        await prisma.itinerarySale.update({
            where: { id: sale.id },
            data: { payoutStatus: 'needs_attention', payoutLastError: `reversal failed: ${message}` },
        });
        throw err;
    }
}

async function onChargeRefunded(stripe: Stripe, charge: any) {
    const sale = await findSaleByPaymentIntent(piOf(charge));
    if (!sale) return;
    const refunded = Math.max(sale.refundedCents ?? 0, Number(charge.amount_refunded) || 0);
    const paid = sale.paidAmountCents ?? (Number(charge.amount) || paidCentsOf(sale as any));
    const full = refunded >= paid;
    const keepLost = sale.paymentStatus === PAYMENT_STATUS.disputeLost;
    const previous = sale.refundedCents ?? 0;
    const data = {
        refundedCents: refunded,
        paymentStatus: keepLost ? sale.paymentStatus : full ? PAYMENT_STATUS.refunded : PAYMENT_STATUS.partiallyRefunded,
        payoutStatus: full && !sale.payoutTransferId ? 'blocked' : sale.payoutStatus,
    };
    // Grava primeiro, com transição atômica: só quem AUMENTOU o valor devolvido
    // avisa o comprador. Evento repetido ou fora de ordem não reenvia o e-mail.
    const grew = refunded > previous
        ? (await prisma.itinerarySale.updateMany({
            where: { id: sale.id, refundedCents: { lt: refunded } },
            data,
        })).count === 1
        : false;
    if (!grew) await prisma.itinerarySale.update({ where: { id: sale.id }, data });
    if (grew && !keepLost) {
        notifyBuyerOfRefund(sale, refunded - previous, full)
            .catch((e) => console.error('[payments] refund email failed:', e?.message || e));
    }
    if (sale.payoutTransferId) await reverseTransfer(stripe, { ...sale, refundedCents: refunded }, 'refund');
}

/** Aviso ao comprador de um reembolso feito pela VAMO. Teste pode trocar `send`. */
export const refundNotifier = { send: sendPurchaseRefundedEmail };

async function notifyBuyerOfRefund(sale: SaleRow, refundedNowCents: number, full: boolean) {
    const [traveler, itinerary] = await Promise.all([
        prisma.traveler.findUnique({ where: { id: sale.travelerId }, select: { email: true, name: true } }),
        prisma.itinerary.findUnique({ where: { id: sale.itineraryId }, select: { title: true, currency: true } }),
    ]);
    if (!traveler?.email) return;
    await refundNotifier.send({
        to: traveler.email,
        name: traveler.name,
        itineraryTitle: itinerary?.title || 'your itinerary',
        amount: refundedNowCents / 100,
        currency: sale.paidCurrency || itinerary?.currency,
        full,
    });
}

async function onDispute(stripe: Stripe, dispute: any, closed: boolean) {
    const sale = await findSaleByPaymentIntent(piOf(dispute));
    if (!sale) return;
    const status = String(dispute.status || '');
    const terminal = (st: unknown) => st === 'won' || st === 'lost' || st === 'warning_closed';
    // Evento atrasado de uma disputa já encerrada não reabre nada (fora de ordem).
    if (sale.disputeId === dispute.id && terminal(sale.disputeStatus) && !terminal(status)) return;
    const lost = status === 'lost';
    const resolvedInOurFavor = closed && (status === 'won' || status === 'warning_closed');
    const transferred = Boolean(sale.payoutTransferId);

    const disputeLost = Number(dispute.amount) || paidCentsOf(sale as any);
    if (lost) {
        await prisma.itinerarySale.update({
            where: { id: sale.id },
            data: { paymentStatus: PAYMENT_STATUS.disputeLost, disputeStatus: status, disputeId: dispute.id, disputeLostCents: disputeLost, payoutStatus: transferred ? sale.payoutStatus : 'blocked' },
        });
        if (transferred) await reverseTransfer(stripe, { ...sale, disputeLostCents: disputeLost }, 'dispute_lost');
        return;
    }
    if (resolvedInOurFavor) {
        const refunded = sale.refundedCents ?? 0;
        await prisma.itinerarySale.update({
            where: { id: sale.id },
            data: {
                paymentStatus: refunded <= 0 ? PAYMENT_STATUS.paid
                    : refunded >= paidCentsOf(sale as any) ? PAYMENT_STATUS.refunded : PAYMENT_STATUS.partiallyRefunded,
                disputeStatus: status,
                disputeId: dispute.id,
                payoutStatus: sale.payoutStatus === 'on_hold' ? null : sale.payoutStatus,
                payoutNextAttemptAt: null,
            },
        });
        return;
    }
    // Disputa aberta (ou atualizada sem desfecho): trava o repasse, mantém acesso.
    if (sale.paymentStatus === PAYMENT_STATUS.refunded || sale.paymentStatus === PAYMENT_STATUS.disputeLost) return;
    await prisma.itinerarySale.update({
        where: { id: sale.id },
        data: { paymentStatus: PAYMENT_STATUS.disputed, disputeStatus: status, disputeId: dispute.id, payoutStatus: transferred ? sale.payoutStatus : 'on_hold' },
    });
}

async function onTransferReversed(transfer: any) {
    if (!transfer?.id) return;
    const sale = await prisma.itinerarySale.findFirst({ where: { payoutTransferId: transfer.id } });
    if (!sale) return;
    const reversed = Math.max(sale.payoutReversedCents ?? 0, Number(transfer.amount_reversed) || 0);
    await prisma.itinerarySale.update({ where: { id: sale.id }, data: { payoutReversedCents: reversed } });
}

/**
 * Revisa uma venda já repassada e reverte o que for devido. Usado pelo job de
 * repasse logo depois da transferência: um estorno que chegou ENTRE a checagem
 * da cobrança e a gravação do repasse não pode ficar sem reversão.
 */
export async function reconcileReversalForSale(stripe: Stripe, saleId: string) {
    const sale = await prisma.itinerarySale.findUnique({ where: { id: saleId } }) as SaleRow | null;
    if (!sale?.payoutTransferId) return;
    if (reversalTargetCents(sale as any) > (sale.payoutReversedCents ?? 0)) {
        await reverseTransfer(stripe, sale, 'late_refund_or_dispute');
    }
}

/** Marca o evento como recebido. Retorna false se ele já foi processado antes. */
export async function beginStripeEvent(event: Pick<Stripe.Event, 'id' | 'type'>): Promise<boolean> {
    const existing = await prisma.stripeEvent.findUnique({ where: { id: event.id } });
    if (existing?.processedAt) return false;
    if (!existing) {
        try {
            await prisma.stripeEvent.create({ data: { id: event.id, type: event.type } });
        } catch (err: any) {
            if (err?.code !== 'P2002') throw err;
        }
    }
    return true;
}

export async function finishStripeEvent(eventId: string) {
    await prisma.stripeEvent.update({ where: { id: eventId }, data: { processedAt: new Date() } });
}

/** Eventos pós-venda (estorno, disputa, reversão). Checkout pago é tratado em routes/payments.ts. */
export async function applyPostSaleEvent(stripe: Stripe, event: Stripe.Event): Promise<void> {
    const obj: any = event.data.object;
    switch (event.type) {
        case 'charge.refunded':
            return onChargeRefunded(stripe, obj);
        case 'charge.dispute.created':
        case 'charge.dispute.updated':
            return onDispute(stripe, obj, false);
        case 'charge.dispute.closed':
            return onDispute(stripe, obj, true);
        case 'transfer.reversed':
            return onTransferReversed(obj);
        default:
            return;
    }
}

/** Registro + aplicação + marcação de processado (usado pelos testes e pelo webhook). */
export async function handleStripeEvent(stripe: Stripe, event: Stripe.Event): Promise<'processed' | 'duplicate'> {
    if (!(await beginStripeEvent(event))) return 'duplicate';
    await applyPostSaleEvent(stripe, event);
    await finishStripeEvent(event.id);
    return 'processed';
}
