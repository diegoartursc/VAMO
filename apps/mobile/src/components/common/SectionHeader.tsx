// VAMO — Cabeçalho de seção premium (roteiro comprado)
//
// Substitui o antigo "SectionTitle" repetido (ícone teal + título) por um
// header com identidade própria por seção: barra de acento lateral, ícone
// em círculo colorido, título forte, resumo opcional, contador opcional e
// um slot `right` para ações (ex.: botão "Editar" das Dicas/Gastos).
//
// 100% visual. Não recebe nem altera dados de negócio — só apresentação.

import React from 'react';
import { View, Text, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { sectionThemeFor, type SectionKey } from '../../theme/sectionTheme';

export interface SectionHeaderProps {
    /** Chave da seção — define acento e ícone padrão. */
    sectionKey?: SectionKey | null;
    /** Sobrescreve o ícone do tema da seção (Ionicons). */
    icon?: string;
    label: string;
    /** Resumo inteligente da seção (ex.: "2 atrações · 1 com site oficial"). */
    subtitle?: string;
    /** Contador discreto à direita do título (número de itens, etc.). */
    count?: number | string;
    /** Acento explícito — vence o tema da seção. */
    accent?: string;
    /** Ação à direita (ex.: toggle "Editar"). */
    right?: React.ReactNode;
    style?: StyleProp<ViewStyle>;
}

export default function SectionHeader({
    sectionKey,
    icon,
    label,
    subtitle,
    count,
    accent,
    right,
    style,
}: SectionHeaderProps) {
    const entry = sectionThemeFor(sectionKey ?? undefined);
    const color = accent || entry.accent;
    const iconName = (icon || entry.icon) as any;

    return (
        <View style={[styles.wrap, style]}>
            <View style={styles.row}>
                <View style={[styles.accentBar, { backgroundColor: color }]} />
                <View style={[styles.iconCircle, { backgroundColor: color + '1A' }]}>
                    <Ionicons name={iconName} size={17} color={color} />
                </View>
                <Text style={styles.title} numberOfLines={2}>
                    {label}
                </Text>
                {count != null && count !== '' ? (
                    <View style={[styles.countChip, { backgroundColor: color + '16' }]}>
                        <Text style={[styles.countText, { color }]}>{count}</Text>
                    </View>
                ) : null}
                {right ? <View style={styles.right}>{right}</View> : null}
            </View>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
    );
}

// Indent do subtítulo = barra(3) + gap(10) + círculo(34) + gap(10)
const SUBTITLE_INDENT = 3 + 10 + 34 + 10;

const styles = StyleSheet.create({
    wrap: { marginBottom: 14 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    accentBar: {
        width: 3,
        height: 24,
        borderRadius: 2,
    },
    iconCircle: {
        width: 34,
        height: 34,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        flex: 1,
        minWidth: 0,
        fontSize: 18,
        fontWeight: '800',
        color: theme.colors.text.primary,
        letterSpacing: -0.3,
    },
    countChip: {
        minWidth: 24,
        paddingHorizontal: 8,
        height: 22,
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
    },
    countText: {
        fontSize: 12,
        fontWeight: '800',
    },
    right: { marginLeft: 2 },
    subtitle: {
        fontSize: 12.5,
        color: theme.colors.text.tertiary,
        marginTop: 5,
        marginLeft: SUBTITLE_INDENT,
        lineHeight: 17,
    },
});
