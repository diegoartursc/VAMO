import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    StatusBar,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { useShareItinerary } from '../../../src/hooks/useShareItinerary';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { safeBack } from '../../../src/utils/navigation';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../src/theme/theme';
import { getItineraryById, getCurrencyRates } from '../../../src/services/api';
import { VerifiedBadge } from '../../../src/components/creator/VerifiedBadge';
import { CreatorAvatar } from '../../../src/components/common/CreatorAvatar';
import { VERIFICATION_CONFIGS, VerificationLevel } from '../../../src/types/creator';
import CollapsibleSection from '../../../src/components/common/CollapsibleSection';
import PremiumReviewsSection from '../../../src/components/reviews/PremiumReviewsSection';
import { haptics } from '../../../src/services/haptics';
import { getReceivedModules, getCategoryChips } from '../../../src/utils/itineraryCardBadges';
import {
    getExperienceStyle,
    getWhyBuyBullets,
    getIdealForBullets,
    getUnlockPreviewCards,
    getBeforeBuyItems,
} from '../../../src/utils/itinerarySales';
import { Icon } from '../../../src/components/common/Icons';
import { CoverCarousel } from '../../../src/components/common/CoverCarousel';
import MediaGallery from '../../../src/components/common/MediaGallery';
import { getCoverImages, getCoverFocalPoint } from '../../../src/utils/itineraryMedia';
import { LinearGradient } from 'expo-linear-gradient';
import FAQSection from '../../../src/components/FAQSection';
import { PurchaseSuccessModal } from '../../../src/components/modals/PurchaseSuccessModal';
import { useFavorites } from '../../../src/hooks/useFavorites';
import { useCart } from '../../../src/hooks/useCart';
import { evaluateItineraryAvailability } from '../../../src/utils/availability';
import { notify } from '../../../src/utils/notify';
import { useAuth } from '../../../src/contexts/AuthContext';
import { useSearchContext } from '../../../src/contexts/SearchContext';
import BudgetSummaryCard from '../../../src/components/dashboard/BudgetSummaryCard';
import PeopleSimulator from '../../../src/components/dashboard/PeopleSimulator';
import {
    InteractiveExperienceSection,
    PostPurchaseConversionBox,
    InteractiveRouteBadge,
} from '../../../src/components/itinerary/InteractiveExperienceSection';
import { PurchaseBenefitsCard } from '../../../src/components/itinerary/PurchaseBenefitsCard';
import { ExperienceSummaryCard } from '../../../src/components/itinerary/ExperienceSummaryCard';
import { TrustStrip, TrustSignal } from '../../../src/components/itinerary/TrustStrip';
import { features } from '../../../src/config/features';
import { getCostReferences, calculateBudgetSummary, formatMoney, getRouteRatingDisplay, getPrimaryBudgetStyle, type CostReferencesGroup } from '@vamo/shared/itinerary';
import BudgetStyleGuideSheet from '../../../src/components/common/BudgetStyleGuideSheet';
import { convertToAud } from '../../../src/utils/currencyConversion';

const { width, height } = Dimensions.get('window');

