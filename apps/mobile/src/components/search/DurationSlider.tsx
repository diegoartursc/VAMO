import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { theme } from '../../theme/theme';

interface DurationSliderProps {
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
}

export function DurationSlider({
    value,
    onChange,
    min = 1,
    max = 30,
    step = 1
}: DurationSliderProps) {
    const formatDuration = (days: number) => {
        if (days === 1) return '1 dia';
        return `${days} dias`;
    };

    return (
        <View style={styles.container}>
            <View style={styles.labelContainer}>
                <Text style={styles.label}>Duração da Viagem</Text>
                <Text style={styles.valueText}>{formatDuration(value)}</Text>
            </View>

            <Slider
                style={styles.slider}
                minimumValue={min}
                maximumValue={max}
                value={value}
                onValueChange={(val: number) => onChange(Math.round(val))}
                minimumTrackTintColor={theme.colors.primary}
                maximumTrackTintColor={theme.colors.border}
                thumbTintColor={theme.colors.primary}
                step={step}
            />

            <View style={styles.rangeLabels}>
                <Text style={styles.rangeLabel}>{formatDuration(min)}</Text>
                <Text style={styles.rangeLabel}>{formatDuration(max)}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: theme.spacing.lg,
    },
    labelContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    valueText: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.colors.primary,
    },
    slider: {
        width: '100%',
        height: 40,
    },
    rangeLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: -8,
    },
    rangeLabel: {
        fontSize: 12,
        color: theme.colors.text.secondary,
    },
});
