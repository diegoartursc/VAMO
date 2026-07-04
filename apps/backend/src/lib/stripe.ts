import Stripe from 'stripe';

/**
 * Cliente Stripe lazy e compartilhado.
 * O servidor sobe sem STRIPE_SECRET_KEY — quem chama trata `null` (responde
 * 503). Mesma semântica do getStripe() local de routes/payments.ts.
 */
let stripeClient: Stripe | null = null;

export function getStripe(): Stripe | null {
    if (stripeClient) return stripeClient;
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key || !key.startsWith('sk_')) return null;
    stripeClient = new Stripe(key);
    return stripeClient;
}

/** URL do app (Expo web) para refresh/return dos fluxos hospedados da Stripe. */
export const APP_BASE_URL = process.env.APP_BASE_URL || 'http://localhost:8081';
