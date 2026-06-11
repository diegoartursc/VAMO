import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Modal, Linking, Platform, Alert, Dimensions, Animated, Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../../src/theme/theme';
import { haptics } from '../../src/services/haptics';
import { Ionicons } from '@expo/vector-icons';
import { Icon, IconName } from '../../src/components/common/Icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { useFavorites } from '../../src/hooks/useFavorites';
import { getMyTrips, getMyReviews } from '../../src/services/api';
import { openExternalUrl as openSafeExternalUrl } from '../../src/utils/externalLinks';
import { confirm } from '../../src/utils/confirm';
import { notify } from '../../src/utils/notify';
import { calculateTravelerProgress } from '../../src/gamification';
import { getCreatorQuestions } from '../../src/services/api';
import { formatMoney } from '@vamo/shared/itinerary';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3333/api';
// Chaves namespeadas por travelerId — sem isso, dois usuários no mesmo
// dispositivo herdavam preferências/modo do anterior (mesma armadilha do
// carrinho/favoritos). As constantes abaixo são as chaves globais legacy que
// apagamos uma vez por mount via legacyWipe (defesa-em-profundidade).
const VIEW_MODE_KEY_PREFIX = '@vamo_profile_view_mode';
const PROFILE_PREFS_KEY_PREFIX = '@vamo_profile_preferences';
const LEGACY_VIEW_MODE_KEY = '@vamo_profile_view_mode';
const LEGACY_PROFILE_PREFS_KEY = '@vamo_profile_preferences';
const viewModeKeyFor = (travelerId: string | null | undefined) =>
    travelerId ? `${VIEW_MODE_KEY_PREFIX}:${travelerId}` : null;
const prefsKeyFor = (travelerId: string | null | undefined) =>
    travelerId ? `${PROFILE_PREFS_KEY_PREFIX}:${travelerId}` : null;
type ViewMode = 'traveler' | 'creator';

// ─── Creator dashboard stats (resumo) ─────────────────────────
interface CreatorItinerarySummary {
    id: string;
    title: string;
    destination?: string;
    country?: string;
    status: string;
    sales: number;
    revenue: number;
    rating?: number | null;
    duration?: number;
    price?: number;
    qualityScore?: number;
    updatedAt?: string;
}
interface CreatorStatsSummary {
    totalItineraries: number;
    activeItineraries: number;
    publishedItineraries: number;
    pendingReview: number;
    draftItineraries: number;
    rejectedItineraries: number;
    totalSales: number;
    totalRevenue: number;
    averageRating: number;
    averageQualityScore: number | null;
    itineraries: CreatorItinerarySummary[];
}

const { width } = Dimensions.get('window');

const CURRENCIES = ['(A$) AUD', '($) USD', '(€) EUR', '(£) GBP', '(NZ$) NZD'];
const LANGUAGES = ['english', 'español'];
const APPEARANCES = ['System default', 'Light', 'Dark'];

const TRAVEL_TYPES = ['Luxury', 'Budget', 'Backpacking', 'Family', 'Romantic', 'Adventure'];
const BUDGET_RANGES = ['Up to A$ 1,000', 'A$ 1,000 – 3,000', 'A$ 3,000 – 6,000', 'A$ 6,000+'];
const INTEREST_OPTIONS = [
    { id: 'nature', icon: 'trees' as IconName, label: 'Nature' },
    { id: 'culture', icon: 'landmark' as IconName, label: 'Culture' },
    { id: 'food', icon: 'utensils' as IconName, label: 'Food' },
    { id: 'adventure', icon: 'mountain' as IconName, label: 'Adventure' },
    { id: 'beaches', icon: 'compass' as IconName, label: 'Beaches' },
    { id: 'shopping', icon: 'briefcase' as IconName, label: 'Shopping' },
    { id: 'nightlife', icon: 'star' as IconName, label: 'Nightlife' },
    { id: 'heritage', icon: 'landmark' as IconName, label: 'Heritage' },
];

const DEFAULT_PROFILE_PREFERENCES = {
    currency: '(A$) AUD',
    language: 'english',
    appearance: 'System default',
    travelType: 'Adventure',
    budget: 'A$ 1,000 – 3,000',
    selectedInterests: ['culture', 'food'],
};

