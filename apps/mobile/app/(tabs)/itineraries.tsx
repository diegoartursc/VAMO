import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../src/theme/theme';
import { VerifiedBadge } from '../../src/components/creator/VerifiedBadge';
import { CreatorCard } from '../../src/components/creator/CreatorCard';
import { PriceComparison } from '../../src/components/comparison/PriceComparison';
import { getFeaturedCreators as apiFeaturedCreators, getItineraries } from '../../src/services/api';
import { VERIFICATION_CONFIGS } from '../../src/types/creator';
import { IconicSearchBar } from '../../src/components/search/IconicSearchBar';
import { SearchModal } from '../../src/components/search/SearchModal';
import { useSearch } from '../../src/hooks/useSearch';
import { CTACarousel } from '../../src/components/home/CTACarousel';
import { CoverCarousel } from '../../src/components/common/CoverCarousel';
import { ITINERARY_INCLUSIONS } from '../../src/data/itineraryInclusions';
import { Icon, IconName } from '../../src/components/common/Icons';
import { ItineraryCard } from '../../src/components/cards/ItineraryCard';

// Filtros marketplace exibidos no topo da tela quando o usuário entra
// vindo de um chip da home. Mantemos os mesmos 4 chips da home como
// "estado ativo" — clicar em um troca a ordenação sem sair da tela.
const SORT_FILTERS: { key: string; label: string; icon: IconName }[] = [
    { key: 'popular',  label: 'Mais populares',    icon: 'star' },
    { key: 'sales',    label: 'Mais vendidos',     icon: 'package' },
    { key: 'rating',   label: 'Melhor avaliados',  icon: 'award' },
    { key: 'newest',   label: 'Novidades',         icon: 'gem' },
];

const SORT_LABELS: Record<string, string> = {
    popular: 'Mais populares',
    sales:   'Mais vendidos',
    rating:  'Melhor avaliados',
    newest:  'Novidades',
};

export default function ItinerariesScreen() {
    const router = useRouter();
    const { sort: sortParam } = useLocalSearchParams<{ sort?: string }>();
    const { filters, applyFilters, allItineraries } = useSearch();
    const [searchModalVisible, setSearchModalVisible] = useState(false);
    const [showComparison, setShowComparison] = useState(false);
    const [featuredCreators, setFeaturedCreators] = useState<any[]>([]);

    // Estado local do chip ativo. Hidratado pelo query param "sort" da home.
    const [activeSort, setActiveSort] = useState<string | null>(sortParam ?? null);
    const [sortedItineraries, setSortedItineraries] = useState<any[] | null>(null);
    const [loadingSort, setLoadingSort] = useState(false);

    useEffect(() => {
        apiFeaturedCreators().then(setFeaturedCreators).catch(console.error);
    }, []);

    // Sincroniza com o query param vindo da home (caso o usuário troque
    // de chip clicando em outro shortcut antes de voltar à home).
    useEffect(() => {
        if (sortParam && sortParam !== activeSort) setActiveSort(sortParam);
    }, [sortParam]);

    // Refaz o fetch toda vez que o filtro mudar.
    useEffect(() => {
        let cancelled = false;
        if (!activeSort) { setSortedItineraries(null); return; }
        setLoadingSort(true);
        getItineraries({ sort: activeSort })
            .then(list => { if (!cancelled) setSortedItineraries(list); })
            .catch(() => { if (!cancelled) setSortedItineraries([]); })
            .finally(() => { if (!cancelled) setLoadingSort(false); });
        return () => { cancelled = true; };
    }, [activeSort]);

    const itinerariesToShow = useMemo(() => {
        if (activeSort && sortedItineraries) return sortedItineraries;
        // Fallback: comportamento original (só featured)
        return allItineraries.filter(it => it.featured);
    }, [activeSort, sortedItineraries, allItineraries]);

    const sectionTitle = activeSort
        ? SORT_LABELS[activeSort] || 'Roteiros'
        : 'Roteiros mais escolhidos pela comunidade';

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
                {/* 🎯 Chips de ordenação marketplace — mesmos 4 da home */}
                <View style={styles.sortChipsRow}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
                    >
                        {SORT_FILTERS.map((f) => {
                            const active = activeSort === f.key;
                            return (
                                <TouchableOpacity
                                    key={f.key}
                                    style={[styles.sortChip, active && styles.sortChipActive]}
                                    onPress={() => setActiveSort(active ? null : f.key)}
                                    activeOpacity={0.85}
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

                {/* 1️⃣ Lista (Featured por padrão, ou ordenada quando há filtro) */}
                <View style={styles.section}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={styles.sectionTitle}>{sectionTitle}</Text>
                        {activeSort && (
                            <TouchableOpacity onPress={() => setActiveSort(null)}>
                                <Text style={{ color: theme.colors.primary, fontSize: 13, fontWeight: '600' }}>
                                    Limpar
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {loadingSort ? (
                        <View style={{ paddingVertical: 32, alignItems: 'center' }}>
                            <ActivityIndicator color={theme.colors.primary} />
                        </View>
                    ) : itinerariesToShow.length === 0 ? (
                        <View style={{ paddingVertical: 32, alignItems: 'center' }}>
                            <Icon name="search" size={32} color={theme.colors.text.tertiary} />
                            <Text style={{ marginTop: 8, color: theme.colors.text.secondary, fontSize: 14 }}>
                                Nenhum roteiro encontrado para esse filtro.
                            </Text>
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

                {/* 3️⃣ Verification Levels */}
                <View style={styles.section}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Icon name="shield-check" size={18} color={theme.colors.primary} strokeWidth={2} />
                        <Text style={styles.sectionTitle}>Níveis de Verificação</Text>
                    </View>
                    <Text style={styles.sectionSubtitle}>
                        Aqui você sabe exatamente quem está por trás de cada roteiro
                    </Text>

                    <View style={styles.badgesGrid}>
                        {(['basic', 'trusted', 'expert', 'ambassador'] as const).map((level) => {
                            const config = VERIFICATION_CONFIGS[level];
                            return (
                                <View key={level} style={styles.badgeExplanation}>
                                    <VerifiedBadge level={level} size="large" />
                                    <Text style={styles.badgeDescription}>
                                        {config.description}
                                    </Text>
                                </View>
                            );
                        })}
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
        paddingVertical: 10,
        backgroundColor: '#fff',
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
    sectionSubtitle: {
        fontSize: 14,
        color: theme.colors.text.secondary,
        marginBottom: 10,
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
