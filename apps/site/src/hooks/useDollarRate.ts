"use client";

import { useState, useEffect } from "react";

export const DOLLAR_RATE_KEY = "adminDollarRate"; // Para retrocompatibilidade
export const CURRENCY_RATES_KEY = "adminCurrencyRates";

export type CurrencyRates = Record<string, number>;

export const DEFAULT_RATES: CurrencyRates = {
    // Moeda base do mercado (Austrália): AUD = 1.0.
    // As demais taxas representam o valor de 1 unidade da moeda em AUD.
    AUD: 1.0,
    AED: 0.41,
    ARS: 0.0015,
    BOB: 0.22,
    BRL: 0.30,
    CAD: 1.12,
    CHF: 5.6,
    CLP: 0.005,
    CNY: 0.7,
    COP: 0.001,
    CRC: 0.01,
    CUP: 0.21,
    DOP: 0.085,
    EGP: 0.1,
    EUR: 5.4,
    GBP: 6.3,
    GTQ: 0.65,
    IDR: 0.00031,
    INR: 0.06,
    JPY: 0.033,
    KES: 0.038,
    MAD: 0.5,
    MXN: 0.3,
    MYR: 1.12,
    NOK: 0.47,
    NZD: 3.0,
    PEN: 1.34,
    PHP: 0.089,
    PYG: 0.00068,
    SGD: 3.74,
    THB: 0.15,
    TRY: 0.15,
    USD: 5.0,
    UYU: 0.13,
    VND: 0.0002,
    ZAR: 0.27,
};

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
            } else {
                // Migração: se não tem o novo JSON, procura o valor do Dólar antigo
                const savedUsd = localStorage.getItem(DOLLAR_RATE_KEY);
                if (savedUsd) {
                    const num = parseFloat(savedUsd.replace(",", "."));
                    if (!isNaN(num) && num > 0) {
                        const migrated = { ...DEFAULT_RATES, USD: num };
                        setRates(migrated);
                        localStorage.setItem(CURRENCY_RATES_KEY, JSON.stringify(migrated));
                    }
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

    /** Converte um valor de qualquer moeda para a moeda base do mercado (AUD). */
    const convertToBase = (value: number, fromCurrency: string): string => {
        let aud = value;
        const upper = fromCurrency.toUpperCase();
        if (upper !== "AUD") {
            const rate = rates[upper];
            if (rate !== undefined) {
                aud = value * rate;
            }
        }
        return aud.toLocaleString("pt-BR", { style: "currency", currency: "AUD" });
    };
    // Alias retrocompatível para componentes que ainda usam o nome antigo.
    const convertToBRL = convertToBase;

    // Propriedades mantidas estritamente para retrocompatibilidade
    const dollarRate = rates["USD"] || 5.0;
    const formattedRate = dollarRate.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 4,
    });

    return { dollarRate, formattedRate, convertToBase, convertToBRL, rates };
}
