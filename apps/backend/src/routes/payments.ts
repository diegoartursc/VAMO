import { Request, Response } from 'express';
import { Router } from '../lib/router';
import Stripe from 'stripe';
import prisma from '../lib/prisma';
import { travelerAuthMiddleware, TravelerAuthRequest } from '../middleware/traveler-auth';
import { PURCHASED_ITINERARY_INCLUDE, buildPurchasedItineraryPayload, toJsonSafe } from './itineraries';
import { isPurchasableItineraryStatus } from '../lib/itineraryStatus';
import { sendPurchaseConfirmationEmail, sendCreatorSaleEmail, sendPurchaseAutoRefundEmail } from '../lib/mailer';
import { BASE_CURRENCY } from '@vamo/shared/itinerary';
import { buildSaleAmounts, hasActiveAccess, ACTIVE_SALE_WHERE, PAYMENT_STATUS } from '../lib/money';
import { beginStripeEvent, finishStripeEvent, applyPostSaleEvent } from '../lib/paymentEvents';

const router = Router();

/**
 * Erro específico para quando o fulfillment é bloqueado porque o roteiro
 * deixou de estar disponível ENTRE o início do checkout e a confirmação do
 * pagamento (ver `fulfillItineraryPurchase`). Os callers (rota de retorno e
 * webhook) tratam esse erro separado de uma falha genérica — não é um erro
 * transiente pra retry, é uma decisão de produto definitiva.
 */
export class PurchaseBlockedError extends Error {
    constructor(message: string, public readonly refunded: boolean) {
        super(message);
        this.name = 'PurchaseBlockedError';
    }
}

// ─── Stripe client ───────────────────────────────────────────────
// Lazy: o servidor sobe sem STRIPE_SECRET_KEY (endpoints de pagamento
// respondem 503 até a chave ser configurada no .env).
let stripeClient: Stripe | null = null;
/** Só para testes automatizados: injeta um cliente Stripe falso. */
export function setStripeClientForTests(client: Stripe | null) {
    if (process.env.NODE_ENV !== 'test') throw new Error('setStripeClientForTests só em NODE_ENV=test');
    stripeClient = client;
}
function getStripe(): Stripe | null {
    if (stripeClient) return stripeClient;
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key || !key.startsWith('sk_')) return null;
    stripeClient = new Stripe(key);
    return stripeClient;
}

// URL do app (Expo web) para onde o Stripe redireciona após o checkout.
const APP_BASE_URL = process.env.APP_BASE_URL || 'http://localhost:8081';

/**
 * Estorna um PaymentIntent de forma idempotente: antes de criar o refund,
 * checa se já existe um pra esse payment_intent (cobre retry do webhook —
 * Stripe pode reenviar o mesmo evento várias vezes). Sem tabela dedicada de
 * "checkout sessions" no banco (ver limitação documentada na entrega), a
 * própria API do Stripe é a fonte da verdade de idempotência aqui: uma
 * chamada extra de rede por tentativa de fulfillment bloqueado, mas nunca
 * gera um segundo estorno pro mesmo pagamento.
 */
