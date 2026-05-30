import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../src/theme/theme';
import { CreatorCard } from '../../src/components/creator/CreatorCard';
import { getFeaturedCreators as apiFeaturedCreators } from '../../src/services/api';
import { CREATOR_REPUTATION_LEVELS } from '../../src/gamification';
import { IconicSearchBar } from '../../src/components/search/IconicSearchBar';
import { SearchModal } from '../../src/components/search/SearchModal';
import { useSearch } from '../../src/hooks/useSearch';
import { CTACarousel } from '../../src/components/home/CTACarousel';
import { Icon, IconName } from '../../src/components/common/Icons';
import { ItineraryCard } from '../../src/components/cards/ItineraryCard';
import { CATEGORIES } from '../../src/constants/categories';

// Critérios de ORDENAÇÃO (não filtro). Cada opção apenas reorganiza a
// lista — nunca esconde resultados. "relevance" é o estado padrão.
const SORT_OPTIONS: { key: string; label: string; icon: IconName }[] = [
    { key: 'relevance', label: 'Mais relevantes',  icon: 'compass' },
    { key: 'popular',   label: 'Mais populares',   icon: 'star' },
    { key: 'sales',     label: 'Mais vendidos',    icon: 'shopping-cart' },
    { key: 'rating',    label: 'Melhor avaliados', icon: 'award' },
    { key: 'newest',    label: 'Novidades',        icon: 'gem' },
    { key: 'price_asc', label: 'Menor preço',      icon: 'wallet' },
    { key: 'price_desc',label: 'Maior preço',      icon: 'trophy' },
];

const SORT_LABELS: Record<string, string> = Object.fromEntries(
    SORT_OPTIONS.map((o) => [o.key, o.label]),
);

const DEFAULT_SORT = 'relevance';

const isPublicItinerary = (itinerary: any) => {
    const status = String(itinerary?.status ?? itinerary?.approvalStatus ?? 'active').toLowerCase();
    return ['active', 'ativo', 'published', 'publicado'].includes(status);
};

const ts = (it: any) =>
    new Date(it?.publishedAt || it?.approvedAt || it?.createdAt || it?.updatedAt || 0).getTime();

const salesOf = (it: any) =>
    Number(it?.salesCount ?? it?.purchasesCount ?? it?.soldCount ?? it?.creator?.salesCount ?? 0);

const popularityOf = (it: any) =>
    Number(it?.popularityScore ?? 0) ||
    salesOf(it) * 3 +
    Number(it?.favoritesCount ?? 0) * 2 +
    Number(it?.viewsCount ?? 0);

/**
 * Ordena uma lista de roteiros sem nunca filtrá-la.
 * Roteiros sem dado no critério escolhido vão pro fim, mas continuam visíveis.
 */
const sortItineraries = (itineraries: any[], sort: string | null) => {
    const list = [...itineraries];
    const key = sort || DEFAULT_SORT;

    switch (key) {
        case 'sales':
            return list.sort((a, b) => salesOf(b) - salesOf(a) || ts(b) - ts(a));
        case 'rating':
            return list.sort((a, b) =>
                Number(b?.rating || 0) - Number(a?.rating || 0) ||
                Number(b?.reviewCount || 0) - Number(a?.reviewCount || 0) ||
                salesOf(b) - salesOf(a),
            );
        case 'newest':
            return list.sort((a, b) => ts(b) - ts(a));
        case 'popular':
            return list.sort((a, b) =>
                Number(b?.featured === true) - Number(a?.featured === true) ||
                popularityOf(b) - popularityOf(a) ||
                Number(b?.qualityScore || 0) - Number(a?.qualityScore || 0) ||
                Number(b?.rating || 0) - Number(a?.rating || 0),
            );
        case 'price_asc':
            return list.sort((a, b) => Number(a?.price || 0) - Number(b?.price || 0));
        case 'price_desc':
            return list.sort((a, b) => Number(b?.price || 0) - Number(a?.price || 0));
        case 'relevance':
        default:
            // Mantém a ordem natural da busca (já vem ranqueada pelo backend/useSearch)
            return list;
    }
};

