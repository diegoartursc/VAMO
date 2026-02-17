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
import { getReviewsByPackageId, getAverageRating, getCategoryRatings, getCommunityPhotos, getTopRatedCategoriesText } from '../../src/data/mockReviews';
import { Alert, Linking, Share } from 'react-native';
import { VerifiedBadge } from '../../src/components/creator/VerifiedBadge';
import CollapsibleSection from '../../src/components/common/CollapsibleSection';
import PremiumReviewsSection from '../../src/components/reviews/PremiumReviewsSection';
import { shareService } from '../../src/services/sharing';
import { haptics } from '../../src/services/haptics';
import { ITINERARY_INCLUSIONS } from '../../src/data/itineraryInclusions';
import FAQSection from '../../src/components/FAQSection';
import { getItineraryFAQ } from '../../src/data/mockFAQ';
import { PurchaseSuccessModal } from '../../src/components/modals/PurchaseSuccessModal';

const { width, height } = Dimensions.get('window');

export default function ItineraryDetailScreen() {
    const { id, showSuccess } = useLocalSearchParams<{ id: string; showSuccess?: string }>();
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
    const [showSuccessModal, setShowSuccessModal] = useState(showSuccess === 'true');

    const handlePurchase = () => {
        // Show success modal
        setShowSuccessModal(true);
    };

    const handleGoToMyTrips = () => {
        setShowSuccessModal(false);
        // Navigate to itinerary success screen
        router.push({
            pathname: '/itinerary-success' as any,
            params: { itineraryId: id },
        });
    };
    const handleBuyNow = () => {
        // Navigate to checkout flow
        router.push({
            pathname: `/checkout/itinerary-contact` as any,
            params: {
                itineraryId: id,
                price: itinerary.price.toString(),
            },
        });
    };


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
                        <TouchableOpacity
                            style={styles.shareButton}
                            onPress={async () => {
                                haptics.light();
                                try {
                                    await Share.share({
                                        title: itinerary.title,
                                        message: `🗺️ Confira este roteiro no VAMO!\n\n${itinerary.title}\n📍 ${itinerary.destination}, ${itinerary.country}\n💰 R$ ${itinerary.price.toFixed(2)}`,
                                    });
                                } catch (error) {
                                    // User cancelled
                                }
                            }}
                        >
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

                        {/* Creator Verification Link */}
                        <TouchableOpacity
                            style={styles.verificationLink}
                            onPress={() => router.push('/creator-verification-explained' as any)}
                        >
                            <Ionicons name="shield-checkmark" size={16} color={theme.colors.verified} />
                            <Text style={styles.verificationLinkText}>Como verificamos os criadores</Text>
                            <Ionicons name="chevron-forward" size={16} color={theme.colors.text.tertiary} />
                        </TouchableOpacity>
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
                            onPress={handleBuyNow}
                        >
                            <Text style={styles.buyButtonText}>Comprar Agora</Text>
                            <Ionicons name="arrow-forward" size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    {/* Aviso: Produto Digital */}
                    <View style={styles.productNotice}>
                        <Ionicons name="information-circle" size={18} color={theme.colors.primary} />
                        <Text style={styles.productNoticeText}>
                            Este é um <Text style={styles.productNoticeBold}>produto digital</Text>. Ao comprar, você terá acesso a informações, dicas e planejamento de viagem. O pagamento é referente ao conteúdo informativo, não a serviços turísticos.
                        </Text>
                    </View>

                    {/* Estimativa de Gasto */}
                    {itinerary.estimatedSpending && (
                        <CollapsibleSection title="💰 Estimativa de Gasto" defaultExpanded={false}>
                            <View style={styles.spendingEstimate}>
                                <View style={styles.spendingHeader}>
                                    <Text style={styles.spendingRange}>
                                        {itinerary.estimatedSpending.currency} {itinerary.estimatedSpending.min.toLocaleString('pt-BR')} - {itinerary.estimatedSpending.max.toLocaleString('pt-BR')}
                                    </Text>
                                    <Text style={styles.spendingNote}>
                                        *Valores aproximados para {itinerary.duration} dias
                                    </Text>
                                </View>

                                {itinerary.estimatedSpending.breakdown && (
                                    <View style={styles.spendingBreakdown}>
                                        {itinerary.estimatedSpending.breakdown.map((item, index) => (
                                            <View key={index} style={styles.breakdownItem}>
                                                <View style={styles.breakdownHeader}>
                                                    <Text style={styles.breakdownCategory}>{item.category}</Text>
                                                    <Text style={styles.breakdownAmount}>{item.amount}</Text>
                                                </View>
                                                <Text style={styles.breakdownDescription}>{item.description}</Text>
                                            </View>
                                        ))}
                                    </View>
                                )}

                                <View style={styles.spendingDisclaimer}>
                                    <Ionicons name="information-circle-outline" size={16} color={theme.colors.text.secondary} />
                                    <Text style={styles.disclaimerText}>
                                        Valores estimados podem variar conforme época do ano e estilo de viagem
                                    </Text>
                                </View>
                            </View>
                        </CollapsibleSection>
                    )}

                    {/* Sobre o Roteiro */}
                    <CollapsibleSection title="Sobre o Roteiro" defaultExpanded>
                        <Text style={styles.description}>{itinerary.description}</Text>
                    </CollapsibleSection>

                    {/* Destaques */}
                    {itinerary.highlights && itinerary.highlights.length > 0 && (
                        <CollapsibleSection title="Destaques" defaultExpanded>
                            <View style={styles.highlightsContainer}>
                                {itinerary.highlights.map((highlight, index) => (
                                    <View key={index} style={styles.highlightRow}>
                                        <View style={styles.checkIcon}>
                                            <Ionicons name="checkmark" size={12} color="#fff" />
                                        </View>
                                        <Text style={styles.highlightText}>{highlight}</Text>
                                    </View>
                                ))}
                            </View>
                        </CollapsibleSection>
                    )}

                    {/* O que você vai receber */}
                    <CollapsibleSection title="O que você vai receber" defaultExpanded>
                        <Text style={styles.inclusionsIntro}>
                            Ao comprar este roteiro, você terá acesso a todas as informações necessárias para sua viagem:
                        </Text>

                        <View style={styles.inclusionsList}>
                            {ITINERARY_INCLUSIONS.map((item) => (
                                <View key={item.id} style={styles.inclusionItem}>
                                    <View style={[styles.inclusionIcon, { backgroundColor: item.bgColor }]}>
                                        <Ionicons name={item.icon as any} size={24} color={item.iconColor} />
                                    </View>
                                    <View style={styles.inclusionContent}>
                                        <Text style={styles.inclusionTitle}>{item.title}</Text>
                                        <Text style={styles.inclusionDesc}>
                                            {item.description}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </CollapsibleSection>

                    {/* Perguntas Frequentes */}
                    <FAQSection
                        items={getItineraryFAQ(id)}
                        creatorName={itinerary.creator.name}
                    />

                    {/* Premium Reviews Section */}
                    {reviews.length > 0 && (
                        <View style={styles.reviewsSection}>
                            <PremiumReviewsSection
                                reviews={reviews}
                                averageRating={getAverageRating(`itinerary-${id}`)}
                                totalReviews={reviews.length}
                                categoryRatings={getCategoryRatings(`itinerary-${id}`)}
                                communityPhotos={getCommunityPhotos(`itinerary-${id}`)}
                                topRatedSummary={getTopRatedCategoriesText(`itinerary-${id}`)}
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

                    {/* Disclaimer Legal */}
                    <View style={styles.disclaimerBox}>
                        <View style={styles.disclaimerHeader}>
                            <Ionicons name="document-text-outline" size={18} color={theme.colors.text.tertiary} />
                            <Text style={styles.disclaimerTitle}>Informações Importantes</Text>
                        </View>
                        <View style={styles.disclaimerItems}>
                            <View style={styles.disclaimerItem}>
                                <Text style={styles.disclaimerBullet}>📄</Text>
                                <Text style={styles.disclaimerItemText}>
                                    <Text style={styles.disclaimerItemBold}>Produto digital:</Text> Você está adquirindo acesso a um roteiro com informações, dicas e planejamento de viagem elaborados por um viajante experiente.
                                </Text>
                            </View>
                            <View style={styles.disclaimerItem}>
                                <Text style={styles.disclaimerBullet}>💡</Text>
                                <Text style={styles.disclaimerItemText}>
                                    <Text style={styles.disclaimerItemBold}>Conteúdo informativo:</Text> O pagamento é pelo acesso à informação em si. A VAMO não comercializa nem garante a execução dos serviços, passeios ou experiências descritos no roteiro.
                                </Text>
                            </View>
                            <View style={styles.disclaimerItem}>
                                <Text style={styles.disclaimerBullet}>🔒</Text>
                                <Text style={styles.disclaimerItemText}>
                                    <Text style={styles.disclaimerItemBold}>Acesso permanente:</Text> Após a compra, o conteúdo ficará disponível na sua conta para consulta a qualquer momento.
                                </Text>
                            </View>
                            <View style={styles.disclaimerItem}>
                                <Text style={styles.disclaimerBullet}>⚠️</Text>
                                <Text style={styles.disclaimerItemText}>
                                    Preços, horários e disponibilidade dos locais mencionados podem sofrer alterações. Recomendamos confirmar as informações antes da viagem.
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View style={{ height: 100 }} />
                </View>
            </ScrollView>

            {/* Purchase Success Modal */}
            <PurchaseSuccessModal
                visible={showSuccessModal}
                onClose={() => setShowSuccessModal(false)}
                onGoToMyTrips={handleGoToMyTrips}
                itineraryTitle={itinerary.title}
            />
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

    // Spending Estimate Styles
    spendingEstimate: {
        gap: 16,
    },
    spendingHeader: {
        marginBottom: 8,
    },
    spendingRange: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.colors.success,
        marginBottom: 4,
    },
    spendingNote: {
        fontSize: 12,
        color: theme.colors.text.secondary,
        fontStyle: 'italic',
    },
    spendingBreakdown: {
        gap: 12,
        marginTop: 8,
    },
    breakdownItem: {
        backgroundColor: theme.colors.surfaceLight,
        padding: 12,
        borderRadius: 8,
        borderLeftWidth: 3,
        borderLeftColor: theme.colors.primary,
    },
    breakdownHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    breakdownCategory: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    breakdownAmount: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.colors.success,
    },
    breakdownDescription: {
        fontSize: 12,
        color: theme.colors.text.secondary,
        lineHeight: 16,
    },
    spendingDisclaimer: {
        flexDirection: 'row',
        gap: 8,
        backgroundColor: theme.colors.surfaceLight,
        padding: 12,
        borderRadius: 8,
        marginTop: 8,
    },
    disclaimerText: {
        flex: 1,
        fontSize: 11,
        color: theme.colors.text.secondary,
        lineHeight: 15,
    },

    // Highlights Styles
    highlightsContainer: {
        gap: 12,
        paddingVertical: 8,
    },
    highlightRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    checkIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: theme.colors.success,
        alignItems: 'center',
        justifyContent: 'center',
    },
    highlightText: {
        fontSize: 15,
        color: theme.colors.text.primary,
        flex: 1,
    },

    reviewsSection: {
        marginTop: 24,
    },
    verificationLink: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 4,
        marginTop: 12,
    },
    verificationLinkText: {
        flex: 1,
        fontSize: 13,
        color: theme.colors.verified,
        fontWeight: '500',
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

    // Product Notice (inline compact)
    productNotice: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        backgroundColor: `${theme.colors.primary}08`,
        borderWidth: 1,
        borderColor: `${theme.colors.primary}20`,
        borderRadius: 10,
        padding: 14,
        marginTop: 12,
    },
    productNoticeText: {
        flex: 1,
        fontSize: 13,
        color: theme.colors.text.secondary,
        lineHeight: 19,
    },
    productNoticeBold: {
        fontWeight: '700',
        color: theme.colors.text.primary,
    },

    // Disclaimer Box (detailed section)
    disclaimerBox: {
        backgroundColor: theme.colors.surfaceLight,
        borderRadius: 12,
        padding: 16,
        marginTop: 20,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    disclaimerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 14,
    },
    disclaimerTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text.secondary,
    },
    disclaimerItems: {
        gap: 12,
    },
    disclaimerItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
    },
    disclaimerBullet: {
        fontSize: 14,
        marginTop: 1,
    },
    disclaimerItemText: {
        flex: 1,
        fontSize: 13,
        color: theme.colors.text.secondary,
        lineHeight: 19,
    },
    disclaimerItemBold: {
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
});
