import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Alert,
    Linking,
    Share,
    Dimensions,
    StatusBar,
    Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../src/theme/theme';
import {
    getPurchasedItineraryById,
    SpendingProfile,
    AccommodationOption,
} from '../../src/data/mockPurchasedItineraries';
import { haptics } from '../../src/services/haptics';

const { width } = Dimensions.get('window');

export default function PurchasedItineraryScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const itinerary = getPurchasedItineraryById(id);

    // ─── State ──────────────────────────────────────────────
    const [selectedProfile, setSelectedProfile] = useState<'economico' | 'conforto' | 'luxo'>('conforto');
    const [travelers, setTravelers] = useState(1);
    const [customDays, setCustomDays] = useState(itinerary?.duration || 7);
    const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([1]));
    const [completedChecklist, setCompletedChecklist] = useState<Set<string>>(new Set());
    const [accommodationFilter, setAccommodationFilter] = useState<'all' | 'economico' | 'medio' | 'luxo'>('all');

    if (!itinerary) {
        return (
            <View style={styles.container}>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorEmoji}>📋</Text>
                    <Text style={styles.errorText}>Roteiro não encontrado</Text>
                    <TouchableOpacity style={styles.errorButton} onPress={() => router.back()}>
                        <Text style={styles.errorButtonText}>Voltar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // ─── Computed ────────────────────────────────────────────
    const currentProfile = itinerary.spendingProfiles?.find(p => p.id === selectedProfile);
    const totalEstimate = (currentProfile?.dailyCost || 0) * travelers * customDays;

    const filteredAccommodation = (itinerary.accommodationOptions || []).filter(
        acc => accommodationFilter === 'all' || acc.tier === accommodationFilter
    );

    // ─── Handlers ───────────────────────────────────────────
    const toggleDay = (dayNumber: number) => {
        haptics.light();
        setExpandedDays(prev => {
            const next = new Set(prev);
            if (next.has(dayNumber)) next.delete(dayNumber);
            else next.add(dayNumber);
            return next;
        });
    };

    const toggleChecklist = (itemId: string) => {
        haptics.light();
        setCompletedChecklist(prev => {
            const next = new Set(prev);
            if (next.has(itemId)) next.delete(itemId);
            else next.add(itemId);
            return next;
        });
    };

    const handleOpenMap = () => {
        haptics.light();
        const query = encodeURIComponent(`${itinerary.destination}, ${itinerary.country}`);
        Linking.openURL(`https://maps.google.com/?q=${query}`);
    };

    const handleDownload = () => {
        haptics.light();
        Alert.alert('📥 Download Offline', 'Em breve você poderá baixar seu roteiro para acesso offline!');
    };

    const handleShare = async () => {
        haptics.light();
        try {
            await Share.share({
                title: itinerary.title,
                message: `🗺️ Confira meu roteiro!\n\n${itinerary.title}\n📍 ${itinerary.destination}, ${itinerary.country}\n📅 ${itinerary.duration} dias\n\nCriado por ${itinerary.creator.name} no VAMO`,
            });
        } catch { }
    };

    const adjustTravelers = (delta: number) => {
        haptics.light();
        setTravelers(prev => Math.max(1, Math.min(10, prev + delta)));
    };

    const adjustDays = (delta: number) => {
        haptics.light();
        setCustomDays(prev => Math.max(1, Math.min(30, prev + delta)));
    };

    // ─── RENDER ─────────────────────────────────────────────
    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <ScrollView showsVerticalScrollIndicator={false}>

                {/* ══════════ BLOCO 1 — HEADER ══════════ */}
                <View style={styles.headerBlock}>
                    <Image source={{ uri: itinerary.images[0] }} style={styles.headerImage} />
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.6)']}
                        style={styles.headerGradient}
                    />
                    {/* Nav bar */}
                    <View style={styles.navBar}>
                        <TouchableOpacity style={styles.navBtn} onPress={() => router.back()}>
                            <Ionicons name="arrow-back" size={22} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.navTitle}>Meu Roteiro</Text>
                        <TouchableOpacity style={styles.navBtn} onPress={handleShare}>
                            <Ionicons name="share-outline" size={22} color="#fff" />
                        </TouchableOpacity>
                    </View>
                    {/* Info overlay */}
                    <View style={styles.headerInfo}>
                        <Text style={styles.headerTitle} numberOfLines={2}>{itinerary.title}</Text>
                        <Text style={styles.headerDest}>📍 {itinerary.destination}, {itinerary.country}</Text>
                        <View style={styles.headerMeta}>
                            <View style={styles.creatorBadge}>
                                <Text style={styles.creatorAvatar}>{itinerary.creator.avatar}</Text>
                                <Text style={styles.creatorName}>{itinerary.creator.name}</Text>
                            </View>
                            <View style={styles.ratingBadge}>
                                <Ionicons name="star" size={14} color="#FFC107" />
                                <Text style={styles.ratingText}>{itinerary.rating}</Text>
                                <Text style={styles.reviewCount}>({itinerary.reviewCount})</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Fixed download button */}
                <TouchableOpacity style={styles.downloadBar} onPress={handleDownload} activeOpacity={0.8}>
                    <Ionicons name="cloud-download-outline" size={20} color={theme.colors.primary} />
                    <Text style={styles.downloadBarText}>Baixar offline</Text>
                    <Ionicons name="chevron-forward" size={18} color={theme.colors.text.tertiary} />
                </TouchableOpacity>

                <View style={styles.body}>

                    {/* ══════════ BLOCO 2 — ESTIMATIVA DE GASTO ══════════ */}
                    {itinerary.spendingProfiles && (
                        <View style={styles.block}>
                            <Text style={styles.blockTitle}>💰 Estimativa de Gasto</Text>

                            {/* Profile Selector */}
                            <View style={styles.profileSelector}>
                                {itinerary.spendingProfiles.map(profile => (
                                    <TouchableOpacity
                                        key={profile.id}
                                        style={[
                                            styles.profilePill,
                                            selectedProfile === profile.id && styles.profilePillActive,
                                        ]}
                                        onPress={() => { haptics.light(); setSelectedProfile(profile.id); }}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={styles.profileIcon}>{profile.icon}</Text>
                                        <Text style={[
                                            styles.profileLabel,
                                            selectedProfile === profile.id && styles.profileLabelActive,
                                        ]}>
                                            {profile.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Adjusters */}
                            <View style={styles.adjustersRow}>
                                <View style={styles.adjuster}>
                                    <Text style={styles.adjusterLabel}>Viajantes</Text>
                                    <View style={styles.adjusterControls}>
                                        <TouchableOpacity style={styles.adjusterBtn} onPress={() => adjustTravelers(-1)}>
                                            <Ionicons name="remove" size={18} color={theme.colors.primary} />
                                        </TouchableOpacity>
                                        <Text style={styles.adjusterValue}>{travelers}</Text>
                                        <TouchableOpacity style={styles.adjusterBtn} onPress={() => adjustTravelers(1)}>
                                            <Ionicons name="add" size={18} color={theme.colors.primary} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                <View style={styles.adjuster}>
                                    <Text style={styles.adjusterLabel}>Dias</Text>
                                    <View style={styles.adjusterControls}>
                                        <TouchableOpacity style={styles.adjusterBtn} onPress={() => adjustDays(-1)}>
                                            <Ionicons name="remove" size={18} color={theme.colors.primary} />
                                        </TouchableOpacity>
                                        <Text style={styles.adjusterValue}>{customDays}</Text>
                                        <TouchableOpacity style={styles.adjusterBtn} onPress={() => adjustDays(1)}>
                                            <Ionicons name="add" size={18} color={theme.colors.primary} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>

                            {/* Total */}
                            <View style={styles.totalCard}>
                                <Text style={styles.totalLabel}>Estimativa total</Text>
                                <Text style={styles.totalAmount}>
                                    R$ {totalEstimate.toLocaleString('pt-BR')}
                                </Text>
                                <Text style={styles.totalDetail}>
                                    {travelers} viajante{travelers > 1 ? 's' : ''} × {customDays} dias × R$ {currentProfile?.dailyCost}/dia
                                </Text>
                            </View>

                            {/* Breakdown */}
                            {currentProfile && (
                                <View style={styles.breakdownCard}>
                                    <Text style={styles.breakdownTitle}>Custo médio diário por pessoa</Text>
                                    {currentProfile.breakdown.map((item, i) => (
                                        <View key={i} style={styles.breakdownRow}>
                                            <Text style={styles.breakdownCat}>{item.category}</Text>
                                            <Text style={styles.breakdownVal}>R$ {item.amount}</Text>
                                        </View>
                                    ))}
                                    <View style={[styles.breakdownRow, styles.breakdownTotal]}>
                                        <Text style={styles.breakdownTotalLabel}>Total/dia</Text>
                                        <Text style={styles.breakdownTotalVal}>R$ {currentProfile.dailyCost}</Text>
                                    </View>
                                </View>
                            )}
                        </View>
                    )}

                    {/* ══════════ BLOCO 3 — ITINERÁRIO POR DIA ══════════ */}
                    <View style={styles.block}>
                        <Text style={styles.blockTitle}>📅 Itinerário por Dia</Text>
                        {itinerary.days.map(day => (
                            <View key={day.dayNumber} style={styles.dayCard}>
                                <TouchableOpacity
                                    style={styles.dayHeader}
                                    onPress={() => toggleDay(day.dayNumber)}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.dayBadge}>
                                        <Text style={styles.dayBadgeText}>Dia {day.dayNumber}</Text>
                                    </View>
                                    <View style={styles.dayHeaderInfo}>
                                        <Text style={styles.dayTitle} numberOfLines={1}>{day.title}</Text>
                                        <Text style={styles.daySummary} numberOfLines={1}>{day.summary}</Text>
                                    </View>
                                    <Ionicons
                                        name={expandedDays.has(day.dayNumber) ? 'chevron-up' : 'chevron-down'}
                                        size={20}
                                        color={theme.colors.text.tertiary}
                                    />
                                </TouchableOpacity>

                                {expandedDays.has(day.dayNumber) && (
                                    <View style={styles.dayContent}>
                                        {day.activities.map((activity, idx) => (
                                            <View key={activity.id} style={styles.activityRow}>
                                                <View style={styles.activityTimeline}>
                                                    <View style={styles.activityDot} />
                                                    {idx < day.activities.length - 1 && (
                                                        <View style={styles.activityLine} />
                                                    )}
                                                </View>
                                                <View style={styles.activityContent}>
                                                    <View style={styles.activityTimeRow}>
                                                        <Text style={styles.activityIcon}>{activity.icon}</Text>
                                                        <Text style={styles.activityTime}>{activity.time}</Text>
                                                        <Text style={styles.activityDuration}>{activity.duration}</Text>
                                                    </View>
                                                    <Text style={styles.activityTitle}>{activity.title}</Text>
                                                    <Text style={styles.activityLocation}>📍 {activity.location}</Text>
                                                    <Text style={styles.activityDesc} numberOfLines={3}>
                                                        {activity.description}
                                                    </Text>

                                                    {/* Tips */}
                                                    {activity.tips.length > 0 && (
                                                        <View style={styles.tipsContainer}>
                                                            <Text style={styles.tipsTitle}>💡 Dicas:</Text>
                                                            {activity.tips.map((tip, ti) => (
                                                                <Text key={ti} style={styles.tipText}>• {tip}</Text>
                                                            ))}
                                                        </View>
                                                    )}

                                                    {/* Map link */}
                                                    {activity.mapLink && (
                                                        <TouchableOpacity
                                                            style={styles.miniMapBtn}
                                                            onPress={() => Linking.openURL(activity.mapLink!)}
                                                        >
                                                            <Ionicons name="map-outline" size={14} color={theme.colors.primary} />
                                                            <Text style={styles.miniMapText}>Ver no mapa</Text>
                                                        </TouchableOpacity>
                                                    )}
                                                </View>
                                            </View>
                                        ))}

                                        {/* Day estimated cost */}
                                        {day.estimatedCost && (
                                            <View style={styles.dayCostBadge}>
                                                <Ionicons name="wallet-outline" size={14} color={theme.colors.primary} />
                                                <Text style={styles.dayCostText}>
                                                    Estimativa: R$ {day.estimatedCost.min} — R$ {day.estimatedCost.max}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                )}
                            </View>
                        ))}
                    </View>

                    {/* ══════════ BLOCO 4 — MAPA INTEGRADO ══════════ */}
                    <View style={styles.block}>
                        <Text style={styles.blockTitle}>🗺️ Mapa Integrado</Text>
                        <TouchableOpacity style={styles.mapCard} onPress={handleOpenMap} activeOpacity={0.8}>
                            <LinearGradient
                                colors={[theme.colors.primary + '15', theme.colors.primary + '05']}
                                style={styles.mapGradient}
                            >
                                <Ionicons name="map" size={40} color={theme.colors.primary} />
                                <Text style={styles.mapTitle}>Ver no mapa</Text>
                                <Text style={styles.mapSubtitle}>
                                    Todos os pontos de {itinerary.destination} marcados
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                    {/* ══════════ BLOCO 5 — HOSPEDAGEM RECOMENDADA ══════════ */}
                    {itinerary.accommodationOptions && itinerary.accommodationOptions.length > 0 && (
                        <View style={styles.block}>
                            <Text style={styles.blockTitle}>🏨 Hospedagem Recomendada</Text>

                            {/* Filter */}
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                                {[
                                    { key: 'all', label: 'Todas' },
                                    { key: 'economico', label: '💰 Econômico' },
                                    { key: 'medio', label: '✨ Conforto' },
                                    { key: 'luxo', label: '👑 Luxo' },
                                ].map(f => (
                                    <TouchableOpacity
                                        key={f.key}
                                        style={[
                                            styles.filterPill,
                                            accommodationFilter === f.key && styles.filterPillActive,
                                        ]}
                                        onPress={() => { haptics.light(); setAccommodationFilter(f.key as any); }}
                                    >
                                        <Text style={[
                                            styles.filterLabel,
                                            accommodationFilter === f.key && styles.filterLabelActive,
                                        ]}>{f.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            {filteredAccommodation.map(acc => (
                                <View key={acc.id} style={styles.accCard}>
                                    <View style={styles.accHeader}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.accName}>{acc.name}</Text>
                                            <Text style={styles.accTier}>{acc.tierLabel}</Text>
                                        </View>
                                        <View style={styles.accPriceBadge}>
                                            <Text style={styles.accPrice}>{acc.priceRange}</Text>
                                        </View>
                                    </View>
                                    <Text style={styles.accLocation}>📍 {acc.location}</Text>
                                    <Text style={styles.accDesc}>{acc.description}</Text>
                                    {acc.rating && (
                                        <View style={styles.accRating}>
                                            <Ionicons name="star" size={13} color="#FFC107" />
                                            <Text style={styles.accRatingText}>{acc.rating}</Text>
                                        </View>
                                    )}
                                </View>
                            ))}
                        </View>
                    )}

                    {/* ══════════ BLOCO 6 — TRANSPORTE ══════════ */}
                    {itinerary.transport && (
                        <View style={styles.block}>
                            <Text style={styles.blockTitle}>🚇 Transporte</Text>

                            <View style={styles.transportHeader}>
                                <Text style={styles.transportMode}>{itinerary.transport.mainMode}</Text>
                                <Text style={styles.transportDesc}>{itinerary.transport.description}</Text>
                            </View>

                            {/* Passes */}
                            <Text style={styles.subTitle}>Passes recomendados</Text>
                            {itinerary.transport.passes.map((pass, i) => (
                                <View key={i} style={styles.passCard}>
                                    <View style={styles.passHeader}>
                                        <Text style={styles.passName}>{pass.name}</Text>
                                        <Text style={styles.passPrice}>{pass.price}</Text>
                                    </View>
                                    <Text style={styles.passDesc}>{pass.description}</Text>
                                </View>
                            ))}

                            {/* Tips */}
                            <Text style={styles.subTitle}>Observações importantes</Text>
                            <View style={styles.tipsBox}>
                                {itinerary.transport.tips.map((tip, i) => (
                                    <Text key={i} style={styles.transportTip}>• {tip}</Text>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* ══════════ BLOCO 7 — CHECKLIST ══════════ */}
                    <View style={styles.block}>
                        <Text style={styles.blockTitle}>✅ Checklist de Planejamento</Text>
                        <Text style={styles.checklistProgress}>
                            {completedChecklist.size} de {itinerary.checklist.length} concluídos
                        </Text>
                        {/* Progress bar */}
                        <View style={styles.progressBarBg}>
                            <View
                                style={[
                                    styles.progressBarFill,
                                    {
                                        width: itinerary.checklist.length > 0
                                            ? `${(completedChecklist.size / itinerary.checklist.length) * 100}%`
                                            : '0%',
                                    },
                                ]}
                            />
                        </View>

                        {['documents', 'packing', 'pre-trip'].map(category => {
                            const items = itinerary.checklist.filter(c => c.category === category);
                            if (items.length === 0) return null;
                            const categoryLabels: Record<string, string> = {
                                'documents': '📄 Documentos',
                                'packing': '🧳 Mala',
                                'pre-trip': '📋 Pré-viagem',
                            };
                            return (
                                <View key={category} style={styles.checkCategory}>
                                    <Text style={styles.checkCategoryLabel}>{categoryLabels[category]}</Text>
                                    {items.map(item => {
                                        const isChecked = completedChecklist.has(item.id) || item.completed;
                                        return (
                                            <TouchableOpacity
                                                key={item.id}
                                                style={styles.checkItem}
                                                onPress={() => toggleChecklist(item.id)}
                                                activeOpacity={0.7}
                                            >
                                                <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                                                    {isChecked && <Ionicons name="checkmark" size={14} color="#fff" />}
                                                </View>
                                                <Text style={[
                                                    styles.checkItemText,
                                                    isChecked && styles.checkItemTextDone,
                                                ]}>
                                                    {item.text}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            );
                        })}
                    </View>

                    {/* ══════════ BLOCO 8 — O QUE VOCÊ VAI RECEBER ══════════ */}
                    {itinerary.receiveList && (
                        <View style={styles.block}>
                            <Text style={styles.blockTitle}>🎁 O que você recebeu</Text>
                            <View style={styles.receiveCard}>
                                {itinerary.receiveList.map((item, i) => (
                                    <View key={i} style={styles.receiveRow}>
                                        <Text style={styles.receiveIcon}>{item.icon}</Text>
                                        <Text style={styles.receiveLabel}>{item.label}</Text>
                                        <Ionicons name="checkmark-circle" size={18} color={theme.colors.primary} />
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    <View style={{ height: 40 }} />
                </View>
            </ScrollView>
        </View>
    );
}

// ─── STYLES ─────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
    errorEmoji: { fontSize: 48, marginBottom: 16 },
    errorText: { fontSize: 16, color: theme.colors.text.secondary, marginBottom: 20 },
    errorButton: { backgroundColor: theme.colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
    errorButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },

    // ── Block 1: Header
    headerBlock: { width: '100%', height: 280, position: 'relative' },
    headerImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    headerGradient: { ...StyleSheet.absoluteFillObject },
    navBar: {
        position: 'absolute', top: 0, left: 0, right: 0,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingTop: Platform.OS === 'ios' ? 54 : 24, paddingHorizontal: 16,
    },
    navBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center',
    },
    navTitle: { fontSize: 17, fontWeight: '600', color: '#fff' },
    headerInfo: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: 20,
    },
    headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 4 },
    headerDest: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginBottom: 10 },
    headerMeta: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    creatorBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
    },
    creatorAvatar: { fontSize: 18 },
    creatorName: { fontSize: 13, fontWeight: '600', color: '#fff' },
    ratingBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
    },
    ratingText: { fontSize: 13, fontWeight: '700', color: '#fff' },
    reviewCount: { fontSize: 11, color: 'rgba(255,255,255,0.7)' },

    // Download Bar
    downloadBar: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        paddingVertical: 14, paddingHorizontal: 20,
        backgroundColor: theme.colors.primary + '10',
        borderBottomWidth: 1, borderBottomColor: theme.colors.border,
    },
    downloadBarText: { flex: 1, fontSize: 14, fontWeight: '600', color: theme.colors.primary },

    // ── Body
    body: { padding: 20 },

    // ── Block generic
    block: { marginBottom: 28 },
    blockTitle: { fontSize: 18, fontWeight: '800', color: theme.colors.text.primary, marginBottom: 16 },
    subTitle: { fontSize: 14, fontWeight: '700', color: theme.colors.text.primary, marginTop: 16, marginBottom: 10 },

    // ── Block 2: Spending
    profileSelector: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    profilePill: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        paddingVertical: 12, borderRadius: 12,
        backgroundColor: theme.colors.surface, borderWidth: 1.5, borderColor: theme.colors.border,
    },
    profilePillActive: { backgroundColor: theme.colors.primary + '15', borderColor: theme.colors.primary },
    profileIcon: { fontSize: 16 },
    profileLabel: { fontSize: 13, fontWeight: '600', color: theme.colors.text.secondary },
    profileLabelActive: { color: theme.colors.primary },

    adjustersRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    adjuster: {
        flex: 1, backgroundColor: theme.colors.surface, borderRadius: 14, padding: 14,
        alignItems: 'center', borderWidth: 1, borderColor: theme.colors.borderLight,
    },
    adjusterLabel: { fontSize: 12, fontWeight: '600', color: theme.colors.text.secondary, marginBottom: 8 },
    adjusterControls: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    adjusterBtn: {
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: theme.colors.primary + '15',
        alignItems: 'center', justifyContent: 'center',
    },
    adjusterValue: { fontSize: 20, fontWeight: '800', color: theme.colors.text.primary, minWidth: 28, textAlign: 'center' },

    totalCard: {
        backgroundColor: theme.colors.primary + '10', borderRadius: 16, padding: 20,
        alignItems: 'center', marginBottom: 12,
        borderWidth: 1, borderColor: theme.colors.primary + '30',
    },
    totalLabel: { fontSize: 12, fontWeight: '600', color: theme.colors.text.secondary, marginBottom: 4 },
    totalAmount: { fontSize: 28, fontWeight: '900', color: theme.colors.primary, marginBottom: 4 },
    totalDetail: { fontSize: 12, color: theme.colors.text.tertiary },

    breakdownCard: { backgroundColor: theme.colors.surface, borderRadius: 14, padding: 16 },
    breakdownTitle: { fontSize: 12, fontWeight: '600', color: theme.colors.text.secondary, marginBottom: 12 },
    breakdownRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.colors.borderLight,
    },
    breakdownCat: { fontSize: 14, color: theme.colors.text.primary },
    breakdownVal: { fontSize: 14, fontWeight: '600', color: theme.colors.text.primary },
    breakdownTotal: { borderBottomWidth: 0, marginTop: 4, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.colors.border },
    breakdownTotalLabel: { fontSize: 14, fontWeight: '700', color: theme.colors.text.primary },
    breakdownTotalVal: { fontSize: 16, fontWeight: '800', color: theme.colors.primary },

    // ── Block 3: Days
    dayCard: {
        backgroundColor: theme.colors.surface, borderRadius: 14, marginBottom: 10,
        overflow: 'hidden', borderWidth: 1, borderColor: theme.colors.borderLight,
    },
    dayHeader: {
        flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12,
    },
    dayBadge: {
        backgroundColor: theme.colors.primary, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
    },
    dayBadgeText: { fontSize: 12, fontWeight: '700', color: '#fff' },
    dayHeaderInfo: { flex: 1 },
    dayTitle: { fontSize: 15, fontWeight: '700', color: theme.colors.text.primary },
    daySummary: { fontSize: 12, color: theme.colors.text.secondary, marginTop: 2 },
    dayContent: { paddingHorizontal: 14, paddingBottom: 14 },

    activityRow: { flexDirection: 'row', marginBottom: 16 },
    activityTimeline: { width: 24, alignItems: 'center', marginRight: 12 },
    activityDot: {
        width: 10, height: 10, borderRadius: 5,
        backgroundColor: theme.colors.primary, marginTop: 6,
    },
    activityLine: {
        width: 2, flex: 1, backgroundColor: theme.colors.primary + '30', marginTop: 4,
    },
    activityContent: { flex: 1 },
    activityTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
    activityIcon: { fontSize: 16 },
    activityTime: { fontSize: 13, fontWeight: '700', color: theme.colors.primary },
    activityDuration: { fontSize: 11, color: theme.colors.text.tertiary, backgroundColor: theme.colors.surface, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    activityTitle: { fontSize: 15, fontWeight: '700', color: theme.colors.text.primary, marginBottom: 2 },
    activityLocation: { fontSize: 12, color: theme.colors.text.secondary, marginBottom: 4 },
    activityDesc: { fontSize: 13, color: theme.colors.text.secondary, lineHeight: 19, marginBottom: 8 },

    tipsContainer: { backgroundColor: '#FFF8E1', borderRadius: 10, padding: 12, marginBottom: 8 },
    tipsTitle: { fontSize: 12, fontWeight: '700', color: '#F59E0B', marginBottom: 6 },
    tipText: { fontSize: 12, color: '#92400E', lineHeight: 18 },

    miniMapBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6,
        backgroundColor: theme.colors.primary + '10', borderRadius: 8,
    },
    miniMapText: { fontSize: 12, fontWeight: '600', color: theme.colors.primary },

    dayCostBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        alignSelf: 'flex-start',
        backgroundColor: theme.colors.primary + '10', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
    },
    dayCostText: { fontSize: 12, fontWeight: '600', color: theme.colors.primary },

    // ── Block 4: Map
    mapCard: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: theme.colors.primary + '20' },
    mapGradient: { padding: 32, alignItems: 'center' },
    mapTitle: { fontSize: 17, fontWeight: '700', color: theme.colors.primary, marginTop: 12 },
    mapSubtitle: { fontSize: 13, color: theme.colors.text.secondary, marginTop: 4, textAlign: 'center' },

    // ── Block 5: Accommodation
    filterScroll: { marginBottom: 14 },
    filterPill: {
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
        backgroundColor: theme.colors.surface, marginRight: 8,
        borderWidth: 1, borderColor: theme.colors.border,
    },
    filterPillActive: { backgroundColor: theme.colors.primary + '15', borderColor: theme.colors.primary },
    filterLabel: { fontSize: 13, fontWeight: '600', color: theme.colors.text.secondary },
    filterLabelActive: { color: theme.colors.primary },

    accCard: {
        backgroundColor: theme.colors.surface, borderRadius: 14, padding: 16, marginBottom: 10,
        borderWidth: 1, borderColor: theme.colors.borderLight,
    },
    accHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
    accName: { fontSize: 15, fontWeight: '700', color: theme.colors.text.primary },
    accTier: { fontSize: 12, color: theme.colors.text.tertiary, marginTop: 2 },
    accPriceBadge: { backgroundColor: theme.colors.primary + '15', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
    accPrice: { fontSize: 12, fontWeight: '700', color: theme.colors.primary },
    accLocation: { fontSize: 13, color: theme.colors.text.secondary, marginBottom: 4 },
    accDesc: { fontSize: 13, color: theme.colors.text.secondary, lineHeight: 19 },
    accRating: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
    accRatingText: { fontSize: 13, fontWeight: '700', color: '#F59E0B' },

    // ── Block 6: Transport
    transportHeader: {
        backgroundColor: theme.colors.surface, borderRadius: 14, padding: 16, marginBottom: 12,
        borderWidth: 1, borderColor: theme.colors.borderLight,
    },
    transportMode: { fontSize: 16, fontWeight: '700', color: theme.colors.text.primary, marginBottom: 6 },
    transportDesc: { fontSize: 13, color: theme.colors.text.secondary, lineHeight: 20 },

    passCard: {
        backgroundColor: theme.colors.surface, borderRadius: 12, padding: 14, marginBottom: 8,
        borderWidth: 1, borderColor: theme.colors.borderLight,
    },
    passHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    passName: { fontSize: 14, fontWeight: '700', color: theme.colors.text.primary },
    passPrice: { fontSize: 13, fontWeight: '700', color: theme.colors.primary },
    passDesc: { fontSize: 12, color: theme.colors.text.secondary, lineHeight: 18 },

    tipsBox: { backgroundColor: theme.colors.surface, borderRadius: 14, padding: 16 },
    transportTip: { fontSize: 13, color: theme.colors.text.secondary, lineHeight: 22 },

    // ── Block 7: Checklist
    checklistProgress: { fontSize: 13, color: theme.colors.text.secondary, marginBottom: 10 },
    progressBarBg: {
        width: '100%', height: 6, borderRadius: 3,
        backgroundColor: theme.colors.surface, marginBottom: 16,
    },
    progressBarFill: {
        height: 6, borderRadius: 3, backgroundColor: theme.colors.primary,
    },
    checkCategory: { marginBottom: 16 },
    checkCategoryLabel: { fontSize: 14, fontWeight: '700', color: theme.colors.text.primary, marginBottom: 10 },
    checkItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
    checkbox: {
        width: 24, height: 24, borderRadius: 6,
        borderWidth: 2, borderColor: theme.colors.border,
        alignItems: 'center', justifyContent: 'center',
    },
    checkboxChecked: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
    checkItemText: { fontSize: 14, color: theme.colors.text.primary, flex: 1 },
    checkItemTextDone: { textDecorationLine: 'line-through', color: theme.colors.text.tertiary },

    // ── Block 8: Receive
    receiveCard: { backgroundColor: theme.colors.surface, borderRadius: 16, padding: 16 },
    receiveRow: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.colors.borderLight,
    },
    receiveIcon: { fontSize: 20 },
    receiveLabel: { flex: 1, fontSize: 14, color: theme.colors.text.primary, fontWeight: '500' },
});
