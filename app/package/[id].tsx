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
import { getPackageById } from '../../src/data/mockPackages';
import { getReviewsByPackageId } from '../../src/data/mockReviews';
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
                        <View>
                            <Text style={styles.priceLabel}>Preço total por pessoa</Text>
                            <View style={styles.priceRow}>
                                <Text style={styles.currencySymbol}>R$</Text>
                                <Text style={styles.priceValue}>{packageData.price.min.toLocaleString('pt-BR')}</Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={styles.bookButton}
                            onPress={() => setShowDatePicker(true)}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.bookButtonText}>Verificar Disponibilidade</Text>
                            <Ionicons name="arrow-forward" size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    {/* About Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Sobre a experiência</Text>
                        <Text style={styles.description}>{packageData.description}</Text>
                    </View>

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

                    {/* Cancellation Policy */}
                    <View style={styles.policyCard}>
                        <Ionicons name="shield-checkmark-outline" size={24} color={theme.colors.success} />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.policyTitle}>Cancelamento Gratuito</Text>
                            <Text style={styles.policyDesc}>Reembolso integral se cancelado até 24h antes.</Text>
                        </View>
                    </View>

                    {/* Reviews Section */}
                    {reviews.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Avaliações ({packageData.reviewCount})</Text>
                            {displayedReviews.map((review) => (
                                <View key={review.id} style={styles.reviewItem}>
                                    <View style={styles.reviewHeader}>
                                        <View style={[styles.avatar, { backgroundColor: review.user.avatar }]}>
                                            <Text style={styles.avatarText}>{review.user.initial}</Text>
                                        </View>
                                        <View>
                                            <Text style={styles.reviewerName}>{review.user.name}</Text>
                                            <Text style={styles.reviewDate}>{review.date}</Text>
                                        </View>
                                        <View style={styles.reviewScore}>
                                            <Text style={styles.starSmall}>⭐</Text>
                                            <Text style={styles.scoreValue}>{review.rating}</Text>
                                        </View>
                                    </View>
                                    <Text style={styles.reviewText}>{review.text}</Text>
                                </View>
                            ))}
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
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
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: 16,
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
});
