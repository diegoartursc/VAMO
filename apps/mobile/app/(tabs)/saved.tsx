import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../src/theme/theme';
import { Icon, IconName } from '../../src/components/common/Icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function SavedScreen() {
    const router = useRouter();

    // Mock saved itineraries
    const savedItineraries = [
        {
            id: '1',
            title: 'Paris Econômica - 10 dias por R$ 6.000',
            destination: 'Paris, França',
            creator: 'Diego Artur',
            image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=300&fit=crop',
        },
        {
            id: '2',
            title: 'Tóquio Completo - Guia Definitivo',
            destination: 'Tóquio, Japão',
            creator: 'Mariana Costa',
            image: 'https://images.unsplash.com/photo-1540959375944-7049f642e9cc?w=400&h=300&fit=crop',
        },
    ];

    if (savedItineraries.length === 0) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Favoritos</Text>
                    <Text style={styles.headerSubtitle}>
                        Seus roteiros salvos
                    </Text>
                </View>

                <View style={styles.emptyState}>
                    <Icon name="heart" size={48} color={theme.colors.text.tertiary} />
                    <Text style={styles.emptyTitle}>Nenhum favorito ainda</Text>
                    <Text style={styles.emptyText}>
                        Salve roteiros para acessá-los aqui
                    </Text>
                    <TouchableOpacity
                        style={styles.exploreCta}
                        onPress={() => router.push('/(tabs)/index')}
                    >
                        <Text style={styles.exploreCTAText}>Explorar roteiros →</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Favoritos</Text>
                <Text style={styles.headerSubtitle}>
                    {savedItineraries.length} roteiros salvos
                </Text>
            </View>

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {savedItineraries.map((itinerary) => (
                    <TouchableOpacity
                        key={itinerary.id}
                        style={styles.card}
                        onPress={() => router.push(`/itinerary/${itinerary.id}`)}
                        activeOpacity={0.7}
                    >
                        <View
                            style={[
                                styles.cardImage,
                                { backgroundColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center' }
                            ]}
                        >
                            {!itinerary.image && (
                                <Icon name="location" size={32} color={theme.colors.text.tertiary} />
                            )}
                        </View>
                        <View style={styles.cardContent}>
                            <Text style={styles.cardTitle} numberOfLines={2}>
                                {itinerary.title}
                            </Text>
                            <Text style={styles.cardDestination} numberOfLines={1}>
                                {itinerary.destination}
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
                                <Icon name="circle-user" size={12} color={theme.colors.text.tertiary} />
                                <Text style={styles.cardCreator} numberOfLines={1}>
                                    {itinerary.creator}
                                </Text>
                            </View>
                        </View>
                        <Icon name="chevron-right" size={18} color={theme.colors.text.tertiary} />
                    </TouchableOpacity>
                ))}
                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
        paddingTop: 12,
    },
    header: {
        paddingHorizontal: theme.spacing.lg,
        paddingBottom: theme.spacing.md,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: theme.colors.text.secondary,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: theme.spacing.lg,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 12,
        paddingHorizontal: 12,
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.border,
        marginBottom: 12,
    },
    cardImage: {
        width: 60,
        height: 60,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardContent: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    cardDestination: {
        fontSize: 12,
        color: theme.colors.text.secondary,
        marginTop: 2,
    },
    cardCreator: {
        fontSize: 11,
        color: theme.colors.text.tertiary,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.text.primary,
        marginTop: theme.spacing.md,
    },
    emptyText: {
        fontSize: 14,
        color: theme.colors.text.secondary,
        marginTop: 8,
        textAlign: 'center',
    },
    exploreCta: {
        marginTop: theme.spacing.lg,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        backgroundColor: theme.colors.primary,
        borderRadius: 8,
    },
    exploreCTAText: {
        color: '#fff',
        fontWeight: '600',
        textAlign: 'center',
    },
});
