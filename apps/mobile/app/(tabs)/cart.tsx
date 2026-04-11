import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../src/theme/theme';
import { Icon } from '../../src/components/common/Icons';

export default function CartScreen() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Carrinho</Text>
                <Text style={styles.headerSubtitle}>
                    Seus roteiros em preparação
                </Text>
            </View>

            <View style={styles.emptyState}>
                <Icon name="shopping-bag" size={48} color={theme.colors.text.tertiary} />
                <Text style={styles.emptyTitle}>Carrinho vazio</Text>
                <Text style={styles.emptyText}>
                    Adicione roteiros para comprar
                </Text>
                <TouchableOpacity
                    style={styles.exploreCta}
                    onPress={() => router.push('/(tabs)/index')}
                >
                    <Text style={styles.exploreCTAText}>Explorar roteiros →</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
        paddingTop: 12,
    },
    header: {
        paddingHorizontal: theme.spacing.lg,
        paddingBottom: theme.spacing.md,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: theme.colors.text.secondary,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.text.primary,
        marginTop: theme.spacing.md,
    },
    emptyText: {
        fontSize: 14,
        color: theme.colors.text.secondary,
        marginTop: 8,
        textAlign: 'center',
    },
    exploreCta: {
        marginTop: theme.spacing.lg,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        backgroundColor: theme.colors.primary,
        borderRadius: 8,
    },
    exploreCTAText: {
        color: '#fff',
        fontWeight: '600',
        textAlign: 'center',
    },
});
