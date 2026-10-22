/**
 * VAMO Mobile — Legal documents (Terms, Privacy, Refunds, Creator Terms).
 * Content lives in @vamo/shared/legal so the app and the site show the same text.
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LEGAL_DOCS, LEGAL_DOC_ORDER, LEGAL_LAST_UPDATED, isLegalDocKey } from '@vamo/shared/legal';
import { theme } from '../../src/theme/theme';
import { ScreenHeader } from '../../src/components/common/ScreenHeader';

export default function LegalDocScreen() {
    const router = useRouter();
    const { doc } = useLocalSearchParams<{ doc: string }>();
    const key = isLegalDocKey(doc) ? doc : 'terms';
    const current = LEGAL_DOCS[key];

    return (
        <View style={s.container}>
            <ScreenHeader title={current.title} subtitle={`Last updated ${LEGAL_LAST_UPDATED}`} />
            <ScrollView contentContainerStyle={s.scroll}>
                <Text style={s.summary}>{current.summary}</Text>

                {current.sections.map((section) => (
                    <View key={section.heading} style={s.section}>
                        <Text style={s.heading}>{section.heading}</Text>
                        {section.paragraphs.map((p, i) => (
                            <Text key={i} style={s.paragraph}>{p}</Text>
                        ))}
                    </View>
                ))}

                <View style={s.otherDocs}>
                    <Text style={s.otherTitle}>Other legal documents</Text>
                    {LEGAL_DOC_ORDER.filter((k) => k !== key).map((k) => (
                        <TouchableOpacity
                            key={k}
                            onPress={() => router.replace({ pathname: '/legal/[doc]', params: { doc: k } })}
                            accessibilityRole="link"
                        >
                            <Text style={s.link}>{LEGAL_DOCS[k].title}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.surfaceLight },
    scroll: { padding: 20, paddingBottom: 60 },
    summary: { fontSize: 14, color: theme.colors.text.secondary, lineHeight: 21, marginBottom: 16 },
    section: { marginBottom: 18 },
    heading: { fontSize: 15, fontWeight: '700', color: theme.colors.text.primary, marginBottom: 6 },
    paragraph: { fontSize: 13.5, color: theme.colors.text.secondary, lineHeight: 21, marginBottom: 8 },
    otherDocs: { marginTop: 12, paddingTop: 16, borderTopWidth: 1, borderTopColor: theme.colors.borderLight, gap: 10 },
    otherTitle: { fontSize: 13, fontWeight: '700', color: theme.colors.text.tertiary, textTransform: 'uppercase', letterSpacing: 0.5 },
    link: { fontSize: 14.5, fontWeight: '600', color: theme.colors.primary },
});
