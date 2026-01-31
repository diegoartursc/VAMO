import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { theme } from '../theme/theme';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface CollapsibleSectionProps {
    title: string;
    children: React.ReactNode;
    defaultExpanded?: boolean;
}

export default function CollapsibleSection({
    title,
    children,
    defaultExpanded = false
}: CollapsibleSectionProps) {
    const [expanded, setExpanded] = useState(defaultExpanded);

    const toggleExpanded = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpanded(!expanded);
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.header}
                onPress={toggleExpanded}
                activeOpacity={0.7}
            >
                <Text style={styles.title}>{title}</Text>
                <Text style={[styles.chevron, expanded && styles.chevronExpanded]}>
                    ›
                </Text>
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
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: theme.spacing.md,
    },
    title: {
        fontSize: 17,
        fontWeight: '700',
        color: theme.colors.text.primary,
        flex: 1,
    },
    chevron: {
        fontSize: 28,
        fontWeight: '400',
        color: theme.colors.text.secondary,
        transform: [{ rotate: '90deg' }],
        marginLeft: theme.spacing.sm,
    },
    chevronExpanded: {
        transform: [{ rotate: '-90deg' }],
    },
    content: {
        paddingBottom: theme.spacing.md,
    },
});
