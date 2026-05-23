/**
 * VAMO Mobile — Prévia do Roteiro
 *
 * Renderiza o estado atual do form de criação como se fosse a tela
 * pública de detalhes do roteiro, permitindo ao roteirista revisar
 * visualmente antes de enviar para análise.
 *
 * - Carrega o form de AsyncStorage (chave PREVIEW_KEY), salvo
 *   imediatamente antes da navegação a partir do Step 9.
 * - Não permite favoritar/comprar/adicionar ao carrinho.
 * - Exibe badge "Prévia" e mensagem de visibilidade.
 * - Layout inspirado em apps/mobile/app/(tabs)/itinerary/[id].tsx
 *   mas usando apenas dados do form (sem chamadas de API).
 */

import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, Image, TouchableOpacity,
    Dimensions, StatusBar, Platform, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../src/theme/theme';
import { CoverCarousel } from '../src/components/common/CoverCarousel';
import CollapsibleSection from '../src/components/common/CollapsibleSection';
import { haptics } from '../src/services/haptics';
import { useAuth } from '../src/contexts/AuthContext';
import type {
    ItineraryFormState, Day, Activity, Accommodation, Transport,
    RestaurantItem, AttractionItem, ChecklistItem, SpendingEntry, FlightLeg,
} from '@vamo/shared/itinerary';

export const PREVIEW_KEY = '@vamo_preview_itinerary';

const { width: SCREEN_W } = Dimensions.get('window');

function formatPrice(value: number, currency = 'BRL'): string {
    try {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(value);
    } catch {
        return `R$ ${value.toFixed(2)}`;
    }
}

