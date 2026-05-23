/**
 * VAMO Mobile — Wizard COMPLETO de Criação de Roteiro
 *
 * Espelha o fluxo do dashboard web (apps/site/src/app/dashboard/roteiro/[id]/page.tsx)
 * com 9 passos adaptados ao formato mobile. Usa @vamo/shared como single source
 * of truth para tipos, score, validação e payload — garantindo paridade com o site.
 *
 * Passos:
 *   1. Identidade & Indexação  (título, destino, categorias, estilos, descrição)
 *   2. Comprovante de Viagem   (upload de imagem do comprovante — obrigatório)
 *   3. Preço & Comercial       (preço, moeda, promoção, acessos, parcelas)
 *   4. Módulos                  (toggles dos 9 módulos)
 *   5. Roteiro dia a dia        (gera N dias baseado em duration)
 *   6. Conteúdo dos módulos     (hospedagens, passeios, transporte, restaurantes, voo)
 *   7. Dicas, Checklist, Gastos (se módulos ativos)
 *   8. Mídia                    (galeria + fotos de capa)
 *   9. Revisão                  (score, pendências, "Enviar para análise")
 */

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform,
    StatusBar, ActivityIndicator, KeyboardAvoidingView, Alert, Animated,
    Modal, TextInput, Image, Switch,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
    Wallet, BarChart3, Crown,
    Landmark, ChefHat, Leaf, Dumbbell, Ship, Globe, Sparkles,
    Sun, BookOpen, Music, Backpack, Users, Heart, Mountain,
    CalendarDays, Plane, Building2, Ticket, Bus, Lightbulb, Utensils, ListChecks, CreditCard,
    Camera, Star, Clock, X,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../src/theme/theme';
import { haptics } from '../src/services/haptics';
import { useAuth } from '../src/contexts/AuthContext';
import FormInput from '../src/components/dashboard/FormInput';
import EditableList from '../src/components/dashboard/EditableList';
import { CurrencyPicker } from '../src/components/common/CurrencyPicker';
import {
    createEmptyForm,
    ItineraryFormState,
    ModuleKey,
    Day,
    Activity,
    Accommodation,
    AttractionItem,
    Transport,
    RestaurantItem,
    ChecklistItem,
    SpendingEntry,
    ModuleSpending,
    EMPTY_MODULE_SPENDING,
    ExtraSpendingItem,
    FlightLeg,
    EMPTY_FLIGHT_LEG,
    STYLE_OPTIONS,
    CATEGORY_OPTIONS,
    MODULE_OPTIONS,
    CHECKLIST_CATS,
    SPENDING_CATS,
    EXTRA_SPENDING_CATEGORIES,
    ATTRACTION_TYPES,
    CUISINE_OPTIONS,
    MAX_CATEGORIES,
    MIN_TIPS,
    MIN_CHECKLIST,
    buildPayload,
    calcQuality,
    calcQualityBlocks,
    validateForSubmission,
} from '@vamo/shared/itinerary';

const DRAFT_KEY = '@vamo_draft_itinerary_v2';
const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3333/api';

// ── Sistema dinâmico de etapas ──────────────────────────────────────
// As etapas base (identidade, comprovante, comercial, módulos) e finais
// (mídia, revisão) são fixas. Entre elas, cada módulo ativado em
// activeModules vira uma etapa própria — na mesma ordem de MODULE_OPTIONS.

type StepKey =
    | 'identity' | 'proof' | 'commerce' | 'modules'
    | 'days' | 'voo' | 'hospedagem' | 'passeios' | 'transporte'
    | 'dicas' | 'restaurantes' | 'checklist' | 'gastos_extras'
    | 'media' | 'review';

const MODULE_TO_STEP: Partial<Record<ModuleKey, StepKey>> = {
    itinerario:    'days',
    voo:           'voo',
    hospedagem:    'hospedagem',
    passeios:      'passeios',
    transporte:    'transporte',
    dicas:         'dicas',
    restaurantes:  'restaurantes',
    checklist:     'checklist',
    gastos_extras: 'gastos_extras',
    // 'gasto' (legacy) intencionalmente omitido — não vira mais step.
};

const STEP_LABEL_MAP: Record<StepKey, string> = {
    identity:      'Identidade',
    proof:         'Comprovante',
    commerce:      'Comercial',
    modules:       'Módulos',
    days:          'Itinerário por dia',
    voo:           'Meu Voo',
    hospedagem:    'Hospedagens',
    passeios:      'Passeios & Atrações',
    transporte:    'Transporte',
    dicas:         'Dicas Exclusivas',
    restaurantes:  'Restaurantes',
    checklist:     'Checklist',
    gastos_extras: 'Gastos Extras',
    media:         'Fotos e Vídeos',
    review:        'Revisão',
};

function buildSteps(activeModules: ModuleKey[]): StepKey[] {
    const base: StepKey[] = ['identity', 'proof', 'commerce', 'modules'];
    const dynamic: StepKey[] = MODULE_OPTIONS
        .filter(m => activeModules.includes(m.key))
        .map(m => MODULE_TO_STEP[m.key])
        .filter((k): k is StepKey => !!k);
    return [...base, ...dynamic, 'media', 'review'];
}

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

export default function NewItineraryScreen() {
    const router = useRouter();
    const { id: editId } = useLocalSearchParams<{ id?: string }>();
    const { accessToken } = useAuth();
    const isEdit = !!editId;

    const [step, setStep] = useState(1);
    const [form, setForm] = useState<ItineraryFormState>(createEmptyForm());
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(isEdit);
    const [showResume, setShowResume] = useState(false);
    const [pendingDraft, setPendingDraft] = useState<{ form: ItineraryFormState; step: number } | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Etapas dinâmicas baseadas nos módulos ativos
    const steps = useMemo(() => buildSteps(form.activeModules), [form.activeModules]);
    const totalSteps = steps.length;
    const stepKey: StepKey = steps[Math.min(step, totalSteps) - 1] ?? 'review';
    const isLastStep = step >= totalSteps;

    // Se módulos foram desativados e a etapa atual passou a não existir, ajusta.
    useEffect(() => {
        if (step > totalSteps) setStep(totalSteps);
    }, [totalSteps, step]);

    const score = useMemo(() => calcQuality(form), [form]);
    const submissionIssues = useMemo(() => validateForSubmission(form), [form]);
    const hasIssues = submissionIssues.length > 0;
    const scrollRef = useRef<ScrollView>(null);

    // ── Hidratar draft local ────────────────────────────────────
    useEffect(() => {
        if (isEdit) return;
        AsyncStorage.getItem(DRAFT_KEY).then(raw => {
            if (!raw) return;
            try {
                const saved = JSON.parse(raw);
                if (saved.form?.title || saved.form?.destination || saved.form?.locations?.[0]?.cities?.[0]) {
                    setPendingDraft({ form: saved.form, step: saved.step || 1 });
                    setShowResume(true);
                }
            } catch { /* ignore */ }
        });
    }, [isEdit]);

    // ── Carregar para edição ────────────────────────────────────
    useEffect(() => {
        if (!isEdit || !editId) return;
        (async () => {
            try {
                const res = await fetch(`${API_BASE}/itineraries/${editId}`, {
                    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
                });
                if (!res.ok) throw new Error('Roteiro não encontrado');
                const data = await res.json();
                setForm(deserializeFromApi(data));
            } catch (e: any) {
                Alert.alert('Erro ao carregar', e?.message || 'Não foi possível abrir o roteiro.');
                router.back();
            } finally {
                setLoading(false);
            }
        })();
    }, [isEdit, editId]);

    // ── Salvar draft local ──────────────────────────────────────
    const saveDraftLocal = useCallback((f: ItineraryFormState, s: number) => {
        if (isEdit) return;
        AsyncStorage.setItem(DRAFT_KEY, JSON.stringify({ form: f, step: s })).catch(() => {});
    }, [isEdit]);

    const updateForm = useCallback(<K extends keyof ItineraryFormState>(key: K, value: ItineraryFormState[K]) => {
        setForm(prev => {
            const next = { ...prev, [key]: value };
            saveDraftLocal(next, step);
            return next;
        });
    }, [step, saveDraftLocal]);

    // ── Navegação ───────────────────────────────────────────────
    const goNext = useCallback(() => {
        haptics.light();
        if (isLastStep) { submit(); return; }
        // Bloqueia avanço da etapa Comprovante sem arquivo anexado
        if (stepKey === 'proof' && !form.travelProofUrl) {
            haptics.error?.();
            Alert.alert(
                'Comprovante obrigatório',
                'Envie um arquivo que comprove que você esteve no destino (bilhete aéreo, recibo de hotel, passaporte carimbado, etc.) para continuar.',
                [{ text: 'Entendi', style: 'default' }],
            );
            return;
        }
        const ns = Math.min(step + 1, totalSteps);
        setStep(ns);
        saveDraftLocal(form, ns);
    }, [step, stepKey, isLastStep, totalSteps, form, saveDraftLocal]);

    const goBack = useCallback(() => {
        haptics.light();
        if (step === 1) { router.back(); return; }
        const ns = step - 1;
        setStep(ns);
        saveDraftLocal(form, ns);
    }, [step, form, router, saveDraftLocal]);

    // ── Envio para análise ──────────────────────────────────────
    async function submit() {
        if (!accessToken) {
            Alert.alert('Sessão expirada', 'Faça login novamente para enviar o roteiro.');
            return;
        }
        const issues = validateForSubmission(form);
        if (issues.length) {
            // Na etapa Revisão (última), o card de pendências já está visível —
            // só rola para o topo e dá um haptic de erro. Em outras etapas
            // (fallback), mostra Alert listando os problemas.
            if (isLastStep) {
                haptics.error?.();
                scrollRef.current?.scrollTo({ y: 0, animated: true });
            } else {
                Alert.alert(
                    'Faltam algumas coisas',
                    issues.map(i => `• ${i.message}`).join('\n'),
                );
            }
            return;
        }
        setSubmitting(true);
        try {
            const payload = { ...buildPayload(form), status: 'PENDING_REVIEW' };
            const url    = isEdit ? `${API_BASE}/itineraries/${editId}` : `${API_BASE}/itineraries`;
            const method = isEdit ? 'PUT' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({} as any));
                throw new Error(err?.error || 'Falha ao enviar o roteiro');
            }
            haptics.success();
            await AsyncStorage.removeItem(DRAFT_KEY);
            router.replace('/await-review');
        } catch (e: any) {
            haptics.error?.();
            Alert.alert('Erro', e?.message || 'Não foi possível enviar.');
        } finally {
            setSubmitting(false);
        }
    }

    // ── Abrir prévia visual do roteiro ──────────────────────────
    async function openPreview() {
        try {
            haptics.light();
            // Salva o estado atual do form numa chave dedicada (PREVIEW_KEY).
            // A tela /itinerary-preview lê dali. Isso evita passar o form
            // gigante por router params.
            await AsyncStorage.setItem('@vamo_preview_itinerary', JSON.stringify(form));
            router.push('/itinerary-preview');
        } catch (e: any) {
            Alert.alert('Erro', e?.message || 'Não foi possível abrir a prévia.');
        }
    }

    // ── Salvar rascunho (sai sem enviar) ────────────────────────
    async function saveDraft() {
        if (!accessToken) { Alert.alert('Sessão expirada', 'Faça login para salvar.'); return; }
        setSaving(true);
        try {
            const payload = { ...buildPayload(form), status: 'DRAFT' };
            const url    = isEdit ? `${API_BASE}/itineraries/${editId}` : `${API_BASE}/itineraries`;
            const method = isEdit ? 'PUT' : 'POST';
            const draftRes = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
                body: JSON.stringify(payload),
            });
            if (!draftRes.ok) {
                const errBody = await draftRes.json().catch(() => ({}));
                throw new Error(errBody?.error || `Erro ${draftRes.status} ao salvar rascunho`);
            }
            await AsyncStorage.removeItem(DRAFT_KEY);
            router.replace('/created-itineraries');
        } catch (e: any) {
            Alert.alert('Erro', e?.message || 'Não foi possível salvar o rascunho.');
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <View style={[s.root, { alignItems: 'center', justifyContent: 'center' }]}>
                <ActivityIndicator color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <View style={s.root}>
            <StatusBar barStyle="dark-content" />

            {/* Modal retomar rascunho */}
            <Modal visible={showResume} transparent animationType="fade">
                <View style={s.modalBg}>
                    <View style={s.modalCard}>
                        <Text style={s.modalTitle}>Continuar rascunho?</Text>
                        <Text style={s.modalText}>
                            Você tem um roteiro em andamento. Quer continuar de onde parou?
                        </Text>
                        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                            <TouchableOpacity
                                style={s.modalBtnGhost}
                                onPress={() => {
                                    AsyncStorage.removeItem(DRAFT_KEY);
                                    setShowResume(false);
                                    setPendingDraft(null);
                                }}>
                                <Text style={s.modalBtnGhostText}>Começar novo</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={s.modalBtnPrimary}
                                onPress={() => {
                                    if (pendingDraft) {
                                        setForm(pendingDraft.form);
                                        setStep(pendingDraft.step);
                                    }
                                    setShowResume(false);
                                    setPendingDraft(null);
                                }}>
                                <Text style={s.modalBtnPrimaryText}>Continuar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Header */}
            <View style={s.header}>
                <TouchableOpacity onPress={goBack} style={s.headerBtn}>
                    <Ionicons name={step === 1 ? 'close' : 'chevron-back'} size={24} color={theme.colors.text.primary} />
                </TouchableOpacity>
                <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={s.headerLabel}>{STEP_LABEL_MAP[stepKey]}</Text>
                    <Text style={s.headerStep}>Passo {step} de {totalSteps} · Score {score}</Text>
                </View>
                <TouchableOpacity onPress={saveDraft} style={s.headerBtn} disabled={saving}>
                    {saving
                        ? <ActivityIndicator size="small" color={theme.colors.primary} />
                        : <Ionicons name="save-outline" size={22} color={theme.colors.primary} />}
                </TouchableOpacity>
            </View>

            <ProgressBar step={step} total={totalSteps} />

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <ScrollView
                    ref={scrollRef}
                    style={s.scroll}
                    contentContainerStyle={s.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    {stepKey === 'identity'     && <StepIdentity     form={form} update={updateForm} />}
                    {stepKey === 'proof'        && <StepProof        form={form} update={updateForm} token={accessToken} />}
                    {stepKey === 'commerce'     && <StepCommerce     form={form} update={updateForm} />}
                    {stepKey === 'modules'      && <StepModules      form={form} update={updateForm} />}
                    {stepKey === 'days'         && <StepDays         form={form} update={updateForm} />}
                    {stepKey === 'voo'          && <StepFlight       form={form} update={updateForm} />}
                    {stepKey === 'hospedagem'   && <StepAccommodations form={form} update={updateForm} />}
                    {stepKey === 'passeios'     && <StepAttractions  form={form} update={updateForm} />}
                    {stepKey === 'transporte'   && <StepTransport    form={form} update={updateForm} />}
                    {stepKey === 'dicas'        && <StepTips         form={form} update={updateForm} />}
                    {stepKey === 'restaurantes' && <StepRestaurants  form={form} update={updateForm} />}
                    {stepKey === 'checklist'    && <StepChecklist    form={form} update={updateForm} />}
                    {stepKey === 'gastos_extras' && <StepExtraSpending form={form} update={updateForm} />}
                    {stepKey === 'media'        && <StepMedia        form={form} update={updateForm} token={accessToken} />}
                    {stepKey === 'review'       && <StepReview       form={form} onPreview={openPreview} />}
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Footer CTA */}
            <View style={s.footer}>
                {/* Na última etapa, se há pendências, o botão fica em estado warning */}
                <TouchableOpacity
                    style={[
                        s.ctaBtn,
                        isLastStep && hasIssues && s.ctaBtnWarning,
                        submitting && { opacity: 0.6 },
                    ]}
                    onPress={goNext}
                    disabled={submitting}
                    activeOpacity={0.85}
                >
                    {submitting
                        ? <ActivityIndicator color="#fff" />
                        : (
                            <>
                                <Ionicons
                                    name={
                                        isLastStep
                                            ? (hasIssues ? 'alert-circle' : 'checkmark-circle')
                                            : 'arrow-forward'
                                    }
                                    size={18}
                                    color="#fff"
                                    style={{ marginRight: 8 }}
                                />
                                <Text style={s.ctaText}>
                                    {isLastStep
                                        ? (hasIssues
                                            ? `Corrigir ${submissionIssues.length} pendência${submissionIssues.length > 1 ? 's' : ''}`
                                            : 'Enviar para análise')
                                        : 'Próximo'}
                                </Text>
                            </>
                        )
                    }
                </TouchableOpacity>

                {/* Texto auxiliar abaixo do botão quando há pendências */}
                {isLastStep && hasIssues && (
                    <View style={s.ctaHelperRow}>
                        <Ionicons name="warning-outline" size={14} color={theme.colors.warning || '#F59E0B'} />
                        <Text style={s.ctaHelperText}>
                            {submissionIssues.length === 1
                                ? 'Há 1 campo obrigatório pendente. Revise os módulos marcados acima.'
                                : `Há ${submissionIssues.length} campos obrigatórios pendentes. Revise os módulos marcados acima.`}
                        </Text>
                    </View>
                )}
            </View>
        </View>
    );
}

