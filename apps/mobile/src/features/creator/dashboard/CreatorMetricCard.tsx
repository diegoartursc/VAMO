/**
 * Card de métrica do dashboard do roteirista. Clicável (drill-down), com
 * ícone contextual, valor em destaque, label, microcopy e estado vazio
 * elegante (quando o valor é zero / sem dados).
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../theme/theme';

export interface CreatorMetric {
    key: string;
    icon: string;
    /** Cor do ícone/realce. Default: primary. */
    tone?: string;
    value: string;
    label: string;
    /** Microcopy curta abaixo do valor. */
    hint: string;
    /** Microcopy alternativa para o estado vazio (valor zero). */
    emptyHint?: string;
    /** true ⇒ estado "vazio" (sem dados ainda) — desaturado. */
    empty?: boolean;
    onPress?: () => void;
}

export function CreatorMetricCard({ metric, style }: { metric: CreatorMetric; style?: any }) {
    const tone = metric.empty ? theme.colors.text.tertiary : (metric.tone ?? theme.colors.primary);
    const body = (
        <>
            <View style={[s.iconWrap, { backgroundColor: tone + '14' }]}>
                <Ionicons name={metric.icon as any} size={20} color={tone} />
            </View>
            <Text style={[s.value, metric.empty && s.valueEmpty]} numberOfLines={1}>
                {metric.value}
            </Text>
            <Text style={s.label} numberOfLines={1}>{metric.label}</Text>
            <Text style={s.hint} numberOfLines={2}>
                {metric.empty && metric.emptyHint ? metric.emptyHint : metric.hint}
            </Text>
        </>
    );

    if (!metric.onPress) {
        return <View style={[s.card, style]}>{body}</View>;
    }
    return (
        <TouchableOpacity style={[s.card, style]} onPress={metric.onPress} activeOpacity={0.8}>
            {body}
            <View style={s.chevron}>
                <Ionicons name="chevron-forward" size={14} color={theme.colors.text.tertiary} />
            </View>
        </TouchableOpacity>
    );
}

const s = StyleSheet.create({
    card: {
        backgroundColor: theme.colors.surface,
        borderWidth: 1, borderColor: theme.colors.border,
        borderRadius: 16, padding: 14,
        ...theme.shadows.small,
    },
    iconWrap: {
        width: 40, height: 40, borderRadius: 12,
        alignItems: 'center', justifyContent: 'center', marginBottom: 10,
    },
    value: { fontSize: 22, fontWeight: '800', color: theme.colors.text.primary, letterSpacing: -0.4 },
    valueEmpty: { color: theme.colors.text.tertiary },
    label: { fontSize: 13, fontWeight: '700', color: theme.colors.text.primary, marginTop: 2 },
    hint: { fontSize: 11.5, color: theme.colors.text.tertiary, marginTop: 3, lineHeight: 15 },
    chevron: { position: 'absolute', top: 14, right: 12 },
});
