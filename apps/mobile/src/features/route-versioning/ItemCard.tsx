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
    return (
        <>
            <View style={styles.row}>
                <Text style={styles.title} numberOfLines={2}>{data?.name || 'Hospedagem'}</Text>
                {data?.priceRange ? (
                    <View style={styles.pricePill}>
                        <Text style={styles.pricePillText}>{String(data.priceRange)}</Text>
                    </View>
                ) : null}
            </View>
            {(data?.address || data?.location || data?.neighborhood) ? (
                <View style={styles.locRow}>
                    <Ionicons name="location-outline" size={12} color={theme.colors.text.tertiary} />
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
            <View style={styles.row}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.title} numberOfLines={2}>{data?.name || 'Atração'}</Text>
                    <View style={styles.metaRow}>
                        {data?.type ? (
                            <View style={styles.typeBadge}>
                                <Text style={styles.typeBadgeText}>{String(data.type)}</Text>
                            </View>
                        ) : null}
                        {data?.location ? (
                            <View style={styles.locRow}>
                                <Ionicons name="location-outline" size={11} color={theme.colors.text.tertiary} />
                                <Text style={styles.locText} numberOfLines={1}>{String(data.location)}</Text>
                            </View>
                        ) : null}
                    </View>
                </View>
                {data?.ticketPrice ? (
                    <View style={styles.pricePill}>
                        <Ionicons name="card-outline" size={11} color={theme.colors.primary} />
                        <Text style={styles.pricePillText}>{String(data.ticketPrice)}</Text>
                    </View>
                ) : null}
            </View>
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
                <View style={{ flex: 1 }}>
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
                            <Ionicons name="location-outline" size={11} color={theme.colors.text.tertiary} />
                            <Text style={styles.locText} numberOfLines={2}>{String(data.location)}</Text>
                        </View>
                    ) : null}
                </View>
                {data?.priceRange ? (
                    <View style={styles.greenPill}>
                        <Text style={styles.greenPillText}>{String(data.priceRange)}</Text>
                    </View>
                ) : null}
            </View>
            {data?.description ? (
                <Text style={styles.desc}>{String(data.description)}</Text>
            ) : null}
            {data?.hours ? (
                <Text style={styles.metaText}>🕐 {String(data.hours)}</Text>
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
    const price = data?.priceValue
        ? `${data.priceValue}${data.priceCurrency ? ` ${data.priceCurrency}` : ''}`
        : null;
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
    const cost = data?.cost;
    const amount = parseFloat(String(data?.value ?? cost?.amount ?? '0')) || 0;
    const currency = data?.currency || cost?.currency || 'AUD';
    const informed = !!cost && cost?.disclosureType !== 'not_informed' && amount > 0;
    return (
        <>
            <Text style={styles.title}>{data?.title || 'Gasto extra'}</Text>
            {data?.description ? (
                <Text style={styles.desc}>{String(data.description)}</Text>
            ) : null}
            {informed ? (
                <Text style={styles.spendingValue}>
                    {amount.toFixed(2)} {currency}
                </Text>
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
                    <Ionicons name="location-outline" size={11} color={theme.colors.text.tertiary} />
                    <Text style={styles.locText} numberOfLines={1}>{String(data.location)}</Text>
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

    return (
        <Wrapper {...wrapperProps} style={styles.card}>
            {showBadge ? <SourceBadge source={source} /> : null}
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

    badge: {
        position: 'absolute',
        top: 10,
        right: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 999,
        zIndex: 1,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: 0.3,
    },

    row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8, paddingRight: 90 },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
    title: {
        fontSize: 15,
        fontWeight: '700',
        color: theme.colors.text.primary,
        flex: 1,
        lineHeight: 20,
    },
    subhead: { fontSize: 13, fontWeight: '600', color: theme.colors.primary, marginBottom: 6 },
    desc: { fontSize: 13, color: theme.colors.text.secondary, lineHeight: 19, marginBottom: 8 },
    metaText: { fontSize: 12, color: theme.colors.text.secondary, marginBottom: 6 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 4 },

    locRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 6 },
    locText: { fontSize: 12, color: theme.colors.text.tertiary, flex: 1 },

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
