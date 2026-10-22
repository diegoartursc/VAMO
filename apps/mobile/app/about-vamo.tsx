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
    { icon: 'compass', title: 'Itineraries from people who\'ve lived it', text: 'A marketplace of digital travel itineraries created by real travelers who have been to the destination.' },
    { icon: 'book-open', title: 'Practical experiences', text: 'A focus on useful, detailed itineraries: what to do, where to stay, how much to spend and how to make the most of it.' },
    { icon: 'shield-check', title: 'Safety and community', text: 'Verified creators, real reviews and a community that helps you travel with confidence.' },
];

export default function AboutVamoScreen() {
    return (
        <View style={s.container}>
            <ScreenHeader title="About VAMO" subtitle="What we are and why we exist." />
            <ScrollView contentContainerStyle={s.scroll}>
                <View style={s.hero}>
                    <Text style={s.heroLogo}>VAMO</Text>
                    <Text style={s.heroTagline}>Travel itineraries from people who've been there.</Text>
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
                <Text style={s.copyright}>© 2026 VAMO. All rights reserved.</Text>
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
