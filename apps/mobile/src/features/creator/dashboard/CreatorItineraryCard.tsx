/**
 * Card de roteiro do Portal do Roteirista. Hierarquia: capa (opcional) →
 * título + status → destino/duração/atualização → métricas → ações.
 * Web: ações alinhadas à direita. Mobile: ações em linha abaixo do conteúdo.
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../theme/theme';
import { haptics } from '../../../services/haptics';
import { formatMoney } from '@vamo/shared/itinerary';
import {
    CreatorItinerary, STATUS_CONFIG, QUICK_ACTION, isPendingRevisionOfPublished,
} from './types';

function StatusBadge({ item }: { item: CreatorItinerary }) {
    const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.draft;
    const label = isPendingRevisionOfPublished(item) ? 'Alterações em análise' : cfg.label;
    return (
        <View style={[badge.wrap, { backgroundColor: cfg.bg }]}>
            <Ionicons name={cfg.icon as any} size={11} color={cfg.color} />
            <Text style={[badge.text, { color: cfg.color }]}>{label}</Text>
        </View>
    );
}

function formatUpdated(iso?: string): string | null {
    if (!iso) return null;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function Metric({ value, label, color }: { value: string; label: string; color?: string }) {
    return (
        <View style={card.metric}>
            <Text style={[card.metricVal, color && { color }]}>{value}</Text>
            <Text style={card.metricLabel}>{label}</Text>
        </View>
    );
}

export function CreatorItineraryCard({
    item,
    isWide,
    coverImage,
    onPress,
    onQuickAction,
    onEdit,
    onDelete,
    onViewPublic,
    onShare,
}: {
    item: CreatorItinerary;
    isWide: boolean;
    coverImage?: string;
    onPress: () => void;
    onQuickAction: () => void;
    onEdit: () => void;
    onDelete: () => void;
    /** Abre a página pública (vitrine) do roteiro. Só faz sentido publicado. */
    onViewPublic?: () => void;
    /** Dispara o share-sheet do roteiro. Só faz sentido publicado. */
    onShare?: () => void;
}) {
    const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.draft;
    const qa = QUICK_ACTION[item.status];
    const canEdit = item.status !== 'archived';
    const canDelete = item.status !== 'archived';
    // Vitrine: SÓ quando publicado (active). approved/pending/draft/rejected/
    // paused/archived NÃO estão visíveis ao viajante — não tratamos como tal.
    const canViewPublic = item.status === 'active' && !!onViewPublic;
    const canShare = item.status === 'active' && !!onShare;
    const updated = formatUpdated(item.updatedAt);

    const actions = (
        <View style={[card.actionsRow, isWide && card.actionsRowWide]}>
            {canViewPublic && (
                <TouchableOpacity
                    style={[card.btn, card.publicBtn]}
                    onPress={(e) => { e.stopPropagation?.(); haptics.light(); onViewPublic!(); }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityLabel="Ver roteiro na vitrine"
                >
                    <Ionicons name="eye-outline" size={13} color={theme.colors.primary} />
                    <Text style={[card.btnText, { color: theme.colors.primary }]}>Ver na vitrine</Text>
                </TouchableOpacity>
            )}
            {canShare && (
                <TouchableOpacity
                    style={[card.btn, card.publicBtn]}
                    onPress={(e) => { e.stopPropagation?.(); haptics.light(); onShare!(); }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityLabel="Compartilhar roteiro"
                >
                    <Ionicons name="share-social-outline" size={13} color={theme.colors.primary} />
                    <Text style={[card.btnText, { color: theme.colors.primary }]}>Compartilhar</Text>
                </TouchableOpacity>
            )}
            {canEdit && (
                <TouchableOpacity
                    style={[card.btn, card.editBtn]}
                    onPress={(e) => { e.stopPropagation?.(); haptics.light(); onEdit(); }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityLabel="Editar roteiro"
                >
                    <Ionicons name="create-outline" size={13} color={theme.colors.primary} />
                    <Text style={[card.btnText, { color: theme.colors.primary }]}>Editar</Text>
                </TouchableOpacity>
            )}
            {canDelete && (
                <TouchableOpacity
                    style={[card.btn, card.deleteBtn]}
                    onPress={(e) => { e.stopPropagation?.(); onDelete(); }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityLabel="Arquivar roteiro"
                >
                    <Ionicons name="archive-outline" size={13} color={theme.colors.error} />
                    <Text style={[card.btnText, { color: theme.colors.error }]}>Arquivar</Text>
                </TouchableOpacity>
            )}
            {qa && (
                <TouchableOpacity
                    style={[card.btn, { borderColor: qa.color + '40', backgroundColor: qa.color + '0D' }]}
                    onPress={(e) => { e.stopPropagation?.(); haptics.light(); onQuickAction(); }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <Ionicons name={qa.icon as any} size={13} color={qa.color} />
                    <Text style={[card.btnText, { color: qa.color }]}>{qa.label}</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <TouchableOpacity style={card.container} onPress={onPress} activeOpacity={0.78}>
            <View style={[card.stripe, { backgroundColor: cfg.color }]} />

            {/* Capa (thumbnail) — só quando o roteiro tem imagem disponível.
                Layout já preparado para receber coverImage do backend. */}
            {coverImage ? (
                <Image source={{ uri: coverImage }} style={card.cover} />
            ) : null}

            <View style={card.body}>
                {/* Topo: título + status */}
                <View style={card.titleRow}>
                    <Text style={card.title} numberOfLines={2}>{item.title || 'Sem título'}</Text>
                    <StatusBadge item={item} />
                </View>

                {/* Meta: destino · duração · atualização */}
                <View style={card.metaRow}>
                    <Ionicons name="location-outline" size={12} color={theme.colors.text.tertiary} />
                    <Text style={card.meta} numberOfLines={1}>{item.destination}, {item.country}</Text>
                    <Text style={card.dot}>·</Text>
                    <Ionicons name="calendar-outline" size={12} color={theme.colors.text.tertiary} />
                    <Text style={card.meta}>{item.duration}d</Text>
                    {updated && (
                        <>
                            <Text style={card.dot}>·</Text>
                            <Text style={card.meta}>atualizado {updated}</Text>
                        </>
                    )}
                </View>

                {/* Métricas */}
                <View style={card.metricsRow}>
                    <Metric value={formatMoney(item.price)} label="preço" />
                    {item.sales > 0 && <Metric value={String(item.sales)} label="vendas" />}
                    {item.revenue > 0 && <Metric value={formatMoney(item.revenue)} label="receita" color={theme.colors.success} />}
                    {item.rating > 0 && <Metric value={`★ ${item.rating.toFixed(1)}`} label={`${item.reviewCount} aval.`} color="#F59E0B" />}
                    {typeof item.qualityScore === 'number' && item.qualityScore > 0 && (
                        <Metric value={`${item.qualityScore}%`} label="qualidade" />
                    )}

                    {/* Web: ações à direita na mesma linha das métricas */}
                    {isWide && actions}
                </View>

                {/* Mobile: ações em linha própria abaixo */}
                {!isWide && actions}

                {/* Dicas contextuais */}
                {item.status === 'rejected' && (
                    <View style={card.hint}>
                        <Ionicons name="information-circle-outline" size={13} color={theme.colors.error} />
                        <Text style={[card.hintText, { color: theme.colors.error }]}>Toque para ver o motivo da reprovação</Text>
                    </View>
                )}
                {item.status === 'pending_review' && (
                    <View style={[card.hint, { backgroundColor: '#FEF3C7' }]}>
                        <Ionicons name="time-outline" size={13} color="#D97706" />
                        <Text style={[card.hintText, { color: '#D97706' }]}>
                            {isPendingRevisionOfPublished(item)
                                ? 'Suas alterações estão em análise (até 48h). A versão pública volta após aprovação.'
                                : 'Aguardando análise (até 48h).'}
                        </Text>
                    </View>
                )}
                {item.status === 'draft' && (
                    <View style={[card.hint, { backgroundColor: theme.colors.surfaceLight }]}>
                        <Ionicons name="create-outline" size={13} color={theme.colors.text.tertiary} />
                        <Text style={[card.hintText, { color: theme.colors.text.tertiary }]}>Rascunho — complete e envie para análise</Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
}

const badge = StyleSheet.create({
    wrap: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
    text: { fontSize: 11, fontWeight: '600' },
});

const card = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: theme.colors.surface,
        borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border,
        marginBottom: 10, overflow: 'hidden',
        ...theme.shadows.small,
    },
    stripe: { width: 4 },
    cover: { width: 96, height: '100%', minHeight: 96, backgroundColor: theme.colors.surfaceLight },
    body: { flex: 1, padding: 13, gap: 8 },
    titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
    title: { flex: 1, fontSize: 14.5, fontWeight: '700', color: theme.colors.text.primary, lineHeight: 20 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
    meta: { fontSize: 12, color: theme.colors.text.secondary },
    dot: { fontSize: 12, color: theme.colors.text.tertiary },
    metricsRow: { flexDirection: 'row', alignItems: 'center', gap: 16, flexWrap: 'wrap' },
    metric: { alignItems: 'flex-start' },
    metricVal: { fontSize: 13.5, fontWeight: '700', color: theme.colors.text.primary },
    metricLabel: { fontSize: 10, color: theme.colors.text.tertiary, marginTop: 1 },
    actionsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
    actionsRowWide: { marginLeft: 'auto' },
    btn: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        borderWidth: 1, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 5,
    },
    editBtn: { borderColor: theme.colors.primary + '40', backgroundColor: theme.colors.primary + '0D' },
    deleteBtn: { borderColor: theme.colors.error + '40', backgroundColor: theme.colors.error + '0D' },
    publicBtn: { borderColor: theme.colors.primary + '40', backgroundColor: theme.colors.primary + '0D' },
    btnText: { fontSize: 11, fontWeight: '700' },
    hint: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: theme.colors.error + '10', borderRadius: 7, padding: 7,
    },
    hintText: { flex: 1, fontSize: 11, lineHeight: 15 },
});
