/**
 * ItemFormModal — modal genérico (renderer) usado por EditItemModal e
 * AddItemModal. Dado um `kind` (categoria) e um `data` inicial, renderiza
 * o formulário com os FieldSpecs de `itemFields.ts`.
 *
 * Não conhece "edit vs add" — recebe títulos, label do botão primário,
 * e flag opcional para o aviso "Edição salva apenas no seu roteiro"
 * (quando isOriginal). Os dois modais derivados só configuram essas
 * props e despacham o resultado para o caller.
 *
 * Estado: clona `initial` no abrir, mantém um objeto local plain (sem
 * useReducer — campos individuais via patch).
 */

import React, { useEffect, useState } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../../theme/theme';
import { haptics } from '../../services/haptics';
import FormInput from '../../components/dashboard/FormInput';
import MoneyInput from '../../components/dashboard/MoneyInput';
import { CurrencyPicker } from '../../components/common/CurrencyPicker';

import { DatePickerField, TimePickerField } from './pickers';
import { FIELDS_BY_KIND, KIND_TITLE, type FieldSpec } from './itemFields';
import type { ItemKind } from '../../services/routeCustomization';

/**
 * Shape interno do estado UI para um campo `cost`. Note que ele é DIFERENTE
 * do shape persistido em `data.cost` — internamente usamos `value` por
 * conveniência (string editável no MoneyInput), mas no `normalizeForSave`
 * convertemos pra `amount` (shape canônico do creator) ANTES de salvar.
 *
 * Por que isso importa: as utility shared (`resolveCostInfo`,
 * `getCostReferences`, `calculateBudgetSummary`) leem EXCLUSIVAMENTE
 * `cost.amount`. Se salvássemos com a chave `value`, o item editado pelo
 * viajante NÃO entraria na agregação de "Referência de Gastos por Pessoa"
 * (parseMoney(undefined) → 0 → toReferenceItem retorna null → item some).
 *
 * Bug histórico: até a rodada passada, salvávamos `{ value, currency }`
 * direto. ItemCard funcionava (helper lia ambos) mas a Referência de
 * Gastos pulava o item. Corrigido aqui — back-compat preservada via
 * pickInitialValue.
 */
interface CostValue { value: string; currency: string; }

/** Estado vazio padrão pra um campo cost. AUD por ser o mercado canônico. */
const EMPTY_COST: CostValue = { value: '', currency: 'AUD' };

export interface ItemFormModalProps {
    visible: boolean;
    onClose: () => void;
    kind: ItemKind;
    /** Estado inicial do `data` (clonado no abrir). Pode vir vazio para "Adicionar". */
    initial?: Record<string, any> | null;
    /** Quando true, mostra aviso "Edição salva apenas no seu roteiro". */
    isOriginal?: boolean;
    /** Título do modal. Default: KIND_TITLE[kind].singular. */
    title?: string;
    /** Label do botão primário. Default: "Salvar". */
    primaryLabel?: string;
    /** Subtítulo opcional. */
    subtitle?: string;
    /** Chamado com o `data` final (objeto plano). Retorne promise para "Salvando…". */
    onSave: (data: Record<string, any>) => Promise<void> | void;
}

// ─── Helpers ──────────────────────────────────────────────────

function pickInitialValue(spec: FieldSpec, source: Record<string, any> | null | undefined): any {
    if (spec.type === 'cost') {
        // Aceita 3 fontes pra back-compat:
        //   1. Shape canônico do creator: data.cost = { amount, currency, ... } (preferido)
        //   2. Shape antigo da rodada passada: data.cost = { value, currency }
        //   3. Shape legacy plano: data.priceValue/priceCurrency, data.value/currency
        const raw = source?.[spec.key];
        if (raw && typeof raw === 'object') {
            // amount tem prioridade — é o shape canônico do creator + shared utils.
            const amountStr = typeof raw.amount === 'string'
                ? raw.amount
                : (typeof raw.amount === 'number' ? String(raw.amount) : null);
            const valueStr = typeof raw.value === 'string'
                ? raw.value
                : (typeof raw.value === 'number' ? String(raw.value) : null);
            return {
                value: amountStr ?? valueStr ?? '',
                currency: typeof raw.currency === 'string' && raw.currency.length > 0
                    ? raw.currency
                    : 'AUD',
            };
        }
        if (source && typeof source === 'object') {
            const legacyValue = source.priceValue ?? source.value;
            const legacyCurrency = source.priceCurrency ?? source.currency;
            if (legacyValue !== undefined && legacyValue !== null && legacyValue !== '') {
                return {
                    value: String(legacyValue),
                    currency: typeof legacyCurrency === 'string' && legacyCurrency.length > 0
                        ? legacyCurrency
                        : 'AUD',
                };
            }
        }
        return { ...EMPTY_COST };
    }
    if (!source) return spec.type === 'number' ? '' : '';
    const v = source[spec.key];
    if (v === undefined || v === null) return '';
    return v;
}

