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
import AsyncStorage from '@react-native-async-storage/async-storage';
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
    FlightLeg,
    EMPTY_FLIGHT_LEG,
    STYLE_OPTIONS,
    CATEGORY_OPTIONS,
    MODULE_OPTIONS,
    CHECKLIST_CATS,
    SPENDING_CATS,
    ATTRACTION_TYPES,
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
const TOTAL_STEPS = 9;

const STEP_LABELS = [
    'Identidade',
    'Comprovante',
    'Comercial',
    'Módulos',
    'Roteiro dia a dia',
    'Conteúdo',
    'Dicas, checklist, gastos',
    'Mídia',
    'Revisão',
];

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
        if (step === TOTAL_STEPS) { submit(); return; }
        const ns = Math.min(step + 1, TOTAL_STEPS);
        setStep(ns);
        saveDraftLocal(form, ns);
    }, [step, form, saveDraftLocal]);

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
            // No step 9 (Revisão), o card de pendências já está visível —
            // só rola para o topo e dá um haptic de erro. Em outros steps
            // (fallback), mostra Alert listando os problemas.
            if (step === TOTAL_STEPS) {
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
            await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
                body: JSON.stringify(payload),
            });
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
                    <Text style={s.headerLabel}>{STEP_LABELS[step - 1]}</Text>
                    <Text style={s.headerStep}>Passo {step} de {TOTAL_STEPS} · Score {score}</Text>
                </View>
                <TouchableOpacity onPress={saveDraft} style={s.headerBtn} disabled={saving}>
                    {saving
                        ? <ActivityIndicator size="small" color={theme.colors.primary} />
                        : <Ionicons name="save-outline" size={22} color={theme.colors.primary} />}
                </TouchableOpacity>
            </View>

            <ProgressBar step={step} total={TOTAL_STEPS} />

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
                    {step === 1 && <StepIdentity form={form} update={updateForm} />}
                    {step === 2 && <StepProof form={form} update={updateForm} token={accessToken} />}
                    {step === 3 && <StepCommerce form={form} update={updateForm} />}
                    {step === 4 && <StepModules form={form} update={updateForm} />}
                    {step === 5 && <StepDays form={form} update={updateForm} />}
                    {step === 6 && <StepContent form={form} update={updateForm} />}
                    {step === 7 && <StepExtras form={form} update={updateForm} />}
                    {step === 8 && <StepMedia form={form} update={updateForm} token={accessToken} />}
                    {step === 9 && <StepReview form={form} onPreview={openPreview} />}
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Footer CTA */}
            <View style={s.footer}>
                {/* No último passo, se há pendências, o botão fica em estado warning */}
                <TouchableOpacity
                    style={[
                        s.ctaBtn,
                        step === TOTAL_STEPS && hasIssues && s.ctaBtnWarning,
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
                                        step === TOTAL_STEPS
                                            ? (hasIssues ? 'alert-circle' : 'checkmark-circle')
                                            : 'arrow-forward'
                                    }
                                    size={18}
                                    color="#fff"
                                    style={{ marginRight: 8 }}
                                />
                                <Text style={s.ctaText}>
                                    {step === TOTAL_STEPS
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
                {step === TOTAL_STEPS && hasIssues && (
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
// STEP 1 — IDENTIDADE
// ═══════════════════════════════════════════════════════════════════

function StepIdentity({ form, update }: StepProps) {
    const toggleArray = (arr: string[], val: string, max?: number): string[] => {
        if (arr.includes(val)) return arr.filter(x => x !== val);
        if (max && arr.length >= max) return arr;
        return [...arr, val];
    };

    return (
        <View>
            <SectionHeader title="Identidade & Indexação" subtitle="O que o viajante vê primeiro." />
            <FormInput
                label="Título do roteiro"
                required
                placeholder="Ex: 7 dias em Paris sem gastar uma fortuna"
                value={form.title}
                onChangeText={v => update('title', v)}
                maxLength={120}
            />
            <FormInput
                label="Subtítulo"
                placeholder="Frase curta de apoio (opcional)"
                value={form.subtitle}
                onChangeText={v => update('subtitle', v)}
                maxLength={160}
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                    <FormInput
                        label="Cidade principal"
                        required
                        placeholder="Ex: Paris"
                        value={form.locations[0]?.cities[0] ?? ''}
                        onChangeText={(v: string) => {
                            const locs = [...form.locations];
                            if (!locs[0]) locs[0] = { country: '', cities: [v] };
                            else locs[0] = { ...locs[0], cities: [v, ...locs[0].cities.slice(1)] };
                            update('locations', locs);
                            update('destination', v);
                        }}
                    />
                </View>
                <View style={{ flex: 1 }}>
                    <FormInput
                        label="País"
                        required
                        placeholder="Ex: França"
                        value={form.locations[0]?.country ?? ''}
                        onChangeText={(v: string) => {
                            const locs = [...form.locations];
                            if (!locs[0]) locs[0] = { country: v, cities: [''] };
                            else locs[0] = { ...locs[0], country: v };
                            update('locations', locs);
                            update('country', v);
                        }}
                    />
                </View>
            </View>
            <FormInput
                label="Duração (dias)"
                required
                keyboardType="number-pad"
                placeholder="Ex: 7"
                value={form.duration ? String(form.duration) : ''}
                onChangeText={v => update('duration', Math.max(1, parseInt(v) || 0))}
            />
            <FormInput
                label="Descrição"
                required
                placeholder="Conte por que o seu roteiro é especial..."
                value={form.description}
                onChangeText={v => update('description', v)}
                multiline
                numberOfLines={5}
                style={{ minHeight: 110, textAlignVertical: 'top' }}
            />
            <Text style={s.label}>Categorias temáticas ({MAX_CATEGORIES} máx, mínimo 1)</Text>
            <View style={s.chipRow}>
                {CATEGORY_OPTIONS.map(c => {
                    const active = form.categories.includes(c.key);
                    return (
                        <TouchableOpacity
                            key={c.key}
                            style={[s.chip, active && s.chipActive]}
                            onPress={() => update('categories', toggleArray(form.categories, c.key, MAX_CATEGORIES))}
                        >
                            <Text style={{ fontSize: 13 }}>{c.emoji}</Text>
                            <Text style={[s.chipText, active && s.chipTextActive]}>{c.label}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
            <Text style={s.label}>Experiência de gasto</Text>
            <Text style={s.helper}>Escolha apenas uma opção que represente o estilo do seu roteiro.</Text>
            <View style={s.chipRow}>
                {STYLE_OPTIONS.map(st => {
                    const active = form.travelStyles.includes(st.key);
                    return (
                        <TouchableOpacity
                            key={st.key}
                            style={[s.chip, active && s.chipActive]}
                            onPress={() => {
                                // Seleção única (radio): clicar em uma já ativa desmarca; senão substitui as outras.
                                if (active) update('travelStyles', []);
                                else update('travelStyles', [st.key]);
                            }}
                        >
                            <Text style={[s.chipText, active && s.chipTextActive]}>{st.label}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
            <Text style={s.label}>Destaques do roteiro (frases curtas)</Text>
            <EditableList
                items={form.highlights}
                onItemsChange={items => update('highlights', items)}
                placeholder="Ex: Tour gastronômico em Pigalle"
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
                subtitle="Anexe um documento que prove que você esteve no destino (passagens, carimbo de passaporte, etc.). Obrigatório para envio à análise."
            />

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
                            <Text style={s.uploadText}>Anexar comprovante</Text>
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
            <SectionHeader title="Preço & Comercial" subtitle="Defina como seu roteiro será vendido." />
            <FormInput
                label="Preço de venda (R$)"
                required
                keyboardType="decimal-pad"
                placeholder="Ex: 89.90"
                value={form.price ? String(form.price) : ''}
                onChangeText={v => update('price', parseFloat(v.replace(',', '.')) || 0)}
            />
            <CurrencyPicker
                label="Moeda"
                value={form.currency}
                onChange={(code) => update('currency', code as any)}
            />
            <FormInput
                label="Preço promocional (opcional)"
                keyboardType="decimal-pad"
                placeholder="Ex: 69.90"
                value={form.promoPrice ? String(form.promoPrice) : ''}
                onChangeText={v => update('promoPrice', v ? parseFloat(v.replace(',', '.')) : undefined)}
            />
            <FormInput
                label="Parcelas máximas (opcional)"
                keyboardType="number-pad"
                placeholder="Ex: 6"
                value={form.installments ? String(form.installments) : ''}
                onChangeText={v => update('installments', v ? parseInt(v) : undefined)}
            />
            <SwitchRow label="Acesso imediato após compra"  value={form.immediateAccess} onChange={v => update('immediateAccess', v)} />
            <SwitchRow label="Acesso vitalício"              value={form.lifetimeAccess}  onChange={v => update('lifetimeAccess', v)} />
            <SwitchRow label="Download offline"              value={form.offlineDownload} onChange={v => update('offlineDownload', v)} />
            <SwitchRow label="Permitir compartilhar"         value={form.allowShare}      onChange={v => update('allowShare', v)} />
            <SwitchRow label="Permitir exportar PDF"         value={form.allowPdf}        onChange={v => update('allowPdf', v)} />
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
            <SectionHeader title="Módulos ativos" subtitle="Escolha o que está incluído no seu roteiro. O comprador decide com base nisso." />
            {MODULE_OPTIONS.map(m => {
                const active = form.activeModules.includes(m.key);
                return (
                    <TouchableOpacity
                        key={m.key}
                        style={[s.moduleCard, active && s.moduleCardActive]}
                        onPress={() => toggle(m.key)}
                        activeOpacity={0.85}
                    >
                        <Text style={{ fontSize: 24 }}>{m.emoji}</Text>
                        <View style={{ flex: 1 }}>
                            <Text style={s.moduleTitle}>{m.label}</Text>
                            <Text style={s.moduleDesc}>{m.desc}</Text>
                        </View>
                        <View style={[s.moduleCheck, active && s.moduleCheckActive]}>
                            {active && <Ionicons name="checkmark" size={16} color="#fff" />}
                        </View>
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

function StepDays({ form, update }: StepProps) {
    function syncDays() {
        const needed = form.duration || 1;
        const current = [...form.days];
        while (current.length < needed) current.push(emptyDay(current.length + 1));
        while (current.length > needed) current.pop();
        update('days', current);
    }

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

    return (
        <View>
            <SectionHeader title={`Roteiro dia a dia (${form.duration || '?'} dias)`} subtitle="O coração do seu roteiro. Cada dia deve ter descrição e pelo menos 1 atividade." />
            {form.days.length !== form.duration && (
                <TouchableOpacity style={s.syncBtn} onPress={syncDays}>
                    <Ionicons name="sync" size={16} color={theme.colors.primary} />
                    <Text style={s.syncBtnText}>Gerar {form.duration || 0} dias</Text>
                </TouchableOpacity>
            )}
            {form.days.map((d, i) => (
                <View key={i} style={s.dayCard}>
                    <Text style={s.dayHeader}>Dia {i + 1}</Text>
                    <FormInput label="Título do dia"
                        placeholder="Ex: Chegada e bairro Marais"
                        value={d.title}
                        onChangeText={v => updateDay(i, { title: v })}
                    />
                    <FormInput label="Descrição do dia" required
                        placeholder="O que acontece neste dia..."
                        multiline numberOfLines={3}
                        style={{ minHeight: 80, textAlignVertical: 'top' }}
                        value={d.description}
                        onChangeText={v => updateDay(i, { description: v })}
                    />
                    <Text style={s.label}>Atividades ({d.activities.length})</Text>
                    {d.activities.map((a, ai) => (
                        <View key={ai} style={s.activityCard}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text style={s.activityBadge}>Atividade {ai + 1}</Text>
                                <TouchableOpacity onPress={() => removeActivity(i, ai)}>
                                    <Ionicons name="trash-outline" size={18} color={theme.colors.error} />
                                </TouchableOpacity>
                            </View>
                            <FormInput label="Título" required placeholder="Ex: Museu do Louvre"
                                value={a.title} onChangeText={v => updateActivity(i, ai, { title: v })} />
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                <View style={{ flex: 1 }}>
                                    <FormInput label="Horário" placeholder="09:00"
                                        value={a.time} onChangeText={v => updateActivity(i, ai, { time: v })} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <FormInput label="Duração" placeholder="2h"
                                        value={a.duration} onChangeText={v => updateActivity(i, ai, { duration: v })} />
                                </View>
                            </View>
                            <FormInput label="Local" placeholder="Ex: Rue de Rivoli"
                                value={a.location} onChangeText={v => updateActivity(i, ai, { location: v })} />
                            <FormInput label="Descrição" placeholder="Detalhes da atividade"
                                multiline numberOfLines={2}
                                style={{ minHeight: 60, textAlignVertical: 'top' }}
                                value={a.description} onChangeText={v => updateActivity(i, ai, { description: v })} />
                            <FormInput label="Dicas" placeholder="Dicas para essa atividade"
                                value={a.tips} onChangeText={v => updateActivity(i, ai, { tips: v })} />
                        </View>
                    ))}
                    <TouchableOpacity style={s.addInline} onPress={() => addActivity(i)}>
                        <Ionicons name="add-circle-outline" size={18} color={theme.colors.primary} />
                        <Text style={s.addInlineText}>Adicionar atividade</Text>
                    </TouchableOpacity>
                </View>
            ))}
        </View>
    );
}

// ═══════════════════════════════════════════════════════════════════
// STEP 6 — CONTEÚDO (hospedagem, passeios, transporte, restaurantes, voo)
// ═══════════════════════════════════════════════════════════════════

function emptyAccommodation(): Accommodation { return { name: '', address: '', mapLink: '', description: '', nights: '', rating: '', externalLink: '', tips: '', startDate: '', endDate: '' }; }
function emptyAttraction(): AttractionItem { return { name: '', type: '', location: '', mapLink: '', description: '', hours: '', duration: '', externalLink: '', tips: '', startDate: '', endDate: '', price: '' }; }
function emptyTransport(): Transport { return { description: '', passTypes: '', notes: '', startDate: '', endDate: '' }; }
function emptyRestaurant(): RestaurantItem { return { name: '', cuisine: '', location: '', description: '', hours: '', hoursStart: '', externalLink: '', tips: '', startDate: '', endDate: '' }; }

function StepContent({ form, update }: StepProps) {
    const isActive = (k: ModuleKey) => form.activeModules.includes(k);
    const noneActive = !['hospedagem','passeios','transporte','restaurantes','voo'].some(m => isActive(m as ModuleKey));

    if (noneActive) {
        return (
            <View>
                <SectionHeader title="Conteúdo dos módulos" />
                <Text style={s.emptyHint}>Nenhum módulo de conteúdo ativado. Volte ao passo 4 para ativar Hospedagens, Passeios, Transporte, Restaurantes ou Voo.</Text>
            </View>
        );
    }

    return (
        <View>
            <SectionHeader title="Conteúdo dos módulos" subtitle="Preencha o conteúdo dos módulos ativos." />

            {isActive('hospedagem') && (
                <Repeater
                    title="🏨 Hospedagens"
                    items={form.accommodations}
                    onChange={v => update('accommodations', v)}
                    factory={emptyAccommodation}
                    render={(item, set) => (
                        <>
                            <FormInput label="Nome" required placeholder="Ex: Hotel Le Marais" value={item.name} onChangeText={v => set({ name: v })} />
                            <FormInput label="Endereço" placeholder="Rua..." value={item.address} onChangeText={v => set({ address: v })} />
                            <FormInput label="Descrição" placeholder="Por que recomenda..." multiline value={item.description} onChangeText={v => set({ description: v })} style={{ minHeight: 60, textAlignVertical: 'top' }} />
                            <FormInput label="Link externo" placeholder="https://..." value={item.externalLink} onChangeText={v => set({ externalLink: v })} autoCapitalize="none" />
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                <View style={{ flex: 1 }}><FormInput label="Noites" keyboardType="number-pad" value={item.nights} onChangeText={v => set({ nights: v })} /></View>
                                <View style={{ flex: 1 }}><FormInput label="Rating (1-5)" keyboardType="decimal-pad" value={item.rating} onChangeText={v => set({ rating: v })} /></View>
                            </View>
                        </>
                    )}
                />
            )}

            {isActive('passeios') && (
                <Repeater
                    title="🎫 Passeios & Atrações"
                    items={form.attractions}
                    onChange={v => update('attractions', v)}
                    factory={emptyAttraction}
                    render={(item, set) => (
                        <>
                            <FormInput label="Nome" required placeholder="Ex: Torre Eiffel" value={item.name} onChangeText={v => set({ name: v })} />
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
                            <FormInput label="Local" placeholder="Endereço ou bairro" value={item.location} onChangeText={v => set({ location: v })} />
                            <FormInput label="Descrição" placeholder="O que esperar..." multiline value={item.description} onChangeText={v => set({ description: v })} style={{ minHeight: 60, textAlignVertical: 'top' }} />
                            <FormInput label="Preço (opcional)" placeholder="Ex: 22 EUR" value={item.price || ''} onChangeText={v => set({ price: v })} />
                            <FormInput label="Horários" placeholder="Ex: Ter-Dom 9h-18h" value={item.hours} onChangeText={v => set({ hours: v })} />
                            <FormInput label="Link externo" placeholder="https://..." value={item.externalLink} onChangeText={v => set({ externalLink: v })} autoCapitalize="none" />
                            <FormInput label="Dicas" placeholder="Compre online para furar fila..." value={item.tips} onChangeText={v => set({ tips: v })} />
                        </>
                    )}
                />
            )}

            {isActive('transporte') && (
                <Repeater
                    title="🚌 Transporte"
                    items={form.transports}
                    onChange={v => update('transports', v)}
                    factory={emptyTransport}
                    render={(item, set) => (
                        <>
                            <FormInput label="Descrição" required placeholder="Ex: Metrô Paris" value={item.description} onChangeText={v => set({ description: v })} multiline style={{ minHeight: 60, textAlignVertical: 'top' }} />
                            <FormInput label="Tipos de passe" required placeholder="Ex: Navigo Semanal" value={item.passTypes} onChangeText={v => set({ passTypes: v })} />
                            <FormInput label="Observações" placeholder="Dicas..." value={item.notes} onChangeText={v => set({ notes: v })} />
                        </>
                    )}
                />
            )}

            {isActive('restaurantes') && (
                <Repeater
                    title="🍴 Restaurantes"
                    items={form.restaurants}
                    onChange={v => update('restaurants', v)}
                    factory={emptyRestaurant}
                    render={(item, set) => (
                        <>
                            <FormInput label="Nome" required value={item.name} onChangeText={v => set({ name: v })} />
                            <FormInput label="Local" required value={item.location} onChangeText={v => set({ location: v })} />
                            <FormInput label="Tipo de cozinha" value={item.cuisine} onChangeText={v => set({ cuisine: v })} />
                            <FormInput label="Descrição" multiline value={item.description} onChangeText={v => set({ description: v })} style={{ minHeight: 60, textAlignVertical: 'top' }} />
                            <FormInput label="Horário" placeholder="Ex: 12h-23h" value={item.hours} onChangeText={v => set({ hours: v })} />
                            <FormInput label="Link externo" placeholder="https://..." value={item.externalLink} onChangeText={v => set({ externalLink: v })} autoCapitalize="none" />
                        </>
                    )}
                />
            )}

            {isActive('voo') && <FlightSection form={form} update={update} />}
        </View>
    );
}

function FlightSection({ form, update }: StepProps) {
    const setLeg = (key: 'flightOutbound' | 'flightReturn', patch: Partial<FlightLeg>) =>
        update(key, { ...form[key], ...patch });
    return (
        <View style={{ marginTop: 16 }}>
            <Text style={s.repeaterTitle}>✈️ Voo</Text>
            <Text style={s.label}>Ida</Text>
            <FormInput label="Companhia"           value={form.flightOutbound.airline}            onChangeText={v => setLeg('flightOutbound', { airline: v })} />
            <FormInput label="Cidade de origem"    value={form.flightOutbound.originCity}         onChangeText={v => setLeg('flightOutbound', { originCity: v })} />
            <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ flex: 1 }}><FormInput label="Aeroporto origem"      value={form.flightOutbound.originAirport}      onChangeText={v => setLeg('flightOutbound', { originAirport: v })} /></View>
                <View style={{ flex: 1 }}><FormInput label="Aeroporto destino"     value={form.flightOutbound.destinationAirport} onChangeText={v => setLeg('flightOutbound', { destinationAirport: v })} /></View>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ flex: 1 }}><FormInput label="Partida (data/hora)"   placeholder="2026-08-12 10:30" value={form.flightOutbound.departureDate}      onChangeText={v => setLeg('flightOutbound', { departureDate: v })} /></View>
                <View style={{ flex: 1 }}><FormInput label="Chegada"               placeholder="2026-08-12 18:00" value={form.flightOutbound.arrivalDate}        onChangeText={v => setLeg('flightOutbound', { arrivalDate: v })} /></View>
            </View>

            <Text style={[s.label, { marginTop: 12 }]}>Volta</Text>
            <FormInput label="Companhia"           value={form.flightReturn.airline}            onChangeText={v => setLeg('flightReturn', { airline: v })} />
            <FormInput label="Cidade de origem"    value={form.flightReturn.originCity}         onChangeText={v => setLeg('flightReturn', { originCity: v })} />
            <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ flex: 1 }}><FormInput label="Aeroporto origem"      value={form.flightReturn.originAirport}      onChangeText={v => setLeg('flightReturn', { originAirport: v })} /></View>
                <View style={{ flex: 1 }}><FormInput label="Aeroporto destino"     value={form.flightReturn.destinationAirport} onChangeText={v => setLeg('flightReturn', { destinationAirport: v })} /></View>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ flex: 1 }}><FormInput label="Partida"               placeholder="2026-08-19 21:00" value={form.flightReturn.departureDate}      onChangeText={v => setLeg('flightReturn', { departureDate: v })} /></View>
                <View style={{ flex: 1 }}><FormInput label="Chegada"               placeholder="2026-08-20 05:30" value={form.flightReturn.arrivalDate}        onChangeText={v => setLeg('flightReturn', { arrivalDate: v })} /></View>
            </View>
        </View>
    );
}

// ═══════════════════════════════════════════════════════════════════
// STEP 7 — DICAS, CHECKLIST, GASTOS
// ═══════════════════════════════════════════════════════════════════

function emptyChecklist(): ChecklistItem { return { category: 'documentos', item: '', isDefault: false }; }
function emptySpending(): SpendingEntry { return { moduleKey: 'gasto', label: '', icon: '💳', priceValue: '', priceCurrency: 'BRL', receiptUrl: '' }; }

function StepExtras({ form, update }: StepProps) {
    const isActive = (k: ModuleKey) => form.activeModules.includes(k);
    const showAny = isActive('dicas') || isActive('checklist') || isActive('gasto');

    if (!showAny) {
        return (
            <View>
                <SectionHeader title="Dicas, checklist e gastos" />
                <Text style={s.emptyHint}>Nenhum dos módulos opcionais (Dicas, Checklist, Gastos) está ativo. Volte ao passo 4 se quiser ativar.</Text>
            </View>
        );
    }

    return (
        <View>
            <SectionHeader title="Dicas, checklist & gastos" subtitle="Conteúdo extra dos módulos ativos." />

            {isActive('dicas') && (
                <View style={{ marginTop: 8 }}>
                    <Text style={s.repeaterTitle}>💡 Dicas exclusivas (mín. {MIN_TIPS})</Text>
                    <EditableList
                        items={form.generalTips}
                        onItemsChange={v => update('generalTips', v)}
                        placeholder="Ex: Compre o passe Navigo na segunda-feira"
                    />
                </View>
            )}

            {isActive('checklist') && (
                <View style={{ marginTop: 16 }}>
                    <Text style={s.repeaterTitle}>✅ Checklist (mín. {MIN_CHECKLIST})</Text>
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
            )}

            {isActive('gasto') && (
                <View style={{ marginTop: 16 }}>
                    <Text style={s.repeaterTitle}>💳 Estimativa de gastos por pessoa</Text>
                    {form.spendingEntries.map((e, i) => (
                        <View key={i} style={s.spendingCard}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                <Text style={s.checkCat}>{e.label || 'Item'}</Text>
                                <TouchableOpacity onPress={() => update('spendingEntries', form.spendingEntries.filter((_, x) => x !== i))}>
                                    <Ionicons name="trash-outline" size={18} color={theme.colors.error} />
                                </TouchableOpacity>
                            </View>
                            <FormInput label="Categoria" placeholder="🏨 Hospedagem"  value={e.label}      onChangeText={v => { const n = [...form.spendingEntries]; n[i] = { ...n[i], label: v }; update('spendingEntries', n); }} />
                            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
                                <View style={{ flex: 2 }}><FormInput label="Valor"  keyboardType="decimal-pad" value={e.priceValue} onChangeText={v => { const n = [...form.spendingEntries]; n[i] = { ...n[i], priceValue: v }; update('spendingEntries', n); }} /></View>
                                <View style={{ flex: 1 }}>
                                    <CurrencyPicker
                                        label="Moeda"
                                        compact
                                        value={e.priceCurrency || 'BRL'}
                                        onChange={(code) => {
                                            const n = [...form.spendingEntries];
                                            n[i] = { ...n[i], priceCurrency: code };
                                            update('spendingEntries', n);
                                        }}
                                    />
                                </View>
                            </View>
                        </View>
                    ))}
                    <View style={s.chipRow}>
                        {SPENDING_CATS.map(cat => (
                            <TouchableOpacity
                                key={cat}
                                style={s.chipGhost}
                                onPress={() => update('spendingEntries', [...form.spendingEntries, { moduleKey: 'gasto', label: cat, icon: cat.split(' ')[0], priceValue: '', priceCurrency: form.currency, receiptUrl: '' }])}
                            >
                                <Ionicons name="add" size={14} color={theme.colors.primary} />
                                <Text style={s.chipGhostText}>{cat}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}
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
            else update('images', [...form.images, ...fresh].slice(0, 12));
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
            <SectionHeader title="Fotos do roteiro" subtitle="Fotos reais aumentam a conversão. Capa: 3 fotos principais. Galeria: até 12 fotos extras." />

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

            <Text style={[s.repeaterTitle, { marginTop: 20 }]}>Galeria</Text>
            <View style={s.imgGrid}>
                {form.images.map((url, i) => (
                    <View key={i} style={s.imgThumbWrap}>
                        <Image source={{ uri: url }} style={s.imgThumb} resizeMode="cover" />
                        <TouchableOpacity style={s.imgRemove} onPress={() => removeImg('gallery', i)}>
                            <Ionicons name="close" size={14} color="#fff" />
                        </TouchableOpacity>
                    </View>
                ))}
                {form.images.length < 12 && (
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
    moduleCheck: {
        width: 24, height: 24, borderRadius: 12,
        borderWidth: 2, borderColor: theme.colors.borderLight,
        alignItems: 'center', justifyContent: 'center',
    },
    moduleCheckActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },

    syncBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        alignSelf: 'flex-start',
        paddingHorizontal: 12, paddingVertical: 8, marginBottom: 12,
        borderRadius: 8, backgroundColor: theme.colors.primary + '15',
    },
    syncBtnText: { fontSize: 13, color: theme.colors.primary, fontWeight: '700' },

    dayCard: {
        padding: 14, marginBottom: 14, borderRadius: 14,
        borderWidth: 1, borderColor: theme.colors.borderLight,
        backgroundColor: '#fff',
    },
    dayHeader: { fontSize: 15, fontWeight: '800', color: theme.colors.primary, marginBottom: 8 },

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
