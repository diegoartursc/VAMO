/**
 * ItemCard — card genérico para itens do roteiro (versionamento).
 *
 * Usado por OriginalView (read-only) e por MyRouteView (com badges e
 * long-press). O componente é o mais "burro" possível — recebe o
 * `MergedItem` pronto e decide a estrutura visual por `kind`.
 *
 * Estilo: emula o look dos cards do `purchased-itinerary/[id].tsx`
 * (cantos arredondados 16-20, borda 1px borderLight, shadow medium,
 * primary teal para acentos).
 *
 * Princípios:
 *  - Não dispara fetch nem mutação — só renderiza.
 *  - `onLongPress` opcional (passado pelo MyRouteView para abrir menu).
 *  - `source` controla badge no canto superior direito:
 *      'original' → sem badge (default)
 *      'edited'   → badge navy "Editado"
 *      'added'    → badge teal "Adicionado"
 *  - Para `kind === 'dayActivity'`, devolve uma linha de timeline
 *    (sem card wrapper) — o componente pai precisa do contexto do dia
 *    para desenhar a linha vertical entre atividades.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../../theme/theme';
import { openExternalUrl } from '../../utils/externalLinks';
import type { MergedItem, ItemSource } from './mergeEngine';

export interface ItemCardProps {
    merged: MergedItem;
    /** Long-press opcional — habilita menu "Editar / Ocultar" no MyRouteView. */
    onLongPress?: () => void;
    /** Long-press desabilitado quando read-only (OriginalView). */
    showBadge?: boolean;
}

// ─── Helpers de exibição de custo ────────────────────────────
//
// O viajante salva custos via FieldType `cost` como `data.cost = { value,
// currency }`. O snapshot do criador pode usar formatos legados diferentes
// por categoria (priceRange string, ticketPrice string, priceValue/priceCurrency,
// cost.amount). Esse helper aceita ambos e retorna uma string pronta pra
// exibir tipo "A$ 200,00" ou null quando não há valor.
//
// Prioriza `data.cost.value` pra que edições do viajante sobreescrevam
// silenciosamente o legacy do snapshot. Se o valor editado for limpo,
// cai pra legacy original.

import { CURRENCIES } from '@vamo/shared/itinerary';

const CURRENCY_SYMBOL: Record<string, string> = CURRENCIES.reduce(
    (acc, c) => { acc[c.code] = c.symbol; return acc; },
    {} as Record<string, string>,
);

function pickDisplayCost(data: any): string | null {
    if (!data || typeof data !== 'object') return null;

    // 1. Shape canônico novo: data.cost = { value, currency }
    const cost = data.cost;
    if (cost && typeof cost === 'object') {
        const rawValue = cost.value ?? cost.amount;
        const value = typeof rawValue === 'string' ? rawValue.trim() : rawValue;
        if (value !== null && value !== undefined && value !== '') {
            const currency = typeof cost.currency === 'string' && cost.currency.length > 0
                ? cost.currency
                : 'AUD';
            return formatCostString(value, currency);
        }
    }

    // 2. Legacy plano: data.priceValue + data.priceCurrency (transport)
    if (data.priceValue !== undefined && data.priceValue !== null && data.priceValue !== '') {
        const currency = typeof data.priceCurrency === 'string' && data.priceCurrency.length > 0
            ? data.priceCurrency
            : 'AUD';
        return formatCostString(data.priceValue, currency);
    }

    // 3. Legacy plano: data.value + data.currency (extra spending)
    if (data.value !== undefined && data.value !== null && data.value !== '' && data.value !== '0') {
        const currency = typeof data.currency === 'string' && data.currency.length > 0
            ? data.currency
            : 'AUD';
        return formatCostString(data.value, currency);
    }

    // 4. Legacy strings só-texto (creator pre-CostBlock) — mantidos
    //    pelos próprios cards (priceRange, ticketPrice) porque já têm
    //    moeda embutida no texto.
    return null;
}

/** Formata "200" / "200,00" + "AUD" → "A$ 200,00 AUD" (compacto). */
function formatCostString(rawValue: string | number, currency: string): string {
    const valueStr = typeof rawValue === 'number'
        ? rawValue.toFixed(2).replace('.', ',')
        : String(rawValue);
    const symbol = CURRENCY_SYMBOL[currency] || '';
    return symbol ? `${symbol} ${valueStr}` : `${valueStr} ${currency}`;
}

// ─── Badges de origem ────────────────────────────────────────

