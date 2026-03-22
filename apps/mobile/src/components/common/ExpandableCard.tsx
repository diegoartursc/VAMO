import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { theme } from '../../theme/theme';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface ExpandableCardProps {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    defaultExpanded?: boolean;
}

export default function ExpandableCard({
    title,
    subtitle,
    children,
    defaultExpanded = false
}: ExpandableCardProps) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    const toggleExpand = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsExpanded(!isExpanded);
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.header}
                onPress={toggleExpand}
                activeOpacity={0.7}
            >
                <View style={styles.headerContent}>
                    <Text style={styles.title}>{title}</Text>
                    {subtitle && !isExpanded && (
                        <Text style={styles.subtitle}>{subtitle}</Text>
                    )}
                </View>
                <Text style={[styles.arrow, isExpanded && styles.arrowExpanded]}>
                    {isExpanded ? '▲' : '▼'}
                </Text>
            </TouchableOpacity>

            {isExpanded && (
                <View style={styles.content}>
                    {children}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginHorizontal: theme.spacing.md,
        marginBottom: theme.spacing.md,
        backgroundColor: theme.colors.background,
        borderRadius: theme.borderRadius.lg,
        borderWidth: 2,
        borderColor: theme.colors.primary,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: theme.spacing.lg,
    },
    headerContent: {
        flex: 1,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: theme.colors.text.secondary,
        marginTop: 2,
    },
    arrow: {
        fontSize: 16,
        color: theme.colors.primary,
        marginLeft: theme.spacing.sm,
    },
    arrowExpanded: {
        // Arrow rotates via text change, not transform
    },
    content: {
        paddingHorizontal: theme.spacing.lg,
        paddingBottom: theme.spacing.lg,
    },
});
