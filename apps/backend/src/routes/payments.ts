import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import prisma from '../lib/prisma';
import { travelerAuthMiddleware, TravelerAuthRequest } from '../middleware/traveler-auth';
import { PURCHASED_ITINERARY_INCLUDE, buildPurchasedItineraryPayload, toJsonSafe } from './itineraries';
import { isPurchasableItineraryStatus } from '../lib/itineraryStatus';

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
async function refundPaymentIntentIfNeeded(
    stripe: Stripe,
    paymentIntentId: string,
    reason: string,
): Promise<boolean> {
    const existingRefunds = await stripe.refunds.list({ payment_intent: paymentIntentId, limit: 10 });
    const alreadyRefunded = existingRefunds.data.some(
        (r) => r.status === 'succeeded' || r.status === 'pending',
    );
    if (alreadyRefunded) return true;
    try {
        await stripe.refunds.create({
            payment_intent: paymentIntentId,
            reason: 'requested_by_customer',
            metadata: { vamoReason: reason },
        });
        return true;
    } catch (err: any) {
        console.error('[payments] refund failed for', paymentIntentId, err?.message);
        return false;
    }
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
        select: { id: true },
    });
    if (existing) return { saleId: existing.id, alreadyPurchased: true };

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
                refunded = await refundPaymentIntentIfNeeded(
                    stripe,
                    payment.paymentIntentId,
                    'itinerary_paused_or_archived_during_checkout',
                );
            }
        }
        console.warn(
            `[payments] blocked fulfillment: itinerary ${itineraryId} is ${itinerary.status} (not purchasable). refunded=${refunded}`,
        );
        throw new PurchaseBlockedError(
            refunded
                ? 'Este roteiro deixou de estar disponível antes da confirmação do pagamento. O valor pago foi estornado automaticamente.'
                : 'Este roteiro deixou de estar disponível antes da confirmação do pagamento.',
            refunded,
        );
    }

    const snapshotPayload = toJsonSafe(buildPurchasedItineraryPayload(itinerary, {
        price: itinerary.price,
        createdAt: new Date(),
    }));

    try {
        const [sale] = await prisma.$transaction([
            prisma.itinerarySale.create({
                data: {
                    itineraryId,
                    travelerId,
                    price: itinerary.price,
                    commission: itinerary.price * 0.15, // 15% platform commission
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
        return { saleId: sale.id, alreadyPurchased: false };
    } catch (err: any) {
        // Índice único (itineraryId, travelerId): duas chamadas concorrentes
        // de fulfillment (ex.: webhook + tela de retorno acontecendo quase
        // juntas) podem passar pelo check `existing` acima ao mesmo tempo.
        // Quem perder a corrida trata como "já comprado", não como erro.
        if (err?.code === 'P2002') {
            const winner = await prisma.itinerarySale.findFirst({
                where: { itineraryId, travelerId },
                select: { id: true },
            });
            if (winner) return { saleId: winner.id, alreadyPurchased: true };
        }
        throw err;
    }
}

// ─── POST /api/payments/checkout-session ─────────────────────────
// Cria uma Stripe Checkout Session (página hospedada) para um roteiro.
// Roteiro grátis (price <= 0) é liberado direto, sem passar pelo Stripe.
router.post('/checkout-session', travelerAuthMiddleware, async (req: TravelerAuthRequest, res: Response) => {
    try {
        const { itineraryId, source, paymentMethod } = req.body || {};
        const travelerId = req.traveler!.travelerId;

        if (!itineraryId || typeof itineraryId !== 'string') {
            res.status(400).json({ error: 'itineraryId é obrigatório' });
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

        // Idempotente: já comprado → não cobra de novo.
        const existing = await prisma.itinerarySale.findFirst({
            where: { itineraryId, travelerId },
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
                payment: { provider: 'free', paymentMethod: paymentMethod || null },
            });
            res.json({ itineraryId, saleId: result.saleId, freePurchase: true, alreadyPurchased: result.alreadyPurchased });
            return;
        }

        const stripe = getStripe();
        if (!stripe) {
            res.status(503).json({ error: 'Pagamento online indisponível no momento (Stripe não configurado).' });
            return;
        }

        const traveler = await prisma.traveler.findUnique({
            where: { id: travelerId },
            select: { email: true },
        });

        const destinationLabel = [itinerary.destination, itinerary.country].filter(Boolean).join(', ');
        const sourceParam = typeof source === 'string' && source ? `&source=${encodeURIComponent(source)}` : '';

        const session = await stripe.checkout.sessions.create({
            mode: 'payment',
            line_items: [{
                quantity: 1,
                price_data: {
                    currency: (itinerary.currency || 'AUD').toLowerCase(),
                    unit_amount: Math.round(itinerary.price * 100),
                    product_data: {
                        name: itinerary.title,
                        description: destinationLabel ? `Roteiro digital — ${destinationLabel}` : 'Roteiro digital VAMO',
                    },
                },
            }],
            customer_email: traveler?.email || undefined,
            metadata: { itineraryId, travelerId, source: source || '', paymentMethod: paymentMethod || '' },
            payment_intent_data: { metadata: { itineraryId, travelerId } },
            success_url: `${APP_BASE_URL}/checkout/itinerary-confirm?session_id={CHECKOUT_SESSION_ID}&itineraryId=${encodeURIComponent(itineraryId)}${sourceParam}`,
            cancel_url: `${APP_BASE_URL}/checkout/itinerary-confirm?canceled=true&itineraryId=${encodeURIComponent(itineraryId)}${sourceParam}`,
        });

        res.json({ itineraryId, sessionId: session.id, url: session.url });
    } catch (error) {
        console.error('Error creating Stripe checkout session:', error);
        res.status(500).json({ error: 'Não foi possível iniciar o pagamento. Tente novamente.' });
    }
});

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
            res.status(503).json({ error: 'Pagamento online indisponível no momento (Stripe não configurado).' });
            return;
        }

        const session = await stripe.checkout.sessions.retrieve(sessionId);
        const itineraryId = session.metadata?.itineraryId;

        if (!itineraryId || session.metadata?.travelerId !== travelerId) {
            res.status(403).json({ error: 'Sessão de pagamento não pertence a este usuário.' });
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
                        paymentMethod: session.metadata?.paymentMethod || null,
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
        res.status(500).json({ error: 'Não foi possível confirmar o pagamento. Tente novamente.' });
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
        if (webhookSecret) {
            const signature = req.headers['stripe-signature'] as string;
            event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
        } else if (process.env.NODE_ENV !== 'production') {
            // Dev sem STRIPE_WEBHOOK_SECRET: aceita sem verificar assinatura.
            event = JSON.parse(req.body.toString('utf8'));
        } else {
            res.status(500).json({ error: 'STRIPE_WEBHOOK_SECRET not configured' });
            return;
        }
    } catch (error: any) {
        console.error('Stripe webhook signature verification failed:', error?.message);
        res.status(400).json({ error: 'Invalid webhook signature' });
        return;
    }

    try {
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
                            paymentMethod: session.metadata?.paymentMethod || null,
                        },
                    });
                    console.log(`[stripe webhook] ${event.type}: sale ${result.saleId} (alreadyPurchased=${result.alreadyPurchased})`);
                } catch (err) {
                    if (err instanceof PurchaseBlockedError) {
                        // Decisão de produto definitiva (roteiro não é mais
                        // compravel), não falha transiente — não deixamos o
                        // Stripe reenviar o evento pra sempre. O refund (se
                        // aplicável) já foi tentado dentro do fulfillment.
                        console.warn(`[stripe webhook] ${event.type}: blocked — ${err.message}`);
                    } else {
                        throw err;
                    }
                }
            }
        }
        res.json({ received: true });
    } catch (error) {
        console.error('Error processing Stripe webhook:', error);
        // 500 faz o Stripe reenviar o evento — fulfillment é idempotente.
        res.status(500).json({ error: 'Webhook processing failed' });
    }
}

export default router;
