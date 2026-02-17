import React from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Image, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { theme } from '../src/theme/theme';
import {
    purchasedItineraries,
    PurchasedItineraryItem,
    formatDate,
} from '../src/data/mockMyTrips';

const { width } = Dimensions.get('window');

export default function MyItinerariesScreen() {
    const router = useRouter();
    const itineraries = purchasedItineraries;

    return (
        <View style={styles.container}>
            {/* Header */}
            <LinearGradient
                colors={[theme.colors.gradientTop, theme.colors.gradientBottom]}
                style={styles.header}
            >
                <View style={styles.headerRow}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Ionicons name="arrow-back" size={22} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Meus Roteiros</Text>
                    <View style={{ width: 38 }} />
                </View>
                <Text style={styles.headerSubtitle}>
                    {itineraries.length} {itineraries.length === 1 ? 'roteiro adquirido' : 'roteiros adquiridos'}
                </Text>
            </LinearGradient>

            {itineraries.length === 0 ? (
                <View style={styles.emptyState}>
                    <View style={styles.emptyIconContainer}>
                        <Ionicons name="map-outline" size={48} color={theme.colors.text.tertiary} />
                    </View>
                    <Text style={styles.emptyTitle}>Nenhum roteiro ainda</Text>
                    <Text style={styles.emptySubtitle}>
                        Você ainda não adquiriu nenhum roteiro. Explore roteiros de viajantes experientes!
                    </Text>
                    <TouchableOpacity
                        style={styles.exploreCta}
                        onPress={() => router.push('/(tabs)/itineraries')}
                    >
                        <Text style={styles.exploreCtaText}>Explorar Roteiros</Text>
                        <Ionicons name="arrow-forward" size={18} color="#FFF" />
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView
                    style={styles.list}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 40 }}
                >
                    {itineraries.map((itin) => (
                        <ItineraryCard
                            key={itin.id}
                            item={itin}
                            onPress={() => router.push(`/purchased-itinerary/${itin.id}`)}
                        />
                    ))}

                    {/* CTA to explore more */}
                    <TouchableOpacity
                        style={styles.exploreMoreCard}
                        onPress={() => router.push('/(tabs)/itineraries')}
                    >
                        <Ionicons name="compass-outline" size={24} color={theme.colors.primary} />
                        <View style={styles.exploreMoreTextContainer}>
                            <Text style={styles.exploreMoreTitle}>Descubrir mais roteiros</Text>
                            <Text style={styles.exploreMoreSub}>
                                Explore roteiros criados por viajantes experientes
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={theme.colors.text.tertiary} />
                    </TouchableOpacity>
                </ScrollView>
            )}
        </View>
    );
}

// ── Itinerary Card ──────────────────────────────────────
function ItineraryCard({
    item,
    onPress,
}: {
    item: PurchasedItineraryItem;
    onPress: () => void;
}) {
    return (
        <TouchableOpacity
            style={styles.card}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <Image source={{ uri: item.image }} style={styles.cardImage} />

            {/* Gradient overlay */}
            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.6)']}
                style={styles.cardOverlay}
            />

            {/* Destination badge */}
            <View style={styles.destinationBadge}>
                <Ionicons name="location" size={12} color={theme.colors.primary} />
                <Text style={styles.destinationText}>
                    {item.destination}, {item.country}
                </Text>
            </View>

            {/* Content overlay */}
            <View style={styles.cardContent}>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                <View style={styles.cardMeta}>
                    <View style={styles.creatorRow}>
                        <Text style={styles.creatorAvatar}>{item.creatorAvatar}</Text>
                        <Text style={styles.creatorName}>{item.creatorName}</Text>
                    </View>
                    <Text style={styles.purchaseDate}>
                        Comprado em {formatDate(item.purchaseDate)}
                    </Text>
                </View>
            </View>

            {/* Price badge */}
            <View style={styles.priceBadge}>
                <Text style={styles.priceText}>
                    R$ {item.price.toFixed(2).replace('.', ',')}
                </Text>
            </View>

            {/* Access indicator */}
            <View style={styles.accessBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#FFF" />
                <Text style={styles.accessText}>Acesso liberado</Text>
            </View>
        </TouchableOpacity>
    );
}

// ── Styles ──────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.surface,
    },

    // Header
    header: {
        paddingTop: 56,
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    backButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
    },

    // Empty State
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
        paddingBottom: 80,
    },
    emptyIconContainer: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: theme.colors.borderLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 15,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    exploreCta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 14,
        ...theme.shadows.button,
    },
    exploreCtaText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFF',
    },

    // List
    list: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
    },

    // Card
    card: {
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 16,
        height: 220,
        backgroundColor: theme.colors.background,
        ...theme.shadows.medium,
    },
    cardImage: {
        width: '100%',
        height: '100%',
        position: 'absolute',
    },
    cardOverlay: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: '65%',
    },
    destinationBadge: {
        position: 'absolute',
        top: 12,
        left: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(255,255,255,0.95)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
    },
    destinationText: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    cardContent: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 8,
    },
    cardMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    creatorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    creatorAvatar: {
        fontSize: 16,
    },
    creatorName: {
        fontSize: 13,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.9)',
    },
    purchaseDate: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.7)',
    },

    // Badges
    priceBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
    },
    priceText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#FFF',
    },
    accessBadge: {
        position: 'absolute',
        top: 46,
        right: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(40, 201, 191, 0.85)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    accessText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#FFF',
    },

    // Explore More Card
    exploreMoreCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: theme.colors.background,
        padding: 16,
        borderRadius: 16,
        marginTop: 4,
        borderWidth: 1.5,
        borderColor: theme.colors.primary + '30',
        borderStyle: 'dashed',
    },
    exploreMoreTextContainer: {
        flex: 1,
    },
    exploreMoreTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.colors.text.primary,
        marginBottom: 2,
    },
    exploreMoreSub: {
        fontSize: 12,
        color: theme.colors.text.secondary,
    },
});
