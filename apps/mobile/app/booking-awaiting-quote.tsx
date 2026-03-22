import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../src/theme/theme';

export default function BookingAwaitingQuoteScreen() {
    const router = useRouter();
    const { packageId, bookingId, fullName, email, totalPrice, date, adults, children, originCity, checkedBags } = useLocalSearchParams();

    const pulse = React.useRef(new Animated.Value(0.4)).current;

    React.useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
                Animated.timing(pulse, { toValue: 0.4, duration: 1200, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Animated airplane icon */}
                <View style={styles.iconContainer}>
                    <View style={styles.iconCircle}>
                        <Ionicons name="airplane" size={48} color="#14b8a6" />
                    </View>
                </View>

                <Text style={styles.title}>Pedido enviado! ✈️</Text>
                <Text style={styles.subtitle}>
                    Estamos enviando seu roteiro para a agência garantir a melhor tarifa aérea saindo de{' '}
                    <Text style={{ fontWeight: '700', color: '#14b8a6' }}>{originCity as string}</Text>.
                </Text>

                {/* Timeline */}
                <View style={styles.timelineContainer}>
                    {/* Step 1 - Done */}
                    <View style={styles.timelineStep}>
                        <View style={[styles.timelineDot, styles.timelineDotDone]}>
                            <Ionicons name="checkmark" size={16} color="#fff" />
                        </View>
                        <View style={styles.timelineContent}>
                            <Text style={styles.timelineTitle}>Pedido recebido</Text>
                            <Text style={styles.timelineDesc}>Código: {bookingId as string}</Text>
                        </View>
                    </View>
                    <View style={styles.timelineLine} />

                    {/* Step 2 - In Progress */}
                    <View style={styles.timelineStep}>
                        <Animated.View style={[styles.timelineDot, styles.timelineDotActive, { opacity: pulse }]}>
                            <Ionicons name="search" size={16} color="#fff" />
                        </Animated.View>
                        <View style={styles.timelineContent}>
                            <Text style={styles.timelineTitle}>Agência cotando voo</Text>
                            <Text style={styles.timelineDesc}>
                                Buscando as melhores tarifas para {originCity as string}
                            </Text>
                        </View>
                    </View>
                    <View style={[styles.timelineLine, styles.timelineLinePending]} />

                    {/* Step 3 - Pending */}
                    <View style={styles.timelineStep}>
                        <View style={[styles.timelineDot, styles.timelineDotPending]}>
                            <Ionicons name="notifications-outline" size={16} color="#666" />
                        </View>
                        <View style={styles.timelineContent}>
                            <Text style={[styles.timelineTitle, { color: '#666' }]}>Proposta a caminho</Text>
                            <Text style={styles.timelineDesc}>
                                Você receberá uma notificação com o valor total
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Summary Card */}
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryTitle}>Resumo do pedido</Text>
                    <View style={styles.summaryRow}>
                        <Ionicons name="person" size={18} color="#14b8a6" />
                        <Text style={styles.summaryText}>{fullName as string}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Ionicons name="calendar" size={18} color="#14b8a6" />
                        <Text style={styles.summaryText}>
                            {new Date(date as string).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Ionicons name="people" size={18} color="#14b8a6" />
                        <Text style={styles.summaryText}>
                            {adults} Adulto{parseInt(adults as string) > 1 ? 's' : ''}
                            {parseInt(children as string) > 0 && `, ${children} Criança${parseInt(children as string) > 1 ? 's' : ''}`}
                        </Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Ionicons name="airplane" size={18} color="#14b8a6" />
                        <Text style={styles.summaryText}>Saindo de {originCity as string}</Text>
                    </View>
                    {checkedBags && checkedBags !== '0' ? (
                        <View style={styles.summaryRow}>
                            <Ionicons name="bag" size={18} color="#14b8a6" />
                            <Text style={styles.summaryText}>{checkedBags} bagagem(ns) despachada(s) de 23kg</Text>
                        </View>
                    ) : (
                        <View style={styles.summaryRow}>
                            <Ionicons name="bag" size={18} color="#14b8a6" />
                            <Text style={styles.summaryText}>Somente bagagem de mão (10kg)</Text>
                        </View>
                    )}
                    <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: '#3a3a3a', paddingTop: 12, marginTop: 4 }]}>
                        <Ionicons name="pricetag" size={18} color="#14b8a6" />
                        <Text style={[styles.summaryText, { fontWeight: '700' }]}>
                            Terrestre: R$ {parseFloat(totalPrice as string).toLocaleString('pt-BR')}
                        </Text>
                    </View>
                    <Text style={styles.summaryNote}>
                        O valor final incluirá a passagem aérea
                    </Text>
                </View>

                {/* CTA */}
                <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => router.push('/(tabs)/my-trips' as any)}
                >
                    <Text style={styles.primaryButtonText}>Ir para Minhas Viagens</Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => router.push('/(tabs)' as any)}
                >
                    <Text style={styles.secondaryButtonText}>Voltar ao início</Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    content: {
        paddingHorizontal: 24,
        paddingTop: 40,
    },
    iconContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(20, 184, 166, 0.12)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'rgba(20, 184, 166, 0.3)',
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: theme.colors.text.primary,
        textAlign: 'center',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 16,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
    },
    timelineContainer: {
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    timelineStep: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 14,
    },
    timelineDot: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    timelineDotDone: {
        backgroundColor: '#14b8a6',
    },
    timelineDotActive: {
        backgroundColor: '#14b8a6',
    },
    timelineDotPending: {
        backgroundColor: '#2a2a2a',
        borderWidth: 2,
        borderColor: '#444',
    },
    timelineContent: {
        flex: 1,
        paddingBottom: 4,
    },
    timelineTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: 4,
    },
    timelineDesc: {
        fontSize: 13,
        color: theme.colors.text.secondary,
        lineHeight: 18,
    },
    timelineLine: {
        width: 2,
        height: 20,
        backgroundColor: '#14b8a6',
        marginLeft: 15,
        marginVertical: 4,
    },
    timelineLinePending: {
        backgroundColor: '#444',
    },
    summaryCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    summaryTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: 16,
    },
    summaryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    summaryText: {
        fontSize: 14,
        color: theme.colors.text.secondary,
    },
    summaryNote: {
        fontSize: 12,
        color: theme.colors.text.tertiary,
        fontStyle: 'italic',
        marginTop: 4,
    },
    primaryButton: {
        backgroundColor: '#14b8a6',
        paddingVertical: 16,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 12,
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '700',
    },
    secondaryButton: {
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    secondaryButtonText: {
        color: theme.colors.text.secondary,
        fontSize: 15,
        fontWeight: '600',
    },
});
