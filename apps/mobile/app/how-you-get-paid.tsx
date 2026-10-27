/**
 * VAMO Mobile — "How you get paid" (guia financeiro do roteirista).
 * Comissão e prazo vêm de packages/shared/itinerary/commission.ts (fonte única).
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import {
    PLATFORM_COMMISSION_PERCENT,
    CREATOR_SHARE_PERCENT,
    PAYOUT_HOLD_DAYS,
    computeCommission,
    computeCreatorEarning,
    formatMoney,
} from '@vamo/shared/itinerary';
import { theme } from '../src/theme/theme';
import { Icon, IconName } from '../src/components/common/Icons';
import { ScreenHeader } from '../src/components/common/ScreenHeader';

const EXAMPLE_PRICE = 26.9;

interface Block {
    icon: IconName;
    title: string;
    paragraphs: string[];
}

const BLOCKS: Block[] = [
    {
        icon: 'wallet',
        title: `You keep ${CREATOR_SHARE_PERCENT}% of every sale`,
        paragraphs: [
            `VAMO's commission is ${PLATFORM_COMMISSION_PERCENT}% of the itinerary price. The rest is yours.`,
            `Example: on a ${formatMoney(EXAMPLE_PRICE)} itinerary, VAMO's commission is ${formatMoney(computeCommission(EXAMPLE_PRICE))} and you earn ${formatMoney(computeCreatorEarning(EXAMPLE_PRICE))}, before card processing fees.`,
            'Every sale shows its price, commission and your earnings in Creator Portal → My sales.',
        ],
    },
    {
        icon: 'clock',
        title: 'When you get paid',
        paragraphs: [
            `Earnings from a sale are released ${PAYOUT_HOLD_DAYS} days after the purchase, which is the length of the refund window in our Refund Policy. This way a refund never takes back money that was already paid out.`,
            'Released earnings are sent to the bank account you connect, through Stripe.',
        ],
    },
    {
        icon: 'shield-check',
        title: 'Set up your payout account',
        paragraphs: [
            'Go to Creator Portal → Settings → Payouts and follow the steps. Stripe, our payment partner, verifies your identity and bank account. It usually takes about 10 minutes.',
            'Stripe may ask for tax information (for example a Form W-9 if you are in the United States, or a W-8 form if you are not).',
            'Payouts are being rolled out. We will email you when your account is ready to receive earnings. If your country is not supported for automatic payouts yet, contact support and we will arrange it with you.',
        ],
    },
    {
        icon: 'info',
        title: 'Refunds and disputes',
        paragraphs: [
            'If a buyer is refunded under the Refund Policy (for example the itinerary does not match its listing), the earnings from that sale are reversed. If they were not paid out yet, they are removed from your balance.',
            'Complete, accurate itineraries get fewer refunds. Make sure every module you turn on is filled in.',
        ],
    },
    {
        icon: 'file',
        title: 'Fees and taxes',
        paragraphs: [
            'Card processing fees are charged by Stripe and are shown in your earnings.',
            'You are responsible for reporting and paying your own taxes on what you earn. Stripe may send you tax forms (such as a Form 1099) where required. Talk to a tax professional if you are not sure what applies to you.',
        ],
    },
];

export default function HowYouGetPaidScreen() {
    const router = useRouter();
    return (
        <View style={s.container}>
            <ScreenHeader title="How you get paid" subtitle="Commission, payouts and taxes for creators." />
            <ScrollView contentContainerStyle={s.scroll}>
                {BLOCKS.map((b) => (
                    <View key={b.title} style={s.card}>
                        <View style={s.cardIcon}>
                            <Icon name={b.icon} size={20} color={theme.colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={s.cardTitle}>{b.title}</Text>
                            {b.paragraphs.map((p, i) => (
                                <Text key={i} style={s.cardText}>{p}</Text>
                            ))}
                        </View>
                    </View>
                ))}

                <TouchableOpacity onPress={() => router.push({ pathname: '/legal/[doc]', params: { doc: 'creators' } })}>
                    <Text style={s.link}>Read the Creator Terms</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push('/help/contact-support')}>
                    <Text style={s.link}>Questions about payouts? Contact support</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.surfaceLight },
    scroll: { padding: 20, paddingBottom: 60 },
    card: {
        flexDirection: 'row', gap: 14,
        backgroundColor: theme.colors.background,
        borderRadius: 16, padding: 16, marginBottom: 12,
        borderWidth: 1, borderColor: theme.colors.borderLight,
    },
    cardIcon: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: theme.colors.primary + '14',
        alignItems: 'center', justifyContent: 'center',
    },
    cardTitle: { fontSize: 15, fontWeight: '700', color: theme.colors.text.primary, marginBottom: 4 },
    cardText: { fontSize: 13.5, color: theme.colors.text.secondary, lineHeight: 20, marginTop: 4 },
    link: { fontSize: 14.5, fontWeight: '600', color: theme.colors.primary, marginTop: 14, textAlign: 'center' },
});
