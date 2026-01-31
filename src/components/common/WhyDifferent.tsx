import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../theme/theme';

// Componente refatorado para ser usado DENTRO de ExpandableCard
export default function WhyDifferent() {
    const features = [
        {
            icon: '✓',
            title: 'Sem enrolação',
            description: 'Tudo que você precisa em um lugar'
        },
        {
            icon: '✓',
            title: 'Sem surpresas',
            description: 'Preço final real, sem taxas ocultas'
        },
        {
            icon: '✓',
            title: 'Sem riscos',
            description: 'Agências verificadas + compra segura'
        }
    ];

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Por que o VAMO é diferente?</Text>

            {features.map((feature, index) => (
                <View key={index} style={styles.feature}>
                    <Text style={styles.icon}>{feature.icon}</Text>
                    <View style={styles.content}>
                        <Text style={styles.featureTitle}>{feature.title}</Text>
                        <Text style={styles.featureDescription}>{feature.description}</Text>
                    </View>
                </View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        margin: theme.spacing.md,
        padding: theme.spacing.lg,
        backgroundColor: theme.colors.background,
        borderRadius: theme.borderRadius.lg,
        borderWidth: 2,
        borderColor: theme.colors.primary,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.md,
    },
    feature: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: theme.spacing.md,
        gap: theme.spacing.sm,
    },
    icon: {
        fontSize: 20,
        color: theme.colors.success,
        fontWeight: '700',
    },
    content: {
        flex: 1,
    },
    featureTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text.primary,
        marginBottom: 2,
    },
    featureDescription: {
        fontSize: 13,
        color: theme.colors.text.secondary,
        lineHeight: 18,
    },
});
