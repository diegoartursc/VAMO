import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../src/theme/theme';

const VERIFICATION_STEPS = [
    {
        icon: 'document-text-outline',
        title: 'Documentação Completa',
        description: 'CNPJ ativo, Cadastur (Ministério do Turismo) e contrato social verificados.',
    },
    {
        icon: 'shield-checkmark-outline',
        title: 'Histórico Analisado',
        description: 'Avaliamos reclamações em sites como Reclame Aqui e histórico de operação.',
    },
    {
        icon: 'chatbubbles-outline',
        title: 'Contato Validado',
        description: 'WhatsApp e e-mail testados. Garantimos resposta em até 2h comerciais.',
    },
    {
        icon: 'star-outline',
        title: 'Avaliações Reais',
        description: 'Reviews são de viajantes verificados que compraram pelo VAMO.',
    },
];

export default function VerificationExplainedScreen() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Verificação de Agências</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Hero */}
                <View style={styles.heroSection}>
                    <View style={styles.shieldIcon}>
                        <Ionicons name="shield-checkmark" size={48} color={theme.colors.verified} />
                    </View>
                    <Text style={styles.heroTitle}>Sua segurança é nossa prioridade</Text>
                    <Text style={styles.heroSubtitle}>
                        Toda agência com o selo ✓ passou por um processo rigoroso de verificação.
                    </Text>
                </View>

                {/* Steps */}
                <View style={styles.stepsContainer}>
                    {VERIFICATION_STEPS.map((step, index) => (
                        <View key={index} style={styles.stepCard}>
                            <View style={styles.stepNumber}>
                                <Text style={styles.stepNumberText}>{index + 1}</Text>
                            </View>
                            <View style={styles.stepIconContainer}>
                                <Ionicons name={step.icon as any} size={28} color={theme.colors.primary} />
                            </View>
                            <View style={styles.stepContent}>
                                <Text style={styles.stepTitle}>{step.title}</Text>
                                <Text style={styles.stepDescription}>{step.description}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* FAQ */}
                <View style={styles.faqSection}>
                    <Text style={styles.faqTitle}>Perguntas Frequentes</Text>

                    <View style={styles.faqItem}>
                        <Text style={styles.faqQuestion}>O preço final inclui tudo?</Text>
                        <Text style={styles.faqAnswer}>
                            Sim. Todos os valores exibidos são finais. Taxas, quando existentes, são mostradas antes do checkout.
                        </Text>
                    </View>

                    <View style={styles.faqItem}>
                        <Text style={styles.faqQuestion}>E se houver um imprevisto?</Text>
                        <Text style={styles.faqAnswer}>
                            A agência é responsável pela operação. Você pode contatar via WhatsApp ou acionar nosso suporte.
                        </Text>
                    </View>

                    <View style={styles.faqItem}>
                        <Text style={styles.faqQuestion}>Como funciona o reembolso?</Text>
                        <Text style={styles.faqAnswer}>
                            Cada pacote exibe sua política. A maioria oferece reembolso integral até 24h antes.
                        </Text>
                    </View>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 50,
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: theme.typography.sizes.title,
        fontWeight: theme.typography.weights.bold,
        color: theme.colors.text.primary,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    heroSection: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    shieldIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: `${theme.colors.verified}15`,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    heroTitle: {
        fontSize: theme.typography.sizes.hero,
        fontWeight: theme.typography.weights.bold,
        color: theme.colors.text.primary,
        textAlign: 'center',
        marginBottom: 8,
    },
    heroSubtitle: {
        fontSize: theme.typography.sizes.body,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        lineHeight: 22,
    },
    stepsContainer: {
        gap: 16,
    },
    stepCard: {
        flexDirection: 'row',
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.lg,
        padding: 16,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    stepNumber: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: theme.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    stepNumberText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: theme.typography.weights.bold,
    },
    stepIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: `${theme.colors.primary}15`,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    stepContent: {
        flex: 1,
    },
    stepTitle: {
        fontSize: theme.typography.sizes.body,
        fontWeight: theme.typography.weights.semibold,
        color: theme.colors.text.primary,
        marginBottom: 4,
    },
    stepDescription: {
        fontSize: theme.typography.sizes.caption,
        color: theme.colors.text.secondary,
        lineHeight: 18,
    },
    faqSection: {
        marginTop: 32,
    },
    faqTitle: {
        fontSize: theme.typography.sizes.title,
        fontWeight: theme.typography.weights.bold,
        color: theme.colors.text.primary,
        marginBottom: 16,
    },
    faqItem: {
        marginBottom: 20,
    },
    faqQuestion: {
        fontSize: theme.typography.sizes.body,
        fontWeight: theme.typography.weights.semibold,
        color: theme.colors.text.primary,
        marginBottom: 6,
    },
    faqAnswer: {
        fontSize: theme.typography.sizes.caption,
        color: theme.colors.text.secondary,
        lineHeight: 20,
    },
});
