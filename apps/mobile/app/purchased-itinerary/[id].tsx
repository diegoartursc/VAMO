import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Animated,
    Image,
    Alert,
    Linking,
    Share,
    Dimensions,
    StatusBar,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../src/theme/theme';
import { haptics } from '../../src/services/haptics';
import { hasUserReviewed, getUserReviewForPackage } from '../../src/data/mockReviews';
import { Icon } from '../../src/components/common/Icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getPurchasedItineraryDetail, getCurrencyRates } from '../../src/services/api';
import { useAuth } from '../../src/contexts/AuthContext';
import BudgetSummaryCard from '../../src/components/dashboard/BudgetSummaryCard';
import PeopleSimulator from '../../src/components/dashboard/PeopleSimulator';
import MediaGallery from '../../src/components/common/MediaGallery';
import { getCostReferences, calculateBudgetSummary, formatMoney, type CostReferencesGroup } from '@vamo/shared/itinerary';

// AttractionInfo type (inline — no longer from mock)
type AttractionInfo = {
    name: string; type?: string; location?: string; description?: string;
    hours?: string; duration?: string; tips?: string; externalLink?: string;
    mapLink?: string; ticketPrice?: string;
};

const { width } = Dimensions.get('window');
const HERO_HEIGHT = 340;