export default function ProfileScreen() {
    const router = useRouter();
    const { user, accessToken, isAuthenticated, isLoading, logout } = useAuth();
    const { favorites, isLoading: favoritesLoading } = useFavorites();
    const fadeAnim = useRef(new Animated.Value(0)).current;

    // ─── Modo de visualização (Viajante/Roteirista) ──────────────
    const [viewMode, setViewMode] = useState<ViewMode>('traveler');
    const [creatorStats, setCreatorStats] = useState<CreatorStatsSummary | null>(null);
    const [statsLoaded, setStatsLoaded] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);

    // ─── Detecção de roteirista ───────────────────────────────────
    // Fontes (em ordem de prioridade):
    // 1. user.creatorId vindo do JWT/login (rápido, mas pode estar ausente em backends antigos)
    // 2. roteiros criados pelo usuário consultados em /dashboard/stats (fonte de verdade,
    //    resolvida a partir do travelerId do JWT no backend)
    // A UI considera o usuário roteirista se QUALQUER uma das fontes confirmar.
    const isCreator = !!user?.creatorId || (creatorStats?.totalItineraries ?? 0) > 0;

    // Migration one-shot: chaves globais legacy podem vazar entre usuários.
    const legacyWiped = useRef(false);
    useEffect(() => {
        if (legacyWiped.current) return;
        legacyWiped.current = true;
        AsyncStorage.removeItem(LEGACY_VIEW_MODE_KEY).catch(() => {});
        AsyncStorage.removeItem(LEGACY_PROFILE_PREFS_KEY).catch(() => {});
    }, []);

    // Hidrata modo salvo do bucket DESTE usuário. Se a conta mudar, recarrega.
    useEffect(() => {
        const key = viewModeKeyFor(user?.travelerId);
        if (!key) { setViewMode('traveler'); return; }
        AsyncStorage.getItem(key).then((saved) => {
            if (saved === 'creator' || saved === 'traveler') setViewMode(saved);
            else setViewMode('traveler');
        }).catch(() => { /* ignore */ });
    }, [user?.travelerId]);

    // Se o usuário não é criador, força modo viajante (e zera persistência)
    useEffect(() => {
        if (statsLoaded && !isCreator && viewMode !== 'traveler') {
            setViewMode('traveler');
            const key = viewModeKeyFor(user?.travelerId);
            if (key) AsyncStorage.setItem(key, 'traveler').catch(() => {});
        }
    }, [isCreator, viewMode, statsLoaded, user?.travelerId]);

    // ─── Buscar stats do criador (sempre, para detectar roteirista) ───
    // O backend resolve o creatorId a partir do travelerId do JWT,
    // então funciona mesmo se o login não retornar `creator` (compat).
    const fetchCreatorStats = React.useCallback(async () => {
        if (!accessToken) {
            setCreatorStats(null);
            setStatsLoaded(true);
            return;
        }
        try {
            const res = await fetch(`${API_BASE}/itineraries/dashboard/stats`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (!res.ok) { setCreatorStats(null); setStatsLoaded(true); return; }
            const data = await res.json();
            // Backwards-compat: campos novos vieram a partir do hotfix do
            // dashboard. Faz fallback para os antigos quando ausentes.
            const itineraries = (data.itineraries || []) as CreatorItinerarySummary[];
            const pendingReview = data.pendingReview ?? itineraries.filter(it => it.status === 'pending_review').length;
            const publishedItineraries = data.publishedItineraries ?? itineraries.filter(it => it.status === 'active' || it.status === 'approved').length;
            const draftItineraries = data.draftItineraries ?? itineraries.filter(it => it.status === 'draft').length;
            const rejectedItineraries = data.rejectedItineraries ?? itineraries.filter(it => it.status === 'rejected').length;
            // Qualidade média conta apenas roteiros ativos/aprovados.
            // Fallback (backend antigo): aplica o mesmo filtro localmente.
            const activeForAvg = itineraries.filter(it => it.status === 'active' || it.status === 'approved');
            const avgQuality: number | null = data.averageQualityScore !== undefined
                ? data.averageQualityScore
                : (activeForAvg.length > 0
                    ? Math.round(activeForAvg.reduce((s, it) => s + (it.qualityScore ?? 0), 0) / activeForAvg.length)
                    : null);
            setCreatorStats({
                totalItineraries: data.totalItineraries ?? itineraries.length,
                activeItineraries: data.activeItineraries ?? 0,
                publishedItineraries,
                pendingReview,
                draftItineraries,
                rejectedItineraries,
                totalSales: data.totalSales ?? 0,
                totalRevenue: data.totalRevenue ?? 0,
                averageRating: data.averageRating ?? 0,
                averageQualityScore: avgQuality,
                itineraries,
            });
            setStatsLoaded(true);
            console.log('[profile] creator stats:', {
                travelerId: user?.travelerId,
                totalItineraries: data.totalItineraries,
            });
        } catch {
            setCreatorStats(null);
            setStatsLoaded(true);
        }
    }, [accessToken, user?.travelerId]);

    // Buscar quando accessToken/user mudar (login/logout/troca de conta)
    useEffect(() => {
        setStatsLoaded(false);
        fetchCreatorStats();
    }, [fetchCreatorStats]);

    // Refazer a busca toda vez que a tela ganha foco
    // (volta da criação de roteiro, troca de aba, etc.)
    useFocusEffect(
        React.useCallback(() => {
            fetchCreatorStats();
        }, [fetchCreatorStats])
    );

    const switchMode = async (mode: ViewMode) => {
        haptics.selection();
        setViewMode(mode);
        const key = viewModeKeyFor(user?.travelerId);
        if (key) { try { await AsyncStorage.setItem(key, mode); } catch { /* ignore */ } }
    };

    const [currency, setCurrency] = useState(DEFAULT_PROFILE_PREFERENCES.currency);
    const [language, setLanguage] = useState(DEFAULT_PROFILE_PREFERENCES.language);
    const [appearance, setAppearance] = useState(DEFAULT_PROFILE_PREFERENCES.appearance);
    const [travelType, setTravelType] = useState(DEFAULT_PROFILE_PREFERENCES.travelType);
    const [budget, setBudget] = useState(DEFAULT_PROFILE_PREFERENCES.budget);
    const [selectedInterests, setSelectedInterests] = useState<string[]>(DEFAULT_PROFILE_PREFERENCES.selectedInterests);
    const [preferencesHydrated, setPreferencesHydrated] = useState(false);
    const [purchasedCount, setPurchasedCount] = useState<number | null>(null);
    const [pendingQuestionsCount, setPendingQuestionsCount] = useState<number>(0);
    const [reviewsGivenCount, setReviewsGivenCount] = useState<number>(0);

    // Modal states
    const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
    const [showLanguagePicker, setShowLanguagePicker] = useState(false);
    const [showAppearancePicker, setShowAppearancePicker] = useState(false);
    const [showTravelTypePicker, setShowTravelTypePicker] = useState(false);
    const [showBudgetPicker, setShowBudgetPicker] = useState(false);
    const [showInterestsPicker, setShowInterestsPicker] = useState(false);
    const [showAboutModal, setShowAboutModal] = useState(false);
    const [showHowItWorksModal, setShowHowItWorksModal] = useState(false);

    // Fade in on mount
    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
        }).start();
    }, []);

    useEffect(() => {
        // Sempre reseta antes de hidratar — assim trocar de conta zera as prefs
        // do anterior em vez de "manter" enquanto o GET resolve.
        setPreferencesHydrated(false);
        setCurrency(DEFAULT_PROFILE_PREFERENCES.currency);
        setLanguage(DEFAULT_PROFILE_PREFERENCES.language);
        setAppearance(DEFAULT_PROFILE_PREFERENCES.appearance);
        setTravelType(DEFAULT_PROFILE_PREFERENCES.travelType);
        setBudget(DEFAULT_PROFILE_PREFERENCES.budget);
        setSelectedInterests(DEFAULT_PROFILE_PREFERENCES.selectedInterests);
        const key = prefsKeyFor(user?.travelerId);
        if (!key) { setPreferencesHydrated(true); return; }
        AsyncStorage.getItem(key)
            .then((raw) => {
                if (!raw) return;
                const prefs = JSON.parse(raw);
                if (CURRENCIES.includes(prefs.currency)) setCurrency(prefs.currency);
                if (LANGUAGES.includes(prefs.language)) setLanguage(prefs.language);
                if (APPEARANCES.includes(prefs.appearance)) setAppearance(prefs.appearance);
                if (TRAVEL_TYPES.includes(prefs.travelType)) setTravelType(prefs.travelType);
                if (BUDGET_RANGES.includes(prefs.budget)) setBudget(prefs.budget);
                if (Array.isArray(prefs.selectedInterests)) {
                    const allowed = new Set(INTEREST_OPTIONS.map((item) => item.id));
                    setSelectedInterests(Array.from(new Set(prefs.selectedInterests.filter((id: string) => allowed.has(id)))));
                }
            })
            .catch(() => {})
            .finally(() => setPreferencesHydrated(true));
    }, [user?.travelerId]);

    useEffect(() => {
        if (!preferencesHydrated) return;
        const key = prefsKeyFor(user?.travelerId);
        if (!key) return;
        AsyncStorage.setItem(key, JSON.stringify({
            currency,
            language,
            appearance,
            travelType,
            budget,
            selectedInterests,
        })).catch(() => {});
    }, [appearance, budget, currency, language, preferencesHydrated, selectedInterests, travelType, user?.travelerId]);

    // Reusa o fetch dos contadores do viajante. Roda em login/logout E sempre
    // que a tela ganha foco — assim o "Meus Roteiros" e "Reviews" do header
    // ficam fresh logo depois que o usuário compra/avalia em outra aba.
    const fetchTravelerStats = React.useCallback(() => {
        if (!accessToken || !isAuthenticated) {
            setPurchasedCount(null);
            setReviewsGivenCount(0);
            return;
        }
        getMyTrips(accessToken)
            .then((result) => setPurchasedCount(result.purchasedItineraries.length))
            .catch(() => setPurchasedCount(null));
        getMyReviews(accessToken)
            .then(({ reviews }) => setReviewsGivenCount(Array.isArray(reviews) ? reviews.length : 0))
            .catch(() => setReviewsGivenCount(0));
    }, [accessToken, isAuthenticated]);

    useEffect(() => { fetchTravelerStats(); }, [fetchTravelerStats]);
    useFocusEffect(React.useCallback(() => { fetchTravelerStats(); }, [fetchTravelerStats]));

    // Conta perguntas pendentes nos roteiros do criador (badge da Ação Rápida).
    // Refeita sempre que o accessToken muda; falha silenciosa para 0.
    useEffect(() => {
        if (!accessToken || !isAuthenticated) { setPendingQuestionsCount(0); return; }
        let mounted = true;
        getCreatorQuestions(accessToken)
            .then(({ questions }) => {
                if (!mounted) return;
                setPendingQuestionsCount(questions.filter(q => q.status === 'pending').length);
            })
            .catch(() => { if (mounted) setPendingQuestionsCount(0); });
        return () => { mounted = false; };
    }, [accessToken, isAuthenticated]);

    // Debug: logar usuário atual
    useEffect(() => {
        console.log('[profile] isAuthenticated:', isAuthenticated, '| userId:', user?.travelerId, '| email:', user?.email);
    }, [isAuthenticated, user]);

    const openExternalUrl = async (url: string, fallbackMessage = 'Não foi possível abrir este link agora.') => {
        await openSafeExternalUrl(url, { fallbackMessage });
    };

    const handleOpenSettings = async () => {
        haptics.light();
        try {
            await Linking.openSettings();
        } catch {
            Alert.alert('Settings', 'We could not open your device settings right now.');
        }
    };

    const handleRateApp = () => {
        haptics.success();
        const storeUrl = Platform.OS === 'ios'
            ? 'https://apps.apple.com/app/id1234567890'
            : 'https://play.google.com/store/apps/details?id=com.vamo';
        openExternalUrl(storeUrl, 'The app store is not available right now.');
    };

    const handleShareApp = async () => {
        haptics.light();
        try {
            await Share.share({
                title: 'VAMO',
                message: 'Meet VAMO: a marketplace for digital travel itineraries created by experienced travellers. https://vamo.app',
            });
        } catch {
            Alert.alert('Share', 'We could not open sharing right now.');
        }
    };

    /**
     * IMPORTANTE — bug histórico: a versão anterior usava `Alert.alert(...)`
     * que é NO-OP no Expo Web. Como o app roda majoritariamente no navegador
     * em dev/preview, o usuário tocava "Sign out" e nada acontecia: o Alert
     * não abria, `logout()` nunca disparava, sessão permanecia.
     * Fix: usar o helper `confirm()` do projeto, que delega pra Alert.alert
     * no nativo e pra window.confirm no web.
     */
    const handleLogout = async () => {
        if (loggingOut) return; // evita duplo clique
        haptics.warning();
        const ok = await confirm({
            title: 'Sair da conta?',
            message: 'Você precisará entrar novamente para acessar seus roteiros e compras.',
            confirmText: 'Sair',
            cancelText: 'Cancelar',
            destructive: true,
        });
        if (!ok) return;

        setLoggingOut(true);
        try {
            haptics.success();
            await logout();
            // Navega pra tela de login (auth) — fora do grupo (tabs).
            // `replace` evita que o usuário volte com gesto "back".
            router.replace('/login');
        } catch (e: any) {
            console.error('[profile] logout failed', e);
            haptics.error();
            notify({
                title: 'Não foi possível sair',
                message: e?.message || 'Tente novamente em instantes.',
            });
        } finally {
            setLoggingOut(false);
        }
    };

    const handleStatPress = (type: 'itineraries' | 'saved') => {
        haptics.light();
        router.push(type === 'itineraries' ? '/(tabs)/my-trips' : '/(tabs)/saved');
    };

    const toggleInterest = (id: string) => {
        setSelectedInterests(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    // Passaporte VAMO — progresso lúdico do viajante a partir de sinais reais.
    const profileCompleted = !!(user?.name && user?.email && user?.avatar);
    const savedCount = favorites.length;
    const travelerProgress = calculateTravelerProgress({
        profileCompleted,
        savedCount,
        // Reviews vem de getMyReviews (carregado em fetchTravelerStats).
        reviewsCount: reviewsGivenCount,
        purchasesCount: purchasedCount ?? 0,
        // FIXME: idealmente seria countDistinct(country) dos favoritos.
        // Por ora reusamos o savedCount — viaja junto com o contador da UI
        // pra evitar mais 1 fetch só pra missão de "5 destinos".
        destinationsCount: savedCount,
    });

    // Não logado: mostrar tela de login prompt
    if (!isLoading && !isAuthenticated) {
        return (
            <View style={[styles.container, { alignItems: 'center', justifyContent: 'center', padding: 32 }]}>
                <Icon name="circle-user" size={64} color={theme.colors.primary} />
                <Text style={{ fontSize: 22, fontWeight: '800', color: theme.colors.text.primary, marginTop: 20, marginBottom: 8, textAlign: 'center' }}>
                    Welcome to VAMO
                </Text>
                <Text style={{ fontSize: 15, color: theme.colors.text.secondary, textAlign: 'center', lineHeight: 22, marginBottom: 32 }}>
                    Sign in to access your profile, saved itineraries, cart and trips.
                </Text>
                <TouchableOpacity
                    style={{ backgroundColor: theme.colors.primary, borderRadius: 14, paddingHorizontal: 32, paddingVertical: 14, marginBottom: 12 }}
                    onPress={() => router.push('/login')}
                >
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>Sign in</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push('/register')}>
                    <Text style={{ fontSize: 14, color: theme.colors.primary, fontWeight: '600' }}>Create a free account →</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Animated.ScrollView
                showsVerticalScrollIndicator={false}
                style={{ opacity: fadeAnim }}
            >
                {/* ══════════ 1. GRADIENT HEADER ══════════ */}
                <LinearGradient
                    colors={theme.colors.gradients.institutional as unknown as [string, string]}
                    style={styles.header}
                >
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatarCircle}>
                            <Icon name="circle-user" size={40} color="#FFFFFF" />
                        </View>
                        <TouchableOpacity style={styles.editAvatarButton} onPress={() => {
                            haptics.light();
                            Alert.alert('📸 Foto de perfil', 'A personalização da foto de perfil estará disponível em breve!');
                        }}>
                            <Icon name="edit" size={12} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.userName}>{user?.name || 'Usuário'}</Text>
                    <Text style={styles.userEmail}>{user?.email || ''}</Text>
                    <View style={styles.sinceBadge}>
                        <Icon name="calendar" size={12} color="rgba(255,255,255,0.8)" />
                        <Text style={styles.sinceText}>Conta VAMO</Text>
                    </View>

                </LinearGradient>

                {/* ══════════ MODE SWITCHER (Viajante/Roteirista) ══════════ */}
                {/*
                 * Segmented control limpo. NÃO confundir com atalhos:
                 * este bloco só alterna o modo; o conteúdo abaixo muda
                 * conforme o modo selecionado.
                 */}
                {isCreator && (
                    <View style={modeStyles.wrap}>
                        <Text style={modeStyles.label}>You are using VAMO as</Text>
                        <View style={modeStyles.segmented}>
                            <TouchableOpacity
                                style={[modeStyles.seg, viewMode === 'traveler' && modeStyles.segActive]}
                                onPress={() => switchMode('traveler')}
                                activeOpacity={0.85}
                                accessibilityRole="button"
                                accessibilityState={{ selected: viewMode === 'traveler' }}
                            >
                                <Icon name="book-open" size={16} color={viewMode === 'traveler' ? '#fff' : theme.colors.text.secondary} />
                                <Text style={[modeStyles.segText, viewMode === 'traveler' && modeStyles.segTextActive]}>
                                    Traveller
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[modeStyles.seg, viewMode === 'creator' && modeStyles.segActive]}
                                onPress={() => switchMode('creator')}
                                activeOpacity={0.85}
                                accessibilityRole="button"
                                accessibilityState={{ selected: viewMode === 'creator' }}
                            >
                                <Icon name="edit" size={16} color={viewMode === 'creator' ? '#fff' : theme.colors.text.secondary} />
                                <Text style={[modeStyles.segText, viewMode === 'creator' && modeStyles.segTextActive]}>
                                    Creator
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* ══════════ 2. QUICK STATS (Viajante) / DASHBOARD (Roteirista) ══════════ */}
                {viewMode === 'creator' && isCreator ? (
                    <CreatorDashboard
                        stats={creatorStats}
                        userName={user?.name?.split(' ')[0]}
                        onCreate={() => { haptics.medium(); router.push('/new-itinerary'); }}
                        onSeeAll={() => { haptics.light(); router.push('/created-itineraries'); }}
                        onOpenItinerary={(id) => { haptics.light(); router.push(`/(tabs)/itinerary/${id}`); }}
                        onSales={() => { haptics.light(); router.push('/creator-earnings'); }}
                        onReviews={() => { haptics.light(); router.push('/my-reviews'); }}
                        onQuestions={() => { haptics.light(); router.push('/creator-questions'); }}
                        pendingQuestionsCount={pendingQuestionsCount}
                    />
                ) : (
                    /* Quick stats do viajante (modo padrão) */
                    <View style={styles.statsRow}>
                        <TouchableOpacity style={styles.statCard} onPress={() => handleStatPress('itineraries')}>
                            <Icon name="book-open" size={22} color={theme.colors.primary} />
                            <Text style={styles.statValue}>{purchasedCount === null ? '—' : purchasedCount}</Text>
                            <Text style={styles.statLabel}>Meus Roteiros</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.statCard} onPress={() => handleStatPress('saved')}>
                            <Icon name="heart" size={22} color={theme.colors.primary} />
                            <Text style={styles.statValue}>{favoritesLoading ? '—' : favorites.length}</Text>
                            <Text style={styles.statLabel}>Salvos</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* ══════════ 3. PASSAPORTE VAMO ══════════ */}
                <View style={styles.sectionSpaced}>
                    <View style={styles.sectionTitleRow}>
                        <Icon name="globe" size={16} color={theme.colors.primary} />
                        <Text style={styles.sectionTitle}>Passaporte VAMO</Text>
                        <Text style={styles.journeyProgress}>{travelerProgress.completedMissions}/{travelerProgress.missions.length}</Text>
                    </View>
                    <Text style={styles.passportSubtitle}>
                        Complete missões, ganhe carimbos e evolua sua jornada como viajante.
                    </Text>
                    <View style={styles.sectionCard}>
                        {/* Nível atual */}
                        <View style={styles.passportLevelRow}>
                            <View style={[styles.passportLevelIcon, { backgroundColor: travelerProgress.levelConfig.bgColor }]}>
                                <Text style={{ fontSize: 26 }}>{travelerProgress.levelConfig.icon}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.passportLevelLabel}>{travelerProgress.levelConfig.label}</Text>
                                <Text style={styles.passportLevelDesc} numberOfLines={2}>
                                    {travelerProgress.levelConfig.description}
                                </Text>
                            </View>
                        </View>

                        {/* Progresso até o próximo nível */}
                        <View style={styles.progressBarContainer}>
                            <View style={[styles.progressBarFill, { width: `${Math.round(travelerProgress.progressPct * 100)}%` }]} />
                        </View>
                        <Text style={styles.passportNextText}>
                            {travelerProgress.nextLevelConfig
                                ? `Próximo carimbo: ${travelerProgress.nextLevelConfig.label} · ${travelerProgress.xp}/${travelerProgress.nextLevelConfig.minXp} XP`
                                : `Nível máximo alcançado · ${travelerProgress.xp} XP`}
                        </Text>

                        {/* Carimbos / missões */}
                        <View style={styles.stampsDivider} />
                        {travelerProgress.missions.map((mission, idx) => (
                            <View
                                key={mission.key}
                                style={[
                                    styles.milestoneRow,
                                    idx === travelerProgress.missions.length - 1 && styles.milestoneRowLast,
                                ]}
                            >
                                {mission.completed ? (
                                    <View style={styles.stampDone}>
                                        <Icon name="verified" size={15} color="#fff" />
                                    </View>
                                ) : (
                                    <View style={styles.stampPending}>
                                        <Icon name="lock" size={13} color={theme.colors.text.tertiary} />
                                    </View>
                                )}
                                <View style={{ flex: 1 }}>
                                    <Text style={[
                                        styles.milestoneLabel,
                                        !mission.completed && styles.milestoneLabelLocked,
                                    ]}>
                                        {mission.label}
                                    </Text>
                                    {!!mission.hint && !mission.completed && (
                                        <Text style={styles.missionHint}>{mission.hint}</Text>
                                    )}
                                </View>
                                <Text style={[styles.missionXp, mission.completed && styles.missionXpDone]}>
                                    +{mission.xp}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* ══════════ SHORTCUTS ══════════ */}
                <View style={styles.shortcutsRow}>
                    <TouchableOpacity
                        style={styles.shortcutButton}
                        onPress={() => router.push('/(tabs)/my-trips')}
                    >
                        <Icon name="book-open" size={18} color={theme.colors.primary} />
                        <Text style={styles.shortcutText} numberOfLines={1} adjustsFontSizeToFit>Meus Roteiros</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.shortcutButton}
                        onPress={() => router.push('/(tabs)/saved')}
                    >
                        <Icon name="heart" size={18} color={theme.colors.primary} />
                        <Text style={styles.shortcutText} numberOfLines={1} adjustsFontSizeToFit>Favoritos</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.shortcutButton}
                        onPress={() => { haptics.light(); router.push('/created-itineraries'); }}
                    >
                        <Icon name="edit" size={18} color={theme.colors.primary} />
                        <Text style={styles.shortcutText} numberOfLines={1} adjustsFontSizeToFit>Roteiros Criados</Text>
                    </TouchableOpacity>
                </View>
                <View style={[styles.shortcutsRow, { marginTop: 8 }]}>
                    <TouchableOpacity
                        style={styles.shortcutButton}
                        onPress={() => { haptics.light(); router.push('/my-reviews'); }}
                    >
                        <Icon name="star" size={18} color={theme.colors.primary} />
                        <Text style={styles.shortcutText} numberOfLines={1} adjustsFontSizeToFit>Avaliações</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.shortcutButton}
                        onPress={() => { haptics.light(); router.push('/my-questions'); }}
                    >
                        <Icon name="message-circle" size={18} color={theme.colors.primary} />
                        <Text style={styles.shortcutText} numberOfLines={1} adjustsFontSizeToFit>Perguntas</Text>
                    </TouchableOpacity>
                </View>

                {/* ══════════ 4. CONTA ══════════ */}
                <View style={styles.sectionSpaced}>
                    <Text style={styles.sectionTitle}>Conta</Text>
                    <View style={styles.sectionCard}>
                        <SettingItem icon="circle-user" title="Dados pessoais" onPress={() => {
                            haptics.light();
                            Alert.alert('Dados Pessoais', `Nome: ${user?.name || '—'}\nEmail: ${user?.email || '—'}\n\nA edição de dados pessoais estará disponível em breve.`, [{ text: 'OK' }]);
                        }} />
                        <SettingItem icon="bell" title="Notificações" onPress={() => {
                            handleOpenSettings();
                        }} />
                        <SettingItem icon="shield-check" title="Segurança" onPress={() => {
                            haptics.light();
                            Alert.alert('Segurança', 'Alteração de senha e autenticação em dois fatores estarão disponíveis em breve.', [{ text: 'OK' }]);
                        }} />
                        <SettingItem icon="card" title="Métodos de pagamento" onPress={() => {
                            haptics.light();
                            Alert.alert('Pagamento', 'Gerenciamento de métodos de pagamento estará disponível em breve.', [{ text: 'OK' }]);
                        }} isLast />
                    </View>
                </View>

                {/* ══════════ ÁREA DO CRIADOR ══════════ */}
                {!isCreator ? (
                    /* ── Não é criador ainda: banner de convite ── */
                    <View style={styles.sectionSpaced}>
                        <LinearGradient
                            colors={['#1A3263', '#28C9BF']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.creatorBanner}
                        >
                            <View style={styles.creatorBannerLeft}>
                                <Text style={styles.creatorBannerEmoji}>🚀</Text>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.creatorBannerTitle}>Become a Creator</Text>
                                    <Text style={styles.creatorBannerSub}>
                                        Create itineraries, share your expertise and earn from your travel knowledge.
                                    </Text>
                                </View>
                            </View>
                            <TouchableOpacity
                                style={styles.creatorBannerCta}
                                onPress={() => { haptics.medium(); router.push('/become-creator'); }}
                                activeOpacity={0.85}
                            >
                                <Text style={styles.creatorBannerCtaText}>Saiba mais</Text>
                                <Ionicons name="arrow-forward" size={14} color={theme.colors.primary} />
                            </TouchableOpacity>
                        </LinearGradient>
                    </View>
                ) : (
                    /* ── É criador: menu completo ── */
                    <View style={styles.sectionSpaced}>
                        <View style={styles.sectionTitleRow}>
                            <Icon name="edit" size={16} color={theme.colors.primary} />
                            <Text style={styles.sectionTitle}>Creator Tools</Text>
                            <View style={styles.creatorBadge}>
                                <Text style={styles.creatorBadgeText}>✓ Creator</Text>
                            </View>
                        </View>
                        <View style={styles.sectionCard}>
                            <SettingItem
                                icon="edit"
                                title="Create a new itinerary"
                                onPress={() => { haptics.light(); router.push('/new-itinerary'); }}
                            />
                            <SettingItem
                                icon="book-open"
                                title="My created itineraries"
                                onPress={() => { haptics.light(); router.push('/created-itineraries'); }}
                            />
                            <SettingItem
                                icon="message-circle"
                                title="Received questions"
                                onPress={() => { haptics.light(); router.push('/creator-questions'); }}
                            />
                            <SettingItem
                                icon="wallet"
                                title="Earnings"
                                value="Track sales and payouts"
                                onPress={() => { haptics.light(); router.push('/creator-earnings'); }}
                            />
                            <SettingItem
                                icon="briefcase"
                                title="Creator dashboard"
                                onPress={() => { haptics.light(); router.push('/created-itineraries'); }}
                                isLast
                            />
                        </View>
                    </View>
                )}

                {/* ══════════ 5. PREFERÊNCIAS ══════════ */}
                <View style={styles.sectionSpaced}>
                    <Text style={styles.sectionTitle}>Preferências</Text>
                    <View style={styles.sectionCard}>
                        <SettingItem icon="wallet" title="Moeda" value={currency} onPress={() => {
                            haptics.selection(); setShowCurrencyPicker(true);
                        }} />
                        <SettingItem icon="globe" title="Idioma" value={language} onPress={() => {
                            haptics.selection(); setShowLanguagePicker(true);
                        }} />
                        <SettingItem icon="palette" title="Aparência" value={appearance} onPress={() => {
                            haptics.selection(); setShowAppearancePicker(true);
                        }} />
                        <SettingItem icon="plane" title="Tipo de viagem preferido" value={travelType} onPress={() => {
                            haptics.selection(); setShowTravelTypePicker(true);
                        }} />
                        <SettingItem icon="wallet" title="Orçamento médio" value={budget} onPress={() => {
                            haptics.selection(); setShowBudgetPicker(true);
                        }} />
                        <SettingItem icon="star" title="Interesses" value={`${selectedInterests.length} selecionados`} onPress={() => {
                            haptics.selection(); setShowInterestsPicker(true);
                        }} isLast />
                    </View>
                </View>

                {/* ══════════ 6. ABOUT ══════════ */}
                <View style={styles.sectionSpaced}>
                    <Text style={styles.sectionTitle}>About</Text>
                    <View style={styles.sectionCard}>
                        <SettingItem icon="help" title="How it works" onPress={() => {
                            haptics.light(); setShowHowItWorksModal(true);
                        }} />
                        <SettingItem icon="info" title="About VAMO" onPress={() => {
                            haptics.light(); setShowAboutModal(true);
                        }} />
                        <SettingItem icon="message-circle" title="Help Centre" onPress={() => {
                            haptics.light(); openExternalUrl('https://vamo.app/help', 'The Help Centre is not available right now.');
                        }} />
                        <SettingItem icon="phone" title="Contact support" iconColor={theme.colors.primary} onPress={() => {
                            haptics.light(); openExternalUrl('https://vamo.app/support', 'Support is not available right now.');
                        }} />
                        <SettingItem icon="clipboard-list" title="My requests" onPress={() => {
                            haptics.light();
                            Alert.alert('Requests', 'You do not have any open requests right now.', [{ text: 'OK' }]);
                        }} isLast />
                    </View>
                </View>

                {/* ══════════ RATING ══════════ */}
                <View style={styles.sectionSpaced}>
                    <Text style={styles.sectionTitle}>Rating</Text>
                    <View style={styles.sectionCard}>
                        <SettingItem icon="star" title="Rate the app" onPress={handleRateApp} />
                        <SettingItem icon="share" title="Share with friends" onPress={handleShareApp} isLast />
                    </View>
                </View>

                {/* ══════════ 7. LEGAL ══════════ */}
                <View style={styles.sectionSpaced}>
                    <Text style={styles.sectionTitle}>Legal</Text>
                    <View style={styles.sectionCard}>
                        <SettingItem icon="file" title="Terms of Use" onPress={() => {
                            haptics.light(); openExternalUrl('https://vamo.app/terms', 'The Terms of Use are not available right now.');
                        }} />
                        <SettingItem icon="shield-check" title="Privacy Policy" onPress={() => {
                            haptics.light(); openExternalUrl('https://vamo.app/privacy', 'The Privacy Policy is not available right now.');
                        }} />
                        <SettingItem icon="trash" title="Delete my account" titleColor={theme.colors.error} onPress={() => {
                            haptics.warning();
                            Alert.alert('Delete account', 'This action is permanent. All your data will be deleted.', [
                                { text: 'Cancel', style: 'cancel' },
                                { text: 'Delete', style: 'destructive', onPress: () => Alert.alert('Request sent', 'Your account deletion request has been received.') },
                            ]);
                        }} isLast />
                    </View>
                </View>

                {/* ══════════ SAIR DA CONTA (less prominent than Delete) ══════════ */}
                <TouchableOpacity
                    style={[styles.logoutButton, loggingOut && { opacity: 0.55 }]}
                    onPress={() => { void handleLogout(); }}
                    disabled={loggingOut}
                    accessibilityLabel="Sair da conta"
                >
                    <Icon name="logout" size={18} color={theme.colors.text.tertiary} />
                    <Text style={styles.logoutText}>
                        {loggingOut ? 'Saindo…' : 'Sair da conta'}
                    </Text>
                </TouchableOpacity>

                {/* Version */}
                <Text style={styles.versionText}>VAMO v1.0.0</Text>

                <View style={{ height: 40 }} />
            </Animated.ScrollView>

            {/* ══════════ MODALS ══════════ */}
            <PickerModal visible={showCurrencyPicker} title="Select currency" options={CURRENCIES} selected={currency}
                onSelect={(v) => { setCurrency(v); haptics.success(); }} onClose={() => setShowCurrencyPicker(false)} />
            <PickerModal visible={showLanguagePicker} title="Select language" options={LANGUAGES} selected={language}
                onSelect={(v) => { setLanguage(v); haptics.success(); }} onClose={() => setShowLanguagePicker(false)} />
            <PickerModal visible={showAppearancePicker} title="Select theme" options={APPEARANCES} selected={appearance}
                onSelect={(v) => { setAppearance(v); haptics.success(); }} onClose={() => setShowAppearancePicker(false)} />
            <PickerModal visible={showTravelTypePicker} title="Trip style" options={TRAVEL_TYPES} selected={travelType}
                onSelect={(v) => { setTravelType(v); haptics.success(); }} onClose={() => setShowTravelTypePicker(false)} />
            <PickerModal visible={showBudgetPicker} title="Average budget" options={BUDGET_RANGES} selected={budget}
                onSelect={(v) => { setBudget(v); haptics.success(); }} onClose={() => setShowBudgetPicker(false)} />

            {/* Interests Multi-Select Modal */}
            <Modal visible={showInterestsPicker} animationType="slide" transparent>
                <View style={modalStyles.overlay}>
                    <View style={modalStyles.container}>
                        <View style={modalStyles.handle} />
                        <View style={modalStyles.header}>
                            <Text style={modalStyles.title}>Your Interests</Text>
                            <TouchableOpacity onPress={() => setShowInterestsPicker(false)} style={modalStyles.closeButton}>
                                <Icon name="close" size={20} color={theme.colors.text.secondary} />
                            </TouchableOpacity>
                        </View>
                        <Text style={modalStyles.interestsSubtitle}>
                            Select your interests for personalised recommendations
                        </Text>
                        <View style={modalStyles.interestsGrid}>
                            {INTEREST_OPTIONS.map((interest) => {
                                const isActive = selectedInterests.includes(interest.id);
                                return (
                                    <TouchableOpacity
                                        key={interest.id}
                                        style={[modalStyles.interestChip, isActive && modalStyles.interestChipActive]}
                                        onPress={() => { toggleInterest(interest.id); haptics.selection(); }}
                                    >
                                        <Icon name={interest.icon} size={20} color={isActive ? theme.colors.primary : theme.colors.text.secondary} />
                                        <Text style={[modalStyles.interestLabel, isActive && modalStyles.interestLabelActive]}>
                                            {interest.label}
                                        </Text>
                                        {isActive && <Icon name="verified" size={16} color={theme.colors.primary} />}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                        <TouchableOpacity
                            style={modalStyles.doneButton}
                            onPress={() => { setShowInterestsPicker(false); haptics.success(); }}
                        >
                            <Text style={modalStyles.doneButtonText}>Save ({selectedInterests.length})</Text>
                        </TouchableOpacity>
                        <View style={{ height: 16 }} />
                    </View>
                </View>
            </Modal>

            <InfoModal visible={showAboutModal} title="About VAMO"
                content={`VAMO — Your marketplace for digital travel itineraries\n\nVersion 1.0.0\n\nDiscover detailed itineraries created by experienced travellers. Plan your trip with people who have been there.\n\n© 2026 VAMO. All rights reserved.`}
                onClose={() => setShowAboutModal(false)} />
            <InfoModal visible={showHowItWorksModal} title="How it works"
                content={`1. Explore\nBrowse itineraries created by experienced travellers.\n\n2. Choose\nSelect the right itinerary and review the details.\n\n3. Buy\nComplete your purchase securely.\n\n4. Travel\nAccess the itinerary and enjoy your trip.`}
                onClose={() => setShowHowItWorksModal(false)} />
        </View>
    );
}

// ── Setting Item ────────────────────────────────────────
function SettingItem({
    icon, title, value, onPress, isLast = false, titleColor, iconColor,
}: {
    icon: string; title: string; value?: string; onPress?: () => void;
    isLast?: boolean; titleColor?: string; iconColor?: string;
}) {
    return (
        <TouchableOpacity
            style={[styles.settingItem, isLast && styles.settingItemLast]}
            onPress={onPress}
            activeOpacity={0.6}
        >
            <View style={styles.settingLeft}>
                <Icon
                    name={icon as IconName}
                    size={20}
                    color={iconColor || titleColor || theme.colors.text.secondary}
                />
                <Text style={[styles.settingTitle, titleColor && { color: titleColor }]}>{title}</Text>
            </View>
            <View style={styles.settingRight}>
                {value && <Text style={styles.settingValue} numberOfLines={1}>{value}</Text>}
                <Icon name="chevron-right" size={18} color={theme.colors.text.tertiary} />
            </View>
        </TouchableOpacity>
    );
}

// ── Picker Modal ────────────────────────────────────────
function PickerModal({
    visible, title, options, selected, onSelect, onClose,
}: {
    visible: boolean; title: string; options: string[];
    selected: string; onSelect: (value: string) => void; onClose: () => void;
}) {
    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={modalStyles.overlay}>
                <View style={modalStyles.container}>
                    <View style={modalStyles.handle} />
                    <View style={modalStyles.header}>
                        <Text style={modalStyles.title}>{title}</Text>
                        <TouchableOpacity onPress={onClose} style={modalStyles.closeButton}>
                            <Icon name="close" size={20} color={theme.colors.text.secondary} />
                        </TouchableOpacity>
                    </View>
                    {options.map((option) => (
                        <TouchableOpacity
                            key={option}
                            style={[modalStyles.option, selected === option && modalStyles.optionSelected]}
                            onPress={() => { onSelect(option); onClose(); }}
                        >
                            <Text style={[modalStyles.optionText, selected === option && modalStyles.optionTextSelected]}>
                                {option}
                            </Text>
                            {selected === option && <Icon name="verified" size={22} color={theme.colors.primary} />}
                        </TouchableOpacity>
                    ))}
                    <View style={{ height: 20 }} />
                </View>
            </View>
        </Modal>
    );
}

// ── Info Modal ──────────────────────────────────────────
function InfoModal({
    visible, title, content, onClose,
}: {
    visible: boolean; title: string; content: string; onClose: () => void;
}) {
    return (
        <Modal visible={visible} animationType="fade" transparent>
            <View style={modalStyles.overlay}>
                <View style={modalStyles.container}>
                    <View style={modalStyles.handle} />
                    <View style={modalStyles.header}>
                        <Text style={modalStyles.title}>{title}</Text>
                        <TouchableOpacity onPress={onClose} style={modalStyles.closeButton}>
                            <Icon name="close" size={20} color={theme.colors.text.secondary} />
                        </TouchableOpacity>
                    </View>
                    <Text style={modalStyles.infoContent}>{content}</Text>
                    <TouchableOpacity style={modalStyles.doneButton} onPress={onClose}>
                        <Text style={modalStyles.doneButtonText}>Entendi</Text>
                    </TouchableOpacity>
                    <View style={{ height: 16 }} />
                </View>
            </View>
        </Modal>
    );
}

// ── Modal Styles ────────────────────────────────────────
const modalStyles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: theme.colors.background,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: 34,
    },
    handle: {
        width: 40, height: 4,
        backgroundColor: theme.colors.border,
        borderRadius: 2, alignSelf: 'center',
        marginTop: 12, marginBottom: 8,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20, paddingVertical: 14,
        borderBottomWidth: 1, borderBottomColor: theme.colors.borderLight,
    },
    title: {
        fontSize: 18, fontWeight: '700',
        color: theme.colors.text.primary,
    },
    closeButton: {
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: theme.colors.surface,
        alignItems: 'center', justifyContent: 'center',
    },
    option: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', paddingVertical: 16, paddingHorizontal: 20,
        borderBottomWidth: 1, borderBottomColor: theme.colors.borderLight,
    },
    optionSelected: {
        backgroundColor: theme.colors.primary + '0D',
    },
    optionText: {
        fontSize: 16, color: theme.colors.text.primary,
    },
    optionTextSelected: {
        color: theme.colors.primary, fontWeight: '600',
    },
    infoContent: {
        paddingHorizontal: 20, paddingVertical: 16,
        fontSize: 15, color: theme.colors.text.secondary, lineHeight: 24,
    },
    doneButton: {
        marginHorizontal: 20, backgroundColor: theme.colors.primary,
        paddingVertical: 14, borderRadius: 14, alignItems: 'center',
    },
    doneButtonText: {
        color: '#FFFFFF', fontSize: 16, fontWeight: '700',
    },
    // Interests modal
    interestsSubtitle: {
        fontSize: 13, color: theme.colors.text.secondary,
        paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4,
    },
    interestsGrid: {
        flexDirection: 'row', flexWrap: 'wrap',
        gap: 10, paddingHorizontal: 20, paddingVertical: 12,
    },
    interestChip: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 14, paddingVertical: 10,
        borderRadius: 24, backgroundColor: theme.colors.surface,
        borderWidth: 1.5, borderColor: theme.colors.border,
    },
    interestChipActive: {
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.primary + '0D',
    },
    interestEmoji: { fontSize: 18 },
    interestLabel: {
        fontSize: 14, fontWeight: '500', color: theme.colors.text.primary,
    },
    interestLabelActive: {
        color: theme.colors.primary, fontWeight: '600',
    },
});

