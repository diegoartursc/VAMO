import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Platform, Dimensions, Animated, Share,
    Image, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../../src/theme/theme';
import { haptics } from '../../src/services/haptics';
import { Ionicons } from '@expo/vector-icons';
import { Icon, IconName } from '../../src/components/common/Icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { useFavorites } from '../../src/hooks/useFavorites';
import { useCart } from '../../src/hooks/useCart';
import {
    getMyTrips,
    getMyReviews,
    getTravelerPassportStats,
    updateMyAvatar,
    updateMyCover,
    type TravelerPassportStats,
} from '../../src/services/api';
import { openExternalUrl as openSafeExternalUrl } from '../../src/utils/externalLinks';
import { confirm } from '../../src/utils/confirm';
import { notify } from '../../src/utils/notify';
import { calculateTravelerProgress } from '../../src/gamification';
import { CreatorPortalEntryCard } from '../../src/features/creator/dashboard/CreatorPortalEntryCard';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3333/api';
// Chaves namespeadas por travelerId — sem isso, dois usuários no mesmo
// dispositivo herdavam preferências do anterior (mesma armadilha do
// carrinho/favoritos). As constantes abaixo são as chaves globais legacy que
// apagamos uma vez por mount via legacyWipe (defesa-em-profundidade).
//
// NOTA: o antigo "modo de perfil" (Viajante/Roteirista) foi removido — o Perfil
// é área única do usuário e a entrada de roteirista virou um card. As chaves
// `@vamo_profile_view_mode[:id]` não controlam mais a UI; só limpamos o legado.
const LEGACY_VIEW_MODE_KEY = '@vamo_profile_view_mode';

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
    featured?: boolean;
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


