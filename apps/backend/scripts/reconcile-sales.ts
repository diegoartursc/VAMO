/**
 * Concilia vendas antigas com a Stripe (SEC-11/SEC-13). SIMULAÇÃO por padrão.
 *
 *   npx tsx scripts/reconcile-sales.ts           # só relatório (lê banco e Stripe, não grava)
 *   npx tsx scripts/reconcile-sales.ts --apply   # grava o que o relatório mostrou
 *
 * Para cada venda paga pela Stripe sem valores congelados:
 *  - preenche paymentIntentId, valor pago, moeda e ganho a partir da cobrança
 *    real; a comissão é a GRAVADA na venda (vendas antigas ficaram com 15%);
 *  - lê reembolsos e disputas da cobrança e ajusta paymentStatus/refundedCents.
 * Nunca cria reembolso, transferência ou reversão: reversões pendentes
 * aparecem no relatório para decisão manual.
 */
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

const APPLY = process.argv.includes('--apply');
const prisma = new PrismaClient();

(async () => {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY ausente.');
    const stripe = new Stripe(key);
    const sales = await prisma.itinerarySale.findMany({
        where: { paidAmountCents: null },
        select: { id: true, price: true, commission: true, purchaseData: true, payoutTransferId: true, paymentStatus: true },
    });
    console.log(`Vendas sem valores congelados: ${sales.length}. Modo: ${APPLY ? 'APLICAR' : 'simulação'}.`);
    for (const sale of sales) {
        const payment = (sale.purchaseData as any)?.payment;
        if (payment?.provider !== 'stripe' || !payment?.paymentIntentId) {
            console.log(`  - ${sale.id}: sem pagamento Stripe (grátis/legado) → valores = preço gravado`);
            if (APPLY) {
                const cents = Math.round(sale.price * 100);
                await prisma.itinerarySale.update({ where: { id: sale.id }, data: { paidAmountCents: cents, commissionCents: Math.round(sale.commission * 100), creatorEarningCents: cents - Math.round(sale.commission * 100) } });
            }
            continue;
        }
        const pi = await stripe.paymentIntents.retrieve(payment.paymentIntentId, { expand: ['latest_charge'] });
        const charge = pi.latest_charge as Stripe.Charge | null;
        const paid = pi.amount_received || pi.amount;
        const commissionCents = Math.round(sale.commission * 100);
        const refunded = charge?.amount_refunded ?? 0;
        const status = charge?.disputed ? 'disputed' : refunded >= paid ? 'refunded' : refunded > 0 ? 'partially_refunded' : 'paid';
        const priceCents = Math.round(sale.price * 100);
        const mismatch = priceCents !== paid ? ` ⚠ preço gravado ${priceCents} ≠ pago ${paid}` : '';
        const reversal = sale.payoutTransferId && status !== 'paid' ? ' ⚠ repasse já feito: avaliar reversão manual' : '';
        console.log(`  - ${sale.id}: pago ${paid} ${pi.currency}, estornado ${refunded}, status ${status}${mismatch}${reversal}`);
        if (APPLY) {
            await prisma.itinerarySale.update({
                where: { id: sale.id },
                data: {
                    paymentIntentId: pi.id, paidAmountCents: paid, paidCurrency: pi.currency,
                    commissionCents, creatorEarningCents: paid - commissionCents,
                    refundedCents: refunded, paymentStatus: status,
                    payoutStatus: status === 'refunded' && !sale.payoutTransferId ? 'blocked' : status === 'disputed' && !sale.payoutTransferId ? 'on_hold' : undefined,
                },
            });
        }
    }
    if (!APPLY) console.log('\nSimulação: nada foi gravado.');
    await prisma.$disconnect();
})().catch(async (err) => {
    console.error(err?.message || err);
    await prisma.$disconnect();
    process.exit(1);
});
