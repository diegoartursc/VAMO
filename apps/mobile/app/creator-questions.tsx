/**
 * Tela "Perguntas recebidas" — área do criador.
 *
 * Lista todas as perguntas feitas pelos viajantes nos roteiros do criador
 * autenticado. Permite responder inline (POST /api/questions/:id/answer).
 * Perguntas respondidas viram públicas em "Detalhes do Roteiro".
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
    ActivityIndicator, Platform, StatusBar, RefreshControl, LayoutAnimation, UIManager,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../src/theme/theme';
import { Icon } from '../src/components/common/Icons';
import { useAuth } from '../src/contexts/AuthContext';
import { notify } from '../src/utils/notify';
import { haptics } from '../src/services/haptics';
import {
    getCreatorQuestions, answerQuestion, type ItineraryQuestion,
} from '../src/services/api';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const MAX_ANSWER_LEN = 1000;

export default function CreatorQuestionsScreen() {
    const router = useRouter();
    const { accessToken, isAuthenticated, isLoading: authLoading } = useAuth();
    const [questions, setQuestions] = useState<ItineraryQuestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(async (isRefresh = false) => {
        if (!accessToken) { setQuestions([]); setLoading(false); return; }
        if (!isRefresh) setLoading(true);
        const { questions } = await getCreatorQuestions(accessToken);
        setQuestions(questions);
        setLoading(false);
        setRefreshing(false);
    }, [accessToken]);

    useEffect(() => {
        if (authLoading) return;
        if (!isAuthenticated) {
            router.replace({ pathname: '/login' as any, params: { next: '/creator-questions' } });
            return;
        }
        load();
    }, [authLoading, isAuthenticated, load, router]);

    const onRefresh = useCallback(() => { setRefreshing(true); load(true); }, [load]);

    const pending = questions.filter(q => q.status === 'pending');
    const answered = questions.filter(q => q.status === 'answered');

    if (authLoading || loading) {
        return (
            <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Icon name="chevron-left" size={24} color={theme.colors.text.primary} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>Perguntas recebidas</Text>
                    <Text style={styles.headerSubtitle}>
                        {questions.length} {questions.length === 1 ? 'pergunta' : 'perguntas'} • {pending.length} aguardando
                    </Text>
                </View>
                <View style={{ width: 40 }} />
            </View>

            {questions.length === 0 ? (
                <View style={styles.emptyState}>
                    <Ionicons name="chatbubbles-outline" size={48} color={theme.colors.text.tertiary} />
                    <Text style={styles.emptyTitle}>Nenhuma pergunta ainda</Text>
                    <Text style={styles.emptyText}>
                        Quando viajantes tiverem dúvidas sobre seus roteiros, as perguntas aparecerão aqui.
                    </Text>
                </View>
            ) : (
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={theme.colors.primary}
                        />
                    }
                >
                    {pending.length > 0 && (
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="time-outline" size={18} color="#F59E0B" />
                                <Text style={styles.sectionTitle}>Aguardando sua resposta ({pending.length})</Text>
                            </View>
                            {pending.map(q => (
                                <QuestionCard
                                    key={q.id}
                                    question={q}
                                    onAnswered={() => load()}
                                />
                            ))}
                        </View>
                    )}

                    {answered.length > 0 && (
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="checkmark-circle-outline" size={18} color={theme.colors.primary} />
                                <Text style={styles.sectionTitle}>Já respondidas ({answered.length})</Text>
                            </View>
                            {answered.map(q => (
                                <QuestionCard key={q.id} question={q} onAnswered={() => load()} />
                            ))}
                        </View>
                    )}

                    <View style={{ height: 40 }} />
                </ScrollView>
            )}
        </View>
    );
}

function QuestionCard({
    question, onAnswered,
}: {
    question: ItineraryQuestion;
    onAnswered: () => void;
}) {
    const { accessToken } = useAuth();
    const [draft, setDraft] = useState('');
    const [sending, setSending] = useState(false);
    const [expanded, setExpanded] = useState(question.status === 'pending');
    const isPending = question.status === 'pending';

    const toggle = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpanded(!expanded);
    };

    const handleSend = async () => {
        if (sending) return;
        const text = draft.trim();
        if (!text) { notify({ title: 'Resposta', message: 'Digite sua resposta antes de enviar.' }); return; }
        if (text.length > MAX_ANSWER_LEN) {
            notify({ title: 'Resposta', message: `Resposta deve ter no máximo ${MAX_ANSWER_LEN} caracteres.` });
            return;
        }
        setSending(true);
        haptics.light();
        try {
            await answerQuestion(question.id, text, accessToken);
            haptics.success?.();
            notify({ title: 'Resposta enviada!', message: 'Sua resposta agora é pública em "Detalhes do Roteiro".' });
            setDraft('');
            onAnswered();
        } catch (err: any) {
            haptics.error?.();
            notify({ title: 'Erro', message: err?.message || 'Não foi possível enviar sua resposta.' });
        } finally {
            setSending(false);
        }
    };

    return (
        <View style={[styles.card, isPending && styles.cardPending]}>
            <TouchableOpacity style={styles.cardItinerary} onPress={toggle} activeOpacity={0.7}>
                <View style={styles.cardItineraryInfo}>
                    <Text style={styles.cardItineraryTitle} numberOfLines={1}>
                        {question.itinerary?.title || 'Roteiro'}
                    </Text>
                    <Text style={styles.cardItineraryMeta}>
                        Perguntado por {question.user?.name || 'Viajante'} • {new Date(question.createdAt).toLocaleDateString('pt-BR')}
                    </Text>
                </View>
                <Ionicons
                    name={expanded ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={theme.colors.text.tertiary}
                />
            </TouchableOpacity>

            <View style={styles.questionBlock}>
                <View style={styles.questionHeader}>
                    <Ionicons name="chatbubble-outline" size={14} color={theme.colors.text.secondary} />
                    <Text style={styles.questionLabel}>Pergunta</Text>
                </View>
                <Text style={styles.questionText}>{question.question}</Text>
            </View>

            {expanded && (
                <>
                    {isPending ? (
                        <View style={styles.composer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Escreva sua resposta..."
                                placeholderTextColor={theme.colors.text.tertiary}
                                multiline
                                maxLength={MAX_ANSWER_LEN}
                                value={draft}
                                onChangeText={setDraft}
                                editable={!sending}
                            />
                            <View style={styles.composerFooter}>
                                <Text style={styles.charCount}>{MAX_ANSWER_LEN - draft.length} caracteres restantes</Text>
                                <TouchableOpacity
                                    style={[styles.sendBtn, (sending || !draft.trim()) && styles.sendBtnDisabled]}
                                    onPress={handleSend}
                                    disabled={sending}
                                    activeOpacity={0.85}
                                >
                                    {sending ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <Ionicons name="paper-plane" size={14} color="#fff" />
                                    )}
                                    <Text style={styles.sendBtnText}>{sending ? 'Enviando...' : 'Enviar resposta'}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <View style={styles.answerBlock}>
                            <View style={styles.answerHeader}>
                                <Ionicons name="person-circle-outline" size={14} color={theme.colors.primary} />
                                <Text style={styles.answerLabel}>Sua resposta</Text>
                                <Text style={styles.answerDate}>
                                    {question.answer?.createdAt
                                        ? new Date(question.answer.createdAt).toLocaleDateString('pt-BR')
                                        : ''}
                                </Text>
                            </View>
                            <Text style={styles.answerText}>{question.answer?.text}</Text>
                        </View>
                    )}
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
        paddingTop: Platform.OS === 'ios' ? 56 : (StatusBar.currentHeight ?? 24) + 8,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
    },
    backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
    headerCenter: { flex: 1, alignItems: 'center' },
    headerTitle: { fontSize: 17, fontWeight: '700', color: theme.colors.text.primary },
    headerSubtitle: { fontSize: 12, color: theme.colors.text.secondary, marginTop: 2 },
    scrollContent: { padding: 20 },
    emptyState: {
        flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 18, fontWeight: '700', color: theme.colors.text.primary, marginTop: 16,
    },
    emptyText: {
        fontSize: 14, color: theme.colors.text.secondary,
        marginTop: 8, textAlign: 'center', lineHeight: 20,
    },
    section: { marginBottom: 24 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: theme.colors.text.primary },
    card: {
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        marginBottom: 12,
        overflow: 'hidden',
    },
    cardPending: { borderColor: '#F59E0B40' },
    cardItinerary: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        gap: 10,
        backgroundColor: theme.colors.surfaceLight,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
    },
    cardItineraryInfo: { flex: 1 },
    cardItineraryTitle: { fontSize: 13, fontWeight: '700', color: theme.colors.text.primary },
    cardItineraryMeta: { fontSize: 11, color: theme.colors.text.secondary, marginTop: 2 },
    questionBlock: { padding: 14 },
    questionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
    questionLabel: {
        fontSize: 11, fontWeight: '700', color: theme.colors.text.secondary,
        textTransform: 'uppercase', letterSpacing: 0.5,
    },
    questionText: { fontSize: 14, color: theme.colors.text.primary, lineHeight: 21 },
    composer: { padding: 14, paddingTop: 0 },
    input: {
        backgroundColor: theme.colors.surfaceLight || '#F8F9FA',
        borderRadius: theme.borderRadius.md,
        padding: 12,
        fontSize: 14,
        color: theme.colors.text.primary,
        minHeight: 90,
        textAlignVertical: 'top',
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    composerFooter: {
        marginTop: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
    },
    charCount: { fontSize: 11, color: theme.colors.text.tertiary },
    sendBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: theme.borderRadius.md,
    },
    sendBtnDisabled: { opacity: 0.5 },
    sendBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
    answerBlock: {
        padding: 14,
        paddingTop: 0,
    },
    answerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 6,
        backgroundColor: theme.colors.primary + '10',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: theme.borderRadius.md,
    },
    answerLabel: {
        flex: 1,
        fontSize: 11, fontWeight: '700', color: theme.colors.primary,
        textTransform: 'uppercase', letterSpacing: 0.5,
    },
    answerDate: { fontSize: 11, color: theme.colors.text.tertiary },
    answerText: { fontSize: 14, color: theme.colors.text.secondary, lineHeight: 21, paddingHorizontal: 10 },
});
