/**
 * VAMO Mobile — Seletor compacto de moeda (bottom sheet).
 *
 * Usa a lista canônica de moedas de @vamo/shared (mesma do admin/site).
 * Apresenta um campo compacto que, ao ser tocado, abre um modal com a
 * lista pesquisável. Cada item exibe: código (BRL), símbolo (R$) e
 * nome localizado em pt-BR (Real brasileiro).
 *
 * Props mínimas: { value, onChange }. Suporta opcionalmente `label`,
 * `disabled` e `compact` (variação ainda mais condensada para uso
 * inline ao lado do preço).
 */

import React, { useMemo, useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Modal, TextInput,
    FlatList, Platform, Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { CURRENCIES } from '@vamo/shared/itinerary';

// Nome localizado por moeda — única fonte no app mobile.
const CURRENCY_NAMES: Record<string, string> = {
    BRL: 'Real brasileiro',
    USD: 'Dólar americano',
    EUR: 'Euro',
    GBP: 'Libra esterlina',
};

interface CurrencyPickerProps {
    value: string;
    onChange: (code: string) => void;
    label?: string;
    disabled?: boolean;
    compact?: boolean;
}

export function CurrencyPicker({
    value, onChange, label = 'Moeda', disabled, compact,
}: CurrencyPickerProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');

    const current = CURRENCIES.find(c => c.code === value) || CURRENCIES[0];

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return CURRENCIES;
        return CURRENCIES.filter(c =>
            c.code.toLowerCase().includes(q) ||
            (CURRENCY_NAMES[c.code] || '').toLowerCase().includes(q) ||
            c.symbol.toLowerCase().includes(q)
        );
    }, [query]);

    function pick(code: string) {
        onChange(code);
        setOpen(false);
        setQuery('');
    }

    return (
        <View>
            {label ? <Text style={s.label}>{label}</Text> : null}
            <TouchableOpacity
                style={[s.trigger, compact && s.triggerCompact, disabled && { opacity: 0.6 }]}
                onPress={() => !disabled && setOpen(true)}
                activeOpacity={0.7}
            >
                <View style={s.triggerLeft}>
                    <Text style={s.triggerSymbol}>{current.symbol}</Text>
                    <View>
                        <Text style={s.triggerCode}>{current.code}</Text>
                        {!compact && (
                            <Text style={s.triggerName} numberOfLines={1}>
                                {CURRENCY_NAMES[current.code] || current.label}
                            </Text>
                        )}
                    </View>
                </View>
                <Ionicons name="chevron-down" size={18} color={theme.colors.text.tertiary} />
            </TouchableOpacity>

            <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
                <Pressable style={s.backdrop} onPress={() => setOpen(false)}>
                    {/* Pressable interno evita propagar o tap pra fechar */}
                    <Pressable style={s.sheet} onPress={(e) => e.stopPropagation()}>
                        <View style={s.sheetHandle} />
                        <Text style={s.sheetTitle}>Escolher moeda</Text>

                        <View style={s.searchBox}>
                            <Ionicons name="search" size={16} color={theme.colors.text.tertiary} />
                            <TextInput
                                style={s.searchInput}
                                placeholder="Buscar por código, símbolo ou nome"
                                placeholderTextColor={theme.colors.text.tertiary}
                                value={query}
                                onChangeText={setQuery}
                                autoFocus={Platform.OS === 'web'}
                            />
                            {query.length > 0 && (
                                <TouchableOpacity onPress={() => setQuery('')}>
                                    <Ionicons name="close-circle" size={16} color={theme.colors.text.tertiary} />
                                </TouchableOpacity>
                            )}
                        </View>

                        <FlatList
                            data={filtered}
                            keyExtractor={(it) => it.code}
                            ItemSeparatorComponent={() => <View style={s.separator} />}
                            ListEmptyComponent={
                                <Text style={s.emptyText}>Nenhuma moeda encontrada.</Text>
                            }
                            renderItem={({ item }) => {
                                const active = item.code === value;
                                return (
                                    <TouchableOpacity
                                        style={[s.row, active && s.rowActive]}
                                        onPress={() => pick(item.code)}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={s.rowSymbol}>{item.symbol}</Text>
                                        <View style={{ flex: 1 }}>
                                            <Text style={s.rowCode}>
                                                {item.code} · <Text style={s.rowSymbolInline}>{item.symbol}</Text>
                                            </Text>
                                            <Text style={s.rowName}>{CURRENCY_NAMES[item.code] || item.label}</Text>
                                        </View>
                                        {active && (
                                            <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
                                        )}
                                    </TouchableOpacity>
                                );
                            }}
                        />
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
}

const s = StyleSheet.create({
    label: { fontSize: 13, fontWeight: '600', color: theme.colors.text.secondary, marginTop: 14, marginBottom: 6 },

    trigger: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 14, paddingVertical: 12,
        backgroundColor: '#fff',
        borderWidth: 1, borderColor: theme.colors.borderLight,
        borderRadius: 12,
    },
    triggerCompact: { paddingVertical: 8, paddingHorizontal: 10 },
    triggerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    triggerSymbol: { fontSize: 18, fontWeight: '700', color: theme.colors.primary, minWidth: 26, textAlign: 'center' },
    triggerCode: { fontSize: 14, fontWeight: '700', color: theme.colors.text.primary },
    triggerName: { fontSize: 11, color: theme.colors.text.tertiary, marginTop: 1 },

    // Bottom sheet
    backdrop: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        padding: 20, paddingBottom: Platform.OS === 'ios' ? 32 : 24,
        maxHeight: '80%',
    },
    sheetHandle: {
        alignSelf: 'center', width: 44, height: 4, borderRadius: 2,
        backgroundColor: theme.colors.borderLight, marginBottom: 12,
    },
    sheetTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.text.primary, marginBottom: 12 },

    searchBox: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        paddingHorizontal: 12, paddingVertical: 10,
        backgroundColor: theme.colors.surface, borderRadius: 12,
        marginBottom: 12,
    },
    searchInput: {
        flex: 1, fontSize: 14, color: theme.colors.text.primary,
        ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
    },

    row: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingVertical: 12, paddingHorizontal: 4,
    },
    rowActive: { backgroundColor: theme.colors.surface, borderRadius: 10 },
    rowSymbol: {
        fontSize: 18, fontWeight: '700', color: theme.colors.primary,
        minWidth: 36, textAlign: 'center',
    },
    rowSymbolInline: { fontWeight: '500', color: theme.colors.text.secondary },
    rowCode: { fontSize: 14, fontWeight: '700', color: theme.colors.text.primary },
    rowName: { fontSize: 12, color: theme.colors.text.tertiary, marginTop: 2 },

    separator: { height: 1, backgroundColor: theme.colors.borderLight, marginLeft: 48 },
    emptyText: {
        textAlign: 'center', color: theme.colors.text.tertiary, fontSize: 13,
        paddingVertical: 24,
    },
});
