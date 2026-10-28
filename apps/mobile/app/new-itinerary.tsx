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
 *   3. Preço & Comercial       (preço, moeda, promoção, acessos)
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
    StatusBar, ActivityIndicator, KeyboardAvoidingView, Animated,
    Modal, TextInput, Image, Switch,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { safeBack } from '../src/utils/navigation';
import { HotelStarsInput } from '../src/components/common/HotelStars';
import { Ionicons } from '@expo/vector-icons';
import {
    Wallet, BarChart3, Crown,
    Landmark, ChefHat, Leaf, Dumbbell, Ship, Globe, Sparkles,
    Sun, BookOpen, Music, Backpack, Users, Heart, Mountain,
    CalendarDays, Plane, Building2, Ticket, Bus, Lightbulb, Utensils, ListChecks, CreditCard,
    Camera, Star,
    Wifi, Shield, FileText, Shirt, Package, Coins, ShoppingBag, Luggage, Wrench, Pill, Car,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSession as getStoredSession, setSession as setStoredSession } from '../src/utils/secureSession';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import {
    acceptAttributeFor,
    validateUploadFile,
    uploadHint,
} from '../src/utils/uploadContexts';
import { uploadFile as uploadFileUrl } from '../src/utils/uploadFile';
import { isVideoUrl } from '../src/utils/itineraryMedia';
import { theme } from '../src/theme/theme';
import { haptics } from '../src/services/haptics';
import { useAuth } from '../src/contexts/AuthContext';
import { notify } from '../src/utils/notify';
import { confirm } from '../src/utils/confirm';
import FormInput from '../src/components/dashboard/FormInput';
import MoneyInput from '../src/components/dashboard/MoneyInput';
import VamoTimePicker from '../src/components/dashboard/VamoTimePicker';
import EditableList from '../src/components/dashboard/EditableList';
import CostBlock, { costToLegacySpending } from '../src/components/dashboard/CostBlock';
import { CurrencyPicker } from '../src/components/common/CurrencyPicker';
import BudgetStyleGuideSheet from '../src/components/common/BudgetStyleGuideSheet';
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
    ExtraSpendingItem,
    FlightLeg,
    EMPTY_FLIGHT_LEG,
    STYLE_OPTIONS,
    getBudgetStyleGuide,
    getPrimaryBudgetStyle,
    BUDGET_STYLE_CREATOR_SUBTITLE,
    CATEGORY_OPTIONS,
    MODULE_OPTIONS,
    CHECKLIST_CATS,
    SPENDING_CATS,
    EXTRA_SPENDING_CATEGORIES,
    CUISINE_OPTIONS,
    getCuisineLabel,
    getChecklistCategoryLabel,
    MAX_CATEGORIES,
    MIN_TIPS,
    MIN_CHECKLIST,
    buildPayload,
    calcQuality,
    calcQualityBlocks,
    validateForSubmission,
    dayIsComplete,
} from '@vamo/shared/itinerary';
import { BASE_CURRENCY } from '@vamo/shared/itinerary';

// Rascunho do roteiro é dado privado do criador (destino, datas, preços, fotos).
// Chave por travelerId — sem isso, Maria deslogava e Diego pegava o rascunho dela.
const DRAFT_KEY_PREFIX = '@vamo_draft_itinerary_v2';
const LEGACY_DRAFT_KEY = '@vamo_draft_itinerary_v2';
const draftKeyFor = (travelerId: string | null | undefined) =>
    travelerId ? `${DRAFT_KEY_PREFIX}:${travelerId}` : null;
// Preview handoff (form completo serializado entre new-itinerary → preview).
// Também por travelerId. A tela de preview limpa após ler.
const PREVIEW_KEY_PREFIX = '@vamo_preview_itinerary';
const LEGACY_PREVIEW_KEY = '@vamo_preview_itinerary';
const previewKeyFor = (travelerId: string | null | undefined) =>
    travelerId ? `${PREVIEW_KEY_PREFIX}:${travelerId}` : null;
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
    identity:      'Identity',
    proof:         'Proof',
    commerce:      'Pricing',
    modules:       'Modules',
    days:          'Daily itinerary',
    voo:           'My Flight',
    hospedagem:    'Lodging',
    passeios:      'Tours & Attractions',
    transporte:    'Transportation',
    dicas:         'Insider Tips',
    restaurantes:  'Restaurants',
    checklist:     'Checklist',
    gastos_extras: 'Extra Expenses',
    media:         'Photos & Videos',
    review:        'Review',
};

