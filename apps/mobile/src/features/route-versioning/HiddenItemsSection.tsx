/**
 * HiddenItemsSection — chip colapsável que lista itens ocultados pelo
 * viajante e permite restaurar cada um.
 *
 * Não exibe nada quando `hidden.length === 0` (zero ruído visual).
 * Quando expandido, mostra título curto + tipo + botão "Restaurar".
 *
 * Recebe `onRestore(originalId)` — o caller (RouteVersioning) é quem
 * conhece a estratégia (PUT do customization com `hiddenOriginalIds`
 * sem o id restaurado).
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../../theme/theme';
import { haptics } from '../../services/haptics';
import type { MergedItem } from './mergeEngine';

export interface HiddenItemsSectionProps {
    hidden: MergedItem[];
    onRestore: (item: MergedItem) => void;
    /** Quando true, esconde o botão Restaurar (modo read-only). */
    readOnly?: boolean;
}

// ─── Labels por kind ──────────────────────────────────────────

const KIND_LABEL: Record<string, string> = {
    accommodations: 'Hospedagem',
    transports: 'Transporte',
    attractions: 'Passeio',
    restaurants: 'Restaurante',
    generalTips: 'Dica',
    checklistItems: 'Checklist',
    extraSpendingItems: 'Gasto extra',
    flightOutbound: 'Voo de ida',
    flightReturn: 'Voo de volta',
    dayActivity: 'Atividade',
    day: 'Dia',
};

function pickTitle(merged: MergedItem): string {
    const d = merged.data || {};
    // Dia: monta "Dia N · título" — fica claro qual dia está ocultado.
    if (merged.kind === 'day') {
        const dayNumber = typeof d.dayNumber === 'number' ? d.dayNumber : '?';
        return d.title ? `Dia ${dayNumber} · ${d.title}` : `Dia ${dayNumber}`;
    }
    return (
        d.title ||
        d.name ||
        d.description ||
        d.item ||
        d.text ||
        d.tip ||
        d.airline ||
        KIND_LABEL[merged.kind] ||
        'Item'
    );
}

export default function HiddenItemsSection({
    hidden,
    onRestore,
    readOnly,
}: HiddenItemsSectionProps) {
    const [expanded, setExpanded] = useState(false);

    if (!hidden || hidden.length === 0) return null;

    const count = hidden.length;
    const word = count === 1 ? 'item ocultado' : 'itens ocultados';

    return (
        <View style={styles.wrap}>
            <TouchableOpacity
                style={styles.chip}
                onPress={() => {
                    haptics.selection();
                    setExpanded((p) => !p);
                }}
                activeOpacity={0.85}
            >
                <Ionicons
                    name={expanded ? 'eye' : 'eye-off-outline'}
                    size={14}
                    color={theme.colors.text.secondary}
                />
                <Text style={styles.chipText}>
                    {expanded ? 'Esconder' : `Mostrar ${count} ${word}`}
                </Text>
                <Ionicons
                    name={expanded ? 'chevron-up' : 'chevron-down'}
                    size={14}
                    color={theme.colors.text.tertiary}
                />
            </TouchableOpacity>

            {expanded ? (
                <View style={styles.list}>
                    {hidden.map((item, idx) => {
                        const key = item.originalId || item.addedId || `${item.kind}-${idx}`;
                        return (
                            <View key={key} style={styles.row}>
                                <View style={styles.rowInfo}>
                                    <Text style={styles.kindTag}>
                                        {KIND_LABEL[item.kind] || item.kind}
                                    </Text>
                                    <Text style={styles.rowTitle} numberOfLines={2}>
                                        {pickTitle(item)}
                                    </Text>
                                </View>
                                {!readOnly ? (
                                    <TouchableOpacity
                                        style={styles.restoreBtn}
                                        onPress={() => {
                                            haptics.light();
                                            onRestore(item);
                                        }}
                                        activeOpacity={0.8}
                                    >
                                        <Ionicons
                                            name="arrow-undo"
                                            size={13}
                                            color={theme.colors.primary}
                                        />
                                        <Text style={styles.restoreText}>Restaurar</Text>
                                    </TouchableOpacity>
                                ) : null}
                            </View>
                        );
                    })}
                </View>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        marginTop: 4,
        marginBottom: 20,
    },
    chip: {
        flexDirection: 'row',
        alignSelf: 'flex-start',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        backgroundColor: theme.colors.surfaceLight,
    },
    chipText: {
        fontSize: 12.5,
        fontWeight: '700',
        color: theme.colors.text.secondary,
    },
    list: {
        marginTop: 10,
        gap: 8,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: theme.colors.surfaceLight,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    rowInfo: {
        flex: 1,
        gap: 3,
    },
    kindTag: {
        fontSize: 10,
        fontWeight: '800',
        color: theme.colors.text.tertiary,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    rowTitle: {
        fontSize: 13,
        color: theme.colors.text.primary,
        fontWeight: '600',
    },
    restoreBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.colors.primary + '38',
        backgroundColor: theme.colors.primary + '12',
    },
    restoreText: {
        fontSize: 12,
        fontWeight: '700',
        color: theme.colors.primary,
    },
});
