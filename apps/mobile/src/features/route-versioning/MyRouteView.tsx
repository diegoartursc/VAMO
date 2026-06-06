/**
 * MyRouteView — aba "Minha versão" do roteiro pós-compra.
 *
 * Renderiza o `MergedItinerary` (snapshot + customization) com:
 *  - NotesCard no topo (debounce 500ms via onPatch({ notes }));
 *  - Cada seção (hospedagens, voos, passeios, transporte, restaurantes,
 *    dicas, checklist, gastos extras) com header + lista de ItemCards
 *    + botão "+ Adicionar <kind>" no fim;
 *  - Dias do itinerário com timeline de atividades (kind dayActivity)
 *    e botão "+ Adicionar atividade" por dia;
 *  - HiddenItemsSection no fim (collapsible) para restaurar ocultados.
 *
 * Interações:
 *  - Toque curto no card → abre EditItemModal (Personalizar/Editar).
 *  - Long-press → menu "Editar / Ocultar" via Alert.alert (com fallback
 *    `confirm()` para web). Decisão: usamos Alert.alert + confirm()
 *    aqui pq RN não tem ActionSheet web e o menu é simples (2 opções).
 *
 * Não toca em IDs ou estado de overlay diretamente — emite callbacks:
 *  - `onPatch(patch)`        — qualquer patch parcial (ex.: notes).
 *  - `onAddItem(...)`        — pediu para abrir AddItemModal.
 *  - `onEditItem(merged)`    — pediu para abrir EditItemModal.
 *  - `onHideItem(merged)`    — confirmou ocultar.
 *  - `onRestoreHidden(item)` — quer trazer de volta do HiddenItemsSection.
 *
 * O caller (RouteVersioning) lida com modais, IDs, PUT e rollback.
 */

