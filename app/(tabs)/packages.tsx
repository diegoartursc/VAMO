import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    TextInput,
    Dimensions,
    Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../src/theme/theme';
import { getPackagesByRelevance } from '../../src/data/mockPackages';
import { Package } from '../../src/types';
import { PackageBadge } from '../../src/components/badges/PackageBadge';
import { IconicSearchBar } from '../../src/components/search/IconicSearchBar';
import { SearchModal } from '../../src/components/search/SearchModal';
import { useSearch } from '../../src/hooks/useSearch';

const { width } = Dimensions.get('window');

export default function PackagesScreen() {
    const router = useRouter();
    const { filters, applyFilters, filteredPackages: searchFilteredPackages } = useSearch();

    const [searchModalVisible, setSearchModalVisible] = useState(false);
    const [favorites, setFavorites] = useState<string[]>([]); // Track favorite package IDs
    const [toastVisible, setToastVisible] = useState(false);
    const [toastOpacity] = useState(new Animated.Value(0));

    // Toggle favorite status
    const toggleFavorite = (packageId: string) => {
        const isAdding = !favorites.includes(packageId);

        setFavorites(prev =>
            prev.includes(packageId)
                ? prev.filter(id => id !== packageId)
                : [...prev, packageId]
        );

        // Show toast only when adding to favorites
        if (isAdding) {
            showToast();
        }
    };

    // Show toast notification
    const showToast = () => {
        setToastVisible(true);
        Animated.sequence([
            Animated.timing(toastOpacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.delay(2000),
            Animated.timing(toastOpacity, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start(() => setToastVisible(false));
    };

    // Usa pacotes filtrados do SearchContext ou pacotes ordenados por relevância
    const packagesByRelevance = getPackagesByRelevance();
    const displayedPackages = searchFilteredPackages.length > 0 ? searchFilteredPackages : packagesByRelevance;

    return (
        <View style={styles.container}>
            {/* Header with Gradient */}
            <LinearGradient
                colors={[theme.colors.gradientTop, theme.colors.gradientBottom]}
                style={styles.gradientHeader}
            >
                <View style={styles.headerContent}>
                    <View>
                        <Text style={styles.headerTitle}>Pacotes de Viagem</Text>
                        <Text style={styles.headerSubtitle}>
                            {displayedPackages.length} viagens selecionadas para você
                        </Text>
                    </View>
                </View>

            </LinearGradient>

            {/* Iconic Search Bar */}
            <View style={styles.searchWrapper}>
                <IconicSearchBar
                    placeholder="Encontrar meu pacote de viagem"
                    onPress={() => setSearchModalVisible(true)}
                />
            </View>

            {/* Packages Grid */}
            <ScrollView
                style={styles.packageList}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.packageListContent}
            >
                {displayedPackages.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyIcon}>🔍</Text>
                        <Text style={styles.emptyTitle}>Nenhum pacote encontrado</Text>
                        <Text style={styles.emptyText}>
                            Tente buscar por outro destino
                        </Text>
                    </View>
                ) : (
                    displayedPackages.map((pkg: Package) => (
                        <PackageCard
                            key={pkg.id}
                            package={pkg}
                            onPress={() => router.push(`/package/${pkg.id}`)}
                            isFavorite={favorites.includes(pkg.id)}
                            onToggleFavorite={() => toggleFavorite(pkg.id)}
                        />
                    ))
                )}
                <View style={{ height: 20 }} />
            </ScrollView>

            {/* Toast Notification */}
            {toastVisible && (
                <Animated.View
                    style={[
                        styles.toast,
                        { opacity: toastOpacity }
                    ]}
                >
                    <Text style={styles.toastIcon}>💾</Text>
                    <Text style={styles.toastText}>Salvo em Minhas Viagens</Text>
                </Animated.View>
            )}

            {/* Search Modal */}
            <SearchModal
                visible={searchModalVisible}
                onClose={() => setSearchModalVisible(false)}
                onSearch={(newFilters) => {
                    applyFilters(newFilters);
                    setSearchModalVisible(false);
                }}
                context="packages"
                initialFilters={filters}
            />
        </View>
    );
}

function PackageCard({
    package: pkg,
    onPress,
    isFavorite,
    onToggleFavorite
}: {
    package: Package;
    onPress: () => void;
    isFavorite: boolean;
    onToggleFavorite: () => void;
}) {
    return (
        <TouchableOpacity style={styles.card} onPress={onPress}>
            <Image
                source={{ uri: pkg.images[0] }}
                style={styles.cardImage}
                resizeMode="cover" // Fix aspect ratio issue
            />

            {/* Badge */}
            {pkg.badge && (
                <View style={styles.badgeContainer}>
                    <PackageBadge type={pkg.badge} />
                </View>
            )}

            {/* Featured badge (fallback) */}
            {pkg.featured && !pkg.badge && (
                <View style={styles.featuredBadge}>
                    <Text style={styles.featuredText}>⭐ Destaque</Text>
                </View>
            )}

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

            <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                    <View style={styles.agencyRow}>
                        <View style={styles.agencyTag}>
                            <Text style={styles.agencyIcon}>{pkg.agency.logo}</Text>
                            <Text style={styles.agencyText}>{pkg.agency.name}</Text>
                        </View>
                        {pkg.agency.verified && (
                            <View style={styles.verifiedBadge}>
                                <Text style={styles.verifiedIcon}>🛡️</Text>
                                <Text style={styles.verifiedText}>Agência verificada</Text>
                            </View>
                        )}
                    </View>
                    <View style={styles.ratingBadge}>
                        <Text style={styles.ratingIcon}>⭐</Text>
                        <Text style={styles.ratingValue}>{pkg.rating}</Text>
                        <Text style={styles.ratingCount}>({pkg.reviewCount})</Text>
                    </View>
                </View>

                <Text style={styles.cardTitle} numberOfLines={2}>
                    {pkg.title}
                </Text>

                <Text style={styles.cardDestination}>
                    📍 {pkg.destination}, {pkg.country}
                </Text>

                <Text style={styles.cardDuration}>📅 {pkg.duration} dias</Text>

                {/* Inclusions badges - Matching detail page */}
                <View style={styles.inclusionsBadges}>
                    <View style={styles.inclusionBadge}>
                        <Text style={styles.inclusionText}>⏱️ {pkg.duration} Dias</Text>
                    </View>
                    <View style={styles.inclusionBadge}>
                        <Text style={styles.inclusionText}>📶 Wi-Fi</Text>
                    </View>
                    <View style={styles.inclusionBadge}>
                        <Text style={styles.inclusionText}>👥 Guia</Text>
                    </View>
                    {pkg.inclusions?.hotel && (
                        <View style={styles.inclusionBadge}>
                            <Text style={styles.inclusionText}>
                                🏨 Hotel {pkg.inclusions.hotel.stars}★
                            </Text>
                        </View>
                    )}
                </View>

                <View style={styles.cardFooter}>
                    <View>
                        <Text style={styles.priceLabel}>A partir de</Text>
                        <Text style={styles.priceValue}>
                            R$ {pkg.price.min.toLocaleString('pt-BR')}
                        </Text>
                        <Text style={styles.reviewCount}>
                            ({pkg.reviewCount} avaliações)
                        </Text>
                        {pkg.recentPurchases && (
                            <Text style={styles.socialProof}>
                                Reservado por {pkg.recentPurchases} pessoas este mês
                            </Text>
                        )}
                    </View>
                    <TouchableOpacity style={styles.viewButton} onPress={onPress}>
                        <Text style={styles.viewButtonText}>Ver detalhes</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );
}



const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
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
        marginBottom: theme.spacing.md,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: theme.colors.text.inverse,
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: theme.colors.text.inverse,
        opacity: 0.9,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
        marginHorizontal: theme.spacing.md,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: 12, // Increased touch target
        borderRadius: theme.borderRadius.md,
        ...theme.shadows.medium, // More consistent shadow
    },
    searchIcon: {
        fontSize: 16,
        marginRight: theme.spacing.sm,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: theme.colors.text.primary,
        padding: 0,
    },
    clearIcon: {
        fontSize: 16,
        color: theme.colors.text.secondary,
        padding: 4,
    },
    filtersWrapper: {
        marginTop: -20, // Negative margin to overlap with header slightly if desired, or just spacing
        marginBottom: theme.spacing.xs,
    },
    filterContainer: {
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.md,
        gap: theme.spacing.sm,
    },
    filterButton: {
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: theme.borderRadius.full,
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.border,
        ...theme.shadows.xs,
    },
    filterButtonActive: {
        backgroundColor: theme.colors.primary, // Deep Blue active
        borderColor: theme.colors.primary,
        ...theme.shadows.small,
    },
    filterText: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    filterTextActive: {
        color: theme.colors.text.inverse,
    },
    packageList: {
        flex: 1,
    },
    packageListContent: {
        paddingHorizontal: theme.spacing.md,
        paddingTop: theme.spacing.sm,
    },
    card: {
        backgroundColor: theme.colors.background,
        borderRadius: theme.borderRadius.lg, // Increased radius
        marginBottom: theme.spacing.cardGap, // More spacing between cards
        ...theme.shadows.small,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    cardImage: {
        width: '100%',
        height: 140, // Optimized height for better screen usage
        backgroundColor: theme.colors.surface,
    },
    featuredBadge: {
        position: 'absolute',
        top: theme.spacing.md,
        right: theme.spacing.md,
        backgroundColor: theme.colors.secondary,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.borderRadius.full,
    },
    featuredText: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    badgeContainer: {
        position: 'absolute',
        top: theme.spacing.md,
        right: theme.spacing.md,
        zIndex: 1,
    },
    cardContent: {
        padding: 12, // Reduced from 16px for more compact cards
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    agencyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flex: 1,
    },
    agencyTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 4,
        borderRadius: theme.borderRadius.sm,
        gap: 4,
    },
    agencyIcon: {
        fontSize: 14,
    },
    agencyText: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ratingIcon: {
        fontSize: 14,
    },
    ratingValue: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    ratingCount: {
        fontSize: 12,
        fontWeight: '500',
        color: theme.colors.text.secondary,
    },
    cardTitle: {
        fontSize: 16, // Reduced from 18px for more compact layout
        fontWeight: '600',
        color: theme.colors.text.primary,
        marginBottom: 6,
        lineHeight: 20,
    },
    cardDestination: {
        fontSize: 14,
        color: theme.colors.text.secondary,
        marginBottom: 4,
    },
    cardDuration: {
        fontSize: 14,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.md,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    priceLabel: {
        fontSize: 12,
        color: theme.colors.text.secondary,
        marginBottom: 2,
    },
    priceValue: {
        fontSize: 22,
        fontWeight: '700',
        color: theme.colors.primary,
        marginBottom: 2,
    },
    viewButton: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: theme.borderRadius.full,
        ...theme.shadows.button,
    },
    viewButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text.inverse,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.xxl * 2,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: theme.spacing.md,
        opacity: 0.3,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.xs,
    },
    emptyText: {
        fontSize: 14,
        color: theme.colors.text.secondary,
    },
    inclusionsBadges: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: theme.spacing.md,
    },
    inclusionBadge: {
        backgroundColor: theme.colors.surfaceLight,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: theme.borderRadius.sm,
    },
    inclusionText: {
        fontSize: 11,
        color: theme.colors.text.secondary,
    },
    reviewCount: {
        fontSize: 12,
        color: theme.colors.text.secondary,
        marginTop: 2,
    },
    favoriteButton: {
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
    favoriteIcon: {
        fontSize: 20,
    },
    verifiedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        paddingHorizontal: 6,
        paddingVertical: 2,
        backgroundColor: theme.colors.surfaceLight,
        borderRadius: theme.borderRadius.sm,
    },
    verifiedIcon: {
        fontSize: 9,
    },
    verifiedText: {
        fontSize: 9,
        fontWeight: '500',
        color: theme.colors.text.secondary,
    },
    socialProof: {
        fontSize: 11,
        color: theme.colors.text.secondary,
        marginTop: 4,
        opacity: 0.8,
    },
    toast: {
        position: 'absolute',
        bottom: 100,
        alignSelf: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: theme.borderRadius.full,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        ...theme.shadows.medium,
    },
    toastIcon: {
        fontSize: 16,
    },
    toastText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    categoriesSection: {
        marginBottom: theme.spacing.md,
    },
    categoriesScroll: {
        paddingHorizontal: theme.spacing.md,
        gap: theme.spacing.sm,
    },
    categoryPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xs,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.borderRadius.full,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    categoryIcon: {
        fontSize: 16,
    },
    categoryLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: theme.colors.text.primary,
    },
    intentBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginHorizontal: theme.spacing.md,
        marginBottom: theme.spacing.sm,
        paddingHorizontal: 14,
        paddingVertical: 10,
        backgroundColor: theme.colors.surfaceLight,
        borderRadius: theme.borderRadius.md,
        borderLeftWidth: 3,
        borderLeftColor: theme.colors.primary,
    },
    intentBannerText: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.text.secondary,
    },
    intentBannerClear: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.primary,
    },
});