// ── Main Styles ─────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.surface,
    },

    // Header
    header: {
        paddingTop: 60, paddingBottom: 28,
        alignItems: 'center',
        borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
    },
    avatarContainer: { position: 'relative', marginBottom: 12 },
    avatarCircle: {
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.25)',
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)',
    },
    avatarEmoji: { fontSize: 40 },
    editAvatarButton: {
        position: 'absolute', bottom: 0, right: -4,
        width: 26, height: 26, borderRadius: 13,
        backgroundColor: theme.colors.primary,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 2, borderColor: '#FFF',
    },
    userName: {
        fontSize: 22, fontWeight: '700', color: '#FFFFFF', marginBottom: 4,
    },
    userEmail: {
        fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 10,
    },
    sinceBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    },
    sinceText: {
        fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: '600',
    },
    identityLine: {
        fontSize: 13, color: 'rgba(255,255,255,0.7)',
        marginTop: 10, textAlign: 'center',
    },

    // Stats — sem margin negativo. O efeito "floating cards sobre o
    // gradiente" foi removido porque colidia com o seletor Viajante/
    // Roteirista, criando ilusão visual de que os stat cards estavam
    // dentro do seletor. Agora os stats ficam claramente abaixo do
    // seletor, com respiro adequado.
    statsRow: {
        flexDirection: 'row', marginTop: 16, marginHorizontal: 20, gap: 10,
    },
    statCard: {
        flex: 1, backgroundColor: theme.colors.background,
        borderRadius: 16, paddingVertical: 16, alignItems: 'center',
        borderWidth: 1, borderColor: theme.colors.borderLight,
    },
    statIcon: { fontSize: 24, marginBottom: 6 },
    statValue: { fontSize: 22, fontWeight: '800', color: theme.colors.text.primary },
    statLabel: { fontSize: 12, color: theme.colors.text.secondary, marginTop: 2 },

    // Next Trip
    nextTripContent: {
        flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12,
    },
    nextTripLeft: { flex: 1 },
    nextTripDestination: {
        fontSize: 17, fontWeight: '700', color: theme.colors.text.primary, marginBottom: 4,
    },
    nextTripDate: { fontSize: 13, color: theme.colors.text.secondary },
    nextTripStatusBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: theme.colors.success + '15',
        paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12,
    },
    statusDot: {
        width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.success,
    },
    nextTripStatus: {
        fontSize: 12, fontWeight: '600', color: theme.colors.success,
    },
    nextTripEmpty: {
        alignItems: 'center', padding: 24, gap: 8,
    },
    nextTripEmptyText: {
        fontSize: 14, color: theme.colors.text.secondary, textAlign: 'center',
    },
    nextTripExploreCta: {
        marginTop: 4,
    },
    nextTripExploreText: {
        fontSize: 14, fontWeight: '600', color: theme.colors.primary,
    },

    // Journey / Milestones
    sectionTitleRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 4, marginBottom: 10,
    },
    journeyProgress: {
        fontSize: 13, fontWeight: '700', color: theme.colors.primary,
    },
    progressBarContainer: {
        height: 4, backgroundColor: theme.colors.borderLight,
        borderRadius: 2, marginHorizontal: 16, marginTop: 14, marginBottom: 8,
    },
    progressBarFill: {
        height: 4, backgroundColor: theme.colors.primary, borderRadius: 2,
    },
    milestoneRow: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingVertical: 12, paddingHorizontal: 16,
        borderBottomWidth: 1, borderBottomColor: theme.colors.borderLight,
    },
    milestoneRowLast: { borderBottomWidth: 0 },
    milestoneLabel: {
        fontSize: 14, fontWeight: '500', color: theme.colors.text.primary,
    },
    milestoneLabelLocked: {
        color: theme.colors.text.tertiary,
    },
    // ── Passaporte VAMO ──────────────────────────────
    passportSubtitle: {
        fontSize: 13,
        color: theme.colors.text.secondary,
        marginTop: -4,
        marginBottom: 12,
        lineHeight: 18,
    },
    passportLevelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 12,
        paddingTop: 12,
    },
    passportLevelIcon: {
        width: 52,
        height: 52,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    passportLevelLabel: {
        fontSize: 16,
        fontWeight: '800',
        color: theme.colors.text.primary,
        letterSpacing: -0.3,
    },
    passportLevelDesc: {
        fontSize: 12.5,
        color: theme.colors.text.secondary,
        marginTop: 2,
        lineHeight: 17,
    },
    passportNextText: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.primary,
        marginHorizontal: 12,
        marginTop: -4,
        marginBottom: 4,
    },
    stampsDivider: {
        height: 1,
        backgroundColor: theme.colors.borderLight,
        marginHorizontal: 12,
        marginTop: 8,
    },
    stampDone: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: theme.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stampPending: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: theme.colors.surfaceLight,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    missionHint: {
        fontSize: 11.5,
        color: theme.colors.text.tertiary,
        marginTop: 2,
    },
    missionXp: {
        fontSize: 12,
        fontWeight: '800',
        color: theme.colors.text.tertiary,
    },
    missionXpDone: {
        color: theme.colors.primary,
    },

    // Shortcuts
    shortcutsRow: {
        flexDirection: 'row', marginHorizontal: 20, marginTop: 20, gap: 10,
    },
    shortcutButton: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, backgroundColor: theme.colors.background,
        paddingVertical: 14, borderRadius: 14,
        borderWidth: 1.5, borderColor: theme.colors.primary + '40',
    },
    shortcutText: {
        fontSize: 12, fontWeight: '600', color: theme.colors.primary,
        flexShrink: 1,
    },

    // Sections
    sectionSpaced: {
        marginTop: 28, paddingHorizontal: 20,
    },
    sectionTitle: {
        fontSize: 14, fontWeight: '700', color: theme.colors.text.tertiary,
        textTransform: 'uppercase', letterSpacing: 0.5,
        marginBottom: 10, marginLeft: 4,
    },
    sectionCard: {
        backgroundColor: theme.colors.background,
        borderRadius: 16, overflow: 'hidden',
        ...theme.shadows.small,
    },

    // Setting Items
    settingItem: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16,
        borderBottomWidth: 1, borderBottomColor: theme.colors.borderLight,
    },
    settingItemLast: { borderBottomWidth: 0 },
    settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    settingIconStyle: { width: 24 },
    settingTitle: {
        fontSize: 15, fontWeight: '500', color: theme.colors.text.primary,
    },
    settingRight: {
        flexDirection: 'row', alignItems: 'center', gap: 6, maxWidth: 160,
    },
    settingValue: {
        fontSize: 14, color: theme.colors.text.tertiary,
    },

    // Minha Loja
    storeItem: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', padding: 16,
    },
    storeLeft: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
    },
    storeIconCircle: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: theme.colors.primary + '12',
        alignItems: 'center', justifyContent: 'center',
    },
    storeTitle: {
        fontSize: 15, fontWeight: '600', color: theme.colors.text.primary,
    },
    storeSubtitle: {
        fontSize: 12, color: theme.colors.text.secondary, marginTop: 2,
    },

    // Logout (less prominent than delete)
    logoutButton: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 6, marginHorizontal: 20, marginTop: 28,
        paddingVertical: 12, borderRadius: 12,
    },
    logoutText: {
        fontSize: 14, fontWeight: '500', color: theme.colors.text.tertiary,
    },

    // Version
    versionText: {
        textAlign: 'center', fontSize: 12,
        color: theme.colors.text.tertiary, marginTop: 12,
    },

    // ── Creator banner (não-criador) ──
    creatorBanner: {
        borderRadius: 18,
        padding: 18,
        gap: 12,
        ...theme.shadows.medium,
    },
    creatorBannerLeft: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    },
    creatorBannerEmoji: { fontSize: 32, lineHeight: 38 },
    creatorBannerTitle: {
        fontSize: 16, fontWeight: '800', color: '#fff', marginBottom: 4,
    },
    creatorBannerSub: {
        fontSize: 13, color: 'rgba(255,255,255,0.82)', lineHeight: 18,
    },
    creatorBannerCta: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 6, backgroundColor: '#fff',
        borderRadius: 10, paddingVertical: 10,
    },
    creatorBannerCtaText: {
        fontSize: 14, fontWeight: '700', color: theme.colors.primary,
    },

    // ── Creator badge (já é criador) ──
    creatorBadge: {
        backgroundColor: theme.colors.primary + '18',
        borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3,
        marginLeft: 'auto',
    },
    creatorBadgeText: {
        fontSize: 11, fontWeight: '700', color: theme.colors.primary,
    },
});

