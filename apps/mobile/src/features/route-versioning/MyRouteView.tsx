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
 *  - Long-press → confirma ocultação e, se cancelada, oferece edição
 *    usando o modal global da VAMO em todas as plataformas.
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { theme } from '../../theme/theme';
import { haptics } from '../../services/haptics';
import { confirm } from '../../utils/confirm';

import ItemCard from './ItemCard';
import NotesCard from './NotesCard';
import HiddenItemsSection from './HiddenItemsSection';
import type { MergedItinerary, MergedItem, MergedDay } from './mergeEngine';
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
    /**
     * Reordenar um dia. `direction` indica intenção:
     *   - 'up'   → trocar com o dia imediatamente acima
     *   - 'down' → trocar com o dia imediatamente abaixo
     * O caller (RouteVersioning) atualiza `addedItems.dayOrder` e persiste
     * via PUT. Reativo: a UI re-renderiza com a nova `position` no badge.
     */
    onMoveDay: (day: MergedDay, direction: 'up' | 'down') => void;
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
 * Menu de ações para um card usando o confirm global da VAMO.
 * Tap curto continua abrindo edição diretamente.
 */
async function promptItemAction(
    merged: MergedItem,
    onEdit: () => void,
    onHide: () => void,
) {
    haptics.selection();
    const title = pickItemTitle(merged);

    const hide = await confirm({
        title: 'Ocultar item?',
        message: `"${title}" sumirá da sua versão do roteiro. Você pode restaurar depois.`,
        confirmText: 'Ocultar',
        cancelText: 'Editar',
        destructive: true,
    });
    if (hide) {
        onHide();
        return;
    }
    onEdit();
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
    onMoveDay,
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

    /**
     * Confirmação direta antes de remover. Usada pelos botões visíveis
     * (lápis/lixeira) — assim removemos atalhos com proteção contra clique
     * acidental sem cair no menu duplo do long-press.
     */
    const handleRequestRemove = async (item: MergedItem, label?: string) => {
        if (!canEdit) return;
        haptics.selection();
        const ok = await confirm({
            title: 'Remover este item?',
            message: label
                ? `"${label}" será removido apenas da sua versão. A versão original continua intacta.`
                : 'Esse item será removido apenas da sua versão. A versão original continua intacta.',
            confirmText: 'Remover',
            cancelText: 'Cancelar',
            destructive: true,
        });
        if (ok) onHideItem(item);
    };

    /**
     * Converte um `MergedDay` em `MergedItem` para reutilizar os callbacks
     * genéricos `onEditItem` / `onHideItem` — o RouteVersioning já entende
     * `kind: 'day'` (editedOriginalItems['day:N'] / hiddenOriginalIds /
     * addedItems.days).
     */
    const dayToMergedItem = (day: MergedDay): MergedItem => ({
        kind: 'day',
        source: day.source,
        originalId: day.originalId,
        addedId: day.addedId,
        data: {
            dayNumber: day.dayNumber,
            title: day.title,
            summary: day.summary,
            description: day.description,
        },
    });

    /** Próximo dayNumber livre — usado como sugestão no AddItemModal de dia. */
    const nextAvailableDayNumber = useMemo(() => {
        if (sections.days.length === 0) return 1;
        const max = Math.max(...sections.days.map(d => d.dayNumber));
        return max + 1;
    }, [sections.days]);

    const handleEditDay = (day: MergedDay) => {
        haptics.light();
        onEditItem(dayToMergedItem(day));
    };

    const handleRemoveDay = async (day: MergedDay) => {
        if (!canEdit) return;
        haptics.selection();
        const dayLabel = day.title ? `Dia ${day.dayNumber} · ${day.title}` : `Dia ${day.dayNumber}`;
        const ok = await confirm({
            title: 'Remover este dia?',
            message: `${dayLabel} será removido apenas da sua versão. A versão original continua intacta.`,
            confirmText: 'Remover dia',
            cancelText: 'Cancelar',
            destructive: true,
        });
        if (ok) onHideItem(dayToMergedItem(day));
    };

    const handleAddDay = () => {
        haptics.light();
        // Pré-preenche o próximo número livre via defaults — o modal mostra
        // como valor inicial editável.
        onAddItem('day', { dayNumber: nextAvailableDayNumber });
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
            {(sections.days.length > 0 || canEdit) ? (
                <View style={styles.block}>
                    <SectionTitle
                        icon="map-outline"
                        label="Itinerário por Dia"
                        subtitle={canEdit ? 'Edite ou remova dias. Adicione novos dias no fim da lista.' : undefined}
                    />
                    {sections.days.map((day) => {
                        const expanded = expandedDays.has(day.dayNumber);
                        const isAdded = day.source === 'added';
                        const isEdited = day.source === 'edited';
                        // Visual: badge mostra `position` (1-based após dayOrder).
                        // `dayNumber` continua sendo a identidade interna do dia.
                        // Mostramos "(antigo Dia N)" quando a posição não bate
                        // com o número original — útil pro user entender que
                        // ele moveu o dia.
                        const showOldDayHint = !isAdded && day.position !== day.dayNumber;
                        const canMoveUp = day.position > 1;
                        const canMoveDown = day.position < sections.days.length;
                        return (
                            <View key={day.key} style={styles.dayCard}>
                                <TouchableOpacity
                                    style={styles.dayHeader}
                                    onPress={() => toggleDay(day.dayNumber)}
                                    activeOpacity={0.75}
                                >
                                    <LinearGradient
                                        colors={theme.colors.gradients.action as unknown as [string, string]}
                                        style={styles.dayBadge}
                                    >
                                        <Text style={styles.dayBadgeNum}>{day.position}</Text>
                                        <Text style={styles.dayBadgeLabel}>DIA</Text>
                                    </LinearGradient>
                                    <View style={{ flex: 1 }}>
                                        <View style={styles.dayTitleRow}>
                                            <Text style={styles.dayTitle} numberOfLines={1}>
                                                {day.title || `Dia ${day.position}`}
                                            </Text>
                                            {isAdded ? (
                                                <View style={styles.dayBadgePill}>
                                                    <Text style={styles.dayBadgePillText}>NOVO</Text>
                                                </View>
                                            ) : isEdited ? (
                                                <View style={[styles.dayBadgePill, styles.dayBadgePillEdited]}>
                                                    <Text style={styles.dayBadgePillText}>EDITADO</Text>
                                                </View>
                                            ) : null}
                                        </View>
                                        {showOldDayHint ? (
                                            <Text style={styles.dayOldHint}>
                                                Era originalmente Dia {day.dayNumber}
                                            </Text>
                                        ) : null}
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

                                {/* Ações do dia — sempre visíveis quando expanded e canEdit */}
                                {expanded && canEdit ? (
                                    <View style={styles.dayActionsRow}>
                                        <TouchableOpacity
                                            style={[
                                                styles.dayActionBtn,
                                                !canMoveUp && styles.dayActionBtnDisabled,
                                            ]}
                                            onPress={() => {
                                                if (!canMoveUp) return;
                                                haptics.selection();
                                                onMoveDay(day, 'up');
                                            }}
                                            disabled={!canMoveUp}
                                            activeOpacity={0.85}
                                            accessibilityLabel="Mover dia para cima"
                                        >
                                            <Ionicons
                                                name="arrow-up"
                                                size={14}
                                                color={canMoveUp ? theme.colors.primary : theme.colors.text.tertiary}
                                            />
                                            <Text
                                                style={[
                                                    styles.dayActionLabel,
                                                    !canMoveUp && { color: theme.colors.text.tertiary },
                                                ]}
                                            >
                                                Subir
                                            </Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[
                                                styles.dayActionBtn,
                                                !canMoveDown && styles.dayActionBtnDisabled,
                                            ]}
                                            onPress={() => {
                                                if (!canMoveDown) return;
                                                haptics.selection();
                                                onMoveDay(day, 'down');
                                            }}
                                            disabled={!canMoveDown}
                                            activeOpacity={0.85}
                                            accessibilityLabel="Mover dia para baixo"
                                        >
                                            <Ionicons
                                                name="arrow-down"
                                                size={14}
                                                color={canMoveDown ? theme.colors.primary : theme.colors.text.tertiary}
                                            />
                                            <Text
                                                style={[
                                                    styles.dayActionLabel,
                                                    !canMoveDown && { color: theme.colors.text.tertiary },
                                                ]}
                                            >
                                                Descer
                                            </Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.dayActionBtn}
                                            onPress={() => handleEditDay(day)}
                                            activeOpacity={0.85}
                                        >
                                            <Ionicons name="pencil-outline" size={14} color={theme.colors.primary} />
                                            <Text style={styles.dayActionLabel}>Editar</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.dayActionBtn}
                                            onPress={() => { void handleRemoveDay(day); }}
                                            activeOpacity={0.85}
                                        >
                                            <Ionicons name="trash-outline" size={14} color={theme.colors.error} />
                                            <Text style={[styles.dayActionLabel, { color: theme.colors.error }]}>
                                                Remover
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : null}

                                {expanded ? (
                                    <View style={styles.dayContent}>
                                        {day.activities.length === 0 ? (
                                            <Text style={styles.emptyDayText}>
                                                Nenhuma atividade para este dia.
                                            </Text>
                                        ) : (
                                            day.activities.map((activity, idx) => (
                                                <View key={
                                                    activity.originalId ||
                                                    activity.addedId ||
                                                    `act-${day.dayNumber}-${idx}`
                                                }>
                                                    <TouchableOpacity
                                                        activeOpacity={canEdit ? 0.85 : 1}
                                                        onPress={() => canEdit && handleCardPress(activity)}
                                                        onLongPress={
                                                            canEdit
                                                                ? () => handleCardLongPress(activity)
                                                                : undefined
                                                        }
                                                        delayLongPress={350}
                                                    >
                                                        <ItemCard merged={activity} />
                                                    </TouchableOpacity>
                                                    <CardActions
                                                        canEdit={canEdit}
                                                        onEdit={() => onEditItem(activity)}
                                                        onRemove={() => {
                                                            void handleRequestRemove(
                                                                activity,
                                                                pickItemTitle(activity),
                                                            );
                                                        }}
                                                    />
                                                </View>
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

                    {canEdit ? (
                        <AddRowButton
                            label={`Adicionar dia ${nextAvailableDayNumber}`}
                            onPress={handleAddDay}
                        />
                    ) : null}
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
                onRequestRemove={(item) => { void handleRequestRemove(item, pickItemTitle(item)); }}
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
                onRequestRemove={(item) => { void handleRequestRemove(item, pickItemTitle(item)); }}
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
                onRequestRemove={(item) => { void handleRequestRemove(item, pickItemTitle(item)); }}
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
                onRequestRemove={(item) => { void handleRequestRemove(item, pickItemTitle(item)); }}
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
                onRequestRemove={(item) => { void handleRequestRemove(item, pickItemTitle(item)); }}
            />

            {/* ── Dicas ── (read mode limpo + toggle de edição) ──
                Diferente das outras seções, "Dicas do Viajante" usa um
                modo edição: read-only por padrão (bullets + texto, sem
                ações por item) e edição ativada por um único botão no
                cabeçalho. O CardActions repetido por item poluía visual
                num bloco que é, por natureza, mais textual. */}
            <TipsSection
                items={sections.generalTips}
                canEdit={canEdit}
                onAdd={() => onAddItem('generalTips')}
                onTap={handleCardPress}
                onRequestRemove={(item) => { void handleRequestRemove(item, pickItemTitle(item)); }}
            />

            {/* ── Gastos Extras ── (read mode limpo + toggle de edição) ──
                Mesmo padrão visual das Dicas: o "Editar"/"Remover" sob
                cada item virava ruído num bloco com vários gastos curtos.
                Modo edição centralizado por seção tira essa poluição. */}
            <ExtraSpendingSection
                items={sections.extraSpendingItems}
                canEdit={canEdit}
                onAdd={() => onAddItem('extraSpendingItems')}
                onTap={handleCardPress}
                onRequestRemove={(item) => { void handleRequestRemove(item, pickItemTitle(item)); }}
            />

            {/* ── Checklist ── REMOVIDO daqui.
                O checklist vive APENAS dentro da "Minha Central da Viagem"
                (ChecklistTab), nunca solto na Minha Versão. O mergeEngine
                continua agregando `checklistItems` para compat com PDF,
                snapshots e migrations, mas a UI não renderiza essa seção
                aqui. Não duplicar. */}

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
    /** Chamado quando o usuário aperta o botão lixeira no CardActions. */
    onRequestRemove: (item: MergedItem) => void;
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
    onRequestRemove,
    grouped,
}: ListSectionProps) {
    if (items.length === 0 && !canEdit) return null;

    const content = items.length > 0 ? (
        items.map((item, idx) => (
            <View key={item.originalId || item.addedId || `${kind}-${idx}`}>
                <TouchableOpacity
                    activeOpacity={canEdit ? 0.85 : 1}
                    onPress={() => canEdit && onTap(item)}
                    onLongPress={() => canEdit && onLongPress(item)}
                    delayLongPress={350}
                >
                    <ItemCard merged={item} />
                </TouchableOpacity>
                <CardActions
                    canEdit={canEdit}
                    onEdit={() => onTap(item)}
                    onRemove={() => { void onRequestRemove(item); }}
                />
            </View>
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

/**
 * Seção "Dicas do Viajante" com modo edição.
 *
 * Por padrão a lista é puramente textual (bullets + texto). Quando o
 * usuário toca em "Editar", a seção entra em modo edição:
 *  - cada dica vira tocável (tap abre EditItemModal);
 *  - aparece um ícone de lixeira discreto à direita de cada dica;
 *  - o botão troca pra "Concluir".
 *
 * Decisão deliberada: NÃO reutilizamos o CardActions visível das outras
 * seções aqui. Dicas costumam ser várias frases curtas e o ruído de duas
 * linhas de ações abaixo de cada uma quebrava a leitura. Outras seções
 * (hospedagens, atrações, etc.) seguem com CardActions porque os cards
 * são maiores e poucos.
 */
function TipsSection({
    items,
    canEdit,
    onAdd,
    onTap,
    onRequestRemove,
}: {
    items: MergedItem[];
    canEdit: boolean;
    onAdd: () => void;
    onTap: (item: MergedItem) => void;
    onRequestRemove: (item: MergedItem) => void;
}) {
    const [editMode, setEditMode] = useState(false);

    if (items.length === 0 && !canEdit) return null;

    const canShowToggle = canEdit && items.length > 0;

    return (
        <View style={styles.block}>
            {/* Header: título + toggle de modo edição */}
            <View style={styles.tipsHeader}>
                <View style={styles.sectionRow}>
                    <View style={styles.sectionIcon}>
                        <Ionicons name="bulb-outline" size={16} color={theme.colors.primary} />
                    </View>
                    <Text style={styles.sectionTitle}>Dicas do Viajante</Text>
                </View>
                {canShowToggle ? (
                    <TouchableOpacity
                        style={[styles.tipsToggleBtn, editMode && styles.tipsToggleBtnActive]}
                        onPress={() => {
                            haptics.selection();
                            setEditMode(prev => !prev);
                        }}
                        activeOpacity={0.85}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        accessibilityLabel={editMode ? 'Concluir edição das dicas' : 'Editar dicas'}
                    >
                        <Ionicons
                            name={editMode ? 'checkmark' : 'pencil'}
                            size={13}
                            color={editMode ? '#fff' : theme.colors.primary}
                        />
                        <Text
                            style={[
                                styles.tipsToggleLabel,
                                editMode && styles.tipsToggleLabelActive,
                            ]}
                        >
                            {editMode ? 'Concluir' : 'Editar'}
                        </Text>
                    </TouchableOpacity>
                ) : null}
            </View>

            {/* Hint sutil mostrando que está em modo edição */}
            {editMode && items.length > 0 ? (
                <Text style={styles.tipsEditHint}>
                    Toque numa dica para editar. Use a lixeira para remover.
                </Text>
            ) : null}

            {/* Lista */}
            {items.length > 0 ? (
                <View style={styles.groupedCard}>
                    {items.map((tip, idx) => {
                        const key = tip.originalId || tip.addedId || `tip-${idx}`;
                        return (
                            <View key={key} style={styles.tipRow}>
                                <View style={{ flex: 1 }}>
                                    <TouchableOpacity
                                        activeOpacity={editMode ? 0.7 : 1}
                                        onPress={() => editMode && onTap(tip)}
                                        disabled={!editMode}
                                    >
                                        <ItemCard merged={tip} />
                                    </TouchableOpacity>
                                </View>
                                {editMode && canEdit ? (
                                    <TouchableOpacity
                                        style={styles.tipDeleteBtn}
                                        onPress={() => onRequestRemove(tip)}
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                        accessibilityLabel="Remover dica"
                                    >
                                        <Ionicons
                                            name="trash-outline"
                                            size={15}
                                            color={theme.colors.text.tertiary}
                                        />
                                    </TouchableOpacity>
                                ) : null}
                            </View>
                        );
                    })}
                </View>
            ) : null}

            {items.length === 0 ? (
                <Text style={styles.emptySectionHint}>
                    Você ainda não adicionou dicas. Guarde aqui lembretes e dicas pessoais desta viagem.
                </Text>
            ) : null}

            {canEdit ? (
                <AddRowButton label="Adicionar dica" onPress={onAdd} />
            ) : null}
        </View>
    );
}

/**
 * Seção "Gastos Extras" com modo edição.
 *
 * Mesmo padrão do TipsSection: read mode limpo (cards puros, zero
 * CardActions abaixo) + toggle "Editar"/"Concluir" no canto direito do
 * header. Em edit mode aparece lixeira discreta à direita de cada card
 * e tocar no card abre o EditItemModal.
 *
 * Por que não reusei o ListSection: ele renderiza CardActions abaixo de
 * cada item ALWAYS. Pra Gastos Extras isso virava ruído visual igual ao
 * das Dicas. Componente próprio mantém ListSection genérica e simples.
 */
function ExtraSpendingSection({
    items,
    canEdit,
    onAdd,
    onTap,
    onRequestRemove,
}: {
    items: MergedItem[];
    canEdit: boolean;
    onAdd: () => void;
    onTap: (item: MergedItem) => void;
    onRequestRemove: (item: MergedItem) => void;
}) {
    const [editMode, setEditMode] = useState(false);

    if (items.length === 0 && !canEdit) return null;
    const canShowToggle = canEdit && items.length > 0;

    return (
        <View style={styles.block}>
            <View style={styles.tipsHeader}>
                <View style={styles.sectionRow}>
                    <View style={styles.sectionIcon}>
                        <Ionicons name="wallet-outline" size={16} color={theme.colors.primary} />
                    </View>
                    <Text style={styles.sectionTitle}>Gastos Extras</Text>
                </View>
                {canShowToggle ? (
                    <TouchableOpacity
                        style={[styles.tipsToggleBtn, editMode && styles.tipsToggleBtnActive]}
                        onPress={() => {
                            haptics.selection();
                            setEditMode(prev => !prev);
                        }}
                        activeOpacity={0.85}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        accessibilityLabel={editMode ? 'Concluir edição dos gastos' : 'Editar seção'}
                    >
                        <Ionicons
                            name={editMode ? 'checkmark' : 'pencil'}
                            size={13}
                            color={editMode ? '#fff' : theme.colors.primary}
                        />
                        <Text
                            style={[
                                styles.tipsToggleLabel,
                                editMode && styles.tipsToggleLabelActive,
                            ]}
                        >
                            {editMode ? 'Concluir' : 'Editar seção'}
                        </Text>
                    </TouchableOpacity>
                ) : null}
            </View>

            {editMode && items.length > 0 ? (
                <Text style={styles.tipsEditHint}>
                    Toque num gasto para editar. Use a lixeira para remover.
                </Text>
            ) : null}

            {items.length > 0 ? (
                items.map((it, idx) => {
                    const key = it.originalId || it.addedId || `extra-${idx}`;
                    return (
                        <View key={key} style={styles.tipRow}>
                            <View style={{ flex: 1 }}>
                                <TouchableOpacity
                                    activeOpacity={editMode ? 0.85 : 1}
                                    onPress={() => editMode && onTap(it)}
                                    disabled={!editMode}
                                >
                                    <ItemCard merged={it} />
                                </TouchableOpacity>
                            </View>
                            {editMode && canEdit ? (
                                <TouchableOpacity
                                    style={styles.tipDeleteBtn}
                                    onPress={() => onRequestRemove(it)}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    accessibilityLabel="Remover gasto"
                                >
                                    <Ionicons
                                        name="trash-outline"
                                        size={15}
                                        color={theme.colors.text.tertiary}
                                    />
                                </TouchableOpacity>
                            ) : null}
                        </View>
                    );
                })
            ) : null}

            {canEdit ? (
                <>
                    {items.length === 0 ? (
                        <Text style={styles.emptySectionHint}>
                            Nenhum gasto extra adicionado. Inclua chip, seguro, bagagem e outros custos da viagem.
                        </Text>
                    ) : null}
                    <AddRowButton label="Adicionar gasto extra" onPress={onAdd} />
                </>
            ) : null}
        </View>
    );
}

/**
 * Row de ações visíveis abaixo de um ItemCard. Garante que o usuário
 * NÃO precise descobrir o long-press — todo card mostra explicitamente
 * "Editar" e "Remover".
 *
 * Compacta (32px altura) pra não competir visualmente com o conteúdo
 * do card. Some quando o usuário não pode editar.
 */
function CardActions({
    canEdit,
    onEdit,
    onRemove,
}: {
    canEdit: boolean;
    onEdit: () => void;
    onRemove: () => void;
}) {
    if (!canEdit) return null;
    return (
        <View style={styles.cardActionsRow}>
            <TouchableOpacity
                style={styles.cardActionBtn}
                onPress={() => { haptics.selection(); onEdit(); }}
                activeOpacity={0.85}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
                <Ionicons name="pencil-outline" size={13} color={theme.colors.primary} />
                <Text style={styles.cardActionLabel}>Editar</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.cardActionBtn}
                onPress={() => { haptics.selection(); onRemove(); }}
                activeOpacity={0.85}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
                <Ionicons name="trash-outline" size={13} color={theme.colors.error} />
                <Text style={[styles.cardActionLabel, { color: theme.colors.error }]}>
                    Remover
                </Text>
            </TouchableOpacity>
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
    onRequestRemove: (item: MergedItem) => void;
}

function FlightSection({
    outbound,
    inbound,
    canEdit,
    onAddOutbound,
    onAddInbound,
    onTap,
    onLongPress,
    onRequestRemove,
}: FlightSectionProps) {
    if (!outbound && !inbound && !canEdit) return null;

    return (
        <View style={styles.block}>
            <SectionTitle icon="airplane-outline" label="Meu Voo" />

            {outbound ? (
                <View>
                    <TouchableOpacity
                        activeOpacity={canEdit ? 0.85 : 1}
                        onPress={() => canEdit && onTap(outbound)}
                        onLongPress={() => canEdit && onLongPress(outbound)}
                        delayLongPress={350}
                    >
                        <ItemCard merged={outbound} />
                    </TouchableOpacity>
                    <CardActions
                        canEdit={canEdit}
                        onEdit={() => onTap(outbound)}
                        onRemove={() => onRequestRemove(outbound)}
                    />
                </View>
            ) : canEdit ? (
                <AddRowButton label="Adicionar voo de ida" onPress={onAddOutbound} />
            ) : null}

            {inbound ? (
                <View>
                    <TouchableOpacity
                        activeOpacity={canEdit ? 0.85 : 1}
                        onPress={() => canEdit && onTap(inbound)}
                        onLongPress={() => canEdit && onLongPress(inbound)}
                        delayLongPress={350}
                    >
                        <ItemCard merged={inbound} />
                    </TouchableOpacity>
                    <CardActions
                        canEdit={canEdit}
                        onEdit={() => onTap(inbound)}
                        onRemove={() => onRequestRemove(inbound)}
                    />
                </View>
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

    // Row de título + badge "NOVO/EDITADO" no header do dia.
    dayTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    dayBadgePill: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        backgroundColor: theme.colors.primary,
    },
    dayBadgePillEdited: {
        backgroundColor: theme.colors.warning,
    },
    dayBadgePillText: {
        fontSize: 9,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: 0.6,
    },

    // Ações do dia (subir, descer, editar, remover) — visíveis quando
    // expanded e canEdit. Usa flexWrap pra acomodar 4 botões em telas
    // mobile estreitas (cada um vira pílula compacta).
    dayActionsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: theme.colors.borderLight,
        backgroundColor: theme.colors.surfaceLight,
    },
    dayActionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    dayActionBtnDisabled: {
        opacity: 0.45,
    },
    dayActionLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: theme.colors.primary,
    },
    dayOldHint: {
        fontSize: 11,
        color: theme.colors.text.tertiary,
        marginTop: 2,
        fontStyle: 'italic',
    },

    // Seção "Dicas do Viajante" — header com toggle de edição.
    tipsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 14,
    },
    tipsToggleBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: theme.colors.primary + '38',
        backgroundColor: theme.colors.primary + '10',
    },
    tipsToggleBtnActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    tipsToggleLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: theme.colors.primary,
    },
    tipsToggleLabelActive: {
        color: '#fff',
    },
    tipsEditHint: {
        fontSize: 11,
        color: theme.colors.text.tertiary,
        marginBottom: 10,
        marginLeft: 2,
        fontStyle: 'italic',
    },
    // Texto explicativo quando a seção (Dicas/Gastos Extras) está vazia.
    emptySectionHint: {
        fontSize: 12.5,
        color: theme.colors.text.tertiary,
        lineHeight: 18,
        marginBottom: 10,
        marginTop: 2,
    },
    // Cada dica dentro do groupedCard em modo edição.
    tipRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
    },
    tipDeleteBtn: {
        marginTop: 4,
        width: 28,
        height: 28,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.surfaceLight,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },

    // Ações de card de item — lápis/lixeira pequenos abaixo de cada ItemCard.
    cardActionsRow: {
        flexDirection: 'row',
        gap: 14,
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        marginTop: -8,
        marginBottom: 8,
    },
    cardActionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    cardActionLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: theme.colors.primary,
    },
});
