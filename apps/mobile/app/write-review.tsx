import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Image,
    Platform,
    StatusBar,
    Animated,
    ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { safeBack } from '../src/utils/navigation';
import { theme } from '../src/theme/theme';
import { Icon } from '../src/components/common/Icons';
import { ErrorState } from '../src/components/common/ErrorState';
import { Ionicons } from '@expo/vector-icons';
import { haptics } from '../src/services/haptics';
import { getItineraryById, getReviews, submitItineraryReview, updateItineraryReview } from '../src/services/api';
import { useAuth } from '../src/contexts/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import { notify } from '../src/utils/notify';
import { uploadFile } from '../src/utils/uploadFile';
import { validateUploadFile } from '../src/utils/uploadContexts';
import { getCoverImages } from '../src/utils/itineraryMedia';

const STAR_LABELS = ['', 'Péssimo', 'Ruim', 'Bom', 'Muito bom', 'Excelente'];

export default function WriteReviewScreen() {
    const params = useLocalSearchParams<{ itineraryId: string }>();
    const itineraryId = Array.isArray(params.itineraryId) ? params.itineraryId[0] : params.itineraryId;
    const router = useRouter();
    const { user, accessToken, isAuthenticated, isLoading: authLoading } = useAuth();

    const [itinerary, setItinerary] = useState<any | null>(null);
    const [loadingItinerary, setLoadingItinerary] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [reloadKey, setReloadKey] = useState(0);
    const [existingReview, setExistingReview] = useState<any | null>(null);

    const [rating, setRating] = useState(0);
    const [text, setText] = useState('');
    const [photos, setPhotos] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const starScales = useRef([1, 2, 3, 4, 5].map(() => new Animated.Value(1))).current;

    // Gate de autenticação: sem usuário logado, sem avaliação.
    useEffect(() => {
        if (authLoading) return;
        if (!isAuthenticated) {
            router.replace({
                pathname: '/login' as any,
                params: { next: '/write-review', ...(itineraryId ? { itineraryId } : {}) },
            });
        }
    }, [authLoading, isAuthenticated, itineraryId, router]);

    // Carrega o roteiro real (backend) e a review já feita por este usuário, se houver.
    useEffect(() => {
        let mounted = true;
        const load = async () => {
            if (!itineraryId) {
                setLoadingItinerary(false);
                return;
            }
            setLoadingItinerary(true);
            setLoadError(null);
            try {
                const [itineraryData, reviewsResp] = await Promise.all([
                    getItineraryById(itineraryId),
                    getReviews({ itineraryId }),
                ]);
                if (!mounted) return;
                setItinerary(itineraryData);

                if (user?.travelerId) {
                    const mine = reviewsResp.reviews.find((r: any) => r.travelerId === user.travelerId);
                    if (mine) {
                        setExistingReview(mine);
                        setRating(Number(mine.rating) || 0);
                        setText(typeof mine.text === 'string' ? mine.text : ((mine as any).comment ?? ''));
                        setPhotos(Array.isArray(mine.photos) ? mine.photos : []);
                    }
                }
            } catch (err) {
                console.error('[write-review] erro carregando dados:', err);
                if (mounted) {
                    setLoadError(err instanceof Error
                        ? err.message
                        : 'Não foi possível carregar o roteiro para avaliação.');
                }
            } finally {
                if (mounted) setLoadingItinerary(false);
            }
        };
        load();
        return () => { mounted = false; };
    }, [itineraryId, user?.travelerId, reloadKey]);

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
            notify({ title: 'Limite', message: 'Você pode adicionar no máximo 5 fotos.' });
            return;
        }

        try {
            const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permission.granted) {
                notify({ title: 'Fotos', message: 'Permita o acesso às fotos para anexar imagens à avaliação.' });
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsMultipleSelection: true,
                selectionLimit: 5 - photos.length,
                quality: 0.8,
            });

            if (!result.canceled) {
                // Filtra assets que falham na validação do contexto
                // reviewMedia (só imagens, até 25 MB). Avisa quando algo
                // foi descartado, mas mantém os válidos.
                const accepted: string[] = [];
                const failures: string[] = [];
                result.assets.forEach((a, i) => {
                    const v = validateUploadFile(
                        {
                            uri: a.uri,
                            filename: (a as any).fileName,
                            mime: (a as any).mimeType,
                            size: (a as any).fileSize,
                        },
                        'reviewMedia',
                    );
                    if (v.valid && a.uri) accepted.push(a.uri);
                    else if (!v.valid) failures.push(`Foto ${i + 1}: ${v.reason}`);
                });
                if (failures.length) {
                    notify({ title: 'Algumas fotos não foram adicionadas', message: failures.join('\n'), variant: 'warning' });
                }
                if (accepted.length) {
                    setPhotos(prev => [...prev, ...accepted].slice(0, 5));
                }
            }
        } catch (err) {
            console.error('[write-review] erro selecionando fotos:', err);
            notify({ title: 'Fotos', message: 'Não foi possível selecionar as fotos. Tente novamente.', variant: 'error' });
        }
    };

    const removePhoto = (index: number) => {
        haptics.light();
        setPhotos(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (submitting) return;
        if (!isAuthenticated) {
            notify({ title: 'Login necessário', message: 'Faça login para enviar sua avaliação.', variant: 'warning', icon: 'log-in-outline' });
            return;
        }
        if (rating === 0) {
            notify({ title: 'Avaliação', message: 'Selecione uma nota para avaliar o roteiro.' });
            return;
        }
        if (!user?.travelerId || !itineraryId) {
            notify({ title: 'Sessão expirada', message: 'Faça login novamente para enviar sua avaliação.', variant: 'warning' });
            return;
        }

        setSubmitting(true);
        haptics.light();
        try {
            // Upload das fotos locais (uri 'file://' ou 'blob:') antes de
            // criar a review — o backend espera URLs públicas (string[]).
            // Fotos que já são URL pública (http/https) passam direto.
            const uploadedPhotos: string[] = [];
            for (let i = 0; i < photos.length; i++) {
                const p = photos[i];
                if (typeof p !== 'string' || !p) continue;
                if (/^https?:\/\//i.test(p)) {
                    uploadedPhotos.push(p);
                    continue;
                }
                try {
                    // Preserva a extensão real do arquivo (heic/heif/png/jpg...)
                    // — extrai do URI quando possível para o backend receber
                    // o MIME correto e renderizar o preview certo.
                    const cleaned = p.split('?')[0].split('#')[0];
                    const ext = cleaned.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase() || 'jpg';
                    const name = `review-${Date.now()}-${i}.${ext}`;
                    const url = await uploadFile(p, accessToken, name);
                    uploadedPhotos.push(url);
                } catch (uploadErr: any) {
                    console.error('[write-review] erro no upload de foto:', uploadErr);
                    throw new Error('Não foi possível enviar uma das fotos. Tente novamente.');
                }
            }

            const payload = {
                rating,
                comment: text.trim(),
                photos: uploadedPhotos,
            };
            let savedReview;
            if (existingReview?.id) {
                const resp = await updateItineraryReview(existingReview.id, payload, accessToken);
                savedReview = resp.review;
            } else {
                const resp = await submitItineraryReview({
                    itineraryId,
                    ...payload,
                }, accessToken);
                savedReview = resp.review;
            }
            setExistingReview(savedReview);
            setPhotos(savedReview.photos || uploadedPhotos);
            haptics.success?.();
            notify({
                variant: 'success',
                title: existingReview ? 'Avaliação atualizada com sucesso.' : 'Avaliação enviada com sucesso.',
                message: existingReview
                    ? 'Suas mudanças foram salvas.'
                    : 'Obrigado por compartilhar sua experiência. Sua avaliação ajuda outros viajantes.',
                onDismiss: () => router.replace({ pathname: '/purchased-itinerary/[id]', params: { id: itineraryId } } as any),
            });
        } catch (err: any) {
            haptics.error?.();
            const msg: string = err?.message || 'Não foi possível enviar sua avaliação.';
            // Tratamento amigável dos 3 erros mais comuns do backend.
            if (msg.includes('já avaliou')) {
                notify({
                    title: 'Avaliação',
                    message: 'Você já avaliou este roteiro.',
                    onDismiss: () => safeBack(router, '/(tabs)/my-trips'),
                });
            } else if (msg.includes('Apenas quem comprou')) {
                notify({ title: 'Avaliação indisponível', message: 'Apenas quem comprou este roteiro pode avaliá-lo.' });
            } else if (msg.includes('próprios roteiros') || msg.includes('Criadores')) {
                notify({ title: 'Avaliação indisponível', message: 'Criadores não podem avaliar seus próprios roteiros.' });
            } else {
                notify({ title: 'Erro', message: msg, variant: 'error' });
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (authLoading || loadingItinerary) {
        return (
            <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    if (loadError) {
        return (
            <View style={styles.container}>
                <ErrorState message={loadError} onRetry={() => setReloadKey((k) => k + 1)} />
            </View>
        );
    }

    if (!itinerary) {
        return (
            <View style={styles.container}>
                <View style={styles.errorState}>
                    <Text style={styles.errorText}>Roteiro não encontrado</Text>
                    <TouchableOpacity style={styles.errorBtn} onPress={() => safeBack(router, '/(tabs)/my-trips')}>
                        <Text style={styles.errorBtnText}>Voltar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const coverImage = getCoverImages(itinerary)[0];
    const creatorName = itinerary.creator?.name ?? 'Criador VAMO';

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => safeBack(router, '/(tabs)/my-trips')}>
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
                    {coverImage ? (
                        <Image source={{ uri: coverImage }} style={styles.itineraryImage} resizeMode="cover" />
                    ) : (
                        <View style={[styles.itineraryImage, styles.itineraryImageFallback]}>
                            <Icon name="map" size={24} color={theme.colors.text.tertiary} />
                        </View>
                    )}
                    <View style={styles.itineraryInfo}>
                        <Text style={styles.itineraryTitle} numberOfLines={2}>{itinerary.title}</Text>
                        <Text style={styles.itineraryDest}>
                            📍 {itinerary.destination}, {itinerary.country}
                        </Text>
                        <Text style={styles.itineraryCreator}>
                            por {creatorName}
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
                        {text.length}/1000
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
                                <Image source={{ uri }} style={styles.photoPreview} resizeMode="cover" />
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
                {rating > 0 && (
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
                                    <Text style={styles.previewAvatarText}>{(user?.name || 'V').charAt(0).toUpperCase()}</Text>
                                </View>
                                <View>
                                    <Text style={styles.previewName}>{user?.name || 'Viajante'}</Text>
                                    <Text style={styles.previewDate}>Hoje • Compra verificada</Text>
                                </View>
                            </View>
                            {text.trim() ? (
                                <Text style={styles.previewText} numberOfLines={3}>{text.trim()}</Text>
                            ) : null}
                            {photos.length > 0 && (
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.previewPhotos}>
                                    {photos.map((uri, i) => (
                                        <Image key={i} source={{ uri }} style={styles.previewPhoto} resizeMode="cover" />
                                    ))}
                                </ScrollView>
                            )}
                        </View>
                    </View>
                )}

                {/* Submit Button */}
                <TouchableOpacity
                    style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={submitting}
                    activeOpacity={0.8}
                >
                    {submitting ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Icon name="send" size={20} color="#fff" />
                    )}
                    <Text style={styles.submitButtonText}>
                        {submitting ? 'Enviando...' : existingReview ? 'Atualizar avaliação' : 'Enviar avaliação'}
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
    itineraryImageFallback: {
        alignItems: 'center',
        justifyContent: 'center',
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
