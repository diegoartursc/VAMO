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

/**
 * Campos que identificam o "estado financeiro" de uma venda. Uma escrita só vale se
 * nenhum deles mudou desde a leitura (concorrência otimista, R-01): dois eventos da
 * Stripe processados ao mesmo tempo nunca gravam por cima um do outro com dado velho.
 */
const guardOf = (s: SaleRow) => ({
    refundedCents: s.refundedCents,
    paymentStatus: s.paymentStatus,
    disputeStatus: s.disputeStatus,
    disputeLostCents: s.disputeLostCents,
    payoutStatus: s.payoutStatus,
    payoutTransferId: s.payoutTransferId,
    payoutReversedCents: s.payoutReversedCents,
});

const MAX_ATTEMPTS = 8;

/**
 * Lê a venda ATUAL, calcula a mudança e grava só se nada mudou no meio; se mudou,
 * relê e recalcula. `compute` devolve null quando não há o que mudar.
 * Esgotadas as tentativas, lança erro: o webhook responde 500 e a Stripe reenvia.
 */
export async function updateSaleAtomically(
    saleId: string,
    compute: (current: SaleRow) => Record<string, any> | null,
): Promise<{ before: SaleRow; after: SaleRow; changed: boolean } | null> {
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        const row = (await prisma.itinerarySale.findUnique({ where: { id: saleId } })) as SaleRow | null;
        if (!row) return null;
        const current = { ...row } as SaleRow; // cópia: o "antes" não pode mudar com a gravação
        const patch = compute(current);
        if (!patch) return { before: current, after: current, changed: false };
        const res = await prisma.itinerarySale.updateMany({ where: { id: saleId, ...guardOf(current) }, data: patch });
        if (res.count === 1) return { before: current, after: { ...current, ...patch } as SaleRow, changed: true };
    }
    throw new Error(`[payments] venda ${saleId} mudou ${MAX_ATTEMPTS}x durante a atualização; evento será reprocessado`);
}

/**
 * Reverte (parte d)o repasse até o valor devido após TODAS as perdas (estorno + disputa).
 * Reserva o valor no banco ANTES de pedir à Stripe (R-01): duas reversões concorrentes
 * nunca pedem o mesmo pedaço. Se a Stripe falhar, desfaz a reserva e marca para atenção.
 */
async function reverseTransfer(stripe: Stripe, saleId: string, reason: string) {
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        const sale = (await prisma.itinerarySale.findUnique({ where: { id: saleId } })) as SaleRow | null;
        if (!sale?.payoutTransferId) return;
        const already = sale.payoutReversedCents ?? 0;
        const target = reversalTargetCents(sale as any);
        const delta = target - already;
        if (delta <= 0) return;

        const reserved = await prisma.itinerarySale.updateMany({
            where: { id: saleId, payoutReversedCents: already },
            data: { payoutReversedCents: target },
        });
        if (reserved.count !== 1) continue; // outra reversão reservou antes: recalcula

        try {
            await stripe.transfers.createReversal(
                sale.payoutTransferId,
                { amount: delta, metadata: { saleId, reason } },
                { idempotencyKey: `vamo-reversal-${saleId}-${already}-${target}` },
            );
            await prisma.itinerarySale.updateMany({ where: { id: saleId }, data: { payoutLastError: null } });
            return;
        } catch (err: any) {
            const message = String(err?.message || err).slice(0, 500);
            console.error(`[payments][ACTION NEEDED] reversão do repasse da venda ${saleId} falhou: ${message}`);
            const rolledBack = await prisma.itinerarySale.updateMany({
                where: { id: saleId, payoutReversedCents: target },
                data: { payoutReversedCents: already, payoutStatus: 'needs_attention', payoutLastError: `reversal failed: ${message}` },
            });
            if (rolledBack.count !== 1) {
                await prisma.itinerarySale.updateMany({
                    where: { id: saleId },
                    data: { payoutStatus: 'needs_attention', payoutLastError: `reversal failed (${already}→${target}) after a concurrent reservation; reconcile manually: ${message}` },
                });
            }
            throw err;
        }
    }
    throw new Error(`[payments] reversão da venda ${saleId} disputada ${MAX_ATTEMPTS}x; evento será reprocessado`);
}

/** Repasse em andamento (R-04) não pode virar "bloqueado": a recuperação decide depois. */
const keepTransferState = (s: SaleRow, fallback: string | null) =>
    s.payoutTransferId || s.payoutStatus === 'transferring' ? s.payoutStatus : fallback;

