import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Platform, StatusBar, Dimensions, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { theme } from '../src/theme/theme';
import { haptics } from '../src/services/haptics';
import { mockCreatorDashboard, CreatorDashboardItinerary } from '../src/data/mockCreatorDashboard';

const { width } = Dimensions.get('window');

export default function CreatorDashboardScreen() {
    const router = useRouter();
    const data = mockCreatorDashboard;

    const handleEditItinerary = (id: string) => {
        haptics.light();
        router.push(`/edit-itinerary/${id}` as any);
    };

    const handleNewItinerary = () => {
        haptics.success();
        router.push('/edit-itinerary/new' as any);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* ═══ GRADIENT HEADER ═══ */}
                <LinearGradient
                    colors={[theme.colors.gradientTop, theme.colors.gradientBottom]}
                    style={styles.header}
                >
                    <TouchableOpacity
                        style={styles.backBtn}
                        onPress={() => router.back()}
                    >
                        <Ionicons name="arrow-back" size={22} color="#fff" />
                    </TouchableOpacity>

                    <Text style={styles.headerTitle}>Minha Loja</Text>

                    {/* Creator Info */}
                    <View style={styles.creatorRow}>
                        <View style={styles.avatarCircle}>
                            <Text style={styles.avatarEmoji}>{data.creatorAvatar}</Text>
                        </View>
                        <View>
                            <Text style={styles.creatorName}>{data.creatorName}</Text>
                            <Text style={styles.creatorSubtitle}>
                                Criador de Roteiros • 💎 Embaixador
                            </Text>
                        </View>
                    </View>
                </LinearGradient>

                {/* ═══ REVENUE STATS ═══ */}
                <View style={styles.statsGrid}>
                    <View style={styles.statCardPrimary}>
                        <Text style={styles.statEmoji}>💰</Text>
                        <Text style={styles.statPrimaryValue}>
                            R$ {data.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </Text>
                        <Text style={styles.statPrimaryLabel}>Receita Total</Text>
                    </View>
                    <View style={styles.statsRowSmall}>
                        <View style={styles.statCardSmall}>
                            <Text style={styles.statSmallEmoji}>🛒</Text>
                            <Text style={styles.statSmallValue}>{data.totalSales.toLocaleString('pt-BR')}</Text>
                            <Text style={styles.statSmallLabel}>Vendas</Text>
                        </View>
                        <View style={styles.statCardSmall}>
                            <Text style={styles.statSmallEmoji}>⭐</Text>
                            <Text style={styles.statSmallValue}>{data.averageRating}</Text>
                            <Text style={styles.statSmallLabel}>Nota Média</Text>
                        </View>
                        <View style={styles.statCardSmall}>
                            <Text style={styles.statSmallEmoji}>📚</Text>
                            <Text style={styles.statSmallValue}>{data.itineraries.length}</Text>
                            <Text style={styles.statSmallLabel}>Roteiros</Text>
                        </View>
                    </View>
                </View>

                {/* ═══ MY ITINERARIES ═══ */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Meus Roteiros</Text>
                    </View>

                    {data.itineraries.map((item) => (
                        <ItineraryCard
                            key={item.itinerary.id}
                            item={item}
                            onPress={() => handleEditItinerary(item.itinerary.id)}
                        />
                    ))}
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* ═══ FAB - NOVO ROTEIRO ═══ */}
            <TouchableOpacity
                style={styles.fab}
                onPress={handleNewItinerary}
                activeOpacity={0.85}
            >
                <LinearGradient
                    colors={[theme.colors.primary, theme.colors.secondary]}
                    style={styles.fabGradient}
                >
                    <Ionicons name="add" size={26} color="#fff" />
                    <Text style={styles.fabText}>Novo Roteiro</Text>
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );
}

