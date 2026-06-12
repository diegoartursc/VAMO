/**
 * VAMO Mobile — Painel "Meus Roteiros" (ETAPA 6)
 * Filtros por status, contadores, ações rápidas inline, pull-to-refresh.
 * Dados reais via GET /api/itineraries/dashboard/stats (Bearer token).
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Platform, StatusBar, ActivityIndicator, RefreshControl,
    Animated, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../src/theme/theme';
import { haptics } from '../src/services/haptics';
import { useAuth } from '../src/contexts/AuthContext';
import { formatMoney } from '@vamo/shared/itinerary';
import { confirm } from '../src/utils/confirm';
import { notify } from '../src/utils/notify';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3333/api';

// ─── Types ─────────────────────────────────────────────────────
type ItineraryStatus = 'draft' | 'pending_review' | 'approved' | 'rejected' | 'active' | 'paused' | 'archived';
type FilterTab = 'all' | 'active' | 'pending_review' | 'draft' | 'rejected' | 'paused';

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
    /** Setado quando o roteiro foi aprovado pelo menos uma vez — usado pra
     *  distinguir "Em análise" (primeira submissão) de "Alterações em análise"
     *  (republicação após edição). */
    approvedAt?: string | null;
}

/** Roteiro está esperando análise por causa de uma edição de algo já
 *  publicado anteriormente — não é a primeira submissão. */
const isPendingRevisionOfPublished = (it: { status: ItineraryStatus; approvedAt?: string | null }) =>
    it.status === 'pending_review' && !!it.approvedAt;

interface DashboardStats {
    isCreator?: boolean;
    creator?: { id: string; verificationLevel?: string };
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
    draft:          { label: 'Rascunho',  color: '#64748B', bg: '#F1F5F9', icon: 'create-outline' },
    pending_review: { label: 'Em análise',color: '#D97706', bg: '#FEF3C7', icon: 'time-outline' },
    approved:       { label: 'Aprovado',  color: '#059669', bg: '#D1FAE5', icon: 'checkmark-circle-outline' },
    active:         { label: 'Publicado', color: '#059669', bg: '#D1FAE5', icon: 'checkmark-circle' },
    rejected:       { label: 'Reprovado', color: '#DC2626', bg: '#FEE2E2', icon: 'close-circle-outline' },
    paused:         { label: 'Pausado',   color: '#9333EA', bg: '#F3E8FF', icon: 'pause-circle-outline' },
    archived:       { label: 'Arquivado', color: '#94A3B8', bg: '#F8FAFC', icon: 'archive-outline' },
};

// ─── Filter tabs config ─────────────────────────────────────────
const FILTER_TABS: { key: FilterTab; label: string; statuses: ItineraryStatus[] }[] = [
    { key: 'all',            label: 'Todos',      statuses: [] },
    { key: 'active',         label: 'Publicados', statuses: ['active', 'approved'] },
    { key: 'pending_review', label: 'Em análise', statuses: ['pending_review'] },
    { key: 'draft',          label: 'Rascunhos',  statuses: ['draft'] },
    { key: 'rejected',       label: 'Reprovados', statuses: ['rejected'] },
    { key: 'paused',         label: 'Pausados',   statuses: ['paused'] },
];

// ─── Quick action config per status ────────────────────────────
const QUICK_ACTION: Partial<Record<ItineraryStatus, { label: string; icon: string; color: string }>> = {
    draft:          { label: 'Continuar',      icon: 'play-circle-outline',    color: theme.colors.primary },
    rejected:       { label: 'Corrigir',       icon: 'create-outline',         color: theme.colors.error },
    pending_review: { label: 'Ver status',     icon: 'information-circle-outline', color: '#D97706' },
    active:         { label: 'Ver detalhes',   icon: 'bar-chart-outline',      color: theme.colors.success },
    paused:         { label: 'Publicar',       icon: 'play-circle-outline',    color: '#9333EA' },
};

