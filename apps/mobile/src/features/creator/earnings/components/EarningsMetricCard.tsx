import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../../../../theme/theme';
import { Icon, IconName } from '../../../../components/common/Icons';

interface Props {
    icon: IconName;
    iconColor?: string;
    iconBg?: string;
    label: string;
    value: string;
    subtext?: string;
}

export function EarningsMetricCard({
    icon,
    iconColor = theme.colors.primary,
    iconBg = theme.colors.primary + '14',
    label,
    value,
    subtext,
}: Props) {
    return (
        <View style={styles.card}>
            <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
                <Icon name={icon} size={16} color={iconColor} />
            </View>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
                {value}
            </Text>
            {subtext ? (
                <Text style={styles.sub} numberOfLines={2}>
                    {subtext}
                </Text>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        flex: 1,
        minWidth: '46%',
        backgroundColor: theme.colors.background,
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        ...theme.shadows.xs,
    },
    iconWrap: {
        width: 32,
        height: 32,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    label: {
        fontSize: 12,
        color: theme.colors.text.secondary,
        fontWeight: '600',
    },
    value: {
        fontSize: 20,
        fontWeight: '800',
        color: theme.colors.text.primary,
        marginTop: 4,
        letterSpacing: -0.3,
    },
    sub: {
        fontSize: 11.5,
        color: theme.colors.text.tertiary,
        marginTop: 4,
        lineHeight: 15,
    },
});
