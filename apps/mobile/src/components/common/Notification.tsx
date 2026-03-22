import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, Pressable, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    runOnJS,
} from 'react-native-reanimated';
import { theme } from '../../theme/theme';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export type NotificationType = 'success' | 'info' | 'warning' | 'error' | 'booking';

export interface NotificationProps {
    id: string;
    type: NotificationType;
    title: string;
    message?: string;
    timer?: string;
    image?: any;
    actionLabel?: string;
    onAction?: () => void;
    onDismiss?: () => void;
    duration?: number;
    offset?: number;
}

const getIconName = (type: NotificationType): keyof typeof Ionicons.glyphMap => {
    switch (type) {
        case 'success':
            return 'checkmark-circle';
        case 'error':
            return 'close-circle';
        case 'warning':
            return 'warning';
        case 'booking':
            return 'calendar';
        default:
            return 'information-circle';
    }
};

const getIconColor = (type: NotificationType): string => {
    switch (type) {
        case 'success':
            return theme.colors.success;
        case 'error':
            return theme.colors.error;
        case 'warning':
            return theme.colors.warning;
        case 'booking':
            return theme.colors.accent;
        default:
            return theme.colors.info;
    }
};

export const Notification: React.FC<NotificationProps> = ({
    id,
    type,
    title,
    message,
    timer,
    image,
    actionLabel,
    onAction,
    onDismiss,
    duration = 5000,
    offset = 0,
}) => {
    const translateY = useSharedValue(200);
    const opacity = useSharedValue(0);

    useEffect(() => {
        // Entrada
        translateY.value = withSpring(0, {
            damping: 20,
            stiffness: 90,
        });
        opacity.value = withTiming(1, { duration: 300 });

        // Auto-dismiss
        const timer = setTimeout(() => {
            handleDismiss();
        }, duration);

        return () => clearTimeout(timer);
    }, []);

    const handleDismiss = () => {
        translateY.value = withSpring(200, {
            damping: 20,
            stiffness: 90,
        });
        opacity.value = withTiming(0, { duration: 200 }, (finished) => {
            if (finished && onDismiss) {
                runOnJS(onDismiss)();
            }
        });
    };

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
        opacity: opacity.value,
    }));

    const iconName = getIconName(type);
    const iconColor = getIconColor(type);

    return (
        <Animated.View
            style={[
                styles.container,
                { bottom: theme.spacing.lg + offset },
                animatedStyle,
            ]}
        >
            <View style={styles.card}>
                {/* Header com ícone e timer */}
                <View style={styles.header}>
                    <View style={[styles.iconContainer, { backgroundColor: iconColor }]}>
                        <Ionicons name={iconName} size={20} color="#FFFFFF" />
                        {timer && (
                            <View style={styles.timerBadge}>
                                <Text style={styles.timerText}>{timer}</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.textContainer}>
                        <Text style={styles.title} numberOfLines={2}>
                            {title}
                        </Text>
                        {message && (
                            <Text style={styles.message} numberOfLines={1}>
                                {message}
                            </Text>
                        )}
                    </View>

                    {image && (
                        <Image source={image} style={styles.previewImage} resizeMode="cover" />
                    )}
                </View>

                {/* Botão de ação */}
                {actionLabel && onAction && (
                    <Pressable
                        style={({ pressed }) => [
                            styles.actionButton,
                            pressed && styles.actionButtonPressed,
                        ]}
                        onPress={onAction}
                    >
                        <Ionicons name="cart-outline" size={18} color="#FFFFFF" />
                        <Text style={styles.actionText}>{actionLabel}</Text>
                    </Pressable>
                )}

                {/* Botão de dismiss discreto */}
                <Pressable
                    style={styles.dismissButton}
                    onPress={handleDismiss}
                    hitSlop={8}
                >
                    <Ionicons name="close" size={20} color={theme.colors.text.secondary} />
                </Pressable>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: theme.spacing.md,
        right: theme.spacing.md,
        zIndex: 9999,
    },
    card: {
        backgroundColor: 'rgba(30, 30, 35, 0.96)',
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.md,
        ...theme.shadows.elevated,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    timerBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: theme.colors.error,
        borderRadius: theme.borderRadius.sm,
        paddingHorizontal: 6,
        paddingVertical: 2,
        minWidth: 32,
        alignItems: 'center',
    },
    timerText: {
        fontSize: theme.typography.sizes.tiny,
        fontWeight: theme.typography.weights.bold,
        color: '#FFFFFF',
    },
    textContainer: {
        flex: 1,
        gap: 2,
    },
    title: {
        fontSize: theme.typography.sizes.body,
        fontWeight: theme.typography.weights.semibold,
        color: '#FFFFFF',
        lineHeight: theme.typography.sizes.body * theme.typography.lineHeights.tight,
    },
    message: {
        fontSize: theme.typography.sizes.caption,
        color: 'rgba(255, 255, 255, 0.7)',
    },
    previewImage: {
        width: 56,
        height: 56,
        borderRadius: theme.borderRadius.sm,
    },
    actionButton: {
        marginTop: theme.spacing.sm,
        backgroundColor: theme.colors.secondaryDark,
        borderRadius: theme.borderRadius.md,
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.xs,
    },
    actionButtonPressed: {
        backgroundColor: theme.colors.secondary,
    },
    actionText: {
        fontSize: theme.typography.sizes.body,
        fontWeight: theme.typography.weights.semibold,
        color: '#FFFFFF',
    },
    dismissButton: {
        position: 'absolute',
        top: theme.spacing.xs,
        right: theme.spacing.xs,
        padding: theme.spacing.xxs,
    },
});