// ─── Mode switcher styles ─────────────────────────────────────
// Segmented control limpo: container único arredondado com 2 metades.
// Altura ~52px, ícones 16px, sem cards internos. Separação clara dos
// atalhos abaixo via marginBottom generoso.
const modeStyles = StyleSheet.create({
    wrap: { marginHorizontal: 20, marginTop: 20, marginBottom: 12 },
    label: {
        fontSize: 11, fontWeight: '700', color: theme.colors.text.tertiary,
        textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10,
    },
    segmented: {
        flexDirection: 'row', backgroundColor: theme.colors.surfaceHighlight,
        borderRadius: 999, padding: 4,
        borderWidth: 1, borderColor: theme.colors.borderLight,
    },
    seg: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, paddingVertical: 12, paddingHorizontal: 8,
        borderRadius: 999,
        minHeight: 44,
    },
    segActive: {
        backgroundColor: theme.colors.primary,
        ...theme.shadows.button,
    },
    segText: { fontSize: 14, fontWeight: '600', color: theme.colors.text.secondary },
    segTextActive: { color: '#fff', fontWeight: '700' },
});

// ─── Creator dashboard inline styles ──────────────────────────
// ═════════════════════════════════════════════════════════════════════
// CreatorDashboard — área Roteirista do perfil
// ═════════════════════════════════════════════════════════════════════
//
// Adapta o dashboard web (apps/site/src/app/dashboard/page.tsx) para
// mobile, mantendo as mesmas métricas/lógicas:
//   - Hero gradiente com nome + 2 CTAs
//   - 4 cards de métricas (Ativos, Vendas, Avaliação, Qualidade)
//   - Card "Receita acumulada"
//   - Seção "Seus Roteiros" com cards individuais + status + score
//   - Ações Rápidas
//
// Recebe stats já carregadas (mesma fonte da web: /dashboard/stats).

