/**
 * VAMO Mobile — Sobre a VAMO.
 * Texto institucional + versão do app. Conteúdo estático e seguro.
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { theme } from '../src/theme/theme';
import { Icon, IconName } from '../src/components/common/Icons';
import { ScreenHeader } from '../src/components/common/ScreenHeader';

interface Highlight {
    icon: IconName;
    title: string;
    text: string;
}

const HIGHLIGHTS: Highlight[] = [
    { icon: 'compass', title: 'Roteiros de quem já viveu', text: 'Um marketplace de roteiros de viagem digitais criados por viajantes reais que já estiveram no destino.' },
    { icon: 'book-open', title: 'Experiências práticas', text: 'Foco em roteiros úteis e detalhados: o que fazer, onde ficar, quanto gastar e como aproveitar melhor.' },
    { icon: 'shield-check', title: 'Segurança e comunidade', text: 'Roteiristas verificados, avaliações reais e uma comunidade que ajuda você a viajar com confiança.' },
];

export default function AboutVamoScreen() {
    return (
        <View style={s.container}>
            <ScreenHeader title="Sobre a VAMO" subtitle="O que é e por que existimos." />
            <ScrollView contentContainerStyle={s.scroll}>
                <View style={s.hero}>
                    <Text style={s.heroLogo}>VAMO</Text>
                    <Text style={s.heroTagline}>Roteiros de viagem de quem já esteve lá.</Text>
                </View>

                {HIGHLIGHTS.map((h) => (
                    <View key={h.title} style={s.card}>
                        <View style={s.cardIcon}>
                            <Icon name={h.icon} size={20} color={theme.colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={s.cardTitle}>{h.title}</Text>
                            <Text style={s.cardText}>{h.text}</Text>
                        </View>
                    </View>
                ))}

                <Text style={s.version}>VAMO v1.0.0</Text>
                <Text style={s.copyright}>© 2026 VAMO. Todos os direitos reservados.</Text>
            </ScrollView>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.surfaceLight },
    scroll: { padding: 20, paddingBottom: 60 },
    hero: { alignItems: 'center', paddingVertical: 20, marginBottom: 8 },
    heroLogo: { fontSize: 34, fontWeight: '900', color: theme.colors.secondary, letterSpacing: 1 },
    heroTagline: { fontSize: 14, color: theme.colors.text.secondary, marginTop: 6, textAlign: 'center' },
    card: {
        flexDirection: 'row', gap: 14,
        backgroundColor: theme.colors.background,
        borderRadius: 16, padding: 16, marginBottom: 12,
        borderWidth: 1, borderColor: theme.colors.borderLight,
    },
    cardIcon: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: theme.colors.primary + '14',
        alignItems: 'center', justifyContent: 'center',
    },
    cardTitle: { fontSize: 15, fontWeight: '700', color: theme.colors.text.primary },
    cardText: { fontSize: 13.5, color: theme.colors.text.secondary, lineHeight: 20, marginTop: 4 },
    version: { fontSize: 13, fontWeight: '600', color: theme.colors.text.secondary, textAlign: 'center', marginTop: 16 },
    copyright: { fontSize: 12, color: theme.colors.text.tertiary, textAlign: 'center', marginTop: 4 },
});
