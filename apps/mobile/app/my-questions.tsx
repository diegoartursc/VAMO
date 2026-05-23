import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Platform,
    StatusBar,
    LayoutAnimation,
    UIManager,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../src/theme/theme';
import { Icon } from '../src/components/common/Icons';
import { getUserQuestions, UserQuestion } from '../src/data/mockUserQuestions';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const TRAVELER_ID = 'trav-diego';

export default function MyQuestionsScreen() {
    const router = useRouter();
    const questions = getUserQuestions(TRAVELER_ID);

    const answered = questions.filter(q => q.answer !== null);
    const pending = questions.filter(q => q.answer === null);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Icon name="chevron-left" size={24} color={theme.colors.text.primary} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>Minhas Perguntas</Text>
                    <Text style={styles.headerSubtitle}>
                        {questions.length} pergunta{questions.length !== 1 ? 's' : ''} • {pending.length} aguardando
                    </Text>
                </View>
                <View style={{ width: 40 }} />
            </View>

            {questions.length === 0 ? (
                <View style={styles.emptyState}>
                    <Ionicons name="chatbubbles-outline" size={48} color={theme.colors.text.tertiary} />
                    <Text style={styles.emptyTitle}>Nenhuma pergunta ainda</Text>
                    <Text style={styles.emptyText}>
                        Suas perguntas feitas nos roteiros aparecerão aqui, junto com as respostas dos criadores.
                    </Text>
                </View>
            ) : (
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {/* Pending Section */}
                    {pending.length > 0 && (
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="time-outline" size={18} color="#F59E0B" />
                                <Text style={styles.sectionTitle}>Aguardando resposta ({pending.length})</Text>
                            </View>
                            {pending.map(q => (
                                <QuestionCard key={q.id} question={q} />
                            ))}
                        </View>
                    )}

                    {/* Answered Section */}
                    {answered.length > 0 && (
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="checkmark-circle-outline" size={18} color={theme.colors.primary} />
                                <Text style={styles.sectionTitle}>Respondidas ({answered.length})</Text>
                            </View>
                            {answered.map(q => (
                                <QuestionCard key={q.id} question={q} />
                            ))}
                        </View>
                    )}

                    <View style={{ height: 40 }} />
                </ScrollView>
            )}
        </View>
    );
}

function QuestionCard({ question }: { question: UserQuestion }) {
    const router = useRouter();
    const [expanded, setExpanded] = useState(question.answer !== null);
    const isPending = question.answer === null;

    const toggleExpand = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpanded(!expanded);
    };

    return (
        <View style={[styles.card, isPending && styles.cardPending]}>
            {/* Itinerary header */}
            <TouchableOpacity
                style={styles.cardItinerary}
                onPress={() => router.push(`/itinerary/${question.itineraryId}` as any)}
                activeOpacity={0.7}
            >
                <Image source={{ uri: question.itineraryImage }} style={styles.cardImage} resizeMode="cover" />
                <View style={styles.cardItineraryInfo}>
                    <Text style={styles.cardItineraryTitle} numberOfLines={1}>
                        {question.itineraryTitle}
                    </Text>
                    <Text style={styles.cardItineraryDest}>
                        📍 {question.itineraryDestination}, {question.itineraryCountry}
                    </Text>
                </View>
                <Icon name="chevron-right" size={16} color={theme.colors.text.tertiary} />
            </TouchableOpacity>

            {/* Question */}
            <TouchableOpacity
                style={styles.cardQuestion}
                onPress={toggleExpand}
                activeOpacity={0.7}
            >
                <View style={styles.questionHeader}>
                    <Ionicons
                        name="chatbubble-outline"
                        size={16}
                        color={isPending ? '#F59E0B' : theme.colors.primary}
                    />
                    <Text style={styles.questionLabel}>Sua pergunta</Text>
                    <Text style={styles.questionDate}>{question.questionDate}</Text>
                </View>
                <Text style={styles.questionText}>{question.question}</Text>

                {/* Status badge */}
                {isPending && (
                    <View style={styles.pendingBadge}>
                        <Ionicons name="time" size={12} color="#F59E0B" />
                        <Text style={styles.pendingText}>Aguardando resposta do criador</Text>
                    </View>
                )}
            </TouchableOpacity>

            {/* Answer */}
            {expanded && question.answer && (
                <View style={styles.answerSection}>
                    <View style={styles.answerHeader}>
                        <Ionicons name="person-circle-outline" size={16} color={theme.colors.primary} />
                        <Text style={styles.answerLabel}>
                            Resposta de {question.creatorName}
                        </Text>
                        <Text style={styles.answerDate}>{question.answerDate}</Text>
                    </View>
                    <Text style={styles.answerText}>{question.answer}</Text>
                </View>
            )}

            {/* Expand toggle for answered */}
            {question.answer && (
                <TouchableOpacity style={styles.expandToggle} onPress={toggleExpand}>
                    <Text style={styles.expandText}>
                        {expanded ? 'Ocultar resposta' : 'Ver resposta'}
                    </Text>
                    <Ionicons
                        name={expanded ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color={theme.colors.primary}
                    />
                </TouchableOpacity>
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
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: theme.colors.text.primary,
    },
    headerSubtitle: {
        fontSize: 12,
        color: theme.colors.text.secondary,
        marginTop: 2,
    },
    scrollContent: {
        padding: 20,
    },

    // Empty state
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginTop: 16,
    },
    emptyText: {
        fontSize: 14,
        color: theme.colors.text.secondary,
        marginTop: 8,
        textAlign: 'center',
        lineHeight: 20,
    },

    // Sections
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: theme.colors.text.primary,
    },

    // Card
    card: {
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        marginBottom: 12,
        overflow: 'hidden',
    },
    cardPending: {
        borderColor: '#F59E0B30',
    },

    // Card itinerary
    cardItinerary: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        gap: 10,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
        backgroundColor: theme.colors.surfaceLight,
    },
    cardImage: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: theme.colors.borderLight,
    },
    cardItineraryInfo: {
        flex: 1,
    },
    cardItineraryTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    cardItineraryDest: {
        fontSize: 11,
        color: theme.colors.text.secondary,
        marginTop: 1,
    },

    // Question
    cardQuestion: {
        padding: 14,
    },
    questionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    questionLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.text.secondary,
        flex: 1,
    },
    questionDate: {
        fontSize: 11,
        color: theme.colors.text.tertiary,
    },
    questionText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text.primary,
        lineHeight: 20,
    },

    // Pending badge
    pendingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 10,
        paddingHorizontal: 10,
        paddingVertical: 6,
        backgroundColor: '#FEF3C7',
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    pendingText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#92400E',
    },

    // Answer
    answerSection: {
        marginHorizontal: 14,
        marginBottom: 4,
        padding: 14,
        backgroundColor: theme.colors.primary + '08',
        borderLeftWidth: 3,
        borderLeftColor: theme.colors.primary,
        borderRadius: 8,
    },
    answerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    answerLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.primary,
        flex: 1,
    },
    answerDate: {
        fontSize: 11,
        color: theme.colors.text.tertiary,
    },
    answerText: {
        fontSize: 14,
        color: theme.colors.text.primary,
        lineHeight: 20,
    },

    // Expand toggle
    expandToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: theme.colors.borderLight,
    },
    expandText: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.primary,
    },
});
