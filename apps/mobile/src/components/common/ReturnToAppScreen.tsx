import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import VamoButton from './VamoButton';

/**
 * Página web mostrada quando a Stripe devolve a pessoa para o site, mas a
 * compra/cadastro começou no app (`app=1`). Redireciona para o app na hora e
 * deixa um botão caso o navegador não troque sozinho. Ver utils/nativeAppReturn.
 */
export function ReturnToAppScreen({ appUrl }: { appUrl: string }) {
    useEffect(() => {
        if (typeof window !== 'undefined') window.location.replace(appUrl);
    }, [appUrl]);

    return (
        <View style={styles.container}>
            <Ionicons name="phone-portrait-outline" size={44} color={theme.colors.primary} />
            <Text style={styles.title}>Returning to the VAMO app…</Text>
            <Text style={styles.text}>If the app doesn&apos;t open on its own, tap the button below.</Text>
            <VamoButton
                label="Open the VAMO app"
                onPress={() => { if (typeof window !== 'undefined') window.location.href = appUrl; }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        gap: 14,
        backgroundColor: '#FFFFFF',
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1A3263',
        textAlign: 'center',
    },
    text: {
        fontSize: 15,
        color: '#64748B',
        textAlign: 'center',
        maxWidth: 320,
        marginBottom: 6,
    },
});