// `newlyCreated` só é true para a chamada que de fato criou o refund: é o que
// decide o e-mail explicativo ao comprador. Retry do webhook encontra o refund
// na listagem; chamadas concorrentes caem na mesma idempotency key e recebem
// `Idempotent-Replayed: true` do Stripe.
export async function refundPaymentIntentIfNeeded(
    stripe: Stripe,
    paymentIntentId: string,
    reason: string,
): Promise<{ refunded: boolean; newlyCreated: boolean; pending: boolean }> {
    try {
        // SEC-12: compara VALORES. Um refund parcial (até de 1 centavo) não
        // significa devolução total; refund que falhou não conta.
        const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
        const total = (pi as any).amount_received || pi.amount || 0;
        let committed = 0;
        let pendingAmount = 0;
        let startingAfter: string | undefined;
        for (let page = 0; page < 10; page++) {
            const list = await stripe.refunds.list({ payment_intent: paymentIntentId, limit: 100, ...(startingAfter ? { starting_after: startingAfter } : {}) });
            for (const r of list.data) {
                if (r.status === 'succeeded' || r.status === 'pending' || r.status === 'requires_action') {
                    committed += r.amount || 0;
                    if (r.status !== 'succeeded') pendingAmount += r.amount || 0;
                }
            }
            if (!list.has_more || list.data.length === 0) break;
            startingAfter = list.data[list.data.length - 1].id;
        }
        const remaining = total - committed;
        if (remaining <= 0) return { refunded: true, newlyCreated: false, pending: pendingAmount > 0 };

        // A chave inclui o já devolvido: chamadas concorrentes no mesmo estado
        // caem na mesma chave; um estado novo gera um refund só do restante.
        const refund = await stripe.refunds.create(
            {
                payment_intent: paymentIntentId,
                amount: remaining,
                reason: 'requested_by_customer',
                metadata: { vamoReason: reason },
            },
            { idempotencyKey: `vamo-auto-refund-${paymentIntentId}-${committed}` },
        );
        const replayed = String((refund as any)?.lastResponse?.headers?.['idempotent-replayed'] ?? '') === 'true';
        return { refunded: true, newlyCreated: !replayed, pending: refund.status !== 'succeeded' || pendingAmount > 0 };
    } catch (err: any) {
        console.error('[payments] refund failed for', paymentIntentId, err?.message);
        return { refunded: false, newlyCreated: false, pending: false };
    }
}

/**
 * Chave de idempotência do Checkout: o mesmo comprador clicando duas vezes (ou em
 * duas abas) no mesmo roteiro, dentro da mesma janela, recebe a MESMA sessão da
 * Stripe, em vez de duas cobranças possíveis. A sessão expira em 30 min, igual à
 * janela da chave.
 */
export const CHECKOUT_WINDOW_MS = 30 * 60 * 1000;
export function checkoutIdempotencyKey(travelerId: string, itineraryId: string, now = Date.now(), attempt = 0): string {
    return `vamo-checkout-${travelerId}-${itineraryId}-${Math.floor(now / CHECKOUT_WINDOW_MS)}${attempt ? `-${attempt}` : ''}`;
}

/**
 * Já existe venda deste roteiro para este comprador. Se o pagamento que chegou agora
 * é OUTRO (outro PaymentIntent), ele é uma cobrança em duplicidade e precisa ser
 * estornado. O mesmo pagamento chegando de novo (webhook + tela de retorno) não é.
 */
export function isDuplicatePayment(existingPaymentIntentId: string | null | undefined, incomingPaymentIntentId: string | null | undefined): boolean {
    if (!incomingPaymentIntentId) return false;
    return existingPaymentIntentId !== incomingPaymentIntentId;
}

function savedPaymentIntentId(purchaseData: unknown): string | null {
    const pd = purchaseData as { payment?: { paymentIntentId?: string | null } } | null;
    return pd?.payment?.paymentIntentId ?? null;
}

export class DuplicateRefundPendingError extends Error {
    constructor() {
        super('Duplicate payment refund is pending');
        this.name = 'DuplicateRefundPendingError';
    }
}

// Estorna a cobrança duplicada (idempotente) e avisa o comprador uma única vez.
async function refundDuplicatePayment(
    travelerId: string,
    itineraryTitle: string,
    currencyFallback: string,
    payment: { provider: 'stripe' | 'free'; paymentIntentId?: string | null; amountTotal?: number | null; currency?: string | null },
): Promise<void> {
    if (payment.provider !== 'stripe' || !payment.paymentIntentId) return;
    const stripe = getStripe();
    if (!stripe) return;
    const refund = await refundPaymentIntentIfNeeded(stripe, payment.paymentIntentId, 'duplicate_payment_for_owned_itinerary');
    if (!refund.refunded) {
        // O webhook responde 500 nesse caso e a Stripe tenta de novo (ver stripeWebhookHandler).
        console.error(`[payments][ACTION NEEDED] duplicate payment ${payment.paymentIntentId} was NOT refunded; will retry on webhook redelivery`);
        throw new DuplicateRefundPendingError();
    }
    console.warn(`[payments] duplicate payment ${payment.paymentIntentId} refunded (itinerary already owned)`);
    if (refund.newlyCreated) {
        prisma.traveler
            .findUnique({ where: { id: travelerId }, select: { email: true, name: true } })
            .then((t) => t && sendPurchaseAutoRefundEmail({
                to: t.email,
                name: t.name,
                itineraryTitle,
                amount: payment.amountTotal,
                currency: payment.currency || currencyFallback,
            }))
            .catch((e) => console.error('[payments] duplicate-refund email failed:', e?.message || e));
    }
}

