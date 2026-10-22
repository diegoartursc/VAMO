import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { theme } from '../../theme/theme';
import { useNotification } from '../../hooks/useNotification';

export default function NotificationDemo() {
    const { showNotification } = useNotification();

    const handleTestBooking = () => {
        showNotification({
            type: 'booking',
            title: 'Your spot is reserved for',
            timer: '2:30',
            image: require('../../assets/demo-place.jpg'),
            actionLabel: 'Go to cart',
            onAction: () => {
                // Handle cart navigation
            },
            duration: 8000,
        });
    };

    const handleTestSuccess = () => {
        showNotification({
            type: 'success',
            title: 'Booking confirmed!',
            message: 'You\'ll receive an email with the details',
            actionLabel: 'View details',
            onAction: () => {
                // Handle details navigation
            },
        });
    };

    const handleTestError = () => {
        showNotification({
            type: 'error',
            title: 'Processing error',
            message: 'Please try again later',
        });
    };

    const handleTestWarning = () => {
        showNotification({
            type: 'warning',
            title: 'Heads up',
            message: 'Few spots left for this date',
        });
    };

    const handleTestInfo = () => {
        showNotification({
            type: 'info',
            title: 'New update available',
            message: 'Version 2.0.1 with performance improvements',
        });
    };

    const handleTestMultiple = () => {
        // Dispara 3 notificações em sequência para testar stacking
        setTimeout(() => handleTestInfo(), 0);
        setTimeout(() => handleTestWarning(), 500);
        setTimeout(() => handleTestSuccess(), 1000);
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.title}>Notification System</Text>
            <Text style={styles.subtitle}>Try different types of notifications</Text>

            <View style={styles.buttonGrid}>
                <TouchableOpacity style={styles.button} onPress={handleTestBooking}>
                    <Text style={styles.buttonIcon}>📦</Text>
                    <Text style={styles.buttonText}>Booking</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.button} onPress={handleTestSuccess}>
                    <Text style={styles.buttonIcon}>✅</Text>
                    <Text style={styles.buttonText}>Success</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.button} onPress={handleTestError}>
                    <Text style={styles.buttonIcon}>❌</Text>
                    <Text style={styles.buttonText}>Error</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.button} onPress={handleTestWarning}>
                    <Text style={styles.buttonIcon}>⚠️</Text>
                    <Text style={styles.buttonText}>Aviso</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.button} onPress={handleTestInfo}>
                    <Text style={styles.buttonIcon}>ℹ️</Text>
                    <Text style={styles.buttonText}>Info</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.button, styles.buttonSpecial]} onPress={handleTestMultiple}>
                    <Text style={styles.buttonIcon}>🎯</Text>
                    <Text style={styles.buttonText}>Multiple</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.infoBox}>
                <Text style={styles.infoTitle}>How to use:</Text>
                <Text style={styles.infoText}>
                    <Text style={styles.code}>showNotification()</Text> pode ser chamada de qualquer componente usando o hook{' '}
                    <Text style={styles.code}>useNotification()</Text>.
                </Text>
                <Text style={styles.infoText}>• Auto-dismiss after 5 seconds (default)</Text>
                <Text style={styles.infoText}>• Supports up to 3 simultaneous notifications</Text>
                <Text style={styles.infoText}>• Can include an action button and image</Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    content: {
        padding: theme.spacing.lg,
    },
    title: {
        fontSize: theme.typography.sizes.hero,
        fontWeight: theme.typography.weights.bold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.xs,
    },
    subtitle: {
        fontSize: theme.typography.sizes.body,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.xl,
    },
    buttonGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.md,
        marginBottom: theme.spacing.xl,
    },
    button: {
        width: '47%',
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.lg,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border,
        ...theme.shadows.small,
    },
    buttonSpecial: {
        width: '100%',
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primaryDark,
    },
    buttonIcon: {
        fontSize: 32,
        marginBottom: theme.spacing.xs,
    },
    buttonText: {
        fontSize: theme.typography.sizes.body,
        fontWeight: theme.typography.weights.semibold,
        color: theme.colors.text.primary,
    },
    infoBox: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    infoTitle: {
        fontSize: theme.typography.sizes.subheading,
        fontWeight: theme.typography.weights.bold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.sm,
    },
    infoText: {
        fontSize: theme.typography.sizes.caption,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.xs,
        lineHeight: 20,
    },
    code: {
        fontFamily: 'monospace',
        color: theme.colors.primary,
        fontWeight: theme.typography.weights.semibold,
    },
});
