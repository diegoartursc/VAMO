/**
 * MediaGallery — seção "Fotos e Vídeos da Viagem"
 *
 * Mostra todas as mídias do roteiro (highlightPhotos + images + mediaUrls)
 * em grid 2 colunas, com badge ▶ para vídeos. Ao tocar abre lightbox
 * modal full-screen com swipe horizontal.
 *
 * Esconde automaticamente quando não há mídia. Nunca mostra spinner
 * eterno; URLs quebradas são silenciadas via onError.
 */

import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Image,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { getGalleryMedia, type MediaItem } from '../../utils/itineraryMedia';
import MediaLightbox from './MediaLightbox';

export interface MediaGalleryProps {
    /** Itinerário completo OU lista de mídias pré-computada. */
    itinerary?: any;
    media?: MediaItem[];
    /** Título customizável; default "Fotos e Vídeos da Viagem". */
    title?: string;
    subtitle?: string;
    /** Quantos itens mostrar no grid antes de "Ver todas". Default 6. */
    initialCount?: number;
}

export default function MediaGallery({
    itinerary,
    media: mediaProp,
    title = 'Fotos e Vídeos da Viagem',
    subtitle = 'Registros reais enviados pelo roteirista',
    initialCount = 6,
}: MediaGalleryProps) {
    const allMedia = mediaProp ?? getGalleryMedia(itinerary);
    const [expanded, setExpanded] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const [failed, setFailed] = useState<Set<string>>(new Set());

    const handleError = useCallback((url: string) => {
        setFailed(prev => {
            if (prev.has(url)) return prev;
            const next = new Set(prev);
            next.add(url);
            return next;
        });
    }, []);

    // Filtra mídias quebradas
    const validMedia = allMedia.filter(m => !failed.has(m.url));

    // Esconde a seção quando não há nada
    if (validMedia.length === 0) return null;

    const visibleMedia = expanded ? validMedia : validMedia.slice(0, initialCount);
    const hasMore = !expanded && validMedia.length > initialCount;

    return (
        <View style={styles.section}>
            <View style={styles.header}>
                <Ionicons name="images" size={18} color={theme.colors.primary} />
                <View style={{ flex: 1 }}>
                    <Text style={styles.title}>{title}</Text>
                    {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
                </View>
                <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>{validMedia.length}</Text>
                </View>
            </View>

            <View style={styles.grid}>
                {visibleMedia.map((item, idx) => (
                    <TouchableOpacity
                        key={`${item.url}-${idx}`}
                        style={styles.tile}
                        activeOpacity={0.85}
                        onPress={() => setLightboxIndex(idx)}
                    >
                        {item.type === 'video' ? (
                            <View style={[styles.tileImage, styles.videoTile]}>
                                {Platform.OS === 'web' ? (
                                    // @ts-ignore video tag is available on React Native Web.
                                    <video
                                        src={item.url}
                                        muted
                                        playsInline
                                        preload="metadata"
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                ) : null}
                            </View>
                        ) : (
                            <Image
                                source={{ uri: item.url }}
                                style={styles.tileImage}
                                resizeMode="cover"
                                onError={() => handleError(item.url)}
                            />
                        )}
                        {item.type === 'video' && (
                            <View style={styles.videoOverlay}>
                                <View style={styles.playButton}>
                                    <Ionicons name="play" size={18} color="#fff" />
                                </View>
                            </View>
                        )}
                    </TouchableOpacity>
                ))}
            </View>

            {hasMore && (
                <TouchableOpacity
                    style={styles.expandBtn}
                    onPress={() => setExpanded(true)}
                    activeOpacity={0.85}
                >
                    <Text style={styles.expandText}>
                        Ver todas as {validMedia.length} mídias
                    </Text>
                    <Ionicons name="chevron-down" size={16} color={theme.colors.primary} />
                </TouchableOpacity>
            )}

            {/* Lightbox compartilhado — mesma identidade visual em qualquer
                tela do app (reviews, comunidade, atividades, etc). */}
            {lightboxIndex != null && (
                <MediaLightbox
                    media={validMedia}
                    initialIndex={lightboxIndex}
                    onClose={() => setLightboxIndex(null)}
                    title={title}
                />
            )}
        </View>
    );
}

const TILE_GAP = 8;

const styles = StyleSheet.create({
    section: {
        marginVertical: 16,
        marginHorizontal: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 12,
    },
    title: {
        fontSize: 16,
        fontWeight: '800',
        color: theme.colors.text.primary,
        letterSpacing: -0.2,
    },
    subtitle: {
        fontSize: 12,
        color: theme.colors.text.tertiary,
        marginTop: 2,
    },
    countBadge: {
        backgroundColor: theme.colors.primary + '14',
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 3,
    },
    countBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: theme.colors.primary,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: TILE_GAP,
    },
    // 2 colunas: cada tile ~48.5% (deixa ~3% de gap entre os dois).
    // RN tolera bem aproximação aqui — o gap do container ajusta o resto.
    tile: {
        width: '48.5%',
        aspectRatio: 1,
        borderRadius: 14,
        overflow: 'hidden',
        backgroundColor: theme.colors.surfaceLight,
    },
    tileImage: {
        width: '100%',
        height: '100%',
    },
    videoTile: {
        backgroundColor: '#0f172a',
        alignItems: 'center',
        justifyContent: 'center',
    },
    videoOverlay: {
        position: 'absolute',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.35)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    playButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.55)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.85)',
    },
    expandBtn: {
        marginTop: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: theme.colors.primary + '0E',
        borderWidth: 1,
        borderColor: theme.colors.primary + '22',
    },
    expandText: {
        fontSize: 13,
        fontWeight: '700',
        color: theme.colors.primary,
    },
});
