import { BASE_CURRENCY } from '@vamo/shared/itinerary';
export interface CurrencyAmount {
    amount: number;
    currency: string;
}

export interface BaseConversionSummary {
    totalBase: number;
    missingCurrencies: string[];
}

export function convertToBase(
    amount: number,
    currency: string,
    rates: Record<string, number>,
): number | null {
    if (!Number.isFinite(amount)) return null;
    const code = String(currency || '').trim().toUpperCase();
    if (code === BASE_CURRENCY) return amount;

    const rate = Number(rates[code]);
    if (!Number.isFinite(rate) || rate <= 0) return null;
    return amount * rate;
}

export function summarizeInBase(
    items: CurrencyAmount[],
    rates: Record<string, number>,
): BaseConversionSummary {
    let totalBase = 0;
    const missing = new Set<string>();

    for (const item of items) {
        const converted = convertToBase(item.amount, item.currency, rates);
        if (converted === null) {
            missing.add(String(item.currency || '').trim().toUpperCase() || 'N/D');
            continue;
        }
        totalBase += converted;
    }

    return {
        totalBase,
        missingCurrencies: [...missing].sort(),
    };
}
