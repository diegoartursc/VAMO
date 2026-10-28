import { formatMoney } from '@vamo/shared/itinerary';
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Dimensions,
    StatusBar,
    Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { safeBack } from '../../src/utils/navigation';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../src/theme/theme';
import {
    getBookingById,
    getDaysUntilTrip,
    formatTripDates,
} from '../../src/data/mockBookingDetail';

const { width } = Dimensions.get('window');

export default function QuoteDetailsScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const booking = getBookingById(id);

    const [now, setNow] = useState(new Date());

    // Update countdown every minute
    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(interval);
    }, []);

    if (!booking) {
        return (
            <View style={styles.container}>
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={48} color={theme.colors.text.tertiary} />
                    <Text style={styles.errorText}>Booking not found</Text>
                    <TouchableOpacity onPress={() => safeBack(router, '/(tabs)/my-trips')} style={styles.errorButton}>
                        <Text style={styles.errorButtonText}>Back</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const dateRange = formatTripDates(booking.travelDate, booking.travelEndDate);

    // Mock flight quote data — will come from API in production
    const q = {
        status: 'QUOTED' as const,
        originCity: 'Chicago',
        airline: 'United Airlines',
        flightDetails: 'ORD → CDG · 1 stop (JFK) · Departs 10:45 AM · Arrives 7:30 AM +1',
        airfarePrice: 3200,
        totalPrice: 8400,
        terrestrePrice: booking.price || 5200,
        expiresAt: new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString(),
        agencyNote: 'We found the best fare! Includes 1 checked bag.',
    };

    // Calculate remaining time
    const getTimeRemaining = () => {
        if (!q.expiresAt) return '';
        const diff = new Date(q.expiresAt).getTime() - now.getTime();
        if (diff <= 0) return 'Expired';
        const hours = Math.floor(diff / 3600000);
        const mins = Math.floor((diff % 3600000) / 60000);
        return `${hours}h ${mins}min`;
    };

    const handleAcceptQuoteAndPay = () => {
        // Build url matching the expected params on checkout/payment
        router.push({
            pathname: '/checkout/payment',
            params: {
                packageId: booking.packageId,
                date: booking.travelDate,
                adults: booking.travelers.adults.toString(),
                children: booking.travelers.children.toString(),
                totalPrice: q.totalPrice.toString(),
                fullName: booking.contactName,
                email: booking.contactEmail,
                originCity: q.originCity,
            }
        });
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <ScrollView showsVerticalScrollIndicator={false}>

                {/* ═══ HEADER RESUMIDO ═══ */}
                <View style={styles.headerBlock}>
                    <Image source={{ uri: booking.image }} style={styles.headerImage} />
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.7)']}
                        style={styles.headerGradient}
                    />

                    {/* Nav */}
                    <View style={styles.navBar}>
                        <TouchableOpacity style={styles.navButton} onPress={() => safeBack(router, '/(tabs)/my-trips')}>
                            <Ionicons name="arrow-back" size={22} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.navTitle}>Quote Summary</Text>
                        <TouchableOpacity style={styles.navButton} onPress={() => {
                            Alert.alert('Help', 'Contact the agency with any questions.');
                        }}>
                            <Ionicons name="help-circle-outline" size={22} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    {/* Header Info overlay */}
                    <View style={styles.headerInfo}>
                        <Text style={styles.headerTitle}>{booking.title}</Text>
                        <View style={styles.headerMeta}>
                            <Ionicons name="location" size={14} color="rgba(255,255,255,0.8)" />
                            <Text style={styles.headerLocation}>{booking.destination}, {booking.country}</Text>
                        </View>
                        <Text style={styles.headerDates}>{dateRange}</Text>
                        
                        <View style={styles.passengersContainer}>
                            <Ionicons name="people" size={14} color="rgba(255,255,255,0.8)" />
                            <Text style={styles.headerLocation}>{booking.travelers.adults} Adults{booking.travelers.children > 0 ? `, ${booking.travelers.children} Children` : ''}</Text>
                        </View>
                    </View>
                </View>

                {/* ═══ CONTEÚDO DA COTAÇÃO ═══ */}
                <View style={styles.contentSection}>
                    
                    <Text style={styles.sectionTitle}>Your locked fare</Text>
                    <Text style={styles.sectionDescription}>
                        The agency found a great option departing from {q.originCity} with {booking.checkedBags > 0 ? `${booking.checkedBags} checked bag(s)` : 'carry-on only'}. Accept the proposal to lock in this fare.
                    </Text>

                    {/* Flight details Card */}
                    <View style={styles.quoteCard}>
                        {/* Quote Header */}
                        <View style={styles.quoteCardHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Ionicons name="airplane" size={20} color="#14b8a6" />
                                <Text style={styles.quoteCardTitle}>
                                    Flight + Package
                                </Text>
                            </View>
                            <View style={styles.timerBadge}>
                                <Ionicons name="time" size={14} color="#EF4444" />
                                <Text style={styles.timerText}>
                                    {getTimeRemaining()}
                                </Text>
                            </View>
                        </View>

                        {/* Flight Info */}
                        <View style={styles.quoteCardBody}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                <Text style={styles.airlineName}>
                                    {q.airline}
                                </Text>
                            </View>
                            <Text style={styles.flightDetailsText}>
                                {q.flightDetails}
                            </Text>

                            {/* Baggage info directly in the flight card */}
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, marginBottom: 12 }}>
                                <Ionicons name="bag" size={14} color={theme.colors.text.secondary} />
                                <Text style={{ fontSize: 13, color: theme.colors.text.secondary }}>
                                    {booking.checkedBags === 0 ? 'Carry-on only (22 lb)' : `${booking.checkedBags} checked bag(s) (50 lb each) included`}
                                </Text>
                            </View>

                            {/* Price breakdown */}
                            <View style={styles.priceBreakdownContainer}>
                                <View style={styles.priceRow}>
                                    <Text style={styles.priceLabel}>Land package</Text>
                                    <Text style={styles.priceLabel}>
                                        {formatMoney(q.terrestrePrice)}
                                    </Text>
                                </View>
                                <View style={styles.priceRow}>
                                    <Text style={styles.priceLabel}>Airfare ({q.airline})</Text>
                                    <Text style={styles.priceLabel}>
                                        {formatMoney(q.airfarePrice)}
                                    </Text>
                                </View>
                                <View style={styles.priceDivider} />
                                <View style={styles.priceRow}>
                                    <Text style={styles.totalLabel}>Total/person</Text>
                                    <Text style={styles.totalValue}>
                                        {formatMoney(q.totalPrice)}
                                    </Text>
                                </View>
                            </View>

                            {q.agencyNote && (
                                <View style={styles.agencyNoteContainer}>
                                    <Ionicons name="chatbubble-outline" size={16} color={theme.colors.text.tertiary} />
                                    <Text style={styles.agencyNoteText}>
                                        "{q.agencyNote}"
                                    </Text>
                                </View>
                            )}

                            {/* Action buttons */}
                            <TouchableOpacity
                                style={styles.acceptButton}
                                onPress={handleAcceptQuoteAndPay}
                            >
                                <Text style={styles.acceptButtonText}>
                                    💳 Ir para Pagamento
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.rejectButton}
                                onPress={() => Alert.alert('Decline proposal', 'Are you sure? The agency may send a new quote.', [
                                    { text: 'Cancel', style: 'cancel' },
                                    { text: 'Decline', style: 'destructive' },
                                ])}
                            >
                                <Text style={styles.rejectButtonText}>
                                    Decline offer
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* BOTÃO - VER DETALHES DO PACOTE (Requisitado) */}
                    <TouchableOpacity 
                        style={styles.viewPackageButton}
                        onPress={() => router.push(`/package/${booking.packageId}`)}
                    >
                        <Ionicons name="map-outline" size={20} color={theme.colors.primary} />
                        <Text style={styles.viewPackageButtonText}>View package details</Text>
                    </TouchableOpacity>

                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        fontSize: 18,
        color: theme.colors.text.secondary,
        marginTop: 12,
        marginBottom: 24,
    },
    errorButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: theme.colors.primary,
        borderRadius: 8,
    },
    errorButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    headerBlock: {
        height: 280,
        position: 'relative',
    },
    headerImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    headerGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 180,
    },
    navBar: {
        position: 'absolute',
        top: 0, left: 0, right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 50,
        zIndex: 10,
    },
    navButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    navTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    headerInfo: {
        position: 'absolute',
        bottom: 24,
        left: 20,
        right: 20,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 26,
        fontWeight: '800',
        marginBottom: 8,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    headerMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    passengersContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 4,
    },
    headerLocation: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 14,
        fontWeight: '500',
    },
    headerDates: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 14,
        fontWeight: '500',
    },
    contentSection: {
        padding: 20,
        paddingTop: 24,
        paddingBottom: 60,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: theme.colors.text.primary,
        marginBottom: 6,
    },
    sectionDescription: {
        fontSize: 15,
        color: theme.colors.text.secondary,
        lineHeight: 22,
        marginBottom: 20,
    },
    quoteCard: {
        backgroundColor: theme.colors.surface, 
        borderRadius: 16,
        borderWidth: 1.5, 
        borderColor: 'rgba(20, 184, 166, 0.4)',
        overflow: 'hidden',
        marginBottom: 24,
        elevation: 2,
        shadowColor: 'rgba(0,0,0,0.05)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 10,
    },
    quoteCardHeader: {
        backgroundColor: 'rgba(20, 184, 166, 0.08)',
        padding: 16, 
        flexDirection: 'row',
        justifyContent: 'space-between', 
        alignItems: 'center',
    },
    quoteCardTitle: {
        fontSize: 16, 
        fontWeight: '700', 
        color: '#14b8a6',
    },
    timerBadge: {
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 4,
        backgroundColor: 'rgba(239, 68, 68, 0.1)', 
        paddingHorizontal: 10,
        paddingVertical: 5, 
        borderRadius: 20,
    },
    timerText: {
        fontSize: 12, 
        fontWeight: '700', 
        color: '#EF4444',
    },
    quoteCardBody: {
        padding: 18,
    },
    airlineName: {
        fontSize: 20, 
        fontWeight: '800', 
        color: theme.colors.text.primary,
    },
    flightDetailsText: {
        fontSize: 14, 
        color: theme.colors.text.secondary, 
        marginBottom: 16, 
        lineHeight: 22,
    },
    priceBreakdownContainer: {
        backgroundColor: 'rgba(20, 184, 166, 0.05)',
        borderRadius: 12, 
        padding: 16, 
        gap: 8, 
        marginBottom: 16,
    },
    priceRow: {
        flexDirection: 'row', 
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    priceLabel: {
        fontSize: 14, 
        color: theme.colors.text.secondary,
    },
    priceDivider: {
        height: 1, 
        backgroundColor: 'rgba(20, 184, 166, 0.2)', 
        marginVertical: 4,
    },
    totalLabel: {
        fontSize: 16, 
        fontWeight: '800', 
        color: '#14b8a6'
    },
    totalValue: {
        fontSize: 18, 
        fontWeight: '800', 
        color: '#14b8a6'
    },
    agencyNoteContainer: {
        flexDirection: 'row', 
        alignItems: 'flex-start', 
        gap: 8,
        marginBottom: 20,
        backgroundColor: '#F1F5F9',
        padding: 12,
        borderRadius: 8,
    },
    agencyNoteText: {
        fontSize: 14, 
        color: theme.colors.text.secondary, 
        fontStyle: 'italic', 
        flex: 1,
        lineHeight: 20,
    },
    acceptButton: {
        backgroundColor: '#14b8a6', 
        borderRadius: 12,
        paddingVertical: 16, 
        alignItems: 'center', 
        marginBottom: 10,
        shadowColor: '#14b8a6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    acceptButtonText: {
        color: '#fff', 
        fontSize: 16, 
        fontWeight: '700'
    },
    rejectButton: {
        borderRadius: 12, 
        paddingVertical: 14, 
        alignItems: 'center',
        borderWidth: 1, 
        borderColor: theme.colors.border,
    },
    rejectButtonText: {
        color: theme.colors.text.secondary, 
        fontSize: 14, 
        fontWeight: '600'
    },
    viewPackageButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        paddingVertical: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    viewPackageButtonText: {
        color: theme.colors.primary,
        fontSize: 15,
        fontWeight: '600',
    }
});