function normalizeForSave(spec: FieldSpec, raw: any): any {
    if (spec.type === 'cost') {
        // Só persiste se houver valor — currency sozinha é ruído.
        if (!raw || typeof raw !== 'object') return null;
        const value = typeof raw.value === 'string' ? raw.value.trim() : '';
        if (!value) return null;
        const currency = typeof raw.currency === 'string' && raw.currency.length > 0
            ? raw.currency
            : 'AUD';
        // ⚠️ ATENÇÃO — salvamos como `{ amount, currency, disclosureType }`
        // e NÃO como `{ value, currency }`. Motivo:
        //   - `amount` é a chave que `resolveCostInfo` lê (shared util).
        //   - `disclosureType: 'estimated'` faz `toReferenceItem` NÃO
        //     filtrar o item da Referência de Gastos (filtra apenas
        //     `'not_informed'`).
        //   - `sharedByPeople: 1` mantém o comportamento "gasto individual"
        //     por default — futura iteração pode tornar editável no modal.
        // Mantemos `value` como alias por compat com leitores antigos
        // (ItemCard.pickDisplayCost ainda tenta value como fallback).
        return {
            amount: value,
            value, // alias temporário pra back-compat — pode ser removido depois
            currency,
            disclosureType: 'estimated',
            sharedByPeople: 1,
        };
    }
    if (spec.type === 'number') {
        if (raw === '' || raw === null || raw === undefined) return null;
        const n = Number(raw);
        return Number.isFinite(n) ? n : null;
    }
    if (spec.type === 'money') {
        // Mantém string monetária (ex: "29,90") — o resto do app tipicamente
        // parseia com parseMoney quando precisa do number.
        return typeof raw === 'string' ? raw : raw == null ? '' : String(raw);
    }
    if (typeof raw === 'string') {
        const trimmed = raw.trim();
        return trimmed.length > 0 ? trimmed : null;
    }
    return raw ?? null;
}

// ─── Componente ───────────────────────────────────────────────

export default function ItemFormModal({
    visible,
    onClose,
    kind,
    initial,
    isOriginal,
    title,
    primaryLabel = 'Salvar',
    subtitle,
    onSave,
}: ItemFormModalProps) {
    const fields = FIELDS_BY_KIND[kind] || [];
    const kindMeta = KIND_TITLE[kind];

    const [state, setState] = useState<Record<string, any>>(() => buildInitialState(fields, initial));
    const [saving, setSaving] = useState(false);

    // Resincroniza ao reabrir ou trocar de item.
    useEffect(() => {
        if (!visible) return;
        setState(buildInitialState(fields, initial));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible, kind, initial]);

    const patch = (key: string, value: any) => {
        setState((prev) => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        if (saving) return;
        // Monta o payload final aplicando normalize.
        const finalData: Record<string, any> = {};
        for (const spec of fields) {
            const normalized = normalizeForSave(spec, state[spec.key]);
            // Só inclui não-null — campos vazios viram "ausentes" no patch.
            // O caller decide como mesclar (para edit, "ausente" = manter
            // original; para add, "ausente" = não preenchido).
            if (normalized !== null && normalized !== undefined && normalized !== '') {
                finalData[spec.key] = normalized;
            }
        }
        try {
            setSaving(true);
            haptics.light();
            await onSave(finalData);
            onClose();
        } catch {
            // Caller já notifica.
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.bg}
            >
                <View style={styles.card}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.title}>
                                {title || kindMeta?.singular || 'Item'}
                            </Text>
                            {subtitle ? (
                                <Text style={styles.subtitle}>{subtitle}</Text>
                            ) : null}
                        </View>
                        <TouchableOpacity
                            onPress={onClose}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                            <Ionicons name="close" size={22} color={theme.colors.text.secondary} />
                        </TouchableOpacity>
                    </View>

                    {/* Aviso: edição só vale para mim */}
                    {isOriginal ? (
                        <View style={styles.warningBox}>
                            <Ionicons
                                name="information-circle"
                                size={15}
                                color={theme.colors.info}
                            />
                            <Text style={styles.warningText}>
                                Sua edição é salva apenas no seu roteiro. O original do criador
                                permanece intacto.
                            </Text>
                        </View>
                    ) : null}

                    {/* Form */}
                    <ScrollView
                        style={styles.scroll}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        {fields.map((spec) => (
                            <FieldRenderer
                                key={spec.key}
                                spec={spec}
                                value={state[spec.key]}
                                onChange={(v) => patch(spec.key, v)}
                            />
                        ))}
                    </ScrollView>

                    {/* Actions */}
                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={styles.btnGhost}
                            onPress={onClose}
                            disabled={saving}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.btnGhostText}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.btnPrimary, saving && styles.btnDisabled]}
                            onPress={handleSave}
                            disabled={saving}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.btnPrimaryText}>
                                {saving ? 'Salvando…' : primaryLabel}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

