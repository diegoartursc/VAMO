import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Dimensions,
    Platform,
    StatusBar,
    SafeAreaView,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { theme } from '../../src/theme/theme';
import { useSearch } from '../../src/hooks/useSearch';
import { analytics } from '../../src/services/analytics';

// Components
import { Icon } from '../../src/components/common/Icons';
import { ErrorState } from '../../src/components/common/ErrorState';
import VamoLogo from '../../src/components/common/VamoLogo';
import { SearchModal } from '../../src/components/search/SearchModal';
import DecisionAssistant from '../../src/components/home/DecisionAssistant';
import { DestinationImageCarousel } from '../../src/components/home/DestinationImageCarousel';
import { CTACarousel } from '../../src/components/home/CTACarousel';
import WhyDifferent from '../../src/components/common/WhyDifferent';
import { ItineraryCard } from '../../src/components/cards/ItineraryCard';
import { getCoverImages } from '../../src/utils/itineraryMedia';
import { useFavorites } from '../../src/hooks/useFavorites';
import { selectContinueSearch, selectUnforgettable } from '../../src/utils/homeSections';
import { formatMoney } from '@vamo/shared/itinerary';


const { width } = Dimensions.get('window');
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=900&auto=format&fit=crop';

const isPublicItinerary = (itinerary: any) => {
    const status = String(itinerary?.status ?? itinerary?.approvalStatus ?? 'active').toLowerCase();
    return ['active', 'ativo', 'approved', 'aprovado', 'published', 'publicado'].includes(status);
};

const getPrimaryImage = (itinerary: any) => getCoverImages(itinerary)[0] || FALLBACK_IMAGE;
const formatPrice = (price: unknown) => {
    const value = Number(price);
    if (!Number.isFinite(value) || value <= 0) return 'Grátis';
    return formatMoney(value);
};

