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

const CREATOR_VERIFICATION_STEPS = [
    {
        icon: 'person-outline',
        title: 'Identidade Verificada',
        description: 'CPF ou CNPJ validados com análise documental. Cada criador é uma pessoa real com identidade confirmada.',
    },
    {
        icon: 'earth-outline',
        title: 'Experiência de Viagem Comprovada',
        description: 'Verificamos fotos, relatos e comprovantes das viagens realizadas. O criador realmente viveu o roteiro.',
    },
    {
        icon: 'star-outline',
        title: 'Avaliações dos Compradores',
        description: 'Monitoramos as avaliações de quem comprou. Criadores com notas baixas são notificados e podem perder o selo.',
    },
    {
        icon: 'refresh-outline',
        title: 'Roteiros Atualizados',
        description: 'Exigimos que os roteiros sejam atualizados periodicamente. Informações defasadas são sinalizadas automaticamente.',
    },
];

export default function CreatorVerificationExplainedScreen() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Verificação de Criadores</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Hero */}
                <View style={styles.heroSection}>
                    <View style={styles.shieldIcon}>
                        <Ionicons name="shield-checkmark" size={48} color={theme.colors.verified} />
                    </View>
                    <Text style={styles.heroTitle}>Roteiros criados por quem realmente viajou</Text>
                    <Text style={styles.heroSubtitle}>
                        Todo criador com o selo ✓ passou por um processo de verificação para garantir a qualidade do conteúdo.
                    </Text>
                </View>

                {/* Steps */}
                <View style={styles.stepsContainer}>
                    {CREATOR_VERIFICATION_STEPS.map((step, index) => (
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
                        <Text style={styles.faqQuestion}>O roteiro é atualizado?</Text>
                        <Text style={styles.faqAnswer}>
                            Sim. Exigimos que criadores atualizem seus roteiros regularmente. Roteiros com mais de 6 meses sem atualização recebem um alerta.
                        </Text>
                    </View>

                    <View style={styles.faqItem}>
                        <Text style={styles.faqQuestion}>E se o roteiro não atender às expectativas?</Text>
                        <Text style={styles.faqAnswer}>
                            Você pode avaliar o roteiro e reportar problemas. Nosso time analisa cada caso e pode acionar a garantia VAMO.
                        </Text>
                    </View>

                    <View style={styles.faqItem}>
                        <Text style={styles.faqQuestion}>Como funciona o reembolso?</Text>
                        <Text style={styles.faqAnswer}>
                            Roteiros digitais possuem política de satisfação. Se identificarmos informações incorretas ou desatualizadas, o reembolso é integral.
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
