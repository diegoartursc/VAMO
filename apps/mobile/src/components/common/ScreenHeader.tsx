/**
 * Header padrão para telas internas (conta, ajuda, sobre).
 * Botão voltar + título + subtítulo opcional, sobre fundo claro.
 * Usa safeBack para nunca deixar o usuário preso quando não há histórico.
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { safeBack } from '../../utils/navigation';
import { haptics } from '../../services/haptics';
import { theme } from '../../theme/theme';

export function ScreenHeader({
    title,
    subtitle,
    fallback = '/(tabs)/profile',
}: {
    title: string;
    subtitle?: string;
    /** Rota de retorno quando não há histórico de navegação. */
    fallback?: string;
}) {
    const router = useRouter();
    return (
        <View style={s.wrap}>
            <StatusBar barStyle="dark-content" />
            <View style={s.row}>
                <TouchableOpacity
                    style={s.backBtn}
                    onPress={() => { haptics.light(); safeBack(router, fallback); }}
                    accessibilityLabel="Voltar"
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="arrow-back" size={22} color={theme.colors.text.primary} />
                </TouchableOpacity>
                <Text style={s.title} numberOfLines={1}>{title}</Text>
                <View style={s.backBtn} />
            </View>
            {!!subtitle && <Text style={s.subtitle}>{subtitle}</Text>}
        </View>
    );
}

const s = StyleSheet.create({
    wrap: {
        paddingTop: 56, paddingHorizontal: 16, paddingBottom: 12,
        backgroundColor: theme.colors.background,
        borderBottomWidth: 1, borderBottomColor: theme.colors.borderLight,
    },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    title: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '800', color: theme.colors.text.primary },
    subtitle: { fontSize: 13, color: theme.colors.text.secondary, marginTop: 6, lineHeight: 18, paddingHorizontal: 4 },
});

export default ScreenHeader;