// Mapeia o campo `section` de uma ValidationIssue para a chave de etapa
// correspondente, para que "Corrigir pendência" leve o roteirista direto
// para a etapa onde está o problema.
const ISSUE_SECTION_TO_STEP: Record<string, StepKey> = {
    identity:      'identity',
    proof:         'proof',
    commerce:      'commerce',
    modules:       'modules',
    // 'itinerary' (em inglês) é usado pelas pendências legadas
    // ("Cadastre pelo menos 1 dia…", "link do mapa inválido…").
    // 'itinerario' (ModuleKey, em en-US) é o que validateForSubmission
    // emite no caminho granular novo (Complete o Dia X…). Ambos
    // levam para o mesmo step.
    itinerary:     'days',
    itinerario:    'days',
    voo:           'voo',
    hospedagem:    'hospedagem',
    passeios:      'passeios',
    transporte:    'transporte',
    dicas:         'dicas',
    restaurantes:  'restaurantes',
    checklist:     'checklist',
    gastos_extras: 'gastos_extras',
    media:         'media',
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
    const { accessToken, isAuthenticated, isLoading: authLoading, user } = useAuth();
    const travelerId = user?.travelerId ?? null;
    const draftKey = draftKeyFor(travelerId);
    const previewKey = previewKeyFor(travelerId);
    const isEdit = !!editId;

    // Migration: chaves globais legacy apagadas uma vez por mount.
    const legacyWiped = useRef(false);
    useEffect(() => {
        if (legacyWiped.current) return;
        legacyWiped.current = true;
        AsyncStorage.removeItem(LEGACY_DRAFT_KEY).catch(() => {});
        AsyncStorage.removeItem(LEGACY_PREVIEW_KEY).catch(() => {});
    }, []);

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
        if (!draftKey) return; // anônimo: sem persistência
        AsyncStorage.getItem(draftKey).then(raw => {
            if (!raw) return;
            try {
                const saved = JSON.parse(raw);
                if (saved.form?.title || saved.form?.destination || saved.form?.locations?.[0]?.cities?.[0]) {
                    setPendingDraft({ form: saved.form, step: saved.step || 1 });
                    setShowResume(true);
                }
            } catch { /* ignore */ }
        });
    }, [isEdit, draftKey]);

    // ── Carregar para edição ────────────────────────────────────
    useEffect(() => {
        if (!isEdit || !editId) return;
        if (authLoading) return;
        if (!isAuthenticated || !accessToken) {
            setLoading(false);
            return;
        }
        (async () => {
            setLoading(true);
            try {
                const res = await fetch(`${API_BASE}/itineraries/${editId}/creator`, {
                    headers: { Authorization: `Bearer ${accessToken}` },
                });
                if (res.status === 403) throw new Error('You don\'t have permission to edit this itinerary.');
                if (res.status === 401) throw new Error('Sign in to edit this itinerary.');
                if (!res.ok) throw new Error('Itinerary not found');
                const data = await res.json();
                setForm(deserializeFromApi(data));
            } catch (e: any) {
                // notify() em vez de Alert.alert pra funcionar no Expo Web também
                // (Alert.alert é no-op no web → "página quebrada" silenciosa).
                notify({
                    title: 'Couldn\'t load',
                    message: e?.message || 'We couldn\'t open the itinerary.',
                    variant: 'error',
                    onDismiss: () => safeBack(router, '/created-itineraries'),
                });
            } finally {
                setLoading(false);
            }
        })();
    }, [isEdit, editId, accessToken, authLoading, isAuthenticated, router]);

    // ── Salvar draft local ──────────────────────────────────────
    const saveDraftLocal = useCallback((f: ItineraryFormState, s: number) => {
        if (isEdit) return;
        if (!draftKey) return;
        AsyncStorage.setItem(draftKey, JSON.stringify({ form: f, step: s })).catch(() => {});
    }, [isEdit, draftKey]);

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
            notify({
                title: 'Proof required',
                message: 'Upload a file that proves you were at the destination (airline ticket, hotel receipt, stamped passport, etc.) to continue.',
                variant: 'warning',
            });
            return;
        }
        const ns = Math.min(step + 1, totalSteps);
        setStep(ns);
        saveDraftLocal(form, ns);
    }, [step, stepKey, isLastStep, totalSteps, form, saveDraftLocal]);

    const goBack = useCallback(() => {
        haptics.light();
        if (step === 1) { safeBack(router, '/created-itineraries'); return; }
        const ns = step - 1;
        setStep(ns);
        saveDraftLocal(form, ns);
    }, [step, form, router, saveDraftLocal]);

    // ── Envio para análise ──────────────────────────────────────
    function hasPendingLocalUpload(f: ItineraryFormState): boolean {
        const urls = [
            f.travelProofUrl,
            ...f.highlightPhotos,
            ...f.images,
            ...f.mediaUrls,
            ...[f.flightCost, ...f.accommodations.map(a => a.cost), ...f.attractions.map(a => a.cost),
                ...f.transports.map(t => t.cost), ...f.restaurants.map(r => r.cost), ...f.extraSpendingItems.map(e => e.cost)]
                .flatMap(cost => cost?.proofFiles?.map(file => file.url) ?? []),
        ].filter(Boolean) as string[];
        return urls.some(url => /^(file|blob|content):/i.test(url));
    }

    async function submit() {
        if (!accessToken) {
            notify({ title: 'Session expired', message: 'Sign in again to submit the itinerary.', variant: 'warning' });
            return;
        }
        if (submitting) return;
        const issues = validateForSubmission(form);
        if (issues.length) {
            // Na etapa Revisão (última), o card de pendências já está visível.
            // Navegamos direto para a etapa da primeira pendência para o
            // roteirista corrigir sem precisar adivinhar onde está o problema.
            if (isLastStep) {
                haptics.error?.();
                const firstIssue = issues[0];
                notify({
                    title: 'Fix the open items before submitting',
                    message: firstIssue.message,
                });
                const targetKey = ISSUE_SECTION_TO_STEP[firstIssue.section];
                if (targetKey) {
                    const targetIndex = steps.indexOf(targetKey);
                    if (targetIndex >= 0) {
                        setStep(targetIndex + 1);
                        scrollRef.current?.scrollTo({ y: 0, animated: true });
                        return;
                    }
                }
                scrollRef.current?.scrollTo({ y: 0, animated: true });
            } else {
                notify({
                    title: 'A few things are missing',
                    message: issues.map(i => `• ${i.message}`).join('\n'),
                });
            }
            return;
        }
        if (hasPendingLocalUpload(form)) {
            notify({
                title: 'Upload in progress',
                message: 'Wait for the files to finish uploading before submitting for review.',
            });
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
                const fallback = res.status === 401
                    ? 'You need to be signed in to submit the itinerary.'
                    : res.status === 400
                        ? 'There is invalid information in the itinerary. Review the highlighted fields.'
                        : 'We couldn\'t submit the itinerary for review right now. Please try again.';
                throw new Error(err?.error || fallback);
            }
            haptics.success();
            if (draftKey) await AsyncStorage.removeItem(draftKey);
            router.replace('/await-review');
        } catch (e: any) {
            haptics.error?.();
            notify({ title: 'Couldn\'t submit', message: e?.message || 'We couldn\'t submit it.', variant: 'error' });
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
            //
            // PRIVACIDADE: travelProofUrl é o comprovante de viagem (admin-only).
            // Removemos do payload da prévia para garantir que nenhum render
            // futuro vaze por acidente. proofFiles dentro dos módulos seguem
            // o mesmo princípio — só usamos os 3 campos públicos de mídia.
            const { travelProofUrl: _omitProof, ...publicForm } = form;
            // Normaliza arrays de mídia: garante string[] mesmo se o estado
            // legado ou erros vierem com itens não-string. Isto blinda o
            // CoverCarousel/MediaGallery contra entradas {url}, null, etc.
            const normalizeUrls = (v: unknown): string[] =>
                Array.isArray(v)
                    ? v.map((x: any) => (typeof x === 'string' ? x : (x?.url ?? '')))
                        .filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
                    : [];
            const payload = {
                ...publicForm,
                highlightPhotos: normalizeUrls(form.highlightPhotos),
                images: normalizeUrls(form.images),
                mediaUrls: normalizeUrls(form.mediaUrls),
            };
            if (!previewKey) {
                notify({ title: 'Session expired', message: 'Sign in to see the preview.', variant: 'warning' });
                return;
            }
            await AsyncStorage.setItem(previewKey, JSON.stringify(payload));
            router.push('/itinerary-preview');
        } catch (e: any) {
            notify({ title: 'Error', message: e?.message || 'We couldn\'t open the preview.', variant: 'error' });
        }
    }

    // ── Salvar rascunho (sai sem enviar) ────────────────────────
    async function saveDraft() {
        if (!accessToken) { notify({ title: 'Session expired', message: 'Sign in to save.', variant: 'warning' }); return; }
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
                throw new Error(errBody?.error || `Error ${draftRes.status} saving draft`);
            }
            if (draftKey) await AsyncStorage.removeItem(draftKey);
            router.replace('/created-itineraries');
        } catch (e: any) {
            notify({ title: 'Error', message: e?.message || 'We couldn\'t save the draft.', variant: 'error' });
        } finally {
            setSaving(false);
        }
    }

    if (authLoading || loading) {
        return (
            <View style={[s.root, { alignItems: 'center', justifyContent: 'center' }]}>
                <ActivityIndicator color={theme.colors.primary} />
            </View>
        );
    }

    if (!isAuthenticated || !accessToken) {
        return (
            <View style={[s.root, s.authState]}>
                <StatusBar barStyle="dark-content" />
                <Ionicons name="lock-closed-outline" size={44} color={theme.colors.text.tertiary} />
                <Text style={s.authTitle}>Sign-in required</Text>
                <Text style={s.authText}>Sign in to your account to create, save or edit digital itineraries.</Text>
                <TouchableOpacity
                    style={s.authButton}
                    onPress={() => router.replace({ pathname: '/login' as any, params: { next: '/new-itinerary' } })}
                >
                    <Text style={s.authButtonText}>Sign in</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={s.root}>
            <StatusBar barStyle="dark-content" />

            {/* Modal retomar rascunho */}
            {/* onRequestClose = opção segura "Continuar" (preserva o rascunho) */}
            <Modal
                visible={showResume}
                transparent
                animationType="fade"
                onRequestClose={() => {
                    if (pendingDraft) {
                        setForm(pendingDraft.form);
                        setStep(pendingDraft.step);
                    }
                    setShowResume(false);
                    setPendingDraft(null);
                }}
            >
                <View style={s.modalBg}>
                    <View style={s.modalCard}>
                        <Text style={s.modalTitle}>Continue draft?</Text>
                        <Text style={s.modalText}>
                            You have an itinerary in progress. Want to pick up where you left off?
                        </Text>
                        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                            <TouchableOpacity
                                style={s.modalBtnGhost}
                                onPress={() => {
                                    if (draftKey) AsyncStorage.removeItem(draftKey);
                                    setShowResume(false);
                                    setPendingDraft(null);
                                }}>
                                <Text style={s.modalBtnGhostText}>Start new</Text>
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
                                <Text style={s.modalBtnPrimaryText}>Continue</Text>
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
                    <Text style={s.headerStep}>
                        {isEdit ? 'Edit itinerary · ' : ''}Step {step} of {totalSteps} · Score {score}
                    </Text>
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
                    {stepKey === 'voo'          && <StepFlight       form={form} update={updateForm} token={accessToken} />}
                    {stepKey === 'hospedagem'   && <StepAccommodations form={form} update={updateForm} token={accessToken} />}
                    {stepKey === 'passeios'     && <StepAttractions  form={form} update={updateForm} token={accessToken} />}
                    {stepKey === 'transporte'   && <StepTransport    form={form} update={updateForm} token={accessToken} />}
                    {stepKey === 'dicas'        && <StepTips         form={form} update={updateForm} />}
                    {stepKey === 'restaurantes' && <StepRestaurants  form={form} update={updateForm} token={accessToken} />}
                    {stepKey === 'checklist'    && <StepChecklist    form={form} update={updateForm} />}
                    {stepKey === 'gastos_extras' && <StepExtraSpending form={form} update={updateForm} token={accessToken} />}
                    {stepKey === 'media'        && <StepMedia        form={form} update={updateForm} token={accessToken} />}
                    {stepKey === 'review'       && <StepReview       form={form} onPreview={openPreview} onFixIssue={(section) => {
                        const targetKey = ISSUE_SECTION_TO_STEP[section];
                        if (!targetKey) return;
                        const targetIndex = steps.indexOf(targetKey);
                        if (targetIndex >= 0) {
                            haptics.light();
                            setStep(targetIndex + 1);
                            scrollRef.current?.scrollTo({ y: 0, animated: true });
                        }
                    }} />}
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
                                            ? `Fix ${submissionIssues.length} open item${submissionIssues.length > 1 ? 's' : ''}`
                                            : (isEdit ? 'Submit changes for review' : 'Submit for review'))
                                        : 'Next'}
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
                                ? '1 required field is still open. Review the modules marked above.'
                                : `${submissionIssues.length} required fields are still open. Review the modules marked above.`}
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

/**
 * Normaliza um link informado pelo usuário:
 *   "www.example.com"     → "https://www.example.com"
 *   "example.com/x"       → "https://example.com/x"
 *   "http://example.com"  → mantido
 *   "https://example.com" → mantido
 *   ""                    → ""
 * Não valida estrutura — só garante esquema. Para validação real,
 * use validateOptionalUrl().
 */
