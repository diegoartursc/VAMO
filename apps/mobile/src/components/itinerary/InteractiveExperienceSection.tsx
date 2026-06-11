import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    ScrollView,
    Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme/theme';
import { Icon, IconName } from '../common/Icons';
import { haptics } from '../../services/haptics';

/**
 * Comunicação da experiência interativa pós-compra.
 *
 * Mostra ao viajante, ANTES da compra, que o roteiro vira uma "central de
 * viagem": versão original do criador + versão personalizável, com documentos,
 * checklist e export em PDF. Todos os itens abaixo refletem funcionalidades já
 * implementadas (route-versioning + trip-center). Nada é prometido sem existir.
 */

type Benefit = {
    icon: IconName;
    title: string;
    description: string;
};

const BENEFITS: Benefit[] = [
    {
        icon: 'edit',
        title: 'Personalize seu roteiro',
        description:
            'Use o roteiro como base e adapte horários, gastos, atividades e observações à sua viagem real.',
    },
    {
        icon: 'file',
        title: 'Guarde seus documentos',
        description:
            'Adicione reservas, bilhetes, vouchers, PDFs e cartões de embarque em um só lugar.',
    },
    {
        icon: 'clipboard-list',
        title: 'Monte seu checklist',
        description:
            'Crie tarefas próprias, marque o que já foi resolvido e acompanhe sua preparação.',
    },
    {
        icon: 'download',
        title: 'Exporte em PDF',
        description:
            'Gere uma versão em PDF do roteiro original ou da sua versão personalizada.',
    },
];

const STEPS: { icon: IconName; title: string; description: string }[] = [
    {
        icon: 'book-open',
        title: 'Acesse o roteiro original',
        description: 'Veja o conteúdo completo criado pelo roteirista.',
    },
    {
        icon: 'edit',
        title: 'Crie sua versão',
        description:
            'Adapte atividades, horários, gastos e observações para a sua viagem real.',
    },
    {
        icon: 'clipboard-list',
        title: 'Centralize tudo',
        description:
            'Guarde documentos, reservas, bilhetes, PDFs e checklist dentro do roteiro comprado.',
    },
];