function ItineraryCard({
    item,
    onPress,
}: {
    item: CreatorDashboardItinerary;
    onPress: () => void;
}) {
    const { itinerary, stats, status } = item;

    const statusConfig = {
        published: { label: 'Publicado', color: theme.colors.success, icon: 'checkmark-circle' as const },
        draft: { label: 'Rascunho', color: theme.colors.warning, icon: 'create-outline' as const },
        paused: { label: 'Pausado', color: theme.colors.text.tertiary, icon: 'pause-circle' as const },
    };

    const st = statusConfig[status];

    return (
        <TouchableOpacity
            style={styles.itineraryCard}
            onPress={onPress}
            activeOpacity={0.7}
        >
            {/* Image + Status */}
            <View style={styles.cardImageContainer}>
                {itinerary.images.length > 0 ? (
                    <Image source={{ uri: itinerary.images[0] }} style={styles.cardImage} />
                ) : (
                    <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
                        <Ionicons name="image-outline" size={32} color={theme.colors.text.tertiary} />
                    </View>
                )}
                <View style={[styles.statusChip, { backgroundColor: st.color + '20' }]}>
                    <Ionicons name={st.icon} size={12} color={st.color} />
                    <Text style={[styles.statusChipText, { color: st.color }]}>{st.label}</Text>
                </View>
            </View>

            {/* Info */}
            <View style={styles.cardContent}>
                <Text style={styles.cardTitle} numberOfLines={2}>{itinerary.title}</Text>
                <Text style={styles.cardLocation}>
                    📍 {itinerary.destination}, {itinerary.country} • {itinerary.duration} dias
                </Text>

                {/* Stats Row */}
                <View style={styles.cardStatsRow}>
                    <View style={styles.cardStat}>
                        <Text style={styles.cardStatValue}>R$ {itinerary.price.toFixed(2).replace('.', ',')}</Text>
                        <Text style={styles.cardStatLabel}>Preço</Text>
                    </View>
                    <View style={styles.cardStatDivider} />
                    <View style={styles.cardStat}>
                        <Text style={styles.cardStatValue}>{stats.totalSales}</Text>
                        <Text style={styles.cardStatLabel}>Vendas</Text>
                    </View>
                    <View style={styles.cardStatDivider} />
                    <View style={styles.cardStat}>
                        <Text style={styles.cardStatValue}>
                            R$ {stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </Text>
                        <Text style={styles.cardStatLabel}>Receita</Text>
                    </View>
                    <View style={styles.cardStatDivider} />
                    <View style={styles.cardStat}>
                        <Text style={styles.cardStatValue}>⭐ {stats.averageRating}</Text>
                        <Text style={styles.cardStatLabel}>{stats.reviewCount} avaliações</Text>
                    </View>
                </View>
            </View>

            {/* Edit Arrow */}
            <View style={styles.editArrow}>
                <Ionicons name="create-outline" size={18} color={theme.colors.primary} />
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.surface,
    },

    // Header
    header: {
        paddingTop: Platform.OS === 'ios' ? 56 : 40,
        paddingBottom: 24,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
    },
    backBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 16,
    },
    creatorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatarCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.25)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    avatarEmoji: {
        fontSize: 24,
    },
    creatorName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
    creatorSubtitle: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.75)',
        marginTop: 2,
    },

    // Revenue Stats
    statsGrid: {
        paddingHorizontal: 20,
        marginTop: -10,
        gap: 10,
    },
    statCardPrimary: {
        backgroundColor: theme.colors.background,
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        ...theme.shadows.medium,
    },
    statEmoji: {
        fontSize: 28,
        marginBottom: 4,
    },
    statPrimaryValue: {
        fontSize: 26,
        fontWeight: '800',
        color: theme.colors.success,
    },
    statPrimaryLabel: {
        fontSize: 13,
        color: theme.colors.text.secondary,
        fontWeight: '500',
        marginTop: 2,
    },
    statsRowSmall: {
        flexDirection: 'row',
        gap: 10,
    },
    statCardSmall: {
        flex: 1,
        backgroundColor: theme.colors.background,
        borderRadius: 14,
        padding: 14,
        alignItems: 'center',
        ...theme.shadows.small,
    },
    statSmallEmoji: {
        fontSize: 20,
        marginBottom: 4,
    },
    statSmallValue: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.text.primary,
    },
    statSmallLabel: {
        fontSize: 11,
        color: theme.colors.text.secondary,
        marginTop: 2,
    },

    // Section
    section: {
        paddingHorizontal: 20,
        marginTop: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.text.primary,
    },

    // Itinerary Card
    itineraryCard: {
        backgroundColor: theme.colors.background,
        borderRadius: 16,
        marginBottom: 14,
        overflow: 'hidden',
        ...theme.shadows.small,
    },
    cardImageContainer: {
        position: 'relative',
        height: 140,
    },
    cardImage: {
        width: '100%',
        height: '100%',
    },
    cardImagePlaceholder: {
        backgroundColor: theme.colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statusChip: {
        position: 'absolute',
        top: 10,
        right: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
    },
    statusChipText: {
        fontSize: 11,
        fontWeight: '700',
    },
    cardContent: {
        padding: 14,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: 4,
    },
    cardLocation: {
        fontSize: 13,
        color: theme.colors.text.secondary,
        marginBottom: 12,
    },
    cardStatsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: theme.colors.surface,
        borderRadius: 10,
        padding: 10,
    },
    cardStat: {
        alignItems: 'center',
        flex: 1,
    },
    cardStatValue: {
        fontSize: 13,
        fontWeight: '700',
        color: theme.colors.text.primary,
    },
    cardStatLabel: {
        fontSize: 10,
        color: theme.colors.text.tertiary,
        marginTop: 2,
    },
    cardStatDivider: {
        width: 1,
        height: 24,
        backgroundColor: theme.colors.borderLight,
    },
    editArrow: {
        position: 'absolute',
        bottom: 18,
        right: 14,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: theme.colors.primary + '15',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // FAB
    fab: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 34 : 20,
        right: 20,
        borderRadius: 28,
        ...theme.shadows.button,
    },
    fabGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 22,
        paddingVertical: 14,
        borderRadius: 28,
    },
    fabText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#fff',
    },
});
