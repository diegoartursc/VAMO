import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import { theme } from '../../theme/theme';
import { Package } from '../../types';
import { Icon } from '../common/Icons';
import { CoverCarousel } from '../common/CoverCarousel';
import { PackageBadge } from '../badges/PackageBadge';
import { formatMoney, getRouteRatingDisplay } from '@vamo/shared/itinerary';

interface PackageCardProps {
    pkg: Package;
    onPress: () => void;
    isFavorite: boolean;
    onToggleFavorite: (event?: any) => void;
}

export const PackageCard: React.FC<PackageCardProps> = ({
    pkg,
    onPress,
    isFavorite,
    onToggleFavorite
}) => {
    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
            <View style={styles.cardImageContainer}>
                <CoverCarousel
                    images={pkg.images || []}
                    aspectRatio={4 / 3}
                    coverMode="containWithBlurredBg"
                />

                {/* Badges Overlay */}
                <View style={styles.cardBadges}>
                    {pkg.badge ? (
                        <PackageBadge type={pkg.badge} />
                    ) : pkg.agency?.verified ? (
                        <View style={styles.verifiedBadge}>
                            <Icon name="verified" size={12} color="#FFF" />
                            <Text style={styles.verifiedText}>Agência Verificada</Text>
                        </View>
                    ) : null}
                </View>

                {/* Favorite Button */}
                <TouchableOpacity
                    style={styles.favoriteButton}
                    onPress={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(e);
                    }}
                >
                    <Icon
                        name="heart"
                        size={20}
                        color={isFavorite ? theme.colors.error : theme.colors.secondary}
                        style={isFavorite ? {} : { opacity: 0.6 }}
                    />
                </TouchableOpacity>

                {/* Photo Count (if info available) */}
                {pkg.images?.length > 1 && (
                    <View style={styles.photoCountBadge}>
                        <Icon name="camera" size={14} color="#FFF" />
                        <Text style={styles.photoCountText}>1/{pkg.images.length}</Text>
                    </View>
                )}
            </View>

            <View style={styles.cardContent}>
                {/* Compact Agency + Reputation Row */}
                <View style={styles.compactInfoRow}>
                    <Icon name="globe" size={14} color={theme.colors.text.secondary} />
                    <Text style={styles.compactText}>{pkg.agency.name}</Text>
                    {pkg.agency.verified && (
                        <>
                            <Text style={styles.separator}>•</Text>
                            <Icon name="verified" size={12} color={theme.colors.primary} strokeWidth={2} />
                            <Text style={styles.compactText}>Agência verificada</Text>
                        </>
                    )}
                    <Text style={styles.separator}>•</Text>
                    {(() => {
                        const rd = getRouteRatingDisplay({ averageRating: pkg.rating, reviewCount: pkg.reviewCount });
                        const muted = rd.type === 'new';
                        return (
                            <>
                                <Icon name="star" size={13} color={muted ? theme.colors.text.tertiary : '#F59E0B'} strokeWidth={2} />
                                <Text style={styles.compactText}>{rd.label}</Text>
                                {rd.type === 'rating' && (
                                    <Text style={styles.compactTextSecondary}>({rd.reviewCount})</Text>
                                )}
                            </>
                        );
                    })()}
                </View>

                <Text style={styles.cardTitle} numberOfLines={2}>
                    {pkg.title}
                </Text>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 }}>
                    <Icon name="location" size={14} color={theme.colors.text.secondary} />
                    <Text style={styles.cardLocation}>
                        {pkg.destination}, {pkg.country} • {pkg.duration} dias
                    </Text>
                </View>

                {/* Strategic Inclusions */}
                <View style={styles.strategicInclusions}>
                    {pkg.inclusions?.flight && (
                        <View style={styles.strategicChip}>
                            <Icon name="plane" size={14} color={theme.colors.primary} />
                            <Text style={styles.chipLabel}>Voo ida e volta</Text>
                        </View>
                    )}
                    {pkg.inclusions?.hotel && (
                        <View style={styles.strategicChip}>
                            <Icon name="hotel" size={14} color={theme.colors.primary} />
                            <Text style={styles.chipLabel}>
                                Hotel {pkg.inclusions.hotel.stars}★
                            </Text>
                        </View>
                    )}
                    {pkg.inclusions?.hotel?.meals && pkg.inclusions.hotel.meals.length > 0 && (
                        <View style={styles.strategicChip}>
                            <Icon name="utensils" size={14} color={theme.colors.primary} />
                            <Text style={styles.chipLabel}>{pkg.inclusions.hotel.meals[0]}</Text>
                        </View>
                    )}
                    {pkg.inclusions?.tours && pkg.inclusions.tours.length > 0 && (
                        <View style={styles.strategicChip}>
                            <Icon name="compass" size={14} color={theme.colors.primary} />
                            <Text style={styles.chipLabel}>Passeios inclusos</Text>
                        </View>
                    )}
                    {pkg.inclusions?.extras && pkg.inclusions.extras.length > 0 && (
                        <View style={styles.strategicChip}>
                            <Icon name="star" size={14} color={theme.colors.primary} />
                            <Text style={styles.chipLabel}>Extras</Text>
                        </View>
                    )}
                </View>

                <View style={styles.cardFooter}>
                    <View style={styles.priceSection}>
                        <Text style={styles.priceLabel}>A partir de</Text>
                        <Text style={styles.priceValue}>
                            {typeof pkg.price.min === 'number' ? formatMoney(pkg.price.min) : pkg.price.min}
                        </Text>
                        <Text style={styles.priceLabel}>por pessoa</Text>
                        <Text style={styles.reviewCountFooter}>
                            ({pkg.reviewCount} avaliações)
                        </Text>
                        {pkg.recentPurchases && (
                            <Text style={styles.urgencyText}>
                                Reservado por {pkg.recentPurchases} pessoas este mês
                            </Text>
                        )}
                    </View>
                    <TouchableOpacity style={styles.ctaButton} onPress={onPress}>
                        <Text style={styles.ctaButtonText}>Ver pacote completo</Text>
                        <Text style={styles.ctaArrow}>→</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        marginHorizontal: 0,
        marginBottom: 24,
        ...theme.shadows.medium,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        overflow: 'hidden',
    },
    cardImageContainer: {
        height: 200,
        overflow: 'hidden',
    },
    cardBadges: {
        position: 'absolute',
        top: 12, left: 12,
        flexDirection: 'row',
    },
    verifiedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: 6,
        gap: 4,
    },
    verifiedText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#FFFFFF',
        textTransform: 'uppercase',
    },
    favoriteButton: {
        position: 'absolute',
        top: 12, right: 12,
        width: 36, height: 36,
        borderRadius: 18,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        ...theme.shadows.small,
    },
    photoCountBadge: {
        position: 'absolute',
        bottom: 12, right: 12,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    photoCountText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '600',
    },
    cardContent: {
        padding: 10,
    },
    // Compact Info Row Styles
    compactInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 8,
    },
    separator: {
        fontSize: 12,
        color: theme.colors.text.secondary,
        marginHorizontal: 2,
    },
    compactText: {
        fontSize: 13,
        fontWeight: '500',
        color: theme.colors.text.primary,
    },
    compactTextSecondary: {
        fontSize: 13,
        fontWeight: '400',
        color: theme.colors.text.secondary,
    },
    cardTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: 6,
        lineHeight: 22,
    },
    cardLocation: {
        fontSize: 14,
        color: theme.colors.text.secondary,
        marginBottom: 8,
    },
    // Strategic Inclusions Styles
    strategicInclusions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 8,
    },
    strategicChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surfaceLight,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: theme.borderRadius.sm,
        gap: 4,
    },
    chipLabel: {
        fontSize: 13,
        fontWeight: '500',
        color: theme.colors.text.primary,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginTop: 4,
    },
    priceSection: {
        flex: 1,
    },
    priceLabel: {
        fontSize: 11,
        color: theme.colors.text.secondary,
        marginBottom: 2,
    },
    priceValue: {
        fontSize: 26,
        fontWeight: '700',
        color: theme.colors.primary,
        marginBottom: 2,
    },
    reviewCountFooter: {
        fontSize: 12,
        color: theme.colors.text.secondary,
        marginTop: 2,
    },
    urgencyText: {
        fontSize: 12,
        color: theme.colors.text.secondary,
        marginTop: 4,
        opacity: 0.8,
    },
    ctaButton: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 24,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        ...theme.shadows.button,
    },
    ctaButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.colors.text.inverse,
    },
    ctaArrow: {
        fontSize: 16,
        color: theme.colors.text.inverse,
    },
});

