/**
 * ErrorState — estado de erro padrão para telas/seções que carregam dados
 * da API. Ícone + mensagem PT-BR + botão "Tentar novamente" (opcional).
 *
 * Uso:
 *   <ErrorState message={loadError} onRetry={reload} />
 *   <ErrorState compact message="..." onRetry={reload} />  // seções embutidas
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../../theme/theme';
import { Icon } from './Icons';

interface ErrorStateProps {
    /** Título curto. Default: "Algo deu errado" */
    title?: string;
    /** Mensagem amigável (ex: ApiError.message). */
    message?: string;
    /** Quando presente, exibe o botão "Tentar novamente". */
    onRetry?: () => void;
    /** Layout reduzido para seções dentro de uma tela (sem flex:1). */
    compact?: boolean;
}

export function ErrorState({
    title = 'Algo deu errado',
    message = 'Não foi possível carregar as informações. Verifique sua conexão e tente novamente.',
    onRetry,
    compact = false,
}: ErrorStateProps) {
    return (
        <View style={[styles.container, compact ? styles.containerCompact : styles.containerFull]}>
            <View style={styles.iconCircle}>
                <Icon name="info" size={compact ? 22 : 28} color={theme.colors.warning} />
            </View>
            <Text style={[styles.title, compact && styles.titleCompact]}>{title}</Text>
            <Text style={[styles.message, compact && styles.messageCompact]}>{message}</Text>
            {onRetry && (
                <TouchableOpacity style={styles.retryButton} onPress={onRetry} activeOpacity={0.8}>
                    <Icon name="refresh" size={16} color={theme.colors.text.inverse} />
                    <Text style={styles.retryText}>Tentar novamente</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    containerFull: {
        flex: 1,
        paddingVertical: 48,
    },
    containerCompact: {
        paddingVertical: 24,
    },
    iconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: theme.colors.surfaceLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: 6,
        textAlign: 'center',
    },
    titleCompact: {
        fontSize: 15,
    },
    message: {
        fontSize: 14,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 16,
    },
    messageCompact: {
        fontSize: 13,
        lineHeight: 18,
        marginBottom: 12,
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 24,
    },
    retryText: {
        color: theme.colors.text.inverse,
        fontSize: 14,
        fontWeight: '600',
    },
});

export default ErrorState;
