/**
 * EmptyState — placeholder reutilizado pelas abas da Central da Viagem.
 *
 * Mantém o visual coeso entre Checklist e Arquivos quando a lista está
 * vazia, com um CTA opcional para guiar o próximo passo (ex: "Adicionar
 * primeiro item" / "Adicionar arquivo").
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';

export interface EmptyStateProps {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    text: string;
    ctaLabel?: string;
    onCta?: () => void;
    disabled?: boolean;
}

export default function EmptyState({ icon, title, text, ctaLabel, onCta, disabled }: EmptyStateProps) {
    return (
        <View style={styles.root}>
            <View style={styles.iconCircle}>
                <Ionicons name={icon} size={28} color={theme.colors.primary} />
            </View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.text}>{text}</Text>
            {ctaLabel && onCta && (
                <TouchableOpacity
                    style={[styles.cta, disabled && styles.ctaDisabled]}
                    onPress={onCta}
                    disabled={disabled}
                    activeOpacity={0.85}
                >
                    <Ionicons name="add" size={18} color="#fff" />
                    <Text style={styles.ctaLabel}>{ctaLabel}</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        alignItems: 'center',
        paddingVertical: 28,
        paddingHorizontal: 16,
    },
    iconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: theme.colors.glass.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.text.primary,
        textAlign: 'center',
        marginBottom: 6,
    },
    text: {
        fontSize: 13,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        lineHeight: 18,
        maxWidth: 280,
    },
    cta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 14,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 999,
        backgroundColor: theme.colors.primary,
    },
    ctaDisabled: {
        opacity: 0.5,
    },
    ctaLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#fff',
    },
});
