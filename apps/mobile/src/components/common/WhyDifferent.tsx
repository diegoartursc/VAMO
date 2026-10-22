import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../theme/theme';

// Componente refatorado para ser usado DENTRO de ExpandableCard
export default function WhyDifferent() {
    const features = [
        {
            icon: '✓',
            title: 'No fluff',
            description: 'Everything you need in one place'
        },
        {
            icon: '✓',
            title: 'No surprises',
            description: 'Real final price, no hidden fees'
        },
        {
            icon: '✓',
            title: 'No risk',
            description: 'Verified itineraries + secure checkout'
        }
    ];

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Why is VAMO different?</Text>

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
