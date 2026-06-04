import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { theme } from '../../../../theme/theme';
import { Icon } from '../../../../components/common/Icons';

interface Props {
    onViewItineraries?: () => void;
}

export function EarningsEmptyState({ onViewItineraries }: Props) {
    return (
        <View style={styles.wrap}>
            <View style={styles.iconCircle}>
                <Icon name="wallet" size={28} color={theme.colors.primary} />
            </View>
            <Text style={styles.title}>No sales yet</Text>
            <Text style={styles.text}>
                When travellers buy your itineraries, your earnings will appear here.
            </Text>
            {onViewItineraries ? (
                <TouchableOpacity
                    style={styles.cta}
                    onPress={onViewItineraries}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityLabel="View my itineraries"
                >
                    <Text style={styles.ctaText}>View my itineraries</Text>
                </TouchableOpacity>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        alignItems: 'center',
        paddingVertical: 32,
        paddingHorizontal: 24,
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: theme.colors.primary + '14',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
    },
    title: {
        fontSize: 17,
        fontWeight: '800',
        color: theme.colors.text.primary,
        marginBottom: 6,
    },
    text: {
        fontSize: 13.5,
        lineHeight: 19,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        marginBottom: 18,
    },
    cta: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 22,
        paddingVertical: 12,
        borderRadius: 999,
        ...theme.shadows.button,
    },
    ctaText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 13,
    },
});
