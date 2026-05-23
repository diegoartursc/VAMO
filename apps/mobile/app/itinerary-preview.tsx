/**
 * VAMO Mobile — Prévia do Roteiro
 *
 * Espelha FIELMENTE a tela pública de detalhes (apps/mobile/app/(tabs)/itinerary/[id].tsx)
 * usando o estado atual do form de criação (carregado de AsyncStorage).
 *
 * Mesmas seções, mesma hierarquia, mesmos estilos, mesma ordem.
 * Ações de comprador (favoritar, compartilhar, carrinho, comprar) são
 * exibidas visualmente mas desabilitadas, mantendo a fidelidade visual.
 *
 * Conteúdo "vitrine" pré-compra (vem da tela pública) e em seguida o
 * conteúdo profundo dos módulos ativos (dias, hospedagens, atrações,
 * transporte, restaurantes, voo, dicas, checklist) para que o roteirista
 * possa revisar tudo antes de enviar para análise.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, Image, TouchableOpacity,
    Dimensions, StatusBar, Platform, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../src/theme/theme';
import { CoverCarousel } from '../src/components/common/CoverCarousel';
import CollapsibleSection from '../src/components/common/CollapsibleSection';
import { Icon } from '../src/components/common/Icons';
import { VerifiedBadge } from '../src/components/creator/VerifiedBadge';
import FAQSection from '../src/components/FAQSection';
import { getItineraryFAQ } from '../src/data/mockFAQ';
import { getReceivedModules } from '../src/utils/itineraryCardBadges';
import { getCurrencyRates } from '../src/services/api';
import { haptics } from '../src/services/haptics';
import { useAuth } from '../src/contexts/AuthContext';
import type {
    ItineraryFormState, Day, Activity, Accommodation, Transport,
    RestaurantItem, AttractionItem, ChecklistItem,
} from '@vamo/shared/itinerary';

export const PREVIEW_KEY = '@vamo_preview_itinerary';

const { width: SCREEN_W } = Dimensions.get('window');

const MODULE_LABELS: Record<string, string> = {
    voo: 'Passagem Aérea',
    hospedagem: 'Hospedagem',
    passeios: 'Passeios & Atrações',
    transporte: 'Transporte Local',
    restaurantes: 'Alimentação',
    extras: 'Gastos Extras',
};
const MODULE_ICONS: Record<string, string> = {
    voo: 'plane',
    hospedagem: 'hotel',
    passeios: 'compass',
    transporte: 'car',
    restaurantes: 'utensils',
    extras: 'star',
};

function parseValue(v?: string | null): number {
    if (!v) return 0;
    const n = parseFloat(String(v).replace(',', '.'));
    return Number.isNaN(n) ? 0 : n;
}

function buildManualEntries(form: ItineraryFormState) {
    const entries: Array<{
        moduleKey: string;
        priceValue: string;
        priceCurrency: string;
        label: string;
    }> = [];

    if (parseValue(form.flightSpending?.value) > 0) {
        entries.push({
            moduleKey: 'voo',
            priceValue: form.flightSpending!.value,
            priceCurrency: form.flightSpending!.currency || 'BRL',
            label: MODULE_LABELS.voo,
        });
    }
    // Soma por módulo agregando todos os itens (mais limpo na vitrine)
    const sumPerModule = (
        items: Array<{ spending?: { value?: string; currency?: string } | null } | null | undefined> | undefined,
        moduleKey: string,
    ) => {
        const totals = new Map<string, number>();
        (items || []).forEach(it => {
            const v = parseValue(it?.spending?.value);
            if (v <= 0) return;
            const cur = it?.spending?.currency || form.currency || 'BRL';
            totals.set(cur, (totals.get(cur) || 0) + v);
        });
        totals.forEach((value, currency) => {
            entries.push({
                moduleKey,
                priceValue: String(value),
                priceCurrency: currency,
                label: MODULE_LABELS[moduleKey] || moduleKey,
            });
        });
    };
    sumPerModule(form.accommodations, 'hospedagem');
    sumPerModule(form.attractions, 'passeios');
    sumPerModule(form.transports, 'transporte');
    sumPerModule(form.restaurants, 'restaurantes');

    // Extras: cada item pode ter moeda própria — agrupa por moeda
    const extrasTotals = new Map<string, number>();
    (form.extraSpendingItems || []).forEach(e => {
        const v = parseValue(e.value);
        if (v <= 0) return;
        const cur = e.currency || form.currency || 'BRL';
        extrasTotals.set(cur, (extrasTotals.get(cur) || 0) + v);
    });
    extrasTotals.forEach((value, currency) => {
        entries.push({
            moduleKey: 'extras',
            priceValue: String(value),
            priceCurrency: currency,
            label: MODULE_LABELS.extras,
        });
    });

    return entries;
}

export default function ItineraryPreviewScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [form, setForm] = useState<ItineraryFormState | null>(null);
    const [loading, setLoading] = useState(true);
    const [rates, setRates] = useState<Record<string, number>>({});

    useEffect(() => {
        (async () => {
            try {
                const raw = await AsyncStorage.getItem(PREVIEW_KEY);
                if (raw) setForm(JSON.parse(raw));
            } catch (e) {
                console.warn('[preview] erro lendo form:', e);
            } finally {
                setLoading(false);
            }
        })();
        getCurrencyRates().then(setRates).catch(() => undefined);
    }, []);

    function showDisabledHint() {
        haptics.light();
        // Visual feedback minimalista — o hint embaixo do bloco de preço já avisa.
    }

    // Hooks devem ser chamados em ordem consistente — manter antes de qualquer early return.
    const manualEntries = useMemo(() => form ? buildManualEntries(form) : [], [form]);

    if (loading) {
        return (
            <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
                <ActivityIndicator color={theme.colors.primary} />
            </View>
        );
    }

    if (!form) {
        return (
            <View style={[styles.container, { alignItems: 'center', justifyContent: 'center', padding: 24 }]}>
                <Ionicons name="alert-circle-outline" size={48} color={theme.colors.text.tertiary} />
                <Text style={{ marginTop: 12, fontSize: 16, color: theme.colors.text.secondary, textAlign: 'center' }}>
                    Não foi possível carregar a prévia. Volte para a criação e tente novamente.
                </Text>
                <TouchableOpacity onPress={() => router.back()} style={[styles.ghostBtn, { marginTop: 20 }]}>
                    <Text style={styles.ghostBtnText}>Voltar</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // ─── Derivados (mesma lógica da tela pública) ──────────────────
    const heroImages = [
        ...(form.highlightPhotos || []),
        ...(form.images || []),
    ].filter(Boolean);
    const heroSafe = heroImages.length > 0
        ? heroImages
        : ['https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200'];

    const priceNumber = form.price > 0 ? form.price : 0;
    const promoNumber = form.promoPrice && form.promoPrice > 0 ? form.promoPrice : 0;
    const effectivePrice = promoNumber || priceNumber;

    const toBRL = (value: string | number, currency: string): string => {
        const n = typeof value === 'number' ? value : parseValue(String(value));
        if (n <= 0) return 'R$ 0';
        const brl = currency === 'BRL' ? n : n * (rates[currency] ?? 1);
        return brl.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
    };

    const totalBRL = manualEntries.reduce((s, e) => {
        const n = parseValue(e.priceValue);
        const rate = e.priceCurrency === 'BRL' ? 1 : (rates[e.priceCurrency] ?? 1);
        return s + n * rate;
    }, 0);
    const totalFormatted = totalBRL > 0
        ? totalBRL.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
        : null;

    const creatorName = user?.name || 'Você';
    const verificationLevel = 'basic' as const;

    const mainCountry = form.locations?.[0]?.country || form.country || '';
    const mainCity = form.locations?.[0]?.cities?.[0] || form.destination || '';
    const locParts: string[] = [];
    if (mainCountry && mainCity) locParts.push(`${mainCountry} (${mainCity})`);
    else if (mainCountry) locParts.push(mainCountry);
    else if (mainCity) locParts.push(mainCity);
    (form.locations || []).slice(1).forEach(loc => {
        const cities = (loc.cities || []).filter(Boolean).join(', ');
        if (loc.country && cities) locParts.push(`${loc.country} (${cities})`);
        else if (loc.country) locParts.push(loc.country);
        else if (cities) locParts.push(cities);
    });

    const hasActiveItinerary = form.activeModules?.includes('itinerario') && form.days?.length > 0;
    const hasActiveAcc = form.activeModules?.includes('hospedagem') && form.accommodations?.length > 0;
    const hasActiveAttr = form.activeModules?.includes('passeios') && form.attractions?.length > 0;
    const hasActiveRest = form.activeModules?.includes('restaurantes') && form.restaurants?.length > 0;
    const hasActiveTrans = form.activeModules?.includes('transporte') && form.transports?.length > 0;
    const hasActiveFlight = form.activeModules?.includes('voo')
        && (!!form.flightOutbound?.originCity || !!form.flightReturn?.originCity || !!form.flightOutbound?.airline);
    const hasActiveTips = form.activeModules?.includes('dicas') && (form.generalTips?.filter(t => t.trim()).length || 0) > 0;
    const hasActiveCheck = form.activeModules?.includes('checklist') && (form.checklistItems?.filter(c => c.item?.trim()).length || 0) > 0;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* ── HERO (idêntico ao detalhe público) ── */}
                <View style={styles.heroContainer}>
                    <CoverCarousel images={heroSafe} height={420} />
                    <LinearGradient
                        colors={['transparent', 'rgba(255,255,255,0.15)', 'rgba(255,255,255,0.6)']}
                        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80 }}
                        pointerEvents="none"
                    />

                    <BlurView intensity={80} tint="dark" style={styles.navBlur}>
                        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>
                        <View style={styles.navActions}>
                            {/* Ações desabilitadas na prévia */}
                            <TouchableOpacity
                                style={[styles.navIconButton, styles.navIconDisabled]}
                                onPress={showDisabledHint}
                                activeOpacity={0.85}
                            >
                                <Ionicons name="heart-outline" size={22} color="rgba(255,255,255,0.55)" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.navIconButton, styles.navIconDisabled]}
                                onPress={showDisabledHint}
                                activeOpacity={0.85}
                            >
                                <Ionicons name="share-outline" size={22} color="rgba(255,255,255,0.55)" />
                            </TouchableOpacity>
                        </View>
                    </BlurView>

                    {/* Badge discreta de prévia */}
                    <View style={styles.previewBadgeWrap} pointerEvents="none">
                        <View style={styles.previewBadge}>
                            <Ionicons name="eye-outline" size={13} color="#1A3263" />
                            <Text style={styles.previewBadgeText}>Prévia</Text>
                        </View>
                    </View>
                </View>

                {/* ── CONTENT SHEET ── */}
                <View style={styles.contentSheet}>
                    {/* Aviso de modo prévia (discreto, no topo do conteúdo) */}
                    <View style={styles.previewNotice}>
                        <Ionicons name="information-circle" size={16} color={theme.colors.primary} />
                        <Text style={styles.previewNoticeText}>
                            Esta é uma simulação de como o roteiro aparecerá para o comprador após a aprovação.
                        </Text>
                    </View>

                    {/* Creator Badge */}
                    <View style={styles.creatorRow}>
                        <View style={styles.creatorBadge}>
                            <View style={styles.creatorAvatarCircle}>
                                <Icon name="circle-user" size={22} color={theme.colors.primary} />
                            </View>
                            <View>
                                <View style={styles.creatorNameRow}>
                                    <Text style={styles.creatorName}>{creatorName}</Text>
                                    <VerifiedBadge level={verificationLevel} size="small" showLabel={false} />
                                </View>
                                <View style={styles.creatorStatsRow}>
                                    <Icon name="star" size={11} color="#F59E0B" strokeWidth={2.5} />
                                    <Text style={styles.creatorStats}>Criador deste roteiro</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.verificationLink}>
                            <Ionicons name="shield-checkmark" size={16} color={theme.colors.verified} />
                            <Text style={styles.verificationLinkText}>Como verificamos os criadores</Text>
                            <Ionicons name="chevron-forward" size={16} color={theme.colors.text.tertiary} />
                        </View>
                    </View>

                    {/* Título */}
                    <Text style={styles.title}>{form.title || 'Título do roteiro'}</Text>

                    {/* Localizações */}
                    <View style={[styles.locationRow, { flexWrap: 'wrap', gap: 10 }]}>
                        {locParts.length > 0 ? locParts.map((part, i) => (
                            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <Ionicons name="location" size={16} color={theme.colors.primary} />
                                <Text style={styles.location}>{part}</Text>
                            </View>
                        )) : (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <Ionicons name="location" size={16} color={theme.colors.text.tertiary} />
                                <Text style={[styles.location, { color: theme.colors.text.tertiary }]}>Defina o destino</Text>
                            </View>
                        )}
                    </View>

                    {/* Stats Card */}
                    <View style={styles.statsCard}>
                        <View style={styles.statItem}>
                            <Icon name="star" size={16} color="#F59E0B" strokeWidth={2.5} />
                            <Text style={styles.statText}>—</Text>
                            <Text style={styles.statLabel}>(sem avaliações)</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Icon name="calendar" size={16} color={theme.colors.primary} />
                            <Text style={styles.statText}>{form.duration || 0} dias</Text>
                        </View>
                    </View>

                    {/* Preço + CTA (desabilitados) */}
                    <LinearGradient
                        colors={['#1A3263', '#162A55']}
                        style={styles.priceSection}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <View>
                            <Text style={[styles.priceLabel, { color: 'rgba(255,255,255,0.65)' }]}>Roteiro completo</Text>
                            <View style={styles.priceRow}>
                                <Text style={[styles.priceSymbol, { color: '#28C9BF' }]}>R$</Text>
                                <Text style={[styles.priceValue, { color: '#FFFFFF' }]}>
                                    {effectivePrice > 0
                                        ? effectivePrice.toFixed(2).replace('.', ',')
                                        : '—'}
                                </Text>
                            </View>
                            {promoNumber > 0 && priceNumber > 0 ? (
                                <Text style={styles.priceStrikethrough}>
                                    de R$ {priceNumber.toFixed(2).replace('.', ',')}
                                </Text>
                            ) : null}
                            <Text style={[styles.priceNote, { color: 'rgba(255,255,255,0.5)' }]}>
                                • {effectivePrice > 0 ? 'Acesso imediato após compra' : 'Defina um preço de venda'}
                            </Text>
                        </View>
                        <View style={styles.priceCtas}>
                            <TouchableOpacity
                                style={[styles.cartCta, styles.ctaDisabled]}
                                onPress={showDisabledHint}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="cart-outline" size={20} color="rgba(255,255,255,0.45)" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.buyButton, styles.ctaDisabled]}
                                onPress={showDisabledHint}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="lock-closed" size={14} color="#fff" />
                                <Text style={styles.buyButtonText}>Comprar Agora</Text>
                            </TouchableOpacity>
                        </View>
                    </LinearGradient>
                    <Text style={styles.disabledHint}>Indisponível na prévia — ações habilitadas após aprovação</Text>

                    {/* Aviso: Produto Digital */}
                    <View style={styles.productNotice}>
                        <Ionicons name="information-circle" size={18} color={theme.colors.primary} />
                        <Text style={styles.productNoticeText}>
                            Este é um <Text style={styles.productNoticeBold}>produto digital</Text>. Ao comprar, você terá acesso a informações, dicas e planejamento de viagem. O pagamento é referente ao conteúdo informativo, não a serviços turísticos.
                        </Text>
                    </View>

                    {/* Aviso: Acesso Offline */}
                    <View style={styles.offlineNotice}>
                        <Ionicons name="cloud-offline-outline" size={20} color={theme.colors.primary} />
                        <Text style={styles.offlineNoticeText}>
                            <Text style={styles.offlineNoticeBold}>100% Offline</Text>
                            {' — '}Após a compra, o roteiro fica disponível para consulta mesmo sem conexão com a internet.
                        </Text>
                    </View>

                    {/* Estimativa de Gastos */}
                    {manualEntries.length > 0 && (
                        <CollapsibleSection title="Estimativa de Gastos por Pessoa">
                            {totalFormatted && (
                                <LinearGradient
                                    colors={['#1A3263', '#1E4D8C']}
                                    style={styles.spendingTotalCard}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    <View>
                                        <Text style={styles.spendingTotalLabel}>
                                            Estimativa total por pessoa · {form.duration || 0} dias
                                        </Text>
                                        <Text style={styles.spendingTotalRange}>{totalFormatted}</Text>
                                        {form.flightOutbound?.originCity ? (
                                            <View style={styles.flightDepartureRow}>
                                                <Icon name="plane" size={12} color="rgba(255,255,255,0.7)" />
                                                <Text style={styles.flightDepartureText}>
                                                    Voo saindo de {form.flightOutbound.originCity}
                                                </Text>
                                            </View>
                                        ) : null}
                                    </View>
                                    <Text style={styles.spendingTotalNote}>*valores aproximados</Text>
                                </LinearGradient>
                            )}
                            <View style={styles.spendingBreakdown}>
                                {manualEntries.map((e, index) => (
                                    <View key={index} style={styles.breakdownItem}>
                                        <View style={styles.breakdownIconWrap}>
                                            <Icon name={(MODULE_ICONS[e.moduleKey] || 'star') as any} size={18} color={theme.colors.primary} />
                                        </View>
                                        <View style={styles.breakdownContent}>
                                            <Text style={styles.breakdownCategory}>
                                                {MODULE_LABELS[e.moduleKey] || e.label || e.moduleKey}
                                            </Text>
                                        </View>
                                        <View style={styles.breakdownAmountBadge}>
                                            <Text style={styles.breakdownAmount}>
                                                {toBRL(e.priceValue, e.priceCurrency)}
                                            </Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                            <View style={styles.spendingDisclaimer}>
                                <Icon name="info" size={15} color={theme.colors.text.tertiary} />
                                <Text style={styles.disclaimerText}>
                                    Valores estimados em R$ conforme cotação atual. Podem variar por época do ano e estilo de viagem.
                                </Text>
                            </View>
                        </CollapsibleSection>
                    )}

                    {/* Sobre o Roteiro */}
                    {form.description?.trim() ? (
                        <CollapsibleSection title="Sobre o Roteiro" defaultExpanded>
                            <Text style={styles.description}>{form.description}</Text>
                        </CollapsibleSection>
                    ) : null}

                    {/* Destaques */}
                    {form.highlights && form.highlights.filter(Boolean).length > 0 && (
                        <CollapsibleSection title="Destaques" defaultExpanded>
                            <View style={styles.highlightsContainer}>
                                {form.highlights.filter(Boolean).map((highlight, index) => (
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

                    {/* O que você vai receber — apenas módulos ativos E preenchidos */}
                    {(() => {
                        const receivedModules = getReceivedModules(form);
                        if (receivedModules.length === 0) return null;
                        return (
                            <CollapsibleSection title="O que você vai receber" defaultExpanded>
                                <Text style={styles.inclusionsIntro}>
                                    Ao comprar este roteiro, o viajante terá acesso a:
                                </Text>
                                <View style={styles.inclusionsList}>
                                    {receivedModules.map((item) => (
                                        <View key={item.key} style={styles.inclusionItem}>
                                            <View style={[styles.inclusionIcon, { backgroundColor: item.bgColor }]}>
                                                <Icon name={item.icon} size={24} color={item.iconColor} />
                                            </View>
                                            <View style={styles.inclusionContent}>
                                                <Text style={styles.inclusionTitle}>{item.title}</Text>
                                                <Text style={styles.inclusionDesc}>{item.description}</Text>
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

                    {/* FAQ */}
                    <FAQSection items={getItineraryFAQ('preview')} creatorName={creatorName} />

                    {/* ─────────────────────────────────────────────────────
                       Conteúdo profundo dos módulos ativos
                       Mostrado abaixo da vitrine para que o roteirista
                       valide o conteúdo que o comprador acessará após
                       a aprovação/compra.
                    ───────────────────────────────────────────────────── */}

                    {(hasActiveItinerary || hasActiveAcc || hasActiveAttr || hasActiveRest || hasActiveTrans || hasActiveFlight || hasActiveTips || hasActiveCheck) && (
                        <View style={styles.deepContentHeader}>
                            <Ionicons name="lock-open-outline" size={16} color={theme.colors.text.secondary} />
                            <Text style={styles.deepContentHeaderText}>
                                Conteúdo desbloqueado após a compra
                            </Text>
                        </View>
                    )}

                    {/* Roteiro dia a dia */}
                    {hasActiveItinerary && (
                        <CollapsibleSection title={`Roteiro dia a dia (${form.days.length})`}>
                            {form.days.map((day: Day, i) => (
                                <View key={i} style={styles.dayCard}>
                                    <View style={styles.dayHeader}>
                                        <View style={styles.dayBadge}>
                                            <Text style={styles.dayBadgeText}>Dia {day.dayNumber || i + 1}</Text>
                                        </View>
                                        <Text style={styles.dayTitle} numberOfLines={2}>
                                            {day.title || `Dia ${i + 1}`}
                                        </Text>
                                    </View>
                                    {day.summary ? <Text style={styles.daySummary}>{day.summary}</Text> : null}
                                    {day.description ? <Text style={styles.dayDesc}>{day.description}</Text> : null}
                                    {day.activities && day.activities.length > 0 && (
                                        <View style={styles.activitiesList}>
                                            {day.activities.map((a: Activity, j) => (
                                                <View key={j} style={styles.activityItem}>
                                                    <Text style={styles.activityIcon}>{a.icon || '📍'}</Text>
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={styles.activityTitle}>{a.title || 'Atividade'}</Text>
                                                        {a.time ? (
                                                            <Text style={styles.activityMeta}>
                                                                {a.time}{a.duration ? ` · ${a.duration}` : ''}
                                                            </Text>
                                                        ) : null}
                                                        {a.location ? <Text style={styles.activityMeta}>📍 {a.location}</Text> : null}
                                                        {a.description ? <Text style={styles.activityDesc}>{a.description}</Text> : null}
                                                    </View>
                                                </View>
                                            ))}
                                        </View>
                                    )}
                                </View>
                            ))}
                        </CollapsibleSection>
                    )}

                    {/* Voo */}
                    {hasActiveFlight && (
                        <CollapsibleSection title="Sobre o voo">
                            {form.flightOutbound?.airline || form.flightOutbound?.originCity ? (
                                <View style={styles.subCard}>
                                    <Text style={styles.subCardTitle}>
                                        Ida{form.flightOutbound.airline ? ` — ${form.flightOutbound.airline}` : ''}
                                    </Text>
                                    {form.flightOutbound.originAirport && form.flightOutbound.destinationAirport ? (
                                        <Text style={styles.subCardMeta}>
                                            {form.flightOutbound.originAirport} → {form.flightOutbound.destinationAirport}
                                        </Text>
                                    ) : null}
                                    {form.flightOutbound.departureDate ? (
                                        <Text style={styles.subCardMeta}>{form.flightOutbound.departureDate}</Text>
                                    ) : null}
                                </View>
                            ) : null}
                            {form.flightReturn?.airline || form.flightReturn?.originCity ? (
                                <View style={styles.subCard}>
                                    <Text style={styles.subCardTitle}>
                                        Volta{form.flightReturn.airline ? ` — ${form.flightReturn.airline}` : ''}
                                    </Text>
                                    {form.flightReturn.originAirport && form.flightReturn.destinationAirport ? (
                                        <Text style={styles.subCardMeta}>
                                            {form.flightReturn.originAirport} → {form.flightReturn.destinationAirport}
                                        </Text>
                                    ) : null}
                                    {form.flightReturn.departureDate ? (
                                        <Text style={styles.subCardMeta}>{form.flightReturn.departureDate}</Text>
                                    ) : null}
                                </View>
                            ) : null}
                        </CollapsibleSection>
                    )}

                    {/* Hospedagens */}
                    {hasActiveAcc && (
                        <CollapsibleSection title={`Hospedagens (${form.accommodations.length})`}>
                            {form.accommodations.map((acc: Accommodation, i) => (
                                <View key={i} style={styles.subCard}>
                                    <Text style={styles.subCardTitle}>{acc.name || `Hospedagem ${i + 1}`}</Text>
                                    {acc.address ? <Text style={styles.subCardMeta}>📍 {acc.address}</Text> : null}
                                    {acc.nights ? <Text style={styles.subCardMeta}>🌙 {acc.nights} noite(s)</Text> : null}
                                    {acc.description ? <Text style={styles.subCardDesc}>{acc.description}</Text> : null}
                                </View>
                            ))}
                        </CollapsibleSection>
                    )}

                    {/* Atrações */}
                    {hasActiveAttr && (
                        <CollapsibleSection title={`Passeios & Atrações (${form.attractions.length})`}>
                            {form.attractions.map((a: AttractionItem, i) => (
                                <View key={i} style={styles.subCard}>
                                    <Text style={styles.subCardTitle}>{a.name || `Atração ${i + 1}`}</Text>
                                    {a.type ? <Text style={styles.subCardMeta}>{a.type}{a.duration ? ` · ${a.duration}` : ''}</Text> : null}
                                    {a.location ? <Text style={styles.subCardMeta}>📍 {a.location}</Text> : null}
                                    {a.description ? <Text style={styles.subCardDesc}>{a.description}</Text> : null}
                                </View>
                            ))}
                        </CollapsibleSection>
                    )}

                    {/* Restaurantes */}
                    {hasActiveRest && (
                        <CollapsibleSection title={`Restaurantes (${form.restaurants.length})`}>
                            {form.restaurants.map((r: RestaurantItem, i) => (
                                <View key={i} style={styles.subCard}>
                                    <Text style={styles.subCardTitle}>{r.name || `Restaurante ${i + 1}`}</Text>
                                    {r.cuisine ? <Text style={styles.subCardMeta}>{r.cuisine}</Text> : null}
                                    {r.location ? <Text style={styles.subCardMeta}>📍 {r.location}</Text> : null}
                                    {r.description ? <Text style={styles.subCardDesc}>{r.description}</Text> : null}
                                </View>
                            ))}
                        </CollapsibleSection>
                    )}

                    {/* Transporte */}
                    {hasActiveTrans && (
                        <CollapsibleSection title="Transporte">
                            {form.transports.map((t: Transport, i) => (
                                <View key={i} style={styles.subCard}>
                                    {t.description ? <Text style={styles.subCardDesc}>{t.description}</Text> : null}
                                    {t.passTypes ? <Text style={styles.subCardMeta}>🎫 {t.passTypes}</Text> : null}
                                    {t.notes ? <Text style={styles.subCardMeta}>{t.notes}</Text> : null}
                                </View>
                            ))}
                        </CollapsibleSection>
                    )}

                    {/* Dicas */}
                    {hasActiveTips && (
                        <CollapsibleSection title="Dicas exclusivas">
                            {form.generalTips.filter(t => t.trim()).map((t, i) => (
                                <View key={i} style={styles.bulletRow}>
                                    <Ionicons name="bulb-outline" size={16} color={theme.colors.primary} />
                                    <Text style={styles.bulletText}>{t}</Text>
                                </View>
                            ))}
                        </CollapsibleSection>
                    )}

                    {/* Checklist */}
                    {hasActiveCheck && (
                        <CollapsibleSection title="Checklist do viajante">
                            {form.checklistItems.filter(c => c.item?.trim()).map((c: ChecklistItem, i) => (
                                <View key={i} style={styles.bulletRow}>
                                    <Ionicons name="square-outline" size={16} color={theme.colors.text.secondary} />
                                    <Text style={styles.bulletText}>
                                        {c.item}
                                        {c.category ? <Text style={styles.subCardMeta}>  · {c.category}</Text> : null}
                                    </Text>
                                </View>
                            ))}
                        </CollapsibleSection>
                    )}

                    {/* Trust */}
                    <View style={styles.trustBox}>
                        <Ionicons name="shield-checkmark" size={24} color={theme.colors.verified} />
                        <View style={styles.trustContent}>
                            <Text style={styles.trustTitle}>Criador Verificado</Text>
                            <Text style={styles.trustText}>
                                {creatorName} faz parte da comunidade VAMO de criadores verificados.
                            </Text>
                        </View>
                    </View>

                    {/* Disclaimer */}
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

                    <View style={{ height: 120 }} />
                </View>
            </ScrollView>

            {/* Footer fixo: voltar para edição */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.actionBtnPrimary}
                    onPress={() => router.back()}
                    activeOpacity={0.85}
                >
                    <Ionicons name="arrow-back" size={18} color="#fff" />
                    <Text style={styles.actionBtnPrimaryText}>Voltar para edição</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    scrollView: { flex: 1 },

    // ── Hero (espelha (tabs)/itinerary/[id].tsx)
    heroContainer: { height: 420, position: 'relative' },
    navBlur: {
        position: 'absolute', top: 0, left: 0, right: 0,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingTop: Platform.OS === 'ios' ? 50 : 20, paddingBottom: 12,
        paddingHorizontal: 16,
        overflow: 'hidden',
        borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    backButton: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.3)',
        alignItems: 'center', justifyContent: 'center',
    },
    navActions: { flexDirection: 'row', gap: 8 },
    navIconButton: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.3)',
        alignItems: 'center', justifyContent: 'center',
    },
    navIconDisabled: { opacity: 0.55 },

    previewBadgeWrap: {
        position: 'absolute', bottom: 96, left: 16,
    },
    previewBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        backgroundColor: '#FBBF24',
        paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14,
        ...theme.shadows.small,
    },
    previewBadgeText: { fontSize: 12, fontWeight: '700', color: '#1A3263' },

    // ── Content sheet
    contentSheet: {
        backgroundColor: theme.colors.background,
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        marginTop: -24, paddingTop: 24, paddingHorizontal: 20,
    },

    previewNotice: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 8,
        backgroundColor: `${theme.colors.primary}0F`,
        borderRadius: 10, padding: 10, marginBottom: 16,
        borderLeftWidth: 3, borderLeftColor: theme.colors.primary,
    },
    previewNoticeText: { flex: 1, fontSize: 12, color: theme.colors.text.secondary, lineHeight: 17 },

    // ── Creator
    creatorRow: { marginBottom: 20 },
    creatorBadge: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: theme.colors.surface,
        paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16,
        alignSelf: 'flex-start', gap: 12,
        ...theme.shadows.small,
    },
    creatorAvatarCircle: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: theme.colors.primary + '15',
        alignItems: 'center', justifyContent: 'center',
    },
    creatorNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    creatorName: { fontSize: 15, fontWeight: '600', color: theme.colors.text.primary },
    creatorStats: { fontSize: 12, color: theme.colors.text.secondary, marginTop: 2 },
    creatorStatsRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
    verificationLink: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        paddingVertical: 12, paddingHorizontal: 4, marginTop: 12,
    },
    verificationLinkText: {
        flex: 1, fontSize: 13, color: theme.colors.verified, fontWeight: '500',
    },

    title: {
        fontSize: 28, fontWeight: '700', color: theme.colors.text.primary,
        marginBottom: 8, lineHeight: 36,
    },
    locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 16 },
    location: { fontSize: 16, color: theme.colors.text.secondary },

    statsCard: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: theme.colors.surfaceLight,
        borderRadius: 14, paddingVertical: 14, paddingHorizontal: 20,
        marginBottom: 20, gap: 0,
        borderWidth: 1, borderColor: theme.colors.borderLight,
    },
    statDivider: { width: 1, height: 28, backgroundColor: theme.colors.border, marginHorizontal: 16 },
    statItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    statText: { fontSize: 14, fontWeight: '600', color: theme.colors.text.primary },
    statLabel: { fontSize: 13, color: theme.colors.text.secondary },

    // ── Price section
    priceSection: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: theme.colors.surface, padding: 20,
        borderRadius: 16, marginBottom: 8,
        ...theme.shadows.small,
    },
    priceLabel: { fontSize: 12, color: theme.colors.text.secondary, marginBottom: 4 },
    priceRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 4 },
    priceSymbol: { fontSize: 16, fontWeight: '600', marginRight: 4 },
    priceValue: { fontSize: 32, fontWeight: '700' },
    priceStrikethrough: {
        fontSize: 12, color: 'rgba(255,255,255,0.55)',
        textDecorationLine: 'line-through', marginTop: 2,
    },
    priceNote: { fontSize: 11, color: theme.colors.text.tertiary, marginTop: 2 },
    priceCtas: { flexDirection: 'column', gap: 10, alignItems: 'flex-end' },
    cartCta: {
        width: 44, height: 44, borderRadius: 22,
        borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)',
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center', justifyContent: 'center',
    },
    buyButton: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 18, paddingVertical: 12, borderRadius: 28,
        ...theme.shadows.button,
    },
    buyButtonText: { fontSize: 13, fontWeight: '700', color: '#fff' },
    ctaDisabled: { opacity: 0.55 },
    disabledHint: {
        fontSize: 11, color: theme.colors.text.tertiary,
        textAlign: 'center', fontStyle: 'italic',
        marginBottom: 16, marginTop: 4,
    },

    // ── Notices
    productNotice: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 10,
        backgroundColor: `${theme.colors.primary}08`,
        borderWidth: 1, borderColor: `${theme.colors.primary}20`,
        borderRadius: 10, padding: 14, marginTop: 12,
    },
    productNoticeText: { flex: 1, fontSize: 13, color: theme.colors.text.secondary, lineHeight: 19 },
    productNoticeBold: { fontWeight: '700', color: theme.colors.text.primary },
    offlineNotice: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: 'rgba(40, 201, 191, 0.08)', borderRadius: 12,
        padding: 14, marginBottom: 16, marginTop: 12,
        borderLeftWidth: 3, borderLeftColor: theme.colors.primary,
    },
    offlineNoticeText: { flex: 1, fontSize: 13, color: theme.colors.text.primary, lineHeight: 18 },
    offlineNoticeBold: { fontWeight: '700', color: theme.colors.primary },

    description: { fontSize: 15, color: theme.colors.text.primary, lineHeight: 22 },

    // ── Inclusions
    inclusionsIntro: { fontSize: 14, color: theme.colors.text.secondary, lineHeight: 20, marginBottom: 20 },
    inclusionsList: { gap: 16 },
    inclusionItem: { flexDirection: 'row', gap: 12 },
    inclusionIcon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    inclusionContent: { flex: 1 },
    inclusionTitle: { fontSize: 15, fontWeight: '600', color: theme.colors.text.primary, marginBottom: 4 },
    inclusionDesc: { fontSize: 13, color: theme.colors.text.secondary, lineHeight: 18 },

    // ── Spending
    spendingTotalCard: { borderRadius: 16, padding: 20, marginBottom: 16 },
    spendingTotalLabel: {
        fontSize: 12, color: 'rgba(255,255,255,0.65)', fontWeight: '500',
        marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5,
    },
    spendingTotalRange: { fontSize: 26, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5 },
    flightDepartureRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
    flightDepartureText: { fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: '500' },
    spendingTotalNote: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 10, fontStyle: 'italic' },
    spendingBreakdown: { gap: 10, marginBottom: 16 },
    breakdownItem: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: theme.colors.surfaceLight,
        borderRadius: 12, padding: 14,
        borderWidth: 1, borderColor: theme.colors.borderLight,
    },
    breakdownIconWrap: {
        width: 40, height: 40, borderRadius: 10,
        backgroundColor: theme.colors.primary + '12',
        alignItems: 'center', justifyContent: 'center',
    },
    breakdownContent: { flex: 1 },
    breakdownCategory: { fontSize: 14, fontWeight: '700', color: theme.colors.text.primary, marginBottom: 2 },
    breakdownAmountBadge: {
        backgroundColor: theme.colors.primary + '15',
        paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
    },
    breakdownAmount: { fontSize: 13, fontWeight: '700', color: theme.colors.primary },
    spendingDisclaimer: {
        flexDirection: 'row', gap: 8, alignItems: 'flex-start',
        backgroundColor: theme.colors.surfaceLight,
        padding: 12, borderRadius: 10, marginTop: 4,
    },
    disclaimerText: { flex: 1, fontSize: 12, color: theme.colors.text.tertiary, lineHeight: 17 },

    // ── Highlights
    highlightsContainer: { gap: 12, paddingVertical: 8 },
    highlightRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    checkIcon: {
        width: 24, height: 24, borderRadius: 12,
        backgroundColor: theme.colors.success,
        alignItems: 'center', justifyContent: 'center',
    },
    highlightText: { fontSize: 15, color: theme.colors.text.primary, flex: 1 },

    // ── How receive
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

    // ── Deep content header
    deepContentHeader: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        marginTop: 24, marginBottom: 8,
        paddingHorizontal: 4,
    },
    deepContentHeaderText: {
        fontSize: 12, fontWeight: '600',
        color: theme.colors.text.secondary,
        textTransform: 'uppercase', letterSpacing: 0.5,
    },

    // ── Deep content cards
    dayCard: {
        padding: 14, marginBottom: 12, borderRadius: 14,
        borderWidth: 1, borderColor: theme.colors.borderLight,
        backgroundColor: '#fff',
    },
    dayHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    dayBadge: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
    },
    dayBadgeText: { fontSize: 12, fontWeight: '700', color: '#fff' },
    dayTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: theme.colors.text.primary },
    daySummary: { fontSize: 13, color: theme.colors.text.secondary, marginTop: 8 },
    dayDesc: { fontSize: 13, color: theme.colors.text.primary, marginTop: 6, lineHeight: 20 },
    activitiesList: { marginTop: 12, gap: 10 },
    activityItem: {
        flexDirection: 'row', gap: 10,
        padding: 10, backgroundColor: theme.colors.surface, borderRadius: 10,
    },
    activityIcon: { fontSize: 18 },
    activityTitle: { fontSize: 13, fontWeight: '600', color: theme.colors.text.primary },
    activityMeta: { fontSize: 11, color: theme.colors.text.secondary, marginTop: 2 },
    activityDesc: { fontSize: 12, color: theme.colors.text.secondary, marginTop: 4, lineHeight: 18 },

    subCard: {
        padding: 12, marginBottom: 8,
        borderRadius: 12, borderWidth: 1, borderColor: theme.colors.borderLight,
        backgroundColor: '#fff',
    },
    subCardTitle: { fontSize: 14, fontWeight: '700', color: theme.colors.text.primary },
    subCardMeta: { fontSize: 12, color: theme.colors.text.secondary, marginTop: 2 },
    subCardDesc: { fontSize: 13, color: theme.colors.text.primary, marginTop: 4, lineHeight: 20 },

    bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 6 },
    bulletText: { flex: 1, fontSize: 14, color: theme.colors.text.primary, lineHeight: 22 },

    // ── Trust + disclaimer
    trustBox: {
        flexDirection: 'row', gap: 12,
        backgroundColor: `${theme.colors.primary}08`,
        padding: 16, borderRadius: 12, marginTop: 16,
        borderWidth: 1, borderColor: `${theme.colors.primary}20`,
        borderLeftWidth: 3, borderLeftColor: theme.colors.primary,
    },
    trustContent: { flex: 1 },
    trustTitle: { fontSize: 14, fontWeight: '600', color: theme.colors.text.primary, marginBottom: 4 },
    trustText: { fontSize: 13, color: theme.colors.text.secondary, lineHeight: 18 },
    disclaimerBox: {
        backgroundColor: theme.colors.surfaceLight,
        borderRadius: 12, padding: 16, marginTop: 20,
        borderWidth: 1, borderColor: theme.colors.borderLight,
    },
    disclaimerHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
    disclaimerTitle: { fontSize: 14, fontWeight: '600', color: theme.colors.text.secondary },
    disclaimerItems: { gap: 12 },
    disclaimerItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    disclaimerItemText: { flex: 1, fontSize: 13, color: theme.colors.text.secondary, lineHeight: 19 },
    disclaimerItemBold: { fontWeight: '600', color: theme.colors.text.primary },

    // ── Footer
    footer: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        paddingHorizontal: 16, paddingTop: 10,
        paddingBottom: Platform.OS === 'ios' ? 28 : 16,
        backgroundColor: '#fff',
        borderTopWidth: 1, borderTopColor: theme.colors.borderLight,
    },
    actionBtnPrimary: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: theme.colors.primary,
        height: 52, borderRadius: 14,
    },
    actionBtnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    ghostBtn: {
        paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12,
        borderWidth: 1, borderColor: theme.colors.borderLight,
    },
    ghostBtnText: { color: theme.colors.text.primary, fontWeight: '600' },
});
