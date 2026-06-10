import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../../src/theme/theme';
import { getCreatorById } from '../../../src/services/api';
import { VerifiedBadge } from '../../../src/components/creator/VerifiedBadge';
import { Icon } from '../../../src/components/common/Icons';
import { ErrorState } from '../../../src/components/common/ErrorState';
import { Alert } from 'react-native';
import { shareService } from '../../../src/services/sharing';
import { haptics } from '../../../src/services/haptics';

export default function CreatorDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const [creator, setCreator] = useState<any>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [isFollowing, setIsFollowing] = useState(false);

    const loadCreator = useCallback(() => {
        setLoadError(null);
        getCreatorById(id as string)
            .then((data) => {
                if (data) setCreator(data);
                else setLoadError('Criador não encontrado ou indisponível.');
            })
            .catch((err: unknown) => {
                setLoadError(err instanceof Error
                    ? err.message
                    : 'Não foi possível carregar o perfil do criador.');
            });
    }, [id]);

    useEffect(() => { loadCreator(); }, [loadCreator]);

    if (loadError) {
        return (
            <View style={styles.container}>
                <ErrorState message={loadError} onRetry={loadCreator} />
            </View>
        );
    }

    if (!creator) {
        return (
            <View style={styles.container}>
                <Text>Carregando...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <LinearGradient
                colors={theme.colors.gradients.institutional}
                style={styles.header}
            >
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Text style={styles.backIcon}>‹</Text>
                    <Text style={styles.backText}>Voltar</Text>
                </TouchableOpacity>
            </LinearGradient>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Profile Header */}
                <View style={styles.profileHeader}>
                    <Text style={styles.avatar}>{creator.avatar}</Text>
                    <View style={styles.profileInfo}>
                        <View style={styles.nameRow}>
                            <Text style={styles.name}>{creator.name}</Text>
                            <VerifiedBadge level={creator.verificationLevel} size="medium" />
                        </View>
                        <Text style={styles.memberSince}>Membro desde {creator.memberSince}</Text>
                    </View>
                </View>

                {/* Stats */}
                <View style={styles.statsContainer}>
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
                        <Text style={styles.statValue}>{creator.stats.averageRating}</Text>
                        <Text style={styles.statLabel}>Avaliação</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.stat}>
                        <Text style={styles.statValue}>{creator.stats.responseTime}</Text>
                        <Text style={styles.statLabel}>Resposta</Text>
                    </View>
                </View>

                {/* Bio */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Sobre</Text>
                    <Text style={styles.bio}>{creator.bio}</Text>
                </View>

                {/* Destinations */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Destinos</Text>
                    <Text style={styles.destinationsList}>
                        {creator.destinations.join(' • ')}
                    </Text>
                </View>

                {/* Roteiros */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Roteiros disponíveis</Text>
                    <TouchableOpacity
                        style={{ backgroundColor: theme.colors.surface, padding: 20, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border }}
                        onPress={() => router.push('/(tabs)/itineraries')}
                    >
                        <Icon name="map" size={28} color={theme.colors.primary} style={{ marginBottom: 8 }} />
                        <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.text.primary, marginBottom: 4 }}>
                            {creator.stats.itinerariesCount} roteiros disponíveis
                        </Text>
                        <Text style={{ fontSize: 13, color: theme.colors.primary, fontWeight: '600' }}>
                            Ver roteiros →
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                    <TouchableOpacity
                        style={styles.messageButton}
                        onPress={() => {
                            haptics.light();
                            router.push('/(tabs)/itineraries');
                        }}
                    >
                        <Text style={styles.messageButtonText}>Conferir Roteiros</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.followButton, isFollowing && { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.primary }]}
                        onPress={() => {
                            haptics.success();
                            setIsFollowing(!isFollowing);
                            if (!isFollowing) {
                                Alert.alert(
                                    '✅ Seguindo!',
                                    `Você agora está seguindo ${creator.name}. Receberá notificações sobre novos roteiros.`
                                );
                            }
                        }}
                    >
                        <Text style={[styles.followButtonText, isFollowing && { color: theme.colors.primary }]}>
                            {isFollowing ? '✅ Seguindo' : 'Seguir'}
                        </Text>
                    </TouchableOpacity>
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
        paddingTop: 50,
        paddingBottom: 16,
        paddingHorizontal: 20,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backIcon: {
        fontSize: 32,
        color: theme.colors.text.inverse,
        marginRight: 4,
    },
    backText: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text.inverse,
    },
    scrollView: {
        flex: 1,
    },
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        gap: 16,
    },
    avatar: {
        fontSize: 64,
    },
    profileInfo: {
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    name: {
        fontSize: 24,
        fontWeight: '700',
        color: theme.colors.text.primary,
    },
    memberSince: {
        fontSize: 14,
        color: theme.colors.text.secondary,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        marginHorizontal: 20,
        padding: 20,
        borderRadius: 16,
        marginBottom: 24,
    },
    stat: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: theme.colors.text.secondary,
    },
    statDivider: {
        width: 1,
        height: 30,
        backgroundColor: theme.colors.border,
    },
    section: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: 12,
    },
    bio: {
        fontSize: 15,
        color: theme.colors.text.secondary,
        lineHeight: 22,
    },
    destinationsList: {
        fontSize: 15,
        color: theme.colors.text.primary,
        lineHeight: 22,
    },
    placeholderText: {
        fontSize: 15,
        color: theme.colors.text.secondary,
        fontStyle: 'italic',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    messageButton: {
        flex: 1,
        backgroundColor: theme.colors.surface,
        paddingVertical: 16,
        borderRadius: theme.borderRadius.full,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    messageButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    followButton: {
        flex: 1,
        backgroundColor: theme.colors.primary,
        paddingVertical: 16,
        borderRadius: theme.borderRadius.full,
        alignItems: 'center',
        ...theme.shadows.button,
    },
    followButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.text.inverse,
    },
});