function SourceBadge({ source }: { source: ItemSource }) {
    if (source === 'original') return null;
    const isAdded = source === 'added';
    const bg = isAdded ? theme.colors.primary : theme.colors.secondary;
    const label = isAdded ? 'Adicionado' : 'Editado';
    const icon = isAdded ? 'add-circle' : 'create';
    return (
        <View style={[styles.badge, { backgroundColor: bg }]}>
            <Ionicons name={icon as any} size={11} color="#fff" />
            <Text style={styles.badgeText}>{label}</Text>
        </View>
    );
}

// ─── Renderers por kind ──────────────────────────────────────

function MapButton({ url }: { url?: string | null }) {
    if (!url) return null;
    return (
        <TouchableOpacity
            style={styles.mapBtn}
            onPress={() => void openExternalUrl(url)}
            activeOpacity={0.8}
        >
            <Ionicons name="map-outline" size={14} color={theme.colors.primary} />
            <Text style={styles.mapBtnText}>Ver no mapa</Text>
        </TouchableOpacity>
    );
}

function ExternalButton({ url, label = 'Site oficial' }: { url?: string | null; label?: string }) {
    if (!url) return null;
    return (
        <TouchableOpacity
            style={styles.outlineBtn}
            onPress={() => void openExternalUrl(url)}
            activeOpacity={0.8}
        >
            <Ionicons name="globe-outline" size={14} color={theme.colors.primary} />
            <Text style={styles.outlineBtnText}>{label}</Text>
        </TouchableOpacity>
    );
}

function AccommodationCard({ data }: { data: any }) {
    // Prefer custo editado pelo viajante (data.cost); fallback ao
    // priceRange (string legacy do snapshot do criador).
    const cost = pickDisplayCost(data) ?? (data?.priceRange ? String(data.priceRange) : null);
    return (
        <>
            <View style={styles.row}>
                <Text style={styles.title} numberOfLines={2}>{data?.name || 'Hospedagem'}</Text>
                {cost ? (
                    <View style={styles.pricePill}>
                        <Text style={styles.pricePillText}>{cost}</Text>
                    </View>
                ) : null}
            </View>
            {(data?.address || data?.location || data?.neighborhood) ? (
                <View style={styles.locRow}>
                    <Ionicons name="location-outline" size={12} color={theme.colors.text.tertiary} style={styles.locIcon} />
                    <Text style={styles.locText} numberOfLines={2}>
                        {String(data.address || data.location || data.neighborhood)}
                    </Text>
                </View>
            ) : null}
            {data?.description ? (
                <Text style={styles.desc}>{String(data.description)}</Text>
            ) : null}
            {data?.rating ? (
                <View style={styles.ratingRow}>
                    <Ionicons name="star" size={13} color="#FFC107" />
                    <Text style={styles.ratingText}>{String(data.rating)}</Text>
                </View>
            ) : null}
            {data?.tips ? (
                <View style={styles.tipBox}>
                    <Text style={styles.tipText}>💡 {String(data.tips)}</Text>
                </View>
            ) : null}
            <MapButton url={data?.mapLink} />
        </>
    );
}

function AttractionCard({ data }: { data: any }) {
    return (
        <>
            {/* Linha 1: título (largura quase total) + preço (recua/encolhe) */}
            <View style={styles.row}>
                <Text style={styles.title} numberOfLines={2}>{data?.name || 'Atração'}</Text>
                {(() => {
                    const cost = pickDisplayCost(data) ?? (data?.ticketPrice ? String(data.ticketPrice) : null);
                    if (!cost) return null;
                    return (
                        <View style={styles.pricePill}>
                            <Ionicons name="card-outline" size={11} color={theme.colors.primary} />
                            <Text style={styles.pricePillText} numberOfLines={1}>{cost}</Text>
                        </View>
                    );
                })()}
            </View>
            {/* Linha 2: categoria */}
            {data?.type ? (
                <View style={styles.metaRow}>
                    <View style={styles.typeBadge}>
                        <Text style={styles.typeBadgeText}>{String(data.type)}</Text>
                    </View>
                </View>
            ) : null}
            {/* Linha 3: localização em largura total, até 2 linhas, sem vazar */}
            {data?.location ? (
                <View style={styles.locRow}>
                    <Ionicons name="location-outline" size={12} color={theme.colors.text.tertiary} style={styles.locIcon} />
                    <Text style={styles.locText} numberOfLines={2}>{String(data.location)}</Text>
                </View>
            ) : null}
            {(data?.hours || data?.duration) ? (
                <View style={styles.chipsRow}>
                    {data?.hours ? (
                        <View style={styles.infoChip}>
                            <Ionicons name="time-outline" size={11} color={theme.colors.text.secondary} />
                            <Text style={styles.infoChipText}>{String(data.hours)}</Text>
                        </View>
                    ) : null}
                    {data?.duration ? (
                        <View style={styles.infoChip}>
                            <Ionicons name="compass-outline" size={11} color={theme.colors.text.secondary} />
                            <Text style={styles.infoChipText}>{String(data.duration)}</Text>
                        </View>
                    ) : null}
                </View>
            ) : null}
            {data?.description ? (
                <Text style={styles.desc}>{String(data.description)}</Text>
            ) : null}
            {data?.tips ? (
                <View style={styles.tipBox}>
                    <Text style={styles.tipText}>💡 {String(data.tips)}</Text>
                </View>
            ) : null}
            <View style={styles.actionsRow}>
                <ExternalButton url={data?.externalLink} label="Site oficial" />
                <MapButton url={data?.mapLink} />
            </View>
        </>
    );
}

