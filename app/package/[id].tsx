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
import { getPackageById, getRelatedPackages } from '../../src/data/mockPackages';
import { getReviewsByPackageId, getAverageRating, getCategoryRatings, getCommunityPhotos, getTopRatedCategoriesText } from '../../src/data/mockReviews';
import PremiumReviewsSection from '../../src/components/reviews/PremiumReviewsSection';
import { Alert, Linking } from 'react-native';
import CollapsibleSection from '../../src/components/common/CollapsibleSection';
import ItineraryCard from '../../src/components/cards/ItineraryCard';
import DatePickerModal from '../../src/components/DatePickerModal';
import ParticipantsModal from '../../src/components/ParticipantsModal';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function PackageDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const packageData = getPackageById(id);
    const reviews = getReviewsByPackageId(id);
    const [showAllReviews, setShowAllReviews] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showParticipants, setShowParticipants] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [adults, setAdults] = useState(1);
    const [children, setChildren] = useState(0);

    const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 2);
    const relatedPackages = getRelatedPackages(id, 4);


    if (!packageData) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>Pacote não encontrado</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Immersive Hero Image (Fixed) */}
            <View style={styles.heroImageContainer}>
                <Image
                    source={{ uri: packageData.images[0] }}
                    style={styles.heroImage}
                    resizeMode="cover"
                />
                <LinearGradient
                    colors={['rgba(0,0,0,0.6)', 'transparent', 'rgba(0,0,0,0.2)']}
                    style={styles.heroGradient}
                    locations={[0, 0.4, 1]}
                />
            </View>

            {/* Glass Navigation Header */}
            <View style={styles.headerBar}>
                <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
                    <BlurView intensity={30} tint="dark" style={styles.glassIcon}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </BlurView>
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconButton}>
                    <BlurView intensity={30} tint="dark" style={styles.glassIcon}>
                        <Ionicons name="heart-outline" size={24} color="#fff" />
                    </BlurView>
                </TouchableOpacity>
            </View>

            {/* Scrollable Sheet Content */}
            <ScrollView
                style={styles.scrollContent}
                contentContainerStyle={styles.scrollContentContainer}
                showsVerticalScrollIndicator={false}
                scrollEventThrottle={16}
            >
                {/* Spacer to reveal hero image */}
                <View style={{ height: 380 }} />

                {/* Main Content Sheet */}
                <View style={styles.sheetContainer}>
                    {/* Header Handle */}
                    <View style={styles.sheetHandle} />

                    {/* Quick Stats Row */}
                    <View style={styles.statsRow}>
                        <View style={styles.ratingBadge}>
                            <Text style={styles.ratingStar}>⭐</Text>
                            <Text style={styles.ratingScore}>{packageData.rating}</Text>
                            <Text style={styles.ratingCount}>({packageData.reviewCount})</Text>
                        </View>
                        <View style={styles.locationBadge}>
                            <Ionicons name="location-sharp" size={14} color={theme.colors.text.secondary} />
                            <Text style={styles.locationText}>{packageData.country}</Text>
                        </View>
                    </View>

                    <Text style={styles.title}>{packageData.title}</Text>

                    {/* Features Grid */}
                    <View style={styles.featuresGrid}>
                        <View style={styles.featureItem}>
                            <Ionicons name="time-outline" size={22} color={theme.colors.primary} />
                            <Text style={styles.featureLabel}>{packageData.duration} Dias</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Ionicons name="wifi-outline" size={22} color={theme.colors.primary} />
                            <Text style={styles.featureLabel}>Wi-Fi</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Ionicons name="people-outline" size={22} color={theme.colors.primary} />
                            <Text style={styles.featureLabel}>Guia</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Ionicons name="bed-outline" size={22} color={theme.colors.primary} />
                            <Text style={styles.featureLabel}>Hotel 4★</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    {/* Agency Info */}
                    <View style={styles.agencyRow}>
                        <View style={styles.agencyBadge}>
                            <Text style={{ fontSize: 16 }}>{packageData.agency.logo}</Text>
                            <Text style={styles.agencyName}>{packageData.agency.name}</Text>
                            {packageData.agency.verified && <Ionicons name="checkmark-circle" size={14} color={theme.colors.verified} />}
                        </View>
                    </View>

                    {/* Confirmation Channel Badge - Builds Trust */}
                    <View style={styles.confirmationBadge}>
                        <View style={styles.confirmationLeft}>
                            <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
                            <View>
                                <Text style={styles.confirmationTitle}>Confirmação via WhatsApp</Text>
                                <Text style={styles.confirmationDesc}>Resposta em até 2h após reserva</Text>
                            </View>
                        </View>
                    </View>

                    {/* Verification Info Link */}
                    {packageData.agency.verified && (
                        <TouchableOpacity
                            style={styles.verificationLink}
                            onPress={() => router.push('/verification-explained')}
                        >
                            <Ionicons name="shield-checkmark" size={16} color={theme.colors.verified} />
                            <Text style={styles.verificationLinkText}>Como verificamos as agências</Text>
                            <Ionicons name="chevron-forward" size={16} color={theme.colors.text.tertiary} />
                        </TouchableOpacity>
                    )}

                    {/* Price & CTA Section (Premium) */}
                    <View style={styles.priceSection}>
                        <View style={styles.priceInfoContainer}>
                            <Text style={styles.priceLabel}>Preço total por pessoa</Text>
                            <View style={styles.priceRow}>
                                <Text style={styles.currencySymbol}>R$</Text>
                                <Text style={styles.priceValue}>{packageData.price.min.toLocaleString('pt-BR')}</Text>
                            </View>
                        </View>

                        {/* Primary CTA */}
                        <TouchableOpacity
                            style={styles.bookButton}
                            onPress={() => setShowDatePicker(true)}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.bookButtonText}>Verificar Disponibilidade</Text>
                            <Ionicons name="arrow-forward" size={20} color="#fff" />
                        </TouchableOpacity>

                        {/* Secondary CTA - Price Alert */}
                        <TouchableOpacity
                            style={styles.priceAlertButton}
                            onPress={() => {
                                // TODO: Check if user is logged in
                                Alert.alert(
                                    '🔔 Alerta de Preço',
                                    'Vamos te avisar quando o preço deste pacote mudar!',
                                    [
                                        { text: 'Cancelar', style: 'cancel' },
                                        {
                                            text: 'Ativar Alerta',
                                            onPress: () => {
                                                // TODO: Save package and activate notification
                                                Alert.alert('Sucesso!', 'Você receberá um alerta quando o preço mudar.');
                                            }
                                        }
                                    ]
                                );
                            }}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.priceAlertButtonText}>🔔 Receba alerta quando o preço mudar</Text>
                        </TouchableOpacity>
                    </View>

                    {/* About Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Sobre a experiência</Text>
                        {packageData.emotionalIntro && (
                            <Text style={styles.emotionalIntro}>
                                {packageData.emotionalIntro}
                            </Text>
                        )}
                        <Text style={styles.description}>{packageData.description}</Text>
                    </View>

                    {/* Full Description */}
                    {packageData.fullDescription && (
                        <CollapsibleSection title="Descrição completa">
                            <Text style={styles.description}>{packageData.fullDescription}</Text>
                        </CollapsibleSection>
                    )}

                    {/* Included Items */}
                    {packageData.includedItems && packageData.includedItems.length > 0 && (
                        <CollapsibleSection title="Inclui">
                            <View style={styles.highlightsContainer}>
                                {packageData.includedItems.map((item, index) => (
                                    <View key={index} style={styles.highlightRow}>
                                        <View style={styles.checkIcon}>
                                            <Ionicons name="checkmark" size={12} color="#fff" />
                                        </View>
                                        <Text style={styles.highlightText}>{item}</Text>
                                    </View>
                                ))}
                            </View>
                        </CollapsibleSection>
                    )}

                    {/* Not Recommended For */}
                    {packageData.notRecommendedFor && packageData.notRecommendedFor.length > 0 && (
                        <CollapsibleSection title="Não indicado para">
                            <View style={styles.highlightsContainer}>
                                {packageData.notRecommendedFor.map((item, index) => (
                                    <View key={index} style={styles.highlightRow}>
                                        <View style={[styles.checkIcon, { backgroundColor: theme.colors.error }]}>
                                            <Ionicons name="close" size={12} color="#fff" />
                                        </View>
                                        <Text style={styles.highlightText}>{item}</Text>
                                    </View>
                                ))}
                            </View>
                        </CollapsibleSection>
                    )}

                    {/* Important Information */}
                    {packageData.importantInfo && packageData.importantInfo.length > 0 && (
                        <CollapsibleSection title="Informações importantes">
                            <View style={styles.highlightsContainer}>
                                {packageData.importantInfo.map((item, index) => (
                                    <View key={index} style={styles.highlightRow}>
                                        <View style={[styles.checkIcon, { backgroundColor: theme.colors.warning || '#F59E0B' }]}>
                                            <Ionicons name="alert" size={12} color="#fff" />
                                        </View>
                                        <Text style={styles.highlightText}>{item}</Text>
                                    </View>
                                ))}
                            </View>
                        </CollapsibleSection>
                    )}

                    {/* Itinerary */}
                    {packageData.itinerary && (
                        <View style={styles.section}>
                            <CollapsibleSection title="Itinerário Detalhado">
                                <ItineraryCard
                                    mainStop={packageData.itinerary.mainStop}
                                    pickupLocations={packageData.itinerary.pickupLocations}
                                    transport={packageData.itinerary.transport}
                                    mainActivity={packageData.itinerary.mainActivity}
                                    returnLocations={packageData.itinerary.returnLocations}
                                    mapImageUrl={packageData.itinerary.mapImageUrl}
                                    price={packageData.price}
                                    onAvailabilityPress={() => setShowDatePicker(true)}
                                />
                            </CollapsibleSection>
                        </View>
                    )}

                    {/* Highlights */}
                    <CollapsibleSection title="Destaques" defaultExpanded>
                        <View style={styles.highlightsContainer}>
                            {packageData.highlights.map((highlight, index) => (
                                <View key={index} style={styles.highlightRow}>
                                    <View style={styles.checkIcon}>
                                        <Ionicons name="checkmark" size={12} color="#fff" />
                                    </View>
                                    <Text style={styles.highlightText}>{highlight}</Text>
                                </View>
                            ))}
                        </View>
                    </CollapsibleSection>

                    {/* Perfect For Block - User Identification */}
                    {packageData.perfectFor && packageData.perfectFor.length > 0 && (
                        <View style={styles.perfectForContainer}>
                            <Text style={styles.perfectForTitle}>Para quem essa viagem é perfeita</Text>

                            <View style={styles.perfectForItems}>
                                {packageData.perfectFor.map((item, index) => {
                                    const icons = ['airplane', 'star', 'calendar-clear'] as const;
                                    return (
                                        <View key={index} style={styles.perfectForItem}>
                                            <View style={styles.perfectForIconCircle}>
                                                <Ionicons name={icons[index % icons.length]} size={18} color={theme.colors.primary} />
                                            </View>
                                            <Text style={styles.perfectForText}>{item}</Text>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>
                    )}

                    {/* Peace of Mind Block - Reduces Purchase Anxiety */}
                    <View style={styles.peaceOfMindContainer}>
                        <Text style={styles.peaceOfMindTitle}>Sua viagem sem preocupações</Text>

                        <View style={styles.peaceOfMindItems}>
                            {/* Item 1: Tudo Organizado */}
                            <View style={styles.peaceOfMindItem}>
                                <View style={styles.peaceOfMindIconCircle}>
                                    <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
                                </View>
                                <Text style={styles.peaceOfMindText}>Tudo organizado pela agência</Text>
                            </View>

                            {/* Item 2: Sem Filas */}
                            <View style={styles.peaceOfMindItem}>
                                <View style={styles.peaceOfMindIconCircle}>
                                    <Ionicons name="time-outline" size={20} color={theme.colors.success} />
                                </View>
                                <Text style={styles.peaceOfMindText}>Sem filas nos principais pontos turísticos</Text>
                            </View>

                            {/* Item 3: Suporte */}
                            <View style={styles.peaceOfMindItem}>
                                <View style={styles.peaceOfMindIconCircle}>
                                    <Ionicons name="shield-checkmark" size={20} color={theme.colors.success} />
                                </View>
                                <Text style={styles.peaceOfMindText}>Suporte antes e durante a viagem</Text>
                            </View>
                        </View>
                    </View>

                    {/* Cancellation Policy */}
                    <View style={styles.policyCard}>
                        <Ionicons name="shield-checkmark-outline" size={24} color={theme.colors.success} />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.policyTitle}>Cancelamento Gratuito</Text>
                            <Text style={styles.policyDesc}>Reembolso integral se cancelado até 24h antes.</Text>
                        </View>
                    </View>

                    {/* Premium Reviews Section */}
                    {reviews.length > 0 && (
                        <View style={styles.section}>
                            <PremiumReviewsSection
                                reviews={reviews}
                                averageRating={getAverageRating(id)}
                                totalReviews={packageData.reviewCount}
                                categoryRatings={getCategoryRatings(id)}
                                communityPhotos={getCommunityPhotos(id)}
                                topRatedSummary={getTopRatedCategoriesText(id)}
                            />
                        </View>
                    )}

                    {/* Related Packages Section */}
                    {relatedPackages.length > 0 && (
                        <View style={styles.relatedSection}>
                            <Text style={styles.relatedTitle}>Você também pode gostar</Text>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.relatedScrollContent}
                            >
                                {relatedPackages.map((pkg) => (
                                    <TouchableOpacity
                                        key={pkg.id}
                                        style={styles.relatedCard}
                                        onPress={() => router.push(`/package/${pkg.id}`)}
                                        activeOpacity={0.8}
                                    >
                                        <Image
                                            source={{ uri: pkg.images[0] }}
                                            style={styles.relatedImage}
                                            resizeMode="cover"
                                        />

                                        {/* Badge */}
                                        {pkg.badge && (
                                            <View style={styles.relatedBadge}>
                                                <Text style={styles.relatedBadgeText}>
                                                    {pkg.badge === 'bestseller' && 'Melhores avaliações'}
                                                    {pkg.badge === 'value' && 'Melhor custo-benefício'}
                                                    {pkg.badge === 'luxury' && 'Experiência premium'}
                                                    {pkg.badge === 'new' && 'Novidade'}
                                                </Text>
                                            </View>
                                        )}

                                        {/* Favorite Icon */}
                                        <View style={styles.relatedFavoriteButton}>
                                            <Ionicons name="heart-outline" size={20} color="#fff" />
                                        </View>

                                        <View style={styles.relatedCardContent}>
                                            <Text style={styles.relatedCardTitle} numberOfLines={2}>
                                                {pkg.title}
                                            </Text>
                                            <Text style={styles.relatedCardInfo}>
                                                {pkg.duration} horas • Serviço de busca disponível
                                            </Text>

                                            {/* Rating */}
                                            <View style={styles.relatedRating}>
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <Ionicons
                                                        key={star}
                                                        name={star <= Math.floor(pkg.rating) ? "star" : "star-outline"}
                                                        size={12}
                                                        color={theme.colors.warning || '#FFB74D'}
                                                    />
                                                ))}
                                                <Text style={styles.relatedRatingText}>
                                                    {pkg.rating} ({pkg.reviewCount.toLocaleString('pt-BR')})
                                                </Text>
                                            </View>

                                            {/* Price */}
                                            <View style={styles.relatedPriceContainer}>
                                                <View>
                                                    <Text style={styles.relatedPriceLabel}>A partir de</Text>
                                                    <Text style={styles.relatedPriceValue}>
                                                        € {Math.floor(pkg.price.min * 0.15)}
                                                    </Text>
                                                </View>
                                                <Text style={styles.relatedPriceUnit}>por adulto</Text>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    <View style={{ height: 100 }} />
                </View>
            </ScrollView>

            {/* Modals */}
            <DatePickerModal
                visible={showDatePicker}
                onClose={() => setShowDatePicker(false)}
                onSelectDate={(date: Date) => {
                    setSelectedDate(date);
                    setShowDatePicker(false);
                    setShowParticipants(true);
                }}
                packageTitle={packageData.title}
            />

            <ParticipantsModal
                visible={showParticipants}
                onClose={() => setShowParticipants(false)}
                onApply={(adultsCount: number, childrenCount: number) => {
                    setAdults(adultsCount);
                    setChildren(childrenCount);
                    router.push({
                        pathname: `/availability/${id}` as any,
                        params: {
                            date: selectedDate?.toISOString(),
                            adults: adultsCount.toString(),
                            children: childrenCount.toString(),
                            packageId: id,
                        },
                    });
                }}
                initialAdults={adults}
                initialChildren={children}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000', // Dark background behind image
    },
    heroImageContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: height * 0.6, // Covers 60% of screen initially
        zIndex: 0,
    },
    heroImage: {
        width: '100%',
        height: '100%',
    },
    heroGradient: {
        ...StyleSheet.absoluteFillObject,
    },
    headerBar: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 48 : 24,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        zIndex: 100,
    },
    iconButton: {
        borderRadius: 20,
        overflow: 'hidden',
    },
    glassIcon: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    scrollContent: {
        flex: 1,
        zIndex: 10,
    },
    scrollContentContainer: {
        flexGrow: 1,
    },
    sheetContainer: {
        backgroundColor: theme.colors.background,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        minHeight: height * 0.7,
        paddingHorizontal: 24,
        paddingBottom: 40,
        ...theme.shadows.elevated,
    },
    sheetHandle: {
        width: 40,
        height: 5,
        backgroundColor: theme.colors.border,
        borderRadius: 3,
        alignSelf: 'center',
        marginTop: 12,
        marginBottom: 24,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: theme.colors.surfaceLight,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    ratingStar: { fontSize: 12 },
    ratingScore: { fontWeight: '700', fontSize: 14, color: theme.colors.text.primary },
    ratingCount: { fontSize: 12, color: theme.colors.text.secondary },
    locationBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: theme.colors.surfaceLight,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    locationText: { fontSize: 13, color: theme.colors.text.secondary, fontWeight: '500' },
    title: {
        fontSize: theme.typography.sizes.hero, // 28
        fontWeight: '800',
        color: theme.colors.text.primary,
        marginBottom: 24,
        lineHeight: 34,
    },
    featuresGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 32,
        backgroundColor: theme.colors.surfaceLight,
        padding: 16,
        borderRadius: 16,
    },
    featureItem: {
        alignItems: 'center',
        gap: 8,
    },
    featureLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.text.secondary,
    },
    divider: {
        height: 1,
        backgroundColor: theme.colors.borderLight,
        marginBottom: 24,
    },
    agencyRow: {
        marginBottom: 24,
    },
    agencyBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    agencyName: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    priceSection: {
        backgroundColor: theme.colors.surface,
        padding: 20,
        borderRadius: 24,
        marginBottom: 32,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        gap: 12,
    },
    priceInfoContainer: {
        marginBottom: 8,
    },
    priceLabel: {
        fontSize: 12,
        color: theme.colors.text.secondary,
        marginBottom: 4,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 2,
    },
    currencySymbol: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.primary,
    },
    priceValue: {
        fontSize: 24,
        fontWeight: '800',
        color: theme.colors.primary,
    },
    bookButton: {
        backgroundColor: theme.colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderRadius: 100,
        ...theme.shadows.button,
    },
    bookButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    priceAlertButton: {
        borderWidth: 1.5,
        borderColor: theme.colors.primary,
        backgroundColor: 'transparent',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 100,
        alignItems: 'center',
        justifyContent: 'center',
    },
    priceAlertButtonText: {
        color: theme.colors.primary,
        fontWeight: '600',
        fontSize: 13,
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: 16,
    },
    emotionalIntro: {
        fontSize: 16,
        fontStyle: 'italic',
        color: theme.colors.text.tertiary,
        lineHeight: 26,
        marginBottom: theme.spacing.lg,
    },
    description: {
        fontSize: 16,
        color: theme.colors.text.secondary,
        lineHeight: 26,
    },
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
    policyCard: {
        flexDirection: 'row',
        gap: 16,
        backgroundColor: 'rgba(40, 201, 191, 0.08)',
        padding: 20,
        borderRadius: 16,
        marginBottom: 32,
        alignItems: 'center',
    },
    policyTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: 4,
    },
    policyDesc: {
        fontSize: 13,
        color: theme.colors.text.secondary,
        lineHeight: 18,
    },
    reviewItem: {
        backgroundColor: theme.colors.surface,
        padding: 16,
        borderRadius: 16,
        marginBottom: 16,
    },
    reviewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    reviewerName: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    reviewDate: {
        fontSize: 12,
        color: theme.colors.text.secondary,
    },
    reviewScore: {
        marginLeft: 'auto',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: theme.colors.surfaceLight,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    starSmall: { fontSize: 10 },
    scoreValue: { fontSize: 13, fontWeight: '700' },
    reviewText: {
        fontSize: 14,
        color: theme.colors.text.secondary,
        lineHeight: 22,
    },
    // Trust-building elements
    confirmationBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(37, 211, 102, 0.08)',
        padding: 14,
        borderRadius: 12,
        marginBottom: 12,
    },
    confirmationLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    confirmationTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    confirmationDesc: {
        fontSize: 12,
        color: theme.colors.text.secondary,
    },
    verificationLink: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 4,
        marginBottom: 16,
    },
    verificationLinkText: {
        flex: 1,
        fontSize: 13,
        color: theme.colors.verified,
        fontWeight: '500',
    },
    errorText: { fontSize: 16, color: 'red', textAlign: 'center', marginTop: 100 },
    // Related Packages Section
    relatedSection: {
        marginTop: 24,
        marginBottom: 16,
    },
    relatedTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: 16,
    },
    relatedScrollContent: {
        paddingRight: 24,
        gap: 16,
    },
    relatedCard: {
        width: 300,
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        overflow: 'hidden',
        ...theme.shadows.small,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    relatedImage: {
        width: '100%',
        height: 180,
        backgroundColor: theme.colors.surfaceLight,
    },
    relatedBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        ...theme.shadows.small,
    },
    relatedBadgeText: {
        fontSize: 11,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    relatedFavoriteButton: {
        position: 'absolute',
        top: 12,
        left: 12,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    relatedCardContent: {
        padding: 16,
    },
    relatedCardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text.primary,
        marginBottom: 8,
        lineHeight: 20,
    },
    relatedCardInfo: {
        fontSize: 13,
        color: theme.colors.text.secondary,
        marginBottom: 12,
    },
    relatedRating: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 12,
    },
    relatedRatingText: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.text.primary,
        marginLeft: 4,
    },
    relatedPriceContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    relatedPriceLabel: {
        fontSize: 11,
        color: theme.colors.text.secondary,
        marginBottom: 2,
    },
    relatedPriceValue: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.primary,
    },
    relatedPriceUnit: {
        fontSize: 11,
        color: theme.colors.text.secondary,
    },
    // Peace of Mind Block - Premium Reassurance Design
    peaceOfMindContainer: {
        backgroundColor: theme.colors.surfaceLight,
        borderRadius: theme.borderRadius.md,
        padding: 20,
        marginTop: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(40, 201, 191, 0.15)',
        ...theme.shadows.small,
    },
    peaceOfMindTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: 16,
        letterSpacing: -0.2,
    },
    peaceOfMindItems: {
        gap: 14,
    },
    peaceOfMindItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    peaceOfMindIconCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(40, 201, 191, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    peaceOfMindText: {
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
        color: theme.colors.text.primary,
        lineHeight: 22,
    },
    // Perfect For Block - User Identification
    perfectForContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: theme.borderRadius.md,
        padding: 20,
        marginTop: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        ...theme.shadows.small,
    },
    perfectForTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: 16,
        letterSpacing: -0.2,
    },
    perfectForItems: {
        gap: 14,
    },
    perfectForItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    perfectForIconCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(40, 201, 191, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    perfectForText: {
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
        color: theme.colors.text.primary,
        lineHeight: 22,
    },
});
