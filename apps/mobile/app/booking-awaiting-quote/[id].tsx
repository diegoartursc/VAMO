import React from 'react';
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
    formatTripDates,
} from '../../src/data/mockBookingDetail';

const { width } = Dimensions.get('window');

export default function BookingAwaitingQuoteScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const booking = getBookingById(id);

    if (!booking) {
        return (
            <View style={styles.container}>
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={48} color={theme.colors.text.tertiary} />
                    <Text style={styles.errorText}>Reserva não encontrada</Text>
                    <TouchableOpacity onPress={() => safeBack(router, '/(tabs)/my-trips')} style={styles.errorButton}>
                        <Text style={styles.errorButtonText}>Voltar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const dateRange = formatTripDates(booking.travelDate, booking.travelEndDate);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <ScrollView showsVerticalScrollIndicator={false}>

                {/* ═══ HEADER ═══ */}
                <View style={styles.headerBlock}>
                    <Image source={{ uri: booking.image }} style={styles.headerImage} />
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.75)']}
                        style={styles.headerGradient}
                    />
                    <View style={styles.navBar}>
                        <TouchableOpacity style={styles.navButton} onPress={() => safeBack(router, '/(tabs)/my-trips')}>
                            <Ionicons name="arrow-back" size={22} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.navTitle}>Detalhes do Pedido</Text>
                        <View style={{ width: 40 }} />
                    </View>
                    <View style={styles.headerInfo}>
                        <Text style={styles.headerTitle}>{booking.title}</Text>
                        <View style={styles.headerMeta}>
                            <Ionicons name="location" size={14} color="rgba(255,255,255,0.8)" />
                            <Text style={styles.headerLocation}>{booking.destination}, {booking.country}</Text>
                        </View>
                        <Text style={styles.headerDates}>{dateRange}</Text>
                        <View style={styles.passengersRow}>
                            <Ionicons name="people" size={14} color="rgba(255,255,255,0.8)" />
                            <Text style={styles.headerLocation}>
                                {booking.travelers.adults} Adulto{booking.travelers.adults > 1 ? 's' : ''}
                                {booking.travelers.children > 0 ? `, ${booking.travelers.children} Criança${booking.travelers.children > 1 ? 's' : ''}` : ''}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* ═══ STATUS BANNER ═══ */}
                <View style={styles.contentSection}>
                    <View style={styles.statusBanner}>
                        <View style={styles.statusIconContainer}>
                            <Ionicons name="search" size={32} color="#0891B2" />
                        </View>
                        <Text style={styles.statusTitle}>Cotação em andamento</Text>
                        <Text style={styles.statusDescription}>
                            A agência {booking.agencyName} está buscando as melhores passagens aéreas saindo da sua cidade.
                            Assim que a proposta estiver pronta, você receberá uma notificação para revisar e pagar.
                        </Text>
                    </View>

                    {/* ─── Timeline do Pedido ─── */}
                    <Text style={styles.sectionTitle}>📋 Acompanhamento</Text>
                    <View style={styles.timelineContainer}>
                        {booking.timeline.map((step, index) => {
                            const isLast = index === booking.timeline.length - 1;
                            const statusColor = step.status === 'completed' ? '#16A34A'
                                : step.status === 'in_progress' ? '#0891B2' : '#CBD5E1';
                            const bgColor = step.status === 'completed' ? '#DCFCE7'
                                : step.status === 'in_progress' ? '#CFFAFE' : '#F1F5F9';
                            return (
                                <View key={step.id} style={styles.timelineStep}>
                                    <View style={styles.timelineLeft}>
                                        {!isLast && (
                                            <View style={[styles.timelineConnector, { backgroundColor: statusColor }]} />
                                        )}
                                        <View style={[styles.timelineIcon, { backgroundColor: bgColor }]}>
                                            <Ionicons
                                                name={step.icon as any}
                                                size={18}
                                                color={statusColor}
                                            />
                                        </View>
                                    </View>
                                    <View style={styles.timelineContent}>
                                        <Text style={[styles.timelineTitle, step.status === 'completed' && styles.timelineTitleCompleted]}>
                                            {step.title}
                                        </Text>
                                        <Text style={styles.timelineDescription}>{step.description}</Text>
                                        {step.completedDate && (
                                            <Text style={styles.timelineDate}>
                                                {new Date(step.completedDate).toLocaleDateString('pt-BR')}
                                            </Text>
                                        )}
                                    </View>
                                </View>
                            );
                        })}
                    </View>

                    {/* ─── O que está incluso ─── */}
                    <Text style={styles.sectionTitle}>✅ O que está incluso</Text>
                    <View style={styles.inclusionsContainer}>
                        {booking.checkedBags > 0 && (
                            <View style={styles.inclusionRow}>
                                <Text style={styles.inclusionIcon}>🧳</Text>
                                <View style={styles.inclusionContent}>
                                    <Text style={styles.inclusionLabel}>{booking.checkedBags} Bagagem(ns) Despachada(s)</Text>
                                    <Text style={styles.inclusionDetail}>Malas de até 23kg inclusas na cotação que a agência fará</Text>
                                </View>
                            </View>
                        )}
                        {booking.inclusions.map((inc) => (
                            <View key={inc.id} style={styles.inclusionRow}>
                                <Text style={styles.inclusionIcon}>{inc.icon}</Text>
                                <View style={styles.inclusionContent}>
                                    <Text style={styles.inclusionLabel}>{inc.label}</Text>
                                    <Text style={styles.inclusionDetail}>{inc.detail}</Text>
                                </View>
                            </View>
                        ))}
                    </View>

                    {/* ─── Contato com a agência ─── */}
                    <View style={styles.agencyCard}>
                        <Text style={styles.agencyLogo}>{booking.agencyLogo}</Text>
                        <View style={styles.agencyContent}>
                            <Text style={styles.agencyName}>{booking.agencyName}</Text>
                            <Text style={styles.agencyLabel}>Agência responsável</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.agencyContact}
                            onPress={() => Alert.alert('Contato', `Entrando em contato com ${booking.agencyName}...`)}
                        >
                            <Ionicons name="chatbubble-ellipses" size={20} color={theme.colors.primary} />
                        </TouchableOpacity>
                    </View>

                    {/* ─── Ver detalhes do pacote (Universal) ─── */}
                    <TouchableOpacity
                        style={styles.viewPackageButton}
                        onPress={() => router.push(`/package/${booking.packageId}`)}
                    >
                        <Ionicons name="map-outline" size={20} color={theme.colors.primary} />
                        <Text style={styles.viewPackageButtonText}>Ver detalhes do pacote</Text>
                    </TouchableOpacity>

                    <View style={{ height: 40 }} />
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    errorText: { fontSize: 18, color: theme.colors.text.secondary, marginTop: 12, marginBottom: 24 },
    errorButton: { paddingHorizontal: 24, paddingVertical: 12, backgroundColor: theme.colors.primary, borderRadius: 8 },
    errorButtonText: { color: '#fff', fontWeight: 'bold' },

    // Header
    headerBlock: { height: 280, position: 'relative' },
    headerImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    headerGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 200 },
    navBar: {
        position: 'absolute', top: 0, left: 0, right: 0,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 16, paddingTop: 50, zIndex: 10,
    },
    navButton: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center',
    },
    navTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
    headerInfo: { position: 'absolute', bottom: 24, left: 20, right: 20 },
    headerTitle: {
        color: '#fff', fontSize: 26, fontWeight: '800', marginBottom: 8,
        textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4,
    },
    headerMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
    passengersRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
    headerLocation: { color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '500' },
    headerDates: { color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '500' },

    // Content
    contentSection: { padding: 20, paddingTop: 24, paddingBottom: 20 },

    // Status Banner
    statusBanner: {
        backgroundColor: '#CFFAFE',
        borderRadius: 16, padding: 24,
        alignItems: 'center', marginBottom: 28,
        borderWidth: 1.5, borderColor: 'rgba(8, 145, 178, 0.3)',
    },
    statusIconContainer: {
        width: 64, height: 64, borderRadius: 32,
        backgroundColor: 'rgba(8, 145, 178, 0.15)',
        justifyContent: 'center', alignItems: 'center', marginBottom: 16,
    },
    statusTitle: { fontSize: 20, fontWeight: '800', color: '#0E7490', marginBottom: 8 },
    statusDescription: {
        fontSize: 15, color: '#155E75', lineHeight: 22, textAlign: 'center',
    },

    // Section Title
    sectionTitle: { fontSize: 18, fontWeight: '800', color: theme.colors.text.primary, marginBottom: 16, marginTop: 8 },

    // Timeline
    timelineContainer: { marginBottom: 28 },
    timelineStep: { flexDirection: 'row', marginBottom: 4 },
    timelineLeft: { width: 44, alignItems: 'center', position: 'relative' },
    timelineConnector: {
        position: 'absolute', top: 36, width: 2, height: '100%',
        left: 21, zIndex: 0,
    },
    timelineIcon: {
        width: 36, height: 36, borderRadius: 18,
        justifyContent: 'center', alignItems: 'center', zIndex: 1,
    },
    timelineContent: { flex: 1, paddingLeft: 12, paddingBottom: 20 },
    timelineTitle: { fontSize: 15, fontWeight: '700', color: theme.colors.text.primary, marginBottom: 2 },
    timelineTitleCompleted: { color: '#16A34A' },
    timelineDescription: { fontSize: 13, color: theme.colors.text.secondary, lineHeight: 18 },
    timelineDate: { fontSize: 12, color: theme.colors.text.tertiary, marginTop: 2 },

    // Inclusions
    inclusionsContainer: {
        backgroundColor: theme.colors.surface, borderRadius: 12,
        padding: 16, gap: 16, marginBottom: 24, borderWidth: 1, borderColor: theme.colors.border,
    },
    inclusionRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    inclusionIcon: { fontSize: 22 },
    inclusionContent: { flex: 1 },
    inclusionLabel: { fontSize: 15, fontWeight: '600', color: theme.colors.text.primary },
    inclusionDetail: { fontSize: 13, color: theme.colors.text.secondary, marginTop: 2 },

    // Agency
    agencyCard: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: theme.colors.surface, borderRadius: 12,
        padding: 16, marginBottom: 20,
        borderWidth: 1, borderColor: theme.colors.border,
    },
    agencyLogo: { fontSize: 32 },
    agencyContent: { flex: 1 },
    agencyName: { fontSize: 16, fontWeight: '700', color: theme.colors.text.primary },
    agencyLabel: { fontSize: 13, color: theme.colors.text.secondary },
    agencyContact: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: `${theme.colors.primary}15`, justifyContent: 'center', alignItems: 'center',
    },

    // View Package Button
    viewPackageButton: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, backgroundColor: '#F1F5F9', borderRadius: 12,
        paddingVertical: 16, borderWidth: 1, borderColor: '#E2E8F0',
    },
    viewPackageButtonText: { color: theme.colors.primary, fontSize: 15, fontWeight: '600' },
});