// ─── Status badge ───────────────────────────────────────────────
function StatusBadge({ item }: { item: { status: ItineraryStatus; approvedAt?: string | null } }) {
    const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.draft;
    const label = isPendingRevisionOfPublished(item) ? 'Alterações em análise' : cfg.label;
    return (
        <View style={[badge.wrap, { backgroundColor: cfg.bg }]}>
            <Ionicons name={cfg.icon as any} size={11} color={cfg.color} />
            <Text style={[badge.text, { color: cfg.color }]}>{label}</Text>
        </View>
    );
}
const badge = StyleSheet.create({
    wrap: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
    text: { fontSize: 11, fontWeight: '600' },
});

// ─── Filter tab bar ─────────────────────────────────────────────
function FilterTabBar({
    active,
    counts,
    onSelect,
}: {
    active: FilterTab;
    counts: Record<FilterTab, number>;
    onSelect: (key: FilterTab) => void;
}) {
    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={tabs.row}
            style={tabs.container}
        >
            {FILTER_TABS.map(tab => {
                const isActive = tab.key === active;
                const count = counts[tab.key];
                // Esconde tabs com 0 roteiros (exceto "Todos")
                if (tab.key !== 'all' && count === 0) return null;
                return (
                    <TouchableOpacity
                        key={tab.key}
                        style={[tabs.tab, isActive && tabs.tabActive]}
                        onPress={() => { haptics.selection(); onSelect(tab.key); }}
                        activeOpacity={0.75}
                    >
                        <Text style={[tabs.label, isActive && tabs.labelActive]}>
                            {tab.label}
                        </Text>
                        {count > 0 && (
                            <View style={[tabs.badge, isActive && tabs.badgeActive]}>
                                <Text style={[tabs.badgeText, isActive && tabs.badgeTextActive]}>
                                    {count}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>
                );
            })}
        </ScrollView>
    );
}
const tabs = StyleSheet.create({
    container: { flexGrow: 0, borderBottomWidth: 1, borderBottomColor: theme.colors.borderLight },
    row: { paddingHorizontal: 16, gap: 4, paddingBottom: 0 },
    tab: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 14, paddingVertical: 10,
        borderBottomWidth: 2, borderBottomColor: 'transparent',
    },
    tabActive: { borderBottomColor: theme.colors.primary },
    label: { fontSize: 13, fontWeight: '500', color: theme.colors.text.tertiary },
    labelActive: { color: theme.colors.primary, fontWeight: '700' },
    badge: {
        backgroundColor: theme.colors.surfaceLight,
        borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1,
        minWidth: 20, alignItems: 'center',
    },
    badgeActive: { backgroundColor: theme.colors.primary + '18' },
    badgeText: { fontSize: 11, fontWeight: '700', color: theme.colors.text.tertiary },
    badgeTextActive: { color: theme.colors.primary },
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
                    {formatMoney(stats.totalRevenue > 0 ? Math.round(stats.totalRevenue) : 0)}
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
        marginHorizontal: 16, borderRadius: 14,
        marginBottom: 0, marginTop: 12, paddingVertical: 14,
    },
    item: { flex: 1, alignItems: 'center' },
    value: { fontSize: 16, fontWeight: '800', color: theme.colors.text.primary },
    label: { fontSize: 11, color: theme.colors.text.tertiary, marginTop: 2 },
    divider: { width: 1, height: 32, backgroundColor: theme.colors.borderLight },
});

function CreatorActionGrid({
    stats,
    onAll,
    onNew,
    onSales,
    onReviews,
    onSettings,
}: {
    stats: DashboardStats;
    onAll: () => void;
    onNew: () => void;
    onSales: () => void;
    onReviews: () => void;
    onSettings: () => void;
}) {
    const actions = [
        { key: 'all', label: 'Meus roteiros', icon: 'albums-outline', onPress: onAll, badge: String(stats.totalItineraries) },
        { key: 'new', label: 'Novo roteiro', icon: 'add-circle-outline', onPress: onNew },
        { key: 'sales', label: 'Minhas vendas', icon: 'cash-outline', onPress: onSales, badge: String(stats.totalSales) },
        { key: 'reviews', label: 'Avaliações', icon: 'star-outline', onPress: onReviews, badge: stats.totalReviews > 0 ? String(stats.totalReviews) : undefined },
        { key: 'settings', label: 'Configurações', icon: 'settings-outline', onPress: onSettings },
    ];

    return (
        <View style={actions_s.grid}>
            {actions.map(action => (
                <TouchableOpacity
                    key={action.key}
                    style={actions_s.button}
                    onPress={action.onPress}
                    activeOpacity={0.78}
                >
                    <View style={actions_s.iconWrap}>
                        <Ionicons name={action.icon as any} size={18} color={theme.colors.primary} />
                        {!!action.badge && (
                            <View style={actions_s.badge}>
                                <Text style={actions_s.badgeText}>{action.badge}</Text>
                            </View>
                        )}
                    </View>
                    <Text style={actions_s.label} numberOfLines={2}>{action.label}</Text>
                </TouchableOpacity>
            ))}
        </View>
    );
}

