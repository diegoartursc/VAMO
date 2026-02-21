import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { theme } from '../../src/theme/theme';
import { useSearch } from '../../src/hooks/useSearch';
import { analytics } from '../../src/services/analytics';
import { useFavoriteAnimation } from '../../src/components/providers/FavoriteAnimationProvider';

// Components
import { Icon } from '../../src/components/common/Icons';
import { CoverCarousel } from '../../src/components/common/CoverCarousel';
import { SearchModal } from '../../src/components/search/SearchModal';
import DecisionAssistant from '../../src/components/home/DecisionAssistant';
import { CTACarousel } from '../../src/components/home/CTACarousel';
import WhyDifferent from '../../src/components/common/WhyDifferent';
import { PackageBadge } from '../../src/components/badges/PackageBadge';
import { VerifiedBadge } from '../../src/components/creator/VerifiedBadge';

// Data
import { ITINERARY_INCLUSIONS } from '../../src/data/itineraryInclusions';

const { width } = Dimensions.get('window');

// ─── VAMO 2.0 HEADER COMPONENT ──────────────────────────────
const InstitutionalHeader = ({ onSearchPress }: { onSearchPress: () => void }) => {
    return (
        <View style={styles.headerContainer}>
            {/* Background with Institutional Deep Navy */}
            <LinearGradient
                colors={theme.colors.gradients.institutional}
                style={styles.headerBackground}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                {/* Orbital Lines / Abstract Decoration */}
                <View style={styles.orbitalLine1} />
                <View style={styles.orbitalLine2} />
            </LinearGradient>

            <SafeAreaView>
                <View style={styles.headerContent}>
                    {/* Top Row: Brand & Notifications */}
                    <View style={styles.headerTopRow}>
                        <View>
                            <Text style={styles.brandText}>VAMO</Text>
                            <Text style={styles.brandSubText}>Authority Travel</Text>
                        </View>
                        <TouchableOpacity style={styles.iconButton}>
                            <Icon name="brand-telegram" size={24} color="#FFF" />
                            {/* Fallback to bell if brand-telegram not found, using generic bell logic manually or just Icon */}
                            <Icon name="bell" size={24} color="rgba(255,255,255,0.8)" />
                        </TouchableOpacity>
                    </View>

                    {/* Hero Title */}
                    <View style={styles.heroTextContainer}>
                        <Text style={styles.heroTitle}>
                            Explore novas{'\n'}fronteiras.
                        </Text>
                        <Text style={styles.heroSubtitle}>
                            Roteiros exclusivos e agências verificadas.
                        </Text>
                    </View>

                    {/* Search Bar - Floating */}
                    <TouchableOpacity
                        style={styles.searchBar}
                        activeOpacity={0.9}
                        onPress={onSearchPress}
                    >
                        <Icon name="search" size={20} color={theme.colors.text.secondary} />
                        <Text style={styles.searchPlaceholder}>Para onde você quer ir?</Text>
                        <View style={styles.filterButton}>
                            <Icon name="filter" size={16} color={theme.colors.primary} />
                        </View>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </View>
    );
};


