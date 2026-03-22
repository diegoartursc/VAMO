import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { theme } from '../../theme/theme';

interface PriceSliderProps {
    min: number;
    max: number;
    value: [number, number];
    onChange: (value: [number, number]) => void;
    step?: number;
}

export function PriceSlider({ min, max, value, onChange, step = 100 }: PriceSliderProps) {
    const [minValue, maxValue] = value;

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(price);
    };

    return (
        <View style={styles.container}>
            <View style={styles.labelContainer}>
                <Text style={styles.label}>Faixa de Preço</Text>
                <Text style={styles.valueText}>
                    {formatPrice(minValue)} - {formatPrice(maxValue)}
                </Text>
            </View>

            {/* Slider de Valor Mínimo */}
            <View style={styles.sliderContainer}>
                <Text style={styles.sliderLabel}>Mínimo</Text>
                <Slider
                    style={styles.slider}
                    minimumValue={min}
                    maximumValue={maxValue} // Não pode ultrapassar o máximo atual
                    value={minValue}
                    onValueChange={(val: number) => onChange([Math.round(val / step) * step, maxValue])}
                    minimumTrackTintColor={theme.colors.primary}
                    maximumTrackTintColor={theme.colors.border}
                    thumbTintColor={theme.colors.primary}
                    step={step}
                />
                <Text style={styles.sliderValue}>{formatPrice(minValue)}</Text>
            </View>

            {/* Slider de Valor Máximo */}
            <View style={styles.sliderContainer}>
                <Text style={styles.sliderLabel}>Máximo</Text>
                <Slider
                    style={styles.slider}
                    minimumValue={minValue} // Não pode ser menor que o mínimo atual
                    maximumValue={max}
                    value={maxValue}
                    onValueChange={(val: number) => onChange([minValue, Math.round(val / step) * step])}
                    minimumTrackTintColor={theme.colors.primary}
                    maximumTrackTintColor={theme.colors.border}
                    thumbTintColor={theme.colors.primary}
                    step={step}
                />
                <Text style={styles.sliderValue}>{formatPrice(maxValue)}</Text>
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
    sliderContainer: {
        marginBottom: theme.spacing.sm,
    },
    sliderLabel: {
        fontSize: 14,
        color: theme.colors.text.secondary,
        marginBottom: 4,
    },
    slider: {
        width: '100%',
        height: 40,
    },
    sliderValue: {
        fontSize: 12,
        color: theme.colors.text.secondary,
        textAlign: 'right',
        marginTop: -8,
    },
});
