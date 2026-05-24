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
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { theme } from '../../src/theme/theme';
import { useSearch } from '../../src/hooks/useSearch';
import { analytics } from '../../src/services/analytics';
import { useFavoriteAnimation } from '../../src/components/providers/FavoriteAnimationProvider';

// Components
import { Icon } from '../../src/components/common/Icons';
import VamoLogo from '../../src/components/common/VamoLogo';
import { CoverCarousel } from '../../src/components/common/CoverCarousel';
import { SearchModal } from '../../src/components/search/SearchModal';
import DecisionAssistant from '../../src/components/home/DecisionAssistant';
import { DestinationImageCarousel } from '../../src/components/home/DestinationImageCarousel';
import { CTACarousel } from '../../src/components/home/CTACarousel';
import WhyDifferent from '../../src/components/common/WhyDifferent';
import { VerifiedBadge } from '../../src/components/creator/VerifiedBadge';
import { ItineraryCard } from '../../src/components/cards/ItineraryCard';


const { width } = Dimensions.get('window');


// ─── HERO SECTION COMPONENT ──────────────────────────────
const HeroHeader = ({ onSearchPress, router }: { onSearchPress: () => void; router: any }) => {
    return (
        <View style={styles.heroContainer}>
            <Image
                source={{ uri: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=2073&auto=format&fit=crop' }}
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
                        <TouchableOpacity
                            style={styles.heroShortcutCard}
                            onPress={() => router.push('/(tabs)/itineraries?sort=popular')}
                        >
                            <View style={styles.heroShortcutIconWrap}>
                                <Icon name="star" size={18} color={theme.colors.primary} strokeWidth={2} />
                            </View>
                            <Text style={styles.heroShortcutText} numberOfLines={2}>Mais populares</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.heroShortcutCard}
                            onPress={() => router.push('/(tabs)/itineraries?sort=sales')}
                        >
                            <View style={styles.heroShortcutIconWrap}>
                                <Icon name="package" size={18} color={theme.colors.primary} strokeWidth={2} />
                            </View>
                            <Text style={styles.heroShortcutText} numberOfLines={2}>Mais vendidos</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.heroShortcutCard}
                            onPress={() => router.push('/(tabs)/itineraries?sort=rating')}
                        >
                            <View style={styles.heroShortcutIconWrap}>
                                <Icon name="award" size={18} color={theme.colors.primary} strokeWidth={2} />
                            </View>
                            <Text style={styles.heroShortcutText} numberOfLines={2}>Melhor avaliados</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.heroShortcutCard}
                            onPress={() => router.push('/(tabs)/itineraries?sort=newest')}
                        >
                            <View style={styles.heroShortcutIconWrap}>
                                <Icon name="gem" size={18} color={theme.colors.primary} strokeWidth={2} />
                            </View>
                            <Text style={styles.heroShortcutText} numberOfLines={2}>Novidades</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        </View>
    );
};


