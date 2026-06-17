/**
 * time — formatação e parse de HORÁRIO (hora-do-dia) para o mercado
 * australiano (exibição 12h com AM/PM).
 *
 * Fonte ÚNICA de verdade para conversão 12h ↔ 24h. Nenhum componente
 * deve fazer split/regex de hora à mão — importe daqui.
 *
 * Contrato:
 *  - Formato canônico INTERNO (armazenado/transmitido) continua sendo
 *    "HH:mm" 24h (ex: "09:20", "18:45", "00:00"). NADA aqui muda o que é
 *    salvo no banco/payload.
 *  - O usuário SEMPRE vê e digita em 12h AM/PM. As funções de exibição
 *    convertem 24h → "9:20 AM" só na renderização.
 *
 * Tabela de referência (24h → exibição):
 *   00:00 → 12:00 AM    12:00 → 12:00 PM
 *   01:05 → 1:05 AM     13:30 → 1:30 PM
 *   09:20 → 9:20 AM     18:45 → 6:45 PM
 *                       23:59 → 11:59 PM
 */

export type Meridiem = 'AM' | 'PM';

/** Casa a string INTEIRA como um único "HH:mm" (ou "H:mm"). */
const SINGLE_TIME = /^(\d{1,2}):(\d{2})$/;

/** Casa cada token "HH:mm" dentro de uma string maior (ranges, etc). */
const TIME_TOKEN = /(\d{1,2}):(\d{2})/g;

/** Detecta se a string já traz AM/PM (a, am, p, pm, a.m., p.m.). */
const HAS_MERIDIEM = /\b([ap])\.?\s?m\.?\b/i;

/**
 * "13:30" → { hour12: 1, minute: 30, period: 'PM' }.
 * Retorna null se não for um "HH:mm" 24h válido.
 */
export function to12HourParts(
    time24: string | null | undefined,
): { hour12: number; minute: number; period: Meridiem } | null {
    if (!time24) return null;
    const m = SINGLE_TIME.exec(String(time24).trim());
    if (!m) return null;
    const h = parseInt(m[1], 10);
    const min = parseInt(m[2], 10);
    if (Number.isNaN(h) || Number.isNaN(min)) return null;
    if (h < 0 || h > 23 || min < 0 || min > 59) return null;
    const period: Meridiem = h >= 12 ? 'PM' : 'AM';
    let hour12 = h % 12;
    if (hour12 === 0) hour12 = 12;
    return { hour12, minute: min, period };
}

/**
 * "13:30" → "1:30 PM". Se a entrada não for um horário 24h válido,
 * devolve a entrada original (degrade gracioso — nunca "Invalid").
 */
export function to12HourTime(time24: string | null | undefined): string {
    const parts = to12HourParts(time24);
    if (!parts) return time24 ? String(time24) : '';
    return `${parts.hour12}:${String(parts.minute).padStart(2, '0')} ${parts.period}`;
}

/**
 * (1, 30, 'PM') → "13:30". Trata os casos de meia-noite/meio-dia:
 *   12 AM → 00 · 12 PM → 12 · 1 PM → 13 · 11 PM → 23.
 */
export function to24HourTime(hour12: number, minute: number, period: Meridiem): string {
    let h24 = hour12 % 12; // 12 → 0
    if (period === 'PM') h24 += 12; // 0→12 ... 11→23
    return `${String(h24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

/**
 * Formata para EXIBIÇÃO ao usuário (mercado AU). Aceita:
 *  - horário único: "18:45" → "6:45 PM"
 *  - range: "09:00 – 18:00" → "9:00 AM – 6:00 PM"
 *  - múltiplos ranges: "09:00 – 12:00; 15:00 – 20:00"
 *  - texto livre com horas embutidas (substitui só os tokens HH:mm)
 *
 * Idempotente: se a string já contém AM/PM, devolve sem reconverter
 * (evita "6:45 PM" virar lixo numa segunda passagem).
 */
export function formatTimeForAustraliaDisplay(value?: string | null): string {
    if (value === null || value === undefined) return '';
    const s = String(value).trim();
    if (!s) return '';
    if (HAS_MERIDIEM.test(s)) return s; // já formatado
    return s.replace(TIME_TOKEN, (_match, hh: string, mm: string) =>
        to12HourTime(`${hh}:${mm}`),
    );
}

/**
 * Normaliza ENTRADA livre do usuário → canônico "HH:mm" 24h, ou '' se
 * não der pra entender. Aceita, entre outros:
 *   "9:20 AM", "09:20 AM", "9 AM", "9am", "9:20am", "12:00 PM",
 *   "12 PM", "1830", "930", "13:30", "9.20", "9h20"
 *
 * Sem meridiem explícito, preserva 24h ("13:30" → "13:30").
 */
export function parseAustralianTimeInput(value: string | null | undefined): string {
    if (!value) return '';
    const raw = String(value).trim().toLowerCase();
    if (!raw) return '';

    // 1. Extrai meridiem (am/pm), se houver, e remove do core.
    const meridiemMatch = raw.match(/([ap])\.?\s?m\.?/);
    const meridiem: 'a' | 'p' | null = meridiemMatch ? (meridiemMatch[1] as 'a' | 'p') : null;
    const core = raw.replace(/([ap])\.?\s?m\.?/, '').trim();

    let h: number;
    let m: number;

    // 2. Tenta "9:20", "9.20", "9h20".
    const sep = core.match(/^(\d{1,2})[:.h](\d{1,2})$/);
    if (sep) {
        h = parseInt(sep[1], 10);
        m = parseInt(sep[2], 10);
    } else {
        // 3. Só dígitos: "9" → 09:00, "930" → 9:30, "1830" → 18:30.
        const digits = core.replace(/\D/g, '');
        if (!digits) return '';
        if (digits.length <= 2) {
            h = parseInt(digits, 10);
            m = 0;
        } else if (digits.length === 3) {
            h = parseInt(digits.slice(0, 1), 10);
            m = parseInt(digits.slice(1), 10);
        } else {
            h = parseInt(digits.slice(0, 2), 10);
            m = parseInt(digits.slice(2, 4), 10);
        }
    }

    if (Number.isNaN(h) || Number.isNaN(m)) return '';

    // 4. Aplica meridiem (12 AM → 0; 12 PM → 12; 1-11 PM → +12).
    if (meridiem === 'a') {
        if (h === 12) h = 0;
    } else if (meridiem === 'p') {
        if (h !== 12) h += 12;
    }

    // 5. Valida faixa final.
    if (h < 0 || h > 23 || m < 0 || m > 59) return '';

    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
