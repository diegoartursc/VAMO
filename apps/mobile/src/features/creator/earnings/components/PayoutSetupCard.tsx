import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { theme } from '../../../../theme/theme';
import { Icon } from '../../../../components/common/Icons';
import { PAYOUT_SETUP_VISUALS } from '../utils';
import type { PayoutAccountStatus } from '../types';

interface Props {
    status: PayoutAccountStatus;
    onPress: () => void;
}

export function PayoutSetupCard({ status, onPress }: Props) {
    const v = PAYOUT_SETUP_VISUALS[status];
    const isPrimary = v.ctaVariant === 'primary';

    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <View style={styles.titleRow}>
                    <View style={styles.iconWrap}>
                        <Icon
                            name={status === 'verified' ? 'shield-check' : 'card'}
                            size={18}
                            color={theme.colors.primary}
                        />
                    </View>
                    <Text style={styles.sectionLabel}>Payout setup</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: v.badgeBg }]}>
                    <Text style={[styles.badgeText, { color: v.badgeFg }]}>{v.badge}</Text>
                </View>
            </View>

            <Text style={styles.title}>{v.title}</Text>
            <Text style={styles.description}>{v.description}</Text>

            <TouchableOpacity
                style={[styles.cta, isPrimary ? styles.ctaPrimary : styles.ctaSecondary]}
                onPress={onPress}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={v.ctaLabel}
            >
                <Text
                    style={[
                        styles.ctaText,
                        isPrimary ? styles.ctaTextPrimary : styles.ctaTextSecondary,
                    ]}
                >
                    {v.ctaLabel}
                </Text>
            </TouchableOpacity>

            <Text style={styles.footnote}>
                VAMO uses Stripe to securely manage payments, identity verification and bank
                payouts.
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: theme.colors.background,
        borderRadius: 16,
        padding: 18,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        ...theme.shadows.small,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
    },
    iconWrap: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: theme.colors.primary + '14',
        alignItems: 'center',
        justifyContent: 'center',
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: theme.colors.text.tertiary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
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
    title: {
        fontSize: 17,
        fontWeight: '800',
        color: theme.colors.text.primary,
        letterSpacing: -0.3,
        marginBottom: 6,
    },
    description: {
        fontSize: 13.5,
        lineHeight: 19,
        color: theme.colors.text.secondary,
        marginBottom: 14,
    },
    cta: {
        alignSelf: 'flex-start',
        paddingHorizontal: 18,
        paddingVertical: 11,
        borderRadius: 999,
    },
    ctaPrimary: {
        backgroundColor: theme.colors.primary,
        ...theme.shadows.button,
    },
    ctaSecondary: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: theme.colors.primary,
    },
    ctaText: {
        fontSize: 13,
        fontWeight: '700',
    },
    ctaTextPrimary: {
        color: '#FFFFFF',
    },
    ctaTextSecondary: {
        color: theme.colors.primary,
    },
    footnote: {
        fontSize: 11.5,
        color: theme.colors.text.tertiary,
        marginTop: 14,
        lineHeight: 16,
    },
});