export const InteractiveExperienceSection: React.FC = () => {
    const [showModal, setShowModal] = useState(false);

    const openModal = () => {
        haptics.light();
        setShowModal(true);
    };

    return (
        <View style={styles.wrapper}>
            {/* Header da seção */}
            <View style={styles.header}>
                <View style={styles.headerBadge}>
                    <Icon name="map" size={13} color="#fff" />
                    <Text style={styles.headerBadgeText}>Central de viagem</Text>
                </View>
                <Text style={styles.title}>
                    Depois da compra, este roteiro vira sua central de viagem
                </Text>
                <Text style={styles.subtitle}>
                    Além de acessar o roteiro original, você pode personalizar sua própria
                    versão, guardar documentos e organizar tudo em um só lugar.
                </Text>
            </View>

            {/* Cards de benefícios */}
            <View style={styles.benefitsGrid}>
                {BENEFITS.map((b) => (
                    <View key={b.title} style={styles.benefitCard}>
                        <View style={styles.benefitIcon}>
                            <Icon name={b.icon} size={20} color={theme.colors.primaryDark} />
                        </View>
                        <Text style={styles.benefitTitle}>{b.title}</Text>
                        <Text style={styles.benefitDesc}>{b.description}</Text>
                    </View>
                ))}
            </View>

            {/* Original x Sua versão */}
            <View style={styles.compareRow}>
                <View style={styles.compareCard}>
                    <View style={styles.compareHeader}>
                        <Icon name="book-open" size={15} color={theme.colors.secondary} />
                        <Text style={styles.compareLabel}>Original do criador</Text>
                    </View>
                    <Text style={styles.compareText}>
                        Conteúdo completo, dicas, custos e recomendações de quem viveu a viagem.
                    </Text>
                </View>
                <View style={[styles.compareCard, styles.compareCardMine]}>
                    <View style={styles.compareHeader}>
                        <Icon name="edit" size={15} color={theme.colors.primaryDark} />
                        <Text style={[styles.compareLabel, { color: theme.colors.primaryDark }]}>
                            Sua versão
                        </Text>
                    </View>
                    <Text style={styles.compareText}>
                        Adicione seus documentos, ajustes, reservas, gastos e checklist pessoal.
                    </Text>
                </View>
            </View>

            {/* Nota de privacidade */}
            <View style={styles.privacyNote}>
                <Icon name="lock" size={14} color={theme.colors.text.secondary} />
                <Text style={styles.privacyText}>
                    O roteiro original continua preservado. As alterações que você fizer ficam
                    salvas apenas na sua versão.
                </Text>
            </View>

            {/* CTA secundário */}
            <TouchableOpacity
                style={styles.howButton}
                onPress={openModal}
                activeOpacity={0.85}
                accessibilityLabel="Ver como funciona depois da compra"
            >
                <Icon name="help" size={16} color={theme.colors.primaryDark} />
                <Text style={styles.howButtonText}>Ver como funciona</Text>
            </TouchableOpacity>

            {/* Modal "Como funciona" */}
            <Modal
                visible={showModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowModal(false)}
            >
                <Pressable style={styles.modalBackdrop} onPress={() => setShowModal(false)}>
                    <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
                        <LinearGradient
                            colors={['#1A3263', '#162A55']}
                            style={styles.modalHeader}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Text style={styles.modalTitle}>Como funciona depois da compra?</Text>
                            <TouchableOpacity
                                onPress={() => setShowModal(false)}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                accessibilityLabel="Fechar"
                            >
                                <Icon name="close" size={20} color="#fff" />
                            </TouchableOpacity>
                        </LinearGradient>

                        <ScrollView style={styles.modalBody} contentContainerStyle={{ paddingBottom: 8 }}>
                            {STEPS.map((step, i) => (
                                <View key={step.title} style={styles.stepRow}>
                                    <View style={styles.stepNumberCol}>
                                        <View style={styles.stepNumber}>
                                            <Text style={styles.stepNumberText}>{i + 1}</Text>
                                        </View>
                                        {i < STEPS.length - 1 && <View style={styles.stepLine} />}
                                    </View>
                                    <View style={styles.stepContent}>
                                        <View style={styles.stepTitleRow}>
                                            <Icon name={step.icon} size={15} color={theme.colors.primaryDark} />
                                            <Text style={styles.stepTitle}>{step.title}</Text>
                                        </View>
                                        <Text style={styles.stepDesc}>{step.description}</Text>
                                    </View>
                                </View>
                            ))}

                            <View style={styles.modalPrivacy}>
                                <Icon name="lock" size={13} color={theme.colors.text.secondary} />
                                <Text style={styles.modalPrivacyText}>
                                    Sua versão é privada. As alterações ficam salvas apenas para você.
                                </Text>
                            </View>
                        </ScrollView>

                        <TouchableOpacity
                            style={styles.modalButton}
                            onPress={() => setShowModal(false)}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.modalButtonText}>Entendi</Text>
                        </TouchableOpacity>
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
};

/**
 * Box compacto de conversão para posicionar perto do botão "Comprar agora".
 * Reforça o valor sem ocupar espaço excessivo.
 */
export const PostPurchaseConversionBox: React.FC = () => {
    const bullets = [
        'Roteiro original + sua versão personalizada',
        'Documentos, bilhetes e reservas em um só lugar',
        'Checklist próprio para não esquecer nada',
    ];
    return (
        <View style={styles.box}>
            <View style={styles.boxHeader}>
                <View style={styles.boxIcon}>
                    <Icon name="map" size={16} color={theme.colors.primaryDark} />
                </View>
                <Text style={styles.boxTitle}>Após a compra, organize tudo dentro da VAMO</Text>
            </View>
            <Text style={styles.boxSubtitle}>
                Adapte o roteiro à sua viagem, salve documentos importantes e acompanhe seu
                checklist em Meus Roteiros.
            </Text>
            <View style={styles.boxBullets}>
                {bullets.map((b) => (
                    <View key={b} style={styles.boxBulletRow}>
                        <Icon name="check-square" size={14} color={theme.colors.primaryDark} />
                        <Text style={styles.boxBulletText}>{b}</Text>
                    </View>
                ))}
            </View>
        </View>
    );
};

/** Badge discreta "Roteiro interativo" para o topo de Detalhes do Roteiro. */
export const InteractiveRouteBadge: React.FC = () => (
    <View style={styles.badge}>
        <Icon name="map" size={12} color={theme.colors.primaryDark} />
        <Text style={styles.badgeText}>Roteiro interativo</Text>
    </View>
);

