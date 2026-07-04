/**
 * VAMO Mobile — Portal do Roteirista ("Meus Roteiros").
 * Dashboard com resumo de métricas, atalhos para áreas dedicadas, filtros por
 * status e lista de roteiros. Dados reais via GET /api/itineraries/dashboard/stats.
 *
 * Componentes extraídos em src/features/creator/dashboard/ (ETAPA 2).
 */
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    StatusBar, ActivityIndicator, RefreshControl, Animated,
    useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { safeBack } from '../src/utils/navigation';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../src/theme/theme';
import { haptics } from '../src/services/haptics';
import { useAuth } from '../src/contexts/AuthContext';
import { formatMoney } from '@vamo/shared/itinerary';
import { confirm } from '../src/utils/confirm';
import { notify } from '../src/utils/notify';
import { getCreatorQuestions } from '../src/services/api';
import {
    CreatorItinerary, DashboardStats, FilterTab,
    FILTER_TABS, EMPTY_MESSAGES, DASHBOARD_MAX_WIDTH, WIDE_BREAKPOINT,
} from '../src/features/creator/dashboard/types';
import { CreatorTopBar } from '../src/features/creator/dashboard/CreatorDashboardHeader';
import { CreatorPortalHero, CreatorRevenueCard, CreatorProTipCard } from '../src/features/creator/dashboard/CreatorPortalSections';
import { CreatorMetricCard, CreatorMetric } from '../src/features/creator/dashboard/CreatorMetricCard';
import { CreatorQuickActions, QuickAction } from '../src/features/creator/dashboard/CreatorQuickActions';
import { CreatorItineraryCard } from '../src/features/creator/dashboard/CreatorItineraryCard';
import { CreatorEmptyState } from '../src/features/creator/dashboard/CreatorEmptyState';
import { shareItineraryImperative } from '../src/hooks/useShareItinerary';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3333/api';

