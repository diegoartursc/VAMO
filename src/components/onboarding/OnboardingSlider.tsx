import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, FlatList, TouchableOpacity, Animated } from 'react-native';
import { theme } from '../../theme/theme';

const { width } = Dimensions.get('window');

interface OnboardingSlide {
    icon: string;
    title: string;
    description: string;
}

const SLIDES: OnboardingSlide[] = [
    {
        icon: '🔍',
        title: '1. Escolha',
        description: 'Navegue pelos pacotes verificados'
    },
    {
        icon: '💳',
        title: '2. Pague',
        description: 'Pagamento seguro em até 12x'
    },
    {
        icon: '✈️',
        title: '3. Viaje',
        description: 'Tudo organizado, só curtir!'
    }
];

interface OnboardingSliderProps {
    onComplete: () => void;
}

export function OnboardingSlider({ onComplete }: OnboardingSliderProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);
    const scrollX = useRef(new Animated.Value(0)).current;

    const handleNext = () => {
        if (currentIndex < SLIDES.length - 1) {
            const nextIndex = currentIndex + 1;
            flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
            setCurrentIndex(nextIndex);
        } else {
            onComplete();
        }
    };

    const handleSkip = () => {
        onComplete();
    };

    const renderSlide = ({ item }: { item: OnboardingSlide }) => (
        <View style={styles.slide}>
            <Text style={styles.slideIcon}>{item.icon}</Text>
            <Text style={styles.slideTitle}>{item.title}</Text>
            <Text style={styles.slideDescription}>{item.description}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                <Text style={styles.skipText}>Pular</Text>
            </TouchableOpacity>

            <FlatList
                ref={flatListRef}
                data={SLIDES}
                renderItem={renderSlide}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                    { useNativeDriver: false }
                )}
                onMomentumScrollEnd={(event) => {
                    const index = Math.round(event.nativeEvent.contentOffset.x / width);
                    setCurrentIndex(index);
                }}
                keyExtractor={(_, index) => index.toString()}
            />

            {/* Pagination Dots */}
            <View style={styles.pagination}>
                {SLIDES.map((_, index) => {
                    const inputRange = [
                        (index - 1) * width,
                        index * width,
                        (index + 1) * width,
                    ];

                    const dotWidth = scrollX.interpolate({
                        inputRange,
                        outputRange: [8, 24, 8],
                        extrapolate: 'clamp',
                    });

                    const opacity = scrollX.interpolate({
                        inputRange,
                        outputRange: [0.3, 1, 0.3],
                        extrapolate: 'clamp',
                    });

                    return (
                        <Animated.View
                            key={index}
                            style={[
                                styles.dot,
                                { width: dotWidth, opacity },
                            ]}
                        />
                    );
                })}
            </View>

            {/* Action Buttons */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                    <Text style={styles.nextButtonText}>
                        {currentIndex === SLIDES.length - 1 ? 'Começar' : 'Próximo'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    skipButton: {
        position: 'absolute',
        top: 50,
        right: theme.spacing.md,
        zIndex: 10,
        padding: theme.spacing.sm,
    },
    skipText: {
        fontSize: 16,
        color: theme.colors.text.secondary,
        fontWeight: '600',
    },
    slide: {
        width,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: theme.spacing.xl,
        paddingTop: 100,
    },
    slideIcon: {
        fontSize: 80,
        marginBottom: theme.spacing.xl,
    },
    slideTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.md,
        textAlign: 'center',
    },
    slideDescription: {
        fontSize: 16,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        lineHeight: 24,
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        marginBottom: theme.spacing.xl,
    },
    dot: {
        height: 8,
        borderRadius: 4,
        backgroundColor: theme.colors.primary,
    },
    footer: {
        paddingHorizontal: theme.spacing.xl,
        paddingBottom: 40,
    },
    nextButton: {
        backgroundColor: theme.colors.primary,
        paddingVertical: 16,
        borderRadius: theme.borderRadius.full,
        alignItems: 'center',
        ...theme.shadows.button,
    },
    nextButtonText: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.text.inverse,
    },
});
