import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../src/theme/theme';
import {
    formatDate,
    PurchasedItineraryItem,
} from '../../src/data/mockMyTrips';
import { getMyTrips } from '../../src/services/api';
import { Icon, IconName } from '../../src/components/common/Icons';

// ─── Constants ──────────────────────────────────────────

const TRAVELER_ID = 'trav-diego'; // Hardcoded until auth is implemented

// ─── Main Screen ────────────────────────────────────────

export default function MyTripsScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [itineraries, setItineraries] = useState<PurchasedItineraryItem[]>([]);

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        getMyTrips(TRAVELER_ID)
            .then((result) => {
                if (mounted) {
                    setItineraries(result.purchasedItineraries);
                    setLoading(false);
                }
            })
            .catch(() => {
                if (mounted) setLoading(false);
            });
        return () => { mounted = false; };
    }, []);

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Meus Roteiros</Text>
                <Text style={styles.headerSubtitle}>
                    Roteiros que você comprou
                </Text>
            </View>

            {/* Content */}
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {loading ? (
                    <View style={styles.loadingState}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                    </View>
                ) : (
                    <ItinerariesTab items={itineraries} />
                )}
                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

// ─── TAB: Meus Roteiros ─────────────────────────────────

function ItinerariesTab({ items }: { items: PurchasedItineraryItem[] }) {
    const router = useRouter();

    if (items.length === 0) {
        return (
            <View style={styles.emptyState}>
                <Icon name="book-open" size={48} color={theme.colors.text.tertiary} />
                <Text style={styles.emptyTitle}>Nenhum roteiro comprado ainda</Text>
                <Text style={styles.emptyText}>
                    Descubra roteiros criados por viajantes experientes.
                </Text>
                <TouchableOpacity
                    style={styles.emptyButton}
                    onPress={() => router.push('/(tabs)/index')}
                >
                    <Text style={styles.emptyButtonText}>Explorar roteiros</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <>
            {items.map((itin) => (
                <ItineraryCard key={itin.id} itin={itin} />
            ))}
        </>
    );
}

// ─── Itinerary Card ─────────────────────────────────────

function ItineraryCard({ itin }: { itin: PurchasedItineraryItem }) {
    const router = useRouter();

    return (
        <TouchableOpacity
            style={styles.itineraryCard}
            onPress={() => router.push(`/purchased-itinerary/${itin.id}`)}
            activeOpacity={0.7}
        >
            <View style={styles.itineraryLeft}>
                <Image source={{ uri: itin.image }} style={styles.itineraryImage} />
            </View>
            <View style={styles.itineraryContent}>
                <Text style={styles.itineraryTitle} numberOfLines={1}>
                    {itin.title}
                </Text>
                <Text style={styles.itineraryDestination} numberOfLines={1}>
                    {itin.destination}, {itin.country}
                </Text>
                <View style={styles.itineraryCreatorRow}>
                    <Icon name="circle-user" size={14} color={theme.colors.text.secondary} />
                    <Text style={styles.itineraryCreatorName}>{itin.creatorName}</Text>
                </View>
                <Text style={styles.itineraryPurchaseDate}>
                    Comprado em {formatDate(itin.purchaseDate)}
                </Text>
            </View>
            <View style={styles.itineraryAction}>
                <Icon name="chevron-right" size={20} color={theme.colors.text.tertiary} />
            </View>
        </TouchableOpacity>
    );
}

// ─── Styles ─────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },

    // Header
    header: {
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 16,
        backgroundColor: theme.colors.background,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: theme.colors.text.tertiary,
    },

    // Content
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 16,
    },

    // Loading
    loadingState: {
        paddingVertical: 80,
        alignItems: 'center',
    },

    // Itinerary Card
    itineraryCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
        borderRadius: 14,
        marginBottom: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        ...theme.shadows.xs,
    },
    itineraryLeft: {
        marginRight: 12,
    },
    itineraryImage: {
        width: 60,
        height: 60,
        borderRadius: 10,
        backgroundColor: theme.colors.surfaceLight,
    },
    itineraryContent: {
        flex: 1,
        gap: 2,
    },
    itineraryTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    itineraryDestination: {
        fontSize: 12,
        color: theme.colors.text.secondary,
    },
    itineraryCreatorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 2,
    },
    itineraryCreatorName: {
        fontSize: 11,
        color: theme.colors.text.tertiary,
        fontWeight: '500',
    },
    itineraryPurchaseDate: {
        fontSize: 10,
        color: theme.colors.text.tertiary,
    },
    itineraryAction: {
        paddingLeft: 8,
    },

    // Empty State
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginTop: 16,
        marginBottom: 8,
        textAlign: 'center',
    },
    emptyText: {
        fontSize: 14,
        color: theme.colors.text.tertiary,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    emptyButton: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 28,
        paddingVertical: 14,
        borderRadius: 100,
        ...theme.shadows.button,
    },
    emptyButtonText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFF',
    },
});
