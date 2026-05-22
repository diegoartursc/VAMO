/**
 * VAMO Mobile — Wizard de Criação de Roteiro
 * 7 passos (Airbnb-style): um campo por tela, autosave por passo.
 * Conecta à API real via AuthContext.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ScrollView, Platform, StatusBar, ActivityIndicator,
    KeyboardAvoidingView, Alert, Animated, Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../src/theme/theme';
import { haptics } from '../src/services/haptics';
import { useAuth } from '../src/contexts/AuthContext';
import EditableList from '../src/components/dashboard/EditableList';
import FormInput from '../src/components/dashboard/FormInput';

const DRAFT_KEY = '@vamo_draft_itinerary';
const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3333/api';

// ─── Types ─────────────────────────────────────────────────────
interface DraftItinerary {
    id?: string;
    destination: string;
    country: string;
    title: string;
    description: string;
    duration: number | '';
    price: number | '';
    highlights: string[];
    inclusions: string[];
    currentStep: number;
}

const INITIAL_DRAFT: DraftItinerary = {
    destination: '',
    country: '',
    title: '',
    description: '',
    duration: '',
    price: '',
    highlights: [],
    inclusions: ['Roteiro completo dia a dia', 'Dicas exclusivas do criador', 'Estimativa de gastos'],
    currentStep: 0,
};

// ─── Progress bar animada ──────────────────────────────────────
function ProgressBar({ step, total }: { step: number; total: number }) {
    const anim = useRef(new Animated.Value((step - 1) / total)).current;

    useEffect(() => {
        Animated.spring(anim, {
            toValue: step / total,
            useNativeDriver: false,
            tension: 60,
            friction: 10,
        }).start();
    }, [step]);

    const widthPct = anim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
        extrapolate: 'clamp',
    });

    return (
        <View style={pb.container}>
            <View style={pb.track}>
                <Animated.View style={[pb.fill, { width: widthPct }]} />
            </View>
        </View>
    );
}
const pb = StyleSheet.create({
    container: { paddingHorizontal: 20, marginBottom: 4 },
    track: {
        height: 4, borderRadius: 2,
        backgroundColor: theme.colors.borderLight,
        overflow: 'hidden',
    },
    fill: { height: '100%', borderRadius: 2, backgroundColor: theme.colors.primary },
});

// ─── Main screen ───────────────────────────────────────────────
export default function NewItineraryScreen() {
    const router = useRouter();
    const { accessToken } = useAuth();
    const [step, setStep] = useState(1); // 1-indexed, max = 7
    const [draft, setDraft] = useState<DraftItinerary>(INITIAL_DRAFT);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Partial<Record<keyof DraftItinerary, string>>>({});
    const [showResumeDraft, setShowResumeDraft] = useState(false);
    const [pendingDraft, setPendingDraft] = useState<DraftItinerary | null>(null);

    const TOTAL_STEPS = 7;

    // Hidratar rascunho salvo — mostra modal em vez de carregar direto
    useEffect(() => {
        AsyncStorage.getItem(DRAFT_KEY).then(raw => {
            if (raw) {
                try {
                    const saved: DraftItinerary = JSON.parse(raw);
                    // Só mostra o modal se tiver algo preenchido de verdade
                    if (saved.destination || saved.title) {
                        setPendingDraft(saved);
                        setShowResumeDraft(true);
                    }
                } catch { /* ignora */ }
            }
        });
    }, []);

    const resumeDraft = useCallback(() => {
        if (pendingDraft) {
            setDraft(pendingDraft);
            setStep(pendingDraft.currentStep || 1);
        }
        setShowResumeDraft(false);
        setPendingDraft(null);
    }, [pendingDraft]);

    const discardDraft = useCallback(() => {
        AsyncStorage.removeItem(DRAFT_KEY);
        setShowResumeDraft(false);
        setPendingDraft(null);
        setDraft(INITIAL_DRAFT);
        setStep(1);
    }, []);

    // Salvar rascunho localmente a cada mudança
    const saveDraftLocally = useCallback((d: DraftItinerary, s: number) => {
        AsyncStorage.setItem(DRAFT_KEY, JSON.stringify({ ...d, currentStep: s }));
    }, []);

    const updateDraft = useCallback((key: keyof DraftItinerary, value: any) => {
        setDraft(prev => {
            const next = { ...prev, [key]: value };
            saveDraftLocally(next, step);
            return next;
        });
        if (errors[key]) setErrors(prev => ({ ...prev, [key]: undefined }));
    }, [step, errors, saveDraftLocally]);

    // ── Validação por passo ─────────────────────────────────────
    const validateStep = (s: number): boolean => {
        const errs: typeof errors = {};
        if (s === 1) {
            if (!draft.destination.trim()) errs.destination = 'Informe o destino';
            if (!draft.country.trim()) errs.country = 'Informe o país';
        }
        if (s === 2 && !draft.title.trim()) errs.title = 'Informe o título';
        if (s === 3 && !draft.description.trim()) errs.description = 'Escreva uma descrição';
        if (s === 4) {
            if (!draft.duration || Number(draft.duration) < 1) errs.duration = 'Mínimo 1 dia';
            if (!draft.price || Number(draft.price) < 0) errs.price = 'Informe o preço';
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    // ── Criar rascunho na API (passo 1 → 2) ────────────────────
    const createDraftOnApi = async () => {
        if (!accessToken) return;
        try {
            const res = await fetch(`${API_BASE}/itineraries`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
                body: JSON.stringify({
                    title: draft.title || draft.destination || 'Rascunho',
                    destination: draft.destination,
                    country: draft.country,
                    description: draft.description || 'Rascunho',
                    duration: Number(draft.duration) || 1,
                    price: Number(draft.price) || 0,
                    status: 'DRAFT',
                    highlights: draft.highlights,
                    inclusions: draft.inclusions,
                    images: [],
                    days: [],
                }),
            });
            if (res.ok) {
                const data = await res.json();
                const newDraft = { ...draft, id: data.id };
                setDraft(newDraft);
                saveDraftLocally(newDraft, step + 1);
            }
        } catch (err) {
            console.warn('[new-itinerary] erro ao criar rascunho na API:', err);
        }
    };

    // ── Atualizar rascunho na API ───────────────────────────────
    const updateDraftOnApi = async (extraFields?: Partial<DraftItinerary>) => {
        if (!accessToken || !draft.id) return;
        const d = { ...draft, ...extraFields };
        try {
            await fetch(`${API_BASE}/itineraries/${draft.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
                body: JSON.stringify({
                    title: d.title,
                    destination: d.destination,
                    country: d.country,
                    description: d.description,
                    duration: Number(d.duration) || 1,
                    price: Number(d.price) || 0,
                    highlights: d.highlights,
                    inclusions: d.inclusions,
                }),
            });
        } catch (err) {
            console.warn('[new-itinerary] erro ao atualizar rascunho:', err);
        }
    };

    // ── Enviar para revisão ─────────────────────────────────────
    const submitForReview = async () => {
        if (!validateStep(step)) return;
        setSaving(true);
        try {
            // Se ainda não tem ID, cria primeiro
            if (!draft.id) await createDraftOnApi();
            if (draft.id) {
                const res = await fetch(`${API_BASE}/itineraries/${draft.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
                    body: JSON.stringify({
                        title: draft.title,
                        destination: draft.destination,
                        country: draft.country,
                        description: draft.description,
                        duration: Number(draft.duration) || 1,
                        price: Number(draft.price) || 0,
                        highlights: draft.highlights,
                        inclusions: draft.inclusions,
                        status: 'PENDING_REVIEW',
                    }),
                });
                if (!res.ok) throw new Error('Falha ao enviar');
            }
            haptics.success();
            await AsyncStorage.removeItem(DRAFT_KEY);
            router.replace('/await-review');
        } catch (err: any) {
            Alert.alert('Erro', err?.message || 'Não foi possível enviar. Tente novamente.');
        } finally {
            setSaving(false);
        }
    };

    // ── Avançar passo ───────────────────────────────────────────
    const goNext = useCallback(async () => {
        if (!validateStep(step)) return;
        haptics.light();

        // No passo 1 (destino preenchido), criar rascunho na API
        if (step === 1 && !draft.id && accessToken) {
            setSaving(true);
            await createDraftOnApi();
            setSaving(false);
        } else if (draft.id && step >= 2) {
            updateDraftOnApi();
        }

        if (step === TOTAL_STEPS) {
            submitForReview();
            return;
        }

        const nextStep = step + 1;
        setStep(nextStep);
        saveDraftLocally(draft, nextStep);
    }, [step, draft, accessToken]);

    // ── Voltar passo ────────────────────────────────────────────
    const goBack = useCallback(() => {
        haptics.light();
        if (step === 1) { router.back(); return; }
        const prevStep = step - 1;
        setStep(prevStep);
        saveDraftLocally(draft, prevStep);
    }, [step, draft, router]);

    // ── Render por passo ────────────────────────────────────────
    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <View style={s.stepContent}>
                        <Text style={s.stepQuestion}>Para onde é o roteiro?</Text>
                        <Text style={s.stepHint}>Escolha a cidade ou região principal do seu roteiro.</Text>
                        <FormInput
                            label="Destino"
                            required
                            placeholder="Ex: Paris, Tóquio, Chapada Diamantina"
                            value={draft.destination}
                            onChangeText={v => updateDraft('destination', v)}
                            error={errors.destination}
                            autoFocus
                            returnKeyType="next"
                        />
                        <FormInput
                            label="País"
                            required
                            placeholder="Ex: França, Japão, Brasil"
                            value={draft.country}
                            onChangeText={v => updateDraft('country', v)}
                            error={errors.country}
                            returnKeyType="done"
                        />
                    </View>
                );
            case 2:
                return (
                    <View style={s.stepContent}>
                        <Text style={s.stepQuestion}>Qual é o título do roteiro?</Text>
                        <Text style={s.stepHint}>Um bom título é específico e descreve a experiência. Pense no viajante que vai comprar.</Text>
                        <FormInput
                            label="Título"
                            required
                            placeholder="Ex: 7 dias em Paris sem gastar uma fortuna"
                            value={draft.title}
                            onChangeText={v => updateDraft('title', v)}
                            error={errors.title}
                            autoFocus
                            maxLength={80}
                        />
                        {draft.title.length > 0 && (
                            <Text style={s.charCount}>{draft.title.length}/80 caracteres</Text>
                        )}
                    </View>
                );
            case 3:
                return (
                    <View style={s.stepContent}>
                        <Text style={s.stepQuestion}>Descreva sua experiência</Text>
                        <Text style={s.stepHint}>Escreva como se estivesse contando para um amigo por que vale a pena esse roteiro.</Text>
                        <FormInput
                            label="Descrição"
                            required
                            placeholder="Compartilhe o que torna esse roteiro especial, as principais experiências e o que o viajante vai descobrir..."
                            value={draft.description}
                            onChangeText={v => updateDraft('description', v)}
                            error={errors.description}
                            multiline
                            numberOfLines={5}
                            autoFocus
                            maxLength={500}
                        />
                        {draft.description.length > 0 && (
                            <Text style={s.charCount}>{draft.description.length}/500 caracteres</Text>
                        )}
                    </View>
                );
            case 4:
                return (
                    <View style={s.stepContent}>
                        <Text style={s.stepQuestion}>Duração e preço</Text>
                        <Text style={s.stepHint}>Quantos dias dura o roteiro e quanto você quer cobrar por ele?</Text>
                        <FormInput
                            label="Duração (dias)"
                            required
                            placeholder="Ex: 7"
                            value={draft.duration === '' ? '' : String(draft.duration)}
                            onChangeText={v => updateDraft('duration', v ? parseInt(v) || '' : '')}
                            error={errors.duration}
                            keyboardType="number-pad"
                            suffix="dias"
                            autoFocus
                        />
                        <FormInput
                            label="Preço"
                            required
                            placeholder="Ex: 59,90"
                            value={draft.price === '' ? '' : String(draft.price)}
                            onChangeText={v => updateDraft('price', v ? parseFloat(v.replace(',', '.')) || '' : '')}
                            error={errors.price}
                            keyboardType="decimal-pad"
                            prefix="R$"
                        />
                        <View style={s.priceHint}>
                            <Ionicons name="information-circle-outline" size={14} color={theme.colors.text.tertiary} />
                            <Text style={s.priceHintText}>A VAMO retém 20% por venda. Você recebe 80% do valor.</Text>
                        </View>
                    </View>
                );
            case 5:
                return (
                    <ScrollView style={{ flex: 1 }} contentContainerStyle={s.stepContent} showsVerticalScrollIndicator={false}>
                        <Text style={s.stepQuestion}>Destaques e inclui</Text>
                        <Text style={s.stepHint}>O que torna seu roteiro único? O que o viajante vai receber?</Text>
                        <View style={s.listSection}>
                            <Text style={s.listLabel}>⭐ Destaques do roteiro</Text>
                            <Text style={s.listSublabel}>Experiências marcantes que o viajante vai ter</Text>
                            <EditableList
                                items={draft.highlights}
                                onItemsChange={items => updateDraft('highlights', items)}
                                placeholder="Ex: Pôr do sol no Sacré-Cœur"
                                maxItems={8}
                                emptyMessage="Adicione pelo menos 3 destaques"
                            />
                        </View>
                        <View style={[s.listSection, { marginTop: 24 }]}>
                            <Text style={s.listLabel}>📦 O que está incluso</Text>
                            <Text style={s.listSublabel}>O que o viajante recebe ao comprar</Text>
                            <EditableList
                                items={draft.inclusions}
                                onItemsChange={items => updateDraft('inclusions', items)}
                                placeholder="Ex: Planilha de gastos personalizada"
                                maxItems={10}
                            />
                        </View>
                    </ScrollView>
                );
            case 6:
                return (
                    <View style={s.stepContent}>
                        <Text style={s.stepQuestion}>Fotos do roteiro</Text>
                        <Text style={s.stepHint}>Boas fotos aumentam muito as vendas. Você pode adicionar fotos depois pelo painel web.</Text>
                        <View style={s.photosPlaceholder}>
                            <Ionicons name="images-outline" size={48} color={theme.colors.text.tertiary} />
                            <Text style={s.photosPlaceholderTitle}>Upload de fotos em breve</Text>
                            <Text style={s.photosPlaceholderSub}>
                                No momento, adicione as fotos pelo painel web em{'\n'}
                                <Text style={{ color: theme.colors.primary }}>vamo.app/dashboard</Text>
                            </Text>
                        </View>
                        <View style={s.skipPhotosHint}>
                            <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
                            <Text style={s.skipPhotosText}>Você pode continuar sem fotos agora e adicioná-las depois.</Text>
                        </View>
                    </View>
                );
            case 7:
                return (
                    <ScrollView style={{ flex: 1 }} contentContainerStyle={s.stepContent} showsVerticalScrollIndicator={false}>
                        <Text style={s.stepQuestion}>Tudo pronto para enviar?</Text>
                        <Text style={s.stepHint}>Revise seu roteiro antes de enviar para análise da equipe VAMO.</Text>

                        {/* Preview card */}
                        <View style={s.previewCard}>
                            <View style={s.previewHeader}>
                                <Text style={s.previewEmoji}>🗺️</Text>
                                <View style={{ flex: 1 }}>
                                    <Text style={s.previewTitle} numberOfLines={2}>{draft.title || 'Sem título'}</Text>
                                    <Text style={s.previewDest}>{draft.destination}{draft.country ? `, ${draft.country}` : ''}</Text>
                                </View>
                            </View>
                            <View style={s.previewMeta}>
                                <View style={s.previewMetaItem}>
                                    <Ionicons name="calendar-outline" size={14} color={theme.colors.text.tertiary} />
                                    <Text style={s.previewMetaText}>{draft.duration || '—'} dias</Text>
                                </View>
                                <View style={s.previewMetaItem}>
                                    <Ionicons name="cash-outline" size={14} color={theme.colors.text.tertiary} />
                                    <Text style={s.previewMetaText}>R$ {draft.price || '0,00'}</Text>
                                </View>
                                <View style={s.previewMetaItem}>
                                    <Ionicons name="star-outline" size={14} color={theme.colors.text.tertiary} />
                                    <Text style={s.previewMetaText}>{draft.highlights.length} destaques</Text>
                                </View>
                            </View>
                        </View>

                        {/* Checklist */}
                        <View style={s.checklistCard}>
                            <Text style={s.checklistTitle}>Checklist</Text>
                            {[
                                { label: 'Destino e país', ok: !!draft.destination && !!draft.country },
                                { label: 'Título', ok: !!draft.title },
                                { label: 'Descrição', ok: !!draft.description },
                                { label: 'Duração e preço', ok: !!draft.duration && draft.price !== '' },
                                { label: 'Destaques (min. 1)', ok: draft.highlights.length >= 1 },
                                { label: 'O que inclui (min. 1)', ok: draft.inclusions.length >= 1 },
                            ].map(({ label, ok }) => (
                                <View key={label} style={s.checklistRow}>
                                    <Ionicons
                                        name={ok ? 'checkmark-circle' : 'ellipse-outline'}
                                        size={18}
                                        color={ok ? theme.colors.success : theme.colors.text.tertiary}
                                    />
                                    <Text style={[s.checklistLabel, !ok && s.checklistLabelMissing]}>
                                        {label}
                                    </Text>
                                </View>
                            ))}
                        </View>

                        {/* Info de revisão */}
                        <View style={s.reviewInfo}>
                            <Ionicons name="time-outline" size={16} color={theme.colors.warning} />
                            <Text style={s.reviewInfoText}>Nossa equipe analisa em até 48h após o envio.</Text>
                        </View>
                    </ScrollView>
                );
            default:
                return null;
        }
    };

    const stepLabels = [
        'Destino', 'Título', 'Descrição', 'Preço', 'Destaques', 'Fotos', 'Revisão',
    ];

    return (
        <KeyboardAvoidingView
            style={s.root}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <StatusBar barStyle="dark-content" />

            {/* ── Modal: retomar rascunho ── */}
            <Modal
                visible={showResumeDraft}
                transparent
                animationType="fade"
                onRequestClose={() => setShowResumeDraft(false)}
            >
                <View style={s.modalOverlay}>
                    <View style={s.modalCard}>
                        <Text style={s.modalEmoji}>📋</Text>
                        <Text style={s.modalTitle}>Rascunho encontrado</Text>
                        <Text style={s.modalSubtitle}>
                            Você tem um roteiro não finalizado.{'\n'}
                            {pendingDraft?.destination
                                ? `"${pendingDraft.destination}${pendingDraft.country ? `, ${pendingDraft.country}` : ''}" — passo ${pendingDraft.currentStep || 1} de ${TOTAL_STEPS}`
                                : 'Deseja continuar de onde parou?'}
                        </Text>
                        <TouchableOpacity style={s.modalPrimary} onPress={resumeDraft}>
                            <Ionicons name="play" size={16} color="#fff" />
                            <Text style={s.modalPrimaryText}>Continuar rascunho</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={s.modalSecondary} onPress={discardDraft}>
                            <Text style={s.modalSecondaryText}>Descartar e começar do zero</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Header */}
            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={goBack}>
                    <Ionicons name="arrow-back" size={22} color={theme.colors.text.primary} />
                </TouchableOpacity>
                <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={s.headerStep}>Passo {step} de {TOTAL_STEPS}</Text>
                    <Text style={s.headerLabel}>{stepLabels[step - 1]}</Text>
                </View>
                <TouchableOpacity
                    style={s.saveBtn}
                    onPress={() => {
                        haptics.light();
                        saveDraftLocally(draft, step);
                        Alert.alert('✓ Rascunho salvo', 'Você pode retomar mais tarde pelo app.');
                    }}
                >
                    <Text style={s.saveBtnText}>Salvar</Text>
                </TouchableOpacity>
            </View>

            {/* Progress bar */}
            <ProgressBar step={step} total={TOTAL_STEPS} />

            {/* Content */}
            <View style={{ flex: 1 }}>
                {renderStep()}
            </View>

            {/* Footer CTA */}
            <View style={s.footer}>
                <TouchableOpacity
                    style={[s.nextBtn, saving && s.nextBtnDisabled]}
                    onPress={step === TOTAL_STEPS ? submitForReview : goNext}
                    disabled={saving}
                    activeOpacity={0.85}
                >
                    {saving ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <>
                            <Text style={s.nextBtnText}>
                                {step === TOTAL_STEPS ? 'Enviar para análise' : 'Próximo'}
                            </Text>
                            <Ionicons name={step === TOTAL_STEPS ? 'checkmark' : 'arrow-forward'} size={18} color="#fff" />
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

// ─── Styles ────────────────────────────────────────────────────
const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.colors.background },
    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 12, paddingHorizontal: 16,
    },
    backBtn: {
        width: 40, height: 40, alignItems: 'center', justifyContent: 'center',
        borderRadius: 20, backgroundColor: theme.colors.surfaceLight,
    },
    headerStep: { fontSize: 11, color: theme.colors.text.tertiary, fontWeight: '500' },
    headerLabel: { fontSize: 15, fontWeight: '700', color: theme.colors.text.primary },
    saveBtn: { paddingHorizontal: 12, paddingVertical: 8 },
    saveBtnText: { fontSize: 13, color: theme.colors.primary, fontWeight: '600' },

    // Steps
    stepContent: { padding: 24, paddingTop: 32 },
    stepQuestion: {
        fontSize: 24, fontWeight: '800', color: theme.colors.text.primary,
        marginBottom: 8, lineHeight: 30,
    },
    stepHint: {
        fontSize: 14, color: theme.colors.text.secondary, lineHeight: 20,
        marginBottom: 28,
    },
    charCount: {
        fontSize: 12, color: theme.colors.text.tertiary,
        textAlign: 'right', marginTop: -8,
    },
    priceHint: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
    priceHintText: { fontSize: 12, color: theme.colors.text.tertiary, flex: 1 },

    // Lists (step 5)
    listSection: {},
    listLabel: { fontSize: 16, fontWeight: '700', color: theme.colors.text.primary, marginBottom: 4 },
    listSublabel: { fontSize: 13, color: theme.colors.text.secondary, marginBottom: 12 },

    // Photos (step 6)
    photosPlaceholder: {
        borderRadius: 16, borderWidth: 2, borderColor: theme.colors.borderLight,
        borderStyle: 'dashed', padding: 40, alignItems: 'center', gap: 12,
        marginBottom: 20,
    },
    photosPlaceholderTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.text.secondary },
    photosPlaceholderSub: { fontSize: 13, color: theme.colors.text.tertiary, textAlign: 'center', lineHeight: 20 },
    skipPhotosHint: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 8,
        backgroundColor: theme.colors.success + '12',
        borderRadius: 10, padding: 12,
    },
    skipPhotosText: { flex: 1, fontSize: 13, color: theme.colors.success, lineHeight: 18 },

    // Preview card (step 7)
    previewCard: {
        borderRadius: 16, borderWidth: 1.5, borderColor: theme.colors.border,
        padding: 16, marginBottom: 16, backgroundColor: theme.colors.surfaceLight,
    },
    previewHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
    previewEmoji: { fontSize: 28 },
    previewTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.text.primary, lineHeight: 22 },
    previewDest: { fontSize: 13, color: theme.colors.text.secondary, marginTop: 2 },
    previewMeta: { flexDirection: 'row', gap: 16 },
    previewMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    previewMetaText: { fontSize: 13, color: theme.colors.text.secondary },

    // Checklist (step 7)
    checklistCard: {
        borderRadius: 16, borderWidth: 1, borderColor: theme.colors.borderLight,
        padding: 16, gap: 10, marginBottom: 16,
    },
    checklistTitle: { fontSize: 14, fontWeight: '700', color: theme.colors.text.primary, marginBottom: 4 },
    checklistRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    checklistLabel: { fontSize: 14, color: theme.colors.text.primary },
    checklistLabelMissing: { color: theme.colors.text.tertiary },

    // Review info
    reviewInfo: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 8,
        backgroundColor: theme.colors.warning + '15',
        borderRadius: 10, padding: 12,
    },
    reviewInfoText: { flex: 1, fontSize: 13, color: theme.colors.warning, lineHeight: 18 },

    // Footer
    footer: {
        paddingHorizontal: 20,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: theme.colors.borderLight,
        backgroundColor: theme.colors.background,
    },
    nextBtn: {
        backgroundColor: theme.colors.primary, borderRadius: 14, height: 52,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        ...theme.shadows.button,
    },
    nextBtnDisabled: { opacity: 0.7 },
    nextBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },

    // Modal de rascunho
    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalCard: {
        backgroundColor: theme.colors.background,
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        padding: 28, paddingBottom: Platform.OS === 'ios' ? 44 : 28,
        alignItems: 'center', gap: 12,
    },
    modalEmoji: { fontSize: 40, marginBottom: 4 },
    modalTitle: { fontSize: 20, fontWeight: '800', color: theme.colors.text.primary },
    modalSubtitle: {
        fontSize: 14, color: theme.colors.text.secondary,
        textAlign: 'center', lineHeight: 20,
    },
    modalPrimary: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, backgroundColor: theme.colors.primary,
        borderRadius: 14, height: 52, alignSelf: 'stretch',
        marginTop: 8, ...theme.shadows.button,
    },
    modalPrimaryText: { fontSize: 16, fontWeight: '700', color: '#fff' },
    modalSecondary: { paddingVertical: 12 },
    modalSecondaryText: { fontSize: 14, color: theme.colors.error, fontWeight: '500' },
});
