import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    TextInput,
    ScrollView,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { DayActivity } from '../../data/mockPurchasedItineraries';
import { formatTimeForAustraliaDisplay } from '@vamo/shared/itinerary';
import { useMediaLightbox } from '../common/MediaLightbox';

interface ActivityCardProps {
    activity: DayActivity;
    onToggleComplete?: (activityId: string) => void;
    onUpdateNotes?: (activityId: string, notes: string) => void;
    onOpenMap?: (mapLink: string) => void;
}

const { width } = Dimensions.get('window');

export function ActivityCard({
    activity,
    onToggleComplete,
    onUpdateNotes,
    onOpenMap,
}: ActivityCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [notes, setNotes] = useState(activity.notes || '');
    const [isEditingNotes, setIsEditingNotes] = useState(false);

    // Permite tocar nas fotos da atividade pra abrir no lightbox compartilhado.
    const lightbox = useMediaLightbox();

    const getTypeColor = () => {
        switch (activity.type) {
            case 'activity':
                return theme.colors.primary;
            case 'meal':
                return theme.colors.warning;
            case 'transport':
                return theme.colors.info;
            case 'rest':
                return theme.colors.success;
            default:
                return theme.colors.text.secondary;
        }
    };

    const handleSaveNotes = () => {
        if (onUpdateNotes) {
            onUpdateNotes(activity.id, notes);
        }
        setIsEditingNotes(false);
    };

    return (
        <View style={styles.container}>
            {/* Timeline Dot */}
            <View style={styles.timelineContainer}>
                <View style={[styles.timelineDot, { backgroundColor: getTypeColor() }]} />
                {!isExpanded && <View style={styles.timelineLine} />}
            </View>

            {/* Card Content */}
            <TouchableOpacity
                style={[
                    styles.card,
                    activity.completed && styles.cardCompleted,
                ]}
                onPress={() => setIsExpanded(!isExpanded)}
                activeOpacity={0.7}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <View style={[styles.iconBadge, { backgroundColor: getTypeColor() + '20' }]}>
                            <Text style={styles.icon}>{activity.icon}</Text>
                        </View>
                        <View style={styles.headerInfo}>
                            <Text style={styles.time}>{formatTimeForAustraliaDisplay(activity.time)}</Text>
                            <Text style={styles.duration}>{activity.duration}</Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        onPress={() => onToggleComplete?.(activity.id)}
                        style={styles.checkButton}
                    >
                        <Ionicons
                            name={activity.completed ? 'checkmark-circle' : 'ellipse-outline'}
                            size={28}
                            color={activity.completed ? theme.colors.success : theme.colors.border}
                        />
                    </TouchableOpacity>
                </View>

                {/* Title & Location */}
                <Text style={[styles.title, activity.completed && styles.titleCompleted]}>
                    {activity.title}
                </Text>
                <View style={styles.locationRow}>
                    <Ionicons name="location-outline" size={14} color={theme.colors.text.tertiary} />
                    <Text style={styles.location}>{activity.location}</Text>
                </View>

                {/* Expanded Content */}
                {isExpanded && (
                    <View style={styles.expandedContent}>
                        {/* Description */}
                        <Text style={styles.description}>{activity.description}</Text>

                        {/* Images */}
                        {activity.images.length > 0 && (
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                style={styles.imagesContainer}
                            >
                                {activity.images.map((image, index) => {
                                    const items = activity.images!.map(url => ({ url, type: 'image' as const }));
                                    return (
                                        <TouchableOpacity
                                            key={index}
                                            activeOpacity={0.85}
                                            accessibilityLabel={`Foto ${index + 1} de ${activity.title}`}
                                            onPress={() => lightbox.open(items, index, activity.title)}
                                        >
                                            <Image
                                                source={{ uri: image }}
                                                style={styles.image}
                                                resizeMode="cover"
                                            />
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        )}

                        {/* Tips */}
                        {activity.tips.length > 0 && (
                            <View style={styles.tipsContainer}>
                                <View style={styles.tipsHeader}>
                                    <Ionicons name="bulb" size={16} color={theme.colors.warning} />
                                    <Text style={styles.tipsTitle}>Dicas Importantes</Text>
                                </View>
                                {activity.tips.map((tip, index) => (
                                    <View key={index} style={styles.tipItem}>
                                        <Text style={styles.tipBullet}>•</Text>
                                        <Text style={styles.tipText}>{tip}</Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Actions */}
                        <View style={styles.actions}>
                            {activity.mapLink && (
                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={() => onOpenMap?.(activity.mapLink!)}
                                >
                                    <Ionicons name="map-outline" size={18} color={theme.colors.primary} />
                                    <Text style={styles.actionText}>Ver no Mapa</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => setIsEditingNotes(!isEditingNotes)}
                            >
                                <Ionicons
                                    name={isEditingNotes ? 'close-outline' : 'create-outline'}
                                    size={18}
                                    color={theme.colors.primary}
                                />
                                <Text style={styles.actionText}>
                                    {isEditingNotes ? 'Cancelar' : 'Adicionar Nota'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Notes */}
                        {isEditingNotes ? (
                            <View style={styles.notesEdit}>
                                <TextInput
                                    style={styles.notesInput}
                                    value={notes}
                                    onChangeText={setNotes}
                                    placeholder="Adicione suas observações..."
                                    placeholderTextColor={theme.colors.text.tertiary}
                                    multiline
                                    numberOfLines={3}
                                />
                                <TouchableOpacity style={styles.saveButton} onPress={handleSaveNotes}>
                                    <Text style={styles.saveButtonText}>Salvar Nota</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            notes && (
                                <View style={styles.notesDisplay}>
                                    <View style={styles.notesHeader}>
                                        <Ionicons name="document-text" size={16} color={theme.colors.primary} />
                                        <Text style={styles.notesLabel}>Suas Notas</Text>
                                    </View>
                                    <Text style={styles.notesText}>{notes}</Text>
                                </View>
                            )
                        )}
                    </View>
                )}

                {/* Expand Indicator */}
                <View style={styles.expandIndicator}>
                    <Ionicons
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color={theme.colors.text.tertiary}
                    />
                </View>
            </TouchableOpacity>

            {/* Lightbox compartilhado renderiza só quando uma foto é tocada. */}
            {lightbox.element}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        marginBottom: theme.spacing.md,
    },
    timelineContainer: {
        alignItems: 'center',
        marginRight: 12,
        paddingTop: 8,
    },
    timelineDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginBottom: 8,
    },
    timelineLine: {
        width: 2,
        flex: 1,
        backgroundColor: theme.colors.borderLight,
    },
    card: {
        flex: 1,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        ...theme.shadows.small,
    },
    cardCompleted: {
        opacity: 0.7,
        backgroundColor: theme.colors.surfaceLight,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconBadge: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    icon: {
        fontSize: 20,
    },
    headerInfo: {
        gap: 2,
    },
    time: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.text.primary,
    },
    duration: {
        fontSize: 12,
        color: theme.colors.text.tertiary,
    },
    checkButton: {
        padding: 4,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text.primary,
        marginBottom: 6,
    },
    titleCompleted: {
        textDecorationLine: 'line-through',
        color: theme.colors.text.secondary,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: theme.spacing.sm,
    },
    location: {
        fontSize: 13,
        color: theme.colors.text.tertiary,
    },
    expandedContent: {
        marginTop: theme.spacing.md,
        paddingTop: theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: theme.colors.borderLight,
    },
    description: {
        fontSize: 14,
        color: theme.colors.text.secondary,
        lineHeight: 20,
        marginBottom: theme.spacing.md,
    },
    imagesContainer: {
        marginBottom: theme.spacing.md,
    },
    image: {
        width: width * 0.6,
        height: 180,
        borderRadius: theme.borderRadius.md,
        marginRight: 12,
    },
    tipsContainer: {
        backgroundColor: theme.colors.surfaceLight,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        marginBottom: theme.spacing.md,
    },
    tipsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: theme.spacing.sm,
    },
    tipsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    tipItem: {
        flexDirection: 'row',
        marginTop: 6,
        gap: 8,
    },
    tipBullet: {
        fontSize: 14,
        color: theme.colors.warning,
        fontWeight: '700',
    },
    tipText: {
        flex: 1,
        fontSize: 13,
        color: theme.colors.text.secondary,
        lineHeight: 18,
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: theme.spacing.md,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        backgroundColor: theme.colors.primaryLight,
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderColor: theme.colors.primary,
    },
    actionText: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.primary,
    },
    notesEdit: {
        gap: 12,
    },
    notesInput: {
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.md,
        padding: 12,
        fontSize: 14,
        color: theme.colors.text.primary,
        minHeight: 80,
        textAlignVertical: 'top',
    },
    saveButton: {
        backgroundColor: theme.colors.primary,
        paddingVertical: 12,
        borderRadius: theme.borderRadius.md,
        alignItems: 'center',
    },
    saveButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text.onPrimary,
    },
    notesDisplay: {
        backgroundColor: theme.colors.surfaceLight,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        borderLeftWidth: 3,
        borderLeftColor: theme.colors.primary,
    },
    notesHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    notesLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    notesText: {
        fontSize: 13,
        color: theme.colors.text.secondary,
        lineHeight: 18,
    },
    expandIndicator: {
        alignItems: 'center',
        marginTop: theme.spacing.sm,
    },
});