const actions_s = StyleSheet.create({
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 4,
    },
    button: {
        width: '31.8%',
        minHeight: 82,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 8,
        paddingVertical: 10,
        gap: 8,
    },
    iconWrap: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: theme.colors.primary + '12',
        alignItems: 'center',
        justifyContent: 'center',
    },
    badge: {
        position: 'absolute',
        top: -4,
        right: -6,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        paddingHorizontal: 5,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.primary,
    },
    badgeText: { fontSize: 10, fontWeight: '800', color: '#fff' },
    label: { fontSize: 11, fontWeight: '700', color: theme.colors.text.primary, textAlign: 'center', lineHeight: 14 },
});

// ─── Itinerary card with quick action ─────────────────────────
function ItineraryCard({
    item,
    onPress,
    onQuickAction,
    onEdit,
    onDelete,
}: {
    item: CreatorItinerary;
    onPress: () => void;
    onQuickAction: () => void;
    onEdit: () => void;
    onDelete: () => void;
}) {
    const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.draft;
    const qa = QUICK_ACTION[item.status];
    // Editar disponível em qualquer status menos arquivado. Em pending_review
    // permitimos editar (atualiza a submissão), em active dispara aviso de
    // "vai pra nova análise" via onEdit.
    const canEdit = item.status !== 'archived';
    // Arquivar disponível em qualquer status menos arquivado (já está arquivado).
    const canDelete = item.status !== 'archived';

    return (
        <TouchableOpacity style={card.container} onPress={onPress} activeOpacity={0.75}>
            {/* Status stripe */}
            <View style={[card.stripe, { backgroundColor: cfg.color }]} />

            <View style={card.body}>
                {/* Title + badge */}
                <View style={card.titleRow}>
                    <Text style={card.title} numberOfLines={2}>{item.title || 'Sem título'}</Text>
                    <StatusBadge item={item} />
                </View>

                {/* Destination */}
                <View style={card.destRow}>
                    <Ionicons name="location-outline" size={12} color={theme.colors.text.tertiary} />
                    <Text style={card.dest} numberOfLines={1}>
                        {item.destination}, {item.country}
                    </Text>
                    <Text style={card.sep}>·</Text>
                    <Ionicons name="calendar-outline" size={12} color={theme.colors.text.tertiary} />
                    <Text style={card.dest}>{item.duration}d</Text>
                </View>

                {/* Metrics row */}
                <View style={card.metricsRow}>
                    <View style={card.metric}>
                        <Text style={card.metricVal}>
                            {formatMoney(item.price)}
                        </Text>
                        <Text style={card.metricLabel}>preço</Text>
                    </View>
                    {item.sales > 0 && (
                        <View style={card.metric}>
                            <Text style={card.metricVal}>{item.sales}</Text>
                            <Text style={card.metricLabel}>vendas</Text>
                        </View>
                    )}
                    {item.revenue > 0 && (
                        <View style={card.metric}>
                            <Text style={[card.metricVal, { color: theme.colors.success }]}>
                                {formatMoney(item.revenue)}
                            </Text>
                            <Text style={card.metricLabel}>receita</Text>
                        </View>
                    )}
                    {item.rating > 0 && (
                        <View style={card.metric}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                                <Ionicons name="star" size={11} color="#F59E0B" />
                                <Text style={card.metricVal}>{item.rating.toFixed(1)}</Text>
                            </View>
                            <Text style={card.metricLabel}>nota</Text>
                        </View>
                    )}

                    {/* Ações alinhadas à direita: Editar + Arquivar + ação por status */}
                    <View style={card.actionsRow}>
                        {canEdit && (
                            <TouchableOpacity
                                style={[card.qaBtn, card.editBtn]}
                                onPress={(e) => { e.stopPropagation?.(); haptics.light(); onEdit(); }}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                accessibilityLabel="Editar roteiro"
                            >
                                <Ionicons name="create-outline" size={13} color={theme.colors.primary} />
                                <Text style={[card.qaBtnText, { color: theme.colors.primary }]}>Editar</Text>
                            </TouchableOpacity>
                        )}
                        {canDelete && (
                            <TouchableOpacity
                                style={[card.qaBtn, card.deleteBtn]}
                                onPress={(e) => { e.stopPropagation?.(); onDelete(); }}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                accessibilityLabel="Arquivar roteiro"
                            >
                                <Ionicons name="archive-outline" size={13} color={theme.colors.error} />
                                <Text style={[card.qaBtnText, { color: theme.colors.error }]}>Arquivar</Text>
                            </TouchableOpacity>
                        )}
                        {qa && (
                            <TouchableOpacity
                                style={[card.qaBtn, { borderColor: qa.color + '40', backgroundColor: qa.color + '0D' }]}
                                onPress={(e) => { e.stopPropagation?.(); haptics.light(); onQuickAction(); }}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                                <Ionicons name={qa.icon as any} size={13} color={qa.color} />
                                <Text style={[card.qaBtnText, { color: qa.color }]}>{qa.label}</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Context hints */}
                {item.status === 'rejected' && (
                    <View style={card.hint}>
                        <Ionicons name="information-circle-outline" size={13} color={theme.colors.error} />
                        <Text style={[card.hintText, { color: theme.colors.error }]}>
                            Toque para ver o motivo da reprovação
                        </Text>
                    </View>
                )}
                {item.status === 'pending_review' && (
                    <View style={[card.hint, { backgroundColor: '#FEF3C7' }]}>
                        <Ionicons name="time-outline" size={13} color="#D97706" />
                        <Text style={[card.hintText, { color: '#D97706' }]}>
                            {isPendingRevisionOfPublished(item)
                                ? 'Suas alterações estão em análise (até 48h). A versão pública volta após aprovação.'
                                : 'Aguardando análise (até 48h).'}
                        </Text>
                    </View>
                )}
                {item.status === 'draft' && (
                    <View style={[card.hint, { backgroundColor: theme.colors.surfaceLight }]}>
                        <Ionicons name="create-outline" size={13} color={theme.colors.text.tertiary} />
                        <Text style={[card.hintText, { color: theme.colors.text.tertiary }]}>
                            Rascunho — complete e envie para análise
                        </Text>
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
        marginBottom: 10, overflow: 'hidden',
        ...theme.shadows.small,
    },
    stripe: { width: 4 },
    body: { flex: 1, padding: 12, gap: 7 },
    titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
    title: { flex: 1, fontSize: 14, fontWeight: '700', color: theme.colors.text.primary, lineHeight: 19 },
    destRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    dest: { fontSize: 12, color: theme.colors.text.secondary },
    sep: { fontSize: 12, color: theme.colors.text.tertiary },
    metricsRow: { flexDirection: 'row', alignItems: 'center', gap: 14, flexWrap: 'wrap' },
    metric: { alignItems: 'flex-start' },
    metricVal: { fontSize: 13, fontWeight: '700', color: theme.colors.text.primary },
    metricLabel: { fontSize: 10, color: theme.colors.text.tertiary, marginTop: 1 },
    actionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginLeft: 'auto',
    },
    qaBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        borderWidth: 1, borderRadius: 8,
        paddingHorizontal: 8, paddingVertical: 4,
    },
    editBtn: {
        borderColor: theme.colors.primary + '40',
        backgroundColor: theme.colors.primary + '0D',
    },
    deleteBtn: {
        borderColor: theme.colors.error + '40',
        backgroundColor: theme.colors.error + '0D',
    },
    qaBtnText: { fontSize: 11, fontWeight: '700' },
    hint: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: theme.colors.error + '10',
        borderRadius: 7, padding: 7,
    },
    hintText: { flex: 1, fontSize: 11, lineHeight: 15 },
});

