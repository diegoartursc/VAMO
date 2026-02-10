import React, { useState, useRef, useEffect } from 'react';
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
import { Package } from '../../src/types';
import { PackageBadge } from '../../src/components/badges/PackageBadge';
import { theme } from '../../src/theme/theme';
import { HeroSection } from '../../src/components/home/HeroSection';
import { IconicSearchBar } from '../../src/components/search/IconicSearchBar';
import { SearchModal } from '../../src/components/search/SearchModal';
import { getPackagesByRelevance, mockPackages } from '../../src/data/mockPackages';
import { getFeaturedItineraries } from '../../src/data/mockItineraries';
import { VerifiedBadge } from '../../src/components/creator/VerifiedBadge';
import WhyDifferent from '../../src/components/common/WhyDifferent';
import { useRouter } from 'expo-router';
import { useSearch } from '../../src/hooks/useSearch';
import { CTACarousel } from '../../src/components/home/CTACarousel';
import { useFavoriteAnimation } from '../../src/components/providers/FavoriteAnimationProvider';
import { CATEGORIES } from '../../src/constants/categories';
import DecisionAssistant from '../../src/components/home/DecisionAssistant';
import { analytics } from '../../src/services/analytics';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
    const router = useRouter();
    const { applyFilters, filters, filteredPackages, hasActiveFilters, travelIntent, setTravelIntent } = useSearch();
    const [searchModalVisible, setSearchModalVisible] = useState(false);
    const [decisionAssistantVisible, setDecisionAssistantVisible] = useState(false);
    const packagesByRelevance = getPackagesByRelevance();

    // Usa pacotes filtrados se houver filtros ativos, senão usa por relevância
    const displayedPackages = hasActiveFilters ? filteredPackages : packagesByRelevance.filter(p => p.featured);

    const [favorites, setFavorites] = useState<string[]>([]); // Track favorite package IDs
    const { showAnimation } = useFavoriteAnimation();
    const scrollViewRef = useRef<ScrollView>(null);
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

    // Auto-scroll for categories
    const scrollPosition = useRef(0);
    const isUserInteracting = useRef(false);
    const autoScrollInterval = useRef<NodeJS.Timeout | null>(null);

    // Start auto-scroll
    useEffect(() => {
        const startAutoScroll = () => {
            autoScrollInterval.current = setInterval(() => {
                if (!isUserInteracting.current && scrollViewRef.current) {
                    scrollPosition.current += 1; // Scroll 1 pixel per interval

                    // Reset to start for infinite loop
                    const maxScroll = (CATEGORIES.length * 150); // Approximate width per pill
                    if (scrollPosition.current >= maxScroll) {
                        scrollPosition.current = 0;
                    }

                    scrollViewRef.current.scrollTo({
                        x: scrollPosition.current,
                        animated: true,
                    });
                }
            }, 30); // Update every 30ms for smooth animation
        };

        startAutoScroll();

        return () => {
            if (autoScrollInterval.current) {
                clearInterval(autoScrollInterval.current);
            }
        };
    }, []);

    const handleTouchStart = () => {
        isUserInteracting.current = true;
    };

    const handleTouchEnd = () => {
        // Resume auto-scroll after 2 seconds of inactivity
        setTimeout(() => {
            isUserInteracting.current = false;
        }, 2000);
    };

    // Handle intent selection with toggle
    const handleIntentSelect = (intentId: string) => {
        // Toggle: if already selected, deselect it
        const newSelection = travelIntent === intentId ? null : intentId;
        setTravelIntent(newSelection);

        // Track analytics if selecting (not deselecting)
        if (newSelection) {
            analytics.homeTravelStyleSelected(intentId);
        }
    };

    // Feedback messages for each intent
    const intentFeedback: Record<string, string> = {
        'luxo': 'Mostrando viagens com foco em conforto e exclusividade',
        'custo-beneficio': 'Mostrando viagens com melhor custo-benefício',
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

                {/* Category Pills with Auto-Scroll */}
                <View style={styles.categoriesSection}>
                    <ScrollView
                        ref={scrollViewRef}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.categoriesScroll}
                        onTouchStart={handleTouchStart}
                        onTouchEnd={handleTouchEnd}
                        onScrollBeginDrag={handleTouchStart}
                        onScrollEndDrag={handleTouchEnd}
                    >
                        {[...CATEGORIES, ...CATEGORIES].map((cat, index) => (
                            <TouchableOpacity
                                key={`${cat.id}-${index}`}
                                style={styles.categoryPill}
                                onPress={() => router.push(`/(tabs)/packages?category=${cat.id}`)}
                            >
                                <Text style={styles.categoryIcon}>{cat.icon}</Text>
                                <Text style={styles.categoryLabel}>{cat.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
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

                {/* Como você quer viajar? - Toggle cards */}
                <View style={styles.intentSection}>
                    <Text style={styles.intentTitle}>Como você quer viajar?</Text>
                    <Text style={styles.intentSubtitle}>
                        Escolha o que combina com você
                    </Text>

                    <View style={styles.intentToggleRow}>
                        {INTENT_CATEGORIES.map((intent) => {
                            const isSelected = travelIntent === intent.id;
                            return (
                                <TouchableOpacity
                                    key={intent.id}
                                    style={[
                                        styles.intentToggleCard,
                                        isSelected
                                            ? styles.intentToggleCardActive
                                            : styles.intentToggleCardInactive
                                    ]}
                                    onPress={() => handleIntentSelect(intent.id)}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.intentToggleEmoji}>{intent.emoji}</Text>
                                    <Text style={[
                                        styles.intentToggleLabel,
                                        isSelected
                                            ? styles.intentToggleLabelActive
                                            : styles.intentToggleLabelInactive
                                    ]}>
                                        {intent.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Feedback textual */}
                    {travelIntent && (
                        <View style={styles.intentFeedback}>
                            <Text style={styles.intentFeedbackText}>
                                {intentFeedback[travelIntent]}
                            </Text>
                            <Text style={styles.intentFilterNotice}>
                                📌 Este filtro se aplica em todas as abas
                            </Text>
                        </View>
                    )}
                </View>

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
                            <RoteirosCarousel images={itinerary.images} />

                            <View style={styles.roteirosContent}>
                                {/* Creator Info */}
                                <View style={styles.roteirosAuthorRow}>
                                    <Text style={styles.roteirosAuthorAvatar}>{itinerary.creator.avatar}</Text>
                                    <View style={styles.roteirosAuthorInfo}>
                                        <View style={styles.roteirosAuthorNameRow}>
                                            <Text style={styles.roteirosAuthorName}>{itinerary.creator.name}</Text>
                                            <VerifiedBadge level={itinerary.creator.verificationLevel} size="small" showLabel={false} />
                                        </View>
                                        <Text style={styles.roteirosAuthorStats}>
                                            ⭐ {itinerary.creator.rating} • {itinerary.creator.salesCount.toLocaleString('pt-BR')} vendas
                                        </Text>
                                    </View>
                                </View>

                                <Text style={styles.roteirosTitle}>{itinerary.title}</Text>
                                <Text style={styles.roteirosDescription} numberOfLines={2}>
                                    {itinerary.description}
                                </Text>

                                {/* Inclusions */}
                                <View style={styles.roteirosInclusions}>
                                    {itinerary.inclusions.map((inclusion, idx) => (
                                        <View key={idx} style={styles.roteirosInclusion}>
                                            <Text style={styles.roteirosInclusionText}>
                                                {inclusion === 'Planilha' ? '📋' : inclusion === 'Mapa' ? '🗺️' : inclusion === 'Suporte' ? '💬' : '📱'} {inclusion}
                                            </Text>
                                        </View>
                                    ))}
                                </View>

                                {/* Footer */}
                                <View style={styles.roteirosFooter}>
                                    <View>
                                        <Text style={styles.roteirosPriceLabel}>Roteiro completo</Text>
                                        <Text style={styles.roteirosPrice}>
                                            R$ {itinerary.price.toFixed(2).replace('.', ',')}
                                        </Text>
                                    </View>
                                    <View style={styles.roteirosCTA}>
                                        <Text style={styles.roteirosCTAText}>Saiba mais</Text>
                                    </View>
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

                    {UNFORGETTABLE_EXPERIENCES.map((exp, index) => (
                        <HomePackageCard
                            key={exp.id}
                            package={{
                                ...exp,
                                price: { min: exp.price, max: exp.price },
                                images: [exp.image],
                                agency: { name: 'VAMO Experiences', logo: '🌍', verified: false },
                                destination: exp.title.split(':')[0],
                                country: exp.title.split(':')[0],
                            }}
                            onPress={() => {
                                analytics.homePackageCardClicked(exp.id, index);
                                router.push(`/package/${exp.id}`);
                            }}
                            isFavorite={favorites.includes(exp.id)}
                            onToggleFavorite={(e: any) => toggleFavorite(exp.id, e)}
                        />
                    ))}
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
            <Image
                source={{ uri: pkg.images?.[0] || pkg.image }}
                style={styles.homeCardImage}
                resizeMode="cover"
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
                <View style={styles.homeCardHeader}>
                    <View style={styles.homeCardAgencyRow}>
                        <View style={styles.homeCardAgencyTag}>
                            <Text style={styles.homeCardAgencyIcon}>{pkg.agency?.logo || '✈️'}</Text>
                            <Text style={styles.homeCardAgencyText}>{pkg.agency?.name || 'Agência'}</Text>
                        </View>
                        {pkg.agency?.verified && (
                            <View style={styles.homeCardVerifiedBadge}>
                                <Text style={styles.homeCardVerifiedIcon}>🛡️</Text>
                                <Text style={styles.homeCardVerifiedText}>Agência verificada</Text>
                            </View>
                        )}
                    </View>
                    <View style={styles.homeCardRatingBadge}>
                        <Text style={styles.homeCardRatingIcon}>⭐</Text>
                        <Text style={styles.homeCardRatingValue}>{pkg.rating}</Text>
                        <Text style={styles.homeCardRatingCount}>({pkg.reviewCount})</Text>
                    </View>
                </View>

                <Text style={styles.homeCardTitle} numberOfLines={2}>
                    {pkg.title}
                </Text>

                {pkg.destination && (
                    <Text style={styles.homeCardDestination}>
                        📍 {pkg.destination}{pkg.country ? `, ${pkg.country}` : ''}
                    </Text>
                )}

                {pkg.duration && (
                    <Text style={styles.homeCardDuration}>📅 {pkg.duration} dias</Text>
                )}

                {/* Inclusions badges */}
                <View style={styles.homeCardInclusionsBadges}>
                    {pkg.duration && (
                        <View style={styles.homeCardInclusionBadge}>
                            <Text style={styles.homeCardInclusionText}>⏱️ {pkg.duration} Dias</Text>
                        </View>
                    )}
                    <View style={styles.homeCardInclusionBadge}>
                        <Text style={styles.homeCardInclusionText}>📶 Wi-Fi</Text>
                    </View>
                    <View style={styles.homeCardInclusionBadge}>
                        <Text style={styles.homeCardInclusionText}>👥 Guia</Text>
                    </View>
                    {pkg.inclusions?.hotel && (
                        <View style={styles.homeCardInclusionBadge}>
                            <Text style={styles.homeCardInclusionText}>
                                🏨 Hotel {pkg.inclusions.hotel.stars}★
                            </Text>
                        </View>
                    )}
                </View>

                <View style={styles.homeCardFooter}>
                    <View>
                        <Text style={styles.homeCardPriceLabel}>A partir de</Text>
                        <Text style={styles.homeCardPriceValue}>
                            R$ {pkg.price?.min?.toLocaleString('pt-BR') || pkg.price}
                        </Text>
                        <Text style={styles.homeCardReviewCount}>
                            ({pkg.reviewCount} avaliações)
                        </Text>
                        {pkg.recentPurchases && pkg.recentPurchases > 0 && (
                            <Text style={styles.homeCardSocialProof}>
                                Reservado por {pkg.recentPurchases} pessoas este mês
                            </Text>
                        )}
                    </View>
                    <TouchableOpacity style={styles.homeCardViewButton} onPress={onPress}>
                        <Text style={styles.homeCardViewButtonText}>Ver detalhes</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );
}

// Inline CTACarousel removed - using separate component from CTACarousel.tsx

// Carousel component for Roteiros cards
function RoteirosCarousel({ images }: { images: string[] }) {
    const [activeIndex, setActiveIndex] = useState(0);
    const cardWidth = width - 40; // section paddingHorizontal: 20 * 2

    const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetX = e.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / cardWidth);
        setActiveIndex(index);
    };

    return (
        <View style={styles.roteirosCarouselContainer}>
            <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={handleScroll}
                style={{ width: cardWidth }}
                decelerationRate="fast"
                nestedScrollEnabled
            >
                {images.map((uri, idx) => (
                    <Image
                        key={idx}
                        source={{ uri }}
                        style={[styles.roteirosImage, { width: cardWidth }]}
                        resizeMode="cover"
                    />
                ))}
            </ScrollView>

            {/* Photo counter badge */}
            <View style={styles.roteirosPhotoCount}>
                <Text style={styles.roteirosPhotoCountText}>
                    📷 {activeIndex + 1}/{images.length}
                </Text>
            </View>

            {/* Pagination dots */}
            {images.length > 1 && (
                <View style={styles.roteirosDots}>
                    {images.map((_, idx) => (
                        <View
                            key={idx}
                            style={[
                                styles.roteirosDot,
                                idx === activeIndex && styles.roteirosDotActive,
                            ]}
                        />
                    ))}
                </View>
            )}
        </View>
    );
}

// Categorias de Intenção em Destaque (ajustado em 30/01/2026)
// Apenas as principais intenções: Luxo e Custo-benefício
const INTENT_CATEGORIES = [
    { id: 'luxo', emoji: '💎', label: 'Luxo' },
    { id: 'custo-beneficio', emoji: '💰', label: 'Melhor custo-benefício' },
];



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

// Continue sua busca - Experiências personalizadas
const CONTINUE_SEARCH_EXPERIENCES = [
    {
        id: 'antelope-canyon',
        title: 'Page: Ingresso e Excursão Guiada ao Antelope Canyon Inferior',
        image: 'https://images.unsplash.com/photo-1444076784383-69ff7bae1b0a?w=800',
        duration: '1 hora',
        groupType: 'Pequenos grupos',
        category: 'AVENTURA',
        rating: 4.7,
        reviewCount: 7760,
        price: 65,
    },
    {
        id: 'grand-canyon-helicopter',
        title: 'Grand Canyon: Opções de passeio de helicóptero',
        image: 'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=800',
        duration: '30 minutos - 3.5 horas',
        groupType: 'Tour privado',
        category: 'AVENTURA',
        rating: 4.8,
        reviewCount: 2341,
        price: 243,
    },
    {
        id: 'sedona-hot-air',
        title: 'Sedona: Passeio de balão ao nascer do sol',
        image: 'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=800',
        duration: '3 horas',
        groupType: 'Pequenos grupos',
        category: 'AVENTURA',
        rating: 4.9,
        reviewCount: 1523,
        price: 289,
    },
];

// Experiências de viagem inesquecíveis
const UNFORGETTABLE_EXPERIENCES = [
    {
        id: 'milford-sound',
        title: 'De Manapouri: Viagem de um dia à natureza selvagem de Doubtful Sound',
        image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
        duration: '7 horas',
        badge: 'Esgota rápido',
        rating: 4.8,
        reviewCount: 1574,
        price: 177,
    },
    {
        id: 'santorini-sunset',
        title: 'Santorini: Cruzeiro ao pôr do sol com jantar',
        image: 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=800',
        duration: '5 horas',
        badge: 'Originals by VAMO',
        rating: 4.9,
        reviewCount: 2847,
        price: 95,
    },
    {
        id: 'northern-lights',
        title: 'Islândia: Caça às Auroras Boreais com guia especializado',
        image: 'https://images.unsplash.com/photo-1579033461380-adb47c3eb938?w=800',
        duration: '4 horas',
        badge: 'Esgota rápido',
        rating: 4.7,
        reviewCount: 3201,
        price: 89,
    },
];

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    scrollView: {
        flex: 1,
    },

    // Intent Categories Section
    intentSection: {
        marginBottom: theme.spacing.xl,
        paddingHorizontal: 20,
    },
    intentTitle: {
        fontSize: theme.typography.sizes.title,
        fontWeight: theme.typography.weights.heavy,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.xs,
    },
    intentSubtitle: {
        fontSize: theme.typography.sizes.caption,
        color: theme.colors.text.tertiary,
        marginBottom: theme.spacing.md,
        lineHeight: 20,
    },
    intentToggleRow: {
        flexDirection: 'row',
        gap: 12,
    },
    intentToggleCard: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
        paddingHorizontal: 12,
        borderRadius: theme.borderRadius.lg,
        borderWidth: 1.5,
    },
    intentToggleCardActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
        ...theme.shadows.medium,
    },
    intentToggleCardInactive: {
        backgroundColor: '#FFFFFF',
        borderColor: 'rgba(40, 201, 191, 0.3)',
    },
    intentToggleEmoji: {
        fontSize: 28,
        marginBottom: 8,
    },
    intentToggleLabel: {
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },
    intentToggleLabelActive: {
        color: '#FFFFFF',
    },
    intentToggleLabelInactive: {
        color: 'rgba(40, 201, 191, 0.7)',
    },
    intentFeedback: {
        marginTop: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: theme.colors.surfaceLight,
        borderRadius: theme.borderRadius.md,
        borderLeftWidth: 3,
        borderLeftColor: theme.colors.primary,
    },
    intentFeedbackText: {
        fontSize: 14,
        color: theme.colors.text.secondary,
        lineHeight: 20,
    },
    intentFilterNotice: {
        fontSize: 11,
        color: theme.colors.text.tertiary || '#999',
        marginTop: 4,
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

    // Categories (Existentes)
    categoriesSection: {
        marginBottom: 24,
    },
    categoriesScroll: {
        paddingHorizontal: 20,
        gap: 12,
    },
    categoryPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderRadius: 24,
        backgroundColor: theme.colors.background,
        borderWidth: 1.5,
        borderColor: theme.colors.border,
        ...theme.shadows.xs,
    },
    categoryIcon: {
        fontSize: 20,
    },
    categoryLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text.primary,
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
        padding: 12,
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
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text.primary,
        marginBottom: 6,
        lineHeight: 20,
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
    },
    homeCardPriceLabel: {
        fontSize: 12,
        color: theme.colors.text.secondary,
        marginBottom: 2,
    },
    homeCardPriceValue: {
        fontSize: 22,
        fontWeight: '700',
        color: theme.colors.primary,
        marginBottom: 2,
    },
    homeCardReviewCount: {
        fontSize: 12,
        color: theme.colors.text.secondary,
        marginTop: 2,
    },
    homeCardSocialProof: {
        fontSize: 11,
        color: theme.colors.text.secondary,
        marginTop: 4,
        opacity: 0.8,
    },
    homeCardViewButton: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: theme.borderRadius.full,
        ...theme.shadows.button || theme.shadows.small,
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
    roteirosCarouselContainer: {
        position: 'relative',
    },
    roteirosImage: {
        width: '100%',
        height: 200,
        backgroundColor: theme.colors.surfaceLight,
    },
    roteirosPhotoCount: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
    },
    roteirosPhotoCountText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    roteirosDots: {
        position: 'absolute',
        bottom: 12,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
    },
    roteirosDot: {
        width: 7,
        height: 7,
        borderRadius: 3.5,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
    },
    roteirosDotActive: {
        width: 9,
        height: 9,
        borderRadius: 4.5,
        backgroundColor: '#FFFFFF',
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
        fontSize: 17,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: 6,
        lineHeight: 23,
    },
    roteirosDescription: {
        fontSize: 14,
        color: theme.colors.text.secondary,
        lineHeight: 20,
        marginBottom: 12,
    },
    roteirosInclusions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 14,
    },
    roteirosInclusion: {
        backgroundColor: theme.colors.surfaceLight,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: theme.borderRadius.sm,
    },
    roteirosInclusionText: {
        fontSize: 12,
        color: theme.colors.text.secondary,
    },
    roteirosFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    roteirosPriceLabel: {
        fontSize: 12,
        color: theme.colors.text.secondary,
    },
    roteirosPrice: {
        fontSize: 22,
        fontWeight: '700',
        color: theme.colors.success,
    },
    roteirosCTA: {
        backgroundColor: theme.colors.success,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: theme.borderRadius.full,
    },
    roteirosCTAText: {
        fontSize: 14,
        fontWeight: '600',
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