// E-mails de uma venda nova (comprador + roteirista). Chamado só por quem criou
// a ItinerarySale, então webhook e tela de retorno nunca duplicam.
async function notifySaleCreated(saleId: string, payment: { amountTotal?: number | null; currency?: string | null }): Promise<void> {
    const sale = await prisma.itinerarySale.findUnique({
        where: { id: saleId },
        select: {
            price: true,
            commission: true,
            traveler: { select: { email: true, name: true } },
            itinerary: {
                select: {
                    id: true,
                    title: true,
                    currency: true,
                    creator: { select: { stripeAccountId: true, traveler: { select: { email: true, name: true } } } },
                },
            },
        },
    });
    if (!sale) return;
    const currency = payment.currency || sale.itinerary.currency;
    await Promise.all([
        sendPurchaseConfirmationEmail({
            to: sale.traveler.email,
            name: sale.traveler.name,
            itineraryId: sale.itinerary.id,
            itineraryTitle: sale.itinerary.title,
            amount: payment.amountTotal ?? sale.price,
            currency,
        }),
        sale.itinerary.creator?.traveler
            ? sendCreatorSaleEmail({
                to: sale.itinerary.creator.traveler.email,
                name: sale.itinerary.creator.traveler.name,
                itineraryTitle: sale.itinerary.title,
                price: sale.price,
                commission: sale.commission,
                currency: sale.itinerary.currency,
                payoutsReady: Boolean(sale.itinerary.creator.stripeAccountId),
            })
            : Promise.resolve(false),
    ]);
}