function CreatorDashboard({
    stats,
    userName,
    onCreate,
    onSeeAll,
    onOpenItinerary,
    onSales,
    onReviews,
    onQuestions,
    pendingQuestionsCount = 0,
}: {
    stats: CreatorStatsSummary | null;
    userName?: string;
    onCreate: () => void;
    onSeeAll: () => void;
    onOpenItinerary: (id: string) => void;
    onSales: () => void;
    onReviews: () => void;
    onQuestions: () => void;
    pendingQuestionsCount?: number;
}) {
    const loading = !stats;
    const itineraries = stats?.itineraries ?? [];
    const visibleItineraries = itineraries.slice(0, 3);
    const hasMore = itineraries.length > visibleItineraries.length;

    return (
        <View>
            {/* ── Hero gradiente (espelha "Criador" da web) ── */}
            <View style={cdStyles.heroWrap}>
                <LinearGradient
                    colors={['#1A3263', '#162A55']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={cdStyles.hero}
                >
                    <Text style={cdStyles.heroEyebrow}>CREATOR HUB</Text>
                    <Text style={cdStyles.heroTitle}>
                        {userName ? `Hi, ${userName}` : 'Creator'}
                    </Text>
                    <Text style={cdStyles.heroSubtitle}>
                        Manage your itineraries, track sales and grow your reach.
                    </Text>
                    <View style={cdStyles.heroCtas}>
                        <TouchableOpacity
                            style={cdStyles.heroPrimary}
                            onPress={onCreate}
                            activeOpacity={0.85}
                        >
                            <Icon name="edit" size={15} color="#fff" />
                            <Text style={cdStyles.heroPrimaryText}>New itinerary</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={cdStyles.heroSecondary}
                            onPress={onSeeAll}
                            activeOpacity={0.85}
                        >
                            <Text style={cdStyles.heroSecondaryText}>View itineraries</Text>
                            <Ionicons name="arrow-forward" size={15} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </LinearGradient>
            </View>

            {/* ── 4 cards de métricas (grid 2x2) ── */}
            <View style={cdStyles.metricsGrid}>
                <MetricCard
                    icon="briefcase"
                    iconColor={theme.colors.primary}
                    iconBg={theme.colors.primary + '14'}
                    label="Active itineraries"
                    value={loading ? '—' : String(stats!.publishedItineraries)}
                    subtext={loading ? '' : `${stats!.totalItineraries} total`}
                />
                <MetricCard
                    icon="briefcase"
                    iconColor="#6366F1"
                    iconBg="#6366F114"
                    label="Total sales"
                    value={loading ? '—' : String(stats!.totalSales)}
                    subtext={loading ? '' : `${formatMoney(Math.round(stats!.totalRevenue))} revenue`}
                />
                <MetricCard
                    icon="star"
                    iconColor="#F59E0B"
                    iconBg="#F59E0B14"
                    label="Average rating"
                    value={loading || stats!.averageRating <= 0 ? '—' : stats!.averageRating.toFixed(1)}
                    subtext="out of 5.0"
                />
                <MetricCard
                    icon="verified"
                    iconColor={theme.colors.success}
                    iconBg={theme.colors.success + '14'}
                    label="Average quality"
                    value={loading || stats!.averageQualityScore == null ? '—' : `${stats!.averageQualityScore}%`}
                    subtext={loading || stats!.averageQualityScore == null ? 'No active itineraries' : 'Average across active itineraries'}
                />
            </View>

            {/* ── Receita acumulada (card em destaque) ── */}
            <View style={cdStyles.revenueCard}>
                <View style={cdStyles.revenueLeft}>
                    <Text style={cdStyles.revenueLabel}>Total earned</Text>
                    <Text style={cdStyles.revenueValue}>
                        {loading ? '—' : formatMoney(Math.round(stats!.totalRevenue))}
                    </Text>
                    <Text style={cdStyles.revenueSub}>
                        {loading
                            ? ''
                            : stats!.totalSales > 0
                                ? `${stats!.totalSales} completed sale${stats!.totalSales === 1 ? '' : 's'}`
                                : 'Waiting for your first sale'}
                    </Text>
                </View>
                <View style={cdStyles.revenueIconWrap}>
                    <Ionicons name="cash-outline" size={22} color={theme.colors.primary} />
                </View>
            </View>

            {/* ── Dica Pro ── */}
            <View style={cdStyles.proTipCard}>
                <View style={cdStyles.proTipHeader}>
                    <Ionicons name="flash" size={18} color={theme.colors.primary} />
                    <Text style={cdStyles.proTipTitle}>PRO TIP</Text>
                </View>
                <Text style={cdStyles.proTipBody}>
                    Itineraries with a score above{' '}
                    <Text style={cdStyles.proTipHighlight}>80%</Text>
                    {' '}are easier for reviewers to approve and can earn more visibility in the app.
                </Text>
            </View>

            {/* ── Seção "Seus Roteiros" ── */}
            <View style={cdStyles.section}>
                <View style={cdStyles.sectionHeader}>
                    <Text style={cdStyles.sectionTitle}>Your Itineraries</Text>
                    {itineraries.length > 0 && (
                        <TouchableOpacity onPress={onSeeAll}>
                            <Text style={cdStyles.sectionLink}>See all</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {itineraries.length === 0 ? (
                    <View style={cdStyles.emptyCard}>
                        <Ionicons name="map-outline" size={28} color={theme.colors.text.tertiary} />
                        <Text style={cdStyles.emptyTitle}>No itineraries yet</Text>
                        <Text style={cdStyles.emptyText}>Create your first itinerary.</Text>
                        <TouchableOpacity
                            style={cdStyles.emptyCta}
                            onPress={onCreate}
                            activeOpacity={0.85}
                        >
                            <Icon name="edit" size={14} color="#fff" />
                            <Text style={cdStyles.emptyCtaText}>Create itinerary</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        {visibleItineraries.map((it) => (
                            <TouchableOpacity
                                key={it.id}
                                style={cdStyles.itineraryCard}
                                onPress={() => onOpenItinerary(it.id)}
                                activeOpacity={0.88}
                            >
                                <View style={cdStyles.itineraryHeader}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={cdStyles.itineraryTitle} numberOfLines={1}>
                                            {it.title}
                                        </Text>
                                        {it.destination ? (
                                            <Text style={cdStyles.itineraryDest} numberOfLines={1}>
                                                {it.destination}{it.country ? `, ${it.country}` : ''}
                                            </Text>
                                        ) : null}
                                    </View>
                                    <StatusBadge status={it.status} />
                                </View>
                                <View style={cdStyles.itineraryMeta}>
                                    {typeof it.price === 'number' && it.price > 0 && (
                                        <MetaPill icon="card" label={formatMoney(it.price)} />
                                    )}
                                    {typeof it.qualityScore === 'number' && (
                                        <MetaPill icon="star" label={`Score ${it.qualityScore}%`} />
                                    )}
                                    {it.sales > 0 && (
                                        <MetaPill icon="briefcase" label={`${it.sales} sale${it.sales === 1 ? '' : 's'}`} />
                                    )}
                                </View>
                            </TouchableOpacity>
                        ))}
                        {hasMore && (
                            <TouchableOpacity
                                style={cdStyles.seeAllInline}
                                onPress={onSeeAll}
                                activeOpacity={0.85}
                            >
                                <Text style={cdStyles.seeAllText}>
                                    See all {itineraries.length} itineraries
                                </Text>
                                <Ionicons name="chevron-forward" size={16} color={theme.colors.primary} />
                            </TouchableOpacity>
                        )}
                    </>
                )}
            </View>

            {/* ── Quick Actions ── */}
            <View style={cdStyles.section}>
                <Text style={cdStyles.sectionTitle}>Quick Actions</Text>
                <QuickAction
                    icon="edit"
                    iconBg={theme.colors.primary + '14'}
                    iconColor={theme.colors.primary}
                    title="Create Itinerary"
                    subtitle="New itinerary"
                    onPress={onCreate}
                />
                <QuickAction
                    icon="book-open"
                    iconBg="#6366F114"
                    iconColor="#6366F1"
                    title="My Itineraries"
                    subtitle="Manage everything"
                    onPress={onSeeAll}
                />
                <QuickAction
                    icon="wallet"
                    iconBg="#16A34A14"
                    iconColor="#16A34A"
                    title="Earnings"
                    subtitle="Track sales and payouts"
                    onPress={onSales}
                />
                <QuickAction
                    icon="message-circle"
                    iconBg={theme.colors.primary + '14'}
                    iconColor={theme.colors.primary}
                    title="Questions"
                    subtitle={pendingQuestionsCount > 0
                        ? `${pendingQuestionsCount} pending`
                        : 'Traveller questions'}
                    badge={pendingQuestionsCount > 0 ? pendingQuestionsCount : undefined}
                    onPress={onQuestions}
                />
                <QuickAction
                    icon="star"
                    iconBg="#F59E0B14"
                    iconColor="#F59E0B"
                    title="Reviews"
                    subtitle="Traveller reviews"
                    onPress={onReviews}
                />
            </View>
        </View>
    );
}

function MetricCard({ icon, iconColor, iconBg, label, value, subtext }: {
    icon: IconName; iconColor: string; iconBg: string;
    label: string; value: string; subtext?: string;
}) {
    return (
        <View style={cdStyles.metricCard}>
            <View style={[cdStyles.metricIconWrap, { backgroundColor: iconBg }]}>
                <Icon name={icon} size={16} color={iconColor} />
            </View>
            <Text style={cdStyles.metricLabel}>{label}</Text>
            <Text style={cdStyles.metricValue}>{value}</Text>
            {subtext ? <Text style={cdStyles.metricSub}>{subtext}</Text> : null}
        </View>
    );
}

const STATUS_LABELS: Record<string, { label: string; bg: string; fg: string }> = {
    draft:          { label: 'Draft',  bg: '#94A3B81A', fg: '#475569' },
    pending_review: { label: 'In review', bg: '#F59E0B1F', fg: '#A16207' },
    approved:       { label: 'Approved',  bg: '#22C55E1F', fg: '#15803D' },
    active:         { label: 'Published', bg: '#22C55E1F', fg: '#15803D' },
    published:      { label: 'Published', bg: '#22C55E1F', fg: '#15803D' },
    rejected:       { label: 'Rejected', bg: '#EF44441F', fg: '#B91C1C' },
    archived:       { label: 'Archived', bg: '#94A3B81F', fg: '#475569' },
};
function StatusBadge({ status }: { status: string }) {
    const key = (status || '').toLowerCase();
    const cfg = STATUS_LABELS[key] ?? { label: status || 'Status', bg: '#94A3B81F', fg: '#475569' };
    return (
        <View style={[cdStyles.statusBadge, { backgroundColor: cfg.bg }]}>
            <Text style={[cdStyles.statusText, { color: cfg.fg }]}>{cfg.label}</Text>
        </View>
    );
}

function MetaPill({ icon, label }: { icon: IconName; label: string }) {
    return (
        <View style={cdStyles.metaPill}>
            <Icon name={icon} size={11} color={theme.colors.text.secondary} />
            <Text style={cdStyles.metaPillText}>{label}</Text>
        </View>
    );
}

function QuickAction({
    icon, iconBg, iconColor, title, subtitle, onPress, badge,
}: {
    icon: IconName; iconBg: string; iconColor: string;
    title: string; subtitle: string; onPress: () => void;
    badge?: number;
}) {
    return (
        <TouchableOpacity
            style={cdStyles.quickAction}
            onPress={onPress}
            activeOpacity={0.88}
        >
            <View style={[cdStyles.quickActionIcon, { backgroundColor: iconBg }]}>
                <Icon name={icon} size={18} color={iconColor} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={cdStyles.quickActionTitle}>{title}</Text>
                <Text style={cdStyles.quickActionSub}>{subtitle}</Text>
            </View>
            {typeof badge === 'number' && badge > 0 && (
                <View style={cdStyles.quickActionBadge}>
                    <Text style={cdStyles.quickActionBadgeText}>
                        {badge > 99 ? '99+' : badge}
                    </Text>
                </View>
            )}
            <Ionicons name="chevron-forward" size={18} color={theme.colors.text.tertiary} />
        </TouchableOpacity>
    );
}

const cdStyles = StyleSheet.create({
    // Hero
    heroWrap: { marginHorizontal: 20, marginTop: 16 },
    hero: {
        borderRadius: 20,
        padding: 20,
        gap: 4,
        ...theme.shadows.large,
    },
    heroEyebrow: {
        fontSize: 11,
        fontWeight: '700',
        color: '#28C9BF',
        letterSpacing: 1,
    },
    heroTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: -0.5,
        marginTop: 2,
    },
    heroSubtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.75)',
        lineHeight: 19,
        marginTop: 6,
    },
    heroCtas: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 14,
    },
    heroPrimary: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 16,
        paddingVertical: 11,
        borderRadius: 999,
        ...theme.shadows.button,
    },
    heroPrimaryText: { color: '#fff', fontSize: 13, fontWeight: '700' },
    heroSecondary: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 11,
        borderRadius: 999,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.28)',
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    heroSecondaryText: { color: '#fff', fontSize: 13, fontWeight: '700' },

    // Metrics grid
    metricsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginHorizontal: 20,
        marginTop: 16,
    },
    metricCard: {
        width: '48%',
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 14,
        gap: 6,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    metricIconWrap: {
        width: 30, height: 30, borderRadius: 8,
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 4,
    },
    metricLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: theme.colors.text.tertiary,
        textTransform: 'uppercase',
        letterSpacing: 0.4,
    },
    metricValue: {
        fontSize: 22,
        fontWeight: '800',
        color: theme.colors.text.primary,
        letterSpacing: -0.5,
    },
    metricSub: {
        fontSize: 11,
        color: theme.colors.text.tertiary,
    },

    // Revenue featured card
    revenueCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginHorizontal: 20,
        marginTop: 12,
        padding: 16,
        backgroundColor: theme.colors.primary + '0D',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: theme.colors.primary + '22',
    },
    revenueLeft: { flex: 1, gap: 2 },
    revenueLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: theme.colors.text.tertiary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    revenueValue: {
        fontSize: 24,
        fontWeight: '800',
        color: theme.colors.text.primary,
        letterSpacing: -0.6,
    },
    revenueSub: {
        fontSize: 12,
        color: theme.colors.text.secondary,
    },
    revenueIconWrap: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: theme.colors.primary + '1A',
        alignItems: 'center', justifyContent: 'center',
    },

    // Sections
    section: { marginHorizontal: 20, marginTop: 20 },
    sectionHeader: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 17, fontWeight: '800', color: theme.colors.text.primary,
        letterSpacing: -0.3,
    },
    sectionLink: {
        fontSize: 13, fontWeight: '700', color: theme.colors.primary,
    },

    // Itinerary card
    itineraryCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        gap: 10,
    },
    itineraryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    itineraryTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.colors.text.primary,
    },
    itineraryDest: {
        fontSize: 12,
        color: theme.colors.text.tertiary,
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 9,
        paddingVertical: 3,
        borderRadius: 999,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    itineraryMeta: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    metaPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: theme.colors.surfaceLight,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
    },
    metaPillText: {
        fontSize: 11,
        fontWeight: '600',
        color: theme.colors.text.secondary,
    },
    seeAllInline: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: theme.colors.primary + '0E',
        borderWidth: 1,
        borderColor: theme.colors.primary + '22',
    },
    seeAllText: {
        fontSize: 13,
        fontWeight: '700',
        color: theme.colors.primary,
    },

    // Empty state (sem roteiros)
    emptyCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 24,
        alignItems: 'center',
        gap: 6,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    emptyTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginTop: 4,
    },
    emptyText: {
        fontSize: 13,
        color: theme.colors.text.tertiary,
        textAlign: 'center',
    },
    emptyCta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 8,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 999,
        backgroundColor: theme.colors.primary,
    },
    emptyCtaText: {
        color: '#fff', fontSize: 13, fontWeight: '700',
    },

    // Quick actions
    quickAction: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 14,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    quickActionIcon: {
        width: 40, height: 40, borderRadius: 12,
        alignItems: 'center', justifyContent: 'center',
    },
    quickActionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.colors.text.primary,
    },
    quickActionSub: {
        fontSize: 12,
        color: theme.colors.text.tertiary,
        marginTop: 1,
    },
    // Badge contador (ex.: perguntas pendentes) — pill teal compacta.
    quickActionBadge: {
        minWidth: 22,
        height: 22,
        paddingHorizontal: 7,
        borderRadius: 11,
        backgroundColor: theme.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 4,
    },
    quickActionBadgeText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: -0.2,
    },
    proTipCard: {
        marginHorizontal: 20,
        marginVertical: 8,
        padding: 20,
        borderRadius: 20,
        backgroundColor: 'rgba(40, 201, 191, 0.06)',
        borderWidth: 1,
        borderColor: 'rgba(40, 201, 191, 0.22)',
    },
    proTipHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 10,
    },
    proTipTitle: {
        fontSize: 13,
        fontWeight: '800',
        color: theme.colors.secondary,
        letterSpacing: 1,
    },
    proTipBody: {
        fontSize: 17,
        lineHeight: 26,
        color: '#5A6B8C',
        fontWeight: '400',
    },
    proTipHighlight: {
        color: theme.colors.secondary,
        fontWeight: '800',
    },
});

