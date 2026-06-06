/**
 * FileCard — cartão de arquivo da Central da Viagem.
 *
 * Mostra um preview adequado ao tipo do arquivo (thumbnail para imagem,
 * ícone para PDF, overlay de play para vídeo) e a categoria como chip.
 * O toque longo expõe a opção de excluir (mantém a interação primária
 * para "abrir" o arquivo).
 */

import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import type { TravelerFile } from '../../services/tripCenter';

type IconName = keyof typeof Ionicons.glyphMap;

export type FileKind = 'image' | 'pdf' | 'video' | 'other';

export interface FileCardProps {
    file: TravelerFile;
    onPress: () => void;
    onLongPress?: () => void;
    uploading?: boolean;
}

export function kindFromMime(mime?: string | null, url?: string | null): FileKind {
    const m = (mime || '').toLowerCase();
    if (m.startsWith('image/')) return 'image';
    if (m === 'application/pdf') return 'pdf';
    if (m.startsWith('video/')) return 'video';
    const u = (url || '').toLowerCase();
    if (/\.(jpg|jpeg|png|webp|gif|heic|heif)(?:\?|$)/.test(u)) return 'image';
    if (/\.pdf(?:\?|$)/.test(u)) return 'pdf';
    if (/\.(mp4|mov|webm)(?:\?|$)/.test(u)) return 'video';
    return 'other';
}

function iconForKind(kind: FileKind): IconName {
    switch (kind) {
        case 'pdf': return 'document-text';
        case 'video': return 'videocam';
        case 'image': return 'image';
        default: return 'document';
    }
}

export default function FileCard({ file, onPress, onLongPress, uploading }: FileCardProps) {
    const kind = kindFromMime(file.mimeType, file.url);
    const showThumb = kind === 'image' && !!file.url;

    return (
        <TouchableOpacity
            style={styles.card}
            onPress={onPress}
            onLongPress={onLongPress}
            activeOpacity={0.85}
            disabled={uploading}
        >
            <View style={styles.thumb}>
                {showThumb ? (
                    <Image source={{ uri: file.url }} style={styles.thumbImage} resizeMode="cover" />
                ) : (
                    <View style={styles.thumbIconWrap}>
                        <Ionicons name={iconForKind(kind)} size={36} color={theme.colors.primary} />
                    </View>
                )}
                {kind === 'video' && (
                    <View style={styles.playOverlay}>
                        <Ionicons name="play" size={20} color="#fff" />
                    </View>
                )}
                {uploading && (
                    <View style={styles.uploadingOverlay}>
                        <Text style={styles.uploadingText}>Enviando…</Text>
                    </View>
                )}
            </View>
            <View style={styles.meta}>
                <Text style={styles.title} numberOfLines={2}>{file.title}</Text>
                <View style={styles.categoryChip}>
                    <Text style={styles.categoryLabel} numberOfLines={1}>{file.category}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        ...theme.shadows.small,
    },
    thumb: {
        width: '100%',
        aspectRatio: 1.2,
        backgroundColor: theme.colors.surfaceLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    thumbImage: {
        width: '100%',
        height: '100%',
    },
    thumbIconWrap: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
    },
    playOverlay: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginLeft: -18,
        marginTop: -18,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(26,50,99,0.85)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    uploadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(26,50,99,0.6)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    uploadingText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    meta: {
        padding: 10,
        gap: 6,
    },
    title: {
        fontSize: 13,
        fontWeight: '700',
        color: theme.colors.text.primary,
        lineHeight: 17,
    },
    categoryChip: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 999,
        backgroundColor: theme.colors.glass.primary,
    },
    categoryLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: theme.colors.primaryDark,
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
});
