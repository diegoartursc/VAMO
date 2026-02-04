import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { theme } from '../../theme/theme';

interface ItineraryCardProps {
    mainStop: string;
    pickupLocations: string[];
    transport: {
        type: string;
        duration: string;
    };
    mainActivity: {
        location: string;
        activity: string;
        duration: string;
    };
    returnLocations: string[];
    mapImageUrl?: string;
    price?: {
        min: number;
        currency: string;
    };
    onAvailabilityPress?: () => void;
}

const ItineraryCard: React.FC<ItineraryCardProps> = ({
    mainStop,
    pickupLocations,
    transport,
    mainActivity,
    returnLocations,
    mapImageUrl,
    price,
    onAvailabilityPress,
}) => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Itinerário</Text>

            {/* Map */}
            {mapImageUrl && (
                <View style={styles.mapContainer}>
                    <Image
                        source={{ uri: mapImageUrl }}
                        style={styles.mapImage}
                        resizeMode="cover"
                    />
                    <View style={styles.mapOverlay}>
                        <Text style={styles.mapLabel}>📍 {pickupLocations.length} pontos de parada</Text>
                    </View>
                </View>
            )}

            {/* Main Stop */}
            <View style={styles.section}>
                <View style={styles.iconRow}>
                    <View style={styles.iconCircle}>
                        <Text style={styles.icon}>📍</Text>
                    </View>
                    <View style={styles.infoContainer}>
                        <Text style={styles.sectionLabel}>Parada principal</Text>
                        <Text style={styles.sectionValue}>{mainStop}</Text>
                    </View>
                </View>
            </View>

            {/* Pickup Locations */}
            <View style={styles.section}>
                <View style={styles.iconRow}>
                    <View style={styles.iconCircle}>
                        <Text style={styles.icon}>🚩</Text>
                    </View>
                    <View style={styles.infoContainer}>
                        <Text style={styles.sectionLabel}>
                            {pickupLocations.length} Opções de locais de busca
                        </Text>
                        <Text style={styles.locationsList} numberOfLines={2}>
                            {pickupLocations.join(', ')}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Transport */}
            <View style={styles.section}>
                <View style={styles.iconRow}>
                    <View style={styles.iconCircle}>
                        <Text style={styles.icon}>🚐</Text>
                    </View>
                    <View style={styles.infoContainer}>
                        <Text style={styles.sectionLabel}>{transport.type}</Text>
                        <Text style={styles.duration}>({transport.duration})</Text>
                    </View>
                </View>
            </View>

            {/* Main Activity */}
            <View style={styles.section}>
                <View style={styles.iconRow}>
                    <View style={styles.iconCircle}>
                        <Text style={styles.icon}>🎯</Text>
                    </View>
                    <View style={styles.infoContainer}>
                        <Text style={styles.sectionLabel}>{mainActivity.location}</Text>
                        <Text style={styles.activityDescription}>
                            {mainActivity.activity} ({mainActivity.duration})
                        </Text>
                    </View>
                </View>
            </View>

            {/* Return Locations */}
            <View style={styles.section}>
                <View style={styles.iconRow}>
                    <View style={styles.iconCircle}>
                        <Text style={styles.icon}>🔄</Text>
                    </View>
                    <View style={styles.infoContainer}>
                        <Text style={styles.sectionLabel}>
                            {returnLocations.length} locais de retorno:
                        </Text>
                        <Text style={styles.locationsList} numberOfLines={2}>
                            {returnLocations.join(', ')}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Price and Button */}
            {price && (
                <View style={styles.footer}>
                    <View style={styles.priceContainer}>
                        <Text style={styles.priceLabel}>A partir de</Text>
                        <Text style={styles.priceValue}>
                            {price.currency === 'BRL' ? 'R$' : price.currency} {price.min.toLocaleString('pt-BR')}
                        </Text>
                        <Text style={styles.priceNote}>por adulto</Text>
                    </View>

                    <TouchableOpacity
                        style={styles.availabilityButton}
                        onPress={onAvailabilityPress}
                    >
                        <Text style={styles.availabilityButtonText}>Disponibilidade</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.lg,
        ...theme.shadows.small,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.md,
    },
    mapContainer: {
        position: 'relative',
        height: 200,
        borderRadius: theme.borderRadius.md,
        overflow: 'hidden',
        marginBottom: theme.spacing.md,
    },
    mapImage: {
        width: '100%',
        height: '100%',
    },
    mapOverlay: {
        position: 'absolute',
        top: theme.spacing.sm,
        left: theme.spacing.sm,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: theme.borderRadius.sm,
    },
    mapLabel: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
    section: {
        marginBottom: theme.spacing.md,
        paddingBottom: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    iconRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    iconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: theme.colors.surfaceLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    icon: {
        fontSize: 18,
    },
    infoContainer: {
        flex: 1,
    },
    sectionLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.colors.text.primary,
        marginBottom: 4,
    },
    sectionValue: {
        fontSize: 14,
        color: theme.colors.text.secondary,
    },
    locationsList: {
        fontSize: 13,
        color: theme.colors.text.secondary,
        lineHeight: 18,
    },
    duration: {
        fontSize: 13,
        color: theme.colors.text.secondary,
        fontStyle: 'italic',
    },
    activityDescription: {
        fontSize: 13,
        color: theme.colors.text.secondary,
        lineHeight: 18,
    },
    footer: {
        marginTop: theme.spacing.sm,
        gap: theme.spacing.md,
    },
    priceContainer: {
        alignItems: 'center',
        paddingVertical: theme.spacing.sm,
    },
    priceLabel: {
        fontSize: 12,
        color: theme.colors.text.secondary,
        marginBottom: 4,
    },
    priceValue: {
        fontSize: 24,
        fontWeight: '700',
        color: theme.colors.primary,
        marginBottom: 2,
    },
    priceNote: {
        fontSize: 11,
        color: theme.colors.text.secondary,
    },
    availabilityButton: {
        backgroundColor: theme.colors.primary,
        paddingVertical: 14,
        borderRadius: theme.borderRadius.full,
        alignItems: 'center',
    },
    availabilityButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.colors.text.inverse,
    },
});

export default ItineraryCard;
