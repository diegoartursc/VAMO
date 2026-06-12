/**
 * ChecklistTab separa itens originais e pessoais. Itens do criador só
 * podem ser marcados; itens do viajante têm CRUD completo.
 *
 * Padrão de UX usado em TODAS as ações:
 *   haptics.light() → otimista → API → sucesso/rollback + notify.
 */

import React, { useMemo, useRef, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../../theme/theme';
import { haptics } from '../../services/haptics';
import { notify } from '../../utils/notify';
import { confirm } from '../../utils/confirm';
import {
    addChecklistItem,
    updateChecklistItem,
    deleteChecklistItem,
    type TravelerChecklistItem,
} from '../../services/tripCenter';
import AddChecklistItemModal from './AddChecklistItemModal';
import EmptyState from './EmptyState';

// Tipos amplos para aceitar tanto o shape vindo do roteiro quanto strings puras.
type CreatorChecklistItem = string | {
    id?: string;
    text?: string;
    item?: string;
    category?: string;
};

export interface ChecklistTabProps {
    itineraryId: string;
    token: string | null;
    creatorChecklist: CreatorChecklistItem[];
    items: TravelerChecklistItem[];
    onItemsChange: (next: TravelerChecklistItem[]) => void;
    canEdit: boolean;
    creatorProgress?: Record<string, boolean>;
    creatorProgressPending?: boolean;
    onUpdateCreatorProgress?: (next: Record<string, boolean>) => Promise<void>;
}

/**
 * Alvo de edição abstrato. Origem decide como persistir:
 *   - traveler → updateChecklistItem API
 *   - creator  → onUpdateCreatorOverrides com edits[key]
 */
type EditTarget = { origin: 'traveler'; ref: TravelerChecklistItem };

/**
 * Item visualizado na lista unificada. Carrega origem internamente para
 * decidir o caminho de persistência das ações.
 */
interface UnifiedItem {
    /** Composite id estável usado como key React. */
    id: string;
    origin: 'creator' | 'traveler';
    /** Para creator: chave estável pra usar em overrides ("id:..."/"idx:..."). */
    creatorKey?: string;
    /** Para traveler: referência ao TravelerChecklistItem original. */
    travelerRef?: TravelerChecklistItem;
    item: string;
    category: string;
    completed: boolean;
    /** Sinaliza visualmente que o item creator foi editado. */
    edited?: boolean;
}

function normalizeCreatorText(it: CreatorChecklistItem): string {
    if (typeof it === 'string') return it;
    return (it.text || it.item || '').toString();
}

function normalizeCreatorCategory(it: CreatorChecklistItem): string {
    if (typeof it === 'string') return '';
    return (it.category || '').toString().trim();
}

/**
 * Mapeia categorias (DB pt-BR ou legado en) para rótulos visíveis ao
 * usuário, com fallback "Geral" para itens sem categoria.
 *
 * Critério: aceita ambos os formatos para não quebrar roteiros antigos
 * cujos checklists ainda venham só como string[] (sem categoria) ou que
 * usem as chaves em inglês do mock antigo.
 */
function formatCategoryLabel(rawCategory: string): string {
    const cat = (rawCategory || '').toString().trim().toLowerCase();
    if (!cat) return 'Geral';
    const map: Record<string, string> = {
        // pt-BR (formato canônico do banco)
        documentos: 'Documentos',
        mala: 'Mala',
        'pre-viagem': 'Pré-viagem',
        'pré-viagem': 'Pré-viagem',
        saúde: 'Saúde',
        saude: 'Saúde',
        transporte: 'Transporte',
        hospedagem: 'Hospedagem',
        finanças: 'Finanças',
        financas: 'Finanças',
        dinheiro: 'Dinheiro',
        segurança: 'Segurança',
        seguranca: 'Segurança',
        'apps úteis': 'Apps Úteis',
        'apps uteis': 'Apps Úteis',
        personalizado: 'Personalizado',
        custom: 'Personalizado',
        outros: 'Outros',
        // legado en (mock antigo)
        documents: 'Documentos',
        packing: 'Mala',
        'pre-trip': 'Pré-viagem',
        general: 'Geral',
    };
    if (map[cat]) return map[cat];
    // Sem mapeamento — capitaliza primeira letra como fallback elegante.
    return cat.charAt(0).toUpperCase() + cat.slice(1);
}

function tmpId(): string {
    return `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function ChecklistTab({
    itineraryId,
    token,
    creatorChecklist,
    items,
    onItemsChange,
    canEdit,
    creatorProgress = {},
    creatorProgressPending = false,
    onUpdateCreatorProgress,
}: ChecklistTabProps) {
    const [modalVisible, setModalVisible] = useState(false);
    const [editing, setEditing] = useState<EditTarget | null>(null);
    const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
    const pendingIdsRef = useRef<Set<string>>(new Set());
    // Modo edição único — read-only por padrão, ações discretas só
    // aparecem quando o usuário toca em "Editar". Mesmo padrão das Dicas.
    const [editMode, setEditMode] = useState(false);

    // Normaliza creator items uma vez. Aceita string pura (legado) ou
    // objeto com { id, category, item/text }.
    const creatorRows = useMemo(() => {
        return creatorChecklist
            .map((raw, idx) => {
                const text = normalizeCreatorText(raw);
                if (!text) return null;
                const key =
                    typeof raw === 'object' && raw?.id
                        ? `id:${raw.id}`
                        : `idx:${idx}`;
                const category = normalizeCreatorCategory(raw);
                return { key, text, category };
            })
            .filter(Boolean) as Array<{ key: string; text: string; category: string }>;
    }, [creatorChecklist]);

    /** Lista de apresentação; a origem controla as ações permitidas. */
    const unified = useMemo<UnifiedItem[]>(() => {
        const out: UnifiedItem[] = [];

        for (const row of creatorRows) {
            out.push({
                id: `creator:${row.key}`,
                origin: 'creator',
                creatorKey: row.key,
                item: row.text,
                category: row.category,
                completed: !!creatorProgress[row.key],
            });
        }

        for (const it of items) {
            out.push({
                id: `traveler:${it.id}`,
                origin: 'traveler',
                travelerRef: it,
                item: it.item,
                category: it.category,
                completed: it.completed,
            });
        }

        return out;
    }, [creatorRows, items, creatorProgress]);

    /**
     * Lista unificada agrupada por categoria. "Geral" no fim, demais
     * ordenadas alfabeticamente em pt-BR. Vazias somem.
     */
    const grouped = useMemo<Array<[string, UnifiedItem[]]>>(() => {
        const map = new Map<string, UnifiedItem[]>();
        for (const u of unified) {
            const label = `${u.origin}|${formatCategoryLabel(u.category)}`;
            const list = map.get(label) ?? [];
            list.push(u);
            map.set(label, list);
        }
        return [...map.entries()].sort(([a], [b]) => {
            return a.localeCompare(b, 'pt-BR');
        });
    }, [unified]);

    const markPending = (id: string, on: boolean) => {
        const immediate = new Set(pendingIdsRef.current);
        if (on) immediate.add(id); else immediate.delete(id);
        pendingIdsRef.current = immediate;
        setPendingIds(prev => {
            const next = new Set(prev);
            if (on) next.add(id); else next.delete(id);
            return next;
        });
    };

    // ─── Toggle (marcar/desmarcar) — roteia pela origem ───
    const handleToggle = async (u: UnifiedItem) => {
        if (!canEdit) return;
        if (u.origin === 'creator' && u.creatorKey) {
            if (creatorProgressPending || pendingIdsRef.current.has(u.id)) return;
            haptics.light();
            const next = { ...creatorProgress, [u.creatorKey]: !creatorProgress[u.creatorKey] };
            markPending(u.id, true);
            try {
                await onUpdateCreatorProgress?.(next);
                haptics.success();
            } catch {
                haptics.error();
            } finally {
                markPending(u.id, false);
            }
            return;
        }
        if (u.origin === 'traveler' && u.travelerRef && token) {
            const it = u.travelerRef;
            if (pendingIdsRef.current.has(u.id)) return;
            haptics.light();
            const prev = items;
            const next = items.map(x => x.id === it.id ? { ...x, completed: !x.completed } : x);
            onItemsChange(next);
            markPending(u.id, true);
            try {
                const saved = await updateChecklistItem(itineraryId, it.id, { completed: !it.completed }, token);
                onItemsChange(next.map(x => x.id === it.id ? saved : x));
                haptics.success();
            } catch (e: any) {
                onItemsChange(prev);
                haptics.error();
                notify({ title: 'Não foi possível salvar', message: e?.message || 'Tente novamente.', variant: 'error' });
            } finally {
                markPending(u.id, false);
            }
        }
    };

    // ─── Add / Edit (modal compartilhado) ───
    const handleAdd = async (payload: { category: string; item: string }) => {
        if (editing) {
            // Editando: rota depende da origem do alvo.
            const target = editing;
            if (target.origin === 'traveler' && token) {
                const ref = target.ref;
                const prev = items;
                const next = items.map(x =>
                    x.id === ref.id ? { ...x, category: payload.category, item: payload.item } : x,
                );
                onItemsChange(next);
                try {
                    const saved = await updateChecklistItem(itineraryId, ref.id, payload, token);
                    onItemsChange(next.map(x => x.id === ref.id ? saved : x));
                    haptics.success();
                    setEditing(null);
                } catch (e: any) {
                    onItemsChange(prev);
                    haptics.error();
                    notify({ title: 'Não foi possível salvar', message: e?.message || 'Tente novamente.', variant: 'error' });
                    throw e;
                }
                return;
            }
            return;
        }

        // Criação — sempre adiciona como traveler item via API.
        if (!token) throw new Error('Sessão expirada.');
        const tmp: TravelerChecklistItem = {
            id: tmpId(),
            travelerId: '',
            itineraryId,
            purchaseId: null,
            saleId: null,
            category: payload.category,
            item: payload.item,
            completed: false,
            order: items.length,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        const prev = items;
        onItemsChange([...items, tmp]);
        try {
            const saved = await addChecklistItem(itineraryId, payload, token);
            onItemsChange([...prev, saved]);
            haptics.success();
        } catch (e: any) {
            onItemsChange(prev);
            haptics.error();
            notify({ title: 'Não foi possível adicionar', message: e?.message || 'Tente novamente.', variant: 'error' });
            throw e;
        }
    };

    const handleEdit = (u: UnifiedItem) => {
        if (!canEdit) return;
        if (u.origin === 'traveler' && u.travelerRef) {
            setEditing({ origin: 'traveler', ref: u.travelerRef });
            setModalVisible(true);
            return;
        }
    };

    // ─── Delete — creator vira hidden override; traveler vira DELETE API ───
    const handleDelete = async (u: UnifiedItem) => {
        if (!canEdit) return;
        if (u.origin !== 'traveler') return;
        const ok = await confirm({
            title: 'Excluir item?',
            message: 'Este item será removido do seu checklist pessoal da viagem.',
            confirmText: 'Excluir',
            destructive: true,
        });
        if (!ok) return;

        if (u.origin === 'traveler' && u.travelerRef && token) {
            const it = u.travelerRef;
            haptics.light();
            const prev = items;
            const idx = items.findIndex(x => x.id === it.id);
            const next = items.filter(x => x.id !== it.id);
            onItemsChange(next);
            try {
                await deleteChecklistItem(itineraryId, it.id, token);
                haptics.success();
            } catch (e: any) {
                // Re-insere na posição original.
                const restored = [...next];
                restored.splice(Math.max(0, idx), 0, it);
                onItemsChange(restored.length === next.length ? prev : restored);
                haptics.error();
                notify({ title: 'Não foi possível remover', message: e?.message || 'Tente novamente.', variant: 'error' });
            }
        }
    };

    const openAdd = () => {
        if (!canEdit) return;
        setEditing(null);
        setModalVisible(true);
    };

    /** Initial values pro modal de add/edit. */
    const editingInitial = editing
        ? { category: editing.ref.category, item: editing.ref.item }
        : null;

    const hasAnyItem = unified.length > 0;
    return (
        <View>
            <View style={styles.group}>
                <View style={styles.groupHeaderRow}>
                    <Text style={styles.groupTitle}>Checklist da viagem</Text>
                    <View style={styles.groupHeaderActions}>
                        {canEdit && items.length > 0 ? (
                            <TouchableOpacity
                                style={[styles.editToggleBtn, editMode && styles.editToggleBtnActive]}
                                onPress={() => {
                                    haptics.selection();
                                    setEditMode(prev => !prev);
                                }}
                                activeOpacity={0.85}
                                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                                accessibilityLabel={editMode ? 'Concluir edição' : 'Editar itens'}
                            >
                                <Ionicons
                                    name={editMode ? 'checkmark' : 'pencil'}
                                    size={12}
                                    color={editMode ? '#fff' : theme.colors.primary}
                                />
                                <Text
                                    style={[
                                        styles.editToggleLabel,
                                        editMode && styles.editToggleLabelActive,
                                    ]}
                                >
                                    {editMode ? 'Concluir' : 'Editar'}
                                </Text>
                            </TouchableOpacity>
                        ) : null}
                        {canEdit && (
                            <TouchableOpacity onPress={openAdd} style={styles.addBtn} activeOpacity={0.85}>
                                <Ionicons name="add" size={16} color="#fff" />
                                <Text style={styles.addBtnLabel}>Adicionar</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
                {editMode && hasAnyItem ? (
                    <Text style={styles.editModeHint}>
                        Toque no lápis para editar, na lixeira para remover.
                    </Text>
                ) : null}

                {!hasAnyItem ? (
                    <EmptyState
                        icon="checkbox-outline"
                        title="Comece seu checklist"
                        text="Anote o que importa pra você nesta viagem — documentos, mala, pequenas tarefas."
                        ctaLabel={canEdit ? 'Adicionar primeiro item' : undefined}
                        onCta={canEdit ? openAdd : undefined}
                        disabled={!canEdit}
                    />
                ) : (
                    grouped.map(([cat, list]) => {
                        const [origin, categoryLabel] = cat.split('|');
                        return (
                        <View key={cat} style={styles.subgroup}>
                            <Text style={styles.subgroupLabel}>
                                {origin === 'creator' ? 'DO ROTEIRO' : 'MEU CHECKLIST'} · {categoryLabel}
                            </Text>
                            {list.map(u => {
                                // Pending só faz sentido pra traveler item.
                                const pending = pendingIds.has(u.id)
                                    || (u.origin === 'creator' && creatorProgressPending);
                                // ESTRUTURA ACHATADA OBRIGATÓRIA — TouchableOpacity
                                // aninhado quebrava o tap da lixeira no Expo Web.
                                // Toggle é UM sub-TouchableOpacity; ações são
                                // SIBLINGS, não filhos.
                                return (
                                    <View key={u.id} style={styles.row}>
                                        <TouchableOpacity
                                            style={styles.toggleArea}
                                            onPress={() => { void handleToggle(u); }}
                                            onLongPress={u.origin === 'traveler' ? () => handleEdit(u) : undefined}
                                            activeOpacity={0.7}
                                            disabled={!canEdit || pending}
                                            accessibilityLabel={
                                                u.completed
                                                    ? `Desmarcar ${u.item}`
                                                    : `Marcar ${u.item}`
                                            }
                                        >
                                            <View style={[styles.check, u.completed && styles.checkActive]}>
                                                {u.completed && <Ionicons name="checkmark" size={14} color="#fff" />}
                                            </View>
                                            <Text
                                                style={[styles.rowText, u.completed && styles.rowTextChecked]}
                                                numberOfLines={3}
                                            >
                                                {u.item}
                                            </Text>
                                        </TouchableOpacity>
                                        {canEdit && pending && (
                                            <View style={styles.rowActions}>
                                                <ActivityIndicator size="small" color={theme.colors.primary} />
                                            </View>
                                        )}
                                        {canEdit && u.origin === 'traveler' && !pending && editMode && (
                                            <View style={styles.rowActions}>
                                                <TouchableOpacity
                                                    onPress={() => handleEdit(u)}
                                                    hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                                                    style={styles.actionBtn}
                                                    accessibilityLabel="Editar item"
                                                >
                                                    <Ionicons name="pencil" size={16} color={theme.colors.primary} />
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    onPress={() => { void handleDelete(u); }}
                                                    hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                                                    style={[styles.actionBtn, styles.actionBtnDanger]}
                                                    accessibilityLabel="Excluir item"
                                                >
                                                    <Ionicons name="trash-outline" size={16} color={theme.colors.error} />
                                                </TouchableOpacity>
                                            </View>
                                        )}
                                    </View>
                                );
                            })}
                        </View>
                    )})
                )}
            </View>

            <AddChecklistItemModal
                visible={modalVisible}
                onClose={() => { setModalVisible(false); setEditing(null); }}
                onSave={handleAdd}
                initial={editingInitial}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    group: {
        marginTop: 14,
    },
    groupHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    groupTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: theme.colors.text.primary,
    },
    groupHint: {
        fontSize: 12,
        color: theme.colors.text.secondary,
        marginBottom: 8,
    },
    addBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: theme.colors.primary,
    },
    addBtnLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#fff',
    },
    groupHeaderActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    editToggleBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: theme.colors.primary + '38',
        backgroundColor: theme.colors.primary + '10',
    },
    editToggleBtnActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    editToggleLabel: {
        fontSize: 11.5,
        fontWeight: '700',
        color: theme.colors.primary,
    },
    editToggleLabelActive: {
        color: '#fff',
    },
    editModeHint: {
        fontSize: 11,
        color: theme.colors.text.tertiary,
        marginTop: 4,
        marginBottom: 4,
        marginLeft: 2,
        fontStyle: 'italic',
    },
    subgroup: {
        marginTop: 10,
    },
    subgroupLabel: {
        fontSize: 11,
        fontWeight: '800',
        color: theme.colors.primaryDark,
        textTransform: 'uppercase',
        letterSpacing: 0.4,
        marginBottom: 6,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 14,
        backgroundColor: theme.colors.surfaceLight,
        marginBottom: 6,
        minHeight: 44,
    },
    // Área tocável que dispara toggleTraveler (marcar/desmarcar). Fica
    // dentro do row mas é SIBLING dos botões de ação — assim o tap nas
    // ações não dispara o toggle. `flex: 1` ocupa o espaço sobrando após
    // os botões de ação.
    toggleArea: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 6,
        minHeight: 32,
    },
    check: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 1.5,
        borderColor: theme.colors.border,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    rowText: {
        flex: 1,
        fontSize: 14,
        color: theme.colors.text.primary,
        lineHeight: 18,
    },
    rowTextChecked: {
        textDecorationLine: 'line-through',
        color: theme.colors.text.tertiary,
    },
    rowActions: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
    },
    actionBtn: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.glass.primary,
    },
    actionBtnDanger: {
        backgroundColor: theme.colors.error + '14',
    },
});
