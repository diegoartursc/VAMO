import React, { ReactNode } from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { theme } from '../../theme/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PressableCardProps {
    children: ReactNode;
    onPress?: () => void;
    style?: ViewStyle;
    shadowLevel?: 'xs' | 'small' | 'medium' | 'large' | 'elevated';
}

export function PressableCard({
    children,
    onPress,
    style,
    shadowLevel = 'small',
}: PressableCardProps) {
    const scale = useSharedValue(1);
    const opacity = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    const handlePressIn = () => {
        scale.value = withTiming(0.98, { duration: 150 });
        opacity.value = withTiming(0.95, { duration: 150 });
    };

    const handlePressOut = () => {
        scale.value = withSpring(1, {
            damping: 15,
            stiffness: 150,
        });
        opacity.value = withTiming(1, { duration: 200 });
    };

    return (
        <AnimatedPressable
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={[
                styles.container,
                theme.shadows[shadowLevel],
                style,
                animatedStyle,
            ]}
        >
            {children}
        </AnimatedPressable>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: theme.colors.background,
        borderRadius: theme.borderRadius.lg,
        overflow: 'hidden',
    },
});
