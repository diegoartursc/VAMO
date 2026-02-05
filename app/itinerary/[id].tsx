import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    Dimensions,
    StatusBar,
    Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../src/theme/theme';
import { getItineraryById } from '../../src/data/mockItineraries';
import { getReviewsByPackageId, getAverageRating, getCategoryRatings, getCommunityPhotos } from '../../src/data/mockReviews';
import { Alert, Linking } from 'react-native';
import { VerifiedBadge } from '../../src/components/creator/VerifiedBadge';
import CollapsibleSection from '../../src/components/common/CollapsibleSection';
import PremiumReviewsSection from '../../src/components/reviews/PremiumReviewsSection';

const { width, height } = Dimensions.get('window');

export default function ItineraryDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const itinerary = getItineraryById(id);
    const reviews = getReviewsByPackageId(`itinerary-${id}`);

    if (!itinerary) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>Roteiro não encontrado</Text>
            </View>
        );
    }

    // Fixed CTA
    const [showBuyOptions, setShowBuyOptions] = useState(false);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Hero Image */}
                <View style={styles.heroContainer}>
                    <Image source={{ uri: itinerary.images[0] }} style={styles.heroImage} />

                    {/* Navigation Header with Blur */}
                    <BlurView intensity={80} tint="dark" style={styles.navBlur}>
                        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.shareButton}>
                            <Ionicons name="share-outline" size={24} color="#fff" />
                        </TouchableOpacity>
                    </BlurView>
                </View>

                {/* Content Sheet */}
                <View style={styles.contentSheet}>
                    {/* Creator Badge */}
                    <View style={styles.creatorRow}>
                        <View style={styles.creatorBadge}>
                            <Text style={styles.creatorAvatar}>{itinerary.creator.avatar}</Text>
                            <View>
                                <View style={styles.creatorNameRow}>
                                    <Text style={styles.creatorName}>{itinerary.creator.name}</Text>
                                    <VerifiedBadge level={itinerary.creator.verificationLevel} size="small" showLabel={false} />
                                </View>
                                <Text style={styles.creatorStats}>
                                    ⭐ {itinerary.creator.rating} • {itinerary.creator.salesCount.toLocaleString('pt-BR')} vendas
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Title & Location */}
                    <Text style={styles.title}>{itinerary.title}</Text>
                    <View style={styles.locationRow}>
                        <Ionicons name="location" size={16} color={theme.colors.primary} />
                        <Text style={styles.location}>
                            {itinerary.destination}, {itinerary.country}
                        </Text>
                    </View>

                    {/* Stats Row */}
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Ionicons name="star" size={18} color="#FFD700" />
                            <Text style={styles.statText}>{itinerary.rating}</Text>
                            <Text style={styles.statLabel}>({itinerary.reviewCount})</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Ionicons name="calendar-outline" size={18} color={theme.colors.primary} />
                            <Text style={styles.statText}>{itinerary.duration} dias</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Ionicons name="eye-outline" size={18} color={theme.colors.primary} />
                            <Text style={styles.statText}>Digital</Text>
                        </View>
                    </View>

                    {/* Price & CTA */}
                    <View style={styles.priceSection}>
                        <View>
                            <Text style={styles.priceLabel}>Roteiro completo</Text>
                            <View style={styles.priceRow}>
                                <Text style={styles.priceSymbol}>R$</Text>
                                <Text style={styles.priceValue}>{itinerary.price.toFixed(2).replace('.', ',')}</Text>
                            </View>
                            <Text style={styles.priceNote}>• Acesso imediato após compra</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.buyButton}
                            onPress={() => Alert.alert(
                                '💳 Comprar Roteiro',
                                `${itinerary.title}\n\nPreço: R$ ${itinerary.price.toFixed(2)}\n\nDeseja prosseguir para o pagamento?`,
                                [
                                    { text: 'Voltar', style: 'cancel' },
                                    { text: 'Comprar', onPress: () => Alert.alert('Sucesso!', 'Roteiro enviado para seu email.') }
                                ]
                            )}
                        >
                            <Text style={styles.buyButtonText}>Comprar Agora</Text>
                            <Ionicons name="arrow-forward" size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    {/* Sobre o Roteiro */}
                    <CollapsibleSection title="Sobre o Roteiro" defaultExpanded>
                        <Text style={styles.description}>{itinerary.description}</Text>
                    </CollapsibleSection>

                    {/* O que você vai receber */}
                    <CollapsibleSection title="O que você vai receber" defaultExpanded>
                        <Text style={styles.inclusionsIntro}>
                            Ao comprar este roteiro, você terá acesso a todas as informações necessárias para sua viagem:
                        </Text>

                        <View style={styles.inclusionsList}>
                            <View style={styles.inclusionItem}>
                                <View style={[styles.inclusionIcon, { backgroundColor: '#E3F2FD' }]}>
                                    <Ionicons name="airplane" size={24} color="#2196F3" />
                                </View>
                                <View style={styles.inclusionContent}>
                                    <Text style={styles.inclusionTitle}>Itinerário Completo</Text>
                                    <Text style={styles.inclusionDesc}>
                                        Voos recomendados, horários, companhias aéreas e dicas para economizar
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.inclusionItem}>
                                <View style={[styles.inclusionIcon, { backgroundColor: '#FFF3E0' }]}>
                                    <Ionicons name="bed" size={24} color="#FF9800" />
                                </View>
                                <View style={styles.inclusionContent}>
                                    <Text style={styles.inclusionTitle}>Hotéis & Hospedagens</Text>
                                    <Text style={styles.inclusionDesc}>
                                        Lista com os melhores lugares para se hospedar, faixa de preço e localização estratégica
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.inclusionItem}>
                                <View style={[styles.inclusionIcon, { backgroundColor: '#F3E5F5' }]}>
                                    <Ionicons name="map" size={24} color="#9C27B0" />
                                </View>
                                <View style={styles.inclusionContent}>
                                    <Text style={styles.inclusionTitle}>Passeios & Atrações</Text>
                                    <Text style={styles.inclusionDesc}>
                                        Todas as atrações imperdíveis, preços de ingressos e como evitar filas
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.inclusionItem}>
                                <View style={[styles.inclusionIcon, { backgroundColor: '#E8F5E9' }]}>
                                    <Ionicons name="car" size={24} color="#4CAF50" />
                                </View>
                                <View style={styles.inclusionContent}>
                                    <Text style={styles.inclusionTitle}>Locomoção</Text>
                                    <Text style={styles.inclusionDesc}>
                                        Como se locomover na cidade: metrô, ônibus, táxi, apps e passes de transporte
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.inclusionItem}>
                                <View style={[styles.inclusionIcon, { backgroundColor: '#FFF9C4' }]}>
                                    <Ionicons name="bulb" size={24} color="#F9A825" />
                                </View>
                                <View style={styles.inclusionContent}>
                                    <Text style={styles.inclusionTitle}>Dicas Exclusivas</Text>
                                    <Text style={styles.inclusionDesc}>
                                        Truques de quem já foi: melhores horários, segredos locais e como economizar
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.inclusionItem}>
                                <View style={[styles.inclusionIcon, { backgroundColor: '#FFEBEE' }]}>
                                    <Ionicons name="restaurant" size={24} color="#F44336" />
                                </View>
                                <View style={styles.inclusionContent}>
                                    <Text style={styles.inclusionTitle}>Restaurantes & Gastronomia</Text>
                                    <Text style={styles.inclusionDesc}>
                                        Onde comer bem, opções para todos os bolsos e pratos típicos que você não pode perder
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.inclusionItem}>
                                <View style={[styles.inclusionIcon, { backgroundColor: '#E0F2F1' }]}>
                                    <Ionicons name="chatbubbles" size={24} color="#009688" />
                                </View>
                                <View style={styles.inclusionContent}>
                                    <Text style={styles.inclusionTitle}>Suporte do Criador</Text>
                                    <Text style={styles.inclusionDesc}>
                                        Tire suas dúvidas diretamente com {itinerary.creator.name} via mensagem
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </CollapsibleSection>

                    {/* Contact Creator */}
                    <TouchableOpacity
                        style={styles.contactButton}
                        onPress={() => Alert.alert(
                            '💬 Contato',
                            `Deseja falar com ${itinerary.creator.name}?`,
                            [
                                { text: 'Cancelar', style: 'cancel' },
                                { text: 'Enviar mensagem' }
                            ]
                        )}
                    >
                        <Ionicons name="chatbubble-outline" size={20} color={theme.colors.primary} />
                        <Text style={styles.contactButtonText}>Falar com {itinerary.creator.name}</Text>
                    </TouchableOpacity>

                    {/* Premium Reviews Section */}
                    {reviews.length > 0 && (
                        <View style={styles.reviewsSection}>
                            <PremiumReviewsSection
                                reviews={reviews}
                                averageRating={getAverageRating(`itinerary-${id}`)}
                                totalReviews={reviews.length}
                                categoryRatings={getCategoryRatings(`itinerary-${id}`)}
                                communityPhotos={getCommunityPhotos(`itinerary-${id}`)}
                            />
                        </View>
                    )}

                    {/* Trust Info */}
                    <View style={styles.trustBox}>
                        <Ionicons name="shield-checkmark" size={24} color={theme.colors.verified} />
                        <View style={styles.trustContent}>
                            <Text style={styles.trustTitle}>Criador Verificado</Text>
                            <Text style={styles.trustText}>
                                {itinerary.creator.name} é um viajante verificado pelo VAMO com {itinerary.creator.salesCount}+ roteiros vendidos
                            </Text>
                        </View>
                    </View>

                    <View style={{ height: 100 }} />
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    scrollView: {
        flex: 1,
    },
    heroContainer: {
        height: 400,
        position: 'relative',
    },
    heroImage: {
        width: '100%',
        height: '100%',
    },
    navBlur: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: Platform.OS === 'ios' ? 50 : 20,
        paddingBottom: 12,
        paddingHorizontal: 16,
        overflow: 'hidden',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    shareButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    contentSheet: {
        backgroundColor: theme.colors.background,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        marginTop: -24,
        paddingTop: 24,
        paddingHorizontal: 20,
    },
    creatorRow: {
        marginBottom: 20,
    },
    creatorBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 16,
        alignSelf: 'flex-start',
        gap: 12,
        ...theme.shadows.small,
    },
    creatorAvatar: {
        fontSize: 32,
    },
    creatorNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    creatorName: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    creatorStats: {
        fontSize: 12,
        color: theme.colors.text.secondary,
        marginTop: 2,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: 8,
        lineHeight: 36,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 16,
    },
    location: {
        fontSize: 16,
        color: theme.colors.text.secondary,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 20,
        marginBottom: 20,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    statLabel: {
        fontSize: 13,
        color: theme.colors.text.secondary,
    },
    priceSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        padding: 20,
        borderRadius: 16,
        marginBottom: 24,
        ...theme.shadows.small,
    },
    priceLabel: {
        fontSize: 12,
        color: theme.colors.text.secondary,
        marginBottom: 4,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 4,
    },
    priceSymbol: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.success,
        marginRight: 4,
    },
    priceValue: {
        fontSize: 32,
        fontWeight: '700',
        color: theme.colors.success,
    },
    priceNote: {
        fontSize: 11,
        color: theme.colors.text.tertiary,
    },
    buyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 28,
        ...theme.shadows.button,
    },
    buyButtonText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#fff',
    },
    description: {
        fontSize: 15,
        color: theme.colors.text.primary,
        lineHeight: 22,
    },
    inclusionsIntro: {
        fontSize: 14,
        color: theme.colors.text.secondary,
        lineHeight: 20,
        marginBottom: 20,
    },
    inclusionsList: {
        gap: 16,
    },
    inclusionItem: {
        flexDirection: 'row',
        gap: 12,
    },
    inclusionIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    inclusionContent: {
        flex: 1,
    },
    inclusionTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.colors.text.primary,
        marginBottom: 4,
    },
    inclusionDesc: {
        fontSize: 13,
        color: theme.colors.text.secondary,
        lineHeight: 18,
    },
    contactButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: theme.colors.surface,
        paddingVertical: 14,
        borderRadius: 28,
        marginTop: 24,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    contactButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.colors.primary,
    },
    reviewsSection: {
        marginTop: 24,
    },
    trustBox: {
        flexDirection: 'row',
        gap: 12,
        backgroundColor: theme.colors.surfaceLight,
        padding: 16,
        borderRadius: 12,
        marginTop: 16,
    },
    trustContent: {
        flex: 1,
    },
    trustTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text.primary,
        marginBottom: 4,
    },
    trustText: {
        fontSize: 13,
        color: theme.colors.text.secondary,
        lineHeight: 18,
    },
    errorText: {
        fontSize: 16,
        color: theme.colors.error,
        textAlign: 'center',
    },
});
