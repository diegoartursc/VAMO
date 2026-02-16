import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';

interface ItineraryHeaderProps {
    title: string;
    destination: string;
    tripStartDate: string;
    tripEndDate: string;
    totalDays: number;
    completedActivities: number;
    totalActivities: number;
    weatherInfo?: {
        temperature: string;
        conditions: string;
    };
    onShare: () => void;
    onDownload: () => void;
}

export function ItineraryHeader({
    title,
    destination,
    tripStartDate,
    tripEndDate,
    totalDays,
    completedActivities,
    totalActivities,
    weatherInfo,
    onShare,
    onDownload,
}: ItineraryHeaderProps) {
    const getDaysUntilTrip = () => {
        const start = new Date(tripStartDate);
        const today = new Date();
        const diffTime = start.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const getCurrentDay = () => {
        const start = new Date(tripStartDate);
        const today = new Date();
        const diffTime = today.getTime() - start.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return diffDays;
    };

    const daysUntil = getDaysUntilTrip();
    const currentDay = getCurrentDay();
    const isOnTrip = daysUntil <= 0 && currentDay <= totalDays;
    const isTripCompleted = currentDay > totalDays;

    const getStatusMessage = () => {
        if (isTripCompleted) {
            return { icon: '✅', text: 'Viagem Concluída!', color: theme.colors.success };
        }
        if (isOnTrip) {
            return { icon: '✈️', text: `Dia ${currentDay} de ${totalDays}`, color: theme.colors.primary };
        }
        if (daysUntil === 0) {
            return { icon: '🎉', text: 'Sua viagem começa hoje!', color: theme.colors.warning };
        }
        if (daysUntil === 1) {
            return { icon: '⏰', text: 'Falta 1 dia!', color: theme.colors.warning };
        }
        return { icon: '📅', text: `Faltam ${daysUntil} dias`, color: theme.colors.text.secondary };
    };

    const status = getStatusMessage();
    const progress = totalActivities > 0 ? (completedActivities / totalActivities) * 100 : 0;

    return (
        <View style={styles.container}>
            {/* Gradient Background */}
            <View style={styles.gradientContainer}>
                <View style={[styles.gradient, { backgroundColor: theme.colors.primaryLight }]} />
            </View>

            {/* Content */}
            <View style={styles.content}>
                {/* Status Badge */}
                <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
                    <Text style={styles.statusIcon}>{status.icon}</Text>
                    <Text style={[styles.statusText, { color: status.color }]}>{status.text}</Text>
                </View>

                {/* Title */}
                <Text style={styles.title} numberOfLines={2}>
                    {title}
                </Text>
                <View style={styles.locationRow}>
                    <Ionicons name="location" size={16} color={theme.colors.primary} />
                    <Text style={styles.location}>{destination}</Text>
                </View>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{totalDays}</Text>
                        <Text style={styles.statLabel}>dias</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{completedActivities}/{totalActivities}</Text>
                        <Text style={styles.statLabel}>atividades</Text>
                    </View>
                    {weatherInfo && (
                        <>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>🌤️</Text>
                                <Text style={styles.statLabel}>{weatherInfo.temperature}</Text>
                            </View>
                        </>
                    )}
                </View>

                {/* Progress Bar */}
                {totalActivities > 0 && (
                    <View style={styles.progressContainer}>
                        <View style={styles.progressBar}>
                            <View style={[styles.progressFill, { width: `${progress}%` }]} />
                        </View>
                        <Text style={styles.progressText}>{Math.round(progress)}% completo</Text>
                    </View>
                )}

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                    <TouchableOpacity style={styles.actionButton} onPress={onShare}>
                        <Ionicons name="share-social-outline" size={20} color={theme.colors.primary} />
                        <Text style={styles.actionButtonText}>Compartilhar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={onDownload}>
                        <Ionicons name="download-outline" size={20} color={theme.colors.primary} />
                        <Text style={styles.actionButtonText}>Baixar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        marginBottom: theme.spacing.lg,
    },
    gradientContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '100%',
        borderRadius: theme.borderRadius.xl,
        overflow: 'hidden',
    },
    gradient: {
        flex: 1,
        opacity: 0.3,
    },
    content: {
        padding: theme.spacing.lg,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.xl,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        ...theme.shadows.medium,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: theme.borderRadius.full,
        marginBottom: theme.spacing.md,
        gap: 8,
    },
    statusIcon: {
        fontSize: 16,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '700',
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: 8,
        lineHeight: 32,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: theme.spacing.md,
    },
    location: {
        fontSize: 15,
        color: theme.colors.text.secondary,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingVertical: theme.spacing.md,
        backgroundColor: theme.colors.surfaceLight,
        borderRadius: theme.borderRadius.md,
        marginBottom: theme.spacing.md,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: theme.colors.text.tertiary,
    },
    statDivider: {
        width: 1,
        height: 30,
        backgroundColor: theme.colors.border,
    },
    progressContainer: {
        marginBottom: theme.spacing.md,
    },
    progressBar: {
        height: 8,
        backgroundColor: theme.colors.surfaceLight,
        borderRadius: theme.borderRadius.full,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressFill: {
        height: '100%',
        backgroundColor: theme.colors.primary,
        borderRadius: theme.borderRadius.full,
    },
    progressText: {
        fontSize: 12,
        color: theme.colors.text.secondary,
        textAlign: 'center',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        backgroundColor: theme.colors.primaryLight,
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderColor: theme.colors.primary,
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.primary,
    },
});
