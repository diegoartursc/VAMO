import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { theme } from '../../theme/theme';

const { width } = Dimensions.get('window');

interface DecisionAssistantProps {
    visible: boolean;
    onClose: () => void;
}

const QUESTIONS = [
    {
        id: 1,
        question: 'Qual é o seu estilo de viagem?',
        options: [
            { label: '🎒 Mochilão e aventura', value: 'aventura' },
            { label: '🏨 Conforto e tranquilidade', value: 'conforto' },
        ],
    },
    {
        id: 2,
        question: 'O que te move a viajar?',
        options: [
            { label: '🍝 Gastronomia e cultura', value: 'gastronomia' },
            { label: '📸 Paisagens e experiências', value: 'experiencias' },
        ],
    },
    {
        id: 3,
        question: 'Com quem você viaja?',
        options: [
            { label: '👫 Casal ou amigos', value: 'casal' },
            { label: '👨‍👩‍👧‍👦 Família com crianças', value: 'familia' },
        ],
    },
];

export default function DecisionAssistant({ visible, onClose }: DecisionAssistantProps) {
    const router = useRouter();
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<string[]>([]);

    const handleAnswer = (value: string) => {
        const newAnswers = [...answers, value];
        setAnswers(newAnswers);

        if (currentQuestion < QUESTIONS.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
        } else {
            onClose();
            setCurrentQuestion(0);
            setAnswers([]);

            // Always navigate to itineraries
            router.push(`/(tabs)/itineraries`);
        }
    };

    const handleClose = () => {
        setCurrentQuestion(0);
        setAnswers([]);
        onClose();
    };

    const progress = ((currentQuestion + 1) / QUESTIONS.length) * 100;

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
            <BlurView intensity={40} tint="dark" style={styles.overlay}>
                <View style={styles.container}>
                    {/* Close Button */}
                    <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                        <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
                    </TouchableOpacity>

                    {/* Progress Bar */}
                    <View style={styles.progressContainer}>
                        <View style={[styles.progressBar, { width: `${progress}%` }]} />
                    </View>

                    {/* Question */}
                    <View style={styles.content}>
                        <Text style={styles.step}>
                            Pergunta {currentQuestion + 1} de {QUESTIONS.length}
                        </Text>
                        <Text style={styles.question}>
                            {QUESTIONS[currentQuestion].question}
                        </Text>

                        {/* Options */}
                        <View style={styles.optionsContainer}>
                            {QUESTIONS[currentQuestion].options.map((option, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.optionButton}
                                    onPress={() => handleAnswer(option.value)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.optionText}>{option.label}</Text>
                                    <Ionicons name="arrow-forward" size={20} color={theme.colors.primary} />
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Footer hint */}
                    <Text style={styles.hint}>
                        Vamos encontrar o roteiro ideal para você
                    </Text>
                </View>
            </BlurView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    container: {
        width: width - 40,
        maxWidth: 400,
        backgroundColor: theme.colors.surface,
        borderRadius: 24,
        padding: 24,
        ...theme.shadows.large,
    },
    closeButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    progressContainer: {
        height: 4,
        backgroundColor: theme.colors.border,
        borderRadius: 2,
        marginBottom: 24,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: theme.colors.primary,
        borderRadius: 2,
    },
    content: {
        marginBottom: 16,
    },
    step: {
        fontSize: 12,
        color: theme.colors.text.tertiary,
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    question: {
        fontSize: 24,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: 24,
        lineHeight: 32,
    },
    optionsContainer: {
        gap: 12,
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: theme.colors.background,
        padding: 18,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    optionText: {
        fontSize: 16,
        fontWeight: '500',
        color: theme.colors.text.primary,
    },
    hint: {
        fontSize: 12,
        color: theme.colors.text.tertiary,
        textAlign: 'center',
    },
});
