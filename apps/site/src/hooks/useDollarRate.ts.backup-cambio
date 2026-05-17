"use client";

import { useState, useEffect } from "react";

export const DOLLAR_RATE_KEY = "adminDollarRate";

/**
 * Hook que lê a cotação do dólar (USD → BRL) definida pelo admin.
 *
 * Uso:
 *   const { dollarRate, convertToBRL } = useDollarRate();
 *   convertToBRL(99.9, "USD") // → "R$ 524,48"
 *   convertToBRL(99.9, "BRL") // → "R$ 99,90"  (passthrough)
 */
export function useDollarRate() {
    const [rate, setRate] = useState<number>(5.0);

    useEffect(() => {
        // Load initial value
        const load = () => {
            const saved = localStorage.getItem(DOLLAR_RATE_KEY);
            if (saved) {
                const num = parseFloat(saved.replace(",", "."));
                if (!isNaN(num) && num > 0) setRate(num);
            }
        };
        load();

        // React to updates dispatched by the admin sidebar
        const handler = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            if (detail?.rate) setRate(detail.rate);
        };
        window.addEventListener("dollarRateUpdated", handler);
        return () => window.removeEventListener("dollarRateUpdated", handler);
    }, []);

    const convertToBRL = (value: number, fromCurrency: string): string => {
        let brl = value;
        const upper = fromCurrency.toUpperCase();
        if (upper === "USD") brl = value * rate;
        // Add more currencies here as needed
        return brl.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    };

    const formattedRate = rate.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 4,
    });

    return { dollarRate: rate, formattedRate, convertToBRL };
}
