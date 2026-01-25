import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { Creator, VERIFICATION_CONFIGS } from '../../types/creator';
import { VerifiedBadge } from './VerifiedBadge';
import { theme } from '../../theme/theme';

interface CreatorCardProps {
    creator: Creator;
    compact?: boolean;
    onPress?: () => void;
}

export function CreatorCard({ creator, compact = false, onPress }: CreatorCardProps) {
    if (compact) {
        return (
            <TouchableOpacity style={styles.compactCard} onPress={onPress}>
                <Text style={styles.avatar}>{creator.avatar}</Text>
                <View style={styles.compactInfo}>
                    <View style={styles.nameRow}>
                        <Text style={styles.compactName}>{creator.name}</Text>
                        <VerifiedBadge level={creator.verificationLevel} size="small" showLabel={false} />
                    </View>
                    <Text style={styles.compactStats}>
                        ⭐ {creator.stats.averageRating} • {creator.stats.itinerariesCount} roteiros
                    </Text>
                </View>
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity style={styles.card} onPress={onPress}>
            <View style={styles.header}>
                <Text style={styles.avatarLarge}>{creator.avatar}</Text>
                <View style={styles.headerInfo}>
                    <View style={styles.nameRow}>
                        <Text style={styles.name}>{creator.name}</Text>
                        <VerifiedBadge level={creator.verificationLevel} size="medium" />
                    </View>
                    <Text style={styles.memberSince}>Membro desde {creator.memberSince}</Text>
                </View>
            </View>

            <Text style={styles.bio} numberOfLines={2}>
                {creator.bio}
            </Text>

            <View style={styles.statsRow}>
                <View style={styles.stat}>
                    <Text style={styles.statValue}>{creator.stats.itinerariesCount}</Text>
                    <Text style={styles.statLabel}>Roteiros</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                    <Text style={styles.statValue}>{creator.stats.totalSales}</Text>
                    <Text style={styles.statLabel}>Vendas</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                    <Text style={styles.statValue}>⭐ {creator.stats.averageRating}</Text>
                    <Text style={styles.statLabel}>Avaliação</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                    <Text style={styles.statValue}>{creator.stats.responseTime}</Text>
                    <Text style={styles.statLabel}>Resposta</Text>
                </View>
            </View>

            <View style={styles.destinations}>
                <Text style={styles.destinationsLabel}>📍 Destinos:</Text>
                <Text style={styles.destinationsList}>
                    {creator.destinations.join(' • ')}
                </Text>
            </View>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.messageButton}
                    onPress={() => Alert.alert(
                        '💬 Enviar Mensagem',
                        `Deseja enviar uma mensagem para ${creator.name}?`,
                        [
                            { text: 'Cancelar', style: 'cancel' },
                            { text: 'Enviar', onPress: () => Alert.alert('Em breve!', 'Função de mensagens será implementada em breve.') }
                        ]
                    )}
                >
                    <Text style={styles.messageButtonText}>💬 Enviar Mensagem</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.viewButton} onPress={onPress}>
                    <Text style={styles.viewButtonText}>Ver Roteiros</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    // Compact styles
    compactCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.sm,
        gap: theme.spacing.sm,
    },
    avatar: {
        fontSize: 28,
    },
    compactInfo: {
        flex: 1,
    },
    compactName: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    compactStats: {
        fontSize: 12,
        color: theme.colors.text.secondary,
        marginTop: 2,
    },

    // Full card styles
    card: {
        backgroundColor: theme.colors.background,
        borderRadius: theme.borderRadius.lg,
        padding: 12, // Reduced from 16px for more compact cards
        ...theme.shadows.medium,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
        marginBottom: theme.spacing.md,
    },
    avatarLarge: {
        fontSize: 48,
    },
    headerInfo: {
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        flexWrap: 'wrap',
    },
    name: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.text.primary,
    },
    memberSince: {
        fontSize: 13,
        color: theme.colors.text.secondary,
        marginTop: 4,
    },
    bio: {
        fontSize: 13, // Reduced from 14px
        color: theme.colors.text.secondary,
        lineHeight: 18, // Reduced from 20
        marginBottom: 12, // Reduced from 16px
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
    },
    stat: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.text.primary,
    },
    statLabel: {
        fontSize: 11,
        color: theme.colors.text.secondary,
        marginTop: 2,
    },
    statDivider: {
        width: 1,
        height: 30,
        backgroundColor: theme.colors.border,
    },
    destinations: {
        marginBottom: theme.spacing.md,
    },
    destinationsLabel: {
        fontSize: 13,
        color: theme.colors.text.secondary,
        marginBottom: 4,
    },
    destinationsList: {
        fontSize: 14,
        color: theme.colors.text.primary,
        fontWeight: '500',
    },
    footer: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
    },
    messageButton: {
        flex: 1,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.borderRadius.full,
        backgroundColor: theme.colors.surface,
        alignItems: 'center',
    },
    messageButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: theme.colors.text.primary,
    },
    viewButton: {
        flex: 1,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.borderRadius.full,
        backgroundColor: theme.colors.primary,
        alignItems: 'center',
    },
    viewButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text.inverse,
    },
});
