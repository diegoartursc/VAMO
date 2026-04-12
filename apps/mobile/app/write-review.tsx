import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Image,
    Alert,
    Platform,
    StatusBar,
    Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { theme } from '../src/theme/theme';
import { Icon } from '../src/components/common/Icons';
import { Ionicons } from '@expo/vector-icons';
import { haptics } from '../src/services/haptics';
import { addReview, getUserReviewForPackage } from '../src/data/mockReviews';
import { getItineraryById } from '../src/data/mockItineraries';
import * as ImagePicker from 'expo-image-picker';

const TRAVELER_ID = 'trav-diego';

const STAR_LABELS = ['', 'Péssimo', 'Ruim', 'Bom', 'Muito bom', 'Excelente'];

export default function WriteReviewScreen() {
    const { itineraryId } = useLocalSearchParams<{ itineraryId: string }>();
    const router = useRouter();
    const itinerary = getItineraryById(itineraryId);
    const existingReview = getUserReviewForPackage(TRAVELER_ID, `itinerary-${itineraryId}`);

    const [rating, setRating] = useState(existingReview?.rating || 0);
    const [text, setText] = useState(existingReview?.text || '');
    const [photos, setPhotos] = useState<string[]>(existingReview?.photos || []);
    const [submitting, setSubmitting] = useState(false);

    // Animated scales for star touch feedback
    const starScales = [1, 2, 3, 4, 5].map(() => new Animated.Value(1));

    const handleStarPress = (star: number) => {
        haptics.light();
        setRating(star);

        // Bounce animation
        Animated.sequence([
            Animated.timing(starScales[star - 1], {
                toValue: 1.4,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(starScales[star - 1], {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const handlePickPhoto = async () => {
        if (photos.length >= 5) {
            Alert.alert('Limite', 'Você pode adicionar no máximo 5 fotos.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsMultipleSelection: true,
            selectionLimit: 5 - photos.length,
            quality: 0.8,
        });

        if (!result.canceled) {
            const newPhotos = result.assets.map(a => a.uri);
            setPhotos(prev => [...prev, ...newPhotos].slice(0, 5));
        }
    };

    const removePhoto = (index: number) => {
        haptics.light();
        setPhotos(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = () => {
        if (rating === 0) {
            Alert.alert('Avaliação', 'Selecione uma nota de 1 a 5 estrelas.');
            return;
        }
        if (text.trim().length < 20) {
            Alert.alert('Avaliação', 'Escreva pelo menos 20 caracteres sobre sua experiência.');
            return;
        }

        setSubmitting(true);
        haptics.light();

        // Mock: add review to local data
        const today = new Date();
        const dateStr = today.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

        addReview({
            packageId: `itinerary-${itineraryId}`,
            userId: TRAVELER_ID,
            user: {
                name: 'Diego Artur',
                location: 'Brasil',
                avatar: '#0D9488',
                initial: 'D',
            },
            rating,
            date: dateStr,
            verified: true,
            text: text.trim(),
            photos: photos.length > 0 ? photos : undefined,
        });

        setTimeout(() => {
            setSubmitting(false);
            Alert.alert(
                '✅ Avaliação Publicada!',
                'Obrigado por compartilhar sua experiência. Sua avaliação ajuda outros viajantes.',
                [{ text: 'OK', onPress: () => router.back() }]
            );
        }, 600);
    };

    if (!itinerary) {
        return (
            <View style={styles.container}>
                <View style={styles.errorState}>
                    <Text style={styles.errorText}>Roteiro não encontrado</Text>
                    <TouchableOpacity style={styles.errorBtn} onPress={() => router.back()}>
                        <Text style={styles.errorBtnText}>Voltar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const canSubmit = rating > 0 && text.trim().length >= 20 && !submitting;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Icon name="chevron-left" size={24} color={theme.colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {existingReview ? 'Editar Avaliação' : 'Avaliar Roteiro'}
                </Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                {/* Itinerary Info Card */}
                <View style={styles.itineraryCard}>
                    <Image source={{ uri: itinerary.images[0] }} style={styles.itineraryImage} />
                    <View style={styles.itineraryInfo}>
                        <Text style={styles.itineraryTitle} numberOfLines={2}>{itinerary.title}</Text>
                        <Text style={styles.itineraryDest}>
                            📍 {itinerary.destination}, {itinerary.country}
                        </Text>
                        <Text style={styles.itineraryCreator}>
                            por {itinerary.creator.name}
                        </Text>
                    </View>
                </View>

                {/* Star Rating */}
                <View style={styles.ratingSection}>
                    <Text style={styles.sectionTitle}>Como foi sua experiência?</Text>
                    <View style={styles.starsRow}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <TouchableOpacity
                                key={star}
                                onPress={() => handleStarPress(star)}
                                activeOpacity={0.7}
                            >
                                <Animated.View style={{ transform: [{ scale: starScales[star - 1] }] }}>
                                    <Ionicons
                                        name={star <= rating ? 'star' : 'star-outline'}
                                        size={44}
                                        color={star <= rating ? '#FFD700' : theme.colors.borderLight}
                                    />
                                </Animated.View>
                            </TouchableOpacity>
                        ))}
                    </View>
                    {rating > 0 && (
                        <Text style={styles.ratingLabel}>{STAR_LABELS[rating]}</Text>
                    )}
                </View>

                {/* Text Review */}
                <View style={styles.textSection}>
                    <Text style={styles.sectionTitle}>Conte sobre sua experiência</Text>
                    <TextInput
                        style={styles.textInput}
                        multiline
                        numberOfLines={6}
                        placeholder="O que você achou do roteiro? As dicas foram úteis? O planejamento dia-a-dia ajudou? Compartilhe com outros viajantes..."
                        placeholderTextColor={theme.colors.text.tertiary}
                        value={text}
                        onChangeText={setText}
                        textAlignVertical="top"
                        maxLength={1000}
                    />
                    <Text style={styles.charCount}>
                        {text.length}/1000 {text.length < 20 && text.length > 0 && '(mín. 20 caracteres)'}
                    </Text>
                </View>

                {/* Photo Upload */}
                <View style={styles.photoSection}>
                    <Text style={styles.sectionTitle}>
                        Fotos da viagem <Text style={styles.optional}>(opcional)</Text>
                    </Text>
                    <Text style={styles.photoHint}>
                        Adicione até 5 fotos para ajudar outros viajantes
                    </Text>
                    <View style={styles.photoGrid}>
                        {photos.map((uri, index) => (
                            <View key={index} style={styles.photoWrapper}>
                                <Image source={{ uri }} style={styles.photoPreview} />
                                <TouchableOpacity
                                    style={styles.photoRemoveBtn}
                                    onPress={() => removePhoto(index)}
                                >
                                    <Icon name="x" size={14} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        ))}
                        {photos.length < 5 && (
                            <TouchableOpacity
                                style={styles.photoAddBtn}
                                onPress={handlePickPhoto}
                                activeOpacity={0.7}
                            >
                                <Icon name="camera" size={24} color={theme.colors.text.tertiary} />
                                <Text style={styles.photoAddText}>Adicionar</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Preview Card */}
                {rating > 0 && text.trim().length >= 20 && (
                    <View style={styles.previewSection}>
                        <Text style={styles.sectionTitle}>Preview da avaliação</Text>
                        <View style={styles.previewCard}>
                            <View style={styles.previewStars}>
                                {[1, 2, 3, 4, 5].map(s => (
                                    <Ionicons
                                        key={s}
                                        name={s <= rating ? 'star' : 'star-outline'}
                                        size={16}
                                        color={s <= rating ? '#FFD700' : theme.colors.borderLight}
                                    />
                                ))}
                            </View>
                            <View style={styles.previewHeader}>
                                <View style={[styles.previewAvatar, { backgroundColor: '#0D9488' }]}>
                                    <Text style={styles.previewAvatarText}>D</Text>
                                </View>
                                <View>
                                    <Text style={styles.previewName}>Diego Artur</Text>
                                    <Text style={styles.previewDate}>Hoje • Compra verificada</Text>
                                </View>
                            </View>
                            <Text style={styles.previewText} numberOfLines={3}>{text}</Text>
                            {photos.length > 0 && (
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.previewPhotos}>
                                    {photos.map((uri, i) => (
                                        <Image key={i} source={{ uri }} style={styles.previewPhoto} />
                                    ))}
                                </ScrollView>
                            )}
                        </View>
                    </View>
                )}

                {/* Submit Button */}
                <TouchableOpacity
                    style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={!canSubmit}
                    activeOpacity={0.8}
                >
                    <Icon name="send" size={20} color="#fff" />
                    <Text style={styles.submitButtonText}>
                        {submitting ? 'Publicando...' : existingReview ? 'Atualizar Avaliação' : 'Publicar Avaliação'}
                    </Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 56 : (StatusBar.currentHeight ?? 24) + 8,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.surfaceLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: theme.colors.text.primary,
    },
    scrollView: { flex: 1 },
    scrollContent: { padding: 20 },

    // Itinerary card
    itineraryCard: {
        flexDirection: 'row',
        backgroundColor: theme.colors.surface,
        borderRadius: 14,
        padding: 12,
        gap: 12,
        marginBottom: 28,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    itineraryImage: {
        width: 64,
        height: 64,
        borderRadius: 10,
        backgroundColor: theme.colors.surfaceLight,
    },
    itineraryInfo: { flex: 1, gap: 2 },
    itineraryTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.colors.text.primary,
        lineHeight: 19,
    },
    itineraryDest: {
        fontSize: 12,
        color: theme.colors.text.secondary,
    },
    itineraryCreator: {
        fontSize: 11,
        color: theme.colors.text.tertiary,
    },

    // Rating section
    ratingSection: {
        alignItems: 'center',
        marginBottom: 28,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: 16,
        alignSelf: 'flex-start',
    },
    starsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 8,
    },
    ratingLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.colors.primary,
        marginTop: 4,
    },

    // Text section
    textSection: {
        marginBottom: 28,
    },
    textInput: {
        backgroundColor: theme.colors.surface,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        padding: 16,
        fontSize: 15,
        color: theme.colors.text.primary,
        lineHeight: 22,
        minHeight: 140,
    },
    charCount: {
        fontSize: 12,
        color: theme.colors.text.tertiary,
        marginTop: 8,
        textAlign: 'right',
    },

    // Photo section
    photoSection: {
        marginBottom: 28,
    },
    optional: {
        fontSize: 13,
        fontWeight: '400',
        color: theme.colors.text.tertiary,
    },
    photoHint: {
        fontSize: 13,
        color: theme.colors.text.secondary,
        marginTop: -8,
        marginBottom: 12,
    },
    photoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    photoWrapper: {
        position: 'relative',
    },
    photoPreview: {
        width: 90,
        height: 90,
        borderRadius: 12,
        backgroundColor: theme.colors.surfaceLight,
    },
    photoRemoveBtn: {
        position: 'absolute',
        top: -6,
        right: -6,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: theme.colors.error || '#EF4444',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: theme.colors.background,
    },
    photoAddBtn: {
        width: 90,
        height: 90,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: theme.colors.borderLight,
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    photoAddText: {
        fontSize: 11,
        color: theme.colors.text.tertiary,
        fontWeight: '500',
    },

    // Preview
    previewSection: {
        marginBottom: 28,
    },
    previewCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    previewStars: {
        flexDirection: 'row',
        gap: 4,
        marginBottom: 12,
    },
    previewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 10,
    },
    previewAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    previewAvatarText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#fff',
    },
    previewName: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    previewDate: {
        fontSize: 12,
        color: theme.colors.text.secondary,
    },
    previewText: {
        fontSize: 14,
        color: theme.colors.text.primary,
        lineHeight: 20,
        marginBottom: 10,
    },
    previewPhotos: {
        marginTop: 4,
    },
    previewPhoto: {
        width: 64,
        height: 64,
        borderRadius: 8,
        marginRight: 8,
    },

    // Submit
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: theme.colors.primary,
        paddingVertical: 16,
        borderRadius: 100,
        ...theme.shadows.button,
    },
    submitButtonDisabled: {
        opacity: 0.5,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },

    // Error
    errorState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    errorText: {
        fontSize: 16,
        color: theme.colors.text.secondary,
        marginBottom: 16,
    },
    errorBtn: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    errorBtnText: {
        color: '#fff',
        fontWeight: '600',
    },
});