// ─── Fulfillment ─────────────────────────────────────────────────
// Libera o roteiro comprado: cria a ItinerarySale com snapshot congelado e
// incrementa Creator.totalSales — mesma semântica do POST /purchase legado.
// Idempotente: chamado tanto pelo webhook quanto pela tela de retorno, e só
// cria a venda uma vez por traveler+itinerary.
//
// Corrida do Stripe: o status ACTIVE é checado ao CRIAR a sessão (rota
// abaixo), mas entre a criação da sessão e a confirmação do pagamento o
// criador pode pausar o roteiro. Por isso revalidamos o status aqui, na
// borda final antes de criar a venda — se não for mais ACTIVE, nenhuma
// venda é criada e, se o pagamento Stripe já foi capturado, disparamos
// estorno automático e idempotente (nunca deixamos o usuário cobrado sem
// acesso e sem reembolso).
async function fulfillItineraryPurchase(opts: {
    itineraryId: string;
    travelerId: string;
    payment: {
        provider: 'stripe' | 'free';
        sessionId?: string;
        paymentIntentId?: string | null;
        paymentStatus?: string | null;
        amountTotal?: number | null;
        currency?: string | null;
        paymentMethod?: string | null;
    };
}): Promise<{ saleId: string; alreadyPurchased: boolean }> {
    const { itineraryId, travelerId, payment } = opts;

    const existing = await prisma.itinerarySale.findFirst({
        where: { itineraryId, travelerId },
        select: { id: true, purchaseData: true, paymentStatus: true, paymentIntentId: true, payoutTransferId: true, itinerary: { select: { title: true, currency: true } } },
    });
    // Venda antiga reembolsada/perdida em disputa + pagamento NOVO: é uma recompra.
    // Reaproveita a linha (índice único itinerário+viajante) e zera o estado.
    const isRepurchase = !!existing && !hasActiveAccess(existing)
        && payment.provider === 'stripe' && !!payment.paymentIntentId
        && payment.paymentIntentId !== (existing.paymentIntentId ?? savedPaymentIntentId(existing.purchaseData));
    if (existing && !isRepurchase) {
        // Pagou de novo um roteiro que já é dele: devolve o dinheiro.
        if (isDuplicatePayment(savedPaymentIntentId(existing.purchaseData), payment.paymentIntentId)) {
            await refundDuplicatePayment(travelerId, existing.itinerary.title, existing.itinerary.currency, payment);
        }
        return { saleId: existing.id, alreadyPurchased: true };
    }

    const itinerary = await prisma.itinerary.findUnique({
        where: { id: itineraryId },
        include: PURCHASED_ITINERARY_INCLUDE,
    });
    if (!itinerary) throw new Error(`Itinerary ${itineraryId} not found during fulfillment`);

    if (!isPurchasableItineraryStatus(itinerary.status)) {
        let refunded = false;
        if (payment.provider === 'stripe' && payment.paymentIntentId) {
            const stripe = getStripe();
            if (stripe) {
                const refund = await refundPaymentIntentIfNeeded(
                    stripe,
                    payment.paymentIntentId,
                    'itinerary_paused_or_archived_during_checkout',
                );
                refunded = refund.refunded;
                if (refund.newlyCreated) {
                    prisma.traveler
                        .findUnique({ where: { id: travelerId }, select: { email: true, name: true } })
                        .then((t) => t && sendPurchaseAutoRefundEmail({
                            to: t.email,
                            name: t.name,
                            itineraryTitle: itinerary.title,
                            amount: payment.amountTotal,
                            currency: payment.currency || itinerary.currency,
                        }))
                        .catch((e) => console.error('[payments] e-mail de estorno falhou:', e?.message || e));
                }
            }
        }
        console.warn(
            `[payments] blocked fulfillment: itinerary ${itineraryId} is ${itinerary.status} (not purchasable). refunded=${refunded}`,
        );
        throw new PurchaseBlockedError(
            refunded
                ? 'This itinerary became unavailable before your payment was confirmed. The amount you paid was automatically refunded.'
                : 'This itinerary became unavailable before your payment was confirmed.',
            refunded,
        );
    }

    // SEC-13: valores da venda vêm do pagamento CONFIRMADO pela Stripe (valor,
    // moeda), não do preço atual do roteiro; comissão e ganho ficam congelados.
    const paidCents = payment.provider === 'stripe' && payment.amountTotal != null
        ? Math.round(payment.amountTotal * 100)
        : payment.provider === 'free' ? 0 : Math.round(itinerary.price * 100);
    const amounts = buildSaleAmounts({
        amountTotalCents: paidCents,
        currency: (payment.currency || itinerary.currency || BASE_CURRENCY),
    });
    const saleValues = {
        price: amounts.price,
        commission: amounts.commission,
        paidAmountCents: amounts.paidAmountCents,
        paidCurrency: amounts.paidCurrency,
        commissionCents: amounts.commissionCents,
        creatorEarningCents: amounts.creatorEarningCents,
        paymentIntentId: payment.paymentIntentId || null,
        paymentStatus: PAYMENT_STATUS.paid as string,
        refundedCents: 0,
        payoutStatus: null as string | null,
    };

    // R-M4: o estorno/disputa pode chegar ANTES desta venda existir (o evento é
    // descartado por não achar venda). Por isso a venda nasce com o estado real
    // da cobrança na Stripe.
    if (payment.provider === 'stripe' && payment.paymentIntentId) {
        const stripe = getStripe();
        if (stripe) {
            try {
                const pi = await stripe.paymentIntents.retrieve(payment.paymentIntentId, { expand: ['latest_charge'] });
                const charge = pi.latest_charge as Stripe.Charge | null;
                const refunded = charge?.amount_refunded ?? 0;
                if (charge?.disputed) {
                    saleValues.paymentStatus = PAYMENT_STATUS.disputed;
                    saleValues.payoutStatus = 'on_hold';
                }
                if (refunded > 0) {
                    saleValues.refundedCents = refunded;
                    const full = refunded >= amounts.paidAmountCents;
                    saleValues.paymentStatus = full ? PAYMENT_STATUS.refunded : PAYMENT_STATUS.partiallyRefunded;
                    if (full) saleValues.payoutStatus = 'blocked';
                }
            } catch (err: any) {
                console.error('[payments] não consegui conferir o estado da cobrança no fulfillment:', err?.message || err);
            }
        }
    }

    const snapshotPayload = toJsonSafe(buildPurchasedItineraryPayload(itinerary, {
        price: amounts.price,
        createdAt: new Date(),
    }));

    if (isRepurchase && existing && existing.payoutTransferId) {
        // A venda antiga já teve repasse: zerar a linha apagaria o registro de
        // reversão devida pelo roteirista. Devolve o pagamento novo e manda ao suporte.
        let refunded = false;
        const stripe = getStripe();
        if (stripe && payment.paymentIntentId) {
            refunded = (await refundPaymentIntentIfNeeded(stripe, payment.paymentIntentId, 'repurchase_after_payout_needs_support')).refunded;
        }
        console.error(`[payments][ACTION NEEDED] recompra da venda ${existing.id} com repasse anterior; pagamento novo ${refunded ? 'estornado' : 'NÃO estornado'}`);
        throw new PurchaseBlockedError(
            'We couldn\'t complete this purchase automatically. The amount was refunded; please contact support to get access again.',
            refunded,
        );
    }

    if (isRepurchase && existing) {
        // Transição condicional: só uma chamada (webhook OU tela de retorno) recompra.
        const reopened = await prisma.itinerarySale.updateMany({
            where: { id: existing.id, paymentStatus: { in: [PAYMENT_STATUS.refunded, PAYMENT_STATUS.disputeLost] } },
            data: {
                disputeStatus: null, disputeId: null, disputeLostCents: 0,
                payoutTransferId: null, payoutTransferredAt: null, payoutAmount: null,
                payoutAttempts: 0, payoutNextAttemptAt: null, payoutLastError: null, payoutReversedCents: 0,
                ...saleValues,
                createdAt: new Date(),
                purchaseData: { routeSnapshot: snapshotPayload, payment: toJsonSafe(payment) },
            },
        });
        if (reopened.count !== 1) return { saleId: existing.id, alreadyPurchased: true };
        notifySaleCreated(existing.id, payment)
            .catch((e) => console.error('[payments] e-mails da recompra falharam:', e?.message || e));
        return { saleId: existing.id, alreadyPurchased: false };
    }

    try {
        const [sale] = await prisma.$transaction([
            prisma.itinerarySale.create({
                data: {
                    itineraryId,
                    travelerId,
                    ...saleValues,
                    purchaseData: {
                        routeSnapshot: snapshotPayload,
                        payment: toJsonSafe(payment),
                    },
                },
                select: { id: true },
            }),
            prisma.creator.update({
                where: { id: itinerary.creatorId },
                data: { totalSales: { increment: 1 } },
            }),
        ]);
        // Só quem cria a venda envia — webhook e tela de retorno nunca duplicam.
        notifySaleCreated(sale.id, payment)
            .catch((e) => console.error('[payments] e-mails da venda falharam:', e?.message || e));
        return { saleId: sale.id, alreadyPurchased: false };
    } catch (err: any) {
        // Índice único (itineraryId, travelerId): duas chamadas concorrentes
        // de fulfillment (ex.: webhook + tela de retorno acontecendo quase
        // juntas) podem passar pelo check `existing` acima ao mesmo tempo.
        // Quem perder a corrida trata como "já comprado", não como erro.
        if (err?.code === 'P2002') {
            const winner = await prisma.itinerarySale.findFirst({
                where: { itineraryId, travelerId },
                select: { id: true, purchaseData: true },
            });
            if (winner) {
                if (isDuplicatePayment(savedPaymentIntentId(winner.purchaseData), payment.paymentIntentId)) {
                    await refundDuplicatePayment(travelerId, itinerary.title, itinerary.currency, payment);
                }
                return { saleId: winner.id, alreadyPurchased: true };
            }
        }
        throw err;
    }
}

