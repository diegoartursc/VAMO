import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    Dimensions,
    StatusBar,
    Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../src/theme/theme';
import { getItineraryById, getCurrencyRates } from '../../../src/services/api';
import { getReviewsByPackageId, getAverageRating, getCategoryRatings, getCommunityPhotos, getTopRatedCategoriesText } from '../../../src/data/mockReviews';
import { Alert, Linking, Share } from 'react-native';
import { VerifiedBadge } from '../../../src/components/creator/VerifiedBadge';
import CollapsibleSection from '../../../src/components/common/CollapsibleSection';
import PremiumReviewsSection from '../../../src/components/reviews/PremiumReviewsSection';
import { shareService } from '../../../src/services/sharing';
import { haptics } from '../../../src/services/haptics';
import { getReceivedModules } from '../../../src/utils/itineraryCardBadges';
import { Icon } from '../../../src/components/common/Icons';
import { CoverCarousel } from '../../../src/components/common/CoverCarousel';
import MediaGallery from '../../../src/components/common/MediaGallery';
import { getCoverImages } from '../../../src/utils/itineraryMedia';
import { LinearGradient } from 'expo-linear-gradient';
import FAQSection from '../../../src/components/FAQSection';
import { getItineraryFAQ } from '../../../src/data/mockFAQ';
import { PurchaseSuccessModal } from '../../../src/components/modals/PurchaseSuccessModal';
import { useFavorites } from '../../../src/hooks/useFavorites';
import { useCart } from '../../../src/hooks/useCart';
import { useAuth } from '../../../src/contexts/AuthContext';
import BudgetSummaryCard from '../../../src/components/dashboard/BudgetSummaryCard';
import PeopleSimulator from '../../../src/components/dashboard/PeopleSimulator';
import { getCostReferences, calculateBudgetSummary, formatMoney, type CostReferencesGroup } from '@vamo/shared/itinerary';

const { width, height } = Dimensions.get('window');