async function onChargeRefunded(stripe: Stripe, charge: any) {
    const found = await findSaleByPaymentIntent(piOf(charge));
    if (!found) return;
    const amountRefunded = Number(charge.amount_refunded) || 0;
    const r = await updateSaleAtomically(found.id, (cur) => {
        // Valor devolvido só cresce: evento atrasado ou concorrente nunca diminui (R-01).
        const refunded = Math.max(cur.refundedCents ?? 0, amountRefunded);
        const paid = cur.paidAmountCents ?? (Number(charge.amount) || paidCentsOf(cur as any));
        const full = refunded >= paid;
        const keep = cur.paymentStatus === PAYMENT_STATUS.disputeLost
            || (!full && cur.paymentStatus === PAYMENT_STATUS.disputed);
        const paymentStatus = keep ? cur.paymentStatus
            : full ? PAYMENT_STATUS.refunded
            : refunded > 0 ? PAYMENT_STATUS.partiallyRefunded : cur.paymentStatus;
        const payoutStatus = full ? keepTransferState(cur, 'blocked') : cur.payoutStatus;
        if (refunded === (cur.refundedCents ?? 0) && paymentStatus === cur.paymentStatus && payoutStatus === cur.payoutStatus) return null;
        return { refundedCents: refunded, paymentStatus, payoutStatus };
    });
    if (!r) return;
    const grewBy = (r.after.refundedCents ?? 0) - (r.before.refundedCents ?? 0);
    // Só quem de fato aumentou o valor devolvido avisa o comprador (um e-mail por aumento).
    if (r.changed && grewBy > 0 && r.before.paymentStatus !== PAYMENT_STATUS.disputeLost) {
        notifyBuyerOfRefund(r.after, grewBy, r.after.paymentStatus === PAYMENT_STATUS.refunded)
            .catch((e) => console.error('[payments] refund email failed:', e?.message || e));
    }
    if (r.after.payoutTransferId) await reverseTransfer(stripe, found.id, 'refund');
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
    const found = await findSaleByPaymentIntent(piOf(dispute));
    if (!found) return;
    const status = String(dispute.status || '');
    const terminal = (st: unknown) => st === 'won' || st === 'lost' || st === 'warning_closed';
    const lost = status === 'lost';
    const resolvedInOurFavor = closed && (status === 'won' || status === 'warning_closed');

    const r = await updateSaleAtomically(found.id, (cur) => {
        // Evento atrasado de uma disputa já encerrada não reabre nada (fora de ordem).
        if (cur.disputeId === dispute.id && terminal(cur.disputeStatus) && !terminal(status)) return null;
        if (lost) {
            const disputeLost = Number(dispute.amount) || paidCentsOf(cur as any);
            if (cur.paymentStatus === PAYMENT_STATUS.disputeLost && cur.disputeLostCents === disputeLost && cur.disputeId === dispute.id) return null;
            return {
                paymentStatus: PAYMENT_STATUS.disputeLost, disputeStatus: status, disputeId: dispute.id,
                disputeLostCents: disputeLost, payoutStatus: keepTransferState(cur, 'blocked'),
            };
        }
        if (resolvedInOurFavor) {
            const refunded = cur.refundedCents ?? 0;
            return {
                paymentStatus: refunded <= 0 ? PAYMENT_STATUS.paid
                    : refunded >= paidCentsOf(cur as any) ? PAYMENT_STATUS.refunded : PAYMENT_STATUS.partiallyRefunded,
                disputeStatus: status,
                disputeId: dispute.id,
                payoutStatus: cur.payoutStatus === 'on_hold' ? null : cur.payoutStatus,
                payoutNextAttemptAt: null,
            };
        }
        // Disputa aberta (ou atualizada sem desfecho): trava o repasse, mantém acesso.
        if (cur.paymentStatus === PAYMENT_STATUS.refunded || cur.paymentStatus === PAYMENT_STATUS.disputeLost) return null;
        return {
            paymentStatus: PAYMENT_STATUS.disputed, disputeStatus: status, disputeId: dispute.id,
            payoutStatus: keepTransferState(cur, 'on_hold'),
        };
    });
    if (r?.after.payoutTransferId && lost) await reverseTransfer(stripe, found.id, 'dispute_lost');
}

async function onTransferReversed(transfer: any) {
    if (!transfer?.id) return;
    const sale = await prisma.itinerarySale.findFirst({ where: { payoutTransferId: transfer.id } });
    if (!sale) return;
    const reversedAtStripe = Number(transfer.amount_reversed) || 0;
    // Só cresce: a reserva local (reverseTransfer) já pode estar à frente da Stripe.
    await updateSaleAtomically(sale.id, (cur) =>
        reversedAtStripe > (cur.payoutReversedCents ?? 0) ? { payoutReversedCents: reversedAtStripe } : null);
}

/**
 * Revisa uma venda já repassada e reverte o que for devido. Usado pelo job de
 * repasse logo depois da transferência: um estorno que chegou ENTRE a checagem
 * da cobrança e a gravação do repasse não pode ficar sem reversão.
 */
export async function reconcileReversalForSale(stripe: Stripe, saleId: string) {
    await reverseTransfer(stripe, saleId, 'late_refund_or_dispute');
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