function normalizeUrl(raw: string): string {
    const s = (raw || '').trim();
    if (!s) return '';
    if (/^https?:\/\//i.test(s)) return s;
    return `https://${s}`;
}

function validateOptionalUrl(raw: string): boolean {
    const s = (raw || '').trim();
    if (!s) return true; // campo opcional
    try {
        const normalized = normalizeUrl(s);
        const u = new URL(normalized);
        return !!u.hostname && u.hostname.includes('.');
    } catch {
        return false;
    }
}

/**
 * Quando o usuário escolhe uma "data de fim" anterior à "data de início",
 * empurramos a data de fim para igualar a de início e notificamos. Mantém
 * o setter genérico — basta passar a key correta (ex: 'endDate').
 *
 * Retorna o ISO efetivamente aplicado (igual a startDate se houve clamp).
 */
function clampEndAfterStart(startIso: string, endIso: string): { iso: string; clamped: boolean } {
    if (!startIso || !endIso) return { iso: endIso, clamped: false };
    const start = parseISODate(startIso);
    const end = parseISODate(endIso);
    if (!start || !end) return { iso: endIso, clamped: false };
    if (end.getTime() < start.getTime()) {
        return { iso: startIso, clamped: true };
    }
    return { iso: endIso, clamped: false };
}

function DatePickerField({
    label, value, onChange, required, placeholder = 'Select date',
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
    const webInputRef = useRef<any>(null);
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

    // Web: input nativo HTML invisível sobreposto à área tocável. O clique
    // cai no <input>, que tenta showPicker() (Chrome/Edge modernos) e, como
    // fallback, abre o picker via foco/clique normal. Sem Modal.
    if (Platform.OS === 'web') {
        return (
            <View style={s.pickerFieldWrap}>
                <Text style={s.label}>
                    {label}
                    {required && <Text style={s.requiredAsterisk}> *</Text>}
                </Text>
                <View style={{ position: 'relative', flexDirection: 'row', alignItems: 'stretch', gap: 6 }}>
                    {/* @ts-ignore — div nativo com :focus-within ring para a11y de teclado */}
                    <div
                        style={{
                            flex: 1,
                            position: 'relative',
                            borderRadius: 12,
                        }}
                        className="vamo-picker-focus-ring"
                    >
                        <View style={[s.pickerFieldTouchable, { flex: 1, position: 'relative' }]}>
                            <Ionicons name="calendar-outline" size={16} color={theme.colors.primary} />
                            <Text style={[s.pickerFieldText, !value && s.pickerFieldPlaceholder]}>
                                {display || placeholder}
                            </Text>
                            {/* @ts-ignore — input HTML nativo no Expo Web */}
                            <input
                                ref={webInputRef}
                                type="date"
                                aria-label={label}
                                value={value || ''}
                                onChange={(e: any) => onChange(e?.target?.value || '')}
                                onClick={() => { try { webInputRef.current?.showPicker?.(); } catch {} }}
                                style={{
                                    position: 'absolute',
                                    inset: 0,
                                    opacity: 0,
                                    cursor: 'pointer',
                                    width: '100%',
                                    height: '100%',
                                    border: 'none',
                                    background: 'transparent',
                                }}
                            />
                        </View>
                    {/* @ts-ignore */}
                    </div>
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
            </View>
        );
    }

    return (
        <View style={s.pickerFieldWrap}>
            <Text style={s.label}>
                {label}
                {required && <Text style={s.requiredAsterisk}> *</Text>}
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
                                locale="en-US"
                            />
                            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                                <TouchableOpacity style={s.modalBtnGhost} onPress={() => setOpen(false)}>
                                    <Text style={s.modalBtnGhostText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={s.modalBtnPrimary}
                                    onPress={() => {
                                        onChange(toISODate(tempDate));
                                        setOpen(false);
                                    }}
                                >
                                    <Text style={s.modalBtnPrimaryText}>Confirm</Text>
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
        </View>
    );
}

function TimePickerField(props: {
    label: string;
    value: string; // HH:MM
    onChange: (hhmm: string) => void;
    required?: boolean;
    placeholder?: string;
}) {
    return <VamoTimePicker {...props} minuteStep={5} />;
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
    const hasUnits = !!(unit && onUnitChange && units && units.length > 0);
    return (
        <View style={hasUnits ? { gap: 8 } : undefined}>
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
        </View>
            {/* Unidade visível como opções lado a lado (antes era um toque que
                alternava escondido entre min/h/d e ninguém percebia). */}
            {hasUnits && (
                <View style={s.unitSeg} accessibilityRole="radiogroup">
                    {units!.map(u => {
                        const active = u === unit;
                        return (
                            <TouchableOpacity
                                key={u}
                                style={[s.unitSegItem, active && s.unitSegItemActive]}
                                onPress={() => onUnitChange!(u)}
                                activeOpacity={0.8}
                                accessibilityRole="radio"
                                accessibilityState={{ selected: active }}
                            >
                                <Text style={[s.unitSegText, active && s.unitSegTextActive]}>{UNIT_LABELS[u] ?? u}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            )}
        </View>
    );
}

const UNIT_LABELS: Record<string, string> = { min: 'Minutes', h: 'Hours', d: 'Days' };

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

const EXTRA_SPENDING_ICON_MAP: Record<string, LucideIcon> = {
    internet:       Wifi,
    seguro:         Shield,
    taxas:          Landmark,
    visto:          FileText,
    lavanderia:     Shirt,
    guardavolume:   Package,
    gorjetas:       Coins,
    compras:        ShoppingBag,
    bagagem:        Luggage,
    aluguel:        Wrench,
    farmacia:       Pill,
    estacionamento: Car,
    outros:         Sparkles,
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
    const [budgetHelpOpen, setBudgetHelpOpen] = useState(false);
    // Estilo de orçamento é ESCOLHA ÚNICA — lê o primeiro válido (compat legado).
    const selectedBudget = getPrimaryBudgetStyle(form.travelStyles);
    const budgetGuide = getBudgetStyleGuide(selectedBudget);

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
                title="Identity & Discoverability"
                subtitle="Title, destination and categories — what travelers see first in the storefront."
            />
            <FormInput
                label="Itinerary Title"
                required
                placeholder='E.g. "Authentic Japan: 15 days of food, temples and living culture"'
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
                                label={locIdx === 0 ? 'Country *' : `Country ${locIdx + 1}`}
                                placeholder={locIdx === 0 ? 'Type or select the country...' : 'Type the country...'}
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
                                    placeholder={locIdx === 0 && cityIdx === 0 ? 'City *' : 'City...'}
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
                            <Text style={s.addCityText}>City</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ))}

            <TouchableOpacity style={s.addCountryBtn} onPress={addCountry}>
                <Text style={s.addCountryText}>+ Add Country</Text>
            </TouchableOpacity>

            <Text style={s.label}>Duration (days) <Text style={s.requiredAsterisk}>*</Text></Text>
            <QuantityStepper
                value={form.duration || 1}
                onChange={v => update('duration', Math.max(1, v))}
                min={1}
                max={365}
            />

            <View style={s.formGroup}>
                <Text style={s.label}>About the Itinerary</Text>
                <TextInput
                    style={s.textArea}
                    placeholder="Sell your itinerary: what unique experience did you have? What problem do you solve for the traveler? Why is this itinerary different from everything they find on Google?"
                    placeholderTextColor={theme.colors.text.disabled}
                    value={form.description}
                    onChangeText={v => update('description', v)}
                    multiline
                    numberOfLines={5}
                    textAlignVertical="top"
                />
                <Text style={s.charCounter}>{form.description.length} caracteres</Text>
            </View>

            <View style={s.budgetLabelRow}>
                <Text style={[s.label, { marginBottom: 0, flexShrink: 1 }]}>
                    What's the budget style of this itinerary?
                </Text>
                <TouchableOpacity
                    onPress={() => setBudgetHelpOpen(true)}
                    hitSlop={8}
                    accessibilityLabel="See VAMO's criteria for budget style"
                    style={s.budgetHelpBtn}
                >
                    <Ionicons name="help-circle-outline" size={20} color={theme.colors.primary} />
                </TouchableOpacity>
            </View>
            <Text style={s.budgetSubtitle}>{BUDGET_STYLE_CREATOR_SUBTITLE}</Text>
            {/* Escolha ÚNICA — selecionar uma opção substitui a anterior. */}
            <View style={s.chipRow}>
                {STYLE_OPTIONS.map(st => {
                    const active = selectedBudget === st.key;
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
            {budgetGuide ? (
                <View style={s.budgetHint}>
                    <Ionicons name="bulb-outline" size={14} color={theme.colors.primary} style={{ marginTop: 1 }} />
                    <Text style={s.budgetHintText}>{budgetGuide.creatorHint}</Text>
                </View>
            ) : null}

            <BudgetStyleGuideSheet
                visible={budgetHelpOpen}
                onClose={() => setBudgetHelpOpen(false)}
                highlightKey={selectedBudget}
            />

            <Text style={s.label}>Theme Categories (min 1, max {MAX_CATEGORIES}) — {form.categories.length}/{MAX_CATEGORIES}</Text>
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
                        <Text style={s.highlightsTitle}>Trip Highlights</Text>
                        <View style={s.moduleStepBadgeOpt}>
                            <Text style={s.moduleStepBadgeOptText}>Optional</Text>
                        </View>
                    </View>
                    <Text style={s.highlightsSubtitle}>
                        The unique moments that set your itinerary apart
                    </Text>
                </View>
            </View>

            {form.highlights.length === 0 && (
                <View style={s.highlightsEmptyCard}>
                    <Star size={36} strokeWidth={1.6} color={theme.colors.primary + 'AA'} />
                    <Text style={s.highlightsEmptyTitle}>What were the unforgettable moments?</Text>
                    <Text style={s.highlightsEmptyText}>
                        List the unique experiences only your itinerary offers — it's what catches attention in the storefront.
                    </Text>
                </View>
            )}

            <EditableList
                items={form.highlights}
                onItemsChange={items => update('highlights', items)}
                placeholder="E.g. Dinner at a restaurant with a view of Mount Fuji at sunset..."
            />
        </View>
    );
}

// ═══════════════════════════════════════════════════════════════════
// STEP 2 — COMPROVANTE
// ═══════════════════════════════════════════════════════════════════

function StepProof({ form, update, token }: StepProps & { token: string | null | undefined }) {
    const [uploading, setUploading] = useState(false);
    const [uploadStage, setUploadStage] = useState<'idle' | 'preparing' | 'uploading'>('idle');
    const [error, setError] = useState<string | null>(null);
    const [meta, setMeta] = useState<{ name: string; size?: number } | null>(null);

    async function pickProof() {
        setError(null);
        try {
            const res = await DocumentPicker.getDocumentAsync({
                type: acceptAttributeFor('travelProof'),
                multiple: false,
                copyToCacheDirectory: true,
            });
            if (res.canceled || !res.assets?.[0]) return;
            const asset = res.assets[0];
            const name = asset.name || asset.uri.split('/').pop()?.split('?')[0] || `proof-${Date.now()}`;
            const size = asset.size;
            const mime = asset.mimeType;

            // Valida formato + tamanho no contexto travelProof
            // (aceita imagens incl. HEIC, ou PDF; até 25 MB).
            setUploading(true);
            setUploadStage('preparing');
            const validation = validateUploadFile(
                { uri: asset.uri, filename: name, mime, size },
                'travelProof',
            );
            if (!validation.valid) { setError(validation.reason); return; }

            console.log('[proof] arquivo selecionado', { name, size, mime, uri: asset.uri.slice(0, 80) });
            setMeta({ name, size });
            setUploadStage('uploading');
            const url = await uploadOne(asset.uri, token, name, mime, 'travelProof');
            update('travelProofUrl', url);
        } catch (e: any) {
            const msg = e?.message || 'We couldn\'t upload the file. Check your connection and try again.';
            console.warn('[proof] erro:', msg);
            setError(msg);
            setMeta(null);
        } finally {
            setUploading(false);
            setUploadStage('idle');
        }
    }

    function removeProof() {
        update('travelProofUrl', '');
        setMeta(null);
        setError(null);
    }

    const hasProof = !!form.travelProofUrl;
    // Detecta se é PDF a partir da URL salva
    const proofLower = form.travelProofUrl.split('?')[0].toLowerCase();
    const isPdf = hasProof && proofLower.endsWith('.pdf');
    const isHeic = hasProof && /\.(heic|heif)$/i.test(proofLower);

    return (
        <View>
            <SectionHeader
                title="Proof of travel"
                subtitle="Attach a document that proves you were at the destination. Required to submit for review."
            />

            {/* Aviso explicativo — inspirado no bloco da versão web */}
            <View style={s.proofInfoCard}>
                <View style={s.proofInfoIconWrap}>
                    <Ionicons name="warning-outline" size={20} color="#ea580c" />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={s.proofInfoTitle}>Proof of Travel</Text>
                    <Text style={s.proofInfoText}>
                        To ensure the authenticity of itineraries on VAMO, we ask for at least one document showing you were at the destination (e.g. an airline ticket in your name, hotel receipt, invoice or stamped passport).{' '}
                        <Text style={{ fontWeight: '700' }}>This document is kept confidential by moderators</Text>
                        {' '}and <Text style={{ fontWeight: '700' }}>will not</Text> appear publicly.
                    </Text>
                </View>
            </View>

            {/* Label com badge de obrigatoriedade */}
            <View style={s.proofLabelRow}>
                <Text style={s.proofLabelText}>Proof File</Text>
                <View style={s.proofObrigBadge}>
                    <Text style={s.proofObrigText}>REQUIRED</Text>
                </View>
            </View>

            {hasProof ? (
                <View style={s.proofCard}>
                    {isPdf || isHeic ? (
                        <View style={[s.proofImg, { alignItems: 'center', justifyContent: 'center', backgroundColor: '#fef3c7' }]}>
                            <Ionicons name={isPdf ? 'document-text' : 'image-outline'} size={28} color="#92400e" />
                        </View>
                    ) : (
                        <Image source={{ uri: form.travelProofUrl }} style={s.proofImg} resizeMode="cover" />
                    )}
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={s.proofText} numberOfLines={1}>
                            <Ionicons name="checkmark-circle" size={14} color={theme.colors.success} />
                            {' '}Proof uploaded
                        </Text>
                        {meta?.name && (
                            <Text style={{ fontSize: 11, color: theme.colors.text.tertiary }} numberOfLines={1}>
                                {meta.name}{meta.size ? ` · ${(meta.size / 1024).toFixed(0)} KB` : ''}
                            </Text>
                        )}
                    </View>
                    <TouchableOpacity onPress={pickProof} disabled={uploading} style={{ marginRight: 12 }}>
                        <Text style={{ color: theme.colors.primary, fontWeight: '600', fontSize: 13 }}>Replace</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={removeProof} disabled={uploading}>
                        <Text style={{ color: theme.colors.error, fontWeight: '600', fontSize: 13 }}>Remove</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <TouchableOpacity style={s.uploadBox} onPress={pickProof} disabled={uploading} activeOpacity={0.7}>
                    {uploading ? (
                        <>
                            <ActivityIndicator color={theme.colors.primary} />
                            <Text style={s.uploadText}>
                                {uploadStage === 'preparing' ? 'Preparing file...' : 'Sending...'}
                            </Text>
                            {meta?.name && (
                                <Text style={s.uploadHint} numberOfLines={1}>{meta.name}</Text>
                            )}
                        </>
                    ) : (
                        <>
                            <Ionicons name="cloud-upload-outline" size={36} color={theme.colors.primary} />
                            <Text style={s.uploadText}>Select File</Text>
                            <Text style={s.uploadHint}>{uploadHint('travelProof')}</Text>
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
            <SectionHeader title="Pricing Structure" subtitle="Set the price of your itinerary." />

            <MoneyInput
                label="Price"
                required
                placeholder="E.g. 89.90"
                value={form.price > 0 ? form.price : ''}
                onChangeNumber={n => update('price', Math.max(0, n))}
            />

            {/* Aviso automático — produto digital */}
            <View style={s.commerceWarningCard}>
                <Ionicons name="warning-outline" size={16} color="#ea580c" style={{ marginTop: 1 }} />
                <Text style={s.commerceWarningText}>
                    Automatic notice: <Text style={{ fontStyle: 'italic' }}>"Digital product. Does not include tourism services."</Text>
                </Text>
            </View>

            {/* Acesso offline — característica automática do produto */}
            <View style={s.commerceOfflineCard}>
                <Ionicons name="wifi-outline" size={16} color={theme.colors.primary} style={{ marginTop: 1 }} />
                <Text style={s.commerceOfflineText}>
                    <Text style={{ fontWeight: '700', color: theme.colors.primary }}>Offline Access: </Text>
                    After purchase, travelers can open the full itinerary even without an internet connection.
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
                    <Text style={s.stepTitle}>Itinerary Modules</Text>
                    <Text style={s.stepHint}>What's included — buyers decide based on the active modules</Text>
                </View>
                <View style={s.modulesObrigBadge}>
                    <Text style={s.modulesObrigText}>Required</Text>
                </View>
            </View>

            <Text style={s.modulesIntro}>
                Turn on the modules to include in the itinerary. Active modules need at least 1 item filled in.
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
    return { dayNumber: n, title: `Day ${n}`, summary: '', description: '', activities: [] };
}

function dayHasContent(d: Day): boolean {
    return !!(d.description?.trim() || d.title?.trim() || (d.activities && d.activities.length > 0));
}
// `dayIsComplete` agora vem de `@vamo/shared/itinerary` — fonte única
// de verdade entre o form (UI) e a validação de envio.

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
        void (async () => {
            const ok = await confirm({
                title: 'Shorten the itinerary?',
                message: `You shortened the duration to ${duration} day${duration > 1 ? 's' : ''}, but ${toRemove.length === 1 ? 'day' : 'days'} ${toRemove.map((_, i) => duration + i + 1).join(', ')} already ${toRemove.length === 1 ? 'has' : 'have'} information filled in.`,
                confirmText: 'Remove days',
                cancelText: 'Keep extra days',
                destructive: true,
                // Lixeira (default do danger) sugeria excluir o roteiro todo;
                // o que se remove aqui são DIAS do calendário.
                icon: 'calendar-outline',
            });
            if (ok) {
                update('days', form.days.slice(0, duration).map((d, i) => ({ ...d, dayNumber: i + 1 })));
            }
        })();
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
                title="Daily itinerary"
                subtitle="Complete day-by-day plan"
                hint="Build the plan day by day for the duration you set. Each day needs a description and at least 1 activity."
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
                const titleStripped = (d.title || '').replace(new RegExp(`^(?:Dia|Day)\\s*${i + 1}\\s*(?:-|—)?\\s*`, 'i'), '');
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
                                        ? `${d.activities.length} activit${d.activities.length === 1 ? 'y' : 'ies'} · complete`
                                        : !d.description?.trim()
                                            ? 'Missing description'
                                            : d.activities.length === 0
                                                ? 'Missing activity'
                                                : 'Activity without a title'}
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
                                    label="Day title"
                                    placeholder="E.g. Eiffel Tower and Trocadéro"
                                    value={titleStripped}
                                    onChangeText={v => updateDay(i, { title: v })}
                                />
                                <FormInput
                                    label="What to expect that day..."
                                    required
                                    placeholder="E.g. Morning of sightseeing downtown and a free afternoon"
                                    multiline numberOfLines={3}
                                    style={{ minHeight: 80, textAlignVertical: 'top' }}
                                    value={d.description}
                                    onChangeText={v => updateDay(i, { description: v })}
                                />

                                <Text style={s.label}>Activities ({d.activities.length})</Text>
                                {d.activities.map((a, ai) => {
                                    const { num, unit } = parseActivityDuration(a.duration);
                                    return (
                                        <View key={ai} style={s.activityCard}>
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Text style={s.activityBadge}>Activity {ai + 1}</Text>
                                                <TouchableOpacity onPress={() => removeActivity(i, ai)}>
                                                    <Ionicons name="trash-outline" size={18} color={theme.colors.error} />
                                                </TouchableOpacity>
                                            </View>
                                            <FormInput
                                                label="What to do"
                                                required
                                                placeholder="E.g. Visit the Louvre Museum"
                                                value={a.title}
                                                onChangeText={v => updateActivity(i, ai, { title: v })}
                                            />
                                            <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
                                                <TimePickerField
                                                    label="Time"
                                                    value={a.time}
                                                    onChange={v => updateActivity(i, ai, { time: v })}
                                                    placeholder="09:00"
                                                />
                                                <View>
                                                    <Text style={s.label}>Duration</Text>
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
                                                label="Place name or address"
                                                placeholder="E.g. 250 Main Street"
                                                value={a.location}
                                                onChangeText={v => updateActivity(i, ai, { location: v })}
                                            />
                                            <FormInput
                                                label="Location link (Google Maps)"
                                                placeholder="E.g. https://goo.gl/maps/..."
                                                autoCapitalize="none"
                                                value={a.mapLink}
                                                onChangeText={v => updateActivity(i, ai, { mapLink: v })}
                                            />
                                            <FormInput
                                                label="Optional tip"
                                                placeholder="E.g. Try to arrive 20 minutes early to avoid lines"
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
                                    <Text style={s.addInlineText}>Add activity</Text>
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
                                {required ? 'Required' : 'Optional'}
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

function StepAccommodations({ form, update, token }: StepProps) {
    return (
        <View>
            <ModuleStepHeader
                icon={Building2}
                title="Lodging"
                subtitle="Recommended hotels and stays — the most-checked item before buying"
                hint="Add at least 1 lodging with a name to complete this module."
            />
            <Repeater
                title="Lodging added"
                items={form.accommodations}
                onChange={v => update('accommodations', v)}
                factory={emptyAccommodation}
                render={(item, set) => (
                    <>
                        <FormInput label="Hotel / hostel name" required placeholder="E.g. Waldorf Astoria" value={item.name} onChangeText={v => set({ name: v })} />
                        <HotelStarsInput value={item.rating} onChange={v => set({ rating: v })} />
                        <FormInput label="Place name or address" placeholder="E.g. 228 Rue de Rivoli" value={item.address} onChangeText={v => set({ address: v })} />
                        <FormInput label="Location link (Google Maps)" placeholder="E.g. https://goo.gl/maps/..." autoCapitalize="none" value={item.mapLink} onChangeText={v => set({ mapLink: v })} />
                        <Text style={s.label}>Nights <Text style={s.requiredAsterisk}>*</Text></Text>
                        <QuantityStepper
                            value={Math.max(1, parseInt(item.nights, 10) || 1)}
                            onChange={n => set({ nights: String(Math.max(1, n)) })}
                            min={1}
                            max={365}
                        />
                        <FormInput
                            label="What makes this lodging special?"
                            placeholder="E.g. The location is excellent next to the main subway station and the breakfast..."
                            multiline value={item.description}
                            onChangeText={v => set({ description: v })}
                            style={{ minHeight: 60, textAlignVertical: 'top' }}
                        />
                        <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
                            <DatePickerField label="Check-in"  value={item.startDate} onChange={v => {
                                const next: Partial<Accommodation> = { startDate: v };
                                // Se já existe um check-out anterior à nova data de início, ajusta.
                                if (item.endDate && v) {
                                    const r = clampEndAfterStart(v, item.endDate);
                                    if (r.clamped) {
                                        next.endDate = r.iso;
                                        notify({ title: 'Date adjusted', message: 'The end date can\'t be before the start date.' });
                                    }
                                }
                                set(next);
                            }} />
                            <DatePickerField label="Check-out" value={item.endDate}   onChange={v => {
                                const r = clampEndAfterStart(item.startDate, v);
                                if (r.clamped) {
                                    notify({ title: 'Date adjusted', message: 'The end date can\'t be before the start date.' });
                                }
                                set({ endDate: r.iso });
                            }} />
                        </View>
                        <FormInput
                            label="Lodging link"
                            placeholder="E.g. Booking, hotel website, Airbnb"
                            autoCapitalize="none"
                            autoCorrect={false}
                            keyboardType="url"
                            value={item.externalLink}
                            onChangeText={v => set({ externalLink: v })}
                            onBlur={() => {
                                if (item.externalLink && !validateOptionalUrl(item.externalLink)) {
                                    notify({ title: 'Invalid link', message: 'Enter a valid link or leave the field blank.' });
                                } else if (item.externalLink) {
                                    const normalized = normalizeUrl(item.externalLink);
                                    if (normalized !== item.externalLink) set({ externalLink: normalized });
                                }
                            }}
                        />
                        <FormInput
                            label="Extra tip"
                            placeholder="E.g. Ask for a room on the top floor for a view..."
                            multiline value={item.tips}
                            onChangeText={v => set({ tips: v })}
                            style={{ minHeight: 50, textAlignVertical: 'top' }}
                        />
                        <CostBlock
                            cost={item.cost}
                            legacySpending={item.spending}
                            onChange={c => set({ cost: c, spending: costToLegacySpending(c) })}
                            defaultCurrency={form.currency || BASE_CURRENCY}
                            helperShort="Cost per person for the stay. Proof (booking, receipt) builds trust."
                            encourageProof
                            uploadProof={(uri, name, mime) => uploadOne(uri, token, name, mime, 'costProof')}
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

function StepAttractions({ form, update, token }: StepProps) {
    return (
        <View>
            <ModuleStepHeader
                icon={Ticket}
                title="Tours & Attractions"
                subtitle="Must-do tours with times, prices and experience tips"
                hint="Add at least 1 attraction with a name to complete this module."
            />
            <Repeater
                title="Attractions added"
                items={form.attractions}
                onChange={v => update('attractions', v)}
                factory={emptyAttraction}
                render={(item, set) => {
                    const { num, unit } = parseActivityDuration(item.duration);
                    return (
                        <>
                            <FormInput label="Attraction name" required placeholder="E.g. Eiffel Tower" value={item.name} onChangeText={v => set({ name: v })} />
                            <FormInput label="Place name or address" placeholder="E.g. Champ de Mars, 5 Ave..." value={item.location} onChangeText={v => set({ location: v })} />
                            <FormInput label="Google Maps link" placeholder="E.g. https://goo.gl/maps/..." autoCapitalize="none" value={item.mapLink} onChangeText={v => set({ mapLink: v })} />
                            <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
                                <DatePickerField label="Start Date" value={item.startDate} onChange={v => {
                                    const next: Partial<AttractionItem> = { startDate: v };
                                    if (item.endDate && v) {
                                        const r = clampEndAfterStart(v, item.endDate);
                                        if (r.clamped) {
                                            next.endDate = r.iso;
                                            notify({ title: 'Date adjusted', message: 'The end date can\'t be before the start date.' });
                                        }
                                    }
                                    set(next);
                                }} />
                                <DatePickerField label="End Date"    value={item.endDate}   onChange={v => {
                                    const r = clampEndAfterStart(item.startDate, v);
                                    if (r.clamped) {
                                        notify({ title: 'Date adjusted', message: 'The end date can\'t be before the start date.' });
                                    }
                                    set({ endDate: r.iso });
                                }} />
                            </View>
                            <Text style={s.label}>Duration</Text>
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
                                label="Description / Why you recommend it"
                                required
                                placeholder="E.g. An unmissable view..."
                                multiline value={item.description}
                                onChangeText={v => set({ description: v })}
                                style={{ minHeight: 60, textAlignVertical: 'top' }}
                            />
                            <FormInput
                                label="Purchase or booking link"
                                placeholder="E.g. official site, ticket or booking"
                                hint="Where you bought, booked or recommend checking the attraction."
                                autoCapitalize="none"
                                autoCorrect={false}
                                keyboardType="url"
                                value={item.externalLink}
                                onChangeText={v => set({ externalLink: v })}
                                onBlur={() => {
                                    if (item.externalLink && !validateOptionalUrl(item.externalLink)) {
                                        notify({ title: 'Invalid link', message: 'Enter a valid link or leave the field blank.' });
                                    } else if (item.externalLink) {
                                        const normalized = normalizeUrl(item.externalLink);
                                        if (normalized !== item.externalLink) set({ externalLink: normalized });
                                    }
                                }}
                            />
                            {/* Horário recomendado: apenas o horário inicial.
                                Mantemos o formato "HH:MM" em item.hours para preservar o payload. */}
                            {(() => {
                                // Compat: payload antigo podia ter "HH:MM - HH:MM" (intervalo).
                                // Lemos apenas a 1a parte como horário recomendado.
                                const first = (item.hours || '').split(/\s*[-–]\s*/)[0]?.trim() || '';
                                const start = parseHHMM(first) ? first : '';
                                return (
                                    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                                        <TimePickerField
                                            label="Recommended time"
                                            value={start}
                                            onChange={v => set({ hours: v })}
                                            placeholder="9:00 AM"
                                        />
                                    </View>
                                );
                            })()}
                            <FormInput
                                label="Experience tip"
                                placeholder="E.g. Go near sunset..."
                                multiline value={item.tips}
                                onChangeText={v => set({ tips: v })}
                                style={{ minHeight: 50, textAlignVertical: 'top' }}
                            />
                            <CostBlock
                                cost={item.cost}
                                legacySpending={item.spending}
                                onChange={c => set({ cost: c, spending: costToLegacySpending(c) })}
                                defaultCurrency={form.currency || BASE_CURRENCY}
                                helperShort="Cost per person for the ticket/tour. For expensive tours, proof builds trust."
                                encourageProof
                                uploadProof={(uri, name, mime) => uploadOne(uri, token, name, mime, 'costProof')}
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

function StepTransport({ form, update, token }: StepProps) {
    return (
        <View>
            <ModuleStepHeader
                icon={Bus}
                title="Transportation"
                subtitle="How to get around the destination — transit, passes and mobility tips"
                hint="Add at least 1 transportation tip with a description and pass type."
            />
            <Repeater
                title="Transportation added"
                items={form.transports}
                onChange={v => update('transports', v)}
                factory={emptyTransport}
                render={(item, set) => (
                    <>
                        <FormInput
                            label="Transportation / pass description"
                            required
                            placeholder="E.g. JR Pass (Japan Rail Pass)"
                            value={item.description}
                            onChangeText={v => set({ description: v })}
                            multiline
                            style={{ minHeight: 60, textAlignVertical: 'top' }}
                        />
                        <FormInput
                            label="Pass / ticket type"
                            required
                            placeholder="E.g. National Weekly Pass (7 days)"
                            value={item.passTypes}
                            onChangeText={v => set({ passTypes: v })}
                        />
                        <DatePickerField label="Date" value={item.startDate} onChange={v => set({ startDate: v })} />
                        <FormInput
                            label="Additional notes and tips"
                            placeholder="E.g. Bring a passport-size photo..."
                            multiline value={item.notes}
                            onChangeText={v => set({ notes: v })}
                            style={{ minHeight: 50, textAlignVertical: 'top' }}
                        />
                        <CostBlock
                            cost={item.cost}
                            legacySpending={item.spending}
                            onChange={c => set({ cost: c, spending: costToLegacySpending(c) })}
                            defaultCurrency={form.currency || BASE_CURRENCY}
                            helperShort="Cost per person for the pass/transportation — optional. Use an estimate for local transit."
                            encourageProof
                            uploadProof={(uri, name, mime) => uploadOne(uri, token, name, mime, 'costProof')}
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

function StepRestaurants({ form, update, token }: StepProps) {
    return (
        <View>
            <ModuleStepHeader
                icon={Utensils}
                title="Restaurants & Dining"
                subtitle="Where to eat well — authentic, local dining experiences"
                hint="Add at least 1 restaurant with a name and location."
            />
            <Repeater
                title="Restaurants added"
                items={form.restaurants}
                onChange={v => update('restaurants', v)}
                factory={emptyRestaurant}
                render={(item, set) => (
                    <>
                        <FormInput label="Restaurant name" required placeholder="E.g. Le Jules Verne" value={item.name} onChangeText={v => set({ name: v })} />
                        <Text style={s.label}>Cuisine</Text>
                        <View style={s.chipRow}>
                            {CUISINE_OPTIONS.map(c => {
                                const active = getCuisineLabel(item.cuisine) === c;
                                return (
                                    <TouchableOpacity key={c} style={[s.chip, active && s.chipActive]} onPress={() => set({ cuisine: c })}>
                                        <Text style={[s.chipText, active && s.chipTextActive]}>{c}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                        <FormInput label="Location / Neighborhood" required placeholder="E.g. Montmartre" value={item.location} onChangeText={v => set({ location: v })} />
                        <FormInput label="Google Maps link" placeholder="E.g. https://goo.gl/maps/..." autoCapitalize="none" value={item.mapLink || ''} onChangeText={v => set({ mapLink: v })} />
                        <FormInput
                            label="Description / Why you recommend it"
                            placeholder="E.g. The best croque monsieur in town with an amazing view..."
                            multiline value={item.description}
                            onChangeText={v => set({ description: v })}
                            style={{ minHeight: 60, textAlignVertical: 'top' }}
                        />
                        <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
                            <TimePickerField label="Time" value={item.hoursStart} onChange={v => set({ hoursStart: v })} placeholder="11:00 AM" />
                            <DatePickerField label="Date"    value={item.startDate}  onChange={v => set({ startDate: v })} />
                        </View>
                        <FormInput
                            label="Restaurant link"
                            placeholder="E.g. website, menu or reservation"
                            autoCapitalize="none"
                            autoCorrect={false}
                            keyboardType="url"
                            value={item.externalLink}
                            onChangeText={v => set({ externalLink: v })}
                            onBlur={() => {
                                if (item.externalLink && !validateOptionalUrl(item.externalLink)) {
                                    notify({ title: 'Invalid link', message: 'Enter a valid link or leave the field blank.' });
                                } else if (item.externalLink) {
                                    const normalized = normalizeUrl(item.externalLink);
                                    if (normalized !== item.externalLink) set({ externalLink: normalized });
                                }
                            }}
                        />
                        <FormInput
                            label="Experience tips"
                            placeholder="E.g. Arrive early or make a reservation, it fills up fast..."
                            multiline value={item.tips}
                            onChangeText={v => set({ tips: v })}
                            style={{ minHeight: 50, textAlignVertical: 'top' }}
                        />
                        <CostBlock
                            cost={item.cost}
                            legacySpending={item.spending}
                            onChange={c => set({ cost: c, spending: costToLegacySpending(c) })}
                            defaultCurrency={form.currency || BASE_CURRENCY}
                            helperShort="Cost per person for the meal — optional. Use an estimate when prices vary."
                            encourageProof
                            uploadProof={(uri, name, mime) => uploadOne(uri, token, name, mime, 'costProof')}
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

function StepFlight({ form, update, token }: StepProps) {
    const setLeg = (key: 'flightOutbound' | 'flightReturn', patch: Partial<FlightLeg>) =>
        update(key, { ...form[key], ...patch });

    const renderLeg = (
        legKey: 'flightOutbound' | 'flightReturn',
        leg: FlightLeg,
        title: string,
    ) => (
        <View style={s.activityCard}>
            <Text style={[s.repeaterTitle, { marginTop: 0 }]}>{title}</Text>
            <FormInput label="Airline" placeholder="E.g. Delta, United, Air France" value={leg.airline} onChangeText={v => setLeg(legKey, { airline: v })} />
            <FormInput label="Departure City" required placeholder="E.g. New York, Los Angeles, Chicago" value={leg.originCity} onChangeText={v => setLeg(legKey, { originCity: v })} />
            <FormInput label="Origin Airport" placeholder="E.g. JFK — New York/John F. Kennedy" value={leg.originAirport} onChangeText={v => setLeg(legKey, { originAirport: v })} />
            <FormInput label="Destination Airport" placeholder="E.g. CDG — Paris/Charles de Gaulle" value={leg.destinationAirport} onChangeText={v => setLeg(legKey, { destinationAirport: v })} />
            <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
                <DatePickerField label="Departure Date"   required value={leg.departureDate} onChange={v => setLeg(legKey, { departureDate: v })} />
                <DatePickerField label="Arrival Date" required value={leg.arrivalDate}   onChange={v => setLeg(legKey, { arrivalDate: v })} />
                <View>
                    <Text style={s.label}>Stops</Text>
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
                title="My Flight"
                subtitle="Flight suggestions for the destination — builds buyer confidence"
                hint="Fill in the origin city and outbound/return dates to complete the module."
            />

            {renderLeg('flightOutbound', form.flightOutbound, 'Outbound flight')}
            {renderLeg('flightReturn', form.flightReturn, 'Return flight')}

            <Text style={[s.repeaterTitle, { marginTop: 16 }]}>Flight Tips</Text>
            <EditableList
                items={form.flightTips}
                onItemsChange={items => update('flightTips', items)}
                placeholder="E.g. The red-eye is the best option — I slept on the plane and arrived rested in the morning"
            />

            {/* Gasto da passagem aérea (opcional). Comprovante de reserva
                aumenta a confiança do roteiro. */}
            <CostBlock
                cost={form.flightCost}
                legacySpending={form.flightSpending}
                onChange={c => {
                    update('flightCost', c);
                    update('flightSpending', costToLegacySpending(c));
                }}
                defaultCurrency={form.currency || BASE_CURRENCY}
                helperShort="Airfare per person — optional. A booking/receipt builds trust."
                encourageProof
                uploadProof={(uri, name, mime) => uploadOne(uri, token, name, mime, 'costProof')}
            />
        </View>
    );
}

// ═══════════════════════════════════════════════════════════════════
// FACTORIES — Checklist / Spending
// ═══════════════════════════════════════════════════════════════════

function emptyChecklist(): ChecklistItem { return { category: 'documentos', item: '', isDefault: false }; }
function emptySpending(): SpendingEntry { return { moduleKey: 'gasto', label: '', icon: '💳', priceValue: '', priceCurrency: BASE_CURRENCY, receiptUrl: '' }; }

// ═══════════════════════════════════════════════════════════════════
// STEP MODULES — Dicas Exclusivas
// ═══════════════════════════════════════════════════════════════════

function StepTips({ form, update }: StepProps) {
    const filled = form.generalTips.filter(t => t.trim() !== '').length;
    return (
        <View>
            <ModuleStepHeader
                icon={Lightbulb}
                title="Insider Tips"
                subtitle="Secrets and practical tips only someone who's been there knows — your big differentiator"
                hint={`Add at least ${MIN_TIPS} insider tips to complete this module.`}
            />
            <View style={[s.daysProgressCard, filled >= MIN_TIPS && s.daysProgressCardOk]}>
                <Ionicons
                    name={filled >= MIN_TIPS ? 'checkmark-circle' : 'time-outline'}
                    size={18}
                    color={filled >= MIN_TIPS ? theme.colors.success : theme.colors.primary}
                />
                <Text style={s.daysProgressText}>
                    {filled}/{MIN_TIPS} tips filled{filled >= MIN_TIPS ? ' ✓' : ''}
                </Text>
            </View>
            <EditableList
                items={form.generalTips}
                onItemsChange={v => update('generalTips', v)}
                placeholder="E.g. Buy the Navigo pass on Monday"
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
                subtitle="A preparation list travelers use before and during the trip"
                hint={`Add at least ${MIN_CHECKLIST} items to complete this module.`}
            />
            <View style={[s.daysProgressCard, filled >= MIN_CHECKLIST && s.daysProgressCardOk]}>
                <Ionicons
                    name={filled >= MIN_CHECKLIST ? 'checkmark-circle' : 'time-outline'}
                    size={18}
                    color={filled >= MIN_CHECKLIST ? theme.colors.success : theme.colors.primary}
                />
                <Text style={s.daysProgressText}>
                    {filled}/{MIN_CHECKLIST} items filled{filled >= MIN_CHECKLIST ? ' ✓' : ''}
                </Text>
            </View>
            {form.checklistItems.map((c, i) => (
                <View key={i} style={s.checkRow}>
                    <View style={{ flex: 1 }}>
                        <Text style={s.checkCat}>{getChecklistCategoryLabel(c.category)}</Text>
                        <TextInput
                            style={s.checkInput}
                            placeholder="Checklist item"
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
            <Text style={[s.label, { marginTop: 14 }]}>Add item by category</Text>
            <View style={s.chipRow}>
                {CHECKLIST_CATS.map(cat => (
                    <TouchableOpacity
                        key={cat}
                        style={s.chipGhost}
                        onPress={() => update('checklistItems', [...form.checklistItems, { category: cat, item: '', isDefault: false }])}
                    >
                        <Ionicons name="add" size={14} color={theme.colors.primary} />
                        <Text style={s.chipGhostText}>{getChecklistCategoryLabel(cat)}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
}

// ═══════════════════════════════════════════════════════════════════
// STEP MODULES — Estimativa de Gastos por Pessoa
// ═══════════════════════════════════════════════════════════════════

// SpendingFieldset (legacy) foi substituído por CostBlock em todos os
// módulos. Mantemos apenas o tipo ModuleSpending importado para
// retrocompatibilidade com payload/legacy data.

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
        currency: BASE_CURRENCY,
    };
}

function StepExtraSpending({ form, update, token }: StepProps) {
    const items = form.extraSpendingItems || [];

    const setItems = (next: ExtraSpendingItem[]) => update('extraSpendingItems', next);
    const updateItem = (i: number, patch: Partial<ExtraSpendingItem>) => {
        setItems(items.map((e, idx) => idx === i ? { ...e, ...patch } : e));
    };

    return (
        <View>
            <ModuleStepHeader
                icon={Wallet}
                title="Extra Expenses"
                subtitle="SIM card, insurance, fees, tips, laundry and other trip expenses"
                hint="Add expenses that don't fit the other modules. Amount is optional."
            />

            {items.length === 0 ? (
                <View style={s.spendingEmpty}>
                    <Wallet size={36} strokeWidth={1.4} color={theme.colors.primary + '88'} />
                    <Text style={s.spendingEmptyTitle}>No extra expenses added</Text>
                    <Text style={s.spendingEmptyText}>
                        Add expenses that don't fit the other modules (SIM card, insurance, fees, tips, etc.).
                    </Text>
                </View>
            ) : null}

            {items.map((e, i) => (
                <View key={e.id || i} style={s.spendingCard}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={s.activityBadge}>Extra expense {i + 1}</Text>
                        <TouchableOpacity onPress={() => setItems(items.filter((_, x) => x !== i))}>
                            <Ionicons name="trash-outline" size={18} color={theme.colors.error} />
                        </TouchableOpacity>
                    </View>

                    <Text style={s.label}>Category</Text>
                    <View style={s.chipRow}>
                        {EXTRA_SPENDING_CATEGORIES.map(c => {
                            const active = e.category === c.key;
                            const IconComp = EXTRA_SPENDING_ICON_MAP[c.key];
                            return (
                                <TouchableOpacity
                                    key={c.key}
                                    style={[s.chip, active && s.chipActive]}
                                    onPress={() => updateItem(i, { category: c.key })}
                                >
                                    {IconComp && (
                                        <IconComp
                                            size={14}
                                            strokeWidth={2}
                                            color={active ? theme.colors.primary : theme.colors.text.secondary}
                                        />
                                    )}
                                    <Text style={[s.chipText, active && s.chipTextActive]}>{c.label}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    <FormInput
                        label="Expense title/name"
                        required
                        placeholder="E.g. 10GB data SIM card"
                        value={e.title}
                        onChangeText={v => updateItem(i, { title: v })}
                    />
                    <FormInput
                        label="Description (optional)"
                        placeholder="Details or context for the expense"
                        multiline
                        value={e.description}
                        onChangeText={v => updateItem(i, { description: v })}
                        style={{ minHeight: 50, textAlignVertical: 'top' }}
                    />

                    <CostBlock
                        cost={e.cost}
                        legacySpending={e.value ? { value: e.value, currency: e.currency || BASE_CURRENCY } : undefined}
                        onChange={c => {
                            const legacy = costToLegacySpending(c);
                            updateItem(i, {
                                cost: c,
                                value: legacy?.value ?? '',
                                currency: legacy?.currency ?? e.currency ?? BASE_CURRENCY,
                            });
                        }}
                        defaultCurrency={form.currency || BASE_CURRENCY}
                        helperShort="Variable expenses (SIM card, fees, tips) are usually estimates."
                        encourageProof
                        uploadProof={(uri, name, mime) => uploadOne(uri, token, name, mime, 'costProof')}
                    />
                </View>
            ))}

            <TouchableOpacity style={s.addInline} onPress={() => setItems([...items, emptyExtraSpending()])}>
                <Ionicons name="add-circle-outline" size={18} color={theme.colors.primary} />
                <Text style={s.addInlineText}>Add extra expense</Text>
            </TouchableOpacity>
        </View>
    );
}

// ═══════════════════════════════════════════════════════════════════
// STEP 8 — MÍDIA
// ═══════════════════════════════════════════════════════════════════

// Allow-lists, limites e mensagens vêm de uploadContexts.ts.

function getPickedAssetFileInfo(asset: ImagePicker.ImagePickerAsset, fallbackPrefix: string) {
    const filename = (asset as any).fileName
        || asset.uri.split('/').pop()?.split('?')[0]
        || `${fallbackPrefix}-${Date.now()}.jpg`;
    const size = (asset as any).fileSize as number | undefined;
    const mime = ((asset as any).mimeType || '').toLowerCase();
    const ext = (filename.match(/\.(\w+)$/)?.[1] || '').toLowerCase();
    return { filename, size, mime, ext };
}

/**
 * Valida um asset do ImagePicker contra o contexto da galeria/capa.
 * Cover só aceita imagens; gallery aceita imagens + vídeos.
 */
function validatePickedAsset(
    asset: ImagePicker.ImagePickerAsset,
    index: number,
    slot: 'cover' | 'gallery',
): string | null {
    const { filename, size, mime } = getPickedAssetFileInfo(asset, `photo-${index + 1}`);
    const context = slot === 'cover' ? 'routeCoverMedia' : 'routeGalleryMedia';
    const result = validateUploadFile({ uri: asset.uri, filename, mime, size }, context);
    if (result.valid) return null;
    return `${filename}: ${result.reason}`;
}

function StepMedia({ form, update, token }: StepProps & { token: string | null | undefined }) {
    const [uploadingCover, setUploadingCover] = useState(false);
    const [uploadingGallery, setUploadingGallery] = useState(false);
    const galleryItems = [
        ...form.images.map(url => ({ url, source: 'images' as const })),
        ...form.mediaUrls.map(url => ({ url, source: 'mediaUrls' as const })),
    ].slice(0, 10);

    async function pickAndUpload(slot: 'cover' | 'gallery') {
        if (Platform.OS !== 'web') {
            const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!perm.granted) {
                notify({
                    title: 'Permission needed',
                    message: 'Allow access to your files to continue.',
                    variant: 'warning',
                });
                return;
            }
        }
        // Capa só aceita imagens; galeria aceita imagens + vídeos
        // (MP4/MOV do iPhone, WEBM do Android/Web).
        const res = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: slot === 'cover'
                ? ImagePicker.MediaTypeOptions.Images
                : ImagePicker.MediaTypeOptions.All,
            quality: 0.85, allowsMultipleSelection: true, selectionLimit: 5,
        });
        if (res.canceled || !res.assets) return;
        const validAssets: Array<{
            asset: ImagePicker.ImagePickerAsset;
            filename: string;
            mime?: string;
            mediaType: 'image' | 'video' | 'document';
        }> = [];
        const validationFailures: string[] = [];
        res.assets.forEach((asset, index) => {
            const info = getPickedAssetFileInfo(asset, `photo-${index + 1}`);
            const context = slot === 'cover' ? 'routeCoverMedia' : 'routeGalleryMedia';
            const validation = validateUploadFile(
                { uri: asset.uri, filename: info.filename, mime: info.mime, size: info.size },
                context,
            );
            if (!validation.valid) {
                validationFailures.push(`${info.filename}: ${validation.reason}`);
                return;
            }
            validAssets.push({
                asset,
                filename: validation.filename,
                mime: validation.mimeType,
                mediaType: validation.mediaType,
            });
        });
        if (validationFailures.length > 0) {
            notify({
                title: 'Some files can\'t be uploaded',
                message: validationFailures.join('\n'),
                variant: 'warning',
            });
        }
        if (validAssets.length === 0) return;

        const setter = slot === 'cover' ? setUploadingCover : setUploadingGallery;
        setter(true);
        try {
            // Upload em paralelo, mas com tolerância a falhas individuais
            const settled = await Promise.allSettled(
                validAssets.map(item => {
                    return uploadOne(
                        item.asset.uri,
                        token,
                        item.filename,
                        item.mime || undefined,
                        slot === 'cover' ? 'routeCoverMedia' : 'routeGalleryMedia',
                    );
                })
            );
            const freshImages: string[] = [];
            const freshVideos: string[] = [];
            const failures: string[] = [];
            settled.forEach((r, i) => {
                if (r.status === 'fulfilled') {
                    if (validAssets[i]?.mediaType === 'video') freshVideos.push(r.value);
                    else freshImages.push(r.value);
                } else {
                    failures.push(`File ${i + 1}: ${r.reason?.message || 'unknown error'}`);
                }
            });
            if (slot === 'cover') {
                update('highlightPhotos', [...form.highlightPhotos, ...freshImages].slice(0, 3));
            } else {
                const currentCount = galleryItems.length;
                const remaining = Math.max(0, 10 - currentCount);
                const accepted = [...freshImages, ...freshVideos].slice(0, remaining);
                const acceptedImages = accepted.filter(url => !isVideoUrl(url));
                const acceptedVideos = accepted.filter(url => isVideoUrl(url));
                if (acceptedImages.length) update('images', [...form.images, ...acceptedImages].slice(0, 10));
                if (acceptedVideos.length) update('mediaUrls', [...form.mediaUrls, ...acceptedVideos].slice(0, 10));
            }
            if (failures.length > 0) {
                notify({
                    title: `${failures.length} file(s) not uploaded`,
                    message: failures.join('\n'),
                    variant: 'warning',
                });
            }
        } catch (e: any) {
            notify({
                title: 'Upload failed',
                message: e?.message || 'Please try again.',
                variant: 'error',
            });
        } finally {
            setter(false);
        }
    }

    function removeImg(slot: 'cover' | 'gallery', idx: number) {
        if (slot === 'cover') update('highlightPhotos', form.highlightPhotos.filter((_, i) => i !== idx));
        else {
            const item = galleryItems[idx];
            if (!item) return;
            if (item.source === 'images') update('images', form.images.filter(url => url !== item.url));
            else update('mediaUrls', form.mediaUrls.filter(url => url !== item.url));
        }
    }

    return (
        <View>
            <ModuleStepHeader
                icon={Camera}
                title="Photos & Videos"
                subtitle="Real images from your trip — authentic photos boost sales"
                required
                hint="Cover: at least 1 main photo. Gallery: up to 10 extra photos."
            />

            <Text style={s.repeaterTitle}>Cover (up to 3 photos)</Text>
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

            <Text style={[s.repeaterTitle, { marginTop: 20 }]}>Gallery (up to 10 photos)</Text>
            <View style={s.imgGrid}>
                {galleryItems.map((item, i) => (
                    <View key={i} style={s.imgThumbWrap}>
                        {isVideoUrl(item.url) ? (
                            <View style={[s.imgThumb, { alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a' }]}>
                                <Ionicons name="play-circle" size={32} color="#fff" />
                            </View>
                        ) : /\.(heic|heif)(\?|$)/i.test(item.url) ? (
                            <View style={[s.imgThumb, { alignItems: 'center', justifyContent: 'center', backgroundColor: '#eef2ff' }]}>
                                <Ionicons name="image-outline" size={28} color={theme.colors.primary} />
                            </View>
                        ) : (
                            <Image source={{ uri: item.url }} style={s.imgThumb} resizeMode="cover" />
                        )}
                        <TouchableOpacity style={s.imgRemove} onPress={() => removeImg('gallery', i)}>
                            <Ionicons name="close" size={14} color="#fff" />
                        </TouchableOpacity>
                    </View>
                ))}
                {galleryItems.length < 10 && (
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

function StepReview({ form, onPreview, onFixIssue }: { form: ItineraryFormState; onPreview: () => void; onFixIssue: (section: string) => void }) {
    const blocks = useMemo(() => calcQualityBlocks(form), [form]);
    const totalScore = useMemo(() => calcQuality(form), [form]);
    const issues = useMemo(() => validateForSubmission(form), [form]);

    return (
        <View>
            <SectionHeader title="Final review" subtitle="Check everything before submitting for review." />

            <View style={s.scoreCard}>
                <Text style={s.scoreLabel}>Itinerary strength</Text>
                <Text style={s.scoreValue}>{totalScore}/100</Text>
                <View style={s.scoreBar}>
                    <View style={[s.scoreBarFill, { width: `${totalScore}%` }]} />
                </View>
            </View>

            {issues.length > 0 ? (
                <View style={s.issuesCard}>
                    <Text style={s.issuesTitle}>⚠️ Open items before submitting</Text>
                    <Text style={s.issueHint}>Tap to go to the step and fix it.</Text>
                    {issues.map((i, idx) => (
                        <TouchableOpacity
                            key={idx}
                            style={s.issueRow}
                            onPress={() => onFixIssue(i.section)}
                            activeOpacity={0.7}
                        >
                            <Text style={s.issueText}>• {i.message}</Text>
                            <Ionicons name="chevron-forward" size={16} color={theme.colors.warning || '#F59E0B'} />
                        </TouchableOpacity>
                    ))}
                </View>
            ) : (
                <View style={s.okCard}>
                    <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />
                    <Text style={s.okText}>Ready to submit for review!</Text>
                </View>
            )}

            {/* ── Prévia do roteiro ── */}
            <View style={s.previewBlock}>
                <View style={{ flex: 1 }}>
                    <Text style={s.previewTitle}>Itinerary preview</Text>
                    <Text style={s.previewSubtitle}>
                        See how the itinerary will appear to travelers before you submit.
                    </Text>
                </View>
                <TouchableOpacity
                    style={s.previewCta}
                    onPress={onPreview}
                    activeOpacity={0.85}
                >
                    <Ionicons name="eye-outline" size={16} color="#fff" />
                    <Text style={s.previewCtaText}>View preview</Text>
                </TouchableOpacity>
            </View>

            <Text style={s.repeaterTitle}>Breakdown by block</Text>
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
    /** Token de auth para uploads (comprovantes de custo, fotos). Pode ser
     *  null/undefined em rotas públicas — o backend de uploads aceita ambos. */
    token?: string | null;
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
                <Text style={s.addInlineText}>Add</Text>
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
/**
 * Renova o accessToken usando o refreshToken salvo na sessão
 * (SecureStore no nativo, AsyncStorage no web — via secureSession).
 * Retorna o novo accessToken ou null se o refresh falhar (refreshToken
 * também expirado/inválido — usuário precisa fazer login de novo).
 */
async function tryRefreshSession(): Promise<string | null> {
    try {
        const session = await getStoredSession();
        const refreshToken = session?.refreshToken;
        if (!session || !refreshToken) return null;

        const res = await fetch(`${API_BASE}/auth/traveler/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
        });
        if (!res.ok) return null;
        const data = await res.json();
        const newToken = data.accessToken;
        if (!newToken) return null;

        await setStoredSession({ ...session, accessToken: newToken });
        return newToken;
    } catch {
        return null;
    }
}

async function uploadOne(
    uri: string,
    token: string | null | undefined,
    filenameHint?: string,
    mimeHint?: string,
    context: Parameters<typeof uploadFileUrl>[4] = 'adminAttachment',
): Promise<string> {
    return uploadFileUrl(uri, token, filenameHint, mimeHint, context);
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
        categories: Array.from(new Set((data.categories || []).map((c: string) => String(c).trim()).filter(Boolean))),
        travelProofUrl: data.travelProofUrl || '',
        price: data.price || 0,
        currency: data.currency || BASE_CURRENCY,
        promoPrice: data.promoPrice ?? undefined,
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
        flightSpending: data.flightInfo?.spending || undefined,
        flightCost: data.flightInfo?.cost || undefined,
        extraSpendingItems: data.extraSpendingItems || [],
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
    authState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    authTitle: {
        marginTop: 16,
        fontSize: 20,
        fontWeight: '800',
        color: theme.colors.text.primary,
        textAlign: 'center',
    },
    authText: {
        marginTop: 8,
        marginBottom: 24,
        fontSize: 14,
        lineHeight: 20,
        color: theme.colors.text.secondary,
        textAlign: 'center',
    },
    authButton: {
        backgroundColor: theme.colors.primary,
        borderRadius: 14,
        paddingHorizontal: 24,
        paddingVertical: 14,
        ...theme.shadows.button,
    },
    authButtonText: { fontSize: 15, fontWeight: '700', color: '#fff' },
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
    requiredAsterisk: { color: theme.colors.error, fontWeight: '700' },
    helper: { fontSize: 12, color: theme.colors.text.tertiary, marginBottom: 10, lineHeight: 16 },

    // Estilo de orçamento
    budgetLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 },
    budgetHelpBtn: { padding: 2 },
    budgetSubtitle: { fontSize: 12, color: theme.colors.text.tertiary, lineHeight: 16, marginTop: 4, marginBottom: 8 },
    budgetHint: {
        flexDirection: 'row',
        gap: 8,
        backgroundColor: theme.colors.primary + '0E',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: theme.colors.primary + '22',
        padding: 10,
        marginTop: 10,
    },
    budgetHintText: { flex: 1, fontSize: 12, lineHeight: 17, color: theme.colors.text.secondary },

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
    unitSeg: {
        flexDirection: 'row', alignSelf: 'flex-start',
        backgroundColor: theme.colors.surfaceLight, borderRadius: 10, padding: 3, gap: 3,
        borderWidth: 1, borderColor: theme.colors.borderLight,
    },
    unitSegItem: { paddingVertical: 7, paddingHorizontal: 14, borderRadius: 8 },
    unitSegItemActive: { backgroundColor: theme.colors.primary },
    unitSegText: { fontSize: 13, fontWeight: '600', color: theme.colors.text.secondary },
    unitSegTextActive: { color: '#fff' },
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
    issuesTitle: { fontSize: 14, fontWeight: '700', color: '#92400E', marginBottom: 2 },
    issueHint:   { fontSize: 11, color: '#92400E', opacity: 0.75, marginBottom: 6, fontStyle: 'italic' },
    issueRow:    {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingVertical: 8, paddingHorizontal: 6, borderRadius: 8,
        borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#FCD34D',
    },
    issueText:   { flex: 1, fontSize: 13, color: '#92400E', lineHeight: 20 },

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
