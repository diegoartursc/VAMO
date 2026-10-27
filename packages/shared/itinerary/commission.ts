/**
 * Comissão da plataforma e regras de repasse — FONTE ÚNICA.
 *
 * Tudo que fala de comissão (venda gravada no banco, e-mail ao roteirista, tela de ganhos,
 * página "How you get paid") lê daqui. Para mudar a comissão, mude APENAS este número.
 *
 * ⚠️ PENDENTE DE DECISÃO (docs/LANCAMENTO-TASKS.md, bloco A): o valor decidido em conversa
 * foi 20% VAMO / 80% roteirista; o sistema ainda opera com 15%, que é o que está em produção.
 * Não alterar o valor sem decidir também o prazo de repasse e avisar os roteiristas.
 */

/** Fração do preço que fica com a VAMO (0.15 = 15%). */
export const PLATFORM_COMMISSION_RATE = 0.15;

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