export default function ItineraryDetailScreen() {
    const { id, showSuccess } = useLocalSearchParams<{ id: string; showSuccess?: string }>();
    const router = useRouter();
    const [itinerary, setItinerary] = useState<any>(null);
    const [showBuyOptions, setShowBuyOptions] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(showSuccess === 'true');
    const [currencyRates, setCurrencyRates] = useState<Record<string, number>>({});
    const [peopleCount, setPeopleCount] = useState<number>(1);
    const [cartToast, setCartToast] = useState(false);
    const reviews = getReviewsByPackageId(`itinerary-${id}`);
    const { isFavorite, toggleFavorite } = useFavorites();
    const { isInCart, addToCart } = useCart();
    const { accessToken } = useAuth();

    useEffect(() => {
        getItineraryById(id).then(setItinerary).catch(console.error);
        getCurrencyRates().then(setCurrencyRates).catch(console.error);
    }, [id]);

    /** Converte valor em qualquer moeda para BRL formatado, usando taxas do admin */
    const toBRL = (value: string | number, currency: string): string => {
        const n = typeof value === 'number' ? value : parseFloat(String(value)) || 0;
        if (n <= 0) return 'R$ 0';
        const brl = currency === 'BRL' ? n : n * (currencyRates[currency] ?? 1);
        return brl.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
    };

    if (!itinerary) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>Carregando...</Text>
            </View>
        );
    }

    const handlePurchase = () => {
        setShowSuccessModal(true);
    };

    const handleGoToMyTrips = () => {
        setShowSuccessModal(false);
        router.push('/(tabs)/my-trips' as any);
    };
    const handleBuyNow = () => {
        // Login gate: usuário deslogado não pode comprar. Redireciona para
        // login com `next` apontando de volta pra esta tela de detalhe.
        if (!accessToken) {
            router.push({ pathname: '/login' as any, params: { next: `/itinerary/${id}` } });
            return;
        }
        router.push({
            pathname: `/checkout/itinerary-contact` as any,
            params: {
                itineraryId: id,
                price: itinerary.price.toString(),
            },
        });
    };

    const handleToggleFavorite = async () => {
        haptics.light();
        await toggleFavorite(id);
    };

    const handleAddToCart = async () => {
        haptics.medium();
        if (!isInCart(id)) {
            await addToCart(id);
            setCartToast(true);
            setTimeout(() => setCartToast(false), 2500);
        } else {
            router.push('/(tabs)/cart' as any);
        }
    };


    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Hero Image */}
                <View style={styles.heroContainer}>
                    <CoverCarousel images={getCoverImages(itinerary)} height={420} />
                    {/* Bottom gradient for smooth transition to content sheet */}
                    <LinearGradient
                        colors={['transparent', 'rgba(255,255,255,0.15)', 'rgba(255,255,255,0.6)']}
                        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80 }}
                        pointerEvents="none"
                    />

                    {/* Navigation Header with Blur */}
                    <BlurView intensity={80} tint="dark" style={styles.navBlur}>
                        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>
                        <View style={styles.navActions}>
                            <TouchableOpacity
                                style={styles.navIconButton}
                                onPress={handleToggleFavorite}
                            >
                                <Ionicons
                                    name={isFavorite(id) ? 'heart' : 'heart-outline'}
                                    size={22}
                                    color={isFavorite(id) ? '#EF4444' : '#fff'}
                                />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.navIconButton}
                                onPress={async () => {
                                    haptics.light();
                                    try {
                                        await Share.share({
                                            title: itinerary.title,
                                            message: `🗺️ Confira este roteiro no VAMO!\n\n${itinerary.title}\n📍 ${itinerary.destination}, ${itinerary.country}\n💰 R$ ${itinerary.price.toFixed(2)}`,
                                        });
                                    } catch (error) {
                                        // User cancelled
                                    }
                                }}
                            >
                                <Ionicons name="share-outline" size={22} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </BlurView>
                </View>

                {/* Content Sheet */}
                <View style={styles.contentSheet}>
                    {/* Creator Badge */}
                    <View style={styles.creatorRow}>
                        <View style={styles.creatorBadge}>
                            <View style={styles.creatorAvatarCircle}>
                                <Icon name="circle-user" size={22} color={theme.colors.primary} />
                            </View>
                            <View>
                                <View style={styles.creatorNameRow}>
                                    <Text style={styles.creatorName}>{itinerary.creator.name}</Text>
                                    <VerifiedBadge level={itinerary.creator.verificationLevel} size="small" showLabel={false} />
                                </View>
                                <View style={styles.creatorStatsRow}>
                                    <Icon name="star" size={11} color="#F59E0B" strokeWidth={2.5} />
                                    <Text style={styles.creatorStats}>
                                        {itinerary.creator.rating} · {itinerary.creator.salesCount.toLocaleString('pt-BR')} vendas
                                    </Text>
                                </View>
                            </View>
                        </View>

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
                            <Icon name="star" size={16} color="#F59E0B" strokeWidth={2.5} />
                            <Text style={styles.statText}>{itinerary.rating}</Text>
                            <Text style={styles.statLabel}>({itinerary.reviewCount})</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Icon name="calendar" size={16} color={theme.colors.primary} />
                            <Text style={styles.statText}>{itinerary.duration} dias</Text>
                        </View>
                    </View>

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
                                <Text style={styles.priceSymbolText}>R$</Text>
                                <Text style={styles.priceValueText}>
                                    {itinerary.price.toFixed(2).replace('.', ',')}
                                </Text>
                            </View>
                            <Text style={styles.priceInstallment}>
                                Em até 12x de R$ {(itinerary.price / 12).toFixed(2).replace('.', ',')} sem juros
                            </Text>
                            <View style={styles.priceMeta}>
                                <Ionicons name="flash" size={12} color="#28C9BF" />
                                <Text style={styles.priceMetaText}>Acesso imediato após a compra</Text>
                            </View>
                        </View>

                        <View style={styles.purchaseActions}>
                            {/* Adicionar ao carrinho / No carrinho */}
                            <TouchableOpacity
                                style={[styles.cartCtaWide, isInCart(id) && styles.cartCtaWideActive]}
                                onPress={handleAddToCart}
                                activeOpacity={0.85}
                                accessibilityLabel={isInCart(id) ? 'No carrinho' : 'Adicionar ao carrinho'}
                            >
                                <Icon
                                    name={isInCart(id) ? 'verified' : 'shopping-cart'}
                                    size={18}
                                    color={isInCart(id) ? '#28C9BF' : '#FFFFFF'}
                                />
                                <Text style={[styles.cartCtaWideText, isInCart(id) && styles.cartCtaWideTextActive]}>
                                    {isInCart(id) ? 'No carrinho' : 'Adicionar'}
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

                    {/* Aviso: Produto Digital */}
                    <View style={styles.productNotice}>
                        <Ionicons name="information-circle" size={18} color={theme.colors.primary} />
                        <Text style={styles.productNoticeText}>
                            Este é um <Text style={styles.productNoticeBold}>produto digital</Text>. Ao comprar, você terá acesso a informações, dicas e planejamento de viagem. O pagamento é referente ao conteúdo informativo, não a serviços turísticos.
                        </Text>
                    </View>

                    {/* Aviso: Acesso Offline */}
                    <View style={{
                        flexDirection: 'row', alignItems: 'center', gap: 10,
                        backgroundColor: 'rgba(40, 201, 191, 0.08)', borderRadius: 12,
                        padding: 14, marginBottom: 16, borderLeftWidth: 3, borderLeftColor: theme.colors.primary,
                    }}>
                        <Ionicons name="cloud-offline-outline" size={20} color={theme.colors.primary} />
                        <Text style={{ flex: 1, fontSize: 13, color: theme.colors.text.primary, lineHeight: 18 }}>
                            <Text style={{ fontWeight: '700', color: theme.colors.primary }}>100% Offline</Text>
                            {' — '}Após a compra, o roteiro fica disponível para consulta mesmo sem conexão com a internet.
                        </Text>
                    </View>

                    {/* Referência de custos da viagem (transparência graduada) */}
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
                                    variant="public"
                                    hideWhenEmpty
                                />
                                <PeopleSimulator
                                    totalPerPerson={summary.totalInformed}
                                    currency={summary.currency}
                                    value={peopleCount}
                                    onChange={setPeopleCount}
                                />
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
                                                            {item.currency !== 'BRL' && (
                                                                <Text> ≈ {toBRL(item.amountPerPerson, item.currency)}</Text>
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

                    {/* Destaques */}
                    {itinerary.highlights && itinerary.highlights.length > 0 && (
                        <CollapsibleSection title="Destaques" defaultExpanded>
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
                                    <Text style={styles.howReceiveStepDesc}>Seu roteiro aparece em "Minhas Viagens" instantaneamente</Text>
                                </View>
                            </View>
                            <View style={styles.howReceiveLine} />
                            <View style={styles.howReceiveStep}>
                                <View style={styles.howReceiveIconBox}>
                                    <Ionicons name="cloud-download-outline" size={22} color={theme.colors.primary} />
                                </View>
                                <View style={styles.howReceiveContent}>
                                    <Text style={styles.howReceiveStepTitle}>3. Baixe offline</Text>
                                    <Text style={styles.howReceiveStepDesc}>Salve o roteiro completo para acessar sem internet durante a viagem</Text>
                                </View>
                            </View>
                            <View style={styles.howReceiveLine} />
                            <View style={styles.howReceiveStep}>
                                <View style={styles.howReceiveIconBox}>
                                    <Ionicons name="infinite-outline" size={22} color={theme.colors.primary} />
                                </View>
                                <View style={styles.howReceiveContent}>
                                    <Text style={styles.howReceiveStepTitle}>4. Acesso vitalício</Text>
                                    <Text style={styles.howReceiveStepDesc}>O roteiro é seu para sempre — consulte quando quiser, quantas vezes precisar</Text>
                                </View>
                            </View>
                        </View>
                    </CollapsibleSection>

                    {/* Perguntas Frequentes */}
                    <FAQSection
                        items={getItineraryFAQ(id)}
                        creatorName={itinerary.creator.name}
                    />

                    {/* Premium Reviews Section */}
                    {reviews.length > 0 && (
                        <View style={styles.reviewsSection}>
                            <PremiumReviewsSection
                                reviews={reviews}
                                averageRating={getAverageRating(`itinerary-${id}`)}
                                totalReviews={reviews.length}
                                categoryRatings={getCategoryRatings(`itinerary-${id}`)}
                                communityPhotos={getCommunityPhotos(`itinerary-${id}`)}
                                topRatedSummary={getTopRatedCategoriesText(`itinerary-${id}`)}
                            />
                        </View>
                    )}

                    {/* Trust Info */}
                    <View style={styles.trustBox}>
                        <Ionicons name="shield-checkmark" size={24} color={theme.colors.verified} />
                        <View style={styles.trustContent}>
                            <Text style={styles.trustTitle}>Criador Verificado</Text>
                            <Text style={styles.trustText}>
                                {itinerary.creator.name} é um viajante verificado pelo VAMO com {itinerary.creator.salesCount}+ roteiros vendidos
                            </Text>
                        </View>
                    </View>

                    {/* Disclaimer Legal */}
                    <View style={styles.disclaimerBox}>
                        <View style={styles.disclaimerHeader}>
                            <Ionicons name="document-text-outline" size={18} color={theme.colors.text.tertiary} />
                            <Text style={styles.disclaimerTitle}>Informações Importantes</Text>
                        </View>
                        <View style={styles.disclaimerItems}>
                            <View style={styles.disclaimerItem}>
                                <Ionicons name="document-text-outline" size={16} color={theme.colors.text.secondary} style={{ marginTop: 2, marginRight: 8 }} />
                                <Text style={styles.disclaimerItemText}>
                                    <Text style={styles.disclaimerItemBold}>Produto digital:</Text> Você está adquirindo acesso a um roteiro com informações, dicas e planejamento de viagem elaborados por um viajante experiente.
                                </Text>
                            </View>
                            <View style={styles.disclaimerItem}>
                                <Ionicons name="bulb-outline" size={16} color={theme.colors.text.secondary} style={{ marginTop: 2, marginRight: 8 }} />
                                <Text style={styles.disclaimerItemText}>
                                    <Text style={styles.disclaimerItemBold}>Conteúdo informativo:</Text> O pagamento é pelo acesso à informação em si. A VAMO não comercializa nem garante a execução dos serviços, passeios ou experiências descritos no roteiro.
                                </Text>
                            </View>
                            <View style={styles.disclaimerItem}>
                                <Ionicons name="lock-closed-outline" size={16} color={theme.colors.text.secondary} style={{ marginTop: 2, marginRight: 8 }} />
                                <Text style={styles.disclaimerItemText}>
                                    <Text style={styles.disclaimerItemBold}>Acesso permanente:</Text> Após a compra, o conteúdo ficará disponível na sua conta para consulta a qualquer momento.
                                </Text>
                            </View>
                            <View style={styles.disclaimerItem}>
                                <Ionicons name="warning-outline" size={16} color={theme.colors.warning || '#F59E0B'} style={{ marginTop: 2, marginRight: 8 }} />
                                <Text style={styles.disclaimerItemText}>
                                    Preços, horários e disponibilidade dos locais mencionados podem sofrer alterações. Recomendamos confirmar as informações antes da viagem.
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View style={{ height: 100 }} />
                </View>
            </ScrollView>

            {/* Purchase Success Modal */}
            <PurchaseSuccessModal
                visible={showSuccessModal}
                onClose={() => setShowSuccessModal(false)}
                onGoToMyTrips={handleGoToMyTrips}
                itineraryTitle={itinerary.title}
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

    // Product Notice (inline compact)
    productNotice: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        backgroundColor: `${theme.colors.primary}08`,
        borderWidth: 1,
        borderColor: `${theme.colors.primary}20`,
        borderRadius: 10,
        padding: 14,
        marginTop: 12,
    },
    productNoticeText: {
        flex: 1,
        fontSize: 13,
        color: theme.colors.text.secondary,
        lineHeight: 19,
    },
    productNoticeBold: {
        fontWeight: '700',
        color: theme.colors.text.primary,
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
});
