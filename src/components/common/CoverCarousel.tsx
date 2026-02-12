import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import {
    View,
    Image,
    FlatList,
    StyleSheet,
    Dimensions,
    ViewToken,
    ActivityIndicator,
} from 'react-native';
import { theme } from '../../theme/theme';
import { prefetchImages } from '../../utils/imageCache';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
    const [activeIndex, setActiveIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);
    const containerWidth = width || SCREEN_WIDTH;
    const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const currentIndexRef = useRef(0);
    const isTouchingRef = useRef(false);

    // Prefetch all images on mount
    useEffect(() => {
        if (images?.length > 0) {
            prefetchImages(images);
        }
    }, [images]);

    // Auto-play: advance every 3 seconds with smooth scroll
    useEffect(() => {
        if (!images || images.length <= 1) return;

        autoPlayRef.current = setInterval(() => {
            if (isTouchingRef.current) return;

            const nextIndex = (currentIndexRef.current + 1) % images.length;
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
    }, [images, containerWidth]);

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

    const renderItem = useCallback(
        ({ item }: { item: string }) => (
            <View style={{ width: containerWidth, height }}>
                <Image
                    source={{ uri: item }}
                    style={[styles.image, { height }]}
                    resizeMode="cover"
                    defaultSource={undefined}
                />
            </View>
        ),
        [containerWidth, height]
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

    if (!images || images.length === 0) {
        return (
            <View style={[styles.placeholder, { height, borderRadius }]}>
                <ActivityIndicator color={theme.colors.primary} />
            </View>
        );
    }

    // Single image — no carousel needed
    if (images.length === 1) {
        return (
            <View style={[{ height, borderRadius, overflow: 'hidden' }]}>
                <Image
                    source={{ uri: images[0] }}
                    style={[styles.image, { height }]}
                    resizeMode="cover"
                />
            </View>
        );
    }

    return (
        <View style={[styles.container, { height, borderRadius, overflow: 'hidden' }]}>
            <FlatList
                ref={flatListRef}
                data={images}
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
                        <CounterText current={activeIndex + 1} total={images.length} />
                    </View>
                </View>
            </View>

            {/* Pagination Dots */}
            {images.length <= 6 && (
                <View style={styles.dotsContainer}>
                    {images.map((_, idx) => (
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
        backgroundColor: theme.colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
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
