import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
} from 'react-native';
import { theme } from '../../src/theme/theme';
import { PressableCard } from '../../src/components/common/PressableCard';
import { useRouter } from 'expo-router';

type TripStatus = 'agendados-realizados' | 'salvos';

interface Trip {
    id: string;
    title: string;
    destination: string;
    image: string;
    date?: string;
    price?: number;
    status: TripStatus;
}

const MOCK_TRIPS: Trip[] = [
    {
        id: '1',
        title: 'Paris Romântica',
        destination: 'Paris, França',
        image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800',
        date: 'Junho 2025',
        status: 'agendados-realizados',
    },
    {
        id: '2',
        title: 'Caribe All Inclusive',
        destination: 'Cancún, México',
        image: 'https://images.unsplash.com/photo-1568402102990-bc541580b59f?w=800',
        date: 'Março 2025',
        status: 'agendados-realizados',
    },
    {
        id: '3',
        title: 'Europa Clássica',
        destination: 'Multi-destinos',
        image: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=800',
        price: 15000,
        status: 'salvos',
    },
    {
        id: '4',
        title: 'Dubai Luxo',
        destination: 'Dubai, EAU',
        image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800',
        price: 9500,
        status: 'salvos',
    },
    {
        id: '5',
        title: 'Machu Picchu',
        destination: 'Cusco, Peru',
        image: 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=800',
        price: 5500,
        status: 'salvos',
    },
];

export default function MyTripsScreen() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TripStatus>('agendados-realizados');

    const filteredTrips = MOCK_TRIPS.filter(trip => trip.status === activeTab);

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Minhas Viagens</Text>
                <Text style={styles.headerSubtitle}>
                    Gerencie suas viagens realizadas e salvas
                </Text>
            </View>

            {/* Tab Selector */}
            <View style={styles.tabSelector}>
                <TouchableOpacity
                    style={[
                        styles.tab,
                        activeTab === 'agendados-realizados' && styles.tabActive,
                    ]}
                    onPress={() => setActiveTab('agendados-realizados')}
                >
                    <Text
                        style={[
                            styles.tabText,
                            activeTab === 'agendados-realizados' && styles.tabTextActive,
                        ]}
                    >
                        Agendados / Realizados
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.tab,
                        activeTab === 'salvos' && styles.tabActive,
                    ]}
                    onPress={() => setActiveTab('salvos')}
                >
                    <Text
                        style={[
                            styles.tabText,
                            activeTab === 'salvos' && styles.tabTextActive,
                        ]}
                    >
                        ❤️ Salvos
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {filteredTrips.length > 0 ? (
                    filteredTrips.map(trip => (
                        <TripCard
                            key={trip.id}
                            trip={trip}
                            onPress={() => router.push(`/package/${trip.id}`)}
                        />
                    ))
                ) : (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyIcon}>
                            {activeTab === 'agendados-realizados' ? '✈️' : '❤️'}
                        </Text>
                        <Text style={styles.emptyTitle}>
                            {activeTab === 'agendados-realizados'
                                ? 'Nenhuma viagem agendada'
                                : 'Nenhuma viagem salva'}
                        </Text>
                        <Text style={styles.emptyText}>
                            {activeTab === 'agendados-realizados'
                                ? 'Suas próximas aventuras aparecerão aqui!'
                                : 'Explore nossos pacotes e salve suas viagens favoritas'}
                        </Text>
                        <TouchableOpacity
                            style={styles.emptyButton}
                            onPress={() => router.push('/(tabs)/packages')}
                        >
                            <Text style={styles.emptyButtonText}>
                                Explorar Pacotes
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

function TripCard({ trip, onPress }: { trip: Trip; onPress: () => void }) {
    return (
        <PressableCard onPress={onPress} style={styles.tripCard}>
            <Image
                source={{ uri: trip.image }}
                style={styles.tripImage}
                resizeMode="cover"
            />
            <View style={styles.tripInfo}>
                <Text style={styles.tripTitle} numberOfLines={1}>
                    {trip.title}
                </Text>
                <Text style={styles.tripDestination} numberOfLines={1}>
                    {trip.destination}
                </Text>
                {trip.date && (
                    <View style={styles.tripMeta}>
                        <Text style={styles.tripDate}>📅 {trip.date}</Text>
                    </View>
                )}
                {trip.price && (
                    <View style={styles.tripMeta}>
                        <Text style={styles.tripPrice}>
                            R$ {trip.price.toLocaleString()}
                        </Text>
                    </View>
                )}
            </View>
        </PressableCard>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        backgroundColor: theme.colors.background,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
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

    // Tab Selector
    tabSelector: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 16,
        gap: 12,
        backgroundColor: theme.colors.background,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: theme.borderRadius.full,
        backgroundColor: theme.colors.surfaceLight,
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: 'transparent',
    },
    tabActive: {
        backgroundColor: theme.colors.primaryLight,
        borderColor: theme.colors.primary,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text.secondary,
    },
    tabTextActive: {
        color: theme.colors.primary,
    },

    // Content
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 8,
    },

    // Trip Card
    tripCard: {
        flexDirection: 'row',
        backgroundColor: theme.colors.background,
        borderRadius: theme.borderRadius.lg,
        marginBottom: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        ...theme.shadows.small,
    },
    tripImage: {
        width: 120,
        height: 120,
        backgroundColor: theme.colors.surfaceLight,
    },
    tripInfo: {
        flex: 1,
        padding: 16,
        justifyContent: 'center',
    },
    tripTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text.primary,
        marginBottom: 4,
    },
    tripDestination: {
        fontSize: 13,
        color: theme.colors.text.secondary,
        marginBottom: 8,
    },
    tripMeta: {
        marginTop: 4,
    },
    tripDate: {
        fontSize: 12,
        color: theme.colors.text.tertiary,
    },
    tripPrice: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.primary,
    },

    // Empty State
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
        paddingHorizontal: 40,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.colors.text.primary,
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
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: theme.borderRadius.full,
        ...theme.shadows.button,
    },
    emptyButtonText: {
        fontSize: 15,
        fontWeight: '700',
        color: theme.colors.text.onPrimary,
    },
});
