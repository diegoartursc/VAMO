/**
 * Card de "Criador recomendado" — consome DIRETO o payload de
 * GET /api/creators/recommended (ranking real calculado no backend). Nunca
 * recalcula reputação nem decide "por que recomendar" aqui: só renderiza o
 * que o backend já decidiu (reputation.*, recommendation.primaryReason).
 *
 * Três zonas (ver auditoria da seção "Criadores recomendados"):
 *  1. Identidade — avatar com aro na cor da reputação, nome, selo, evidências.
 *  2. Prova social — até 3 indicadores numéricos (CreatorTrustMetrics).
 *  3. Ação — miniaturas dos roteiros ativos + CTA "Ver perfil".
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { CreatorAvatar } from '../common/CreatorAvatar';
import { Icon } from '../common/Icons';
import { CreatorTrustMetrics } from './CreatorTrustMetrics';
import type { RecommendedCreator } from '../../services/api';
import { theme } from '../../theme/theme';

interface RecommendedCreatorCardProps {
    creator: RecommendedCreator;
    onPress: () => void;
    onThumbnailPress?: (itineraryId: string) => void;
    style?: object;
}

export function RecommendedCreatorCard({ creator, onPress, onThumbnailPress, style }: RecommendedCreatorCardProps) {
    const { reputation, stats, recommendation, topItineraries } = creator;
    const evidenceChips = [recommendation.primaryReason, recommendation.secondaryReason].filter(Boolean) as string[];
    const extraItinerariesCount = Math.max(0, stats.activeItineraries - topItineraries.length);

    const a11yLabel = [
        `Abrir perfil de ${creator.name}`,
        reputation.label,
        stats.averageRating != null && stats.reviewCount > 0
            ? `avaliação ${stats.averageRating.toFixed(1).replace('.', ',')} em ${stats.reviewCount} avaliações`
            : null,
    ].filter(Boolean).join(', ') + '.';

    return (
        <TouchableOpacity
            style={[styles.card, style]}
            onPress={onPress}
            activeOpacity={0.92}
            accessibilityRole="button"
            accessibilityLabel={a11yLabel}
        >
            {/* Zona 1 — Identidade */}
            <View style={styles.header}>
                <View style={[styles.avatarRing, { borderColor: reputation.color }]}>
                    <CreatorAvatar avatar={creator.avatar} name={creator.name} size={56} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.name} numberOfLines={1}>{creator.name}</Text>
                    <View
                        style={[styles.reputationPill, { backgroundColor: `${reputation.color}15` }]}
                        accessibilityElementsHidden
                        importantForAccessibility="no"
                    >
                        <Text style={styles.reputationIcon}>{reputation.icon}</Text>
                        <Text style={[styles.reputationLabel, { color: reputation.color }]} numberOfLines={1}>
                            {reputation.label}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Evidências — no máximo 2, já priorizadas pelo backend */}
            {evidenceChips.length > 0 && (
                <View style={styles.evidenceRow} accessibilityElementsHidden importantForAccessibility="no">
                    {evidenceChips.map((text) => (
                        <View key={text} style={styles.evidenceChip}>
                            <Text style={styles.evidenceText} numberOfLines={1}>{text}</Text>
                        </View>
                    ))}
                </View>
            )}

            {/* Zona 2 — Prova social */}
            <CreatorTrustMetrics stats={stats} />

            {/* Zona 3 — Miniaturas + CTA */}
            <View style={styles.footer}>
                {topItineraries.length > 0 && (
                    <View style={styles.thumbStrip} accessibilityElementsHidden importantForAccessibility="no">
                        {topItineraries.map((it, index) => (
                            <ThumbnailTile
                                key={it.id}
                                url={it.image}
                                offset={index}
                                onPress={onThumbnailPress ? () => onThumbnailPress(it.id) : undefined}
                            />
                        ))}
                        {extraItinerariesCount > 0 && (
                            <View style={[styles.thumb, styles.thumbMore, { marginLeft: -12 }]}>
                                <Text style={styles.thumbMoreText}>+{extraItinerariesCount}</Text>
                            </View>
                        )}
                    </View>
                )}
                <View style={styles.ctaRow}>
                    <Text style={styles.ctaText}>Ver perfil</Text>
                    <Icon name="chevron-right" size={16} color={theme.colors.primary} strokeWidth={2.4} />
                </View>
            </View>
        </TouchableOpacity>
    );
}

function ThumbnailTile({ url, offset, onPress }: { url: string | null; offset: number; onPress?: () => void }) {
    const [failed, setFailed] = useState(false);
    const content = (!url || failed) ? (
        <View style={[styles.thumb, styles.thumbFallback]}>
            <Icon name="map" size={14} color={theme.colors.text.tertiary} />
        </View>
    ) : (
        <Image
            source={{ uri: url }}
            style={styles.thumb}
            resizeMode="cover"
            onError={() => setFailed(true)}
        />
    );
    return (
        <TouchableOpacity
            disabled={!onPress}
            onPress={onPress}
            activeOpacity={0.85}
            style={[styles.thumbWrapper, offset > 0 && { marginLeft: -12 }]}
        >
            {content}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: theme.colors.background,
        borderRadius: theme.borderRadius.lg,
        padding: 16,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        ...theme.shadows.small,
        gap: 12,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatarRing: {
        width: 62,
        height: 62,
        borderRadius: 31,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    name: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: 5,
    },
    reputationPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: theme.borderRadius.full,
    },
    reputationIcon: {
        fontSize: 11,
    },
    reputationLabel: {
        fontSize: 11,
        fontWeight: '700',
    },
    evidenceRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    evidenceChip: {
        backgroundColor: theme.colors.surfaceLight,
        borderRadius: theme.borderRadius.full,
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    evidenceText: {
        fontSize: 11.5,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        paddingTop: 4,
        borderTopWidth: 1,
        borderTopColor: theme.colors.borderLight,
        marginTop: 2,
    },
    thumbStrip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 10,
    },
    thumbWrapper: {
        borderRadius: 10,
        borderWidth: 2,
        borderColor: theme.colors.background,
    },
    thumb: {
        width: 34,
        height: 34,
        borderRadius: 8,
    },
    thumbFallback: {
        backgroundColor: theme.colors.surfaceLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    thumbMore: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.secondary,
        borderWidth: 2,
        borderColor: theme.colors.background,
    },
    thumbMoreText: {
        fontSize: 11,
        fontWeight: '700',
        color: theme.colors.text.inverse,
    },
    ctaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        paddingTop: 10,
        marginLeft: 'auto',
    },
    ctaText: {
        fontSize: 13,
        fontWeight: '700',
        color: theme.colors.primary,
    },
});
