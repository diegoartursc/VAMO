/**
 * VAMO Mobile — Como funciona.
 * Explica o fluxo do app em passos. Conteúdo estático e seguro.
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { theme } from '../src/theme/theme';
import { Icon, IconName } from '../src/components/common/Icons';
import { ScreenHeader } from '../src/components/common/ScreenHeader';

interface Step {
    icon: IconName;
    title: string;
    text: string;
}

const STEPS: Step[] = [
    { icon: 'search', title: 'Busque roteiros', text: 'Explore roteiros completos criados por viajantes que já estiveram no destino.' },
    { icon: 'card', title: 'Compre com segurança', text: 'Escolha o roteiro ideal, revise os detalhes e finalize a compra com pagamento seguro.' },
    { icon: 'book-open', title: 'Acesse em Meus Roteiros', text: 'Depois de comprar, o roteiro fica salvo na sua conta, disponível quando você precisar.' },
    { icon: 'edit', title: 'Personalize sua versão', text: 'Adapte o roteiro comprado às suas datas e preferências, sem perder o original.' },
    { icon: 'star', title: 'Avalie a experiência', text: 'Compartilhe sua opinião e ajude outros viajantes com avaliações e fotos.' },
    { icon: 'compass', title: 'Crie como roteirista', text: 'Todo viajante pode virar roteirista e publicar os próprios roteiros para vender na VAMO.' },
];

export default function HowItWorksScreen() {
    return (
        <View style={s.container}>
            <ScreenHeader title="Como funciona" subtitle="Da busca à viagem, em poucos passos." />
            <ScrollView contentContainerStyle={s.scroll}>
                {STEPS.map((step, idx) => (
                    <View key={step.title} style={s.step}>
                        <View style={s.stepLeft}>
                            <View style={s.stepIcon}>
                                <Icon name={step.icon} size={20} color={theme.colors.primary} />
                            </View>
                            {idx < STEPS.length - 1 && <View style={s.connector} />}
                        </View>
                        <View style={s.stepBody}>
                            <Text style={s.stepTitle}>{step.title}</Text>
                            <Text style={s.stepText}>{step.text}</Text>
                        </View>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.surfaceLight },
    scroll: { padding: 20, paddingBottom: 60 },
    step: { flexDirection: 'row', gap: 14 },
    stepLeft: { alignItems: 'center' },
    stepIcon: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: theme.colors.primary + '14',
        alignItems: 'center', justifyContent: 'center',
    },
    connector: { width: 2, flex: 1, backgroundColor: theme.colors.border, marginVertical: 4 },
    stepBody: { flex: 1, paddingBottom: 24 },
    stepTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.text.primary, marginTop: 8 },
    stepText: { fontSize: 13.5, color: theme.colors.text.secondary, lineHeight: 20, marginTop: 4 },
});