// ─── Empty state per filter ─────────────────────────────────────
const EMPTY_MESSAGES: Record<FilterTab, { emoji: string; title: string; text: string }> = {
    all:            { emoji: '✍️', title: 'Nenhum roteiro ainda',    text: 'Crie seu primeiro roteiro e comece a vender.' },
    active:         { emoji: '🚀', title: 'Nenhum roteiro publicado', text: 'Envie um roteiro para análise para publicá-lo.' },
    pending_review: { emoji: '⏳', title: 'Nenhum em análise',       text: 'Submeta um roteiro para a equipe VAMO revisar.' },
    draft:          { emoji: '📝', title: 'Sem rascunhos',           text: 'Inicie um novo roteiro para vê-lo aqui.' },
    rejected:       { emoji: '✅', title: 'Nenhuma reprovação',      text: 'Ótimo! Todos os seus roteiros foram aprovados.' },
    paused:         { emoji: '▶️', title: 'Nenhum roteiro pausado',  text: 'Seus roteiros publicados estão todos ativos.' },
};

// ─── Main screen ───────────────────────────────────────────────
export default function CreatedItinerariesScreen() {
    const router = useRouter();
    const { accessToken, isAuthenticated, isLoading: authLoading } = useAuth();

    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
    const fadeAnim = useRef(new Animated.Value(1)).current;

    const fetchData = useCallback(async (isRefresh = false) => {
        if (authLoading) return;
        if (!isAuthenticated || !accessToken) {
            setStats(null);
            setError(null);
            setLoading(false);
            setRefreshing(false);
            return;
        }
        if (!isRefresh) setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE}/itineraries/dashboard/stats`, {
                headers: { Authorization: `Bearer ${accessToken}` },
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
    }, [accessToken, authLoading, isAuthenticated]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchData(true);
    }, [fetchData]);

    // Animação suave ao trocar filtro: espera o fade-out completar antes de mudar a lista
    const handleFilterChange = useCallback((key: FilterTab) => {
        Animated.timing(fadeAnim, { toValue: 0, duration: 80, useNativeDriver: true }).start(() => {
            setActiveFilter(key);
            Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }).start();
        });
    }, [fadeAnim]);

    // ── Loading ─────────────────────────────────────────────────
    if (authLoading || loading) {
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
                <Header
                    onBack={() => router.back()}
                    onNew={() => router.push({ pathname: '/login' as any, params: { next: '/become-creator' } })}
                    count={0}
                />
                <View style={s.emptyState}>
                    <Ionicons name="lock-closed-outline" size={48} color={theme.colors.text.tertiary} />
                    <Text style={s.emptyTitle}>Login necessário</Text>
                    <Text style={s.emptyText}>Faça login para ver seus roteiros criados.</Text>
                    <TouchableOpacity style={s.ctaButton} onPress={() => router.push({ pathname: '/login' as any, params: { next: '/created-itineraries' } })}>
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

    if (stats?.isCreator === false) {
        return (
            <View style={s.container}>
                <Header
                    onBack={() => router.back()}
                    onNew={() => router.push('/become-creator')}
                    count={0}
                />
                <View style={s.emptyState}>
                    <Ionicons name="sparkles-outline" size={52} color={theme.colors.primary} />
                    <Text style={s.emptyTitle}>Ative seu portal de roteirista</Text>
                    <Text style={s.emptyText}>
                        Crie sua área de criador para publicar roteiros digitais, acompanhar vendas e receber avaliações.
                    </Text>
                    <TouchableOpacity
                        style={s.ctaButton}
                        onPress={() => { haptics.medium(); router.push('/become-creator'); }}
                    >
                        <Ionicons name="compass-outline" size={18} color="#fff" />
                        <Text style={s.ctaButtonText}>Começar como roteirista</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const allItineraries = stats?.itineraries ?? [];

    // Contadores por filtro
    const counts: Record<FilterTab, number> = {
        all: allItineraries.length,
        active: allItineraries.filter(i => i.status === 'active' || i.status === 'approved').length,
        pending_review: allItineraries.filter(i => i.status === 'pending_review').length,
        draft: allItineraries.filter(i => i.status === 'draft').length,
        rejected: allItineraries.filter(i => i.status === 'rejected').length,
        paused: allItineraries.filter(i => i.status === 'paused').length,
    };

    // Lista filtrada
    const tabDef = FILTER_TABS.find(t => t.key === activeFilter)!;
    const filtered = tabDef.statuses.length === 0
        ? allItineraries
        : allItineraries.filter(i => tabDef.statuses.includes(i.status));

    // Ação rápida: navega para tela correta por status
    const handleQuickAction = (item: CreatorItinerary) => {
        haptics.light();
        router.push(`/creator-itinerary/${item.id}`);
    };

    /** Editar roteiro: abre o wizard nativo de criação em modo edição
     *  (mesma tela usada para criar, hidratada com os dados existentes via
     *  query param `id`). Se o roteiro está PUBLICADO, avisa antes que a
     *  edição passa por nova análise e sai temporariamente da vitrine. */
    const openEditor = (id: string) => {
        router.push(`/new-itinerary?id=${encodeURIComponent(id)}` as any);
    };

    const handleEdit = async (item: CreatorItinerary) => {
        if (item.status === 'active' || item.status === 'approved') {
            // confirm() em vez de Alert.alert — no Expo Web o Alert é no-op
            // e a confirmação sumia silenciosamente, fazendo o botão Editar
            // parecer "quebrado". Ver memory: alert-noop-on-web.
            const ok = await confirm({
                title: 'Editar roteiro publicado',
                message: 'Alterações em roteiros publicados passam por nova análise antes de ficarem disponíveis na VAMO. O roteiro pode sair temporariamente da vitrine durante a revisão.',
                confirmText: 'Continuar edição',
                cancelText: 'Cancelar',
                icon: 'create-outline',
            });
            if (!ok) return;
        }
        openEditor(item.id);
    };

    /** Arquiva comercialmente um roteiro do criador.
     *  - Soft delete por padrão: backend muda status para ARCHIVED.
     *  - confirm() cross-platform (no web, Alert é no-op).
     *  - Refetch da lista no sucesso pra UI ficar consistente. */
    const handleDelete = async (item: CreatorItinerary) => {
        if (!accessToken) {
            notify({ title: 'Sessão expirada', message: 'Faça login novamente para arquivar o roteiro.', variant: 'warning' });
            return;
        }
        const ok = await confirm({
            title: 'Arquivar roteiro?',
            message: `"${item.title || 'Sem título'}"\n\nEste roteiro deixará de aparecer para novas compras, mas viajantes que já compraram continuarão tendo acesso ao conteúdo adquirido.`,
            confirmText: 'Arquivar roteiro',
            cancelText: 'Cancelar',
            destructive: true,
            // Arquivar não é excluir — lixeira comunicava perda de dados.
            icon: 'archive-outline',
        });
        if (!ok) return;
        try {
            haptics.medium();
            const res = await fetch(`${API_BASE}/itineraries/${encodeURIComponent(item.id)}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({} as any));
                throw new Error(err?.error || `Erro ${res.status} ao arquivar o roteiro`);
            }
            haptics.success();
            notify({ title: 'Roteiro arquivado', message: 'Ele não aparece mais na vitrine. Você pode revisar quando quiser na aba de arquivados.', variant: 'success', icon: 'archive-outline' });
            await fetchData(true);
        } catch (e: any) {
            haptics.error?.();
            notify({ title: 'Não foi possível arquivar', message: e?.message || 'Tente novamente em instantes.', variant: 'error' });
        }
    };

    const handleShowSales = () => {
        haptics.light();
        notify({
            title: 'Minhas vendas',
            message: `Vendas confirmadas: ${stats?.totalSales ?? 0}\nReceita total: ${formatMoney(stats?.totalRevenue ?? 0)}`,
        });
    };

    const handleShowReviews = () => {
        haptics.light();
        const rating = stats && stats.averageRating > 0 ? stats.averageRating.toFixed(1) : 'Sem nota ainda';
        notify({
            title: 'Avaliações',
            message: `Avaliação média: ${rating}\nTotal de avaliações: ${stats?.totalReviews ?? 0}`,
        });
    };

    return (
        <View style={s.container}>
            <StatusBar barStyle="dark-content" />
            <Header
                onBack={() => router.back()}
                onNew={() => { haptics.medium(); router.push('/new-itinerary'); }}
                count={allItineraries.length}
            />

            {allItineraries.length === 0 ? (
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
                <>
                    {/* Stats summary */}
                    {stats && <StatsSummary stats={stats} />}

                    {stats && (
                        <CreatorActionGrid
                            stats={stats}
                            onAll={() => { haptics.selection(); handleFilterChange('all'); }}
                            onNew={() => { haptics.medium(); router.push('/new-itinerary'); }}
                            onSales={handleShowSales}
                            onReviews={handleShowReviews}
                            onSettings={() => { haptics.light(); router.push('/(tabs)/profile' as any); }}
                        />
                    )}

                    {/* Filter tab bar */}
                    <FilterTabBar
                        active={activeFilter}
                        counts={counts}
                        onSelect={handleFilterChange}
                    />

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
                        <Animated.View style={{ opacity: fadeAnim }}>
                            {filtered.length === 0 ? (
                                /* ── Empty state por filtro ── */
                                <View style={s.filterEmpty}>
                                    <Text style={s.filterEmptyEmoji}>
                                        {EMPTY_MESSAGES[activeFilter].emoji}
                                    </Text>
                                    <Text style={s.filterEmptyTitle}>
                                        {EMPTY_MESSAGES[activeFilter].title}
                                    </Text>
                                    <Text style={s.filterEmptyText}>
                                        {EMPTY_MESSAGES[activeFilter].text}
                                    </Text>
                                </View>
                            ) : (
                                filtered.map(item => (
                                    <ItineraryCard
                                        key={item.id}
                                        item={item}
                                        onPress={() => { haptics.light(); router.push(`/creator-itinerary/${item.id}`); }}
                                        onQuickAction={() => handleQuickAction(item)}
                                        onEdit={() => handleEdit(item)}
                                        onDelete={() => handleDelete(item)}
                                    />
                                ))
                            )}

                            {/* CTA ao final da lista */}
                            <TouchableOpacity
                                style={s.newItineraryCta}
                                onPress={() => { haptics.medium(); router.push('/new-itinerary'); }}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="add-circle-outline" size={20} color={theme.colors.primary} />
                                <Text style={s.newItineraryCtaText}>Criar novo roteiro</Text>
                            </TouchableOpacity>

                            <View style={{ height: 40 }} />
                        </Animated.View>
                    </ScrollView>
                </>
            )}
        </View>
    );
}

