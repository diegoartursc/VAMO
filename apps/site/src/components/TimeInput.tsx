"use client";

/**
 * TimeInput — campo de horário do site no padrão australiano (12h AM/PM).
 *
 * Contrato igual ao do mobile (VamoTimePicker):
 *  - O usuário VÊ e DIGITA em AM/PM ("9:20 AM", "6 pm", "1830"…).
 *  - O modelo (props.value / onCommit) continua em "HH:mm" 24h — nada
 *    muda no payload/banco.
 *
 * Mantém estado local de texto enquanto o campo está em foco (digitação
 * livre) e só normaliza no blur, via os utilitários centrais de
 * @vamo/shared. Entrada inválida reverte para o valor canônico atual.
 */

import { useEffect, useState } from "react";
import { to12HourTime, parseAustralianTimeInput } from "@vamo/shared/itinerary";

export interface TimeInputProps {
    /** Valor canônico "HH:mm" 24h (ou "" quando vazio). */
    value: string;
    /** Chamado no blur com o novo valor canônico "HH:mm" (ou "" se limpo). */
    onCommit: (hhmm: string) => void;
    className?: string;
    style?: React.CSSProperties;
    placeholder?: string;
    "aria-label"?: string;
}

export default function TimeInput({
    value,
    onCommit,
    className,
    style,
    placeholder = "9:20 AM",
    "aria-label": ariaLabel,
}: TimeInputProps) {
    const [text, setText] = useState(() => to12HourTime(value));
    const [focused, setFocused] = useState(false);

    // Sincroniza a exibição quando o valor externo muda e o campo não está
    // em edição (ex.: troca de roteiro, reset de formulário).
    useEffect(() => {
        if (!focused) setText(to12HourTime(value));
    }, [value, focused]);

    return (
        <input
            className={className}
            style={style}
            placeholder={placeholder}
            aria-label={ariaLabel}
            value={text}
            onFocus={() => setFocused(true)}
            onChange={(e) => setText(e.target.value)}
            onBlur={() => {
                setFocused(false);
                const trimmed = text.trim();
                if (!trimmed) {
                    // Campo limpo → propaga limpeza (se havia valor) e zera texto.
                    if (value) onCommit("");
                    setText("");
                    return;
                }
                const parsed = parseAustralianTimeInput(trimmed);
                if (parsed) {
                    if (parsed !== value) onCommit(parsed);
                    setText(to12HourTime(parsed));
                } else {
                    // Não entendeu a entrada → reverte para o canônico atual.
                    setText(value ? to12HourTime(value) : "");
                }
            }}
        />
    );
}
