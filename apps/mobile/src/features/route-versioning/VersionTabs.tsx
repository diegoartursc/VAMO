/**
 * VersionTabs — segmented control "Original" / "Minha versão".
 *
 * Emula visualmente o toggle de TripCenter (pill segmentado: pílula
 * teal quando ativa, label claro com ícone). Mantido local ao
 * route-versioning por enquanto — a extração para um componente
 * compartilhado (`SegmentedToggle`) está prevista no plano, mas
 * fica fora deste escopo (Task 1).
 *
 * API: { value, onChange } — controlado externamente pelo container
 * `RouteVersioning`, que persiste a aba ativa no state local.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../../theme/theme';
import { haptics } from '../../services/haptics';

export type RouteVersionTab = 'original' | 'mine';

export interface VersionTabsProps {
    value: RouteVersionTab;
    onChange: (next: RouteVersionTab) => void;
    /** Quando true, esconde "Minha versão" — útil enquanto o snapshot ainda carrega. */
    disableMine?: boolean;
}

export default function VersionTabs({ value, onChange, disableMine }: VersionTabsProps) {
    const setTab = (next: RouteVersionTab) => {
        if (next === value) return;
        if (next === 'mine' && disableMine) return;
        haptics.selection();
        onChange(next);
    };

    return (
        <View style={styles.toggle}>
            <TouchableOpacity
                style={[styles.toggleBtn, value === 'original' && styles.toggleBtnActive]}
                onPress={() => setTab('original')}
                activeOpacity={0.85}
            >
                <Ionicons
                    name="document-text"
                    size={15}
                    color={value === 'original' ? '#fff' : theme.colors.text.secondary}
                />
                <Text
                    style={[styles.toggleLabel, value === 'original' && styles.toggleLabelActive]}
                >
                    Original
                </Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[
                    styles.toggleBtn,
                    value === 'mine' && styles.toggleBtnActive,
                    disableMine && styles.toggleBtnDisabled,
                ]}
                onPress={() => setTab('mine')}
                activeOpacity={disableMine ? 1 : 0.85}
                disabled={disableMine}
            >
                <Ionicons
                    name="create"
                    size={15}
                    color={
                        disableMine
                            ? theme.colors.text.disabled
                            : value === 'mine'
                                ? '#fff'
                                : theme.colors.text.secondary
                    }
                />
                <Text
                    style={[
                        styles.toggleLabel,
                        value === 'mine' && styles.toggleLabelActive,
                        disableMine && styles.toggleLabelDisabled,
                    ]}
                >
                    Minha versão
                </Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    toggle: {
        flexDirection: 'row',
        gap: 6,
        padding: 4,
        borderRadius: 999,
        backgroundColor: theme.colors.surfaceLight,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    toggleBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        borderRadius: 999,
        minHeight: 44,
    },
    toggleBtnActive: {
        backgroundColor: theme.colors.primary,
    },
    toggleBtnDisabled: {
        opacity: 0.55,
    },
    toggleLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: theme.colors.text.secondary,
    },
    toggleLabelActive: {
        color: '#fff',
    },
    toggleLabelDisabled: {
        color: theme.colors.text.disabled,
    },
});
