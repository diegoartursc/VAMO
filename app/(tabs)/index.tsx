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
import { getFeaturedPackages } from '../../src/data/mockPackages';
import WhyDifferent from '../../src/components/common/WhyDifferent';
import { useRouter } from 'expo-router';
import { useSearch } from '../../src/hooks/useSearch';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
    const router = useRouter();
    const { applyFilters, filters } = useSearch();
    const [searchModalVisible, setSearchModalVisible] = useState(false);
    const featuredPackages = getFeaturedPackages();
    const [isDestinationsExpanded, setIsDestinationsExpanded] = useState(false);
    const [favorites, setFavorites] = useState<string[]>([]); // Track favorite package IDs

    // Toggle favorite status
    const toggleFavorite = (packageId: string) => {
        setFavorites(prev =>
            prev.includes(packageId)
                ? prev.filter(id => id !== packageId)
                : [...prev, packageId]
        );
    };

    // Auto-scroll for categories
    const scrollViewRef = useRef<ScrollView>(null);
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

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                bounces={true}
            >
                {/* Hero Section - CTA removido, texto movido para search bar */}
                <HeroSection
                    image="https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800"
                    title="Viajar é mais simples do que você pensa"
                    subtitle="Agências verificadas • Pacotes completos • Suporte em português"
                    badge="Originals by VAMO"
                />

                {/* Iconic Search Bar - Novo Design */}
                <IconicSearchBar
                    placeholder="Encontrar minha viagem"
                    onPress={() => setSearchModalVisible(true)}
                />

                {/* Why Different */}
                <WhyDifferent />

                {/* ========================================
                    NOVA SEÇÃO: Categorias de Intenção
                    Adicionada ANTES das categorias existentes
                    ======================================== */}
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
                                style={styles.intentChip}
                                onPress={() => {
                                    // Aplicar filtro baseado na intenção
                                    // Por enquanto, navega para pacotes com query parameter
                                    router.push(`/(tabs)/packages?intent=${intent.id}`);
                                }}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.intentEmoji}>{intent.emoji}</Text>
                                <Text style={styles.intentLabel}>{intent.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Category Pills with Auto-Scroll (CATEGORIAS EXISTENTES - MANTIDAS) */}
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
                        {/* Render categories twice for infinite effect */}
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

                {/* Experiências Inesquecíveis */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Experiências inesquecíveis</Text>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {featuredPackages.slice(0, 3).map((pkg) => (
                            <PremiumPackageCard
                                key={pkg.id}
                                package={pkg}
                                onPress={() => router.push(`/package/${pkg.id}`)}
                                isFavorite={favorites.includes(pkg.id)}
                                onToggleFavorite={() => toggleFavorite(pkg.id)}
                            />
                        ))}
                    </ScrollView>
                </View>

                {/* Destinos Populares */}
                <View style={styles.section}>
                    <TouchableOpacity onPress={() => setIsDestinationsExpanded(!isDestinationsExpanded)} activeOpacity={0.7}>
                        <Text style={styles.sectionTitle}>
                            Destinos populares {isDestinationsExpanded ? '▲' : '▼'}
                        </Text>
                    </TouchableOpacity>
                    <Text style={styles.sectionSubtitle}>
                        Os lugares mais procurados pelos nossos viajantes
                    </Text>

                    {/* Grid de destinos */}
                    <View style={styles.destinationsGrid}>
                        {(isDestinationsExpanded ? POPULAR_DESTINATIONS : POPULAR_DESTINATIONS.slice(0, 4)).map((dest) => (
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

                {/* CTA Torne-se Criador */}
                <View style={styles.section}>
                    <View style={styles.ctaCard}>
                        <Text style={styles.ctaIcon}>✍️</Text>
                        <Text style={styles.ctaTitle}>Quer vender seus roteiros?</Text>
                        <Text style={styles.ctaText}>
                            Transforme suas viagens em renda extra compartilhando seus roteiros
                        </Text>
                        <TouchableOpacity style={styles.ctaButton} onPress={() => router.push('/(tabs)/profile')}>
                            <Text style={styles.ctaButtonText}>Começar agora</Text>
                        </TouchableOpacity>
                    </View>
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
                    // Navegar para a aba de pacotes com os filtros aplicados
                    router.push('/(tabs)/packages');
                }}
                context="home"
                initialFilters={filters}
            />
        </View>
    );
}

