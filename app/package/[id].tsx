import React, { useState } from 'react';

import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { theme } from '../../src/theme/theme';
import { getPackageById } from '../../src/data/mockPackages';
import { getReviewsByPackageId } from '../../src/data/mockReviews';
import { Alert, Linking } from 'react-native';
import CollapsibleSection from '../../src/components/CollapsibleSection';
import ItineraryCard from '../../src/components/cards/ItineraryCard';

const { width } = Dimensions.get('window');

export default function PackageDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const packageData = getPackageById(id);
    const reviews = getReviewsByPackageId(id);
    const [showAllReviews, setShowAllReviews] = useState(false);


    const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 2);

    if (!packageData) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>Pacote não encontrado</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Back Button */}
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Text style={styles.backButtonText}>‹ Voltar</Text>
            </TouchableOpacity>

            <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Image Gallery */}
                <ScrollView
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                >
                    {packageData.images.map((image, index) => (
                        <Image
                            key={index}
                            source={{ uri: image }}
                            style={styles.image}
                        />
                    ))}
                </ScrollView>

                {/* Package Info */}
                <View style={styles.content}>
                    <View style={styles.header}>
                        <View style={styles.agencyBadge}>
                            <Text style={styles.agencyIcon}>{packageData.agency.logo}</Text>
                            <Text style={styles.agencyName}>{packageData.agency.name}</Text>
                            {packageData.agency.verified && (
                                <Text style={styles.verifiedBadge}>✓</Text>
                            )}
                        </View>
                    </View>

                    <Text style={styles.title}>{packageData.title}</Text>
                    <Text style={styles.destination}>
                        {packageData.destination}, {packageData.country}
                    </Text>

                    <View style={styles.ratingRow}>
                        <View style={styles.ratingContainer}>
                            <Text style={styles.ratingIcon}>⭐</Text>
                            <Text style={styles.ratingText}>{packageData.rating}</Text>
                            <Text style={styles.reviewCount}>
                                ({packageData.reviewCount} avaliações)
                            </Text>
                        </View>
                        <Text style={styles.duration}>📅 {packageData.duration} dias</Text>
                    </View>

                    {/* Price */}
                    <View style={styles.priceCard}>
                        <Text style={styles.priceLabel}>A partir de</Text>
                        <Text style={styles.price}>
                            R$ {packageData.price.min.toLocaleString('pt-BR')}
                        </Text>
                        <Text style={styles.priceNote}>por pessoa</Text>
                    </View>

                    {/* Itinerary Card */}
                    {packageData.itinerary && (
                        <ItineraryCard
                            mainStop={packageData.itinerary.mainStop}
                            pickupLocations={packageData.itinerary.pickupLocations}
                            transport={packageData.itinerary.transport}
                            mainActivity={packageData.itinerary.mainActivity}
                            returnLocations={packageData.itinerary.returnLocations}
                            mapImageUrl={packageData.itinerary.mapImageUrl}
                            price={packageData.price}
                        />
                    )}

                    {/* Expandable Sections */}
                    <View style={styles.collapsibleContainer}>
                        {/* Itinerário */}
                        <CollapsibleSection title="Itinerário">
                            <TouchableOpacity style={styles.itineraryButton}>
                                <Text style={styles.itineraryButtonText}>Ver itinerário</Text>
                                <Text style={styles.chevronRight}>›</Text>
                            </TouchableOpacity>
                        </CollapsibleSection>

                        {/* Destaques */}
                        <CollapsibleSection title="Destaques" defaultExpanded>
                            {packageData.highlights.map((highlight, index) => (
                                <View key={index} style={styles.listItem}>
                                    <Text style={styles.bullet}>✨</Text>
                                    <Text style={styles.listText}>{highlight}</Text>
                                </View>
                            ))}
                        </CollapsibleSection>

                        {/* Descrição completa */}
                        <CollapsibleSection title="Descrição completa">
                            <Text style={styles.description}>{packageData.description}</Text>
                            <Text style={[styles.description, { marginTop: 12 }]}>
                                Este pacote oferece uma experiência única e inesquecível,
                                combinando conforto, aventura e cultura local. Perfeito para
                                quem busca vivenciar momentos especiais em {packageData.destination}.
                            </Text>
                        </CollapsibleSection>

                        {/* Inclui */}
                        <CollapsibleSection title="Inclui">
                            {packageData.includes.map((item, index) => (
                                <View key={index} style={styles.listItem}>
                                    <Text style={styles.bullet}>✓</Text>
                                    <Text style={styles.listText}>{item}</Text>
                                </View>
                            ))}
                        </CollapsibleSection>

                        {/* Não indicado para */}
                        <CollapsibleSection title="Não indicado para">
                            <View style={styles.listItem}>
                                <Text style={styles.bullet}>✕</Text>
                                <Text style={styles.listText}>Menores de 12 anos desacompanhados</Text>
                            </View>
                            <View style={styles.listItem}>
                                <Text style={styles.bullet}>✕</Text>
                                <Text style={styles.listText}>Pessoas com mobilidade reduzida</Text>
                            </View>
                            <View style={styles.listItem}>
                                <Text style={styles.bullet}>✕</Text>
                                <Text style={styles.listText}>Gestantes</Text>
                            </View>
                        </CollapsibleSection>

                        {/* Informações importantes */}
                        <CollapsibleSection title="Informações importantes">
                            <View style={styles.importantInfo}>
                                <Text style={styles.importantInfoText}>
                                    • Por favor, esteja no ponto de encontro 15 minutos antes do horário de partida
                                </Text>
                                <Text style={styles.importantInfoText}>
                                    • Traga protetor solar, boné e roupas confortáveis
                                </Text>
                                <Text style={styles.importantInfoText}>
                                    • O passeio pode ser cancelado em caso de condições climáticas adversas
                                </Text>
                                <Text style={styles.importantInfoText}>
                                    • Documentos de identificação são obrigatórios
                                </Text>
                            </View>
                        </CollapsibleSection>
                    </View>

                    {/* Reviews Section */}
                    {reviews.length > 0 && (
                        <View style={styles.section}>
                            <View style={styles.reviewsHeader}>
                                <Text style={styles.sectionTitle}>
                                    Avaliações ({reviews.length})
                                </Text>
                                <View style={styles.reviewsButtons}>
                                    <TouchableOpacity style={styles.filterButton}>
                                        <Text style={styles.filterButtonText}>Ordenar por</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.filterButton}>
                                        <Text style={styles.filterButtonText}>Filtro</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {displayedReviews.map((review) => (
                                <View key={review.id} style={styles.reviewCard}>
                                    <View style={styles.reviewHeader}>
                                        <View style={styles.reviewUserInfo}>
                                            <View style={[styles.reviewAvatar, { backgroundColor: review.user.avatar }]}>
                                                <Text style={styles.reviewAvatarText}>{review.user.initial}</Text>
                                            </View>
                                            <View>
                                                <Text style={styles.reviewUserName}>
                                                    {review.user.name} - {review.user.location}
                                                </Text>
                                                <Text style={styles.reviewDate}>
                                                    {review.date}{review.verified && ' - Reserva verificada'}
                                                </Text>
                                            </View>
                                        </View>
                                        <TouchableOpacity>
                                            <Text style={styles.reviewMenu}>⋮</Text>
                                        </TouchableOpacity>
                                    </View>

                                    <View style={styles.reviewRating}>
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Text key={star} style={styles.starIcon}>
                                                {star <= review.rating ? '⭐' : '☆'}
                                            </Text>
                                        ))}
                                    </View>

                                    {review.photos && review.photos.length > 0 && (
                                        <ScrollView
                                            horizontal
                                            showsHorizontalScrollIndicator={false}
                                            style={styles.reviewPhotos}
                                        >
                                            {review.photos.map((photo, index) => (
                                                <Image
                                                    key={index}
                                                    source={{ uri: photo }}
                                                    style={styles.reviewPhoto}
                                                />
                                            ))}
                                        </ScrollView>
                                    )}

                                    <Text style={styles.reviewText}>{review.text}</Text>

                                    {review.language && review.language !== 'pt' && (
                                        <TouchableOpacity>
                                            <Text style={styles.translateLink}>Traduzir</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            ))}

                            {reviews.length > 2 && (
                                <TouchableOpacity
                                    style={styles.showMoreButton}
                                    onPress={() => setShowAllReviews(!showAllReviews)}
                                >
                                    <Text style={styles.showMoreButtonText}>
                                        {showAllReviews ? 'Ver menos' : `Ver todas as ${reviews.length} avaliações`}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}

                    {/* Cancellation Policy */}
                    <View style={styles.policySection}>
                        <Text style={styles.policySectionTitle}>Precisa fazer uma alteração?</Text>
                        <Text style={styles.policyText}>
                            O prazo de cancelamento ou remarcação da atividade (25 de novembro de 2023 às 09:00) expirou.
                        </Text>
                    </View>

                    {/* Help Section */}
                    <View style={styles.helpSection}>
                        <Text style={styles.helpSectionTitle}>Precisa de ajuda?</Text>
                        <Text style={styles.helpText}>
                            Caso você tenha alguma dúvida sobre sua reserva ou sobre a atividade, consulte os canais de suporte disponíveis.
                        </Text>

                        <TouchableOpacity style={styles.helpButton}>
                            <View style={styles.helpButtonContent}>
                                <Text style={styles.helpButtonIcon}>?</Text>
                                <Text style={styles.helpButtonText}>Central de Ajuda</Text>
                            </View>
                            <Text style={styles.chevron}>›</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.helpButton}>
                            <View style={styles.helpButtonContent}>
                                <Text style={styles.helpButtonIcon}>?</Text>
                                <Text style={styles.helpButtonText}>Entre em contato com o suporte</Text>
                            </View>
                            <Text style={styles.chevron}>›</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Discover More */}
                    <View style={styles.discoverSection}>
                        <Text style={styles.discoverSectionTitle}>Descubra mais em</Text>
                        <TouchableOpacity style={styles.discoverCard}>
                            <Image
                                source={{ uri: 'https://images.unsplash.com/photo-1516815231560-8f41ec531527?w=800' }}
                                style={styles.discoverImage}
                            />
                            <View style={styles.discoverBadge}>
                                <Text style={styles.discoverBadgeText}>{packageData.destination}</Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Contact Agency Button */}
                    <TouchableOpacity
                        style={styles.contactButton}
                        onPress={() => Alert.alert(
                            `📞 Contato`,
                            `Deseja entrar em contato com ${packageData.agency.name}?`,
                            [
                                { text: 'Cancelar', style: 'cancel' },
                                { text: 'Ligar', onPress: () => Linking.openURL('tel:+5511999999999') },
                                { text: 'WhatsApp', onPress: () => Linking.openURL(`https://wa.me/5511999999999?text=Olá! Vi o pacote "${packageData.title}" no VAMO e gostaria de mais informações.`) }
                            ]
                        )}
                    >
                        <Text style={styles.contactButtonText}>
                            Entrar em contato com {packageData.agency.name}
                        </Text>
                    </TouchableOpacity>

                    {/* Agency Info */}
                    <View style={styles.agencyInfo}>
                        <Text style={styles.agencyInfoText}>
                            Este pacote é oferecido por {packageData.agency.name}.
                        </Text>
                        <Text style={styles.agencyInfoText}>
                            O VAMO conecta você diretamente com a agência.
                        </Text>
                    </View>

                    <View style={{ height: 40 }} />
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
    backButton: {
        paddingTop: 50,
        paddingHorizontal: theme.spacing.md,
        paddingBottom: theme.spacing.sm,
        backgroundColor: theme.colors.background,
    },
    backButtonText: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.primary,
    },
    scrollContent: {
        flex: 1,
    },
    image: {
        width,
        height: 300,
        backgroundColor: theme.colors.surface,
    },
    content: {
        padding: theme.spacing.md,
    },
    header: {
        marginBottom: theme.spacing.md,
    },
    agencyBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.borderRadius.full,
        alignSelf: 'flex-start',
        gap: theme.spacing.sm,
    },
    agencyIcon: {
        fontSize: 16,
    },
    agencyName: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    verifiedBadge: {
        fontSize: 12,
        color: theme.colors.success,
    },
    title: {
        fontSize: theme.typography.sizes.title,
        fontWeight: theme.typography.weights.bold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.xs,
    },
    destination: {
        fontSize: 16,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.md,
    },
    ratingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ratingIcon: {
        fontSize: 16,
    },
    ratingText: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    reviewCount: {
        fontSize: 14,
        color: theme.colors.text.secondary,
    },
    duration: {
        fontSize: 14,
        color: theme.colors.text.secondary,
    },
    priceCard: {
        backgroundColor: theme.colors.surfaceLight,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        marginBottom: theme.spacing.lg,
        alignItems: 'center',
    },
    priceLabel: {
        fontSize: 14,
        color: theme.colors.text.secondary,
        marginBottom: 4,
    },
    price: {
        fontSize: 32,
        fontWeight: '700',
        color: theme.colors.primary,
        marginBottom: 4,
    },
    priceNote: {
        fontSize: 12,
        color: theme.colors.text.secondary,
    },
    section: {
        marginBottom: theme.spacing.lg,
    },
    sectionTitle: {
        fontSize: theme.typography.sizes.heading,
        fontWeight: theme.typography.weights.bold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.md,
    },
    description: {
        fontSize: theme.typography.sizes.body,
        color: theme.colors.text.secondary,
        lineHeight: 24,
    },
    listItem: {
        flexDirection: 'row',
        marginBottom: theme.spacing.sm,
        gap: theme.spacing.sm,
    },
    bullet: {
        fontSize: 16,
        color: theme.colors.primary,
    },
    listText: {
        flex: 1,
        fontSize: 15,
        color: theme.colors.text.primary,
        lineHeight: 22,
    },
    contactButton: {
        backgroundColor: theme.colors.primary,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.borderRadius.full,
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    contactButtonText: {
        color: theme.colors.text.inverse,
        fontSize: 16,
        fontWeight: '600',
    },
    agencyInfo: {
        backgroundColor: theme.colors.surfaceLight,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        gap: theme.spacing.xs,
    },
    agencyInfoText: {
        fontSize: 13,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        lineHeight: 18,
    },
    errorText: {
        fontSize: theme.typography.sizes.body,
        color: theme.colors.error,
        textAlign: 'center',
    },
    // Reviews Section
    reviewsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    reviewsButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    filterButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: theme.borderRadius.full,
        borderWidth: 1.5,
        borderColor: theme.colors.primary,
    },
    filterButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.primary,
    },
    reviewCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.sm,
    },
    reviewUserInfo: {
        flexDirection: 'row',
        gap: 12,
    },
    reviewAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    reviewAvatarText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    reviewUserName: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    reviewDate: {
        fontSize: 12,
        color: theme.colors.text.secondary,
        marginTop: 2,
    },
    reviewMenu: {
        fontSize: 24,
        color: theme.colors.text.secondary,
    },
    reviewRating: {
        flexDirection: 'row',
        gap: 4,
        marginBottom: theme.spacing.sm,
    },
    starIcon: {
        fontSize: 16,
    },
    reviewPhotos: {
        marginBottom: theme.spacing.sm,
    },
    reviewPhoto: {
        width: 100,
        height: 100,
        borderRadius: theme.borderRadius.md,
        marginRight: 8,
        backgroundColor: theme.colors.surface,
    },
    reviewText: {
        fontSize: 14,
        color: theme.colors.text.primary,
        lineHeight: 20,
        marginBottom: theme.spacing.xs,
    },
    translateLink: {
        fontSize: 13,
        color: theme.colors.primary,
        fontWeight: '600',
    },
    showMoreButton: {
        backgroundColor: theme.colors.primary,
        paddingVertical: 14,
        borderRadius: theme.borderRadius.full,
        alignItems: 'center',
        marginTop: theme.spacing.sm,
    },
    showMoreButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.colors.text.inverse,
    },
    // Policy Section
    policySection: {
        backgroundColor: theme.colors.surfaceLight,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.lg,
        marginBottom: theme.spacing.lg,
    },
    policySectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.xs,
    },
    policyText: {
        fontSize: 13,
        color: theme.colors.text.secondary,
        lineHeight: 18,
    },
    // Help Section
    helpSection: {
        backgroundColor: theme.colors.surfaceLight,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.lg,
        marginBottom: theme.spacing.lg,
    },
    helpSectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.xs,
    },
    helpText: {
        fontSize: 13,
        color: theme.colors.text.secondary,
        lineHeight: 18,
        marginBottom: theme.spacing.md,
    },
    helpButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },
    helpButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    helpButtonIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: theme.colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 14,
        fontWeight: '700',
        textAlign: 'center',
        lineHeight: 24,
    },
    helpButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    chevron: {
        fontSize: 24,
        color: theme.colors.text.secondary,
    },
    // Discover Section
    discoverSection: {
        marginBottom: theme.spacing.lg,
    },
    discoverSectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.md,
    },
    discoverCard: {
        borderRadius: theme.borderRadius.lg,
        overflow: 'hidden',
        ...theme.shadows.small,
    },
    discoverImage: {
        width: '100%',
        height: 180,
        backgroundColor: theme.colors.surface,
    },
    discoverBadge: {
        position: 'absolute',
        top: theme.spacing.md,
        left: theme.spacing.md,
        backgroundColor: theme.colors.primary,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.borderRadius.sm,
    },
    discoverBadgeText: {
        fontSize: 13,
        fontWeight: '700',
        color: theme.colors.text.inverse,
    },
    // Collapsible Sections
    collapsibleContainer: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.lg,
        paddingHorizontal: theme.spacing.md,
        marginBottom: theme.spacing.lg,
        overflow: 'hidden',
    },
    itineraryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: theme.spacing.sm,
    },
    itineraryButtonText: {
        fontSize: 15,
        color: theme.colors.text.primary,
        fontWeight: '500',
    },
    chevronRight: {
        fontSize: 24,
        color: theme.colors.text.secondary,
        fontWeight: '300',
    },
    importantInfo: {
        gap: theme.spacing.sm,
    },
    importantInfoText: {
        fontSize: 14,
        color: theme.colors.text.primary,
        lineHeight: 20,
    },
});
