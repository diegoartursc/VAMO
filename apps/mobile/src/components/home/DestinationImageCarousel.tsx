import React, { useEffect, useRef, useState } from 'react';
import { View, Image, Animated, StyleSheet, type ImageStyle } from 'react-native';

interface DestinationImageCarouselProps {
    images: string[];
    style?: ImageStyle;
    interval?: number; // ms between transitions
}

/**
 * Crossfade carousel for destination cards.
 * Pre-loads the next image before transitioning.
 * Falls back gracefully if fewer than 2 images.
 */
export function DestinationImageCarousel({
    images,
    style,
    interval = 4000,
}: DestinationImageCarouselProps) {
    const validImages = images.filter(Boolean);
    const [currentIndex, setCurrentIndex] = useState(0);
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const nextFadeAnim = useRef(new Animated.Value(0)).current;

    // Single image — no animation needed
    if (validImages.length <= 1) {
        return (
            <Image
                source={{ uri: validImages[0] || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800' }}
                style={[StyleSheet.absoluteFillObject, style]}
                resizeMode="cover"
            />
        );
    }

    const nextIndex = (currentIndex + 1) % validImages.length;

    useEffect(() => {
        // Prefetch the upcoming image
        Image.prefetch(validImages[nextIndex]).catch(() => {});

        const timer = setInterval(() => {
            // Crossfade: current out, next in
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(nextFadeAnim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                // Snap: make next the current
                setCurrentIndex(prev => (prev + 1) % validImages.length);
                fadeAnim.setValue(1);
                nextFadeAnim.setValue(0);
            });
        }, interval);

        return () => clearInterval(timer);
    }, [currentIndex, validImages.length]);

    return (
        <View style={StyleSheet.absoluteFillObject}>
            {/* Current image */}
            <Animated.Image
                source={{ uri: validImages[currentIndex] }}
                style={[StyleSheet.absoluteFillObject, style, { opacity: fadeAnim }]}
                resizeMode="cover"
            />
            {/* Next image (fading in underneath) */}
            <Animated.Image
                source={{ uri: validImages[nextIndex] }}
                style={[StyleSheet.absoluteFillObject, style, { opacity: nextFadeAnim }]}
                resizeMode="cover"
            />
        </View>
    );
}
