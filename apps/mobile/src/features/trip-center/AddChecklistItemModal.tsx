/**
 * AddChecklistItemModal — formulário para criar/editar um item do
 * checklist pessoal do viajante.
 *
 * Reaproveita as categorias canônicas do roteiro (CHECKLIST_CATS) e
 * deixa o usuário escolher entre elas via chips, ou digitar uma
 * categoria livre via input "Outra" (mantém flexibilidade sem
 * adicionar uma tela separada).
 *
 * Reutilizável: quando `initial` vem preenchido, vira "Editar item".
 */

import React, { useEffect, useState } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { haptics } from '../../services/haptics';

const CHECKLIST_CATEGORIES = [
    'documentos',
    'mala',
    'pre-viagem',
    'finanças',
    'apps úteis',
    'outros',
] as const;

export interface AddChecklistItemModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: (payload: { category: string; item: string }) => Promise<void> | void;
    initial?: { category: string; item: string } | null;
}

export default function AddChecklistItemModal({
    visible,
    onClose,
    onSave,
    initial,
}: AddChecklistItemModalProps) {
    const isEdit = !!initial;
    const [item, setItem] = useState(initial?.item ?? '');
    const [category, setCategory] = useState<string>(initial?.category ?? 'outros');
    const [customCategory, setCustomCategory] = useState('');
    const [useCustom, setUseCustom] = useState(
        !!initial && !CHECKLIST_CATEGORIES.includes(initial.category as any),
    );
    const [saving, setSaving] = useState(false);

    // Resincroniza quando o modal abre/fecha ou o item inicial muda.
    useEffect(() => {
        if (!visible) return;
        setItem(initial?.item ?? '');
        const cat = initial?.category ?? 'outros';
        const known = CHECKLIST_CATEGORIES.includes(cat as any);
        setCategory(known ? cat : 'outros');
        setUseCustom(!known && !!initial);
        setCustomCategory(known ? '' : (initial?.category ?? ''));
    }, [visible, initial]);

    const handleSave = async () => {
        const trimmedItem = item.trim();
        if (!trimmedItem) return;
        const finalCategory = useCustom
            ? customCategory.trim() || 'outros'
            : category;
        try {
            setSaving(true);
            haptics.light();
            await onSave({ category: finalCategory, item: trimmedItem });
            onClose();
        } catch {
            // O parent já lida com notify+haptics.error.
        } finally {
            setSaving(false);
        }
    };

    const canSave = item.trim().length > 0 && !saving;

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.bg}
            >
                <View style={styles.card}>
                    <View style={styles.header}>
                        <Text style={styles.title}>
                            {isEdit ? 'Editar item' : 'Novo item do checklist'}
                        </Text>
                        <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                            <Ionicons name="close" size={22} color={theme.colors.text.secondary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={{ maxHeight: 420 }} keyboardShouldPersistTaps="handled">
                        <Text style={styles.label}>Item</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ex: Renovar passaporte"
                            placeholderTextColor={theme.colors.text.tertiary}
                            value={item}
                            onChangeText={setItem}
                            maxLength={240}
                            autoFocus
                        />

                        <Text style={styles.label}>Categoria</Text>
                        <View style={styles.chipsRow}>
                            {CHECKLIST_CATEGORIES.map(cat => {
                                const active = !useCustom && category === cat;
                                return (
                                    <TouchableOpacity
                                        key={cat}
                                        style={[styles.chip, active && styles.chipActive]}
                                        onPress={() => {
                                            haptics.selection();
                                            setUseCustom(false);
                                            setCategory(cat);
                                        }}
                                    >
                                        <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
                                            {cat}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                            <TouchableOpacity
                                style={[styles.chip, useCustom && styles.chipActive]}
                                onPress={() => {
                                    haptics.selection();
                                    setUseCustom(true);
                                }}
                            >
                                <Text style={[styles.chipLabel, useCustom && styles.chipLabelActive]}>
                                    + outra
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {useCustom && (
                            <TextInput
                                style={[styles.input, { marginTop: 4 }]}
                                placeholder="Nome da categoria"
                                placeholderTextColor={theme.colors.text.tertiary}
                                value={customCategory}
                                onChangeText={setCustomCategory}
                                maxLength={60}
                            />
                        )}
                    </ScrollView>

                    <View style={styles.actions}>
                        <TouchableOpacity style={styles.btnGhost} onPress={onClose} disabled={saving}>
                            <Text style={styles.btnGhostText}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.btnPrimary, !canSave && styles.btnDisabled]}
                            onPress={handleSave}
                            disabled={!canSave}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.btnPrimaryText}>
                                {saving ? 'Salvando…' : isEdit ? 'Salvar' : 'Adicionar'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    bg: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    card: {
        width: '100%',
        maxWidth: 420,
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 22,
        ...theme.shadows.medium,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
    },
    title: {
        fontSize: 18,
        fontWeight: '800',
        color: theme.colors.text.primary,
    },
    label: {
        fontSize: 13,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginTop: 10,
        marginBottom: 6,
    },
    input: {
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surfaceLight,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 15,
        color: theme.colors.text.primary,
    },
    chipsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 6,
    },
    chip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: '#fff',
    },
    chipActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    chipLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.text.secondary,
    },
    chipLabelActive: {
        color: '#fff',
    },
    actions: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 16,
    },
    btnGhost: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        backgroundColor: theme.colors.borderLight,
    },
    btnGhostText: {
        fontWeight: '700',
        color: theme.colors.text.primary,
    },
    btnPrimary: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        backgroundColor: theme.colors.primary,
    },
    btnPrimaryText: {
        fontWeight: '700',
        color: '#fff',
    },
    btnDisabled: {
        opacity: 0.5,
    },
});
