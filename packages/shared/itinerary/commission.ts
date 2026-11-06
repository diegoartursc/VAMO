/**
 * Comissão da plataforma e regras de repasse — FONTE ÚNICA.
 *
 * Tudo que fala de comissão (venda gravada no banco, e-mail ao roteirista, tela de ganhos,
 * página "How you get paid") lê daqui. Para mudar a comissão, mude APENAS este número.
 *
 * Decisão do Diego em 2026-10-27: 20% VAMO / 80% roteirista (taxas da Stripe: ver docs/LANCAMENTO-TASKS.md, bloco A).
 */

import { BASE_CURRENCY, BASE_CURRENCY_SYMBOL, DEFAULT_RATES_TO_BASE } from "./market";

/** Fração do preço que fica com a VAMO (0.20 = 20%). */
export const PLATFORM_COMMISSION_RATE = 0.20;

/** Dias após a compra até o ganho do roteirista ser liberado (= janela de reembolso). */
export const PAYOUT_HOLD_DAYS = 7;

export const PLATFORM_COMMISSION_PERCENT = Math.round(PLATFORM_COMMISSION_RATE * 100);
export const CREATOR_SHARE_PERCENT = 100 - PLATFORM_COMMISSION_PERCENT;

/** Comissão (na unidade da moeda) de uma venda, arredondada para centavos. */
// Aritmética em centavos e pontos-base (inteiros): evita erro de ponto flutuante
// (26.90 × 0.15 daria 4.0349999… e arredondaria para 4.03 em vez de 4.04).
function commissionCents(price: number, rate: number): number {
    const cents = Math.round(price * 100);
    return Math.round((cents * Math.round(rate * 10000)) / 10000);
}

export function computeCommission(price: number, rate: number = PLATFORM_COMMISSION_RATE): number {
    if (!Number.isFinite(price) || price <= 0) return 0;
    return commissionCents(price, rate) / 100;
}

/** Quanto fica para o roteirista numa venda (antes das taxas de pagamento). */
export function computeCreatorEarning(price: number, rate: number = PLATFORM_COMMISSION_RATE): number {
    if (!Number.isFinite(price) || price <= 0) return 0;
    return (Math.round(price * 100) - commissionCents(price, rate)) / 100;
}

/** Divisão de um preço para mostrar ao roteirista: o comprador paga `price`; ele recebe `creatorEarning`. */
export function splitPrice(price: number, rate: number = PLATFORM_COMMISSION_RATE): { price: number; creatorEarning: number; commission: number } {
    const valid = Number.isFinite(price) && price > 0 ? price : 0;
    return { price: valid, creatorEarning: computeCreatorEarning(valid, rate), commission: computeCommission(valid, rate) };
}

/**
 * Preço mínimo de um roteiro, na moeda-base (decisão do Diego em 2026-11-06).
 * Motivo: a VAMO paga a taxa do cartão com os 20% dela (cerca de US$ 0,30 fixos + ~3%),
 * então abaixo de ~US$ 2 cada venda dá prejuízo. Vale só para enviar para revisão; roteiros
 * já publicados abaixo disso continuam à venda.
 */
export const MIN_ITINERARY_PRICE = 5;

/** Mínimo na moeda do roteiro (roteiros em outra moeda usam as taxas padrão para a moeda-base). */
export function minItineraryPriceIn(currency?: string | null): number {
    const code = (currency || BASE_CURRENCY).toUpperCase();
    if (code === BASE_CURRENCY) return MIN_ITINERARY_PRICE;
    const rate = DEFAULT_RATES_TO_BASE[code];
    return rate && rate > 0 ? Math.ceil((MIN_ITINERARY_PRICE / rate) * 100) / 100 : MIN_ITINERARY_PRICE;
}

/** Mensagem de problema se o preço é positivo mas abaixo do mínimo; null se estiver ok (ou inválido, que outra regra pega). */
export function minPriceIssue(price: number, currency?: string | null): string | null {
    if (!Number.isFinite(price) || price <= 0) return null;
    const code = (currency || BASE_CURRENCY).toUpperCase();
    const min = minItineraryPriceIn(code);
    if (price + 1e-9 >= min) return null;
    const shown = code === BASE_CURRENCY ? `${BASE_CURRENCY_SYMBOL}${min.toFixed(2)}` : `${min.toFixed(2)} ${code}`;
    return `The minimum price is ${shown}.`;
}
