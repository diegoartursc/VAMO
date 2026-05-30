import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, Modal, TouchableOpacity, TextInput,
    Animated, KeyboardAvoidingView, Platform, ActivityIndicator,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { submitItineraryReview } from '../../services/api';
import { haptics } from '../../services/haptics';
import { useAuth } from '../../contexts/AuthContext';

interface ReviewModalProps {
    visible: boolean;
    onClose: () => void;
    itineraryId: string;
    itineraryTitle: string;
    onSuccess: () => void;
}

export default function ReviewModal({
    visible,
    onClose,
    itineraryId,
    itineraryTitle,
    onSuccess,
}: ReviewModalProps) {
    const { accessToken, isAuthenticated } = useAuth();
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    // Slide-up animation
    const slideAnim = useRef(new Animated.Value(600)).current;

    useEffect(() => {
        if (visible) {
            setRating(0);
            setComment('');
            setSubmitted(false);
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                tension: 65,
                friction: 11,
            }).start();
        } else {
            Animated.timing(slideAnim, {
                toValue: 600,
                duration: 250,
                useNativeDriver: true,
            }).start();
        }
    }, [visible]);

    const handleClose = () => {
        Animated.timing(slideAnim, {
            toValue: 600,
            duration: 250,
            useNativeDriver: true,
        }).start(() => onClose());
    };

    const handleSubmit = async () => {
        if (loading) return;
        if (rating === 0) {
            const { Alert } = require('react-native');
            Alert.alert('Avaliação', 'Selecione uma nota para avaliar o roteiro.');
            return;
        }
        if (!isAuthenticated || !accessToken) {
            const { Alert } = require('react-native');
            Alert.alert('Login necessário', 'Faça login para enviar sua avaliação.');
            return;
        }
        haptics.light();
        setLoading(true);
        try {
            await submitItineraryReview({
                itineraryId,
                rating,
                comment: comment.trim() || 'Ótima experiência!',
                photos: [],
            }, accessToken);
            haptics.success();
            setSubmitted(true);
            setTimeout(() => {
                onSuccess();
                handleClose();
            }, 1800);
        } catch (err: any) {
            haptics.warning();
            const msg = err?.message?.includes('já avaliou')
                ? 'Você já avaliou este roteiro.'
                : 'Não foi possível enviar a avaliação. Tente novamente.';
            // Show inline error
            setComment(prev => prev); // force re-render
            setLoading(false);
            // Use alert as fallback
            const { Alert } = require('react-native');
            Alert.alert('Erro', msg);
        }
    };

    const STAR_LABELS = ['', 'Ruim', 'Regular', 'Bom', 'Muito bom', 'Excelente!'];

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={handleClose}
        >
            <View style={styles.backdrop}>
                <TouchableOpacity style={StyleSheet.absoluteFill} onPress={handleClose} />

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={styles.kavWrapper}
                >
                    <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>

                        {/* Handle */}
                        <View style={styles.handle} />

                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={styles.headerTitle}>Avaliar Roteiro</Text>
                            <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
                                <Ionicons name="close" size={22} color={theme.colors.text.secondary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.scrollContent}
                        >
                            {submitted ? (
                                /* ── Sucesso ── */
                                <View style={styles.successState}>
                                    <View style={styles.successCircle}>
                                        <Ionicons name="checkmark" size={40} color="#fff" />
                                    </View>
                                    <Text style={styles.successTitle}>Avaliação enviada!</Text>
                                    <Text style={styles.successText}>
                                        Obrigado por compartilhar sua experiência. Isso ajuda outros viajantes!
                                    </Text>
                                </View>
                            ) : (
                                <>
                                    {/* Título do roteiro */}
                                    <Text style={styles.itineraryTitle} numberOfLines={2}>
                                        {itineraryTitle}
                                    </Text>

                                    {/* Estrelas */}
                                    <View style={styles.starsSection}>
                                        <Text style={styles.starsLabel}>Sua nota</Text>
                                        <View style={styles.starsRow}>
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <TouchableOpacity
                                                    key={star}
                                                    onPress={() => { haptics.light(); setRating(star); }}
                                                    activeOpacity={0.7}
                                                    style={styles.starBtn}
                                                >
                                                    <Ionicons
                                                        name={star <= rating ? 'star' : 'star-outline'}
                                                        size={38}
                                                        color={star <= rating ? '#F59E0B' : theme.colors.border}
                                                    />
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                        {rating > 0 && (
                                            <Text style={styles.ratingLabel}>{STAR_LABELS[rating]}</Text>
                                        )}
                                    </View>

                                    {/* Campo de texto */}
                                    <View style={styles.commentSection}>
                                        <Text style={styles.commentLabel}>Sua experiência</Text>
                                        <TextInput
                                            style={styles.commentInput}
                                            multiline
                                            numberOfLines={4}
                                            placeholder="Conta como foi sua experiência com este roteiro..."
                                            placeholderTextColor={theme.colors.text.tertiary}
                                            value={comment}
                                            onChangeText={setComment}
                                            textAlignVertical="top"
                                            maxLength={500}
                                        />
                                        <Text style={styles.charCount}>{comment.length}/500</Text>
                                    </View>

                                    {/* Botão enviar */}
                                    <TouchableOpacity
                                        style={[
                                            styles.submitBtn,
                                            rating === 0 && styles.submitBtnDisabled,
                                        ]}
                                        onPress={handleSubmit}
                                        disabled={rating === 0 || loading}
                                        activeOpacity={0.8}
                                    >
                                        {loading ? (
                                            <ActivityIndicator color="#fff" />
                                        ) : (
                                            <Text style={styles.submitBtnText}>Enviar Avaliação</Text>
                                        )}
                                    </TouchableOpacity>
                                </>
                            )}
                        </ScrollView>
                    </Animated.View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    kavWrapper: {
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: theme.colors.background,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        maxHeight: '90%',
    },
    handle: {
        width: 40, height: 4, borderRadius: 2,
        backgroundColor: theme.colors.border,
        alignSelf: 'center',
        marginTop: 12, marginBottom: 4,
    },
    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 20, paddingVertical: 16,
        borderBottomWidth: 1, borderBottomColor: theme.colors.borderLight,
    },
    headerTitle: {
        flex: 1, fontSize: 17, fontWeight: '700',
        color: theme.colors.text.primary,
    },
    closeBtn: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: theme.colors.surfaceLight,
        alignItems: 'center', justifyContent: 'center',
    },
    scrollContent: {
        padding: 24,
    },

    // Sucesso
    successState: {
        alignItems: 'center', paddingVertical: 32,
    },
    successCircle: {
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: theme.colors.success,
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 20,
    },
    successTitle: {
        fontSize: 22, fontWeight: '800',
        color: theme.colors.text.primary, marginBottom: 8,
    },
    successText: {
        fontSize: 14, color: theme.colors.text.secondary,
        textAlign: 'center', lineHeight: 20,
    },

    // Conteúdo do formulário
    itineraryTitle: {
        fontSize: 15, fontWeight: '600',
        color: theme.colors.text.secondary,
        marginBottom: 24, lineHeight: 22,
    },

    // Estrelas
    starsSection: {
        alignItems: 'center', marginBottom: 28,
    },
    starsLabel: {
        fontSize: 13, fontWeight: '600',
        color: theme.colors.text.tertiary,
        textTransform: 'uppercase', letterSpacing: 0.5,
        marginBottom: 16,
    },
    starsRow: {
        flexDirection: 'row', gap: 8,
    },
    starBtn: {
        padding: 4,
    },
    ratingLabel: {
        marginTop: 12, fontSize: 16, fontWeight: '700',
        color: '#F59E0B',
    },

    // Comentário
    commentSection: {
        marginBottom: 28,
    },
    commentLabel: {
        fontSize: 13, fontWeight: '600',
        color: theme.colors.text.tertiary,
        textTransform: 'uppercase', letterSpacing: 0.5,
        marginBottom: 10,
    },
    commentInput: {
        backgroundColor: theme.colors.surfaceLight,
        borderRadius: 14, padding: 16,
        fontSize: 15, color: theme.colors.text.primary,
        borderWidth: 1, borderColor: theme.colors.border,
        minHeight: 120,
        lineHeight: 22,
    },
    charCount: {
        fontSize: 11, color: theme.colors.text.tertiary,
        textAlign: 'right', marginTop: 6,
    },

    // Botão
    submitBtn: {
        backgroundColor: theme.colors.primary,
        borderRadius: 14, paddingVertical: 16,
        alignItems: 'center', justifyContent: 'center',
    },
    submitBtnDisabled: {
        opacity: 0.4,
    },
    submitBtnText: {
        fontSize: 16, fontWeight: '700', color: '#fff',
    },
});
