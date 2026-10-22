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
import { safeBack } from '../src/utils/navigation';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../src/theme/theme';

const VERIFICATION_STEPS = [
    {
        icon: 'document-text-outline',
        title: 'Identity Confirmed',
        description: 'We verify identity, contact details and profile consistency before showing the badge.',
    },
    {
        icon: 'shield-checkmark-outline',
        title: 'Experience Reviewed',
        description: 'We review travel history, portfolio, social profiles and evidence of real experience at the destination.',
    },

    {
        icon: 'star-outline',
        title: 'Real Reviews',
        description: 'Reviews come from verified travelers who bought through VAMO.',
    },
];

export default function VerificationExplainedScreen() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => safeBack(router, '/(tabs)/profile')} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Creator Verification</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Hero */}
                <View style={styles.heroSection}>
                    <View style={styles.shieldIcon}>
                        <Ionicons name="shield-checkmark" size={48} color={theme.colors.verified} />
                    </View>
                    <Text style={styles.heroTitle}>Your safety is our priority</Text>
                    <Text style={styles.heroSubtitle}>
                        Every creator with a badge has gone through a review of identity, experience and content quality.
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
                    <Text style={styles.faqTitle}>Frequently Asked Questions</Text>

                    <View style={styles.faqItem}>
                        <Text style={styles.faqQuestion}>What does the price cover?</Text>
                        <Text style={styles.faqAnswer}>
                            The price is for access to the digital itinerary. Travel costs for lodging, transportation and attractions are shown as references when provided.
                        </Text>
                    </View>

                    <View style={styles.faqItem}>
                        <Text style={styles.faqQuestion}>Does the creator run tours or bookings?</Text>
                        <Text style={styles.faqAnswer}>
                            No. VAMO sells digital planning content. Tourism services must be booked directly by the traveler.
                        </Text>
                    </View>

                    <View style={styles.faqItem}>
                        <Text style={styles.faqQuestion}>What if there's a problem with the content?</Text>
                        <Text style={styles.faqAnswer}>
                            You can report it through support. The team reviews the case and contacts the creator when information needs to be corrected. See our Refund Policy for eligible refunds.
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
