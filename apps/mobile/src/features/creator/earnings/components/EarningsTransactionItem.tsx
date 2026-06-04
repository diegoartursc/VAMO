import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../../../../theme/theme';
import type { CreatorEarningTransaction } from '../types';
import {
    TRANSACTION_STATUS_VISUALS,
    formatCurrencyAUD,
    formatLongDate,
} from '../utils';

interface Props {
    transaction: CreatorEarningTransaction;
    isLast?: boolean;
}

export function EarningsTransactionItem({ transaction, isLast }: Props) {
    const v = TRANSACTION_STATUS_VISUALS[transaction.status];

    return (
        <View style={[styles.row, isLast && styles.rowLast]}>
            <View style={styles.header}>
                <Text style={styles.title} numberOfLines={2}>
                    {transaction.itineraryTitle}
                </Text>
                <View style={[styles.badge, { backgroundColor: v.bg }]}>
                    <Text style={[styles.badgeText, { color: v.fg }]}>{v.label}</Text>
                </View>
            </View>

            <Text style={styles.date}>{formatLongDate(transaction.saleDate)}</Text>

            <View style={styles.breakdown}>
                <BreakdownLine label="Gross" value={formatCurrencyAUD(transaction.grossAmount)} />
                <BreakdownLine
                    label="VAMO fee"
                    value={`-${formatCurrencyAUD(transaction.platformFee)}`}
                    valueColor={theme.colors.text.secondary}
                />
                <View style={styles.divider} />
                <BreakdownLine
                    label="Estimated payout"
                    value={formatCurrencyAUD(transaction.estimatedPayout)}
                    emphasize
                />
            </View>
        </View>
    );
}

function BreakdownLine({
    label,
    value,
    emphasize,
    valueColor,
}: {
    label: string;
    value: string;
    emphasize?: boolean;
    valueColor?: string;
}) {
    return (
        <View style={styles.line}>
            <Text style={[styles.lineLabel, emphasize && styles.lineLabelEmphasis]}>{label}</Text>
            <Text
                style={[
                    styles.lineValue,
                    emphasize && styles.lineValueEmphasis,
                    valueColor ? { color: valueColor } : null,
                ]}
            >
                {value}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
    },
    rowLast: {
        borderBottomWidth: 0,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 10,
    },
    title: {
        flex: 1,
        fontSize: 14.5,
        fontWeight: '700',
        color: theme.colors.text.primary,
        letterSpacing: -0.2,
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '700',
    },
    date: {
        fontSize: 12,
        color: theme.colors.text.tertiary,
        marginTop: 4,
        marginBottom: 10,
    },
    breakdown: {
        gap: 6,
    },
    line: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    lineLabel: {
        fontSize: 13,
        color: theme.colors.text.secondary,
    },
    lineLabelEmphasis: {
        color: theme.colors.text.primary,
        fontWeight: '700',
    },
    lineValue: {
        fontSize: 13,
        color: theme.colors.text.primary,
        fontWeight: '600',
    },
    lineValueEmphasis: {
        fontSize: 15,
        fontWeight: '800',
        color: theme.colors.primary,
    },
    divider: {
        height: 1,
        backgroundColor: theme.colors.borderLight,
        marginVertical: 4,
    },
});