// ─── MAIN HOME SCREEN ───────────────────────────────────────
export default function HomeScreen() {
    const router = useRouter();
    const { applyFilters, filters, filteredPackages, hasActiveFilters, allPackages, allItineraries } = useSearch();
    const [searchModalVisible, setSearchModalVisible] = useState(false);
    const [decisionAssistantVisible, setDecisionAssistantVisible] = useState(false);

    // Filter logic
    const displayedPackages = hasActiveFilters ? filteredPackages : allPackages.filter(p => p.featured);

    // Favorites Logic
    const [favorites, setFavorites] = useState<string[]>([]);
    const { showAnimation } = useFavoriteAnimation();
    const [lastSearchedDestination, setLastSearchedDestination] = useState<string | null>('Paris');

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
                <InstitutionalHeader onSearchPress={() => setSearchModalVisible(true)} />

                {/* 2. Trust Indicators (Below Header) */}
                <View style={styles.trustBar}>
                    <View style={styles.trustItem}>
                        <Icon name="verified" size={14} color={theme.colors.text.secondary} />
                        <Text style={styles.trustText}>Agências Verificadas</Text>
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
                        <Text style={styles.quizSubtitle}>Descubra o destino ideal em 3 passos</Text>
                    </View>
                    <Icon name="chevron-right" size={20} color={theme.colors.text.tertiary} />
                </TouchableOpacity>

                {/* 4. Featured Packages */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Pacotes em Destaque</Text>
                        <TouchableOpacity onPress={() => router.push('/(tabs)/packages')}>
                            <Text style={styles.seeAllText}>Ver todos</Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.sectionSubtitle}>Experiências completas com curadoria VAMO.</Text>

                    {displayedPackages.slice(0, 5).map((pkg, index) => (
                        <PremiumPackageCard
                            key={pkg.id}
                            pkg={pkg}
                            onPress={() => router.push(`/package/${pkg.id}`)}
                            isFavorite={favorites.includes(pkg.id)}
                            onToggleFavorite={(e: any) => toggleFavorite(pkg.id, e)}
                        />
                    ))}
                </View>

                {/* 5. Creator Itineraries */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Roteiros de Especialistas</Text>
                        <TouchableOpacity onPress={() => router.push('/(tabs)/itineraries')}>
                            <Text style={styles.seeAllText}>Explorar</Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.sectionSubtitle}>Planejamento detalhado por quem entende.</Text>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 16 }}>
                        {allItineraries.slice(0, 5).map((itinerary) => (
                            <ItineraryCard
                                key={itinerary.id}
                                itinerary={itinerary}
                                onPress={() => router.push(`/itinerary/${itinerary.id}`)}
                            />
                        ))}
                    </ScrollView>
                </View>

                {/* 6. Popular Destinations (Grid) */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Destinos em Alta</Text>
                    <View style={styles.destinationsGrid}>
                        {POPULAR_DESTINATIONS.map((dest) => (
                            <TouchableOpacity
                                key={dest.id}
                                style={styles.destinationCard}
                                onPress={() => router.push(`/(tabs)/packages?destination=${dest.name}`)}
                            >
                                <Image source={{ uri: dest.image }} style={styles.destinationImage} />
                                <View style={styles.destinationOverlay} />
                                <Text style={styles.destinationName}>{dest.name}</Text>
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
                    router.push('/(tabs)/packages');
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


// ─── PREMIUM CARD COMPONENT ─────────────────────────────────
function PremiumPackageCard({ pkg, onPress, isFavorite, onToggleFavorite }: any) {
    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
            <View style={styles.cardImageContainer}>
                <CoverCarousel images={pkg.images || [pkg.image]} height={200} />

                {/* Badges Overlay */}
                <View style={styles.cardBadges}>
                    {pkg.agency?.verified && (
                        <View style={styles.verifiedBadge}>
                            <Icon name="verified" size={12} color="#FFF" />
                            <Text style={styles.verifiedText}>Agência Verificada</Text>
                        </View>
                    )}
                </View>

                {/* Favorite Button */}
                <TouchableOpacity style={styles.favoriteButton} onPress={(e) => { e.stopPropagation(); onToggleFavorite(e); }}>
                    <Icon name="heart" size={20} color={isFavorite ? theme.colors.error : theme.colors.secondary} style={isFavorite ? {} : { opacity: 0.6 }} />
                </TouchableOpacity>
            </View>

            <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{pkg.title}</Text>
                    <View style={styles.ratingContainer}>
                        <Icon name="star" size={14} color={theme.colors.warning} />
                        <Text style={styles.ratingText}>{pkg.rating}</Text>
                        <Text style={styles.reviewCount}>({pkg.reviewCount})</Text>
                    </View>
                </View>

                <View style={styles.locationRow}>
                    <Icon name="map-pin" size={14} color={theme.colors.text.tertiary} />
                    <Text style={styles.locationText}>{pkg.destination}, {pkg.country}</Text>
                    <Text style={styles.dotSeparator}>•</Text>
                    <Text style={styles.durationText}>{pkg.duration} dias</Text>
                </View>

                {/* Features (No Emojis) */}
                <View style={styles.featuresRow}>
                    {pkg.inclusions?.flight && (
                        <View style={styles.featureItem}>
                            <Icon name="plane" size={14} color={theme.colors.text.secondary} />
                            <Text style={styles.featureText}>Aéreo</Text>
                        </View>
                    )}
                    {pkg.inclusions?.hotel && (
                        <View style={styles.featureItem}>
                            <Icon name="hotel" size={14} color={theme.colors.text.secondary} />
                            <Text style={styles.featureText}>Hotel</Text>
                        </View>
                    )}
                    {pkg.inclusions?.hotel?.meals && (
                        <View style={styles.featureItem}>
                            <Icon name="coffee" size={14} color={theme.colors.text.secondary} />
                            <Text style={styles.featureText}>Café</Text>
                        </View>
                    )}
                </View>

                <View style={styles.cardFooter}>
                    <View>
                        <Text style={styles.priceLabel}>A partir de</Text>
                        <Text style={styles.priceValue}>R$ {pkg.price.min.toLocaleString('pt-BR')}</Text>
                    </View>

                    <TouchableOpacity style={styles.bookButton} onPress={onPress}>
                        <Text style={styles.bookButtonText}>Ver detalhes</Text>
                        <Icon name="chevron-right" size={16} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );
}

// ─── ITINERARY CARD (Horizontal) ────────────────────────────
function ItineraryCard({ itinerary, onPress }: any) {
    return (
        <TouchableOpacity style={styles.itineraryCard} onPress={onPress} activeOpacity={0.9}>
            <Image source={{ uri: itinerary.images[0] }} style={styles.itineraryImage} />
            <View style={styles.itineraryContent}>
                <Text style={styles.itineraryTitle} numberOfLines={2}>{itinerary.title}</Text>
                <View style={styles.itineraryCreator}>
                    <Text style={styles.creatorName}>por {itinerary.creator.name}</Text>
                    {itinerary.creator.verificationLevel > 1 && <Icon name="verified" size={12} color={theme.colors.primary} />}
                </View>
                <Text style={styles.itineraryPrice}>R$ {itinerary.price.toLocaleString('pt-BR')}</Text>
            </View>
        </TouchableOpacity>
    )
}

const POPULAR_DESTINATIONS = [
    { id: 'paris', name: 'Paris', image: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=1600', count: 847 },
    { id: 'tokyo', name: 'Tokyo', image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1600', count: 623 },
    { id: 'nyc', name: 'Nova York', image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1600', count: 912 },
    { id: 'london', name: 'Londres', image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1600', count: 734 },
];

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
        ...theme.shadows.lg,
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
    heroTextContainer: {
        marginBottom: 32,
    },
    heroTitle: {
        fontSize: 32,
        fontWeight: theme.typography.weights.bold,
        color: '#FFFFFF',
        lineHeight: 38,
        marginBottom: 8,
    },
    heroSubtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.8)',
        lineHeight: 24,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 56,
        ...theme.shadows.medium,
    },
    searchPlaceholder: {
        flex: 1,
        marginLeft: 12,
        fontSize: 15,
        color: theme.colors.text.secondary,
    },
    filterButton: {
        width: 32, height: 32,
        borderRadius: 8,
        backgroundColor: theme.colors.primary + '15', // Light Teal
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
        ...theme.shadows.sm,
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
        ...theme.shadows.sm,
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
        height: 120,
        borderRadius: 12,
        overflow: 'hidden',
    },
    destinationImage: {
        width: '100%',
        height: '100%',
    },
    destinationOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    destinationName: {
        position: 'absolute',
        bottom: 12, left: 12,
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    }
});
