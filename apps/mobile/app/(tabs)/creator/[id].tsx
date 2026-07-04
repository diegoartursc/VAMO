import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { safeBack } from '../../../src/utils/navigation';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../../src/theme/theme';
import { getCreatorById, CreatorDetail } from '../../../src/services/api';
import { VerifiedBadge } from '../../../src/components/creator/VerifiedBadge';
import { CreatorAvatar } from '../../../src/components/common/CreatorAvatar';
import { ErrorState } from '../../../src/components/common/ErrorState';
import { Skeleton } from '../../../src/components/common/Skeleton';
import { ItineraryCard } from '../../../src/components/cards/ItineraryCard';
import { notify } from '../../../src/utils/notify';
import { haptics } from '../../../src/services/haptics';

type LoadErrorKind = 'not_found' | 'network';

function formatAverageRating(value: number | null | undefined): string {
    if (value === null || value === undefined) return 'Novo';
    return value.toFixed(1).replace('.', ',');
}

export default function CreatorDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const [creator, setCreator] = useState<CreatorDetail | null>(null);
    const [loadError, setLoadError] = useState<LoadErrorKind | null>(null);
    const [isFollowing, setIsFollowing] = useState(false);

    const scrollRef = useRef<ScrollView>(null);
    const itinerariesY = useRef(0);
    const scrollToItineraries = useCallback(() => {
        scrollRef.current?.scrollTo({ y: Math.max(0, itinerariesY.current - 12), animated: true });
    }, []);

    const loadCreator = useCallback(() => {
        setLoadError(null);
        getCreatorById(id as string)
            .then((data) => {
                if (data) setCreator(data);
                else setLoadError('not_found');
            })
            .catch(() => setLoadError('network'));
    }, [id]);

    useEffect(() => { loadCreator(); }, [loadCreator]);

    // Destinos vêm dos roteiros publicados/ativos — nunca de Creator.destinations
    // (campo manual que o roteirista não consegue editar hoje).
    const publishedDestinations = Array.from(
        new Set((creator?.itineraries ?? []).map((it) => it.destination).filter(Boolean)),
    );
    const showResponseTime = !!creator?.stats.responseTime;

    const toggleFollow = () => {
        haptics.success();
        const next = !isFollowing;
        setIsFollowing(next);
        if (next && creator) {
            notify({
                title: 'Seguindo!',
                message: `Você agora está seguindo ${creator.name}.`,
                variant: 'success',
            });
        }
    };

    return (
        <View style={styles.container}>
            {/* Header/Hero — mesma identidade visual do perfil interno: capa real
                (se o roteirista tiver cadastrado) + avatar centralizado. Sem capa,
                cai no gradient institucional (nunca uma capa genérica/aleatória). */}
            <View style={styles.header}>
                {creator?.coverUrl ? (
                    <>
                        <Image source={{ uri: creator.coverUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                        <LinearGradient
                            colors={['rgba(15,32,67,0.35)', 'rgba(15,32,67,0.65)']}
                            style={StyleSheet.absoluteFill}
                        />
                    </>
                ) : (
                    <LinearGradient colors={theme.colors.gradients.institutional as any} style={StyleSheet.absoluteFill} />
                )}

                <TouchableOpacity style={styles.backButton} onPress={() => safeBack(router, '/(tabs)')}>
                    <Text style={styles.backIcon}>‹</Text>
                    <Text style={styles.backText}>Voltar</Text>
                </TouchableOpacity>

                {creator && (
                    <View style={styles.heroContent}>
                        <CreatorAvatar creator={creator} name={creator.name} size={80} style={styles.avatar} />
                        <View style={styles.nameRow}>
                            <Text style={styles.name} numberOfLines={2}>{creator.name}</Text>
                            <VerifiedBadge level={creator.verificationLevel} size="medium" />
                        </View>
                        <View style={styles.sinceBadge}>
                            <Text style={styles.sinceText}>Membro desde {creator.memberSince}</Text>
                        </View>
                    </View>
                )}
            </View>

            {loadError && (
                <View style={styles.errorWrap}>
                    <ErrorState
                        title={loadError === 'not_found' ? 'Perfil não encontrado' : 'Algo deu errado'}
                        message={loadError === 'not_found'
                            ? 'Perfil de roteirista não encontrado.'
                            : 'Não foi possível carregar o perfil. Verifique sua conexão e tente novamente.'}
                        onRetry={loadCreator}
                    />
                </View>
            )}

            {!creator && !loadError && (
                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                    <View style={styles.statsContainer}>
                        <Skeleton width={70} height={40} />
                        <Skeleton width={70} height={40} />
                        <Skeleton width={70} height={40} />
                        <Skeleton width={70} height={40} />
                    </View>
                    <View style={styles.section}>
                        <Skeleton width="60%" height={20} style={{ marginBottom: 12 }} />
                        <Skeleton height={140} borderRadius={16} />
                    </View>
                </ScrollView>
            )}

            {creator && !loadError && (
                <ScrollView ref={scrollRef} style={styles.scrollView} showsVerticalScrollIndicator={false}>
                    {/* CTAs — "Ver roteiros" é a ação principal, "Seguir" é secundário */}
                    <View style={styles.actionButtons}>
                        <TouchableOpacity style={styles.primaryButton} onPress={() => { haptics.light(); scrollToItineraries(); }}>
                            <Text style={styles.primaryButtonText}>Ver roteiros</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.secondaryButton, isFollowing && styles.secondaryButtonActive]}
                            onPress={toggleFollow}
                        >
                            <Text style={[styles.secondaryButtonText, isFollowing && styles.secondaryButtonTextActive]}>
                                {isFollowing ? 'Seguindo' : 'Seguir'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Stats */}
                    <View style={styles.statsContainer}>
                        <View style={styles.stat}>
                            <Text style={styles.statValue}>{creator.stats.itinerariesCount}</Text>
                            <Text style={styles.statLabel}>Roteiros publicados</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.stat}>
                            <Text style={styles.statValue}>{creator.stats.totalSales}</Text>
                            <Text style={styles.statLabel}>Vendas</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.stat}>
                            <Text style={styles.statValue}>{formatAverageRating(creator.stats.averageRating)}</Text>
                            <Text style={styles.statLabel}>Avaliação</Text>
                        </View>
                        {showResponseTime && (
                            <>
                                <View style={styles.statDivider} />
                                <View style={styles.stat}>
                                    <Text style={styles.statValue}>{creator.stats.responseTime}</Text>
                                    <Text style={styles.statLabel}>Resposta</Text>
                                </View>
                            </>
                        )}
                    </View>

                    {/* Destinos — derivados dos roteiros publicados, nunca de campo manual */}
                    {publishedDestinations.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Destinos com roteiros publicados</Text>
                            <View style={styles.chipsRow}>
                                {publishedDestinations.map((d) => (
                                    <View key={d} style={styles.chip}><Text style={styles.chipText}>{d}</Text></View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Roteiros disponíveis */}
                    <View
                        style={styles.section}
                        onLayout={(e) => { itinerariesY.current = e.nativeEvent.layout.y; }}
                    >
                        <Text style={styles.sectionTitle}>Roteiros disponíveis</Text>
                        {creator.itineraries.length > 0 ? (
                            <View style={{ gap: 16 }}>
                                {creator.itineraries.map((it) => (
                                    <ItineraryCard
                                        key={it.id}
                                        itinerary={{ ...it, creator: { id: creator.id, name: creator.name, avatar: creator.avatar } }}
                                        onPress={() => router.push(`/(tabs)/itinerary/${it.id}` as any)}
                                    />
                                ))}
                            </View>
                        ) : (
                            <Text style={styles.emptyItineraries}>Este roteirista ainda não possui roteiros disponíveis.</Text>
                        )}
                    </View>

                    <View style={{ height: 40 }} />
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        paddingTop: 60,
        paddingBottom: 28,
        paddingHorizontal: 20,
        alignItems: 'center',
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        overflow: 'hidden',
        // Altura mínima garantida quando a capa é imagem (sem altura
        // intrínseca por padding interno) — mesmo valor do perfil interno.
        minHeight: 260,
    },
    backButton: {
        position: 'absolute',
        top: 54,
        left: 20,
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 2,
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
    heroContent: {
        alignItems: 'center',
        width: '100%',
        marginTop: 24,
    },
    avatar: {
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.5)',
        marginBottom: 12,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 10,
        flexWrap: 'wrap',
        paddingHorizontal: 12,
    },
    name: {
        fontSize: 22,
        fontWeight: '700',
        color: theme.colors.text.inverse,
        textAlign: 'center',
    },
    sinceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
    },
    sinceText: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.85)',
        fontWeight: '600',
    },
    errorWrap: {
        flex: 1,
        padding: 20,
    },
    scrollView: {
        flex: 1,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 20,
        marginTop: 20,
        marginBottom: 20,
    },
    primaryButton: {
        flex: 1,
        backgroundColor: theme.colors.primary,
        paddingVertical: 16,
        borderRadius: theme.borderRadius.full,
        alignItems: 'center',
        ...theme.shadows.button,
    },
    primaryButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.text.inverse,
    },
    secondaryButton: {
        flex: 1,
        backgroundColor: theme.colors.surface,
        paddingVertical: 16,
        borderRadius: theme.borderRadius.full,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    secondaryButtonActive: {
        borderColor: theme.colors.primary,
    },
    secondaryButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    secondaryButtonTextActive: {
        color: theme.colors.primary,
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
        ...theme.shadows.small,
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
    chipsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        backgroundColor: theme.colors.primary + '15',
        borderRadius: theme.borderRadius.full,
        paddingHorizontal: 14,
        paddingVertical: 8,
    },
    chipText: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.primary,
    },
    emptyItineraries: {
        fontSize: 14,
        color: theme.colors.text.tertiary,
        fontStyle: 'italic',
    },
});
