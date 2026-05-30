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
    View, Text, StyleSheet, TouchableOpacity, Image, Modal,
    FlatList, Dimensions, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { getGalleryMedia, type MediaItem } from '../../utils/itineraryMedia';

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
                        <Image
                            source={{ uri: item.url }}
                            style={styles.tileImage}
                            resizeMode="cover"
                            onError={() => handleError(item.url)}
                        />
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

            {/* Lightbox */}
            {lightboxIndex != null && (
                <Lightbox
                    media={validMedia}
                    initialIndex={lightboxIndex}
                    onClose={() => setLightboxIndex(null)}
                />
            )}
        </View>
    );
}

// ─────────────────────────────────────────────────────────────────────
// Lightbox modal
// ─────────────────────────────────────────────────────────────────────

function Lightbox({
    media,
    initialIndex,
    onClose,
}: {
    media: MediaItem[];
    initialIndex: number;
    onClose: () => void;
}) {
    const { width, height } = Dimensions.get('window');
    const [index, setIndex] = useState(initialIndex);

    const onScroll = useCallback((e: any) => {
        const x = e.nativeEvent.contentOffset.x;
        const i = Math.round(x / width);
        if (i !== index && i >= 0 && i < media.length) setIndex(i);
    }, [index, media.length, width]);

    const webImageStyle = Platform.OS === 'web' ? { objectFit: 'contain' as any } : {};

    return (
        <Modal visible animationType="fade" onRequestClose={onClose} statusBarTranslucent>
            <View style={styles.lightbox}>
                <FlatList
                    data={media}
                    horizontal
                    pagingEnabled
                    initialScrollIndex={initialIndex}
                    getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
                    onMomentumScrollEnd={onScroll}
                    keyExtractor={(item, i) => `${item.url}-${i}`}
                    showsHorizontalScrollIndicator={false}
                    renderItem={({ item }) => (
                        <View style={{ width, height, justifyContent: 'center', alignItems: 'center' }}>
                            {item.type === 'image' ? (
                                <Image
                                    source={{ uri: item.url }}
                                    style={[{ width, height: height * 0.85 }, webImageStyle]}
                                    resizeMode="contain"
                                />
                            ) : (
                                // Vídeo: por enquanto exibimos placeholder com link externo.
                                // Player real fica para iteração futura (expo-av).
                                <View style={styles.videoPlaceholder}>
                                    <Ionicons name="play-circle" size={64} color="rgba(255,255,255,0.85)" />
                                    <Text style={styles.videoPlaceholderText}>Vídeo enviado pelo criador</Text>
                                    <Text style={styles.videoPlaceholderHint}>
                                        Toque novamente para abrir
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}
                />

                <TouchableOpacity style={styles.closeBtn} onPress={onClose} accessibilityLabel="Fechar">
                    <Ionicons name="close" size={28} color="#fff" />
                </TouchableOpacity>

                <View style={styles.lightboxCounter}>
                    <Text style={styles.lightboxCounterText}>
                        {index + 1} / {media.length}
                    </Text>
                </View>
            </View>
        </Modal>
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
    lightbox: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
    },
    closeBtn: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 56 : 28,
        right: 16,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.55)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    lightboxCounter: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 32,
        alignSelf: 'center',
        backgroundColor: 'rgba(0,0,0,0.55)',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 14,
    },
    lightboxCounterText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },
    videoPlaceholder: {
        alignItems: 'center',
        gap: 10,
    },
    videoPlaceholderText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#fff',
    },
    videoPlaceholderHint: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.7)',
    },
});
