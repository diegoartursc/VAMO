import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../src/theme/theme';
import { VerifiedBadge } from '../../src/components/creator/VerifiedBadge';
import { CreatorCard } from '../../src/components/creator/CreatorCard';
import { PriceComparison } from '../../src/components/comparison/PriceComparison';
import { DestinationChats } from '../../src/components/community/DestinationChats';
import { mockCreators, getFeaturedCreators } from '../../src/data/mockCreators';
import { VERIFICATION_CONFIGS } from '../../src/types/creator';
import { Alert } from 'react-native';
import { IconicSearchBar } from '../../src/components/search/IconicSearchBar';
import { SearchModal } from '../../src/components/search/SearchModal';
import { useSearch } from '../../src/hooks/useSearch';
import { CTACarousel } from '../../src/components/home/CTACarousel';
import { getFeaturedItineraries } from '../../src/data/mockItineraries';
import { CATEGORIES } from '../../src/constants/categories';

export default function ItinerariesScreen() {
    const router = useRouter();
    const { filters, applyFilters } = useSearch();
    const [searchModalVisible, setSearchModalVisible] = useState(false);
    const [showComparison, setShowComparison] = useState(false);
    const featuredCreators = getFeaturedCreators();

    return (
        <View style={styles.container}>
            {/* Header with Gradient */}
            <LinearGradient
                colors={[theme.colors.gradientTop, theme.colors.gradientBottom]}
                style={styles.gradientHeader}
            >
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>Roteiros de Viajantes</Text>
                    <Text style={styles.headerSubtitle}>
                        Roteiros testados por viajantes reais
                    </Text>
                </View>
            </LinearGradient>

            {/* Iconic Search Bar */}
            <View style={styles.searchWrapper}>
                <IconicSearchBar
                    placeholder="Encontrar roteiros de viajantes"
                    onPress={() => setSearchModalVisible(true)}
                />
            </View>

            {/* Categories Section */}
            <View style={styles.categoriesSection}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoriesScroll}
                >
                    {CATEGORIES.map((cat) => (
                        <TouchableOpacity
                            key={cat.id}
                            style={styles.categoryPill}
                            onPress={() => router.push(`/(tabs)/itineraries?category=${cat.id}`)}
                        >
                            <Text style={styles.categoryIcon}>{cat.icon}</Text>
                            <Text style={styles.categoryLabel}>{cat.label}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* 1️⃣ Featured Itineraries - PRIORITY */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Roteiros mais escolhidos pela comunidade</Text>

                    {getFeaturedItineraries().map((itinerary) => (
                        <View key={itinerary.id} style={[styles.itineraryCard, { marginBottom: 16 }]}>
                            <Image
                                source={{ uri: itinerary.images[0] }}
                                style={styles.itineraryImage}
                                resizeMode="cover"
                            />

                            {/* Badge overlay */}
                            <View style={styles.cardBadge}>
                                <VerifiedBadge level={itinerary.creator.verificationLevel} size="small" />
                            </View>

                            <View style={styles.itineraryContent}>
                                <View style={styles.authorRow}>
                                    <Text style={styles.authorAvatar}>{itinerary.creator.avatar}</Text>
                                    <View style={styles.authorInfo}>
                                        <View style={styles.authorNameRow}>
                                            <Text style={styles.authorName}>{itinerary.creator.name}</Text>
                                            <VerifiedBadge level={itinerary.creator.verificationLevel} size="small" showLabel={false} />
                                        </View>
                                        <Text style={styles.authorStats}>
                                            ⭐ {itinerary.creator.rating} • {itinerary.creator.salesCount.toLocaleString('pt-BR')} vendas
                                        </Text>
                                    </View>
                                </View>

                                <Text style={styles.itineraryTitle}>
                                    {itinerary.title}
                                </Text>

                                <Text style={styles.itineraryDescription}>
                                    {itinerary.description}
                                </Text>

                                {/* Inclusions */}
                                <View style={styles.inclusions}>
                                    {itinerary.inclusions.map((inclusion, idx) => (
                                        <View key={idx} style={styles.inclusion}>
                                            <Text style={styles.inclusionText}>
                                                {inclusion === 'Planilha' ? '📋' : inclusion === 'Mapa' ? '🗺️' : inclusion === 'Suporte' ? '💬' : '📱'} {inclusion}
                                            </Text>
                                        </View>
                                    ))}
                                </View>

                                <View style={styles.itineraryFooter}>
                                    <View>
                                        <Text style={styles.priceLabel}>Roteiro completo</Text>
                                        <Text style={styles.price}>R$ {itinerary.price.toFixed(2).replace('.', ',')}</Text>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.buyButton}
                                        onPress={() => router.push(`/itinerary/${itinerary.id}`)}
                                    >
                                        <Text style={styles.buyButtonText}>Saiba mais</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    ))}
                </View>

                {/* 2️⃣ Featured Creators */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>⭐ Criadores recomendados pela comunidade</Text>
                    <Text style={styles.sectionSubtitle}>
                        Viajantes verificados com histórico comprovado
                    </Text>

                    {featuredCreators.slice(0, 2).map((creator) => (
                        <View key={creator.id} style={{ marginTop: theme.spacing.md }}>
                            <CreatorCard
                                creator={creator}
                                onPress={() => router.push(`/creator/${creator.id}`)}
                            />
                        </View>
                    ))}
                </View>

                {/* 3️⃣ Verification Levels */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🏅 Níveis de Verificação</Text>
                    <Text style={styles.sectionSubtitle}>
                        Aqui você sabe exatamente quem está por trás de cada roteiro
                    </Text>

                    <View style={styles.badgesGrid}>
                        {(['basic', 'trusted', 'expert', 'ambassador'] as const).map((level) => {
                            const config = VERIFICATION_CONFIGS[level];
                            return (
                                <View key={level} style={styles.badgeExplanation}>
                                    <VerifiedBadge level={level} size="large" />
                                    <Text style={styles.badgeDescription}>
                                        {config.description}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>
                </View>

                {/* 4️⃣ Community Chats */}
                <View style={styles.section}>
                    <DestinationChats
                        limit={3}
                        onChatPress={(chat) => Alert.alert(
                            `💬 ${chat.destination}`,
                            `Entrar no chat de ${chat.destination}? ${chat.membersCount} membros online.`,
                            [
                                { text: 'Cancelar', style: 'cancel' },
                                { text: 'Entrar', onPress: () => Alert.alert('Em breve!', 'Função de chat será implementada em breve.') }
                            ]
                        )}
                    />
                </View>

                {/* CTA Carousel - Auto-Play */}
                <View style={styles.section}>
                    <CTACarousel />
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
                }}
                context="itineraries"
                initialFilters={filters}
            />
        </View>
    );
}



const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.surface,
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
        marginBottom: theme.spacing.sm,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: theme.colors.text.inverse,
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: theme.colors.text.inverse,
        opacity: 0.9,
    },
    content: {
        flex: 1,
    },
    section: {
        padding: theme.spacing.md,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontSize: 14,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.md,
    },
    badgesGrid: {
        gap: theme.spacing.sm,
    },
    badgeExplanation: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
        backgroundColor: theme.colors.background,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
    },
    badgeDescription: {
        flex: 1,
        fontSize: 13,
        color: theme.colors.text.secondary,
    },
    toggleButton: {
        paddingVertical: theme.spacing.sm,
    },
    toggleButtonText: {
        fontSize: 15,
        color: theme.colors.primary,
        fontWeight: '500',
    },
    itineraryCard: {
        backgroundColor: theme.colors.background,
        borderRadius: theme.borderRadius.lg,
        overflow: 'hidden',
        ...theme.shadows.medium,
    },
    itineraryImage: {
        width: '100%',
        height: 180,
        backgroundColor: theme.colors.surface,
    },
    cardBadge: {
        position: 'absolute',
        top: theme.spacing.sm,
        right: theme.spacing.sm,
    },
    itineraryContent: {
        padding: theme.spacing.md,
    },
    authorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        marginBottom: theme.spacing.md,
    },
    authorAvatar: {
        fontSize: 36,
    },
    authorInfo: {
        flex: 1,
    },
    authorNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xs,
    },
    authorName: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    authorStats: {
        fontSize: 13,
        color: theme.colors.text.secondary,
        marginTop: 2,
    },
    itineraryTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.xs,
    },
    itineraryDescription: {
        fontSize: 14,
        color: theme.colors.text.secondary,
        lineHeight: 20,
        marginBottom: theme.spacing.md,
    },
    inclusions: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
        marginBottom: theme.spacing.md,
    },
    inclusion: {
        backgroundColor: theme.colors.surface,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: theme.borderRadius.sm,
    },
    inclusionText: {
        fontSize: 12,
        color: theme.colors.text.secondary,
    },
    itineraryFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    priceLabel: {
        fontSize: 12,
        color: theme.colors.text.secondary,
    },
    price: {
        fontSize: 22,
        fontWeight: '700',
        color: theme.colors.success,
    },
    buyButton: {
        backgroundColor: theme.colors.success,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.borderRadius.full,
    },
    buyButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text.inverse,
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
        backgroundColor: theme.colors.background,
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
    // CTA styles removed - using CTACarousel component
});
