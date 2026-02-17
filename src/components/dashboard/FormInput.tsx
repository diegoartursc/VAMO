import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { theme } from '../../theme/theme';

interface FormInputProps extends TextInputProps {
    label: string;
    error?: string;
    hint?: string;
    required?: boolean;
    prefix?: string;
    suffix?: string;
}

export default function FormInput({
    label,
    error,
    hint,
    required,
    prefix,
    suffix,
    style,
    ...inputProps
}: FormInputProps) {
    return (
        <View style={styles.container}>
            <View style={styles.labelRow}>
                <Text style={styles.label}>
                    {label}
                    {required && <Text style={styles.required}> *</Text>}
                </Text>
            </View>
            <View style={[styles.inputWrapper, error && styles.inputError]}>
                {prefix && <Text style={styles.prefix}>{prefix}</Text>}
                <TextInput
                    style={[styles.input, inputProps.multiline && styles.inputMultiline, style]}
                    placeholderTextColor={theme.colors.text.disabled}
                    {...inputProps}
                />
                {suffix && <Text style={styles.suffix}>{suffix}</Text>}
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
            {hint && !error && <Text style={styles.hintText}>{hint}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.text.secondary,
    },
    required: {
        color: theme.colors.error,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.border,
        paddingHorizontal: 14,
    },
    inputError: {
        borderColor: theme.colors.error,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: theme.colors.text.primary,
        paddingVertical: 12,
    },
    inputMultiline: {
        minHeight: 80,
        textAlignVertical: 'top',
        paddingTop: 12,
    },
    prefix: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.colors.text.secondary,
        marginRight: 6,
    },
    suffix: {
        fontSize: 13,
        color: theme.colors.text.tertiary,
        marginLeft: 6,
    },
    errorText: {
        fontSize: 12,
        color: theme.colors.error,
        marginTop: 4,
    },
    hintText: {
        fontSize: 12,
        color: theme.colors.text.tertiary,
        marginTop: 4,
    },
});
