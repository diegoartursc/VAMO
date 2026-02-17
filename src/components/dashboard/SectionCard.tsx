import React, { useState, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Animated, LayoutAnimation,
    Platform, UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';

if (Platform.OS === 'android') {
    UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

interface SectionCardProps {
    title: string;
    icon: string;
    children: React.ReactNode;
    defaultExpanded?: boolean;
    completionStatus?: 'complete' | 'partial' | 'empty';
    completionLabel?: string;
}

export default function SectionCard({
    title,
    icon,
    children,
    defaultExpanded = false,
    completionStatus = 'empty',
    completionLabel,
}: SectionCardProps) {
    const [expanded, setExpanded] = useState(defaultExpanded);
    const rotateAnim = useRef(new Animated.Value(defaultExpanded ? 1 : 0)).current;

    const toggle = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        Animated.timing(rotateAnim, {
            toValue: expanded ? 0 : 1,
            duration: 200,
            useNativeDriver: true,
        }).start();
        setExpanded(!expanded);
    };

    const rotate = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '180deg'],
    });

    const statusColors = {
        complete: theme.colors.success,
        partial: theme.colors.warning,
        empty: theme.colors.text.tertiary,
    };

    const statusIcons = {
        complete: 'checkmark-circle' as const,
        partial: 'ellipse-outline' as const,
        empty: 'ellipse-outline' as const,
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.header}
                onPress={toggle}
                activeOpacity={0.7}
            >
                <View style={styles.headerLeft}>
                    <Text style={styles.icon}>{icon}</Text>
                    <Text style={styles.title}>{title}</Text>
                </View>
                <View style={styles.headerRight}>
                    {completionLabel && (
                        <View style={[styles.statusBadge, { backgroundColor: statusColors[completionStatus] + '15' }]}>
                            <Ionicons
                                name={statusIcons[completionStatus]}
                                size={14}
                                color={statusColors[completionStatus]}
                            />
                            <Text style={[styles.statusText, { color: statusColors[completionStatus] }]}>
                                {completionLabel}
                            </Text>
                        </View>
                    )}
                    <Animated.View style={{ transform: [{ rotate }] }}>
                        <Ionicons name="chevron-down" size={20} color={theme.colors.text.tertiary} />
                    </Animated.View>
                </View>
            </TouchableOpacity>
            {expanded && (
                <View style={styles.content}>
                    {children}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: theme.colors.background,
        borderRadius: 16,
        marginBottom: 12,
        ...theme.shadows.small,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
    },
    icon: {
        fontSize: 20,
    },
    title: {
        fontSize: 15,
        fontWeight: '700',
        color: theme.colors.text.primary,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600',
    },
    content: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderTopWidth: 1,
        borderTopColor: theme.colors.borderLight,
        paddingTop: 16,
    },
});