function HomeMiniItineraryCard({ itinerary, width: cardWidth, onPress }: { itinerary: any; width: number; onPress: () => void }) {
    const { isFavorite, toggleFavorite } = useFavorites();
    const itineraryId = typeof itinerary?.id === 'string' ? itinerary.id : '';
    const favorite = itineraryId ? isFavorite(itineraryId) : false;

    const handleFavorite = async (event: any) => {
        event.stopPropagation?.();
        if (!itineraryId) return;
        await toggleFavorite(itineraryId);
    };

    return (
        <TouchableOpacity
            style={[styles.miniCard, { width: cardWidth }]}
            activeOpacity={0.85}
            onPress={onPress}
        >
            <Image
                source={{ uri: getPrimaryImage(itinerary) }}
                style={styles.miniCardImage}
                resizeMode="cover"
            />
            <TouchableOpacity
                style={[styles.miniFavoriteButton, favorite && styles.miniFavoriteButtonActive]}
                onPress={handleFavorite}
                activeOpacity={0.85}
                accessibilityLabel={favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            >
                <Icon name="heart" size={15} color={favorite ? '#EF4444' : '#fff'} />
            </TouchableOpacity>
            <View style={styles.miniCardContent}>
                <Text style={styles.miniCardTitle} numberOfLines={2}>
                    {itinerary.title || 'Roteiro digital'}
                </Text>
                <View style={styles.miniCardMetaRow}>
                    <Icon name="location" size={12} color={theme.colors.text.tertiary} />
                    <Text style={styles.miniCardMetaText} numberOfLines={1}>
                        {itinerary.destination || itinerary.city || 'Destino a confirmar'}
                    </Text>
                </View>
                <View style={styles.miniCardFooter}>
                    <View style={styles.miniCardMetaRow}>
                        <Icon name="star" size={12} color="#F59E0B" strokeWidth={2.5} />
                        <Text style={styles.miniCardRating}>
                            {Number(itinerary.rating || 0) > 0 ? Number(itinerary.rating).toFixed(1) : 'Novo'}
                        </Text>
                    </View>
                    <Text style={styles.miniCardPrice}>{formatPrice(itinerary.price)}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
}


// ─── HERO SECTION COMPONENT ──────────────────────────────
const HeroHeader = ({
    onSearchPress,
    onShortcutPress,
}: {
    onSearchPress: () => void;
    onShortcutPress: (params?: Record<string, string>) => void;
}) => {
    const shortcuts: Array<{ label: string; icon: 'star' | 'utensils' | 'backpack' | 'users'; params: Record<string, string> }> = [
        { label: 'Mais populares', icon: 'star' as const, params: { sort: 'popular' } },
        { label: 'Gastronômicos', icon: 'utensils' as const, params: { category: 'gastronomia' } },
        { label: 'Mochilão', icon: 'backpack' as const, params: { category: 'mochilao', intent: 'mochilao' } },
        { label: 'Com crianças', icon: 'users' as const, params: { category: 'familia' } },
    ];

    return (
        <View style={styles.heroContainer}>
            <Image
                source={{ uri: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=2073&auto=format&fit=crop' }}
                style={[StyleSheet.absoluteFillObject, Platform.OS === 'web' ? ({ objectFit: 'cover' as any }) : {}]}
                resizeMode="cover"
            />
            <LinearGradient
                colors={['rgba(26,50,99,0.6)', 'rgba(26,50,99,0.9)']}
                style={StyleSheet.absoluteFillObject}
            />

            <SafeAreaView style={styles.heroSafeArea}>
                {/* Brand Logo & Actions */}
                <View style={styles.heroTopRow}>
                    <VamoLogo size={120} style={styles.brandLogo} />
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        <TouchableOpacity style={styles.iconButton} onPress={() => Alert.alert('🔔 Notificações', 'Você não possui notificações no momento.')}>
                            <Icon name="bell" size={24} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.heroContent}>
                    <Text style={styles.heroTitle}>Onde será sua{'\n'}próxima aventura?</Text>
                    <Text style={styles.heroTagline}>Roteiros de quem já viveu.</Text>
                    <Text style={styles.heroSubtitle}>Planejamentos detalhados por{'\n'}especialistas que já estiveram lá.</Text>

                    {/* Search Bar - Glassmorphism */}
                    <TouchableOpacity style={styles.heroSearchBar} activeOpacity={0.9} onPress={onSearchPress}>
                        <Icon name="search" size={20} color="rgba(255,255,255,0.7)" />
                        <Text style={styles.heroSearchPlaceholder}>Para onde você quer ir?</Text>
                        <View style={styles.heroFilterIcon}>
                            <Icon name="filter" size={16} color={theme.colors.primary} />
                        </View>
                    </TouchableOpacity>

                    {/* Explore Shortcuts 2x2 Grid — marketplace style */}
                    <View style={styles.heroShortcutsGrid}>
                        {shortcuts.map((shortcut) => (
                            <TouchableOpacity
                                key={shortcut.label}
                                style={styles.heroShortcutCard}
                                onPress={() => onShortcutPress(shortcut.params)}
                                activeOpacity={0.85}
                            >
                                <View style={styles.heroShortcutIconWrap}>
                                    <Icon name={shortcut.icon} size={18} color={theme.colors.primary} strokeWidth={2} />
                                </View>
                                <Text style={styles.heroShortcutText} numberOfLines={2}>{shortcut.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </SafeAreaView>
        </View>
    );
};


// ─── MAIN HOME SCREEN ───────────────────────────────────────
export default function HomeScreen() {
    const router = useRouter();
    const {
        applyFilters,
        filters,
        allItineraries,
        loading,
        error,
        reload,
        setSelectedCategory,
        setTravelIntent,
        searchIntent,
        recordSearchIntent,
    } = useSearch();
    const publicItineraries = useMemo(
        () => allItineraries.filter(isPublicItinerary),
        [allItineraries],
    );

    // Roteiros recém-publicados (seção "Novos Roteiros").
    const newItineraries = useMemo(() => publicItineraries.slice(0, 5), [publicItineraries]);

    // "Continue sua busca": só ganha itens quando há histórico real de intenção
    // e existem roteiros relacionados a ele. Sem isso, devolve [] e a seção some.
    const continueSearchItems = useMemo(
        () => selectContinueSearch(publicItineraries, searchIntent),
        [publicItineraries, searchIntent],
    );

    // "Experiências inesquecíveis": roteiros que atingem o score mínimo de
    // apelo experiencial (fotos, destaques, categorias fortes, avaliação...).
    const unforgettableItems = useMemo(
        () => selectUnforgettable(publicItineraries),
        [publicItineraries],
    );

    // Derive "Destinos em Alta" agrupando por PAÍS — agrupar por cidade
    // gerava cards isolados (Playa del Carmen, cidade 1) com pouca densidade.
    // Países iguais com escrita diferente (brasil/Brasil/BRASIL) são fundidos
    // pelo normalizeKey; mantemos o label original do roteiro mais recente.
    const popularDestinations = useMemo(() => {
        const normalizeKey = (s: string) =>
            s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

        const grouped: Record<string, {
            label: string;
            images: string[];
            count: number;
            featured: number;
            rating: number;
        }> = {};

        publicItineraries.forEach((it) => {
            const country = (it.country ?? '').toString().trim();
            if (!country) return;
            const key = normalizeKey(country);
            if (!grouped[key]) {
                grouped[key] = { label: country, images: [], count: 0, featured: 0, rating: 0 };
            }
            grouped[key].count += 1;
            grouped[key].rating = Math.max(grouped[key].rating, it.rating ?? 0);
            if (it.featured) grouped[key].featured += 1;
            (it.images ?? []).filter(Boolean).forEach((img: string) => {
                if (!grouped[key].images.includes(img)) grouped[key].images.push(img);
            });
        });

        return Object.entries(grouped)
            .sort((a, b) =>
                b[1].featured - a[1].featured ||
                b[1].count - a[1].count ||
                b[1].rating - a[1].rating ||
                a[1].label.localeCompare(b[1].label, 'pt-BR'),
            )
            .slice(0, 6)
            .map(([key, data]) => ({
                id: key.replace(/\s+/g, '-'),
                name: data.label,
                images: data.images.slice(0, 5),
                count: data.count,
            }));
    }, [publicItineraries]);
    const [searchModalVisible, setSearchModalVisible] = useState(false);
    const [decisionAssistantVisible, setDecisionAssistantVisible] = useState(false);

    useEffect(() => {
        analytics.homeViewed();
    }, []);

    const goToItineraries = (params: Record<string, string> = {}) => {
        if (params.category) setSelectedCategory(params.category);
        if (params.intent) setTravelIntent(params.intent);
        if (params.destination) {
            applyFilters({
                ...filters,
                destination: params.destination,
            });
        }

        // Registra a intenção quando o atalho carrega sinal real (categoria,
        // estilo ou destino). Ordenações puras ("popular"/"newest") não contam.
        if (params.category || params.intent || params.destination) {
            recordSearchIntent({
                lastCategories: params.category ? [params.category] : undefined,
                lastStyle: params.intent ?? undefined,
                lastCity: params.destination,
                lastSearchQuery: params.destination,
            });
        }

        router.push({
            pathname: '/(tabs)/itineraries',
            params,
        } as any);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                bounces={false}
                contentContainerStyle={{ paddingBottom: 40 }}
            >
                {/* 1. Institutional Header */}
                <HeroHeader
                    onSearchPress={() => setSearchModalVisible(true)}
                    onShortcutPress={goToItineraries}
                />

                {/* 2. Trust Indicators (Below Header) */}
                <View style={styles.trustBar}>
                    <View style={styles.trustItem}>
                        <Icon name="verified" size={14} color={theme.colors.text.secondary} />
                        <Text style={styles.trustText}>Roteiros Verificados</Text>
                    </View>
                    <View style={styles.trustItem}>
                        <Icon name="shield-check" size={14} color={theme.colors.text.secondary} />
                        <Text style={styles.trustText}>Compra Segura</Text>
                    </View>
                </View>

                {/* 3. Decision Assistant (Quiz) */}
                <TouchableOpacity
                    style={styles.quizCard}
                    onPress={() => setDecisionAssistantVisible(true)}
                    activeOpacity={0.9}
                >
                    <View style={styles.quizIconContainer}>
                        <Icon name="compass" size={24} color={theme.colors.primary} />
                    </View>
                    <View style={styles.quizContent}>
                        <Text style={styles.quizTitle}>Não sabe para onde ir?</Text>
                        <Text style={styles.quizSubtitle}>Encontre o roteiro perfeito em 3 passos</Text>
                    </View>
                    <Icon name="chevron-right" size={20} color={theme.colors.text.tertiary} />
                </TouchableOpacity>

                {/* 4. Roteiros em Destaque */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Roteiros em Destaque</Text>
                        <TouchableOpacity onPress={() => goToItineraries()}>
                            <Text style={styles.seeAllText}>Ver todos</Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.sectionSubtitle}>Os mais bem avaliados pela comunidade VAMO.</Text>

                    {loading ? (
                        <HomeLoading />
                    ) : error ? (
                        <ErrorState compact message={error} onRetry={reload} />
                    ) : publicItineraries.filter(i => i.featured).length === 0 ? (
                        <HomeEmptyState onPress={() => goToItineraries()} />
                    ) : (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 16 }}>
                            {publicItineraries.filter(i => i.featured).slice(0, 5).map((itinerary) => (
                                <ItineraryCard
                                    key={itinerary.id}
                                    width={320}
                                    itinerary={itinerary}
                                    onPress={() => router.push(`/itinerary/${itinerary.id}`)}
                                />
                            ))}
                        </ScrollView>
                    )}
                </View>

                {/* 5. Novos Roteiros — oculta se não houver roteiros */}
                {!loading && newItineraries.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Novos Roteiros</Text>
                            <TouchableOpacity onPress={() => goToItineraries({ sort: 'newest' })}>
                                <Text style={styles.seeAllText}>Explorar</Text>
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.sectionSubtitle}>Planejamentos recém-publicados por especialistas.</Text>

                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 16 }}>
                            {newItineraries.map((itinerary) => (
                                <ItineraryCard
                                    key={itinerary.id}
                                    width={320}
                                    itinerary={itinerary}
                                    onPress={() => router.push(`/itinerary/${itinerary.id}`)}
                                />
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* 6a. Continue sua busca — só com histórico real + roteiros relacionados */}
                {!loading && continueSearchItems.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Continue sua busca</Text>
                            <TouchableOpacity onPress={() => goToItineraries()}>
                                <Text style={styles.seeAllText}>Ver todos</Text>
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.sectionSubtitle}>Roteiros que podem te interessar.</Text>

                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}>
                            {continueSearchItems.map((itinerary) => (
                                <HomeMiniItineraryCard
                                    key={itinerary.id}
                                    width={200}
                                    itinerary={itinerary}
                                    onPress={() => router.push(`/itinerary/${itinerary.id}`)}
                                />
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* 6b. Experiencias inesqueciveis — só com roteiros que batem o score */}
                {!loading && unforgettableItems.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Experiências inesquecíveis</Text>
                            <TouchableOpacity onPress={() => goToItineraries({ sort: 'score' })}>
                                <Text style={styles.seeAllText}>Ver todos</Text>
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.sectionSubtitle}>Vivências que você nunca vai esquecer.</Text>

                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}>
                            {unforgettableItems.map((itinerary) => (
                                <HomeMiniItineraryCard
                                    key={itinerary.id}
                                    width={260}
                                    itinerary={itinerary}
                                    onPress={() => router.push(`/itinerary/${itinerary.id}`)}
                                />
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* 7. Popular Destinations (Grid) — oculta se não houver destinos */}
                {!loading && popularDestinations.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, { paddingLeft: 0 }]}>Destinos em Alta</Text>
                            <TouchableOpacity onPress={() => goToItineraries()}>
                                <Text style={styles.seeAllText}>Ver todos</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.destinationsGrid}>
                            {popularDestinations.map((dest) => (
                                <TouchableOpacity
                                    key={dest.id}
                                    style={styles.destinationCard}
                                    onPress={() => goToItineraries({ destination: dest.name })}
                                    activeOpacity={0.9}
                                >
                                    <DestinationImageCarousel images={dest.images} />
                                    <LinearGradient
                                        colors={['transparent', 'rgba(0,0,0,0.55)']}
                                        style={StyleSheet.absoluteFillObject}
                                    />
                                    <View style={styles.destinationNameContainer}>
                                        <Text style={styles.destinationName}>{dest.name}</Text>
                                        <Text style={styles.destinationCount}>{dest.count} {dest.count === 1 ? 'roteiro' : 'roteiros'}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                {/* 7. CTA Carousel */}
                <View style={{ marginTop: 20 }}>
                    <CTACarousel />
                </View>

                {/* 8. Institutional Footer/Why Different */}
                <WhyDifferent />

            </ScrollView>

            {/* Modals */}
            <SearchModal
                visible={searchModalVisible}
                onClose={() => setSearchModalVisible(false)}
                onSearch={(newFilters) => {
                    applyFilters(newFilters);
                    if (newFilters?.destination) {
                        recordSearchIntent({
                            lastSearchQuery: newFilters.destination,
                            lastCity: newFilters.destination,
                        });
                    }
                    setSearchModalVisible(false);
                    goToItineraries();
                }}
                context="home"
                initialFilters={filters}
            />
            <DecisionAssistant
                visible={decisionAssistantVisible}
                onClose={() => setDecisionAssistantVisible(false)}
            />
        </View>
    );
}


// POPULAR_DESTINATIONS removed — now derived dynamically from allItineraries in useMemo above

function HomeLoading() {
    return (
        <View style={styles.homeStateContainer}>
            <ActivityIndicator color={theme.colors.primary} />
            <Text style={styles.homeStateText}>Carregando roteiros digitais...</Text>
        </View>
    );
}

function HomeEmptyState({ onPress }: { onPress: () => void }) {
    return (
        <View style={styles.homeStateContainer}>
            <Icon name="map" size={28} color={theme.colors.text.tertiary} />
            <Text style={styles.homeStateTitle}>Nenhum roteiro em destaque por enquanto</Text>
            <Text style={styles.homeStateText}>Explore todos os roteiros digitais disponíveis.</Text>
            <TouchableOpacity style={styles.homeStateButton} onPress={onPress} activeOpacity={0.85}>
                <Text style={styles.homeStateButtonText}>Explorar roteiros</Text>
                <Icon name="chevron-right" size={16} color="#FFF" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background, // Pure White
    },
    scrollView: {
        flex: 1,
    },

    // Header Styles
    headerContainer: {
        overflow: 'hidden',
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        backgroundColor: theme.colors.secondary,
        paddingBottom: 24,
        ...theme.shadows.medium,
    },
    headerBackground: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
    },
    orbitalLine1: {
        position: 'absolute',
        width: width * 1.5,
        height: width * 1.5,
        borderRadius: width,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        top: -width * 0.8,
        left: -width * 0.2,
    },
    orbitalLine2: {
        position: 'absolute',
        width: width * 1.2,
        height: width * 1.2,
        borderRadius: width,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        top: -width * 0.5,
        right: -width * 0.4,
    },
    headerContent: {
        paddingHorizontal: 24,
        paddingTop: Platform.OS === 'android' ? 40 : 10,
    },
    headerTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    brandText: {
        fontSize: 24,
        fontWeight: theme.typography.weights.heavy,
        color: '#FFFFFF',
        letterSpacing: -1,
    },
    brandSubText: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.6)',
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
    iconButton: {
        width: 40, height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },


    // Trust Bar
    trustBar: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 24,
        marginTop: 16,
        marginBottom: 24,
    },
    trustItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    trustText: {
        fontSize: 12,
        color: theme.colors.text.tertiary,
        fontWeight: '500',
    },

    // Quiz Card
    quizCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surfaceLight,
        marginHorizontal: 20,
        borderRadius: 16,
        padding: 16,
        marginBottom: 32,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    quizIconContainer: {
        width: 40, height: 40,
        borderRadius: 10,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    quizContent: {
        flex: 1,
    },
    quizTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: 2,
    },
    quizSubtitle: {
        fontSize: 13,
        color: theme.colors.text.secondary,
    },

    // Sections
    section: {
        marginBottom: 40,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingHorizontal: 20,
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.colors.text.primary,
        letterSpacing: -0.5,
    },
    sectionSubtitle: {
        fontSize: 14,
        color: theme.colors.text.tertiary,
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    seeAllText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.primary,
    },
    homeStateContainer: {
        marginHorizontal: 20,
        minHeight: 120,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        backgroundColor: theme.colors.surfaceLight,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 18,
    },
    homeStateTitle: {
        marginTop: 10,
        fontSize: 15,
        fontWeight: '700',
        color: theme.colors.text.primary,
        textAlign: 'center',
    },
    homeStateText: {
        marginTop: 8,
        fontSize: 13,
        color: theme.colors.text.secondary,
        textAlign: 'center',
    },
    homeStateButton: {
        marginTop: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: theme.colors.primary,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 9,
    },
    homeStateButtonText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#FFFFFF',
    },

    // Premium Card
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginHorizontal: 20,
        marginBottom: 24,
        ...theme.shadows.medium,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },

    // Hero Styles
    heroContainer: {
        width: '100%',
        minHeight: 300,
        ...theme.shadows.medium,
    },
    heroSafeArea: {
        flex: 1,
    },
    heroTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? 40 : 10,
        marginBottom: 20,
    },
    brandLogo: {
        width: 100,
        height: 32,
        resizeMode: 'contain',
    },
    heroContent: {
        paddingHorizontal: 20,
        paddingBottom: 24,
    },
    heroTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
        lineHeight: 32,
        marginBottom: 4,
    },
    heroTagline: {
        fontSize: 20,
        fontWeight: '600',
        color: '#28C9BF',
        marginBottom: 8,
    },
    heroSubtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.85)',
        fontWeight: '400',
        marginBottom: 24,
    },
    heroSearchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 52,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        marginBottom: 24,
    },
    heroSearchPlaceholder: {
        flex: 1,
        marginLeft: 10,
        fontSize: 15,
        color: 'rgba(255,255,255,0.7)',
    },
    heroFilterIcon: {
        width: 32, height: 32,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    heroShortcutsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 12,
    },
    heroShortcutCard: {
        width: '47%',
        flexDirection: 'column',
        alignItems: 'flex-start',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
        minHeight: 64,
        justifyContent: 'center',
    },
    heroShortcutIconWrap: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: 'rgba(40,201,191,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    heroShortcutText: {
        fontSize: 12,
        color: '#FFF',
        fontWeight: '600',
        lineHeight: 16,
    },

    cardImageContainer: {
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        overflow: 'hidden',
    },
    cardBadges: {
        position: 'absolute',
        top: 12, left: 12,
        flexDirection: 'row',
    },
    verifiedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        gap: 4,
    },
    verifiedText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#FFFFFF',
        textTransform: 'uppercase',
    },
    favoriteButton: {
        position: 'absolute',
        top: 12, right: 12,
        width: 36, height: 36,
        borderRadius: 18,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        ...theme.shadows.small,
    },
    cardContent: {
        padding: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    cardTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginRight: 8,
        lineHeight: 24,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surfaceLight,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        gap: 4,
    },
    ratingText: {
        fontSize: 12,
        fontWeight: '700',
        color: theme.colors.text.primary,
    },
    reviewCount: {
        fontSize: 12,
        color: theme.colors.text.tertiary,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    locationText: {
        fontSize: 13,
        color: theme.colors.text.secondary,
        marginLeft: 4,
    },
    dotSeparator: {
        marginHorizontal: 6,
        color: theme.colors.text.disabled,
    },
    durationText: {
        fontSize: 13,
        color: theme.colors.text.secondary,
    },
    featuresRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: theme.colors.surfaceLight,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    featureText: {
        fontSize: 12,
        color: theme.colors.text.secondary,
        fontWeight: '500',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: theme.colors.borderLight,
        paddingTop: 16,
    },
    priceLabel: {
        fontSize: 12,
        color: theme.colors.text.tertiary,
        marginBottom: 2,
    },
    priceValue: {
        fontSize: 20,
        fontWeight: '800',
        color: theme.colors.text.primary,
    },
    bookButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
        gap: 6,
        ...theme.shadows.button,
    },
    bookButtonText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#FFFFFF',
    },

    // Itinerary Card
    itineraryCard: {
        width: 200,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        ...theme.shadows.small,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        overflow: 'hidden',
    },
    itineraryImage: {
        width: '100%',
        height: 120,
    },
    itineraryContent: {
        padding: 12,
    },
    itineraryTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text.primary,
        marginBottom: 4,
    },
    itineraryCreator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 8,
    },
    creatorName: {
        fontSize: 11,
        color: theme.colors.text.tertiary,
    },
    itineraryPrice: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.colors.text.primary,
    },
    miniCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        overflow: 'hidden',
        ...theme.shadows.small,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    miniCardImage: {
        width: '100%',
        height: 150,
        backgroundColor: theme.colors.surfaceLight,
    },
    miniFavoriteButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.38)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.25)',
    },
    miniFavoriteButtonActive: {
        backgroundColor: 'rgba(255,255,255,0.92)',
        borderColor: 'rgba(239,68,68,0.25)',
    },
    miniCardContent: {
        padding: 12,
    },
    miniCardTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.colors.text.primary,
        lineHeight: 18,
        minHeight: 36,
        marginBottom: 8,
    },
    miniCardMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        minWidth: 0,
    },
    miniCardMetaText: {
        flex: 1,
        fontSize: 11,
        color: theme.colors.text.tertiary,
    },
    miniCardFooter: {
        marginTop: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    },
    miniCardRating: {
        fontSize: 11,
        fontWeight: '700',
        color: theme.colors.text.primary,
    },
    miniCardPrice: {
        fontSize: 13,
        fontWeight: '800',
        color: theme.colors.text.primary,
    },

    // Destinations
    destinationsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 20,
        gap: 12,
    },
    destinationCard: {
        width: (width - 52) / 2,
        height: 140,
        borderRadius: 16,
        overflow: 'hidden',
        ...theme.shadows.small,
    },
    destinationImage: {
        width: '100%',
        height: '100%',
    },
    destinationNameContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingVertical: 14,
        paddingHorizontal: 12,
        alignItems: 'center',
    },
    destinationName: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '800',
        textAlign: 'center',
    },
    destinationCount: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '500',
        marginTop: 2,
    }
});
