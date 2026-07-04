/**
 * TrustStrip — faixa horizontal compacta de sinais de confiança reais.
 *
 * Fica logo após o card de custos. NÃO é mais um card grande: é uma tira leve
 * com ícone + label. Cada item só entra se tiver base real nos dados — quem
 * decide isso é a tela (monta o array `items`). Sem promessas que o produto
 * não garante.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';

export interface TrustSignal {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
}

export interface TrustStripProps {
    items: TrustSignal[];
}

export function TrustStrip({ items }: TrustStripProps) {
    if (!items.length) return null;
    return (
        <View style={styles.strip}>
            {items.map((item, i) => (
                <React.Fragment key={item.label}>
                    {i > 0 && <View style={styles.sep} />}
                    <View style={styles.item}>
                        <Ionicons name={item.icon} size={15} color={theme.colors.primary} />
                        <Text style={styles.label}>{item.label}</Text>
                    </View>
                </React.Fragment>
            ))}
        </View>
    );
}

export default TrustStrip;

const styles = StyleSheet.create({
    strip: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: 10,
        paddingVertical: 14,
        marginBottom: 16,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    label: {
        fontSize: 12.5,
        fontWeight: '600',
        color: theme.colors.text.secondary,
    },
    sep: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: theme.colors.border,
    },
});