// ─── Componente principal ──────────────────────────────────────────
export default function ItineraryPreviewScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [form, setForm] = useState<ItineraryFormState | null>(null);
    const [loading, setLoading] = useState(true);

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
    }, []);

    function showDisabledHint() {
        haptics.light();
        // Toast simples — em mobile, basta um Alert leve; aqui usamos visual feedback minimalista
        // (em real app você usaria um Toast/Snackbar)
    }

    if (loading) {
        return (
            <View style={[s.root, { alignItems: 'center', justifyContent: 'center' }]}>
                <ActivityIndicator color={theme.colors.primary} />
            </View>
        );
    }

    if (!form) {
        return (
            <View style={[s.root, { alignItems: 'center', justifyContent: 'center', padding: 24 }]}>
                <Ionicons name="alert-circle-outline" size={48} color={theme.colors.text.tertiary} />
                <Text style={{ marginTop: 12, fontSize: 16, color: theme.colors.text.secondary, textAlign: 'center' }}>
                    Não foi possível carregar a prévia. Volte para a criação e tente novamente.
                </Text>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={[s.actionBtnGhost, { marginTop: 20 }]}
                >
                    <Text style={s.actionBtnGhostText}>Voltar</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const images = [
        ...(form.highlightPhotos || []),
        ...(form.images || []),
    ].filter(Boolean);

    const heroImages = images.length > 0
        ? images
        : ['https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200'];

    const fallbackPriceMsg = form.price > 0
        ? formatPrice(form.price, form.currency || 'BRL')
        : 'Defina um preço de venda';

    const promoPrice = form.promoPrice && form.promoPrice > 0 ? form.promoPrice : null;

    const creatorName = user?.name || 'Você';
    const creatorAvatar = user?.avatar || null;

    return (
        <View style={s.root}>
            <StatusBar barStyle="light-content" />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
                {/* ── HERO ── */}
                <View style={s.hero}>
                    <CoverCarousel images={heroImages} height={360} />
                    <LinearGradient
                        colors={['rgba(0,0,0,0.4)', 'transparent', 'rgba(0,0,0,0.6)']}
                        style={StyleSheet.absoluteFillObject}
                        pointerEvents="none"
                    />

                    {/* Header com botão voltar + badge prévia */}
                    <View style={s.heroHeader}>
                        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
                            <Ionicons name="arrow-back" size={22} color="#fff" />
                        </TouchableOpacity>
                        <View style={s.previewBadge}>
                            <Ionicons name="eye-outline" size={14} color="#1A3263" />
                            <Text style={s.previewBadgeText}>Prévia</Text>
                        </View>
                    </View>

                    {/* Faixa informativa */}
                    <View style={s.heroBottom}>
                        <View style={s.heroInfoChip}>
                            <Ionicons name="lock-closed" size={12} color="#fff" />
                            <Text style={s.heroInfoChipText}>
                                Visível apenas para você antes da análise
                            </Text>
                        </View>
                    </View>
                </View>

                {/* ── CARD PRINCIPAL ── */}
                <View style={s.contentSheet}>
                    {/* Título + destino */}
                    <Text style={s.title}>{form.title || 'Título do roteiro'}</Text>
                    {form.subtitle ? <Text style={s.subtitle}>{form.subtitle}</Text> : null}

                    <View style={s.metaRow}>
                        <Ionicons name="location" size={14} color={theme.colors.primary} />
                        <Text style={s.metaText}>
                            {form.destination || 'Cidade'}{form.country ? `, ${form.country}` : ''}
                        </Text>
                    </View>

                    <View style={s.statsRow}>
                        <View style={s.statItem}>
                            <Ionicons name="calendar-outline" size={16} color={theme.colors.text.secondary} />
                            <Text style={s.statText}>{form.duration || 0} dias</Text>
                        </View>
                        <View style={s.statDot} />
                        <View style={s.statItem}>
                            <Ionicons name="cloud-download-outline" size={16} color={theme.colors.text.secondary} />
                            <Text style={s.statText}>Digital</Text>
                        </View>
                        {form.categories?.length > 0 && (
                            <>
                                <View style={s.statDot} />
                                <View style={s.statItem}>
                                    <Ionicons name="pricetag-outline" size={16} color={theme.colors.text.secondary} />
                                    <Text style={s.statText}>{form.categories.length} categoria{form.categories.length > 1 ? 's' : ''}</Text>
                                </View>
                            </>
                        )}
                    </View>

                    {/* Criador */}
                    <View style={s.creatorRow}>
                        {creatorAvatar ? (
                            <Image source={{ uri: creatorAvatar }} style={s.creatorAvatar} resizeMode="cover" />
                        ) : (
                            <View style={s.creatorAvatarPlaceholder}>
                                <Ionicons name="person" size={18} color="#fff" />
                            </View>
                        )}
                        <View style={{ flex: 1 }}>
                            <Text style={s.creatorName}>{creatorName}</Text>
                            <Text style={s.creatorLabel}>Criador deste roteiro</Text>
                        </View>
                    </View>

                    {/* Bloco preço + CTA (DESABILITADO) */}
                    <View style={s.priceBlock}>
                        <View style={{ flex: 1 }}>
                            <Text style={s.priceLabel}>Roteiro completo</Text>
                            {promoPrice ? (
                                <View>
                                    <Text style={s.priceStrikethrough}>{formatPrice(form.price, form.currency)}</Text>
                                    <Text style={s.priceValue}>{formatPrice(promoPrice, form.currency)}</Text>
                                </View>
                            ) : (
                                <Text style={s.priceValue}>{fallbackPriceMsg}</Text>
                            )}
                            {form.installments && form.installments > 1 ? (
                                <Text style={s.priceInstallments}>em até {form.installments}x</Text>
                            ) : null}
                        </View>
                        <TouchableOpacity
                            style={[s.buyBtn, s.buyBtnDisabled]}
                            onPress={showDisabledHint}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="lock-closed" size={16} color="#fff" />
                            <Text style={s.buyBtnText}>Comprar</Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={s.disabledHint}>
                        Ações desabilitadas — disponíveis após a aprovação do roteiro
                    </Text>

                    {/* Descrição */}
                    {form.description ? (
                        <CollapsibleSection title="Sobre o Roteiro" defaultOpen>
                            <Text style={s.bodyText}>{form.description}</Text>
                        </CollapsibleSection>
                    ) : null}

                    {/* Destaques */}
                    {form.highlights && form.highlights.length > 0 ? (
                        <CollapsibleSection title="Destaques" defaultOpen>
                            {form.highlights.map((h, i) => (
                                <View key={i} style={s.bulletRow}>
                                    <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
                                    <Text style={s.bulletText}>{h}</Text>
                                </View>
                            ))}
                        </CollapsibleSection>
                    ) : null}

                    {/* Roteiro dia a dia */}
                    {form.days && form.days.length > 0 ? (
                        <CollapsibleSection title={`Roteiro dia a dia (${form.days.length})`} defaultOpen>
                            {form.days.map((day: Day, i) => (
                                <View key={i} style={s.dayCard}>
                                    <View style={s.dayHeader}>
                                        <View style={s.dayBadge}>
                                            <Text style={s.dayBadgeText}>Dia {day.dayNumber || i + 1}</Text>
                                        </View>
                                        <Text style={s.dayTitle} numberOfLines={2}>{day.title || `Dia ${i + 1}`}</Text>
                                    </View>
                                    {day.summary ? <Text style={s.daySummary}>{day.summary}</Text> : null}
                                    {day.description ? <Text style={s.dayDesc}>{day.description}</Text> : null}
                                    {day.activities && day.activities.length > 0 && (
                                        <View style={s.activitiesList}>
                                            {day.activities.map((a: Activity, j) => (
                                                <View key={j} style={s.activityItem}>
                                                    <Text style={s.activityIcon}>{a.icon || '📍'}</Text>
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={s.activityTitle}>{a.title || 'Atividade'}</Text>
                                                        {a.time ? <Text style={s.activityMeta}>{a.time}{a.duration ? ` · ${a.duration}` : ''}</Text> : null}
                                                        {a.location ? <Text style={s.activityMeta}>📍 {a.location}</Text> : null}
                                                        {a.description ? <Text style={s.activityDesc}>{a.description}</Text> : null}
                                                    </View>
                                                </View>
                                            ))}
                                        </View>
                                    )}
                                </View>
                            ))}
                        </CollapsibleSection>
                    ) : null}

                    {/* Hospedagens */}
                    {form.accommodations && form.accommodations.length > 0 ? (
                        <CollapsibleSection title="Hospedagens">
                            {form.accommodations.map((acc: Accommodation, i) => (
                                <View key={i} style={s.subCard}>
                                    <Text style={s.subCardTitle}>{acc.name || `Hospedagem ${i + 1}`}</Text>
                                    {acc.address ? <Text style={s.subCardMeta}>📍 {acc.address}</Text> : null}
                                    {acc.description ? <Text style={s.bodyText}>{acc.description}</Text> : null}
                                    {acc.nights ? <Text style={s.subCardMeta}>🌙 {acc.nights} noite(s)</Text> : null}
                                </View>
                            ))}
                        </CollapsibleSection>
                    ) : null}

                    {/* Atrações */}
                    {form.attractions && form.attractions.length > 0 ? (
                        <CollapsibleSection title="Passeios & Atrações">
                            {form.attractions.map((a: AttractionItem, i) => (
                                <View key={i} style={s.subCard}>
                                    <Text style={s.subCardTitle}>{a.name || `Atração ${i + 1}`}</Text>
                                    {a.type ? <Text style={s.subCardMeta}>{a.type}{a.duration ? ` · ${a.duration}` : ''}</Text> : null}
                                    {a.location ? <Text style={s.subCardMeta}>📍 {a.location}</Text> : null}
                                    {a.description ? <Text style={s.bodyText}>{a.description}</Text> : null}
                                </View>
                            ))}
                        </CollapsibleSection>
                    ) : null}

                    {/* Restaurantes */}
                    {form.restaurants && form.restaurants.length > 0 ? (
                        <CollapsibleSection title="Restaurantes">
                            {form.restaurants.map((r: RestaurantItem, i) => (
                                <View key={i} style={s.subCard}>
                                    <Text style={s.subCardTitle}>{r.name || `Restaurante ${i + 1}`}</Text>
                                    {r.cuisine ? <Text style={s.subCardMeta}>{r.cuisine}</Text> : null}
                                    {r.location ? <Text style={s.subCardMeta}>📍 {r.location}</Text> : null}
                                    {r.description ? <Text style={s.bodyText}>{r.description}</Text> : null}
                                </View>
                            ))}
                        </CollapsibleSection>
                    ) : null}

                    {/* Transporte */}
                    {form.transports && form.transports.length > 0 ? (
                        <CollapsibleSection title="Transporte">
                            {form.transports.map((t: Transport, i) => (
                                <View key={i} style={s.subCard}>
                                    {t.description ? <Text style={s.bodyText}>{t.description}</Text> : null}
                                    {t.passTypes ? <Text style={s.subCardMeta}>🎫 {t.passTypes}</Text> : null}
                                    {t.notes ? <Text style={s.subCardMeta}>{t.notes}</Text> : null}
                                </View>
                            ))}
                        </CollapsibleSection>
                    ) : null}

                    {/* Voo */}
                    {form.activeModules?.includes('voo') && (form.flightOutbound?.airline || form.flightReturn?.airline) ? (
                        <CollapsibleSection title="Sobre o voo">
                            {form.flightOutbound?.airline ? (
                                <View style={s.subCard}>
                                    <Text style={s.subCardTitle}>Ida — {form.flightOutbound.airline}</Text>
                                    {form.flightOutbound.originAirport && form.flightOutbound.destinationAirport ? (
                                        <Text style={s.subCardMeta}>
                                            {form.flightOutbound.originAirport} → {form.flightOutbound.destinationAirport}
                                        </Text>
                                    ) : null}
                                    {form.flightOutbound.departureDate ? <Text style={s.subCardMeta}>{form.flightOutbound.departureDate}</Text> : null}
                                </View>
                            ) : null}
                            {form.flightReturn?.airline ? (
                                <View style={s.subCard}>
                                    <Text style={s.subCardTitle}>Volta — {form.flightReturn.airline}</Text>
                                    {form.flightReturn.originAirport && form.flightReturn.destinationAirport ? (
                                        <Text style={s.subCardMeta}>
                                            {form.flightReturn.originAirport} → {form.flightReturn.destinationAirport}
                                        </Text>
                                    ) : null}
                                </View>
                            ) : null}
                        </CollapsibleSection>
                    ) : null}

                    {/* Dicas */}
                    {form.tips && form.tips.length > 0 ? (
                        <CollapsibleSection title="Dicas exclusivas">
                            {form.tips.map((t, i) => (
                                <View key={i} style={s.bulletRow}>
                                    <Ionicons name="bulb-outline" size={16} color={theme.colors.primary} />
                                    <Text style={s.bulletText}>{t}</Text>
                                </View>
                            ))}
                        </CollapsibleSection>
                    ) : null}

                    {/* Checklist */}
                    {form.checklistItems && form.checklistItems.length > 0 ? (
                        <CollapsibleSection title="Checklist do viajante">
                            {form.checklistItems.map((c: ChecklistItem, i) => (
                                <View key={i} style={s.bulletRow}>
                                    <Ionicons name="square-outline" size={16} color={theme.colors.text.secondary} />
                                    <Text style={s.bulletText}>
                                        {c.item}
                                        {c.category ? <Text style={s.subCardMeta}>  · {c.category}</Text> : null}
                                    </Text>
                                </View>
                            ))}
                        </CollapsibleSection>
                    ) : null}

                    {/* Estimativa de gastos */}
                    {form.spendingEntries && form.spendingEntries.length > 0 ? (
                        <CollapsibleSection title="Estimativa de gastos">
                            {form.spendingEntries.map((e: SpendingEntry, i) => (
                                <View key={i} style={s.spendRow}>
                                    <Text style={s.spendIcon}>{e.icon || '💸'}</Text>
                                    <Text style={s.spendLabel}>{e.label || e.moduleKey}</Text>
                                    {e.priceValue ? (
                                        <Text style={s.spendValue}>
                                            {formatPrice(parseFloat(e.priceValue) || 0, e.priceCurrency || form.currency || 'BRL')}
                                        </Text>
                                    ) : null}
                                </View>
                            ))}
                        </CollapsibleSection>
                    ) : null}
                </View>
            </ScrollView>

            {/* Footer fixo */}
            <View style={s.footer}>
                <TouchableOpacity
                    style={s.actionBtnPrimary}
                    onPress={() => router.back()}
                    activeOpacity={0.85}
                >
                    <Ionicons name="arrow-back" size={18} color="#fff" />
                    <Text style={s.actionBtnPrimaryText}>Voltar para edição</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

// ─── Estilos ───────────────────────────────────────────────────────
const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.colors.background },

    hero: { height: 360, position: 'relative' },
    heroHeader: {
        position: 'absolute', top: Platform.OS === 'ios' ? 50 : 30,
        left: 16, right: 16, flexDirection: 'row',
        justifyContent: 'space-between', alignItems: 'center',
    },
    backBtn: {
        width: 38, height: 38, borderRadius: 19,
        backgroundColor: 'rgba(0,0,0,0.45)',
        alignItems: 'center', justifyContent: 'center',
    },
    previewBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: '#FBBF24',
        paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14,
    },
    previewBadgeText: { fontSize: 12, fontWeight: '700', color: '#1A3263' },

    heroBottom: { position: 'absolute', bottom: 16, left: 16, right: 16 },
    heroInfoChip: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(0,0,0,0.55)',
        paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12,
    },
    heroInfoChipText: { fontSize: 12, color: '#fff', fontWeight: '500' },

    contentSheet: {
        backgroundColor: '#fff',
        marginTop: -20,
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        paddingHorizontal: 20, paddingTop: 24, paddingBottom: 16,
    },

    title: { fontSize: 24, fontWeight: '800', color: theme.colors.text.primary, lineHeight: 30 },
    subtitle: { fontSize: 14, color: theme.colors.text.secondary, marginTop: 4, lineHeight: 20 },

    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
    metaText: { fontSize: 14, color: theme.colors.text.secondary, fontWeight: '500' },

    statsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' },
    statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    statText: { fontSize: 13, color: theme.colors.text.secondary },
    statDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: theme.colors.text.tertiary },

    creatorRow: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        marginTop: 16, padding: 12,
        backgroundColor: theme.colors.surface,
        borderRadius: 14,
    },
    creatorAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.borderLight },
    creatorAvatarPlaceholder: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: theme.colors.primary,
        alignItems: 'center', justifyContent: 'center',
    },
    creatorName: { fontSize: 15, fontWeight: '700', color: theme.colors.text.primary },
    creatorLabel: { fontSize: 12, color: theme.colors.text.tertiary, marginTop: 2 },

    priceBlock: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        marginTop: 18,
        padding: 14, borderRadius: 14,
        backgroundColor: '#F0FDFA',
        borderWidth: 1, borderColor: '#5EEAD4',
    },
    priceLabel: { fontSize: 12, color: theme.colors.text.secondary, fontWeight: '500' },
    priceValue: { fontSize: 22, fontWeight: '800', color: theme.colors.primary, marginTop: 2 },
    priceStrikethrough: {
        fontSize: 13, color: theme.colors.text.tertiary,
        textDecorationLine: 'line-through',
    },
    priceInstallments: { fontSize: 11, color: theme.colors.text.secondary, marginTop: 2 },

    buyBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 18, paddingVertical: 12,
        borderRadius: 12,
    },
    buyBtnDisabled: { backgroundColor: theme.colors.text.tertiary, opacity: 0.7 },
    buyBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

    disabledHint: {
        marginTop: 10,
        fontSize: 12, color: theme.colors.text.tertiary,
        fontStyle: 'italic', textAlign: 'center',
    },

    bodyText: { fontSize: 14, color: theme.colors.text.primary, lineHeight: 22 },

    bulletRow: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 10,
        paddingVertical: 6,
    },
    bulletText: { flex: 1, fontSize: 14, color: theme.colors.text.primary, lineHeight: 22 },

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
    },
    subCardTitle: { fontSize: 14, fontWeight: '700', color: theme.colors.text.primary },
    subCardMeta: { fontSize: 12, color: theme.colors.text.secondary, marginTop: 2 },

    spendRow: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        paddingVertical: 8,
    },
    spendIcon: { fontSize: 18 },
    spendLabel: { flex: 1, fontSize: 14, color: theme.colors.text.primary },
    spendValue: { fontSize: 14, fontWeight: '700', color: theme.colors.primary },

    footer: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        paddingHorizontal: 16, paddingTop: 10, paddingBottom: Platform.OS === 'ios' ? 28 : 16,
        backgroundColor: '#fff',
        borderTopWidth: 1, borderTopColor: theme.colors.borderLight,
    },
    actionBtnPrimary: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: theme.colors.primary,
        height: 52, borderRadius: 14,
    },
    actionBtnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    actionBtnGhost: {
        paddingHorizontal: 18, paddingVertical: 12,
        borderRadius: 12, borderWidth: 1, borderColor: theme.colors.borderLight,
    },
    actionBtnGhostText: { color: theme.colors.text.primary, fontWeight: '600' },
});
