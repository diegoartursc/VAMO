/**
 * MoneyInput — input monetário compartilhado para o site VAMO.
 *
 * Resolve o problema clássico de `<input type="number">` no HTML, que
 * em locale en-US bloqueia vírgula (alguns browsers até em pt-BR), o
 * que impede o usuário brasileiro de digitar "29,90".
 *
 * Estratégia:
 *   - render como `<input type="text" inputMode="decimal">` (mostra
 *     teclado numérico no mobile sem bloquear vírgula);
 *   - mantém um buffer string local durante a edição — não normaliza
 *     no onChange, então estados intermediários como "29," sobrevivem;
 *   - normaliza para number só no blur (ou quando o pai pedir).
 *
 * Use para preço de venda, preço promocional, custo por item,
 * comprovados, gastos extras e qualquer outro campo monetário no web.
 */

"use client";

import React, { useCallback, useEffect, useRef, useState, InputHTMLAttributes } from "react";

/** Parser pt-BR ("1.234,56") ou en-US ("1234.56") → number. */
function parseMoney(raw: string | number | null | undefined): number {
    if (raw == null) return 0;
    if (typeof raw === "number") return Number.isFinite(raw) ? raw : 0;
    const s = String(raw).trim();
    if (!s) return 0;
    const cleaned = s.replace(/[^0-9.,-]/g, "");
    if (!cleaned) return 0;
    const hasComma = cleaned.includes(",");
    const hasDot = cleaned.includes(".");
    let n: string;
    if (hasComma && hasDot) n = cleaned.replace(/\./g, "").replace(",", ".");
    else if (hasComma)      n = cleaned.replace(",", ".");
    else                    n = cleaned;
    const parsed = parseFloat(n);
    return Number.isFinite(parsed) ? parsed : 0;
}

function sanitize(input: string, opts: { maxDecimals: number; allowNegative: boolean }): string {
    if (!input) return "";
    let s = input;
    let sign = "";
    if (opts.allowNegative && s.startsWith("-")) { sign = "-"; s = s.slice(1); }
    s = s.replace(/[^0-9.,]/g, "");

    const firstSepIdx = s.search(/[.,]/);
    let intPart = s;
    let fracPart = "";
    let sep = "";
    if (firstSepIdx >= 0) {
        sep = s[firstSepIdx];
        intPart = s.slice(0, firstSepIdx);
        fracPart = s.slice(firstSepIdx + 1).replace(/[.,]/g, "");
        if (opts.maxDecimals >= 0) fracPart = fracPart.slice(0, opts.maxDecimals);
    }
    intPart = intPart.replace(/^0+(?=\d)/, "");
    if (firstSepIdx === 0) intPart = "0";
    return `${sign}${sep ? `${intPart}${sep}${fracPart}` : intPart}`;
}

function formatBlurred(raw: string, maxDecimals: number): string {
    if (!raw) return "";
    const n = parseMoney(raw);
    if (!Number.isFinite(n) || n === 0) return raw === "0" ? "0" : "";
    return n.toFixed(Math.max(0, maxDecimals)).replace(".", ",");
}

export interface MoneyInputProps
    extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type" | "inputMode"> {
    value: string | number | null | undefined;
    /** String sanitizada em tempo real (a cada tecla). */
    onChangeText?: (sanitized: string) => void;
    /** Número normalizado — disparado em tempo real junto com onChangeText. */
    onChangeNumber?: (value: number) => void;
    maxDecimals?: number;
    allowNegative?: boolean;
    formatOnBlur?: boolean;
}

export default function MoneyInput({
    value,
    onChangeText,
    onChangeNumber,
    onBlur,
    onFocus,
    maxDecimals = 2,
    allowNegative = false,
    formatOnBlur = true,
    placeholder,
    ...rest
}: MoneyInputProps) {
    const initial =
        typeof value === "number" && Number.isFinite(value) && value !== 0
            ? String(value).replace(".", ",")
            : typeof value === "string" ? value : "";
    const [draft, setDraft] = useState<string>(initial);
    const focused = useRef(false);

    useEffect(() => {
        if (focused.current) return;
        const incoming =
            typeof value === "number" && Number.isFinite(value) && value !== 0
                ? String(value).replace(".", ",")
                : typeof value === "string" ? value : "";
        setDraft(incoming);
    }, [value]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const cleaned = sanitize(e.target.value, { maxDecimals, allowNegative });
        setDraft(cleaned);
        onChangeText?.(cleaned);
        if (onChangeNumber) onChangeNumber(parseMoney(cleaned));
    }, [maxDecimals, allowNegative, onChangeText, onChangeNumber]);

    const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
        focused.current = true;
        onFocus?.(e);
    }, [onFocus]);

    const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
        focused.current = false;
        if (formatOnBlur && draft) {
            const formatted = formatBlurred(draft, maxDecimals);
            if (formatted !== draft) {
                setDraft(formatted);
                onChangeText?.(formatted);
                if (onChangeNumber) onChangeNumber(parseMoney(formatted));
            }
        }
        onBlur?.(e);
    }, [draft, formatOnBlur, maxDecimals, onBlur, onChangeText, onChangeNumber]);

    return (
        <input
            {...rest}
            type="text"
            inputMode="decimal"
            placeholder={placeholder ?? "Ex: 29,90"}
            value={draft}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
        />
    );
}
