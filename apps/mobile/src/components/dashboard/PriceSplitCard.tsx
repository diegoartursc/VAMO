/**
 * Quanto o roteirista recebe pelo preço que ele define (80% dele, 20% da VAMO).
 * O comprador paga exatamente o preço digitado: a comissão não é somada por cima.
 * Valores vêm de `splitPrice` (fonte única em @vamo/shared/itinerary/commission).
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
    BASE_CURRENCY,
    CREATOR_SHARE_PERCENT,
    PAYOUT_HOLD_DAYS,
    PLATFORM_COMMISSION_PERCENT,
    formatMoney,
    splitPrice,
} from '@vamo/shared/itinerary';
import { theme } from '../../theme/theme';

interface Props {
    price: number;
    currency?: string | null;
    /** Versão enxuta para a revisão final. */
    compact?: boolean;
}

export default function PriceSplitCard({ price, currency, compact }: Props) {
    const cur = currency || BASE_CURRENCY;
    const split = splitPrice(price);
    const hasPrice = split.price > 0;

    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <Ionicons name="wallet-outline" size={16} color={theme.colors.primary} />
                <Text style={styles.title}>
                    You keep {CREATOR_SHARE_PERCENT}% · VAMO keeps {PLATFORM_COMMISSION_PERCENT}%
                </Text>
            </View>

            {hasPrice ? (
                <View style={styles.rows}>
                    <Row label="Travelers pay" value={formatMoney(split.price, cur)} />
                    <Row label={`VAMO commission (${PLATFORM_COMMISSION_PERCENT}%)`} value={`− ${formatMoney(split.commission, cur)}`} />
                    <Row label="You receive" value={formatMoney(split.creatorEarning, cur)} strong />
                </View>
            ) : (
                <Text style={styles.hint}>Enter a price to see how much you will receive.</Text>
            )}

            {!compact && (
                <Text style={styles.note}>
                    Travelers pay exactly the price you set. VAMO's commission comes out of that price, it is never added on top. You are paid through Stripe {PAYOUT_HOLD_DAYS} days after each purchase.
                </Text>
            )}
        </View>
    );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
    return (
        <View style={styles.row}>
            <Text style={[styles.rowLabel, strong && styles.strong]}>{label}</Text>
            <Text style={[styles.rowValue, strong && styles.strong]}>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        marginTop: 16,
        backgroundColor: theme.colors.primary + '0F',
        borderColor: theme.colors.primary + '33',
        borderWidth: 1,
        borderRadius: 14,
        padding: 14,
        gap: 10,
    },
    header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    title: { fontSize: 14, fontWeight: '700', color: theme.colors.text.primary, flexShrink: 1 },
    rows: { gap: 6 },
    row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
    rowLabel: { fontSize: 14, color: theme.colors.text.secondary, flexShrink: 1 },
    rowValue: { fontSize: 14, color: theme.colors.text.secondary },
    strong: { fontWeight: '800', color: theme.colors.text.primary, fontSize: 15 },
    hint: { fontSize: 13, color: theme.colors.text.secondary },
    note: { fontSize: 12, lineHeight: 17, color: theme.colors.text.secondary },
});
