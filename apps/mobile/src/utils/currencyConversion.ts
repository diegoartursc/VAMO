export interface CurrencyAmount {
    amount: number;
    currency: string;
}

export interface AudConversionSummary {
    totalAud: number;
    missingCurrencies: string[];
}

export function convertToAud(
    amount: number,
    currency: string,
    rates: Record<string, number>,
): number | null {
    if (!Number.isFinite(amount)) return null;
    const code = String(currency || '').trim().toUpperCase();
    if (code === 'AUD') return amount;

    const rate = Number(rates[code]);
    if (!Number.isFinite(rate) || rate <= 0) return null;
    return amount * rate;
}

export function summarizeInAud(
    items: CurrencyAmount[],
    rates: Record<string, number>,
): AudConversionSummary {
    let totalAud = 0;
    const missing = new Set<string>();

    for (const item of items) {
        const converted = convertToAud(item.amount, item.currency, rates);
        if (converted === null) {
            missing.add(String(item.currency || '').trim().toUpperCase() || 'N/D');
            continue;
        }
        totalAud += converted;
    }

    return {
        totalAud,
        missingCurrencies: [...missing].sort(),
    };
}
