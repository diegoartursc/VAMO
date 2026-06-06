/**
 * MoneyInput — input monetário compartilhado para o app VAMO.
 *
 * Permite digitar valores com vírgula OU ponto sem que a normalização
 * imediata bloqueie estados intermediários como "29,". O segredo é
 * manter um **buffer string** local enquanto o usuário edita e só
 * propagar o number normalizado em momentos coerentes (onBlur, ou
 * onChangeText pra quem prefere string crua).
 *
 * Use para:
 *   - preço de venda do roteiro
 *   - preço promocional
 *   - custo por item (hospedagem, voo, passeio, transporte, restaurante)
 *   - valor de gastos extras
 *   - qualquer outro campo monetário.
 *
 * Para campos que já guardam string no estado (ex: CostBlock.amount),
 * passe `value={amount}` e use `onChangeText={s => patch({ amount: s })}`
 * — o componente sanitiza a string em tempo real (sem normalizar para
 * number imediatamente) e o resto do app já sabe ler string via
 * `parseMoney()` do @vamo/shared/itinerary.
 *
 * Para campos que guardam number no estado (ex: ItineraryFormState.price),
 * use `onChangeNumber` — só dispara no blur com o valor normalizado.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { TextInputProps } from 'react-native';
import FormInput from './FormInput';
import { parseMoney } from '@vamo/shared/itinerary';

export interface MoneyInputProps
    extends Omit<TextInputProps, 'value' | 'onChange' | 'onChangeText' | 'keyboardType'> {
    label: string;
    required?: boolean;
    error?: string;
    hint?: string;
    /** Prefixo monetário, ex: "R$", "A$". */
    prefix?: string;
    /** Sufixo opcional, ex: "AUD". */
    suffix?: string;
    /** Valor atual — string (mantém formato) ou number (será serializado). */
    value: string | number | null | undefined;
    /**
     * Recebe a string sanitizada em tempo real (a cada tecla). Use para
     * campos cujo estado já é string monetária (CostBlock, etc.).
     */
    onChangeText?: (sanitized: string) => void;
    /**
     * Recebe o número normalizado. Disparado no blur (ou junto com
     * onChangeText após sanitizar). Use para campos cujo estado é number.
     */
    onChangeNumber?: (value: number) => void;
    /** Casas decimais máximas após o separador. Default 2. */
    maxDecimals?: number;
    /** Permite valores negativos. Default false. */
    allowNegative?: boolean;
    /** Se true (default), formata para `n,nn` ao perder foco. */
    formatOnBlur?: boolean;
}

/**
 * Sanitiza o que veio digitado, mantendo estados intermediários
 * como "29," válidos. Regras:
 *   - aceita só `[0-9.,]` e `-` no início (se permitido);
 *   - no máximo 1 separador decimal (o primeiro `,` ou `.` ganha);
 *   - separadores extras são removidos;
 *   - corta a parte fracionária em maxDecimals dígitos;
 *   - "  " e símbolos viram nada.
 */
function sanitize(input: string, opts: { maxDecimals: number; allowNegative: boolean }): string {
    if (!input) return '';
    let s = input;
    // Sinal
    let sign = '';
    if (opts.allowNegative && s.startsWith('-')) { sign = '-'; s = s.slice(1); }
    s = s.replace(/[^0-9.,]/g, '');

    // Identifica o primeiro separador para fixá-lo
    const firstSepIdx = s.search(/[.,]/);
    let intPart = s;
    let fracPart = '';
    let sep = '';
    if (firstSepIdx >= 0) {
        sep = s[firstSepIdx];
        intPart = s.slice(0, firstSepIdx);
        fracPart = s.slice(firstSepIdx + 1).replace(/[.,]/g, ''); // remove separadores extras
        // limita decimais
        if (opts.maxDecimals >= 0) fracPart = fracPart.slice(0, opts.maxDecimals);
    }
    // limpa zeros à esquerda do inteiro, mas mantém um zero se vier "0,"
    intPart = intPart.replace(/^0+(?=\d)/, '');
    // se o usuário começou com separador, mostra "0,"
    if (firstSepIdx === 0) intPart = '0';
    const out = sep ? `${intPart}${sep}${fracPart}` : intPart;
    return `${sign}${out}`;
}

