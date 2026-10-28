/**
 * VAMO Mobile — Detalhe do Roteiro (visão do Criador)
 * Mostra status, nota de análise, métricas e ações disponíveis.
 * Acessado via /creator-itinerary/[id] a partir de created-itineraries.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    Platform, StatusBar, ActivityIndicator, Animated,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { safeBack } from '../../src/utils/navigation';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../src/theme/theme';
import { haptics } from '../../src/services/haptics';
import { useAuth } from '../../src/contexts/AuthContext';
import { confirm } from '../../src/utils/confirm';
import { notify } from '../../src/utils/notify';
import { formatMoney } from '@vamo/shared/itinerary';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3333/api';

// ─── Types ─────────────────────────────────────────────────────
type ItineraryStatus = 'draft' | 'pending_review' | 'approved' | 'rejected' | 'active' | 'paused' | 'archived';

interface FullItinerary {
    id: string;
    title: string;
    destination: string;
    country: string;
    description: string;
    duration: number;
    price: number;
    rating: number;
    reviewCount: number;
    status: ItineraryStatus;
    approvalNote: string | null;
    approvedAt: string | null;
    updatedAt: string;
    createdAt: string;
    highlights: string[];
    inclusions: string[];
    sales: { id: string; price: number }[];
}

// ─── Status display config ─────────────────────────────────────
const STATUS = {
    draft:          { label: 'Draft',     color: '#64748B', bg: '#F1F5F9', icon: 'create-outline',           gradient: ['#64748B', '#94A3B8'] },
    pending_review: { label: 'Under review',   color: '#D97706', bg: '#FEF3C7', icon: 'time-outline',             gradient: ['#D97706', '#F59E0B'] },
    approved:       { label: 'Approved',     color: '#059669', bg: '#D1FAE5', icon: 'checkmark-circle-outline', gradient: ['#059669', '#10B981'] },
    active:         { label: 'Published',    color: '#059669', bg: '#D1FAE5', icon: 'checkmark-circle',         gradient: ['#059669', '#10B981'] },
    rejected:       { label: 'Rejected',    color: '#DC2626', bg: '#FEE2E2', icon: 'close-circle-outline',     gradient: ['#DC2626', '#EF4444'] },
    paused:         { label: 'Paused',      color: '#9333EA', bg: '#F3E8FF', icon: 'pause-circle-outline',     gradient: ['#9333EA', '#A855F7'] },
    archived:       { label: 'Archived',    color: '#94A3B8', bg: '#F8FAFC', icon: 'archive-outline',          gradient: ['#94A3B8', '#CBD5E1'] },
} as const;

// ─── Metric tile ───────────────────────────────────────────────
function MetricTile({ icon, value, label, color }: { icon: string; value: string; label: string; color?: string }) {
    return (
        <View style={mt.tile}>
            <Ionicons name={icon as any} size={20} color={color ?? theme.colors.primary} />
            <Text style={mt.value}>{value}</Text>
            <Text style={mt.label}>{label}</Text>
        </View>
    );
}
const mt = StyleSheet.create({
    tile: {
        flex: 1, alignItems: 'center', gap: 4,
        backgroundColor: theme.colors.surfaceLight,
        borderRadius: 14, padding: 14,
    },
    value: { fontSize: 18, fontWeight: '800', color: theme.colors.text.primary },
    label: { fontSize: 11, color: theme.colors.text.tertiary },
});

// ─── Main screen ───────────────────────────────────────────────
export default function CreatorItineraryScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { accessToken, isAuthenticated, isLoading: authLoading } = useAuth();

    const [itinerary, setItinerary] = useState<FullItinerary | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const fetchItinerary = useCallback(async () => {
        if (authLoading) return;
        if (!isAuthenticated || !accessToken) {
            setError('Sign in to access the creator area.');
            setLoading(false);
            return;
        }
        if (!id) return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE}/itineraries/${id}/creator`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (res.status === 403) throw new Error('You don\'t have permission to access this itinerary.');
            if (res.status === 401) throw new Error('Sign in to access the creator area.');
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            // Normalise status to lowercase
            setItinerary({ ...data, status: (data.status ?? 'draft').toLowerCase() as ItineraryStatus });
        } catch (err: any) {
            setError(err?.message || 'We couldn\'t load the itinerary.');
            console.error('[creator-itinerary] erro:', err?.message);
        } finally {
            setLoading(false);
        }
    }, [id, accessToken, authLoading, isAuthenticated]);

    useEffect(() => { fetchItinerary(); }, [fetchItinerary]);

    // Fade-in após carregar
    useEffect(() => {
        if (!loading && itinerary) {
            Animated.timing(fadeAnim, {
                toValue: 1, duration: 300, useNativeDriver: true,
            }).start();
        }
    }, [loading, itinerary]);

    // ── Reenviar para análise (após rejeição) ───────────────────
    // confirm()/notify() em vez de Alert.alert: Alert com botões é no-op no
    // web, e o botão não fazia nada no navegador do celular.
    const resubmit = async () => {
        if (!itinerary || !accessToken) {
            notify({ title: 'Session expired', message: 'Sign in again to continue.', variant: 'warning' });
            return;
        }
        haptics.medium();
        const ok = await confirm({
            title: 'Resubmit for review',
            message: 'Make sure you\'ve fixed the points raised in the rejection before resubmitting.',
            confirmText: 'Reenviar',
            variant: 'info',
        });
        if (!ok) return;
        setSubmitting(true);
        try {
            const res = await fetch(`${API_BASE}/itineraries/${itinerary.id}/creator/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
                body: JSON.stringify({ status: 'PENDING_REVIEW' }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err?.error || 'Couldn\'t resubmit');
            }
            haptics.success();
            setItinerary(prev => prev ? { ...prev, status: 'pending_review', approvalNote: null } : prev);
            notify({ title: 'Submitted for review', message: 'The VAMO team will review it and you\'ll get an email with the result.', variant: 'success' });
        } catch (err: any) {
            notify({ title: 'Error', message: err?.message || 'We couldn\'t resubmit.', variant: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    // ── Pausar / publicar novamente ──────────────────────────────
    const togglePause = async () => {
        if (!itinerary || !accessToken) {
            notify({ title: 'Session expired', message: 'Sign in again to continue.', variant: 'warning' });
            return;
        }
        const isActive = itinerary.status === 'active';
        const newStatus = isActive ? 'PAUSED' : 'ACTIVE';
        const label = isActive ? 'Pause itinerary' : 'Publish itinerary';
        haptics.light();
        const ok = await confirm({
            title: label,
            message: isActive
                ? 'The itinerary will be hidden from the marketplace while paused. People who already bought it keep their access.'
                : 'The itinerary will appear in the marketplace and can be purchased.',
            confirmText: label,
            variant: isActive ? 'warning' : 'success',
        });
        if (!ok) return;
        try {
            const res = await fetch(`${API_BASE}/itineraries/${itinerary.id}/creator/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
                body: JSON.stringify({ status: newStatus }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err?.error || 'Failed');
            }
            haptics.success();
            setItinerary(prev => prev ? { ...prev, status: newStatus.toLowerCase() as ItineraryStatus } : prev);
            notify({ title: isActive ? 'Itinerary paused' : 'Itinerary published!', message: isActive ? 'It is no longer in the marketplace.' : 'It now appears in the marketplace.', variant: 'success' });
        } catch (err: any) {
            notify({ title: 'Error', message: err?.message || 'We couldn\'t change the status.', variant: 'error' });
        }
    };

    // ─── Loading / Error ────────────────────────────────────────
    if (loading) {
        return (
            <View style={s.center}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }
    if (error || !itinerary) {
        return (
            <View style={s.center}>
                <Ionicons name="cloud-offline-outline" size={48} color={theme.colors.text.tertiary} />
                <Text style={s.errorText}>{error ?? 'Itinerary not found'}</Text>
                {isAuthenticated ? (
                    <TouchableOpacity style={s.retryBtn} onPress={fetchItinerary}>
                        <Text style={s.retryText}>Try again</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={s.retryBtn} onPress={() => router.replace({ pathname: '/login' as any, params: { next: `/creator-itinerary/${id}` } })}>
                        <Text style={s.retryText}>Sign in</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    }

    const cfg = STATUS[itinerary.status] ?? STATUS.draft;
    const totalRevenue = (itinerary.sales ?? []).reduce((sum, s) => sum + s.price, 0);
    const totalSales = (itinerary.sales ?? []).length;

    return (
        <View style={s.root}>
            <StatusBar barStyle="light-content" />

            {/* ── Gradient header with status ── */}
            <LinearGradient
                colors={cfg.gradient as unknown as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.header}
            >
                <TouchableOpacity style={s.backBtn} onPress={() => safeBack(router, '/created-itineraries')}>
                    <Ionicons name="arrow-back" size={22} color="#fff" />
                </TouchableOpacity>
                <View style={s.headerContent}>
                    <View style={s.statusRow}>
                        <Ionicons name={cfg.icon as any} size={16} color="#fff" />
                        <Text style={s.statusLabel}>{cfg.label}</Text>
                    </View>
                    <Text style={s.headerTitle} numberOfLines={2}>{itinerary.title}</Text>
                    <Text style={s.headerMeta}>
                        {itinerary.destination}, {itinerary.country} · {itinerary.duration} dias · {formatMoney(itinerary.price)}
                    </Text>
                </View>
            </LinearGradient>

            <Animated.ScrollView
                style={{ flex: 1, opacity: fadeAnim }}
                contentContainerStyle={s.scroll}
                showsVerticalScrollIndicator={false}
            >
                {/* ── Nota de reprovação ── */}
                {itinerary.status === 'rejected' && itinerary.approvalNote && (
                    <View style={s.rejectionCard}>
                        <View style={s.rejectionHeader}>
                            <Ionicons name="close-circle" size={20} color={theme.colors.error} />
                            <Text style={s.rejectionTitle}>Reason for rejection</Text>
                        </View>
                        <Text style={s.rejectionNote}>{itinerary.approvalNote}</Text>
                        <TouchableOpacity
                            style={[s.actionBtn, s.actionBtnPrimary, submitting && s.actionBtnDisabled]}
                            onPress={resubmit}
                            disabled={submitting}
                        >
                            {submitting
                                ? <ActivityIndicator color="#fff" size="small" />
                                : <>
                                    <Ionicons name="refresh" size={16} color="#fff" />
                                    <Text style={s.actionBtnText}>Resubmit for review</Text>
                                </>
                            }
                        </TouchableOpacity>
                    </View>
                )}

                {/* ── Aguardando análise ── */}
                {itinerary.status === 'pending_review' && (
                    <View style={s.pendingCard}>
                        <Ionicons name="time" size={24} color="#D97706" />
                        <View style={{ flex: 1 }}>
                            <Text style={s.pendingTitle}>Waiting for review</Text>
                            <Text style={s.pendingText}>Our team reviews within 48 hours. You'll be notified when it's approved.</Text>
                        </View>
                    </View>
                )}

                {/* ── Aprovado (aguardando ativação) ── */}
                {itinerary.status === 'approved' && (
                    <View style={s.approvedCard}>
                        <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />
                        <View style={{ flex: 1 }}>
                            <Text style={s.approvedTitle}>Itinerary approved! 🎉</Text>
                            <Text style={s.approvedText}>Your itinerary was approved by the VAMO team. Publish it when you're ready to sell in the marketplace.</Text>
                        </View>
                    </View>
                )}

                {/* ── Rascunho ── */}
                {itinerary.status === 'draft' && (
                    <View style={s.draftCard}>
                        <Ionicons name="create-outline" size={20} color="#64748B" />
                        <View style={{ flex: 1 }}>
                            <Text style={s.draftTitle}>Draft not submitted</Text>
                            <Text style={s.draftText}>Complete it and submit for review to publish in the marketplace.</Text>
                        </View>
                    </View>
                )}

                {/* ── Métricas (só se publicado) ── */}
                {(itinerary.status === 'active' || itinerary.status === 'paused') && (
                    <>
                        <Text style={s.sectionTitle}>Performance</Text>
                        <View style={s.metricsRow}>
                            <MetricTile icon="cart-outline" value={String(totalSales)} label="sales" color={theme.colors.primary} />
                            <MetricTile icon="cash-outline" value={formatMoney(totalRevenue)} label="receita" color={theme.colors.success} />
                            {itinerary.rating > 0 && (
                                <MetricTile icon="star" value={itinerary.rating.toFixed(1)} label="review" color="#F59E0B" />
                            )}
                        </View>
                    </>
                )}

                {/* ── Detalhes do roteiro ── */}
                <Text style={s.sectionTitle}>Description</Text>
                <Text style={s.description}>{itinerary.description || '—'}</Text>

                {itinerary.highlights?.length > 0 && (
                    <>
                        <Text style={s.sectionTitle}>Highlights</Text>
                        <View style={s.listCard}>
                            {itinerary.highlights.map((h, i) => (
                                <View key={i} style={s.listRow}>
                                    <Ionicons name="star-outline" size={14} color={theme.colors.primary} />
                                    <Text style={s.listText}>{h}</Text>
                                </View>
                            ))}
                        </View>
                    </>
                )}

                {itinerary.inclusions?.length > 0 && (
                    <>
                        <Text style={s.sectionTitle}>What's included</Text>
                        <View style={s.listCard}>
                            {itinerary.inclusions.map((inc, i) => (
                                <View key={i} style={s.listRow}>
                                    <Ionicons name="checkmark-circle-outline" size={14} color={theme.colors.success} />
                                    <Text style={s.listText}>{inc}</Text>
                                </View>
                            ))}
                        </View>
                    </>
                )}

                {/* ── Datas ── */}
                <View style={s.datesCard}>
                    <View style={s.dateRow}>
                        <Text style={s.dateLabel}>Created on</Text>
                        <Text style={s.dateValue}>{new Date(itinerary.createdAt).toLocaleDateString('en-US')}</Text>
                    </View>
                    <View style={s.dateRow}>
                        <Text style={s.dateLabel}>Last updated</Text>
                        <Text style={s.dateValue}>{new Date(itinerary.updatedAt).toLocaleDateString('en-US')}</Text>
                    </View>
                    {itinerary.approvedAt && (
                        <View style={s.dateRow}>
                            <Text style={s.dateLabel}>Approved on</Text>
                            <Text style={s.dateValue}>{new Date(itinerary.approvedAt).toLocaleDateString('en-US')}</Text>
                        </View>
                    )}
                </View>

                {/* ── Ações secundárias ── */}
                <View style={s.actionsSection}>
                    {itinerary.status === 'active' && (
                        <TouchableOpacity style={[s.actionBtn, s.actionBtnSecondary]} onPress={togglePause}>
                            <Ionicons name="pause-circle-outline" size={16} color="#9333EA" />
                            <Text style={[s.actionBtnText, { color: '#9333EA' }]}>Pause itinerary</Text>
                        </TouchableOpacity>
                    )}
                    {itinerary.status === 'paused' && (
                        <TouchableOpacity style={[s.actionBtn, s.actionBtnSecondary]} onPress={togglePause}>
                            <Ionicons name="play-circle-outline" size={16} color={theme.colors.success} />
                            <Text style={[s.actionBtnText, { color: theme.colors.success }]}>Publish again</Text>
                        </TouchableOpacity>
                    )}
                    {itinerary.status === 'approved' && (
                        <TouchableOpacity style={[s.actionBtn, s.actionBtnSecondary]} onPress={togglePause}>
                            <Ionicons name="play-circle-outline" size={16} color={theme.colors.success} />
                            <Text style={[s.actionBtnText, { color: theme.colors.success }]}>Publish itinerary</Text>
                        </TouchableOpacity>
                    )}
                    {(itinerary.status === 'draft' || itinerary.status === 'rejected') && (
                        <TouchableOpacity
                            style={[s.actionBtn, s.actionBtnPrimary]}
                            onPress={() => {
                                haptics.light();
                                router.push(`/new-itinerary?id=${encodeURIComponent(itinerary.id)}` as any);
                            }}
                        >
                            <Ionicons name="create-outline" size={16} color="#fff" />
                            <Text style={s.actionBtnText}>Edit itinerary</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <View style={{ height: 40 }} />
            </Animated.ScrollView>
        </View>
    );
}

