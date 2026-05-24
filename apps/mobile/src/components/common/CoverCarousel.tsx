import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import {
    View,
    Image,
    FlatList,
    StyleSheet,
    Text,
    useWindowDimensions,
    ViewToken,
    Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { prefetchImages } from '../../utils/imageCache';

interface CoverCarouselProps {
    images: string[];
    height?: number;
    borderRadius?: number;
    width?: number;
}

/**
 * CoverCarousel — swipeable image carousel with photo counter badge.
 * Uses FlatList for optimal performance (lazy rendering, recycling).
 * Prefetches all images on mount for smooth offline experience.
 */
const CoverCarouselInner = ({
    images,
    height = 200,
    borderRadius = 0,
    width,
}: CoverCarouselProps) => {
    const { width: windowWidth } = useWindowDimensions();
    const [activeIndex, setActiveIndex] = useState(0);
    const [failedUrls, setFailedUrls] = useState<Set<string>>(new Set());
    const flatListRef = useRef<FlatList>(null);
    const containerWidth = width || windowWidth;
    const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const currentIndexRef = useRef(0);
    const isTouchingRef = useRef(false);

    // Filtra URLs vazias e que já falharam — assim quebradas somem em vez
    // de mostrar área cinza eterna.
    const validImages = (images || []).filter(
        (u): u is string => typeof u === 'string' && u.length > 0 && !failedUrls.has(u),
    );

    const handleImageError = useCallback((url: string) => {
        setFailedUrls(prev => {
            if (prev.has(url)) return prev;
            const next = new Set(prev);
            next.add(url);
            return next;
        });
    }, []);

    // Prefetch all images on mount
    useEffect(() => {
        if (validImages.length > 0) {
            prefetchImages(validImages);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [images]);

    // Auto-play: advance every 3 seconds with smooth scroll
    useEffect(() => {
        if (validImages.length <= 1) return;

        autoPlayRef.current = setInterval(() => {
            if (isTouchingRef.current) return;

            const nextIndex = (currentIndexRef.current + 1) % validImages.length;
            currentIndexRef.current = nextIndex;
            setActiveIndex(nextIndex);

            flatListRef.current?.scrollToOffset({
                offset: nextIndex * containerWidth,
                animated: true,
            });
        }, 3000);

        return () => {
            if (autoPlayRef.current) clearInterval(autoPlayRef.current);
        };
    }, [validImages.length, containerWidth]);

    const onViewableItemsChanged = useRef(
        ({ viewableItems }: { viewableItems: ViewToken[] }) => {
            if (viewableItems.length > 0 && viewableItems[0].index != null) {
                const idx = viewableItems[0].index;
                currentIndexRef.current = idx;
                setActiveIndex(idx);
            }
        }
    ).current;

    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 50,
    }).current;

    // Pause auto-play on touch, resume on release
    const handleTouchStart = useCallback(() => {
        isTouchingRef.current = true;
    }, []);

    const handleTouchEnd = useCallback(() => {
        isTouchingRef.current = false;
    }, []);

    const webImageStyle = Platform.OS === 'web' ? { objectFit: 'cover' as any } : {};

    const renderItem = useCallback(
        ({ item }: { item: string }) => (
            <View style={{ width: containerWidth, height }}>
                <Image
                    source={{ uri: item }}
                    style={[styles.image, { height }, webImageStyle]}
                    resizeMode="cover"
                    defaultSource={undefined}
                    onError={() => handleImageError(item)}
                />
            </View>
        ),
        [containerWidth, height, handleImageError, webImageStyle]
    );

    const keyExtractor = useCallback(
        (item: string, index: number) => `${item}-${index}`,
        []
    );

    const getItemLayout = useCallback(
        (_: any, index: number) => ({
            length: containerWidth,
            offset: containerWidth * index,
            index,
        }),
        [containerWidth]
    );

    // Fallback elegante quando NÃO há imagens (ou todas falharam). Antes
    // exibia ActivityIndicator eterno; agora mostra gradiente VAMO com
    // ícone — visualmente claro e sem spinner infinito.
    if (validImages.length === 0) {
        return (
            <LinearGradient
                colors={['#1A3263', '#28C9BF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.placeholder, { height, borderRadius }]}
            >
                <Ionicons name="images-outline" size={36} color="rgba(255,255,255,0.6)" />
                <Text style={styles.placeholderText}>Imagem indisponível</Text>
            </LinearGradient>
        );
    }

    // Single image — no carousel needed
    if (validImages.length === 1) {
        return (
            <View style={[{ height, borderRadius, overflow: 'hidden' }]}>
                <Image
                    source={{ uri: validImages[0] }}
                    style={[styles.image, { height }, webImageStyle]}
                    resizeMode="cover"
                    onError={() => handleImageError(validImages[0])}
                />
            </View>
        );
    }

    return (
        <View style={[styles.container, { height, borderRadius, overflow: 'hidden' }]}>
            <FlatList
                ref={flatListRef}
                data={validImages}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                getItemLayout={getItemLayout}
                initialNumToRender={1}
                maxToRenderPerBatch={2}
                windowSize={3}
                removeClippedSubviews
                bounces={false}
                decelerationRate="fast"
                snapToInterval={containerWidth}
                snapToAlignment="start"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            />

            {/* Photo Counter Badge */}
            <View style={styles.counterBadge}>
                <View style={styles.counterInner}>
                    <Image
                        source={{ uri: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgZmlsbD0id2hpdGUiIHZpZXdCb3g9IjAgMCAxNiAxNiI+PHBhdGggZD0iTTEwLjUgOC41YTIuNSAyLjUgMCAxIDEtNSAwIDIuNSAyLjUgMCAwIDEgNSAweiIvPjxwYXRoIGQ9Ik0yIDRhMiAyIDAgMCAwLTIgMnY2YTIgMiAwIDAgMCAyIDJoMTJhMiAyIDAgMCAwIDItMlY2YTIgMiAwIDAgMC0yLTJoLTEuMTcyYTIgMiAwIDAgMS0xLjQxNC0uNTg2bC0uODI4LS44MjhBMiAyIDAgMCAwIDkuMTcyIDJINi44MjhhMiAyIDAgMCAwLTEuNDE0LjU4NmwtLjgyOC44MjhBMiAyIDAgMCAxIDMuMTcyIDRIMnoiLz48L3N2Zz4=' }}
                        style={styles.cameraIcon}
                    />
                    <View style={styles.counterTextContainer}>
                        <CounterText current={activeIndex + 1} total={validImages.length} />
                    </View>
                </View>
            </View>

            {/* Pagination Dots */}
            {validImages.length <= 6 && (
                <View style={styles.dotsContainer}>
                    {validImages.map((_, idx) => (
                        <View
                            key={idx}
                            style={[
                                styles.dot,
                                idx === activeIndex ? styles.dotActive : styles.dotInactive,
                            ]}
                        />
                    ))}
                </View>
            )}
        </View>
    );
};

// Memoized counter text to avoid re-renders
const CounterText = memo(({ current, total }: { current: number; total: number }) => {
    const Text = require('react-native').Text;
    return (
        <Text style={styles.counterText}>
            {current}/{total}
        </Text>
    );
});

export const CoverCarousel = memo(CoverCarouselInner);

const styles = StyleSheet.create({
    container: {
        position: 'relative',
    },
    image: {
        width: '100%',
    },
    placeholder: {
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    placeholderText: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.85)',
        fontWeight: '600',
        letterSpacing: 0.3,
    },
    counterBadge: {
        position: 'absolute',
        bottom: 10,
        right: 10,
    },
    counterInner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 14,
        gap: 5,
    },
    cameraIcon: {
        width: 14,
        height: 14,
        tintColor: '#FFFFFF',
    },
    counterTextContainer: {
        justifyContent: 'center',
    },
    counterText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '600',
    },
    dotsContainer: {
        position: 'absolute',
        bottom: 10,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 5,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    dotActive: {
        backgroundColor: '#FFFFFF',
        width: 18,
        borderRadius: 4,
    },
    dotInactive: {
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
    },
});
