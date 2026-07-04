/**
 * Cabeçalho do Portal do Roteirista, em duas partes:
 *  - CreatorTopBar: barra fixa (voltar + título + botão "+"). Sempre visível.
 *  - CreatorHero: bloco de boas-vindas com título, subtítulo e dois botões
 *    ("Criar roteiro" primário + "Ver meus roteiros" secundário). Rola junto
 *    com o conteúdo. Web/desktop: CTAs em linha; mobile: empilhados.
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../theme/theme';

export function CreatorTopBar({
    count,
    onBack,
    onNew,
}: {
    count: number;
    onBack: () => void;
    onNew: () => void;
}) {
    return (
        <View style={s.bar}>
            <TouchableOpacity style={s.iconBtn} onPress={onBack} accessibilityLabel="Voltar">
                <Ionicons name="arrow-back" size={22} color={theme.colors.text.primary} />
            </TouchableOpacity>
            <View style={s.barCenter}>
                <Text style={s.barTitle}>Portal do Roteirista</Text>
                {count > 0 && (
                    <Text style={s.barSubtitle}>{count} {count === 1 ? 'roteiro' : 'roteiros'}</Text>
                )}
            </View>
            <TouchableOpacity style={s.plusBtn} onPress={onNew} accessibilityLabel="Criar roteiro">
                <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
        </View>
    );
}

/**
 * Cabeçalho das sub-telas do portal (vendas, avaliações, configurações):
 * voltar + título + subtítulo. Sem botão "+".
 */
export function CreatorSubHeader({
    title,
    subtitle,
    onBack,
}: {
    title: string;
    subtitle?: string;
    onBack: () => void;
}) {
    return (
        <View style={s.subWrap}>
            <View style={s.bar}>
                <TouchableOpacity style={s.iconBtn} onPress={onBack} accessibilityLabel="Voltar">
                    <Ionicons name="arrow-back" size={22} color={theme.colors.text.primary} />
                </TouchableOpacity>
                <View style={s.barCenter}>
                    <Text style={s.barTitle}>{title}</Text>
                </View>
                <View style={s.iconBtn} />
            </View>
            {subtitle ? <Text style={s.subSubtitle}>{subtitle}</Text> : null}
        </View>
    );
}

export function CreatorHero({
    isWide,
    onNew,
    onSeeAll,
}: {
    isWide: boolean;
    onNew: () => void;
    onSeeAll: () => void;
}) {
    return (
        <View style={s.hero}>
            <View style={s.heroText}>
                <Text style={s.heroTitle}>Gerencie suas experiências</Text>
                <Text style={s.heroSubtitle}>
                    Acompanhe vendas, avaliações e o desempenho dos seus roteiros — tudo em um só lugar.
                </Text>
            </View>
            <View style={[s.ctaRow, isWide ? s.ctaRowWide : s.ctaRowNarrow]}>
                <TouchableOpacity style={[s.cta, s.ctaPrimary]} onPress={onNew} activeOpacity={0.85}>
                    <Ionicons name="add-circle-outline" size={18} color="#fff" />
                    <Text style={s.ctaPrimaryText}>Criar roteiro</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.cta, s.ctaSecondary]} onPress={onSeeAll} activeOpacity={0.85}>
                    <Ionicons name="albums-outline" size={18} color={theme.colors.primary} />
                    <Text style={s.ctaSecondaryText}>Ver meus roteiros</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const s = StyleSheet.create({
    bar: {
        flexDirection: 'row', alignItems: 'center',
        paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight ?? 24) + 8,
        paddingBottom: 8, paddingHorizontal: 16,
        backgroundColor: theme.colors.background,
    },
    iconBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    barCenter: { flex: 1, alignItems: 'center' },
    barTitle: { fontSize: 17, fontWeight: '700', color: theme.colors.text.primary },
    barSubtitle: { fontSize: 12, color: theme.colors.text.secondary, marginTop: 1 },
    plusBtn: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: theme.colors.primary,
        alignItems: 'center', justifyContent: 'center',
    },

    subWrap: { backgroundColor: theme.colors.background, paddingBottom: 6 },
    subSubtitle: {
        fontSize: 13, color: theme.colors.text.secondary,
        paddingHorizontal: 16, marginTop: -2, lineHeight: 18,
    },

    hero: { paddingTop: 4, paddingBottom: 16 },
    heroText: { marginBottom: 14 },
    heroTitle: { fontSize: 22, fontWeight: '800', color: theme.colors.text.primary, letterSpacing: -0.3 },
    heroSubtitle: { fontSize: 13.5, color: theme.colors.text.secondary, marginTop: 5, lineHeight: 19, maxWidth: 560 },

    ctaRow: { gap: 10 },
    ctaRowWide: { flexDirection: 'row', alignItems: 'center' },
    ctaRowNarrow: { flexDirection: 'column' },
    cta: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        borderRadius: 14, paddingHorizontal: 20, paddingVertical: 13,
    },
    ctaPrimary: { backgroundColor: theme.colors.primary, ...theme.shadows.button },
    ctaPrimaryText: { fontSize: 15, fontWeight: '700', color: '#fff' },
    ctaSecondary: { backgroundColor: theme.colors.surface, borderWidth: 1.5, borderColor: theme.colors.primary },
    ctaSecondaryText: { fontSize: 15, fontWeight: '700', color: theme.colors.primary },
});