import React, { useMemo, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { theme } from '../../theme/theme';
import { haptics } from '../../services/haptics';
import { confirm } from '../../utils/confirm';

import ItemCard from './ItemCard';
import NotesCard from './NotesCard';
import HiddenItemsSection from './HiddenItemsSection';
import type { MergedItinerary, MergedItem } from './mergeEngine';
import type { ItemKind, CustomizationPatch } from '../../services/routeCustomization';

// ─── Props ─────────────────────────────────────────────────────

export interface MyRouteViewProps {
    merged: MergedItinerary;
    canEdit: boolean;
    /** Patch parcial — usado para notes (e qualquer mutação simples). */
    onPatch: (patch: CustomizationPatch) => void | Promise<void>;
    /** Pediu para abrir AddItemModal para `kind` (com defaults opcionais). */
    onAddItem: (kind: ItemKind, defaults?: Record<string, any> | null) => void;
    /** Pediu para abrir EditItemModal sobre `merged`. */
    onEditItem: (merged: MergedItem) => void;
    /** Confirmou ocultar. */
    onHideItem: (merged: MergedItem) => void;
    /** Quer restaurar um item oculto. */
    onRestoreHidden: (merged: MergedItem) => void;
}

// ─── Helpers ──────────────────────────────────────────────────

function pickItemTitle(merged: MergedItem): string {
    const d = merged.data || {};
    return (
        d.title ||
        d.name ||
        d.description ||
        d.item ||
        d.text ||
        d.tip ||
        d.airline ||
        'Item'
    );
}

/**
 * Menu de ações para um card. Web → `confirm()` (sequência de 2 dialogs
 * é ruim, então fazemos um único confirm "Editar?" e fallback no botão
 * de ocultar via long-press secundário). Native → Alert.alert com 3 opções.
 *
 * Comportamento simplificado:
 *  - Tap curto → onEdit (sempre).
 *  - Long-press → menu "O que fazer com este item?" → escolhe ocultar
 *    (web/web nativos diferentes; usamos Alert quando disponível).
 */
async function promptItemAction(
    merged: MergedItem,
    onEdit: () => void,
    onHide: () => void,
) {
    haptics.selection();
    const title = pickItemTitle(merged);

    if (Platform.OS === 'web') {
        // Web: Alert.alert é no-op. Usamos confirm() em duas etapas:
        // primeiro perguntamos se quer ocultar; se não, oferecemos editar.
        const hide = await confirm({
            title: 'Ocultar item?',
            message: `"${title}" sumirá da sua versão do roteiro. Você pode restaurar depois.`,
            confirmText: 'Ocultar',
            cancelText: 'Não',
            destructive: true,
        });
        if (hide) {
            onHide();
            return;
        }
        const edit = await confirm({
            title: 'Editar?',
            message: 'Deseja personalizar este item?',
            confirmText: 'Editar',
            cancelText: 'Cancelar',
        });
        if (edit) onEdit();
        return;
    }

    Alert.alert(
        title,
        'O que você quer fazer?',
        [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Editar', onPress: () => onEdit() },
            { text: 'Ocultar', style: 'destructive', onPress: () => onHide() },
        ],
        { cancelable: true },
    );
}

// ─── Componente ───────────────────────────────────────────────

export default function MyRouteView({
    merged,
    canEdit,
    onPatch,
    onAddItem,
    onEditItem,
    onHideItem,
    onRestoreHidden,
}: MyRouteViewProps) {
    const [expandedDays, setExpandedDays] = useState<Set<number>>(() => new Set([1]));

    const sections = useMemo(() => ({
        accommodations: merged.accommodations,
        transports: merged.transports,
        attractions: merged.attractions,
        restaurants: merged.restaurants,
        generalTips: merged.generalTips,
        checklistItems: merged.checklistItems,
        extraSpendingItems: merged.extraSpendingItems,
        flightOutbound: merged.flightOutbound,
        flightReturn: merged.flightReturn,
        days: merged.days,
        hidden: merged.hidden,
    }), [merged]);

    const toggleDay = (n: number) => {
        haptics.selection();
        setExpandedDays((prev) => {
            const next = new Set(prev);
            if (next.has(n)) next.delete(n); else next.add(n);
            return next;
        });
    };

    const handleCardPress = (item: MergedItem) => {
        if (!canEdit) return;
        haptics.light();
        onEditItem(item);
    };

    const handleCardLongPress = (item: MergedItem) => {
        if (!canEdit) return;
        void promptItemAction(
            item,
            () => onEditItem(item),
            () => onHideItem(item),
        );
    };

    return (
        <View>
            {/* ── Notas pessoais ── */}
            <NotesCard
                value={merged.notes}
                onChange={(next) => onPatch({ notes: next })}
                readOnly={!canEdit}
            />

            {/* ── Itinerário por Dia ── */}
            {sections.days.length > 0 ? (
                <View style={styles.block}>
                    <SectionTitle icon="map-outline" label="Itinerário por Dia" />
                    {sections.days.map((day) => {
                        const expanded = expandedDays.has(day.dayNumber);
                        return (
                            <View key={day.dayNumber} style={styles.dayCard}>
                                <TouchableOpacity
                                    style={styles.dayHeader}
                                    onPress={() => toggleDay(day.dayNumber)}
                                    activeOpacity={0.75}
                                >
                                    <LinearGradient
                                        colors={theme.colors.gradients.action as unknown as [string, string]}
                                        style={styles.dayBadge}
                                    >
                                        <Text style={styles.dayBadgeNum}>{day.dayNumber}</Text>
                                        <Text style={styles.dayBadgeLabel}>DIA</Text>
                                    </LinearGradient>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.dayTitle} numberOfLines={1}>
                                            {day.title || `Dia ${day.dayNumber}`}
                                        </Text>
                                        {day.summary ? (
                                            <Text style={styles.daySummary} numberOfLines={1}>
                                                {day.summary}
                                            </Text>
                                        ) : null}
                                    </View>
                                    <View style={[styles.chevron, expanded && styles.chevronActive]}>
                                        <Ionicons
                                            name={expanded ? 'chevron-up' : 'chevron-down'}
                                            size={16}
                                            color={expanded ? '#fff' : theme.colors.text.tertiary}
                                        />
                                    </View>
                                </TouchableOpacity>

                                {expanded ? (
                                    <View style={styles.dayContent}>
                                        {day.activities.length === 0 ? (
                                            <Text style={styles.emptyDayText}>
                                                Nenhuma atividade para este dia.
                                            </Text>
                                        ) : (
                                            day.activities.map((activity, idx) => (
                                                <ItemCard
                                                    key={
                                                        activity.originalId ||
                                                        activity.addedId ||
                                                        `act-${day.dayNumber}-${idx}`
                                                    }
                                                    merged={activity}
                                                    onLongPress={
                                                        canEdit
                                                            ? () => handleCardLongPress(activity)
                                                            : undefined
                                                    }
                                                />
                                            ))
                                        )}

                                        {canEdit ? (
                                            <AddRowButton
                                                label="Adicionar atividade"
                                                onPress={() =>
                                                    onAddItem('dayActivity', { dayNumber: day.dayNumber })
                                                }
                                            />
                                        ) : null}
                                    </View>
                                ) : null}
                            </View>
                        );
                    })}
                </View>
            ) : null}

            {/* ── Hospedagens ── */}
            <ListSection
                kind="accommodations"
                items={sections.accommodations}
                icon="home-outline"
                label="Onde Fiquei"
                addLabel="Adicionar hospedagem"
                canEdit={canEdit}
                onAdd={() => onAddItem('accommodations')}
                onTap={handleCardPress}
                onLongPress={handleCardLongPress}
            />

            {/* ── Voos ── */}
            <FlightSection
                outbound={sections.flightOutbound}
                inbound={sections.flightReturn}
                canEdit={canEdit}
                onAddOutbound={() => onAddItem('flightOutbound')}
                onAddInbound={() => onAddItem('flightReturn')}
                onTap={handleCardPress}
                onLongPress={handleCardLongPress}
            />

            {/* ── Passeios ── */}
            <ListSection
                kind="attractions"
                items={sections.attractions}
                icon="camera-outline"
                label="Passeios & Atrações"
                addLabel="Adicionar passeio"
                canEdit={canEdit}
                onAdd={() => onAddItem('attractions')}
                onTap={handleCardPress}
                onLongPress={handleCardLongPress}
            />

            {/* ── Transporte ── */}
            <ListSection
                kind="transports"
                items={sections.transports}
                icon="navigate-outline"
                label="Transporte"
                addLabel="Adicionar transporte"
                canEdit={canEdit}
                onAdd={() => onAddItem('transports')}
                onTap={handleCardPress}
                onLongPress={handleCardLongPress}
            />

            {/* ── Restaurantes ── */}
            <ListSection
                kind="restaurants"
                items={sections.restaurants}
                icon="restaurant-outline"
                label="Restaurantes"
                addLabel="Adicionar restaurante"
                canEdit={canEdit}
                onAdd={() => onAddItem('restaurants')}
                onTap={handleCardPress}
                onLongPress={handleCardLongPress}
            />

            {/* ── Dicas ── */}
            <ListSection
                kind="generalTips"
                items={sections.generalTips}
                icon="bulb-outline"
                label="Dicas do Viajante"
                addLabel="Adicionar dica"
                canEdit={canEdit}
                onAdd={() => onAddItem('generalTips')}
                onTap={handleCardPress}
                onLongPress={handleCardLongPress}
                grouped
            />

            {/* ── Gastos Extras ── */}
            <ListSection
                kind="extraSpendingItems"
                items={sections.extraSpendingItems}
                icon="wallet-outline"
                label="Gastos Extras"
                addLabel="Adicionar gasto extra"
                canEdit={canEdit}
                onAdd={() => onAddItem('extraSpendingItems')}
                onTap={handleCardPress}
                onLongPress={handleCardLongPress}
            />

            {/* ── Checklist ── */}
            <ListSection
                kind="checklistItems"
                items={sections.checklistItems}
                icon="checkmark-circle-outline"
                label="Checklist"
                addLabel="Adicionar item ao checklist"
                canEdit={canEdit}
                onAdd={() => onAddItem('checklistItems')}
                onTap={handleCardPress}
                onLongPress={handleCardLongPress}
                grouped
            />

            {/* ── Itens ocultados ── */}
            <HiddenItemsSection
                hidden={sections.hidden}
                onRestore={onRestoreHidden}
                readOnly={!canEdit}
            />
        </View>
    );
}