export default function PurchasedItineraryScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { accessToken, user } = useAuth();

    // ─── Animations ────────────────────────────────────────
    const headerAnim = useRef(new Animated.Value(0)).current;
    const scrollViewRef = useRef<ScrollView>(null);
    const [sectionPositions, setSectionPositions] = useState<Record<string, number>>({});

    const trackSection = (key: string) => (e: any) => {
        const y = e?.nativeEvent?.layout?.y;
        if (typeof y === 'number') {
            setSectionPositions(prev => prev[key] === y ? prev : { ...prev, [key]: y });
        }
    };

    const scrollToSection = (key: string) => {
        haptics.light();
        const y = sectionPositions[key];
        if (y != null && scrollViewRef.current) {
            scrollViewRef.current.scrollTo({ y: Math.max(0, y - 12), animated: true });
        }
    };

    // ─── State ─────────────────────────────────────────────
    const [itinerary, setItinerary] = useState<any | null>(null);
    const [loadError, setLoadError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [travelers, setTravelers] = useState(1);
    const [customDays, setCustomDays] = useState(7);
    const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([1]));
    const [completedChecklist, setCompletedChecklist] = useState<Set<string>>(new Set());
    const [currencyRates, setCurrencyRates] = useState<Record<string, number>>({});
    const [peopleCount, setPeopleCount] = useState<number>(1);

    useEffect(() => {
        if (!id) { setLoadError(true); setIsLoading(false); return; }
        let mounted = true;
        getPurchasedItineraryDetail(id, accessToken)
            .then((data) => {
                if (!mounted) return;
                if (data) {
                    setItinerary(data);
                    setCustomDays(data.duration || 7);
                    Animated.timing(headerAnim, { toValue: 1, duration: 700, useNativeDriver: true }).start();
                } else {
                    setLoadError(true);
                }
            })
            .catch(() => { if (mounted) setLoadError(true); })
            .finally(() => { if (mounted) setIsLoading(false); });
        getCurrencyRates().then(r => { if (mounted) setCurrencyRates(r); }).catch(() => {});
        return () => { mounted = false; };
    }, [id, accessToken]);

    /** Converte valor em qualquer moeda para BRL formatado, usando taxas do admin */
    const toBRL = (value: string | number, currency: string): string => {
        const n = typeof value === 'number' ? value : parseFloat(String(value)) || 0;
        if (n <= 0) return 'R$ 0';
        const brl = currency === 'BRL' ? n : n * (currencyRates[currency] ?? 1);
        return brl.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
    };

    /**
     * Chave de persistência do progresso do checklist. Escopo:
     * userId + itineraryId → cada comprador tem seu próprio progresso
     * em cada roteiro adquirido, sem misturar com outros usuários ou
     * outros roteiros.
     */
    const checklistStorageKey = user?.travelerId && id
        ? `@vamo_checklist_progress:${user.travelerId}:${id}`
        : null;

    /** Quantidade de pessoas escolhida pelo comprador pra este roteiro. */
    const peopleCountStorageKey = user?.travelerId && id
        ? `@vamo_people_count:${user.travelerId}:${id}`
        : null;

    // Carrega quantidade de pessoas salva
    useEffect(() => {
        if (!peopleCountStorageKey) return;
        AsyncStorage.getItem(peopleCountStorageKey).then(raw => {
            const n = parseInt(raw || '', 10);
            if (Number.isFinite(n) && n >= 1) setPeopleCount(n);
        }).catch(() => { /* ignora */ });
    }, [peopleCountStorageKey]);

    const updatePeopleCount = (n: number) => {
        setPeopleCount(n);
        if (peopleCountStorageKey) {
            AsyncStorage.setItem(peopleCountStorageKey, String(n))
                .catch(err => console.warn('[peopleCount] falha ao salvar:', err));
        }
    };

    // Carrega o progresso salvo quando o roteiro estiver hidratado.
    useEffect(() => {
        if (!itinerary || !checklistStorageKey) return;
        AsyncStorage.getItem(checklistStorageKey).then(raw => {
            if (raw) {
                try {
                    const arr: string[] = JSON.parse(raw);
                    setCompletedChecklist(new Set(arr));
                    return;
                } catch { /* fallback abaixo */ }
            }
            // Sem progresso salvo: inicializa com `completed=true` vindo da API
            // (compat com itens marcados por algum fluxo legado).
            const initial = (itinerary.checklist || [])
                .filter((c: any) => c.completed)
                .map((c: any) => c.id);
            if (initial.length > 0) setCompletedChecklist(new Set(initial));
        }).catch(() => { /* ignora — UI continua funcional só em memória */ });
    }, [itinerary, checklistStorageKey]);

    if (isLoading) {
        return (
            <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={{ marginTop: 16, color: theme.colors.text.secondary, fontSize: 14 }}>
                    Carregando roteiro…
                </Text>
            </View>
        );
    }

    if (loadError || !itinerary) {
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

    // ─── Computed ──────────────────────────────────────────
    const currentProfile = itinerary.spendingProfile;
    const totalEstimate = (currentProfile?.dailyCost || 0) * travelers * customDays;

    // ─── Handlers ──────────────────────────────────────────
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
            // Persiste imediatamente. Atualização otimista — falha de
            // AsyncStorage não bloqueia a UI (estado fica em memória até
            // o próximo retry).
            if (checklistStorageKey) {
                AsyncStorage.setItem(checklistStorageKey, JSON.stringify(Array.from(next)))
                    .catch(err => console.warn('[checklist] falha ao salvar progresso:', err));
            }
            return next;
        });
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

    // ─── RENDER ────────────────────────────────────────────
    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <ScrollView ref={scrollViewRef} showsVerticalScrollIndicator={false} bounces>

                {/* ══════════ HERO ══════════ */}
                <View style={styles.heroBlock}>
                    <Image source={{ uri: itinerary.images[0] }} style={styles.heroImage} />
                    <LinearGradient
                        colors={theme.colors.gradients.hero as unknown as [string, string, string]}
                        style={StyleSheet.absoluteFill}
                        locations={[0, 0.4, 1]}
                    />

                    {/* Nav bar */}
                    <View style={styles.navBar}>
                        <TouchableOpacity style={styles.navBtn} onPress={() => router.back()}>
                            <Ionicons name="arrow-back" size={22} color="#fff" />
                        </TouchableOpacity>

                        {/* Purchased badge inside navBar */}
                        <Animated.View style={[
                            styles.purchasedBadge,
                            {
                                opacity: headerAnim,
                                transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] }) }],
                            },
                        ]}>
                            <Ionicons name="checkmark-circle" size={14} color="#fff" />
                            <Text style={styles.purchasedBadgeText}>ROTEIRO COMPRADO</Text>
                        </Animated.View>
                        <TouchableOpacity style={styles.navBtn} onPress={handleShare}>
                            <Ionicons name="share-outline" size={22} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    {/* Hero info */}
                    <Animated.View style={[
                        styles.heroInfo,
                        {
                            opacity: headerAnim,
                            transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
                        },
                    ]}>
                        <Text style={styles.heroTitle} numberOfLines={2}>{itinerary.title}</Text>
                        <View style={styles.heroDestRow}>
                            <Icon name="location" size={13} color="rgba(255,255,255,0.85)" />
                            <Text style={styles.heroDest}>{itinerary.destination}, {itinerary.country}</Text>
                            <Text style={styles.heroDot}>·</Text>
                            <Ionicons name="time-outline" size={13} color="rgba(255,255,255,0.85)" />
                            <Text style={styles.heroDest}>{itinerary.duration} dias</Text>
                        </View>
                        <View style={styles.heroMeta}>
                            <View style={styles.creatorPill}>
                                <Text style={styles.creatorAvatar}>{itinerary.creator.avatar}</Text>
                                <Text style={styles.creatorName}>{itinerary.creator.name}</Text>
                            </View>
                            <View style={styles.ratingPill}>
                                <Ionicons name="star" size={13} color="#FFC107" />
                                <Text style={styles.ratingText}>{itinerary.rating}</Text>
                                <Text style={styles.reviewCount}>({itinerary.reviewCount})</Text>
                            </View>
                        </View>
                    </Animated.View>
                </View>

                {/* Download bar */}
                <TouchableOpacity onPress={handleDownload} activeOpacity={0.8}>
                    <LinearGradient
                        colors={[theme.colors.primary + '1A', theme.colors.primary + '08']}
                        style={styles.downloadBar}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <View style={styles.downloadIconCircle}>
                            <Ionicons name="cloud-download-outline" size={18} color={theme.colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.downloadBarTitle}>Baixar para acesso offline</Text>
                            <Text style={styles.downloadBarSub}>Disponível em breve</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={theme.colors.primary} />
                    </LinearGradient>
                </TouchableOpacity>

                <View style={styles.body}>

                    {/* ══════════ COMECE POR AQUI — central da viagem ══════════ */}
                    {(() => {
                        const daysCount = Array.isArray(itinerary.days) ? itinerary.days.length : 0;
                        const mediaCount =
                            (Array.isArray(itinerary.highlightPhotos) ? itinerary.highlightPhotos.length : 0) +
                            (Array.isArray(itinerary.images) ? itinerary.images.length : 0) +
                            (Array.isArray(itinerary.mediaUrls) ? itinerary.mediaUrls.length : 0);
                        const checklistCount = Array.isArray(itinerary.checklist) ? itinerary.checklist.length : 0;

                        type QA = { key: string; iconName: any; label: string; meta: string; sectionKey: string };
                        const actions: QA[] = [];
                        if (daysCount > 0) actions.push({ key: 'days', iconName: 'map-outline', label: 'Ver roteiro por dia', meta: `${daysCount} ${daysCount === 1 ? 'dia' : 'dias'}`, sectionKey: 'itinerary' });
                        if (checklistCount > 0) actions.push({ key: 'checklist', iconName: 'checkmark-done-outline', label: 'Abrir checklist', meta: `${checklistCount} ${checklistCount === 1 ? 'item' : 'itens'}`, sectionKey: 'checklist' });
                        actions.push({ key: 'costs', iconName: 'wallet-outline', label: 'Ver custos', meta: 'orçamento referência', sectionKey: 'costs' });
                        if (mediaCount > 0) actions.push({ key: 'media', iconName: 'images-outline', label: 'Fotos e vídeos', meta: `${mediaCount} ${mediaCount === 1 ? 'mídia' : 'mídias'}`, sectionKey: 'media' });

                        return (
                            <View style={styles.block}>
                                <LinearGradient
                                    colors={[theme.colors.primary + '14', theme.colors.primary + '08']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.quickCard}
                                >
                                    <View style={styles.quickCardHeader}>
                                        <View style={styles.quickCardIconWrap}>
                                            <Ionicons name="rocket-outline" size={18} color={theme.colors.primary} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.quickCardTitle}>Seu roteiro está pronto para usar</Text>
                                            <Text style={styles.quickCardSubtitle}>
                                                Acesse rapidamente as partes mais importantes da sua viagem.
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.quickGrid}>
                                        {actions.map(a => (
                                            <TouchableOpacity
                                                key={a.key}
                                                style={styles.quickItem}
                                                onPress={() => scrollToSection(a.sectionKey)}
                                                activeOpacity={0.85}
                                            >
                                                <View style={styles.quickItemIcon}>
                                                    <Ionicons name={a.iconName} size={16} color={theme.colors.primary} />
                                                </View>
                                                <Text style={styles.quickItemLabel} numberOfLines={1}>{a.label}</Text>
                                                <Text style={styles.quickItemMeta} numberOfLines={1}>{a.meta}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </LinearGradient>
                            </View>
                        );
                    })()}

                    {/* ══════════ SOBRE A EXPERIÊNCIA ══════════ */}
                    <View style={styles.block}>
                        <SectionTitle icon="compass-outline" label="Sobre a Experiência" />
                        <View style={styles.card}>
                            {itinerary.tripStartDate && itinerary.tripEndDate && (
                                <>
                                    <InfoRow
                                        icon="calendar-outline"
                                        label="Período da viagem"
                                        value={`${new Date(itinerary.tripStartDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })} — ${new Date(itinerary.tripEndDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}`}
                                    />
                                    <View style={styles.cardDivider} />
                                </>
                            )}

                            <InfoRow icon="time-outline" label="Duração" value={`${itinerary.duration} dias`} />
                            <View style={styles.cardDivider} />
                            <InfoRow icon="location-outline" label="Destino" value={`${itinerary.destination}, ${itinerary.country}`} />
                            {itinerary.highlights && itinerary.highlights.length > 0 && (
                                <>
                                    <View style={styles.cardDivider} />
                                    <View style={styles.infoRow}>
                                        <View style={styles.infoIconCircle}>
                                            <Ionicons name="star-outline" size={16} color={theme.colors.primary} />
                                        </View>
                                        <View style={styles.infoContent}>
                                            <Text style={styles.infoLabel}>Destaques</Text>
                                            <View style={styles.highlightChips}>
                                                {itinerary.highlights.map((h: string, i: number) => (
                                                    <View key={i} style={styles.highlightChip}>
                                                        <Ionicons name="checkmark" size={11} color={theme.colors.primary} />
                                                        <Text style={styles.highlightChipText}>{h}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                        </View>
                                    </View>
                                </>
                            )}
                        </View>
                    </View>

                    {/* ══════════ CUSTOS E ORÇAMENTO (transparência graduada) ══════════ */}
                    <View style={styles.block} onLayout={trackSection('costs')}>
                        <SectionTitle icon="wallet-outline" label="Custos e orçamento do roteiro" />
                        {(() => {
                            const costForm = {
                                accommodations: itinerary.accommodations,
                                attractions: itinerary.attractions,
                                transports: itinerary.transports,
                                restaurants: itinerary.restaurants,
                                extraSpendingItems: itinerary.extraSpendingItems,
                                flightCost: itinerary.flightInfo?.cost,
                                flightSpending: itinerary.flightInfo?.spending,
                            };
                            const summary = calculateBudgetSummary(costForm as any);
                            return (
                                <>
                                    <BudgetSummaryCard
                                        form={costForm as any}
                                        summary={summary}
                                        variant="purchased"
                                        hideWhenEmpty
                                    />
                                    <PeopleSimulator
                                        totalPerPerson={summary.totalInformed}
                                        currency={summary.currency}
                                        value={peopleCount}
                                        onChange={updatePeopleCount}
                                    />
                                </>
                            );
                        })()}

                        {/* Referência de Gastos por Pessoa — item-a-item (espelha Detalhes) */}
                        {(() => {
                            const costGroups = getCostReferences({
                                accommodations: itinerary.accommodations,
                                attractions: itinerary.attractions,
                                transports: itinerary.transports,
                                restaurants: itinerary.restaurants,
                                extraSpendingItems: itinerary.extraSpendingItems,
                                flightCost: itinerary.flightInfo?.cost,
                                flightSpending: itinerary.flightInfo?.spending,
                            } as any);
                            if (costGroups.length === 0) return null;

                            const MODULE_IONICONS: Record<CostReferencesGroup['moduleKey'], any> = {
                                voo: 'airplane-outline',
                                hospedagem: 'home-outline',
                                passeios: 'camera-outline',
                                transporte: 'navigate-outline',
                                restaurantes: 'restaurant-outline',
                                gastos_extras: 'wallet-outline',
                            };

                            return (
                                <View style={{ marginTop: 16 }}>
                                    <Text style={styles.costRefTitle}>Referência de Gastos por Pessoa</Text>
                                    {costGroups.map(group => (
                                        <View key={group.moduleKey} style={styles.costRefGroup}>
                                            <View style={styles.costRefGroupHeader}>
                                                <Ionicons name={MODULE_IONICONS[group.moduleKey]} size={14} color={theme.colors.primary} />
                                                <Text style={styles.costRefGroupTitle}>{group.moduleLabel}</Text>
                                            </View>
                                            {group.items.map((item, idx) => {
                                                const isVerified = item.disclosureType === 'verified';
                                                const proofOk = item.hasProof && (item.proofStatus === 'uploaded' || item.proofStatus === 'pending_review' || item.proofStatus === 'approved');
                                                const showVerifiedBadge = isVerified && proofOk;
                                                const isShared = item.sharedByPeople > 1;
                                                return (
                                                    <View key={idx} style={styles.costRefItem}>
                                                        <Text style={styles.costRefItemTitle}>{item.title}</Text>
                                                        <Text style={styles.costRefItemValue}>
                                                            <Text style={{ fontWeight: '700' }}>{formatMoney(item.amountPerPerson, item.currency)}</Text>
                                                            {' por pessoa'}
                                                            {item.currency !== 'BRL' && (
                                                                <Text style={styles.costRefItemConverted}> ≈ {toBRL(item.amountPerPerson, item.currency)}</Text>
                                                            )}
                                                        </Text>
                                                        <Text style={[styles.costRefItemConverted, { marginTop: 2 }]}>
                                                            {isShared
                                                                ? `Base: ${formatMoney(item.amountTotal, item.currency)} total ÷ ${item.sharedByPeople} pessoas`
                                                                : 'Gasto individual'}
                                                        </Text>
                                                        <View style={styles.costRefBadgeRow}>
                                                            <Ionicons
                                                                name={showVerifiedBadge ? 'shield-checkmark' : 'pricetag-outline'}
                                                                size={11}
                                                                color={showVerifiedBadge ? theme.colors.verified : theme.colors.info}
                                                            />
                                                            <Text style={[styles.costRefBadgeText, { color: showVerifiedBadge ? theme.colors.verified : theme.colors.info }]}>
                                                                {showVerifiedBadge ? 'Valor comprovado' : 'Valor estimado'}
                                                            </Text>
                                                            {showVerifiedBadge && item.proofStatus === 'approved' && (
                                                                <Text style={[styles.costRefBadgeText, { color: theme.colors.verified }]}>
                                                                    {' · '}Aprovado pela VAMO
                                                                </Text>
                                                            )}
                                                        </View>
                                                    </View>
                                                );
                                            })}
                                        </View>
                                    ))}
                                    <Text style={styles.costRefDisclaimer}>
                                        Valores informados pela criadora como referência. Podem variar por época, câmbio e disponibilidade.
                                    </Text>
                                </View>
                            );
                        })()}
                    </View>

                    {/* ══════════ FOTOS E VÍDEOS DA VIAGEM ══════════ */}
                    <View onLayout={trackSection('media')}>
                        <MediaGallery itinerary={itinerary} />
                    </View>

                    {/* ══════════ ESTIMATIVA DE GASTO (legado — perfil de gastos por dia) ══════════ */}
                    {itinerary.spendingProfile && (
                        <View style={styles.block}>
                            <SectionTitle icon="wallet-outline" label="Estimativa de Gasto" />

                            <View style={styles.adjustersRow}>
                                <AdjusterCard
                                    label="Viajantes"
                                    value={travelers}
                                    onDecrement={() => adjustTravelers(-1)}
                                    onIncrement={() => adjustTravelers(1)}
                                />
                                <AdjusterCard
                                    label="Dias"
                                    value={customDays}
                                    onDecrement={() => adjustDays(-1)}
                                    onIncrement={() => adjustDays(1)}
                                />
                            </View>

                            <LinearGradient
                                colors={theme.colors.gradients.aurora as unknown as [string, string, string]}
                                style={styles.totalGradientCard}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <Text style={styles.totalCardLabel}>Estimativa total</Text>
                                <Text style={styles.totalCardAmount}>
                                    R$ {totalEstimate.toLocaleString('pt-BR')}
                                </Text>
                                <Text style={styles.totalCardDetail}>
                                    {travelers} viajante{travelers > 1 ? 's' : ''} × {customDays} dias × R$ {currentProfile?.dailyCost}/dia
                                </Text>
                            </LinearGradient>

                            {currentProfile && (
                                <View style={styles.breakdownCard}>
                                    <Text style={styles.breakdownTitle}>Custo médio diário por pessoa</Text>
                                    {currentProfile.breakdown.map((item, i) => (
                                        <View
                                            key={i}
                                            style={[
                                                styles.breakdownRow,
                                                i < currentProfile.breakdown.length - 1 && styles.breakdownRowBorder,
                                            ]}
                                        >
                                            <Text style={styles.breakdownCat}>{item.category}</Text>
                                            <Text style={styles.breakdownVal}>R$ {item.amount}</Text>
                                        </View>
                                    ))}
                                    <View style={styles.breakdownTotalRow}>
                                        <Text style={styles.breakdownTotalLabel}>Total/dia</Text>
                                        <Text style={styles.breakdownTotalVal}>R$ {currentProfile.dailyCost}</Text>
                                    </View>
                                </View>
                            )}
                        </View>
                    )}

                    {/* ══════════ MEU VOO ══════════ */}
                    {itinerary.flightInfo && (
                        <View style={styles.block}>
                            <SectionTitle icon="airplane-outline" label="Meu Voo" />

                            {itinerary.flightInfo.totalPrice && (
                                <View style={styles.flightTotalBadge}>
                                    <Ionicons name="cash-outline" size={15} color={theme.colors.success} />
                                    <Text style={styles.flightTotalText}>
                                        Ida + volta: {itinerary.flightInfo.totalPrice}
                                        {itinerary.flightInfo.priceCurrency ? ` ${itinerary.flightInfo.priceCurrency}` : ''}
                                    </Text>
                                </View>
                            )}

                            <Text style={styles.flightLegLabel}>✈ Ida</Text>
                            <FlightCard flight={itinerary.flightInfo.outbound} />

                            <Text style={styles.flightLegLabel}>✈ Volta</Text>
                            <FlightCard flight={itinerary.flightInfo.return} />

                            {itinerary.flightInfo.tips.length > 0 && (
                                <>
                                    <Text style={styles.flightLegLabel}>💡 Dicas do viajante</Text>
                                    <View style={styles.tipsBox}>
                                        {itinerary.flightInfo.tips.map((tip, i) => (
                                            <View key={i} style={styles.tipRow}>
                                                <View style={styles.tipDot} />
                                                <Text style={styles.tipText}>{tip}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </>
                            )}
                        </View>
                    )}

                    {/* ══════════ ITINERÁRIO POR DIA ══════════ */}
                    <View style={styles.block} onLayout={trackSection('itinerary')}>
                        <SectionTitle icon="map-outline" label="Itinerário por Dia" />
                        {itinerary.days.map(day => (
                            <View key={day.dayNumber} style={styles.dayCard}>
                                <TouchableOpacity
                                    style={styles.dayHeader}
                                    onPress={() => toggleDay(day.dayNumber)}
                                    activeOpacity={0.75}
                                >
                                    <LinearGradient
                                        colors={theme.colors.gradients.action as unknown as [string, string]}
                                        style={styles.dayNumberBadge}
                                    >
                                        <Text style={styles.dayNumberText}>{day.dayNumber}</Text>
                                        <Text style={styles.dayNumberLabel}>DIA</Text>
                                    </LinearGradient>
                                    <View style={styles.dayHeaderInfo}>
                                        <Text style={styles.dayTitle} numberOfLines={1}>{day.title}</Text>
                                        <Text style={styles.daySummary} numberOfLines={1}>{day.summary}</Text>
                                    </View>
                                    <View style={[
                                        styles.chevronCircle,
                                        expandedDays.has(day.dayNumber) && styles.chevronCircleActive,
                                    ]}>
                                        <Ionicons
                                            name={expandedDays.has(day.dayNumber) ? 'chevron-up' : 'chevron-down'}
                                            size={16}
                                            color={expandedDays.has(day.dayNumber) ? '#fff' : theme.colors.text.tertiary}
                                        />
                                    </View>
                                </TouchableOpacity>

                                {expandedDays.has(day.dayNumber) && (
                                    <View style={styles.dayContent}>
                                        {day.activities.map((activity, idx) => (
                                            <View key={activity.id} style={styles.activityRow}>
                                                <View style={styles.timelineCol}>
                                                    <View style={styles.timelineDot} />
                                                    {idx < day.activities.length - 1 && (
                                                        <View style={styles.timelineLine} />
                                                    )}
                                                </View>
                                                <View style={styles.activityContent}>
                                                    <View style={styles.activityHeader}>
                                                        <Text style={styles.activityIcon}>{activity.icon}</Text>
                                                        <Text style={styles.activityTime}>{activity.time}</Text>
                                                        {activity.duration ? (
                                                            <View style={styles.durationChip}>
                                                                <Text style={styles.durationText}>{activity.duration}</Text>
                                                            </View>
                                                        ) : null}
                                                    </View>
                                                    <Text style={styles.activityTitle}>{activity.title}</Text>
                                                    <View style={styles.locRow}>
                                                        <Text style={styles.activityLocation}>{activity.location}</Text>
                                                    </View>
                                                    <Text style={styles.activityDesc} numberOfLines={3}>
                                                        {activity.description}
                                                    </Text>

                                                    {(() => {
                                                        const tipsArr = Array.isArray(activity.tips)
                                                            ? activity.tips
                                                            : activity.tips ? [activity.tips] : [];
                                                        return tipsArr.length > 0 ? (
                                                            <View style={styles.activityTipBox}>
                                                                <Text style={styles.activityTipTitle}>💡 Dicas</Text>
                                                                {tipsArr.map((tip, ti) => (
                                                                    <Text key={ti} style={styles.activityTipText}>• {tip}</Text>
                                                                ))}
                                                            </View>
                                                        ) : null;
                                                    })()}

                                                    {activity.mapLink && (
                                                        <TouchableOpacity
                                                            style={styles.mapBtn}
                                                            onPress={() => Linking.openURL(activity.mapLink!)}
                                                        >
                                                            <Ionicons name="map-outline" size={14} color={theme.colors.primary} />
                                                            <Text style={styles.mapBtnText}>Ver no mapa</Text>
                                                        </TouchableOpacity>
                                                    )}
                                                </View>
                                            </View>
                                        ))}

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

                    {/* ══════════ ONDE FIQUEI ══════════ */}
                    {itinerary.accommodationOptions && itinerary.accommodationOptions.length > 0 && (
                        <View style={styles.block}>
                            <SectionTitle icon="home-outline" label="Onde Fiquei" />
                            {itinerary.accommodationOptions.map(acc => (
                                <View key={acc.id} style={[styles.card, { marginBottom: 12 }]}>
                                    <View style={styles.accHeader}>
                                        <Text style={styles.accName}>{acc.name}</Text>
                                        <View style={styles.accPriceBadge}>
                                            <Text style={styles.accPrice}>{acc.priceRange}</Text>
                                        </View>
                                    </View>
                                    {(acc.address || acc.location) && (
                                        <View style={styles.locRow}>
                                            <Icon name="location" size={11} color={theme.colors.text.tertiary} />
                                            <Text style={styles.accLocation}>{acc.address || acc.location}</Text>
                                        </View>
                                    )}
                                    <Text style={styles.accDesc}>{acc.description}</Text>
                                    {acc.rating && (
                                        <View style={styles.accRating}>
                                            <Ionicons name="star" size={13} color="#FFC107" />
                                            <Text style={styles.accRatingText}>{acc.rating}</Text>
                                        </View>
                                    )}
                                    {acc.tips ? (
                                        <View style={styles.activityTipBox}>
                                            <Text style={styles.activityTipText}>💡 {acc.tips}</Text>
                                        </View>
                                    ) : null}
                                    {acc.mapLink ? (
                                        <TouchableOpacity
                                            style={styles.mapBtn}
                                            onPress={() => { haptics.light(); Linking.openURL(acc.mapLink!); }}
                                        >
                                            <Ionicons name="map-outline" size={14} color={theme.colors.primary} />
                                            <Text style={styles.mapBtnText}>Ver no mapa</Text>
                                        </TouchableOpacity>
                                    ) : null}
                                </View>
                            ))}
                        </View>
                    )}

                    {/* ══════════ PASSEIOS & ATRAÇÕES ══════════ */}
                    {itinerary.attractions && itinerary.attractions.length > 0 && (
                        <View style={styles.block}>
                            <SectionTitle icon="camera-outline" label="Passeios & Atrações" />
                            <Text style={styles.blockSubtitle}>
                                {itinerary.attractions.length} atrações selecionadas pelo criador
                            </Text>
                            {itinerary.attractions.map((att: AttractionInfo, i: number) => (
                                <View key={i} style={[styles.card, { marginBottom: 12 }]}>
                                    <View style={styles.attractionTop}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.attractionName}>{att.name}</Text>
                                            <View style={styles.attractionMetaRow}>
                                                {att.type ? (
                                                    <View style={styles.typeBadge}>
                                                        <Text style={styles.typeBadgeText}>{att.type}</Text>
                                                    </View>
                                                ) : null}
                                                {att.location ? (
                                                    <View style={styles.locRow}>
                                                        <Icon name="location" size={11} color={theme.colors.text.tertiary} />
                                                        <Text style={styles.attractionLocation} numberOfLines={1}>{att.location}</Text>
                                                    </View>
                                                ) : null}
                                            </View>
                                        </View>
                                        {att.ticketPrice ? (
                                            <View style={styles.priceBadge}>
                                                <Icon name="card" size={12} color={theme.colors.primary} />
                                                <Text style={styles.priceBadgeText}>{att.ticketPrice}</Text>
                                            </View>
                                        ) : null}
                                    </View>

                                    {(att.hours || att.duration) ? (
                                        <View style={styles.chipsRow}>
                                            {att.hours ? (
                                                <View style={styles.infoChip}>
                                                    <Icon name="clock" size={12} color={theme.colors.text.secondary} />
                                                    <Text style={styles.infoChipText}>{att.hours}</Text>
                                                </View>
                                            ) : null}
                                            {att.duration ? (
                                                <View style={styles.infoChip}>
                                                    <Icon name="compass" size={12} color={theme.colors.text.secondary} />
                                                    <Text style={styles.infoChipText}>{att.duration}</Text>
                                                </View>
                                            ) : null}
                                        </View>
                                    ) : null}

                                    {att.description ? (
                                        <Text style={styles.attractionDesc}>{att.description}</Text>
                                    ) : null}
                                    {att.tips ? (
                                        <View style={[styles.activityTipBox, { flexDirection: 'row', alignItems: 'flex-start', gap: 6 }]}>
                                            <Icon name="lightbulb" size={13} color="#F59E0B" />
                                            <Text style={[styles.activityTipText, { flex: 1 }]}>{att.tips}</Text>
                                        </View>
                                    ) : null}

                                    <View style={styles.actionsRow}>
                                        {att.externalLink ? (
                                            <TouchableOpacity
                                                style={styles.outlineBtn}
                                                onPress={() => { haptics.light(); Linking.openURL(att.externalLink!); }}
                                            >
                                                <Icon name="globe" size={14} color={theme.colors.primary} />
                                                <Text style={styles.outlineBtnText}>Site oficial</Text>
                                            </TouchableOpacity>
                                        ) : null}
                                        {att.mapLink ? (
                                            <TouchableOpacity
                                                style={styles.mapBtn}
                                                onPress={() => { haptics.light(); Linking.openURL(att.mapLink!); }}
                                            >
                                                <Ionicons name="map-outline" size={14} color={theme.colors.primary} />
                                                <Text style={styles.mapBtnText}>Ver no mapa</Text>
                                            </TouchableOpacity>
                                        ) : null}
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* ══════════ TRANSPORTE ══════════ */}
                    {itinerary.transport && itinerary.transport.items.length > 0 && (
                        <View style={styles.block}>
                            <SectionTitle icon="navigate-outline" label="Transporte" />
                            {itinerary.transport.items.map((item, i) => (
                                <View key={i} style={styles.transportCard}>
                                    <View style={styles.transportHeader}>
                                        <Text style={styles.transportName}>{item.description}</Text>
                                        {item.priceValue && (
                                            <View style={styles.priceBadge}>
                                                <Text style={styles.priceBadgeText}>
                                                    {item.priceValue}{item.priceCurrency ? ` ${item.priceCurrency}` : ''}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                    {item.passTypes ? (
                                        <Text style={styles.transportPassTypes}>{item.passTypes}</Text>
                                    ) : null}
                                    {item.notes ? (
                                        <Text style={styles.transportNotes}>{item.notes}</Text>
                                    ) : null}
                                </View>
                            ))}
                        </View>
                    )}

                    {/* ══════════ RESTAURANTES & GASTRONOMIA ══════════ */}
                    {itinerary.restaurants && itinerary.restaurants.length > 0 && (
                        <View style={styles.block}>
                            <SectionTitle icon="restaurant-outline" label="Restaurantes & Gastronomia" />
                            {itinerary.restaurants.map((rest, i) => (
                                <View key={i} style={[styles.card, { marginBottom: 12 }]}>
                                    <View style={styles.restaurantTop}>
                                        <View style={{ flex: 1 }}>
                                            <View style={styles.restaurantNameRow}>
                                                <Text style={styles.restaurantName}>{rest.name}</Text>
                                                {rest.cuisine ? (
                                                    <View style={styles.cuisineTag}>
                                                        <Text style={styles.cuisineTagText}>{rest.cuisine}</Text>
                                                    </View>
                                                ) : null}
                                            </View>
                                            <View style={styles.locRow}>
                                                <Icon name="location" size={11} color={theme.colors.text.tertiary} />
                                                <Text style={styles.restaurantLocation}>{rest.location}</Text>
                                            </View>
                                        </View>
                                        {rest.priceRange && (
                                            <View style={styles.greenPriceBadge}>
                                                <Text style={styles.greenPriceText}>{rest.priceRange}</Text>
                                            </View>
                                        )}
                                    </View>
                                    {rest.description ? (
                                        <Text style={styles.restaurantDesc}>{rest.description}</Text>
                                    ) : null}
                                    {rest.hours ? (
                                        <Text style={styles.restaurantHours}>🕐 {rest.hours}</Text>
                                    ) : null}
                                    {rest.tips ? (
                                        <View style={styles.activityTipBox}>
                                            <Text style={styles.activityTipText}>💡 {rest.tips}</Text>
                                        </View>
                                    ) : null}
                                    {rest.externalLink ? (
                                        <TouchableOpacity
                                            style={styles.outlineBtn}
                                            onPress={() => { haptics.light(); Linking.openURL(rest.externalLink!); }}
                                        >
                                            <Icon name="globe" size={14} color={theme.colors.primary} />
                                            <Text style={styles.outlineBtnText}>Ver reservas</Text>
                                        </TouchableOpacity>
                                    ) : null}
                                </View>
                            ))}
                        </View>
                    )}

                    {/* ══════════ GASTOS EXTRAS ══════════ */}
                    {Array.isArray(itinerary.extraSpendingItems) && itinerary.extraSpendingItems.length > 0 && (
                        <View style={styles.block}>
                            <SectionTitle icon="wallet-outline" label="Gastos Extras" />
                            <Text style={styles.blockSubtitle}>
                                Outros gastos informados pela criadora ({itinerary.extraSpendingItems.length})
                            </Text>
                            {itinerary.extraSpendingItems.map((e: any, i: number) => {
                                const cost = e.cost;
                                const amount = parseFloat(e.value || cost?.amount || '0') || 0;
                                const currency = e.currency || cost?.currency || 'BRL';
                                const informed = !!cost && cost.disclosureType !== 'not_informed' && amount > 0;
                                return (
                                    <View key={i} style={styles.spendingItemCard}>
                                        <Text style={styles.spendingItemTitle}>{e.title || 'Gasto extra'}</Text>
                                        {e.description ? <Text style={styles.spendingItemDesc}>{e.description}</Text> : null}
                                        {informed && (
                                            <Text style={styles.spendingItemValue}>
                                                {formatMoney(amount, currency)}
                                                {currency !== 'BRL' && (
                                                    <Text style={styles.costRefItemConverted}> ≈ {toBRL(amount, currency)}</Text>
                                                )}
                                            </Text>
                                        )}
                                    </View>
                                );
                            })}
                        </View>
                    )}

                    {/* ══════════ DICAS DO VIAJANTE ══════════ */}
                    {itinerary.generalTips && itinerary.generalTips.length > 0 && (
                        <View style={styles.block}>
                            <SectionTitle icon="bulb-outline" label="Dicas do Viajante" />
                            <Text style={styles.tipsAuthor}>
                                Recomendações de {itinerary.creator.name}
                            </Text>
                            <View style={styles.generalTipsCard}>
                                {itinerary.generalTips.map((tip, i) => (
                                    <View
                                        key={i}
                                        style={[
                                            styles.generalTipRow,
                                            i < itinerary.generalTips!.length - 1 && styles.generalTipRowBorder,
                                        ]}
                                    >
                                        <View style={styles.tipBulletDot} />
                                        <Text style={styles.generalTipText}>{tip}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* ══════════ CHECKLIST DE PLANEJAMENTO ══════════ */}
                    <View style={styles.block} onLayout={trackSection('checklist')}>
                        <SectionTitle icon="checkmark-circle-outline" label="Checklist de Planejamento" />
                        <View style={styles.progressSection}>
                            <Text style={styles.progressLabel}>
                                {completedChecklist.size} de {itinerary.checklist.length} concluídos
                            </Text>
                            <View style={styles.progressBarBg}>
                                <LinearGradient
                                    colors={theme.colors.gradients.action as unknown as [string, string]}
                                    style={[
                                        styles.progressBarFill,
                                        {
                                            width: itinerary.checklist.length > 0
                                                ? `${(completedChecklist.size / itinerary.checklist.length) * 100}%`
                                                : '0%',
                                        },
                                    ]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                />
                            </View>
                        </View>

                        {Array.from(new Set((itinerary.checklist || []).map((c: any) => c.category))).map((category: any) => {
                            const items = itinerary.checklist.filter((c: any) => c.category === category);
                            if (items.length === 0) return null;
                            // Ionicons mapping — bullets removidos, ícones em circle teal claro.
                            const categoryConfig: Record<string, { label: string; icon: any }> = {
                                // English keys (legacy mock)
                                documents:    { label: 'Documentos', icon: 'document-text-outline' },
                                packing:      { label: 'Mala',       icon: 'briefcase-outline' },
                                'pre-trip':   { label: 'Pré-viagem', icon: 'checkmark-done-outline' },
                                // Portuguese keys (from DB)
                                documentos:   { label: 'Documentos', icon: 'document-text-outline' },
                                mala:         { label: 'Mala',       icon: 'briefcase-outline' },
                                'pre-viagem': { label: 'Pré-viagem', icon: 'checkmark-done-outline' },
                                'apps úteis': { label: 'Apps Úteis', icon: 'phone-portrait-outline' },
                                finanças:     { label: 'Finanças',   icon: 'cash-outline' },
                                financas:     { label: 'Finanças',   icon: 'cash-outline' },
                                custom:       { label: 'Outros',     icon: 'ellipsis-horizontal-circle-outline' },
                                outros:       { label: 'Outros',     icon: 'ellipsis-horizontal-circle-outline' },
                            };
                            const cfg = categoryConfig[String(category).toLowerCase()] ?? { label: String(category), icon: 'ellipsis-horizontal-circle-outline' };
                            // Conta concluídos da categoria
                            const doneInCat = items.filter((it: any) => completedChecklist.has(it.id)).length;
                            return (
                                <View key={category} style={styles.checkCategory}>
                                    <View style={styles.checkCategoryHeader}>
                                        <View style={styles.checkCategoryIconWrap}>
                                            <Ionicons name={cfg.icon} size={14} color={theme.colors.primary} />
                                        </View>
                                        <Text style={styles.checkCategoryLabel}>{cfg.label}</Text>
                                        <Text style={styles.checkCategoryCount}>{doneInCat}/{items.length}</Text>
                                    </View>
                                    <View style={styles.checkItemsCard}>
                                        {items.map((item, itemIdx) => {
                                            const isChecked = completedChecklist.has(item.id);
                                            return (
                                                <TouchableOpacity
                                                    key={item.id}
                                                    style={[
                                                        styles.checkItem,
                                                        itemIdx < items.length - 1 && styles.checkItemBorder,
                                                    ]}
                                                    onPress={() => toggleChecklist(item.id)}
                                                    activeOpacity={0.7}
                                                >
                                                    <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                                                        {isChecked && <Ionicons name="checkmark" size={13} color="#fff" />}
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
                                </View>
                            );
                        })}
                    </View>

                    {/* ══════════ O QUE VOCÊ RECEBEU ══════════ */}
                    {itinerary.receiveList && (
                        <View style={styles.block}>
                            <SectionTitle icon="gift-outline" label="O que você recebeu" />
                            <View style={styles.card}>
                                {itinerary.receiveList.map((item, i) => (
                                    <View
                                        key={i}
                                        style={[
                                            styles.receiveRow,
                                            i < itinerary.receiveList!.length - 1 && styles.receiveRowBorder,
                                        ]}
                                    >
                                        <Text style={styles.receiveEmoji}>{item.icon}</Text>
                                        <Text style={styles.receiveLabel}>{item.label}</Text>
                                        <View style={styles.receiveCheckCircle}>
                                            <Ionicons name="checkmark" size={14} color="#fff" />
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* ══════════ AVALIAR ESTE ROTEIRO ══════════ */}
                    <View style={styles.block}>
                        <SectionTitle icon="star-outline" label="Avaliar este Roteiro" />
                        {hasUserReviewed('trav-diego', `itinerary-${id}`) ? (
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
                                                {[1, 2, 3, 4, 5].map(s => (
                                                    <Ionicons
                                                        key={s}
                                                        name={s <= existing.rating ? 'star' : 'star-outline'}
                                                        size={20}
                                                        color="#FFD700"
                                                    />
                                                ))}
                                            </View>
                                            <Text style={styles.reviewDoneText} numberOfLines={3}>
                                                {existing.text}
                                            </Text>
                                        </>
                                    ) : (
                                        <Text style={styles.reviewDoneText}>Avaliação enviada com sucesso!</Text>
                                    );
                                })()}
                            </View>
                        ) : (
                            <LinearGradient
                                colors={theme.colors.gradients.aurora as unknown as [string, string, string]}
                                style={styles.reviewCTACard}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <Ionicons name="chatbubble-ellipses-outline" size={40} color="rgba(255,255,255,0.9)" />
                                <Text style={styles.reviewCTATitle}>Como foi sua experiência?</Text>
                                <Text style={styles.reviewCTASub}>
                                    Sua avaliação ajuda outros viajantes a decidirem.
                                </Text>
                                <TouchableOpacity
                                    style={styles.reviewCTABtn}
                                    onPress={() => {
                                        haptics.light();
                                        router.push({ pathname: '/write-review', params: { itineraryId: id } } as any);
                                    }}
                                    activeOpacity={0.85}
                                >
                                    <Ionicons name="star" size={18} color={theme.colors.primary} />
                                    <Text style={styles.reviewCTABtnText}>Escrever Avaliação</Text>
                                </TouchableOpacity>
                            </LinearGradient>
                        )}
                    </View>

                    <View style={{ height: 48 }} />
                </View>
            </ScrollView>
        </View>
    );
}

// ─── Sub-components ─────────────────────────────────────────

function SectionTitle({ icon, label }: { icon: string; label: string }) {
    return (
        <View style={stStyles.row}>
            <View style={stStyles.iconCircle}>
                <Ionicons name={icon as any} size={16} color={theme.colors.primary} />
            </View>
            <Text style={stStyles.title}>{label}</Text>
        </View>
    );
}

const stStyles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 16,
    },
    iconCircle: {
        width: 34,
        height: 34,
        borderRadius: 10,
        backgroundColor: theme.colors.primary + '18',
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 19,
        fontWeight: '800',
        color: theme.colors.text.primary,
        letterSpacing: -0.3,
    },
});

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
    return (
        <View style={irStyles.row}>
            <View style={irStyles.iconCircle}>
                <Ionicons name={icon as any} size={15} color={theme.colors.primary} />
            </View>
            <View style={irStyles.content}>
                <Text style={irStyles.label}>{label}</Text>
                <Text style={irStyles.value}>{value}</Text>
            </View>
        </View>
    );
}

const irStyles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 4 },
    iconCircle: {
        width: 34,
        height: 34,
        borderRadius: 10,
        backgroundColor: theme.colors.primary + '12',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 2,
    },
    content: { flex: 1 },
    label: {
        fontSize: 10,
        fontWeight: '700',
        color: theme.colors.text.tertiary,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        marginBottom: 3,
    },
    value: { fontSize: 14, fontWeight: '600', color: theme.colors.text.primary, lineHeight: 20 },
});

function AdjusterCard({
    label,
    value,
    onDecrement,
    onIncrement,
}: {
    label: string;
    value: number;
    onDecrement: () => void;
    onIncrement: () => void;
}) {
    return (
        <View style={adjStyles.card}>
            <Text style={adjStyles.label}>{label}</Text>
            <View style={adjStyles.controls}>
                <TouchableOpacity style={adjStyles.btn} onPress={onDecrement} activeOpacity={0.8}>
                    <Ionicons name="remove" size={18} color="#fff" />
                </TouchableOpacity>
                <Text style={adjStyles.value}>{value}</Text>
                <TouchableOpacity style={adjStyles.btn} onPress={onIncrement} activeOpacity={0.8}>
                    <Ionicons name="add" size={18} color="#fff" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const adjStyles = StyleSheet.create({
    card: {
        flex: 1,
        backgroundColor: theme.colors.surface,
        borderRadius: 18,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        ...theme.shadows.small,
    },
    label: { fontSize: 12, fontWeight: '600', color: theme.colors.text.secondary, marginBottom: 12 },
    controls: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    btn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: theme.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        ...theme.shadows.button,
    },
    value: {
        fontSize: 24,
        fontWeight: '900',
        color: theme.colors.text.primary,
        minWidth: 32,
        textAlign: 'center',
    },
});

function FlightCard({ flight }: { flight: any }) {
    return (
        <View style={fcStyles.card}>
            <View style={fcStyles.top}>
                <Text style={fcStyles.airline}>{flight.airline}</Text>
                <View style={fcStyles.stopsBadge}>
                    <Text style={fcStyles.stopsText}>
                        {flight.stops === 0
                            ? 'Direto'
                            : `${flight.stops} parada${flight.stops > 1 ? 's' : ''}`}
                    </Text>
                </View>
            </View>
            <Text style={fcStyles.route}>
                {flight.originAirport} → {flight.destinationAirport}
            </Text>
            {flight.departureDate && (
                <Text style={fcStyles.date}>
                    📅 {flight.departureDate}
                    {flight.arrivalDate && flight.arrivalDate !== flight.departureDate
                        ? ` → ${flight.arrivalDate}`
                        : ''}
                </Text>
            )}
        </View>
    );
}

const fcStyles = StyleSheet.create({
    card: {
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        ...theme.shadows.small,
    },
    top: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    airline: { fontSize: 15, fontWeight: '700', color: theme.colors.text.primary },
    stopsBadge: {
        backgroundColor: theme.colors.surfaceLight,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    stopsText: { fontSize: 12, fontWeight: '600', color: theme.colors.text.secondary },
    route: { fontSize: 14, fontWeight: '700', color: theme.colors.primary, marginBottom: 6 },
    date: { fontSize: 12, color: theme.colors.text.secondary },
});

// ─── STYLES ─────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },

    // Error
    errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
    errorText: { fontSize: 16, color: theme.colors.text.secondary, marginBottom: 20, marginTop: 16 },
    errorButton: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 100,
        ...theme.shadows.button,
    },
    errorButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },

    // ── Hero ──
    heroBlock: { width: '100%', height: HERO_HEIGHT, position: 'relative' },
    heroImage: { width: '100%', height: '100%', resizeMode: 'cover' },

    purchasedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        ...theme.shadows.button,
    },
    purchasedBadgeText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: 0.5,
    },
    navBar: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 54 : 24,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    navBtn: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: 'rgba(0,0,0,0.35)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    heroInfo: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        paddingBottom: 22,
    },
    heroTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 8,
        lineHeight: 30,
        letterSpacing: -0.3,
    },
    heroDestRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginBottom: 14,
    },
    heroDest: { fontSize: 13, color: 'rgba(255,255,255,0.85)' },
    heroDot: { fontSize: 13, color: 'rgba(255,255,255,0.45)', marginHorizontal: 2 },
    heroMeta: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    creatorPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255,255,255,0.18)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.25)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    creatorAvatar: { fontSize: 16 },
    creatorName: { fontSize: 13, fontWeight: '600', color: '#fff' },
    ratingPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(255,255,255,0.18)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.25)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    ratingText: { fontSize: 13, fontWeight: '700', color: '#fff' },
    reviewCount: { fontSize: 11, color: 'rgba(255,255,255,0.7)' },

    // ── Download bar ──
    downloadBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
    },
    downloadIconCircle: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: theme.colors.primary + '20',
        alignItems: 'center',
        justifyContent: 'center',
    },
    downloadBarTitle: { fontSize: 14, fontWeight: '700', color: theme.colors.primary },
    downloadBarSub: { fontSize: 11, color: theme.colors.text.tertiary, marginTop: 1 },

    // ── Body ──
    body: { padding: 20 },
    block: { marginBottom: 32 },
    blockSubtitle: {
        fontSize: 13,
        color: theme.colors.text.tertiary,
        marginTop: -8,
        marginBottom: 14,
    },

    // ── Shared card ──
    card: {
        backgroundColor: theme.colors.surface,
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        ...theme.shadows.medium,
    },
    cardDivider: { height: 1, backgroundColor: theme.colors.borderLight, marginVertical: 14 },

    // Info rows (inside card)
    infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 4 },
    infoIconCircle: {
        width: 34,
        height: 34,
        borderRadius: 10,
        backgroundColor: theme.colors.primary + '12',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 2,
    },
    infoContent: { flex: 1 },
    infoLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: theme.colors.text.tertiary,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        marginBottom: 3,
    },
    highlightItem: { fontSize: 13, color: theme.colors.text.secondary, lineHeight: 20 },
    highlightChips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: 6,
    },
    highlightChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 999,
        backgroundColor: theme.colors.primary + '12',
        borderWidth: 1,
        borderColor: theme.colors.primary + '22',
    },
    highlightChipText: {
        fontSize: 12,
        color: theme.colors.text.primary,
        fontWeight: '500',
    },

    // ── Spending ──
    adjustersRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },

    totalGradientCard: {
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        marginBottom: 16,
        ...theme.shadows.large,
    },
    totalCardLabel: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.75)', marginBottom: 6 },
    totalCardAmount: { fontSize: 34, fontWeight: '900', color: '#fff', marginBottom: 6 },
    totalCardDetail: { fontSize: 12, color: 'rgba(255,255,255,0.65)' },

    breakdownCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    breakdownTitle: {
        fontSize: 11,
        fontWeight: '700',
        color: theme.colors.text.tertiary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 12,
    },
    breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
    breakdownRowBorder: { borderBottomWidth: 1, borderBottomColor: theme.colors.borderLight },
    breakdownCat: { fontSize: 14, color: theme.colors.text.primary },
    breakdownVal: { fontSize: 14, fontWeight: '600', color: theme.colors.text.primary },
    breakdownTotalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 12,
        marginTop: 4,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },
    breakdownTotalLabel: { fontSize: 14, fontWeight: '700', color: theme.colors.text.primary },
    breakdownTotalVal: { fontSize: 16, fontWeight: '800', color: theme.colors.primary },

    // ── Flight ──
    flightTotalBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        alignSelf: 'flex-start',
        backgroundColor: theme.colors.success + '18',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        marginBottom: 16,
    },
    flightTotalText: { fontSize: 13, fontWeight: '700', color: theme.colors.success },
    flightLegLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: 8,
        marginTop: 4,
    },
    tipsBox: {
        backgroundColor: theme.colors.surfaceLight,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        gap: 8,
    },
    tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    tipDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: theme.colors.primary,
        marginTop: 7,
    },
    tipText: { fontSize: 13, color: theme.colors.text.secondary, lineHeight: 20, flex: 1 },

    // ── Day accordion ──
    dayCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: 20,
        marginBottom: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        ...theme.shadows.medium,
    },
    dayHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        gap: 12,
    },
    dayNumberBadge: {
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        ...theme.shadows.button,
    },
    dayNumberText: { fontSize: 20, fontWeight: '900', color: '#fff', lineHeight: 22 },
    dayNumberLabel: { fontSize: 8, fontWeight: '700', color: 'rgba(255,255,255,0.75)', letterSpacing: 0.8 },
    dayHeaderInfo: { flex: 1 },
    dayTitle: { fontSize: 15, fontWeight: '700', color: theme.colors.text.primary },
    daySummary: { fontSize: 12, color: theme.colors.text.secondary, marginTop: 2 },
    chevronCircle: {
        width: 30,
        height: 30,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surfaceLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    chevronCircleActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    dayContent: {
        paddingHorizontal: 14,
        paddingBottom: 16,
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: theme.colors.borderLight,
    },

    // ── Activity timeline ──
    activityRow: { flexDirection: 'row', marginBottom: 20 },
    timelineCol: { width: 20, alignItems: 'center', marginRight: 12 },
    timelineDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: theme.colors.primary,
        marginTop: 4,
        borderWidth: 2,
        borderColor: theme.colors.primary + '35',
    },
    timelineLine: {
        width: 2,
        flex: 1,
        marginTop: 4,
        backgroundColor: theme.colors.primary + '28',
        borderRadius: 1,
    },
    activityContent: { flex: 1 },
    activityHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
    activityIcon: { fontSize: 16 },
    activityTime: { fontSize: 13, fontWeight: '700', color: theme.colors.primary },
    durationChip: {
        backgroundColor: theme.colors.surfaceLight,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    durationText: { fontSize: 10, fontWeight: '600', color: theme.colors.text.tertiary },
    activityTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: 3,
    },
    locRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 6 },
    activityLocation: { fontSize: 12, color: theme.colors.text.tertiary },
    activityDesc: {
        fontSize: 13,
        color: theme.colors.text.secondary,
        lineHeight: 19,
        marginBottom: 10,
    },
    activityTipBox: {
        backgroundColor: '#FFFBEB',
        borderRadius: 10,
        padding: 12,
        marginBottom: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#F59E0B',
    },
    activityTipTitle: { fontSize: 11, fontWeight: '700', color: '#92400E', marginBottom: 4 },
    activityTipText: { fontSize: 12, color: '#92400E', lineHeight: 18 },
    mapBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 7,
        backgroundColor: theme.colors.primary + '12',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: theme.colors.primary + '28',
    },
    mapBtnText: { fontSize: 12, fontWeight: '600', color: theme.colors.primary },
    outlineBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: theme.colors.primary,
    },
    outlineBtnText: { fontSize: 12, fontWeight: '600', color: theme.colors.primary },
    actionsRow: { flexDirection: 'row', gap: 8, marginTop: 4, flexWrap: 'wrap' },
    dayCostBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        alignSelf: 'flex-start',
        backgroundColor: theme.colors.primary + '10',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        marginTop: 4,
    },
    dayCostText: { fontSize: 12, fontWeight: '600', color: theme.colors.primary },

    // ── Accommodation ──
    accHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
    accName: { fontSize: 16, fontWeight: '700', color: theme.colors.text.primary, flex: 1 },
    accPriceBadge: {
        backgroundColor: theme.colors.primary + '18',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    accPrice: { fontSize: 12, fontWeight: '700', color: theme.colors.primary },
    accLocation: { fontSize: 12, color: theme.colors.text.tertiary },
    accDesc: { fontSize: 13, color: theme.colors.text.secondary, lineHeight: 19, marginBottom: 8 },
    accRating: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
    accRatingText: { fontSize: 13, fontWeight: '700', color: '#F59E0B' },

    // ── Attractions ──
    attractionTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
    attractionName: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: 4,
    },
    attractionMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
    },
    typeBadge: {
        backgroundColor: theme.colors.primary + '18',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    typeBadgeText: { fontSize: 11, fontWeight: '700', color: theme.colors.primary },
    attractionLocation: { fontSize: 12, color: theme.colors.text.tertiary },
    priceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: theme.colors.primary + '10',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.colors.primary + '28',
        flexShrink: 0,
    },
    priceBadgeText: { fontSize: 12, fontWeight: '700', color: theme.colors.primary },
    chipsRow: { flexDirection: 'row', gap: 8, marginBottom: 10, flexWrap: 'wrap' },
    infoChip: {
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
    infoChipText: { fontSize: 12, color: theme.colors.text.secondary, fontWeight: '500' },
    attractionDesc: {
        fontSize: 14,
        color: theme.colors.text.primary,
        lineHeight: 21,
        marginBottom: 10,
    },

    // ── Transport ──
    transportCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: 14,
        padding: 16,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        ...theme.shadows.small,
    },
    transportHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 6,
    },
    transportName: { fontSize: 14, fontWeight: '700', color: theme.colors.text.primary, flex: 1 },
    transportPassTypes: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.primary,
        marginBottom: 4,
    },
    transportNotes: { fontSize: 12, color: theme.colors.text.secondary, lineHeight: 18 },

    // ── Restaurants ──
    restaurantTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    restaurantNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    restaurantName: { fontSize: 15, fontWeight: '700', color: theme.colors.text.primary },
    cuisineTag: {
        backgroundColor: theme.colors.primary + '18',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    cuisineTagText: { fontSize: 11, fontWeight: '600', color: theme.colors.primary },
    restaurantLocation: { fontSize: 12, color: theme.colors.text.tertiary },
    greenPriceBadge: {
        backgroundColor: '#F0FFF4',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    greenPriceText: { fontSize: 11, fontWeight: '700', color: '#16A34A' },
    restaurantDesc: {
        fontSize: 13,
        color: theme.colors.text.primary,
        lineHeight: 19,
        marginBottom: 6,
    },
    restaurantHours: { fontSize: 12, color: theme.colors.text.secondary, marginBottom: 6 },

    // ── General tips ──
    tipsAuthor: {
        fontSize: 13,
        color: theme.colors.text.secondary,
        marginBottom: 12,
        marginTop: -6,
    },
    generalTipsCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        ...theme.shadows.small,
    },
    generalTipRow: {
        flexDirection: 'row',
        gap: 10,
        paddingVertical: 12,
        alignItems: 'flex-start',
    },
    generalTipRowBorder: {
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
    },
    tipBulletDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: theme.colors.primary,
        marginTop: 7,
    },
    generalTipText: {
        fontSize: 14,
        color: theme.colors.text.primary,
        lineHeight: 22,
        flex: 1,
    },

    // ── Checklist ──
    progressSection: { marginBottom: 20 },
    progressLabel: { fontSize: 13, color: theme.colors.text.secondary, marginBottom: 8 },
    progressBarBg: {
        width: '100%',
        height: 7,
        borderRadius: 4,
        backgroundColor: theme.colors.borderLight,
        overflow: 'hidden',
    },
    progressBarFill: { height: 7, borderRadius: 4 },
    checkCategory: { marginBottom: 16 },
    checkCategoryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10,
    },
    checkCategoryEmoji: { fontSize: 16 },
    checkCategoryIconWrap: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: theme.colors.primary + '14',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkCategoryLabel: { flex: 1, fontSize: 14, fontWeight: '700', color: theme.colors.text.primary },
    checkCategoryCount: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.text.tertiary,
        backgroundColor: theme.colors.surface,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    checkItemsCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        overflow: 'hidden',
        ...theme.shadows.small,
    },
    checkItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        padding: 14,
    },
    checkItemBorder: { borderBottomWidth: 1, borderBottomColor: theme.colors.borderLight },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 7,
        borderWidth: 2,
        borderColor: theme.colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxChecked: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    checkItemText: { fontSize: 14, color: theme.colors.text.primary, flex: 1 },
    checkItemTextDone: {
        textDecorationLine: 'line-through',
        color: theme.colors.text.tertiary,
    },

    // ── Receive list ──
    receiveRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingVertical: 12,
    },
    receiveRowBorder: { borderBottomWidth: 1, borderBottomColor: theme.colors.borderLight },
    receiveEmoji: { fontSize: 22, width: 30, textAlign: 'center' },
    receiveLabel: { flex: 1, fontSize: 14, color: theme.colors.text.primary, fontWeight: '500' },
    receiveCheckCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: theme.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // ── Review ──
    reviewDoneCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        ...theme.shadows.medium,
    },
    reviewDoneHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    reviewDoneTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.primary },
    reviewDoneStars: { flexDirection: 'row', gap: 4, marginBottom: 10 },
    reviewDoneText: { fontSize: 14, color: theme.colors.text.secondary, lineHeight: 20 },

    reviewCTACard: {
        borderRadius: 24,
        padding: 28,
        alignItems: 'center',
        ...theme.shadows.large,
    },
    reviewCTATitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#fff',
        marginTop: 14,
        marginBottom: 6,
    },
    reviewCTASub: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'center',
        lineHeight: 19,
        marginBottom: 20,
    },
    reviewCTABtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#fff',
        paddingHorizontal: 28,
        paddingVertical: 14,
        borderRadius: 100,
        ...theme.shadows.large,
    },
    reviewCTABtnText: { fontSize: 15, fontWeight: '700', color: theme.colors.primary },

    // ─── Referência de Gastos por Pessoa (item-a-item, espelha Detalhes) ───
    costRefTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: 10,
    },
    costRefGroup: { marginBottom: 14 },
    costRefGroupHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 6,
    },
    costRefGroupTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: theme.colors.text.primary,
    },
    costRefItem: {
        padding: 10,
        marginBottom: 6,
        borderRadius: 10,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    costRefItemTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    costRefItemValue: {
        fontSize: 13,
        color: theme.colors.text.secondary,
        marginTop: 2,
    },
    costRefItemConverted: {
        fontSize: 12,
        color: theme.colors.text.tertiary,
    },
    costRefBadgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
    },
    costRefBadgeText: {
        fontSize: 11,
        fontWeight: '600',
    },
    costRefDisclaimer: {
        marginTop: 4,
        fontSize: 11,
        fontStyle: 'italic',
        color: theme.colors.text.tertiary,
        lineHeight: 15,
    },

    // ─── Gastos Extras (lista por item) ───
    spendingItemCard: {
        padding: 12,
        marginBottom: 8,
        borderRadius: 12,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    spendingItemTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    spendingItemDesc: {
        fontSize: 12,
        color: theme.colors.text.secondary,
        marginTop: 2,
        lineHeight: 16,
    },
    spendingItemValue: {
        fontSize: 13,
        fontWeight: '700',
        color: theme.colors.primary,
        marginTop: 6,
    },

    // ─── "Comece por aqui" — central da viagem ───
    quickCard: {
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.colors.primary + '22',
        gap: 14,
    },
    quickCardHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
    },
    quickCardIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: theme.colors.primary + '1A',
        alignItems: 'center',
        justifyContent: 'center',
    },
    quickCardTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: theme.colors.text.primary,
    },
    quickCardSubtitle: {
        fontSize: 12,
        color: theme.colors.text.secondary,
        marginTop: 2,
        lineHeight: 16,
    },
    quickGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    quickItem: {
        flexBasis: '48%',
        flexGrow: 1,
        padding: 12,
        borderRadius: 12,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: theme.colors.border,
        gap: 4,
    },
    quickItemIcon: {
        width: 28,
        height: 28,
        borderRadius: 8,
        backgroundColor: theme.colors.primary + '14',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 2,
    },
    quickItemLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: theme.colors.text.primary,
    },
    quickItemMeta: {
        fontSize: 11,
        color: theme.colors.text.tertiary,
    },
});