const dashStyles = StyleSheet.create({
    wrap: { marginHorizontal: 20, marginTop: 18 },
    headerRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 12,
    },
    headerTitle: {
        fontSize: 17, fontWeight: '800', color: theme.colors.text.primary,
        letterSpacing: -0.3,
    },
    headerSub: { fontSize: 12, color: theme.colors.text.tertiary, marginTop: 2 },
    newButton: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 14, paddingVertical: 9, borderRadius: 100,
        ...theme.shadows.button,
    },
    newButtonText: { fontSize: 13, fontWeight: '700', color: '#fff' },
    statsGrid: { flexDirection: 'row', gap: 8, marginBottom: 8 },
    statCard: {
        flex: 1, backgroundColor: theme.colors.surface,
        borderRadius: 14, padding: 14, alignItems: 'flex-start',
        borderWidth: 1, borderColor: theme.colors.borderLight,
    },
    statValue: {
        fontSize: 22, fontWeight: '800', color: theme.colors.text.primary,
        letterSpacing: -0.5,
    },
    statLabel: { fontSize: 11, color: theme.colors.text.tertiary, marginTop: 4 },
    fullDashboardBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        marginTop: 12, padding: 14,
        backgroundColor: theme.colors.primary + '12',
        borderRadius: 14, borderWidth: 1, borderColor: theme.colors.primary + '28',
    },
    fullDashboardText: {
        flex: 1, fontSize: 14, fontWeight: '700', color: theme.colors.primary,
    },
    emptySalesCard: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 8,
        marginTop: 10, padding: 12,
        backgroundColor: theme.colors.surfaceLight, borderRadius: 12,
    },
    emptySalesText: {
        flex: 1, fontSize: 12, color: theme.colors.text.secondary, lineHeight: 17,
    },
});
