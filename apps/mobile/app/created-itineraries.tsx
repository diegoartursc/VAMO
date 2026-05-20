import React from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Platform, StatusBar, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../src/theme/theme';
import { Icon } from '../src/components/common/Icons';
import { mockItineraries, Itinerary } from '../src/data/mockItineraries';

// Mock: roteiros criados pelo usuário atual (creator.id === 'diego')
const MY_CREATOR_ID = 'diego';
const createdItineraries = mockItineraries.filter(
    (it) => it.creator.id === MY_CREATOR_ID
);

export default function CreatedItinerariesScreen() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Icon name="chevron-left" size={24} color={theme.colors.text.primary} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>Roteiros Criados</Text>
                    <Text style={styles.headerSubtitle}>
                        {createdItineraries.length}{' '}
                        {createdItineraries.length === 1 ? 'roteiro publicado' : 'roteiros publicados'}
                    </Text>
                </View>
                <View style={styles.headerRight} />
            </View>

            {createdItineraries.length === 0 ? (
                <View style={styles.emptyState}>
                    <Icon name="edit" size={48} color={theme.colors.text.tertiary} />
                    <Text style={styles.emptyTitle}>Nenhum roteiro criado</Text>
                    <Text style={styles.emptyText}>
                        Crie seu primeiro roteiro e compartilhe com viajantes do mundo todo
                    </Text>
                    <TouchableOpacity
                        style={styles.ctaButton}
                        onPress={() => router.back()}
                    >
                        <Text style={styles.ctaButtonText}>Começar a criar →</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {createdItineraries.map((item) => (
                        <CreatedItineraryCard
                            key={item.id}
                            item={item}
                            onPress={() => router.push(`/itinerary/${item.id}`)}
                        />
                    ))}
                    <View style={{ height: 40 }} />
                </ScrollView>
            )}
        </View>
    );
}

function CreatedItineraryCard({
    item,
    onPress,
}: {
    item: Itinerary;
    onPress: () => void;
}) {
    const coverImage = item.images?.[0];

    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
            {/* Cover image */}
            <View style={styles.imageWrapper}>
                {coverImage ? (
                    <Image
                        source={{ uri: coverImage }}
                        style={styles.cardImage}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={[styles.cardImage, styles.imagePlaceholder]}>
                        <Icon name="image" size={32} color={theme.colors.text.tertiary} />
                    </View>
                )}

                {/* Price badge */}
                <View style={styles.priceBadge}>
                    <Text style={styles.priceText}>
                        R$ {item.price.toFixed(2).replace('.', ',')}
                    </Text>
                </View>
            </View>

            {/* Content */}
            <View style={styles.cardContent}>
                <Text style={styles.cardTitle} numberOfLines={2}>
                    {item.title}
                </Text>

                <View style={styles.cardMeta}>
                    <Icon name="location" size={12} color={theme.colors.text.tertiary} />
                    <Text style={styles.cardDestination} numberOfLines={1}>
                        {item.destination}, {item.country}
                    </Text>
                </View>

                <View style={styles.cardStats}>
                    <View style={styles.statPill}>
                        <Icon name="star" size={12} color={theme.colors.primary} />
                        <Text style={styles.statText}>{item.rating.toFixed(1)}</Text>
                    </View>
                    <View style={styles.statPill}>
                        <Icon name="users" size={12} color={theme.colors.text.tertiary} />
                        <Text style={styles.statText}>{item.creator.salesCount} vendas</Text>
                    </View>
                    <View style={styles.statPill}>
                        <Icon name="calendar" size={12} color={theme.colors.text.tertiary} />
                        <Text style={styles.statText}>{item.duration} dias</Text>
                    </View>
                </View>
            </View>

            <Icon name="chevron-right" size={18} color={theme.colors.text.tertiary} />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
        paddingTop: Platform.OS === 'ios' ? 56 : (StatusBar.currentHeight ?? 24) + 8,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.md,
        paddingBottom: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    headerRight: {
        width: 40,
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: theme.colors.text.primary,
    },
    headerSubtitle: {
        fontSize: 12,
        color: theme.colors.text.secondary,
        marginTop: 2,
    },
    scrollContent: {
        paddingHorizontal: theme.spacing.lg,
        paddingTop: theme.spacing.md,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: theme.colors.surface,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: theme.colors.border,
        marginBottom: 12,
        padding: 12,
        overflow: 'hidden',
    },
    imageWrapper: {
        position: 'relative',
    },
    cardImage: {
        width: 72,
        height: 72,
        borderRadius: 10,
    },
    imagePlaceholder: {
        backgroundColor: theme.colors.surfaceLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    priceBadge: {
        position: 'absolute',
        bottom: 4,
        left: 4,
        backgroundColor: 'rgba(0,0,0,0.65)',
        borderRadius: 6,
        paddingHorizontal: 5,
        paddingVertical: 2,
    },
    priceText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#fff',
    },
    cardContent: {
        flex: 1,
        gap: 4,
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text.primary,
        lineHeight: 19,
    },
    cardMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    cardDestination: {
        fontSize: 12,
        color: theme.colors.text.secondary,
    },
    cardStats: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 2,
    },
    statPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    statText: {
        fontSize: 11,
        color: theme.colors.text.tertiary,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.xl,
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
        lineHeight: 20,
    },
    ctaButton: {
        marginTop: theme.spacing.lg,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        backgroundColor: theme.colors.primary,
        borderRadius: 10,
    },
    ctaButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
});
