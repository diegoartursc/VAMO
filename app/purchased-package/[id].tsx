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
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../src/theme/theme';
import {
    getBookingById,
    getDaysUntilTrip,
    isPostTrip,
    formatTripDates,
    formatFullDate,
    TimelineStepStatus,
} from '../../src/data/mockBookingDetail';

const { width } = Dimensions.get('window');

export default function PurchasedPackageScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const booking = getBookingById(id);

    const [now, setNow] = useState(new Date());
    const [expandedDay, setExpandedDay] = useState<number | null>(1);

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
                    <Text style={styles.errorText}>Reserva não encontrada</Text>
                    <TouchableOpacity onPress={() => router.back()} style={styles.errorButton}>
                        <Text style={styles.errorButtonText}>Voltar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const daysUntil = getDaysUntilTrip(booking.travelDate);
    const postTrip = isPostTrip(booking.travelEndDate);
    const dateRange = formatTripDates(booking.travelDate, booking.travelEndDate);

    const statusConfig = {
        confirmed: { label: 'Confirmado', color: theme.colors.success, icon: 'checkmark-circle' as const },
        pending_payment: { label: 'Aguardando pagamento', color: '#F59E0B', icon: 'time' as const },
        cancelled: { label: 'Cancelado', color: '#EF4444', icon: 'close-circle' as const },
    };
    const currentStatus = statusConfig[booking.status];

    const timelineStatusConfig: Record<TimelineStepStatus, { color: string; bgColor: string }> = {
        completed: { color: theme.colors.success, bgColor: `${theme.colors.success}15` },
        in_progress: { color: '#F59E0B', bgColor: '#FEF3C7' },
        pending: { color: theme.colors.text.tertiary, bgColor: theme.colors.surface },
    };

    const countdownText = () => {
        if (postTrip) return 'Viagem realizada';
        if (daysUntil <= 0) return 'Hoje!';
        if (daysUntil === 1) return 'Amanhã!';
        return `${daysUntil} dias`;
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <ScrollView showsVerticalScrollIndicator={false}>

                {/* ═══ BLOCO 1 — HEADER RESUMIDO ═══ */}
                <View style={styles.headerBlock}>
                    <Image source={{ uri: booking.image }} style={styles.headerImage} />
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.7)']}
                        style={styles.headerGradient}
                    />

                    {/* Nav */}
                    <View style={styles.navBar}>
                        <TouchableOpacity style={styles.navButton} onPress={() => router.back()}>
                            <Ionicons name="arrow-back" size={22} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.navTitle}>Central da Viagem</Text>
                        <TouchableOpacity style={styles.navButton} onPress={() => {
                            Alert.alert('Ajuda', 'Entre em contato com a agência para qualquer dúvida.');
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
                    </View>
                </View>

                {/* Status + Countdown bar */}
                <View style={styles.statusBar}>
                    <View style={styles.statusBadge}>
                        <Ionicons name={currentStatus.icon} size={16} color={currentStatus.color} />
                        <Text style={[styles.statusText, { color: currentStatus.color }]}>
                            {currentStatus.label}
                        </Text>
                    </View>
                    {!postTrip && (
                        <View style={styles.countdownBadge}>
                            <Ionicons name="time-outline" size={16} color={theme.colors.primary} />
                            <Text style={styles.countdownText}>
                                {daysUntil <= 7 ? '🔥 ' : ''}{countdownText()}
                            </Text>
                        </View>
                    )}
                </View>

                {/* ═══ BOTÃO — VER DETALHES DO PACOTE ═══ */}
                <TouchableOpacity
                    style={styles.viewPackageButton}
                    onPress={() => router.push(`/package/${booking.packageId}`)}
                    activeOpacity={0.8}
                >
                    <View style={styles.viewPackageContent}>
                        <View style={styles.viewPackageIconCircle}>
                            <Ionicons name="document-text" size={20} color={theme.colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.viewPackageTitle}>Ver Detalhes do Pacote</Text>
                            <Text style={styles.viewPackageSubtitle}>Veja todas as informações, fotos e avaliações</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={theme.colors.primary} />
                    </View>
                </TouchableOpacity>

                {/* Content Area */}
                <View style={styles.content}>

                    {/* ═══ BLOCO 2 — LINHA DO TEMPO ═══ */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>📋 Linha do Tempo</Text>
                        <View style={styles.timelineContainer}>
                            {booking.timeline.map((step, index) => {
                                const config = timelineStatusConfig[step.status];
                                const isLast = index === booking.timeline.length - 1;
                                return (
                                    <View key={step.id} style={styles.timelineStep}>
                                        {/* Connector line */}
                                        {!isLast && (
                                            <View style={[
                                                styles.timelineConnector,
                                                { backgroundColor: step.status === 'completed' ? theme.colors.success : theme.colors.border },
                                            ]} />
                                        )}
                                        {/* Icon */}
                                        <View style={[styles.timelineIcon, { backgroundColor: config.bgColor }]}>
                                            {step.status === 'completed' ? (
                                                <Ionicons name="checkmark" size={18} color={config.color} />
                                            ) : step.status === 'in_progress' ? (
                                                <Ionicons name="time" size={18} color={config.color} />
                                            ) : (
                                                <Ionicons name={step.icon as any} size={18} color={config.color} />
                                            )}
                                        </View>
                                        {/* Text */}
                                        <View style={styles.timelineContent}>
                                            <Text style={[
                                                styles.timelineTitle,
                                                step.status === 'completed' && styles.timelineTitleCompleted,
                                            ]}>
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
                    </View>

                    {/* ═══ BLOCO 2.5 — ITINERÁRIO DETALHADO ═══ */}
                    {booking.detailedItinerary && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>🗺️ Itinerário Detalhado</Text>
                            <View style={styles.itineraryContainer}>
                                {booking.detailedItinerary.map((dayItem) => {
                                    const isExpanded = expandedDay === dayItem.day;
                                    return (
                                        <View key={dayItem.day} style={styles.dayCard}>
                                            <TouchableOpacity
                                                style={styles.dayHeader}
                                                onPress={() => setExpandedDay(isExpanded ? null : dayItem.day)}
                                                activeOpacity={0.7}
                                            >
                                                <View style={styles.dayBadge}>
                                                    <Text style={styles.dayBadgeText}>DIA {dayItem.day}</Text>
                                                </View>
                                                <Text style={styles.dayTitle} numberOfLines={1}>
                                                    {dayItem.title}
                                                </Text>
                                                <Ionicons
                                                    name={isExpanded ? "chevron-up" : "chevron-down"}
                                                    size={20}
                                                    color={theme.colors.text.tertiary}
                                                />
                                            </TouchableOpacity>

                                            {isExpanded && (
                                                <View style={styles.dayContent}>
                                                    {dayItem.activities.map((activity, index) => {
                                                        const isLast = index === dayItem.activities.length - 1;
                                                        return (
                                                            <View key={activity.id} style={styles.activityItem}>
                                                                {/* Time Column */}
                                                                <View style={styles.activityTimeCol}>
                                                                    <Text style={styles.activityTime}>{activity.time}</Text>
                                                                    {!isLast && <View style={styles.activityLine} />}
                                                                </View>

                                                                {/* Content Column */}
                                                                <View style={styles.activityContent}>
                                                                    <View style={[
                                                                        styles.activityCard,
                                                                        activity.isHighlight && styles.activityCardHighlight
                                                                    ]}>
                                                                        <View style={styles.activityHeader}>
                                                                            <View style={[
                                                                                styles.activityIcon,
                                                                                activity.isHighlight && { backgroundColor: `${theme.colors.primary}20` }
                                                                            ]}>
                                                                                <Ionicons
                                                                                    name={activity.icon as any || 'ellipse'}
                                                                                    size={16}
                                                                                    color={activity.isHighlight ? theme.colors.primary : theme.colors.text.secondary}
                                                                                />
                                                                            </View>
                                                                            <Text style={styles.activityTitle}>{activity.title}</Text>
                                                                        </View>

                                                                        <Text style={styles.activityDesc}>{activity.description}</Text>

                                                                        {activity.location && (
                                                                            <View style={styles.activityMetaRow}>
                                                                                <Ionicons name="location-outline" size={12} color={theme.colors.text.tertiary} />
                                                                                <Text style={styles.activityMetaText}>{activity.location}</Text>
                                                                            </View>
                                                                        )}

                                                                        {activity.tips && (
                                                                            <View style={styles.activityTip}>
                                                                                <Ionicons name="bulb-outline" size={14} color="#D97706" />
                                                                                <Text style={styles.activityTipText}>{activity.tips}</Text>
                                                                            </View>
                                                                        )}
                                                                    </View>
                                                                </View>
                                                            </View>
                                                        );
                                                    })}
                                                </View>
                                            )}
                                        </View>
                                    );
                                })}
                            </View>
                        </View>
                    )}

                    {/* ═══ BLOCO 3 — DOCUMENTOS ═══ */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>📄 Documentos</Text>
                        <View style={styles.documentsGrid}>
                            {booking.documents.map((doc) => (
                                <TouchableOpacity
                                    key={doc.id}
                                    style={[
                                        styles.documentCard,
                                        !doc.available && styles.documentCardDisabled,
                                    ]}
                                    onPress={() => {
                                        if (doc.available) {
                                            Alert.alert(doc.title, `Abrindo ${doc.title.toLowerCase()}...`);
                                        } else {
                                            Alert.alert('Indisponível', 'Este documento estará disponível em breve.');
                                        }
                                    }}
                                >
                                    <View style={[
                                        styles.documentIconContainer,
                                        { backgroundColor: doc.available ? `${theme.colors.primary}15` : theme.colors.surface },
                                    ]}>
                                        <Ionicons
                                            name={doc.icon as any}
                                            size={24}
                                            color={doc.available ? theme.colors.primary : theme.colors.text.tertiary}
                                        />
                                    </View>
                                    <Text style={[
                                        styles.documentTitle,
                                        !doc.available && styles.documentTitleDisabled,
                                    ]}>
                                        {doc.title}
                                    </Text>
                                    <Text style={styles.documentDescription}>{doc.description}</Text>
                                    {!doc.available && (
                                        <View style={styles.unavailableBadge}>
                                            <Text style={styles.unavailableText}>Em breve</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* ═══ BLOCO 4 — INCLUSÕES OBJETIVAS ═══ */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>✅ O que está incluso</Text>
                        <View style={styles.inclusionsContainer}>
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
                    </View>

                    {/* ═══ BLOCO 5 — PREPARAÇÃO PARA A VIAGEM ═══ */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>🎒 Preparação para a Viagem</Text>
                        {booking.preparation.map((prep) => (
                            <View key={prep.id} style={styles.prepCard}>
                                <View style={styles.prepHeader}>
                                    <Text style={styles.prepIcon}>{prep.icon}</Text>
                                    <Text style={styles.prepTitle}>{prep.title}</Text>
                                </View>
                                {prep.items.map((item, idx) => (
                                    <View key={idx} style={styles.prepItem}>
                                        <View style={styles.prepBullet} />
                                        <Text style={styles.prepItemText}>{item}</Text>
                                    </View>
                                ))}
                            </View>
                        ))}
                    </View>

                    {/* ═══ BLOCO 6 — PÓS-VIAGEM (CONDICIONAL) ═══ */}
                    {postTrip && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>🌟 Pós-Viagem</Text>
                            <View style={styles.postTripCard}>
                                <Text style={styles.postTripTitle}>Como foi sua experiência?</Text>
                                <Text style={styles.postTripSubtitle}>
                                    Ajude outros viajantes compartilhando sua opinião
                                </Text>

                                <TouchableOpacity
                                    style={styles.postTripPrimaryButton}
                                    onPress={() => Alert.alert('Avaliar', 'Funcionalidade em desenvolvimento')}
                                >
                                    <Ionicons name="star" size={20} color="#fff" />
                                    <Text style={styles.postTripPrimaryText}>Avaliar viagem</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.postTripSecondaryButton}
                                    onPress={() => Alert.alert('Repetir', 'Buscando pacote semelhante...')}
                                >
                                    <Ionicons name="refresh" size={20} color={theme.colors.primary} />
                                    <Text style={styles.postTripSecondaryText}>Repetir pacote</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.postTripSecondaryButton}
                                    onPress={() => Alert.alert('Fotos', 'Galeria da comunidade em breve!')}
                                >
                                    <Ionicons name="images" size={20} color={theme.colors.primary} />
                                    <Text style={styles.postTripSecondaryText}>Ver fotos da comunidade</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {/* Agency contact */}
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
    errorContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
    },
    errorText: {
        fontSize: 16,
        color: theme.colors.text.secondary,
    },
    errorButton: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 8,
    },
    errorButtonText: {
        color: '#fff',
        fontWeight: '600',
    },

    // ─── HEADER ─────────────────────────
    headerBlock: {
        width: '100%',
        height: width * 0.5,
        position: 'relative',
    },
    headerImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    headerGradient: {
        ...StyleSheet.absoluteFillObject,
    },
    navBar: {
        position: 'absolute',
        top: 48,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
    },
    navButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    navTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    headerInfo: {
        position: 'absolute',
        bottom: 16,
        left: 16,
        right: 16,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 4,
    },
    headerMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 4,
    },
    headerLocation: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.85)',
    },
    headerDates: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.7)',
    },

    // ─── STATUS BAR ─────────────────────
    statusBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 14,
        backgroundColor: theme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#fff',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    statusText: {
        fontSize: 13,
        fontWeight: '600',
    },
    countdownBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: `${theme.colors.primary}10`,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    countdownText: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.colors.primary,
    },

    // ─── VIEW PACKAGE BUTTON ────────────
    viewPackageButton: {
        marginHorizontal: 20,
        marginTop: 16,
        backgroundColor: theme.colors.surface,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: theme.colors.border,
        overflow: 'hidden',
    },
    viewPackageContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        padding: 16,
    },
    viewPackageIconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: `${theme.colors.primary}15`,
        alignItems: 'center',
        justifyContent: 'center',
    },
    viewPackageTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: 2,
    },
    viewPackageSubtitle: {
        fontSize: 13,
        color: theme.colors.text.secondary,
    },

    // ─── CONTENT ────────────────────────
    content: {
        paddingHorizontal: 20,
        paddingTop: 8,
    },
    section: {
        marginTop: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: 16,
    },

    // ─── ITINERARY ───────────────────────
    itineraryContainer: {
        marginTop: 8,
        gap: 16,
    },
    dayCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.colors.border,
        overflow: 'hidden',
    },
    dayHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 12,
        backgroundColor: theme.colors.surface,
    },
    dayBadge: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    dayBadgeText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#fff',
    },
    dayTitle: {
        flex: 1,
        fontSize: 15,
        fontWeight: '700',
        color: theme.colors.text.primary,
    },
    dayContent: {
        padding: 16,
        paddingTop: 0,
        backgroundColor: '#fafafa', // Light grey background for content
        borderTopWidth: 1,
        borderTopColor: theme.colors.borderLight || '#E5E7EB',
    },
    activityItem: {
        flexDirection: 'row',
        gap: 16,
    },
    activityTimeCol: {
        alignItems: 'center',
        width: 45,
        paddingTop: 16,
    },
    activityTime: {
        fontSize: 12,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: 8,
    },
    activityLine: {
        width: 2,
        flex: 1,
        backgroundColor: theme.colors.border,
        borderRadius: 1,
    },
    activityContent: {
        flex: 1,
        paddingBottom: 16,
        paddingTop: 16,
    },
    activityCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: theme.colors.borderLight || '#E5E7EB',
        ...theme.shadows?.small,
    },
    activityCardHighlight: {
        borderColor: `${theme.colors.primary}40`,
        backgroundColor: '#F0FDFA', // Light Teal bg
    },
    activityHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 8,
    },
    activityIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: theme.colors.surfaceLight || '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    activityTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.colors.text.primary,
        flex: 1,
    },
    activityDesc: {
        fontSize: 13,
        color: theme.colors.text.secondary,
        lineHeight: 18,
        marginBottom: 8,
    },
    activityMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
    },
    activityMetaText: {
        fontSize: 12,
        color: theme.colors.text.tertiary,
    },
    activityTip: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        marginTop: 10,
        backgroundColor: '#FFFBEB', // Amber 50
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#FDE68A', // Amber 200
    },
    activityTipText: {
        fontSize: 12,
        color: '#D97706', // Amber 700
        flex: 1,
        lineHeight: 16,
    },

    // ─── TIMELINE ───────────────────────
    timelineContainer: {
        gap: 0,
    },
    timelineStep: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 14,
        position: 'relative',
        paddingBottom: 24,
    },
    timelineConnector: {
        position: 'absolute',
        left: 18,
        top: 40,
        bottom: 0,
        width: 2,
    },
    timelineIcon: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
    },
    timelineContent: {
        flex: 1,
        paddingTop: 2,
    },
    timelineTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.colors.text.primary,
        marginBottom: 2,
    },
    timelineTitleCompleted: {
        color: theme.colors.success,
    },
    timelineDescription: {
        fontSize: 13,
        color: theme.colors.text.secondary,
    },
    timelineDate: {
        fontSize: 12,
        color: theme.colors.text.tertiary,
        marginTop: 2,
    },

    // ─── DOCUMENTS ──────────────────────
    documentsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    documentCard: {
        width: (width - 52) / 2,
        backgroundColor: theme.colors.surface,
        borderRadius: 14,
        padding: 16,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    documentCardDisabled: {
        opacity: 0.6,
    },
    documentIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    documentTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text.primary,
        marginBottom: 4,
    },
    documentTitleDisabled: {
        color: theme.colors.text.tertiary,
    },
    documentDescription: {
        fontSize: 12,
        color: theme.colors.text.tertiary,
        lineHeight: 16,
    },
    unavailableBadge: {
        marginTop: 8,
        alignSelf: 'flex-start',
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    unavailableText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#D97706',
    },

    // ─── INCLUSIONS ─────────────────────
    inclusionsContainer: {
        backgroundColor: theme.colors.surface,
        borderRadius: 14,
        padding: 16,
        gap: 16,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    inclusionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    inclusionIcon: {
        fontSize: 24,
    },
    inclusionContent: {
        flex: 1,
    },
    inclusionLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    inclusionDetail: {
        fontSize: 13,
        color: theme.colors.text.secondary,
        marginTop: 1,
    },

    // ─── PREPARATION ────────────────────
    prepCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: 14,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    prepHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    prepIcon: {
        fontSize: 20,
    },
    prepTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    prepItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 4,
    },
    prepBullet: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: theme.colors.primary,
    },
    prepItemText: {
        fontSize: 14,
        color: theme.colors.text.secondary,
        flex: 1,
    },

    // ─── POST-TRIP ──────────────────────
    postTripCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    postTripTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: 6,
    },
    postTripSubtitle: {
        fontSize: 14,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        marginBottom: 20,
    },
    postTripPrimaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: theme.colors.primary,
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 12,
        width: '100%',
        marginBottom: 10,
    },
    postTripPrimaryText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    postTripSecondaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 12,
        width: '100%',
        borderWidth: 1,
        borderColor: theme.colors.border,
        marginBottom: 8,
    },
    postTripSecondaryText: {
        color: theme.colors.primary,
        fontSize: 15,
        fontWeight: '600',
    },

    // ─── AGENCY ─────────────────────────
    agencyCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        backgroundColor: theme.colors.surface,
        borderRadius: 14,
        padding: 16,
        marginTop: 24,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    agencyLogo: {
        fontSize: 32,
    },
    agencyContent: {
        flex: 1,
    },
    agencyName: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    agencyLabel: {
        fontSize: 13,
        color: theme.colors.text.tertiary,
    },
    agencyContact: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: `${theme.colors.primary}15`,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
