import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Animated,
    Image,
    Alert,
    Share,
    Dimensions,
    StatusBar,
    Platform,
    ActivityIndicator,
    findNodeHandle,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { safeBack } from '../../src/utils/navigation';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../src/theme/theme';
import { haptics } from '../../src/services/haptics';
import { getReviews } from '../../src/services/api';
import { Icon } from '../../src/components/common/Icons';
import SectionHeader from '../../src/components/common/SectionHeader';
import { inferSectionKey } from '../../src/theme/sectionTheme';
import { getCoverImages } from '../../src/utils/itineraryMedia';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getPurchasedItineraryDetail, getCurrencyRates } from '../../src/services/api';
import { useAuth } from '../../src/contexts/AuthContext';
import BudgetSummaryCard from '../../src/components/dashboard/BudgetSummaryCard';
import PeopleSimulator from '../../src/components/dashboard/PeopleSimulator';
import MediaGallery from '../../src/components/common/MediaGallery';
import { getCostReferences, calculateBudgetSummary, formatMoney, type CostReferencesGroup } from '@vamo/shared/itinerary';
import { openExternalUrl as openSafeExternalUrl } from '../../src/utils/externalLinks';
import TripCenter from '../../src/features/trip-center/TripCenter';
import {
    RouteVersioning,
    PdfExportSheet,
    exportRoutePdf,
    type MergedItinerary,
} from '../../src/features/route-versioning';
import { notify } from '../../src/utils/notify';
import { features } from '../../src/config/features';
import { getSnapshot, getCustomization } from '../../src/services/routeCustomization';
import { mergeItineraryWithCustomization } from '../../src/features/route-versioning/mergeEngine';
import { getTripChecklist, getTripFiles } from '../../src/services/tripCenter';
import { convertToAud, summarizeInAud } from '../../src/utils/currencyConversion';

// AttractionInfo type (inline — no longer from mock)
type AttractionInfo = {
    name: string; type?: string; location?: string; description?: string;
    hours?: string; duration?: string; tips?: string; externalLink?: string;
    mapLink?: string; ticketPrice?: string;
};
type ChecklistItem = { id: string; category?: string; item?: string; text?: string; completed?: boolean };
type ItineraryDay = { dayNumber: number; title?: string; summary?: string; estimatedCost?: { min?: number; max?: number }; activities?: ItineraryActivity[] };
type ItineraryActivity = { id: string; icon?: string; time?: string; duration?: string; title?: string; location?: string; description?: string; tips?: string | string[]; mapLink?: string };
type AccommodationInfo = { id: string; name?: string; priceRange?: string; address?: string; location?: string; description?: string; rating?: number; tips?: string; mapLink?: string };
type TransportInfo = { description?: string; priceValue?: string; priceCurrency?: string; passTypes?: string; notes?: string };
type RestaurantInfo = { name?: string; cuisine?: string; location?: string; priceRange?: string; description?: string; hours?: string; tips?: string; externalLink?: string };
type ReceiveItem = { icon?: string; label?: string };

const PLACEHOLDER_IMAGE =
    'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=900&auto=format&fit=crop';

const { width } = Dimensions.get('window');
const HERO_HEIGHT = 340;

