/**
 * VAMO Mobile — Como funciona.
 * Explica o fluxo do app em passos. Conteúdo estático e seguro.
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { theme } from '../src/theme/theme';
import { Icon, IconName } from '../src/components/common/Icons';
import { ScreenHeader } from '../src/components/common/ScreenHeader';

interface Step {
    icon: IconName;
    title: string;
    text: string;
}

const STEPS: Step[] = [
    { icon: 'search', title: 'Search itineraries', text: 'Explore complete itineraries created by travelers who have been to the destination.' },
    { icon: 'card', title: 'Buy securely', text: 'Pick the ideal itinerary, review the details and complete your purchase with secure payment.' },
    { icon: 'book-open', title: 'Open it in My Itineraries', text: 'After you buy, the itinerary is saved to your account, available whenever you need it.' },
    { icon: 'edit', title: 'Personalize your version', text: 'Adapt the purchased itinerary to your dates and preferences without losing the original.' },
    { icon: 'star', title: 'Review the experience', text: 'Share your opinion and help other travelers with reviews and photos.' },
    { icon: 'compass', title: 'Create as a creator', text: 'Any traveler can become a creator and publish their own itineraries to sell on VAMO.' },
];

export default function HowItWorksScreen() {
    return (
        <View style={s.container}>
            <ScreenHeader title="How it works" subtitle="From search to trip, in a few steps." />
            <ScrollView contentContainerStyle={s.scroll}>
                {STEPS.map((step, idx) => (
                    <View key={step.title} style={s.step}>
                        <View style={s.stepLeft}>
                            <View style={s.stepIcon}>
                                <Icon name={step.icon} size={20} color={theme.colors.primary} />
                            </View>
                            {idx < STEPS.length - 1 && <View style={s.connector} />}
                        </View>
                        <View style={s.stepBody}>
                            <Text style={s.stepTitle}>{step.title}</Text>
                            <Text style={s.stepText}>{step.text}</Text>
                        </View>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.surfaceLight },
    scroll: { padding: 20, paddingBottom: 60 },
    step: { flexDirection: 'row', gap: 14 },
    stepLeft: { alignItems: 'center' },
    stepIcon: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: theme.colors.primary + '14',
        alignItems: 'center', justifyContent: 'center',
    },
    connector: { width: 2, flex: 1, backgroundColor: theme.colors.border, marginVertical: 4 },
    stepBody: { flex: 1, paddingBottom: 24 },
    stepTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.text.primary, marginTop: 8 },
    stepText: { fontSize: 13.5, color: theme.colors.text.secondary, lineHeight: 20, marginTop: 4 },
});
