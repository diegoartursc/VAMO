import React from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';

const { width } = Dimensions.get('window');

interface IconicSearchBarProps {
    placeholder: string;
    onPress?: () => void;
    overlapsHero?: boolean; // Only true on Home page where it overlaps hero image
}

export function IconicSearchBar({ placeholder, onPress, overlapsHero = false }: IconicSearchBarProps) {
    return (
        <TouchableOpacity
            style={[
                styles.container,
                overlapsHero ? styles.overlapsHero : styles.standardPosition
            ]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <BlurView intensity={40} tint="light" style={styles.blurContainer}>
                {/* Search Icon */}
                <Ionicons name="search" size={20} color="rgba(0,0,0,0.5)" style={styles.searchIcon} />

                {/* Placeholder Text */}
                <Text style={styles.placeholder}>{placeholder}</Text>

                {/* Blue CTA Button */}
                <LinearGradient
                    colors={[theme.colors.primary, theme.colors.secondary]}
                    style={styles.ctaButton}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <Ionicons name="options-outline" size={18} color="#fff" />
                </LinearGradient>
            </BlurView>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        marginHorizontal: theme.spacing.md,
        borderRadius: 28,
        overflow: 'hidden',
        ...theme.shadows.elevated,
        zIndex: 10,
    },
    overlapsHero: {
        marginTop: -28, // Overlap with hero image
    },
    standardPosition: {
        marginTop: 16, // Normal spacing below header
        marginBottom: 16,
    },
    blurContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 16,
        paddingRight: 6,
        paddingVertical: 6,
        borderRadius: 28,
        overflow: 'hidden',
        backgroundColor: Platform.OS === 'web' ? 'rgba(255,255,255,0.85)' : 'transparent',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.5)',
    },
    searchIcon: {
        marginRight: 10,
    },
    placeholder: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
        color: theme.colors.text.secondary,
    },
    ctaButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