// ─── Header ────────────────────────────────────────────────────
function Header({ onBack, onNew, count }: { onBack: () => void; onNew: () => void; count: number }) {
    return (
        <View style={h.container}>
            <TouchableOpacity style={h.backBtn} onPress={onBack}>
                <Ionicons name="arrow-back" size={22} color={theme.colors.text.primary} />
            </TouchableOpacity>
            <View style={h.center}>
                <Text style={h.title}>Meus Roteiros</Text>
                {count > 0 && (
                    <Text style={h.subtitle}>{count} {count === 1 ? 'roteiro' : 'roteiros'}</Text>
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
    scrollContent: { paddingHorizontal: 16, paddingTop: 14 },

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

    filterEmpty: {
        alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24,
    },
    filterEmptyEmoji: { fontSize: 40, marginBottom: 12 },
    filterEmptyTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.text.primary, marginBottom: 6, textAlign: 'center' },
    filterEmptyText: { fontSize: 13, color: theme.colors.text.secondary, textAlign: 'center', lineHeight: 19 },

    newItineraryCta: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, borderWidth: 1.5, borderColor: theme.colors.primary,
        borderRadius: 14, paddingVertical: 14, marginTop: 4,
    },
    newItineraryCtaText: { fontSize: 15, fontWeight: '700', color: theme.colors.primary },
});
