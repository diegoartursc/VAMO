import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Dimensions,
    Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../src/theme/theme';
import { Package } from '../../src/types';
import { IconicSearchBar } from '../../src/components/search/IconicSearchBar';
import { SearchModal } from '../../src/components/search/SearchModal';
import { useSearch } from '../../src/hooks/useSearch';
import { Icon } from '../../src/components/common/Icons';
import { PackageCard } from '../../src/components/cards/PackageCard';

const { width } = Dimensions.get('window');

export default function PackagesScreen() {
    const router = useRouter();
    const { filters, applyFilters, filteredPackages: searchFilteredPackages, hasActiveFilters, allPackages } = useSearch();

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

    // Usa pacotes filtrados do SearchContext (agora vindo da API)
    const displayedPackages = hasActiveFilters ? searchFilteredPackages : allPackages;

    return (
        <View style={styles.container}>
            {/* Header with Gradient */}
            <LinearGradient
                colors={theme.colors.gradients.institutional as unknown as [string, string]}
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
                        <Icon name="search" size={48} color={theme.colors.text.tertiary} />
                        <Text style={styles.emptyTitle}>Nenhum pacote encontrado</Text>
                        <Text style={styles.emptyText}>
                            Tente buscar por outro destino
                        </Text>
                    </View>
                ) : (
                    displayedPackages.map((pkg: Package) => (
                        <PackageCard
                            key={pkg.id}
                            pkg={pkg}
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
                    <Icon name="heart" size={16} color="#FFFFFF" />
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
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.xxl * 2,
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
});