export default function PurchasedItineraryScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const {
        accessToken,
        user,
        isAuthenticated,
        isLoading: authLoading,
    } = useAuth();

    // ─── Animations ────────────────────────────────────────
    const headerAnim = useRef(new Animated.Value(0)).current;
    const scrollViewRef = useRef<ScrollView>(null);

    // ─── Scroll-to-section (Comece por aqui) ──────────────────────────
    //
    // Bug histórico: a versão anterior usava `onLayout` e salvava
    // `e.nativeEvent.layout.y`. Mas esse `y` é RELATIVO ao View pai
    // imediato — NÃO ao ScrollView. Como cada wrapper de `trackSection`
    // está dentro de `<View style={styles.body}>` (que por sua vez está
    // dentro do ScrollView), o `y` salvo era local (tipicamente 50-300px),
    // muito menor que a posição absoluta de scroll. Resultado: clicar
    // num card do "Seu roteiro está pronto" frequentemente parecia "não
    // fazer nada" (scroll pra um y já visível).
    //
    // Solução: guardar uma ref ao componente da seção e, no momento do
    // clique, usar `measureLayout(scrollHandle, …)` — que devolve a
    // posição RELATIVA ao ScrollView. Funciona cross-platform (iOS,
    // Android, Expo Web).
    const sectionRefs = useRef<Record<string, View | null>>({});

    const trackSection = (key: string) => (node: View | null) => {
        sectionRefs.current[key] = node;
    };

    const scrollToSection = (key: string) => {
        haptics.light();
        const sectionNode = sectionRefs.current[key];
        const scrollView = scrollViewRef.current;
        if (!sectionNode || !scrollView) {
            if (__DEV__) {
                console.warn(
                    `[scrollToSection] alvo ausente: key="${key}". ` +
                    `sectionNode=${!!sectionNode}, scrollView=${!!scrollView}`,
                );
            }
            return;
        }
        // No RN Web o `node` do ref é o HTMLElement — usamos a API DOM nativa
        // (scrollIntoView), que respeita o scroll container ancestral correto
        // mesmo com vários ScrollViews aninhados. Isso evita o cálculo
        // impreciso do `measureLayout` polyfill no RN Web.
        if (Platform.OS === 'web' && (sectionNode as unknown as HTMLElement)?.scrollIntoView) {
            (sectionNode as unknown as HTMLElement).scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
            return;
        }
        const scrollHandle = findNodeHandle(scrollView);
        if (scrollHandle == null) return;
        // Nativo: measureLayout(ancestor, onSuccess, onFail) mede relativo
        // ao ScrollView e funciona em iOS/Android.
        (sectionNode as any).measureLayout?.(
            scrollHandle,
            (_x: number, y: number) => {
                scrollView.scrollTo({ y: Math.max(0, y - 12), animated: true });
            },
            () => {
                if (__DEV__) {
                    console.warn(`[scrollToSection] measureLayout falhou para key="${key}"`);
                }
            },
        );
    };

    // ── Aba forçada no RouteVersioning ────────────────────────────────
    // O atalho "Abrir checklist" do "Comece por aqui" precisa levar o
    // usuário pra Minha Versão (a Central da Viagem só aparece lá).
    // Quando o caller seta `routeTargetTab`, o RouteVersioning sincroniza
    // via useEffect interno e o usuário continua livre pra trocar de aba
    // depois. NÃO é "controlled" no sentido React clássico — só um
    // gatilho one-shot quando o target string muda de valor.
    const [routeTargetTab, setRouteTargetTab] = useState<'original' | 'mine' | undefined>(undefined);

    // Aba ATUALMENTE ativa no RouteVersioning — alimentada via onTabChange.
    // Os atalhos do "Comece por aqui" consultam isto pra rolar até a versão
    // certa (itinerary:original vs itinerary:mine etc) SEM trocar de aba.
    const [routeActiveTab, setRouteActiveTab] = useState<'original' | 'mine'>('original');

    // Callback que o RouteVersioning chama pra registrar os refs internos das
    // seções por versão. As keys ficam: 'itinerary:original', 'itinerary:mine',
    // 'checklist:original' (o de Minha versão vem do `trackSection` direto,
    // pois a TripCenter mora no slot `mineExtras` controlado por este caller).
    const handleRegisterSectionRef = useCallback(
        (section: 'itinerary' | 'checklist', version: 'original' | 'mine', node: View | null) => {
            sectionRefs.current[`${section}:${version}`] = node;
        },
        [],
    );

    // ─── Merged personalizado (vem do RouteVersioning) ─────────────────
    // Quando o viajante edita custos/cards/dias na Minha Versão, o
    // mergeEngine recomputa o roteiro mergeado (snapshot + customization).
    // Expomos pra cá pra que a seção "Custos e orçamento" / "Referência
    // de Gastos por Pessoa" possa refletir as edições do viajante em vez
    // de ficar travada nos custos originais do criador. Fallback ao
    // `itinerary` original enquanto o merged não chegou.
    const [mergedItinerary, setMergedItinerary] = useState<MergedItinerary | null>(null);

    // ─── State ─────────────────────────────────────────────
    const [itinerary, setItinerary] = useState<any | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [travelers, setTravelers] = useState(1);
    const [customDays, setCustomDays] = useState(7);
    const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([1]));
    // Removido `completedChecklist` (e respectivo AsyncStorage) — o checklist
    // do roteiro agora é tratado dentro da Central da Viagem (ChecklistTab),
    // que mantém o próprio progresso por itinerário.
    const [currencyRates, setCurrencyRates] = useState<Record<string, number>>({});
    const [peopleCount, setPeopleCount] = useState<number>(1);
    /** Avaliação real (vinda da API) deste usuário pra este roteiro.
     *  `null` = ainda não carregou; `undefined` = carregou e usuário ainda
     *  não avaliou; objeto = review existente. */
    const [userReview, setUserReview] = useState<any | null | undefined>(null);

    // ─── Onboarding pós-compra (mostra "roteiro interativo" só na 1ª vez) ──
    // Chave namespada por travelerId+itineraryId — mesma convenção do
    // peopleCountStorageKey logo abaixo. Sem o travelerId, o flag vazaria
    // entre contas no mesmo dispositivo.
    const interactiveOnboardingKey =
        user?.travelerId && id
            ? `vamo:interactiveOnboarding:${user.travelerId}:${id}`
            : null;
    const [showInteractiveOnboarding, setShowInteractiveOnboarding] = useState(false);
    useEffect(() => {
        if (!features.interactivePurchasedRouteEnabled || !interactiveOnboardingKey) return;
        let mounted = true;
        AsyncStorage.getItem(interactiveOnboardingKey)
            .then((seen) => { if (mounted && !seen) setShowInteractiveOnboarding(true); })
            .catch(() => {});
        return () => { mounted = false; };
    }, [interactiveOnboardingKey]);
    const dismissInteractiveOnboarding = () => {
        setShowInteractiveOnboarding(false);
        if (interactiveOnboardingKey) {
            AsyncStorage.setItem(interactiveOnboardingKey, '1').catch(() => {});
        }
    };

    // ─── PDF export ────────────────────────────────────────
    // O botão "Exportar PDF" no header abre o sheet. O sheet escolhe a variante
    // e usamos snapshot/merged populados pelo RouteVersioning (via onExportPdf)
    // como fonte de verdade para evitar redownload. Fallback: liveItinerary.
    const [pdfSheetVisible, setPdfSheetVisible] = useState(false);
    const pdfDataRef = useRef<{ snapshot: any; merged: MergedItinerary | null }>({
        snapshot: null,
        merged: null,
    });

    // Carrega review do usuário a partir da API (substitui o mock antigo)
    useEffect(() => {
        if (authLoading) return;
        if (!id || !user?.travelerId) {
            setUserReview(undefined);
            return;
        }
        let mounted = true;
        getReviews({ itineraryId: id })
            .then(({ reviews }) => {
                if (!mounted) return;
                const mine = reviews.find((r: any) => r.travelerId === user.travelerId);
                setUserReview(mine ?? undefined);
            })
            .catch(() => { if (mounted) setUserReview(undefined); });
        return () => { mounted = false; };
    }, [authLoading, id, user?.travelerId]);

    useEffect(() => {
        if (authLoading) return;
        if (!id) { setLoadError('Roteiro inválido.'); setIsLoading(false); return; }
        if (!isAuthenticated || !accessToken) {
            setItinerary(null);
            setLoadError('Faça login para acessar este roteiro comprado.');
            setIsLoading(false);
            return;
        }
        let mounted = true;
        setIsLoading(true);
        setLoadError(null);
        getPurchasedItineraryDetail(id, accessToken)
            .then((data) => {
                if (!mounted) return;
                if (data) {
                    setItinerary(data);
                    setCustomDays(data.duration || 7);
                    setLoadError(null);
                    Animated.timing(headerAnim, { toValue: 1, duration: 700, useNativeDriver: true }).start();
                } else {
                    setLoadError('Este roteiro não está liberado para esta conta.');
                }
            })
            .catch(() => { if (mounted) setLoadError('Não foi possível carregar o roteiro comprado.'); })
            .finally(() => { if (mounted) setIsLoading(false); });
        getCurrencyRates().then(r => { if (mounted) setCurrencyRates(r); }).catch(() => {});
        return () => { mounted = false; };
    }, [authLoading, id, accessToken, isAuthenticated]);

    /** Converte valor em qualquer moeda para AUD sem inventar taxa ausente. */
    const toAUD = (value: string | number, currency: string): string | null => {
        const n = typeof value === 'number' ? value : parseFloat(String(value)) || 0;
        if (n <= 0) return formatMoney(0);
        const aud = convertToAud(n, currency, currencyRates);
        if (aud === null) return null;
        return formatMoney(aud);
    };

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

    // [Removido] useEffect que hidratava `completedChecklist` do AsyncStorage.
    // O checklist do criador agora é controlado pela Central da Viagem
    // (ChecklistTab) — não há mais estado de checklist nesta tela.

    if (authLoading || isLoading) {
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
                    <Text style={styles.errorText}>{loadError || 'Roteiro não encontrado'}</Text>
                    <TouchableOpacity
                        style={styles.errorButton}
                        onPress={() => {
                            if (!isAuthenticated && id) {
                                router.push({
                                    pathname: '/login',
                                    params: { next: `/purchased-itinerary/${id}` },
                                } as any);
                                return;
                            }
                            safeBack(router, '/(tabs)/my-trips');
                        }}
                    >
                        <Text style={styles.errorButtonText}>
                            {!isAuthenticated && id ? 'Entrar' : 'Voltar'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // ─── Computed ──────────────────────────────────────────
    const currentProfile = itinerary.spendingProfile;
    const totalEstimate = (currentProfile?.dailyCost || 0) * travelers * customDays;
    const days: ItineraryDay[] = Array.isArray(itinerary.days) ? itinerary.days : [];
    const checklist: ChecklistItem[] = Array.isArray(itinerary.checklist) ? itinerary.checklist : [];
    // Capa pelo contrato central (highlightPhotos > images > mediaUrls, com
    // URL resolvida pro ambiente) — antes lia só `images[0]`, que costuma
    // estar vazio porque o fluxo de criação preenche highlightPhotos.
    const heroImage = getCoverImages(itinerary)[0] ?? PLACEHOLDER_IMAGE;

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

    // [Removido] toggleChecklist — migrado para a Central da Viagem.

    const handleDownload = () => {
        haptics.light();
        Alert.alert('Acesso offline em breve', 'Por enquanto, o roteiro fica salvo na sua conta e pode ser acessado em Meus Roteiros.');
    };

    const openExternalUrl = async (url?: string) => {
        haptics.light();
        await openSafeExternalUrl(url, {
            invalidMessage: 'Este item ainda não tem um link válido.',
            fallbackMessage: 'Não foi possível abrir este link no dispositivo.',
        });
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

    const handlePdfSelect = async (variant: 'original' | 'personalized') => {
        haptics.light();
        try {
            const generatedAtISO = new Date().toISOString();
            let { snapshot, merged } = pdfDataRef.current;
            let travelerChecklist = undefined;
            let travelerFiles = undefined;
            if (accessToken && (!snapshot || (variant === 'personalized' && !merged))) {
                const [freshSnapshot, customization] = await Promise.all([
                    getSnapshot(id as string, accessToken),
                    getCustomization(id as string, accessToken),
                ]);
                snapshot = freshSnapshot;
                merged = mergeItineraryWithCustomization(freshSnapshot, customization);
                pdfDataRef.current = { snapshot, merged };
            }
            if (variant === 'personalized' && accessToken) {
                [travelerChecklist, travelerFiles] = await Promise.all([
                    getTripChecklist(id as string, accessToken),
                    getTripFiles(id as string, accessToken),
                ]);
            }
            await exportRoutePdf({
                itinerary: snapshot || itinerary,
                merged: variant === 'personalized' ? merged ?? undefined : undefined,
                variant,
                generatedAtISO,
                rates: currencyRates,
                travelerChecklist: variant === 'personalized' ? travelerChecklist : undefined,
                travelerFiles: variant === 'personalized' ? travelerFiles : undefined,
            });
        } catch (e: any) {
            notify({
                title: 'Não foi possível exportar',
                message: e?.message || 'Tente novamente em instantes.',
                variant: 'error',
            });
        }
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
                    <Image source={{ uri: heroImage }} style={styles.heroImage} />
                    <LinearGradient
                        colors={theme.colors.gradients.hero as unknown as [string, string, string]}
                        style={StyleSheet.absoluteFill}
                        locations={[0, 0.4, 1]}
                    />

                    {/* Nav bar */}
                    <View style={styles.navBar}>
                        <TouchableOpacity style={styles.navBtn} onPress={() => safeBack(router, '/(tabs)/my-trips')}>
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
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            <TouchableOpacity
                                style={styles.navBtn}
                                onPress={() => {
                                    haptics.light();
                                    setPdfSheetVisible(true);
                                }}
                                accessibilityRole="button"
                                accessibilityLabel="Exportar PDF"
                            >
                                <Ionicons name="document-text-outline" size={22} color="#fff" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.navBtn} onPress={handleShare}>
                                <Ionicons name="share-outline" size={22} color="#fff" />
                            </TouchableOpacity>
                        </View>
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
                            <Text style={styles.downloadBarTitle}>Acesso offline em breve</Text>
                            <Text style={styles.downloadBarSub}>Disponível em breve</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={theme.colors.primary} />
                    </LinearGradient>
                </TouchableOpacity>

                <View style={styles.body}>

                    {/* Ordem da página (depois do hero):
                        1. Onboarding (1ª vez)
                        2. "Comece por aqui" — atalhos rápidos
                        3. Sobre a Experiência
                        4. Custos e orçamento
                        5. Meu roteiro (Original / Minha versão) com módulos
                        6. O que você recebeu
                        7. Fotos e vídeos da viagem
                        8. Avaliar este roteiro
                        Antes, o RouteVersioning (5) vinha antes de 2-4 e empurrava
                        os atalhos/custos para o fim da página. */}

                    {/* ══════════ ONBOARDING: roteiro interativo (1ª vez) ══════════ */}
                    {showInteractiveOnboarding && (
                        <View style={styles.block}>
                            <View style={styles.onboardCard}>
                                <View style={styles.onboardHeader}>
                                    <View style={styles.onboardIconWrap}>
                                        <Ionicons name="map-outline" size={18} color={theme.colors.primary} />
                                    </View>
                                    <Text style={styles.onboardTitle}>Este é seu roteiro interativo</Text>
                                    <TouchableOpacity
                                        onPress={dismissInteractiveOnboarding}
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                        accessibilityLabel="Dispensar"
                                    >
                                        <Ionicons name="close" size={18} color={theme.colors.text.tertiary} />
                                    </TouchableOpacity>
                                </View>
                                <Text style={styles.onboardText}>
                                    Você pode consultar a versão original, personalizar sua viagem,
                                    adicionar arquivos e acompanhar seu checklist. Suas alterações
                                    ficam salvas apenas na sua versão.
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* ══════════ COMECE POR AQUI — central da viagem ══════════ */}
                    {(() => {
                        const daysCount = days.length;
                        const mediaCount =
                            (Array.isArray(itinerary.highlightPhotos) ? itinerary.highlightPhotos.length : 0) +
                            (Array.isArray(itinerary.images) ? itinerary.images.length : 0) +
                            (Array.isArray(itinerary.mediaUrls) ? itinerary.mediaUrls.length : 0);
                        const checklistCount = checklist.length;

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
                                                onPress={() => {
                                                    // Regra: NUNCA trocar de aba. Os atalhos rolam pra
                                                    // versão ATUAL do usuário. `itinerary` e `checklist`
                                                    // têm refs separados por versão; `costs` e `media`
                                                    // são blocos únicos fora do RouteVersioning.
                                                    const versioned = a.sectionKey === 'itinerary' || a.sectionKey === 'checklist';
                                                    const key = versioned ? `${a.sectionKey}:${routeActiveTab}` : a.sectionKey;
                                                    scrollToSection(key);
                                                }}
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
                                                        <Ionicons name="checkmark" size={12} color={theme.colors.primary} style={{ marginTop: 1 }} />
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

                    {/* ══════════ CUSTOS E ORÇAMENTO (transparência graduada) ══════════
                        IMPORTANTE — fonte dos dados:
                        Quando o `mergedItinerary` está disponível (vem do
                        RouteVersioning via onMergedChange), usamos os dados
                        do MERGED — assim valores editados pelo viajante
                        (`data.cost = { value, currency }`), itens adicionados
                        e itens ocultados via Minha Versão entram na
                        Referência de Gastos. Fallback ao `itinerary`
                        original enquanto o merge não chegou (primeiros
                        ms da carga ou sessão sem auth). */}
                    <View style={styles.block} ref={trackSection('costs')} collapsable={false}>
                        <SectionTitle icon="wallet-outline" label="Custos e orçamento do roteiro" />
                        {(() => {
                            // Helper: extrai array do merged se houver, senão cai no itinerary original.
                            // mergedItinerary tem shape MergedItinerary com arrays de MergedItem
                            // onde cada MergedItem.data é o objeto que `getCostReferences` espera.
                            const useMerged = mergedItinerary !== null;
                            const accommodations = useMerged
                                ? mergedItinerary!.accommodations.map(m => m.data)
                                : itinerary.accommodations;
                            const attractions = useMerged
                                ? mergedItinerary!.attractions.map(m => m.data)
                                : itinerary.attractions;
                            const transports = useMerged
                                ? mergedItinerary!.transports.map(m => m.data)
                                : itinerary.transports;
                            const restaurants = useMerged
                                ? mergedItinerary!.restaurants.map(m => m.data)
                                : itinerary.restaurants;
                            const extraSpendingItems = useMerged
                                ? mergedItinerary!.extraSpendingItems.map(m => m.data)
                                : itinerary.extraSpendingItems;
                            // Flight cost ainda vem do snapshot original — viajante hoje
                            // não tem campo `cost` no FieldSpec FLIGHT (ver itemFields.ts).
                            // Quando habilitarmos, basta ler de `mergedItinerary.flightOutbound?.data.cost`.
                            const costForm = {
                                accommodations,
                                attractions,
                                transports,
                                restaurants,
                                extraSpendingItems,
                                flightCost: itinerary.flightInfo?.cost,
                                flightSpending: itinerary.flightInfo?.spending,
                            };
                            const summary = calculateBudgetSummary(costForm as any);
                            // Total agregado À PROVA DE MULTI-MOEDA.
                            // `calculateBudgetSummary` soma os valores BRUTOS e rotula
                            // com a moeda dominante — o que gera totais absurdos quando
                            // o roteiro mistura moedas (ex.: um item JPY 12.000 somado a
                            // um item A$ 2.000 vira "A$ 14.000"). Aqui convertemos o
                            // valor POR PESSOA de cada item para AUD (moeda de referência
                            // do mercado) usando as MESMAS taxas do admin (`currencyRates`)
                            // que alimentam a conversão "≈ A$" item-a-item, e somamos.
                            // Itens já em AUD passam intactos. Moeda sem taxa NÃO
                            // entra no agregado como se tivesse paridade 1:1.
                            const costItems = getCostReferences(costForm as any).flatMap(g => g.items);
                            const converted = summarizeInAud(
                                costItems.map(it => ({
                                    amount: it.amountPerPerson,
                                    currency: it.currency,
                                })),
                                currencyRates,
                            );
                            const summaryConverted = {
                                ...summary,
                                totalInformed: converted.totalAud,
                                currency: 'AUD',
                            };
                            return (
                                <>
                                    {converted.missingCurrencies.length === 0 ? (
                                        <>
                                            <BudgetSummaryCard
                                                form={costForm as any}
                                                summary={summaryConverted}
                                                variant="purchased"
                                                hideWhenEmpty
                                            />
                                            <PeopleSimulator
                                                totalPerPerson={summaryConverted.totalInformed}
                                                currency={summaryConverted.currency}
                                                value={peopleCount}
                                                onChange={updatePeopleCount}
                                            />
                                        </>
                                    ) : (
                                        <View style={styles.currencyWarning}>
                                            <Ionicons name="alert-circle-outline" size={16} color={theme.colors.warning} />
                                            <Text style={styles.currencyWarningText}>
                                                Total em AUD indisponível: falta cotação para {converted.missingCurrencies.join(', ')}.
                                                Os valores originais continuam listados abaixo.
                                            </Text>
                                        </View>
                                    )}
                                </>
                            );
                        })()}

                        {/* Referência de Gastos por Pessoa — item-a-item (espelha Detalhes).
                            Reflete edições do viajante: lê do merged quando disponível
                            (mesma lógica de fallback do BudgetSummaryCard acima). */}
                        {(() => {
                            const useMerged = mergedItinerary !== null;
                            const costGroups = getCostReferences({
                                accommodations: useMerged
                                    ? mergedItinerary!.accommodations.map(m => m.data)
                                    : itinerary.accommodations,
                                attractions: useMerged
                                    ? mergedItinerary!.attractions.map(m => m.data)
                                    : itinerary.attractions,
                                transports: useMerged
                                    ? mergedItinerary!.transports.map(m => m.data)
                                    : itinerary.transports,
                                restaurants: useMerged
                                    ? mergedItinerary!.restaurants.map(m => m.data)
                                    : itinerary.restaurants,
                                extraSpendingItems: useMerged
                                    ? mergedItinerary!.extraSpendingItems.map(m => m.data)
                                    : itinerary.extraSpendingItems,
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
                                                const convertedLabel = item.currency !== 'AUD'
                                                    ? toAUD(item.amountPerPerson, item.currency)
                                                    : null;
                                                return (
                                                    <View key={idx} style={styles.costRefItem}>
                                                        <Text style={styles.costRefItemTitle}>{item.title}</Text>
                                                        <Text style={styles.costRefItemValue}>
                                                            <Text style={{ fontWeight: '700' }}>{formatMoney(item.amountPerPerson, item.currency)}</Text>
                                                            {' por pessoa'}
                                                            {item.currency !== 'AUD' && (
                                                                <Text style={styles.costRefItemConverted}>
                                                                    {convertedLabel
                                                                        ? ` ≈ ${convertedLabel}`
                                                                        : ' · cotação AUD indisponível'}
                                                                </Text>
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

                    {/* ══════════ MEU ROTEIRO (Original / Minha versão) ══════════
                        A Central da Viagem (TripCenter) vive DENTRO do RouteVersioning,
                        no slot `mineExtras` — só aparece quando a aba ativa é "Minha
                        versão". A Original é fiel e somente leitura.

                        Refs internos:
                        - 'itinerary:original' / 'itinerary:mine' → o RouteVersioning
                          passa onRegisterSectionRef pra OriginalView/MyRouteView, que
                          envolvem o bloco "Itinerário por Dia" da sua versão.
                        - 'checklist:original' → bloco "Checklist do roteiro" da
                          OriginalView (read-only com toggle de progresso).
                        - 'checklist:mine' → TripCenter (Central da Viagem) montada
                          no mineExtras abaixo, registrada via trackSection direto.

                        Atalhos do "Comece por aqui" consultam routeActiveTab e rolam
                        pra versão certa SEM trocar de aba. */}
                    <View>
                        <RouteVersioning
                            itineraryId={id as string}
                            liveItinerary={itinerary}
                            canEdit={isAuthenticated && !!accessToken}
                            targetTab={routeTargetTab}
                            onTabChange={setRouteActiveTab}
                            onRegisterSectionRef={handleRegisterSectionRef}
                            onMergedChange={setMergedItinerary}
                            onExportPdf={({ variant, snapshot, merged }) => {
                                // Cache snapshot/merged para o sheet do header reusar
                                // sem disparar fetch redundante.
                                pdfDataRef.current = { snapshot, merged };
                                // O botão interno do RouteVersioning escolhe a variante
                                // direto da aba ativa — exporta imediatamente.
                                void handlePdfSelect(variant);
                            }}
                            mineExtras={({
                                creatorChecklistProgress,
                                creatorChecklistPending,
                                onUpdateCreatorChecklistProgress,
                            }) => (
                                <View ref={trackSection('checklist:mine')} collapsable={false}>
                                    <TripCenter
                                        purchaseId={undefined}
                                        itineraryId={id as string}
                                        creatorChecklist={checklist}
                                        canEdit={isAuthenticated && !!accessToken}
                                        creatorChecklistProgress={creatorChecklistProgress}
                                        creatorChecklistPending={creatorChecklistPending}
                                        onUpdateCreatorChecklistProgress={onUpdateCreatorChecklistProgress}
                                    />
                                </View>
                            )}
                        />
                    </View>

                    {/* ══════════ CHECKLIST DE PLANEJAMENTO — REMOVIDO
                        O checklist agora vive APENAS dentro da "Minha Central
                        da Viagem" (TripCenter ↑), via ChecklistTab. Mantemos
                        este comentário como salvaguarda para evitar que a
                        seção duplicada seja recriada por engano. ══════════ */}

                    {/* ══════════ O QUE VOCÊ RECEBEU ══════════ */}
                    {itinerary.receiveList && (
                        <View style={styles.block}>
                            <SectionTitle icon="gift-outline" label="O que você recebeu" />
                            <View style={styles.card}>
                                {itinerary.receiveList.map((item: ReceiveItem, i: number) => (
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

                    {/* ══════════ FOTOS E VÍDEOS DA VIAGEM ══════════
                        Penúltima seção da página — antes era logo após Custos,
                        empurrando o "O que você recebeu" e Avaliar pro pé. */}
                    <View ref={trackSection('media')} collapsable={false}>
                        <MediaGallery itinerary={itinerary} />
                    </View>

                    {/* ══════════ AVALIAR ESTE ROTEIRO ══════════ */}
                    <View style={styles.block}>
                        <SectionTitle icon="star-outline" label="Avaliar este Roteiro" />
                        {userReview ? (
                            <View style={styles.reviewDoneCard}>
                                <View style={styles.reviewDoneHeader}>
                                    <Icon name="verified" size={20} color={theme.colors.primary} />
                                    <Text style={styles.reviewDoneTitle}>Sua avaliação</Text>
                                </View>
                                <View style={styles.reviewDoneStars}>
                                    {[1, 2, 3, 4, 5].map(s => (
                                        <Ionicons
                                            key={s}
                                            name={s <= Number(userReview.rating || 0) ? 'star' : 'star-outline'}
                                            size={20}
                                            color="#FFD700"
                                        />
                                    ))}
                                </View>
                                {(userReview.text || userReview.comment) ? (
                                    <Text style={styles.reviewDoneText} numberOfLines={4}>
                                        {userReview.text || userReview.comment}
                                    </Text>
                                ) : null}
                                {Array.isArray(userReview.photos) && userReview.photos.length > 0 ? (
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.reviewDonePhotos}>
                                        {userReview.photos.map((uri: string, index: number) => (
                                            <Image
                                                key={`${uri}-${index}`}
                                                source={{ uri }}
                                                style={styles.reviewDonePhoto}
                                                resizeMode="cover"
                                            />
                                        ))}
                                    </ScrollView>
                                ) : null}
                            </View>
                        ) : userReview === null ? (
                            // Loading — evita CTA piscar antes de saber se já avaliou
                            <View style={[styles.reviewDoneCard, { alignItems: 'center', paddingVertical: 18 }]}>
                                <ActivityIndicator size="small" color={theme.colors.primary} />
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

            {/* ══════════ Sheet de exportação de PDF ══════════ */}
            <PdfExportSheet
                visible={pdfSheetVisible}
                onClose={() => setPdfSheetVisible(false)}
                onSelect={(variant) => { void handlePdfSelect(variant); }}
                personalizedDisabled={!accessToken}
            />
        </View>
    );
}

// ─── Sub-components ─────────────────────────────────────────

function SectionTitle({ icon, label }: { icon: string; label: string }) {
    // Cabeçalho premium compartilhado — acento/ícone por seção quando a
    // label é reconhecida; caso contrário, fallback teal institucional.
    return (
        <SectionHeader
            sectionKey={inferSectionKey(label)}
            icon={icon}
            label={label}
            style={stStyles.headerSpacing}
        />
    );
}

const stStyles = StyleSheet.create({
    headerSpacing: { marginBottom: 16 },
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
    // 20px lateral somavam com `marginHorizontal:16` + `padding:18` do
    // RouteVersioning.card e consumiam 108px do viewport mobile (~29%
    // perdido). Baixamos pra 16 — mesma "respiração" lateral dos cards
    // padrão do app, sem encostar nas bordas.
    body: { padding: 16 },
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
        alignItems: 'flex-start',
        gap: 5,
        paddingHorizontal: 10,
        paddingVertical: 6,
        // borderRadius menor que 999: destaques são frases (várias linhas),
        // não tags curtas — pílula "redonda" fica estranha em texto longo.
        borderRadius: 12,
        backgroundColor: theme.colors.primary + '12',
        borderWidth: 1,
        borderColor: theme.colors.primary + '22',
        // Cap em 100% + shrink: frase longa quebra DENTRO do chip em vez de
        // vazar/ser cortada pela borda do card (overflow:hidden do pai).
        flexShrink: 1,
        maxWidth: '100%',
    },
    highlightChipText: {
        fontSize: 12,
        color: theme.colors.text.primary,
        fontWeight: '500',
        flexShrink: 1,
        minWidth: 0,
        lineHeight: 16,
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
    reviewDonePhotos: { marginTop: 12 },
    reviewDonePhoto: {
        width: 72,
        height: 72,
        borderRadius: 12,
        marginRight: 10,
        backgroundColor: theme.colors.surfaceLight,
    },

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
    currencyWarning: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        marginVertical: 12,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.warning + '55',
        backgroundColor: theme.colors.warning + '12',
    },
    currencyWarningText: {
        flex: 1,
        fontSize: 12,
        lineHeight: 17,
        color: theme.colors.text.secondary,
    },
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
    onboardCard: {
        backgroundColor: 'rgba(40, 201, 191, 0.08)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.colors.primary + '33',
        padding: 16,
        gap: 8,
    },
    onboardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    onboardIconWrap: {
        width: 34,
        height: 34,
        borderRadius: 8,
        backgroundColor: theme.colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
    },
    onboardTitle: {
        flex: 1,
        fontSize: 15,
        fontWeight: '800',
        color: theme.colors.secondary,
    },
    onboardText: {
        fontSize: 13,
        color: theme.colors.text.secondary,
        lineHeight: 18,
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
