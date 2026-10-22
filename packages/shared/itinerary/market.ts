/**
 * market — configuração CENTRAL do mercado do produto.
 *
 * Única fonte de verdade para moeda-base, locale e taxas padrão. Mudar de
 * mercado = mudar AQUI (e rodar a migration do default de moeda no banco).
 * Nenhum componente deve escrever "USD"/"AUD"/"$" na mão como moeda-base.
 *
 * Mercado atual: Estados Unidos (USD). Decisão de 2026-10-15; antes era
 * Austrália (AUD). Roteiros antigos gravados em AUD continuam exibindo AUD,
 * porque cada roteiro guarda a própria moeda.
 */

export const MARKET = {
    code: "US",
    baseCurrency: "USD",
    locale: "en-US",
    currencySymbol: "$",
    timeZone: "America/New_York",
    timeZoneLabel: "New York time",
} as const;

/** Moeda-base do produto (preço de roteiro, total de custos, comissão). */
export const BASE_CURRENCY: string = MARKET.baseCurrency;
/** Locale de formatação de números/moedas/datas. */
export const BASE_LOCALE: string = MARKET.locale;
/** Símbolo curto da moeda-base (ex.: "$"). */
export const BASE_CURRENCY_SYMBOL: string = MARKET.currencySymbol;
/** Fuso usado em datas de e-mails/relatórios gerados pelo servidor. */
export const BASE_TIMEZONE: string = MARKET.timeZone;
export const BASE_TIMEZONE_LABEL: string = MARKET.timeZoneLabel;

/**
 * Taxas padrão com base na moeda-base: 1 unidade da moeda = X {BASE_CURRENCY}.
 * A moeda-base vale 1. O admin pode sobrescrever via PUT /api/rates.
 * (Derivadas da tabela antiga em AUD, dividida pelo valor do USD em AUD.)
 */
export const DEFAULT_RATES_TO_BASE: Record<string, number> = {
    AED: 0.27199,
    ARS: 0.001,
    AUD: 0.65998,
    BOB: 0.14399,
    BRL: 0.19999,
    CAD: 0.73997,
    CHF: 1.11998,
    CLP: 0.001,
    CNY: 0.13999,
    COP: 0.0002,
    CRC: 0.0019999,
    CUP: 0.042,
    DOP: 0.017,
    EGP: 0.02,
    EUR: 1.07999,
    GBP: 1.25997,
    GTQ: 0.13,
    IDR: 6.2e-05,
    INR: 0.012,
    JPY: 0.0065998,
    KES: 0.007603,
    MAD: 0.1,
    MXN: 0.06,
    MYR: 0.22399,
    NOK: 0.09399,
    NZD: 0.59998,
    PEN: 0.26799,
    PHP: 0.0178,
    PYG: 0.000136,
    SGD: 0.74795,
    THB: 0.03,
    TRY: 0.03,
    USD: 1.0,
    UYU: 0.026,
    VND: 4e-05,
    ZAR: 0.054,
};
