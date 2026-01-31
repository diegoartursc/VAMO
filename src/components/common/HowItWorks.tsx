import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../theme/theme';

export default function HowItWorks() {
    const steps = [
        {
            icon: '🔍',
            title: '1. Escolha',
            description: 'Navegue pelos pacotes verificados'
        },
        {
            icon: '💳',
            title: '2. Pague',
            description: 'Pagamento seguro em até 12x'
        },
        {
            icon: '✈️',
            title: '3. Viaje',
            description: 'Tudo organizado, só curtir!'
        }
    ];

    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>Como funciona</Text>
            <Text style={styles.subtitle}>Viajar nunca foi tão simples</Text>

            <View style={styles.stepsContainer}>
                {steps.map((step, index) => (
                    <View key={index} style={styles.step}>
                        <Text style={styles.icon}>{step.icon}</Text>
                        <Text style={styles.stepTitle}>{step.title}</Text>
                        <Text style={styles.stepDescription}>{step.description}</Text>
                    </View>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingVertical: theme.spacing.xl,
        paddingHorizontal: theme.spacing.md,
        backgroundColor: theme.colors.surfaceLight,
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: theme.colors.text.primary,
        textAlign: 'center',
        marginBottom: theme.spacing.xs,
    },
    subtitle: {
        fontSize: 14,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        marginBottom: theme.spacing.xl,
    },
    stepsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        gap: theme.spacing.md,
    },
    step: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: theme.colors.background,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.lg,
        ...theme.shadows.small,
    },
    icon: {
        fontSize: 40,
        marginBottom: theme.spacing.sm,
    },
    stepTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.xs,
    },
    stepDescription: {
        fontSize: 13,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        lineHeight: 18,
    },
});
