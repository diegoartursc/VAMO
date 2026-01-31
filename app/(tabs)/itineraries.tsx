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
                        Compre roteiros de quem já viajou
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

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Featured Creators Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🌟 Criadores em Destaque</Text>
                    <Text style={styles.sectionSubtitle}>
                        Viajantes verificados com excelentes avaliações
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

                {/* Verification Levels Explanation */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🏅 Níveis de Verificação</Text>
                    <Text style={styles.sectionSubtitle}>
                        Diferente de outras plataformas, aqui os criadores são certificados
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

                {/* Price Comparison Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>💰 Compare e Economize</Text>
                    <Text style={styles.sectionSubtitle}>
                        Veja quanto você economiza viajando com nossos roteiros
                    </Text>

                    <TouchableOpacity
                        style={styles.toggleButton}
                        onPress={() => setShowComparison(!showComparison)}
                    >
                        <Text style={styles.toggleButtonText}>
                            {showComparison ? 'Ocultar comparativo' : 'Ver exemplo de economia →'}
                        </Text>
                    </TouchableOpacity>

                    {showComparison && (
                        <View style={{ marginTop: theme.spacing.md }}>
                            <PriceComparison
                                agencyName="Pacote CVC"
                                agencyPrice={{
                                    flight: 2500,
                                    hotel: 1800,
                                    tours: 700,
                                    transfer: 300,
                                }}
                                creatorName="Roteiro Diego"
                                creatorPrice={{
                                    flight: 2500,
                                    hotel: 900,
                                    tours: 200,
                                    transfer: 0,
                                }}
                                itineraryPrice={49}
                            />
                        </View>
                    )}
                </View>

                {/* Example Itinerary Card */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📋 Exemplo de Roteiro</Text>

                    <View style={styles.itineraryCard}>
                        <Image
                            source={{ uri: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400' }}
                            style={styles.itineraryImage}
                            resizeMode="cover"
                        />

                        {/* Badge overlay */}
                        <View style={styles.cardBadge}>
                            <VerifiedBadge level="ambassador" size="small" />
                        </View>

                        <View style={styles.itineraryContent}>
                            <View style={styles.authorRow}>
                                <Text style={styles.authorAvatar}>👨‍✈️</Text>
                                <View style={styles.authorInfo}>
                                    <View style={styles.authorNameRow}>
                                        <Text style={styles.authorName}>Diego Artur</Text>
                                        <VerifiedBadge level="ambassador" size="small" showLabel={false} />
                                    </View>
                                    <Text style={styles.authorStats}>
                                        ⭐ 4.9 • 1.234 vendas
                                    </Text>
                                </View>
                            </View>

                            <Text style={styles.itineraryTitle}>
                                Paris Econômica - 10 dias por R$ 6.000
                            </Text>

                            <Text style={styles.itineraryDescription}>
                                Roteiro completo com planilha de gastos, hospedagens baratas, restaurantes locais e atrações gratuitas.
                            </Text>

                            {/* Inclusions */}
                            <View style={styles.inclusions}>
                                <View style={styles.inclusion}>
                                    <Text style={styles.inclusionText}>📋 Planilha</Text>
                                </View>
                                <View style={styles.inclusion}>
                                    <Text style={styles.inclusionText}>🗺️ Mapa</Text>
                                </View>
                                <View style={styles.inclusion}>
                                    <Text style={styles.inclusionText}>💬 Suporte</Text>
                                </View>
                            </View>

                            <View style={styles.itineraryFooter}>
                                <View>
                                    <Text style={styles.priceLabel}>Roteiro completo</Text>
                                    <Text style={styles.price}>R$ 49,90</Text>
                                </View>
                                <TouchableOpacity
                                    style={styles.buyButton}
                                    onPress={() => Alert.alert(
                                        '💳 Comprar Roteiro',
                                        'Este roteiro custa R$ 49,90. Deseja prosseguir para o pagamento?',
                                        [
                                            { text: 'Cancelar', style: 'cancel' },
                                            { text: 'Comprar', onPress: () => Alert.alert('Sucesso! ✅', 'Compra realizada com sucesso! O roteiro foi enviado para seu email.') }
                                        ]
                                    )}
                                >
                                    <Text style={styles.buyButtonText}>Comprar Roteiro</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Community Chats */}
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

                {/* CTA Section */}
                <View style={styles.section}>
                    <View style={styles.ctaCard}>
                        <Text style={styles.ctaIcon}>✍️</Text>
                        <Text style={styles.ctaTitle}>Quer vender seus roteiros?</Text>
                        <Text style={styles.ctaText}>
                            Transforme suas experiências de viagem em renda extra. Compartilhe seus roteiros e ajude outros viajantes!
                        </Text>
                        <TouchableOpacity
                            style={styles.ctaButton}
                            onPress={() => router.push('/(tabs)/profile')}
                        >
                            <Text style={styles.ctaButtonText}>Cadastre-se como Criador</Text>
                        </TouchableOpacity>
                    </View>
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
    ctaCard: {
        backgroundColor: theme.colors.background,
        padding: theme.spacing.lg,
        borderRadius: theme.borderRadius.lg,
        alignItems: 'center',
        ...theme.shadows.medium,
    },
    ctaIcon: {
        fontSize: 48,
        marginBottom: theme.spacing.md,
    },
    ctaTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.sm,
        textAlign: 'center',
    },
    ctaText: {
        fontSize: 14,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        marginBottom: theme.spacing.lg,
        lineHeight: 20,
    },
    ctaButton: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: theme.spacing.xl,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.borderRadius.full,
    },
    ctaButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text.inverse,
    },
});
