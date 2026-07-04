/**
 * Atalhos de navegação do Portal do Roteirista. Cada atalho leva a uma área
 * real (tela dedicada), nunca a um popup. Ícones contextuais + microcopy.
 * Web: linha única / grid distribuído. Mobile: grid de 2 colunas.
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../theme/theme';

export interface QuickAction {
    key: string;
    icon: string;
    label: string;
    hint: string;
    badge?: string;
    onPress: () => void;
}

export function CreatorQuickActions({ actions, isWide }: { actions: QuickAction[]; isWide: boolean }) {
    return (
        <View style={s.grid}>
            {actions.map(a => (
                <TouchableOpacity
                    key={a.key}
                    style={[s.item, isWide ? s.itemWide : s.itemNarrow]}
                    onPress={a.onPress}
                    activeOpacity={0.8}
                >
                    <View style={s.iconWrap}>
                        <Ionicons name={a.icon as any} size={20} color={theme.colors.primary} />
                        {!!a.badge && (
                            <View style={s.badge}>
                                <Text style={s.badgeText}>{a.badge}</Text>
                            </View>
                        )}
                    </View>
                    <View style={s.textWrap}>
                        <Text style={s.label} numberOfLines={2}>{a.label}</Text>
                        <Text style={s.hint} numberOfLines={2}>{a.hint}</Text>
                    </View>
                </TouchableOpacity>
            ))}
        </View>
    );
}

const s = StyleSheet.create({
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    item: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: theme.colors.surface,
        borderWidth: 1, borderColor: theme.colors.border,
        borderRadius: 14, padding: 12,
    },
    // Web: 5 por linha (~grid distribuído). flexBasis com gap fica ~equilibrado.
    itemWide: { flexGrow: 1, flexBasis: '18%', minWidth: 170 },
    // Mobile: 2 colunas.
    itemNarrow: { flexGrow: 1, flexBasis: '46%', minWidth: 150 },
    iconWrap: {
        width: 40, height: 40, borderRadius: 12,
        backgroundColor: theme.colors.primary + '12',
        alignItems: 'center', justifyContent: 'center',
    },
    textWrap: { flex: 1 },
    label: { fontSize: 13.5, fontWeight: '700', color: theme.colors.text.primary },
    hint: { fontSize: 11, color: theme.colors.text.tertiary, marginTop: 2, lineHeight: 14 },
    badge: {
        position: 'absolute', top: -5, right: -6,
        minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 5,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: theme.colors.primary,
    },
    badgeText: { fontSize: 10, fontWeight: '800', color: '#fff' },
});