// ═══════════════════════════════════════════════════════════════════
// DATE / TIME PICKER FIELDS — nativos, compactos
// ═══════════════════════════════════════════════════════════════════

/**
 * Parse ISO date "AAAA-MM-DD" → Date. Retorna null se inválido.
 */
function parseISODate(iso: string): Date | null {
    if (!iso) return null;
    const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return null;
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return isNaN(d.getTime()) ? null : d;
}

function toISODate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function formatDateBR(iso: string): string {
    const d = parseISODate(iso);
    if (!d) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}/${m}/${d.getFullYear()}`;
}

function parseHHMM(hhmm: string): { h: number; m: number } | null {
    if (!hhmm) return null;
    const match = hhmm.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return null;
    const h = Number(match[1]);
    const m = Number(match[2]);
    if (h < 0 || h > 23 || m < 0 || m > 59) return null;
    return { h, m };
}

function DatePickerField({
    label, value, onChange, required, placeholder = 'Selecionar data',
}: {
    label: string;
    value: string; // AAAA-MM-DD
    onChange: (iso: string) => void;
    required?: boolean;
    placeholder?: string;
}) {
    const [open, setOpen] = useState(false);
    // Estado temporário do picker iOS — só commita no "Confirmar".
    const [tempDate, setTempDate] = useState<Date>(() => parseISODate(value) || new Date());
    const display = value ? formatDateBR(value) : '';

    function openPicker() {
        setTempDate(parseISODate(value) || new Date());
        setOpen(true);
    }

    function onPickerChange(event: DateTimePickerEvent, selected?: Date) {
        if (Platform.OS === 'android') {
            // Android: o dialog nativo fecha sozinho. Salvamos só quando o
            // user confirmou (event.type === 'set'); 'dismissed' descarta.
            setOpen(false);
            if (event.type === 'set' && selected) {
                onChange(toISODate(selected));
            }
        } else {
            // iOS: o spinner dispara onChange continuamente — só atualiza
            // o estado temporário; commit no botão "Confirmar".
            if (selected) setTempDate(selected);
        }
    }

    return (
        <View style={s.pickerFieldWrap}>
            <Text style={s.label}>
                {label}{required ? ' *' : ''}
            </Text>
            {/* Botão principal + botão limpar lado a lado (sem aninhar TouchableOpacity) */}
            <View style={{ flexDirection: 'row', alignItems: 'stretch', gap: 6 }}>
                <TouchableOpacity
                    style={[s.pickerFieldTouchable, { flex: 1 }]}
                    onPress={openPicker}
                    activeOpacity={0.75}
                >
                    <Ionicons name="calendar-outline" size={16} color={theme.colors.primary} />
                    <Text style={[s.pickerFieldText, !value && s.pickerFieldPlaceholder]}>
                        {display || placeholder}
                    </Text>
                </TouchableOpacity>
                {!!value && (
                    <TouchableOpacity
                        style={s.pickerClearBtn}
                        onPress={() => onChange('')}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="close" size={16} color={theme.colors.text.tertiary} />
                    </TouchableOpacity>
                )}
            </View>

            {/* iOS — modal bottom sheet com spinner + Confirmar/Cancelar */}
            {open && Platform.OS === 'ios' && (
                <Modal transparent animationType="fade" visible={open} onRequestClose={() => setOpen(false)}>
                    <TouchableOpacity
                        style={s.pickerModalBg}
                        activeOpacity={1}
                        onPress={() => setOpen(false)}
                    >
                        <TouchableOpacity activeOpacity={1} style={s.pickerModalCard}>
                            <Text style={s.pickerModalTitle}>{label}</Text>
                            <DateTimePicker
                                value={tempDate}
                                mode="date"
                                display="spinner"
                                onChange={onPickerChange}
                                themeVariant="light"
                                locale="pt-BR"
                            />
                            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                                <TouchableOpacity style={s.modalBtnGhost} onPress={() => setOpen(false)}>
                                    <Text style={s.modalBtnGhostText}>Cancelar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={s.modalBtnPrimary}
                                    onPress={() => {
                                        onChange(toISODate(tempDate));
                                        setOpen(false);
                                    }}
                                >
                                    <Text style={s.modalBtnPrimaryText}>Confirmar</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </Modal>
            )}

            {/* Android — dialog nativo padrão (renderizado fora do layout) */}
            {open && Platform.OS === 'android' && (
                <DateTimePicker
                    value={tempDate}
                    mode="date"
                    display="default"
                    onChange={onPickerChange}
                />
            )}

            {/* Web — modal com input nativo type="date" (DateTimePicker não funciona em web) */}
            {open && Platform.OS === 'web' && (
                <Modal transparent animationType="fade" visible={open} onRequestClose={() => setOpen(false)}>
                    <TouchableOpacity
                        style={s.pickerModalBg}
                        activeOpacity={1}
                        onPress={() => setOpen(false)}
                    >
                        <TouchableOpacity activeOpacity={1} style={s.pickerModalCard}>
                            <Text style={s.pickerModalTitle}>{label}</Text>
                            {/* @ts-ignore — input HTML nativo no Expo Web */}
                            <input
                                type="date"
                                value={value || toISODate(tempDate)}
                                onChange={(e: any) => {
                                    const iso = e?.target?.value || '';
                                    if (iso) {
                                        const d = parseISODate(iso);
                                        if (d) setTempDate(d);
                                    }
                                }}
                                style={{
                                    fontSize: 16,
                                    padding: 12,
                                    borderRadius: 10,
                                    border: `1.5px solid ${theme.colors.borderLight}`,
                                    width: '100%',
                                    marginBottom: 12,
                                }}
                            />
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                <TouchableOpacity style={s.modalBtnGhost} onPress={() => setOpen(false)}>
                                    <Text style={s.modalBtnGhostText}>Cancelar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={s.modalBtnPrimary}
                                    onPress={() => {
                                        onChange(toISODate(tempDate));
                                        setOpen(false);
                                    }}
                                >
                                    <Text style={s.modalBtnPrimaryText}>Confirmar</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </Modal>
            )}
        </View>
    );
}

function TimePickerField({
    label, value, onChange, required, placeholder = 'Selecionar horário',
}: {
    label: string;
    value: string; // HH:MM
    onChange: (hhmm: string) => void;
    required?: boolean;
    placeholder?: string;
}) {
    const [open, setOpen] = useState(false);
    const [tempTime, setTempTime] = useState<Date>(() => {
        const d = new Date();
        const parsed = parseHHMM(value);
        if (parsed) { d.setHours(parsed.h, parsed.m, 0, 0); }
        else { d.setHours(9, 0, 0, 0); }
        return d;
    });

    function openPicker() {
        const d = new Date();
        const parsed = parseHHMM(value);
        if (parsed) { d.setHours(parsed.h, parsed.m, 0, 0); }
        else { d.setHours(9, 0, 0, 0); }
        setTempTime(d);
        setOpen(true);
    }

    function onPickerChange(event: DateTimePickerEvent, selected?: Date) {
        if (Platform.OS === 'android') {
            setOpen(false);
            if (event.type === 'set' && selected) {
                const hh = String(selected.getHours()).padStart(2, '0');
                const mm = String(selected.getMinutes()).padStart(2, '0');
                onChange(`${hh}:${mm}`);
            }
        } else {
            if (selected) setTempTime(selected);
        }
    }

    function commitTime() {
        const hh = String(tempTime.getHours()).padStart(2, '0');
        const mm = String(tempTime.getMinutes()).padStart(2, '0');
        onChange(`${hh}:${mm}`);
        setOpen(false);
    }

    return (
        <View style={s.pickerFieldWrap}>
            <Text style={s.label}>{label}{required ? ' *' : ''}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <TouchableOpacity
                    style={[s.pickerFieldTouchable, { minWidth: 120, alignSelf: 'flex-start', flex: 1 }]}
                    onPress={openPicker}
                    activeOpacity={0.75}
                >
                    <Clock size={16} color={theme.colors.primary} />
                    <Text style={[s.pickerFieldText, !value && s.pickerFieldPlaceholder]}>
                        {value || placeholder}
                    </Text>
                </TouchableOpacity>
                {!!value && (
                    <TouchableOpacity onPress={() => onChange('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <X size={16} color={theme.colors.text.tertiary} />
                    </TouchableOpacity>
                )}
            </View>

            {/* iOS — spinner em modal com botão Confirmar */}
            {open && Platform.OS === 'ios' && (
                <Modal transparent animationType="fade" visible={open} onRequestClose={() => setOpen(false)}>
                    <TouchableOpacity
                        style={s.pickerModalBg}
                        activeOpacity={1}
                        onPress={() => setOpen(false)}
                    >
                        <TouchableOpacity activeOpacity={1} style={s.pickerModalCard}>
                            <Text style={s.pickerModalTitle}>{label}</Text>
                            <DateTimePicker
                                value={tempTime}
                                mode="time"
                                display="spinner"
                                onChange={onPickerChange}
                                themeVariant="light"
                                is24Hour
                            />
                            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                                <TouchableOpacity style={s.modalBtnGhost} onPress={() => setOpen(false)}>
                                    <Text style={s.modalBtnGhostText}>Cancelar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={s.modalBtnPrimary} onPress={commitTime}>
                                    <Text style={s.modalBtnPrimaryText}>Confirmar</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </Modal>
            )}

            {/* Android — dialog nativo padrão */}
            {open && Platform.OS === 'android' && (
                <DateTimePicker
                    value={tempTime}
                    mode="time"
                    display="default"
                    onChange={onPickerChange}
                    is24Hour
                />
            )}

            {/* Web — modal com input nativo type="time" */}
            {open && Platform.OS === 'web' && (
                <Modal transparent animationType="fade" visible={open} onRequestClose={() => setOpen(false)}>
                    <TouchableOpacity
                        style={s.pickerModalBg}
                        activeOpacity={1}
                        onPress={() => setOpen(false)}
                    >
                        <TouchableOpacity activeOpacity={1} style={s.pickerModalCard}>
                            <Text style={s.pickerModalTitle}>{label}</Text>
                            {/* @ts-ignore — input HTML nativo no Expo Web */}
                            <input
                                type="time"
                                value={value || `${String(tempTime.getHours()).padStart(2,'0')}:${String(tempTime.getMinutes()).padStart(2,'0')}`}
                                onChange={(e: any) => {
                                    const hhmm = e?.target?.value || '';
                                    if (hhmm) {
                                        const parsed = parseHHMM(hhmm);
                                        if (parsed) {
                                            const d = new Date();
                                            d.setHours(parsed.h, parsed.m, 0, 0);
                                            setTempTime(d);
                                        }
                                    }
                                }}
                                style={{
                                    fontSize: 16,
                                    padding: 12,
                                    borderRadius: 10,
                                    border: `1.5px solid ${theme.colors.borderLight}`,
                                    width: '100%',
                                    marginBottom: 12,
                                }}
                            />
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                <TouchableOpacity style={s.modalBtnGhost} onPress={() => setOpen(false)}>
                                    <Text style={s.modalBtnGhostText}>Cancelar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={s.modalBtnPrimary} onPress={commitTime}>
                                    <Text style={s.modalBtnPrimaryText}>Confirmar</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </Modal>
            )}
        </View>
    );
}

// ═══════════════════════════════════════════════════════════════════
// QUANTITY STEPPER — compacto para duração/quantidade (não monetário)
// ═══════════════════════════════════════════════════════════════════

function QuantityStepper({
    value, onChange, min = 0, max, step = 1,
    unit, onUnitChange, units, width = 64,
}: {
    value: number;
    onChange: (v: number) => void;
    min?: number;
    max?: number;
    step?: number;
    unit?: string;
    onUnitChange?: (u: string) => void;
    units?: string[];
    width?: number;
}) {
    const clamp = (n: number) => {
        if (Number.isNaN(n)) return min;
        if (n < min) return min;
        if (max != null && n > max) return max;
        return n;
    };
    const dec = () => onChange(clamp(value - step));
    const inc = () => onChange(clamp(value + step));
    const atMin = value <= min;
    const atMax = max != null && value >= max;
    return (
        <View style={s.qsRow}>
            <TouchableOpacity
                style={[s.qsBtn, atMin && s.qsBtnDisabled]}
                onPress={dec}
                disabled={atMin}
                activeOpacity={0.7}
            >
                <Ionicons
                    name="remove"
                    size={18}
                    color={atMin ? theme.colors.text.disabled : theme.colors.primary}
                />
            </TouchableOpacity>
            <TextInput
                style={[s.qsInput, { width }]}
                keyboardType="number-pad"
                value={String(value)}
                selectTextOnFocus
                onChangeText={v => {
                    const n = parseInt(v.replace(/\D/g, ''), 10);
                    onChange(clamp(Number.isNaN(n) ? min : n));
                }}
            />
            <TouchableOpacity
                style={[s.qsBtn, atMax && s.qsBtnDisabled]}
                onPress={inc}
                disabled={atMax}
                activeOpacity={0.7}
            >
                <Ionicons
                    name="add"
                    size={18}
                    color={atMax ? theme.colors.text.disabled : theme.colors.primary}
                />
            </TouchableOpacity>
            {unit && onUnitChange && units && units.length > 0 && (
                <TouchableOpacity
                    style={s.qsUnit}
                    onPress={() => {
                        const idx = units.indexOf(unit);
                        const next = units[(idx + 1) % units.length];
                        onUnitChange(next);
                    }}
                    activeOpacity={0.7}
                >
                    <Text style={s.qsUnitText}>{unit}</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

// ═══════════════════════════════════════════════════════════════════
// STEP 1 — IDENTIDADE
// ═══════════════════════════════════════════════════════════════════

type LucideIcon = React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

const STYLE_ICON_MAP: Record<string, LucideIcon> = {
    economico: Wallet,
    moderado:  BarChart3,
    luxo:      Crown,
};

const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
    cultura:     Landmark,
    gastronomia: ChefHat,
    natureza:    Leaf,
    esportes:    Dumbbell,
    cruzeiros:   Ship,
    eurotrip:    Globe,
    relax:       Sparkles,
    praia:       Sun,
    historico:   BookOpen,
    festivais:   Music,
    mochilao:    Backpack,
    familia:     Users,
    romantico:   Heart,
    aventura:    Mountain,
};

const MODULE_ICON_MAP: Record<string, LucideIcon> = {
    itinerario:    CalendarDays,
    voo:           Plane,
    hospedagem:    Building2,
    passeios:      Ticket,
    transporte:    Bus,
    dicas:         Lightbulb,
    restaurantes:  Utensils,
    checklist:     ListChecks,
    gastos_extras: Wallet,
};

function StepIdentity({ form, update }: StepProps) {
    const toggleArray = (arr: string[], val: string, max?: number): string[] => {
        if (arr.includes(val)) return arr.filter(x => x !== val);
        if (max && arr.length >= max) return arr;
        return [...arr, val];
    };

    function updateLocationCountry(locIdx: number, value: string) {
        const locs = [...form.locations];
        locs[locIdx] = { ...locs[locIdx], country: value };
        update('locations', locs);
        if (locIdx === 0) update('country', value);
    }

    function updateLocationCity(locIdx: number, cityIdx: number, value: string) {
        const locs = [...form.locations];
        const cities = [...locs[locIdx].cities];
        cities[cityIdx] = value;
        locs[locIdx] = { ...locs[locIdx], cities };
        update('locations', locs);
        if (locIdx === 0 && cityIdx === 0) update('destination', value);
    }

    function addCity(locIdx: number) {
        const locs = [...form.locations];
        locs[locIdx] = { ...locs[locIdx], cities: [...locs[locIdx].cities, ''] };
        update('locations', locs);
    }

    function removeCity(locIdx: number, cityIdx: number) {
        const locs = [...form.locations];
        const cities = locs[locIdx].cities.filter((_, i) => i !== cityIdx);
        locs[locIdx] = { ...locs[locIdx], cities };
        update('locations', locs);
    }

    function addCountry() {
        update('locations', [...form.locations, { country: '', cities: [''] }]);
    }

    function removeCountry(locIdx: number) {
        update('locations', form.locations.filter((_, i) => i !== locIdx));
    }

    return (
        <View>
            <SectionHeader
                title="Identidade & Indexação"
                subtitle="Título, destino e categorias — o que o viajante vê primeiro na vitrine."
            />
            <FormInput
                label="Título do Roteiro"
                required
                placeholder='Ex: "Japão Autêntico: 15 dias de gastronomia, templos e cultura viva"'
                value={form.title}
                onChangeText={v => update('title', v)}
                maxLength={120}
            />

            {/* Países e cidades estruturados */}
            {form.locations.map((loc, locIdx) => (
                <View key={locIdx} style={s.locCard}>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 10 }}>
                        <View style={{ flex: 1 }}>
                            <FormInput
                                label={locIdx === 0 ? 'País *' : `País ${locIdx + 1}`}
                                placeholder={locIdx === 0 ? 'Digite ou selecione o país...' : 'Digite o país...'}
                                value={loc.country}
                                onChangeText={v => updateLocationCountry(locIdx, v)}
                            />
                        </View>
                        {form.locations.length > 1 && (
                            <TouchableOpacity onPress={() => removeCountry(locIdx)} style={s.locRemoveBtn}>
                                <Ionicons name="close" size={18} color={theme.colors.error} />
                            </TouchableOpacity>
                        )}
                    </View>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                        {loc.cities.map((city, cityIdx) => (
                            <View key={cityIdx} style={s.cityTag}>
                                <TextInput
                                    style={s.cityInput}
                                    value={city}
                                    onChangeText={v => updateLocationCity(locIdx, cityIdx, v)}
                                    placeholder={locIdx === 0 && cityIdx === 0 ? 'Cidade *' : 'Cidade...'}
                                    placeholderTextColor={theme.colors.text.disabled}
                                />
                                {!(locIdx === 0 && loc.cities.length === 1) && (
                                    <TouchableOpacity onPress={() => removeCity(locIdx, cityIdx)}>
                                        <Ionicons name="close" size={13} color={theme.colors.text.tertiary} />
                                    </TouchableOpacity>
                                )}
                            </View>
                        ))}
                        <TouchableOpacity style={s.addCityBtn} onPress={() => addCity(locIdx)}>
                            <Ionicons name="add" size={14} color={theme.colors.primary} />
                            <Text style={s.addCityText}>Cidade</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ))}

            <TouchableOpacity style={s.addCountryBtn} onPress={addCountry}>
                <Text style={s.addCountryText}>+ Adicionar País</Text>
            </TouchableOpacity>

            <Text style={s.label}>Duração (dias) *</Text>
            <QuantityStepper
                value={form.duration || 1}
                onChange={v => update('duration', Math.max(1, v))}
                min={1}
                max={365}
            />

            <View style={s.formGroup}>
                <Text style={s.label}>Sobre o Roteiro</Text>
                <TextInput
                    style={s.textArea}
                    placeholder="Venda seu roteiro: que experiência única você viveu? Que dor você resolve para o viajante? Por que esse roteiro é diferente de tudo que ele encontra no Google?"
                    placeholderTextColor={theme.colors.text.disabled}
                    value={form.description}
                    onChangeText={v => update('description', v)}
                    multiline
                    numberOfLines={5}
                    textAlignVertical="top"
                />
                <Text style={s.charCounter}>{form.description.length} caracteres</Text>
            </View>

            <Text style={s.label}>Estilo de Experiência — {form.travelStyles.length}/1</Text>
            <View style={s.chipRow}>
                {STYLE_OPTIONS.map(st => {
                    const active = form.travelStyles.includes(st.key);
                    const IconComp = STYLE_ICON_MAP[st.key];
                    return (
                        <TouchableOpacity
                            key={st.key}
                            style={[s.chip, active && s.chipActive]}
                            onPress={() => {
                                if (active) update('travelStyles', []);
                                else update('travelStyles', [st.key]);
                            }}
                        >
                            {IconComp && (
                                <IconComp
                                    size={13}
                                    strokeWidth={2}
                                    color={active ? theme.colors.primary : theme.colors.text.secondary}
                                />
                            )}
                            <Text style={[s.chipText, active && s.chipTextActive]}>{st.label}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            <Text style={s.label}>Categorias Temáticas (mín 1, máx {MAX_CATEGORIES}) — {form.categories.length}/{MAX_CATEGORIES}</Text>
            <View style={s.chipRow}>
                {CATEGORY_OPTIONS.map(c => {
                    const active = form.categories.includes(c.key);
                    const IconComp = CATEGORY_ICON_MAP[c.key];
                    return (
                        <TouchableOpacity
                            key={c.key}
                            style={[s.chip, active && s.chipActive]}
                            onPress={() => update('categories', toggleArray(form.categories, c.key, MAX_CATEGORIES))}
                        >
                            {IconComp && (
                                <IconComp
                                    size={13}
                                    strokeWidth={2}
                                    color={active ? theme.colors.primary : theme.colors.text.secondary}
                                />
                            )}
                            <Text style={[s.chipText, active && s.chipTextActive]}>{c.label}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Destaques da Viagem — inspirado na seção do site */}
            <View style={s.highlightsHeader}>
                <View style={s.highlightsIconBox}>
                    <Star size={20} strokeWidth={2} color={theme.colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                        <Text style={s.highlightsTitle}>Destaques da Viagem</Text>
                        <View style={s.moduleStepBadgeOpt}>
                            <Text style={s.moduleStepBadgeOptText}>Opcional</Text>
                        </View>
                    </View>
                    <Text style={s.highlightsSubtitle}>
                        Os momentos únicos que diferenciam seu roteiro dos demais
                    </Text>
                </View>
            </View>

            {form.highlights.length === 0 && (
                <View style={s.highlightsEmptyCard}>
                    <Star size={36} strokeWidth={1.6} color={theme.colors.primary + 'AA'} />
                    <Text style={s.highlightsEmptyTitle}>Quais foram os momentos inesquecíveis?</Text>
                    <Text style={s.highlightsEmptyText}>
                        Liste as experiências únicas que só seu roteiro oferece — é o que chama atenção na vitrine.
                    </Text>
                </View>
            )}

            <EditableList
                items={form.highlights}
                onItemsChange={items => update('highlights', items)}
                placeholder="Ex: Jantar em restaurante com vista para o Monte Fuji ao entardecer..."
            />
        </View>
    );
}

// ═══════════════════════════════════════════════════════════════════
// STEP 2 — COMPROVANTE
// ═══════════════════════════════════════════════════════════════════

function StepProof({ form, update, token }: StepProps & { token: string | null | undefined }) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [meta, setMeta] = useState<{ name: string; size?: number } | null>(null);

    async function pickProof() {
        setError(null);
        try {
            if (Platform.OS !== 'web') {
                const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (!perm.granted) {
                    setError('Precisamos de acesso à sua galeria para anexar o comprovante.');
                    return;
                }
            }
            const res = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.85,
                allowsEditing: false,
            });
            if (res.canceled || !res.assets?.[0]) return;
            const asset = res.assets[0];
            const name = (asset as any).fileName || asset.uri.split('/').pop()?.split('?')[0] || `comprovante-${Date.now()}.jpg`;
            const size = (asset as any).fileSize as number | undefined;
            const mime = (asset as any).mimeType as string | undefined;

            // Validação de tamanho (limite 25MB do backend)
            if (size && size > 25 * 1024 * 1024) {
                setError(`Arquivo muito grande (${(size / (1024 * 1024)).toFixed(1)} MB). Máximo: 25 MB.`);
                return;
            }
            console.log('[proof] arquivo selecionado', { name, size, mime, uri: asset.uri.slice(0, 80) });
            setMeta({ name, size });
            setUploading(true);
            const url = await uploadOne(asset.uri, token, name, mime);
            update('travelProofUrl', url);
        } catch (e: any) {
            const msg = e?.message || 'Não foi possível enviar o comprovante. Tente novamente.';
            console.warn('[proof] erro:', msg);
            setError(msg);
            setMeta(null);
        } finally {
            setUploading(false);
        }
    }

    function removeProof() {
        update('travelProofUrl', '');
        setMeta(null);
        setError(null);
    }

    const hasProof = !!form.travelProofUrl;
    // Detecta se é PDF a partir da URL salva
    const isPdf = hasProof && /\.pdf(\?|$)/i.test(form.travelProofUrl);

    return (
        <View>
            <SectionHeader
                title="Comprovante de viagem"
                subtitle="Anexe um documento que comprove que você esteve no destino. Obrigatório para envio à análise."
            />

            {/* Aviso explicativo — inspirado no bloco da versão web */}
            <View style={s.proofInfoCard}>
                <View style={s.proofInfoIconWrap}>
                    <Ionicons name="warning-outline" size={20} color="#ea580c" />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={s.proofInfoTitle}>Comprovação de Viagem</Text>
                    <Text style={s.proofInfoText}>
                        Para garantir a autenticidade dos roteiros na plataforma VAMO, solicitamos o envio de pelo menos um comprovante que mostre que você esteve no destino (ex.: bilhete aéreo em seu nome, recibo de hotel, fatura ou passaporte carimbado).{' '}
                        <Text style={{ fontWeight: '700' }}>Este documento é mantido em sigilo pela moderação</Text>
                        {' '}e <Text style={{ fontWeight: '700' }}>não</Text> aparecerá publicamente.
                    </Text>
                </View>
            </View>

            {/* Label com badge de obrigatoriedade */}
            <View style={s.proofLabelRow}>
                <Text style={s.proofLabelText}>Arquivo de Comprovação</Text>
                <View style={s.proofObrigBadge}>
                    <Text style={s.proofObrigText}>OBRIGATÓRIO</Text>
                </View>
            </View>

            {hasProof ? (
                <View style={s.proofCard}>
                    {isPdf ? (
                        <View style={[s.proofImg, { alignItems: 'center', justifyContent: 'center', backgroundColor: '#fef3c7' }]}>
                            <Ionicons name="document-text" size={28} color="#92400e" />
                        </View>
                    ) : (
                        <Image source={{ uri: form.travelProofUrl }} style={s.proofImg} resizeMode="cover" />
                    )}
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={s.proofText} numberOfLines={1}>
                            <Ionicons name="checkmark-circle" size={14} color={theme.colors.success} />
                            {' '}Comprovante enviado
                        </Text>
                        {meta?.name && (
                            <Text style={{ fontSize: 11, color: theme.colors.text.tertiary }} numberOfLines={1}>
                                {meta.name}{meta.size ? ` · ${(meta.size / 1024).toFixed(0)} KB` : ''}
                            </Text>
                        )}
                    </View>
                    <TouchableOpacity onPress={pickProof} disabled={uploading} style={{ marginRight: 12 }}>
                        <Text style={{ color: theme.colors.primary, fontWeight: '600', fontSize: 13 }}>Substituir</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={removeProof} disabled={uploading}>
                        <Text style={{ color: theme.colors.error, fontWeight: '600', fontSize: 13 }}>Remover</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <TouchableOpacity style={s.uploadBox} onPress={pickProof} disabled={uploading} activeOpacity={0.7}>
                    {uploading ? (
                        <>
                            <ActivityIndicator color={theme.colors.primary} />
                            <Text style={s.uploadText}>Enviando…</Text>
                            {meta?.name && (
                                <Text style={s.uploadHint} numberOfLines={1}>{meta.name}</Text>
                            )}
                        </>
                    ) : (
                        <>
                            <Ionicons name="cloud-upload-outline" size={36} color={theme.colors.primary} />
                            <Text style={s.uploadText}>Selecionar Arquivo</Text>
                            <Text style={s.uploadHint}>JPG, PNG, WEBP · até 25 MB</Text>
                        </>
                    )}
                </TouchableOpacity>
            )}

            {error && (
                <View style={s.proofError}>
                    <Ionicons name="alert-circle" size={16} color={theme.colors.error} />
                    <Text style={s.proofErrorText}>{error}</Text>
                </View>
            )}
        </View>
    );
}

// ═══════════════════════════════════════════════════════════════════
// STEP 3 — COMERCIAL
// ═══════════════════════════════════════════════════════════════════

function StepCommerce({ form, update }: StepProps) {
    return (
        <View>
            <SectionHeader title="Estrutura Comercial" subtitle="Defina o preço do seu roteiro." />

            <FormInput
                label="Preço"
                required
                keyboardType="decimal-pad"
                placeholder="Ex: 89,90"
                value={form.price ? String(form.price) : ''}
                onChangeText={v => update('price', parseFloat(v.replace(',', '.')) || 0)}
            />

            {/* Aviso automático — produto digital */}
            <View style={s.commerceWarningCard}>
                <Ionicons name="warning-outline" size={16} color="#ea580c" style={{ marginTop: 1 }} />
                <Text style={s.commerceWarningText}>
                    Aviso automático: <Text style={{ fontStyle: 'italic' }}>"Produto digital. Não inclui serviços turísticos."</Text>
                </Text>
            </View>

            {/* Acesso offline — característica automática do produto */}
            <View style={s.commerceOfflineCard}>
                <Ionicons name="wifi-outline" size={16} color={theme.colors.primary} style={{ marginTop: 1 }} />
                <Text style={s.commerceOfflineText}>
                    <Text style={{ fontWeight: '700', color: theme.colors.primary }}>Acesso Offline: </Text>
                    Após a compra, o viajante poderá consultar o roteiro completo mesmo sem conexão com a internet.
                </Text>
            </View>
        </View>
    );
}

// ═══════════════════════════════════════════════════════════════════
// STEP 4 — MÓDULOS
// ═══════════════════════════════════════════════════════════════════

function StepModules({ form, update }: StepProps) {
    function toggle(key: ModuleKey) {
        const arr = form.activeModules.includes(key)
            ? form.activeModules.filter(k => k !== key)
            : [...form.activeModules, key];
        update('activeModules', arr);
    }
    return (
        <View>
            <View style={s.modulesHeader}>
                <View style={{ flex: 1 }}>
                    <Text style={s.stepTitle}>Módulos do Roteiro</Text>
                    <Text style={s.stepHint}>O que está incluído — o comprador decide com base nos módulos ativos</Text>
                </View>
                <View style={s.modulesObrigBadge}>
                    <Text style={s.modulesObrigText}>Obrigatório</Text>
                </View>
            </View>

            <Text style={s.modulesIntro}>
                Ative os módulos que serão incluídos no roteiro. Módulos ativos precisam ter ao menos 1 item preenchido.
            </Text>

            {MODULE_OPTIONS.map(m => {
                const active = form.activeModules.includes(m.key);
                const IconComp = MODULE_ICON_MAP[m.key];
                return (
                    <TouchableOpacity
                        key={m.key}
                        style={[s.moduleCard, active && s.moduleCardActive]}
                        onPress={() => toggle(m.key)}
                        activeOpacity={0.85}
                    >
                        <View style={[s.moduleIconBox, active && s.moduleIconBoxActive]}>
                            {IconComp && (
                                <IconComp
                                    size={22}
                                    strokeWidth={2}
                                    color={theme.colors.primary}
                                />
                            )}
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={s.moduleTitle}>{m.label}</Text>
                            <Text style={s.moduleDesc}>{m.desc}</Text>
                        </View>
                        <Switch
                            value={active}
                            onValueChange={() => toggle(m.key)}
                            trackColor={{ false: theme.colors.borderLight, true: theme.colors.primary + '80' }}
                            thumbColor={active ? theme.colors.primary : '#fff'}
                        />
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

// ═══════════════════════════════════════════════════════════════════
// STEP 5 — ROTEIRO DIA A DIA
// ═══════════════════════════════════════════════════════════════════

function emptyActivity(): Activity {
    return { title: '', description: '', time: '', duration: '1h', location: '', mapLink: '', type: 'activity', icon: '📍', tips: '', category: '' };
}
function emptyDay(n: number): Day {
    return { dayNumber: n, title: `Dia ${n}`, summary: '', description: '', activities: [] };
}

function dayHasContent(d: Day): boolean {
    return !!(d.description?.trim() || d.title?.trim() || (d.activities && d.activities.length > 0));
}

function dayIsComplete(d: Day): boolean {
    return !!d.description?.trim()
        && Array.isArray(d.activities) && d.activities.length > 0
        && d.activities.every(a => !!a.title?.trim());
}

function parseActivityDuration(raw: string): { num: number; unit: 'min' | 'h' | 'd' } {
    const m = (raw || '').match(/^(\d+)\s*(min|h|d)?$/i);
    if (m) {
        const num = parseInt(m[1], 10) || 1;
        const unit = ((m[2] || 'h').toLowerCase()) as 'min' | 'h' | 'd';
        return { num, unit };
    }
    return { num: 1, unit: 'h' };
}

function formatActivityTime(raw: string): string {
    const digits = (raw || '').replace(/\D/g, '').slice(0, 4);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

function StepDays({ form, update }: StepProps) {
    const duration = Math.max(form.duration || 1, 1);
    const [expanded, setExpanded] = useState<Record<number, boolean>>({ 0: true });

    // ── Geração automática dos dias conforme a duração ─────────────
    // Ao entrar no step: se faltam dias, criar vazios. Se sobram, alertar.
    useEffect(() => {
        if (form.days.length === duration) return;
        if (form.days.length < duration) {
            const next = [...form.days];
            while (next.length < duration) next.push(emptyDay(next.length + 1));
            update('days', next.map((d, i) => ({ ...d, dayNumber: i + 1 })));
            return;
        }
        // form.days.length > duration → vamos remover excedentes
        const toRemove = form.days.slice(duration);
        const hasContent = toRemove.some(dayHasContent);
        if (!hasContent) {
            update('days', form.days.slice(0, duration).map((d, i) => ({ ...d, dayNumber: i + 1 })));
            return;
        }
        Alert.alert(
            'Reduzir duração do roteiro?',
            `Você reduziu a duração para ${duration} dia${duration > 1 ? 's' : ''}, mas ${toRemove.length === 1 ? 'o dia' : 'os dias'} ${toRemove.map((_, i) => duration + i + 1).join(', ')} ${toRemove.length === 1 ? 'já possui' : 'já possuem'} informações preenchidas. Deseja remover ${toRemove.length === 1 ? 'esse dia' : 'esses dias'}?`,
            [
                { text: 'Manter dias extras', style: 'cancel' },
                {
                    text: 'Remover',
                    style: 'destructive',
                    onPress: () => update('days', form.days.slice(0, duration).map((d, i) => ({ ...d, dayNumber: i + 1 }))),
                },
            ],
        );
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [duration]);

    function updateDay(i: number, patch: Partial<Day>) {
        const next = form.days.map((d, idx) => idx === i ? { ...d, ...patch } : d);
        update('days', next);
    }
    function addActivity(dayIdx: number) {
        const next = form.days.map((d, idx) => idx === dayIdx
            ? { ...d, activities: [...d.activities, emptyActivity()] } : d);
        update('days', next);
    }
    function updateActivity(dayIdx: number, actIdx: number, patch: Partial<Activity>) {
        const next = form.days.map((d, idx) => idx === dayIdx
            ? { ...d, activities: d.activities.map((a, ai) => ai === actIdx ? { ...a, ...patch } : a) } : d);
        update('days', next);
    }
    function removeActivity(dayIdx: number, actIdx: number) {
        const next = form.days.map((d, idx) => idx === dayIdx
            ? { ...d, activities: d.activities.filter((_, ai) => ai !== actIdx) } : d);
        update('days', next);
    }

    const completed = form.days.slice(0, duration).filter(dayIsComplete).length;
    const allComplete = completed === duration;

    return (
        <View>
            <ModuleStepHeader
                icon={CalendarDays}
                title="Itinerário por dia"
                subtitle="Roteiro dia a dia completo"
                hint="Monte o roteiro dia a dia conforme a duração informada. Cada dia precisa de descrição e ao menos 1 atividade."
            />

            {/* Progresso X/Y dias preenchidos */}
            <View style={[s.daysProgressCard, allComplete && s.daysProgressCardOk]}>
                <Ionicons
                    name={allComplete ? 'checkmark-circle' : 'time-outline'}
                    size={18}
                    color={allComplete ? theme.colors.success : theme.colors.primary}
                />
                <Text style={s.daysProgressText}>
                    {completed}/{duration} dias preenchidos
                    {allComplete ? ' ✓' : ''}
                </Text>
            </View>

            {form.days.slice(0, duration).map((d, i) => {
                const open = !!expanded[i];
                const complete = dayIsComplete(d);
                const titleStripped = (d.title || '').replace(new RegExp(`^Dia\\s*${i + 1}\\s*(?:-|—)?\\s*`, 'i'), '');
                return (
                    <View key={i} style={s.dayCard}>
                        <TouchableOpacity
                            style={s.dayHeaderRow}
                            onPress={() => setExpanded(p => ({ ...p, [i]: !p[i] }))}
                            activeOpacity={0.7}
                        >
                            <View style={[s.dayBadge, complete && s.dayBadgeComplete]}>
                                <Text style={[s.dayBadgeText, complete && { color: '#fff' }]}>{i + 1}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={s.dayHeaderTitle}>
                                    Dia {i + 1}{titleStripped ? ` — ${titleStripped}` : ''}
                                </Text>
                                <Text style={s.dayHeaderStatus}>
                                    {complete
                                        ? `${d.activities.length} atividade${d.activities.length === 1 ? '' : 's'} · completo`
                                        : !d.description?.trim()
                                            ? 'Falta descrição'
                                            : d.activities.length === 0
                                                ? 'Falta atividade'
                                                : 'Atividade sem título'}
                                </Text>
                            </View>
                            <Ionicons
                                name={open ? 'chevron-up' : 'chevron-down'}
                                size={20}
                                color={theme.colors.text.tertiary}
                            />
                        </TouchableOpacity>

                        {open && (
                            <View style={s.dayBody}>
                                <FormInput
                                    label="Título do dia"
                                    placeholder="Ex: Torre Eiffel e Trocadéro"
                                    value={titleStripped}
                                    onChangeText={v => updateDay(i, { title: v })}
                                />
                                <FormInput
                                    label="O que esperar nesse dia..."
                                    required
                                    placeholder="Ex: Manhã de passeios no centro e tarde livre"
                                    multiline numberOfLines={3}
                                    style={{ minHeight: 80, textAlignVertical: 'top' }}
                                    value={d.description}
                                    onChangeText={v => updateDay(i, { description: v })}
                                />

                                <Text style={s.label}>Atividades ({d.activities.length})</Text>
                                {d.activities.map((a, ai) => {
                                    const { num, unit } = parseActivityDuration(a.duration);
                                    return (
                                        <View key={ai} style={s.activityCard}>
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Text style={s.activityBadge}>Atividade {ai + 1}</Text>
                                                <TouchableOpacity onPress={() => removeActivity(i, ai)}>
                                                    <Ionicons name="trash-outline" size={18} color={theme.colors.error} />
                                                </TouchableOpacity>
                                            </View>
                                            <FormInput
                                                label="O que fazer"
                                                required
                                                placeholder="Ex: Visita ao Museu do Louvre"
                                                value={a.title}
                                                onChangeText={v => updateActivity(i, ai, { title: v })}
                                            />
                                            <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
                                                <TimePickerField
                                                    label="Horário"
                                                    value={a.time}
                                                    onChange={v => updateActivity(i, ai, { time: v })}
                                                    placeholder="09:00"
                                                />
                                                <View>
                                                    <Text style={s.label}>Duração</Text>
                                                    <QuantityStepper
                                                        value={num}
                                                        onChange={n => updateActivity(i, ai, { duration: `${Math.max(1, n)}${unit}` })}
                                                        min={1}
                                                        max={unit === 'h' ? 23 : unit === 'd' ? 30 : 300}
                                                        step={unit === 'min' ? 5 : 1}
                                                        unit={unit}
                                                        onUnitChange={u => updateActivity(i, ai, { duration: `${num}${u}` })}
                                                        units={['min', 'h', 'd']}
                                                    />
                                                </View>
                                            </View>
                                            <FormInput
                                                label="Nome do local ou endereço"
                                                placeholder="Ex: Rua Direita, 250"
                                                value={a.location}
                                                onChangeText={v => updateActivity(i, ai, { location: v })}
                                            />
                                            <FormInput
                                                label="Link da localização (Google Maps)"
                                                placeholder="Ex: https://goo.gl/maps/..."
                                                autoCapitalize="none"
                                                value={a.mapLink}
                                                onChangeText={v => updateActivity(i, ai, { mapLink: v })}
                                            />
                                            <FormInput
                                                label="Dica opcional"
                                                placeholder="Ex: Tente chegar 20 minutos antes para evitar filas"
                                                multiline numberOfLines={2}
                                                style={{ minHeight: 60, textAlignVertical: 'top' }}
                                                value={a.tips}
                                                onChangeText={v => updateActivity(i, ai, { tips: v })}
                                            />
                                        </View>
                                    );
                                })}
                                <TouchableOpacity style={s.addInline} onPress={() => addActivity(i)}>
                                    <Ionicons name="add-circle-outline" size={18} color={theme.colors.primary} />
                                    <Text style={s.addInlineText}>Adicionar atividade</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                );
            })}
        </View>
    );
}

// ═══════════════════════════════════════════════════════════════════
// MODULE STEP HEADER — usado por todas as etapas dinâmicas de módulos
// ═══════════════════════════════════════════════════════════════════

function ModuleStepHeader({
    icon: IconComp,
    title,
    subtitle,
    required = true,
    hint,
}: {
    icon: LucideIcon;
    title: string;
    subtitle?: string;
    required?: boolean;
    hint?: string;
}) {
    return (
        <>
            <View style={s.moduleStepHeader}>
                <View style={s.moduleStepIconBox}>
                    <IconComp size={22} strokeWidth={2} color={theme.colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                        <Text style={s.moduleStepTitle}>{title}</Text>
                        <View style={required ? s.moduleStepBadgeReq : s.moduleStepBadgeOpt}>
                            <Text style={required ? s.moduleStepBadgeReqText : s.moduleStepBadgeOptText}>
                                {required ? 'Obrigatório' : 'Opcional'}
                            </Text>
                        </View>
                    </View>
                    {subtitle && <Text style={s.moduleStepSubtitle}>{subtitle}</Text>}
                </View>
            </View>
            {hint && (
                <View style={s.moduleStepHintCard}>
                    <Ionicons name="information-circle-outline" size={16} color={theme.colors.primary} />
                    <Text style={s.moduleStepHintText}>{hint}</Text>
                </View>
            )}
        </>
    );
}

// ═══════════════════════════════════════════════════════════════════
// FACTORIES — items vazios reutilizados pelos steps de módulos
// ═══════════════════════════════════════════════════════════════════

function emptyAccommodation(): Accommodation { return { name: '', address: '', mapLink: '', description: '', nights: '', rating: '', externalLink: '', tips: '', startDate: '', endDate: '' }; }
function emptyAttraction(): AttractionItem { return { name: '', type: '', location: '', mapLink: '', description: '', hours: '', duration: '', externalLink: '', tips: '', startDate: '', endDate: '', price: '' }; }
function emptyTransport(): Transport { return { description: '', passTypes: '', notes: '', startDate: '', endDate: '' }; }
function emptyRestaurant(): RestaurantItem { return { name: '', cuisine: '', location: '', description: '', hours: '', hoursStart: '', externalLink: '', tips: '', startDate: '', endDate: '' }; }

// ═══════════════════════════════════════════════════════════════════
// STEP MODULES — Hospedagens
// ═══════════════════════════════════════════════════════════════════

function StepAccommodations({ form, update }: StepProps) {
    return (
        <View>
            <ModuleStepHeader
                icon={Building2}
                title="Hospedagens"
                subtitle="Hotéis e hospedagens recomendadas — item mais consultado antes da compra"
                hint="Adicione ao menos 1 hospedagem com nome para que esse módulo fique completo."
            />
            <Repeater
                title="Hospedagens adicionadas"
                items={form.accommodations}
                onChange={v => update('accommodations', v)}
                factory={emptyAccommodation}
                render={(item, set) => (
                    <>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            <View style={{ flex: 2 }}>
                                <FormInput label="Nome do hotel / hostel" required placeholder="Ex: Waldorf Astoria" value={item.name} onChangeText={v => set({ name: v })} />
                            </View>
                            <View style={{ width: 90 }}>
                                <FormInput label="Nota" keyboardType="decimal-pad" placeholder="Ex: 8.5" value={item.rating} onChangeText={v => set({ rating: v })} />
                            </View>
                        </View>
                        <FormInput label="Nome do local ou endereço" placeholder="Ex: Rue de Rivoli, 228" value={item.address} onChangeText={v => set({ address: v })} />
                        <FormInput label="Link da localização (Google Maps)" placeholder="Ex: https://goo.gl/maps/..." autoCapitalize="none" value={item.mapLink} onChangeText={v => set({ mapLink: v })} />
                        <Text style={s.label}>Noites *</Text>
                        <QuantityStepper
                            value={Math.max(1, parseInt(item.nights, 10) || 1)}
                            onChange={n => set({ nights: String(Math.max(1, n)) })}
                            min={1}
                            max={365}
                        />
                        <FormInput
                            label="O que torna essa hospedagem especial?"
                            placeholder="Ex: A localização é excelente ao lado do metrô principal e o café da manhã..."
                            multiline value={item.description}
                            onChangeText={v => set({ description: v })}
                            style={{ minHeight: 60, textAlignVertical: 'top' }}
                        />
                        <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
                            <DatePickerField label="Check-in"  value={item.startDate} onChange={v => set({ startDate: v })} />
                            <DatePickerField label="Check-out" value={item.endDate}   onChange={v => set({ endDate: v })} />
                        </View>
                        <FormInput label="Link externo (Booking, Hostelworld...)" placeholder="Ex: https://booking.com/hotel/..." autoCapitalize="none" value={item.externalLink} onChangeText={v => set({ externalLink: v })} />
                        <FormInput
                            label="Dica extra"
                            placeholder="Ex: Peça o quarto no último andar para ter vista..."
                            multiline value={item.tips}
                            onChangeText={v => set({ tips: v })}
                            style={{ minHeight: 50, textAlignVertical: 'top' }}
                        />
                        <SpendingFieldset
                            spending={item.spending}
                            onChange={sp => set({ spending: sp })}
                            defaultCurrency={form.currency || 'BRL'}
                            helperShort="Valor por pessoa da estadia — opcional. Ajuda o viajante a se planejar."
                        />
                    </>
                )}
            />
        </View>
    );
}

// ═══════════════════════════════════════════════════════════════════
// STEP MODULES — Passeios & Atrações
// ═══════════════════════════════════════════════════════════════════

function StepAttractions({ form, update }: StepProps) {
    return (
        <View>
            <ModuleStepHeader
                icon={Ticket}
                title="Passeios & Atrações"
                subtitle="Passeios imperdíveis com horários, preços e dicas de experiência"
                hint="Adicione ao menos 1 atração com nome para que esse módulo fique completo."
            />
            <Repeater
                title="Atrações adicionadas"
                items={form.attractions}
                onChange={v => update('attractions', v)}
                factory={emptyAttraction}
                render={(item, set) => {
                    const { num, unit } = parseActivityDuration(item.duration);
                    return (
                        <>
                            <FormInput label="Nome da atração" required placeholder="Ex: Torre Eiffel" value={item.name} onChangeText={v => set({ name: v })} />
                            <Text style={s.label}>Tipo</Text>
                            <View style={s.chipRow}>
                                {ATTRACTION_TYPES.map(t => {
                                    const active = item.type === t;
                                    return (
                                        <TouchableOpacity key={t} style={[s.chip, active && s.chipActive]} onPress={() => set({ type: t })}>
                                            <Text style={[s.chipText, active && s.chipTextActive]}>{t}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                            <FormInput label="Nome do local ou endereço" placeholder="Ex: Champ de Mars, 5 Ave..." value={item.location} onChangeText={v => set({ location: v })} />
                            <FormInput label="Link do Google Maps" placeholder="Ex: https://goo.gl/maps/..." autoCapitalize="none" value={item.mapLink} onChangeText={v => set({ mapLink: v })} />
                            <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
                                <DatePickerField label="Data de Início" value={item.startDate} onChange={v => set({ startDate: v })} />
                                <DatePickerField label="Data de Fim"    value={item.endDate}   onChange={v => set({ endDate: v })} />
                            </View>
                            <Text style={s.label}>Duração</Text>
                            <QuantityStepper
                                value={num}
                                onChange={n => set({ duration: `${Math.max(1, n)}${unit}` })}
                                min={1}
                                max={unit === 'h' ? 23 : unit === 'd' ? 30 : 300}
                                step={unit === 'min' ? 5 : 1}
                                unit={unit}
                                onUnitChange={u => set({ duration: `${num}${u}` })}
                                units={['min', 'h', 'd']}
                            />
                            <FormInput
                                label="Descrição / Por que recomendar"
                                required
                                placeholder="Ex: Uma vista imperdível..."
                                multiline value={item.description}
                                onChangeText={v => set({ description: v })}
                                style={{ minHeight: 60, textAlignVertical: 'top' }}
                            />
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                <View style={{ flex: 2 }}>
                                    <FormInput label="Link externo" placeholder="Ex: www.toureiffel.paris" autoCapitalize="none" value={item.externalLink} onChangeText={v => set({ externalLink: v })} />
                                </View>
                                <View style={{ width: 110 }}>
                                    <FormInput label="Preço" keyboardType="decimal-pad" placeholder="Ex: 35" value={item.price || ''} onChangeText={v => set({ price: v })} />
                                </View>
                            </View>
                            <Text style={s.helper}>Preço opcional — usa a mesma moeda da Estimativa de gastos por pessoa.</Text>
                            {/* Horário recomendado: estrutura Início → Fim (substitui texto livre).
                                Salvo em item.hours como "HH:MM - HH:MM" para preservar payload do site. */}
                            {(() => {
                                const range = (item.hours || '').split(/\s*[-–]\s*/);
                                const start = parseHHMM(range[0] || '') ? range[0] : '';
                                const end = parseHHMM(range[1] || '') ? range[1] : '';
                                const writeRange = (a: string, b: string) => {
                                    const out = [a, b].filter(Boolean).join(' - ');
                                    set({ hours: out });
                                };
                                return (
                                    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                                        <TimePickerField
                                            label="Início"
                                            value={start}
                                            onChange={v => writeRange(v, end)}
                                            placeholder="09:00"
                                        />
                                        <TimePickerField
                                            label="Fim"
                                            value={end}
                                            onChange={v => writeRange(start, v)}
                                            placeholder="18:00"
                                        />
                                    </View>
                                );
                            })()}
                            <FormInput
                                label="Dica de experiência"
                                placeholder="Ex: Vá próximo ao pôr do sol..."
                                multiline value={item.tips}
                                onChangeText={v => set({ tips: v })}
                                style={{ minHeight: 50, textAlignVertical: 'top' }}
                            />
                            <SpendingFieldset
                                spending={item.spending}
                                onChange={sp => set({ spending: sp })}
                                defaultCurrency={form.currency || 'BRL'}
                                helperShort="Valor por pessoa do ingresso/passeio — opcional."
                            />
                        </>
                    );
                }}
            />
        </View>
    );
}

// ═══════════════════════════════════════════════════════════════════
// STEP MODULES — Transporte
// ═══════════════════════════════════════════════════════════════════

function StepTransport({ form, update }: StepProps) {
    return (
        <View>
            <ModuleStepHeader
                icon={Bus}
                title="Transporte"
                subtitle="Como se locomover no destino — metrô, passes e dicas de mobilidade"
                hint="Adicione ao menos 1 orientação de transporte com descrição e tipo de passe."
            />
            <Repeater
                title="Transportes adicionados"
                items={form.transports}
                onChange={v => update('transports', v)}
                factory={emptyTransport}
                render={(item, set) => (
                    <>
                        <FormInput
                            label="Descrição do transporte / Passe"
                            required
                            placeholder="Ex: JR Pass (Japan Rail Pass)"
                            value={item.description}
                            onChangeText={v => set({ description: v })}
                            multiline
                            style={{ minHeight: 60, textAlignVertical: 'top' }}
                        />
                        <FormInput
                            label="Tipo de passe / bilhete"
                            required
                            placeholder="Ex: Passe Semanal Nacional (7 dias)"
                            value={item.passTypes}
                            onChangeText={v => set({ passTypes: v })}
                        />
                        <DatePickerField label="Data" value={item.startDate} onChange={v => set({ startDate: v })} />
                        <FormInput
                            label="Notas e dicas adicionais"
                            placeholder="Ex: Leve uma foto 3x4..."
                            multiline value={item.notes}
                            onChangeText={v => set({ notes: v })}
                            style={{ minHeight: 50, textAlignVertical: 'top' }}
                        />
                        <SpendingFieldset
                            spending={item.spending}
                            onChange={sp => set({ spending: sp })}
                            defaultCurrency={form.currency || 'BRL'}
                            helperShort="Valor por pessoa do passe/transporte — opcional."
                        />
                    </>
                )}
            />
        </View>
    );
}

// ═══════════════════════════════════════════════════════════════════
// STEP MODULES — Restaurantes & Gastronomia
// ═══════════════════════════════════════════════════════════════════

function StepRestaurants({ form, update }: StepProps) {
    return (
        <View>
            <ModuleStepHeader
                icon={Utensils}
                title="Restaurantes & Gastronomia"
                subtitle="Onde comer bem — experiências gastronômicas autênticas e locais"
                hint="Adicione ao menos 1 restaurante com nome e local."
            />
            <Repeater
                title="Restaurantes adicionados"
                items={form.restaurants}
                onChange={v => update('restaurants', v)}
                factory={emptyRestaurant}
                render={(item, set) => (
                    <>
                        <FormInput label="Nome do restaurante" required placeholder="Ex: Le Jules Verne" value={item.name} onChangeText={v => set({ name: v })} />
                        <Text style={s.label}>Culinária</Text>
                        <View style={s.chipRow}>
                            {CUISINE_OPTIONS.map(c => {
                                const active = item.cuisine === c;
                                return (
                                    <TouchableOpacity key={c} style={[s.chip, active && s.chipActive]} onPress={() => set({ cuisine: c })}>
                                        <Text style={[s.chipText, active && s.chipTextActive]}>{c}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                        <FormInput label="Localização / Bairro" required placeholder="Ex: Montmartre" value={item.location} onChangeText={v => set({ location: v })} />
                        <FormInput
                            label="Descrição / Por que recomendar"
                            placeholder="Ex: O melhor croque monsieur da cidade com vista incrível..."
                            multiline value={item.description}
                            onChangeText={v => set({ description: v })}
                            style={{ minHeight: 60, textAlignVertical: 'top' }}
                        />
                        <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
                            <TimePickerField label="Horário" value={item.hoursStart} onChange={v => set({ hoursStart: v })} placeholder="11:00" />
                            <DatePickerField label="Data"    value={item.startDate}  onChange={v => set({ startDate: v })} />
                        </View>
                        <FormInput label="Link externo (Google Maps, reserva)" placeholder="Ex: https://..." autoCapitalize="none" value={item.externalLink} onChangeText={v => set({ externalLink: v })} />
                        <FormInput
                            label="Dicas de experiência"
                            placeholder="Ex: Chegue cedo ou faça reserva, o local lota rápido..."
                            multiline value={item.tips}
                            onChangeText={v => set({ tips: v })}
                            style={{ minHeight: 50, textAlignVertical: 'top' }}
                        />
                        <SpendingFieldset
                            spending={item.spending}
                            onChange={sp => set({ spending: sp })}
                            defaultCurrency={form.currency || 'BRL'}
                            helperShort="Valor por pessoa da refeição — opcional."
                        />
                    </>
                )}
            />
        </View>
    );
}

// ═══════════════════════════════════════════════════════════════════
// STEP MODULES — Meu Voo
// ═══════════════════════════════════════════════════════════════════

function StepFlight({ form, update }: StepProps) {
    const setLeg = (key: 'flightOutbound' | 'flightReturn', patch: Partial<FlightLeg>) =>
        update(key, { ...form[key], ...patch });

    const renderLeg = (
        legKey: 'flightOutbound' | 'flightReturn',
        leg: FlightLeg,
        title: string,
    ) => (
        <View style={s.activityCard}>
            <Text style={[s.repeaterTitle, { marginTop: 0 }]}>{title}</Text>
            <FormInput label="Companhia aérea" placeholder="Ex: LATAM, Gol, Air France" value={leg.airline} onChangeText={v => setLeg(legKey, { airline: v })} />
            <FormInput label="Cidade de Saída" required placeholder="Ex: São Paulo, Rio de Janeiro, Brasília" value={leg.originCity} onChangeText={v => setLeg(legKey, { originCity: v })} />
            <FormInput label="Aeroporto de Origem" placeholder="Ex: GRU — São Paulo/Guarulhos" value={leg.originAirport} onChangeText={v => setLeg(legKey, { originAirport: v })} />
            <FormInput label="Aeroporto de Destino" placeholder="Ex: CDG — Paris/Charles de Gaulle" value={leg.destinationAirport} onChangeText={v => setLeg(legKey, { destinationAirport: v })} />
            <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
                <DatePickerField label="Data de Saída"   required value={leg.departureDate} onChange={v => setLeg(legKey, { departureDate: v })} />
                <DatePickerField label="Data de Chegada" required value={leg.arrivalDate}   onChange={v => setLeg(legKey, { arrivalDate: v })} />
                <View>
                    <Text style={s.label}>Paradas</Text>
                    <QuantityStepper
                        value={leg.stops ?? 0}
                        onChange={n => setLeg(legKey, { stops: Math.max(0, n) })}
                        min={0}
                        max={10}
                    />
                </View>
            </View>
        </View>
    );

    return (
        <View>
            <ModuleStepHeader
                icon={Plane}
                title="Meu Voo"
                subtitle="Sugestões de voo para o destino — aumenta a confiança do comprador"
                hint="Preencha cidade de origem e datas de ida e volta para o módulo ficar completo."
            />

            {renderLeg('flightOutbound', form.flightOutbound, 'Voo de Ida')}
            {renderLeg('flightReturn', form.flightReturn, 'Voo de Volta')}

            <Text style={[s.repeaterTitle, { marginTop: 16 }]}>Dicas sobre o Voo</Text>
            <EditableList
                items={form.flightTips}
                onItemsChange={items => update('flightTips', items)}
                placeholder="Ex: Voo noturno é a melhor opção — dormi no avião e cheguei descansado de manhã"
            />

            {/* Gasto da passagem aérea (opcional, comprovante obrigatório se preencher) */}
            <SpendingFieldset
                spending={form.flightSpending}
                onChange={sp => update('flightSpending', sp)}
                defaultCurrency={form.currency || 'BRL'}
                helperShort="Valor da passagem por pessoa — opcional."
            />
        </View>
    );
}

// ═══════════════════════════════════════════════════════════════════
// FACTORIES — Checklist / Spending
// ═══════════════════════════════════════════════════════════════════

function emptyChecklist(): ChecklistItem { return { category: 'documentos', item: '', isDefault: false }; }
function emptySpending(): SpendingEntry { return { moduleKey: 'gasto', label: '', icon: '💳', priceValue: '', priceCurrency: 'BRL', receiptUrl: '' }; }

// ═══════════════════════════════════════════════════════════════════
// STEP MODULES — Dicas Exclusivas
// ═══════════════════════════════════════════════════════════════════

function StepTips({ form, update }: StepProps) {
    const filled = form.generalTips.filter(t => t.trim() !== '').length;
    return (
        <View>
            <ModuleStepHeader
                icon={Lightbulb}
                title="Dicas Exclusivas"
                subtitle="Segredos e dicas práticas que só quem foi sabe — seu grande diferencial"
                hint={`Adicione no mínimo ${MIN_TIPS} dicas exclusivas para esse módulo ficar completo.`}
            />
            <View style={[s.daysProgressCard, filled >= MIN_TIPS && s.daysProgressCardOk]}>
                <Ionicons
                    name={filled >= MIN_TIPS ? 'checkmark-circle' : 'time-outline'}
                    size={18}
                    color={filled >= MIN_TIPS ? theme.colors.success : theme.colors.primary}
                />
                <Text style={s.daysProgressText}>
                    {filled}/{MIN_TIPS} dicas preenchidas{filled >= MIN_TIPS ? ' ✓' : ''}
                </Text>
            </View>
            <EditableList
                items={form.generalTips}
                onItemsChange={v => update('generalTips', v)}
                placeholder="Ex: Compre o passe Navigo na segunda-feira"
            />
        </View>
    );
}

// ═══════════════════════════════════════════════════════════════════
// STEP MODULES — Checklist
// ═══════════════════════════════════════════════════════════════════

function StepChecklist({ form, update }: StepProps) {
    const filled = form.checklistItems.filter(c => c.item?.trim() !== '').length;
    return (
        <View>
            <ModuleStepHeader
                icon={ListChecks}
                title="Checklist"
                subtitle="Lista de preparação que o viajante usa antes e durante a viagem"
                hint={`Adicione no mínimo ${MIN_CHECKLIST} itens para esse módulo ficar completo.`}
            />
            <View style={[s.daysProgressCard, filled >= MIN_CHECKLIST && s.daysProgressCardOk]}>
                <Ionicons
                    name={filled >= MIN_CHECKLIST ? 'checkmark-circle' : 'time-outline'}
                    size={18}
                    color={filled >= MIN_CHECKLIST ? theme.colors.success : theme.colors.primary}
                />
                <Text style={s.daysProgressText}>
                    {filled}/{MIN_CHECKLIST} itens preenchidos{filled >= MIN_CHECKLIST ? ' ✓' : ''}
                </Text>
            </View>
            {form.checklistItems.map((c, i) => (
                <View key={i} style={s.checkRow}>
                    <View style={{ flex: 1 }}>
                        <Text style={s.checkCat}>{c.category}</Text>
                        <TextInput
                            style={s.checkInput}
                            placeholder="Item do checklist"
                            placeholderTextColor={theme.colors.text.disabled}
                            value={c.item}
                            onChangeText={v => {
                                const next = [...form.checklistItems];
                                next[i] = { ...next[i], item: v };
                                update('checklistItems', next);
                            }}
                        />
                    </View>
                    <TouchableOpacity onPress={() => update('checklistItems', form.checklistItems.filter((_, x) => x !== i))}>
                        <Ionicons name="close-circle" size={20} color={theme.colors.text.tertiary} />
                    </TouchableOpacity>
                </View>
            ))}
            <Text style={[s.label, { marginTop: 14 }]}>Adicionar item por categoria</Text>
            <View style={s.chipRow}>
                {CHECKLIST_CATS.map(cat => (
                    <TouchableOpacity
                        key={cat}
                        style={s.chipGhost}
                        onPress={() => update('checklistItems', [...form.checklistItems, { category: cat, item: '', isDefault: false }])}
                    >
                        <Ionicons name="add" size={14} color={theme.colors.primary} />
                        <Text style={s.chipGhostText}>{cat}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
}

// ═══════════════════════════════════════════════════════════════════
// STEP MODULES — Estimativa de Gastos por Pessoa
// ═══════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════
// SPENDING FIELDSET — usado inline dentro de cada item de módulo
// ═══════════════════════════════════════════════════════════════════
//
// Regra: valor + moeda são opcionais. Não há upload de comprovante
// dentro dos módulos — o único comprovante exigido em todo o fluxo é
// o comprovante geral de viagem (step "Comprovante").

function SpendingFieldset({
    spending,
    onChange,
    defaultCurrency = 'BRL',
    helperShort,
}: {
    spending?: ModuleSpending;
    onChange: (sp: ModuleSpending | undefined) => void;
    defaultCurrency?: string;
    helperShort?: string;
}) {
    const sp = spending || { ...EMPTY_MODULE_SPENDING, currency: defaultCurrency };

    const patch = (p: Partial<ModuleSpending>) => onChange({ ...sp, ...p });

    return (
        <View style={s.spFieldset}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <Ionicons name="wallet-outline" size={14} color={theme.colors.primary} />
                <Text style={s.spFieldsetLabel}>Gasto por pessoa (opcional)</Text>
            </View>
            <Text style={s.helper}>
                {helperShort || 'Informar valor é opcional — ajuda o viajante a se planejar.'}
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end', marginTop: 4 }}>
                <View style={{ flex: 2 }}>
                    <FormInput
                        label="Valor"
                        keyboardType="decimal-pad"
                        placeholder="Ex: 150"
                        value={sp.value}
                        onChangeText={val => patch({ value: val })}
                    />
                </View>
                <View style={{ flex: 1 }}>
                    <CurrencyPicker
                        label="Moeda"
                        compact
                        value={sp.currency || defaultCurrency}
                        onChange={code => patch({ currency: code })}
                    />
                </View>
            </View>
        </View>
    );
}

// ═══════════════════════════════════════════════════════════════════
// STEP MODULE — Gastos Extras
// ═══════════════════════════════════════════════════════════════════

function emptyExtraSpending(): ExtraSpendingItem {
    return {
        id: `extra_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        category: 'outros',
        title: '',
        description: '',
        value: '',
        currency: 'BRL',
    };
}