function RestaurantCard({ data }: { data: any }) {
    return (
        <>
            <View style={styles.row}>
                <View style={styles.flexCol}>
                    <View style={styles.titleRow}>
                        <Text style={styles.title} numberOfLines={2}>{data?.name || 'Restaurante'}</Text>
                        {data?.cuisine ? (
                            <View style={styles.cuisineTag}>
                                <Text style={styles.cuisineTagText}>{String(data.cuisine)}</Text>
                            </View>
                        ) : null}
                    </View>
                    {data?.location ? (
                        <View style={styles.locRow}>
                            <Ionicons name="location-outline" size={11} color={theme.colors.text.tertiary} style={styles.locIcon} />
                            <Text style={styles.locText} numberOfLines={2}>{String(data.location)}</Text>
                        </View>
                    ) : null}
                </View>
                {(() => {
                    const cost = pickDisplayCost(data) ?? (data?.priceRange ? String(data.priceRange) : null);
                    if (!cost) return null;
                    return (
                        <View style={styles.greenPill}>
                            <Text style={styles.greenPillText}>{cost}</Text>
                        </View>
                    );
                })()}
            </View>
            {data?.description ? (
                <Text style={styles.desc}>{String(data.description)}</Text>
            ) : null}
            {(data?.hoursStart || data?.hours) ? (
                <Text style={styles.metaText}>🕐 {String(data.hoursStart || data.hours)}</Text>
            ) : null}
            {data?.tips ? (
                <View style={styles.tipBox}>
                    <Text style={styles.tipText}>💡 {String(data.tips)}</Text>
                </View>
            ) : null}
            <ExternalButton url={data?.externalLink} label="Ver reservas" />
        </>
    );
}

function TransportCard({ data }: { data: any }) {
    const price = pickDisplayCost(data);
    return (
        <>
            <View style={styles.row}>
                <Text style={styles.title} numberOfLines={2}>{data?.description || 'Transporte'}</Text>
                {price ? (
                    <View style={styles.pricePill}>
                        <Text style={styles.pricePillText}>{price}</Text>
                    </View>
                ) : null}
            </View>
            {data?.passTypes ? (
                <Text style={styles.subhead}>{String(data.passTypes)}</Text>
            ) : null}
            {data?.notes ? (
                <Text style={styles.desc}>{String(data.notes)}</Text>
            ) : null}
        </>
    );
}

function GeneralTipCard({ data }: { data: any }) {
    // Tip pode ser string (legado) ou objeto.
    const text = typeof data === 'string'
        ? data
        : (data?.text || data?.tip || data?.description || '');
    return (
        <View style={styles.tipBulletRow}>
            <View style={styles.tipBullet} />
            <Text style={styles.tipBulletText}>{String(text)}</Text>
        </View>
    );
}

function ChecklistItemCard({ data }: { data: any }) {
    const item = typeof data === 'string'
        ? data
        : (data?.item || data?.text || data?.title || '');
    const category = typeof data === 'object' && data?.category ? String(data.category) : null;
    return (
        <View style={styles.checklistRow}>
            <Ionicons name="square-outline" size={18} color={theme.colors.text.tertiary} />
            <View style={{ flex: 1 }}>
                <Text style={styles.checklistText}>{String(item)}</Text>
                {category ? <Text style={styles.checklistCategory}>{category}</Text> : null}
            </View>
        </View>
    );
}

function ExtraSpendingCard({ data }: { data: any }) {
    // Unifica via pickDisplayCost — aceita cost.value/cost.amount/value+currency.
    const display = pickDisplayCost(data);
    return (
        <>
            <Text style={styles.title}>{data?.title || 'Gasto extra'}</Text>
            {data?.description ? (
                <Text style={styles.desc}>{String(data.description)}</Text>
            ) : null}
            {display ? (
                <Text style={styles.spendingValue}>{display}</Text>
            ) : null}
        </>
    );
}