// ─── Renderer por tipo ────────────────────────────────────────

function buildInitialState(fields: FieldSpec[], initial?: Record<string, any> | null): Record<string, any> {
    const out: Record<string, any> = {};
    for (const spec of fields) {
        out[spec.key] = pickInitialValue(spec, initial);
    }
    return out;
}

interface FieldRendererProps {
    spec: FieldSpec;
    value: any;
    onChange: (v: any) => void;
}

function FieldRenderer({ spec, value, onChange }: FieldRendererProps) {
    switch (spec.type) {
        case 'cost':
            return <CostField spec={spec} value={value} onChange={onChange} />;
        case 'picker':
            return <PickerField spec={spec} value={value} onChange={onChange} />;
        case 'multiline':
            return (
                <FormInput
                    label={spec.label}
                    placeholder={spec.placeholder}
                    hint={spec.hint}
                    required={spec.required}
                    value={typeof value === 'string' ? value : value == null ? '' : String(value)}
                    onChangeText={onChange}
                    multiline
                    numberOfLines={3}
                />
            );
        case 'money':
            return (
                <MoneyInput
                    label={spec.label}
                    required={spec.required}
                    hint={spec.hint}
                    prefix={spec.prefix}
                    suffix={spec.suffix}
                    value={typeof value === 'number' ? value : (value ?? '')}
                    onChangeText={onChange}
                />
            );
        case 'date':
            return (
                <DatePickerField
                    label={spec.label}
                    required={spec.required}
                    placeholder={spec.placeholder}
                    value={typeof value === 'string' ? value : ''}
                    onChange={onChange}
                />
            );
        case 'time':
            return (
                <TimePickerField
                    label={spec.label}
                    required={spec.required}
                    placeholder={spec.placeholder}
                    value={typeof value === 'string' ? value : ''}
                    onChange={onChange}
                />
            );
        case 'number':
            return (
                <FormInput
                    label={spec.label}
                    placeholder={spec.placeholder}
                    hint={spec.hint}
                    required={spec.required}
                    value={value == null || value === '' ? '' : String(value)}
                    onChangeText={(text) => {
                        // Cap a dígitos.
                        const cleaned = text.replace(/[^0-9]/g, '');
                        onChange(cleaned);
                    }}
                    keyboardType="numeric"
                    inputMode="numeric"
                />
            );
        case 'text':
        default:
            return (
                <FormInput
                    label={spec.label}
                    placeholder={spec.placeholder}
                    hint={spec.hint}
                    required={spec.required}
                    value={typeof value === 'string' ? value : value == null ? '' : String(value)}
                    onChangeText={onChange}
                />
            );
    }
}

/**
 * Field do tipo `cost`: combina MoneyInput (valor) com CurrencyPicker
 * (mesmo componente compacto usado pelo criador no CostBlock).
 *
 * State é um objeto `{ value, currency }`. Decisão deliberada: a moeda
 * sempre vem default 'AUD' e nunca é apagada — o user pode trocar mas
 * não esvaziar — porque "valor sem moeda" não tem sentido.
 *
 * Layout: MoneyInput em cima (largo), CurrencyPicker compacto embaixo.
 * No web ambos renderizam side-by-side num row se houver espaço.
 */
function CostField({
    spec,
    value,
    onChange,
}: { spec: FieldSpec; value: any; onChange: (v: any) => void }) {
    const current: CostValue = value && typeof value === 'object'
        ? { value: value.value ?? '', currency: value.currency ?? 'AUD' }
        : { ...EMPTY_COST };

    return (
        <View style={costStyles.wrap}>
            <View style={costStyles.labelRow}>
                <Text style={costStyles.label}>{spec.label}</Text>
                {spec.required ? <Text style={costStyles.required}>*</Text> : null}
            </View>
            {spec.hint ? <Text style={costStyles.hint}>{spec.hint}</Text> : null}
            <View style={costStyles.row}>
                <View style={costStyles.moneyWrap}>
                    <MoneyInput
                        label="Valor"
                        value={current.value}
                        onChangeText={(v) => onChange({ ...current, value: v })}
                        placeholder="0,00"
                    />
                </View>
                <View style={costStyles.currencyWrap}>
                    <CurrencyPicker
                        value={current.currency}
                        onChange={(c) => onChange({ ...current, currency: c })}
                        label="Moeda"
                        compact
                    />
                </View>
            </View>
        </View>
    );
}

