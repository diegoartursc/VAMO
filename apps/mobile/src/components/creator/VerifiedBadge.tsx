import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { VerificationLevel, VERIFICATION_CONFIGS } from '../../types/creator';
import { theme } from '../../theme/theme';

interface VerifiedBadgeProps {
    level: VerificationLevel;
    size?: 'small' | 'medium' | 'large';
    showLabel?: boolean;
    onPress?: () => void;
}

export function VerifiedBadge({
    level,
    size = 'medium',
    showLabel = true,
    onPress
}: VerifiedBadgeProps) {
    const config = VERIFICATION_CONFIGS[level];

    const sizeStyles = {
        small: {
            icon: 14,
            label: 10,
            paddingH: 6,
            paddingV: 2,
        },
        medium: {
            icon: 16,
            label: 11,
            paddingH: 8,
            paddingV: 4,
        },
        large: {
            icon: 20,
            label: 13,
            paddingH: 12,
            paddingV: 6,
        },
    };

    const currentSize = sizeStyles[size];

    const badge = (
        <View
            style={[
                styles.badge,
                {
                    backgroundColor: config.bgColor,
                    paddingHorizontal: currentSize.paddingH,
                    paddingVertical: currentSize.paddingV,
                }
            ]}
        >
            <Text style={[styles.icon, { fontSize: currentSize.icon }]}>
                {config.icon}
            </Text>
            {showLabel && (
                <Text
                    style={[
                        styles.label,
                        {
                            color: config.color,
                            fontSize: currentSize.label,
                        }
                    ]}
                >
                    {config.label}
                </Text>
            )}
        </View>
    );

    if (onPress) {
        return (
            <TouchableOpacity onPress={onPress}>
                {badge}
            </TouchableOpacity>
        );
    }

    return badge;
}

interface VerifiedBadgeWithTooltipProps extends VerifiedBadgeProps {
    showTooltip?: boolean;
}

export function VerifiedBadgeExpanded({ level }: { level: VerificationLevel }) {
    const config = VERIFICATION_CONFIGS[level];

    return (
        <View style={[styles.expandedBadge, { backgroundColor: config.bgColor }]}>
            <View style={styles.expandedHeader}>
                <Text style={styles.expandedIcon}>{config.icon}</Text>
                <View>
                    <Text style={[styles.expandedLabel, { color: config.color }]}>
                        {config.label}
                    </Text>
                    <Text style={styles.expandedDescription}>
                        {config.description}
                    </Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        gap: 4,
    },
    icon: {
        // fontSize set dynamically
    },
    label: {
        fontWeight: '600',
        // fontSize and color set dynamically
    },
    expandedBadge: {
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
    },
    expandedHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
    },
    expandedIcon: {
        fontSize: 32,
    },
    expandedLabel: {
        fontSize: 16,
        fontWeight: '700',
    },
    expandedDescription: {
        fontSize: 13,
        color: theme.colors.text.secondary,
        marginTop: 2,
    },
});
