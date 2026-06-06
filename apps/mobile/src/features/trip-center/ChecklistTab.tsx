/**
 * ChecklistTab — duas listas dentro da Central da Viagem:
 *   1. "Do roteiro" — itens definidos pelo criador (read-only no banco).
 *      O viajante pode marcar/desmarcar, e o progresso é guardado
 *      LOCALMENTE em AsyncStorage (chave por itinerário). Não bate
 *      no backend, porque mutar o checklist do criador afetaria outras
 *      compras desse mesmo roteiro.
 *   2. "Meu checklist" — itens criados pelo próprio viajante, full
 *      CRUD via API (otimista com rollback). Inclui um botão "Adicionar"
 *      no rodapé do grupo.
 *
 * Padrão de UX usado em todas as ações:
 *   haptics.light() → atualização otimista → API → success/rollback.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
}

interface DraftEditTarget {
    id: string;
    category: string;
    item: string;
}

function normalizeCreatorText(it: CreatorChecklistItem): string {
    if (typeof it === 'string') return it;
    return (it.text || it.item || '').toString();
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
}: ChecklistTabProps) {
    const [creatorProgress, setCreatorProgress] = useState<Record<string, boolean>>({});
    const [hydratedProgress, setHydratedProgress] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editing, setEditing] = useState<DraftEditTarget | null>(null);
    const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

    const storageKey = `@vamo_creator_checklist_progress:${itineraryId}`;

    // Hidrata o progresso local do checklist do roteiro.
    useEffect(() => {
        let active = true;
        (async () => {
            try {
                const raw = await AsyncStorage.getItem(storageKey);
                if (active && raw) {
                    setCreatorProgress(JSON.parse(raw));
                }
            } catch {
                /* ignore — fresh state é OK */
            } finally {
                if (active) setHydratedProgress(true);
            }
        })();
        return () => { active = false; };
    }, [storageKey]);

    const persistCreatorProgress = async (next: Record<string, boolean>) => {
        try {
            await AsyncStorage.setItem(storageKey, JSON.stringify(next));
        } catch {
            /* best-effort */
        }
    };

    const creatorRows = useMemo(() => {
        return creatorChecklist
            .map((raw, idx) => {
                const text = normalizeCreatorText(raw);
                if (!text) return null;
                const key =
                    typeof raw === 'object' && raw?.id
                        ? `id:${raw.id}`
                        : `idx:${idx}`;
                return { key, text };
            })
            .filter(Boolean) as Array<{ key: string; text: string }>;
    }, [creatorChecklist]);

    const grouped = useMemo(() => {
        const map = new Map<string, TravelerChecklistItem[]>();
        for (const it of items) {
            const list = map.get(it.category) ?? [];
            list.push(it);
            map.set(it.category, list);
        }
        // Ordena por categoria alfabética só para estabilidade visual.
        return [...map.entries()].sort(([a], [b]) => a.localeCompare(b, 'pt-BR'));
    }, [items]);

    // ── Ações no checklist do roteiro (local apenas) ──
    const toggleCreator = (key: string) => {
        if (!canEdit) return;
        haptics.light();
        const next = { ...creatorProgress, [key]: !creatorProgress[key] };
        setCreatorProgress(next);
        void persistCreatorProgress(next);
    };

    // ── Ações no "Meu checklist" (API + otimista) ──
    const markPending = (id: string, on: boolean) => {
        setPendingIds(prev => {
            const next = new Set(prev);
            if (on) next.add(id); else next.delete(id);
            return next;
        });
    };

    const toggleTraveler = async (it: TravelerChecklistItem) => {
        if (!canEdit || !token) return;
        haptics.light();
        const prev = items;
        const next = items.map(x => x.id === it.id ? { ...x, completed: !x.completed } : x);
        onItemsChange(next);
        markPending(it.id, true);
        try {
            const saved = await updateChecklistItem(itineraryId, it.id, { completed: !it.completed }, token);
            onItemsChange(next.map(x => x.id === it.id ? saved : x));
            haptics.success();
        } catch (e: any) {
            onItemsChange(prev);
            haptics.error();
            notify({ title: 'Não foi possível salvar', message: e?.message || 'Tente novamente.' });
        } finally {
            markPending(it.id, false);
        }
    };

    const handleAdd = async (payload: { category: string; item: string }) => {
        if (!token) throw new Error('Sessão expirada.');
        if (editing) {
            // Edição
            const target = editing;
            const prev = items;
            const next = items.map(x =>
                x.id === target.id ? { ...x, category: payload.category, item: payload.item } : x,
            );
            onItemsChange(next);
            try {
                const saved = await updateChecklistItem(itineraryId, target.id, payload, token);
                onItemsChange(next.map(x => x.id === target.id ? saved : x));
                haptics.success();
                setEditing(null);
            } catch (e: any) {
                onItemsChange(prev);
                haptics.error();
                notify({ title: 'Não foi possível salvar', message: e?.message || 'Tente novamente.' });
                throw e;
            }
            return;
        }
        // Criação
        const tmp: TravelerChecklistItem = {
            id: tmpId(),
            travelerId: '',
            itineraryId,
            purchaseId: null,
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
            notify({ title: 'Não foi possível adicionar', message: e?.message || 'Tente novamente.' });
            throw e;
        }
    };

    const handleEdit = (it: TravelerChecklistItem) => {
        if (!canEdit) return;
        setEditing({ id: it.id, category: it.category, item: it.item });
        setModalVisible(true);
    };

    const handleDelete = async (it: TravelerChecklistItem) => {
        if (!canEdit || !token) return;
        const ok = await confirm({
            title: 'Remover item?',
            message: `"${it.item}" será removido do seu checklist.`,
            confirmText: 'Remover',
            destructive: true,
        });
        if (!ok) return;

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
            notify({ title: 'Não foi possível remover', message: e?.message || 'Tente novamente.' });
        }
    };

    const openAdd = () => {
        if (!canEdit) return;
        setEditing(null);
        setModalVisible(true);
    };

    return (
        <View>
            {/* Do roteiro */}
            {creatorRows.length > 0 && (
                <View style={styles.group}>
                    <Text style={styles.groupTitle}>Do roteiro</Text>
                    <Text style={styles.groupHint}>
                        Sugestões do(a) roteirista. Marque o que já está pronto.
                    </Text>
                    {!hydratedProgress ? (
                        <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 10 }} />
                    ) : (
                        creatorRows.map(row => {
                            const checked = !!creatorProgress[row.key];
                            return (
                                <TouchableOpacity
                                    key={row.key}
                                    style={styles.row}
                                    onPress={() => toggleCreator(row.key)}
                                    activeOpacity={0.7}
                                    disabled={!canEdit}
                                >
                                    <View style={[styles.check, checked && styles.checkActive]}>
                                        {checked && <Ionicons name="checkmark" size={14} color="#fff" />}
                                    </View>
                                    <Text
                                        style={[styles.rowText, checked && styles.rowTextChecked]}
                                        numberOfLines={3}
                                    >
                                        {row.text}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })
                    )}
                </View>
            )}

            {/* Meu checklist */}
            <View style={styles.group}>
                <View style={styles.groupHeaderRow}>
                    <Text style={styles.groupTitle}>Meu checklist</Text>
                    {canEdit && (
                        <TouchableOpacity onPress={openAdd} style={styles.addBtn} activeOpacity={0.85}>
                            <Ionicons name="add" size={16} color="#fff" />
                            <Text style={styles.addBtnLabel}>Adicionar</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {items.length === 0 ? (
                    <EmptyState
                        icon="checkbox-outline"
                        title="Comece sua lista pessoal"
                        text="Anote o que importa pra você nesta viagem — documentos, mala, pequenas tarefas."
                        ctaLabel={canEdit ? 'Adicionar primeiro item' : undefined}
                        onCta={canEdit ? openAdd : undefined}
                        disabled={!canEdit}
                    />
                ) : (
                    grouped.map(([cat, list]) => (
                        <View key={cat} style={styles.subgroup}>
                            <Text style={styles.subgroupLabel}>{cat}</Text>
                            {list.map(it => {
                                const pending = pendingIds.has(it.id);
                                return (
                                    <TouchableOpacity
                                        key={it.id}
                                        style={styles.row}
                                        onPress={() => toggleTraveler(it)}
                                        onLongPress={() => handleEdit(it)}
                                        activeOpacity={0.7}
                                        disabled={!canEdit}
                                    >
                                        <View style={[styles.check, it.completed && styles.checkActive]}>
                                            {it.completed && <Ionicons name="checkmark" size={14} color="#fff" />}
                                        </View>
                                        <Text
                                            style={[styles.rowText, it.completed && styles.rowTextChecked]}
                                            numberOfLines={3}
                                        >
                                            {it.item}
                                        </Text>
                                        {canEdit && (
                                            <View style={styles.rowActions}>
                                                {pending ? (
                                                    <ActivityIndicator size="small" color={theme.colors.primary} />
                                                ) : (
                                                    <>
                                                        <TouchableOpacity
                                                            onPress={() => handleEdit(it)}
                                                            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                                                        >
                                                            <Ionicons name="pencil" size={16} color={theme.colors.text.tertiary} />
                                                        </TouchableOpacity>
                                                        <TouchableOpacity
                                                            onPress={() => handleDelete(it)}
                                                            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                                                        >
                                                            <Ionicons name="trash-outline" size={16} color={theme.colors.text.tertiary} />
                                                        </TouchableOpacity>
                                                    </>
                                                )}
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    ))
                )}
            </View>

            <AddChecklistItemModal
                visible={modalVisible}
                onClose={() => { setModalVisible(false); setEditing(null); }}
                onSave={handleAdd}
                initial={editing ? { category: editing.category, item: editing.item } : null}
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
        gap: 10,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 14,
        backgroundColor: theme.colors.surfaceLight,
        marginBottom: 6,
        minHeight: 44,
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
        gap: 12,
        alignItems: 'center',
    },
});
