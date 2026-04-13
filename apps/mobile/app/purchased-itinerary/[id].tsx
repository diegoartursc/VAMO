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
    AttractionInfo,
} from '../../src/data/mockPurchasedItineraries';
import { haptics } from '../../src/services/haptics';
import { hasUserReviewed, getUserReviewForPackage } from '../../src/data/mockReviews';
import { Icon } from '../../src/components/common/Icons';
import ReviewModal from '../../src/components/reviews/ReviewModal';

const { width } = Dimensions.get('window');

export default function PurchasedItineraryScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const itinerary = getPurchasedItineraryById(id);

    // ─── State ──────────────────────────────────────────────
    const [travelers, setTravelers] = useState(1);
    const [customDays, setCustomDays] = useState(itinerary?.duration || 7);
    const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([1]));
    const [completedChecklist, setCompletedChecklist] = useState<Set<string>>(new Set());
    const [reviewed, setReviewed] = useState(false);

    if (!itinerary) {
        return (
            <View style={styles.container}>
                <View style={styles.errorContainer}>
                    <Icon name="file" size={48} color={theme.colors.text.tertiary} />
                    <Text style={styles.errorText}>Roteiro não encontrado</Text>
                    <TouchableOpacity style={styles.errorButton} onPress={() => router.back()}>
                        <Text style={styles.errorButtonText}>Voltar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // ─── Computed ────────────────────────────────────────────
    const currentProfile = itinerary.spendingProfile;
    const totalEstimate = (currentProfile?.dailyCost || 0) * travelers * customDays;

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
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10 }}>
                                <Icon name="location" size={13} color="rgba(255,255,255,0.85)" />
                                <Text style={[styles.headerDest, { marginBottom: 0 }]}>{itinerary.destination}, {itinerary.country}</Text>
                            </View>
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

                    {/* ══════════ BLOCO 1.5 — RESUMO DA EXPERIÊNCIA ══════════ */}
                    <View style={styles.block}>
                        <Text style={styles.blockTitle}>Sobre a Experiência</Text>
                        <View style={styles.tripInfoCard}>
                            <View style={styles.tripInfoRow}>
                                <Ionicons name="calendar-outline" size={18} color={theme.colors.primary} />
                                <View style={styles.tripInfoContent}>
                                    <Text style={styles.tripInfoLabel}>Período da viagem</Text>
                                    <Text style={styles.tripInfoValue}>
                                        {new Date(itinerary.tripStartDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })} — {new Date(itinerary.tripEndDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.tripInfoDivider} />
                            <View style={styles.tripInfoRow}>
                                <Ionicons name="time-outline" size={18} color={theme.colors.primary} />
                                <View style={styles.tripInfoContent}>
                                    <Text style={styles.tripInfoLabel}>Duração</Text>
                                    <Text style={styles.tripInfoValue}>{itinerary.duration} dias</Text>
                                </View>
                            </View>
                            <View style={styles.tripInfoDivider} />
                            <View style={styles.tripInfoRow}>
                                <Ionicons name="location-outline" size={18} color={theme.colors.primary} />
                                <View style={styles.tripInfoContent}>
                                    <Text style={styles.tripInfoLabel}>Destino</Text>
                                    <Text style={styles.tripInfoValue}>{itinerary.destination}, {itinerary.country}</Text>
                                </View>
                            </View>
                            {itinerary.highlights && itinerary.highlights.length > 0 && (
                                <>
                                    <View style={styles.tripInfoDivider} />
                                    <View style={styles.tripInfoRow}>
                                        <Ionicons name="star-outline" size={18} color={theme.colors.primary} />
                                        <View style={styles.tripInfoContent}>
                                            <Text style={styles.tripInfoLabel}>Destaques</Text>
                                            {itinerary.highlights.map((h: string, i: number) => (
                                                <Text key={i} style={styles.tripInfoHighlight}>• {h}</Text>
                                            ))}
                                        </View>
                                    </View>
                                </>
                            )}
                        </View>
                    </View>

                    {/* ══════════ BLOCO 2 — ESTIMATIVA DE GASTO ══════════ */}
                    {itinerary.spendingProfile && (
                        <View style={styles.block}>
                            <Text style={styles.blockTitle}>Estimativa de Gasto</Text>

                            {/* Experience Badge — shows the actual tier of this trip */}
                            <View style={styles.experienceBadge}>
                                <Text style={styles.experienceBadgeIcon}>{itinerary.spendingProfile.icon}</Text>
                                <View>
                                    <Text style={styles.experienceBadgeLabel}>Experiência vivida</Text>
                                    <Text style={styles.experienceBadgeValue}>{itinerary.spendingProfile.label}</Text>
                                </View>
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

                    {/* ══════════ BLOCO 2.5 — MEU VOO ══════════ */}
                    {itinerary.flightInfo && (
                        <View style={styles.block}>
                            <Text style={styles.blockTitle}>Meu Voo</Text>

                            {/* Ida */}
                            <Text style={styles.subTitle}>Ida</Text>
                            <View style={styles.flightCard}>
                                <View style={styles.flightHeader}>
                                    <Text style={styles.flightAirline}>{itinerary.flightInfo.outbound.airline}</Text>
                                    <View style={styles.flightPriceBadge}>
                                        <Text style={styles.flightPrice}>{itinerary.flightInfo.outbound.pricePaid}</Text>
                                    </View>
                                </View>
                                <Text style={styles.flightRoute}>{itinerary.flightInfo.outbound.route}</Text>
                                <View style={styles.flightDetails}>
                                    <Text style={styles.flightTime}>{itinerary.flightInfo.outbound.departure} → {itinerary.flightInfo.outbound.arrival}</Text>
                                    <Text style={styles.flightDuration}>{itinerary.flightInfo.outbound.duration}</Text>
                                    <Text style={styles.flightStops}>
                                        {itinerary.flightInfo.outbound.stops === 0 ? 'Direto' : `${itinerary.flightInfo.outbound.stops} parada${itinerary.flightInfo.outbound.stops > 1 ? 's' : ''}`}
                                    </Text>
                                </View>
                            </View>

                            {/* Volta */}
                            <Text style={styles.subTitle}>Volta</Text>
                            <View style={styles.flightCard}>
                                <View style={styles.flightHeader}>
                                    <Text style={styles.flightAirline}>{itinerary.flightInfo.return.airline}</Text>
                                    <View style={styles.flightPriceBadge}>
                                        <Text style={styles.flightPrice}>{itinerary.flightInfo.return.pricePaid}</Text>
                                    </View>
                                </View>
                                <Text style={styles.flightRoute}>{itinerary.flightInfo.return.route}</Text>
                                <View style={styles.flightDetails}>
                                    <Text style={styles.flightTime}>{itinerary.flightInfo.return.departure} → {itinerary.flightInfo.return.arrival}</Text>
                                    <Text style={styles.flightDuration}>{itinerary.flightInfo.return.duration}</Text>
                                    <Text style={styles.flightStops}>
                                        {itinerary.flightInfo.return.stops === 0 ? 'Direto' : `${itinerary.flightInfo.return.stops} parada${itinerary.flightInfo.return.stops > 1 ? 's' : ''}`}
                                    </Text>
                                </View>
                            </View>

                            {/* Dicas do viajante */}
                            {itinerary.flightInfo.tips.length > 0 && (
                                <>
                                    <Text style={styles.subTitle}>Dicas do viajante</Text>
                                    <View style={styles.flightTipsCard}>
                                        {itinerary.flightInfo.tips.map((tip, i) => (
                                            <Text key={i} style={styles.flightTip}>• {tip}</Text>
                                        ))}
                                    </View>
                                </>
                            )}
                        </View>
                    )}

                    {/* ══════════ BLOCO 3 — ITINERÁRIO POR DIA ══════════ */}
                    <View style={styles.block}>
                        <Text style={styles.blockTitle}>Itinerário por Dia</Text>
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
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 4 }}>
                                                        <Icon name="location" size={11} color={theme.colors.text.secondary} />
                                                        <Text style={[styles.activityLocation, { marginBottom: 0 }]}>{activity.location}</Text>
                                                    </View>
                                                    <Text style={styles.activityDesc} numberOfLines={3}>
                                                        {activity.description}
                                                    </Text>

                                                    {/* Tips */}
                                                    {activity.tips.length > 0 && (
                                                        <View style={styles.tipsContainer}>
                                                            <Text style={styles.tipsTitle}>Dicas:</Text>
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

                    {/* ══════════ BLOCO 5 — HOSPEDAGEM RECOMENDADA ══════════ */}
                    {itinerary.accommodationOptions && itinerary.accommodationOptions.length > 0 && (
                        <View style={styles.block}>
                            <Text style={styles.blockTitle}>Onde Fiquei</Text>

                            {itinerary.accommodationOptions.map(acc => (
                                <View key={acc.id} style={styles.accCard}>
                                    <View style={styles.accHeader}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.accName}>{acc.name}</Text>
                                        </View>
                                        <View style={styles.accPriceBadge}>
                                            <Text style={styles.accPrice}>{acc.priceRange}</Text>
                                        </View>
                                    </View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 4 }}>
                                        <Icon name="location" size={11} color={theme.colors.text.secondary} />
                                        <Text style={[styles.accLocation, { marginBottom: 0 }]}>{acc.location}</Text>
                                    </View>
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

                    {/* ══════════ BLOCO 5.5 — PASSEIOS & ATRAÇÕES ══════════ */}
                    {itinerary.attractions && itinerary.attractions.length > 0 && (
                        <View style={styles.block}>
                            <Text style={styles.blockTitle}>Passeios & Atrações</Text>
                            <Text style={styles.blockSubtitle}>
                                {itinerary.attractions.length} atrações selecionadas pelo criador
                            </Text>
                            {itinerary.attractions.map((att: AttractionInfo, i: number) => (
                                <View key={i} style={styles.attractionCard}>
                                    {/* Header: nome + tipo + preço */}
                                    <View style={styles.attractionHeader}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.attractionName}>{att.name}</Text>
                                            <View style={styles.attractionMeta}>
                                                {att.type ? (
                                                    <View style={styles.attractionTypeBadge}>
                                                        <Text style={styles.attractionTypeText}>{att.type}</Text>
                                                    </View>
                                                ) : null}
                                                {att.location ? (
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                                                        <Icon name="location" size={11} color={theme.colors.text.secondary} />
                                                        <Text style={styles.attractionLocation} numberOfLines={1}>{att.location}</Text>
                                                    </View>
                                                ) : null}
                                            </View>
                                        </View>
                                        {att.ticketPrice ? (
                                            <View style={styles.attractionPriceBadge}>
                                                <Icon name="card" size={12} color={theme.colors.primary} />
                                                <Text style={styles.attractionPrice}>{att.ticketPrice}</Text>
                                            </View>
                                        ) : null}
                                    </View>

                                    {/* Info row: horário + duração */}
                                    {(att.hours || att.duration) ? (
                                        <View style={styles.attractionInfoRow}>
                                            {att.hours ? (
                                                <View style={styles.attractionInfoChip}>
                                                    <Icon name="clock" size={12} color={theme.colors.text.secondary} />
                                                    <Text style={styles.attractionInfoText}>{att.hours}</Text>
                                                </View>
                                            ) : null}
                                            {att.duration ? (
                                                <View style={styles.attractionInfoChip}>
                                                    <Icon name="compass" size={12} color={theme.colors.text.secondary} />
                                                    <Text style={styles.attractionInfoText}>{att.duration}</Text>
                                                </View>
                                            ) : null}
                                        </View>
                                    ) : null}

                                    {/* Descrição */}
                                    {att.description ? (
                                        <Text style={styles.attractionDesc}>{att.description}</Text>
                                    ) : null}

                                    {/* Dica */}
                                    {att.tips ? (
                                        <View style={styles.attractionTipBox}>
                                            <Icon name="lightbulb" size={13} color={theme.colors.primary} />
                                            <Text style={styles.attractionTip}>{att.tips}</Text>
                                        </View>
                                    ) : null}

                                    {/* Link externo */}
                                    {att.externalLink ? (
                                        <TouchableOpacity
                                            style={styles.attractionLinkBtn}
                                            onPress={() => { haptics.light(); Linking.openURL(att.externalLink!); }}
                                            activeOpacity={0.8}
                                        >
                                            <Icon name="external-link" size={14} color={theme.colors.primary} />
                                            <Text style={styles.attractionLinkText}>Ver site oficial</Text>
                                        </TouchableOpacity>
                                    ) : null}
                                </View>
                            ))}
                        </View>
                    )}

                    {/* ══════════ BLOCO 6 — TRANSPORTE ══════════ */}
                    {itinerary.transport && (
                        <View style={styles.block}>
                            <Text style={styles.blockTitle}>Transporte</Text>

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

                    {/* ══════════ BLOCO 6.5 — RESTAURANTES & GASTRONOMIA ══════════ */}
                    {itinerary.restaurants && itinerary.restaurants.length > 0 && (
                        <View style={styles.block}>
                            <Text style={styles.blockTitle}>Restaurantes & Gastronomia</Text>
                            {itinerary.restaurants.map((rest, i) => (
                                <View key={i} style={styles.restaurantCard}>
                                    <View style={styles.restaurantHeader}>
                                        <View style={{ flex: 1 }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                <Text style={styles.restaurantName}>{rest.name}</Text>
                                                {rest.cuisine ? (
                                                    <View style={styles.cuisineTag}>
                                                        <Text style={styles.cuisineTagText}>{rest.cuisine}</Text>
                                                    </View>
                                                ) : null}
                                            </View>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                                                <Icon name="location" size={11} color={theme.colors.text.secondary} />
                                                <Text style={styles.restaurantLocation}>{rest.location}</Text>
                                            </View>
                                        </View>
                                        {rest.priceRange && (
                                            <View style={styles.restaurantPriceBadge}>
                                                <Text style={styles.restaurantPrice}>{rest.priceRange}</Text>
                                            </View>
                                        )}
                                    </View>
                                    {rest.description ? (
                                        <Text style={styles.restaurantDesc}>{rest.description}</Text>
                                    ) : null}
                                    {rest.hours ? (
                                        <Text style={styles.restaurantHours}>{rest.hours}</Text>
                                    ) : null}
                                    {rest.tips ? (
                                        <View style={styles.restaurantTipBox}>
                                            <Text style={styles.restaurantTip}>💡 {rest.tips}</Text>
                                        </View>
                                    ) : null}
                                </View>
                            ))}
                        </View>
                    )}

                    {/* ══════════ BLOCO 6.7 — DICAS GERAIS DO VIAJANTE ══════════ */}
                    {itinerary.generalTips && itinerary.generalTips.length > 0 && (
                        <View style={styles.block}>
                            <Text style={styles.blockTitle}>Dicas do Viajante</Text>
                            <Text style={styles.generalTipsSubtitle}>
                                Recomendações de {itinerary.creator.name}
                            </Text>
                            <View style={styles.generalTipsBox}>
                                {itinerary.generalTips.map((tip, i) => (
                                    <View key={i} style={styles.generalTipRow}>
                                        <Text style={styles.generalTipBullet}>•</Text>
                                        <Text style={styles.generalTipText}>{tip}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* ══════════ BLOCO 7 — CHECKLIST ══════════ */}
                    <View style={styles.block}>
                        <Text style={styles.blockTitle}>Checklist de Planejamento</Text>
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
                                'documents': 'Documentos',
                                'packing': 'Mala',
                                'pre-trip': 'Pré-viagem',
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
                            <Text style={styles.blockTitle}>O que você recebeu</Text>
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

                    {/* ══════════ BLOCO 9 — AVALIAR ROTEIRO ══════════ */}
                    <View style={styles.block}>
                        <Text style={styles.blockTitle}>Avaliar este Roteiro</Text>
                        {reviewed || hasUserReviewed('trav-diego', `itinerary-${id}`) ? (
                            <View style={styles.reviewDoneCard}>
                                <View style={styles.reviewDoneHeader}>
                                    <Icon name="verified" size={20} color={theme.colors.primary} />
                                    <Text style={styles.reviewDoneTitle}>Você já avaliou!</Text>
                                </View>
                                {(() => {
                                    const existing = getUserReviewForPackage('trav-diego', `itinerary-${id}`);
                                    return existing ? (
                                        <>
                                            <View style={styles.reviewDoneStars}>
                                                {[1,2,3,4,5].map(s => (
                                                    <Ionicons key={s} name={s <= existing.rating ? 'star' : 'star-outline'} size={18} color="#FFD700" />
                                                ))}
                                            </View>
                                            <Text style={styles.reviewDoneText} numberOfLines={3}>{existing.text}</Text>
                                        </>
                                    ) : (
                                        <Text style={styles.reviewDoneText}>Avaliação enviada com sucesso!</Text>
                                    );
                                })()}
                            </View>
                        ) : (
                            <View style={styles.reviewCTACard}>
                                <LinearGradient
                                    colors={[theme.colors.primary + '15', theme.colors.primary + '05']}
                                    style={styles.reviewCTAGradient}
                                >
                                    <Ionicons name="chatbubble-ellipses-outline" size={36} color={theme.colors.primary} />
                                    <Text style={styles.reviewCTATitle}>Como foi sua experiência?</Text>
                                    <Text style={styles.reviewCTASubtitle}>
                                        Sua avaliação ajuda outros viajantes a decidirem.
                                    </Text>
                                    <TouchableOpacity
                                        style={styles.reviewCTAButton}
                                        onPress={() => { haptics.light(); router.push({ pathname: '/write-review', params: { itineraryId: id } } as any); }}
                                        activeOpacity={0.8}
                                    >
                                        <Ionicons name="star" size={18} color="#fff" />
                                        <Text style={styles.reviewCTAButtonText}>Escrever Avaliação</Text>
                                    </TouchableOpacity>
                                </LinearGradient>
                            </View>
                        )}
                    </View>

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

    // ── Block 1.5: Trip Info
    tripInfoCard: {
        backgroundColor: theme.colors.surface, borderRadius: 16, padding: 20,
        borderWidth: 1, borderColor: theme.colors.borderLight,
    },
    tripInfoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, paddingVertical: 4 },
    tripInfoContent: { flex: 1 },
    tripInfoLabel: { fontSize: 11, fontWeight: '600', color: theme.colors.text.tertiary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
    tripInfoValue: { fontSize: 14, fontWeight: '600', color: theme.colors.text.primary, lineHeight: 20 },
    tripInfoDivider: { height: 1, backgroundColor: theme.colors.borderLight, marginVertical: 10 },
    tripInfoHighlight: { fontSize: 13, color: theme.colors.text.secondary, lineHeight: 20 },

    // ── Block 2: Spending
    experienceBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: theme.colors.primary + '10', paddingHorizontal: 16, paddingVertical: 12,
        borderRadius: 14, marginBottom: 16, borderWidth: 1, borderColor: theme.colors.primary + '30',
    },
    experienceBadgeIcon: { fontSize: 28 },
    experienceBadgeLabel: { fontSize: 11, fontWeight: '600', color: theme.colors.text.tertiary, marginBottom: 2 },
    experienceBadgeValue: { fontSize: 16, fontWeight: '800', color: theme.colors.primary },

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

    accCard: {
        backgroundColor: theme.colors.surface, borderRadius: 14, padding: 16, marginBottom: 10,
        borderWidth: 1, borderColor: theme.colors.borderLight,
    },
    accHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
    accName: { fontSize: 15, fontWeight: '700', color: theme.colors.text.primary },

    accPriceBadge: { backgroundColor: theme.colors.primary + '15', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
    accPrice: { fontSize: 12, fontWeight: '700', color: theme.colors.primary },
    accLocation: { fontSize: 13, color: theme.colors.text.secondary, marginBottom: 4 },
    accDesc: { fontSize: 13, color: theme.colors.text.secondary, lineHeight: 19 },
    accRating: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
    accRatingText: { fontSize: 13, fontWeight: '700', color: '#F59E0B' },

    // ── Block 2.5: Flights
    flightCard: {
        backgroundColor: theme.colors.surface, borderRadius: 14, padding: 16, marginBottom: 10,
        borderWidth: 1, borderColor: theme.colors.borderLight,
    },
    flightHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    flightAirline: { fontSize: 15, fontWeight: '700', color: theme.colors.text.primary },
    flightPriceBadge: { backgroundColor: theme.colors.success + '15', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
    flightPrice: { fontSize: 12, fontWeight: '700', color: theme.colors.success },
    flightRoute: { fontSize: 14, fontWeight: '600', color: theme.colors.primary, marginBottom: 8 },
    flightDetails: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    flightTime: { fontSize: 13, color: theme.colors.text.secondary },
    flightDuration: { fontSize: 13, color: theme.colors.text.secondary },
    flightStops: { fontSize: 13, color: theme.colors.text.secondary },
    flightTipsCard: {
        backgroundColor: theme.colors.surface, borderRadius: 14, padding: 16,
        borderWidth: 1, borderColor: theme.colors.borderLight,
    },
    flightTip: { fontSize: 13, color: theme.colors.text.secondary, lineHeight: 22 },

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

    // ── Block 9: Review CTA
    reviewCTACard: {
        borderRadius: 16, overflow: 'hidden',
        borderWidth: 1, borderColor: theme.colors.primary + '20',
    },
    reviewCTAGradient: {
        padding: 28, alignItems: 'center',
    },
    reviewCTATitle: {
        fontSize: 18, fontWeight: '800', color: theme.colors.text.primary,
        marginTop: 12, marginBottom: 6,
    },
    reviewCTASubtitle: {
        fontSize: 13, color: theme.colors.text.secondary,
        textAlign: 'center', marginBottom: 20, lineHeight: 19,
    },
    reviewCTAButton: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: theme.colors.primary, paddingHorizontal: 24,
        paddingVertical: 14, borderRadius: 100,
    },
    reviewCTAButtonText: {
        fontSize: 15, fontWeight: '700', color: '#fff',
    },
    reviewDoneCard: {
        backgroundColor: theme.colors.surface, borderRadius: 16,
        padding: 20, borderWidth: 1, borderColor: theme.colors.borderLight,
    },
    reviewDoneHeader: {
        flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10,
    },
    reviewDoneTitle: {
        fontSize: 15, fontWeight: '700', color: theme.colors.primary,
    },
    reviewDoneStars: {
        flexDirection: 'row', gap: 4, marginBottom: 8,
    },
    reviewDoneText: {
        fontSize: 14, color: theme.colors.text.secondary, lineHeight: 20, marginBottom: 14,
    },
    reviewEditBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 8,
        backgroundColor: theme.colors.primary + '10', borderRadius: 10,
    },
    reviewEditBtnText: {
        fontSize: 13, fontWeight: '600', color: theme.colors.primary,
    },

    // ─── Restaurant Block ───
    restaurantCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        padding: 14,
        marginBottom: 10,
    },
    restaurantHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    restaurantName: {
        fontSize: 15,
        fontWeight: '700',
        color: theme.colors.text.primary,
    },
    cuisineTag: {
        backgroundColor: theme.colors.primary + '15',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    cuisineTagText: {
        fontSize: 11,
        fontWeight: '600',
        color: theme.colors.primary,
    },
    restaurantLocation: {
        fontSize: 12,
        color: theme.colors.text.secondary,
        marginTop: 2,
    },
    restaurantPriceBadge: {
        backgroundColor: '#F0FFF4',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    restaurantPrice: {
        fontSize: 11,
        fontWeight: '700',
        color: '#16A34A',
    },
    restaurantDesc: {
        fontSize: 13,
        color: theme.colors.text.primary,
        lineHeight: 19,
        marginBottom: 6,
    },
    restaurantHours: {
        fontSize: 12,
        color: theme.colors.text.secondary,
        marginBottom: 6,
    },
    restaurantTipBox: {
        backgroundColor: '#FFFBEB',
        borderRadius: 8,
        padding: 10,
        marginTop: 4,
    },
    restaurantTip: {
        fontSize: 12,
        color: '#92400E',
        lineHeight: 18,
    },

    // ─── General Tips Block ───
    generalTipsSubtitle: {
        fontSize: 13,
        color: theme.colors.text.secondary,
        marginBottom: 12,
    },
    generalTipsBox: {
        backgroundColor: theme.colors.surface,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        padding: 16,
    },
    generalTipRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 10,
    },
    generalTipBullet: {
        fontSize: 16,
        color: theme.colors.primary,
        lineHeight: 22,
        fontWeight: '700',
    },
    generalTipText: {
        fontSize: 14,
        color: theme.colors.text.primary,
        lineHeight: 22,
        flex: 1,
    },

    // ── Passeios & Atrações
    blockSubtitle: {
        fontSize: 13,
        color: theme.colors.text.tertiary,
        marginBottom: 14,
        marginTop: -4,
    },
    attractionCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        ...theme.shadows.small,
    },
    attractionHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        marginBottom: 8,
    },
    attractionName: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: 6,
    },
    attractionMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
    },
    attractionTypeBadge: {
        backgroundColor: theme.colors.primary + '18',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    attractionTypeText: {
        fontSize: 11,
        fontWeight: '700',
        color: theme.colors.primary,
    },
    attractionLocation: {
        fontSize: 12,
        color: theme.colors.text.secondary,
        flex: 1,
    },
    attractionPriceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: theme.colors.primary + '10',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.colors.primary + '25',
        flexShrink: 0,
    },
    attractionPrice: {
        fontSize: 12,
        fontWeight: '700',
        color: theme.colors.primary,
    },
    attractionInfoRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 10,
        flexWrap: 'wrap',
    },
    attractionInfoChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: theme.colors.surfaceLight,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    attractionInfoText: {
        fontSize: 12,
        color: theme.colors.text.secondary,
        fontWeight: '500',
    },
    attractionDesc: {
        fontSize: 14,
        color: theme.colors.text.primary,
        lineHeight: 21,
        marginBottom: 10,
    },
    attractionTipBox: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'flex-start',
        backgroundColor: theme.colors.primary + '0D',
        borderRadius: 10,
        padding: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: theme.colors.primary + '1A',
    },
    attractionTip: {
        fontSize: 13,
        color: theme.colors.text.primary,
        lineHeight: 19,
        flex: 1,
    },
    attractionLinkBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        alignSelf: 'flex-start',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.colors.primary,
    },
    attractionLinkText: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.primary,
    },
});