// ─── POST /api/payments/checkout-session ─────────────────────────
// Cria uma Stripe Checkout Session (página hospedada) para um roteiro.
// Roteiro grátis (price <= 0) é liberado direto, sem passar pelo Stripe.
router.post('/checkout-session', travelerAuthMiddleware, async (req: TravelerAuthRequest, res: Response) => {
    try {
        const { itineraryId, source } = req.body || {};
        const travelerId = req.traveler!.travelerId;

        if (!itineraryId || typeof itineraryId !== 'string') {
            res.status(400).json({ error: 'itineraryId is required' });
            return;
        }

        const itinerary = await prisma.itinerary.findUnique({
            where: { id: itineraryId },
            select: { id: true, title: true, destination: true, country: true, price: true, currency: true, status: true },
        });
        if (!itinerary) { res.status(404).json({ error: 'Itinerary not found' }); return; }

        if (!isPurchasableItineraryStatus(itinerary.status)) {
            res.status(400).json({ error: 'Itinerary is not available for purchase' });
            return;
        }

        // Idempotente: já comprado (com acesso ativo) → não cobra de novo.
        const existing = await prisma.itinerarySale.findFirst({
            where: { itineraryId, travelerId, ...ACTIVE_SALE_WHERE },
            select: { id: true },
        });
        if (existing) {
            res.json({ itineraryId, saleId: existing.id, alreadyPurchased: true });
            return;
        }

        // Roteiro grátis: libera sem cobrança (Stripe não aceita amount 0).
        if (!itinerary.price || itinerary.price <= 0) {
            const result = await fulfillItineraryPurchase({
                itineraryId,
                travelerId,
                payment: { provider: 'free', paymentMethod: null },
            });
            res.json({ itineraryId, saleId: result.saleId, freePurchase: true, alreadyPurchased: result.alreadyPurchased });
            return;
        }

        const stripe = getStripe();
        if (!stripe) {
            res.status(503).json({ error: 'Online payment is unavailable right now (Stripe is not configured).' });
            return;
        }

        const traveler = await prisma.traveler.findUnique({
            where: { id: travelerId },
            select: { email: true },
        });

        const destinationLabel = [itinerary.destination, itinerary.country].filter(Boolean).join(', ');
        const sourceParam = typeof source === 'string' && source ? `&source=${encodeURIComponent(source)}` : '';

        const sessionParams: Stripe.Checkout.SessionCreateParams = {
            mode: 'payment',
            // A sessão vive o mesmo tempo da janela da chave de idempotência (mínimo da Stripe: 30 min).
            expires_at: Math.floor(Date.now() / 1000) + Math.ceil(CHECKOUT_WINDOW_MS / 1000) + 60,
            // REGRA DE PRODUTO: o VAMO não oferece parcelamento nem BNPL.
            //
            // Sem `payment_method_types` explícito, o Checkout usa os métodos
            // dinâmicos habilitados no Dashboard da conta — e a Stripe ativa
            // Afterpay/Clearpay, Klarna, Affirm e Zip por padrão em várias
            // contas, ainda mais em moeda estrangeira. Isso colocaria "pague em 4x" na
            // página de pagamento sem ninguém mexer no código.
            //
            // Fixar em ['card'] fecha a regra no backend, que é onde ela
            // precisa valer: nenhuma mudança no Dashboard reintroduz BNPL.
            // Apple Pay e Google Pay continuam funcionando — no Checkout eles
            // são wallets do próprio método `card`, não métodos separados.
            payment_method_types: ['card'],
            // Página de pagamento sempre em inglês americano (mercado EUA), independente do navegador.
            locale: 'en',
            line_items: [{
                quantity: 1,
                price_data: {
                    currency: (itinerary.currency || BASE_CURRENCY).toLowerCase(),
                    unit_amount: Math.round(itinerary.price * 100),
                    product_data: {
                        name: itinerary.title,
                        description: destinationLabel ? `Digital itinerary — ${destinationLabel}` : 'VAMO digital itinerary',
                    },
                },
            }],
            customer_email: traveler?.email || undefined,
            metadata: { itineraryId, travelerId, source: source || '' },
            payment_intent_data: { metadata: { itineraryId, travelerId } },
            success_url: `${APP_BASE_URL}/checkout/itinerary-confirm?session_id={CHECKOUT_SESSION_ID}&itineraryId=${encodeURIComponent(itineraryId)}${sourceParam}`,
            cancel_url: `${APP_BASE_URL}/checkout/itinerary-confirm?canceled=true&itineraryId=${encodeURIComponent(itineraryId)}${sourceParam}`,
        };

        // Mesma chave dentro da janela => mesma sessão (sem cobrança dupla por duplo clique).
        // Se o roteiro mudou de preço dentro da janela, a Stripe rejeita a chave com parâmetros
        // diferentes: aí usamos uma chave nova.
        let session: Stripe.Checkout.Session;
        try {
            session = await stripe.checkout.sessions.create(sessionParams, {
                idempotencyKey: checkoutIdempotencyKey(travelerId, itineraryId),
            });
        } catch (err: any) {
            if (err?.type !== 'StripeIdempotencyError') throw err;
            session = await stripe.checkout.sessions.create(sessionParams, {
                idempotencyKey: checkoutIdempotencyKey(travelerId, itineraryId, Date.now(), 1),
            });
        }

        res.json({ itineraryId, sessionId: session.id, url: session.url });
    } catch (error) {
        console.error('Error creating Stripe checkout session:', error);
        res.status(500).json({ error: 'We couldn\'t start the payment. Please try again.' });
    }
});

