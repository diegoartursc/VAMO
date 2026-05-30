/**
 * Seção "Perguntas sobre este roteiro" exibida em Detalhes do Roteiro.
 *
 * Antes era estática (mockFAQ.ts). Agora:
 *  - Lista perguntas reais do backend (respondidas públicas + pendentes do
 *    próprio usuário).
 *  - Permite ao usuário logado enviar nova pergunta (POST /api/questions).
 *  - Bloqueia o próprio criador de perguntar no seu roteiro.
 *  - Deslogado: mostra CTA "Entre para fazer uma pergunta" → /login.
 *  - Validações + estado de loading + feedback (notify cross-platform).
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, TextInput,
    LayoutAnimation, Platform, UIManager, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { theme } from '../theme/theme';
import { useAuth } from '../contexts/AuthContext';
import { notify } from '../utils/notify';
import {
    createItineraryQuestion,
    getItineraryQuestions,
    type ItineraryQuestion,
} from '../services/api';
import { haptics } from '../services/haptics';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const MIN_LEN = 5;
const MAX_LEN = 500;

/**
 * Dúvidas padrão fixas em TODOS os roteiros — perguntas sobre o produto
 * digital em si (recebimento, atualização) que se aplicam universalmente.
 * Aparecem sempre no topo, separadas das perguntas enviadas pelos viajantes.
 */
const DEFAULT_FAQ: ReadonlyArray<{ id: string; question: string; answer: string }> = [
    {
        id: '__default_recebimento',
        question: 'Como recebo o roteiro após a compra?',
        answer: 'Assim que o pagamento for confirmado, o roteiro fica disponível em "Meus Roteiros" no app, com acesso permanente. Download offline será liberado em uma próxima versão.',
    },
    {
        id: '__default_atualizacoes',
        question: 'O roteiro recebe atualizações?',
        answer: 'Sim. Os criadores VAMO mantêm os roteiros atualizados com preços, horários e dicas recentes. Você sempre terá acesso à versão mais recente em "Meus Roteiros".',
    },
];

interface FAQSectionProps {
    /** ID do roteiro — quando ausente, cai num modo "estático" passivo. */
    itineraryId?: string;
    /** Nome do criador exibido no subtítulo. */
    creatorName?: string;
    /** creatorId do roteiro, para bloquear self-question (compara com user.creatorId). */
    creatorId?: string;
}

