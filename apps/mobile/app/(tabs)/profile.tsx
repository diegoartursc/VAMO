import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Modal, Linking, Platform, Alert, Dimensions, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../../src/theme/theme';
import { haptics } from '../../src/services/haptics';
import { Ionicons } from '@expo/vector-icons';
import { Icon, IconName } from '../../src/components/common/Icons';
import { useAuth } from '../../src/contexts/AuthContext';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3333/api';
const VIEW_MODE_KEY = '@vamo_profile_view_mode';
type ViewMode = 'traveler' | 'creator';

// ─── Creator dashboard stats (resumo) ─────────────────────────
interface CreatorStatsSummary {
    totalItineraries: number;
    activeItineraries: number;
    pendingReview: number;
    totalSales: number;
    totalRevenue: number;
    averageRating: number;
}

const { width } = Dimensions.get('window');

const CURRENCIES = ['(€) Euro', '(R$) Real', '($) Dólar', '(£) Libra'];
const LANGUAGES = ['português', 'english', 'español'];
const APPEARANCES = ['Predefinida pelo sistema', 'Claro', 'Escuro'];

const TRAVEL_TYPES = ['Luxo', 'Econômico', 'Mochilão', 'Família', 'Romântico', 'Aventura'];
const BUDGET_RANGES = ['Até R$ 2.000', 'R$ 2.000 – 5.000', 'R$ 5.000 – 10.000', 'R$ 10.000+'];
const INTEREST_OPTIONS = [
    { id: 'natureza', icon: 'trees' as IconName, label: 'Natureza' },
    { id: 'cultura', icon: 'landmark' as IconName, label: 'Cultura' },
    { id: 'gastronomia', icon: 'utensils' as IconName, label: 'Gastronomia' },
    { id: 'aventura', icon: 'mountain' as IconName, label: 'Aventura' },
    { id: 'praia', icon: 'compass' as IconName, label: 'Praia' },
    { id: 'compras', icon: 'briefcase' as IconName, label: 'Compras' },
    { id: 'vida_noturna', icon: 'star' as IconName, label: 'Vida Noturna' },
    { id: 'religiao', icon: 'landmark' as IconName, label: 'Religião' },
];

// Milestones estáticos — futuramente via API
const MILESTONES_BASE = [
    { id: 'first_review', label: 'Primeira avaliação', done: true },
    { id: 'first_itinerary', label: 'Primeiro roteiro criado', done: false },
    { id: 'five_destinations', label: '5 destinos visitados', done: false },
    { id: 'ten_saved', label: '10 roteiros salvos', done: false },
];