/**
 * Método de pagamento REAL usado na sessão, lido do próprio objeto Stripe.
 *
 * Antes gravávamos `session.metadata.paymentMethod`, que era a escolha
 * cosmética feita na UI antes do Checkout (e vinha 'pix' por padrão, um
 * método que nem existe no fluxo australiano). O snapshot da compra passa a
 * refletir o que de fato aconteceu; quando a Stripe não informa, fica null.
 */
function resolveStripePaymentMethod(session: Stripe.Checkout.Session): string | null {
    const types = session.payment_method_types;
    return Array.isArray(types) && types.length === 1 ? types[0] : null;
}

// ─── GET /api/payments/checkout-session/:sessionId ───────────────
// Tela de retorno consulta o status real no Stripe e, se pago, libera o
// roteiro na hora — não dependemos do webhook em dev (localhost não recebe
// webhooks sem o Stripe CLI). Em prod o webhook é o caminho primário e esta
// rota vira só confirmação (o fulfillment é idempotente).
router.get('/checkout-session/:sessionId', travelerAuthMiddleware, async (req: TravelerAuthRequest, res: Response) => {
    try {
        const sessionId = req.params.sessionId as string;
        const travelerId = req.traveler!.travelerId;

        const stripe = getStripe();
        if (!stripe) {
            res.status(503).json({ error: 'Online payment is unavailable right now (Stripe is not configured).' });
            return;
        }

        const session = await stripe.checkout.sessions.retrieve(sessionId);
        const itineraryId = session.metadata?.itineraryId;

        if (!itineraryId || session.metadata?.travelerId !== travelerId) {
            res.status(403).json({ error: 'This payment session doesn\'t belong to this user.' });
            return;
        }

        if (session.payment_status === 'paid') {
            try {
                const result = await fulfillItineraryPurchase({
                    itineraryId,
                    travelerId,
                    payment: {
                        provider: 'stripe',
                        sessionId: session.id,
                        paymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id || null,
                        paymentStatus: session.payment_status,
                        amountTotal: session.amount_total != null ? session.amount_total / 100 : null,
                        currency: session.currency || null,
                        paymentMethod: resolveStripePaymentMethod(session),
                    },
                });
                res.json({ status: 'paid', itineraryId, saleId: result.saleId, alreadyPurchased: result.alreadyPurchased });
            } catch (err) {
                if (err instanceof PurchaseBlockedError) {
                    res.status(409).json({ status: 'blocked', itineraryId, error: err.message, refunded: err.refunded });
                    return;
                }
                throw err;
            }
            return;
        }

        res.json({ status: session.payment_status, itineraryId });
    } catch (error) {
        console.error('Error retrieving Stripe checkout session:', error);
        res.status(500).json({ error: 'We couldn\'t confirm the payment. Please try again.' });
    }
});

