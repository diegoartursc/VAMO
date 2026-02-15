import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Dimensions,
    NativeScrollEvent,
    NativeSyntheticEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Added
import { Package } from '../../src/types';
import { PackageBadge } from '../../src/components/badges/PackageBadge';
import { theme } from '../../src/theme/theme';
import { HeroSection } from '../../src/components/home/HeroSection';
import { IconicSearchBar } from '../../src/components/search/IconicSearchBar';
import { SearchModal } from '../../src/components/search/SearchModal';
import { getPackagesByRelevance, mockPackages } from '../../src/data/mockPackages';
import { getFeaturedItineraries } from '../../src/data/mockItineraries';
import { ITINERARY_INCLUSIONS } from '../../src/data/itineraryInclusions'; // Added
import { VerifiedBadge } from '../../src/components/creator/VerifiedBadge';
import WhyDifferent from '../../src/components/common/WhyDifferent';
import { useRouter } from 'expo-router';
import { useSearch } from '../../src/hooks/useSearch';
import { CTACarousel } from '../../src/components/home/CTACarousel';
import { CoverCarousel } from '../../src/components/common/CoverCarousel';
import { useFavoriteAnimation } from '../../src/components/providers/FavoriteAnimationProvider';
import DecisionAssistant from '../../src/components/home/DecisionAssistant';
import { analytics } from '../../src/services/analytics';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
    const router = useRouter();
    const { applyFilters, filters, filteredPackages, hasActiveFilters } = useSearch();
    const [searchModalVisible, setSearchModalVisible] = useState(false);
    const [decisionAssistantVisible, setDecisionAssistantVisible] = useState(false);
    const packagesByRelevance = getPackagesByRelevance();

    // Usa pacotes filtrados se houver filtros ativos, senão usa por relevância
    const displayedPackages = hasActiveFilters ? filteredPackages : packagesByRelevance.filter(p => p.featured);

    const [favorites, setFavorites] = useState<string[]>([]); // Track favorite package IDs
    const { showAnimation } = useFavoriteAnimation();
    const [scrollDepthTracked, setScrollDepthTracked] = useState<Set<number>>(new Set());
    const [lastSearchedDestination, setLastSearchedDestination] = useState<string | null>('Paris'); // Mock: último destino pesquisado

    // Track home view on mount
    useEffect(() => {
        analytics.homeViewed();
    }, []);

    // Toggle favorite status
    const toggleFavorite = (packageId: string, event?: any) => {
        const isAdding = !favorites.includes(packageId);

        setFavorites(prev =>
            prev.includes(packageId)
                ? prev.filter(id => id !== packageId)
                : [...prev, packageId]
        );

        // Show animation only when adding to favorites
        if (isAdding && event) {
            const { pageX, pageY } = event.nativeEvent;
            showAnimation(pageX, pageY);
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                bounces={true}
            >
                {/* Hero Section */}
                <HeroSection
                    image="https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800"
                    title="Viajar é mais simples do que você pensa"
                    subtitle="Encontre sua próxima aventura com quem entende de viagem"
                />

                {/* 1. Barra de busca principal */}
                <IconicSearchBar
                    placeholder="Encontrar minha viagem"
                    onPress={() => {
                        analytics.homeSearchFocused();
                        setSearchModalVisible(true);
                    }}
                    overlapsHero={true}
                />

                {/* Elemento de confiança consolidado */}
                <View style={styles.trustBadge}>
                    <Text style={styles.trustBadgeText}>
                        Agências verificadas • Preço final • Compra segura
                    </Text>
                </View>

                {/* 2. Card "Não sabe por onde começar?" */}
                <TouchableOpacity
                    style={styles.decisionTrigger}
                    onPress={() => {
                        analytics.homeQuizCtaClicked();
                        setDecisionAssistantVisible(true);
                    }}
                    activeOpacity={0.8}
                >
                    <Text style={styles.decisionIcon}>🤔</Text>
                    <View style={styles.decisionTriggerContent}>
                        <Text style={styles.decisionTriggerTitle}>Não sabe por onde começar?</Text>
                        <Text style={styles.decisionTriggerSubtitle}>Responda 3 perguntas e descubra a opção ideal</Text>
                    </View>
                    <Text style={styles.decisionTriggerArrow}>→</Text>
                </TouchableOpacity>

                {/* 3. Pacotes em Destaque */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Pacotes em Destaque</Text>
                    <Text style={styles.sectionSubtitle}>
                        Viagens completas com as melhores avaliações
                    </Text>

                    {displayedPackages.slice(0, 6).map((pkg, index) => (
                        <HomePackageCard
                            key={pkg.id}
                            package={pkg}
                            onPress={() => {
                                analytics.homePackageCardClicked(pkg.id, index);
                                router.push(`/package/${pkg.id}`);
                            }}
                            isFavorite={favorites.includes(pkg.id)}
                            onToggleFavorite={(e: any) => toggleFavorite(pkg.id, e)}
                        />
                    ))}
                </View>

                {/* Roteiros em Destaque */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Roteiros em Destaque</Text>
                    <Text style={styles.sectionSubtitle}>
                        Roteiros testados e aprovados por viajantes reais
                    </Text>

                    {getFeaturedItineraries().slice(0, 4).map((itinerary) => (
                        <TouchableOpacity
                            key={itinerary.id}
                            style={styles.roteirosCard}
                            onPress={() => router.push(`/itinerary/${itinerary.id}`)}
                            activeOpacity={0.85}
                        >
                            <CoverCarousel images={itinerary.images} height={180} />

                            <View style={styles.roteirosContent}>
                                {/* Creator Info - Compact Row */}
                                <View style={styles.roteirosAuthorRow}>
                                    <Text style={styles.roteirosAuthorAvatar}>{itinerary.creator.avatar}</Text>
                                    <Text style={styles.roteirosAuthorName}>{itinerary.creator.name}</Text>
                                    <VerifiedBadge level={itinerary.creator.verificationLevel} size="small" showLabel={false} />
                                    <Text style={styles.roteirosAuthorStats}>
                                        ⭐ {itinerary.creator.rating} • {itinerary.creator.salesCount.toLocaleString('pt-BR')} vendas
                                    </Text>
                                </View>

                                <Text style={styles.roteirosTitle}>{itinerary.title}</Text>
                                <Text style={styles.roteirosDescription} numberOfLines={1}>
                                    {itinerary.description}
                                </Text>

                                {/* Category Chips */}
                                <View style={styles.roteirosChipsContainer}>
                                    {ITINERARY_INCLUSIONS.slice(0, 7).map((item) => (
                                        <View key={item.id} style={styles.roteirosChip}>
                                            <Ionicons name={item.icon as any} size={16} color={item.iconColor} />
                                            <Text style={styles.roteirosChipText}>{item.title}</Text>
                                        </View>
                                    ))}
                                </View>

                                {/* Footer */}
                                <View style={styles.roteirosFooter}>
                                    <View>
                                        <Text style={styles.roteirosPrice}>
                                            R$ {itinerary.price.toFixed(2).replace('.', ',')}
                                        </Text>
                                        <Text style={styles.roteirosPriceLabel}>Roteiro completo</Text>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.roteirosCTA}
                                        onPress={() => router.push(`/itinerary/${itinerary.id}`)}
                                    >
                                        <Text style={styles.roteirosCTAText}>Quero esse roteiro</Text>
                                        <Text style={styles.roteirosCTAArrow}>→</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))}

                    {/* Ver todos */}
                    <TouchableOpacity
                        style={styles.roteirosViewAll}
                        onPress={() => router.push('/(tabs)/itineraries')}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.roteirosViewAllText}>Ver todos os roteiros →</Text>
                    </TouchableOpacity>
                </View>

                {/* 4. Continue sua busca (baseado em pesquisa anterior) */}
                {lastSearchedDestination && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>
                            Continue sua busca em {lastSearchedDestination}
                        </Text>
                        <Text style={styles.sectionSubtitle}>
                            Retome de onde parou e descubra mais experiências
                        </Text>

                        {mockPackages
                            .filter(pkg =>
                                pkg.destination.toLowerCase().includes(lastSearchedDestination.toLowerCase()) ||
                                pkg.country.toLowerCase().includes(lastSearchedDestination.toLowerCase())
                            )
                            .slice(0, 4)
                            .map((pkg, index) => (
                                <HomePackageCard
                                    key={pkg.id}
                                    package={pkg}
                                    onPress={() => {
                                        analytics.homePackageCardClicked(pkg.id, index);
                                        router.push(`/package/${pkg.id}`);
                                    }}
                                    isFavorite={favorites.includes(pkg.id)}
                                    onToggleFavorite={(e: any) => toggleFavorite(pkg.id, e)}
                                />
                            ))
                        }
                    </View>
                )}


                {/* 6. Experiências Inesquecíveis */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Experiências de viagem inesquecíveis</Text>
                    <Text style={styles.sectionSubtitle}>
                        Momentos únicos que você vai guardar para sempre
                    </Text>

                    {mockPackages
                        .filter(p => !p.featured)
                        .slice(0, 4)
                        .map((pkg, index) => (
                            <HomePackageCard
                                key={pkg.id}
                                package={pkg}
                                onPress={() => {
                                    analytics.homePackageCardClicked(pkg.id, index);
                                    router.push(`/package/${pkg.id}`);
                                }}
                                isFavorite={favorites.includes(pkg.id)}
                                onToggleFavorite={(e: any) => toggleFavorite(pkg.id, e)}
                            />
                        ))
                    }
                </View>

                {/* Destinos Populares */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Destinos populares</Text>
                    <Text style={styles.sectionSubtitle}>
                        Os lugares mais procurados pelos nossos viajantes
                    </Text>

                    <View style={styles.destinationsGrid}>
                        {POPULAR_DESTINATIONS.map((dest) => (
                            <TouchableOpacity
                                key={dest.id}
                                style={styles.destinationCard}
                                onPress={() => router.push(`/(tabs)/packages?destination=${dest.name}`)}
                            >
                                <Image
                                    source={{ uri: dest.image }}
                                    style={styles.destinationImage}
                                    resizeMode="cover"
                                />
                                <Text style={styles.destinationName}>{dest.name}</Text>
                                <Text style={styles.destinationCount}>
                                    {dest.count} experiências
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Banner "Quer vender seus roteiros?" (CTA Carousel) */}
                <View style={styles.section}>
                    <CTACarousel />
                </View>

                {/* 8. Por que o VAMO é diferente? */}
                <WhyDifferent />

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Search Modal */}
            <SearchModal
                visible={searchModalVisible}
                onClose={() => setSearchModalVisible(false)}
                onSearch={(newFilters) => {
                    applyFilters(newFilters);
                    setSearchModalVisible(false);
                    // Navegar para a aba de pacotes com os filtros aplicados
                    router.push('/(tabs)/packages');
                }}
                context="home"
                initialFilters={filters}
            />

            {/* Decision Assistant Modal */}
            <DecisionAssistant
                visible={decisionAssistantVisible}
                onClose={() => setDecisionAssistantVisible(false)}
            />
        </View>
    );
}

// Full-width Package Card matching the packages tab layout
function HomePackageCard({
    package: pkg,
    onPress,
    isFavorite,
    onToggleFavorite
}: any) {
    return (
        <TouchableOpacity style={styles.homeCard} onPress={onPress} activeOpacity={0.85}>
            <CoverCarousel
                images={pkg.images || [pkg.image]}
                height={180}
            />

            {/* Badge */}
            {pkg.badge && (
                <View style={styles.homeCardBadgeContainer}>
                    <PackageBadge type={pkg.badge} />
                </View>
            )}

            {/* Featured badge (fallback) */}
            {pkg.featured && !pkg.badge && (
                <View style={styles.homeCardFeaturedBadge}>
                    <Text style={styles.homeCardFeaturedText}>⭐ Destaque</Text>
                </View>
            )}

            {/* Favorite Button */}
            <TouchableOpacity
                style={styles.homeCardFavoriteButton}
                onPress={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(e);
                }}
                activeOpacity={0.7}
            >
                <Text style={styles.homeCardFavoriteIcon}>
                    {isFavorite ? '❤️' : '♡'}
                </Text>
            </TouchableOpacity>

            <View style={styles.homeCardContent}>
                {/* Compact Agency + Reputation Row */}
                <View style={styles.homeCardCompactInfoRow}>
                    <Text style={styles.homeCardAgencyIcon}>{pkg.agency?.logo || '✈️'}</Text>
                    <Text style={styles.homeCardCompactText}>{pkg.agency?.name || 'Agência'}</Text>
                    {pkg.agency?.verified && (
                        <>
                            <Text style={styles.homeCardSeparator}>•</Text>
                            <Text style={styles.homeCardVerifiedIconCompact}>🛡️</Text>
                            <Text style={styles.homeCardCompactText}>Agência verificada</Text>
                        </>
                    )}
                    <Text style={styles.homeCardSeparator}>•</Text>
                    <Text style={styles.homeCardRatingIconCompact}>⭐</Text>
                    <Text style={styles.homeCardCompactText}>{pkg.rating}</Text>
                    <Text style={styles.homeCardCompactTextSecondary}>({pkg.reviewCount})</Text>
                </View>

                <Text style={styles.homeCardTitle} numberOfLines={2}>
                    {pkg.title}
                </Text>

                <Text style={styles.homeCardLocation}>
                    📍 {pkg.destination}{pkg.country ? `, ${pkg.country}` : ''} • {pkg.duration} dias
                </Text>

                {/* Strategic Inclusions */}
                <View style={styles.homeCardStrategicInclusions}>
                    {pkg.inclusions?.flight && (
                        <View style={styles.homeCardStrategicChip}>
                            <Text style={styles.homeCardChipIcon}>✈️</Text>
                            <Text style={styles.homeCardChipLabel}>Voo ida e volta</Text>
                        </View>
                    )}
                    {pkg.inclusions?.hotel && (
                        <View style={styles.homeCardStrategicChip}>
                            <Text style={styles.homeCardChipIcon}>🏨</Text>
                            <Text style={styles.homeCardChipLabel}>
                                Hotel {pkg.inclusions.hotel.stars}★
                            </Text>
                        </View>
                    )}
                    {pkg.inclusions?.hotel?.meals && pkg.inclusions.hotel.meals.length > 0 && (
                        <View style={styles.homeCardStrategicChip}>
                            <Text style={styles.homeCardChipIcon}>🍽️</Text>
                            <Text style={styles.homeCardChipLabel}>{pkg.inclusions.hotel.meals[0]}</Text>
                        </View>
                    )}
                    {pkg.inclusions?.tours && pkg.inclusions.tours.length > 0 && (
                        <View style={styles.homeCardStrategicChip}>
                            <Text style={styles.homeCardChipIcon}>🎭</Text>
                            <Text style={styles.homeCardChipLabel}>Passeios inclusos</Text>
                        </View>
                    )}
                    {pkg.inclusions?.extras && pkg.inclusions.extras.length > 0 && (
                        <View style={styles.homeCardStrategicChip}>
                            <Text style={styles.homeCardChipIcon}>✨</Text>
                            <Text style={styles.homeCardChipLabel}>Extras</Text>
                        </View>
                    )}
                </View>

                <View style={styles.homeCardFooter}>
                    <View style={styles.homeCardPriceSection}>
                        <Text style={styles.homeCardPriceLabel}>A partir de</Text>
                        <Text style={styles.homeCardPriceValue}>
                            R$ {pkg.price.min.toLocaleString('pt-BR')}
                        </Text>
                        <Text style={styles.homeCardPriceLabel}>por pessoa</Text>
                        <Text style={styles.homeCardReviewCountFooter}>
                            ({pkg.reviewCount} avaliações)
                        </Text>
                        {pkg.recentPurchases && (
                            <Text style={styles.homeCardUrgencyText}>
                                Reservado por {pkg.recentPurchases} pessoas este mês
                            </Text>
                        )}
                    </View>
                    <TouchableOpacity style={styles.homeCardCtaButton} onPress={onPress}>
                        <Text style={styles.homeCardCtaButtonText}>Ver pacote completo</Text>
                        <Text style={styles.homeCardCtaArrow}>→</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );
}

// Inline CTACarousel removed - using separate component from CTACarousel.tsx







const POPULAR_DESTINATIONS = [
    { id: 'paris', name: 'Paris', image: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=800', count: 847 },
    { id: 'tokyo', name: 'Tokyo', image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800', count: 623 },
    { id: 'nyc', name: 'Nova York', image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800', count: 912 },
    { id: 'london', name: 'Londres', image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800', count: 734 },
    { id: 'rome', name: 'Roma', image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800', count: 543 },
    { id: 'barcelona', name: 'Barcelona', image: 'https://images.unsplash.com/photo-1583422409516-2895a77efbed?w=800', count: 421 },
    { id: 'dubai', name: 'Dubai', image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800', count: 312 },
    { id: 'cancun', name: 'Cancún', image: 'https://images.unsplash.com/photo-1568402102990-bc541580b59f?w=800', count: 654 },
];


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    scrollView: {
        flex: 1,
    },


    // Trust Badge
    trustBadge: {
        paddingHorizontal: 20,
        paddingVertical: theme.spacing.sm,
        alignItems: 'center',
        marginBottom: 28,
    },
    trustBadgeText: {
        fontSize: 13,
        color: theme.colors.text.tertiary,
        textAlign: 'center',
        letterSpacing: 0.3,
    },


    // Sections
    section: {
        marginBottom: theme.spacing.section,
        paddingHorizontal: 20,
    },
    sectionTitle: {
        fontSize: theme.typography.sizes.title,
        fontWeight: theme.typography.weights.heavy,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.sm,
    },
    sectionSubtitle: {
        fontSize: theme.typography.sizes.caption,
        color: theme.colors.text.tertiary,
        marginBottom: theme.spacing.md,
        lineHeight: 20,
    },

    // Home Package Cards (full-width, matching packages tab)
    homeCard: {
        backgroundColor: theme.colors.background,
        borderRadius: theme.borderRadius.lg,
        marginBottom: theme.spacing.cardGap || 16,
        ...theme.shadows.small,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    homeCardImage: {
        width: '100%',
        height: 140,
        backgroundColor: theme.colors.surface || theme.colors.surfaceLight,
    },
    homeCardBadgeContainer: {
        position: 'absolute',
        top: theme.spacing.md,
        right: theme.spacing.md,
        zIndex: 1,
    },
    homeCardFeaturedBadge: {
        position: 'absolute',
        top: theme.spacing.md,
        right: theme.spacing.md,
        backgroundColor: theme.colors.secondary,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.borderRadius.full,
    },
    homeCardFeaturedText: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    homeCardFavoriteButton: {
        position: 'absolute',
        top: theme.spacing.sm,
        left: theme.spacing.sm,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        alignItems: 'center',
        justifyContent: 'center',
        ...theme.shadows.medium,
        zIndex: 2,
    },
    homeCardFavoriteIcon: {
        fontSize: 20,
    },
    homeCardContent: {
        padding: 10,
    },
    // Compact Info Row Styles
    homeCardCompactInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 8,
    },
    homeCardSeparator: {
        fontSize: 12,
        color: theme.colors.text.secondary,
        marginHorizontal: 2,
    },
    homeCardCompactText: {
        fontSize: 13,
        fontWeight: '500',
        color: theme.colors.text.primary,
    },
    homeCardCompactTextSecondary: {
        fontSize: 13,
        fontWeight: '400',
        color: theme.colors.text.secondary,
    },
    homeCardVerifiedIconCompact: {
        fontSize: 12,
    },
    homeCardRatingIconCompact: {
        fontSize: 13,
    },
    homeCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    homeCardAgencyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flex: 1,
    },
    homeCardAgencyTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface || theme.colors.surfaceLight,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 4,
        borderRadius: theme.borderRadius.sm,
        gap: 4,
    },
    homeCardAgencyIcon: {
        fontSize: 14,
    },
    homeCardAgencyText: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    homeCardVerifiedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        paddingHorizontal: 6,
        paddingVertical: 2,
        backgroundColor: theme.colors.surfaceLight,
        borderRadius: theme.borderRadius.sm,
    },
    homeCardVerifiedIcon: {
        fontSize: 9,
    },
    homeCardVerifiedText: {
        fontSize: 9,
        fontWeight: '500',
        color: theme.colors.text.secondary,
    },
    homeCardRatingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    homeCardRatingIcon: {
        fontSize: 14,
    },
    homeCardRatingValue: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    homeCardRatingCount: {
        fontSize: 12,
        fontWeight: '500',
        color: theme.colors.text.secondary,
    },
    homeCardTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: 6,
        lineHeight: 22,
    },
    homeCardLocation: {
        fontSize: 14,
        color: theme.colors.text.secondary,
        marginBottom: 8,
    },
    homeCardDestination: {
        fontSize: 14,
        color: theme.colors.text.secondary,
        marginBottom: 4,
    },
    homeCardDuration: {
        fontSize: 14,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.md,
    },
    // Strategic Inclusions Styles
    homeCardStrategicInclusions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 8,
    },
    homeCardStrategicChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surfaceLight,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: theme.borderRadius.sm,
        gap: 4,
    },
    homeCardChipIcon: {
        fontSize: 16,
    },
    homeCardChipLabel: {
        fontSize: 13,
        fontWeight: '500',
        color: theme.colors.text.primary,
    },
    homeCardInclusionsBadges: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: theme.spacing.md,
    },
    homeCardInclusionBadge: {
        backgroundColor: theme.colors.surfaceLight,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: theme.borderRadius.sm,
    },
    homeCardInclusionText: {
        fontSize: 11,
        color: theme.colors.text.secondary,
    },
    homeCardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginTop: 4,
    },
    homeCardPriceSection: {
        flex: 1,
    },
    homeCardPriceLabel: {
        fontSize: 11,
        color: theme.colors.text.secondary,
        marginBottom: 2,
    },
    homeCardPriceValue: {
        fontSize: 26,
        fontWeight: '700',
        color: theme.colors.primary,
        marginBottom: 2,
    },
    homeCardReviewCount: {
        fontSize: 12,
        color: theme.colors.text.secondary,
        marginTop: 2,
    },
    homeCardReviewCountFooter: {
        fontSize: 12,
        color: theme.colors.text.secondary,
        marginTop: 2,
    },
    homeCardUrgencyText: {
        fontSize: 12,
        color: theme.colors.text.secondary,
        marginTop: 4,
        opacity: 0.8,
    },
    homeCardSocialProof: {
        fontSize: 11,
        color: theme.colors.text.secondary,
        marginTop: 4,
        opacity: 0.8,
    },
    homeCardCtaButton: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 24,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        ...theme.shadows.button,
    },
    homeCardCtaButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.colors.text.inverse,
    },
    homeCardCtaArrow: {
        fontSize: 16,
        color: theme.colors.text.inverse,
    },
    homeCardViewButton: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: theme.borderRadius.full,
        ...theme.shadows.button,
    },
    homeCardViewButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text.inverse,
    },

    // Destinations Grid
    destinationsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    destinationCard: {
        width: (width - 52) / 2,
        backgroundColor: theme.colors.background,
        borderRadius: theme.borderRadius.lg,
        padding: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        ...theme.shadows.xs,
    },
    destinationImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginBottom: 12,
        backgroundColor: theme.colors.surfaceLight,
    },
    destinationName: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text.primary,
        marginBottom: 4,
    },
    destinationCount: {
        fontSize: 12,
        color: theme.colors.text.tertiary,
    },

    // Experiências (Horizontal cards)
    horizontalScroll: {
        paddingRight: 20,
        gap: 16,
    },
    experienceCard: {
        width: 300,
        backgroundColor: theme.colors.background,
        borderRadius: theme.borderRadius.lg,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        ...theme.shadows.small,
        marginLeft: 20,
    },
    experienceImage: {
        width: '100%',
        height: 180,
        backgroundColor: theme.colors.surfaceLight,
    },
    experienceBadge: {
        position: 'absolute',
        top: 12,
        left: 12,
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        zIndex: 1,
    },
    experienceBadgeSpecial: {
        backgroundColor: '#FF4D4F',
    },
    experienceBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#FFFFFF',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    experienceFavoriteButton: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        alignItems: 'center',
        justifyContent: 'center',
        ...theme.shadows.medium,
        zIndex: 2,
    },
    experienceInfo: {
        padding: 16,
    },
    experienceTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text.primary,
        marginBottom: 6,
        lineHeight: 22,
    },
    experienceDuration: {
        fontSize: 13,
        color: theme.colors.text.secondary,
        marginBottom: 12,
    },
    experienceFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    experienceRating: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 8,
    },
    experienceRatingText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    experienceReviewCount: {
        fontSize: 14,
        color: theme.colors.text.tertiary,
    },
    experiencePrice: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 4,
    },
    experiencePriceLabel: {
        fontSize: 11,
        color: theme.colors.text.tertiary,
    },
    experiencePriceValue: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.primary,
    },
    experiencePriceUnit: {
        fontSize: 11,
        color: theme.colors.text.tertiary,
    },

    // Roteiros em Destaque
    roteirosCard: {
        backgroundColor: theme.colors.background,
        borderRadius: theme.borderRadius.lg,
        overflow: 'hidden',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        ...theme.shadows.medium,
    },
    roteirosContent: {
        padding: 16,
    },
    roteirosAuthorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 12,
    },
    roteirosAuthorAvatar: {
        fontSize: 32,
    },
    roteirosAuthorInfo: {
        flex: 1,
    },
    roteirosAuthorNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    roteirosAuthorName: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    roteirosAuthorStats: {
        fontSize: 13,
        color: theme.colors.text.secondary,
        marginTop: 2,
    },
    roteirosTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: 6,
        lineHeight: 24,
    },
    roteirosDescription: {
        fontSize: 14,
        color: theme.colors.text.secondary,
        marginBottom: 12,
        lineHeight: 20,
    },
    // Category Chips Styles
    roteirosChipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 12,
    },
    roteirosChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surfaceLight,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: theme.borderRadius.sm,
        gap: 4,
    },
    roteirosChipText: {
        fontSize: 12,
        fontWeight: '500',
        color: theme.colors.text.primary,
    },
    roteirosInclusions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 12,
    },
    roteirosInclusion: {
        backgroundColor: theme.colors.surfaceLight,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: theme.borderRadius.sm,
    },
    roteirosInclusionText: {
        fontSize: 11,
        color: theme.colors.text.secondary,
    },
    roteirosFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginTop: 4,
    },
    roteirosPrice: {
        fontSize: 24,
        fontWeight: '700',
        color: theme.colors.primary,
        marginBottom: 2,
    },
    roteirosPriceLabel: {
        fontSize: 12,
        color: theme.colors.text.secondary,
    },
    roteirosCTA: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 24,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        ...theme.shadows.button,
    },
    roteirosCTAText: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.colors.text.inverse,
    },
    roteirosCTAArrow: {
        fontSize: 16,
        color: theme.colors.text.inverse,
    },
    roteirosViewAll: {
        alignItems: 'center',
        paddingVertical: 14,
        marginTop: 4,
        borderWidth: 1.5,
        borderColor: theme.colors.primary,
        borderRadius: theme.borderRadius.full,
    },
    roteirosViewAllText: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.colors.primary,
    },

    // CTA Carousel styles removed - using styles from CTACarousel.tsx
    // Decision Assistant Trigger
    decisionTrigger: {
        marginHorizontal: 20,
        marginBottom: theme.spacing.xl,
        padding: 20,
        backgroundColor: theme.colors.surfaceLight,
        borderRadius: theme.borderRadius.xl,
        borderWidth: 2,
        borderColor: theme.colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        ...theme.shadows.small,
    },
    decisionIcon: {
        fontSize: 32,
    },
    decisionTriggerContent: {
        flex: 1,
    },
    decisionTriggerTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.colors.text.primary,
        marginBottom: 2,
    },
    decisionTriggerSubtitle: {
        fontSize: 12,
        color: theme.colors.text.secondary,
    },
    decisionTriggerArrow: {
        fontSize: 20,
        color: theme.colors.primary,
        fontWeight: '600',
    },
});