export default function ProfileScreen() {
    const router = useRouter();
    const { user, accessToken, isAuthenticated, isLoading, logout } = useAuth();
    const fadeAnim = useRef(new Animated.Value(0)).current;

    // ─── Modo de visualização (Viajante/Roteirista) ──────────────
    const [viewMode, setViewMode] = useState<ViewMode>('traveler');
    const [creatorStats, setCreatorStats] = useState<CreatorStatsSummary | null>(null);
    const [statsLoaded, setStatsLoaded] = useState(false);

    // ─── Detecção de roteirista ───────────────────────────────────
    // Fontes (em ordem de prioridade):
    // 1. user.creatorId vindo do JWT/login (rápido, mas pode estar ausente em backends antigos)
    // 2. roteiros criados pelo usuário consultados em /dashboard/stats (fonte de verdade,
    //    resolvida a partir do travelerId do JWT no backend)
    // A UI considera o usuário roteirista se QUALQUER uma das fontes confirmar.
    const isCreator = !!user?.creatorId || (creatorStats?.totalItineraries ?? 0) > 0;

    // Hidratar modo salvo
    useEffect(() => {
        AsyncStorage.getItem(VIEW_MODE_KEY).then((saved) => {
            if (saved === 'creator' || saved === 'traveler') setViewMode(saved);
        }).catch(() => { /* ignore */ });
    }, []);

    // Se o usuário não é criador, força modo viajante (e zera persistência)
    useEffect(() => {
        if (statsLoaded && !isCreator && viewMode !== 'traveler') {
            setViewMode('traveler');
            AsyncStorage.setItem(VIEW_MODE_KEY, 'traveler').catch(() => {});
        }
    }, [isCreator, viewMode, statsLoaded]);

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
            const pendingReview = (data.itineraries || []).filter((it: any) => it.status === 'pending_review').length;
            setCreatorStats({
                totalItineraries: data.totalItineraries ?? 0,
                activeItineraries: data.activeItineraries ?? 0,
                pendingReview,
                totalSales: data.totalSales ?? 0,
                totalRevenue: data.totalRevenue ?? 0,
                averageRating: data.averageRating ?? 0,
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
        try { await AsyncStorage.setItem(VIEW_MODE_KEY, mode); } catch { /* ignore */ }
    };

    const [currency, setCurrency] = useState('(R$) Real');
    const [language, setLanguage] = useState('português');
    const [appearance, setAppearance] = useState('Predefinida pelo sistema');
    const [travelType, setTravelType] = useState('Aventura');
    const [budget, setBudget] = useState('R$ 2.000 – 5.000');
    const [selectedInterests, setSelectedInterests] = useState<string[]>(['cultura', 'gastronomia']);

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

    // Debug: logar usuário atual
    useEffect(() => {
        console.log('[profile] isAuthenticated:', isAuthenticated, '| userId:', user?.travelerId, '| email:', user?.email);
    }, [isAuthenticated, user]);

    const handleRateApp = () => {
        haptics.success();
        const storeUrl = Platform.OS === 'ios'
            ? 'https://apps.apple.com/app/id1234567890'
            : 'https://play.google.com/store/apps/details?id=com.vamo';
        Linking.openURL(storeUrl);
    };

    const handleLogout = () => {
        haptics.warning();
        Alert.alert('Sair da conta', 'Tem certeza que deseja sair?', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Sair', style: 'destructive',
                onPress: async () => {
                    haptics.success();
                    await logout();
                    console.log('[profile] logout realizado');
                    router.replace('/login');
                },
            },
        ]);
    };

    const handleStatPress = (type: 'itineraries' | 'saved') => {
        haptics.light();
        router.push('/(tabs)/my-trips');
    };

    const toggleInterest = (id: string) => {
        setSelectedInterests(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const completedMilestones = MILESTONES_BASE.filter(m => m.done).length;

    // Não logado: mostrar tela de login prompt
    if (!isLoading && !isAuthenticated) {
        return (
            <View style={[styles.container, { alignItems: 'center', justifyContent: 'center', padding: 32 }]}>
                <Icon name="circle-user" size={64} color={theme.colors.primary} />
                <Text style={{ fontSize: 22, fontWeight: '800', color: theme.colors.text.primary, marginTop: 20, marginBottom: 8, textAlign: 'center' }}>
                    Bem-vindo ao VAMO
                </Text>
                <Text style={{ fontSize: 15, color: theme.colors.text.secondary, textAlign: 'center', lineHeight: 22, marginBottom: 32 }}>
                    Faça login para acessar seu perfil, favoritos, carrinho e roteiros.
                </Text>
                <TouchableOpacity
                    style={{ backgroundColor: theme.colors.primary, borderRadius: 14, paddingHorizontal: 32, paddingVertical: 14, marginBottom: 12 }}
                    onPress={() => router.push('/login')}
                >
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>Entrar na conta</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push('/register')}>
                    <Text style={{ fontSize: 14, color: theme.colors.primary, fontWeight: '600' }}>Criar conta grátis →</Text>
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
                {isCreator && (
                    <View style={modeStyles.wrap}>
                        <Text style={modeStyles.label}>Você está usando o VAMO como:</Text>
                        <View style={modeStyles.segmented}>
                            <TouchableOpacity
                                style={[modeStyles.seg, viewMode === 'traveler' && modeStyles.segActive]}
                                onPress={() => switchMode('traveler')}
                                activeOpacity={0.85}
                            >
                                <Icon name="book-open" size={14} color={viewMode === 'traveler' ? '#fff' : theme.colors.text.secondary} />
                                <Text style={[modeStyles.segText, viewMode === 'traveler' && modeStyles.segTextActive]}>
                                    Viajante
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[modeStyles.seg, viewMode === 'creator' && modeStyles.segActive]}
                                onPress={() => switchMode('creator')}
                                activeOpacity={0.85}
                            >
                                <Icon name="edit" size={14} color={viewMode === 'creator' ? '#fff' : theme.colors.text.secondary} />
                                <Text style={[modeStyles.segText, viewMode === 'creator' && modeStyles.segTextActive]}>
                                    Roteirista
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* ══════════ 2. QUICK STATS (Viajante) / DASHBOARD (Roteirista) ══════════ */}
                {viewMode === 'creator' && isCreator ? (
                    /* Dashboard resumo do criador */
                    <View style={dashStyles.wrap}>
                        <View style={dashStyles.headerRow}>
                            <View>
                                <Text style={dashStyles.headerTitle}>Dashboard do Roteirista</Text>
                                <Text style={dashStyles.headerSub}>
                                    {creatorStats
                                        ? `${creatorStats.totalItineraries} roteiro${creatorStats.totalItineraries === 1 ? '' : 's'} criado${creatorStats.totalItineraries === 1 ? '' : 's'}`
                                        : 'Carregando…'}
                                </Text>
                            </View>
                            <TouchableOpacity
                                style={dashStyles.newButton}
                                onPress={() => { haptics.medium(); router.push('/new-itinerary'); }}
                                activeOpacity={0.85}
                            >
                                <Icon name="edit" size={14} color="#fff" />
                                <Text style={dashStyles.newButtonText}>Criar roteiro</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Stat cards */}
                        <View style={dashStyles.statsGrid}>
                            <View style={dashStyles.statCard}>
                                <Text style={dashStyles.statValue}>{creatorStats?.totalItineraries ?? '—'}</Text>
                                <Text style={dashStyles.statLabel}>Criados</Text>
                            </View>
                            <View style={dashStyles.statCard}>
                                <Text style={dashStyles.statValue}>{creatorStats?.activeItineraries ?? '—'}</Text>
                                <Text style={dashStyles.statLabel}>Publicados</Text>
                            </View>
                            <View style={dashStyles.statCard}>
                                <Text style={[dashStyles.statValue, (creatorStats?.pendingReview ?? 0) > 0 && { color: '#D97706' }]}>
                                    {creatorStats?.pendingReview ?? '—'}
                                </Text>
                                <Text style={dashStyles.statLabel}>Em análise</Text>
                            </View>
                        </View>

                        <View style={dashStyles.statsGrid}>
                            <View style={dashStyles.statCard}>
                                <Text style={dashStyles.statValue}>{creatorStats?.totalSales ?? '—'}</Text>
                                <Text style={dashStyles.statLabel}>Vendas</Text>
                            </View>
                            <View style={[dashStyles.statCard, { flex: 2 }]}>
                                <Text style={dashStyles.statValue}>
                                    {creatorStats ? `R$ ${creatorStats.totalRevenue.toFixed(0)}` : '—'}
                                </Text>
                                <Text style={dashStyles.statLabel}>Receita acumulada</Text>
                            </View>
                        </View>

                        {/* CTA principal: ver lista completa */}
                        <TouchableOpacity
                            style={dashStyles.fullDashboardBtn}
                            onPress={() => { haptics.light(); router.push('/created-itineraries'); }}
                            activeOpacity={0.85}
                        >
                            <Icon name="briefcase" size={16} color={theme.colors.primary} />
                            <Text style={dashStyles.fullDashboardText}>Ver todos os meus roteiros</Text>
                            <Ionicons name="chevron-forward" size={16} color={theme.colors.primary} />
                        </TouchableOpacity>

                        {/* Aviso receita */}
                        {(!creatorStats || creatorStats.totalSales === 0) && (
                            <View style={dashStyles.emptySalesCard}>
                                <Icon name="info" size={14} color={theme.colors.text.tertiary} />
                                <Text style={dashStyles.emptySalesText}>
                                    Quando seus roteiros forem comprados, suas vendas e receita aparecerão aqui.
                                </Text>
                            </View>
                        )}
                    </View>
                ) : (
                    /* Quick stats do viajante (modo padrão) */
                    <View style={styles.statsRow}>
                        <TouchableOpacity style={styles.statCard} onPress={() => router.push('/(tabs)/my-trips')}>
                            <Icon name="book-open" size={22} color={theme.colors.primary} />
                            <Text style={styles.statValue}>—</Text>
                            <Text style={styles.statLabel}>Meus Roteiros</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.statCard} onPress={() => router.push('/(tabs)/saved')}>
                            <Icon name="heart" size={22} color={theme.colors.primary} />
                            <Text style={styles.statValue}>—</Text>
                            <Text style={styles.statLabel}>Salvos</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* ══════════ 3. SUA JORNADA NO VAMO ══════════ */}
                <View style={styles.sectionSpaced}>
                    <View style={styles.sectionTitleRow}>
                        <Icon name="globe" size={16} color={theme.colors.primary} />
                        <Text style={styles.sectionTitle}>Sua Jornada no VAMO</Text>
                        <Text style={styles.journeyProgress}>{completedMilestones}/{MILESTONES_BASE.length}</Text>
                    </View>
                    <View style={styles.sectionCard}>
                        {/* Progress bar */}
                        <View style={styles.progressBarContainer}>
                            <View style={[styles.progressBarFill, { width: `${(completedMilestones / MILESTONES_BASE.length) * 100}%` }]} />
                        </View>
                        {MILESTONES_BASE.map((milestone, idx) => (
                            <View
                                key={milestone.id}
                                style={[
                                    styles.milestoneRow,
                                    idx === MILESTONES_BASE.length - 1 && styles.milestoneRowLast,
                                ]}
                            >
                                {milestone.done ? (
                                    <Icon name="verified" size={20} color={theme.colors.success} />
                                ) : (
                                    <Icon name="lock" size={18} color={theme.colors.text.tertiary} />
                                )}
                                <Text style={[
                                    styles.milestoneLabel,
                                    !milestone.done && styles.milestoneLabelLocked,
                                ]}>
                                    {milestone.label}
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
                            haptics.light(); Linking.openSettings();
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
                                    <Text style={styles.creatorBannerTitle}>Torne-se um Roteirista</Text>
                                    <Text style={styles.creatorBannerSub}>
                                        Crie roteiros, compartilhe experiências e ganhe dinheiro viajando.
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
                            <Text style={styles.sectionTitle}>Área do Criador</Text>
                            <View style={styles.creatorBadge}>
                                <Text style={styles.creatorBadgeText}>✓ Roteirista</Text>
                            </View>
                        </View>
                        <View style={styles.sectionCard}>
                            <SettingItem
                                icon="edit"
                                title="Criar novo roteiro"
                                onPress={() => { haptics.light(); router.push('/new-itinerary'); }}
                            />
                            <SettingItem
                                icon="book-open"
                                title="Meus roteiros criados"
                                onPress={() => { haptics.light(); router.push('/created-itineraries'); }}
                            />
                            <SettingItem
                                icon="briefcase"
                                title="Dashboard do criador"
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

                {/* ══════════ 6. SOBRE ══════════ */}
                <View style={styles.sectionSpaced}>
                    <Text style={styles.sectionTitle}>Sobre</Text>
                    <View style={styles.sectionCard}>
                        <SettingItem icon="help" title="Como funciona" onPress={() => {
                            haptics.light(); setShowHowItWorksModal(true);
                        }} />
                        <SettingItem icon="info" title="Sobre o VAMO" onPress={() => {
                            haptics.light(); setShowAboutModal(true);
                        }} />
                        <SettingItem icon="message-circle" title="Central de Ajuda" onPress={() => {
                            haptics.light(); Linking.openURL('https://vamo.app/ajuda');
                        }} />
                        <SettingItem icon="phone" title="Falar com suporte" iconColor="#25D366" onPress={() => {
                            haptics.light(); Linking.openURL('https://wa.me/5511999999999?text=Olá! Preciso de ajuda no VAMO.');
                        }} />
                        <SettingItem icon="clipboard-list" title="Minhas solicitações" onPress={() => {
                            haptics.light();
                            Alert.alert('Solicitações', 'Você não possui solicitações abertas no momento.', [{ text: 'OK' }]);
                        }} isLast />
                    </View>
                </View>

                {/* ══════════ AVALIAÇÃO ══════════ */}
                <View style={styles.sectionSpaced}>
                    <Text style={styles.sectionTitle}>Avaliação</Text>
                    <View style={styles.sectionCard}>
                        <SettingItem icon="star" title="Avaliar o aplicativo" onPress={handleRateApp} />
                        <SettingItem icon="share" title="Compartilhar com amigos" onPress={() => {
                            haptics.light();
                            Alert.alert('Compartilhar', 'Funcionalidade disponível em breve!');
                        }} isLast />
                    </View>
                </View>

                {/* ══════════ 7. LEGAL ══════════ */}
                <View style={styles.sectionSpaced}>
                    <Text style={styles.sectionTitle}>Legal</Text>
                    <View style={styles.sectionCard}>
                        <SettingItem icon="file" title="Termos de Uso" onPress={() => {
                            haptics.light(); Linking.openURL('https://vamo.app/termos');
                        }} />
                        <SettingItem icon="shield-check" title="Política de Privacidade" onPress={() => {
                            haptics.light(); Linking.openURL('https://vamo.app/privacidade');
                        }} />
                        <SettingItem icon="trash" title="Excluir minha conta" titleColor={theme.colors.error} onPress={() => {
                            haptics.warning();
                            Alert.alert('Excluir Conta', 'Esta ação é irreversível. Todos os seus dados serão apagados permanentemente.', [
                                { text: 'Cancelar', style: 'cancel' },
                                { text: 'Excluir', style: 'destructive', onPress: () => Alert.alert('Solicitação enviada', 'Sua conta será excluída em até 30 dias.') },
                            ]);
                        }} isLast />
                    </View>
                </View>

                {/* ══════════ SIGN OUT (less prominent than Delete) ══════════ */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Icon name="logout" size={18} color={theme.colors.text.tertiary} />
                    <Text style={styles.logoutText}>Sair da conta</Text>
                </TouchableOpacity>

                {/* Version */}
                <Text style={styles.versionText}>VAMO v1.0.0</Text>

                <View style={{ height: 40 }} />
            </Animated.ScrollView>

            {/* ══════════ MODALS ══════════ */}
            <PickerModal visible={showCurrencyPicker} title="Selecione a moeda" options={CURRENCIES} selected={currency}
                onSelect={(v) => { setCurrency(v); haptics.success(); }} onClose={() => setShowCurrencyPicker(false)} />
            <PickerModal visible={showLanguagePicker} title="Selecione o idioma" options={LANGUAGES} selected={language}
                onSelect={(v) => { setLanguage(v); haptics.success(); }} onClose={() => setShowLanguagePicker(false)} />
            <PickerModal visible={showAppearancePicker} title="Selecione o tema" options={APPEARANCES} selected={appearance}
                onSelect={(v) => { setAppearance(v); haptics.success(); }} onClose={() => setShowAppearancePicker(false)} />
            <PickerModal visible={showTravelTypePicker} title="Tipo de viagem" options={TRAVEL_TYPES} selected={travelType}
                onSelect={(v) => { setTravelType(v); haptics.success(); }} onClose={() => setShowTravelTypePicker(false)} />
            <PickerModal visible={showBudgetPicker} title="Orçamento médio" options={BUDGET_RANGES} selected={budget}
                onSelect={(v) => { setBudget(v); haptics.success(); }} onClose={() => setShowBudgetPicker(false)} />

            {/* Interests Multi-Select Modal */}
            <Modal visible={showInterestsPicker} animationType="slide" transparent>
                <View style={modalStyles.overlay}>
                    <View style={modalStyles.container}>
                        <View style={modalStyles.handle} />
                        <View style={modalStyles.header}>
                            <Text style={modalStyles.title}>Seus Interesses</Text>
                            <TouchableOpacity onPress={() => setShowInterestsPicker(false)} style={modalStyles.closeButton}>
                                <Icon name="close" size={20} color={theme.colors.text.secondary} />
                            </TouchableOpacity>
                        </View>
                        <Text style={modalStyles.interestsSubtitle}>
                            Selecione seus interesses para recomendações personalizadas
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
                            <Text style={modalStyles.doneButtonText}>Salvar ({selectedInterests.length})</Text>
                        </TouchableOpacity>
                        <View style={{ height: 16 }} />
                    </View>
                </View>
            </Modal>

            <InfoModal visible={showAboutModal} title="Sobre o VAMO"
                content={`VAMO — Sua plataforma de roteiros de viagem\n\nVersão 1.0.0\n\nDescubra roteiros detalhados criados por viajantes experientes. Planeje sua viagem com quem já esteve lá.\n\n© 2026 VAMO. Todos os direitos reservados.`}
                onClose={() => setShowAboutModal(false)} />
            <InfoModal visible={showHowItWorksModal} title="Como funciona"
                content={`1. Explore\nNavegue por roteiros criados por viajantes experientes.\n\n2. Escolha\nSelecione o roteiro perfeito para você e confira os detalhes.\n\n3. Adquira\nFinalize a compra do roteiro com segurança.\n\n4. Viaje!\nReceba todas as informações e aproveite sua aventura.`}
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

    // Stats
    statsRow: {
        flexDirection: 'row', marginTop: -20, marginHorizontal: 20, gap: 10,
    },
    statCard: {
        flex: 1, backgroundColor: theme.colors.background,
        borderRadius: 16, paddingVertical: 16, alignItems: 'center',
        ...theme.shadows.medium,
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
const modeStyles = StyleSheet.create({
    wrap: { marginHorizontal: 20, marginTop: 18, marginBottom: 4 },
    label: {
        fontSize: 12, fontWeight: '600', color: theme.colors.text.tertiary,
        textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8,
    },
    segmented: {
        flexDirection: 'row', backgroundColor: theme.colors.surfaceLight,
        borderRadius: 100, padding: 4, gap: 4,
    },
    seg: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 6, paddingVertical: 10, borderRadius: 100,
    },
    segActive: {
        backgroundColor: theme.colors.primary,
        ...theme.shadows.button,
    },
    segText: { fontSize: 13, fontWeight: '600', color: theme.colors.text.secondary },
    segTextActive: { color: '#fff', fontWeight: '700' },
});

// ─── Creator dashboard inline styles ──────────────────────────
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
