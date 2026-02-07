import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Dimensions,
} from 'react-native';
import { theme } from '../../src/theme/theme';
import { HeroSection } from '../../src/components/home/HeroSection';
import { IconicSearchBar } from '../../src/components/search/IconicSearchBar';
import { SearchModal } from '../../src/components/search/SearchModal';
import { PressableCard } from '../../src/components/common/PressableCard';
import { getPackagesByRelevance, mockPackages } from '../../src/data/mockPackages';
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
    const { applyFilters, filters, filteredPackages, hasActiveFilters } = useSearch();
    const [searchModalVisible, setSearchModalVisible] = useState(false);
    const [decisionAssistantVisible, setDecisionAssistantVisible] = useState(false);
    const packagesByRelevance = getPackagesByRelevance();

    // Usa pacotes filtrados se houver filtros ativos, senão usa por relevância
    const displayedPackages = hasActiveFilters ? filteredPackages : packagesByRelevance.filter(p => p.featured);

    const [favorites, setFavorites] = useState<string[]>([]); // Track favorite package IDs
    const { showAnimation } = useFavoriteAnimation();
    const [selectedIntent, setSelectedIntent] = useState<string | null>(null); // Track selected travel style
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
        const newSelection = selectedIntent === intentId ? null : intentId;
        setSelectedIntent(newSelection);

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

                    <View style={styles.packagesGrid}>
                        {displayedPackages.slice(0, 6).map((pkg, index) => (
                            <PremiumPackageCard
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

                        <View style={styles.packagesGrid}>
                            {mockPackages
                                .filter(pkg =>
                                    pkg.destination.toLowerCase().includes(lastSearchedDestination.toLowerCase()) ||
                                    pkg.country.toLowerCase().includes(lastSearchedDestination.toLowerCase())
                                )
                                .slice(0, 4)
                                .map((pkg, index) => (
                                    <PremiumPackageCard
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
                    </View>
                )}

                {/* 5. Seção "Como você quer viajar?" */}
                <View style={styles.intentSection}>
                    <Text style={styles.intentTitle}>Como você quer viajar?</Text>
                    <Text style={styles.intentSubtitle}>
                        Escolha o que combina com você e encontre sua viagem ideal
                    </Text>

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.intentScroll}
                    >
                        {INTENT_CATEGORIES.map((intent) => (
                            <TouchableOpacity
                                key={intent.id}
                                style={[
                                    styles.intentChip,
                                    selectedIntent === intent.id && styles.intentChipSelected
                                ]}
                                onPress={() => handleIntentSelect(intent.id)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.intentEmoji}>{intent.emoji}</Text>
                                <Text style={styles.intentLabel}>{intent.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Feedback textual */}
                    {selectedIntent && (
                        <View style={styles.intentFeedback}>
                            <Text style={styles.intentFeedbackText}>
                                {intentFeedback[selectedIntent]}
                            </Text>
                        </View>
                    )}
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

                {/* 5. Destinos Populares */}
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

                {/* 6. Experiências Inesquecíveis */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Experiências de viagem inesquecíveis</Text>
                    <Text style={styles.sectionSubtitle}>
                        Momentos únicos que você vai guardar para sempre
                    </Text>

                    <View style={styles.packagesGrid}>
                        {UNFORGETTABLE_EXPERIENCES.map((exp, index) => (
                            <PremiumPackageCard
                                key={exp.id}
                                package={{
                                    ...exp,
                                    price: { min: exp.price, max: exp.price },
                                    images: [exp.image],
                                    agency: { name: 'VAMO Experiences' },
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
                </View>

                {/* 7. Banner "Quer vender seus roteiros?" (CTA Carousel) */}
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

// Enhanced Package Card with rating, reviews, agency, and duration
function PremiumPackageCard({
    package: pkg,
    onPress,
    isFavorite,
    onToggleFavorite
}: any) {
    // Generate value proposition based on package attributes
    const getValueProposition = () => {
        if (pkg.isAllInclusive) return 'Tudo incluso, zero preocupação';
        if (pkg.categories?.includes('romantic')) return 'Perfeito para casal';
        if (pkg.categories?.includes('cultural')) return 'Ideal para primeira viagem internacional';
        if (pkg.duration <= 4) return 'Escapada rápida e completa';
        if (pkg.duration >= 10) return 'Experiência completa e imersiva';
        return 'Pacote completo com tudo organizado';
    };

    // Get badge label
    const getBadgeLabel = () => {
        if (pkg.badge === 'bestseller') return 'Mais vendido';
        if (pkg.badge === 'value') return 'Melhor custo-benefício';
        if (pkg.badge === 'luxury') return 'Premium';
        return null;
    };

    const badgeLabel = getBadgeLabel();

    return (
        <PressableCard onPress={onPress} style={styles.packageCard}>
            {/* Badge de destaque (condicional) */}
            {badgeLabel && (
                <View style={styles.packageBadge}>
                    <Text style={styles.packageBadgeText}>{badgeLabel}</Text>
                </View>
            )}

            <Image
                source={{ uri: pkg.images[0] }}
                style={styles.packageImage}
                resizeMode="cover"
            />

            {/* Favorite Button */}
            <TouchableOpacity
                style={styles.favoriteButton}
                onPress={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(e);
                }}
                activeOpacity={0.7}
            >
                <Text style={styles.favoriteIcon}>
                    {isFavorite ? '❤️' : '♡'}
                </Text>
            </TouchableOpacity>

            <View style={styles.packageInfo}>
                <Text style={styles.packageTitle} numberOfLines={2}>{pkg.title}</Text>

                {/* Micro-copy de valor */}
                <Text style={styles.packageValueProp} numberOfLines={1}>
                    {getValueProposition()}
                </Text>

                {/* Rating & Review Count */}
                <View style={styles.packageMeta}>
                    <Text style={styles.packageRating}>⭐ {pkg.rating}</Text>
                    <Text style={styles.packageReviews}>({pkg.reviewCount})</Text>
                </View>

                {/* Agency & Duration */}
                <View style={styles.packageDetails}>
                    <Text style={styles.packageAgency} numberOfLines={1}>{pkg.agency?.name || 'Agência'}</Text>
                    <Text style={styles.packageDuration}>• {pkg.duration} dias</Text>
                </View>

                {/* Preço contextualizado */}
                <View style={styles.packagePriceContainer}>
                    <Text style={styles.packagePriceLabel}>A partir de</Text>
                    <Text style={styles.packagePrice}>R$ {pkg.price.min.toLocaleString()}</Text>
                    <Text style={styles.packagePricePerPerson}>por pessoa</Text>
                </View>

                {/* Prova social leve (condicional) */}
                {pkg.recentPurchases && pkg.recentPurchases > 0 && (
                    <Text style={styles.packageSocialProof}>
                        Reservado por {pkg.recentPurchases} pessoas este mês
                    </Text>
                )}
            </View>
        </PressableCard>
    );
}

// Inline CTACarousel removed - using separate component from CTACarousel.tsx

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
    intentScroll: {
        gap: 12,
    },
    intentChip: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderRadius: theme.borderRadius.lg,
        backgroundColor: theme.colors.background,
        borderWidth: 2,
        borderColor: theme.colors.primary,
        minWidth: 140,
        ...theme.shadows.small,
    },
    intentEmoji: {
        fontSize: 32,
        marginBottom: 8,
    },
    intentLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.text.primary,
        textAlign: 'center',
        lineHeight: 18,
    },
    intentChipSelected: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
        ...theme.shadows.medium,
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

    // Package Cards (temporary)
    packageCard: {
        width: '48%',
        backgroundColor: theme.colors.background,
        borderRadius: theme.borderRadius.lg,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        ...theme.shadows.small,
    },
    packageImage: {
        width: '100%',
        height: 160,
        backgroundColor: theme.colors.surfaceLight,
    },
    packageInfo: {
        padding: 16,
    },
    packageTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text.primary,
        marginBottom: 6,
        lineHeight: 22,
    },
    packageMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
        gap: 4,
    },
    packageRating: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    packageReviews: {
        fontSize: 14,
        color: theme.colors.text.tertiary,
    },
    packageDetails: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 6,
    },
    packageAgency: {
        fontSize: 12,
        color: theme.colors.text.secondary,
        flex: 1,
    },
    packageDuration: {
        fontSize: 12,
        color: theme.colors.text.secondary,
    },
    packagePrice: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.primary,
    },
    // Novos estilos para melhorias de UX
    packageBadge: {
        position: 'absolute',
        top: 12,
        left: 12,
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: theme.borderRadius.sm,
        zIndex: 1,
        ...theme.shadows.small,
    },
    packageBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: theme.colors.text.onPrimary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    packageValueProp: {
        fontSize: 13,
        color: theme.colors.text.secondary,
        marginBottom: 8,
        fontStyle: 'italic',
        lineHeight: 18,
    },
    packagePriceContainer: {
        marginTop: 4,
    },
    packagePriceLabel: {
        fontSize: 11,
        color: theme.colors.text.tertiary,
        marginBottom: 2,
    },
    packagePricePerPerson: {
        fontSize: 11,
        color: theme.colors.text.tertiary,
        marginTop: 2,
    },
    packageSocialProof: {
        fontSize: 11,
        color: theme.colors.text.tertiary,
        marginTop: 8,
        lineHeight: 15,
    },
    packagesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        justifyContent: 'space-between',
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

    // CTA Carousel styles removed - using styles from CTACarousel.tsx
    favoriteButton: {
        position: 'absolute',
        top: 8,
        left: 8,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        alignItems: 'center',
        justifyContent: 'center',
        ...theme.shadows.medium,
        zIndex: 2,
    },
    favoriteIcon: {
        fontSize: 18,
    },
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