// Temporary component until we create the full one
function PremiumPackageCard({
    package: pkg,
    onPress,
    isFavorite,
    onToggleFavorite
}: any) {
    return (
        <PressableCard onPress={onPress} style={styles.packageCard}>
            <Image
                source={{ uri: pkg.images[0] }}
                style={styles.packageImage}
                resizeMode="cover"
            />

            {/* Favorite Button */}
            <TouchableOpacity
                style={styles.favoriteButton}
                onPress={(e) => {
                    onToggleFavorite();
                }}
                activeOpacity={0.7}
            >
                <Text style={styles.favoriteIcon}>
                    {isFavorite ? '❤️' : '♡'}
                </Text>
            </TouchableOpacity>

            <View style={styles.packageInfo}>
                <Text style={styles.packageTitle} numberOfLines={2}>{pkg.title}</Text>
                <Text style={styles.packagePrice}>R$ {pkg.price.min.toLocaleString()}</Text>
            </View>
        </PressableCard>
    );
}

// Categorias de Intenção em Destaque (ajustado em 30/01/2026)
// Apenas as principais intenções: Luxo e Custo-benefício
const INTENT_CATEGORIES = [
    { id: 'luxo', emoji: '💎', label: 'Luxo' },
    { id: 'custo-beneficio', emoji: '💰', label: 'Melhor custo-benefício' },
];

// Categorias Visuais (existentes - NÃO ALTERAR)
const CATEGORIES = [
    { id: 'cultura', icon: '🏛️', label: 'Cultura' },
    { id: 'gastronomia', icon: '🍽️', label: 'Gastronomia' },
    { id: 'natureza', icon: '🌳', label: 'Natureza' },
    { id: 'esportes', icon: '⚽', label: 'Esportes' },
    { id: 'cruzeiros', icon: '🚢', label: 'Cruzeiros' },
    { id: 'eurotrip', icon: '🌍', label: 'Eurotrip' },
    { id: 'relax', icon: '🧘', label: 'Relax' },
    { id: 'familia', icon: '👨‍👩‍👧‍👦', label: 'Família' },
    { id: 'aventura', icon: '🏔️', label: 'Aventura' },
];

const POPULAR_DESTINATIONS = [
    { id: 'paris', name: 'Paris', image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800', count: 847 },
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

    // Intent Categories (Nova Seção)
    intentSection: {
        marginBottom: 32,
        paddingHorizontal: 20,
    },
    intentTitle: {
        fontSize: theme.typography.sizes.title,
        fontWeight: theme.typography.weights.heavy,
        color: theme.colors.text.primary,
        marginBottom: 6,
    },
    intentSubtitle: {
        fontSize: theme.typography.sizes.caption,
        color: theme.colors.text.tertiary,
        marginBottom: 16,
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
        marginBottom: 8,
    },
    sectionSubtitle: {
        fontSize: theme.typography.sizes.caption,
        color: theme.colors.text.tertiary,
        marginBottom: 16,
    },

    // Package Cards (temporary)
    packageCard: {
        width: 260,
        marginRight: 16,
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
        marginBottom: 4,
        lineHeight: 22,
    },
    packagePrice: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.primary,
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

    // CTA Card
    ctaCard: {
        backgroundColor: theme.colors.surfaceLight,
        borderRadius: theme.borderRadius.xl,
        padding: 28,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: theme.colors.primaryLight,
        ...theme.shadows.medium,
    },
    ctaIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    ctaTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: 8,
        textAlign: 'center',
    },
    ctaText: {
        fontSize: 14,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 20,
    },
    ctaButton: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 36,
        paddingVertical: 16,
        borderRadius: theme.borderRadius.full,
        ...theme.shadows.button,
    },
    ctaButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.text.onPrimary,
    },
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
});
