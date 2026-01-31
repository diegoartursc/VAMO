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
import { mockPackages } from '../../src/data/mockPackages';
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
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFilter, setSelectedFilter] = useState<'all' | 'price' | 'rating'>('all');
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

    // Usa pacotes filtrados do SearchContext ou todos os pacotes
    const packagesToFilter = searchFilteredPackages.length > 0 ? searchFilteredPackages : mockPackages;

    // Filter packages based on search query local
    const filteredPackages = packagesToFilter.filter((pkg) => {
        const query = searchQuery.toLowerCase();
        return (
            pkg.title.toLowerCase().includes(query) ||
            pkg.destination.toLowerCase().includes(query) ||
            pkg.country.toLowerCase().includes(query)
        );
    });

    // Sort packages based on selected filter
    const sortedPackages = [...filteredPackages].sort((a, b) => {
        if (selectedFilter === 'price') {
            return a.price.min - b.price.min;
        }
        if (selectedFilter === 'rating') {
            return b.rating - a.rating;
        }
        return 0; // 'all' - no sorting
    });

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
                            {sortedPackages.length} viagens selecionadas para você
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

            {/* Filter Buttons */}
            <View style={styles.filtersWrapper}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterContainer}
                >
                    <TouchableOpacity
                        style={[
                            styles.filterButton,
                            selectedFilter === 'all' && styles.filterButtonActive,
                        ]}
                        onPress={() => setSelectedFilter('all')}
                    >
                        <Text
                            style={[
                                styles.filterText,
                                selectedFilter === 'all' && styles.filterTextActive,
                            ]}
                        >
                            Todos
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.filterButton,
                            selectedFilter === 'price' && styles.filterButtonActive,
                        ]}
                        onPress={() => setSelectedFilter('price')}
                    >
                        <Text
                            style={[
                                styles.filterText,
                                selectedFilter === 'price' && styles.filterTextActive,
                            ]}
                        >
                            💰 Mais barato
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.filterButton,
                            selectedFilter === 'rating' && styles.filterButtonActive,
                        ]}
                        onPress={() => setSelectedFilter('rating')}
                    >
                        <Text
                            style={[
                                styles.filterText,
                                selectedFilter === 'rating' && styles.filterTextActive,
                            ]}
                        >
                            ⭐ Mais recomendado
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>

            {/* Package List */}
            <ScrollView
                style={styles.packageList}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.packageListContent}
            >
                {sortedPackages.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyIcon}>🔍</Text>
                        <Text style={styles.emptyTitle}>Nenhum pacote encontrado</Text>
                        <Text style={styles.emptyText}>
                            Tente buscar por outro destino
                        </Text>
                    </View>
                ) : (
                    sortedPackages.map((pkg) => (
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
                    </View>
                </View>

                <Text style={styles.cardTitle} numberOfLines={2}>
                    {pkg.title}
                </Text>

                <Text style={styles.cardDestination}>
                    📍 {pkg.destination}, {pkg.country}
                </Text>

                <Text style={styles.cardDuration}>📅 {pkg.duration} dias</Text>

                {/* Inclusions badges */}
                {pkg.inclusions && (
                    <View style={styles.inclusionsBadges}>
                        {pkg.inclusions.flight && (
                            <View style={styles.inclusionBadge}>
                                <Text style={styles.inclusionText}>✈️ Voo</Text>
                            </View>
                        )}
                        {pkg.inclusions.hotel && (
                            <View style={styles.inclusionBadge}>
                                <Text style={styles.inclusionText}>
                                    🏨 Hotel {pkg.inclusions.hotel.stars}⭐
                                </Text>
                            </View>
                        )}
                        {pkg.inclusions.tours.length > 0 && (
                            <View style={styles.inclusionBadge}>
                                <Text style={styles.inclusionText}>🎫 Passeios</Text>
                            </View>
                        )}
                    </View>
                )}

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
});