/** Formato final aplicado no blur: "1234,5" → "1234,50". */
function formatBlurred(value: string, maxDecimals: number): string {
    if (!value) return '';
    const n = parseMoney(value);
    if (!Number.isFinite(n) || n === 0) {
        // Se o usuário só tem "0," ou "," deixa string vazia para não confundir.
        return value === '0' || value === '' ? value : '';
    }
    // Formata mantendo vírgula como separador (padrão pt-BR), porque é o
    // que o usuário acaba de digitar. parseMoney aceita ambos os formatos,
    // então não há ambiguidade no salvamento.
    const fixed = n.toFixed(Math.max(0, maxDecimals));
    return fixed.replace('.', ',');
}

export default function MoneyInput({
    label,
    required,
    error,
    hint,
    prefix,
    suffix,
    value,
    onChangeText,
    onChangeNumber,
    maxDecimals = 2,
    allowNegative = false,
    formatOnBlur = true,
    onBlur,
    onFocus,
    placeholder,
    ...rest
}: MoneyInputProps) {
    // Buffer string local — fonte da verdade enquanto o input tem foco.
    // Quando perde foco e o pai forçar um valor novo, ressincronizamos.
    const initial =
        typeof value === 'number' && Number.isFinite(value) && value > 0
            ? String(value).replace('.', ',')
            : typeof value === 'string'
                ? value
                : '';
    const [draft, setDraft] = useState<string>(initial);
    const focused = useRef(false);

    // Sincroniza com mudanças externas quando NÃO está em foco
    // (evita que a normalização externa apague a vírgula que o usuário
    // acabou de digitar).
    useEffect(() => {
        if (focused.current) return;
        const incoming =
            typeof value === 'number' && Number.isFinite(value) && value !== 0
                ? String(value).replace('.', ',')
                : typeof value === 'string'
                    ? value
                    : '';
        setDraft(incoming);
    }, [value]);

    const handleChange = useCallback((raw: string) => {
        const cleaned = sanitize(raw, { maxDecimals, allowNegative });
        setDraft(cleaned);
        onChangeText?.(cleaned);
        // Para campos number, propagamos o número parseado em tempo real
        // SEM truncar a string visível — assim "29," vira number 29
        // no estado, mas o input continua mostrando "29,".
        if (onChangeNumber) onChangeNumber(parseMoney(cleaned));
    }, [maxDecimals, allowNegative, onChangeText, onChangeNumber]);

    // Tipos do onFocus/onBlur variam por versão do RN (nova vs antiga
    // arch). Repassamos o evento intocado, sem nos amarrar à shape.
    const handleFocus = useCallback((e: any) => {
        focused.current = true;
        (onFocus as any)?.(e);
    }, [onFocus]);

    const handleBlur = useCallback((e: any) => {
        focused.current = false;
        if (formatOnBlur && draft) {
            const formatted = formatBlurred(draft, maxDecimals);
            if (formatted !== draft) {
                setDraft(formatted);
                onChangeText?.(formatted);
                if (onChangeNumber) onChangeNumber(parseMoney(formatted));
            }
        }
        (onBlur as any)?.(e);
    }, [draft, formatOnBlur, maxDecimals, onBlur, onChangeText, onChangeNumber]);

    return (
        <FormInput
            label={label}
            required={required}
            error={error}
            hint={hint}
            prefix={prefix}
            suffix={suffix}
            placeholder={placeholder ?? 'Ex: 29,90'}
            // keyboardType "decimal-pad" mostra vírgula em locale pt-BR
            // (iOS) e teclado numérico c/ ponto em outros. Não bloqueia
            // digitação — quem normaliza é o sanitize().
            keyboardType="decimal-pad"
            inputMode="decimal"
            value={draft}
            onChangeText={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...rest}
        />
    );
}
