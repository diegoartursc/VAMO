"use client";

import { useState, useEffect } from "react";
import { DEFAULT_RATES_TO_BASE, BASE_CURRENCY, BASE_LOCALE } from "@vamo/shared/itinerary";

export const DOLLAR_RATE_KEY = "adminDollarRate"; // Para retrocompatibilidade
// Chave versionada pela moeda-base: taxas antigas (outra base) nunca são reaproveitadas.
export const CURRENCY_RATES_KEY = `adminCurrencyRates:${BASE_CURRENCY}`;

export type CurrencyRates = Record<string, number>;

/** Taxas padrão: 1 unidade da moeda = X moeda-base (fonte única: market.ts). */
export const DEFAULT_RATES: CurrencyRates = DEFAULT_RATES_TO_BASE;

/**
 * Hook que gerencia a cotação global do painel (todas as moedas).
 * Mantemos o nome `useDollarRate` para não quebrar componentes existentes,
 * mas ele agora expõe todas as `rates` e realiza a conversão dinâmica.
 */
export function useDollarRate() {
    const [rates, setRates] = useState<CurrencyRates>(DEFAULT_RATES);

    useEffect(() => {
        const load = () => {
            const savedRates = localStorage.getItem(CURRENCY_RATES_KEY);
            if (savedRates) {
                try {
                    setRates(JSON.parse(savedRates));
                } catch (e) {
                    // Ignora erro de parsing
                }
            }
        };
        load();

        const handler = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            if (detail?.rates) {
                setRates(detail.rates);
            }
        };
        window.addEventListener("currencyRatesUpdated", handler);
        return () => window.removeEventListener("currencyRatesUpdated", handler);
    }, []);

    /** Converte um valor de qualquer moeda para a moeda base do mercado. */
    const convertToBase = (value: number, fromCurrency: string): string => {
        let base = value;
        const upper = fromCurrency.toUpperCase();
        if (upper !== BASE_CURRENCY) {
            const rate = rates[upper];
            if (rate !== undefined) {
                base = value * rate;
            }
        }
        return base.toLocaleString(BASE_LOCALE, { style: "currency", currency: BASE_CURRENCY });
    };
    // Alias retrocompatível para componentes que ainda usam o nome antigo.
    const convertToBRL = convertToBase;

    // Propriedades mantidas estritamente para retrocompatibilidade
    const dollarRate = rates["USD"] || 5.0;
    const formattedRate = dollarRate.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 4,
    });

    return { dollarRate, formattedRate, convertToBase, convertToBRL, rates };
}
