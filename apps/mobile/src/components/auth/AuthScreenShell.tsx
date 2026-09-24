import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme/theme';
import VamoLogo from '../common/VamoLogo';

/** Moldura das telas de autenticação secundárias (mesmo visual do login). */
export default function AuthScreenShell({ children }: { children: ReactNode }) {
    return (
        <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                <LinearGradient colors={['#1A3263', '#28C9BF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
                    <VamoLogo size={140} />
                    <Text style={styles.tagline}>Roteiros criados por quem já esteve lá</Text>
                </LinearGradient>
                <View style={styles.card}>{children}</View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

export const authStyles = StyleSheet.create({
    title: { fontSize: 24, fontWeight: '800', color: theme.colors.text.primary, marginBottom: 6 },
    subtitle: { fontSize: 14, lineHeight: 20, color: theme.colors.text.secondary, marginBottom: 24 },
    errorBox: {
        flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEF2F2', borderRadius: 10,
        padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#FECACA',
    },
    errorText: { flex: 1, fontSize: 13, color: '#EF4444' },
    field: { marginBottom: 18 },
    label: { fontSize: 13, fontWeight: '600', color: theme.colors.text.primary, marginBottom: 8 },
    inputWrapper: {
        flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: theme.colors.borderLight,
        borderRadius: 12, backgroundColor: theme.colors.surfaceLight, paddingHorizontal: 14, height: 50,
    },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, fontSize: 15, color: theme.colors.text.primary, height: '100%' },
    eyeButton: { padding: 4 },
    hint: { fontSize: 12, color: theme.colors.text.tertiary, marginTop: 6 },
    linkButton: { alignItems: 'center', paddingVertical: 12, marginTop: 8 },
    linkText: { fontSize: 14, fontWeight: '600', color: theme.colors.primary },
    stateIcon: {
        width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center',
        alignSelf: 'center', marginBottom: 20,
    },
    stateTitle: { fontSize: 22, fontWeight: '800', color: theme.colors.text.primary, textAlign: 'center', marginBottom: 8 },
    stateText: { fontSize: 14, lineHeight: 21, color: theme.colors.text.secondary, textAlign: 'center', marginBottom: 8 },
    stateEmphasis: { fontWeight: '700', color: theme.colors.text.primary },
});

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.colors.background },
    scroll: { flexGrow: 1 },
    header: { paddingTop: Platform.OS === 'ios' ? 80 : 60, paddingBottom: 48, paddingHorizontal: 28, alignItems: 'center' },
    tagline: { fontSize: 14, color: 'rgba(255,255,255,0.8)', textAlign: 'center' },
    card: {
        flex: 1, backgroundColor: theme.colors.background, borderTopLeftRadius: 28, borderTopRightRadius: 28,
        marginTop: -20, padding: 28, paddingTop: 32,
    },
});