function StepExtraSpending({ form, update }: StepProps) {
    const items = form.extraSpendingItems || [];

    const setItems = (next: ExtraSpendingItem[]) => update('extraSpendingItems', next);
    const updateItem = (i: number, patch: Partial<ExtraSpendingItem>) => {
        setItems(items.map((e, idx) => idx === i ? { ...e, ...patch } : e));
    };

    return (
        <View>
            <ModuleStepHeader
                icon={Wallet}
                title="Gastos Extras"
                subtitle="Chip, seguro, taxas, gorjetas, lavanderia e outros gastos da viagem"
                hint="Adicione gastos que não se encaixam nos outros módulos. Valor é opcional."
            />

            {items.length === 0 ? (
                <View style={s.spendingEmpty}>
                    <Wallet size={36} strokeWidth={1.4} color={theme.colors.primary + '88'} />
                    <Text style={s.spendingEmptyTitle}>Nenhum gasto extra adicionado</Text>
                    <Text style={s.spendingEmptyText}>
                        Adicione gastos que não se encaixam nos outros módulos (chip, seguro, taxas, gorjetas, etc.).
                    </Text>
                </View>
            ) : null}

            {items.map((e, i) => (
                <View key={e.id || i} style={s.spendingCard}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={s.activityBadge}>Gasto extra {i + 1}</Text>
                        <TouchableOpacity onPress={() => setItems(items.filter((_, x) => x !== i))}>
                            <Ionicons name="trash-outline" size={18} color={theme.colors.error} />
                        </TouchableOpacity>
                    </View>

                    <Text style={s.label}>Categoria</Text>
                    <View style={s.chipRow}>
                        {EXTRA_SPENDING_CATEGORIES.map(c => {
                            const active = e.category === c.key;
                            return (
                                <TouchableOpacity
                                    key={c.key}
                                    style={[s.chip, active && s.chipActive]}
                                    onPress={() => updateItem(i, { category: c.key })}
                                >
                                    <Text style={{ fontSize: 13 }}>{c.emoji}</Text>
                                    <Text style={[s.chipText, active && s.chipTextActive]}>{c.label}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    <FormInput
                        label="Título/nome do gasto"
                        required
                        placeholder="Ex: Chip de internet 10GB"
                        value={e.title}
                        onChangeText={v => updateItem(i, { title: v })}
                    />
                    <FormInput
                        label="Descrição (opcional)"
                        placeholder="Detalhes ou contexto do gasto"
                        multiline
                        value={e.description}
                        onChangeText={v => updateItem(i, { description: v })}
                        style={{ minHeight: 50, textAlignVertical: 'top' }}
                    />

                    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
                        <View style={{ flex: 2 }}>
                            <FormInput
                                label="Valor por pessoa (opcional)"
                                keyboardType="decimal-pad"
                                placeholder="Ex: 80"
                                value={e.value}
                                onChangeText={v => updateItem(i, { value: v })}
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <CurrencyPicker
                                label="Moeda"
                                compact
                                value={e.currency || 'BRL'}
                                onChange={code => updateItem(i, { currency: code })}
                            />
                        </View>
                    </View>
                </View>
            ))}

            <TouchableOpacity style={s.addInline} onPress={() => setItems([...items, emptyExtraSpending()])}>
                <Ionicons name="add-circle-outline" size={18} color={theme.colors.primary} />
                <Text style={s.addInlineText}>Adicionar gasto extra</Text>
            </TouchableOpacity>
        </View>
    );
}

// ═══════════════════════════════════════════════════════════════════
// STEP 8 — MÍDIA
// ═══════════════════════════════════════════════════════════════════

function StepMedia({ form, update, token }: StepProps & { token: string | null | undefined }) {
    const [uploadingCover, setUploadingCover] = useState(false);
    const [uploadingGallery, setUploadingGallery] = useState(false);

    async function pickAndUpload(slot: 'cover' | 'gallery') {
        if (Platform.OS !== 'web') {
            const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!perm.granted) {
                Alert.alert('Permissão necessária', 'Precisamos de acesso à galeria.'); return;
            }
        }
        const res = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.85, allowsMultipleSelection: true, selectionLimit: 5,
        });
        if (res.canceled || !res.assets) return;
        const setter = slot === 'cover' ? setUploadingCover : setUploadingGallery;
        setter(true);
        try {
            // Upload em paralelo, mas com tolerância a falhas individuais
            const settled = await Promise.allSettled(
                res.assets.map(a => uploadOne(
                    a.uri,
                    token,
                    (a as any).fileName,
                    (a as any).mimeType,
                ))
            );
            const fresh: string[] = [];
            const failures: string[] = [];
            settled.forEach((r, i) => {
                if (r.status === 'fulfilled') fresh.push(r.value);
                else failures.push(`Foto ${i + 1}: ${r.reason?.message || 'erro desconhecido'}`);
            });
            if (slot === 'cover') update('highlightPhotos', [...form.highlightPhotos, ...fresh].slice(0, 3));
            else update('images', [...form.images, ...fresh].slice(0, 10));
            if (failures.length > 0) {
                Alert.alert(
                    `${failures.length} foto(s) não enviada(s)`,
                    failures.join('\n'),
                );
            }
        } catch (e: any) {
            Alert.alert('Falha no upload', e?.message || 'Tente novamente.');
        } finally {
            setter(false);
        }
    }

    function removeImg(slot: 'cover' | 'gallery', idx: number) {
        if (slot === 'cover') update('highlightPhotos', form.highlightPhotos.filter((_, i) => i !== idx));
        else update('images', form.images.filter((_, i) => i !== idx));
    }

    return (
        <View>
            <ModuleStepHeader
                icon={Camera}
                title="Fotos e Vídeos"
                subtitle="Imagens reais da sua viagem — fotos autênticas aumentam a conversão"
                required={false}
                hint="Capa: até 3 fotos principais. Galeria: até 10 fotos extras."
            />

            <Text style={s.repeaterTitle}>Capa (até 3 fotos)</Text>
            <View style={s.imgGrid}>
                {form.highlightPhotos.map((url, i) => (
                    <View key={i} style={s.imgThumbWrap}>
                        <Image source={{ uri: url }} style={s.imgThumb} resizeMode="cover" />
                        <TouchableOpacity style={s.imgRemove} onPress={() => removeImg('cover', i)}>
                            <Ionicons name="close" size={14} color="#fff" />
                        </TouchableOpacity>
                    </View>
                ))}
                {form.highlightPhotos.length < 3 && (
                    <TouchableOpacity style={s.imgAdd} onPress={() => pickAndUpload('cover')} disabled={uploadingCover}>
                        {uploadingCover ? <ActivityIndicator color={theme.colors.primary} /> : <Ionicons name="add" size={32} color={theme.colors.primary} />}
                    </TouchableOpacity>
                )}
            </View>

            <Text style={[s.repeaterTitle, { marginTop: 20 }]}>Galeria (até 10 fotos)</Text>
            <View style={s.imgGrid}>
                {form.images.map((url, i) => (
                    <View key={i} style={s.imgThumbWrap}>
                        <Image source={{ uri: url }} style={s.imgThumb} resizeMode="cover" />
                        <TouchableOpacity style={s.imgRemove} onPress={() => removeImg('gallery', i)}>
                            <Ionicons name="close" size={14} color="#fff" />
                        </TouchableOpacity>
                    </View>
                ))}
                {form.images.length < 10 && (
                    <TouchableOpacity style={s.imgAdd} onPress={() => pickAndUpload('gallery')} disabled={uploadingGallery}>
                        {uploadingGallery ? <ActivityIndicator color={theme.colors.primary} /> : <Ionicons name="add" size={32} color={theme.colors.primary} />}
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

// ═══════════════════════════════════════════════════════════════════
// STEP 9 — REVISÃO
// ═══════════════════════════════════════════════════════════════════

function StepReview({ form, onPreview }: { form: ItineraryFormState; onPreview: () => void }) {
    const blocks = useMemo(() => calcQualityBlocks(form), [form]);
    const totalScore = useMemo(() => calcQuality(form), [form]);
    const issues = useMemo(() => validateForSubmission(form), [form]);

    return (
        <View>
            <SectionHeader title="Revisão final" subtitle="Confira tudo antes de enviar para análise." />

            <View style={s.scoreCard}>
                <Text style={s.scoreLabel}>Força do roteiro</Text>
                <Text style={s.scoreValue}>{totalScore}/100</Text>
                <View style={s.scoreBar}>
                    <View style={[s.scoreBarFill, { width: `${totalScore}%` }]} />
                </View>
            </View>

            {issues.length > 0 ? (
                <View style={s.issuesCard}>
                    <Text style={s.issuesTitle}>⚠️ Pendências para envio</Text>
                    {issues.map((i, idx) => (
                        <Text key={idx} style={s.issueText}>• {i.message}</Text>
                    ))}
                </View>
            ) : (
                <View style={s.okCard}>
                    <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />
                    <Text style={s.okText}>Pronto para enviar para análise!</Text>
                </View>
            )}

            {/* ── Prévia do roteiro ── */}
            <View style={s.previewBlock}>
                <View style={{ flex: 1 }}>
                    <Text style={s.previewTitle}>Prévia do roteiro</Text>
                    <Text style={s.previewSubtitle}>
                        Visualize como o roteiro vai aparecer para o viajante antes de enviar.
                    </Text>
                </View>
                <TouchableOpacity
                    style={s.previewCta}
                    onPress={onPreview}
                    activeOpacity={0.85}
                >
                    <Ionicons name="eye-outline" size={16} color="#fff" />
                    <Text style={s.previewCtaText}>Ver prévia</Text>
                </TouchableOpacity>
            </View>

            <Text style={s.repeaterTitle}>Detalhamento por bloco</Text>
            {blocks.map(b => (
                <View key={b.label} style={s.blockCard}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={s.blockLabel}>{b.label}</Text>
                        <Text style={s.blockScore}>{b.earned}/{b.max}</Text>
                    </View>
                    {b.criteria.map((c, i) => (
                        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                            <Ionicons name={c.done ? 'checkmark-circle' : 'ellipse-outline'} size={14} color={c.done ? theme.colors.success : theme.colors.text.tertiary} />
                            <Text style={[s.criterion, c.done && { color: theme.colors.text.primary }]}>{c.text}</Text>
                        </View>
                    ))}
                </View>
            ))}
        </View>
    );
}

// ═══════════════════════════════════════════════════════════════════
// HELPERS / SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════

interface StepProps {
    form: ItineraryFormState;
    update: <K extends keyof ItineraryFormState>(key: K, value: ItineraryFormState[K]) => void;
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
    return (
        <View style={{ marginBottom: 12 }}>
            <Text style={s.stepTitle}>{title}</Text>
            {subtitle && <Text style={s.stepHint}>{subtitle}</Text>}
        </View>
    );
}

function SwitchRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
    return (
        <View style={s.switchRow}>
            <Text style={s.switchLabel}>{label}</Text>
            <Switch
                value={value}
                onValueChange={onChange}
                trackColor={{ false: theme.colors.borderLight, true: theme.colors.primary + '80' }}
                thumbColor={value ? theme.colors.primary : '#fff'}
            />
        </View>
    );
}

function Repeater<T>({ title, items, onChange, factory, render }: {
    title: string;
    items: T[];
    onChange: (next: T[]) => void;
    factory: () => T;
    render: (item: T, set: (patch: Partial<T>) => void) => React.ReactNode;
}) {
    return (
        <View style={{ marginTop: 16 }}>
            <Text style={s.repeaterTitle}>{title}</Text>
            {items.map((item, i) => (
                <View key={i} style={s.activityCard}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={s.activityBadge}>Item {i + 1}</Text>
                        <TouchableOpacity onPress={() => onChange(items.filter((_, x) => x !== i))}>
                            <Ionicons name="trash-outline" size={18} color={theme.colors.error} />
                        </TouchableOpacity>
                    </View>
                    {render(item, patch => {
                        const next = [...items];
                        next[i] = { ...next[i], ...patch } as T;
                        onChange(next);
                    })}
                </View>
            ))}
            <TouchableOpacity style={s.addInline} onPress={() => onChange([...items, factory()])}>
                <Ionicons name="add-circle-outline" size={18} color={theme.colors.primary} />
                <Text style={s.addInlineText}>Adicionar</Text>
            </TouchableOpacity>
        </View>
    );
}

function ProgressBar({ step, total }: { step: number; total: number }) {
    const anim = useRef(new Animated.Value(step / total)).current;
    useEffect(() => {
        Animated.spring(anim, { toValue: step / total, useNativeDriver: false, tension: 60, friction: 10 }).start();
    }, [step]);
    const w = anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'], extrapolate: 'clamp' });
    return (
        <View style={{ paddingHorizontal: 20, marginBottom: 4 }}>
            <View style={{ height: 4, borderRadius: 2, backgroundColor: theme.colors.borderLight, overflow: 'hidden' }}>
                <Animated.View style={{ height: '100%', borderRadius: 2, backgroundColor: theme.colors.primary, width: w as any }} />
            </View>
        </View>
    );
}

// ── Upload ─────────────────────────────────────────────────────────
/**
 * Upload cross-platform de um arquivo (imagem ou PDF) para POST /api/uploads.
 *
 * - Native (iOS/Android): usa o shape RN `{ uri, name, type }` no FormData.
 * - Web (Expo Web): converte a URI (blob:, data: ou http:) num Blob real
 *   antes de anexar — caso contrário o backend recebe campo vazio.
 *
 * Lança Error com mensagem descritiva ao falhar (em vez de retornar null
 * silenciosamente) — permite mostrar o erro real ao usuário.
 */
async function uploadOne(
    uri: string,
    token: string | null | undefined,
    filenameHint?: string,
    mimeHint?: string,
): Promise<string> {
    const startedAt = Date.now();
    const filename = filenameHint || uri.split('/').pop()?.split('?')[0] || `upload-${Date.now()}.jpg`;
    const ext = (filename.match(/\.(\w+)$/)?.[1] || 'jpg').toLowerCase();
    const inferredMime = mimeHint
        || (ext === 'pdf' ? 'application/pdf'
            : ext === 'png' ? 'image/png'
            : ext === 'webp' ? 'image/webp'
            : ext === 'gif' ? 'image/gif'
            : 'image/jpeg');

    console.log('[upload] iniciando', { filename, mime: inferredMime, platform: Platform.OS });

    const formData = new FormData();
    if (Platform.OS === 'web') {
        // Web: precisa de Blob/File real, não objeto {uri, ...}
        const blobRes = await fetch(uri);
        if (!blobRes.ok) {
            throw new Error(`Não foi possível ler o arquivo selecionado (HTTP ${blobRes.status}).`);
        }
        const blob = await blobRes.blob();
        console.log('[upload] blob criado', { size: blob.size, type: blob.type });
        formData.append('file', blob, filename);
    } else {
        // Native: shape específico do RN
        // @ts-ignore RN-specific form data shape
        formData.append('file', { uri, name: filename, type: inferredMime });
    }

    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    // No web NÃO setar Content-Type — o browser adiciona o boundary multipart sozinho.

    const res = await fetch(`${API_BASE}/uploads`, {
        method: 'POST',
        headers,
        body: formData,
    });

    const elapsed = Date.now() - startedAt;
    if (!res.ok) {
        let detail = '';
        try { detail = await res.text(); } catch {}
        console.warn('[upload] falhou', { status: res.status, detail, elapsed });
        if (res.status === 413) throw new Error('Arquivo muito grande (máx 25 MB).');
        if (res.status === 415) throw new Error('Formato de arquivo não suportado.');
        throw new Error(`Upload falhou (HTTP ${res.status}). Verifique sua conexão.`);
    }
    const data = await res.json();
    const url = data.url || data.urls?.[0];
    if (!url) {
        console.warn('[upload] resposta sem URL:', data);
        throw new Error('Servidor não retornou a URL do arquivo.');
    }
    console.log('[upload] sucesso', { url, elapsed });
    return url;
}

// ── Hidratação a partir da API (modo edição) ───────────────────────
function deserializeFromApi(data: any): ItineraryFormState {
    const base = createEmptyForm();
    return {
        ...base,
        id: data.id,
        title: data.title || '',
        subtitle: data.subtitle || '',
        destination: data.destination || '',
        country: data.country || '',
        locations: data.locations || [{ country: data.country || '', cities: [data.destination || ''] }],
        description: data.description || '',
        duration: data.duration || 3,
        // Normaliza para seleção única: se vier array com múltiplos valores
        // (de roteiros antigos), mantém só o primeiro.
        travelStyles: Array.isArray(data.travelStyles) && data.travelStyles.length > 0
            ? [data.travelStyles[0]]
            : [],
        categories: data.categories || [],
        travelProofUrl: data.travelProofUrl || '',
        price: data.price || 0,
        currency: data.currency || 'BRL',
        promoPrice: data.promoPrice ?? undefined,
        installments: data.installments ?? undefined,
        immediateAccess: data.immediateAccess ?? true,
        lifetimeAccess: data.lifetimeAccess ?? true,
        offlineDownload: data.offlineDownload ?? true,
        allowPdf: data.allowPdf ?? false,
        allowShare: data.allowShare ?? true,
        productType: data.productType || 'DIGITAL',
        featured: !!data.featured,
        activeModules: data.activeModules || ['itinerario'],
        highlights: data.highlights || [],
        inclusions: data.inclusions || base.inclusions,
        days: (data.days || []).map((d: any) => ({
            dayNumber: d.dayNumber,
            title: d.title || '',
            summary: d.summary || '',
            description: d.description || '',
            activities: (d.activities || []).map((a: any) => ({
                title: a.title || '', description: a.description || '',
                time: a.time || '', duration: a.duration || '',
                location: a.location || '', mapLink: a.mapLink || '',
                type: a.type || 'activity', icon: a.icon || '📍',
                tips: a.tips || '', category: a.category || '',
            })),
        })),
        accommodations: data.accommodations || [],
        transports: data.transports || [],
        attractions: data.attractions || [],
        restaurants: data.restaurants || [],
        checklistItems: data.checklists || [],
        generalTips: data.generalTips || [],
        spendingEntries: data.estimatedSpending?.manualEntries || [],
        flightOutbound: data.flightInfo?.outbound || { ...EMPTY_FLIGHT_LEG },
        flightReturn:   data.flightInfo?.return   || { ...EMPTY_FLIGHT_LEG },
        flightTips: data.flightInfo?.tips || [],
        images: (data.images || []).map((img: any) => typeof img === 'string' ? img : img.url).filter(Boolean),
        mediaUrls: data.mediaUrls || [],
        highlightPhotos: data.highlightPhotos || [],
    };
}

// ═══════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.colors.background },
    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingTop: Platform.OS === 'ios' ? 56 : 32,
        paddingBottom: 12, paddingHorizontal: 12,
        borderBottomWidth: 1, borderBottomColor: theme.colors.borderLight,
        backgroundColor: '#fff',
    },
    headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    headerLabel: { fontSize: 16, fontWeight: '700', color: theme.colors.text.primary },
    headerStep:  { fontSize: 11, color: theme.colors.text.tertiary, marginTop: 2 },

    scroll: { flex: 1 },
    scrollContent: { padding: 20, paddingBottom: 40 },

    stepTitle: { fontSize: 22, fontWeight: '800', color: theme.colors.text.primary, marginBottom: 6 },
    stepHint:  { fontSize: 14, color: theme.colors.text.secondary, marginBottom: 12, lineHeight: 20 },

    label: { fontSize: 13, fontWeight: '600', color: theme.colors.text.secondary, marginTop: 14, marginBottom: 6 },
    helper: { fontSize: 12, color: theme.colors.text.tertiary, marginBottom: 10, lineHeight: 16 },

    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 14, paddingVertical: 8,
        borderRadius: 999, borderWidth: 1.5,
        borderColor: theme.colors.borderLight,
        backgroundColor: '#fff',
    },
    chipActive: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary + '15' },
    chipText: { fontSize: 13, color: theme.colors.text.secondary, fontWeight: '500' },
    chipTextActive: { color: theme.colors.primary, fontWeight: '700' },

    chipGhost: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 12, paddingVertical: 6,
        borderRadius: 999, borderWidth: 1.5, borderStyle: 'dashed',
        borderColor: theme.colors.primary + '60', backgroundColor: 'transparent',
    },
    chipGhostText: { fontSize: 12, color: theme.colors.primary, fontWeight: '600' },

    moduleCard: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        padding: 14, marginBottom: 10, borderRadius: 14,
        borderWidth: 1.5, borderColor: theme.colors.borderLight,
        backgroundColor: '#fff',
    },
    moduleCardActive: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary + '08' },
    moduleTitle: { fontSize: 14, fontWeight: '700', color: theme.colors.text.primary },
    moduleDesc:  { fontSize: 12, color: theme.colors.text.tertiary, marginTop: 2 },
    moduleIconBox: {
        width: 44, height: 44, borderRadius: 12,
        backgroundColor: theme.colors.primary + '12',
        alignItems: 'center', justifyContent: 'center',
    },
    moduleIconBoxActive: {
        backgroundColor: theme.colors.primary + '20',
    },
    modulesHeader: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8,
    },
    modulesObrigBadge: {
        paddingHorizontal: 10, paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: '#fff7ed',
        borderWidth: 1, borderColor: '#fed7aa',
    },
    modulesObrigText: {
        fontSize: 11, fontWeight: '700', color: '#ea580c',
    },
    modulesIntro: {
        fontSize: 13, color: theme.colors.text.secondary, lineHeight: 19,
        marginBottom: 16,
    },

    moduleStepHeader: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 12,
        marginBottom: 12,
    },
    moduleStepIconBox: {
        width: 48, height: 48, borderRadius: 14,
        backgroundColor: theme.colors.primary + '15',
        alignItems: 'center', justifyContent: 'center',
    },
    moduleStepTitle: {
        fontSize: 20, fontWeight: '800', color: theme.colors.text.primary,
    },
    moduleStepSubtitle: {
        fontSize: 13, color: theme.colors.text.secondary, lineHeight: 18, marginTop: 4,
    },
    moduleStepBadgeReq: {
        paddingHorizontal: 8, paddingVertical: 3,
        borderRadius: 999,
        backgroundColor: '#fff7ed',
        borderWidth: 1, borderColor: '#fed7aa',
    },
    moduleStepBadgeReqText: {
        fontSize: 10, fontWeight: '700', color: '#ea580c',
    },
    moduleStepBadgeOpt: {
        paddingHorizontal: 8, paddingVertical: 3,
        borderRadius: 999,
        backgroundColor: theme.colors.borderLight,
        borderWidth: 1, borderColor: theme.colors.borderLight,
    },
    moduleStepBadgeOptText: {
        fontSize: 10, fontWeight: '700', color: theme.colors.text.tertiary,
    },
    moduleStepHintCard: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 8,
        padding: 12, marginBottom: 14, borderRadius: 12,
        backgroundColor: theme.colors.primary + '08',
        borderLeftWidth: 3, borderLeftColor: theme.colors.primary,
    },
    moduleStepHintText: {
        flex: 1, fontSize: 12, color: theme.colors.text.secondary, lineHeight: 17,
    },

    highlightsHeader: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 12,
        marginTop: 18, marginBottom: 12,
    },
    highlightsIconBox: {
        width: 44, height: 44, borderRadius: 12,
        backgroundColor: theme.colors.primary + '15',
        alignItems: 'center', justifyContent: 'center',
    },
    highlightsTitle: {
        fontSize: 17, fontWeight: '800', color: theme.colors.text.primary,
    },
    highlightsSubtitle: {
        fontSize: 12, color: theme.colors.text.secondary, lineHeight: 17, marginTop: 3,
    },
    highlightsEmptyCard: {
        alignItems: 'center', justifyContent: 'center',
        paddingVertical: 24, paddingHorizontal: 18,
        marginBottom: 12, borderRadius: 16,
        borderWidth: 1.5, borderStyle: 'dashed',
        borderColor: theme.colors.primary + '50',
        backgroundColor: theme.colors.primary + '06',
    },
    highlightsEmptyTitle: {
        fontSize: 14, fontWeight: '700', color: theme.colors.text.primary,
        marginTop: 10, textAlign: 'center',
    },
    highlightsEmptyText: {
        fontSize: 12, color: theme.colors.text.secondary, lineHeight: 17,
        marginTop: 6, textAlign: 'center', paddingHorizontal: 8,
    },

    syncBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        alignSelf: 'flex-start',
        paddingHorizontal: 12, paddingVertical: 8, marginBottom: 12,
        borderRadius: 8, backgroundColor: theme.colors.primary + '15',
    },
    syncBtnText: { fontSize: 13, color: theme.colors.primary, fontWeight: '700' },

    dayCard: {
        marginBottom: 12, borderRadius: 14,
        borderWidth: 1, borderColor: theme.colors.borderLight,
        backgroundColor: '#fff', overflow: 'hidden',
    },
    dayHeader: { fontSize: 15, fontWeight: '800', color: theme.colors.primary, marginBottom: 8 },
    dayHeaderRow: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingHorizontal: 14, paddingVertical: 12,
    },
    dayBadge: {
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: theme.colors.primary + '15',
        alignItems: 'center', justifyContent: 'center',
    },
    dayBadgeComplete: {
        backgroundColor: theme.colors.success,
    },
    dayBadgeText: { fontSize: 14, fontWeight: '800', color: theme.colors.primary },
    dayHeaderTitle: { fontSize: 14, fontWeight: '700', color: theme.colors.text.primary },
    dayHeaderStatus: { fontSize: 11, color: theme.colors.text.tertiary, marginTop: 2 },
    dayBody: {
        paddingHorizontal: 14, paddingBottom: 14,
        borderTopWidth: 1, borderTopColor: theme.colors.borderLight,
    },
    daysProgressCard: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        padding: 12, marginBottom: 16, borderRadius: 12,
        backgroundColor: theme.colors.primary + '10',
        borderWidth: 1, borderColor: theme.colors.primary + '30',
    },
    daysProgressCardOk: {
        backgroundColor: '#D1FAE5', borderColor: '#6EE7B7',
    },
    daysProgressText: {
        fontSize: 13, fontWeight: '700', color: theme.colors.text.primary,
    },
    durationRow: {
        flexDirection: 'row', alignItems: 'stretch', marginTop: 6,
        borderWidth: 1.5, borderColor: theme.colors.borderLight,
        borderRadius: 10, overflow: 'hidden', backgroundColor: '#fff',
    },
    durationInput: {
        flex: 1, paddingHorizontal: 12, fontSize: 14,
        color: theme.colors.text.primary,
    },
    durationUnit: {
        paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center',
        backgroundColor: theme.colors.primary + '15',
        borderLeftWidth: 1, borderLeftColor: theme.colors.borderLight,
    },
    durationUnitText: {
        fontSize: 13, fontWeight: '700', color: theme.colors.primary,
    },

    // QuantityStepper — compacto, não estica
    qsRow: {
        flexDirection: 'row', alignItems: 'stretch',
        alignSelf: 'flex-start',
        marginTop: 6, marginBottom: 4,
        borderWidth: 1.5, borderColor: theme.colors.borderLight,
        borderRadius: 10, overflow: 'hidden',
        backgroundColor: '#fff',
    },
    qsBtn: {
        width: 40, alignItems: 'center', justifyContent: 'center',
        backgroundColor: theme.colors.primary + '10',
    },
    qsBtnDisabled: {
        backgroundColor: theme.colors.borderLight + '60',
    },
    qsInput: {
        paddingVertical: 10, paddingHorizontal: 4,
        fontSize: 16, fontWeight: '700',
        color: theme.colors.text.primary,
        textAlign: 'center',
        borderLeftWidth: 1, borderRightWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    qsUnit: {
        paddingHorizontal: 14, minWidth: 56,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: theme.colors.primary + '15',
        borderLeftWidth: 1, borderLeftColor: theme.colors.borderLight,
    },
    qsUnitText: {
        fontSize: 13, fontWeight: '700', color: theme.colors.primary,
    },

    // DatePickerField / TimePickerField
    pickerFieldWrap: {
        marginTop: 6,
    },
    pickerFieldTouchable: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        paddingHorizontal: 12, paddingVertical: 11,
        borderRadius: 10, borderWidth: 1.5,
        borderColor: theme.colors.borderLight,
        backgroundColor: '#fff',
        minWidth: 150,
    },
    pickerFieldText: {
        flex: 1, fontSize: 14, fontWeight: '600',
        color: theme.colors.text.primary,
    },
    pickerFieldPlaceholder: {
        fontWeight: '400',
        color: theme.colors.text.disabled,
    },
    pickerModalBg: {
        flex: 1, justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    pickerModalCard: {
        backgroundColor: '#fff',
        padding: 16, paddingBottom: Platform.OS === 'ios' ? 32 : 16,
        borderTopLeftRadius: 20, borderTopRightRadius: 20,
    },
    pickerModalTitle: {
        fontSize: 15, fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: 4, textAlign: 'center',
    },
    pickerClearBtn: {
        paddingHorizontal: 6, paddingVertical: 4,
    },

    activityCard: {
        padding: 12, marginTop: 10, borderRadius: 12,
        backgroundColor: theme.colors.surfaceLight,
        borderWidth: 1, borderColor: theme.colors.borderLight,
    },
    activityBadge: { fontSize: 12, fontWeight: '700', color: theme.colors.text.secondary },

    addInline: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        marginTop: 10, alignSelf: 'flex-start',
        paddingHorizontal: 12, paddingVertical: 8,
        borderRadius: 8, backgroundColor: theme.colors.primary + '10',
    },
    addInlineText: { fontSize: 13, color: theme.colors.primary, fontWeight: '700' },

    repeaterTitle: { fontSize: 15, fontWeight: '700', color: theme.colors.text.primary, marginBottom: 8, marginTop: 4 },

    uploadBox: {
        padding: 28, borderRadius: 14, borderWidth: 2, borderStyle: 'dashed',
        borderColor: theme.colors.primary + '40', backgroundColor: theme.colors.primary + '05',
        alignItems: 'center', justifyContent: 'center', minHeight: 160,
    },
    uploadText: { marginTop: 8, fontWeight: '700', color: theme.colors.primary, fontSize: 14 },
    uploadHint: { marginTop: 2, fontSize: 12, color: theme.colors.text.tertiary },

    proofInfoCard: {
        flexDirection: 'row', gap: 12,
        padding: 14, marginBottom: 20,
        borderRadius: 12, borderLeftWidth: 4, borderLeftColor: '#ea580c',
        backgroundColor: '#fff7ed',
        borderWidth: 1, borderColor: '#fed7aa',
    },
    proofInfoIconWrap: {
        marginTop: 1,
    },
    proofInfoTitle: {
        fontSize: 14, fontWeight: '700', color: '#c2410c', marginBottom: 6,
    },
    proofInfoText: {
        fontSize: 13, color: '#7c2d12', lineHeight: 19,
    },
    proofLabelRow: {
        flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10,
    },
    proofLabelText: {
        fontSize: 14, fontWeight: '700', color: theme.colors.text.primary,
    },
    proofObrigBadge: {
        paddingHorizontal: 8, paddingVertical: 3,
        borderRadius: 6, borderWidth: 1.5, borderColor: theme.colors.error,
    },
    proofObrigText: {
        fontSize: 10, fontWeight: '800', color: theme.colors.error, letterSpacing: 0.5,
    },

    proofCard: {
        flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12,
        borderRadius: 12, borderWidth: 1, borderColor: theme.colors.borderLight, backgroundColor: '#fff',
    },
    proofImg:  { width: 56, height: 56, borderRadius: 8, backgroundColor: '#eee' },
    proofText: { fontSize: 13, color: theme.colors.text.primary, fontWeight: '600' },
    proofError: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        marginTop: 10, padding: 10, borderRadius: 10,
        backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca',
    },
    proofErrorText: { flex: 1, fontSize: 12, color: theme.colors.error, lineHeight: 16 },

    switchRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingVertical: 10,
    },
    switchLabel: { fontSize: 14, color: theme.colors.text.primary },

    checkRow: {
        flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6,
    },
    checkCat: { fontSize: 11, color: theme.colors.text.tertiary, fontWeight: '600', textTransform: 'uppercase' },
    checkInput: {
        fontSize: 14, color: theme.colors.text.primary,
        borderBottomWidth: 1, borderBottomColor: theme.colors.borderLight,
        paddingVertical: 4,
    },

    spendingCard: {
        padding: 12, marginTop: 10, borderRadius: 12,
        backgroundColor: theme.colors.surfaceLight,
        borderWidth: 1, borderColor: theme.colors.borderLight,
    },
    spendingHeader: {
        flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8,
    },
    spendingIconBox: {
        width: 32, height: 32, borderRadius: 9,
        backgroundColor: theme.colors.primary + '15',
        alignItems: 'center', justifyContent: 'center',
    },
    spendingLabel: {
        fontWeight: '700', fontSize: 14, color: theme.colors.text.primary,
    },
    spendingWarn: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 10,
        padding: 12, marginBottom: 14, borderRadius: 10,
        backgroundColor: 'rgba(249, 115, 22, 0.06)',
        borderLeftWidth: 3, borderLeftColor: '#f97316',
    },
    spendingWarnText: {
        flex: 1, fontSize: 12, color: theme.colors.text.secondary, lineHeight: 17,
    },
    spendingEmpty: {
        alignItems: 'center', paddingVertical: 28, paddingHorizontal: 14,
        marginTop: 8, borderRadius: 14,
        borderWidth: 1.5, borderStyle: 'dashed',
        borderColor: theme.colors.primary + '40',
        backgroundColor: theme.colors.primary + '06',
    },
    spendingEmptyTitle: {
        fontSize: 14, fontWeight: '700', color: theme.colors.text.primary,
        marginTop: 10, textAlign: 'center',
    },
    spendingEmptyText: {
        fontSize: 12, color: theme.colors.text.secondary, lineHeight: 17,
        marginTop: 6, textAlign: 'center',
    },

    // SpendingFieldset (inline em itens de módulo)
    spFieldset: {
        marginTop: 12, padding: 12, borderRadius: 12,
        backgroundColor: theme.colors.primary + '06',
        borderWidth: 1, borderColor: theme.colors.primary + '25',
    },
    spFieldsetLabel: {
        fontSize: 13, fontWeight: '700', color: theme.colors.primary,
    },

    imgGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    imgThumbWrap: { position: 'relative' },
    imgThumb: { width: 80, height: 80, borderRadius: 10, backgroundColor: '#eee' },
    imgRemove: {
        position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: 11,
        backgroundColor: theme.colors.error, alignItems: 'center', justifyContent: 'center',
    },
    imgAdd: {
        width: 80, height: 80, borderRadius: 10, borderWidth: 2, borderStyle: 'dashed',
        borderColor: theme.colors.primary + '60', alignItems: 'center', justifyContent: 'center',
        backgroundColor: theme.colors.primary + '08',
    },

    scoreCard: {
        padding: 18, borderRadius: 14, backgroundColor: theme.colors.primary,
        marginBottom: 14,
    },
    scoreLabel: { fontSize: 12, color: '#fff', opacity: 0.85, fontWeight: '600' },
    scoreValue: { fontSize: 32, fontWeight: '800', color: '#fff', marginTop: 2 },
    scoreBar:   { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.25)', marginTop: 8, overflow: 'hidden' },
    scoreBarFill: { height: '100%', backgroundColor: '#fff', borderRadius: 3 },

    issuesCard: {
        padding: 14, borderRadius: 12, backgroundColor: '#FEF3C7',
        borderWidth: 1, borderColor: '#FCD34D', marginBottom: 14,
    },
    issuesTitle: { fontSize: 14, fontWeight: '700', color: '#92400E', marginBottom: 6 },
    issueText:   { fontSize: 13, color: '#92400E', lineHeight: 20 },

    okCard: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        padding: 14, borderRadius: 12, backgroundColor: '#D1FAE5',
        borderWidth: 1, borderColor: '#6EE7B7', marginBottom: 14,
    },
    okText: { fontSize: 14, fontWeight: '700', color: '#065F46' },

    previewBlock: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        padding: 14, marginBottom: 14, borderRadius: 14,
        backgroundColor: '#F0FDFA',
        borderWidth: 1, borderColor: '#5EEAD4',
    },
    previewTitle: { fontSize: 14, fontWeight: '700', color: theme.colors.text.primary },
    previewSubtitle: { fontSize: 12, color: theme.colors.text.secondary, marginTop: 2, lineHeight: 16 },
    previewCta: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10,
    },
    previewCtaText: { color: '#fff', fontWeight: '700', fontSize: 13 },

    blockCard: {
        padding: 12, marginBottom: 10, borderRadius: 10,
        borderWidth: 1, borderColor: theme.colors.borderLight, backgroundColor: '#fff',
    },
    blockLabel: { fontSize: 13, fontWeight: '700', color: theme.colors.text.primary },
    blockScore: { fontSize: 13, fontWeight: '700', color: theme.colors.primary },
    criterion:  { fontSize: 12, color: theme.colors.text.tertiary },

    emptyHint: { fontSize: 13, color: theme.colors.text.tertiary, lineHeight: 20, marginTop: 8 },

    locCard: {
        backgroundColor: theme.colors.surfaceLight,
        borderWidth: 1, borderColor: theme.colors.borderLight,
        borderRadius: 12, padding: 14, marginBottom: 12,
    },
    locRemoveBtn: {
        width: 36, height: 36, borderRadius: 8,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#fef2f2', marginBottom: 2,
    },
    cityTag: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: '#fff', borderWidth: 1, borderColor: theme.colors.borderLight,
        borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5,
    },
    cityInput: {
        fontSize: 13, fontWeight: '500', color: theme.colors.text.primary,
        minWidth: 70, maxWidth: 160,
    },
    addCityBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 10, paddingVertical: 5,
        borderRadius: 8, borderWidth: 1.5, borderStyle: 'dashed',
        borderColor: theme.colors.primary + '60',
    },
    addCityText: { fontSize: 12, color: theme.colors.primary, fontWeight: '600' },
    addCountryBtn: {
        alignSelf: 'flex-start', marginBottom: 16,
        paddingHorizontal: 14, paddingVertical: 9,
        borderRadius: 10, borderWidth: 1.5, borderStyle: 'dashed',
        borderColor: theme.colors.primary + '60',
        backgroundColor: 'transparent',
    },
    addCountryText: { fontSize: 13, color: theme.colors.primary, fontWeight: '700' },

    formGroup: { marginTop: 14 },
    textArea: {
        marginTop: 6, borderWidth: 1.5, borderColor: theme.colors.borderLight,
        borderRadius: 10, padding: 12, minHeight: 120,
        fontSize: 14, color: theme.colors.text.primary,
        backgroundColor: '#fff', lineHeight: 20,
    },
    charCounter: { fontSize: 11, color: theme.colors.text.tertiary, marginTop: 4, textAlign: 'right' },

    commerceWarningCard: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 10,
        marginTop: 16, padding: 14, borderRadius: 12,
        backgroundColor: '#fff7ed',
        borderWidth: 1, borderColor: '#fed7aa',
    },
    commerceWarningText: {
        flex: 1, fontSize: 13, color: '#7c2d12', lineHeight: 19,
    },
    commerceOfflineCard: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 10,
        marginTop: 12, padding: 14, borderRadius: 12,
        backgroundColor: theme.colors.primary + '08',
        borderLeftWidth: 3, borderLeftColor: theme.colors.primary,
        borderWidth: 1, borderColor: theme.colors.primary + '30',
    },
    commerceOfflineText: {
        flex: 1, fontSize: 13, color: theme.colors.text.secondary, lineHeight: 19,
    },

    footer: {
        paddingHorizontal: 20, paddingVertical: 12,
        paddingBottom: Platform.OS === 'ios' ? 32 : 12,
        borderTopWidth: 1, borderTopColor: theme.colors.borderLight,
        backgroundColor: '#fff',
    },
    ctaBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: theme.colors.primary, borderRadius: 14, height: 52,
    },
    ctaBtnWarning: {
        backgroundColor: '#F59E0B', // amber/warning para sinalizar pendências
    },
    ctaText: { color: '#fff', fontWeight: '700', fontSize: 16 },
    ctaHelperRow: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        marginTop: 8, paddingHorizontal: 4,
    },
    ctaHelperText: {
        flex: 1, fontSize: 12, color: '#92400E', lineHeight: 16, fontWeight: '500',
    },

    modalBg:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: 24 },
    modalCard: { width: '100%', maxWidth: 380, padding: 22, borderRadius: 18, backgroundColor: '#fff' },
    modalTitle:{ fontSize: 18, fontWeight: '800', color: theme.colors.text.primary, marginBottom: 6 },
    modalText: { fontSize: 14, color: theme.colors.text.secondary, lineHeight: 20 },
    modalBtnGhost:    { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: theme.colors.borderLight },
    modalBtnGhostText:{ fontWeight: '700', color: theme.colors.text.primary },
    modalBtnPrimary:  { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: theme.colors.primary },
    modalBtnPrimaryText: { fontWeight: '700', color: '#fff' },
});
