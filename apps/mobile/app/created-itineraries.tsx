/**
 * VAMO Mobile — Meus Roteiros Criados
 * Busca dados reais via GET /api/itineraries/dashboard/stats (auth Bearer).
 * Exibe status, vendas, avaliação e receita por roteiro.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Platform, StatusBar, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../src/theme/theme';
import { haptics } from '../src/services/haptics';
import { useAuth } from '../src/contexts/AuthContext';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3333/api';

// ─── Types ─────────────────────────────────────────────────────
type ItineraryStatus = 'draft' | 'pending_review' | 'approved' | 'rejected' | 'active' | 'paused' | 'archived';

interface CreatorItinerary {
    id: string;
    title: string;
    destination: string;
    country: string;
    status: ItineraryStatus;
    sales: number;
    revenue: number;
    rating: number;
    reviewCount: number;
    duration: number;
    price: number;
    updatedAt: string;
}

interface DashboardStats {
    totalRevenue: number;
    totalSales: number;
    averageRating: number;
    totalReviews: number;
    activeItineraries: number;
    totalItineraries: number;
    itineraries: CreatorItinerary[];
}

// ─── Status config ─────────────────────────────────────────────
const STATUS_CONFIG: Record<ItineraryStatus, { label: string; color: string; bg: string; icon: string }> = {
    draft:          { label: 'Rascunho',       color: '#64748B', bg: '#F1F5F9', icon: 'create-outline' },
    pending_review: { label: 'Em análise',     color: '#D97706', bg: '#FEF3C7', icon: 'time-outline' },
    approved:       { label: 'Aprovado',       color: '#059669', bg: '#D1FAE5', icon: 'checkmark-circle-outline' },
    active:         { label: 'Publicado',      color: '#059669', bg: '#D1FAE5', icon: 'checkmark-circle' },
    rejected:       { label: 'Reprovado',      color: '#DC2626', bg: '#FEE2E2', icon: 'close-circle-outline' },
    paused:         { label: 'Pausado',        color: '#9333EA', bg: '#F3E8FF', icon: 'pause-circle-outline' },
    archived:       { label: 'Arquivado',      color: '#94A3B8', bg: '#F8FAFC', icon: 'archive-outline' },
};

// ─── Status badge ───────────────────────────────────────────────
function StatusBadge({ status }: { status: ItineraryStatus }) {
    const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
    return (
        <View style={[badge.wrap, { backgroundColor: cfg.bg }]}>
            <Ionicons name={cfg.icon as any} size={11} color={cfg.color} />
            <Text style={[badge.text, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
    );
}
const badge = StyleSheet.create({
    wrap: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
    text: { fontSize: 11, fontWeight: '600' },
});

// ─── Stats summary bar ─────────────────────────────────────────
function StatsSummary({ stats }: { stats: DashboardStats }) {
    return (
        <View style={sum.row}>
            <View style={sum.item}>
                <Text style={sum.value}>{stats.totalItineraries}</Text>
                <Text style={sum.label}>Roteiros</Text>
            </View>
            <View style={sum.divider} />
            <View style={sum.item}>
                <Text style={sum.value}>{stats.totalSales}</Text>
                <Text style={sum.label}>Vendas</Text>
            </View>
            <View style={sum.divider} />
            <View style={sum.item}>
                <Text style={sum.value}>
                    {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '—'}
                </Text>
                <Text style={sum.label}>Avaliação</Text>
            </View>
            <View style={sum.divider} />
            <View style={sum.item}>
                <Text style={sum.value}>
                    {stats.totalRevenue > 0
                        ? `R$ ${stats.totalRevenue.toFixed(0)}`
                        : 'R$ 0'}
                </Text>
                <Text style={sum.label}>Receita</Text>
            </View>
        </View>
    );
}
const sum = StyleSheet.create({
    row: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: theme.colors.surfaceLight,
        borderRadius: 14, marginHorizontal: 16,
        marginBottom: 12, paddingVertical: 14,
    },
    item: { flex: 1, alignItems: 'center' },
    value: { fontSize: 16, fontWeight: '800', color: theme.colors.text.primary },
    label: { fontSize: 11, color: theme.colors.text.tertiary, marginTop: 2 },
    divider: { width: 1, height: 32, backgroundColor: theme.colors.borderLight },
});

// ─── Itinerary card ────────────────────────────────────────────
function ItineraryCard({
    item,
    onPress,
    onEdit,
}: {
    item: CreatorItinerary;
    onPress: () => void;
    onEdit: () => void;
}) {
    const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.draft;

    return (
        <TouchableOpacity style={card.container} onPress={onPress} activeOpacity={0.75}>
            {/* Status stripe */}
            <View style={[card.stripe, { backgroundColor: cfg.color }]} />

            <View style={card.body}>
                {/* Title row */}
                <View style={card.titleRow}>
                    <Text style={card.title} numberOfLines={2}>{item.title || 'Sem título'}</Text>
                    <StatusBadge status={item.status} />
                </View>

                {/* Destination */}
                <View style={card.destRow}>
                    <Ionicons name="location-outline" size={13} color={theme.colors.text.tertiary} />
                    <Text style={card.dest}>{item.destination}, {item.country}</Text>
                    <Text style={card.sep}>·</Text>
                    <Ionicons name="calendar-outline" size={13} color={theme.colors.text.tertiary} />
                    <Text style={card.dest}>{item.duration} dias</Text>
                </View>

                {/* Metrics */}
                <View style={card.metrics}>
                    <View style={card.metric}>
                        <Text style={card.metricVal}>R$ {item.price.toFixed(2).replace('.', ',')}</Text>
                        <Text style={card.metricLabel}>preço</Text>
                    </View>
                    <View style={card.metric}>
                        <Text style={card.metricVal}>{item.sales}</Text>
                        <Text style={card.metricLabel}>vendas</Text>
                    </View>
                    {item.rating > 0 && (
                        <View style={card.metric}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                                <Ionicons name="star" size={12} color="#F59E0B" />
                                <Text style={card.metricVal}>{item.rating.toFixed(1)}</Text>
                            </View>
                            <Text style={card.metricLabel}>avaliação</Text>
                        </View>
                    )}
                    <View style={card.metric}>
                        <Text style={card.metricVal}>
                            R$ {item.revenue.toFixed(0)}
                        </Text>
                        <Text style={card.metricLabel}>receita</Text>
                    </View>
                </View>

                {/* Rejection message hint */}
                {item.status === 'rejected' && (
                    <View style={card.rejectedHint}>
                        <Ionicons name="information-circle-outline" size={14} color={theme.colors.error} />
                        <Text style={card.rejectedText}>Toque para ver o motivo da reprovação</Text>
                    </View>
                )}

                {/* Pending hint */}
                {item.status === 'pending_review' && (
                    <View style={card.pendingHint}>
                        <Ionicons name="time-outline" size={14} color="#D97706" />
                        <Text style={card.pendingText}>Aguardando análise da equipe (até 48h)</Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
}

const card = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: theme.colors.surface,
        borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border,
        marginBottom: 12, overflow: 'hidden',
        ...theme.shadows.small,
    },
    stripe: { width: 4 },
    body: { flex: 1, padding: 14, gap: 8 },
    titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
    title: { flex: 1, fontSize: 15, fontWeight: '700', color: theme.colors.text.primary, lineHeight: 20 },
    destRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    dest: { fontSize: 12, color: theme.colors.text.secondary },
    sep: { fontSize: 12, color: theme.colors.text.tertiary },
    metrics: { flexDirection: 'row', gap: 16 },
    metric: { alignItems: 'flex-start' },
    metricVal: { fontSize: 14, fontWeight: '700', color: theme.colors.text.primary },
    metricLabel: { fontSize: 10, color: theme.colors.text.tertiary, marginTop: 1 },
    rejectedHint: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: theme.colors.error + '10', borderRadius: 8, padding: 8,
    },
    rejectedText: { flex: 1, fontSize: 12, color: theme.colors.error },
    pendingHint: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: '#FEF3C7', borderRadius: 8, padding: 8,
    },
    pendingText: { flex: 1, fontSize: 12, color: '#D97706' },
});

