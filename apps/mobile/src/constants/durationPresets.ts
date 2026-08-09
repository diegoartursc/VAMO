/**
 * Presets de duração da busca — fonte ÚNICA das faixas.
 *
 * Cada preset descreve uma faixa real (mínimo e/ou máximo em dias), nunca um
 * número "representativo". Isso substitui o modelo antigo (`duration?: number`
 * interpretado como máximo), que transformava intervalos em média — "+20 dias"
 * virava 25 e "Fim de semana" virava 2 ou 3 dias soltos.
 *
 * Regras (contrato fechado com o produto):
 *   any       → sem mínimo e sem máximo (não filtra)
 *   weekend   → 2 a 3 dias
 *   up_to_7   → até 7 dias  (sem mínimo)
 *   up_to_15  → até 15 dias (sem mínimo)
 *   20_plus   → 20 dias ou mais (SEM teto — 45 dias entra)
 *
 * Roteiros de 16 a 19 dias só aparecem em "Qualquer": é intencional, não
 * classificamos silenciosamente como "+20 dias".
 */

export type DurationPresetId = 'any' | 'weekend' | 'up_to_7' | 'up_to_15' | '20_plus';

export interface DurationPreset {
    id: DurationPresetId;
    label: string;
    /** Mínimo inclusivo em dias. Ausente = sem piso. */
    min?: number;
    /** Máximo inclusivo em dias. Ausente = sem teto. */
    max?: number;
    /** Texto lido por leitores de tela no chip. */
    accessibilityLabel: string;
}

/** Preset canônico de "sem restrição". */
export const DEFAULT_DURATION_PRESET: DurationPresetId = 'any';

export const DURATION_PRESETS: readonly DurationPreset[] = [
    {
        id: 'any',
        label: 'Qualquer',
        accessibilityLabel: 'Não filtrar por duração',
    },
    {
        id: 'weekend',
        label: 'Fim de semana',
        min: 2,
        max: 3,
        accessibilityLabel: 'Filtrar roteiros com duração de fim de semana, de 2 a 3 dias',
    },
    {
        id: 'up_to_7',
        label: 'Até 7 dias',
        max: 7,
        accessibilityLabel: 'Filtrar roteiros com até 7 dias',
    },
    {
        id: 'up_to_15',
        label: 'Até 15 dias',
        max: 15,
        accessibilityLabel: 'Filtrar roteiros com até 15 dias',
    },
    {
        id: '20_plus',
        label: '+20 dias',
        min: 20,
        accessibilityLabel: 'Filtrar roteiros com 20 dias ou mais',
    },
] as const;

/** Preset pelo id. Id desconhecido cai em "Qualquer" (nunca quebra a UI). */
export function getDurationPreset(id: DurationPresetId | null | undefined): DurationPreset {
    return DURATION_PRESETS.find(preset => preset.id === id) ?? DURATION_PRESETS[0];
}

export interface DurationRange {
    durationPreset: DurationPresetId;
    durationMin?: number;
    durationMax?: number;
}

/**
 * Traduz preset → faixa. É o ÚNICO ponto que escreve `durationMin`/`durationMax`
 * nos filtros, para preset e faixa nunca divergirem.
 */
export function getDurationRange(id: DurationPresetId | null | undefined): DurationRange {
    const preset = getDurationPreset(id);
    return {
        durationPreset: preset.id,
        durationMin: preset.min,
        durationMax: preset.max,
    };
}

/**
 * Caminho inverso — usado ao hidratar o modal a partir de filtros já aplicados
 * (ou de um deep link que traga só min/max). Faixa sem preset equivalente volta
 * como 'any' apenas quando não há restrição alguma.
 */
export function resolveDurationPresetFromRange(
    durationMin: number | undefined,
    durationMax: number | undefined,
): DurationPresetId | null {
    if (durationMin === undefined && durationMax === undefined) return 'any';
    const match = DURATION_PRESETS.find(
        preset => preset.min === durationMin && preset.max === durationMax,
    );
    return match ? match.id : null;
}
