import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../../theme/theme';
import { Icon } from '../../../../components/common/Icons';
import { formatCurrencyAUD } from '../utils';

interface Props {
    availableBalance: number;
    onManagePayouts: () => void;
}

export function EarningsBalanceCard({ availableBalance, onManagePayouts }: Props) {
    return (
        <LinearGradient
            colors={['#1A3263', '#162A55']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.card}
        >
            <View style={styles.headerRow}>
                <Text style={styles.label}>Available balance</Text>
                <View style={styles.iconWrap}>
                    <Icon name="wallet" size={16} color="#28C9BF" />
                </View>
            </View>

            <Text style={styles.value}>{formatCurrencyAUD(availableBalance)}</Text>

            <Text style={styles.subtext}>Ready for your next payout</Text>

            <TouchableOpacity
                style={styles.cta}
                onPress={onManagePayouts}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Manage payouts"
            >
                <Text style={styles.ctaText}>Manage payouts</Text>
                <Ionicons name="arrow-forward" size={15} color="#fff" />
            </TouchableOpacity>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 20,
        padding: 20,
        ...theme.shadows.large,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.75)',
        letterSpacing: 0.3,
    },
    iconWrap: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(40,201,191,0.18)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    value: {
        fontSize: 34,
        fontWeight: '800',
        color: '#FFFFFF',
        marginTop: 12,
        letterSpacing: -0.5,
    },
    subtext: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.7)',
        marginTop: 4,
    },
    cta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        alignSelf: 'flex-start',
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 18,
        paddingVertical: 11,
        borderRadius: 999,
        marginTop: 18,
        ...theme.shadows.button,
    },
    ctaText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '700',
    },
});