export default function ProfileScreen() {
    const router = useRouter();
    const { user, accessToken, isAuthenticated, isLoading, logout, updateUser } = useAuth();
    const { favorites, isLoading: favoritesLoading } = useFavorites();
    const { cartCount } = useCart();
    const fadeAnim = useRef(new Animated.Value(0)).current;

    // ─── Stats do criador (só p/ detectar roteirista + micro-resumo do card) ──
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

    // Migration one-shot: limpa chave global legacy (modo de perfil) que podia
    // vazar entre usuários. O modo de perfil não existe mais.
    const legacyWiped = useRef(false);
    useEffect(() => {
        if (legacyWiped.current) return;
        legacyWiped.current = true;
        AsyncStorage.removeItem(LEGACY_VIEW_MODE_KEY).catch(() => {});
    }, []);

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

    const [purchasedCount, setPurchasedCount] = useState<number | null>(null);
    const [reviewsGivenCount, setReviewsGivenCount] = useState<number>(0);
    const [reviewsWithPhotoCount, setReviewsWithPhotoCount] = useState<number>(0);
    const [passportStats, setPassportStats] = useState<TravelerPassportStats | null>(null);
    const [avatarUploading, setAvatarUploading] = useState(false);
    const [coverUploading, setCoverUploading] = useState(false);
    /** Bumps a cada upload pra forçar reload da Image (evita cache da URL anterior). */
    const [imageCacheBust, setImageCacheBust] = useState(0);

    // Fade in on mount
    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
        }).start();
    }, []);

    // Reusa o fetch dos contadores do viajante. Roda em login/logout E sempre
    // que a tela ganha foco — assim o "Meus Roteiros" e "Reviews" do header
    // ficam fresh logo depois que o usuário compra/avalia em outra aba.
    const fetchTravelerStats = React.useCallback(() => {
        if (!accessToken || !isAuthenticated) {
            setPurchasedCount(null);
            setReviewsGivenCount(0);
            setReviewsWithPhotoCount(0);
            setPassportStats(null);
            return;
        }
        getMyTrips(accessToken)
            .then((result) => setPurchasedCount(result.purchasedItineraries.length))
            .catch(() => setPurchasedCount(null));
        getMyReviews(accessToken)
            .then(({ reviews }) => {
                const list = Array.isArray(reviews) ? reviews : [];
                setReviewsGivenCount(list.length);
                setReviewsWithPhotoCount(list.filter(review => Array.isArray(review.photos) && review.photos.length > 0).length);
            })
            .catch(() => {
                setReviewsGivenCount(0);
                setReviewsWithPhotoCount(0);
            });
        getTravelerPassportStats(accessToken)
            .then((stats) => setPassportStats(stats))
            .catch(() => setPassportStats(null));
    }, [accessToken, isAuthenticated]);

    useEffect(() => { fetchTravelerStats(); }, [fetchTravelerStats]);
    useFocusEffect(React.useCallback(() => { fetchTravelerStats(); }, [fetchTravelerStats]));

    // Debug: logar usuário atual
    useEffect(() => {
        console.log('[profile] isAuthenticated:', isAuthenticated, '| userId:', user?.travelerId, '| email:', user?.email);
    }, [isAuthenticated, user]);

    const openExternalUrl = async (url: string, fallbackMessage = 'Não foi possível abrir este link agora.') => {
        await openSafeExternalUrl(url, { fallbackMessage });
    };

    const handleRateApp = () => {
        haptics.success();
        const storeUrl = Platform.OS === 'ios'
            ? 'https://apps.apple.com/app/id1234567890'
            : 'https://play.google.com/store/apps/details?id=com.vamo';
        openExternalUrl(storeUrl, 'A loja de aplicativos não está disponível agora.');
    };

    const handleShareApp = async () => {
        haptics.light();
        try {
            await Share.share({
                title: 'VAMO',
                message: 'Conheça a VAMO: um marketplace de roteiros de viagem digitais criados por viajantes experientes. https://vamo.app',
            });
        } catch {
            notify({ title: 'Compartilhar', message: 'Não foi possível abrir o compartilhamento agora.', variant: 'error' });
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
            confirmText: 'Sair da conta',
            cancelText: 'Cancelar',
            action: 'logout',
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
                variant: 'error',
            });
        } finally {
            setLoggingOut(false);
        }
    };

    /**
     * Abre o seletor de imagem e envia para o backend (avatar ou cover).
     * Compressão/crop ficam por conta do próprio expo-image-picker (aspect
     * + quality). O backend reaplica limites e valida o file-signature.
     */
    const pickAndUpload = async (kind: 'avatar' | 'cover') => {
        if (!accessToken) {
            notify({ title: 'Sessão expirada', message: 'Faça login novamente para alterar suas fotos.', variant: 'warning' });
            return;
        }
        const busy = kind === 'avatar' ? avatarUploading : coverUploading;
        if (busy) return;

        // Permissão de galeria (só importa no nativo — web sempre devolve granted).
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
            notify({
                title: 'Permissão necessária',
                message: 'Precisamos de acesso à sua galeria para escolher a foto.',
                variant: 'warning',
            });
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            // 1:1 (quadrado) para o avatar, 3:1 (banner) para a capa.
            aspect: kind === 'avatar' ? [1, 1] : [3, 1],
            // 0.85 dá um equilíbrio razoável entre qualidade e tamanho.
            quality: 0.85,
        });
        if (result.canceled || !result.assets?.[0]?.uri) return;
        const uri = result.assets[0].uri;

        const setBusy = kind === 'avatar' ? setAvatarUploading : setCoverUploading;
        setBusy(true);
        try {
            const upload = kind === 'avatar' ? updateMyAvatar : updateMyCover;
            const data = await upload(uri, accessToken);
            updateUser(kind === 'avatar'
                ? { avatar: data.traveler.avatar }
                : { coverUrl: data.traveler.coverUrl });
            setImageCacheBust((b) => b + 1);
            haptics.success();
            notify({
                title: kind === 'avatar' ? 'Foto de perfil atualizada' : 'Foto de capa atualizada',
                message: kind === 'avatar' ? 'Sua nova foto já está visível no Perfil.' : 'Sua nova capa já está visível no Perfil.',
                variant: 'success',
            });
        } catch (err: any) {
            haptics.error?.();
            notify({
                title: 'Não foi possível atualizar a imagem',
                message: typeof err?.message === 'string' ? err.message : 'Tente novamente em instantes.',
                variant: 'error',
            });
        } finally {
            setBusy(false);
        }
    };

    const handleStatPress = (type: 'itineraries' | 'saved') => {
        haptics.light();
        router.push(type === 'itineraries' ? '/(tabs)/my-trips' : '/(tabs)/saved');
    };

    // Passaporte VAMO — todas as contagens são do PRÓPRIO usuário logado.
    const profileCompleted = passportStats?.profileCompleted ?? !!(user?.name && user?.email && user?.avatar);
    const savedCount = passportStats?.savedCount ?? favorites.length;
    // Maior qualityScore entre os roteiros publicados (active/approved) do criador.
    const maxPublishedQuality = (creatorStats?.itineraries ?? [])
        .filter(it => it.status === 'active' || it.status === 'approved')
        .reduce((max, it) => Math.max(max, Number(it.qualityScore) || 0), 0);
    const travelerProgress = calculateTravelerProgress({
        profileCompleted,
        savedCount,
        cartCount,
        questionsCount: passportStats?.questionsCount ?? 0,
        sharedCount: passportStats?.sharedCount ?? 0,
        reviewsCount: passportStats?.reviewsCount ?? reviewsGivenCount,
        reviewsWithPhotoCount: passportStats?.reviewsWithPhotoCount ?? reviewsWithPhotoCount,
        purchasesCount: passportStats?.purchasesCount ?? purchasedCount ?? 0,
        customizedPurchasedItinerariesCount: passportStats?.customizedPurchasedItinerariesCount ?? 0,
        // Lado criador: usa o agregado do Passaporte quando disponível.
        publishedItinerariesCount: passportStats?.publishedItinerariesCount ?? creatorStats?.publishedItineraries ?? 0,
        approvedItinerariesCount: passportStats?.approvedItinerariesCount ?? creatorStats?.publishedItineraries ?? 0,
        ownItinerarySharesCount: passportStats?.ownItinerarySharesCount ?? 0,
        creatorSalesCount: passportStats?.creatorSalesCount ?? creatorStats?.totalSales ?? 0,
        featuredItinerariesCount: passportStats?.featuredItinerariesCount ?? 0,
        maxPublishedItineraryQualityScore: passportStats?.maxPublishedItineraryQualityScore ?? maxPublishedQuality,
    });

    // Não logado: mostrar tela de login prompt
    if (!isLoading && !isAuthenticated) {
        return (
            <View style={[styles.container, { alignItems: 'center', justifyContent: 'center', padding: 32 }]}>
                <Icon name="circle-user" size={64} color={theme.colors.primary} />
                <Text style={{ fontSize: 22, fontWeight: '800', color: theme.colors.text.primary, marginTop: 20, marginBottom: 8, textAlign: 'center' }}>
                    Bem-vindo à VAMO
                </Text>
                <Text style={{ fontSize: 15, color: theme.colors.text.secondary, textAlign: 'center', lineHeight: 22, marginBottom: 32 }}>
                    Entre para acessar seu perfil, roteiros salvos, carrinho e viagens.
                </Text>
                <TouchableOpacity
                    style={{ backgroundColor: theme.colors.primary, borderRadius: 14, paddingHorizontal: 32, paddingVertical: 14, marginBottom: 12 }}
                    onPress={() => router.push('/login')}
                >
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>Entrar</Text>
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
                {/* ══════════ 1. HEADER (cover + avatar) ══════════ */}
                {/* Sem coverUrl: usa o gradient azul institucional original.
                    Com coverUrl: a Image cobre toda a área e o gradient vira
                    overlay sutil para manter legibilidade do nome/email. */}
                <View style={styles.header}>
                    {user?.coverUrl ? (
                        <>
                            <Image
                                source={{ uri: `${user.coverUrl}?t=${imageCacheBust}` }}
                                style={StyleSheet.absoluteFill}
                                resizeMode="cover"
                            />
                            <LinearGradient
                                colors={['rgba(15,32,67,0.35)', 'rgba(15,32,67,0.65)']}
                                style={StyleSheet.absoluteFill}
                            />
                        </>
                    ) : (
                        <LinearGradient
                            colors={theme.colors.gradients.institutional as unknown as [string, string]}
                            style={StyleSheet.absoluteFill}
                        />
                    )}

                    {/* Botão "alterar capa" no canto sup. direito do header. */}
                    <TouchableOpacity
                        style={styles.editCoverButton}
                        onPress={() => { haptics.light(); pickAndUpload('cover'); }}
                        disabled={coverUploading}
                        accessibilityLabel="Alterar foto de capa"
                    >
                        {coverUploading
                            ? <ActivityIndicator size="small" color="#fff" />
                            : <Icon name="camera" size={14} color="#fff" />}
                        <Text style={styles.editCoverText}>
                            {coverUploading ? 'Enviando…' : (user?.coverUrl ? 'Trocar capa' : 'Adicionar capa')}
                        </Text>
                    </TouchableOpacity>

                    <View style={styles.headerContent}>
                        <View style={styles.avatarContainer}>
                            <View style={styles.avatarCircle}>
                                {user?.avatar ? (
                                    <Image
                                        source={{ uri: `${user.avatar}?t=${imageCacheBust}` }}
                                        style={styles.avatarImage}
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <Icon name="circle-user" size={40} color="#FFFFFF" />
                                )}
                            </View>
                            <TouchableOpacity
                                style={styles.editAvatarButton}
                                onPress={() => { haptics.light(); pickAndUpload('avatar'); }}
                                disabled={avatarUploading}
                                accessibilityLabel="Alterar foto de perfil"
                            >
                                {avatarUploading
                                    ? <ActivityIndicator size="small" color="#fff" />
                                    : <Icon name="edit" size={12} color="#FFF" />}
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.userName}>{user?.name || 'Usuário'}</Text>
                        <Text style={styles.userEmail}>{user?.email || ''}</Text>
                        <View style={styles.sinceBadge}>
                            <Icon name="calendar" size={12} color="rgba(255,255,255,0.8)" />
                            <Text style={styles.sinceText}>Conta VAMO</Text>
                        </View>
                    </View>
                </View>

                {/* ══════════ 2. QUICK STATS (Viajante) — área única ══════════ */}
                {/* Perfil é área geral do usuário: sempre mostra os stats do
                    viajante. Gestão de roteirista vive no Portal (card abaixo). */}
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

                {/* ══════════ CENTRAL DO ROTEIRISTA (card único de entrada) ══════════ */}
                {/* Único ponto de entrada para criação/administração de roteiros
                    no Perfil. Posicionada logo após os atalhos do viajante para
                    ficar visível sem precisar rolar até o fim. O dashboard
                    completo vive em /created-itineraries. */}
                <CreatorPortalEntryCard
                    isCreator={isCreator}
                    stats={creatorStats ? {
                        totalItineraries: creatorStats.totalItineraries,
                        totalSales: creatorStats.totalSales,
                        totalRevenue: creatorStats.totalRevenue,
                    } : null}
                    onEnterPortal={() => { haptics.light(); router.push('/created-itineraries'); }}
                    onCreate={() => {
                        haptics.medium();
                        router.push(isCreator ? '/new-itinerary' : '/become-creator');
                    }}
                />

                {/* ══════════ 3. PASSAPORTE VAMO ══════════ */}
                <View style={styles.sectionSpaced}>
                    <View style={styles.sectionTitleRow}>
                        <Icon name="globe" size={16} color={theme.colors.primary} />
                        <Text style={styles.sectionTitle}>Passaporte VAMO</Text>
                        <Text style={styles.journeyProgress}>{travelerProgress.completedMissions}/{travelerProgress.totalCurrentLevelMissions}</Text>
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
                                {/* Subtítulo dinâmico: varia conforme nível + fase do progresso. */}
                                <Text style={styles.passportLevelDesc} numberOfLines={3}>
                                    {travelerProgress.subtitle}
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

                        {/* Carimbos / missões do nível atual (+ prévia bloqueada do próximo) */}
                        <View style={styles.stampsDivider} />
                        {travelerProgress.missions.map((mission, idx) => {
                            const firstLockedIdx = travelerProgress.missions.findIndex(m => m.locked);
                            const showNextLabel = mission.locked && idx === firstLockedIdx;
                            const isDone = mission.completed && !mission.locked;
                            return (
                                <React.Fragment key={mission.key}>
                                    {showNextLabel && (
                                        <Text style={styles.nextLevelLabel}>Próximo nível</Text>
                                    )}
                                    <View
                                        style={[
                                            styles.milestoneRow,
                                            idx === travelerProgress.missions.length - 1 && styles.milestoneRowLast,
                                            mission.locked && styles.milestoneRowLocked,
                                        ]}
                                    >
                                        {isDone ? (
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
                                                !isDone && styles.milestoneLabelLocked,
                                            ]}>
                                                {mission.label}
                                            </Text>
                                            {!!mission.hint && !isDone && (
                                                <Text style={styles.missionHint} numberOfLines={2}>{mission.hint}</Text>
                                            )}
                                        </View>
                                        <View style={styles.missionRight}>
                                            {/* Progresso X/Y quando há meta numérica e ainda não concluída */}
                                            {typeof mission.target === 'number' && !isDone && (
                                                <Text style={styles.missionProgress}>
                                                    {mission.progress ?? 0}/{mission.target}
                                                </Text>
                                            )}
                                            <Text style={[styles.missionXp, isDone && styles.missionXpDone]}>
                                                +{mission.xp}
                                            </Text>
                                        </View>
                                    </View>
                                </React.Fragment>
                            );
                        })}
                    </View>
                </View>

                {/* ══════════ 4. CONTA ══════════ */}
                <View style={styles.sectionSpaced}>
                    <Text style={styles.sectionTitle}>Conta</Text>
                    <View style={styles.sectionCard}>
                        <SettingItem icon="circle-user" title="Dados pessoais" onPress={() => {
                            haptics.light(); router.push('/account/personal-data');
                        }} />
                        <SettingItem icon="bell" title="Notificações" onPress={() => {
                            haptics.light(); router.push('/account/notifications');
                        }} />
                        <SettingItem icon="shield-check" title="Segurança" onPress={() => {
                            haptics.light(); router.push('/account/security');
                        }} isLast />
                    </View>
                </View>

                {/* ══════════ 5. ABOUT ══════════ */}
                <View style={styles.sectionSpaced}>
                    <Text style={styles.sectionTitle}>Sobre</Text>
                    <View style={styles.sectionCard}>
                        <SettingItem icon="help" title="Como funciona" onPress={() => {
                            haptics.light(); router.push('/how-it-works');
                        }} />
                        <SettingItem icon="info" title="Sobre a VAMO" onPress={() => {
                            haptics.light(); router.push('/about-vamo');
                        }} />
                        <SettingItem icon="message-circle" title="Central de ajuda" onPress={() => {
                            haptics.light(); router.push('/help');
                        }} isLast />
                    </View>
                </View>

                {/* ══════════ RATING ══════════ */}
                <View style={styles.sectionSpaced}>
                    <Text style={styles.sectionTitle}>Avaliação</Text>
                    <View style={styles.sectionCard}>
                        <SettingItem icon="star" title="Avaliar o app" onPress={handleRateApp} />
                        <SettingItem icon="share" title="Compartilhar com amigos" onPress={handleShareApp} isLast />
                    </View>
                </View>

                {/* ══════════ 7. LEGAL ══════════ */}
                <View style={styles.sectionSpaced}>
                    <Text style={styles.sectionTitle}>Jurídico</Text>
                    <View style={styles.sectionCard}>
                        <SettingItem icon="file" title="Termos de Uso" onPress={() => {
                            haptics.light(); openExternalUrl('https://vamo.app/terms', 'Os Termos de Uso não estão disponíveis agora.');
                        }} />
                        <SettingItem icon="shield-check" title="Política de Privacidade" onPress={() => {
                            haptics.light(); openExternalUrl('https://vamo.app/privacy', 'A Política de Privacidade não está disponível agora.');
                        }} />
                        <SettingItem icon="trash" title="Excluir conta" titleColor={theme.colors.error} onPress={async () => {
                            haptics.warning();
                            const ok = await confirm({
                                title: 'Excluir conta?',
                                message: 'Esta ação é permanente. Todos os seus dados serão apagados.',
                                confirmText: 'Excluir conta',
                                action: 'deleteAccount',
                            });
                            if (!ok) return;
                            notify({ title: 'Solicitação enviada', message: 'Sua solicitação de exclusão de conta foi recebida.', variant: 'success' });
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
        overflow: 'hidden',
        // Garante altura mínima quando o cover é uma imagem (sem altura
        // intrínseca por padding interno).
        minHeight: 260,
    },
    headerContent: {
        alignItems: 'center', width: '100%',
    },
    avatarContainer: { position: 'relative', marginBottom: 12 },
    avatarCircle: {
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.25)',
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)',
        overflow: 'hidden',
    },
    avatarImage: { width: '100%', height: '100%' },
    avatarEmoji: { fontSize: 40 },
    editAvatarButton: {
        position: 'absolute', bottom: 0, right: -4,
        width: 26, height: 26, borderRadius: 13,
        backgroundColor: theme.colors.primary,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 2, borderColor: '#FFF',
    },
    editCoverButton: {
        position: 'absolute', top: 14, right: 14,
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: 'rgba(0,0,0,0.42)',
        paddingHorizontal: 12, paddingVertical: 7,
        borderRadius: 18,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
        zIndex: 2,
    },
    editCoverText: {
        fontSize: 12, fontWeight: '600', color: '#fff',
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
    missionRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    missionProgress: {
        fontSize: 11,
        fontWeight: '800',
        color: theme.colors.text.secondary,
        backgroundColor: theme.colors.surfaceLight,
        borderRadius: 8,
        paddingHorizontal: 6,
        paddingVertical: 2,
        overflow: 'hidden',
    },
    missionXp: {
        fontSize: 12,
        fontWeight: '800',
        color: theme.colors.text.tertiary,
    },
    missionXpDone: {
        color: theme.colors.primary,
    },
    // Prévia bloqueada do próximo nível: visual discreto.
    milestoneRowLocked: {
        opacity: 0.55,
    },
    nextLevelLabel: {
        fontSize: 10.5,
        fontWeight: '800',
        color: theme.colors.text.tertiary,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        paddingHorizontal: 16,
        marginTop: 12,
        marginBottom: 2,
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
});
