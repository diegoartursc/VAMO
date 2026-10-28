import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { CREATOR_SHARE_PERCENT, PAYOUT_HOLD_DAYS } from '@vamo/shared/itinerary';
import { theme } from '../../../../theme/theme';
import { Icon } from '../../../../components/common/Icons';

export function PayoutExplanationCard() {
    const router = useRouter();
    const [expanded, setExpanded] = useState(true);

    return (
        <View style={styles.card}>
            <TouchableOpacity
                style={styles.header}
                onPress={() => setExpanded((v) => !v)}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityState={{ expanded }}
                accessibilityLabel="How payouts work"
            >
                <View style={styles.titleRow}>
                    <View style={styles.iconWrap}>
                        <Icon name="info" size={16} color={theme.colors.primary} />
                    </View>
                    <Text style={styles.title}>How payouts work</Text>
                </View>
                <Ionicons
                    name={expanded ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={theme.colors.text.tertiary}
                />
            </TouchableOpacity>

            {expanded && (
                <View style={styles.body}>
                    <Text style={styles.paragraph}>
                        When someone buys your itinerary, VAMO securely processes the payment
                        and tracks your earnings.
                    </Text>
                    <Text style={styles.paragraph}>
                        You keep {CREATOR_SHARE_PERCENT}% of every sale. Your sales first appear as
                        pending balance. After the {PAYOUT_HOLD_DAYS}-day protection period, your
                        earnings are automatically paid out to your registered bank account.
                    </Text>
                    <Text style={styles.paragraph}>
                        VAMO uses Stripe to securely manage payments, identity verification
                        and bank payouts.
                    </Text>

                    <TouchableOpacity
                        style={styles.link}
                        onPress={() => router.push('/how-you-get-paid')}
                        activeOpacity={0.85}
                        accessibilityRole="link"
                        accessibilityLabel="See how you get paid"
                    >
                        <Text style={styles.linkText}>See how you get paid</Text>
                        <Ionicons name="chevron-forward" size={16} color={theme.colors.primary} />
                    </TouchableOpacity>

                    <View style={styles.note}>
                        <Ionicons
                            name="information-circle-outline"
                            size={15}
                            color={theme.colors.text.tertiary}
                        />
                        <Text style={styles.noteText}>
                            Payout timing may vary depending on account status, bank processing
                            times and risk checks.
                        </Text>
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: theme.colors.background,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        ...theme.shadows.small,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
    },
    iconWrap: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: theme.colors.primary + '14',
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 15,
        fontWeight: '700',
        color: theme.colors.text.primary,
    },
    body: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        gap: 10,
    },
    paragraph: {
        fontSize: 13.5,
        lineHeight: 20,
        color: theme.colors.text.secondary,
    },
    link: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 4,
    },
    linkText: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.colors.primary,
    },
    note: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 4,
        backgroundColor: theme.colors.surfaceLight,
        borderRadius: 10,
        padding: 12,
    },
    noteText: {
        flex: 1,
        fontSize: 12,
        lineHeight: 17,
        color: theme.colors.text.tertiary,
    },
});
