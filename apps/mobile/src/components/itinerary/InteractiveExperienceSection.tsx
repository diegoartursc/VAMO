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
        title: 'Personalize your itinerary',
        description:
            'Use the itinerary as a starting point and adapt times, expenses, activities and notes to your real trip.',
    },
    {
        icon: 'file',
        title: 'Keep your documents',
        description:
            'Add bookings, tickets, vouchers, PDFs and boarding passes in one place.',
    },
    {
        icon: 'clipboard-list',
        title: 'Build your checklist',
        description:
            'Create your own tasks, check off what\'s done and track your preparation.',
    },
    {
        icon: 'download',
        title: 'Export as PDF',
        description:
            'Generate a PDF of the original itinerary or your personalized version.',
    },
];

const STEPS: { icon: IconName; title: string; description: string }[] = [
    {
        icon: 'book-open',
        title: 'View the original itinerary',
        description: 'See the full content created by the creator.',
    },
    {
        icon: 'edit',
        title: 'Create your version',
        description:
            'Adapt activities, times, expenses and notes to your real trip.',
    },
    {
        icon: 'clipboard-list',
        title: 'Keep it all together',
        description:
            'Keep documents, bookings, tickets, PDFs and your checklist inside the purchased itinerary.',
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
                    <Text style={styles.headerBadgeText}>Trip center</Text>
                </View>
                <Text style={styles.title}>
                    After purchase, this itinerary becomes your trip center
                </Text>
                <Text style={styles.subtitle}>
                    Besides viewing the original itinerary, you can personalize your own
                    version, store documents and organize everything in one place.
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
                        <Text style={styles.compareLabel}>Creator's original</Text>
                    </View>
                    <Text style={styles.compareText}>
                        Full content, tips, costs and recommendations from someone who lived the trip.
                    </Text>
                </View>
                <View style={[styles.compareCard, styles.compareCardMine]}>
                    <View style={styles.compareHeader}>
                        <Icon name="edit" size={15} color={theme.colors.primaryDark} />
                        <Text style={[styles.compareLabel, { color: theme.colors.primaryDark }]}>
                            Your version
                        </Text>
                    </View>
                    <Text style={styles.compareText}>
                        Add your documents, changes, bookings, expenses and personal checklist.
                    </Text>
                </View>
            </View>

            {/* Nota de privacidade */}
            <View style={styles.privacyNote}>
                <Icon name="lock" size={14} color={theme.colors.text.secondary} />
                <Text style={styles.privacyText}>
                    The original itinerary stays untouched. Any changes you make are
                    saved only to your own version.
                </Text>
            </View>

            {/* CTA secundário */}
            <TouchableOpacity
                style={styles.howButton}
                onPress={openModal}
                activeOpacity={0.85}
                accessibilityLabel="See how it works after purchase"
            >
                <Icon name="help" size={16} color={theme.colors.primaryDark} />
                <Text style={styles.howButtonText}>See how it works</Text>
            </TouchableOpacity>

            {/* Modal "How it works" */}
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
                            <Text style={styles.modalTitle}>How does it work after purchase?</Text>
                            <TouchableOpacity
                                onPress={() => setShowModal(false)}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                accessibilityLabel="Close"
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
                                    Your version is private. Changes are saved only for you.
                                </Text>
                            </View>
                        </ScrollView>

                        <TouchableOpacity
                            style={styles.modalButton}
                            onPress={() => setShowModal(false)}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.modalButtonText}>Got it</Text>
                        </TouchableOpacity>
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
};

/** Badge discreta "Roteiro interativo" para o topo de Detalhes do Roteiro. */
export const InteractiveRouteBadge: React.FC = () => (
    <View style={styles.badge}>
        <Icon name="map" size={12} color={theme.colors.primaryDark} />
        <Text style={styles.badgeText}>Interactive itinerary</Text>
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