// ─── MAIN HOME SCREEN ───────────────────────────────────────
export default function HomeScreen() {
    const router = useRouter();
    const { applyFilters, filters, filteredPackages, hasActiveFilters, allPackages, allItineraries } = useSearch();

    // Derive popular destinations dynamically from itineraries
    const popularDestinations = useMemo(() => {
        const grouped: Record<string, { images: string[]; count: number; featured: number; rating: number }> = {};
        allItineraries.forEach(it => {
            const dest = it.destination;
            if (!dest) return;
            if (!grouped[dest]) grouped[dest] = { images: [], count: 0, featured: 0, rating: 0 };
            grouped[dest].count += 1;
            grouped[dest].rating = Math.max(grouped[dest].rating, it.rating ?? 0);
            if (it.featured) grouped[dest].featured += 1;
            // Collect all unique images from this itinerary
            (it.images ?? []).filter(Boolean).forEach(img => {
                if (!grouped[dest].images.includes(img)) grouped[dest].images.push(img);
            });
        });
        return Object.entries(grouped)
            .sort((a, b) => b[1].featured - a[1].featured || b[1].count - a[1].count || b[1].rating - a[1].rating)
            .slice(0, 6)
            .map(([name, data]) => ({
                id: name.toLowerCase().replace(/\s+/g, '-'),
                name,
                images: data.images.slice(0, 5), // max 5 per dest
                count: data.count,
            }));
    }, [allItineraries]);
    const [searchModalVisible, setSearchModalVisible] = useState(false);
    const [decisionAssistantVisible, setDecisionAssistantVisible] = useState(false);

    // Filter logic
    // Favorites Logic (itineraries)
    const [favorites, setFavorites] = useState<string[]>([]);
    const { showAnimation } = useFavoriteAnimation();

    useEffect(() => {
        analytics.homeViewed();
    }, []);

    const toggleFavorite = (packageId: string, event?: any) => {
        const isAdding = !favorites.includes(packageId);
        setFavorites(prev => prev.includes(packageId) ? prev.filter(id => id !== packageId) : [...prev, packageId]);
        if (isAdding && event) {
            const { pageX, pageY } = event.nativeEvent;
            showAnimation(pageX, pageY);
        }
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
                <HeroHeader onSearchPress={() => setSearchModalVisible(true)} router={router} />

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
                        <TouchableOpacity onPress={() => router.push('/(tabs)/itineraries')}>
                            <Text style={styles.seeAllText}>Ver todos</Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.sectionSubtitle}>Os mais bem avaliados pela comunidade VAMO.</Text>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 16 }}>
                        {allItineraries.filter(i => i.featured).slice(0, 5).map((itinerary) => (
                            <ItineraryCard
                                key={itinerary.id}
                                width={280}
                                itinerary={itinerary}
                                onPress={() => router.push(`/itinerary/${itinerary.id}`)}
                            />
                        ))}
                    </ScrollView>
                </View>

                {/* 5. Novos Roteiros */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Novos Roteiros</Text>
                        <TouchableOpacity onPress={() => router.push('/(tabs)/itineraries')}>
                            <Text style={styles.seeAllText}>Explorar</Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.sectionSubtitle}>Planejamentos recém-publicados por especialistas.</Text>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 16 }}>
                        {allItineraries.slice(0, 5).map((itinerary) => (
                            <ItineraryCard
                                key={itinerary.id}
                                width={280}
                                itinerary={itinerary}
                                onPress={() => router.push(`/itinerary/${itinerary.id}`)}
                            />
                        ))}
                    </ScrollView>
                </View>

                {/* 6a. Continue sua busca */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Continue sua busca</Text>
                        <TouchableOpacity onPress={() => router.push('/(tabs)/itineraries')}>
                            <Text style={styles.seeAllText}>Ver todos</Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.sectionSubtitle}>Roteiros que podem te interessar.</Text>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}>
                        {allItineraries.slice(2, 7).map((itinerary) => (
                            <TouchableOpacity
                                key={itinerary.id}
                                style={{
                                    width: 200,
                                    backgroundColor: '#FFFFFF',
                                    borderRadius: 12,
                                    overflow: 'hidden',
                                    ...theme.shadows.small,
                                    borderWidth: 1,
                                    borderColor: theme.colors.borderLight,
                                }}
                                activeOpacity={0.85}
                                onPress={() => router.push(`/itinerary/${itinerary.id}`)}
                            >
                                <Image
                                    source={{ uri: itinerary.images?.[0] }}
                                    style={{ width: '100%', height: 160 }}
                                    resizeMode="cover"
                                />
                                <View style={{ padding: 10 }}>
                                    <Text
                                        style={{ fontSize: 13, fontWeight: '700', color: theme.colors.text.primary, marginBottom: 6 }}
                                        numberOfLines={1}
                                    >
                                        {itinerary.title}
                                    </Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                        <Icon name="location" size={12} color={theme.colors.text.tertiary} />
                                        <Text style={{ fontSize: 11, color: theme.colors.text.tertiary }} numberOfLines={1}>
                                            {itinerary.destination}
                                        </Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* 6b. Experiencias inesqueciveis */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Experiências inesquecíveis</Text>
                        <TouchableOpacity onPress={() => router.push('/(tabs)/itineraries')}>
                            <Text style={styles.seeAllText}>Ver todos</Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.sectionSubtitle}>Vivências que você nunca vai esquecer.</Text>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}>
                        {allItineraries.filter(i => i.featured).slice(0, 4).map((itinerary) => (
                            <TouchableOpacity
                                key={itinerary.id}
                                style={{
                                    width: 260,
                                    backgroundColor: '#FFFFFF',
                                    borderRadius: 16,
                                    overflow: 'hidden',
                                    ...theme.shadows.small,
                                    borderWidth: 1,
                                    borderColor: theme.colors.borderLight,
                                }}
                                activeOpacity={0.85}
                                onPress={() => router.push(`/itinerary/${itinerary.id}`)}
                            >
                                <View style={{ position: 'relative' }}>
                                    <Image
                                        source={{ uri: itinerary.images?.[0] }}
                                        style={{ width: '100%', height: 160 }}
                                        resizeMode="cover"
                                    />
                                    <View style={{
                                        position: 'absolute',
                                        top: 10,
                                        left: 10,
                                        backgroundColor: '#0D9488',
                                        borderRadius: 6,
                                        paddingHorizontal: 8,
                                        paddingVertical: 3,
                                    }}>
                                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#FFFFFF' }}>
                                            {itinerary.category || 'Destaque'}
                                        </Text>
                                    </View>
                                </View>
                                <View style={{ padding: 12 }}>
                                    <Text
                                        style={{ fontSize: 14, fontWeight: '700', color: theme.colors.text.primary, marginBottom: 8 }}
                                        numberOfLines={2}
                                    >
                                        {itinerary.title}
                                    </Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                            <Icon name="star" size={13} color="#F59E0B" strokeWidth={0} />
                                            <Text style={{ fontSize: 12, fontWeight: '600', color: theme.colors.text.primary }}>
                                                {itinerary.rating?.toFixed(1) ?? '4.8'}
                                            </Text>
                                        </View>
                                        <Text style={{ fontSize: 14, fontWeight: '800', color: theme.colors.text.primary }}>
                                            {itinerary.price != null ? `R$ ${itinerary.price}` : 'Gratis'}
                                        </Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* 7. Popular Destinations (Grid) */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { paddingLeft: 0 }]}>Destinos em Alta</Text>
                        <TouchableOpacity onPress={() => router.push('/(tabs)/itineraries')}>
                            <Text style={styles.seeAllText}>Ver todos</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.destinationsGrid}>
                        {popularDestinations.map((dest) => (
                            <TouchableOpacity
                                key={dest.id}
                                style={styles.destinationCard}
                                onPress={() => router.push(`/(tabs)/itineraries`)}
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
                    setSearchModalVisible(false);
                    router.push('/(tabs)/itineraries');
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