// ─── Styles ────────────────────────────────────────────────────
const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.colors.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, padding: 32 },
    errorText: { fontSize: 15, color: theme.colors.text.secondary, textAlign: 'center' },
    retryBtn: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: theme.colors.primary, borderRadius: 10 },
    retryText: { fontSize: 14, fontWeight: '600', color: '#fff' },

    // Header
    header: {
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 28, paddingHorizontal: 20,
    },
    backBtn: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: 'rgba(0,0,0,0.2)',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 16,
    },
    headerContent: { gap: 6 },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    statusLabel: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.9)', textTransform: 'uppercase', letterSpacing: 0.5 },
    headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff', lineHeight: 28 },
    headerMeta: { fontSize: 13, color: 'rgba(255,255,255,0.75)' },

    // Scroll content
    scroll: { padding: 20 },
    sectionTitle: { fontSize: 14, fontWeight: '700', color: theme.colors.text.primary, marginBottom: 10, marginTop: 20 },
    description: { fontSize: 15, color: theme.colors.text.secondary, lineHeight: 22 },

    // Rejection card
    rejectionCard: {
        backgroundColor: '#FEF2F2', borderRadius: 14, padding: 16,
        borderWidth: 1, borderColor: '#FECACA', gap: 12,
    },
    rejectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    rejectionTitle: { fontSize: 15, fontWeight: '700', color: theme.colors.error },
    rejectionNote: { fontSize: 14, color: '#7F1D1D', lineHeight: 20 },

    // Pending card
    pendingCard: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 12,
        backgroundColor: '#FEF3C7', borderRadius: 14, padding: 16,
        borderWidth: 1, borderColor: '#FDE68A',
    },
    pendingTitle: { fontSize: 14, fontWeight: '700', color: '#92400E', marginBottom: 4 },
    pendingText: { fontSize: 13, color: '#92400E', lineHeight: 18 },

    // Approved card
    approvedCard: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 12,
        backgroundColor: '#D1FAE5', borderRadius: 14, padding: 16,
        borderWidth: 1, borderColor: '#6EE7B7',
    },
    approvedTitle: { fontSize: 14, fontWeight: '700', color: '#065F46', marginBottom: 4 },
    approvedText: { fontSize: 13, color: '#047857', lineHeight: 18 },

    // Draft card
    draftCard: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 12,
        backgroundColor: theme.colors.surfaceLight, borderRadius: 14, padding: 16,
        borderWidth: 1, borderColor: theme.colors.borderLight,
    },
    draftTitle: { fontSize: 14, fontWeight: '700', color: theme.colors.text.primary, marginBottom: 4 },
    draftText: { fontSize: 13, color: theme.colors.text.secondary, lineHeight: 18 },

    // Metrics
    metricsRow: { flexDirection: 'row', gap: 10 },

    // List card
    listCard: { gap: 10 },
    listRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    listText: { flex: 1, fontSize: 14, color: theme.colors.text.primary, lineHeight: 20 },

    // Dates
    datesCard: {
        backgroundColor: theme.colors.surfaceLight, borderRadius: 14,
        padding: 14, gap: 10, marginTop: 8,
    },
    dateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    dateLabel: { fontSize: 13, color: theme.colors.text.tertiary },
    dateValue: { fontSize: 13, fontWeight: '600', color: theme.colors.text.primary },

    // Actions
    actionsSection: { gap: 10, marginTop: 24 },
    actionBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, borderRadius: 14, height: 50,
    },
    actionBtnPrimary: { backgroundColor: theme.colors.primary, ...theme.shadows.button },
    actionBtnSecondary: { borderWidth: 1.5, borderColor: theme.colors.border },
    actionBtnDisabled: { opacity: 0.6 },
    actionBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