function FlightLegCard({ data, leg }: { data: any; leg: 'outbound' | 'return' }) {
    const stops = typeof data?.stops === 'number' ? data.stops : null;
    return (
        <>
            <View style={styles.row}>
                <Text style={styles.title}>
                    {leg === 'outbound' ? '✈ Ida' : '✈ Volta'} — {data?.airline || 'Voo'}
                </Text>
                {stops !== null ? (
                    <View style={styles.stopsBadge}>
                        <Text style={styles.stopsText}>
                            {stops === 0 ? 'Direto' : `${stops} parada${stops > 1 ? 's' : ''}`}
                        </Text>
                    </View>
                ) : null}
            </View>
            {(data?.originAirport || data?.destinationAirport) ? (
                <Text style={styles.flightRoute}>
                    {data.originAirport || '?'} → {data.destinationAirport || '?'}
                </Text>
            ) : null}
            {data?.departureDate ? (
                <Text style={styles.metaText}>
                    📅 {String(data.departureDate)}
                    {data.arrivalDate && data.arrivalDate !== data.departureDate
                        ? ` → ${String(data.arrivalDate)}`
                        : ''}
                </Text>
            ) : null}
        </>
    );
}

function DayActivityCard({ data }: { data: any }) {
    return (
        <>
            <View style={styles.activityHeader}>
                {data?.icon ? <Text style={styles.activityIcon}>{String(data.icon)}</Text> : null}
                {data?.time ? <Text style={styles.activityTime}>{String(data.time)}</Text> : null}
                {data?.duration ? (
                    <View style={styles.durationChip}>
                        <Text style={styles.durationText}>{String(data.duration)}</Text>
                    </View>
                ) : null}
            </View>
            <Text style={styles.title}>{data?.title || 'Atividade'}</Text>
            {data?.location ? (
                <View style={styles.locRow}>
                    <Ionicons name="location-outline" size={11} color={theme.colors.text.tertiary} style={styles.locIcon} />
                    <Text style={styles.locText} numberOfLines={2}>{String(data.location)}</Text>
                </View>
            ) : null}
            {data?.description ? (
                <Text style={styles.desc} numberOfLines={6}>{String(data.description)}</Text>
            ) : null}
            <MapButton url={data?.mapLink} />
        </>
    );
}

// ─── Componente principal ────────────────────────────────────

export default function ItemCard({ merged, onLongPress, showBadge = true }: ItemCardProps) {
    const { kind, source, data } = merged;

    let content: React.ReactNode = null;
    switch (kind) {
        case 'accommodations': content = <AccommodationCard data={data} />; break;
        case 'attractions':    content = <AttractionCard data={data} />; break;
        case 'restaurants':    content = <RestaurantCard data={data} />; break;
        case 'transports':     content = <TransportCard data={data} />; break;
        case 'generalTips':    content = <GeneralTipCard data={data} />; break;
        case 'checklistItems': content = <ChecklistItemCard data={data} />; break;
        case 'extraSpendingItems': content = <ExtraSpendingCard data={data} />; break;
        case 'flightOutbound': content = <FlightLegCard data={data} leg="outbound" />; break;
        case 'flightReturn':   content = <FlightLegCard data={data} leg="return" />; break;
        case 'dayActivity':    content = <DayActivityCard data={data} />; break;
        default: content = <Text style={styles.desc}>{String(data?.title || data?.name || '')}</Text>;
    }

    const Wrapper: React.ComponentType<any> = onLongPress ? TouchableOpacity : View;
    const wrapperProps = onLongPress
        ? { onLongPress, activeOpacity: 0.8, delayLongPress: 400 }
        : {};

    // generalTips/checklistItems usam estilo "row" sem o wrapper card.
    if (kind === 'generalTips' || kind === 'checklistItems') {
        return (
            <Wrapper {...wrapperProps} style={styles.bareRow}>
                {showBadge && source !== 'original' ? (
                    <View style={styles.rowBadgeWrap}>
                        <SourceBadge source={source} />
                    </View>
                ) : null}
                {content}
            </Wrapper>
        );
    }

    const badgeVisible = showBadge && source !== 'original';
    return (
        <Wrapper {...wrapperProps} style={styles.card}>
            {badgeVisible ? (
                <View style={styles.cardBadgeWrap}>
                    <SourceBadge source={source} />
                </View>
            ) : null}
            {content}
        </Wrapper>
    );
}