// ─── Subcomponentes locais ────────────────────────────────────

function SectionTitle({ icon, label, subtitle }: { icon: string; label: string; subtitle?: string }) {
    return (
        <View style={styles.sectionHeader}>
            <View style={styles.sectionRow}>
                <View style={styles.sectionIcon}>
                    <Ionicons name={icon as any} size={16} color={theme.colors.primary} />
                </View>
                <Text style={styles.sectionTitle}>{label}</Text>
            </View>
            {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
        </View>
    );
}

function AddRowButton({ label, onPress }: { label: string; onPress: () => void }) {
    return (
        <TouchableOpacity
            style={styles.addRowBtn}
            onPress={() => {
                haptics.light();
                onPress();
            }}
            activeOpacity={0.85}
        >
            <Ionicons name="add-circle-outline" size={16} color={theme.colors.primary} />
            <Text style={styles.addRowText}>{label}</Text>
        </TouchableOpacity>
    );
}

interface ListSectionProps {
    kind: ItemKind;
    items: MergedItem[];
    icon: string;
    label: string;
    addLabel: string;
    canEdit: boolean;
    onAdd: () => void;
    onTap: (item: MergedItem) => void;
    onLongPress: (item: MergedItem) => void;
    /** Para tips/checklist: agrupar visualmente num único card. */
    grouped?: boolean;
}

function ListSection({
    kind,
    items,
    icon,
    label,
    addLabel,
    canEdit,
    onAdd,
    onTap,
    onLongPress,
    grouped,
}: ListSectionProps) {
    if (items.length === 0 && !canEdit) return null;

    const content = items.length > 0 ? (
        items.map((item, idx) => (
            <TouchableOpacity
                key={item.originalId || item.addedId || `${kind}-${idx}`}
                activeOpacity={canEdit ? 0.85 : 1}
                onPress={() => canEdit && onTap(item)}
                onLongPress={() => canEdit && onLongPress(item)}
                delayLongPress={350}
            >
                <ItemCard
                    merged={item}
                    // Long-press passamos via wrapper acima para conseguir
                    // tap+longpress no mesmo node. Não duplicamos com prop.
                />
            </TouchableOpacity>
        ))
    ) : (
        <Text style={styles.emptyText}>Nenhum item nesta seção.</Text>
    );

    return (
        <View style={styles.block}>
            <SectionTitle icon={icon} label={label} />
            {grouped ? (
                <View style={styles.groupedCard}>{content}</View>
            ) : (
                content
            )}
            {canEdit ? <AddRowButton label={addLabel} onPress={onAdd} /> : null}
        </View>
    );
}

interface FlightSectionProps {
    outbound: MergedItem | null;
    inbound: MergedItem | null;
    canEdit: boolean;
    onAddOutbound: () => void;
    onAddInbound: () => void;
    onTap: (item: MergedItem) => void;
    onLongPress: (item: MergedItem) => void;
}

function FlightSection({
    outbound,
    inbound,
    canEdit,
    onAddOutbound,
    onAddInbound,
    onTap,
    onLongPress,
}: FlightSectionProps) {
    if (!outbound && !inbound && !canEdit) return null;

    return (
        <View style={styles.block}>
            <SectionTitle icon="airplane-outline" label="Meu Voo" />

            {outbound ? (
                <TouchableOpacity
                    activeOpacity={canEdit ? 0.85 : 1}
                    onPress={() => canEdit && onTap(outbound)}
                    onLongPress={() => canEdit && onLongPress(outbound)}
                    delayLongPress={350}
                >
                    <ItemCard merged={outbound} />
                </TouchableOpacity>
            ) : canEdit ? (
                <AddRowButton label="Adicionar voo de ida" onPress={onAddOutbound} />
            ) : null}

            {inbound ? (
                <TouchableOpacity
                    activeOpacity={canEdit ? 0.85 : 1}
                    onPress={() => canEdit && onTap(inbound)}
                    onLongPress={() => canEdit && onLongPress(inbound)}
                    delayLongPress={350}
                >
                    <ItemCard merged={inbound} />
                </TouchableOpacity>
            ) : canEdit ? (
                <AddRowButton label="Adicionar voo de volta" onPress={onAddInbound} />
            ) : null}
        </View>
    );
}

// ─── Styles ──────────────────────────────────────────────────

const styles = StyleSheet.create({
    block: { marginBottom: 28 },

    sectionHeader: { marginBottom: 14 },
    sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    sectionIcon: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: theme.colors.primary + '18',
        alignItems: 'center',
        justifyContent: 'center',
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: theme.colors.text.primary,
        letterSpacing: -0.2,
    },
    sectionSubtitle: {
        fontSize: 12.5,
        color: theme.colors.text.tertiary,
        marginTop: 4,
        marginLeft: 42,
    },

    emptyText: {
        fontSize: 13,
        color: theme.colors.text.tertiary,
        fontStyle: 'italic',
        textAlign: 'center',
        paddingVertical: 12,
    },
    emptyDayText: {
        fontSize: 13,
        color: theme.colors.text.tertiary,
        fontStyle: 'italic',
        paddingVertical: 4,
    },

    groupedCard: {
        backgroundColor: theme.colors.surfaceLight,
        borderRadius: 14,
        padding: 12,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },

    addRowBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        alignSelf: 'flex-start',
        marginTop: 4,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: theme.colors.primary + '55',
        backgroundColor: theme.colors.primary + '0A',
    },
    addRowText: {
        fontSize: 13,
        fontWeight: '700',
        color: theme.colors.primary,
    },

    // Day accordion (espelha OriginalView)
    dayCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        marginBottom: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    dayHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        gap: 12,
    },
    dayBadge: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dayBadgeNum: { fontSize: 18, fontWeight: '900', color: '#fff', lineHeight: 20 },
    dayBadgeLabel: { fontSize: 8, fontWeight: '700', color: 'rgba(255,255,255,0.75)', letterSpacing: 0.8 },
    dayTitle: { fontSize: 14, fontWeight: '700', color: theme.colors.text.primary },
    daySummary: { fontSize: 12, color: theme.colors.text.secondary, marginTop: 2 },
    chevron: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surfaceLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    chevronActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    dayContent: {
        paddingHorizontal: 12,
        paddingBottom: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: theme.colors.borderLight,
    },
});
