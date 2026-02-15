import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Dimensions,
    Alert,
    StatusBar,
    Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../src/theme/theme';
import { getPurchasedItineraryById } from '../src/data/mockPurchasedItineraries';
import { haptics } from '../src/services/haptics';

const { width } = Dimensions.get('window');

export default function ItinerarySuccessScreen() {
    const { itineraryId } = useLocalSearchParams<{ itineraryId: string }>();
    const router = useRouter();
    const itinerary = getPurchasedItineraryById(itineraryId || '1');

    const handleAccessItinerary = () => {
        haptics.medium();
        router.replace(`/purchased-itinerary/${itineraryId || '1'}` as any);
    };

    const handleDownloadOffline = () => {
        haptics.light();
        Alert.alert(
            '📥 Download Offline',
            'Em breve você poderá baixar seu roteiro para acesso offline!',
            [{ text: 'OK' }]
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Hero Image */}
                <View style={styles.heroContainer}>
                    <Image
                        source={{
                            uri: itinerary?.images?.[0] ||
                                'https://images.unsplash.com/photo-1543349689-9a4d426bee8e?w=800',
                        }}
                        style={styles.heroImage}
                    />
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.7)']}
                        style={styles.heroGradient}
                    />
                </View>

                {/* Content */}
                <View style={styles.content}>
                    {/* Success Badge */}
                    <View style={styles.successBadge}>
                        <Text style={styles.successEmoji}>🎉</Text>
                    </View>

                    <Text style={styles.title}>Roteiro liberado!</Text>
                    <Text style={styles.subtitle}>{itinerary?.title || 'Seu roteiro'}</Text>
                    <Text style={styles.description}>
                        Você já pode acessar todas as informações agora.
                    </Text>

                    {/* Creator Card */}
                    {itinerary?.creator && (
                        <View style={styles.creatorCard}>
                            <Text style={styles.creatorAvatar}>{itinerary.creator.avatar}</Text>
                            <View style={styles.creatorInfo}>
                                <Text style={styles.creatorLabel}>Criado por</Text>
                                <Text style={styles.creatorName}>{itinerary.creator.name}</Text>
                            </View>
                            <View style={styles.ratingBadge}>
                                <Ionicons name="star" size={14} color="#FFC107" />
                                <Text style={styles.ratingText}>{itinerary.rating}</Text>
                            </View>
                        </View>
                    )}

                    {/* What's Included Preview */}
                    <View style={styles.previewCard}>
                        <Text style={styles.previewTitle}>O que você tem acesso:</Text>
                        <View style={styles.previewGrid}>
                            {[
                                { icon: '📋', label: 'Itinerário completo' },
                                { icon: '🗺️', label: 'Mapa interativo' },
                                { icon: '💰', label: 'Estimativa de gastos' },
                                { icon: '✅', label: 'Checklist' },
                            ].map((item, i) => (
                                <View key={i} style={styles.previewItem}>
                                    <Text style={styles.previewItemIcon}>{item.icon}</Text>
                                    <Text style={styles.previewItemLabel}>{item.label}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Primary Button */}
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={handleAccessItinerary}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="compass-outline" size={22} color="#fff" />
                        <Text style={styles.primaryButtonText}>Acessar roteiro</Text>
                    </TouchableOpacity>

                    {/* Secondary Button */}
                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={handleDownloadOffline}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="cloud-download-outline" size={20} color={theme.colors.primary} />
                        <Text style={styles.secondaryButtonText}>Baixar versão offline</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    scrollContent: {
        flexGrow: 1,
    },
    heroContainer: {
        width: '100%',
        height: 220,
        position: 'relative',
    },
    heroImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    heroGradient: {
        ...StyleSheet.absoluteFillObject,
    },
    content: {
        flex: 1,
        padding: 24,
        marginTop: -30,
        backgroundColor: theme.colors.background,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        alignItems: 'center',
    },
    successBadge: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#E8FFF5',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -12,
        marginBottom: 16,
        borderWidth: 3,
        borderColor: theme.colors.primary,
    },
    successEmoji: {
        fontSize: 36,
    },
    title: {
        fontSize: 26,
        fontWeight: '800',
        color: theme.colors.text.primary,
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 17,
        fontWeight: '600',
        color: theme.colors.primary,
        textAlign: 'center',
        marginBottom: 8,
    },
    description: {
        fontSize: 15,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    creatorCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        padding: 14,
        borderRadius: 14,
        width: '100%',
        marginBottom: 20,
        gap: 12,
    },
    creatorAvatar: {
        fontSize: 32,
    },
    creatorInfo: {
        flex: 1,
    },
    creatorLabel: {
        fontSize: 11,
        color: theme.colors.text.tertiary,
        textTransform: 'uppercase',
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    creatorName: {
        fontSize: 15,
        fontWeight: '700',
        color: theme.colors.text.primary,
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#FFF8E1',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
    },
    ratingText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#F59E0B',
    },
    previewCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        padding: 20,
        width: '100%',
        marginBottom: 28,
    },
    previewTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: 14,
    },
    previewGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    previewItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        width: '47%',
        paddingVertical: 6,
    },
    previewItemIcon: {
        fontSize: 18,
    },
    previewItemLabel: {
        fontSize: 13,
        color: theme.colors.text.secondary,
        fontWeight: '500',
    },
    primaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: theme.colors.primary,
        paddingVertical: 16,
        borderRadius: 14,
        width: '100%',
        marginBottom: 12,
    },
    primaryButtonText: {
        fontSize: 17,
        fontWeight: '700',
        color: '#fff',
    },
    secondaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: theme.colors.primaryLight + '20',
        paddingVertical: 14,
        borderRadius: 14,
        width: '100%',
        borderWidth: 1.5,
        borderColor: theme.colors.primary + '40',
    },
    secondaryButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.colors.primary,
    },
});
