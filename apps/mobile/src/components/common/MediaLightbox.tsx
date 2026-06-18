/**
 * MediaLightbox — visualizador global de mídia (imagem + vídeo).
 *
 * Extraído do `MediaGallery` original para que QUALQUER tela (reviews,
 * comunidade, atividades, central da viagem) possa abrir mídia em modo
 * ampliado com a mesma identidade visual.
 *
 * Comportamento:
 *  - Modal full-screen com FlatList horizontal pagingEnabled.
 *  - Swipe entre itens. Contador "n / total" no topo. Botão fechar (X).
 *  - Imagem: <Image resizeMode="contain"> (web: objectFit:contain).
 *  - Vídeo: <video controls> no web; no nativo, placeholder com botão
 *    "Toque para abrir" que dispara Linking.openURL.
 *  - `onError` por item: itens que falham são silenciados na thumbnail
 *    (responsabilidade do caller); aqui assumimos URLs já válidas.
 *
 * O componente NÃO consome dados privados — apenas renderiza URLs que a
 * tela chamadora já tinha em memória. Privacidade segue do upstream
 * (URLs assinadas / storage gates).
 */

import React, { useCallback, useState } from 'react';
import {
    Dimensions,
    FlatList,
    Image,
    Linking,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/** Tipo aceito pelo lightbox; campos extras são permitidos e ignorados. */
export interface LightboxMediaItem {
    url: string;
    /** Quando ausente, detecta por extensão (imagens por default). */
    type?: 'image' | 'video';
    /** Legenda opcional — exibida embaixo do contador. */
    caption?: string;
    /** Texto alternativo para a11y. */
    alt?: string;
}

export interface MediaLightboxProps {
    /** Lista de mídias na ordem de exibição. */
    media: LightboxMediaItem[];
    /** Índice inicial; clamp [0, media.length-1]. */
    initialIndex: number;
    /** Fechar o lightbox. */
    onClose: () => void;
    /** Título no topo (opcional) — ex.: "Avaliação de João". */
    title?: string;
}

const VIDEO_EXT = /\.(mp4|mov|webm|m4v)(\?|$)/i;

function inferType(item: LightboxMediaItem): 'image' | 'video' {
    if (item.type) return item.type;
    return VIDEO_EXT.test(item.url) ? 'video' : 'image';
}

export default function MediaLightbox({
    media,
    initialIndex,
    onClose,
    title,
}: MediaLightboxProps) {
    const { width, height } = Dimensions.get('window');
    const safeInitial = Math.max(0, Math.min(initialIndex, media.length - 1));
    const [index, setIndex] = useState(safeInitial);

    const onScroll = useCallback(
        (e: any) => {
            const x = e.nativeEvent.contentOffset.x;
            const i = Math.round(x / width);
            if (i !== index && i >= 0 && i < media.length) setIndex(i);
        },
        [index, media.length, width],
    );

    const current = media[index];
    const webImageStyle = Platform.OS === 'web' ? { objectFit: 'contain' as any } : {};

    return (
        <Modal visible animationType="fade" onRequestClose={onClose} statusBarTranslucent>
            <View style={styles.lightbox}>
                <FlatList
                    data={media}
                    horizontal
                    pagingEnabled
                    initialScrollIndex={safeInitial}
                    getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
                    onMomentumScrollEnd={onScroll}
                    keyExtractor={(item, i) => `${item.url}-${i}`}
                    showsHorizontalScrollIndicator={false}
                    renderItem={({ item }) => {
                        const type = inferType(item);
                        return (
                            <View style={{ width, height, justifyContent: 'center', alignItems: 'center' }}>
                                {type === 'image' ? (
                                    <Image
                                        source={{ uri: item.url }}
                                        accessibilityLabel={item.alt}
                                        style={[{ width, height: height * 0.85 }, webImageStyle]}
                                        resizeMode="contain"
                                    />
                                ) : Platform.OS === 'web' ? (
                                    // @ts-ignore video tag está disponível no React Native Web.
                                    <video
                                        src={item.url}
                                        controls
                                        playsInline
                                        style={{ width: '100%', maxHeight: height * 0.75, objectFit: 'contain' }}
                                    />
                                ) : (
                                    <TouchableOpacity
                                        style={styles.videoPlaceholder}
                                        activeOpacity={0.85}
                                        onPress={() => Linking.openURL(item.url).catch(() => undefined)}
                                    >
                                        <Ionicons name="play-circle" size={64} color="rgba(255,255,255,0.85)" />
                                        <Text style={styles.videoPlaceholderText}>Vídeo</Text>
                                        <Text style={styles.videoPlaceholderHint}>Toque para abrir</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        );
                    }}
                />

                <TouchableOpacity
                    style={styles.closeBtn}
                    onPress={onClose}
                    accessibilityLabel="Fechar"
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <Ionicons name="close" size={28} color="#fff" />
                </TouchableOpacity>

                <View style={styles.topMeta} pointerEvents="none">
                    {title ? <Text style={styles.topMetaTitle} numberOfLines={1}>{title}</Text> : null}
                    {media.length > 1 ? (
                        <Text style={styles.topMetaCounter}>
                            {index + 1} / {media.length}
                        </Text>
                    ) : null}
                </View>

                {current?.caption ? (
                    <View style={styles.caption} pointerEvents="none">
                        <Text style={styles.captionText} numberOfLines={3}>
                            {current.caption}
                        </Text>
                    </View>
                ) : null}
            </View>
        </Modal>
    );
}

/**
 * Hook utilitário — encapsula o state do lightbox para uso ergonômico:
 *
 *   const lightbox = useMediaLightbox();
 *   <TouchableOpacity onPress={() => lightbox.open(items, 2, 'Título')}>
 *     <Image ... />
 *   </TouchableOpacity>
 *   {lightbox.element}
 */
export function useMediaLightbox() {
    const [state, setState] = useState<{
        media: LightboxMediaItem[];
        index: number;
        title?: string;
    } | null>(null);

    const open = useCallback(
        (media: LightboxMediaItem[], index = 0, title?: string) => {
            if (!media || media.length === 0) return;
            setState({ media, index, title });
        },
        [],
    );

    const close = useCallback(() => setState(null), []);

    const element = state ? (
        <MediaLightbox
            media={state.media}
            initialIndex={state.index}
            onClose={close}
            title={state.title}
        />
    ) : null;

    return { open, close, element, isOpen: state !== null };
}

const styles = StyleSheet.create({
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
    topMeta: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 32,
        alignSelf: 'center',
        backgroundColor: 'rgba(0,0,0,0.55)',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 14,
        maxWidth: '70%',
        alignItems: 'center',
    },
    topMetaTitle: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    topMetaCounter: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
        marginTop: 2,
    },
    caption: {
        position: 'absolute',
        bottom: 32,
        left: 16,
        right: 16,
        backgroundColor: 'rgba(0,0,0,0.55)',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
    },
    captionText: {
        color: '#fff',
        fontSize: 13,
        lineHeight: 18,
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
