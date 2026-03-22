import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { ItineraryDay } from '../../data/mockPurchasedItineraries';
import { ActivityCard } from './ActivityCard';

interface InteractiveDayTimelineProps {
    days: ItineraryDay[];
    currentDay?: number;
    onToggleComplete?: (activityId: string) => void;
    onUpdateNotes?: (activityId: string, notes: string) => void;
    onOpenMap?: (mapLink: string) => void;
}

export function InteractiveDayTimeline({
    days,
    currentDay,
    onToggleComplete,
    onUpdateNotes,
    onOpenMap,
}: InteractiveDayTimelineProps) {
    const [expandedDays, setExpandedDays] = useState<Set<number>>(
        currentDay ? new Set([currentDay]) : new Set([1])
    );

    const toggleDay = (dayNumber: number) => {
        const newExpanded = new Set(expandedDays);
        if (newExpanded.has(dayNumber)) {
            newExpanded.delete(dayNumber);
        } else {
            newExpanded.add(dayNumber);
        }
        setExpandedDays(newExpanded);
    };

    const getDayStatus = (dayNumber: number) => {
        if (currentDay === undefined) return 'upcoming';
        if (dayNumber < currentDay) return 'completed';
        if (dayNumber === currentDay) return 'current';
        return 'upcoming';
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return theme.colors.success;
            case 'current':
                return theme.colors.primary;
            default:
                return theme.colors.text.tertiary;
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
                return 'checkmark-circle';
            case 'current':
                return 'play-circle';
            default:
                return 'ellipse-outline';
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>Roteiro Dia a Dia</Text>

            {days.map((day, index) => {
                const isExpanded = expandedDays.has(day.dayNumber);
                const status = getDayStatus(day.dayNumber);
                const statusColor = getStatusColor(status);
                const completedActivities = day.activities.filter(a => a.completed).length;
                const totalActivities = day.activities.length;

                return (
                    <View key={day.dayNumber} style={styles.dayContainer}>
                        {/* Day Header */}
                        <TouchableOpacity
                            style={[
                                styles.dayHeader,
                                status === 'current' && styles.dayHeaderCurrent,
                            ]}
                            onPress={() => toggleDay(day.dayNumber)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.dayHeaderLeft}>
                                <View style={[styles.dayBadge, { backgroundColor: statusColor + '20' }]}>
                                    <Ionicons
                                        name={getStatusIcon(status) as any}
                                        size={24}
                                        color={statusColor}
                                    />
                                </View>
                                <View style={styles.dayHeaderInfo}>
                                    <Text style={styles.dayNumber}>Dia {day.dayNumber}</Text>
                                    <Text style={styles.dayTitle}>{day.title}</Text>
                                    {day.date && (
                                        <Text style={styles.dayDate}>
                                            {new Date(day.date).toLocaleDateString('pt-BR', {
                                                weekday: 'short',
                                                day: '2-digit',
                                                month: 'short',
                                            })}
                                        </Text>
                                    )}
                                </View>
                            </View>
                            <View style={styles.dayHeaderRight}>
                                {totalActivities > 0 && (
                                    <View style={styles.progressBadge}>
                                        <Text style={styles.progressText}>
                                            {completedActivities}/{totalActivities}
                                        </Text>
                                    </View>
                                )}
                                <Ionicons
                                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                                    size={24}
                                    color={theme.colors.text.secondary}
                                />
                            </View>
                        </TouchableOpacity>

                        {/* Day Content */}
                        {isExpanded && (
                            <View style={styles.dayContent}>
                                {/* Summary */}
                                <Text style={styles.daySummary}>{day.summary}</Text>

                                {/* Estimated Cost */}
                                {day.estimatedCost && (
                                    <View style={styles.costBadge}>
                                        <Ionicons name="wallet-outline" size={16} color={theme.colors.success} />
                                        <Text style={styles.costText}>
                                            Custo estimado: {day.estimatedCost.currency}{' '}
                                            {day.estimatedCost.min} - {day.estimatedCost.max}
                                        </Text>
                                    </View>
                                )}

                                {/* Activities */}
                                <View style={styles.activitiesContainer}>
                                    {day.activities.map((activity) => (
                                        <ActivityCard
                                            key={activity.id}
                                            activity={activity}
                                            onToggleComplete={onToggleComplete}
                                            onUpdateNotes={onUpdateNotes}
                                            onOpenMap={onOpenMap}
                                        />
                                    ))}
                                </View>
                            </View>
                        )}
                    </View>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: theme.spacing.lg,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.md,
    },
    dayContainer: {
        marginBottom: theme.spacing.md,
    },
    dayHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.lg,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        ...theme.shadows.small,
    },
    dayHeaderCurrent: {
        borderColor: theme.colors.primary,
        borderWidth: 2,
        backgroundColor: theme.colors.primaryLight,
    },
    dayHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    dayBadge: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dayHeaderInfo: {
        flex: 1,
        gap: 2,
    },
    dayNumber: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.text.tertiary,
        textTransform: 'uppercase',
    },
    dayTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.text.primary,
    },
    dayDate: {
        fontSize: 12,
        color: theme.colors.text.secondary,
    },
    dayHeaderRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    progressBadge: {
        backgroundColor: theme.colors.surfaceLight,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: theme.borderRadius.full,
    },
    progressText: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.text.secondary,
    },
    dayContent: {
        marginTop: theme.spacing.md,
        paddingHorizontal: theme.spacing.sm,
    },
    daySummary: {
        fontSize: 14,
        color: theme.colors.text.secondary,
        lineHeight: 20,
        marginBottom: theme.spacing.md,
    },
    costBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: theme.colors.surfaceLight,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: theme.borderRadius.md,
        alignSelf: 'flex-start',
        marginBottom: theme.spacing.md,
    },
    costText: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.success,
    },
    activitiesContainer: {
        gap: theme.spacing.sm,
    },
});