const costStyles = StyleSheet.create({
    wrap: {
        marginBottom: 14,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 6,
    },
    label: {
        fontSize: 13,
        fontWeight: '700',
        color: theme.colors.text.primary,
    },
    required: {
        fontSize: 13,
        fontWeight: '700',
        color: theme.colors.error,
    },
    hint: {
        fontSize: 11.5,
        color: theme.colors.text.tertiary,
        marginBottom: 6,
    },
    row: {
        flexDirection: 'row',
        gap: 10,
        alignItems: 'flex-start',
    },
    moneyWrap: {
        flex: 1.6,
    },
    currencyWrap: {
        flex: 1,
        minWidth: 120,
    },
});

/**
 * Field do tipo `picker`: lista horizontal de chips com opções fixas.
 * Selecionar é exclusivo (single-select). Tocar de novo na opção ativa
 * limpa o campo — útil pra deixar opcional sem precisar de "Nenhuma".
 */
function PickerField({
    spec,
    value,
    onChange,
}: { spec: FieldSpec; value: any; onChange: (v: any) => void }) {
    const options = spec.options ?? [];
    const current = typeof value === 'string' ? value : '';
    return (
        <View style={pickerStyles.wrap}>
            <View style={pickerStyles.labelRow}>
                <Text style={pickerStyles.label}>{spec.label}</Text>
                {spec.required ? <Text style={pickerStyles.required}>*</Text> : null}
            </View>
            {spec.hint ? <Text style={pickerStyles.hint}>{spec.hint}</Text> : null}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={pickerStyles.chipsRow}
            >
                {options.map(opt => {
                    const active = current === opt.value;
                    return (
                        <TouchableOpacity
                            key={opt.value}
                            style={[pickerStyles.chip, active && pickerStyles.chipActive]}
                            onPress={() => {
                                haptics.selection();
                                onChange(active ? '' : opt.value);
                            }}
                            activeOpacity={0.85}
                        >
                            <Text
                                style={[pickerStyles.chipLabel, active && pickerStyles.chipLabelActive]}
                            >
                                {opt.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
}

const pickerStyles = StyleSheet.create({
    wrap: {
        marginBottom: 14,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 6,
    },
    label: {
        fontSize: 13,
        fontWeight: '700',
        color: theme.colors.text.primary,
    },
    required: {
        fontSize: 13,
        fontWeight: '700',
        color: theme.colors.error,
    },
    hint: {
        fontSize: 11.5,
        color: theme.colors.text.tertiary,
        marginBottom: 6,
    },
    chipsRow: {
        gap: 6,
        paddingRight: 8,
    },
    chip: {
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: '#fff',
    },
    chipActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    chipLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.text.secondary,
    },
    chipLabelActive: {
        color: '#fff',
    },
});

// ─── Styles ──────────────────────────────────────────────────

const styles = StyleSheet.create({
    bg: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    card: {
        width: '100%',
        maxWidth: 440,
        maxHeight: '90%',
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        ...theme.shadows.medium,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        marginBottom: 14,
    },
    title: {
        fontSize: 18,
        fontWeight: '800',
        color: theme.colors.text.primary,
    },
    subtitle: {
        fontSize: 12.5,
        color: theme.colors.text.tertiary,
        marginTop: 2,
    },
    warningBox: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'flex-start',
        padding: 10,
        borderRadius: 10,
        backgroundColor: theme.colors.info + '12',
        borderWidth: 1,
        borderColor: theme.colors.info + '38',
        marginBottom: 12,
    },
    warningText: {
        flex: 1,
        fontSize: 12,
        color: theme.colors.text.secondary,
        lineHeight: 17,
    },
    scroll: {
        maxHeight: 460,
    },
    actions: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 14,
    },
    btnGhost: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        backgroundColor: theme.colors.borderLight,
    },
    btnGhostText: {
        fontWeight: '700',
        color: theme.colors.text.primary,
    },
    btnPrimary: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        backgroundColor: theme.colors.primary,
    },
    btnPrimaryText: {
        fontWeight: '700',
        color: '#fff',
    },
    btnDisabled: {
        opacity: 0.55,
    },
});
