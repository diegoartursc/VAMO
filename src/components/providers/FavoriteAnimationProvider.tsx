import React, { createContext, useContext, useState, useRef } from 'react';
import { Animated, StyleSheet, View, Text } from 'react-native';
import { theme } from '../../theme/theme';

interface FavoriteAnimationContextType {
    showAnimation: (x: number, y: number) => void;
}

const FavoriteAnimationContext = createContext<FavoriteAnimationContextType | null>(null);

export function useFavoriteAnimation() {
    const context = useContext(FavoriteAnimationContext);
    if (!context) {
        throw new Error('useFavoriteAnimation must be used within FavoriteAnimationProvider');
    }
    return context;
}

export function FavoriteAnimationProvider({ children }: { children: React.ReactNode }) {
    const [animations, setAnimations] = useState<{ id: number; x: number; y: number }[]>([]);
    const animationId = useRef(0);

    const showAnimation = (x: number, y: number) => {
        const id = animationId.current++;
        setAnimations((prev) => [...prev, { id, x, y }]);

        // Remove animation after 2 seconds
        setTimeout(() => {
            setAnimations((prev) => prev.filter((anim) => anim.id !== id));
        }, 2000);
    };

    return (
        <FavoriteAnimationContext.Provider value={{ showAnimation }}>
            {children}
            <View style={styles.animationContainer} pointerEvents="none">
                {animations.map((anim) => (
                    <FavoriteAnimation key={anim.id} x={anim.x} y={anim.y} />
                ))}
            </View>
        </FavoriteAnimationContext.Provider>
    );
}

function FavoriteAnimation({ x, y }: { x: number; y: number }) {
    const translateY = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(1)).current;
    const scale = useRef(new Animated.Value(1)).current;

    React.useEffect(() => {
        // Start animations
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: -100,
                duration: 1500,
                useNativeDriver: true,
            }),
            Animated.sequence([
                Animated.timing(scale, {
                    toValue: 1.5,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(scale, {
                    toValue: 1.2,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]),
            Animated.timing(opacity, {
                toValue: 0,
                duration: 1500,
                delay: 500,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    return (
        <Animated.View
            style={[
                styles.animation,
                {
                    left: x - 20,
                    top: y - 20,
                    opacity,
                    transform: [{ translateY }, { scale }],
                },
            ]}
        >
            <Text style={styles.heart}>❤️</Text>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    animationContainer: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 9999,
    },
    animation: {
        position: 'absolute',
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    heart: {
        fontSize: 32,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
});