export default function FAQSection({
    itineraryId,
    creatorName,
    creatorId,
}: FAQSectionProps) {
    const router = useRouter();
    const { user, accessToken, isAuthenticated } = useAuth();

    const [questions, setQuestions] = useState<ItineraryQuestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [draft, setDraft] = useState('');
    const [sending, setSending] = useState(false);

    const isOwnCreator = !!(creatorId && user?.creatorId === creatorId);
    const itineraryPath = itineraryId ? `/itinerary/${itineraryId}` : undefined;

    const loadQuestions = useCallback(async () => {
        if (!itineraryId) { setLoading(false); return; }
        setLoading(true);
        const { questions } = await getItineraryQuestions(itineraryId, accessToken);
        setQuestions(questions);
        setLoading(false);
    }, [itineraryId, accessToken]);

    useEffect(() => { loadQuestions(); }, [loadQuestions]);

    const toggleItem = (id: string) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedId(expandedId === id ? null : id);
    };

    const handleSend = async () => {
        if (sending || !itineraryId) return;
        const text = draft.trim();
        if (!text) {
            notify({ title: 'Pergunta', message: 'Digite sua pergunta antes de enviar.' });
            return;
        }
        if (text.length < MIN_LEN) {
            notify({ title: 'Pergunta', message: 'Escreva uma pergunta um pouco mais completa.' });
            return;
        }
        if (text.length > MAX_LEN) {
            notify({ title: 'Pergunta', message: `Pergunta deve ter no máximo ${MAX_LEN} caracteres.` });
            return;
        }
        if (!isAuthenticated || !accessToken) {
            // Deslogado: encaminha para login mantendo a intenção.
            router.push({
                pathname: '/login' as any,
                params: { next: itineraryPath },
            });
            return;
        }
        if (isOwnCreator) {
            notify({ title: 'Pergunta', message: 'Você é o criador deste roteiro.' });
            return;
        }

        setSending(true);
        haptics.light();
        try {
            await createItineraryQuestion(itineraryId, text, accessToken);
            haptics.success?.();
            setDraft('');
            notify({
                title: 'Pergunta enviada!',
                message: 'O criador será notificado e poderá responder em breve.',
            });
            await loadQuestions();
        } catch (err: any) {
            haptics.error?.();
            notify({
                title: 'Erro',
                message: err?.message || 'Não foi possível enviar sua pergunta agora. Tente novamente.',
            });
        } finally {
            setSending(false);
        }
    };

    // ─── render ─────────────────────────────────────────────────
    const remaining = MAX_LEN - draft.length;
    const canShowComposer = !!itineraryId && !isOwnCreator;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Ionicons name="help-circle" size={24} color={theme.colors.primary} />
                <Text style={styles.title}>Perguntas sobre este roteiro</Text>
            </View>
            <Text style={styles.subtitle}>
                {creatorName
                    ? `Tire dúvidas antes de comprar. ${creatorName} poderá responder sua pergunta.`
                    : 'Tire dúvidas antes de comprar. O criador poderá responder sua pergunta.'}
            </Text>

            {/* Dúvidas padrão (fixas em todos os roteiros) */}
            <View style={styles.defaultBlock}>
                <View style={styles.defaultHeader}>
                    <Ionicons name="information-circle" size={14} color={theme.colors.primary} />
                    <Text style={styles.defaultHeaderText}>Dúvidas frequentes sobre roteiros digitais</Text>
                </View>
                {DEFAULT_FAQ.map((item) => {
                    const isExpanded = expandedId === item.id;
                    return (
                        <TouchableOpacity
                            key={item.id}
                            style={[styles.item, styles.defaultItem, isExpanded && styles.itemExpanded]}
                            onPress={() => toggleItem(item.id)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.questionRow}>
                                <Text style={[styles.questionText, isExpanded && styles.questionTextExpanded]}>
                                    {item.question}
                                </Text>
                                <Ionicons
                                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                                    size={20}
                                    color={isExpanded ? theme.colors.primary : theme.colors.text.secondary}
                                />
                            </View>
                            {isExpanded && (
                                <View style={styles.answerBlock}>
                                    <Text style={styles.answerText}>{item.answer}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Lista de perguntas dos viajantes */}
            <View style={styles.list}>
                {loading ? (
                    <View style={styles.loadingBox}>
                        <ActivityIndicator color={theme.colors.primary} size="small" />
                    </View>
                ) : questions.length === 0 ? (
                    <View style={styles.emptyBox}>
                        <Text style={styles.emptyText}>Ainda não há perguntas de outros viajantes.</Text>
                        {canShowComposer && (
                            <Text style={styles.emptyHint}>Seja o primeiro a perguntar sobre este roteiro.</Text>
                        )}
                    </View>
                ) : (
                    questions.map((q) => {
                        const isExpanded = expandedId === q.id;
                        const isAnswered = q.status === 'answered' && q.answer;
                        return (
                            <TouchableOpacity
                                key={q.id}
                                style={[styles.item, isExpanded && styles.itemExpanded]}
                                onPress={() => toggleItem(q.id)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.questionRow}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.questionText, isExpanded && styles.questionTextExpanded]}>
                                            {q.question}
                                        </Text>
                                        {!isAnswered && (
                                            <View style={styles.pendingBadge}>
                                                <Ionicons name="time-outline" size={12} color={theme.colors.text.tertiary} />
                                                <Text style={styles.pendingText}>
                                                    {q.isMine
                                                        ? 'Sua pergunta — aguardando resposta do criador'
                                                        : 'Aguardando resposta'}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                    <Ionicons
                                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                                        size={20}
                                        color={isExpanded ? theme.colors.primary : theme.colors.text.secondary}
                                    />
                                </View>
                                {isExpanded && isAnswered && (
                                    <View style={styles.answerBlock}>
                                        <Text style={styles.answerLabel}>
                                            Resposta {creatorName ? `de ${creatorName}` : 'do criador'}
                                        </Text>
                                        <Text style={styles.answerText}>{q.answer!.text}</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })
                )}
            </View>

            {/* Composer */}
            {canShowComposer && (
                <View style={styles.composer}>
                    {isAuthenticated ? (
                        <>
                            <TextInput
                                style={styles.input}
                                placeholder="Digite sua dúvida sobre este roteiro..."
                                placeholderTextColor={theme.colors.text.tertiary}
                                multiline
                                maxLength={MAX_LEN}
                                value={draft}
                                onChangeText={setDraft}
                                editable={!sending}
                            />
                            <View style={styles.composerFooter}>
                                <Text style={styles.charCount}>{remaining} caracteres restantes</Text>
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
                                    <Text style={styles.sendBtnText}>
                                        {sending ? 'Enviando...' : 'Enviar pergunta'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    ) : (
                        <TouchableOpacity
                            style={styles.loginCta}
                            onPress={() => {
                                router.push({
                                    pathname: '/login' as any,
                                    params: itineraryId
                                        ? { next: itineraryPath }
                                        : undefined,
                                });
                            }}
                            activeOpacity={0.85}
                        >
                            <Ionicons name="log-in-outline" size={16} color={theme.colors.primary} />
                            <Text style={styles.loginCtaText}>Entre para fazer uma pergunta</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {isOwnCreator && (
                <View style={styles.ownerNotice}>
                    <Ionicons name="information-circle-outline" size={15} color={theme.colors.text.secondary} />
                    <Text style={styles.ownerNoticeText}>
                        Você é o criador deste roteiro. Responda perguntas em &quot;Perguntas recebidas&quot;.
                    </Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFFFF',
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.md,
        ...Platform.select({
            web: { boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
            default: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.06,
                shadowRadius: 3,
                elevation: 1,
            },
        }),
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 4,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.colors.text.primary,
    },
    subtitle: {
        fontSize: 13,
        color: theme.colors.text.secondary,
        marginLeft: 34,
        marginBottom: 8,
        lineHeight: 18,
    },
    list: { gap: 8, marginTop: 8 },
    defaultBlock: { gap: 6, marginTop: 12, marginBottom: 4 },
    defaultHeader: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 4, marginBottom: 6,
    },
    defaultHeaderText: {
        fontSize: 11, fontWeight: '700', color: theme.colors.primary,
        textTransform: 'uppercase', letterSpacing: 0.5,
    },
    defaultItem: {
        borderColor: theme.colors.primary + '20',
        borderWidth: 1,
        backgroundColor: theme.colors.primary + '06',
    },
    loadingBox: { paddingVertical: 24, alignItems: 'center' },
    emptyBox: { paddingVertical: 18, paddingHorizontal: 4, alignItems: 'center', gap: 4 },
    emptyText: { fontSize: 14, color: theme.colors.text.secondary, textAlign: 'center' },
    emptyHint: { fontSize: 13, color: theme.colors.text.tertiary, textAlign: 'center' },
    item: {
        backgroundColor: theme.colors.surfaceLight || '#F8F9FA',
        borderRadius: theme.borderRadius.md,
        padding: 14,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    itemExpanded: {
        backgroundColor: '#F0F7FF',
        borderColor: theme.colors.primary + '30',
    },
    questionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 12,
    },
    questionText: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.colors.text.primary,
        lineHeight: 21,
    },
    questionTextExpanded: { color: theme.colors.primary },
    pendingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
    },
    pendingText: {
        fontSize: 11,
        color: theme.colors.text.tertiary,
        fontStyle: 'italic',
    },
    answerBlock: {
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: theme.colors.primary + '20',
    },
    answerLabel: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        color: theme.colors.primary,
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    answerText: {
        fontSize: 14,
        color: theme.colors.text.secondary,
        lineHeight: 21,
    },
    composer: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: theme.colors.borderLight,
    },
    input: {
        backgroundColor: theme.colors.surfaceLight || '#F8F9FA',
        borderRadius: theme.borderRadius.md,
        padding: 12,
        fontSize: 14,
        color: theme.colors.text.primary,
        minHeight: 80,
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
    loginCta: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        backgroundColor: theme.colors.primary + '10',
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderColor: theme.colors.primary + '30',
    },
    loginCtaText: { fontSize: 14, fontWeight: '600', color: theme.colors.primary },
    ownerNotice: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 14,
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: theme.colors.borderLight,
    },
    ownerNoticeText: {
        flex: 1,
        fontSize: 12,
        color: theme.colors.text.secondary,
        fontStyle: 'italic',
    },
});
