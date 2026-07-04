/**
 * VAMO Mobile — "Minhas Vendas" do roteirista.
 * Mini-dashboard: resumo (vendas, receita, ticket médio, mais vendido),
 * vendas por roteiro e histórico recente. Dados reais via
 * GET /api/itineraries/dashboard/sales (auth por token). Atalho para a tela
 * de recebimentos (/creator-earnings).
 */
import React, { useState, useCallback, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    StatusBar, ActivityIndicator, RefreshControl, useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { safeBack } from '../src/utils/navigation';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../src/theme/theme';
import { haptics } from '../src/services/haptics';
import { useAuth } from '../src/contexts/AuthContext';
import { formatMoney } from '@vamo/shared/itinerary';
import { getCreatorSalesDashboard } from '../src/services/api';
import { CreatorAvatar } from '../src/components/common/CreatorAvatar';
import { CreatorSubHeader } from '../src/features/creator/dashboard/CreatorDashboardHeader';
import { CreatorMetricCard, CreatorMetric } from '../src/features/creator/dashboard/CreatorMetricCard';
import { CreatorEmptyState } from '../src/features/creator/dashboard/CreatorEmptyState';
import {
    CreatorSalesDashboard, DASHBOARD_MAX_WIDTH, WIDE_BREAKPOINT,
} from '../src/features/creator/dashboard/types';

function formatDate(iso: string): string {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function CreatorSalesScreen() {
    const router = useRouter();
    const { accessToken, isAuthenticated, isLoading: authLoading } = useAuth();
    const { width } = useWindowDimensions();
    const isWide = width >= WIDE_BREAKPOINT;

    const [data, setData] = useState<CreatorSalesDashboard | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async (isRefresh = false) => {
        if (authLoading) return;
        if (!isAuthenticated || !accessToken) { setLoading(false); setRefreshing(false); return; }
        if (!isRefresh) setLoading(true);
        setError(null);
        try {
            setData(await getCreatorSalesDashboard(accessToken));
        } catch (e: any) {
            setError('Não foi possível carregar suas vendas. Verifique sua conexão.');
        } finally {
            setLoading(false); setRefreshing(false);
        }
    }, [accessToken, authLoading, isAuthenticated]);

    useEffect(() => { fetchData(); }, [fetchData]);
    const onRefresh = useCallback(() => { setRefreshing(true); fetchData(true); }, [fetchData]);

    const goEarnings = () => { haptics.light(); router.push('/creator-earnings'); };

    if (authLoading || loading) {
        return (
            <View style={s.loading}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={s.loadingText}>Carregando suas vendas...</Text>
            </View>
        );
    }

    const header = (
        <CreatorSubHeader
            title="Minhas vendas"
            subtitle="Acompanhe vendas confirmadas e receita dos seus roteiros."
            onBack={() => safeBack(router, '/created-itineraries')}
        />
    );

    if (!isAuthenticated) {
        return (
            <View style={s.container}>
                {header}
                <View style={s.center}>
                    <CreatorEmptyState icon="lock-closed-outline" title="Login necessário" text="Faça login para ver suas vendas." ctaLabel="Entrar" onCta={() => router.push({ pathname: '/login' as any, params: { next: '/creator-sales' } })} />
                </View>
            </View>
        );
    }
    if (error) {
        return (
            <View style={s.container}>
                {header}
                <View style={s.center}>
                    <CreatorEmptyState icon="cloud-offline-outline" title="Erro ao carregar" text={error} ctaLabel="Tentar novamente" ctaIcon="refresh-outline" onCta={() => fetchData()} />
                </View>
            </View>
        );
    }

    const d = data!;
    const hasSales = d.totalSales > 0;

    const metrics: CreatorMetric[] = [
        { key: 'sales', icon: 'receipt-outline', tone: theme.colors.secondary, value: String(d.totalSales), label: 'Vendas', hint: 'Confirmadas', empty: !hasSales, emptyHint: 'Nenhuma ainda' },
        { key: 'revenue', icon: 'wallet-outline', tone: theme.colors.success, value: formatMoney(Math.round(d.totalRevenue)), label: 'Receita', hint: 'Total em vendas', empty: !hasSales, emptyHint: 'Sem receita' },
        { key: 'ticket', icon: 'pricetag-outline', tone: theme.colors.primary, value: formatMoney(Math.round(d.averageTicket)), label: 'Ticket médio', hint: 'Por venda', empty: !hasSales, emptyHint: '—' },
        { key: 'top', icon: 'trophy-outline', tone: theme.colors.warning, value: d.topItinerary ? String(d.topItinerary.salesCount) : '—', label: 'Mais vendido', hint: d.topItinerary ? d.topItinerary.title : 'Sem destaque ainda', empty: !d.topItinerary, emptyHint: 'Sem destaque ainda', onPress: d.topItinerary ? () => router.push(`/creator-itinerary/${d.topItinerary!.itineraryId}`) : undefined },
    ];

    return (
        <View style={s.container}>
            <StatusBar barStyle="dark-content" />
            {header}
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={s.scroll}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
            >
                <View style={s.maxWidth}>
                    {!hasSales ? (
                        <CreatorEmptyState
                            icon="receipt-outline"
                            title="Nenhuma venda ainda"
                            text="Assim que um viajante comprar um dos seus roteiros, a venda aparecerá aqui."
                            ctaLabel="Ver meus roteiros publicados"
                            ctaIcon="albums-outline"
                            onCta={() => router.push('/created-itineraries')}
                        />
                    ) : (
                        <>
                            <Text style={s.sectionLabel}>Resumo</Text>
                            <View style={s.metricsGrid}>
                                {metrics.map(m => (
                                    <CreatorMetricCard key={m.key} metric={m} style={isWide ? s.metricWide : s.metricNarrow} />
                                ))}
                            </View>

                            {/* Atalho para recebimentos */}
                            <TouchableOpacity style={s.linkCard} onPress={goEarnings} activeOpacity={0.8}>
                                <View style={s.linkIcon}><Ionicons name="card-outline" size={20} color={theme.colors.primary} /></View>
                                <View style={{ flex: 1 }}>
                                    <Text style={s.linkTitle}>Recebimentos e saldo</Text>
                                    <Text style={s.linkHint}>Veja saldo disponível e configure seus pagamentos</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={18} color={theme.colors.text.tertiary} />
                            </TouchableOpacity>

                            {/* Vendas por roteiro */}
                            <Text style={s.sectionLabel}>Vendas por roteiro</Text>
                            {d.salesByItinerary.map(it => (
                                <TouchableOpacity key={it.itineraryId} style={s.row} activeOpacity={0.8} onPress={() => router.push(`/creator-itinerary/${it.itineraryId}`)}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={s.rowTitle} numberOfLines={2}>{it.title}</Text>
                                        <View style={s.rowMeta}>
                                            <Text style={s.rowMetaText}>{it.salesCount} venda{it.salesCount === 1 ? '' : 's'}</Text>
                                            <Text style={s.dot}>·</Text>
                                            <Text style={s.rowMetaText}>preço médio {formatMoney(Math.round(it.averagePrice))}</Text>
                                            {it.rating > 0 && (<><Text style={s.dot}>·</Text><Text style={s.rowMetaText}>★ {it.rating.toFixed(1)}</Text></>)}
                                        </View>
                                    </View>
                                    <Text style={s.rowRevenue}>{formatMoney(Math.round(it.revenue))}</Text>
                                </TouchableOpacity>
                            ))}

                            {/* Histórico recente */}
                            <Text style={s.sectionLabel}>Histórico recente</Text>
                            {d.recentSales.map(sale => (
                                <View key={sale.id} style={s.histRow}>
                                    <CreatorAvatar avatar={sale.buyerAvatar} name={sale.buyerName} size={36} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={s.histTitle} numberOfLines={1}>{sale.itineraryTitle}</Text>
                                        <Text style={s.histMeta}>{sale.buyerName} · {formatDate(sale.date)}</Text>
                                    </View>
                                    <Text style={s.histAmount}>{formatMoney(Math.round(sale.amount))}</Text>
                                </View>
                            ))}
                        </>
                    )}
                    <View style={{ height: 40 }} />
                </View>
            </ScrollView>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    loading: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, backgroundColor: theme.colors.background },
    loadingText: { fontSize: 14, color: theme.colors.text.secondary },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scroll: { paddingHorizontal: 16, paddingTop: 6 },
    maxWidth: { width: '100%', maxWidth: DASHBOARD_MAX_WIDTH, alignSelf: 'center' },

    sectionLabel: { fontSize: 12, fontWeight: '800', color: theme.colors.text.tertiary, textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 18, marginBottom: 10 },

    metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    metricWide: { flexGrow: 1, flexBasis: '22%', minWidth: 190 },
    metricNarrow: { flexGrow: 1, flexBasis: '46%', minWidth: 150 },

    linkCard: {
        flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14,
        backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border,
        borderRadius: 14, padding: 14, ...theme.shadows.small,
    },
    linkIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: theme.colors.primary + '12', alignItems: 'center', justifyContent: 'center' },
    linkTitle: { fontSize: 14, fontWeight: '700', color: theme.colors.text.primary },
    linkHint: { fontSize: 12, color: theme.colors.text.tertiary, marginTop: 2 },

    row: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border,
        borderRadius: 14, padding: 13, marginBottom: 8,
    },
    rowTitle: { fontSize: 14, fontWeight: '700', color: theme.colors.text.primary, lineHeight: 19 },
    rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' },
    rowMetaText: { fontSize: 12, color: theme.colors.text.secondary },
    dot: { fontSize: 12, color: theme.colors.text.tertiary },
    rowRevenue: { fontSize: 15, fontWeight: '800', color: theme.colors.success },

    histRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.colors.borderLight },
    histTitle: { fontSize: 13.5, fontWeight: '600', color: theme.colors.text.primary },
    histMeta: { fontSize: 12, color: theme.colors.text.tertiary, marginTop: 1 },
    histAmount: { fontSize: 14, fontWeight: '700', color: theme.colors.text.primary },
});