export default function ItinerariesScreen() {
    const router = useRouter();
    const {
        sort: sortParam,
        category: categoryParam,
        intent: intentParam,
        destination: destinationParam,
    } = useLocalSearchParams<{
        sort?: string;
        category?: string;
        intent?: string;
        destination?: string;
    }>();
    const {
        filters,
        applyFilters,
        allItineraries,
        filteredItineraries,
        hasActiveFilters,
        selectedCategories,
        setSelectedCategory,
        setTravelIntent,
        loading,
        error,
    } = useSearch();
    const [searchModalVisible, setSearchModalVisible] = useState(false);
    const [featuredCreators, setFeaturedCreators] = useState<any[]>([]);

    // Estado local da ordenação ativa. Hidratado pelo query param "sort" da home.
    // Nunca null — sempre cai no DEFAULT_SORT pra deixar claro que ordenação é
    // independente dos filtros reais.
    const [activeSort, setActiveSort] = useState<string>(sortParam ?? DEFAULT_SORT);

    useEffect(() => {
        apiFeaturedCreators().then(setFeaturedCreators).catch(console.error);
    }, []);

    // Sincroniza com o query param vindo da home (caso o usuário troque
    // de chip clicando em outro shortcut antes de voltar à home).
    useEffect(() => {
        if (sortParam && sortParam !== activeSort && SORT_LABELS[sortParam]) {
            setActiveSort(sortParam);
        }
    }, [sortParam]);

    useEffect(() => {
        if (categoryParam) setSelectedCategory(categoryParam);
        if (intentParam) setTravelIntent(intentParam);
        if (destinationParam && destinationParam !== filters.destination) {
            applyFilters({ ...filters, destination: destinationParam });
        }
    }, [categoryParam, intentParam, destinationParam]);

    const itinerariesToShow = useMemo(() => {
        const base = hasActiveFilters ? filteredItineraries : allItineraries;
        return sortItineraries(base.filter(isPublicItinerary), activeSort);
    }, [activeSort, hasActiveFilters, filteredItineraries, allItineraries]);

    const activeCategoryLabel = useMemo(() => {
        if (selectedCategories.length === 0) return undefined;
        const labels = selectedCategories
            .map(category => CATEGORIES.find(cat => cat.id === category)?.label)
            .filter(Boolean);
        if (labels.length <= 2) return labels.join(' ou ');
        return `${labels.slice(0, 2).join(' ou ')} +${labels.length - 2}`;
    }, [selectedCategories]);

    // Título reflete apenas filtros reais — nunca a ordenação. A ordenação
    // aparece como subtexto pra não dar a impressão de que "Melhor avaliados"
    // está limitando a lista.
    const sectionTitle = activeCategoryLabel
        ? `Roteiros de ${activeCategoryLabel}`
        : filters.destination
        ? `Roteiros em ${filters.destination}`
        : 'Roteiros encontrados';

    const sortLabel = SORT_LABELS[activeSort] ?? SORT_LABELS[DEFAULT_SORT];
    const resultsCount = itinerariesToShow.length;

    return (
        <View style={styles.container}>
            {/* Header with Gradient */}
            <LinearGradient
                colors={theme.colors.gradients.institutional as unknown as [string, string]}
                style={styles.gradientHeader}
            >
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>Roteiros de Viajantes</Text>
                    <Text style={styles.headerSubtitle}>
                        Explore roteiros detalhados de quem já viveu cada destino
                    </Text>
                </View>
            </LinearGradient>

            {/* Iconic Search Bar */}
            <View style={styles.searchWrapper}>
                <IconicSearchBar
                    placeholder="Encontrar roteiros de viajantes"
                    onPress={() => setSearchModalVisible(true)}
                />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Ordenação — chips que só reorganizam, nunca filtram a lista */}
                <View style={styles.sortChipsRow}>
                    <Text style={styles.sortChipsLabel}>Ordenar por</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
                    >
                        {SORT_OPTIONS.map((f) => {
                            const active = activeSort === f.key;
                            return (
                                <TouchableOpacity
                                    key={f.key}
                                    style={[styles.sortChip, active && styles.sortChipActive]}
                                    onPress={() => setActiveSort(f.key)}
                                    activeOpacity={0.85}
                                    accessibilityRole="button"
                                    accessibilityState={{ selected: active }}
                                >
                                    <Icon
                                        name={f.icon}
                                        size={14}
                                        color={active ? '#fff' : theme.colors.primary}
                                        strokeWidth={2.2}
                                    />
                                    <Text style={[styles.sortChipText, active && styles.sortChipTextActive]}>
                                        {f.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* 1. Lista pública de roteiros digitais */}
                <View style={styles.section}>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.sectionTitle}>{sectionTitle}</Text>
                            {!loading && resultsCount > 0 && (
                                <Text style={styles.sectionMeta}>
                                    {resultsCount} {resultsCount === 1 ? 'roteiro' : 'roteiros'}
                                    {'  ·  '}
                                    Ordenado por <Text style={styles.sectionMetaStrong}>{sortLabel}</Text>
                                </Text>
                            )}
                        </View>
                        {hasActiveFilters && (
                            <TouchableOpacity
                                onPress={() => {
                                    setActiveSort(DEFAULT_SORT);
                                    setSelectedCategory(null);
                                    setTravelIntent(null);
                                    applyFilters({
                                        destination: '',
                                        duration: undefined,
                                        priceMin: 0,
                                        priceMax: 50000,
                                    });
                                }}
                            >
                                <Text style={{ color: theme.colors.primary, fontSize: 13, fontWeight: '600' }}>
                                    Limpar filtros
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {loading ? (
                        <View style={styles.listState}>
                            <ActivityIndicator color={theme.colors.primary} />
                            <Text style={styles.listStateText}>Carregando roteiros digitais...</Text>
                        </View>
                    ) : error ? (
                        <View style={styles.listState}>
                            <Icon name="info" size={32} color={theme.colors.text.tertiary} />
                            <Text style={styles.listStateTitle}>Não foi possível carregar os roteiros.</Text>
                            <Text style={styles.listStateText}>{error}</Text>
                        </View>
                    ) : itinerariesToShow.length === 0 ? (
                        <View style={styles.listState}>
                            <Icon name="search" size={32} color={theme.colors.text.tertiary} />
                            <Text style={styles.listStateTitle}>
                                {hasActiveFilters
                                    ? 'Nenhum roteiro encontrado para os filtros aplicados.'
                                    : 'Nenhum roteiro disponível por enquanto.'}
                            </Text>
                            <Text style={styles.listStateText}>
                                {hasActiveFilters
                                    ? 'Ajuste os filtros ou explore todos os roteiros ativos.'
                                    : 'Em breve novos roteiros serão publicados aqui.'}
                            </Text>
                            {hasActiveFilters && (
                                <TouchableOpacity
                                    style={styles.listStateButton}
                                    onPress={() => {
                                        setActiveSort(DEFAULT_SORT);
                                        setSelectedCategory(null);
                                        setTravelIntent(null);
                                        applyFilters({
                                            destination: '',
                                            duration: undefined,
                                            priceMin: 0,
                                            priceMax: 50000,
                                        });
                                    }}
                                    activeOpacity={0.85}
                                >
                                    <Text style={styles.listStateButtonText}>Limpar filtros</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    ) : (
                        itinerariesToShow.map((itinerary) => (
                            <ItineraryCard
                                key={itinerary.id}
                                itinerary={itinerary}
                                onPress={() => router.push(`/itinerary/${itinerary.id}`)}
                            />
                        ))
                    )}
                </View>

                {/* 2️⃣ Featured Creators */}
                <View style={styles.section}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Icon name="award" size={18} color={theme.colors.primary} strokeWidth={2} />
                        <Text style={styles.sectionTitle}>Criadores recomendados</Text>
                    </View>
                    <Text style={styles.sectionSubtitle}>
                        Viajantes verificados com histórico comprovado
                    </Text>

                    {featuredCreators.slice(0, 2).map((creator) => (
                        <View key={creator.id} style={{ marginTop: theme.spacing.md }}>
                            <CreatorCard
                                creator={creator}
                                onPress={() => router.push(`/creator/${creator.id}`)}
                            />
                        </View>
                    ))}
                </View>

                {/* 3️⃣ Reputação dos Roteiristas (Trilha do Roteirista) */}
                <View style={styles.section}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Icon name="shield-check" size={18} color={theme.colors.primary} strokeWidth={2} />
                        <Text style={styles.sectionTitle}>Reputação dos Roteiristas</Text>
                    </View>
                    <Text style={styles.sectionSubtitle}>
                        Entenda o nível de experiência e confiança por trás de cada roteiro.
                    </Text>

                    <View style={styles.badgesGrid}>
                        {CREATOR_REPUTATION_LEVELS.map((config) => (
                            <View key={config.level} style={styles.badgeExplanation}>
                                <View style={[styles.reputationChip, { backgroundColor: config.bgColor }]}>
                                    <Text style={{ fontSize: 20 }}>{config.icon}</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 14, fontWeight: '700', color: config.color, marginBottom: 2 }}>
                                        {config.label}
                                    </Text>
                                    <Text style={styles.badgeDescription}>
                                        {config.description}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

                {/* 4️⃣ Community Coming Soon */}
                <View style={styles.section}>
                    <View style={styles.communityCard}>
                        {/* Header */}
                        <View style={styles.communityHeader}>
                            <Icon name="users" size={24} color={theme.colors.primary} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.communityTitle}>Comunidade</Text>
                                <Text style={styles.communitySubtitle}>Converse com viajantes reais</Text>
                            </View>
                            <View style={styles.comingSoonBadge}>
                                <Text style={styles.comingSoonText}>Em Breve</Text>
                            </View>
                        </View>

                        {/* Preview entries - faded */}
                        <View style={styles.communityPreview}>
                            {[
                                { icon: 'landmark' as IconName, name: 'Paris', type: 'Chat', members: 234, user: 'Diego Artur', msg: 'Acabei de voltar! A Torre Eiffel à noite é imperdi...' },
                                { icon: 'compass' as IconName, name: 'Cancún', type: 'Chat', members: 189, user: 'Maria Clara', msg: 'Alguém sabe qual a melhor época para ir?' },
                                { icon: 'mountain' as IconName, name: 'Machu Picchu', type: 'Roteiro', members: 67, user: 'Pedro Henrique', msg: 'Lembrem de levar coca tea para altitude!' },
                            ].map((item, idx) => (
                                <View key={idx} style={[styles.communityEntry, idx < 2 && styles.communityEntryBorder]}>
                                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.surfaceLight, alignItems: 'center', justifyContent: 'center' }}>
                                        <Icon name={item.icon} size={20} color={theme.colors.primary} />
                                    </View>
                                    <View style={styles.communityEntryContent}>
                                        <Text style={styles.communityEntryName}>{item.name}</Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                            <Icon name="users" size={11} color={theme.colors.primary} />
                                            <Text style={styles.communityEntryMeta}>
                                                {item.type} • {item.members} membros
                                            </Text>
                                        </View>
                                        <Text style={styles.communityEntryMsg} numberOfLines={1}>
                                            <Text style={styles.communityEntryUser}>{item.user}: </Text>
                                            {item.msg}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>

                        {/* CTA */}
                        <View style={styles.communityFooter}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Icon name="bell" size={14} color={theme.colors.text.secondary} />
                                <Text style={styles.communityFooterText}>
                                    Quer ser avisado quando lançar?
                                </Text>
                            </View>
                            <TouchableOpacity style={styles.communityNotifyButton}>
                                <Text style={styles.communityNotifyText}>Me avise!</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* CTA Carousel - Auto-Play */}
                <View style={styles.section}>
                    <CTACarousel />
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
            {/* Search Modal */}
            <SearchModal
                visible={searchModalVisible}
                onClose={() => setSearchModalVisible(false)}
                onSearch={(newFilters) => {
                    applyFilters(newFilters);
                    setSearchModalVisible(false);
                }}
                context="itineraries"
                initialFilters={filters}
            />
        </View>
    );
}



const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.surface,
    },
    gradientHeader: {
        paddingTop: 60,
        paddingBottom: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    searchWrapper: {
        marginTop: -28,
        marginBottom: theme.spacing.md,
    },
    headerContent: {
        paddingHorizontal: theme.spacing.md,
        marginBottom: theme.spacing.sm,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: theme.colors.text.inverse,
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: theme.colors.text.inverse,
        opacity: 0.9,
    },
    content: {
        flex: 1,
    },
    section: {
        padding: theme.spacing.md,
    },
    sortChipsRow: {
        paddingTop: 10,
        paddingBottom: 12,
        backgroundColor: '#fff',
        gap: 8,
    },
    sortChipsLabel: {
        paddingHorizontal: 16,
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.6,
        color: theme.colors.text.tertiary,
        textTransform: 'uppercase',
    },
    sortChip: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 14, paddingVertical: 8,
        backgroundColor: theme.colors.surface,
        borderRadius: 9999,
        borderWidth: 1, borderColor: theme.colors.borderLight,
    },
    sortChipActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    sortChipText: {
        fontSize: 13, fontWeight: '600', color: theme.colors.text.primary,
    },
    sortChipTextActive: { color: '#fff' },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: 4,
    },
    sectionMeta: {
        fontSize: 12,
        color: theme.colors.text.secondary,
        marginBottom: 6,
    },
    sectionMetaStrong: {
        fontWeight: '700',
        color: theme.colors.text.primary,
    },
    sectionSubtitle: {
        fontSize: 14,
        color: theme.colors.text.secondary,
        marginBottom: 10,
    },
    listState: {
        minHeight: 150,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 28,
        paddingHorizontal: 18,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        backgroundColor: theme.colors.background,
    },
    listStateTitle: {
        marginTop: 10,
        fontSize: 15,
        fontWeight: '700',
        color: theme.colors.text.primary,
        textAlign: 'center',
    },
    listStateText: {
        marginTop: 8,
        color: theme.colors.text.secondary,
        fontSize: 13,
        textAlign: 'center',
    },
    listStateButton: {
        marginTop: 14,
        borderRadius: 10,
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    listStateButtonText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700',
    },
    badgesGrid: {
        gap: theme.spacing.sm,
    },
    badgeExplanation: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
        backgroundColor: theme.colors.background,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
    },
    badgeDescription: {
        flex: 1,
        fontSize: 13,
        color: theme.colors.text.secondary,
    },
    reputationChip: {
        width: 44,
        height: 44,
        borderRadius: theme.borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    toggleButton: {
        paddingVertical: theme.spacing.sm,
    },
    toggleButtonText: {
        fontSize: 15,
        color: theme.colors.primary,
        fontWeight: '500',
    },
    // Community Teaser Card
    communityCard: {
        backgroundColor: theme.colors.background,
        borderRadius: theme.borderRadius.lg,
        overflow: 'hidden',
        ...theme.shadows.medium,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    communityHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
    },
    communityIcon: {
        fontSize: 28,
    },
    communityTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.colors.text.primary,
    },
    communitySubtitle: {
        fontSize: 13,
        color: theme.colors.text.secondary,
        marginTop: 2,
    },
    comingSoonBadge: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: theme.borderRadius.full,
    },
    comingSoonText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#FFFFFF',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    communityPreview: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        opacity: 0.55,
    },
    communityEntry: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        gap: 12,
    },
    communityEntryBorder: {
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
    },
    communityEntryEmoji: {
        fontSize: 36,
    },
    communityEntryContent: {
        flex: 1,
    },
    communityEntryName: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: 2,
    },
    communityEntryMeta: {
        fontSize: 12,
        color: theme.colors.primary,
        fontWeight: '600',
        marginBottom: 4,
    },
    communityEntryMsg: {
        fontSize: 13,
        color: theme.colors.text.secondary,
        lineHeight: 18,
    },
    communityEntryUser: {
        fontWeight: '700',
        color: theme.colors.text.primary,
    },
    communityFooter: {
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderTopWidth: 1,
        borderTopColor: theme.colors.borderLight,
        gap: 10,
    },
    communityFooterText: {
        fontSize: 14,
        color: theme.colors.text.secondary,
    },
    communityNotifyButton: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: theme.borderRadius.full,
    },
    communityNotifyText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});