// ─── Styles ──────────────────────────────────────────────────

const styles = StyleSheet.create({
    card: {
        position: 'relative',
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        ...Platform.select({
            ios:     { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
            android: { elevation: 2 },
            default: {},
        }),
    },
    bareRow: {
        position: 'relative',
        paddingVertical: 10,
        paddingRight: 12,
    },
    rowBadgeWrap: {
        alignSelf: 'flex-start',
        marginBottom: 6,
    },

    // Badge agora no fluxo normal (não-absoluto) — some o overlap com o
    // título/preço e elimina a necessidade do paddingRight:90 no `row`.
    cardBadgeWrap: { alignSelf: 'flex-start', marginBottom: 8 },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 999,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: 0.3,
    },

    // `row` não reserva mais 90px à direita: o badge "Editado/Adicionado"
    // agora vive no fluxo normal (cardBadgeWrap), então o título usa toda a
    // largura disponível. `flexWrap` deixa o pill de preço descer pra linha
    // de baixo se não couber ao lado do título em telas estreitas.
    row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8, flexWrap: 'wrap' },
    flexCol: { flex: 1, minWidth: 0 },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', flexShrink: 1, minWidth: 0 },
    title: {
        fontSize: 15,
        fontWeight: '700',
        color: theme.colors.text.primary,
        flex: 1,
        // minWidth:0 é essencial no RN Web: sem isso um filho flex com texto
        // longo não encolhe e estoura o container (overflow horizontal).
        minWidth: 0,
        lineHeight: 20,
    },
    subhead: { fontSize: 13, fontWeight: '600', color: theme.colors.primary, marginBottom: 6 },
    desc: { fontSize: 13, color: theme.colors.text.secondary, lineHeight: 19, marginBottom: 8 },
    metaText: { fontSize: 12, color: theme.colors.text.secondary, marginBottom: 6 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 4 },

    // alignItems flex-start para o ícone alinhar com a 1ª linha quando o
    // endereço quebra em 2 linhas. flexShrink/minWidth impedem overflow.
    locRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 4, marginBottom: 6, flexShrink: 1, minWidth: 0 },
    locText: { fontSize: 12, color: theme.colors.text.tertiary, flex: 1, minWidth: 0, lineHeight: 16 },
    locIcon: { marginTop: 1 },

    pricePill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: theme.colors.primary + '18',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        flexShrink: 0,
    },
    pricePillText: { fontSize: 12, fontWeight: '700', color: theme.colors.primary },
    greenPill: {
        backgroundColor: theme.colors.success + '18',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        flexShrink: 0,
    },
    greenPillText: { fontSize: 12, fontWeight: '700', color: theme.colors.success },
    typeBadge: {
        backgroundColor: theme.colors.primary + '18',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    typeBadgeText: { fontSize: 11, fontWeight: '700', color: theme.colors.primary },
    cuisineTag: {
        backgroundColor: theme.colors.surfaceLight,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    cuisineTagText: { fontSize: 11, fontWeight: '600', color: theme.colors.text.secondary },
    stopsBadge: {
        backgroundColor: theme.colors.surfaceLight,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    stopsText: { fontSize: 11, fontWeight: '600', color: theme.colors.text.secondary },
    flightRoute: { fontSize: 14, fontWeight: '700', color: theme.colors.primary, marginBottom: 6 },

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

    tipBox: {
        backgroundColor: '#FFFBEB',
        borderRadius: 10,
        padding: 10,
        marginBottom: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#F59E0B',
    },
    tipText: { fontSize: 12, color: '#92400E', lineHeight: 18 },

    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
    ratingText: { fontSize: 13, fontWeight: '700', color: '#F59E0B' },

    actionsRow: { flexDirection: 'row', gap: 8, marginTop: 4, flexWrap: 'wrap' },
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

    tipBulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 4 },
    tipBullet: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: theme.colors.primary,
        marginTop: 7,
    },
    tipBulletText: { flex: 1, fontSize: 13, color: theme.colors.text.secondary, lineHeight: 20 },

    checklistRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 8 },
    checklistText: { fontSize: 13, color: theme.colors.text.primary, lineHeight: 19 },
    checklistCategory: {
        fontSize: 10,
        fontWeight: '700',
        color: theme.colors.text.tertiary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginTop: 2,
    },

    spendingValue: { fontSize: 14, fontWeight: '700', color: theme.colors.primary, marginTop: 4 },

    activityHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
    activityIcon: { fontSize: 15 },
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
});