export default function ItineraryDetailScreen() {
    const { id, showSuccess } = useLocalSearchParams<{ id: string; showSuccess?: string }>();
    const itineraryId = Array.isArray(id) ? id[0] : id;
    const router = useRouter();
    const [itinerary, setItinerary] = useState<any>(null);
    const [budgetHelpOpen, setBudgetHelpOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [showSuccessModal, setShowSuccessModal] = useState(showSuccess === 'true');
    const [currencyRates, setCurrencyRates] = useState<Record<string, number>>({});
    const [peopleCount, setPeopleCount] = useState<number>(1);
    const [cartToast, setCartToast] = useState(false);

    // Compartilhamento: hook é chamado SEMPRE no topo (regra dos hooks); os
    // params dependem de `itinerary` que pode estar nulo no primeiro render,
    // por isso usamos optional chaining + fallback. O CTA só renderiza
    // depois que `itinerary` carrega — não há risco de chamar shareItinerary
    // com dados vazios.
    const { share: shareItinerary, isSharing } = useShareItinerary({
        itineraryId: itineraryId || '',
        title: itinerary?.title || '',
        destination: itinerary?.destination ?? null,
        country: itinerary?.country ?? null,
        allowShare: itinerary?.allowShare !== false,
        isShareable: String(itinerary?.status || '').toUpperCase() === 'ACTIVE',
        surface: 'detail',
        actorRole: 'traveler',
    });
    const { isFavorite, toggleFavorite } = useFavorites();
    const { isInCart, addToCart, isOwned } = useCart();
    const { accessToken } = useAuth();
    const { recordSearchIntent } = useSearchContext();

    const loadItinerary = useCallback(async () => {
        if (!itineraryId) {
            setItinerary(null);
            setLoadError('Roteiro inválido.');
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setLoadError(null);
        try {
            const data = await getItineraryById(itineraryId);
            if (!data) {
                setItinerary(null);
                setLoadError('Roteiro não encontrado ou indisponível.');
                return;
            }
            setItinerary(data);
        } catch (error) {
            console.error('Error loading itinerary:', error);
            setItinerary(null);
            setLoadError('Não foi possível carregar este roteiro agora.');
        } finally {
            setIsLoading(false);
        }
    }, [itineraryId]);

    useEffect(() => {
        loadItinerary();
        getCurrencyRates().then(setCurrencyRates).catch(console.error);
    }, [loadItinerary]);

    // Registra a visualização para alimentar "Continue sua busca" na Home.
    useEffect(() => {
        if (!itinerary?.id) return;
        recordSearchIntent({
            lastViewedIds: [String(itinerary.id)],
            lastCountry: itinerary.country,
            lastCity: itinerary.destination,
            lastCategories: Array.isArray(itinerary.categories) ? itinerary.categories : undefined,
        });
    }, [itinerary?.id, recordSearchIntent]);

    const goBackOrExplore = () => {
        if (router.canGoBack()) {
            safeBack(router, '/(tabs)');
            return;
        }
        router.replace('/(tabs)/itineraries' as any);
    };

    /** Converte um valor para a moeda de referência (AUD) usando as taxas do
     *  admin. Nome honesto: NÃO é BRL. Usa o util compartilhado. */
    const formatInRefCurrency = (value: string | number, currency: string): string => {
        const n = typeof value === 'number' ? value : parseFloat(String(value)) || 0;
        if (n <= 0) return formatMoney(0);
        const aud = convertToAud(n, currency, currencyRates);
        return formatMoney(aud ?? n);
    };

    if (isLoading) {
        return (
            <View style={styles.stateContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.stateTitle}>Carregando roteiro...</Text>
                <Text style={styles.stateText}>Estamos buscando os detalhes, imagens e avaliações deste roteiro digital.</Text>
            </View>
        );
    }

    if (!itinerary) {
        return (
            <View style={styles.stateContainer}>
                <Ionicons name="map-outline" size={42} color={theme.colors.text.tertiary} />
                <Text style={styles.stateTitle}>{loadError || 'Roteiro indisponível'}</Text>
                <Text style={styles.stateText}>
                    Ele pode ter sido removido, pausado ou ainda não estar aprovado para a vitrine.
                </Text>
                <View style={styles.stateActions}>
                    <TouchableOpacity style={styles.stateSecondaryButton} onPress={goBackOrExplore}>
                        <Ionicons name="arrow-back" size={17} color={theme.colors.primary} />
                        <Text style={styles.stateSecondaryText}>Voltar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.statePrimaryButton} onPress={loadItinerary}>
                        <Ionicons name="refresh" size={17} color="#fff" />
                        <Text style={styles.statePrimaryText}>Tentar novamente</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const price = Number(itinerary.price) || 0;
    const duration = Number(itinerary.duration) || 0;
    const rating = Number(itinerary.rating) || 0;
    const reviewCount = Number(itinerary.reviewCount) || 0;
    const creator = itinerary.creator || {};
    const creatorId = creator.id;
    const creatorName = creator.name || 'Criador VAMO';
    const creatorRating = Number(creator.rating) || 0;
    // `creatorSales` agora representa as VENDAS REAIS DESTE ROTEIRO
    // (top-level `itinerary.salesCount` = ItinerarySale.count no backend).
    // Mantém fallback ao `creator.salesCount` (acumulado do criador) pra
    // back-compat com rotas legadas que ainda não foram atualizadas.
    const creatorSales = Number(itinerary.salesCount ?? creator.salesCount) || 0;
    const creatorReputation =
        VERIFICATION_CONFIGS[(creator.verificationLevel || 'basic') as VerificationLevel]
        ?? VERIFICATION_CONFIGS.basic;
    const destinationLabel = [itinerary.destination, itinerary.country].filter(Boolean).join(', ') || 'Destino VAMO';
    const reviews = Array.isArray(itinerary.reviews) ? itinerary.reviews : [];
    const averageReviewRating = reviews.length > 0
        ? Number((reviews.reduce((sum: number, review: any) => sum + (Number(review.rating) || 0), 0) / reviews.length).toFixed(1))
        : rating;
    const reviewPhotos = reviews.flatMap((review: any) => Array.isArray(review.photos) ? review.photos : []);

    const handleGoToMyTrips = () => {
        setShowSuccessModal(false);
        router.push('/(tabs)/my-trips' as any);
    };
    const handleViewPurchasedItinerary = () => {
        setShowSuccessModal(false);
        router.replace(`/purchased-itinerary/${itineraryId}` as any);
    };
    /** Gate central de compra/carrinho: itinerário precisa estar comprável E
     *  o usuário não pode já ser dono. Quando bloqueia, devolve o motivo e
     *  uma intenção sugerida pra UX (login, ir pra meus roteiros, etc.). */
    const purchaseGate = (): { ok: true } | { ok: false; reason: string; intent?: 'view-purchased' } => {
        if (isOwned(itineraryId)) {
            return { ok: false, reason: 'Você já comprou este roteiro.', intent: 'view-purchased' };
        }
        const avail = evaluateItineraryAvailability(itinerary);
        if (!avail.ok) return { ok: false, reason: avail.reason };
        return { ok: true };
    };

    const handleBuyNow = () => {
        // Login gate: usuário deslogado não pode comprar. Redireciona para
        // login com `next` apontando de volta pra esta tela de detalhe.
        if (!accessToken) {
            router.push({ pathname: '/login' as any, params: { next: `/itinerary/${itineraryId}` } });
            return;
        }
        // Disponibilidade + ownership: já-dono vai pra Meus Roteiros, paused/archived
        // mostra motivo. Mesmas regras que a tela do carrinho aplica.
        const gate = purchaseGate();
        if (!gate.ok) {
            if (gate.intent === 'view-purchased') {
                router.replace(`/purchased-itinerary/${itineraryId}` as any);
                return;
            }
            notify({ title: 'Não foi possível comprar agora', message: gate.reason, variant: 'warning' });
            return;
        }
        router.push({
            pathname: `/checkout/itinerary-contact` as any,
            params: {
                itineraryId,
                price: price.toString(),
            },
        });
    };

    const handleToggleFavorite = async () => {
        haptics.light();
        await toggleFavorite(itineraryId);
    };

    const handleAddToCart = async () => {
        haptics.medium();
        if (isInCart(itineraryId)) {
            router.push('/(tabs)/cart' as any);
            return;
        }
        const gate = purchaseGate();
        if (!gate.ok) {
            if (gate.intent === 'view-purchased') {
                router.replace(`/purchased-itinerary/${itineraryId}` as any);
                return;
            }
            notify({ title: 'Não pode entrar no carrinho', message: gate.reason, variant: 'warning' });
            return;
        }
        await addToCart(itineraryId);
        setCartToast(true);
        setTimeout(() => setCartToast(false), 2500);
    };


    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Hero Image */}
                <View style={styles.heroContainer}>
                    <CoverCarousel
                        images={getCoverImages(itinerary)}
                        height={420}
                        focalPoint={getCoverFocalPoint(itinerary)}
                        panEnabled={false}
                    />
                    {/* Bottom gradient for smooth transition to content sheet */}
                    <LinearGradient
                        colors={['transparent', 'rgba(255,255,255,0.15)', 'rgba(255,255,255,0.6)']}
                        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80 }}
                        pointerEvents="none"
                    />

                    {/* Navigation Header with Blur */}
                    <BlurView intensity={80} tint="dark" style={styles.navBlur}>
                        <TouchableOpacity style={styles.backButton} onPress={() => safeBack(router, '/(tabs)')}>
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>
                        <View style={styles.navActions}>
                            <TouchableOpacity
                                style={styles.navIconButton}
                                onPress={handleToggleFavorite}
                            >
                                <Ionicons
                                    name={isFavorite(itineraryId) ? 'heart' : 'heart-outline'}
                                    size={22}
                                    color={isFavorite(itineraryId) ? '#EF4444' : '#fff'}
                                />
                            </TouchableOpacity>
                            {itinerary.allowShare !== false && (
                                <TouchableOpacity
                                    style={styles.navIconButton}
                                    onPress={() => { haptics.light(); shareItinerary(); }}
                                    disabled={isSharing}
                                    accessibilityLabel="Compartilhar roteiro"
                                >
                                    <Ionicons name="share-outline" size={22} color="#fff" />
                                </TouchableOpacity>
                            )}
                        </View>
                    </BlurView>
                </View>

                {/* Content Sheet */}
                <View style={styles.contentSheet}>
                    {/* Creator Badge */}
                    <View style={styles.creatorRow}>
                        <TouchableOpacity
                            style={styles.creatorBadge}
                            activeOpacity={creatorId ? 0.85 : 1}
                            disabled={!creatorId}
                            accessibilityLabel={`Ver perfil de ${creatorName}`}
                            onPress={() => creatorId && router.push(`/creator/${creatorId}` as any)}
                        >
                            <CreatorAvatar creator={creator} name={creatorName} size={40} style={styles.creatorAvatarCircle} />
                            <View>
                                <View style={styles.creatorNameRow}>
                                    <Text style={styles.creatorName}>{creatorName}</Text>
                                    <VerifiedBadge level={creator.verificationLevel || 'basic'} size="small" showLabel={false} />
                                </View>
                                <View style={styles.creatorStatsRow}>
                                    <Icon name="star" size={11} color="#F59E0B" strokeWidth={2.5} />
                                    <Text style={styles.creatorStats}>
                                        {creatorRating.toFixed(1)} · {creatorSales.toLocaleString('pt-BR')} vendas
                                    </Text>
                                </View>
                            </View>
                        </TouchableOpacity>

                        {/* Creator Verification Link */}
                        <TouchableOpacity
                            style={styles.verificationLink}
                            onPress={() => router.push('/verification-explained' as any)}
                        >
                            <Ionicons name="shield-checkmark" size={16} color={theme.colors.verified} />
                            <Text style={styles.verificationLinkText}>Como verificamos os criadores</Text>
                            <Ionicons name="chevron-forward" size={16} color={theme.colors.text.tertiary} />
                        </TouchableOpacity>
                    </View>

                    {/* Title & Location */}
                    <Text style={styles.title}>{itinerary.title}</Text>
                    <View style={[styles.locationRow, { flexWrap: 'wrap', gap: 10 }]}>
                        {(() => {
                            const parts: string[] = [];
                            // Main location
                            if (itinerary.country && itinerary.destination) parts.push(`${itinerary.country} (${itinerary.destination})`);
                            else if (itinerary.country) parts.push(itinerary.country);
                            else if (itinerary.destination) parts.push(itinerary.destination);
                            // Structured extra locations (new format)
                            if (itinerary.locations && Array.isArray(itinerary.locations) && itinerary.locations.length > 0) {
                                itinerary.locations.forEach((loc: { country: string; cities: string[] }) => {
                                    if (!loc.country && (!loc.cities || loc.cities.length === 0)) return;
                                    const citiesStr = (loc.cities || []).filter(Boolean).join(", ");
                                    if (loc.country && citiesStr) parts.push(`${loc.country} (${citiesStr})`);
                                    else if (loc.country) parts.push(loc.country);
                                    else if (citiesStr) parts.push(citiesStr);
                                });
                            } else {
                                // Legacy flat arrays fallback
                                const maxLen = Math.max((itinerary.extraCountries || []).length, (itinerary.extraCities || []).length);
                                for (let i = 0; i < maxLen; i++) {
                                    const c = (itinerary.extraCountries || [])[i];
                                    const d = (itinerary.extraCities || [])[i];
                                    if (c && d) parts.push(`${c} (${d})`);
                                    else if (c) parts.push(c);
                                    else if (d) parts.push(d);
                                }
                            }
                            return parts.map((part, index) => (
                                <View key={index} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                    <Ionicons name="location" size={16} color={theme.colors.primary} />
                                    <Text style={styles.location}>{part}</Text>
                                </View>
                            ));
                        })()}
                    </View>

                    {/* Stats Row */}
                    <View style={styles.statsCard}>
                        <View style={styles.statItem}>
                            {(() => {
                                const rd = getRouteRatingDisplay({
                                    averageRating: averageReviewRating ?? rating,
                                    reviewCount,
                                });
                                const muted = rd.type === 'new';
                                return (
                                    <>
                                        <Icon
                                            name="star"
                                            size={16}
                                            color={muted ? theme.colors.text.tertiary : '#F59E0B'}
                                            strokeWidth={2.5}
                                        />
                                        <Text style={styles.statText}>{rd.label}</Text>
                                        {rd.type === 'rating' && (
                                            <Text style={styles.statLabel}>({rd.reviewCount})</Text>
                                        )}
                                    </>
                                );
                            })()}
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Icon name="calendar" size={16} color={theme.colors.primary} />
                            <Text style={styles.statText}>{duration} dias</Text>
                        </View>
                    </View>

                    {/* Badge: roteiro interativo */}
                    {features.interactivePurchasedRouteEnabled && (
                        <View style={{ marginBottom: theme.spacing.md }}>
                            <InteractiveRouteBadge />
                        </View>
                    )}

                    {/* Price & CTA — card de compra com 2 linhas claras
                        Linha 1: preço + parcelamento
                        Linha 2: [Adicionar ao carrinho] [Comprar agora] */}
                    <LinearGradient
                        colors={['#1A3263', '#162A55']}
                        style={styles.priceSection}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <View style={styles.priceInfo}>
                            <Text style={styles.priceLabelText}>Roteiro completo</Text>
                            <View style={styles.priceRow}>
                                <Text style={styles.priceSymbolText}>A$</Text>
                                <Text style={styles.priceValueText}>
                                    {price.toFixed(2).replace('.', ',')}
                                </Text>
                            </View>
                            <Text style={styles.priceInstallment}>
                                Em até 12x de {formatMoney(price / 12)} sem juros
                            </Text>
                            <View style={styles.priceMeta}>
                                <Ionicons name="flash" size={12} color="#28C9BF" />
                                <Text style={styles.priceMetaText}>Acesso imediato após a compra</Text>
                            </View>
                        </View>

                        <View style={styles.purchaseActions}>
                            {/* Adicionar ao carrinho / No carrinho */}
                            <TouchableOpacity
                                style={[styles.cartCtaWide, isInCart(itineraryId) && styles.cartCtaWideActive]}
                                onPress={handleAddToCart}
                                activeOpacity={0.85}
                                accessibilityLabel={isInCart(itineraryId) ? 'No carrinho' : 'Adicionar ao carrinho'}
                            >
                                <Icon
                                    name={isInCart(itineraryId) ? 'verified' : 'shopping-cart'}
                                    size={18}
                                    color={isInCart(itineraryId) ? '#28C9BF' : '#FFFFFF'}
                                />
                                <Text style={[styles.cartCtaWideText, isInCart(itineraryId) && styles.cartCtaWideTextActive]}>
                                    {isInCart(itineraryId) ? 'No carrinho' : 'Adicionar'}
                                </Text>
                            </TouchableOpacity>

                            {/* Comprar Agora — CTA primário */}
                            <TouchableOpacity
                                style={styles.buyButton}
                                onPress={handleBuyNow}
                                activeOpacity={0.85}
                            >
                                <Text style={styles.buyButtonText}>Comprar agora</Text>
                                <Icon name="chevron-right" size={16} color="#fff" strokeWidth={2.5} />
                            </TouchableOpacity>
                        </View>
                    </LinearGradient>

                    {/* Toast carrinho adicionado */}
                    {cartToast && (
                        <View style={styles.cartToast}>
                            <Ionicons name="cart-outline" size={16} color="#fff" />
                            <Text style={styles.cartToastText}>Adicionado ao carrinho!</Text>
                        </View>
                    )}

                    {/* Reforço de conversão perto do botão de compra */}
                    {features.interactivePurchasedRouteEnabled && <PostPurchaseConversionBox />}

                    {/* O que você recebe — consolida produto digital + salvo na conta */}
                    <PurchaseBenefitsCard lifetimeAccess={!!itinerary.lifetimeAccess} />

                    {/* Resumo da experiência — estilo + categorias, compacto */}
                    {(() => {
                        const expStyle = getExperienceStyle(itinerary);
                        const categoryChips = getCategoryChips(itinerary);
                        return (
                            <ExperienceSummaryCard
                                styleLabel={expStyle?.label}
                                styleBlurb={expStyle?.blurb}
                                categories={categoryChips}
                                onOpenStyleGuide={() => setBudgetHelpOpen(true)}
                            />
                        );
                    })()}

                    {/* Referência de custos (premium) + simulador + faixa de confiança */}
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
                        const trustItems: TrustSignal[] = [
                            { icon: 'shield-checkmark', label: 'Roteirista verificado' },
                            { icon: 'flash', label: 'Acesso imediato' },
                        ];
                        if (summary.informedItemsCount > 0) {
                            trustItems.push({ icon: 'wallet-outline', label: 'Custos informados' });
                        }
                        return (
                            <>
                                <BudgetSummaryCard
                                    form={costForm as any}
                                    summary={summary}
                                    variant="public"
                                    emphasis="premium"
                                    hideWhenEmpty
                                />
                                <PeopleSimulator
                                    totalPerPerson={summary.totalInformed}
                                    currency={summary.currency}
                                    value={peopleCount}
                                    onChange={setPeopleCount}
                                />
                                <TrustStrip items={trustItems} />
                            </>
                        );
                    })()}

                    {/* Referência de Gastos por Pessoa — agregação por módulo */}
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

                        const MODULE_ICONS: Record<CostReferencesGroup['moduleKey'], any> = {
                            voo: 'plane',
                            hospedagem: 'hotel',
                            passeios: 'compass',
                            transporte: 'car',
                            restaurantes: 'utensils',
                            gastos_extras: 'star',
                        };

                        return (
                            <CollapsibleSection title="Referência de Gastos por Pessoa" defaultExpanded={false}>
                                {costGroups.map(group => (
                                    <View key={group.moduleKey} style={{ marginBottom: 12 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                                            <Icon name={MODULE_ICONS[group.moduleKey]} size={14} color={theme.colors.primary} />
                                            <Text style={{ fontSize: 13, fontWeight: '700', color: theme.colors.text.primary }}>
                                                {group.moduleLabel}
                                            </Text>
                                        </View>
                                        {group.items.map((item, idx) => {
                                            const isVerified = item.disclosureType === 'verified';
                                            const proofOk = item.hasProof && (item.proofStatus === 'uploaded' || item.proofStatus === 'pending_review' || item.proofStatus === 'approved');
                                            const showVerifiedBadge = isVerified && proofOk;
                                            const isShared = item.sharedByPeople > 1;
                                            return (
                                                <View key={idx} style={styles.breakdownItem}>
                                                    <View style={styles.breakdownContent}>
                                                        <Text style={styles.breakdownCategory}>{item.title}</Text>
                                                        <Text style={styles.breakdownDescription}>
                                                            <Text style={{ fontWeight: '700' }}>{formatMoney(item.amountPerPerson, item.currency)}</Text>
                                                            {' por pessoa'}
                                                            {item.currency !== 'AUD' && (
                                                                <Text> ≈ {formatInRefCurrency(item.amountPerPerson, item.currency)}</Text>
                                                            )}
                                                        </Text>
                                                        {isShared && (
                                                            <Text style={[styles.breakdownDescription, { fontSize: 11, color: theme.colors.text.tertiary, marginTop: 2 }]}>
                                                                Base: {formatMoney(item.amountTotal, item.currency)} total ÷ {item.sharedByPeople} pessoas
                                                            </Text>
                                                        )}
                                                        {!isShared && (
                                                            <Text style={[styles.breakdownDescription, { fontSize: 11, color: theme.colors.text.tertiary, marginTop: 2 }]}>
                                                                Gasto individual
                                                            </Text>
                                                        )}
                                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
                                                            <Ionicons
                                                                name={showVerifiedBadge ? 'shield-checkmark' : 'pricetag-outline'}
                                                                size={11}
                                                                color={showVerifiedBadge ? theme.colors.verified : theme.colors.info}
                                                            />
                                                            <Text style={{ fontSize: 11, color: showVerifiedBadge ? theme.colors.verified : theme.colors.info, fontWeight: '600' }}>
                                                                {showVerifiedBadge ? 'Valor comprovado' : 'Valor estimado'}
                                                            </Text>
                                                            {showVerifiedBadge && item.proofStatus === 'approved' && (
                                                                <Text style={{ fontSize: 11, color: theme.colors.verified, fontWeight: '600' }}>
                                                                    {' · '}Comprovante aprovado pela VAMO
                                                                </Text>
                                                            )}
                                                        </View>
                                                    </View>
                                                </View>
                                            );
                                        })}
                                    </View>
                                ))}
                                <View style={styles.spendingDisclaimer}>
                                    <Icon name="info" size={15} color={theme.colors.text.tertiary} />
                                    <Text style={styles.disclaimerText}>
                                        Valores informados pelo criador como referência. Podem variar por época, câmbio e disponibilidade.
                                    </Text>
                                </View>
                            </CollapsibleSection>
                        );
                    })()}

                    {/* Sobre o Roteiro */}
                    <CollapsibleSection title="Sobre o Roteiro" defaultExpanded>
                        <Text style={styles.description}>{itinerary.description}</Text>
                    </CollapsibleSection>

                    {/* Fotos e Vídeos da Viagem (highlightPhotos + images + mediaUrls) */}
                    <MediaGallery itinerary={itinerary} />

                    {/* Por que comprar este roteiro? */}
                    {(() => {
                        const bullets = getWhyBuyBullets(itinerary);
                        if (bullets.length === 0) return null;
                        return (
                            <View style={styles.whyBuyCard}>
                                <View style={styles.whyBuyHeader}>
                                    <Ionicons name="ribbon" size={18} color={theme.colors.primary} />
                                    <Text style={styles.whyBuyTitle}>Por que comprar este roteiro?</Text>
                                </View>
                                <View style={styles.whyBuyList}>
                                    {bullets.map((text, i) => (
                                        <View key={i} style={styles.whyBuyItem}>
                                            <View style={styles.whyBuyDot}>
                                                <Ionicons name="checkmark" size={11} color="#fff" />
                                            </View>
                                            <Text style={styles.whyBuyText}>{text}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        );
                    })()}

                    {/* Destaques */}
                    {itinerary.highlights && itinerary.highlights.length > 0 && (
                        <CollapsibleSection title="Destaques da viagem" defaultExpanded>
                            <View style={styles.highlightsContainer}>
                                {itinerary.highlights.map((highlight: any, index: number) => (
                                    <View key={index} style={styles.highlightRow}>
                                        <View style={styles.checkIcon}>
                                            <Ionicons name="checkmark" size={12} color="#fff" />
                                        </View>
                                        <Text style={styles.highlightText}>{highlight}</Text>
                                    </View>
                                ))}
                            </View>
                        </CollapsibleSection>
                    )}

                    {/* Depois da compra, este roteiro vira sua central de viagem */}
                    {features.interactivePurchasedRouteEnabled && <InteractiveExperienceSection />}

                    {/* O que você vai receber — apenas módulos ativos E preenchidos no roteiro real */}
                    {(() => {
                        const receivedModules = getReceivedModules(itinerary);
                        if (receivedModules.length === 0) return null;
                        return (
                            <CollapsibleSection title="O que você vai receber" defaultExpanded>
                                <Text style={styles.inclusionsIntro}>
                                    Ao comprar este roteiro, você terá acesso a:
                                </Text>

                                <View style={styles.inclusionsList}>
                                    {receivedModules.map((item) => (
                                        <View key={item.key} style={styles.inclusionItem}>
                                            <View style={[styles.inclusionIcon, { backgroundColor: item.bgColor }]}>
                                                <Icon name={item.icon} size={24} color={item.iconColor} />
                                            </View>
                                            <View style={styles.inclusionContent}>
                                                <Text style={styles.inclusionTitle}>{item.title}</Text>
                                                <Text style={styles.inclusionDesc}>
                                                    {item.description}
                                                </Text>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            </CollapsibleSection>
                        );
                    })()}

                    {/* Prévia do que você vai desbloquear */}
                    {(() => {
                        const cards = getUnlockPreviewCards(itinerary);
                        if (cards.length === 0) return null;
                        return (
                            <View style={styles.unlockSection}>
                                <View style={styles.unlockHeader}>
                                    <Ionicons name="lock-closed" size={16} color={theme.colors.primary} />
                                    <Text style={styles.unlockTitle}>Prévia do que você vai desbloquear</Text>
                                </View>
                                <Text style={styles.unlockSubtitle}>
                                    Conteúdo completo liberado em Meus Roteiros após a compra.
                                </Text>
                                <View style={styles.unlockGrid}>
                                    {cards.map((card) => (
                                        <View key={card.key} style={styles.unlockCard}>
                                            <View style={styles.unlockIconBox}>
                                                <Icon name={card.icon} size={18} color={theme.colors.primaryDark} />
                                            </View>
                                            <Text style={styles.unlockCardTitle} numberOfLines={2}>{card.title}</Text>
                                            <Text style={styles.unlockCardSub} numberOfLines={2}>{card.subtitle}</Text>
                                            <View style={styles.unlockLockRow}>
                                                <Ionicons name="lock-closed" size={11} color={theme.colors.text.tertiary} />
                                                <Text style={styles.unlockLockText}>Após a compra</Text>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        );
                    })()}

                    {/* Como você vai receber */}
                    <CollapsibleSection title="Como você vai receber">
                        <View style={styles.howReceiveContainer}>
                            <View style={styles.howReceiveStep}>
                                <View style={styles.howReceiveIconBox}>
                                    <Ionicons name="cart-outline" size={22} color={theme.colors.primary} />
                                </View>
                                <View style={styles.howReceiveContent}>
                                    <Text style={styles.howReceiveStepTitle}>1. Compre o roteiro</Text>
                                    <Text style={styles.howReceiveStepDesc}>Pagamento seguro e acesso imediato após a confirmação</Text>
                                </View>
                            </View>
                            <View style={styles.howReceiveLine} />
                            <View style={styles.howReceiveStep}>
                                <View style={styles.howReceiveIconBox}>
                                    <Ionicons name="phone-portrait-outline" size={22} color={theme.colors.primary} />
                                </View>
                                <View style={styles.howReceiveContent}>
                                    <Text style={styles.howReceiveStepTitle}>2. Acesse pelo app</Text>
                                    <Text style={styles.howReceiveStepDesc}>Seu roteiro aparece em Meus Roteiros instantaneamente</Text>
                                </View>
                            </View>
                            <View style={styles.howReceiveLine} />
                            <View style={styles.howReceiveStep}>
                                <View style={styles.howReceiveIconBox}>
                                    <Ionicons name="document-text-outline" size={22} color={theme.colors.primary} />
                                </View>
                                <View style={styles.howReceiveContent}>
                                    <Text style={styles.howReceiveStepTitle}>3. Salve em PDF</Text>
                                    <Text style={styles.howReceiveStepDesc}>Depois da compra, exporte o roteiro em PDF para consultar fora da VAMO</Text>
                                </View>
                            </View>
                            <View style={styles.howReceiveLine} />
                            <View style={styles.howReceiveStep}>
                                <View style={styles.howReceiveIconBox}>
                                    <Ionicons name="infinite-outline" size={22} color={theme.colors.primary} />
                                </View>
                                <View style={styles.howReceiveContent}>
                                    <Text style={styles.howReceiveStepTitle}>
                                        {itinerary.lifetimeAccess ? '4. Acesso permanente' : '4. Conteúdo salvo na conta'}
                                    </Text>
                                    <Text style={styles.howReceiveStepDesc}>
                                        {itinerary.lifetimeAccess
                                            ? 'Consulte o roteiro quando quiser, quantas vezes precisar'
                                            : 'Consulte o roteiro pelo app sempre que estiver logado na sua conta'}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </CollapsibleSection>

                    {/* Para quem é este roteiro */}
                    {(() => {
                        const bullets = getIdealForBullets(itinerary);
                        if (bullets.length === 0) return null;
                        return (
                            <View style={styles.idealForCard}>
                                <View style={styles.idealForHeader}>
                                    <Ionicons name="people-circle-outline" size={20} color={theme.colors.primaryDark} />
                                    <Text style={styles.idealForTitle}>Para quem é este roteiro</Text>
                                </View>
                                <Text style={styles.idealForIntro}>Este roteiro é ideal para quem busca:</Text>
                                <View style={styles.idealForList}>
                                    {bullets.map((b, i) => (
                                        <View key={i} style={styles.idealForItem}>
                                            <View style={styles.idealForBullet} />
                                            <Text style={styles.idealForText}>{b}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        );
                    })()}

                    {/* Perguntas Frequentes */}
                    <FAQSection
                        itineraryId={itineraryId}
                        creatorName={creatorName}
                        creatorId={creator?.id}
                    />

                    {/* Premium Reviews Section */}
                    {reviews.length > 0 && (
                        <View style={styles.reviewsSection}>
                            <PremiumReviewsSection
                                reviews={reviews}
                                averageRating={averageReviewRating}
                                totalReviews={reviews.length}
                                communityPhotos={reviewPhotos}
                                topRatedSummary="Avaliações de viajantes que compraram este roteiro"
                            />
                        </View>
                    )}

                    {/* Trust Info */}
                    <View style={styles.trustBox}>
                        <Ionicons name="shield-checkmark" size={24} color={theme.colors.verified} />
                        <View style={styles.trustContent}>
                            <Text style={styles.trustTitle}>{creatorReputation.label}</Text>
                            <Text style={styles.trustText}>
                                {creatorName} tem {creatorReputation.description.toLowerCase()}
                                {creatorSales > 0 ? ` e ${creatorSales.toLocaleString('pt-BR')} roteiro${creatorSales === 1 ? '' : 's'} vendido${creatorSales === 1 ? '' : 's'}` : ''}.
                            </Text>
                        </View>
                    </View>

                    {/* Antes de comprar, saiba */}
                    <View style={styles.beforeBuyBox}>
                        <View style={styles.beforeBuyHeader}>
                            <Ionicons name="information-circle-outline" size={18} color={theme.colors.text.primary} />
                            <Text style={styles.beforeBuyTitle}>Antes de comprar, saiba</Text>
                        </View>
                        <View style={styles.beforeBuyList}>
                            {getBeforeBuyItems(itinerary).map((item, i) => (
                                <View key={i} style={styles.beforeBuyItem}>
                                    <Icon name={item.icon} size={15} color={theme.colors.text.secondary} />
                                    <Text style={styles.beforeBuyItemText}>{item.text}</Text>
                                </View>
                            ))}
                        </View>
                        <Text style={styles.beforeBuyDisclaimer}>
                            Os valores são referências informadas pelo criador e podem variar conforme data, temporada, câmbio, disponibilidade e estilo de consumo.
                        </Text>
                    </View>

                    <View style={{ height: 100 }} />
                </View>
            </ScrollView>

            {/* Purchase Success Modal */}
            <PurchaseSuccessModal
                visible={showSuccessModal}
                onClose={() => setShowSuccessModal(false)}
                onGoToMyTrips={handleGoToMyTrips}
                onViewItinerary={handleViewPurchasedItinerary}
                itineraryTitle={itinerary.title}
            />

            {/* Critérios da VAMO para o estilo de orçamento */}
            <BudgetStyleGuideSheet
                visible={budgetHelpOpen}
                onClose={() => setBudgetHelpOpen(false)}
                highlightKey={getPrimaryBudgetStyle(itinerary?.travelStyles)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    scrollView: {
        flex: 1,
    },
    heroContainer: {
        height: 420,
        position: 'relative',
    },
    heroImage: {
        width: '100%',
        height: '100%',
    },
    navBlur: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: Platform.OS === 'ios' ? 50 : 20,
        paddingBottom: 12,
        paddingHorizontal: 16,
        overflow: 'hidden',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    navActions: {
        flexDirection: 'row',
        gap: 8,
    },
    navIconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    shareButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    contentSheet: {
        backgroundColor: theme.colors.background,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        marginTop: -24,
        paddingTop: 24,
        paddingHorizontal: 20,
    },
    creatorRow: {
        marginBottom: 20,
    },
    creatorBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 16,
        alignSelf: 'flex-start',
        gap: 12,
        ...theme.shadows.small,
    },
    creatorAvatarCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: theme.colors.primary + '15',
        alignItems: 'center',
        justifyContent: 'center',
    },
    creatorNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    creatorName: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    creatorStats: {
        fontSize: 12,
        color: theme.colors.text.secondary,
        marginTop: 2,
    },
    creatorStatsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 2,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: 8,
        lineHeight: 36,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 16,
    },
    location: {
        fontSize: 16,
        color: theme.colors.text.secondary,
    },
    statsCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surfaceLight,
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 20,
        marginBottom: 20,
        gap: 0,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    statDivider: {
        width: 1,
        height: 28,
        backgroundColor: theme.colors.border,
        marginHorizontal: 16,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    statLabel: {
        fontSize: 13,
        color: theme.colors.text.secondary,
    },
    priceSection: {
        flexDirection: 'column',
        backgroundColor: theme.colors.surface,
        padding: 18,
        borderRadius: 18,
        marginBottom: 24,
        gap: 14,
        ...theme.shadows.medium,
    },
    priceInfo: {
        gap: 4,
    },
    priceLabelText: {
        fontSize: 12,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.65)',
        textTransform: 'uppercase',
        letterSpacing: 0.6,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 4,
        marginTop: 2,
    },
    priceSymbolText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#28C9BF',
    },
    priceValueText: {
        fontSize: 32,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: -0.8,
    },
    priceInstallment: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.78)',
        fontWeight: '500',
        marginTop: 2,
    },
    priceMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 6,
    },
    priceMetaText: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.6)',
    },
    purchaseActions: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 4,
    },
    // Botão "Adicionar" — secundário, outline branca
    cartCtaWide: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 13,
        borderRadius: 999,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.28)',
        backgroundColor: 'rgba(255,255,255,0.08)',
        minHeight: 48,
        minWidth: 130,
    },
    cartCtaWideActive: {
        borderColor: '#28C9BF',
        backgroundColor: 'rgba(40,201,191,0.18)',
    },
    cartCtaWideText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: -0.1,
    },
    cartCtaWideTextActive: {
        color: '#28C9BF',
    },
    // Botão "Comprar agora" — primário teal, ocupa o resto da linha
    buyButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 18,
        paddingVertical: 13,
        borderRadius: 999,
        minHeight: 48,
        ...theme.shadows.button,
    },
    buyButtonText: {
        fontSize: 15,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: -0.2,
    },
    cartToast: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#1A3263',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        marginBottom: 12,
        alignSelf: 'center',
    },
    cartToastText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#fff',
    },
    description: {
        fontSize: 15,
        color: theme.colors.text.primary,
        lineHeight: 22,
    },
    inclusionsIntro: {
        fontSize: 14,
        color: theme.colors.text.secondary,
        lineHeight: 20,
        marginBottom: 20,
    },
    inclusionsList: {
        gap: 16,
    },
    inclusionItem: {
        flexDirection: 'row',
        gap: 12,
    },
    inclusionIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    inclusionContent: {
        flex: 1,
    },
    inclusionTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.colors.text.primary,
        marginBottom: 4,
    },
    inclusionDesc: {
        fontSize: 13,
        color: theme.colors.text.secondary,
        lineHeight: 18,
    },

    // Spending Estimate Styles
    spendingTotalCard: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
    },
    spendingTotalLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.65)',
        fontWeight: '500',
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    spendingTotalRange: {
        fontSize: 26,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: -0.5,
    },
    flightDepartureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginTop: 8,
    },
    flightDepartureText: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.75)',
        fontWeight: '500',
    },
    spendingTotalNote: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.4)',
        marginTop: 10,
        fontStyle: 'italic',
    },
    spendingBreakdown: {
        gap: 10,
        marginBottom: 16,
    },
    breakdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: theme.colors.surfaceLight,
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    breakdownIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: theme.colors.primary + '12',
        alignItems: 'center',
        justifyContent: 'center',
    },
    breakdownContent: {
        flex: 1,
    },
    breakdownCategory: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: 2,
    },
    breakdownDescription: {
        fontSize: 12,
        color: theme.colors.text.secondary,
        lineHeight: 16,
    },
    breakdownAmountBadge: {
        backgroundColor: theme.colors.primary + '15',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    breakdownAmount: {
        fontSize: 13,
        fontWeight: '700',
        color: theme.colors.primary,
    },
    spendingDisclaimer: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'flex-start',
        backgroundColor: theme.colors.surfaceLight,
        padding: 12,
        borderRadius: 10,
        marginTop: 4,
    },
    disclaimerText: {
        flex: 1,
        fontSize: 12,
        color: theme.colors.text.tertiary,
        lineHeight: 17,
    },

    // Highlights Styles
    highlightsContainer: {
        gap: 12,
        paddingVertical: 8,
    },
    highlightRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    checkIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: theme.colors.success,
        alignItems: 'center',
        justifyContent: 'center',
    },
    highlightText: {
        fontSize: 15,
        color: theme.colors.text.primary,
        flex: 1,
    },

    reviewsSection: {
        marginTop: 24,
    },
    verificationLink: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 4,
        marginTop: 12,
    },
    verificationLinkText: {
        flex: 1,
        fontSize: 13,
        color: theme.colors.verified,
        fontWeight: '500',
    },
    trustBox: {
        flexDirection: 'row',
        gap: 12,
        backgroundColor: `${theme.colors.primary}08`,
        padding: 16,
        borderRadius: 12,
        marginTop: 16,
        borderWidth: 1,
        borderColor: `${theme.colors.primary}20`,
        borderLeftWidth: 3,
        borderLeftColor: theme.colors.primary,
    },
    trustContent: {
        flex: 1,
    },
    trustTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text.primary,
        marginBottom: 4,
    },
    trustText: {
        fontSize: 13,
        color: theme.colors.text.secondary,
        lineHeight: 18,
    },
    errorText: {
        fontSize: 16,
        color: theme.colors.error,
        textAlign: 'center',
    },
    stateContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 28,
        backgroundColor: theme.colors.background,
    },
    stateTitle: {
        marginTop: 14,
        fontSize: 18,
        fontWeight: '800',
        color: theme.colors.text.primary,
        textAlign: 'center',
    },
    stateText: {
        marginTop: 8,
        fontSize: 14,
        lineHeight: 20,
        color: theme.colors.text.secondary,
        textAlign: 'center',
    },
    stateActions: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 22,
    },
    statePrimaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        minHeight: 44,
        paddingHorizontal: 16,
        borderRadius: 999,
        backgroundColor: theme.colors.primary,
    },
    statePrimaryText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#fff',
    },
    stateSecondaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        minHeight: 44,
        paddingHorizontal: 16,
        borderRadius: 999,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    stateSecondaryText: {
        fontSize: 13,
        fontWeight: '800',
        color: theme.colors.primary,
    },

    // Disclaimer Box (detailed section)
    disclaimerBox: {
        backgroundColor: theme.colors.surfaceLight,
        borderRadius: 12,
        padding: 16,
        marginTop: 20,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    disclaimerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 14,
    },
    disclaimerTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text.secondary,
    },
    disclaimerItems: {
        gap: 12,
    },
    disclaimerItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
    },
    disclaimerBullet: {
        fontSize: 14,
        marginTop: 1,
    },
    disclaimerItemText: {
        flex: 1,
        fontSize: 13,
        color: theme.colors.text.secondary,
        lineHeight: 19,
    },
    disclaimerItemBold: {
        fontWeight: '600',
        color: theme.colors.text.primary,
    },

    // ── How Receive
    howReceiveContainer: { paddingVertical: 4 },
    howReceiveStep: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
    howReceiveIconBox: {
        width: 44, height: 44, borderRadius: 12,
        backgroundColor: theme.colors.primary + '12',
        alignItems: 'center', justifyContent: 'center',
    },
    howReceiveContent: { flex: 1, paddingTop: 2 },
    howReceiveStepTitle: { fontSize: 14, fontWeight: '700', color: theme.colors.text.primary, marginBottom: 2 },
    howReceiveStepDesc: { fontSize: 13, color: theme.colors.text.secondary, lineHeight: 19 },
    howReceiveLine: { width: 2, height: 16, backgroundColor: theme.colors.primary + '25', marginLeft: 21 },

    // ── Why buy
    whyBuyCard: {
        marginBottom: 16,
        padding: 16,
        backgroundColor: theme.colors.surface,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    whyBuyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    whyBuyTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: theme.colors.text.primary,
    },
    whyBuyList: {
        gap: 10,
    },
    whyBuyItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
    },
    whyBuyDot: {
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: theme.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 1,
    },
    whyBuyText: {
        flex: 1,
        fontSize: 13.5,
        lineHeight: 19,
        color: theme.colors.text.primary,
    },

    // ── Unlock preview
    unlockSection: {
        marginBottom: 16,
        padding: 16,
        backgroundColor: theme.colors.surfaceLight,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    unlockHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    unlockTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: theme.colors.text.primary,
    },
    unlockSubtitle: {
        fontSize: 12,
        color: theme.colors.text.secondary,
        marginBottom: 12,
    },
    unlockGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    unlockCard: {
        width: '48%',
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    unlockIconBox: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: `${theme.colors.primary}1A`,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    unlockCardTitle: {
        fontSize: 13,
        fontWeight: '800',
        color: theme.colors.text.primary,
        marginBottom: 3,
    },
    unlockCardSub: {
        fontSize: 11.5,
        color: theme.colors.text.secondary,
        lineHeight: 15,
        marginBottom: 8,
    },
    unlockLockRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    unlockLockText: {
        fontSize: 10.5,
        color: theme.colors.text.tertiary,
        fontWeight: '600',
    },

    // ── Para quem é este roteiro
    idealForCard: {
        marginBottom: 16,
        padding: 16,
        backgroundColor: theme.colors.surface,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    idealForHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 6,
    },
    idealForTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: theme.colors.text.primary,
    },
    idealForIntro: {
        fontSize: 13,
        color: theme.colors.text.secondary,
        marginBottom: 10,
    },
    idealForList: {
        gap: 8,
    },
    idealForItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
    },
    idealForBullet: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginTop: 7,
        backgroundColor: theme.colors.primary,
    },
    idealForText: {
        flex: 1,
        fontSize: 13.5,
        lineHeight: 19,
        color: theme.colors.text.primary,
    },

    // ── Antes de comprar saiba
    beforeBuyBox: {
        marginBottom: 16,
        padding: 16,
        backgroundColor: theme.colors.surfaceLight,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    beforeBuyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    beforeBuyTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: theme.colors.text.primary,
    },
    beforeBuyList: {
        gap: 10,
    },
    beforeBuyItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
    },
    beforeBuyItemText: {
        flex: 1,
        fontSize: 12.5,
        lineHeight: 17,
        color: theme.colors.text.secondary,
    },
    beforeBuyDisclaimer: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: theme.colors.borderLight,
        fontSize: 11,
        lineHeight: 15,
        color: theme.colors.text.tertiary,
        fontStyle: 'italic',
    },
});