// ─── POST /api/payments/webhook ──────────────────────────────────
// Handler exportado separadamente: precisa de express.raw (assinatura é
// verificada sobre o corpo bruto) e é registrado em index.ts ANTES do
// express.json e fora do rate limiter (Stripe faz retries).
export async function stripeWebhookHandler(req: Request, res: Response): Promise<void> {
    const stripe = getStripe();
    if (!stripe) { res.status(503).json({ error: 'Stripe not configured' }); return; }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event: Stripe.Event;

    try {
        // Assinatura obrigatória em qualquer ambiente (SEC-06): sem segredo
        // configurado, nenhum evento é processado. Em dev, use `stripe listen`,
        // que fornece o segredo de assinatura local.
        if (!webhookSecret) {
            res.status(503).json({ error: 'STRIPE_WEBHOOK_SECRET not configured' });
            return;
        }
        const signature = req.headers['stripe-signature'];
        if (typeof signature !== 'string' || !Buffer.isBuffer(req.body)) {
            res.status(400).json({ error: 'Invalid webhook signature' });
            return;
        }
        event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
    } catch (error: any) {
        console.error('Stripe webhook signature verification failed:', error?.message);
        res.status(400).json({ error: 'Invalid webhook signature' });
        return;
    }

    try {
        // Evento já processado (reenvio da Stripe) → nada a fazer (SEC-11).
        if (!(await beginStripeEvent(event))) {
            res.json({ received: true, duplicate: true });
            return;
        }
        if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
            const session = event.data.object as Stripe.Checkout.Session;
            const itineraryId = session.metadata?.itineraryId;
            const travelerId = session.metadata?.travelerId;

            if (session.payment_status === 'paid' && itineraryId && travelerId) {
                try {
                    const result = await fulfillItineraryPurchase({
                        itineraryId,
                        travelerId,
                        payment: {
                            provider: 'stripe',
                            sessionId: session.id,
                            paymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : null,
                            paymentStatus: session.payment_status,
                            amountTotal: session.amount_total != null ? session.amount_total / 100 : null,
                            currency: session.currency || null,
                            paymentMethod: resolveStripePaymentMethod(session),
                        },
                    });
                    console.log(`[stripe webhook] ${event.type}: sale ${result.saleId} (alreadyPurchased=${result.alreadyPurchased})`);
                } catch (err) {
                    if (err instanceof PurchaseBlockedError) {
                        // Roteiro deixou de estar à venda. Se o estorno AUTOMÁTICO funcionou, é
                        // decisão definitiva: responde 200. Se o estorno FALHOU, o comprador
                        // ficou cobrado sem acesso: responde 500 para a Stripe reenviar o evento
                        // e o estorno ser tentado de novo (é idempotente).
                        if (!err.refunded) {
                            console.error(`[payments][ACTION NEEDED] ${event.type}: blocked and NOT refunded (session ${session.id}); asking Stripe to retry`);
                            throw err;
                        }
                        console.warn(`[stripe webhook] ${event.type}: blocked and refunded — ${err.message}`);
                    } else {
                        throw err;
                    }
                }
            }
        } else {
            // Estorno, disputa e reversão de repasse (lib/paymentEvents.ts).
            await applyPostSaleEvent(stripe, event);
        }
        await finishStripeEvent(event.id);
        res.json({ received: true });
    } catch (error) {
        console.error('Error processing Stripe webhook:', error);
        // 500 faz o Stripe reenviar o evento — fulfillment é idempotente.
        res.status(500).json({ error: 'Webhook processing failed' });
    }
}

export default router;

/** Exposto só para os testes de segurança (fulfillment com Stripe falso). */
export const fulfillItineraryPurchaseForTests = fulfillItineraryPurchase;