// ─── Filter tab bar ─────────────────────────────────────────────
function FilterTabBar({
    active, counts, onSelect,
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
                if (tab.key !== 'all' && count === 0) return null;
                return (
                    <TouchableOpacity
                        key={tab.key}
                        style={[tabs.tab, isActive && tabs.tabActive]}
                        onPress={() => { haptics.selection(); onSelect(tab.key); }}
                        activeOpacity={0.75}
                    >
                        <Text style={[tabs.label, isActive && tabs.labelActive]}>{tab.label}</Text>
                        {count > 0 && (
                            <View style={[tabs.badge, isActive && tabs.badgeActive]}>
                                <Text style={[tabs.badgeText, isActive && tabs.badgeTextActive]}>{count}</Text>
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
    row: { gap: 4, paddingBottom: 0 },
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

// ─── Main screen ───────────────────────────────────────────────
export default function CreatedItinerariesScreen() {
    const router = useRouter();
    const { user, accessToken, isAuthenticated, isLoading: authLoading } = useAuth();
    const { width } = useWindowDimensions();
    const isWide = width >= WIDE_BREAKPOINT;

    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
    const [pendingQuestions, setPendingQuestions] = useState(0);
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const scrollRef = useRef<ScrollView>(null);
    const listY = useRef(0);

    const fetchData = useCallback(async (isRefresh = false) => {
        if (authLoading) return;
        if (!isAuthenticated || !accessToken) {
            setStats(null); setError(null); setLoading(false); setRefreshing(false);
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
            setLoading(false); setRefreshing(false);
        }
    }, [accessToken, authLoading, isAuthenticated]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Contagem de perguntas pendentes (badge da ação rápida "Perguntas").
    useEffect(() => {
        if (!accessToken || !isAuthenticated) { setPendingQuestions(0); return; }
        let mounted = true;
        getCreatorQuestions(accessToken)
            .then(({ questions }) => { if (mounted) setPendingQuestions(questions.filter(q => q.status === 'pending').length); })
            .catch(() => { if (mounted) setPendingQuestions(0); });
        return () => { mounted = false; };
    }, [accessToken, isAuthenticated]);

    const onRefresh = useCallback(() => { setRefreshing(true); fetchData(true); }, [fetchData]);

    const handleFilterChange = useCallback((key: FilterTab) => {
        Animated.timing(fadeAnim, { toValue: 0, duration: 80, useNativeDriver: true }).start(() => {
            setActiveFilter(key);
            Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }).start();
        });
    }, [fadeAnim]);

    const scrollToList = useCallback(() => {
        scrollRef.current?.scrollTo({ y: Math.max(0, listY.current - 12), animated: true });
    }, []);

    const showAllAndScroll = useCallback(() => {
        haptics.selection();
        handleFilterChange('all');
        scrollToList();
    }, [handleFilterChange, scrollToList]);

    // ── Loading ─────────────────────────────────────────────────
    if (authLoading || loading) {
        return (
            <View style={s.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={s.loadingText}>Carregando seu portal...</Text>
            </View>
        );
    }

    // ── Não autenticado ─────────────────────────────────────────
    if (!isAuthenticated) {
        return (
            <View style={s.container}>
                <CreatorTopBar count={0} onBack={() => safeBack(router, '/(tabs)/profile')} onNew={() => router.push({ pathname: '/login' as any, params: { next: '/become-creator' } })} />
                <View style={s.centerState}>
                    <CreatorEmptyState
                        icon="lock-closed-outline"
                        title="Login necessário"
                        text="Faça login para acessar o Portal do Roteirista e ver seus roteiros criados."
                        ctaLabel="Entrar na conta"
                        onCta={() => router.push({ pathname: '/login' as any, params: { next: '/created-itineraries' } })}
                    />
                </View>
            </View>
        );
    }

    // ── Erro ────────────────────────────────────────────────────
    if (error) {
        return (
            <View style={s.container}>
                <CreatorTopBar count={0} onBack={() => safeBack(router, '/(tabs)/profile')} onNew={() => router.push('/new-itinerary')} />
                <View style={s.centerState}>
                    <CreatorEmptyState
                        icon="cloud-offline-outline"
                        title="Erro ao carregar"
                        text={error}
                        ctaLabel="Tentar novamente"
                        ctaIcon="refresh-outline"
                        onCta={() => fetchData()}
                    />
                </View>
            </View>
        );
    }

    // ── Ainda não é roteirista ──────────────────────────────────
    if (stats?.isCreator === false) {
        return (
            <View style={s.container}>
                <CreatorTopBar count={0} onBack={() => safeBack(router, '/(tabs)/profile')} onNew={() => router.push('/become-creator')} />
                <View style={s.centerState}>
                    <CreatorEmptyState
                        icon="sparkles-outline"
                        title="Ative seu portal de roteirista"
                        text="Crie sua área de criador para publicar roteiros digitais, acompanhar vendas e receber avaliações."
                        ctaLabel="Começar como roteirista"
                        ctaIcon="compass-outline"
                        onCta={() => { haptics.medium(); router.push('/become-creator'); }}
                    />
                </View>
            </View>
        );
    }

    const allItineraries = stats?.itineraries ?? [];

    const counts: Record<FilterTab, number> = {
        all: allItineraries.length,
        active: allItineraries.filter(i => i.status === 'active' || i.status === 'approved').length,
        pending_review: allItineraries.filter(i => i.status === 'pending_review').length,
        draft: allItineraries.filter(i => i.status === 'draft').length,
        rejected: allItineraries.filter(i => i.status === 'rejected').length,
        paused: allItineraries.filter(i => i.status === 'paused').length,
    };

    const tabDef = FILTER_TABS.find(t => t.key === activeFilter)!;
    const filtered = tabDef.statuses.length === 0
        ? allItineraries
        : allItineraries.filter(i => tabDef.statuses.includes(i.status));

    // ── Handlers de ação ────────────────────────────────────────
    const handleQuickAction = (item: CreatorItinerary) => {
        haptics.light();
        router.push(`/creator-itinerary/${item.id}`);
    };

    const openEditor = (id: string) => router.push(`/new-itinerary?id=${encodeURIComponent(id)}` as any);

    const handleEdit = async (item: CreatorItinerary) => {
        if (item.status === 'active' || item.status === 'approved') {
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
            action: 'archive',
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

    const handleShare = async (item: CreatorItinerary) => {
        haptics.light();
        await shareItineraryImperative({
            itineraryId: item.id,
            title: item.title || 'Roteiro VAMO',
            destination: item.destination,
            country: item.country,
            allowShare: true, // Dashboard só mostra Compartilhar p/ status=active (gate no card).
            isShareable: item.status === 'active' || item.status === 'approved',
            surface: 'creator_dashboard',
            actorRole: 'creator',
            accessToken,
        });
    };

    // Navegação para áreas dedicadas (sem mais popups rasos).
    const goToSales = () => { haptics.light(); router.push('/creator-sales'); };
    const goToReviews = () => { haptics.light(); router.push('/creator-reviews'); };
    const goToSettings = () => { haptics.light(); router.push('/creator-settings'); };
    const goToEarnings = () => { haptics.light(); router.push('/creator-earnings'); };
    const goToQuestions = () => { haptics.light(); router.push('/creator-questions'); };
    // Criar primeiro roteiro: criador confirmado vai direto ao wizard;
    // quem ainda não é roteirista passa pelo onboarding.
    const goCreateFirst = () => {
        haptics.medium();
        const alreadyCreator = !!user?.creatorId || (stats?.totalItineraries ?? 0) > 0;
        router.push(alreadyCreator ? '/new-itinerary' : '/become-creator');
    };

    // ── Métricas (resumo clicável) ──────────────────────────────
    // Espelha as 4 métricas do antigo dashboard: ativos, vendas, avaliação,
    // qualidade. A receita vira card de destaque próprio (Total recebido).
    const published = stats?.publishedItineraries ?? stats?.activeItineraries ?? 0;
    const metrics: CreatorMetric[] = stats ? [
        {
            key: 'routes', icon: 'briefcase-outline', tone: theme.colors.primary,
            value: String(published), label: 'Roteiros ativos',
            hint: `${stats.totalItineraries} no total`,
            empty: stats.totalItineraries === 0, emptyHint: 'Nenhum roteiro ainda',
            onPress: showAllAndScroll,
        },
        {
            key: 'sales', icon: 'receipt-outline', tone: theme.colors.secondary,
            value: String(stats.totalSales), label: 'Total de vendas',
            hint: `${formatMoney(Math.round(stats.totalRevenue))} em receita`, empty: stats.totalSales === 0,
            emptyHint: 'Nenhuma venda ainda', onPress: goToSales,
        },
        {
            key: 'rating', icon: 'star-outline', tone: theme.colors.warning,
            value: stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '—',
            label: 'Avaliação média', hint: `${stats.totalReviews} avaliaç${stats.totalReviews === 1 ? 'ão' : 'ões'}`,
            empty: stats.averageRating === 0, emptyHint: 'Sem avaliações ainda', onPress: goToReviews,
        },
        {
            key: 'quality', icon: 'shield-checkmark-outline', tone: theme.colors.success,
            value: stats.averageQualityScore != null ? `${stats.averageQualityScore}%` : '—',
            label: 'Qualidade média',
            hint: stats.averageQualityScore != null ? 'Média entre roteiros ativos' : 'Sem roteiros ativos',
            empty: stats.averageQualityScore == null, emptyHint: 'Sem roteiros ativos',
        },
    ] : [];

    // ── Atalhos ─────────────────────────────────────────────────
    const quickActions: QuickAction[] = stats ? [
        { key: 'new', icon: 'add-circle-outline', label: 'Novo roteiro', hint: 'Publique uma nova experiência', onPress: () => { haptics.medium(); router.push('/new-itinerary'); } },
        { key: 'all', icon: 'albums-outline', label: 'Meus roteiros', hint: 'Ver e gerenciar todos', badge: String(stats.totalItineraries), onPress: showAllAndScroll },
        { key: 'sales', icon: 'receipt-outline', label: 'Minhas vendas', hint: 'Vendas e receita por roteiro', badge: stats.totalSales > 0 ? String(stats.totalSales) : undefined, onPress: goToSales },
        { key: 'earnings', icon: 'wallet-outline', label: 'Ganhos', hint: 'Saldo e repasses', onPress: goToEarnings },
        { key: 'questions', icon: 'chatbubbles-outline', label: 'Perguntas', hint: 'Dúvidas dos viajantes', badge: pendingQuestions > 0 ? String(pendingQuestions) : undefined, onPress: goToQuestions },
        { key: 'reviews', icon: 'star-half-outline', label: 'Avaliações', hint: 'Notas e comentários', badge: stats.totalReviews > 0 ? String(stats.totalReviews) : undefined, onPress: goToReviews },
        { key: 'settings', icon: 'settings-outline', label: 'Configurações', hint: 'Perfil e recebimentos', onPress: goToSettings },
    ] : [];

    return (
        <View style={s.container}>
            <StatusBar barStyle="dark-content" />
            <CreatorTopBar
                count={allItineraries.length}
                onBack={() => safeBack(router, '/(tabs)/profile')}
                onNew={() => { haptics.medium(); router.push('/new-itinerary'); }}
            />

            <ScrollView
                ref={scrollRef}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={s.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
            >
                <View style={s.maxWidth}>
                    {/* Hero azul institucional com saudação */}
                    <CreatorPortalHero
                        userName={user?.name?.split(' ')[0]}
                        isWide={isWide}
                        onCreate={() => { haptics.medium(); router.push('/new-itinerary'); }}
                        onSeeList={showAllAndScroll}
                    />

                    {/* Resumo — sempre presente (cards zerados quando sem dados) */}
                    <Text style={s.sectionLabel}>Resumo</Text>
                    <View style={s.metricsGrid}>
                        {metrics.map(m => (
                            <CreatorMetricCard key={m.key} metric={m} style={isWide ? s.metricWide : s.metricNarrow} />
                        ))}
                    </View>

                    {/* Total recebido + Dica Pro */}
                    {stats && (
                        <CreatorRevenueCard
                            totalRevenue={stats.totalRevenue}
                            totalSales={stats.totalSales}
                            onPress={goToEarnings}
                        />
                    )}
                    <CreatorProTipCard />

                    {/* Atalhos */}
                    <Text style={s.sectionLabel}>Atalhos</Text>
                    <CreatorQuickActions actions={quickActions} isWide={isWide} />

                    {/* Lista de roteiros */}
                    <View onLayout={(e) => { listY.current = e.nativeEvent.layout.y; }}>
                        <Text style={s.sectionLabel}>Seus roteiros</Text>
                        {allItineraries.length > 0 && (
                            <FilterTabBar active={activeFilter} counts={counts} onSelect={handleFilterChange} />
                        )}

                        <Animated.View style={{ opacity: fadeAnim, marginTop: 14 }}>
                            {allItineraries.length === 0 ? (
                                <CreatorEmptyState
                                    icon="rocket-outline"
                                    title="Seu portal de roteirista está pronto"
                                    text="Crie seu primeiro roteiro para começar a vender sua experiência na VAMO."
                                    ctaLabel="Criar primeiro roteiro"
                                    ctaIcon="add"
                                    onCta={goCreateFirst}
                                />
                            ) : filtered.length === 0 ? (
                                <CreatorEmptyState
                                    compact
                                    icon={EMPTY_MESSAGES[activeFilter].icon}
                                    title={EMPTY_MESSAGES[activeFilter].title}
                                    text={EMPTY_MESSAGES[activeFilter].text}
                                />
                            ) : (
                                <>
                                    {filtered.map(item => (
                                        <CreatorItineraryCard
                                            key={item.id}
                                            item={item}
                                            isWide={isWide}
                                            onPress={() => { haptics.light(); router.push(`/creator-itinerary/${item.id}`); }}
                                            onQuickAction={() => handleQuickAction(item)}
                                            onEdit={() => handleEdit(item)}
                                            onDelete={() => handleDelete(item)}
                                            onViewPublic={() => { haptics.light(); router.push(`/(tabs)/itinerary/${item.id}` as any); }}
                                            onShare={() => handleShare(item)}
                                        />
                                    ))}
                                    <TouchableOpacity
                                        style={s.newItineraryCta}
                                        onPress={() => { haptics.medium(); router.push('/new-itinerary'); }}
                                        activeOpacity={0.8}
                                    >
                                        <Ionicons name="add-circle-outline" size={20} color={theme.colors.primary} />
                                        <Text style={s.newItineraryCtaText}>Criar novo roteiro</Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </Animated.View>
                    </View>

                    <View style={{ height: 40 }} />
                </View>
            </ScrollView>
        </View>
    );
}

// ─── Screen styles ─────────────────────────────────────────────
const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, backgroundColor: theme.colors.background },
    loadingText: { fontSize: 14, color: theme.colors.text.secondary },

    scrollContent: { paddingHorizontal: 16, paddingTop: 4 },
    maxWidth: { width: '100%', maxWidth: DASHBOARD_MAX_WIDTH, alignSelf: 'center' },

    centerState: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    sectionLabel: {
        fontSize: 12, fontWeight: '800', color: theme.colors.text.tertiary,
        textTransform: 'uppercase', letterSpacing: 0.6,
        marginTop: 18, marginBottom: 10,
    },

    metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    // Web: 4 por linha. Mobile: 2 colunas.
    metricWide: { flexGrow: 1, flexBasis: '22%', minWidth: 190 },
    metricNarrow: { flexGrow: 1, flexBasis: '46%', minWidth: 150 },

    newItineraryCta: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, borderWidth: 1.5, borderColor: theme.colors.primary,
        borderRadius: 14, paddingVertical: 14, marginTop: 6,
    },
    newItineraryCtaText: { fontSize: 15, fontWeight: '700', color: theme.colors.primary },
});