// ─── Main screen ───────────────────────────────────────────────
export default function CreatedItinerariesScreen() {
    const router = useRouter();
    const { accessToken, isAuthenticated } = useAuth();

    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async (isRefresh = false) => {
        if (!isRefresh) setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE}/itineraries/dashboard/stats`, {
                headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data: DashboardStats = await res.json();
            setStats(data);
        } catch (err: any) {
            console.error('[created-itineraries] erro:', err?.message);
            setError('Não foi possível carregar seus roteiros. Verifique sua conexão.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [accessToken]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchData(true);
    }, [fetchData]);

    const handleItineraryPress = (item: CreatorItinerary) => {
        haptics.light();
        // Navega para visão exclusiva do criador (status, notas, métricas)
        router.push(`/creator-itinerary/${item.id}`);
    };

    // ── Loading ─────────────────────────────────────────────────
    if (loading) {
        return (
            <View style={s.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={s.loadingText}>Carregando seus roteiros...</Text>
            </View>
        );
    }

    // ── Não autenticado ─────────────────────────────────────────
    if (!isAuthenticated) {
        return (
            <View style={s.container}>
                <Header onBack={() => router.back()} onNew={() => router.push('/new-itinerary')} count={0} />
                <View style={s.emptyState}>
                    <Ionicons name="lock-closed-outline" size={48} color={theme.colors.text.tertiary} />
                    <Text style={s.emptyTitle}>Login necessário</Text>
                    <Text style={s.emptyText}>Faça login para ver seus roteiros criados.</Text>
                    <TouchableOpacity style={s.ctaButton} onPress={() => router.push('/login')}>
                        <Text style={s.ctaButtonText}>Entrar na conta</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // ── Erro ────────────────────────────────────────────────────
    if (error) {
        return (
            <View style={s.container}>
                <Header onBack={() => router.back()} onNew={() => router.push('/new-itinerary')} count={0} />
                <View style={s.emptyState}>
                    <Ionicons name="cloud-offline-outline" size={48} color={theme.colors.text.tertiary} />
                    <Text style={s.emptyTitle}>Erro ao carregar</Text>
                    <Text style={s.emptyText}>{error}</Text>
                    <TouchableOpacity style={s.ctaButton} onPress={() => fetchData()}>
                        <Text style={s.ctaButtonText}>Tentar novamente</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const itineraries = stats?.itineraries ?? [];

    return (
        <View style={s.container}>
            <StatusBar barStyle="dark-content" />
            <Header
                onBack={() => router.back()}
                onNew={() => { haptics.medium(); router.push('/new-itinerary'); }}
                count={itineraries.length}
            />

            {itineraries.length === 0 ? (
                /* ── Empty state ── */
                <View style={s.emptyState}>
                    <Text style={s.emptyEmoji}>✍️</Text>
                    <Text style={s.emptyTitle}>Nenhum roteiro ainda</Text>
                    <Text style={s.emptyText}>
                        Crie seu primeiro roteiro e compartilhe suas experiências de viagem com o mundo.
                    </Text>
                    <TouchableOpacity
                        style={s.ctaButton}
                        onPress={() => { haptics.medium(); router.push('/new-itinerary'); }}
                    >
                        <Ionicons name="add" size={18} color="#fff" />
                        <Text style={s.ctaButtonText}>Criar meu primeiro roteiro</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={s.scrollContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={theme.colors.primary}
                        />
                    }
                >
                    {/* Stats summary */}
                    {stats && <StatsSummary stats={stats} />}

                    {/* List */}
                    {itineraries.map(item => (
                        <ItineraryCard
                            key={item.id}
                            item={item}
                            onPress={() => handleItineraryPress(item)}
                            onEdit={() => { haptics.light(); router.push(`/itinerary/${item.id}`); }}
                        />
                    ))}

                    {/* New itinerary CTA at bottom */}
                    <TouchableOpacity
                        style={s.newItineraryCta}
                        onPress={() => { haptics.medium(); router.push('/new-itinerary'); }}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="add-circle-outline" size={20} color={theme.colors.primary} />
                        <Text style={s.newItineraryCtaText}>Criar novo roteiro</Text>
                    </TouchableOpacity>

                    <View style={{ height: 40 }} />
                </ScrollView>
            )}
        </View>
    );
}

// ─── Header component ──────────────────────────────────────────
function Header({ onBack, onNew, count }: { onBack: () => void; onNew: () => void; count: number }) {
    return (
        <View style={h.container}>
            <TouchableOpacity style={h.backBtn} onPress={onBack}>
                <Ionicons name="arrow-back" size={22} color={theme.colors.text.primary} />
            </TouchableOpacity>
            <View style={h.center}>
                <Text style={h.title}>Meus Roteiros</Text>
                {count > 0 && (
                    <Text style={h.subtitle}>
                        {count} {count === 1 ? 'roteiro' : 'roteiros'}
                    </Text>
                )}
            </View>
            <TouchableOpacity style={h.newBtn} onPress={onNew}>
                <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
        </View>
    );
}

const h = StyleSheet.create({
    container: {
        flexDirection: 'row', alignItems: 'center',
        paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight ?? 24) + 8,
        paddingBottom: 12, paddingHorizontal: 16,
        borderBottomWidth: 1, borderBottomColor: theme.colors.borderLight,
        backgroundColor: theme.colors.background,
    },
    backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    center: { flex: 1, alignItems: 'center' },
    title: { fontSize: 17, fontWeight: '700', color: theme.colors.text.primary },
    subtitle: { fontSize: 12, color: theme.colors.text.secondary, marginTop: 1 },
    newBtn: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: theme.colors.primary,
        alignItems: 'center', justifyContent: 'center',
    },
});

// ─── Screen styles ─────────────────────────────────────────────
const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
    loadingText: { fontSize: 14, color: theme.colors.text.secondary },
    scrollContent: { paddingHorizontal: 16, paddingTop: 16 },

    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
    emptyEmoji: { fontSize: 56, marginBottom: 16 },
    emptyTitle: { fontSize: 20, fontWeight: '700', color: theme.colors.text.primary, marginBottom: 8, textAlign: 'center' },
    emptyText: { fontSize: 14, color: theme.colors.text.secondary, textAlign: 'center', lineHeight: 20, marginBottom: 28 },
    ctaButton: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: theme.colors.primary, borderRadius: 14,
        paddingHorizontal: 24, paddingVertical: 14,
        ...theme.shadows.button,
    },
    ctaButtonText: { fontSize: 15, fontWeight: '700', color: '#fff' },

    newItineraryCta: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, borderWidth: 1.5, borderColor: theme.colors.primary,
        borderRadius: 14, paddingVertical: 14, marginTop: 4,
    },
    newItineraryCtaText: { fontSize: 15, fontWeight: '700', color: theme.colors.primary },
});
