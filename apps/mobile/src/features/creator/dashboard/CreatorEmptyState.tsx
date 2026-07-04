/**
 * Estado vazio padrão do Portal do Roteirista: ícone coerente, título, texto
 * curto e CTA contextual opcional. Reutilizado pela lista de roteiros e pelos
 * sub-dashboards (vendas, avaliações).
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../theme/theme';

export function CreatorEmptyState({
    icon,
    title,
    text,
    ctaLabel,
    ctaIcon,
    onCta,
    compact,
}: {
    icon: string;
    title: string;
    text: string;
    ctaLabel?: string;
    ctaIcon?: string;
    onCta?: () => void;
    /** Versão menos alta, para usar dentro de seções/listas. */
    compact?: boolean;
}) {
    return (
        <View style={[s.wrap, compact && s.wrapCompact]}>
            <View style={s.iconWrap}>
                <Ionicons name={icon as any} size={32} color={theme.colors.primary} />
            </View>
            <Text style={s.title}>{title}</Text>
            <Text style={s.text}>{text}</Text>
            {ctaLabel && onCta && (
                <TouchableOpacity style={s.cta} onPress={onCta} activeOpacity={0.85}>
                    {ctaIcon && <Ionicons name={ctaIcon as any} size={17} color="#fff" />}
                    <Text style={s.ctaText}>{ctaLabel}</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const s = StyleSheet.create({
    wrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, paddingHorizontal: 28 },
    wrapCompact: { paddingVertical: 32 },
    iconWrap: {
        width: 68, height: 68, borderRadius: 34,
        backgroundColor: theme.colors.primary + '12',
        alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    },
    title: { fontSize: 17, fontWeight: '800', color: theme.colors.text.primary, textAlign: 'center', marginBottom: 6 },
    text: { fontSize: 13.5, color: theme.colors.text.secondary, textAlign: 'center', lineHeight: 20, maxWidth: 360, marginBottom: 20 },
    cta: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: theme.colors.primary, borderRadius: 14,
        paddingHorizontal: 22, paddingVertical: 13, ...theme.shadows.button,
    },
    ctaText: { fontSize: 14.5, fontWeight: '700', color: '#fff' },
});
