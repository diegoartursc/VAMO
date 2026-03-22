import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../../theme/theme';

interface PremiumSearchBarProps {
    onPress?: () => void;
    placeholder?: string;
}

export function PremiumSearchBar({
    onPress,
    placeholder = 'Buscar no VAMO',
}: PremiumSearchBarProps) {
    return (
        <TouchableOpacity
            style={styles.container}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.iconContainer}>
                <Text style={styles.icon}>🔍</Text>
            </View>
            <Text style={styles.placeholder}>{placeholder}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderRadius: 28,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginHorizontal: 20,
        marginTop: -24, // Overlap with hero
        marginBottom: 20,
        ...theme.shadows.medium,
    },
    iconContainer: {
        marginRight: 12,
    },
    icon: {
        fontSize: 18,
    },
    placeholder: {
        flex: 1,
        fontSize: 16,
        color: theme.colors.text.tertiary,
        fontWeight: '400',
    },
});
