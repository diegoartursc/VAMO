/**
 * VAMO Mobile — Central de ajuda.
 * FAQ por categorias (acordeão) + acesso ao suporte (movido pra cá, saiu do
 * Perfil). Conteúdo estático; perguntas expandem inline.
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../src/theme/theme';
import { haptics } from '../../src/services/haptics';
import { Icon, IconName } from '../../src/components/common/Icons';
import { ScreenHeader } from '../../src/components/common/ScreenHeader';
import { CREATOR_SHARE_PERCENT, PLATFORM_COMMISSION_PERCENT, PAYOUT_HOLD_DAYS } from '@vamo/shared/itinerary';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Faq { q: string; a: string; }
interface Category { icon: IconName; title: string; faqs: Faq[]; }

const CATEGORIES: Category[] = [
    {
        icon: 'circle-user', title: 'Account and access',
        faqs: [
            { q: 'How do I change my personal details?', a: 'In Profile, tap Account → Personal data. Edit your name and phone and tap "Save changes".' },
            { q: 'How do I edit my profile photo?', a: 'In Profile, tap the edit icon on your avatar for your profile photo, or "Change cover" for your cover photo.' },
            { q: 'I forgot my password. What do I do?', a: 'You sign in with the email you registered. If you can\'t sign in, use "Forgot your password?" on the sign-in screen or contact support through this Help Center.' },
        ],
    },
    {
        icon: 'book-open', title: 'Purchases and itineraries',
        faqs: [
            { q: 'Where do I find the itineraries I bought?', a: 'In the "My Itineraries" tab on the bottom bar. Every itinerary you bought is saved to your account.' },
            { q: 'Can I customize a purchased itinerary?', a: 'Yes. When you open a purchased itinerary, you can create "My version" with your own changes while keeping the original intact.' },
            { q: 'How does access work after I buy?', a: 'Access is instant and lifetime: the itinerary stays in your account for you to open whenever you want.' },
        ],
    },
    {
        icon: 'compass', title: 'Creators',
        faqs: [
            { q: 'How do I publish an itinerary?', a: 'In Profile, open the Creator Center and tap "New itinerary". Fill in the steps and submit for review.' },
            { q: 'How do I track my sales?', a: 'In the Creator Center, open "My sales" to see sales and revenue by itinerary.' },
            { q: 'How does itinerary approval work?', a: 'After you submit, the VAMO team reviews the itinerary (up to 48 hours). You\'re notified when it\'s approved or needs changes.' },
            { q: 'How much do I earn from each sale?', a: `You keep ${CREATOR_SHARE_PERCENT}% of the itinerary price. VAMO's commission is ${PLATFORM_COMMISSION_PERCENT}%. Card processing fees are shown in your earnings. Details: Creator Portal → Settings → How you get paid.` },
            { q: 'When and how do I get paid?', a: `Earnings from a sale are released ${PAYOUT_HOLD_DAYS} days after the purchase, once the refund window has passed, and are sent to the bank account you connect through Stripe (Creator Portal → Settings → Payouts). Payouts are being rolled out and we'll email you when your account can be set up.` },
            { q: 'Why is some of my balance on hold?', a: `Each sale is held for ${PAYOUT_HOLD_DAYS} days so that refunds never take back money that was already paid out. After that, it becomes available.` },
            { q: 'What happens to my earnings if a buyer gets a refund?', a: 'If a buyer is refunded under our Refund Policy, the earnings from that sale are reversed. If they were not paid out yet, they are simply removed from your balance.' },
            { q: 'Do I owe taxes on what I earn?', a: 'Yes, you are responsible for reporting and paying your own taxes. Stripe may ask for tax information (such as a Form W-9) when you set up payouts and may send tax forms where required. Talk to a tax professional if you are unsure.' },
            { q: 'How do I improve my Quality Score?', a: 'Fill in every module in detail: daily itinerary, lodging, transportation, tips, cover photos and cost estimates.' },
        ],
    },
    {
        icon: 'card', title: 'Payments and refunds',
        faqs: [
            { q: 'Which payment methods are accepted?', a: 'Payment is processed securely at checkout. The available methods appear when you buy.' },
            { q: 'How does paying for itineraries work?', a: 'You pay once for the digital itinerary and get lifetime access to it in your account.' },
            { q: 'When can I ask for help with a purchase?', a: 'Any time you have a question or problem with a purchase, contact support through this Help Center. See our Refund Policy for when you can get a refund.' },
        ],
    },
    {
        icon: 'star', title: 'Reviews and community',
        faqs: [
            { q: 'How do I review an itinerary?', a: 'After you buy, open the itinerary and tap review. Give a rating and write about your experience.' },
            { q: 'Can I add photos to my review?', a: 'Yes. When you write your review, you can attach photos from your trip.' },
            { q: 'How do I ask a question about an itinerary?', a: 'The itinerary page has a questions section. Send your question and the creator can answer.' },
        ],
    },
];

function FaqRow({ faq }: { faq: Faq }) {
    const [open, setOpen] = useState(false);
    return (
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
                haptics.selection();
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setOpen((o) => !o);
            }}
            style={s.faq}
        >
            <View style={s.faqHead}>
                <Text style={s.faqQ}>{faq.q}</Text>
                <Icon name={open ? 'chevron-down' : 'chevron-right'} size={18} color={theme.colors.text.tertiary} />
            </View>
            {open && <Text style={s.faqA}>{faq.a}</Text>}
        </TouchableOpacity>
    );
}

export default function HelpCenterScreen() {
    const router = useRouter();
    return (
        <View style={s.container}>
            <ScreenHeader title="Help Center" subtitle="Find quick answers or contact VAMO support." />
            <ScrollView contentContainerStyle={s.scroll}>
                {CATEGORIES.map((cat) => (
                    <View key={cat.title} style={s.section}>
                        <View style={s.sectionHead}>
                            <View style={s.sectionIcon}>
                                <Icon name={cat.icon} size={18} color={theme.colors.primary} />
                            </View>
                            <Text style={s.sectionTitle}>{cat.title}</Text>
                        </View>
                        <View style={s.card}>
                            {cat.faqs.map((faq, idx) => (
                                <View key={faq.q} style={idx < cat.faqs.length - 1 ? s.faqDivider : undefined}>
                                    <FaqRow faq={faq} />
                                </View>
                            ))}
                        </View>
                    </View>
                ))}

                {/* Suporte — agora vive aqui, não no Perfil. */}
                <View style={s.supportCard}>
                    <View style={s.sectionIcon}>
                        <Icon name="message-circle" size={18} color={theme.colors.primary} />
                    </View>
                    <Text style={s.supportTitle}>Didn't find what you were looking for?</Text>
                    <Text style={s.supportText}>Our team can help with any question or problem.</Text>
                    <TouchableOpacity
                        style={s.supportBtn}
                        onPress={() => { haptics.light(); router.push('/help/contact-support'); }}
                    >
                        <Icon name="message-circle" size={16} color="#fff" />
                        <Text style={s.supportBtnText}>Contact support</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.surfaceLight },
    scroll: { padding: 20, paddingBottom: 60 },
    section: { marginBottom: 22 },
    sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
    sectionIcon: {
        width: 34, height: 34, borderRadius: 17,
        backgroundColor: theme.colors.primary + '14',
        alignItems: 'center', justifyContent: 'center',
    },
    sectionTitle: { fontSize: 15, fontWeight: '800', color: theme.colors.text.primary },
    card: {
        backgroundColor: theme.colors.background,
        borderRadius: 16, overflow: 'hidden',
        borderWidth: 1, borderColor: theme.colors.borderLight,
    },
    faqDivider: { borderBottomWidth: 1, borderBottomColor: theme.colors.borderLight },
    faq: { paddingHorizontal: 16, paddingVertical: 15 },
    faqHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
    faqQ: { flex: 1, fontSize: 14.5, fontWeight: '600', color: theme.colors.text.primary },
    faqA: { fontSize: 13.5, color: theme.colors.text.secondary, lineHeight: 20, marginTop: 10 },
    supportCard: {
        backgroundColor: theme.colors.background,
        borderRadius: 16, padding: 20, alignItems: 'center',
        borderWidth: 1, borderColor: theme.colors.borderLight,
        marginTop: 4,
    },
    supportTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.text.primary, marginTop: 10, textAlign: 'center' },
    supportText: { fontSize: 13.5, color: theme.colors.text.secondary, textAlign: 'center', marginTop: 6, lineHeight: 19 },
    supportBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: theme.colors.primary, borderRadius: 14,
        paddingHorizontal: 24, paddingVertical: 13, marginTop: 16,
    },
    supportBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
