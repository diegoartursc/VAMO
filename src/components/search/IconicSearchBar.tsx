import React from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme/theme';

const { width } = Dimensions.get('window');

interface IconicSearchBarProps {
    placeholder: string;
    onPress?: () => void;
}

export function IconicSearchBar({ placeholder, onPress }: IconicSearchBarProps) {
    return (
        <TouchableOpacity
            style={styles.container}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <LinearGradient
                colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.9)']}
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.iconWrapper}>
                    <LinearGradient
                        colors={[theme.colors.primary, theme.colors.secondary]}
                        style={styles.iconGradient}
                    >
                        <Text style={styles.icon}>🔍</Text>
                    </LinearGradient>
                </View>

                <Text style={styles.placeholder}>{placeholder}</Text>
            </LinearGradient>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        height: 56,
        marginHorizontal: theme.spacing.md,
        borderRadius: 28,
        overflow: 'hidden',
        ...theme.shadows.elevated,
    },
    gradient: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    iconWrapper: {
        width: 40,
        height: 40,
        borderRadius: 20,
        overflow: 'hidden',
        marginRight: 12,
    },
    iconGradient: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    icon: {
        fontSize: 18,
    },
    placeholder: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
        color: theme.colors.text.primary,
    },
    filterIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: theme.colors.surfaceLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    filterText: {
        fontSize: 16,
    },
});