const styles = StyleSheet.create({
    // Seção de valor
    wrapper: {
        backgroundColor: theme.colors.surfaceLight,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    header: {
        marginBottom: theme.spacing.md,
    },
    headerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 5,
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: theme.borderRadius.full,
        marginBottom: 10,
    },
    headerBadgeText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
    },
    title: {
        fontSize: 18,
        fontWeight: '800',
        color: theme.colors.secondary,
        lineHeight: 24,
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 13,
        color: theme.colors.text.secondary,
        lineHeight: 19,
    },
    benefitsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.sm,
    },
    benefitCard: {
        flexBasis: '47%',
        flexGrow: 1,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.sm,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    benefitIcon: {
        width: 36,
        height: 36,
        borderRadius: theme.borderRadius.sm,
        backgroundColor: theme.colors.glass.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    benefitTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: 3,
    },
    benefitDesc: {
        fontSize: 12,
        color: theme.colors.text.secondary,
        lineHeight: 16,
    },
    // Comparação Original x Sua versão
    compareRow: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
        marginTop: theme.spacing.md,
    },
    compareCard: {
        flex: 1,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.sm,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    compareCardMine: {
        borderColor: theme.colors.primary,
        backgroundColor: 'rgba(40, 201, 191, 0.06)',
    },
    compareHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 6,
    },
    compareLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: theme.colors.secondary,
    },
    compareText: {
        fontSize: 12,
        color: theme.colors.text.secondary,
        lineHeight: 16,
    },
    // Privacidade
    privacyNote: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        marginTop: theme.spacing.md,
    },
    privacyText: {
        flex: 1,
        fontSize: 12,
        color: theme.colors.text.secondary,
        lineHeight: 16,
    },
    // CTA "Ver como funciona"
    howButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: theme.spacing.md,
        paddingVertical: 12,
        borderRadius: theme.borderRadius.md,
        borderWidth: 1.5,
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.surface,
    },
    howButtonText: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.colors.primaryDark,
    },
    // Modal
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(16, 32, 64, 0.55)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.lg,
    },
    modalCard: {
        width: '100%',
        maxWidth: 440,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.lg,
        overflow: 'hidden',
        ...theme.shadows.large,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.md,
    },
    modalTitle: {
        flex: 1,
        fontSize: 16,
        fontWeight: '800',
        color: '#fff',
    },
    modalBody: {
        paddingHorizontal: theme.spacing.md,
        paddingTop: theme.spacing.md,
        maxHeight: 360,
    },
    stepRow: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
    },
    stepNumberCol: {
        alignItems: 'center',
    },
    stepNumber: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: theme.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepNumberText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '800',
    },
    stepLine: {
        width: 2,
        flex: 1,
        backgroundColor: theme.colors.border,
        marginVertical: 4,
    },
    stepContent: {
        flex: 1,
        paddingBottom: theme.spacing.md,
    },
    stepTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 3,
    },
    stepTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.colors.text.primary,
    },
    stepDesc: {
        fontSize: 13,
        color: theme.colors.text.secondary,
        lineHeight: 18,
    },
    modalPrivacy: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        backgroundColor: theme.colors.surfaceLight,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.sm,
        marginTop: 4,
    },
    modalPrivacyText: {
        flex: 1,
        fontSize: 12,
        color: theme.colors.text.secondary,
        lineHeight: 16,
    },
    modalButton: {
        margin: theme.spacing.md,
        paddingVertical: 14,
        borderRadius: theme.borderRadius.md,
        backgroundColor: theme.colors.primary,
        alignItems: 'center',
        ...theme.shadows.button,
    },
    modalButtonText: {
        fontSize: 15,
        fontWeight: '800',
        color: '#fff',
    },
    // Box de conversão compacto
    box: {
        backgroundColor: 'rgba(40, 201, 191, 0.08)',
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
        borderWidth: 1,
        borderColor: 'rgba(40, 201, 191, 0.25)',
    },
    boxHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 8,
    },
    boxIcon: {
        width: 32,
        height: 32,
        borderRadius: theme.borderRadius.sm,
        backgroundColor: theme.colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
    },
    boxTitle: {
        flex: 1,
        fontSize: 14,
        fontWeight: '800',
        color: theme.colors.secondary,
    },
    boxSubtitle: {
        fontSize: 12,
        color: theme.colors.text.secondary,
        lineHeight: 17,
        marginBottom: 10,
    },
    boxBullets: {
        gap: 6,
    },
    boxBulletRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    boxBulletText: {
        flex: 1,
        fontSize: 12.5,
        color: theme.colors.text.primary,
        fontWeight: '500',
    },
    // Badge
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 5,
        backgroundColor: theme.colors.glass.primary,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: theme.borderRadius.full,
        borderWidth: 1,
        borderColor: 'rgba(40, 201, 191, 0.3)',
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: theme.colors.primaryDark,
    },
});
